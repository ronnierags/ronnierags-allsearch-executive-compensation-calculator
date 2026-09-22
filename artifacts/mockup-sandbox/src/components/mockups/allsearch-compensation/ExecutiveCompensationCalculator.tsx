import { useMemo, useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  RotateCcw,
  Trash2,
  Info,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Metric = { name: string; weight: number };
type SectionKey = "base" | "incentive" | "equity" | "floor" | "severance";

const seedMetrics: Metric[] = [
  { name: "EBITDA / gross-profit growth", weight: 35 },
  { name: "Cash conversion", weight: 20 },
  { name: "Safety", weight: 15 },
  { name: "Backlog quality", weight: 15 },
  { name: "Strategic milestones", weight: 15 },
];

const navy = "#142e55";
const gold = "#c3a34c";

function money(value: number) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function Section({
  title,
  tint,
  open,
  onToggle,
  children,
}: {
  title: string;
  tint: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-[#e5e9ef]">
      <button onClick={onToggle} className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-[#fafbf9]">
        <span className="flex items-center gap-2 text-[11px] font-semibold text-[#20324b]">
          <span className="h-3 w-3 rounded-[2px]" style={{ background: tint }} />
          {title}
        </span>
        {open ? <ChevronDown size={13} className="text-[#6d7784]" /> : <ChevronRight size={13} className="text-[#6d7784]" />}
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </section>
  );
}

function Field({ label, value, onChange, suffix, step = "1" }: { label: string; value: string; onChange: (v: string) => void; suffix?: string; step?: string }) {
  return (
    <label className="flex items-center justify-between gap-2 py-[3px] text-[10px] text-[#526072]">
      <span>{label}</span>
      <span className="relative shrink-0">
        <input type="number" step={step} value={value} onChange={(e) => onChange(e.target.value)} className="h-7 w-[64px] rounded border border-[#e0e4e8] bg-[#fffefb] px-2 text-right text-[11px] text-[#1c2d45] outline-none focus:border-[#c3a34c]" />
        {suffix && <span className="pointer-events-none absolute right-1 top-[7px] text-[9px] text-[#8b949e]">{suffix}</span>}
      </span>
    </label>
  );
}

function Stat({ label, value, goldEdge = false }: { label: string; value: string; goldEdge?: boolean }) {
  return (
    <div className={`min-h-[57px] rounded-md border border-[#e2e6eb] bg-[#fffefb] px-3 py-2 ${goldEdge ? "border-l-2 border-l-[#c3a34c]" : ""}`}>
      <div className="text-[9px] font-medium uppercase tracking-[.08em] text-[#8290a0]">{label}</div>
      <div className="mt-1 text-[15px] font-semibold text-[#1a3153]">{value}</div>
    </div>
  );
}

export function ExecutiveCompensationCalculator() {
  const [company, setCompany] = useState("Private");
  const [candidate, setCandidate] = useState("");
  const [year, setYear] = useState("2026");
  const [years, setYears] = useState("7");
  const [reference, setReference] = useState("0");
  const [base, setBase] = useState("0");
  const [increase, setIncrease] = useState("3");
  const [target, setTarget] = useState("60");
  const [maximum, setMaximum] = useState("1.5");
  const [metrics, setMetrics] = useState(seedMetrics);
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({ base: true, incentive: true, equity: false, floor: false, severance: false });

  const baseNumber = Number(base) || 0;
  const targetNumber = Number(target) || 0;
  const yearsNumber = Math.max(1, Number(years) || 1);
  const annualIncentive = baseNumber * (targetNumber / 100);
  const totalYear = baseNumber + annualIncentive;
  const cumulative = totalYear * yearsNumber;
  const chartData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const salary = baseNumber * Math.pow(1 + (Number(increase) || 0) / 100, i);
    const incentive = salary * targetNumber / 100;
    return { year: String(Number(year) + i), base: Math.round(salary), cash: Math.round(salary + incentive), incentive: Math.round(incentive), equity: Math.round(salary * .32 * i) };
  }), [baseNumber, increase, targetNumber, year]);

  const toggle = (key: SectionKey) => setOpen((s) => ({ ...s, [key]: !s[key] }));
  const reset = () => {
    setCompany("Private"); setCandidate(""); setYear("2026"); setYears("7"); setReference("0");
    setBase("0"); setIncrease("3"); setTarget("60"); setMaximum("1.5"); setMetrics(seedMetrics);
  };

  return (
    <div className="min-h-screen bg-[#f6f6f3] text-[#26364b]" style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }}>
      <header className="border-b border-[#d7dce3] bg-[#fffefb]">
        <div className="flex h-7 items-center justify-between border-b border-[#eceeea] px-4 text-[9px] text-[#6e7884]">
          <span>AllSearch Executive Compensation Calculator <span className="ml-2 text-[#a6aeb7]">⌄</span></span>
          <span>Content is user-generated and unverified.</span>
          <span className="flex gap-3 text-[#586574]">Share&nbsp;&nbsp; Sign in</span>
        </div>
        <div className="flex h-[53px] items-center justify-between px-7">
          <img
            src="/__mockup/images/allsearch-executive-logo.png"
            alt="AllSearch Executive"
            className="h-11 w-auto object-contain"
          />
          <div className="text-right">
            <div className="text-[11px] font-bold text-[#132c4f]">Executive Compensation Calculator</div>
            <div className="text-[8px] text-[#85909d]">AllSearch Executive • Public • Private • PE-backed</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1040px] px-3 pb-16 pt-3">
        <div className="grid gap-3 rounded-lg bg-[#142e55] p-3 shadow-[0_2px_9px_rgba(20,46,85,.13)] md:grid-cols-[1.25fr_1fr_1fr_1fr_1.2fr_auto] md:items-end">
          <div>
            <div className="mb-1 text-[8px] uppercase tracking-[.1em] text-[#9db0c6]">Company type</div>
            <div className="flex overflow-hidden rounded bg-[#0d2342] p-0.5">
              {["Public", "Private", "PE-backed"].map((item) => <button key={item} onClick={() => setCompany(item)} className={`flex-1 rounded px-2 py-2 text-[9px] ${company === item ? "bg-[#c3a34c] font-semibold text-[#172c4a]" : "text-[#d4dfeb]"}`}>{item}</button>)}
            </div>
          </div>
          <label className="text-[8px] uppercase tracking-[.1em] text-[#9db0c6]">Candidate / role<input value={candidate} onChange={(e) => setCandidate(e.target.value)} placeholder="Name / title" className="mt-1 h-7 w-full rounded border-0 px-2 text-[10px] text-[#243650] outline-none" /></label>
          <label className="text-[8px] uppercase tracking-[.1em] text-[#9db0c6]">Year 1<input value={year} onChange={(e) => setYear(e.target.value)} className="mt-1 h-7 w-full rounded border-0 px-2 text-[10px] text-[#243650] outline-none" /></label>
          <label className="text-[8px] uppercase tracking-[.1em] text-[#9db0c6]">Years to model<input value={years} onChange={(e) => setYears(e.target.value)} className="mt-1 h-7 w-full rounded border-0 px-2 text-[10px] text-[#243650] outline-none" /></label>
          <label className="text-[8px] uppercase tracking-[.1em] text-[#9db0c6]">Market reference (total comp)<input value={reference} onChange={(e) => setReference(e.target.value)} className="mt-1 h-7 w-full rounded border-0 px-2 text-[10px] text-[#243650] outline-none" /></label>
          <button onClick={reset} className="flex h-7 items-center justify-center gap-1 rounded bg-[#f7f5ee] px-3 text-[9px] font-semibold text-[#243b5b] hover:bg-[#e8dfc5]"><RotateCcw size={10} /> Reset</button>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[220px_1fr]">
          <aside className="overflow-hidden rounded-md border border-[#e0e4e7] bg-[#fffefb]">
            <Section title="Base salary" tint="#dfe8f1" open={open.base} onToggle={() => toggle("base")}>
              <Field label="Starting base salary" value={base} onChange={setBase} />
              <Field label="Annual increase (%)" value={increase} onChange={setIncrease} suffix="%" />
              <Field label="Year-1 pro-rata (%)" value="100" onChange={() => undefined} suffix="%" />
              <p className="mt-1 text-[8px] italic leading-3 text-[#9aa1a8]">25% for a Q4 start; 100% for full year</p>
            </Section>
            <Section title="Annual incentive (scorecard)" tint="#e2ecd9" open={open.incentive} onToggle={() => toggle("incentive")}>
              <Field label="Target incentive (% of base)" value={target} onChange={setTarget} suffix="%" />
              <Field label="Maximum (x base)" value={maximum} onChange={setMaximum} step=".1" />
              <div className="mt-2 border-t border-[#edf0ed] pt-2 text-[9px] font-semibold uppercase tracking-[.08em] text-[#ae9139]">Scorecard metrics & weights</div>
              <div className="mt-1 grid grid-cols-[1fr_34px_10px] border-b border-[#e4e8eb] py-1 text-[8px] font-semibold text-[#607083]"><span>Metric</span><span>Weight</span><span /></div>
              {metrics.map((metric, index) => <div key={`${metric.name}-${index}`} className="grid grid-cols-[1fr_34px_10px] items-center border-b border-[#f0f1ee] py-1 text-[8px]"><span className="pr-1 text-center">{metric.name}</span><span>{metric.weight}%</span><button onClick={() => setMetrics((m) => m.filter((_, i) => i !== index))} className="text-[#b34949]"><Trash2 size={9} /></button></div>)}
              <p className="mt-2 text-[8px] italic text-[#9aa1a8]">Total weight: {metrics.reduce((sum, m) => sum + m.weight, 0)}% (aim for 100%). Score each metric per year.</p>
              <button onClick={() => setMetrics((m) => [...m, { name: `New metric ${m.length + 1}`, weight: 5 }])} className="mt-2 flex items-center gap-1 rounded border border-[#aeb8c3] px-2 py-1 text-[8px] font-semibold text-[#38526f]"><Plus size={10} /> Add metric</button>
            </Section>
            <Section title="Phantom equity build" tint="#e6e0f3" open={open.equity} onToggle={() => toggle("equity")}><Field label="Annual grant value" value="0" onChange={() => undefined} /><Field label="Vesting period (years)" value="4" onChange={() => undefined} /></Section>
            <Section title="Guaranteed floor (turnaround)" tint="#e3edd9" open={open.floor} onToggle={() => toggle("floor")}><Field label="Minimum cash guarantee" value="0" onChange={() => undefined} /><Field label="Guarantee duration" value="12" onChange={() => undefined} suffix="mo" /></Section>
            <Section title="Severance & protections" tint="#f0e5c8" open={open.severance} onToggle={() => toggle("severance")}><Field label="Months of base salary" value="12" onChange={() => undefined} /><Field label="Change-in-control multiple" value="1.5" onChange={() => undefined} suffix="x" /></Section>
          </aside>

          <div className="min-w-0">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Stat label="Year 1 total" value={money(totalYear)} goldEdge />
              <Stat label={`Cumulative (${yearsNumber} yr)`} value={money(cumulative)} goldEdge />
              <Stat label="Peak long-term / yr" value={money(baseNumber * .32)} goldEdge />
              <Stat label="Company type" value={company} goldEdge />
            </div>
            <div className="mt-3 grid gap-3 xl:grid-cols-2">
              <ChartCard title="Total compensation over time" icon={<BarChart3 size={12} />}><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ left: 0, right: 10, top: 8, bottom: 0 }}><CartesianGrid stroke="#e6e9e8" vertical={false} /><XAxis dataKey="year" tick={{ fontSize: 8, fill: "#75808a" }} /><YAxis tick={{ fontSize: 8, fill: "#75808a" }} tickFormatter={(v) => `$${v / 1000}k`} /><Tooltip formatter={(v: number) => money(v)} /><Legend wrapperStyle={{ fontSize: 8 }} /><Bar dataKey="base" name="Base" fill="#8ea9c5" radius={[2, 2, 0, 0]} /><Bar dataKey="incentive" name="Incentive+cash" fill="#a8c397" radius={[2, 2, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>
              <ChartCard title="Cash vs. long-term" icon={<ShieldCheck size={12} />}><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ left: 0, right: 10, top: 8, bottom: 0 }}><CartesianGrid stroke="#e6e9e8" vertical={false} /><XAxis dataKey="year" tick={{ fontSize: 8, fill: "#75808a" }} /><YAxis tick={{ fontSize: 8, fill: "#75808a" }} tickFormatter={(v) => `$${v / 1000}k`} /><Tooltip formatter={(v: number) => money(v)} /><Legend wrapperStyle={{ fontSize: 8 }} /><Area type="monotone" dataKey="cash" name="Cash" stackId="1" fill="#8ea9c5" stroke="#6d8daa" /><Area type="monotone" dataKey="equity" name="Long-term" stackId="1" fill="#ddc989" stroke="#b69c4d" /></AreaChart></ResponsiveContainer></ChartCard>
            </div>
            <div className="mt-3"><ChartCard title="Phantom equity build (vested year)" icon={<Info size={12} />} tall><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}><CartesianGrid stroke="#e6e9e8" vertical={false} /><XAxis dataKey="year" tick={{ fontSize: 8, fill: "#75808a" }} /><YAxis tick={{ fontSize: 8, fill: "#75808a" }} tickFormatter={(v) => `$${v / 1000}k`} /><Tooltip formatter={(v: number) => money(v)} /><Legend wrapperStyle={{ fontSize: 8 }} /><Line type="monotone" dataKey="equity" name="Phantom equity value" stroke="#8676a8" strokeWidth={2} dot={{ r: 2, fill: "#8676a8" }} /><Line type="monotone" dataKey="cash" name="EV growth" stroke="#253b55" strokeDasharray="4 3" strokeWidth={1.5} dot={false} /></LineChart></ResponsiveContainer></ChartCard></div>
            <div className="mt-3 rounded-md border border-[#dfe4e7] bg-[#fffefb] p-3 text-[9px] text-[#667383]"><span className="font-semibold text-[#2d4666]">Model notes.</span> Values are illustrative and should be reviewed with the board, compensation committee, and tax counsel. Adjust assumptions in the left panel to pressure-test the offer across a {yearsNumber}-year horizon.</div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ChartCard({ title, icon, children, tall = false }: { title: string; icon: ReactNode; children: ReactNode; tall?: boolean }) {
  return <div className={`rounded-md border border-[#e0e4e7] bg-[#fffefb] p-3 ${tall ? "h-[280px]" : "h-[205px]"}`}><div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold text-[#29415e]">{icon}{title}</div><div className="h-[calc(100%-24px)] w-full">{children}</div></div>;
}