// LeadScoringAnalytics PARTNER OS EXTREME — Compact Lead Intelligence Command
// src/components/admin/LeadScoringAnalytics.jsx
//
// Maximum pass:
// - preserves calculateLeadScore / getLeadScoreLabel / getLeadScoreTone integration
// - preserves inquiry + appointment merging and top ranking
// - safer array handling and duplicate-resistant lead keys
// - adds average / median / top score / scoring coverage
// - adds ownership and contact-completeness intelligence
// - adds configurable search + score-band filtering
// - adds stable sorting options
// - adds rank movement-friendly structure without inventing persistence
// - adds explicit empty states and reduced-motion support
// - hardens navy/orange contrast
// - no fake AI claims, no backend writes, no schema assumptions

import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Brain,
  CheckCircle2,
  CircleGauge,
  Crown,
  Flame,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  calculateLeadScore,
  getLeadScoreLabel,
  getLeadScoreTone,
} from "../../../../services/leadScoringEngine";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalize(value = "") {
  return String(value || "").toLowerCase().trim();
}

function getLeadName(lead = {}) {
  return (
    lead.full_name ||
    lead.student_name ||
    lead.name ||
    lead.email ||
    "Unknown Lead"
  );
}

function getLeadContact(lead = {}) {
  if (lead.email && lead.phone) return `${lead.email} · ${lead.phone}`;
  return lead.email || lead.phone || "No contact";
}

function getBand(score) {
  const value = safeNumber(score);

  if (value >= 80) return "hot";
  if (value >= 60) return "warm";
  if (value >= 35) return "active";
  return "cold";
}

