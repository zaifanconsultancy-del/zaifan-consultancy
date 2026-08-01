// ProgramTracker PARTNER OS EXTREME — Academic Planning Command
// src/components/admin/ProgramTracker.jsx
//
// Focused maximum pass for a compact academic-planning component:
// - preserves student prop and all current field fallbacks
// - safer normalization for empty / placeholder values
// - readiness score remains transparent and rules-based
// - adds readiness tier, missing-item count, and next academic action
// - adds program / intake / scholarship / tuition status cards
// - supports common alternate field names without inventing schema requirements
// - clearer "unknown vs pending vs selected" semantics
// - reduced-motion support
// - explicit navy -> white contrast protection
// - no backend writes, no fake AI, no fake scholarship/tuition data

import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  BookOpenCheck,
  CalendarRange,
  CheckCircle2,
  CircleDollarSign,
  GraduationCap,
  PiggyBank,
  Sparkles,
  Target,
} from "lucide-react";

function cleanValue(value) {
  if (value === null || value === undefined) return "";

  const text = String(value).trim();

  if (
    !text ||
    ["null", "undefined", "n/a", "na", "-", "none"].includes(
      text.toLowerCase()
    )
  ) {
    return "";
  }

  return text;
}

function firstValue(...values) {
  for (const value of values) {
    const cleaned = cleanValue(value);
    if (cleaned) return cleaned;
  }

  return "";
}

function isKnown(value, placeholders = []) {
  const clean = cleanValue(value).toLowerCase();

  if (!clean) return false;

  return !placeholders
    .map((item) => String(item).toLowerCase())
    .includes(clean);
}

function getReadinessConfig(score) {
  if (score === 100) {
    return {
      label: "Academic Plan Ready",
      tone: "good",
      text: "Core academic planning information is complete.",
    };
  }

  if (score >= 75) {
    return {
      label: "Nearly Ready",
      tone: "orange",
      text: "Only one academic planning item still needs attention.",
    };
  }

  if (score >= 50) {
    return {
      label: "Planning in Progress",
      tone: "warning",
      text: "The academic plan is partly built but still has important gaps.",
    };
  }

  return {
    label: "Planning Required",
    tone: "danger",
    text: "Program planning is still incomplete and should be reviewed before progression.",
  };
}

