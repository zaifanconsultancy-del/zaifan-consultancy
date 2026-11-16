// Frame around every admin page: navy sidebar (desktop) / bottom bar (phone),
// top bar with search + refresh + account, and the ⌘K people search.

import { useCallback, useEffect, useMemo, useState } from "react";
import { path } from "./lib/paths";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  GraduationCap,
  Inbox,
  ListChecks,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sun,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";

import logoLight from "../../assets/images/brand/logo-light.webp";
import { useAdminData } from "./data/AdminDataProvider";
import { classNames, daysUntil, humanize, timeAgo } from "./lib/format";
import { isDone, isLead, personMatches } from "./lib/people";
import { Avatar, Button, Notice } from "./ui/kit";
import { StageChip } from "./ui/person";
import AddPersonModal from "./pages/AddPersonModal";
import Bell from "./ui/Bell";

function buildNav(isCounselor) {
  const nav = [
    { to: path(), label: "Today", Icon: Sun, end: true },
    { to: path("/leads"), label: "Leads", Icon: Inbox, badge: (ctx) => ctx.newLeads },
    { to: path("/students"), label: "Students", Icon: GraduationCap },
    { to: path("/tasks"), label: "Tasks", Icon: ListChecks, badge: (ctx) => ctx.myTasks },
    { to: path("/calendar"), label: "Calendar", Icon: CalendarDays },
  ];
  if (!isCounselor) {
    nav.push({ to: path("/reports"), label: "Reports", Icon: BarChart3 }, { to: path("/money"), label: "Money", Icon: Wallet }, { to: path("/team"), label: "Team", Icon: UsersRound }, { to: path("/settings"), label: "Settings", Icon: Settings });
  }
  return nav;
}

