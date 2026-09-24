import { Router, type IRouter } from "express";
import {
  ListDeliveryIssuesResponse,
  ResolveDeliveryIssueBody,
  ResolveDeliveryIssueResponse,
} from "@workspace/api-zod";
import {
  getShopifySession,
  ShopifyAuthenticationError,
  shopifyAdminRequest,
} from "../lib/shopify";

const router: IRouter = Router();

interface ShopifyAddress {
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  province: string | null;
  provinceCode: string | null;
  zip: string | null;
  country: string | null;
  countryCodeV2: string | null;
}

interface ShopifyOrder {
  id: string;
  name: string;
  email: string | null;
  createdAt: string;
  updatedAt: string;
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  shippingAddress: ShopifyAddress | null;
  lineItems: { nodes: Array<{ quantity: number }> };
  fulfillmentOrders: {
    nodes: Array<{
      status: string;
      fulfillAt: string | null;
      deliveryMethod: { methodType: string } | null;
    }>;
  };
}

interface OrdersQuery {
  shop: { name: string; myshopifyDomain: string };
  orders: { nodes: ShopifyOrder[] };
}

type IssueType =
  | "address_invalid"
  | "missing_apartment"
  | "carrier_rejected"
  | "zip_mismatch"
  | "po_box_unsupported";

function addDays(iso: string, days: number): string {
  const value = new Date(iso);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString();
}

function detectIssue(address: ShopifyAddress | null): {
  issueType: IssueType;
  severity: "critical" | "warning" | "review";
  reason: string;
} | null {
  if (!address || !address.address1) {
    return {
      issueType: "address_invalid",
      severity: "critical",
      reason: "This order does not have a complete shipping street address.",
    };
  }

  if (/\bP(?:OST)?\.?\s*O(?:FFICE)?\.?\s*BOX\b/i.test(address.address1)) {
    return {
      issueType: "po_box_unsupported",
      severity: "critical",
      reason:
        "This order uses a PO Box. Confirm the selected carrier supports it before fulfillment.",
    };
  }

  if (!address.city || !address.provinceCode || !address.countryCodeV2) {
    return {
      issueType: "address_invalid",
      severity: "critical",
      reason:
        "The shipping address is missing a city, state/province, or country.",
    };
  }

  if (!address.zip || address.zip.replace(/\s/g, "").length < 4) {
    return {
      issueType: "zip_mismatch",
      severity: "warning",
      reason: "The postal code is missing or appears incomplete.",
    };
  }

  return null;
}