function ProgramTracker({ student = {} }) {
  const reduceMotion = useReducedMotion();

  const program =
    firstValue(
      student?.program,
      student?.field_of_interest,
      student?.course,
      student?.study_field,
      student?.program_name
    ) || "Not Assigned";

  const intake =
    firstValue(
      student?.intake,
      student?.preferred_intake,
      student?.intake_name,
      student?.target_intake
    ) || "Not Assigned";

  const scholarship =
    firstValue(
      student?.scholarship,
      student?.scholarship_status,
      student?.scholarship_interest
    ) || "Pending";

  const tuition =
    firstValue(
      student?.tuition,
      student?.tuition_fee,
      student?.annual_tuition,
      student?.estimated_tuition
    ) || "Not Available";

  const readinessItems = [
    {
      key: "program",
      label: "Program Selected",
      complete: isKnown(program, ["Not Assigned"]),
      icon: GraduationCap,
      value: program,
      action: "Select or confirm the student's intended program.",
    },
    {
      key: "intake",
      label: "Intake Selected",
      complete: isKnown(intake, ["Not Assigned"]),
      icon: CalendarRange,
      value: intake,
      action: "Confirm the target intake and application cycle.",
    },
    {
      key: "scholarship",
      label: "Scholarship Checked",
      complete: isKnown(scholarship, ["Pending", "Not Checked"]),
      icon: PiggyBank,
      value: scholarship,
      action: "Review realistic scholarship or funding options.",
    },
    {
      key: "tuition",
      label: "Tuition Known",
      complete: isKnown(tuition, ["Not Available", "Unknown"]),
      icon: CircleDollarSign,
      value: tuition,
      action: "Add or confirm expected tuition cost.",
    },
  ];

  const completed = readinessItems.filter((item) => item.complete).length;
  const missing = readinessItems.filter((item) => !item.complete);
  const readiness = Math.round(
    (completed / readinessItems.length) * 100
  );

  const readinessConfig = getReadinessConfig(readiness);
  const nextAction =
    missing[0]?.action ||
    "Academic planning is complete. Review the final choices before submission.";

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.24 }}
      className="min-w-0 space-y-4 rounded-[2.1rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 shadow-[0_20px_55px_rgba(18,56,101,0.13)] sm:p-4"
    >
      <div className="grid min-w-0 overflow-hidden rounded-[1.65rem] border-[3px] border-[#FF5A0A] bg-white lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
        <div
          className="min-w-0 bg-[#123865] p-5 text-white sm:p-6 lg:p-7"
          style={{ color: "#FFFFFF" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5">
            <BookOpenCheck
              size={13}
              style={{ color: "#FDBA74" }}
            />

            <p
              className="text-[9px] font-black uppercase tracking-[0.1em]"
              style={{ color: "#FFFFFF" }}
            >
              Academic Planning
            </p>
          </div>

          <h3
            className="mt-4 max-w-3xl break-words text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-4xl"
            style={{ color: "#FFFFFF" }}
          >
            Program Information
          </h3>

          <p
            className="mt-3 max-w-3xl break-words text-sm font-semibold leading-6 text-slate-100"
            style={{ color: "#F8FAFC" }}
          >
            Track the core academic decisions needed before the student moves
            deeper into university applications.
          </p>
        </div>

        <div
          className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white sm:p-6 lg:border-l-[3px] lg:border-t-0 lg:p-7"
          style={{ color: "#FFFFFF" }}
        >
          <div className="flex items-center gap-2">
            <Target size={18} />

            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
              Readiness
            </p>
          </div>

          <p className="mt-3 text-5xl font-black text-white">
            {readiness}%
          </p>

          <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
            {readinessConfig.label}
          </p>

          <p className="mt-4 text-xs font-semibold leading-5 text-white">
            {completed}/{readinessItems.length} planning items complete ·{" "}
            {missing.length} remaining.
          </p>
        </div>
      </div>

      <div className="min-w-0 rounded-[1.55rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_10px_28px_rgba(18,56,101,0.06)] sm:p-5">
        <div className="min-w-0 rounded-[1.3rem] border-[3px] border-[#123865] bg-[#FFF8EF] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.04)]">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
              Academic Readiness
            </p>

            <p className="text-xs font-black text-orange-700">
              {readiness}%
            </p>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
            <motion.div
              initial={reduceMotion ? false : { width: 0 }}
              animate={{ width: `${readiness}%` }}
              transition={{
                duration: reduceMotion ? 0 : 0.45,
              }}
              className="h-full rounded-full bg-[#FF5A0A]"
            />
          </div>

          <p className="mt-2 text-xs font-semibold text-slate-500">
            {readinessConfig.text}
          </p>
        </div>

        <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
          <InfoCard
            label="Program"
            value={program}
            icon={GraduationCap}
            ready={readinessItems[0].complete}
          />

          <InfoCard
            label="Intake"
            value={intake}
            icon={CalendarRange}
            ready={readinessItems[1].complete}
          />

          <InfoCard
            label="Scholarship"
            value={scholarship}
            icon={PiggyBank}
            ready={readinessItems[2].complete}
          />

          <InfoCard
            label="Tuition"
            value={tuition}
            icon={CircleDollarSign}
            ready={readinessItems[3].complete}
          />
        </div>

        <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
          {readinessItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.key}
                className={`min-w-0 rounded-[1.25rem] border-[3px] p-4 shadow-[0_6px_16px_rgba(18,56,101,0.04)] ${
                  item.complete
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-amber-300 bg-amber-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 bg-white ${
                      item.complete
                        ? "border-emerald-300 text-emerald-700"
                        : "border-amber-300 text-amber-800"
                    }`}
                  >
                    {item.complete ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <Icon size={16} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p
                      className={`text-sm font-black ${
                        item.complete
                          ? "text-emerald-900"
                          : "text-amber-950"
                      }`}
                    >
                      {item.complete ? "Ready" : "Pending"} — {item.label}
                    </p>

                    <p
                      className={`mt-1 break-words text-xs font-semibold leading-5 ${
                        item.complete
                          ? "text-emerald-800"
                          : "text-amber-900"
                      }`}
                    >
                      {item.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className={`mt-5 min-w-0 rounded-[1.45rem] border-[3px] p-4 shadow-[0_8px_22px_rgba(18,56,101,0.05)] ${
            missing.length
              ? "border-[#FF5A0A] bg-[#FFF4E8]"
              : "border-emerald-300 bg-emerald-50"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 bg-white ${
                missing.length
                  ? "border-[#FF5A0A] text-orange-700"
                  : "border-emerald-300 text-emerald-700"
              }`}
            >
              {missing.length ? (
                <Sparkles size={17} />
              ) : (
                <CheckCircle2 size={17} />
              )}
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
                Next Academic Action
              </p>

              <p className="mt-1 text-sm font-black leading-6 text-[#10233F]">
                {nextAction}
              </p>
            </div>
          </div>
        </div>

        {missing.length > 0 ? (
          <div className="mt-3 flex min-w-0 items-start gap-3 rounded-xl border-[3px] border-[#C9D7E6] bg-[#FFF8EF] p-4 shadow-[0_6px_16px_rgba(18,56,101,0.04)]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-700" />

            <p className="text-xs font-semibold leading-5 text-slate-600">
              Missing academic-planning information should be confirmed before
              relying on this profile for university matching or application
              decisions.
            </p>
          </div>
        ) : null}
      </div>
    </motion.section>
  );
}

function InfoCard({
  label,
  value,
  icon: Icon,
  ready,
}) {
  return (
    <div className="min-w-0 rounded-[1.3rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
            {label}
          </p>

          <p
            className="mt-2 break-words font-black text-[#10233F]"
            title={String(value || "")}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 ${
            ready
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-[#FF5A0A] bg-[#FFF4E8] text-orange-700"
          }`}
        >
          <Icon size={16} />
        </div>
      </div>
    </div>
  );
}

export default ProgramTracker;