export default function AdminShell({ onLogout }) {
  const { admin, isCounselor, people, loading, error, reload, lastLoadedAt } = useAdminData();
  const NAV = buildNav(isCounselor);
  const [searchOpen, setSearchOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  // Phone: four main pages in the bottom bar, everything else under "More".
  const barNav = NAV.slice(0, 4);
  const moreNav = NAV.slice(4);

  const badges = useMemo(
    () => ({
      newLeads: people.filter((person) => person.stage === "lead").length,
      // My tasks that are overdue or due today.
      myTasks: people.reduce((sum, person) => sum + person.tasks.filter((task) => task.assigned_to === admin.id && !isDone(task.status) && task.due_date && daysUntil(task.due_date) <= 0).length, 0),
    }),
    [people, admin.id]
  );

  useEffect(() => {
    const handler = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-[#fff7ed] text-[#071f50] lg:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-[232px] shrink-0 flex-col bg-[#071f50] text-white lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div className="px-5 pt-6">
          <img src={logoLight} alt="Zaifan Consultancy" className="h-auto w-[178px]" />
          <p className="mt-3 text-[10.5px] font-black uppercase tracking-[0.28em] text-white/40">{isCounselor ? "Counselor desk" : "Control tower"}</p>
        </div>

        <nav className="mt-6 flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => (
            <NavItem key={item.to} item={item} badge={item.badge ? item.badge(badges) : 0} />
          ))}
        </nav>

        <div className="px-3 pb-5">
          <Button variant="primary" className="w-full" icon={Plus} onClick={() => setAddOpen(true)}>
            Add a person
          </Button>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/[0.06] px-3 py-3">
            <Avatar name={admin.name} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-black">{admin.name}</p>
              <p className="truncate text-[11px] font-semibold text-white/50">{humanize(admin.role)}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Log out"
              title="Log out"
              className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-[#071f50]/8 bg-[#fff7ed]/90 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-3 px-4 sm:px-6">
            <img src={logoLight} alt="" className="h-9 w-auto rounded-lg bg-[#071f50] px-2 py-1.5 lg:hidden" />

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-2xl border border-[#071f50]/10 bg-white px-3.5 text-left text-[14px] font-semibold text-[#071f50]/45 transition hover:border-[#071f50]/25 sm:max-w-md"
            >
              <Search size={17} />
              <span className="truncate sm:hidden">Search</span>
              <span className="hidden truncate sm:inline">{isCounselor ? "Find one of your students…" : "Find a student by name, phone or email…"}</span>
              <kbd className="ml-auto hidden rounded-md border border-[#071f50]/15 px-1.5 py-0.5 text-[10.5px] font-black text-[#071f50]/50 sm:inline">
                Ctrl K
              </kbd>
            </button>

            <div className="ml-auto flex items-center gap-2">
              <Bell />
              <Button
                variant="ghost"
                size="icon"
                onClick={refresh}
                aria-label="Refresh data"
                title={lastLoadedAt ? `Updated ${timeAgo(lastLoadedAt)}` : "Refresh"}
                className="max-sm:hidden"
              >
                <RefreshCw size={16} className={refreshing || loading ? "animate-spin" : ""} />
              </Button>
              <Button variant="primary" size="sm" icon={Plus} onClick={() => setAddOpen(true)} className="lg:hidden">
                Add
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-28 pt-6 sm:px-6 lg:pb-12 [&_.grid>*]:min-w-0">
          {error ? (
            <Notice tone="warning" className="mb-5">
              {error}{" "}
              <button type="button" onClick={refresh} className="underline">
                Try again
              </button>
            </Notice>
          ) : null}
          <Outlet />
        </main>

        {/* Bottom bar (phone / tablet) */}
        <nav className="fixed inset-x-0 bottom-0 z-30 grid auto-cols-fr grid-flow-col border-t border-[#071f50]/10 bg-white/95 px-1 pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5 backdrop-blur lg:hidden">
          {barNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMoreOpen(false)}
              className={({ isActive }) =>
                classNames(
                  "relative flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10.5px] font-extrabold transition",
                  isActive ? "text-[#ff4b12]" : "text-[#071f50]/50"
                )
              }
            >
              <item.Icon size={20} />
              {item.label}
              {item.badge && item.badge(badges) ? (
                <span className="absolute right-[18%] top-0 rounded-full bg-[#ff4b12] px-1.5 text-[9.5px] font-black text-white">
                  {item.badge(badges)}
                </span>
              ) : null}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            className={classNames("relative flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10.5px] font-extrabold transition", moreOpen ? "text-[#ff4b12]" : "text-[#071f50]/50")}
          >
            {moreOpen ? <X size={20} /> : <Menu size={20} />}
            More
          </button>
        </nav>

        {/* "More" sheet (phone / tablet) */}
        <AnimatePresence>
          {moreOpen ? (
            <div className="fixed inset-0 z-[29] lg:hidden">
              <motion.button type="button" aria-label="Close menu" onClick={() => setMoreOpen(false)} className="absolute inset-0 bg-[#071f50]/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
              <motion.div
                className="absolute inset-x-0 bottom-0 rounded-t-[26px] bg-white px-4 pb-[92px] pt-4 shadow-[0_-20px_50px_rgba(7,31,80,0.25)]"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 340, damping: 34 }}
              >
                <div className="flex items-center gap-3 rounded-2xl bg-[#071f50] px-3.5 py-3 text-white">
                  <Avatar name={admin.name} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-black">{admin.name}</p>
                    <p className="truncate text-[11.5px] font-semibold text-white/55">{humanize(admin.role)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      refresh();
                    }}
                    className="rounded-xl bg-white/10 p-2 text-white/80"
                    aria-label="Refresh data"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {moreNav.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMoreOpen(false)}
                      className={({ isActive }) =>
                        classNames(
                          "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3.5 text-[12.5px] font-extrabold transition",
                          isActive ? "border-[#ff4b12]/40 bg-[#fff1e8] text-[#ff4b12]" : "border-[#071f50]/8 text-[#071f50]"
                        )
                      }
                    >
                      <item.Icon size={22} />
                      {item.label}
                    </NavLink>
                  ))}
                  <button type="button" onClick={onLogout} className="flex flex-col items-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50 px-2 py-3.5 text-[12.5px] font-extrabold text-rose-700">
                    <LogOut size={22} />
                    Log out
                  </button>
                </div>
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>
      </div>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AddPersonModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function NavItem({ item, badge }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        classNames(
          "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[14px] font-extrabold transition",
          isActive ? "bg-white text-[#071f50] shadow-[0_8px_20px_rgba(0,0,0,0.18)]" : "text-white/70 hover:bg-white/[0.08] hover:text-white"
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.Icon size={18} className={isActive ? "text-[#ff4b12]" : ""} />
          <span className="flex-1">{item.label}</span>
          {badge ? (
            <span className={classNames("rounded-full px-2 py-0.5 text-[11px] font-black", isActive ? "bg-[#ff4b12] text-white" : "bg-white/15 text-white")}>
              {badge}
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  );
}

function SearchPalette({ open, onClose }) {
  return <AnimatePresence>{open ? <SearchPaletteBody onClose={onClose} /> : null}</AnimatePresence>;
}

// Mounted only while open, so the query always starts empty.
function SearchPaletteBody({ onClose }) {
  const { people } = useAdminData();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const navigate = useNavigate();

  const results = useMemo(() => {
    const matches = query.trim() ? people.filter((person) => personMatches(person, query)) : people.slice(0, 8);
    return matches.slice(0, 10);
  }, [people, query]);

  const go = useCallback(
    (person) => {
      onClose();
      navigate(path(`/people/${person.id}`));
    },
    [navigate, onClose]
  );

  const onKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((current) => Math.min(current + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter" && results[cursor]) {
      go(results[cursor]);
    } else if (event.key === "Escape") {
      onClose();
    }
  };

  return (
        <div className="fixed inset-0 z-[75] flex items-start justify-center px-4 pt-[10vh]">
          <motion.button
            type="button"
            aria-label="Close search"
            onClick={onClose}
            className="absolute inset-0 bg-[#071f50]/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-xl overflow-hidden rounded-[24px] bg-white shadow-[0_30px_80px_rgba(7,31,80,0.35)]"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
          >
            <div className="flex items-center gap-3 border-b border-[#071f50]/8 px-4">
              <Search size={18} className="text-[#071f50]/40" />
              <input
                autoFocus
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setCursor(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Type a name, phone number or email"
                className="h-14 flex-1 bg-transparent text-[15px] font-semibold text-[#071f50] outline-none placeholder:text-[#071f50]/35"
              />
              <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#071f50]/50 hover:bg-[#071f50]/5">
                <X size={16} />
              </button>
            </div>
            <ul className="max-h-[50vh] overflow-y-auto p-2">
              {results.length ? (
                results.map((person, index) => (
                  <li key={person.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setCursor(index)}
                      onClick={() => go(person)}
                      className={classNames(
                        "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition",
                        index === cursor ? "bg-[#fff1e8]" : "hover:bg-[#071f50]/[0.03]"
                      )}
                    >
                      <Avatar name={person.name} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-black text-[#071f50]">{person.name}</p>
                        <p className="truncate text-[12px] font-semibold text-[#071f50]/50">
                          {[person.phone, person.email, person.country].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <StageChip stage={person.stage} />
                      <ArrowUpRight size={16} className="text-[#071f50]/30" />
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-4 py-8 text-center text-[14px] font-semibold text-[#071f50]/50">
                  Nobody matches “{query}”.
                </li>
              )}
            </ul>
            <div className="flex items-center justify-between border-t border-[#071f50]/8 px-4 py-2 text-[11px] font-bold text-[#071f50]/40">
              <span>{query ? `${results.length} match${results.length === 1 ? "" : "es"}` : `${people.filter(isLead).length} leads · ${people.length} people in total`}</span>
              <span>↑↓ move · Enter open · Esc close</span>
            </div>
          </motion.div>
        </div>
  );
}
