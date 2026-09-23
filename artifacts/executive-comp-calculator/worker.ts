import { onRequestGet as health } from "./functions/api/healthz";
import { onRequestPost as createLead } from "./functions/api/leads";
import { onRequestGet as listLeads } from "./functions/api/admin/leads";
import { onRequestGet as exportLeads } from "./functions/api/admin/leads.csv";
import { json, type Env } from "./functions/_shared";

interface WorkerEnv extends Env {
  ASSETS: Fetcher;
}

export default {
  fetch(request: Request, env: WorkerEnv): Response | Promise<Response> {
    const path = new URL(request.url).pathname;
    // These Pages handlers only use request and env; Worker requests supply both.
    const context = { request, env } as unknown as Parameters<typeof createLead>[0] & Parameters<typeof health>[0];

    if (path === "/api/healthz" && request.method === "GET") return health(context);
    if (path === "/api/leads" && request.method === "POST") return createLead(context);
    if (path === "/api/admin/leads" && request.method === "GET") return listLeads(context);
    if (path === "/api/admin/leads.csv" && request.method === "GET") return exportLeads(context);
    if (path.startsWith("/api/")) return json({ error: "Not found" }, 404);

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<WorkerEnv>;