import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BookOpen, Check, MapPin, Printer, RotateCcw } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import logo from "../../../assets/images/brand/logo-tight.webp";
import { countryList } from "../../../data/countries";
import { DOCUMENT_CHECKLISTS, DOCUMENT_GROUPS, LEVELS, itemId, itemsForLevel, termsIn } from "../../../data/countries/documentChecklists";
import { FlagMark } from "../destinations/DestinationUI";
import StepLabel from "./StepLabel";

const STORAGE_KEY = "zaifan-document-checklist-v1";
const WHATSAPP_NUMBER = "923305718131";
const CONTACT_LINES = ["+92 330 5718131", "zaifanconsultancy@gmail.com", "Peshawar, Pakistan"];

function loadTicks() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function today() {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

const PAGE_SIZE = 8;

/**
 * A file's groups split into on-screen pages of about PAGE_SIZE items. A long
 * group carries on to the next page, and a heading never sits at the bottom of
 * a page with only one or two items under it.
 */
function sheetPages(stage, level) {
  const items = itemsForLevel(stage.items, level);
  const groups = Object.entries(stage.groups || DOCUMENT_GROUPS)
    .map(([id, label]) => ({ id, label, items: items.filter((item) => item.group === id) }))
    .filter((group) => group.items.length);

  const pages = [[]];
  let count = 0;
  groups.forEach((group) => {
    let rest = group.items;
    let continued = false;
    while (rest.length) {
      if (count > 0 && PAGE_SIZE - count < Math.min(3, rest.length)) {
        pages.push([]);
        count = 0;
      }
      const chunk = rest.slice(0, PAGE_SIZE - count);
      pages[pages.length - 1].push({ ...group, items: chunk, continued });
      count += chunk.length;
      rest = rest.slice(chunk.length);
      continued = true;
    }
  });
  return { items, groups, pages };
}

/**
 * One checklist as a letterhead page, the same on screen and on paper. With
 * `onToggle` the boxes are clickable and only `page` is shown; without it the
 * whole file renders for printing.
 */
function ChecklistSheet({ country, stage, level, ticked, studentName, onToggle, page }) {
  const { items, groups, pages } = sheetPages(stage, level);
  const paged = page !== undefined;
  const shownGroups = paged ? pages[page] : groups;
  const firstPage = !paged || page === 0;
  const done = items.filter((item) => ticked.includes(itemId(item))).length;
  const terms = termsIn([stage.intro, ...items.map((item) => `${item.title} ${item.note || ""} ${item.how || ""}`)].join(" "));
  const weCount = items.filter((item) => item.we).length;
  // Numbers run on across pages.
  const numberOf = new Map(groups.flatMap((group) => group.items).map((item, index) => [itemId(item), index + 1]));

  return (
    <article className="zaifan-sheet bg-white text-[#071f50]">
      {/* Letterhead */}
      <header className="flex items-start justify-between gap-4 border-b-[3px] border-[#ff4b12] pb-4">
        <img src={logo} alt="Zaifan Consultancy" width="340" height="115" className="h-11 w-auto sm:h-14" />
        <div className="text-right text-[10px] font-bold leading-4 text-[#5f6f89] sm:text-[11px]">
          {CONTACT_LINES.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </header>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ff4b12]">Document checklist</p>
          <h3 className="mt-1 flex items-center gap-2 text-2xl font-black tracking-[-0.03em] sm:text-3xl">
            <FlagMark country={country} className="h-5 w-[30px] rounded-[3px] shadow-none" />
            {country.name} · {stage.label}
          </h3>
        </div>
        <p className="rounded-full border-2 border-[#071f50] px-3 py-1 text-xs font-black">
          {done} / {items.length} ready
          {paged && pages.length > 1 && (
            <span className="text-[#7a879c]">
              {" "}
              · page {page + 1} of {pages.length}
            </span>
          )}
        </p>
      </div>

      {firstPage && (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
            <div className="col-span-2 sm:col-span-1">
              <dt className="font-black uppercase tracking-[0.12em] text-[#7a879c]">Student</dt>
              <dd className="mt-0.5 min-h-5 border-b border-dashed border-[#9aa5b8] font-black">{studentName}</dd>
            </div>
            <div>
              <dt className="font-black uppercase tracking-[0.12em] text-[#7a879c]">Level</dt>
              <dd className="mt-0.5 border-b border-dashed border-[#9aa5b8] font-black">{LEVELS.find((item) => item.id === level).label}</dd>
            </div>
            <div>
              <dt className="font-black uppercase tracking-[0.12em] text-[#7a879c]">Date</dt>
              <dd className="mt-0.5 border-b border-dashed border-[#9aa5b8] font-black">{today()}</dd>
            </div>
          </dl>

          <p className="mt-4 text-sm font-semibold leading-6 text-[#405672]">{stage.intro}</p>

          {weCount > 0 && (
            <p className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold leading-5 text-[#405672]">
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-200">We do this for you</span>
              = Zaifan prepares {weCount === items.length ? "all of these" : `${weCount} of these ${items.length}`} with you. For the rest, each line says where to get it.
            </p>
          )}

          {terms.length > 0 && (
            <aside className="zaifan-sheet-group mt-4 rounded-xl border border-[#d9e2f2] bg-[#f5f8fd] p-4">
              <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#071f50]">
                <BookOpen size={13} /> Words you might not know
              </p>
              <dl className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                {terms.map((entry) => (
                  <div key={entry.term} className="text-xs leading-5">
                    <dt className="inline font-black">{entry.term}: </dt>
                    <dd className="inline font-semibold text-[#5f6f89]">{entry.meaning}</dd>
                  </div>
                ))}
              </dl>
            </aside>
          )}
        </>
      )}

      {shownGroups.map((group) => (
        <section key={group.id} className="zaifan-sheet-group mt-5">
          <h4 className="bg-[#fff1ea] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#ff4b12]">
            {group.label}
            {paged && group.continued && <span className="text-[#7a879c]"> (continued)</span>}
          </h4>
          <ol>
            {group.items.map((item) => {
              const number = numberOf.get(itemId(item));
              const checked = ticked.includes(itemId(item));
              const box = (
                <span
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-[5px] border-2 ${
                    checked ? "border-emerald-600 bg-emerald-600 text-white" : "border-[#071f50] bg-white"
                  }`}
                >
                  {checked && <Check size={13} strokeWidth={4} />}
                </span>
              );
              const body = (
                <>
                  <span className="w-6 shrink-0 pt-0.5 text-right font-mono text-xs font-black text-[#9aa5b8]">{number}.</span>
                  {box}
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={`text-sm font-black leading-5 ${checked ? "text-emerald-800" : ""}`}>{item.title}</span>
                      {item.we && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-200">
                          We do this for you
                        </span>
                      )}
                    </span>
                    {item.note && <span className="block text-xs font-semibold leading-5 text-[#7a879c]">{item.note}</span>}
                    {item.how && (
                      <span className="mt-0.5 flex items-start gap-1 text-xs font-bold leading-5 text-[#405672]">
                        <MapPin size={12} className="mt-1 shrink-0 text-[#ff4b12]" />
                        <span>
                          <span className="text-[#ff4b12]">Where to get it:</span> {item.how}
                        </span>
                      </span>
                    )}
                  </span>
                </>
              );
              return (
                <li key={itemId(item)} className="border-b border-[#eef1f5]">
                  {onToggle ? (
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() => onToggle(item)}
                      className="flex w-full items-start gap-3 px-1 py-2.5 text-left transition hover:bg-[#fff7ed]"
                    >
                      {body}
                    </button>
                  ) : (
                    <div className="flex items-start gap-3 px-1 py-2">{body}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      {(!paged || page === pages.length - 1) && (
        <footer className="mt-6 border-t border-[#eef1f5] pt-3 text-[10px] font-semibold leading-4 text-[#7a879c]">
          Embassies update their lists and some items depend on your case. Zaifan Consultancy confirms the final list with you before you submit
          anything. Book a free consultation: +92 330 5718131.
        </footer>
      )}
    </article>
  );
}

// Country guides link here with ?checklist=germany to open that country's list.
function linkedCountry() {
  const slug = new URLSearchParams(window.location.search).get("checklist");
  return DOCUMENT_CHECKLISTS[slug] ? slug : null;
}

function DocumentChecklist({ picks }) {
  const [chosen, setChosen] = useState(linkedCountry);
  const [level, setLevel] = useState("masters");
  const [stageId, setStageId] = useState(null);
  const [ticks, setTicks] = useState(loadTicks);
  const [studentName, setStudentName] = useState("");
  // The stages being printed; rendered into a print-only root, then cleared.
  const [printing, setPrinting] = useState(null);

  // Follow the shortlist until the visitor picks a country here.
  const slug = chosen || picks[0]?.slug || "italy";
  const country = countryList.find((item) => item.slug === slug);
  const stages = DOCUMENT_CHECKLISTS[slug];
  const stage = stages.find((item) => item.id === stageId) || stages[0];
  const tickedIn = (stageKey) => ticks[slug]?.[stageKey] || [];
  const nextStage = stages[stages.indexOf(stage) + 1];

  // The page resets to 1 whenever the country, file or level changes.
  const sheetRef = useRef(null);
  const pageKey = `${slug}-${stage.id}-${level}`;
  const [pageState, setPageState] = useState({ key: pageKey, page: 0 });
  const pageCount = sheetPages(stage, level).pages.length;
  const page = pageState.key === pageKey ? Math.min(pageState.page, pageCount - 1) : 0;
  const goToPage = (next) => {
    setPageState({ key: pageKey, page: Math.max(0, Math.min(next, pageCount - 1)) });
    sheetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ticks));
    } catch {
      // Storage can be blocked; the checklist still works for this visit.
    }
  }, [ticks]);

  useEffect(() => {
    if (!printing) return undefined;
    const done = () => setPrinting(null);
    window.addEventListener("afterprint", done);
    // Let the print root render before the dialog opens.
    const frame = window.requestAnimationFrame(() => window.print());
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("afterprint", done);
    };
  }, [printing]);

  const toggle = (item) => {
    const id = itemId(item);
    setTicks((current) => {
      const list = current[slug]?.[stage.id] || [];
      const next = list.includes(id) ? list.filter((value) => value !== id) : [...list, id];
      return { ...current, [slug]: { ...current[slug], [stage.id]: next } };
    });
  };

  const reset = () => setTicks((current) => ({ ...current, [slug]: { ...current[slug], [stage.id]: [] } }));

  const pickCountry = (nextSlug) => {
    setChosen(nextSlug);
    setStageId(null);
  };

  const items = itemsForLevel(stage.items, level);
  const done = items.filter((item) => tickedIn(stage.id).includes(itemId(item))).length;
  const message = [
    `Hi Zaifan, here is my ${country.name} checklist (${stage.label}, ${LEVELS.find((item) => item.id === level).label})${studentName ? ` for ${studentName}` : ""}:`,
    "",
    ...items.map((item) => `${tickedIn(stage.id).includes(itemId(item)) ? "[x]" : "[ ]"} ${item.title}`),
    "",
    `${done} of ${items.length} ready. Can you check my file?`,
  ].join("\n");

  const label = "mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#7a879c]";

  return (
    <section id="documents" className="relative scroll-mt-20 bg-[#ff4b12] px-4 pb-20 pt-8 text-[#071f50] sm:px-5 md:pb-28 md:pt-12">
      <div className="mx-auto max-w-[1350px]">
        <StepLabel step={4} tone="dark" />
        <div className="mt-4 flex flex-col gap-4 text-white lg:flex-row lg:items-end lg:justify-between">
          <h2 className="text-5xl font-black leading-[0.9] tracking-[-0.06em] md:text-7xl">
            Your document
            <span className="block text-[#071f50]">checklist.</span>
          </h2>
          <p className="max-w-md text-sm font-semibold leading-7 text-white/90 md:text-base">
            <span className="font-black text-white">How to use:</span> pick your country and what you&apos;re applying for, then open each file
            in order. Every line says where to get that paper, and the ones marked{" "}
            <span className="font-black text-white">&ldquo;We do this for you&rdquo;</span> are on us. Tick what you have, then print it or save it
            as a PDF.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[330px_1fr] lg:items-start">
          {/* Controls */}
          <aside className="space-y-6 rounded-[28px] bg-white p-5 shadow-[0_20px_50px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 lg:sticky lg:top-28">
            <div>
              <p className={label}>1 · Country</p>
              <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Choose a country">
                {countryList.map((item) => (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => pickCountry(item.slug)}
                    aria-pressed={item.slug === slug}
                    className={`relative flex flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-[11px] font-black transition ${
                      item.slug === slug ? "bg-[#071f50] text-white" : "bg-[#fff7ed] hover:bg-[#fff1ea]"
                    }`}
                  >
                    <FlagMark country={item} className="h-5 w-[30px] rounded-[3px] shadow-none" />
                    {item.name}
                    {picks.some((pick) => pick.slug === item.slug) && (
                      <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#ff4b12]" title="In your shortlist" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className={label}>2 · I&apos;m applying for</p>
              <div className="grid grid-cols-2 rounded-full bg-[#fff7ed] p-1 ring-1 ring-orange-100" role="group" aria-label="Study level">
                {LEVELS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLevel(item.id)}
                    aria-pressed={level === item.id}
                    className={`relative rounded-full py-2 text-xs font-black transition ${level === item.id ? "text-white" : "text-[#5f6f89] hover:text-[#071f50]"}`}
                  >
                    {level === item.id && <motion.span layoutId="docs-level" className="absolute inset-0 rounded-full bg-[#071f50]" />}
                    <span className="relative">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className={label}>3 · Your files, in order</p>
              <div className="grid gap-1.5" role="tablist" aria-label="Document files">
                {stages.map((item, index) => {
                  const stageItems = itemsForLevel(item.items, level);
                  const stageDone = stageItems.filter((entry) => tickedIn(item.id).includes(itemId(entry))).length;
                  const active = item.id === stage.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setStageId(item.id)}
                      className={`flex items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 text-left text-sm font-black transition ${
                        active ? "bg-[#ff4b12] text-white" : "bg-[#fff7ed] hover:bg-[#fff1ea]"
                      }`}
                    >
                      <span className="flex items-start gap-2.5">
                        <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] ${active ? "bg-white text-[#ff4b12]" : "bg-white"}`}>
                          {index + 1}
                        </span>
                        <span>
                          <span className="block leading-5">{item.label}</span>
                          <span className={`block text-[11px] font-bold leading-4 ${active ? "text-white/80" : "text-[#7a879c]"}`}>{item.summary}</span>
                        </span>
                      </span>
                      <span className={`shrink-0 text-[11px] ${active ? "text-white/80" : stageDone === stageItems.length ? "text-emerald-600" : "text-[#7a879c]"}`}>
                        {stageDone}/{stageItems.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block">
              <span className={`block ${label}`}>4 · Your name (printed on the sheet)</span>
              <input
                type="text"
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
                placeholder="e.g. Ali Khan"
                maxLength={60}
                className="w-full rounded-2xl bg-[#fff7ed] px-4 py-3 text-sm font-bold outline-none ring-1 ring-orange-100 placeholder:text-[#9aa5b8] focus:ring-2 focus:ring-[#ff4b12]"
              />
            </label>

            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => setPrinting([stage])}
                className="flex items-center justify-center gap-2 rounded-full bg-[#071f50] px-5 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#0b2a6b]"
              >
                <Printer size={17} /> Print / save as PDF
              </button>
              <button
                type="button"
                onClick={() => setPrinting(stages)}
                className="rounded-full px-5 py-2 text-xs font-black text-[#071f50] ring-1 ring-orange-100 transition hover:ring-[#071f50]"
              >
                Print all {stages.length} {country.name} files
              </button>
              <a
                href={`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-full bg-[#25d366] px-5 py-3 text-sm font-black text-[#062b16] transition hover:-translate-y-0.5 hover:bg-[#3ee07a]"
              >
                <FaWhatsapp size={18} /> Send to Zaifan for a free check
              </a>
              <button
                type="button"
                onClick={reset}
                disabled={!done}
                className="flex items-center justify-center gap-1.5 py-1 text-xs font-black text-[#7a879c] transition hover:text-[#071f50] disabled:opacity-40"
              >
                <RotateCcw size={13} /> Clear ticks for this file
              </button>
            </div>
          </aside>

          {/* The page itself */}
          <div ref={sheetRef} className="relative scroll-mt-28">
            <div className="pointer-events-none absolute inset-x-6 -bottom-3 top-3 rotate-1 rounded-[6px] bg-white/60 ring-1 ring-orange-100" />
            <div className="relative rounded-[6px] bg-white p-5 shadow-[0_30px_70px_rgba(9,31,80,0.12)] ring-1 ring-black/5 sm:p-10">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${pageKey}-${page}`}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChecklistSheet
                    country={country}
                    stage={stage}
                    level={level}
                    ticked={tickedIn(stage.id)}
                    studentName={studentName}
                    onToggle={toggle}
                    page={page}
                  />
                </motion.div>
              </AnimatePresence>

              {pageCount > 1 && (
                <nav aria-label="Checklist pages" className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-orange-100 pt-5">
                  <button
                    type="button"
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 0}
                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-black ring-1 ring-orange-100 transition hover:ring-[#071f50] disabled:opacity-30"
                  >
                    <ArrowLeft size={15} strokeWidth={3} /> Previous
                  </button>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: pageCount }, (_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => goToPage(index)}
                        aria-current={index === page ? "page" : undefined}
                        aria-label={`Page ${index + 1}`}
                        className={`grid h-9 w-9 place-items-center rounded-full text-sm font-black transition ${
                          index === page ? "bg-[#071f50] text-white" : "bg-[#fff7ed] hover:bg-[#fff1ea]"
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                  {page < pageCount - 1 ? (
                    <button
                      type="button"
                      onClick={() => goToPage(page + 1)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#ff4b12] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#ff642f]"
                    >
                      Next page <ArrowRight size={15} strokeWidth={3} />
                    </button>
                  ) : nextStage ? (
                    <button
                      type="button"
                      onClick={() => setStageId(nextStage.id)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#071f50] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#0b2a6b]"
                    >
                      Next file: {nextStage.label} <ArrowRight size={15} strokeWidth={3} />
                    </button>
                  ) : (
                    <span className="text-sm font-black text-emerald-600">That&apos;s the last page</span>
                  )}
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>

      {printing &&
        createPortal(
          <div id="zaifan-print-root">
            {printing.map((item) => (
              <ChecklistSheet
                key={item.id}
                country={country}
                stage={item}
                level={level}
                ticked={tickedIn(item.id)}
                studentName={studentName}
              />
            ))}
          </div>,
          document.body,
        )}
    </section>
  );
}

export default DocumentChecklist;
