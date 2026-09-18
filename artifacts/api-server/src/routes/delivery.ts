import { Router, type IRouter } from "express";
import { and, desc, eq, gte } from "drizzle-orm";
import { db, deliveryIssuesTable } from "@workspace/db";
import {
  CreateDeliveryIssueBody,
  CreateDeliveryIssueResponse,
  GetDeliverySummaryResponse,
  ListDeliveryIssuesQueryParams,
  ListDeliveryIssuesResponse,
  UpdateDeliveryIssueBody,
  UpdateDeliveryIssueParams,
  UpdateDeliveryIssueResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/delivery-issues", async (req, res): Promise<void> => {
  const parsed = ListDeliveryIssuesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid issue filters");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const status = parsed.data.status ?? "all";
  const issues =
    status === "all"
      ? await db
          .select()
          .from(deliveryIssuesTable)
          .orderBy(desc(deliveryIssuesTable.createdAt))
      : await db
          .select()
          .from(deliveryIssuesTable)
          .where(eq(deliveryIssuesTable.status, status))
          .orderBy(desc(deliveryIssuesTable.createdAt));

  res.json(ListDeliveryIssuesResponse.parse(issues));
});

router.post("/delivery-issues", async (req, res): Promise<void> => {
  const parsed = CreateDeliveryIssueBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid delivery issue");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [issue] = await db
    .insert(deliveryIssuesTable)
    .values({ ...parsed.data, status: "needs_attention" })
    .returning();

  res.status(201).json(CreateDeliveryIssueResponse.parse(issue));
});

router.get("/delivery-issues/summary", async (_req, res): Promise<void> => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [allIssues, resolvedToday] = await Promise.all([
    db.select().from(deliveryIssuesTable),
    db
      .select()
      .from(deliveryIssuesTable)
      .where(
        and(
          eq(deliveryIssuesTable.status, "resolved"),
          gte(deliveryIssuesTable.updatedAt, startOfToday),
        ),
      ),
  ]);

  const protectedValue = allIssues
    .filter((issue) => issue.status === "resolved")
    .reduce((sum, issue) => sum + issue.orderValue, 0);

  res.json(
    GetDeliverySummaryResponse.parse({
      total: allIssues.length,
      needsAttention: allIssues.filter(
        (issue) => issue.status === "needs_attention",
      ).length,
      resolvedToday: resolvedToday.length,
      protectedValue,
      averageResponseMinutes: allIssues.length > 0 ? 4 : 0,
    }),
  );
});

router.patch("/delivery-issues/:id", async (req, res): Promise<void> => {
  const params = UpdateDeliveryIssueParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateDeliveryIssueBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid issue update");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [issue] = await db
    .update(deliveryIssuesTable)
    .set(parsed.data)
    .where(eq(deliveryIssuesTable.id, params.data.id))
    .returning();

  if (!issue) {
    res.status(404).json({ error: "Delivery issue not found" });
    return;
  }

  res.json(UpdateDeliveryIssueResponse.parse(issue));
});

export default router;