router.get("/delivery-issues", async (req, res) => {
  try {
    const session = await getShopifySession(req);
    const data = await shopifyAdminRequest<OrdersQuery>(session, `
      query DeliveryFixOrders {
        shop { name myshopifyDomain }
        orders(
          first: 50
          query: "fulfillment_status:unfulfilled status:open"
          sortKey: CREATED_AT
          reverse: true
        ) {
          nodes {
            id
            name
            email
            createdAt
            updatedAt
            totalPriceSet { shopMoney { amount currencyCode } }
            shippingAddress {
              name firstName lastName address1 address2 city province
              provinceCode zip country countryCodeV2
            }
            lineItems(first: 50) { nodes { quantity } }
            fulfillmentOrders(first: 10) {
              nodes { status fulfillAt deliveryMethod { methodType } }
            }
          }
        }
      }
    `);

    const shopHandle = data.shop.myshopifyDomain.split(".")[0] ?? "";
    const issues = data.orders.nodes.flatMap((order) => {
      const detected = detectIssue(order.shippingAddress);
      if (!detected) return [];

      const address = order.shippingAddress;
      const fulfillment = order.fulfillmentOrders.nodes.find(
        (item) => item.status !== "CLOSED" && item.status !== "CANCELLED",
      );
      const numericOrderId = order.id.split("/").pop() ?? "";
      const currentAddress = {
        name:
          address?.name ||
          [address?.firstName, address?.lastName].filter(Boolean).join(" ") ||
          "Customer",
        line1: address?.address1 ?? "",
        line2: address?.address2 ?? "",
        city: address?.city ?? "",
        province: address?.provinceCode ?? address?.province ?? "",
        postalCode: address?.zip ?? "",
        country: address?.countryCodeV2 ?? address?.country ?? "",
      };

      return [
        {
          id: `shopify-${numericOrderId}`,
          shopifyOrderId: order.id,
          shopifyAdminUrl: `https://admin.shopify.com/store/${shopHandle}/orders/${numericOrderId}`,
          orderNumber: order.name,
          customerName: currentAddress.name,
          customerEmail: order.email ?? "No email on order",
          ...detected,
          status: "open" as const,
          createdAt: order.createdAt,
          shipBy: fulfillment?.fulfillAt ?? addDays(order.createdAt, 2),
          carrier: fulfillment?.deliveryMethod?.methodType ?? "Not assigned",
          itemCount: order.lineItems.nodes.reduce(
            (total, line) => total + line.quantity,
            0,
          ),
          orderValue: Number(order.totalPriceSet.shopMoney.amount),
          currencyCode: order.totalPriceSet.shopMoney.currencyCode,
          currentAddress,
          suggestedAddress: null,
          confidence: 0,
          timeline: [
            { date: order.createdAt, message: "Order placed in Shopify" },
            {
              date: order.updatedAt,
              message: "Delivery Fixes detected an address exception",
            },
          ],
        },
      ];
    });

    res.json(
      ListDeliveryIssuesResponse.parse({
        shopName: data.shop.name,
        shopDomain: data.shop.myshopifyDomain,
        syncedAt: new Date(),
        issues,
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Failed to load Shopify delivery issues");
    if (error instanceof ShopifyAuthenticationError) {
      if (error.retryWithFreshToken) {
        res.set("X-Shopify-Retry-Invalid-Session-Request", "1");
      }
      res.status(401).json({ error: error.message });
      return;
    }
    res.status(502).json({
      error:
        error instanceof Error
          ? error.message
          : "Unable to load Shopify orders",
    });
  }
});

interface OrderUpdateMutation {
  orderUpdate: {
    order: { id: string; updatedAt: string } | null;
    userErrors: Array<{ field: string[] | null; message: string }>;
  };
}

router.post("/delivery-issues/resolve", async (req, res) => {
  const parsed = ResolveDeliveryIssueBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "A complete corrected address is required" });
    return;
  }

  if (!/^gid:\/\/shopify\/Order\/\d+$/.test(parsed.data.shopifyOrderId)) {
    res.status(400).json({ error: "Invalid Shopify order ID" });
    return;
  }

  try {
    const session = await getShopifySession(req);
    const { address, shopifyOrderId } = parsed.data;
    const nameParts = address.name.trim().split(/\s+/);
    const firstName = nameParts.shift() ?? "";
    const lastName = nameParts.join(" ");
    const data = await shopifyAdminRequest<OrderUpdateMutation>(
      session,
      `
        mutation UpdateDeliveryAddress($input: OrderInput!) {
          orderUpdate(input: $input) {
            order { id updatedAt }
            userErrors { field message }
          }
        }
      `,
      {
        input: {
          id: shopifyOrderId,
          shippingAddress: {
            firstName,
            lastName,
            address1: address.line1,
            address2: address.line2 || null,
            city: address.city,
            provinceCode: address.province,
            zip: address.postalCode,
            countryCode: address.country,
          },
        },
      },
    );

    if (data.orderUpdate.userErrors.length || !data.orderUpdate.order) {
      res.status(400).json({
        error:
          data.orderUpdate.userErrors.map((item) => item.message).join("; ") ||
          "Shopify did not update the order",
      });
      return;
    }

    res.json(
      ResolveDeliveryIssueResponse.parse({
        shopifyOrderId: data.orderUpdate.order.id,
        updatedAt: data.orderUpdate.order.updatedAt,
        message: "Shipping address updated in Shopify",
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Failed to update Shopify order address");
    if (error instanceof ShopifyAuthenticationError) {
      if (error.retryWithFreshToken) {
        res.set("X-Shopify-Retry-Invalid-Session-Request", "1");
      }
      res.status(401).json({ error: error.message });
      return;
    }
    res.status(502).json({
      error:
        error instanceof Error
          ? error.message
          : "Unable to update the Shopify order",
    });
  }
});

export default router;