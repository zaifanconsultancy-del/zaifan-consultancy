// Four tiles at the top of the Overview tab: documents, money, applications
// and visa at a glance. Each tile opens its tab.

import { FileText, Send, Stamp, Wallet } from "lucide-react";

import { fmtDate, fmtMoneyList, humanize } from "../../lib/format";

const DONE_DOCS = ["verified", "approved"];

function Meter({ value, color }) {
  return (
    <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-[#071f50]/[0.07]">
      <span className="block h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, value * 100))}%`, background: color }} />
    </span>
  );
}

function Tile({ icon: Icon, color, label, value, hint, meter, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-w-0 flex-col rounded-[20px] border border-[#071f50]/8 bg-white p-4 text-left shadow-[0_1px_2px_rgba(7,31,80,0.04)] transition hover:-translate-y-0.5 hover:border-[#071f50]/20 hover:shadow-[0_12px_26px_rgba(7,31,80,0.08)]"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-black uppercase tracking-[0.14em] text-[#071f50]/45">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `${color}1a`, color }}>
          <Icon size={16} />
        </span>
      </span>
      <span className="mt-1 break-words text-[1.05rem] font-black leading-tight tracking-[-0.02em] text-[#071f50] sm:text-[1.35rem]">{value}</span>
      <span className="mt-0.5 line-clamp-2 text-[12px] font-semibold leading-4 text-[#071f50]/50">{hint}</span>
      {meter !== undefined ? <Meter value={meter} color={color} /> : null}
    </button>
  );
}

export default function Snapshot({ person, onChangeTab }) {
  const docs = person.documents;
  const checked = docs.filter((doc) => DONE_DOCS.includes(String(doc.status || "").toLowerCase())).length;

  // Per currency, so EUR and PKR are never added together.
  const { invoiced, paid, due } = person.money;
  const main = invoiced[0]?.[0] || "PKR";
  const share = (list) => list.find(([currency]) => currency === main)?.[1] || 0;
  const billed = share(invoiced);

  const apps = person.applications;
  const offers = apps.filter((app) => /offer|accepted|enrolled/i.test(String(app.offer_status || ""))).length;

  const visa = person.visas[0];

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Tile
        icon={FileText}
        color="#8b5cf6"
        label="Documents"
        value={docs.length ? `${checked} of ${docs.length} checked` : "None yet"}
        hint={docs.length - checked ? `${docs.length - checked} waiting for you to check` : docs.length ? "All checked" : "Upload or ask the student"}
        meter={docs.length ? checked / docs.length : 0}
        onClick={() => onChangeTab("documents")}
      />
      <Tile
        icon={Wallet}
        color="#10b981"
        label="Money"
        value={invoiced.length ? `${fmtMoneyList(paid, "Nothing")} paid` : "No invoice"}
        hint={invoiced.length ? (due.length ? `${fmtMoneyList(due)} still due` : "Fully paid") : "Create an invoice in Payments"}
        meter={billed ? Math.min(1, share(paid) / billed) : 0}
        onClick={() => onChangeTab("payments")}
      />
      <Tile
        icon={Send}
        color="#f59e0b"
        label="Applications"
        value={apps.length ? `${apps.length} sent or planned` : "None yet"}
        hint={apps.length ? (offers ? `${offers} offer${offers === 1 ? "" : "s"} received` : "No offer yet") : "Add the universities they apply to"}
        onClick={() => onChangeTab("applications")}
      />
      <Tile
        icon={Stamp}
        color="#ff4b12"
        label="Visa"
        value={visa ? humanize(visa.visa_status || visa.status || "In progress") : "Not started"}
        hint={visa?.appointment_date ? `Appointment ${fmtDate(visa.appointment_date)}` : visa ? "No appointment date yet" : "Starts after an offer"}
        onClick={() => onChangeTab("visa")}
      />
    </div>
  );
}