function median(values = []) {
  if (!values.length) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function contactCompleteness(lead = {}) {
  const fields = [
    lead.full_name || lead.name || lead.student_name,
    lead.email,
    lead.phone,
    lead.priority,
    lead.status || lead.pipeline_stage || lead.appointment_stage,
    lead.assigned_admin_id || lead.assigned_admin_name,
  ];

  return Math.round(
    (fields.filter((value) => String(value || "").trim()).length /
      fields.length) *
      100
  );
}

function LeadScoringAnalytics({
  cardClass = "",
  inquiries = [],
  appointments = [],
}) {
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [bandFilter, setBandFilter] = useState("all");
  const [sortMode, setSortMode] = useState("score");
  const [workspaceExpanded, setWorkspaceExpanded] = useState(false);

  const scoredLeads = useMemo(() => {
    const safeInquiries = safeArray(inquiries);
    const safeAppointments = safeArray(appointments);

    return [
      ...safeInquiries.map((lead) => ({
        ...lead,
        type: "inquiry",
        score: safeNumber(calculateLeadScore(lead, "inquiry")),
      })),
      ...safeAppointments.map((lead) => ({
        ...lead,
        type: "appointment",
        score: safeNumber(calculateLeadScore(lead, "appointment")),
      })),
    ].map((lead, index) => ({
      ...lead,
      _rowKey: `${lead.type}-${lead.id || lead.email || lead.phone || index}`,
      _name: getLeadName(lead),
      _contact: getLeadContact(lead),
      _band: getBand(lead.score),
      _contactCompleteness: contactCompleteness(lead),
    }));
  }, [inquiries, appointments]);

  const summary = useMemo(() => {
    const scores = [];
    const total = scoredLeads.length;

    let hot = 0;
    let warm = 0;
    let active = 0;
    let cold = 0;
    let assigned = 0;
    let completeContact = 0;
    let contactReady = 0;
    let completenessTotal = 0;
    let scoreTotal = 0;
    let topScore = 0;

    for (const lead of scoredLeads) {
      const score = safeNumber(lead.score);

      scores.push(score);
      scoreTotal += score;
      if (score > topScore) topScore = score;

      if (lead._band === "hot") hot += 1;
      else if (lead._band === "warm") warm += 1;
      else if (lead._band === "active") active += 1;
      else cold += 1;

      if (
        lead.assigned_admin_id ||
        lead.assigned_admin_name ||
        lead.assigned_to ||
        lead.counselor_id
      ) {
        assigned += 1;
      }

      completenessTotal += lead._contactCompleteness;

      if (lead.email || lead.phone) {
        contactReady += 1;
      }

      if (lead._contactCompleteness >= 80) {
        completeContact += 1;
      }
    }

    return {
      total,
      average: total ? Math.round(scoreTotal / total) : 0,
      median: median(scores),
      topScore,
      hot,
      warm,
      active,
      cold,
      assigned,
      assignmentRate: total
        ? Math.round((assigned / total) * 100)
        : 0,
      completeContact,
      contactReady,
      contactRate: total
        ? Math.round((contactReady / total) * 100)
        : 0,
      averageCompleteness: total
        ? Math.round(completenessTotal / total)
        : 0,
      contactCompletenessRate: total
        ? Math.round((completeContact / total) * 100)
        : 0,
    };
  }, [scoredLeads]);

  const filteredLeads = useMemo(() => {
    const cleanQuery = normalize(query);

    let rows = scoredLeads.filter((lead) => {
      if (bandFilter !== "all" && lead._band !== bandFilter) return false;

      if (!cleanQuery) return true;

      return [
        lead._name,
        lead.email,
        lead.phone,
        lead.priority,
        lead.assigned_admin_name,
        lead.status,
        lead.pipeline_stage,
        lead.appointment_stage,
        lead.type,
      ]
        .map(normalize)
        .some((value) => value.includes(cleanQuery));
    });

    rows = [...rows].sort((a, b) => {
      if (sortMode === "name") {
        return a._name.localeCompare(b._name);
      }

      if (sortMode === "completeness") {
        return b._contactCompleteness - a._contactCompleteness;
      }

      return b.score - a.score;
    });

    return rows;
  }, [scoredLeads, query, bandFilter, sortMode]);

  const topLeads = filteredLeads.slice(0, 20);

  return (
    <motion.section
      key="lead-scoring"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.26 }}
      className={`${cardClass} min-w-0 space-y-4 rounded-[2.15rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-2.5 text-[#10233F] shadow-[0_20px_55px_rgba(18,56,101,0.12)] sm:p-3`}
    >
      <header className="min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] border-[#FF5A0A] bg-white">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div className="min-w-0 bg-[#123865] p-4 text-white sm:p-5 lg:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
                <Brain size={12} />
                Lead Scoring OS
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/15 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                <ShieldCheck size={12} />
                Existing Scoring Engine
              </span>
            </div>

            <h2 className="mt-3 break-words text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">
              Lead Priority Command
            </h2>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
              Rank real inquiries and appointments through the existing Zaifan
              scoring engine, then review score band, ownership and profile
              readiness from one operating portfolio.
            </p>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-4 text-white sm:p-5 lg:border-l-[3px] lg:border-t-0 lg:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.12em]">
              Current Workspace
            </p>

            <p className="mt-2 text-2xl font-black">Scored Lead Portfolio</p>

            <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
              Top matching leads are shown after search, score-band and sorting
              controls are applied.
            </p>

            <div className="mt-4 grid min-w-0 grid-cols-2 gap-2">
              <HeroMetric label="Scored" value={summary.total} />
              <HeroMetric label="Average" value={`${summary.average}/100`} />
              <HeroMetric label="Top Score" value={`${summary.topScore}/100`} />
              <HeroMetric label="Median" value={`${summary.median}/100`} />
            </div>
          </div>
        </div>
      </header>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <PartnerScoreMetric
          label="Hot Leads"
          value={summary.hot}
          helper="Scores between 80 and 100."
          icon={Flame}
          tone={summary.hot ? "red" : "green"}
          badge="Immediate"
        />

        <PartnerScoreMetric
          label="Warm Leads"
          value={summary.warm}
          helper="Scores between 60 and 79."
          icon={TrendingUp}
          tone="amber"
          badge="Priority"
        />

        <PartnerScoreMetric
          label="Assignment Coverage"
          value={`${summary.assignmentRate}%`}
          helper={`${summary.assigned}/${summary.total} scored leads have an owner.`}
          icon={UserRoundCheck}
          tone={summary.assignmentRate >= 80 ? "green" : "blue"}
          badge="Ownership"
        />

        <PartnerScoreMetric
          label="Contact Coverage"
          value={`${summary.contactRate}%`}
          helper={`${summary.contactReady}/${summary.total} leads have email or phone.`}
          icon={ShieldCheck}
          tone={summary.contactRate >= 85 ? "green" : "blue"}
          badge="Contactability"
        />
      </div>

      <section className="rounded-[1.45rem] border-[3px] border-[#123865] bg-white p-3">
        <button
          type="button"
          onClick={() =>
            setWorkspaceExpanded((current) => !current)
          }
          aria-expanded={workspaceExpanded}
          className="flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-4 py-3 text-left transition hover:border-[#FF5A0A] hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
        >
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
              Lead Scoring Workspace
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              {workspaceExpanded
                ? "Hide ranked leads, filters and scoring integrity."
                : "Open ranked leads, filters and scoring integrity."}
            </p>
          </div>

          <Activity
            size={17}
            className={`shrink-0 text-[#123865] transition ${
              workspaceExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </section>

      {workspaceExpanded ? (
        <div className="min-w-0 space-y-4">
      <section className="min-w-0 rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_10px_26px_rgba(18,56,101,0.05)] sm:p-5">
        <div className="mb-4 flex min-w-0 flex-col gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">
              Lead Scoring Command
            </p>

            <h3 className="mt-1 text-xl font-black text-[#10233F]">
              Ranked lead portfolio
            </h3>

            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              Search, filter and sort scored CRM records without changing the
              underlying scoring engine.
            </p>
          </div>

          <div className="grid min-w-0 gap-2 sm:grid-cols-3">
            <label className="relative block min-w-0">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search lead, contact, owner..."
                className="min-h-10 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] pl-9 pr-3 text-xs font-semibold text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <select
              value={bandFilter}
              onChange={(event) => setBandFilter(event.target.value)}
              className="min-h-10 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
            >
              <option value="all">All Scores</option>
              <option value="hot">Hot 80+</option>
              <option value="warm">Warm 60–79</option>
              <option value="active">Active 35–59</option>
              <option value="cold">Cold 0–34</option>
            </select>

            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value)}
              className="min-h-10 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
            >
              <option value="score">Sort: Score</option>
              <option value="completeness">Sort: Completeness</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500">
          <span>
            Showing {topLeads.length} of {filteredLeads.length} matching lead
            {filteredLeads.length === 1 ? "" : "s"}
          </span>
          <span>Top 20 rendered for workspace performance.</span>
        </div>

        <div className="space-y-2.5">
          {topLeads.length ? (
            topLeads.map((lead, index) => (
              <LeadPortfolioRow
                key={lead._rowKey}
                lead={lead}
                index={index}
                reduceMotion={reduceMotion}
              />
            ))
          ) : (
            <div className="rounded-[1.4rem] border-[3px] border-dashed border-[#C9D7E6] bg-[#FFF8EF] p-8 text-center">
              <BarChart3 size={25} className="mx-auto text-orange-700" />
              <p className="mt-3 font-black text-[#10233F]">
                No matching scored leads
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                Adjust the search or score-band filter, or wait for CRM records.
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="grid min-w-0 gap-3">
        <LeadIntegrityCard
          icon={ShieldCheck}
          eyebrow="Scoring Integrity"
          title="Existing engine preserved"
          helper="Scores still come from calculateLeadScore for inquiry and appointment records."
          tone="green"
        />

        <LeadIntegrityCard
          icon={Target}
          eyebrow="Profile Readiness"
          title={`${summary.averageCompleteness}% average completeness`}
          helper={`${summary.completeContact} leads meet the 80% profile-completeness threshold.`}
          tone="blue"
        />

        <LeadIntegrityCard
          icon={Crown}
          eyebrow="Priority Pool"
          title={`${summary.hot + summary.warm} hot or warm leads`}
          helper="These records remain visible as the fastest counselor-attention pool."
          tone={summary.hot + summary.warm ? "amber" : "green"}
        />
      </div>
        </div>
      ) : null}
    </motion.section>
  );
}


function PartnerScoreMetric({
  label,
  value,
  helper,
  icon: Icon,
  tone = "blue",
  badge = "",
}) {
  const tones = {
    navy: "border-[#123865] bg-[#123865]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    green: "border-[#34D399] bg-[#F0FFF8]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
    red: "border-[#FB7185] bg-[#FFF4F4]",
  };

  const dark = tone === "navy";

  return (
    <article
      className={`flex min-w-0 h-full flex-col justify-between rounded-[1.35rem] border-[3px] p-4 shadow-[0_7px_20px_rgba(18,56,101,0.05)] ${
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
            className={`mt-2 break-words text-2xl font-black ${
              dark ? "text-white" : "text-[#10233F]"
            }`}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${
            dark
              ? "border-white/20 bg-white/10 text-orange-200"
              : "border-[#123865]/15 bg-white text-[#123865]"
          }`}
        >
          <Icon size={16} />
        </div>
      </div>

      <div>
        <p
          className={`mt-4 text-xs font-semibold leading-5 ${
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
      </div>
    </article>
  );
}

function LeadPortfolioRow({ lead, index, reduceMotion }) {
  const label = getLeadScoreLabel(lead.score);
  const normalizedTone = normalizeTone(getLeadScoreTone(lead.score));
  const bandTone =
    lead._band === "hot"
      ? "border-[#FB7185] bg-[#FFF4F4] text-red-700"
      : lead._band === "warm"
        ? "border-[#F59E0B] bg-[#FFF8E8] text-amber-800"
        : lead._band === "active"
          ? "border-[#FCD34D] bg-[#FFFBEA] text-amber-800"
          : "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.2,
        delay: reduceMotion ? 0 : index * 0.02,
      }}
      className="grid min-w-0 gap-3 rounded-[1.25rem] border-2 border-[#C9D7E6] bg-white p-4 shadow-[0_5px_14px_rgba(18,56,101,0.04)] sm:grid-cols-2"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="min-w-0 [overflow-wrap:anywhere] font-black text-[#10233F]">
            {lead._name}
          </p>

          <span className="rounded-full border-2 border-[#C9D7E6] bg-[#FFF8EF] px-2.5 py-1 text-[8px] font-black uppercase text-slate-600">
            {lead.type}
          </span>

          <span
            className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase ${bandTone}`}
          >
            {label}
          </span>
        </div>

        <p className="mt-1 truncate text-xs font-semibold text-slate-500">
          {lead._contact}
        </p>
      </div>

      <LeadMiniValue
        label="Score"
        value={`${lead.score}/100`}
        valueClass={normalizedTone}
      />

      <LeadMiniValue
        label="Priority"
        value={lead.priority || "Low"}
      />

      <LeadMiniValue
        label="Owner"
        value={
          lead.assigned_admin_name ||
          lead.assigned_to ||
          "Unassigned"
        }
      />

      <LeadMiniValue
        label="Profile"
        value={`${lead._contactCompleteness}%`}
      />
    </motion.article>
  );
}

function LeadMiniValue({ label, value, valueClass = "text-[#10233F]" }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
      <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
        {label}
      </p>
      <p className={`mt-1 truncate text-xs font-black ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function LeadIntegrityCard({
  icon: Icon,
  eyebrow,
  title,
  helper,
  tone = "blue",
}) {
  const tones = {
    green: "border-[#34D399] bg-[#F0FFF8]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
  };

  return (
    <div className={`rounded-[1.35rem] border-[3px] p-4 ${tones[tone]}`}>
      <div className="flex items-start gap-3">
        <Icon size={17} className="mt-0.5 shrink-0 text-[#123865]" />
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
            {eyebrow}
          </p>
          <p className="mt-1 font-black text-[#10233F]">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {helper}
          </p>
        </div>
      </div>
    </div>
  );
}

