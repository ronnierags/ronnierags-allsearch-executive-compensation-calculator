import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { db, leadsTable } from "@workspace/db";
import { ListLeadsResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const user = await clerkClient.users.getUser(userId);
    const addresses = user.emailAddresses.map((entry) => entry.emailAddress.toLowerCase());
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    if (!adminEmail || !addresses.includes(adminEmail)) {
      res.status(403).json({ error: "Administrator access required" });
      return;
    }
    next();
  } catch (error) {
    logger.warn({ err: error instanceof Error ? error.message : "unknown" }, "Admin authentication lookup failed");
    res.status(401).json({ error: "Authentication required" });
  }
}

function csvCell(value: unknown): string {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

router.get("/admin/leads", requireAdmin, async (_req, res) => {
  const rows = await db.select().from(leadsTable).orderBy(leadsTable.createdAt);
  res.json(ListLeadsResponse.parse(rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company,
    role: row.role,
    createdAt: row.createdAt,
    scenario: row.scenario,
  }))));
});

router.get("/admin/leads.csv", requireAdmin, async (_req, res) => {
  const rows = await db.select().from(leadsTable).orderBy(leadsTable.createdAt);
  const header = ["id", "name", "email", "company", "role", "createdAt", "scenario"];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push([
      row.id,
      row.name,
      row.email,
      row.company,
      row.role,
      row.createdAt.toISOString(),
      JSON.stringify(row.scenario),
    ].map(csvCell).join(","));
  }
  res.type("text/csv").set("Content-Disposition", 'attachment; filename="leads.csv"').send(lines.join("\n"));
});

export default router;