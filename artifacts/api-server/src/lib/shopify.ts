import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { Request } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { db, shopifyInstallationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const SHOPIFY_API_VERSION = "2025-10";
const connectors = new ReplitConnectors();

interface ShopifyGraphqlResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

interface ShopifyIdTokenClaims {
  aud: string;
  dest: string;
  exp: number;
  iss: string;
  nbf: number;
  sub: string;
}

interface TokenExchangeResponse {
  access_token: string;
  scope: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
}

export interface ShopifySession {
  accessToken?: string;
  mode: "embedded" | "development-connector";
  shopDomain?: string;
}

export class ShopifyAuthenticationError extends Error {
  readonly retryWithFreshToken: boolean;

  constructor(message: string, retryWithFreshToken = false) {
    super(message);
    this.name = "ShopifyAuthenticationError";
    this.retryWithFreshToken = retryWithFreshToken;
  }
}

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function decodeJsonSegment<T>(segment: string): T {
  return JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as T;
}

function validateIdToken(idToken: string): ShopifyIdTokenClaims {
  const parts = idToken.split(".");
  if (parts.length !== 3) {
    throw new ShopifyAuthenticationError("Invalid Shopify ID token", true);
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  let header: { alg?: string };
  let payload: ShopifyIdTokenClaims;
  try {
    header = decodeJsonSegment<{ alg?: string }>(encodedHeader);
    payload = decodeJsonSegment<ShopifyIdTokenClaims>(encodedPayload);
  } catch {
    throw new ShopifyAuthenticationError("Invalid Shopify ID token", true);
  }

  if (header.alg !== "HS256") {
    throw new ShopifyAuthenticationError("Unsupported Shopify token", true);
  }

  const expected = createHmac(
    "sha256",
    requiredEnvironment("SHOPIFY_API_SECRET"),
  )
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  const received = Buffer.from(encodedSignature, "base64url");

  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  ) {
    throw new ShopifyAuthenticationError("Invalid Shopify token signature", true);
  }

  const now = Math.floor(Date.now() / 1000);
  if (
    payload.aud !== requiredEnvironment("SHOPIFY_API_KEY") ||
    payload.exp <= now ||
    payload.nbf > now
  ) {
    throw new ShopifyAuthenticationError("Expired Shopify ID token", true);
  }

  let issuerHost: string;
  let destinationHost: string;
  try {
    issuerHost = new URL(payload.iss).hostname;
    destinationHost = new URL(payload.dest).hostname;
  } catch {
    throw new ShopifyAuthenticationError("Invalid Shopify token issuer", true);
  }

  if (
    issuerHost !== destinationHost ||
    !destinationHost.endsWith(".myshopify.com")
  ) {
    throw new ShopifyAuthenticationError("Invalid Shopify shop identity", true);
  }

  return payload;
}

function encryptionKey(): Buffer {
  return createHash("sha256")
    .update(requiredEnvironment("SESSION_SECRET"))
    .digest();
}

function encrypt(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((part) => part.toString("base64url")).join(".");
}

function decrypt(value: string): string {
  const [ivPart, tagPart, ciphertextPart] = value.split(".");
  if (!ivPart || !tagPart || !ciphertextPart) {
    throw new Error("Stored Shopify token is invalid");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivPart, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextPart, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function expiresAt(seconds?: number): Date | null {
  return seconds && seconds > 0
    ? new Date(Date.now() + seconds * 1000)
    : null;
}

async function exchangeIdToken(
  shopDomain: string,
  idToken: string,
): Promise<string> {
  const response = await fetch(
    `https://${shopDomain}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: requiredEnvironment("SHOPIFY_API_KEY"),
        client_secret: requiredEnvironment("SHOPIFY_API_SECRET"),
        grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
        subject_token: idToken,
        subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
        requested_token_type:
          "urn:shopify:params:oauth:token-type:offline-access-token",
        expiring: "1",
      }),
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (response.status === 400 || response.status === 401) {
    throw new ShopifyAuthenticationError(
      "Shopify could not authorize this session",
      true,
    );
  }

  if (!response.ok) {
    throw new Error(`Shopify token exchange failed (${response.status})`);
  }

  const token = (await response.json()) as TokenExchangeResponse;
  const now = new Date();
  await db
    .insert(shopifyInstallationsTable)
    .values({
      shopDomain,
      accessToken: encrypt(token.access_token),
      refreshToken: token.refresh_token
        ? encrypt(token.refresh_token)
        : null,
      scope: token.scope,
      accessTokenExpiresAt: expiresAt(token.expires_in),
      refreshTokenExpiresAt: expiresAt(token.refresh_token_expires_in),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: shopifyInstallationsTable.shopDomain,
      set: {
        accessToken: encrypt(token.access_token),
        refreshToken: token.refresh_token
          ? encrypt(token.refresh_token)
          : null,
        scope: token.scope,
        accessTokenExpiresAt: expiresAt(token.expires_in),
        refreshTokenExpiresAt: expiresAt(token.refresh_token_expires_in),
        updatedAt: now,
      },
    });

  return token.access_token;
}

export async function getShopifySession(
  req: Request,
): Promise<ShopifySession> {
  const authorization = req.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    if (process.env.NODE_ENV !== "production") {
      return { mode: "development-connector" };
    }
    throw new ShopifyAuthenticationError("Open Delivery Fixes from Shopify Admin");
  }

  const idToken = authorization.slice("Bearer ".length);
  const claims = validateIdToken(idToken);
  const shopDomain = new URL(claims.dest).hostname;
  const [stored] = await db
    .select()
    .from(shopifyInstallationsTable)
    .where(eq(shopifyInstallationsTable.shopDomain, shopDomain))
    .limit(1);

  const reusable =
    stored &&
    (!stored.accessTokenExpiresAt ||
      stored.accessTokenExpiresAt.getTime() > Date.now() + 60_000);

  return {
    mode: "embedded",
    shopDomain,
    accessToken: reusable
      ? decrypt(stored.accessToken)
      : await exchangeIdToken(shopDomain, idToken),
  };
}

export async function shopifyAdminRequest<T>(
  session: ShopifySession,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  let response: Response;

  if (session.mode === "development-connector") {
    response = await connectors.proxy(
      "shopify-store",
      `/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
      },
    );
  } else {
    response = await fetch(
      `https://${session.shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": session.accessToken ?? "",
        },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(15_000),
      },
    );
  }

  const raw = await response.text();
  let payload: ShopifyGraphqlResponse<T>;

  try {
    payload = JSON.parse(raw) as ShopifyGraphqlResponse<T>;
  } catch {
    throw new Error(`Shopify returned an unreadable response (${response.status})`);
  }

  if (!response.ok || payload.errors?.length) {
    const message =
      payload.errors?.map((error) => error.message).join("; ") ||
      `Shopify request failed (${response.status})`;
    throw new Error(message);
  }

  if (!payload.data) {
    throw new Error("Shopify returned no data");
  }

  return payload.data;
}