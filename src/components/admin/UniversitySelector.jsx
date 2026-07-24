// UniversitySelector V4 MAX — University Recommendation Intelligence
// Purpose:
// - discover and recommend Italy-first university options
// - calculate transparent fit/readiness signals
// - avoid duplicate shortlist entries
// - add recommendations safely to student_universities
// - hand off all management, comparison and application work to UniversityManagementPanel
//
// This component intentionally does NOT create applications.

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BookOpenCheck,
  Check,
  CircleAlert,
  GraduationCap,
  Landmark,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  WalletCards,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

const REQUEST_TIMEOUT_MS = 18000;
const EVENT_TIMEOUT_MS = 9000;

const normalizeStudentType = (value) => {
  const clean = String(value || "inquiry").trim().toLowerCase();
  return clean === "appointment" ? "appointment" : "inquiry";
};

const getErrorMessage = (error, fallback) => {
  const message = String(error?.message || "").trim();
  if (!message) return fallback;
  if (/row-level security|rls/i.test(message)) return "University access was blocked by database permissions. Check the student_universities RLS policy.";
  if (/duplicate|unique|uq_student_universities_active_option/i.test(message)) return "This university, program and intake is already active in the shortlist.";
  if (/timeout|timed out/i.test(message)) return "The university request took too long. Refresh and try again.";
  return message;
};

const ITALY_FALLBACK_CATALOGUE = [
  {
    name: "University of Bologna",
    country: "Italy",
    city: "Bologna",
    type: "Public",
    strengths: ["Computer Science", "Engineering", "Business", "Social Sciences"],
    degreeLevels: ["Bachelor", "Master"],
    tuitionMin: 1500,
    tuitionMax: 4500,
    currency: "EUR",
    dsuPotential: true,
    scholarshipPotential: "Strong",
    selectivity: "High",
    englishPrograms: true,
  },
  {
    name: "University of Padua",
    country: "Italy",
    city: "Padua",
    type: "Public",
    strengths: ["Computer Science", "Engineering", "Data Science", "Psychology"],
    degreeLevels: ["Bachelor", "Master"],
    tuitionMin: 2500,
    tuitionMax: 3200,
    currency: "EUR",
    dsuPotential: true,
    scholarshipPotential: "Strong",
    selectivity: "High",
    englishPrograms: true,
  },
  {
    name: "Sapienza University of Rome",
    country: "Italy",
    city: "Rome",
    type: "Public",
    strengths: ["Computer Science", "Engineering", "Architecture", "Economics"],
    degreeLevels: ["Bachelor", "Master"],
    tuitionMin: 1000,
    tuitionMax: 3000,
    currency: "EUR",
    dsuPotential: true,
    scholarshipPotential: "Strong",
    selectivity: "Medium",
    englishPrograms: true,
  },
  {
    name: "University of Turin",
    country: "Italy",
    city: "Turin",
    type: "Public",
    strengths: ["Computer Science", "Business", "Economics", "Life Sciences"],
    degreeLevels: ["Bachelor", "Master"],
    tuitionMin: 1200,
    tuitionMax: 2800,
    currency: "EUR",
    dsuPotential: true,
    scholarshipPotential: "Strong",
    selectivity: "Medium",
    englishPrograms: true,
  },
  {
    name: "University of Milan",
    country: "Italy",
    city: "Milan",
    type: "Public",
    strengths: ["Computer Science", "Data Science", "Medicine", "Economics"],
    degreeLevels: ["Bachelor", "Master"],
    tuitionMin: 1500,
    tuitionMax: 4000,
    currency: "EUR",
    dsuPotential: true,
    scholarshipPotential: "Strong",
    selectivity: "High",
    englishPrograms: true,
  },
  {
    name: "University of Pisa",
    country: "Italy",
    city: "Pisa",
    type: "Public",
    strengths: ["Computer Science", "Engineering", "Mathematics", "Physics"],
    degreeLevels: ["Bachelor", "Master"],
    tuitionMin: 1500,
    tuitionMax: 2600,
    currency: "EUR",
    dsuPotential: true,
    scholarshipPotential: "Strong",
    selectivity: "Medium",
    englishPrograms: true,
  },
  {
    name: "University of Florence",
    country: "Italy",
    city: "Florence",
    type: "Public",
    strengths: ["Engineering", "Architecture", "Business", "Humanities"],
    degreeLevels: ["Bachelor", "Master"],
    tuitionMin: 1500,
    tuitionMax: 3200,
    currency: "EUR",
    dsuPotential: true,
    scholarshipPotential: "Strong",
    selectivity: "Medium",
    englishPrograms: true,
  },
  {
    name: "Ca' Foscari University of Venice",
    country: "Italy",
    city: "Venice",
    type: "Public",
    strengths: ["Business", "Economics", "Languages", "Data Analytics"],
    degreeLevels: ["Bachelor", "Master"],
    tuitionMin: 1800,
    tuitionMax: 2800,
    currency: "EUR",
    dsuPotential: true,
    scholarshipPotential: "Strong",
    selectivity: "Medium",
    englishPrograms: true,
  },
];

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const pretty = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatMoney = (value, currency = "EUR") => {
  if (value === null || value === undefined || value === "") return "Not set";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return `${currency} ${Number(value).toLocaleString()}`;
  }
};

