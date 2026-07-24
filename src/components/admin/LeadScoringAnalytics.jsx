// LeadScoringAnalytics V4 MAXIMUM — Framed Executive Lead Intelligence
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
} from "../../services/leadScoringEngine";

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
    const scores = scoredLeads.map((lead) => safeNumber(lead.score));
    const total = scoredLeads.length;

    const hot = scoredLeads.filter((lead) => lead._band === "hot").length;
    const warm = scoredLeads.filter((lead) => lead._band === "warm").length;
    const active = scoredLeads.filter((lead) => lead._band === "active").length;
    const cold = scoredLeads.filter((lead) => lead._band === "cold").length;

    const assigned = scoredLeads.filter(
      (lead) => lead.assigned_admin_id || lead.assigned_admin_name
    ).length;

    const contactReady = scoredLeads.filter(
      (lead) => lead.email || lead.phone
    ).length;

    const averageScore = total
      ? Math.round(scores.reduce((sum, value) => sum + value, 0) / total)
      : 0;

    const averageCompleteness = total
      ? Math.round(
          scoredLeads.reduce(
            (sum, lead) => sum + safeNumber(lead._contactCompleteness),
            0
          ) / total
        )
      : 0;

    return {
      total,
      hot,
      warm,
      active,
      cold,
      assigned,
      contactReady,
      averageScore,
      medianScore: median(scores),
      topScore: scores.length ? Math.max(...scores) : 0,
      assignmentRate: total ? Math.round((assigned / total) * 100) : 0,
      contactRate: total ? Math.round((contactReady / total) * 100) : 0,
      averageCompleteness,
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
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
      className={`${cardClass} min-w-0 overflow-hidden rounded-[2rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-3 shadow-[0_16px_42px_rgba(15,35,63,0.08)] sm:p-4`}
    >
      <div
        className="min-w-0 overflow-hidden rounded-[1.7rem] border-[3px] border-[#F97316] bg-[#173F6B] p-5 text-white shadow-[0_12px_30px_rgba(15,35,63,0.12)] sm:p-6"
        style={{ color: "#FFFFFF" }}
      >
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.42fr)] xl:items-start">
          <div className="min-w-0">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5">
              <Brain size={13} style={{ color: "#FDBA74" }} />
              <p
                className="text-[10px] font-black uppercase tracking-[0.12em]"
                style={{ color: "#FFFFFF" }}
              >
                Smart Lead Intelligence
              </p>
            </div>

            <h2
              className="mt-3 break-words text-3xl font-black leading-tight sm:text-4xl"
              style={{ color: "#FFFFFF" }}
            >
              Lead Scoring System
            </h2>

            <p
              className="mt-3 max-w-3xl break-words text-sm font-semibold leading-6"
              style={{ color: "#F8FAFC" }}
            >
              Ranks inquiries and appointments from cold to hot using the
              existing Zaifan scoring engine, then exposes ownership,
              completeness, and portfolio-quality signals for counselors.
            </p>
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-2">
            <HeroMetric label="Leads Scored" value={summary.total} />
            <HeroMetric label="Average Score" value={`${summary.averageScore}/100`} />
            <HeroMetric label="Top Score" value={`${summary.topScore}/100`} />
            <HeroMetric label="Median Score" value={`${summary.medianScore}/100`} />
          </div>
        </div>
      </div>

      <div className="min-w-0 bg-[#FFF8EE] px-1 pb-1 pt-5 sm:pt-6">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] gap-3">
          <ScoreStat
            label="Hot"
            value={summary.hot}
            tone="red"
            helper="80–100"
            icon={Flame}
          />
          <ScoreStat
            label="Warm"
            value={summary.warm}
            tone="orange"
            helper="60–79"
            icon={TrendingUp}
          />
          <ScoreStat
            label="Active"
            value={summary.active}
            tone="gold"
            helper="35–59"
            icon={Activity}
          />
          <ScoreStat
            label="Cold"
            value={summary.cold}
            tone="blue"
            helper="0–34"
            icon={CircleGauge}
          />
        </div>

        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-3">
          <OperationalCard
            label="Assignment Coverage"
            value={`${summary.assignmentRate}%`}
            helper={`${summary.assigned}/${summary.total} leads have an owner.`}
            icon={UserRoundCheck}
            tone={summary.assignmentRate >= 80 ? "good" : "warning"}
          />
          <OperationalCard
            label="Contact Coverage"
            value={`${summary.contactRate}%`}
            helper={`${summary.contactReady}/${summary.total} leads have email or phone.`}
            icon={ShieldCheck}
            tone={summary.contactRate >= 85 ? "good" : "warning"}
          />
          <OperationalCard
            label="Profile Completeness"
            value={`${summary.averageCompleteness}%`}
            helper="Average completeness across scoring-relevant CRM fields."
            icon={Target}
            tone="navy"
          />
          <OperationalCard
            label="Priority Pool"
            value={summary.hot + summary.warm}
            helper="Hot + warm leads worth faster counselor attention."
            icon={Crown}
            tone="orange"
          />
        </div>

        <div className="mt-5 rounded-[1.55rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-4 shadow-[0_8px_24px_rgba(15,35,63,0.05)]">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <label className="relative block">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search lead, email, phone, owner, status..."
                className="min-h-11 w-full rounded-xl border-2 border-[#B9C9D9] bg-white pl-11 pr-4 text-sm font-semibold text-[#10233f] outline-none placeholder:text-slate-400 transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <select
              value={bandFilter}
              onChange={(event) => setBandFilter(event.target.value)}
              className="min-h-11 rounded-xl border-2 border-[#B9C9D9] bg-white px-4 text-sm font-black text-[#10233f] outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
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
              className="min-h-11 rounded-xl border-2 border-[#B9C9D9] bg-white px-4 text-sm font-black text-[#10233f] outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
            >
              <option value="score">Sort: Score</option>
              <option value="completeness">Sort: Completeness</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500">
            <span>
              Showing {Math.min(topLeads.length, 20)} of {filteredLeads.length} matching lead
              {filteredLeads.length === 1 ? "" : "s"}
            </span>
            <span>Top 20 rendered for workspace performance.</span>
          </div>
        </div>

        <section className="mt-5 overflow-hidden rounded-[1.7rem] border-[3px] border-[#F97316] bg-[#FFFDF8] shadow-[0_10px_28px_rgba(15,35,63,0.06)]">
          <div className="flex flex-col gap-3 border-b-[3px] border-[#F97316]/25 bg-[#FFF7EC] p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
                Ranked Lead Portfolio
              </p>
              <h3 className="mt-1 text-xl font-black text-[#10233f]">
                Counselor Priority Ranking
              </h3>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Top scored inquiry and appointment records with ownership, priority, completeness and lead temperature.
              </p>
            </div>

            <span className="w-fit shrink-0 rounded-full border-2 border-[#F59E0B] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-orange-700">
              Top {Math.min(topLeads.length, 20)} shown
            </span>
          </div>

          <div className="space-y-3 p-4 sm:p-5">
            {topLeads.length ? (
              topLeads.map((lead, index) => {
                const label = getLeadScoreLabel(lead.score);
                const tone = getLeadScoreTone(lead.score);
                const normalizedTone = normalizeTone(tone);

                return (
                  <motion.article
                    key={lead._rowKey}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.2,
                      delay: reduceMotion ? 0 : index * 0.02,
                    }}
                    className={`min-w-0 overflow-hidden rounded-[1.45rem] border-[3px] bg-white shadow-[0_6px_18px_rgba(15,35,63,0.045)] ${
                      index === 0 ? "border-[#F97316]" : "border-[#D1DCE7]"
                    }`}
                  >
                    <div className="grid min-w-0 gap-0 2xl:grid-cols-[5.5rem_minmax(0,1fr)]">
                      <div
                        className={`flex items-center justify-center border-b-2 p-3 2xl:border-b-0 2xl:border-r-2 ${
                          index === 0
                            ? "border-[#F97316] bg-[#E96512] text-white"
                            : "border-[#E1E8EF] bg-[#FFF8EE] text-[#10233f]"
                        }`}
                      >
                        <div className="text-center">
                          <p className={`text-[8px] font-black uppercase tracking-[0.1em] ${
                            index === 0 ? "text-white" : "text-slate-500"
                          }`}>
                            Rank
                          </p>
                          <p className={`mt-1 text-2xl font-black ${
                            index === 0 ? "text-white" : "text-[#10233f]"
                          }`}>
                            #{index + 1}
                          </p>
                        </div>
                      </div>

                      <div className="min-w-0 p-4 sm:p-5">
                        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <h4 className="break-words text-base font-black leading-5 text-[#10233f] sm:text-lg">
                                {lead._name}
                              </h4>

                              <span className="rounded-full border-2 border-[#C9D7E6] bg-[#FFF9F1] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.07em] text-slate-600">
                                {lead.type}
                              </span>

                              <span className={`rounded-full border-2 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.07em] ${
                                lead._band === "hot"
                                  ? "border-[#FB7185] bg-[#FFF4F4] text-red-700"
                                  : lead._band === "warm"
                                  ? "border-[#F59E0B] bg-[#FFF7ED] text-orange-700"
                                  : lead._band === "active"
                                  ? "border-[#FCD34D] bg-[#FFFBEA] text-amber-800"
                                  : "border-[#60A5FA] bg-[#F2F7FF] text-blue-700"
                              }`}>
                                {label}
                              </span>
                            </div>

                            <p className="mt-2 break-words text-xs font-semibold leading-5 text-slate-500">
                              {lead._contact}
                            </p>
                          </div>

                          <div className={`w-fit shrink-0 rounded-xl border-2 px-4 py-2.5 ${
                            index === 0
                              ? "border-[#F97316] bg-[#FFF4E8]"
                              : "border-[#C9D7E6] bg-[#FFF9F1]"
                          }`}>
                            <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
                              Lead Score
                            </p>
                            <p className={`mt-1 text-2xl font-black ${normalizedTone}`}>
                              {lead.score}/100
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <LeadDetailMetric
                            label="Priority"
                            value={lead.priority || "low"}
                            tone="orange"
                          />
                          <LeadDetailMetric
                            label="Owner"
                            value={lead.assigned_admin_name || "Unassigned"}
                            tone={lead.assigned_admin_name ? "navy" : "warning"}
                          />
                          <LeadDetailMetric
                            label="Profile"
                            value={`${lead._contactCompleteness}%`}
                            tone="blue"
                          />
                          <LeadDetailMetric
                            label="Band"
                            value={lead._band}
                            tone={
                              lead._band === "hot"
                                ? "danger"
                                : lead._band === "warm"
                                ? "orange"
                                : lead._band === "active"
                                ? "warning"
                                : "blue"
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })
            ) : (
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[1.35rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
                <BarChart3 className="h-10 w-10 text-orange-600" />
                <h3 className="mt-3 font-black text-[#10233f]">
                  No matching scored leads
                </h3>
                <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
                  Adjust the search or score filter, or wait for CRM inquiry and appointment records to become available.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </motion.section>
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
