import type { ScenarioInput } from "@workspace/api-zod";

function escapePdfText(value: string): string {
  return value
    .replace(/[^\x20-\x7E]/g, "-")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function money(value: unknown): string {
  const amount = Number(value) || 0;
  return `$${Math.round(amount).toLocaleString("en-US")}`;
}

function textLine(text: string, x: number, y: number, size = 10, bold = false): string {
  return `BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`;
}

/** Creates a self-contained, branded compensation-plan PDF without external services. */
export function createCompensationPdf(input: {
  name: string;
  company: string;
  role: string;
  scenario: ScenarioInput;
}): Buffer {
  const scenario = input.scenario;
  const yearOne = scenario.yearlyCompensation[0];
  const totalYearOne = yearOne?.totalComp ?? ((yearOne?.base ?? 0) + (yearOne?.incentive ?? 0) + (yearOne?.equity ?? 0));
  const cumulative = scenario.yearlyCompensation
    .slice(0, scenario.yearsToModel)
    .reduce((sum, row) => sum + row.totalComp, 0);
  const finalSalary = scenario.yearlyCompensation.at(-1)?.base ?? 0;
  const contingent = Math.max(finalSalary * scenario.severanceMonths / 12, finalSalary * scenario.changeInControlMultiple);
  const vehicleLines = scenario.companyType === "Public"
    ? [
        `Public equity: RSUs ${money(scenario.rsuAnnualGrant)} / ${scenario.rsuVestingYears}yr vest`,
        `PSUs ${money(scenario.psuAnnualTarget)} at ${scenario.psuExpectedPayout}% expected payout / ${scenario.psuVestingYears}yr vest`,
        `Options ${money(scenario.optionAnnualValue)} / ${scenario.optionVestingYears}yr vest`,
      ]
    : scenario.companyType === "Private"
      ? [
          `Private phantom equity: ${scenario.phantomPool}% pool / ${scenario.phantomVestingYears}yr vest / ${scenario.phantomCliffYears}yr cliff`,
          `Valuation method: ${scenario.valuationMethod === "manual" ? "Manual / appraised" : "EBITDA x multiple"}; baseline EV ${money(scenario.baselineEv)}`,
        ]
      : [
          `PE phantom equity: ${scenario.phantomPool}% pool / ${scenario.phantomVestingYears}yr vest / ${scenario.phantomCliffYears}yr cliff`,
          `PE ownership ${scenario.peOwnership}% | entry ${money(scenario.peEntryValue)} | exit ${money(scenario.peExitValue)} in year ${scenario.peExitYear}`,
          `Hurdle ${scenario.peHurdle}x; ratchet ${scenario.peRatchetOwnership}% above ${scenario.peRatchetHurdle}x`,
        ];
  const commands: string[] = [
    "0.078 0.18 0.333 rg 0 690 612 102 re f",
    "0.765 0.639 0.298 rg 0 680 612 10 re f",
    textLine("ALLSEARCH EXECUTIVE", 48, 750, 12, true),
    textLine("EXECUTIVE COMPENSATION PLAN", 48, 720, 22, true),
    textLine("CONFIDENTIAL PLANNING SUMMARY", 390, 748, 8, true),
    textLine(`Prepared for ${input.name}`, 48, 650, 15, true),
    textLine(`${input.role} | ${input.company}`, 48, 630, 10),
    textLine(`${scenario.companyType} company | Model begins ${scenario.year}`, 48, 613, 9),
    textLine("PLAN OVERVIEW", 48, 574, 10, true),
    "0.9 0.91 0.92 RG 48 565 m 564 565 l S",
    textLine(`Year 1 total compensation: ${money(totalYearOne)}`, 58, 537, 11, true),
    textLine(`${scenario.yearsToModel}-year modeled value: ${money(cumulative)}`, 310, 537, 11, true),
    textLine(`Starting base salary: ${money(scenario.baseSalary)}`, 58, 515, 9),
    textLine(`Target incentive: ${scenario.targetIncentivePercent}%`, 310, 515, 9),
    textLine(`Annual increase: ${scenario.annualIncreasePercent}%`, 58, 496, 9),
    textLine(`Maximum incentive multiple: ${scenario.maximumMultiple}x`, 310, 496, 9),
    textLine(`Year-1 pro-rata: ${scenario.yearOneProRataPercent}% | Equity grant: ${money(scenario.annualEquityGrant)} @ ${scenario.equityValueFactorPercent}%`, 58, 458, 8),
    textLine(`Guarantee: ${money(scenario.minimumAnnualCashGuarantee)} for ${scenario.guaranteeDurationMonths} months`, 310, 458, 8),
    textLine(`Contingent protections: ${money(contingent)} (not earned pay)`, 58, 442, 8),
    textLine(`Market reference: ${money(scenario.marketReference)}`, 58, 477, 9),
    textLine(`Candidate / role entered: ${scenario.candidateRole || "Not specified"}`, 310, 477, 9),
    textLine("YEAR-BY-YEAR COMPENSATION", 48, 378, 10, true),
    "0.9 0.91 0.92 RG 48 369 m 564 369 l S",
    textLine("Year", 55, 347, 8, true),
    textLine("Base", 126, 347, 8, true),
    textLine("Incentive", 230, 347, 8, true),
    textLine("Cash", 344, 347, 8, true),
    textLine("Equity", 450, 347, 8, true),
  ];
  vehicleLines.forEach((line, index) => {
    commands.push(textLine(line, 58, 420 - index * 12, 7));
  });
  scenario.yearlyCompensation.slice(0, 10).forEach((row, index) => {
    const y = 326 - index * 19;
    commands.push(
      textLine(row.year, 55, y, 8),
      textLine(money(row.base), 126, y, 8),
      textLine(money(row.incentive), 230, y, 8),
      textLine(money(row.cash), 344, y, 8),
      textLine(money(row.equity), 450, y, 8),
      textLine(`Top-up ${money(row.guaranteeTopUp)} | Total ${money(row.totalComp)}`, 450, y - 10, 6),
    );
  });
  const metricsY = Math.max(125, 310 - Math.min(10, scenario.yearlyCompensation.length) * 19);
  commands.push(
    textLine("INCENTIVE SCORECARD", 48, metricsY, 10, true),
    "0.9 0.91 0.92 RG 48 " + (metricsY - 9) + " m 564 " + (metricsY - 9) + " l S",
  );
  scenario.metrics.slice(0, 6).forEach((metric, index) => {
     commands.push(textLine(`${metric.name}: ${metric.weight}% weight / ${metric.achievement}% achieved`, 58, metricsY - 30 - index * 16, 8));
  });
  commands.push(
    textLine("Illustrative only. Review with the board, compensation committee, tax counsel, and legal advisors.", 48, 54, 7),
    textLine("Prepared by AllSearch Executive | allsearchinc.com", 48, 37, 7, true),
  );
  const content = commands.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 6 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}