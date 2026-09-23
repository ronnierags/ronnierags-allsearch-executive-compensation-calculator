import { Router, type IRouter } from "express";
import { CreateLeadBody, CreateLeadResponse } from "@workspace/api-zod";
import { db, leadsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createCompensationPdf } from "../lib/pdf";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/leads", async (req, res) => {
  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    logger.warn(
      { validation: parsed.error.flatten() },
      "Lead request validation failed",
    );
    res.status(400).json({ error: "Invalid lead", details: parsed.error.flatten() });
    return;
  }
  const lead = parsed.data;
  const [saved] = await db.insert(leadsTable).values({
    name: lead.name,
    email: lead.email,
    company: lead.company,
    role: lead.role,
    consent: "true",
    scenario: lead.scenario,
  }).returning();
  const pdf = createCompensationPdf(lead);
  const fileName = `allsearch-compensation-plan-${saved.id}.pdf`;
  let emailSent = false;
  try {
    const from = process.env.EMAIL_FROM;
    const apiKey = process.env.RESEND_API_KEY;
    const notify = process.env.LEAD_NOTIFICATION_EMAIL;
    if (!from || !apiKey || !notify) throw new Error("Email configuration is incomplete");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [lead.email],
        bcc: [notify],
        subject: "Your AllSearch executive compensation plan",
        html: `<p>Hi ${lead.name.replace(/[<>&"]/g, "")},</p><p>Your compensation plan is attached.</p>`,
        attachments: [{ filename: fileName, content: pdf.toString("base64") }],
      }),
    });
    emailSent = response.ok;
    if (!response.ok) {
      const providerError = await response.text();
      logger.warn(
        { leadId: saved.id, status: response.status, providerError },
        "Lead email delivery failed",
      );
    }
  } catch (error) {
    logger.warn({ leadId: saved.id, err: error instanceof Error ? error.message : "unknown" }, "Lead email delivery failed");
  }
  await db.update(leadsTable).set({ emailStatus: emailSent ? "sent" : "failed" }).where(eq(leadsTable.id, saved.id));
  res.status(201).json(CreateLeadResponse.parse({ id: saved.id, pdfBase64: pdf.toString("base64"), fileName, emailSent }));
});

export default router;