import { ListLeadsResponse, json, requireAdmin, type Env } from "../../_shared";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  try {
    const result = await env.DB.prepare("SELECT id,name,email,company,role,created_at,scenario FROM leads ORDER BY created_at").all();
    const rows = (result.results as any[]).map((row) => ({
      id: Number(row.id), name: row.name, email: row.email, company: row.company, role: row.role,
      createdAt: row.created_at, scenario: JSON.parse(row.scenario),
    }));
    return json(ListLeadsResponse.parse(rows));
  } catch { return json({ error: "Unable to load leads" }, 500); }
};