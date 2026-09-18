import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";
import {
  GetSettingsResponse,
  UpdateSettingsBody,
  UpdateSettingsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getOrCreateSettings() {
  const [existing] = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.id, 1));

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(settingsTable)
    .values({ id: 1 })
    .onConflictDoNothing()
    .returning();

  if (created) {
    return created;
  }

  const [concurrent] = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.id, 1));
  return concurrent;
}

router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await getOrCreateSettings();
  res.json(GetSettingsResponse.parse(settings));
});

router.patch("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid settings update");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await getOrCreateSettings();
  const [settings] = await db
    .update(settingsTable)
    .set(parsed.data)
    .where(eq(settingsTable.id, 1))
    .returning();

  res.json(UpdateSettingsResponse.parse(settings));
});

export default router;