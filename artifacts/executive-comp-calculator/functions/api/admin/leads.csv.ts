import { json, requireAdmin, type Env } from "../../_shared";

function csvCell(value: unknown): string {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  try {
    const result = await env.DB.prepare("SELECT id,name,email,company,role,created_at,scenario FROM leads ORDER BY created_at").all();
    const lines = [["id", "name", "email", "company", "role", "createdAt", "scenario"].join(",")];
    for (const row of result.results as any[]) lines.push([row.id, row.name, row.email, row.company, row.role, row.created_at, JSON.parse(row.scenario)].map(csvCell).join(","));
    return new Response(lines.join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="leads.csv"', "Cache-Control": "no-store" } });
  } catch { return json({ error: "Unable to export leads" }, 500); }
};