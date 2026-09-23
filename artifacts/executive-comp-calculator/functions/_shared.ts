import { CreateLeadBody, CreateLeadResponse, ListLeadsResponse } from "@workspace/api-zod";
import { createClerkClient, verifyToken } from "@clerk/backend";

export interface Env {
  DB: D1Database;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  LEAD_NOTIFICATION_EMAIL?: string;
  CLERK_SECRET_KEY?: string;
  ADMIN_EMAIL?: string;
}

function escapePdfText(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, "-").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
function money(value: unknown): string {
  return `$${Math.round(Number(value) || 0).toLocaleString("en-US")}`;
}
function textLine(text: string, x: number, y: number, size = 10, bold = false): string {
  return `BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`;
}

/** Kept byte-for-byte equivalent in its generated content to the Replit PDF implementation. */
export function createCompensationPdf(input: any): Uint8Array {
  const s = input.scenario, first = s.yearlyCompensation[0];
  const total = first?.totalComp ?? ((first?.base ?? 0) + (first?.incentive ?? 0) + (first?.equity ?? 0));
  const cumulative = s.yearlyCompensation.slice(0, s.yearsToModel).reduce((n: number, r: any) => n + r.totalComp, 0);
  const finalSalary = s.yearlyCompensation.at(-1)?.base ?? 0;
  const contingent = Math.max(finalSalary * s.severanceMonths / 12, finalSalary * s.changeInControlMultiple);
  const vehicles = s.companyType === "Public"
    ? [`Public equity: RSUs ${money(s.rsuAnnualGrant)} / ${s.rsuVestingYears}yr vest`, `PSUs ${money(s.psuAnnualTarget)} at ${s.psuExpectedPayout}% expected payout / ${s.psuVestingYears}yr vest`, `Options ${money(s.optionAnnualValue)} / ${s.optionVestingYears}yr vest`]
    : s.companyType === "Private"
      ? [`Private phantom equity: ${s.phantomPool}% pool / ${s.phantomVestingYears}yr vest / ${s.phantomCliffYears}yr cliff`, `Valuation method: ${s.valuationMethod === "manual" ? "Manual / appraised" : "EBITDA x multiple"}; baseline EV ${money(s.baselineEv)}`]
      : [`PE phantom equity: ${s.phantomPool}% pool / ${s.phantomVestingYears}yr vest / ${s.phantomCliffYears}yr cliff`, `PE ownership ${s.peOwnership}% | entry ${money(s.peEntryValue)} | exit ${money(s.peExitValue)} in year ${s.peExitYear}`, `Hurdle ${s.peHurdle}x; ratchet ${s.peRatchetOwnership}% above ${s.peRatchetHurdle}x`];
  const c: string[] = [
    "0.078 0.18 0.333 rg 0 690 612 102 re f", "0.765 0.639 0.298 rg 0 680 612 10 re f",
    textLine("ALLSEARCH EXECUTIVE", 48, 750, 12, true), textLine("EXECUTIVE COMPENSATION PLAN", 48, 720, 22, true),
    textLine("CONFIDENTIAL PLANNING SUMMARY", 390, 748, 8, true), textLine(`Prepared for ${input.name}`, 48, 650, 15, true),
    textLine(`${input.role} | ${input.company}`, 48, 630, 10), textLine(`${s.companyType} company | Model begins ${s.year}`, 48, 613, 9),
    textLine("PLAN OVERVIEW", 48, 574, 10, true), "0.9 0.91 0.92 RG 48 565 m 564 565 l S",
    textLine(`Year 1 total compensation: ${money(total)}`, 58, 537, 11, true), textLine(`${s.yearsToModel}-year modeled value: ${money(cumulative)}`, 310, 537, 11, true),
    textLine(`Starting base salary: ${money(s.baseSalary)}`, 58, 515, 9), textLine(`Target incentive: ${s.targetIncentivePercent}%`, 310, 515, 9),
    textLine(`Annual increase: ${s.annualIncreasePercent}%`, 58, 496, 9), textLine(`Maximum incentive multiple: ${s.maximumMultiple}x`, 310, 496, 9),
    textLine(`Year-1 pro-rata: ${s.yearOneProRataPercent}% | Equity grant: ${money(s.annualEquityGrant)} @ ${s.equityValueFactorPercent}%`, 58, 458, 8),
    textLine(`Guarantee: ${money(s.minimumAnnualCashGuarantee)} for ${s.guaranteeDurationMonths} months`, 310, 458, 8),
    textLine(`Contingent protections: ${money(contingent)} (not earned pay)`, 58, 442, 8), textLine(`Market reference: ${money(s.marketReference)}`, 58, 477, 9),
    textLine(`Candidate / role entered: ${s.candidateRole || "Not specified"}`, 310, 477, 9), textLine("YEAR-BY-YEAR COMPENSATION", 48, 378, 10, true),
    "0.9 0.91 0.92 RG 48 369 m 564 369 l S", textLine("Year", 55, 347, 8, true), textLine("Base", 126, 347, 8, true),
    textLine("Incentive", 230, 347, 8, true), textLine("Cash", 344, 347, 8, true), textLine("Equity", 450, 347, 8, true),
  ];
  vehicles.forEach((line, i) => c.push(textLine(line, 58, 420 - i * 12, 7)));
  s.yearlyCompensation.slice(0, 10).forEach((r: any, i: number) => {
    const y = 326 - i * 19;
    c.push(textLine(r.year, 55, y, 8), textLine(money(r.base), 126, y, 8), textLine(money(r.incentive), 230, y, 8), textLine(money(r.cash), 344, y, 8), textLine(money(r.equity), 450, y, 8), textLine(`Top-up ${money(r.guaranteeTopUp)} | Total ${money(r.totalComp)}`, 450, y - 10, 6));
  });
  const metricsY = Math.max(125, 310 - Math.min(10, s.yearlyCompensation.length) * 19);
  c.push(textLine("INCENTIVE SCORECARD", 48, metricsY, 10, true), `0.9 0.91 0.92 RG 48 ${metricsY - 9} m 564 ${metricsY - 9} l S`);
  s.metrics.slice(0, 6).forEach((m: any, i: number) => c.push(textLine(`${m.name}: ${m.weight}% weight / ${m.achievement}% achieved`, 58, metricsY - 30 - i * 16, 8)));
  c.push(textLine("Illustrative only. Review with the board, compensation committee, tax counsel, and legal advisors.", 48, 54, 7), textLine("Prepared by AllSearch Executive | allsearchinc.com", 48, 37, 7, true));
  const content = c.join("\n"), enc = new TextEncoder(), contentBytes = enc.encode(content);
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 6 0 R >> >> /Contents 5 0 R >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", `<< /Length ${contentBytes.byteLength} >>\nstream\n${content}\nendstream`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"];
  let pdf = "%PDF-1.4\n"; const offsets: number[] = [0];
  for (let i = 0; i < objects.length; i++) { offsets.push(enc.encode(pdf).byteLength); pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`; }
  const xref = enc.encode(pdf).byteLength;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` + offsets.slice(1).map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("") + `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return enc.encode(pdf);
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
export function base64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(binary);
}
export async function requireAdmin(request: Request, env: Env): Promise<Response | null> {
  if (!env.CLERK_SECRET_KEY || !env.ADMIN_EMAIL) return json({ error: "Authentication required" }, 401);
  const header = request.headers.get("Authorization") || "";
  if (!header.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);
  try {
    const origin = new URL(request.url).origin;
    const session = await verifyToken(header.slice(7), { secretKey: env.CLERK_SECRET_KEY, authorizedParties: [origin] });
    const user = await createClerkClient({ secretKey: env.CLERK_SECRET_KEY }).users.getUser(session.sub);
    if (!user.emailAddresses.some((e) => e.emailAddress.toLowerCase() === env.ADMIN_EMAIL!.toLowerCase())) return json({ error: "Administrator access required" }, 403);
    return null;
  } catch { return json({ error: "Authentication required" }, 401); }
}
export { CreateLeadBody, CreateLeadResponse, ListLeadsResponse };