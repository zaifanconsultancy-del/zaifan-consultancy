// Frame of the student portal: navy top bar, tabs (top on desktop, bottom bar
// on a phone) and the five pages.

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CreditCard, FileText, GraduationCap, Home, LifeBuoy, LogOut } from "lucide-react";

import logoLight from "../../assets/images/brand/logo-light.webp";
import { classNames, firstName } from "../admin/lib/format";
import { Avatar } from "../admin/ui/kit";
import AccountModal from "./AccountModal";
import { buildTodo, invoiceOutstanding, missingRequirements } from "./lib";
import ApplicationsTab from "./tabs/ApplicationsTab";
import DocumentsTab from "./tabs/DocumentsTab";
import HelpTab from "./tabs/HelpTab";
import HomeTab from "./tabs/HomeTab";
import PaymentsTab from "./tabs/PaymentsTab";

const TABS = [
  { id: "home", label: "Home", Icon: Home },
  { id: "documents", label: "Documents", Icon: FileText },
  { id: "applications", label: "Applications", Icon: GraduationCap },
  { id: "payments", label: "Payments", Icon: CreditCard },
  { id: "help", label: "Help", Icon: LifeBuoy },
];

export default function StudentShell({ file, reload, onLogout }) {
  const [params, setParams] = useSearchParams();
  const [accountOpen, setAccountOpen] = useState(false);
  const requested = params.get("tab");
  const tab = TABS.some((item) => item.id === requested) ? requested : "home";
  const goTo = (id) => {
    setParams(id === "home" ? {} : { tab: id });
    window.scrollTo({ top: 0 });
  };

  const todo = buildTodo(file);
  const badges = {
    documents: missingRequirements(file).length + file.documents.filter((doc) => String(doc.status).toLowerCase() === "rejected").length,
    payments: file.invoices.filter((invoice) => invoiceOutstanding(invoice) > 0).length,
    help: todo.filter((item) => item.tab === "help").length,
  };

  const page = { file, reload, goTo, todo };

  return (
    <div className="min-h-screen bg-[#fff7ed] text-[#071f50]">
      <header className="sticky top-0 z-30 bg-[#071f50] text-white">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-3 px-4 sm:px-6">
          <img src={logoLight} alt="Zaifan Consultancy" className="h-10 w-auto" />
          <span className="hidden rounded-full border border-white/20 px-2.5 py-1 text-[10.5px] font-black uppercase tracking-[0.2em] text-white/70 sm:inline">
            Student portal
          </span>
          <div className="ml-auto flex items-center gap-3">
            <button type="button" onClick={() => setAccountOpen(true)} title="My account" aria-label="My account" className="flex items-center gap-2 rounded-full p-0.5 pr-2.5 transition hover:bg-white/10">
              <Avatar name={file.person.name} size={32} />
              <span className="hidden text-[13.5px] font-extrabold sm:inline">{firstName(file.person.name)}</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-1.5 text-xs font-bold text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut size={14} />
              Log out
            </button>
          </div>
        </div>

        {/* Tabs (desktop / tablet) */}
        <nav className="mx-auto hidden w-full max-w-5xl gap-1 px-4 sm:px-6 md:flex" aria-label="Portal pages">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(item.id)}
              aria-current={tab === item.id ? "page" : undefined}
              className={classNames(
                "relative flex items-center gap-2 rounded-t-2xl px-4 py-2.5 text-[13.5px] font-extrabold transition",
                tab === item.id ? "bg-[#fff7ed] text-[#071f50]" : "text-white/65 hover:bg-white/[0.08] hover:text-white"
              )}
            >
              <item.Icon size={16} className={tab === item.id ? "text-[#ff4b12]" : ""} />
              {item.label}
              {badges[item.id] ? <span className="rounded-full bg-[#ff4b12] px-1.5 py-0.5 text-[10.5px] font-black text-white">{badges[item.id]}</span> : null}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-6 md:pb-14">
        {tab === "home" ? <HomeTab {...page} /> : null}
        {tab === "documents" ? <DocumentsTab {...page} /> : null}
        {tab === "applications" ? <ApplicationsTab {...page} /> : null}
        {tab === "payments" ? <PaymentsTab {...page} /> : null}
        {tab === "help" ? <HelpTab {...page} /> : null}
      </main>

      {accountOpen ? <AccountModal file={file} onClose={() => setAccountOpen(false)} /> : null}

      {/* Bottom bar (phone) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#071f50]/10 bg-white/95 px-1 pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5 backdrop-blur md:hidden" aria-label="Portal pages">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => goTo(item.id)}
            aria-current={tab === item.id ? "page" : undefined}
            className={classNames(
              "relative flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10.5px] font-extrabold transition",
              tab === item.id ? "text-[#ff4b12]" : "text-[#071f50]/50"
            )}
          >
            <item.Icon size={20} />
            {item.label === "Applications" ? "Apply" : item.label}
            {badges[item.id] ? (
              <span className="absolute right-[18%] top-0 rounded-full bg-[#ff4b12] px-1.5 text-[9.5px] font-black text-white">{badges[item.id]}</span>
            ) : null}
          </button>
        ))}
      </nav>
    </div>
  );
}
