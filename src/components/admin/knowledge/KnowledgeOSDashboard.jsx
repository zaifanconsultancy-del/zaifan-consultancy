import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  BookOpen,
  ClipboardList,
  Database,
  FileText,
  GraduationCap,
  Landmark,
  Layers,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import SOPCenter from "./SOPCenter";
import TrainingKnowledgeBase from "./TrainingKnowledgeBase";
import UniversityKnowledgeHub from "./UniversityKnowledgeHub";
import VisaKnowledgeHub from "./VisaKnowledgeHub";
import PolicyKnowledgeHub from "./PolicyKnowledgeHub";

const KNOWLEDGE_MODULES = [
  { key: "overview", label: "Overview", icon: BookOpen },
  { key: "sop", label: "SOP Center", icon: ClipboardList },
  { key: "training", label: "Training Center", icon: GraduationCap },
  { key: "university", label: "University Hub", icon: Landmark },
  { key: "visa", label: "Visa Hub", icon: ShieldCheck },
  { key: "policy", label: "Policy Hub", icon: FileText },
];

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function lower(value) {
  return String(value || "").trim().toLowerCase();
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readyStatus(status = "") {
  const value = lower(status);
  return (
    value.includes("approved") ||
    value.includes("live") ||
    value.includes("active") ||
    value.includes("published")
  );
}

function reviewStatus(status = "") {
  const value = lower(status);
  return (
    value.includes("review") ||
    value.includes("draft") ||
    value.includes("expired") ||
    value.includes("stale")
  );
}

function hasMetric(item = {}, key = "health") {
  return (
    item?.[key] !== null &&
    item?.[key] !== undefined &&
    Number.isFinite(Number(item[key]))
  );
}

function MetricCard({
  label,
  value,
  helper,
  tone = "blue",
  icon: Icon,
  badge = "",
}) {
  const tones = {
    navy: "border-[#123865] bg-[#123865]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    green: "border-[#34D399] bg-[#F0FFF8]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
    red: "border-[#FB7185] bg-[#FFF4F4]",
    violet: "border-[#9B6CFF] bg-[#F8F5FF]",
  };

  const dark = tone === "navy";

  return (
    <article
      className={`rounded-[1.4rem] border-[3px] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.05)] ${
        tones[tone] || tones.blue
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-[9px] font-black uppercase tracking-[0.11em] ${
              dark ? "text-orange-300" : "text-slate-500"
            }`}
          >
            {label}
          </p>

          <p
            className={`mt-2 whitespace-normal break-normal text-2xl font-black [overflow-wrap:normal] [word-break:normal] leading-tight ${
              dark ? "text-white" : "text-[#10233F]"
            }`}
          >
            {value}
          </p>
        </div>

        {Icon ? (
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${
              dark
                ? "border-white/20 bg-white/10 text-orange-200"
                : "border-[#123865]/15 bg-white text-[#123865]"
            }`}
          >
            <Icon size={16} />
          </div>
        ) : null}
      </div>

      <p
        className={`mt-2 text-xs font-semibold leading-5 ${
          dark ? "text-slate-200" : "text-slate-600"
        }`}
      >
        {helper}
      </p>

      {badge ? (
        <span
          className={`mt-3 inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${
            dark
              ? "border-white/20 bg-white/10 text-white"
              : "border-[#C9D7E6] bg-white text-slate-600"
          }`}
        >
          {badge}
        </span>
      ) : null}
    </article>
  );
}

function StatusPill({ status }) {
  const value = lower(status);

  let className =
    "border-[#C9D7E6] bg-[#FFF8EF] text-slate-600";

  if (readyStatus(value)) {
    className =
      "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  } else if (reviewStatus(value)) {
    className =
      "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  return (
    <span
      className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${className}`}
    >
      {status || "Unknown"}
    </span>
  );
}

function KnowledgeOverview({
  items,
  searchTerm,
  setSearchTerm,
  activeCategory,
  setActiveCategory,
  compact,
}) {
  const categories = useMemo(
    () => [
      "All",
      ...new Set(
        items
          .map((item) => String(item.category || "").trim())
          .filter(Boolean)
      ),
    ],
    [items]
  );

  const filteredItems = useMemo(() => {
    const term = lower(searchTerm);

    return items.filter((item) => {
      if (
        activeCategory !== "All" &&
        String(item.category || "") !== activeCategory
      ) {
        return false;
      }

      if (!term) return true;

      return [
        item.id,
        item.title,
        item.summary,
        item.owner,
        item.category,
        item.module,
        ...safeArray(item.tags),
      ]
        .map(lower)
        .join(" ")
        .includes(term);
    });
  }, [items, searchTerm, activeCategory]);

  const readyCount = items.filter((item) =>
    readyStatus(item.status)
  ).length;

  const reviewCount = items.filter((item) =>
    reviewStatus(item.status)
  ).length;

  const measurableHealth = items.filter((item) =>
    hasMetric(item, "health")
  );

  const avgHealth = measurableHealth.length
    ? Math.round(
        measurableHealth.reduce(
          (sum, item) => sum + safeNumber(item.health),
          0
        ) / measurableHealth.length
      )
    : null;

  const moduleCounts = useMemo(
    () =>
      items.reduce((acc, item) => {
        const key = item.module || "Other";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    [items]
  );

  return (
    <div className="space-y-5">
      {!compact ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Knowledge Assets"
            value={items.length}
            helper="Connected SOP, training, university, visa and policy records."
            tone="navy"
            icon={Layers}
            badge="Real records"
          />

          <MetricCard
            label="Ready to Use"
            value={readyCount}
            helper="Assets whose recorded status is approved, live, active or published."
            tone="green"
            icon={BadgeCheck}
          />

          <MetricCard
            label="Needs Review"
            value={reviewCount}
            helper="Draft, review, expired or stale knowledge requiring attention."
            tone={reviewCount > 0 ? "amber" : "green"}
            icon={AlertTriangle}
          />

          <MetricCard
            label="Health"
            value={avgHealth === null ? "—" : `${avgHealth}%`}
            helper={
              avgHealth === null
                ? "No measurable health evidence is connected yet."
                : `Average across ${measurableHealth.length} measurable asset${
                    measurableHealth.length === 1 ? "" : "s"
                  }.`
            }
            tone={avgHealth === null ? "blue" : "violet"}
            icon={Activity}
            badge={avgHealth === null ? "Not measured" : "Measured"}
          />
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.75fr)]">
        <section className="min-w-0 overflow-hidden rounded-[1.55rem] border-[3px] border-[#234E78] bg-[#FFFDF8] shadow-[0_10px_28px_rgba(15,35,63,0.055)]">
          <div className="border-b-2 border-[#E1E8F0] p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">
                  Knowledge Directory
                </p>
                <h3 className="mt-1 text-xl font-black text-[#10233F]">
                  Search connected knowledge
                </h3>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Zaifan no longer treats placeholder policies, rules or training
                  records as operational truth.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-[minmax(14rem,1fr)_auto_auto]">
                <label className="relative block">
                  <Search
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(event.target.value)
                    }
                    placeholder="Search knowledge..."
                    className="min-h-10 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-10 pr-3 text-xs font-semibold text-[#10233F] outline-none placeholder:text-slate-400 focus:border-[#F97316]"
                  />
                </label>

                <select
                  value={activeCategory}
                  onChange={(event) =>
                    setActiveCategory(event.target.value)
                  }
                  className="min-h-10 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-xs font-black text-[#10233F] outline-none focus:border-[#F97316]"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setActiveCategory("All");
                  }}
                  disabled={
                    !searchTerm.trim() && activeCategory === "All"
                  }
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-slate-700 disabled:opacity-40"
                >
                  <X size={12} />
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            {filteredItems.length ? (
              <div className="space-y-2.5">
                {filteredItems.map((item) => (
                  <article
                    key={item.id || item.title}
                    className="rounded-[1.2rem] border-2 border-[#E1E8F0] bg-[#FFFDF8] p-3 transition hover:border-[#F97316]"
                  >
                    <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="min-w-0 [overflow-wrap:anywhere] font-black text-[#10233F]">
                            {item.title || "Untitled knowledge asset"}
                          </p>
                          <StatusPill status={item.status} />
                        </div>

                        <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">
                          {[item.id, item.module, item.category, item.owner]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>

                        {item.summary ? (
                          <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                            {item.summary}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        {item.updatedAt || item.updated ? (
                          <span className="rounded-full border-2 border-[#C9D7E6] bg-white px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.06em] text-slate-600">
                            Updated {item.updatedAt || item.updated}
                          </span>
                        ) : null}

                        <span className="rounded-full border-2 border-[#60A5FA] bg-[#F2F7FF] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.06em] text-blue-700">
                          {hasMetric(item, "health")
                            ? `${safeNumber(item.health)}% health`
                            : "Health not measured"}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.4rem] border-[3px] border-dashed border-[#C9D7E6] bg-[#FFFDF8] p-8 text-center">
                <BookOpen size={24} className="mx-auto text-orange-700" />

                <p className="mt-3 font-black text-[#10233F]">
                  No knowledge assets found
                </p>

                <p className="mx-auto mt-2 max-w-xl text-xs font-semibold leading-5 text-slate-600">
                  {items.length
                    ? "Clear or change the search filters."
                    : "Connect real knowledge records before using this workspace for operational decisions."}
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[1.55rem] border-[3px] border-[#123865] bg-[#123865] p-4 text-white">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-orange-300" />
              <p className="text-[9px] font-black uppercase tracking-[0.11em] text-orange-300">
                Domain Coverage
              </p>
            </div>

            <p className="mt-2 text-2xl font-black">
              {Object.keys(moduleCounts).length}/5
            </p>

            <p className="mt-2 text-xs font-semibold leading-5 text-slate-200">
              Knowledge domains with at least one connected asset.
            </p>

            <div className="mt-4 space-y-2">
              {["SOP", "Training", "University", "Visa", "Policy"].map(
                (module) => (
                  <div
                    key={module}
                    className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3 py-2"
                  >
                    <span className="text-xs font-black">{module}</span>
                    <span className="text-xs font-semibold text-slate-300">
                      {moduleCounts[module] || 0}
                    </span>
                  </div>
                )
              )}
            </div>
          </section>

          <section className="rounded-[1.55rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={17}
                className="mt-0.5 shrink-0 text-amber-700"
              />

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.11em] text-slate-500">
                  Decision Boundary
                </p>
                <p className="mt-1 font-black text-[#10233F]">
                  Knowledge is evidence, not authority
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  University, visa, policy and SOP records must not override a
                  current official source when a record is stale, draft or
                  unverified.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default function KnowledgeOSDashboard({
  compact = false,
  adminProfile = null,
  snapshot = {},
  onRefresh,
}) {
  const [activeModule, setActiveModule] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const knowledge = useMemo(() => {
    const data =
      snapshot && typeof snapshot === "object" ? snapshot : {};

    const sop = safeArray(data.sops || data.sopRecords);
    const training = safeArray(
      data.training || data.trainingRecords || data.courses
    );
    const university = safeArray(
      data.universityRules || data.universityKnowledge
    );
    const visa = safeArray(data.visaGuides || data.visaKnowledge);
    const policy = safeArray(data.policies || data.policyRecords);

    const providedItems = safeArray(
      data.items || data.knowledgeItems || data.assets
    );

    const items = [
      ...sop.map((item) => ({
        ...item,
        module: item.module || "SOP",
      })),
      ...training.map((item) => ({
        ...item,
        module: item.module || "Training",
      })),
      ...university.map((item) => ({
        ...item,
        module: item.module || "University",
      })),
      ...visa.map((item) => ({
        ...item,
        module: item.module || "Visa",
      })),
      ...policy.map((item) => ({
        ...item,
        module: item.module || "Policy",
      })),
      ...providedItems,
    ];

    return {
      sop,
      training,
      university,
      visa,
      policy,
      items,
      connectedDomains: [
        sop.length > 0,
        training.length > 0,
        university.length > 0,
        visa.length > 0,
        policy.length > 0,
      ].filter(Boolean).length,
    };
  }, [snapshot]);

  const currentModule =
    KNOWLEDGE_MODULES.find((item) => item.key === activeModule) ||
    KNOWLEDGE_MODULES[0];

  function renderActiveModule() {
    if (activeModule === "sop") {
      return <SOPCenter compact={compact} records={knowledge.sop} />;
    }

    if (activeModule === "training") {
      return (
        <TrainingKnowledgeBase
          compact={compact}
          records={knowledge.training}
        />
      );
    }

    if (activeModule === "university") {
      return (
        <UniversityKnowledgeHub
          compact={compact}
          records={knowledge.university}
        />
      );
    }

    if (activeModule === "visa") {
      return (
        <VisaKnowledgeHub
          compact={compact}
          records={knowledge.visa}
        />
      );
    }

    if (activeModule === "policy") {
      return (
        <PolicyKnowledgeHub
          compact={compact}
          records={knowledge.policy}
        />
      );
    }

    return (
      <KnowledgeOverview
        items={knowledge.items}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        compact={compact}
      />
    );
  }

  return (
    <div className="min-w-0 space-y-5 rounded-[2.2rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 text-[#10233F] shadow-[0_24px_65px_rgba(18,56,101,0.15)] sm:p-4 lg:p-5">
      <header className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#F97316]">
        <div className="grid xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
                <BookOpen size={12} />
                Knowledge OS
              </span>

              <span className="rounded-full border-2 border-white/15 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                {knowledge.connectedDomains}/5 connected domains
              </span>

              <span className="rounded-full border-2 border-white/15 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                Evidence first
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-black text-white">
              Knowledge Command Center
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
              Governed operating knowledge for SOPs, staff training, university
              rules, visa guidance and internal policy. Missing knowledge remains
              missing instead of being replaced with convincing template data.
            </p>
          </div>

          <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.12em]">
              Current Workspace
            </p>

            <p className="mt-2 text-2xl font-black">
              {currentModule.label}
            </p>

            <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
              {adminProfile?.name || adminProfile?.full_name
                ? `Signed in as ${
                    adminProfile.name || adminProfile.full_name
                  }`
                : "Admin knowledge workspace"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
                {knowledge.items.length} connected assets
              </span>
              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
                Evidence first
              </span>
            </div>
          </div>
        </div>
      </header>

      <nav className="flex flex-col gap-3 rounded-[1.45rem] border-[3px] border-[#C9D7E6] bg-white p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap gap-2">
          {KNOWLEDGE_MODULES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveModule(key)}
              aria-pressed={activeModule === key}
              className={`inline-flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-xs font-black transition ${
                activeModule === key
                  ? "border-[#F97316] bg-[#FF5A0A] text-white"
                  : "border-[#C9D7E6] bg-[#FFF8EF] text-[#10233F] hover:border-[#F97316]"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 text-xs font-black text-white transition hover:bg-[#245886]"
          >
            <RefreshCw size={13} />
            Refresh Knowledge
          </button>
        ) : null}
      </nav>

      {knowledge.items.length === 0 ? (
        <div className="flex items-start gap-3 rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
          <Database
            size={18}
            className="mt-0.5 shrink-0 text-blue-700"
          />

          <div>
            <p className="font-black text-[#10233F]">
              Knowledge sources are not connected yet
            </p>

            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              The old template records are intentionally not treated as
              operational truth. Connect real SOP, training, university, visa and
              policy records before Zaifan relies on this workspace.
            </p>
          </div>
        </div>
      ) : null}

      {renderActiveModule()}

      {!compact ? (
        <section className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-[1.35rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-4">
            <div className="flex items-start gap-3">
              <BadgeCheck
                size={17}
                className="mt-0.5 shrink-0 text-emerald-700"
              />

              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                  Knowledge Integrity
                </p>
                <p className="mt-1 font-black text-[#10233F]">
                  Real records only
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Template policies, fake training completion and invented
                  university rules are not accepted as operational evidence.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={17}
                className="mt-0.5 shrink-0 text-blue-700"
              />

              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                  Decision Safety
                </p>
                <p className="mt-1 font-black text-[#10233F]">
                  Freshness matters
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Visa and university requirements should retain source, owner
                  and review-date evidence.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
            <div className="flex items-start gap-3">
              <Sparkles
                size={17}
                className="mt-0.5 shrink-0 text-amber-700"
              />

              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                  AI Boundary
                </p>
                <p className="mt-1 font-black text-[#10233F]">
                  AI may assist, not invent
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  AI can help staff find knowledge, but the underlying rule or
                  policy must remain linked to a real source.
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
