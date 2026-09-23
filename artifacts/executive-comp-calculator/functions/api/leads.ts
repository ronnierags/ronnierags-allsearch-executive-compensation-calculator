import { CreateLeadBody, CreateLeadResponse, createCompensationPdf, json, base64, type Env } from "../_shared";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: unknown;
  try { body = await request.json(); } catch { return json({ error: "Invalid lead" }, 400); }
  const parsed = CreateLeadBody.safeParse(body);
  if (!parsed.success) return json({ error: "Invalid lead", details: parsed.error.flatten() }, 400);
  const lead = parsed.data;
  const createdAt = new Date().toISOString();
  try {
    const result = await env.DB.prepare(
      "INSERT INTO leads (name,email,company,role,consent,scenario,created_at,email_status) VALUES (?,?,?,?,?,?,?,?)",
    ).bind(lead.name, lead.email, lead.company, lead.role, 1, JSON.stringify(lead.scenario), createdAt, "failed").run();
    const id = Number(result.meta.last_row_id);
    const pdf = createCompensationPdf(lead);
    const fileName = `allsearch-compensation-plan-${id}.pdf`;
    let emailSent = false;
    if (env.RESEND_API_KEY && env.EMAIL_FROM && env.LEAD_NOTIFICATION_EMAIL) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: env.EMAIL_FROM, to: [lead.email], bcc: [env.LEAD_NOTIFICATION_EMAIL],
            subject: "Your AllSearch executive compensation plan",
            html: `<p>Hi ${lead.name.replace(/[<>&"]/g, "")},</p><p>Your compensation plan is attached.</p>`,
            attachments: [{ filename: fileName, content: base64(pdf) }],
          }),
        });
        emailSent = response.ok;
      } catch { emailSent = false; }
    }
    await env.DB.prepare("UPDATE leads SET email_status = ? WHERE id = ?").bind(emailSent ? "sent" : "failed", id).run();
    return json(CreateLeadResponse.parse({ id, pdfBase64: base64(pdf), fileName, emailSent }), 201);
  } catch { return json({ error: "Unable to create lead" }, 500); }
};