function HeroMetric({ label, value }) {
  return (
    <div
      className="min-w-0 rounded-xl border-2 border-white/30 bg-white/10 p-3"
      style={{ color: "#FFFFFF" }}
    >
      <p
        className="text-[8px] font-black uppercase tracking-[0.09em]"
        style={{ color: "#F8FAFC" }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-xl font-black"
        style={{ color: "#FFFFFF" }}
      >
        {value}
      </p>
    </div>
  );
}

function ScoreStat({ label, value, tone, helper, icon: Icon }) {
  const styles = {
    red: "border-[#FB7185] bg-[#FFF4F4]",
    orange: "border-[#F97316] bg-[#FFF4E8]",
    gold: "border-[#F59E0B] bg-[#FFF7ED]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
  };

  const iconTone = {
    red: "text-red-700",
    orange: "text-orange-700",
    gold: "text-orange-700",
    blue: "text-blue-700",
  };

  return (
    <div
      className={`min-w-0 rounded-[1.4rem] border-[3px] p-4 shadow-[0_6px_18px_rgba(15,35,63,0.05)] ${
        styles[tone] || styles.orange
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
            {label}
          </p>
          <h3 className="mt-2 text-3xl font-black text-[#10233f]">{value}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white bg-white">
          <Icon size={17} className={iconTone[tone] || "text-orange-700"} />
        </div>
      </div>
    </div>
  );
}

function OperationalCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "default",
}) {
  const dark = tone === "navy";

  const style =
    tone === "good"
      ? "border-[#34D399] bg-[#F0FFF8]"
      : tone === "warning"
      ? "border-[#F59E0B] bg-[#FFF7ED]"
      : tone === "orange"
      ? "border-[#F97316] bg-[#FFF4E8]"
      : tone === "navy"
      ? "border-[#173F6B] bg-[#173F6B]"
      : "border-[#C9D7E6] bg-[#FFFDF8]";

  return (
    <div
      className={`min-w-0 rounded-[1.35rem] border-[3px] p-4 shadow-[0_6px_18px_rgba(15,35,63,0.05)] ${style}`}
      style={{ color: dark ? "#FFFFFF" : "#10233F" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-[9px] font-black uppercase tracking-[0.1em]"
            style={{ color: dark ? "#FDBA74" : "#64748B" }}
          >
            {label}
          </p>

          <p
            className="mt-2 text-2xl font-black"
            style={{ color: dark ? "#FFFFFF" : "#10233F" }}
          >
            {value}
          </p>
        </div>

        <Icon
          size={18}
          style={{ color: dark ? "#FDBA74" : "#C2410C" }}
        />
      </div>

      <p
        className="mt-2 text-xs font-semibold leading-5"
        style={{ color: dark ? "#F8FAFC" : "#64748B" }}
      >
        {helper}
      </p>
    </div>
  );
}

function LeadDetailMetric({
  label,
  value,
  tone = "navy",
}) {
  const styles = {
    navy: "border-[#173F6B] bg-[#173F6B] text-white",
    orange: "border-[#F97316] bg-[#FFF4E8] text-orange-800",
    warning: "border-[#F59E0B] bg-[#FFF7ED] text-amber-800",
    danger: "border-[#FB7185] bg-[#FFF4F4] text-red-800",
    blue: "border-[#60A5FA] bg-[#F2F7FF] text-blue-800",
    good: "border-[#34D399] bg-[#F0FFF8] text-emerald-800",
  };

  const dark = tone === "navy";

  return (
    <div className={`min-w-0 rounded-xl border-2 p-3 ${styles[tone] || styles.navy}`}>
      <p className={`text-[8px] font-black uppercase tracking-[0.06em] ${
        dark ? "text-orange-300" : "opacity-70"
      }`}>
        {label}
      </p>
      <p className={`mt-1 break-words text-sm font-black leading-5 ${
        dark ? "text-white" : ""
      }`}>
        {value ?? "-"}
      </p>
    </div>
  );
}

function MiniMetric({ label, value, tone }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 xl:hidden">
        {label}
      </p>
      <p className={`mt-1 truncate text-sm font-black xl:mt-0 ${tone}`}>
        {value ?? "-"}
      </p>
    </div>
  );
}

function normalizeTone(tone = "") {
  const cleanTone = String(tone || "").toLowerCase();

  if (cleanTone.includes("red")) return "text-red-700";
  if (
    cleanTone.includes("orange") ||
    cleanTone.includes("yellow") ||
    cleanTone.includes("gold")
  ) {
    return "text-orange-700";
  }

  if (cleanTone.includes("green") || cleanTone.includes("emerald")) {
    return "text-emerald-700";
  }

  if (cleanTone.includes("blue") || cleanTone.includes("cyan")) {
    return "text-blue-700";
  }

  if (cleanTone.includes("purple") || cleanTone.includes("violet")) {
    return "text-violet-700";
  }

  return "text-[#10233f]";
}

export default LeadScoringAnalytics;