function UniversitySelector({
  student = {},
  catalogue = null,
  onOpenUniversityPlanning = null,
  onShortlistChange = null,
  maxResults = 6,
}) {
  const [existingShortlist, setExistingShortlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingIds, setAddingIds] = useState(() => new Set());
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const studentId = Number(student?.id);
  const hasValidStudentId = Number.isFinite(studentId);
  const studentType = normalizeStudentType(
    student?.student_type || student?.__leadType || student?.type || "inquiry"
  );

  const preferredCountry =
    student?.country ||
    student?.preferred_country ||
    student?.country_interest ||
    "Italy";

  const preferredProgram =
    student?.program ||
    student?.field_of_interest ||
    student?.course ||
    student?.study_field ||
    "";

  const degreeLevel =
    student?.degree_level ||
    student?.study_level ||
    student?.qualification_level ||
    "";

  const preferredIntake =
    student?.intake ||
    student?.preferred_intake ||
    "";

  const budget =
    Number(
      student?.budget ||
        student?.annual_budget ||
        student?.tuition_budget ||
        0
    ) || 0;

  const sourceCatalogue = useMemo(() => {
    const provided = Array.isArray(catalogue) ? catalogue : [];

    if (!provided.length) {
      return ITALY_FALLBACK_CATALOGUE;
    }

    return provided.map((item) => ({
      name:
        item.name ||
        item.university ||
        item.university_name ||
        "Unnamed university",
      country: item.country || "Italy",
      city: item.city || item.location || "",
      type: item.type || item.institution_type || "Public",
      strengths:
        item.strengths ||
        item.subjects ||
        item.programs ||
        item.fields ||
        [],
      degreeLevels:
        item.degreeLevels ||
        item.degree_levels ||
        item.levels ||
        [],
      tuitionMin:
        item.tuitionMin ??
        item.tuition_min ??
        item.min_tuition ??
        null,
      tuitionMax:
        item.tuitionMax ??
        item.tuition_max ??
        item.max_tuition ??
        null,
      currency: item.currency || "EUR",
      dsuPotential:
        item.dsuPotential ??
        item.dsu_eligible ??
        item.dsu_available ??
        false,
      scholarshipPotential:
        item.scholarshipPotential ||
        item.scholarship_status ||
        "Unknown",
      selectivity:
        item.selectivity ||
        item.admission_difficulty ||
        "Unknown",
      englishPrograms:
        item.englishPrograms ??
        item.english_programs ??
        true,
      sourceUniversityId:
        item.id || item.source_university_id || null,
      slug: item.slug || item.university_slug || null,
    }));
  }, [catalogue]);

  const withTimeout = (promise, message = "Request timed out.", timeoutMs = REQUEST_TIMEOUT_MS) => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => window.clearTimeout(timeoutId));
  };

  const loadExistingShortlist = async () => {
    if (!hasValidStudentId) {
      setExistingShortlist([]);
      setError("A valid student ID is required before university planning can load.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: shortlistError } = await withTimeout(
        supabase
          .from("student_universities")
          .select("*")
          .eq("student_id", studentId)
          .eq("student_type", studentType)
          .order("created_at", { ascending: false }),
        "University shortlist check timed out."
      );

      if (shortlistError) throw shortlistError;
      setExistingShortlist(data || []);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Shortlist status could not be loaded."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadExistingShortlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id, studentType]);

  const studentProfileGaps = useMemo(() => {
    const gaps = [];

    if (!preferredProgram) gaps.push("Target program");
    if (!degreeLevel) gaps.push("Degree level");
    if (!preferredIntake) gaps.push("Preferred intake");
    if (!budget) gaps.push("Annual tuition budget");

    return gaps;
  }, [preferredProgram, degreeLevel, preferredIntake, budget]);

  const recommendations = useMemo(() => {
    return sourceCatalogue
      .map((university) => {
        let score = 40;
        const reasons = [];
        const warnings = [];

        const countryMatch =
          normalize(university.country) === normalize(preferredCountry);

        if (countryMatch) {
          score += 20;
          reasons.push("Matches preferred destination");
        } else if (normalize(preferredCountry) === "italy") {
          score -= 20;
          warnings.push("Outside current Italy-first destination");
        }

        const strengthText = Array.isArray(university.strengths)
          ? university.strengths.join(" ")
          : String(university.strengths || "");

        if (
          preferredProgram &&
          normalize(strengthText).includes(normalize(preferredProgram))
        ) {
          score += 25;
          reasons.push("Relevant academic strength");
        } else if (preferredProgram) {
          warnings.push("Program fit needs manual verification");
        }

        const levelText = Array.isArray(university.degreeLevels)
          ? university.degreeLevels.join(" ")
          : String(university.degreeLevels || "");

        if (
          degreeLevel &&
          normalize(levelText).includes(normalize(degreeLevel))
        ) {
          score += 10;
          reasons.push("Degree level available");
        }

        if (university.englishPrograms) {
          score += 5;
          reasons.push("English-taught options available");
        }

        if (university.dsuPotential) {
          score += 8;
          reasons.push("DSU/regional aid potential");
        }

        if (
          budget &&
          university.tuitionMin !== null &&
          university.tuitionMin !== undefined
        ) {
          if (Number(university.tuitionMin) <= budget) {
            score += 10;
            reasons.push("Minimum tuition fits budget");
          } else {
            score -= 10;
            warnings.push("Estimated tuition may exceed budget");
          }
        }

        score = Math.max(0, Math.min(100, score));

        const fitLevel =
          score >= 80
            ? "Excellent"
            : score >= 65
            ? "Strong"
            : score >= 45
            ? "Possible"
            : "Weak";

        const alreadyShortlisted = existingShortlist.find(
          (item) =>
            !item.is_archived &&
            normalize(item.university) === normalize(university.name)
        );

        const archivedMatch = existingShortlist.find(
          (item) =>
            item.is_archived &&
            normalize(item.university) === normalize(university.name)
        );

        return {
          ...university,
          score,
          fitLevel,
          reasons,
          warnings,
          alreadyShortlisted,
          archivedMatch,
        };
      })
      .filter((university) => {
        const searchText = normalize(
          [
            university.name,
            university.country,
            university.city,
            Array.isArray(university.strengths)
              ? university.strengths.join(" ")
              : university.strengths,
          ].join(" ")
        );

        return query ? searchText.includes(normalize(query)) : true;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }, [
    sourceCatalogue,
    preferredCountry,
    preferredProgram,
    degreeLevel,
    budget,
    existingShortlist,
    query,
    maxResults,
  ]);

  const addToShortlist = async (university) => {
    if (!hasValidStudentId) {
      setError("A valid student ID is required before adding a university.");
      return;
    }
    if (university.alreadyShortlisted) return;

    const operationKey =
      university.sourceUniversityId ||
      university.slug ||
      university.name;

    setAddingIds((previous) => {
      const next = new Set(previous);
      next.add(operationKey);
      return next;
    });

    setError("");
    setSuccessMessage("");

    try {
      if (university.archivedMatch?.id) {
        const { data, error: restoreError } = await withTimeout(
          supabase
            .from("student_universities")
            .update({
              is_archived: false,
              archived_at: null,
              category: categoryFromScore(university.score),
              fit_score: university.score,
              fit_level: university.fitLevel,
              fit_reasons: university.reasons,
              risk_reasons: university.warnings,
              updated_at: new Date().toISOString(),
            })
            .eq("id", university.archivedMatch.id)
            .select()
            .single(),
          "Shortlist restore timed out."
        );

        if (restoreError) throw restoreError;

        setExistingShortlist((previous) =>
          previous.map((item) => (item.id === data.id ? data : item))
        );

        setSuccessMessage(`${university.name} restored to the active shortlist.`);

        await createUniversityEvent({
          studentUniversityId: data.id,
          eventType: "university_restored_from_recommendations",
          eventLabel: "University restored from recommendations",
          newValue: university.name,
        });

        if (typeof onShortlistChange === "function") {
          try {
            await withTimeout(
              Promise.resolve(onShortlistChange({
                source: "university_selector_restore",
                university: data,
              })),
              "Parent refresh after shortlist restore timed out.",
              10000
            );
          } catch (refreshError) {
            console.warn("University restored, but parent refresh failed:", refreshError);
          }
        }

        return;
      }

      const payload = {
        student_id: studentId,
        student_type: studentType,

        university: university.name,
        country: university.country || "Italy",
        program: preferredProgram || null,
        degree_level: degreeLevel || null,
        intake: preferredIntake || null,

        category: categoryFromScore(university.score),
        status: "shortlisted",

        tuition_amount: university.tuitionMin,
        tuition_currency: university.currency || "EUR",

        scholarship_status:
          university.scholarshipPotential &&
          normalize(university.scholarshipPotential) !== "unknown"
            ? "eligible"
            : "not_checked",

        dsu_eligible: Boolean(university.dsuPotential),

        fit_score: university.score,
        fit_level: university.fitLevel,
        fit_reasons: university.reasons,

        risk_level: university.warnings.length ? "medium" : "low",
        risk_reasons: university.warnings,

        source_university_id: university.sourceUniversityId || null,
        university_slug: university.slug || null,

        next_action: preferredProgram
          ? "Verify program eligibility and admission requirements"
          : "Select target program and verify eligibility",

        notes: "Added from University Recommendation Intelligence.",
        updated_at: new Date().toISOString(),
      };

      const { data, error: insertError } = await withTimeout(
        supabase
          .from("student_universities")
          .insert(payload)
          .select()
          .single(),
        "Add to shortlist timed out."
      );

      if (insertError) throw insertError;

      setExistingShortlist((previous) => [data, ...previous]);
      setSuccessMessage(`${university.name} added to the shortlist.`);

      await createUniversityEvent({
        studentUniversityId: data.id,
        eventType: "university_added_from_recommendations",
        eventLabel: "University added from recommendations",
        newValue: university.name,
        metadata: {
          fit_score: university.score,
          fit_level: university.fitLevel,
          reasons: university.reasons,
          warnings: university.warnings,
        },
      });

      if (typeof onShortlistChange === "function") {
        try {
          await withTimeout(
            Promise.resolve(onShortlistChange({
              source: "university_selector_add",
              university: data,
            })),
            "Parent refresh after shortlist add timed out.",
            10000
          );
        } catch (refreshError) {
          console.warn("University added, but parent refresh failed:", refreshError);
        }
      }
    } catch (addError) {
      setError(getErrorMessage(addError, "University could not be added."));
    } finally {
      setAddingIds((previous) => {
        const next = new Set(previous);
        next.delete(operationKey);
        return next;
      });
    }
  };

  const createUniversityEvent = async ({
    studentUniversityId,
    eventType,
    eventLabel,
    newValue,
    metadata = {},
  }) => {
    try {
      const { error: eventError } = await withTimeout(
        supabase.from("student_university_events").insert({
          student_id: studentId,
          student_type: studentType,
          student_university_id: studentUniversityId,
          event_type: eventType,
          event_label: eventLabel,
          new_value: newValue,
          metadata,
        }),
        "University history event timed out.",
        EVENT_TIMEOUT_MS
      );
      if (eventError) console.warn("University recommendation event failed:", eventError);
    } catch (eventError) {
      console.warn("University recommendation event failed:", eventError);
    }
  };

  return (
    <section className="rounded-[1.75rem] border-[3px] border-orange-300 bg-white p-4 shadow-[0_10px_28px_rgba(15,35,63,0.05)] sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-orange-300 bg-orange-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.13em] text-orange-700">
              University Intelligence
            </span>

            <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
              {preferredCountry || "Italy"} First
            </span>
          </div>

          <h3 className="mt-2 text-xl font-black text-[#10233f]">
            Recommended University Options
          </h3>

          <p className="mt-1 max-w-3xl text-sm font-medium text-slate-600">
            Discover relevant options, understand why they match, and send the
            best choices into the full University Planning OS.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {typeof onOpenUniversityPlanning === "function" ? (
            <button
              type="button"
              onClick={onOpenUniversityPlanning}
              className="rounded-xl border-2 border-[#0b2a57] bg-[#0b2a57] px-3.5 py-2.5 text-xs font-black shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
              style={{ color: "#ffffff" }}
            >
              <span style={{ color: "#ffffff" }}>
                Open University Planning
              </span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={loadExistingShortlist}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2.5 text-xs font-black text-[#10233f] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-400 hover:bg-orange-50 hover:shadow-md disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <Feedback tone="red" onClose={() => setError("")}>
          {error}
        </Feedback>
      ) : null}

      {successMessage ? (
        <Feedback tone="green" onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Feedback>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search university, city or subject..."
            className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white pl-9 pr-3 text-sm font-semibold text-[#10233f] outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          />
        </div>

        <div className="rounded-xl border-2 border-orange-300 bg-[#fffaf4] px-4 py-2.5">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
            Active shortlist
          </p>
          <p className="mt-1 text-sm font-black text-[#10233f]">
            {existingShortlist.filter((item) => !item.is_archived).length}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <ProfileSignal label="Destination" value={preferredCountry || "Not set"} />
        <ProfileSignal label="Program" value={preferredProgram || "Not set"} />
        <ProfileSignal label="Degree" value={degreeLevel || "Not set"} />
        <ProfileSignal label="Budget" value={budget ? formatMoney(budget, "EUR") : "Not set"} />
      </div>

      {studentProfileGaps.length ? (
        <div className="mt-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0 text-amber-700"
            />

            <div>
              <p className="text-sm font-black text-amber-900">
                Matching can become more accurate
              </p>

              <p className="mt-1 text-xs font-semibold text-amber-800">
                Missing profile information: {studentProfileGaps.join(", ")}.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {loading && !recommendations.length ? (
        <div className="mt-4 flex min-h-[220px] items-center justify-center rounded-2xl border-2 border-dashed border-orange-300 bg-[#fffaf4]">
          <div className="text-center">
            <LoaderCircle
              size={28}
              className="mx-auto animate-spin text-orange-500"
            />
            <p className="mt-3 text-sm font-black text-[#10233f]">
              Loading university intelligence
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {recommendations.map((university) => {
          const operationKey =
            university.sourceUniversityId ||
            university.slug ||
            university.name;

          return (
            <RecommendationCard
              key={operationKey}
              university={university}
              adding={addingIds.has(operationKey)}
              onAdd={() => addToShortlist(university)}
            />
          );
        })}
      </div>

      {!loading && !recommendations.length ? (
        <div className="mt-4 rounded-2xl border-2 border-dashed border-orange-300 bg-[#fffaf4] p-7 text-center">
          <Landmark size={30} className="mx-auto text-orange-400" />

          <p className="mt-3 text-sm font-black text-[#10233f]">
            No matching university found
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            Clear the search or add a broader catalogue source.
          </p>
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border-2 border-slate-300 bg-slate-50 p-4">
        <p className="text-xs font-black text-[#10233f]">
          Recommendation responsibility
        </p>

        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
          Fit scores are operational guidance, not admission guarantees. Verify
          the official program, intake, deadline, tuition and entry requirements
          before moving an option into Applications.
        </p>
      </div>
    </section>
  );
}

function ProfileSignal({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-slate-200 bg-[#fffaf4] px-3 py-2.5">
      <p className="text-[9px] font-black uppercase tracking-[0.11em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-xs font-black text-[#10233f]" title={String(value)}>{value}</p>
    </div>
  );
}

function RecommendationCard({ university, adding, onAdd }) {
  const shortlisted = Boolean(university.alreadyShortlisted);
  const restorable = Boolean(university.archivedMatch) && !shortlisted;

  return (
    <article className="rounded-[1.4rem] border-2 border-slate-300 bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-[0_10px_24px_rgba(15,35,63,0.07)]">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-orange-300 bg-orange-50 text-orange-600">
          <GraduationCap size={19} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h4 className="truncate font-black text-[#10233f]">
                {university.name}
              </h4>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                {university.city || "City not set"} ·{" "}
                {university.country || "Italy"} ·{" "}
                {university.type || "University"}
              </p>
            </div>

            <FitBadge
              score={university.score}
              level={university.fitLevel}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {(Array.isArray(university.strengths)
              ? university.strengths
              : [university.strengths]
            )
              .filter(Boolean)
              .slice(0, 4)
              .map((strength) => (
                <span
                  key={strength}
                  className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[9px] font-black text-slate-700"
                >
                  {strength}
                </span>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <InfoBlock
          icon={WalletCards}
          label="Estimated Tuition"
          value={
            university.tuitionMin !== null &&
            university.tuitionMin !== undefined
              ? `${formatMoney(
                  university.tuitionMin,
                  university.currency
                )}–${formatMoney(
                  university.tuitionMax || university.tuitionMin,
                  university.currency
                )}`
              : "Verify manually"
          }
        />

        <InfoBlock
          icon={Sparkles}
          label="Scholarship"
          value={university.scholarshipPotential || "Unknown"}
        />

        <InfoBlock
          icon={ShieldCheck}
          label="DSU Potential"
          value={university.dsuPotential ? "Possible" : "Not confirmed"}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ReasonBox
          title="Why it matches"
          items={university.reasons}
          tone="green"
        />

        <ReasonBox
          title="What to verify"
          items={
            university.warnings.length
              ? university.warnings
              : ["Official program requirements and deadline"]
          }
          tone="orange"
        />
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-slate-500">
          Suggested category:{" "}
          <span className="font-black text-[#10233f]">
            {pretty(categoryFromScore(university.score))}
          </span>
        </p>

        {shortlisted ? (
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs font-black text-emerald-800"
          >
            <Check size={14} />
            Already Shortlisted
          </button>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            disabled={adding}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-orange-700 bg-orange-500 px-3.5 py-2.5 text-xs font-black text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md active:translate-y-0 disabled:opacity-50"
          >
            {adding ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : restorable ? (
              <RefreshCw size={14} />
            ) : (
              <Plus size={14} />
            )}

            {restorable ? "Restore to Shortlist" : "Add to Shortlist"}
          </button>
        )}
      </div>
    </article>
  );
}

function InfoBlock({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border-2 border-slate-200 bg-[#fffaf4] p-3">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-orange-600" />

        <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
          {label}
        </p>
      </div>

      <p className="mt-2 text-xs font-black text-[#10233f]">{value}</p>
    </div>
  );
}

function ReasonBox({ title, items, tone }) {
  const styles =
    tone === "green"
      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
      : "border-orange-300 bg-orange-50 text-orange-900";

  return (
    <div className={`rounded-xl border-2 p-3 ${styles}`}>
      <p className="text-xs font-black">{title}</p>

      <div className="mt-2 space-y-1.5">
        {items.length ? (
          items.slice(0, 3).map((item) => (
            <p
              key={item}
              className="flex items-start gap-2 text-xs font-semibold"
            >
              <BadgeCheck size={13} className="mt-0.5 shrink-0" />
              <span>{item}</span>
            </p>
          ))
        ) : (
          <p className="text-xs font-semibold">No strong signal recorded.</p>
        )}
      </div>
    </div>
  );
}

function FitBadge({ score, level }) {
  const style =
    score >= 80
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : score >= 65
      ? "border-blue-300 bg-blue-50 text-blue-800"
      : score >= 45
      ? "border-orange-300 bg-orange-50 text-orange-800"
      : "border-red-300 bg-red-50 text-red-800";

  return (
    <div className={`rounded-xl border-2 px-3 py-2 ${style}`}>
      <p className="text-sm font-black">{score}%</p>
      <p className="mt-0.5 text-[9px] font-black uppercase">{level} Fit</p>
    </div>
  );
}

function Feedback({ tone, onClose, children }) {
  const styles =
    tone === "red"
      ? "border-red-400 bg-red-50 text-red-800"
      : "border-emerald-400 bg-emerald-50 text-emerald-800";

  return (
    <div
      className={`mt-4 flex items-start gap-3 rounded-2xl border-2 p-4 text-sm font-bold ${styles}`}
    >
      <CircleAlert size={17} className="mt-0.5 shrink-0" />

      <div className="min-w-0 flex-1">{children}</div>

      <button type="button" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
}

function categoryFromScore(score) {
  if (score >= 80) return "safe";
  if (score >= 60) return "target";
  return "dream";
}

export default UniversitySelector;
