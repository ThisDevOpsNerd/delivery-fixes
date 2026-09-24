import { createHmac, timingSafeEqual } from "node:crypto";
import { Router, type IRouter } from "express";
import { db, shopifyInstallationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function verifyShopifyWebhook(
  rawBody: Buffer | undefined,
  signature: string | undefined,
): boolean {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret || !rawBody || !signature) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest();
  const received = Buffer.from(signature, "base64");
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

router.post("/shopify/webhooks", async (req, res) => {
  const rawBody = (req as typeof req & { rawBody?: Buffer }).rawBody;
  const signature = req.get("x-shopify-hmac-sha256");

  if (!verifyShopifyWebhook(rawBody, signature)) {
    res.status(401).json({ error: "Invalid Shopify webhook signature" });
    return;
  }

  const topic = req.get("x-shopify-topic")?.toLowerCase();
  const shopDomain = req.get("x-shopify-shop-domain")?.toLowerCase();

  if (
    shopDomain &&
    (topic === "app/uninstalled" || topic === "shop/redact")
  ) {
    await db
      .delete(shopifyInstallationsTable)
      .where(eq(shopifyInstallationsTable.shopDomain, shopDomain));
  }

  // Delivery Fixes stores shop-level installation credentials only. It does
  // not persist customer or order records, so customer data requests and
  // redactions require no additional data mutation.
  res.status(200).json({ received: true });
});

export default router;