// StudentAnalyticsPanel V5 MAXIMUM — Resilient Persistent Intelligence
// Full replacement for: src/components/admin/StudentAnalyticsPanel.jsx
//
// Uses live Student OS data + persistent Supabase intelligence:
// - student_applications
// - student_documents
// - student_tasks
// - student_universities
// - student_ai_analysis
// - ai_student_risk_scores
//
// Design goals:
// - local intelligence always works without paid AI
// - persistent risk/opportunity snapshot when desired
// - stale-analysis detection
// - operational blockers + positive signals
// - stronger navy/orange visual rhythm
// - no parent remount / no-blink architecture
// - stale-request protection when switching students
// - shared-data authority: avoids redundant Supabase reads when parent already supplied live rows
// - partial refresh reporting instead of silently swallowing source failures
// - safer timeout cleanup
// - student_type-aware analysis history reads/writes
// - snapshot save is consistency-safe: risk upsert and history insert are reported independently
// - risk scoring distinguishes "no document plan" from "poor document readiness"
// - journey tracker no longer falsely marks Counseling when stage lookup fails

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  FileCheck2,
  GraduationCap,
  RefreshCw,
  Save,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Database,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

const REQUEST_TIMEOUT_MS = 20000;

const normalize = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const pretty = (value = "") =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const clamp = (value, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Number(value || 0)));

const safeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (value) => {
  const date = safeDate(value);
  if (!date) return "Not generated yet";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const latestTimestamp = (rows = []) =>
  rows.reduce((latest, row) => {
    const candidate =
      safeDate(row?.updated_at) ||
      safeDate(row?.created_at) ||
      safeDate(row?.submitted_at) ||
      null;

    if (!candidate) return latest;
    if (!latest || candidate > latest) return candidate;
    return latest;
  }, null);

const getErrorMessage = (error) =>
  String(error?.message || error?.details || error?.hint || "").trim();

const isMissingColumnError = (error, columnName = "") => {
  const code = String(error?.code || "");
  const message = getErrorMessage(error).toLowerCase();
  const column = String(columnName || "").toLowerCase();

  return (
    code === "42703" ||
    (message.includes("column") &&
      (!column || message.includes(column)) &&
      (message.includes("does not exist") || message.includes("schema cache")))
  );
};

const isMissingTableError = (error) => {
  const code = String(error?.code || "");
  const message = getErrorMessage(error).toLowerCase();

  return (
    code === "42P01" ||
    code === "PGRST205" ||
    (message.includes("relation") && message.includes("does not exist")) ||
    (message.includes("table") && message.includes("schema cache"))
  );
};

function StudentAnalyticsPanel({
  student = {},
  allLeads = [],
  sharedApplication = null,
  sharedDocuments = null,
  sharedTasks = null,
  sharedUniversities = null,
}) {
  const [application, setApplication] = useState(
    sharedApplication || student?.application || null
  );
  const [documents, setDocuments] = useState(
    Array.isArray(sharedDocuments) ? sharedDocuments : []
  );
  const [tasks, setTasks] = useState(
    Array.isArray(sharedTasks) ? sharedTasks : []
  );
  const [universities, setUniversities] = useState(
    Array.isArray(sharedUniversities) ? sharedUniversities : []
  );

  const [storedRisk, setStoredRisk] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);

  const [applicationLoading, setApplicationLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [universitiesLoading, setUniversitiesLoading] = useState(false);
  const [intelligenceLoading, setIntelligenceLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const mountedRef = useRef(true);
  const refreshGenerationRef = useRef(0);

  const studentId = student?.id;
  const numericStudentId = Number(studentId);
  const hasValidStudentId = Number.isFinite(numericStudentId);
  const studentType = normalize(
    student?.student_type ||
      student?.__leadType ||
      student?.type ||
      "inquiry"
  );

  const studentName =
    student?.full_name || student?.name || "Student";

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setApplication(sharedApplication || student?.application || null);

    setDocuments(
      Array.isArray(sharedDocuments)
        ? sharedDocuments
        : Array.isArray(student?.documents)
        ? student.documents
        : Array.isArray(student?.student_documents)
        ? student.student_documents
        : []
    );

    setTasks(
      Array.isArray(sharedTasks)
        ? sharedTasks
        : Array.isArray(student?.tasks)
        ? student.tasks
        : Array.isArray(student?.student_tasks)
        ? student.student_tasks
        : []
    );

    setUniversities(
      Array.isArray(sharedUniversities)
        ? sharedUniversities
        : Array.isArray(student?.universities)
        ? student.universities
        : Array.isArray(student?.student_universities)
        ? student.student_universities
        : []
    );

    setError("");
    setSuccessMessage("");

    refreshGenerationRef.current += 1;
    void refreshAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    studentId,
    studentType,
    sharedApplication?.id,
    sharedApplication?.updated_at,
    sharedDocuments?.length,
    sharedTasks?.length,
    sharedUniversities?.length,
  ]);

  const safeSet = (callback) => {
    if (mountedRef.current) callback();
  };

  const withTimeout = (promise, message = "Request timed out.") => {
    let timeoutId;

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = window.setTimeout(
        () => reject(new Error(message)),
        REQUEST_TIMEOUT_MS
      );
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
      window.clearTimeout(timeoutId);
    });
  };

  const isCurrentGeneration = (generation) =>
    mountedRef.current && refreshGenerationRef.current === generation;

  const loadApplicationOnly = async (generation) => {
    if (sharedApplication) {
      if (isCurrentGeneration(generation)) {
        setApplication(sharedApplication);
      }
      return { source: "application", ok: true, shared: true };
    }

    if (!hasValidStudentId) {
      if (isCurrentGeneration(generation)) {
        setApplication(student?.application || null);
      }
      return { source: "application", ok: true, fallback: true };
    }

    if (isCurrentGeneration(generation)) {
      setApplicationLoading(true);
    }

    try {
      const { data, error: loadError } = await withTimeout(
        supabase
          .from("student_applications")
          .select("*")
          .eq("student_id", numericStudentId)
          .eq("student_type", studentType)
          .order("updated_at", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1),
        "Application analytics loading timed out."
      );

      if (loadError) throw loadError;

      if (isCurrentGeneration(generation)) {
        setApplication(data?.[0] || student?.application || null);
      }

      return { source: "application", ok: true };
    } catch (loadError) {
      if (isCurrentGeneration(generation)) {
        setApplication(student?.application || null);
      }

      return {
        source: "application",
        ok: false,
        message: loadError?.message || "Application source failed.",
      };
    } finally {
      if (isCurrentGeneration(generation)) {
        setApplicationLoading(false);
      }
    }
  };

  const loadDocumentsOnly = async (generation) => {
    if (Array.isArray(sharedDocuments)) {
      if (isCurrentGeneration(generation)) {
        setDocuments(sharedDocuments);
      }
      return { source: "documents", ok: true, shared: true };
    }

    if (!hasValidStudentId) {
      return { source: "documents", ok: true, fallback: true };
    }

    if (isCurrentGeneration(generation)) {
      setDocumentsLoading(true);
    }

    try {
      const { data, error: loadError } = await withTimeout(
        supabase
          .from("student_documents")
          .select("*")
          .eq("student_id", numericStudentId)
          .eq("student_type", studentType)
          .order("created_at", { ascending: true }),
        "Documents analytics loading timed out."
      );

      if (loadError) throw loadError;

      if (isCurrentGeneration(generation)) {
        setDocuments(data || []);
      }

      return { source: "documents", ok: true };
    } catch (loadError) {
      if (isCurrentGeneration(generation)) {
        setDocuments(
          Array.isArray(student?.documents)
            ? student.documents
            : Array.isArray(student?.student_documents)
            ? student.student_documents
            : []
        );
      }

      return {
        source: "documents",
        ok: false,
        message: loadError?.message || "Documents source failed.",
      };
    } finally {
      if (isCurrentGeneration(generation)) {
        setDocumentsLoading(false);
      }
    }
  };

  const loadTasksOnly = async (generation) => {
    if (Array.isArray(sharedTasks)) {
      if (isCurrentGeneration(generation)) {
        setTasks(sharedTasks);
      }
      return { source: "tasks", ok: true, shared: true };
    }

    if (!hasValidStudentId) {
      return { source: "tasks", ok: true, fallback: true };
    }

    if (isCurrentGeneration(generation)) {
      setTasksLoading(true);
    }

    try {
      const { data, error: loadError } = await withTimeout(
        supabase
          .from("student_tasks")
          .select("*")
          .eq("student_id", numericStudentId)
          .eq("student_type", studentType)
          .order("created_at", { ascending: false })
          .limit(500),
        "Tasks analytics loading timed out."
      );

      if (loadError) throw loadError;

      if (isCurrentGeneration(generation)) {
        setTasks(data || []);
      }

      return { source: "tasks", ok: true };
    } catch (loadError) {
      if (isCurrentGeneration(generation)) {
        setTasks(
          Array.isArray(student?.tasks)
            ? student.tasks
            : Array.isArray(student?.student_tasks)
            ? student.student_tasks
            : []
        );
      }

      return {
        source: "tasks",
        ok: false,
        message: loadError?.message || "Tasks source failed.",
      };
    } finally {
      if (isCurrentGeneration(generation)) {
        setTasksLoading(false);
      }
    }
  };

  const loadUniversitiesOnly = async (generation) => {
    if (Array.isArray(sharedUniversities)) {
      if (isCurrentGeneration(generation)) {
        setUniversities(sharedUniversities);
      }
      return { source: "universities", ok: true, shared: true };
    }

    if (!hasValidStudentId) {
      return { source: "universities", ok: true, fallback: true };
    }

    if (isCurrentGeneration(generation)) {
      setUniversitiesLoading(true);
    }

    try {
      const { data, error: loadError } = await withTimeout(
        supabase
          .from("student_universities")
          .select("*")
          .eq("student_id", numericStudentId)
          .eq("student_type", studentType)
          .order("created_at", { ascending: false })
          .limit(200),
        "Universities analytics loading timed out."
      );

      if (loadError) throw loadError;

      if (isCurrentGeneration(generation)) {
        setUniversities(data || []);
      }

      return { source: "universities", ok: true };
    } catch (loadError) {
      if (isCurrentGeneration(generation)) {
        setUniversities(
          Array.isArray(student?.universities)
            ? student.universities
            : Array.isArray(student?.student_universities)
            ? student.student_universities
            : []
        );
      }

      return {
        source: "universities",
        ok: false,
        message: loadError?.message || "Universities source failed.",
      };
    } finally {
      if (isCurrentGeneration(generation)) {
        setUniversitiesLoading(false);
      }
    }
  };

  const loadStoredIntelligence = async (generation) => {
    if (!hasValidStudentId) {
      if (isCurrentGeneration(generation)) {
        setStoredRisk(null);
        setAnalysisHistory([]);
      }

      return {
        source: "intelligence",
        ok: true,
        fallback: true,
        failures: [],
      };
    }

    if (isCurrentGeneration(generation)) {
      setIntelligenceLoading(true);
    }

    const loadRiskSnapshot = async () => {
      const runQuery = async ({ includeStudentType }) => {
        let query = supabase
          .from("ai_student_risk_scores")
          .select("*")
          .eq("student_id", String(studentId));

        if (includeStudentType) {
          query = query.eq("student_type", studentType);
        }

        // Avoid maybeSingle() because legacy/duplicate rows should not crash
        // the whole intelligence workspace.
        return withTimeout(
          query
            .order("generated_at", { ascending: false })
            .limit(1),
          "Stored student risk loading timed out."
        );
      };

      let result = await runQuery({ includeStudentType: true });

      if (
        result?.error &&
        isMissingColumnError(result.error, "student_type")
      ) {
        result = await runQuery({ includeStudentType: false });
      }

      if (result?.error) {
        throw result.error;
      }

      return Array.isArray(result?.data) ? result.data[0] || null : null;
    };

    const loadAnalysisHistory = async () => {
      const runQuery = async ({ includeStudentType }) => {
        let query = supabase
          .from("student_ai_analysis")
          .select("*")
          .eq("student_id", numericStudentId);

        if (includeStudentType) {
          query = query.eq("student_type", studentType);
        }

        return withTimeout(
          query
            .order("created_at", { ascending: false })
            .limit(8),
          "Student analysis history loading timed out."
        );
      };

      let result = await runQuery({ includeStudentType: true });

      if (
        result?.error &&
        isMissingColumnError(result.error, "student_type")
      ) {
        result = await runQuery({ includeStudentType: false });
      }

      if (result?.error) {
        throw result.error;
      }

      return Array.isArray(result?.data) ? result.data : [];
    };

    try {
      const [riskResult, historyResult] = await Promise.allSettled([
        loadRiskSnapshot(),
        loadAnalysisHistory(),
      ]);

      if (!isCurrentGeneration(generation)) {
        return {
          source: "intelligence",
          ok: true,
          stale: true,
          failures: [],
        };
      }

      const failures = [];

      if (riskResult.status === "fulfilled") {
        setStoredRisk(riskResult.value || null);
      } else {
        const riskError = riskResult.reason;
        console.warn("Stored risk snapshot load failed:", riskError);

        // Preserve an already loaded snapshot rather than blanking it because
        // a refresh failed.
        failures.push({
          source: "Risk Snapshot",
          message:
            getErrorMessage(riskError) ||
            "Stored risk snapshot could not be loaded.",
          optionalMissingTable: isMissingTableError(riskError),
        });
      }

      if (historyResult.status === "fulfilled") {
        setAnalysisHistory(historyResult.value || []);
      } else {
        const historyError = historyResult.reason;
        console.warn("Student analysis history load failed:", historyError);

        // Preserve already loaded history when refresh fails.
        failures.push({
          source: "Analysis History",
          message:
            getErrorMessage(historyError) ||
            "Student analysis history could not be loaded.",
          optionalMissingTable: isMissingTableError(historyError),
        });
      }

      return {
        source: "intelligence",
        ok: failures.length === 0,
        partial: failures.length === 1,
        failures,
        message: failures
          .map((failure) => `${failure.source}: ${failure.message}`)
          .join(" | "),
      };
    } finally {
      if (isCurrentGeneration(generation)) {
        setIntelligenceLoading(false);
      }
    }
  };

  const refreshAnalytics = async () => {
    const generation = refreshGenerationRef.current + 1;
    refreshGenerationRef.current = generation;

    if (mountedRef.current) {
      setRefreshing(true);
      setError("");
      setSuccessMessage("");
    }

    const results = await Promise.all([
      loadApplicationOnly(generation),
      loadDocumentsOnly(generation),
      loadTasksOnly(generation),
      loadUniversitiesOnly(generation),
      loadStoredIntelligence(generation),
    ]);

    if (!isCurrentGeneration(generation)) return;

    const failed = results.filter((result) => !result?.ok);

    if (failed.length) {
      const failureLabels = failed.flatMap((result) => {
        if (Array.isArray(result?.failures) && result.failures.length) {
          return result.failures.map((failure) => failure.source);
        }

        return [pretty(result.source)];
      });

      setError(
        `Some analytics sources could not refresh: ${failureLabels.join(
          ", "
        )}. Live/local intelligence is still available, and any previously loaded stored data has been preserved.`
      );
    }

    setRefreshing(false);
  };

  const analytics = useMemo(() => {
    const app = application || {};

    const activeDocuments = documents.filter((doc) => {
      const status = normalize(doc?.status);
      return status !== "archived" && status !== "deleted";
    });

    const receivedDocs = activeDocuments.filter((doc) =>
      ["received", "verified", "approved"].includes(normalize(doc.status))
    ).length;

    const verifiedDocs = activeDocuments.filter((doc) =>
      ["verified", "approved"].includes(normalize(doc.status))
    ).length;

    const rejectedDocs = activeDocuments.filter(
      (doc) => normalize(doc.status) === "rejected"
    ).length;

    const missingDocs = activeDocuments.filter(
      (doc) => normalize(doc.status) === "missing"
    ).length;

    // More truthful than dividing by a permanent hard-coded number.
    // When document rows exist, readiness is based on the actual current document plan.
    // When no document rows exist, readiness is 0 rather than a fabricated percentage.
    const documentReadiness = activeDocuments.length
      ? Math.round((receivedDocs / activeDocuments.length) * 100)
      : 0;

    const applicationSignals = [
      app.country || student.country || student.preferred_country,
      app.university || student.university,
      app.program || student.program || student.field_of_interest,
      app.intake || student.intake,
      app.application_status &&
        !["", "not_started", "planning"].includes(
          normalize(app.application_status)
        ),
      app.offer_status &&
        !["", "pending", "not_started"].includes(normalize(app.offer_status)),
      app.visa_status &&
        !["", "not_started"].includes(normalize(app.visa_status)),
    ];

    const applicationReadiness = Math.round(
      (applicationSignals.filter(Boolean).length / applicationSignals.length) *
        100
    );

    const activeTasks = tasks.filter((task) => !task?.is_archived);

    const completedTasks = activeTasks.filter(
      (task) => normalize(task.status) === "completed"
    ).length;

    const pendingTasks = activeTasks.filter((task) =>
      ["pending", "in_progress", "blocked"].includes(normalize(task.status))
    ).length;

    const blockedTasks = activeTasks.filter(
      (task) => normalize(task.status) === "blocked"
    ).length;

    const overdueTasks = activeTasks.filter((task) => {
      if (
        !task?.due_date ||
        ["completed", "cancelled"].includes(normalize(task.status))
      ) {
        return false;
      }

      const due = safeDate(task.due_date);
      return due ? due < new Date() : false;
    }).length;

    const taskCompletion = activeTasks.length
      ? Math.round((completedTasks / activeTasks.length) * 100)
      : 0;

    const activeUniversities = universities.filter(
      (university) => !university?.is_archived
    );

    const categoryCounts = activeUniversities.reduce(
      (acc, university) => {
        const category = normalize(university.category || "target");
        if (["dream", "target", "safe"].includes(category)) {
          acc[category] += 1;
        }
        return acc;
      },
      { dream: 0, target: 0, safe: 0 }
    );

    const hasBalancedUniversityPlan =
      categoryCounts.target > 0 &&
      (categoryCounts.dream > 0 || categoryCounts.safe > 0);

    const applicationStatus =
      normalize(app.application_status || student.application_status) ||
      "not_started";

    const offerStatus =
      normalize(app.offer_status || student.offer_status) || "pending";

    const visaStatus =
      normalize(app.visa_status || student.visa_status) || "not_started";

    const priority = normalize(student.priority || "medium");

    const journeyStage =
      ["visa_approved", "approved"].includes(visaStatus)
        ? "Visa Approved"
        : !["", "not_started", "pending"].includes(visaStatus)
        ? "Visa Processing"
        : ["offer_received", "offer_accepted", "accepted"].includes(offerStatus)
        ? "Offer Stage"
        : !["", "not_started", "planning"].includes(applicationStatus)
        ? "Application Stage"
        : activeDocuments.length > 0
        ? "Documents Stage"
        : activeUniversities.length > 0
        ? "University Planning"
        : "Counseling Stage";

    let riskScore = 0;

    riskScore += Math.min(overdueTasks * 12, 36);
    riskScore += Math.min(blockedTasks * 8, 24);
    riskScore +=
      activeDocuments.length === 0
        ? 14
        : documentReadiness < 40
        ? 22
        : documentReadiness < 65
        ? 12
        : 0;
    riskScore +=
      applicationReadiness < 40 ? 18 : applicationReadiness < 65 ? 8 : 0;
    riskScore += activeUniversities.length === 0 ? 10 : 0;
    riskScore += rejectedDocs > 0 ? Math.min(rejectedDocs * 5, 15) : 0;
    riskScore += ["vip", "critical", "urgent", "high"].includes(priority) ? 5 : 0;
    riskScore = clamp(riskScore);

    let opportunityScore = 20;
    opportunityScore += Math.round(documentReadiness * 0.2);
    opportunityScore += Math.round(applicationReadiness * 0.25);
    opportunityScore += Math.round(taskCompletion * 0.15);
    opportunityScore += activeUniversities.length > 0 ? 10 : 0;
    opportunityScore += hasBalancedUniversityPlan ? 8 : 0;
    opportunityScore +=
      ["offer_received", "offer_accepted", "accepted"].includes(offerStatus)
        ? 12
        : 0;
    opportunityScore +=
      !["", "not_started", "pending"].includes(visaStatus) ? 10 : 0;
    opportunityScore = clamp(opportunityScore);

    const healthScore = clamp(
      Math.round(
        100 -
          riskScore * 0.55 +
          opportunityScore * 0.25 +
          taskCompletion * 0.15
      )
    );

    const riskLevel =
      riskScore >= 70
        ? "High Risk"
        : riskScore >= 40
        ? "Medium Risk"
        : "Stable";

    const riskFactors = [];

    if (activeDocuments.length === 0) {
      riskFactors.push({
        title: "No document plan",
        severity: "medium",
        action: "Create the student's required document checklist before measuring readiness.",
      });
    } else if (documentReadiness < 50) {
      riskFactors.push({
        title: "Low document readiness",
        severity: "high",
        action: "Collect or verify missing documents.",
      });
    }

    if (applicationReadiness < 60) {
      riskFactors.push({
        title: "Incomplete application",
        severity: "medium",
        action: "Complete the application workspace and missing fields.",
      });
    }

    if (overdueTasks > 0) {
      riskFactors.push({
        title: `${overdueTasks} overdue task${overdueTasks === 1 ? "" : "s"}`,
        severity: "high",
        action: "Clear overdue operational work before deadlines slip.",
      });
    }

    if (blockedTasks > 0) {
      riskFactors.push({
        title: `${blockedTasks} blocked task${blockedTasks === 1 ? "" : "s"}`,
        severity: "high",
        action: "Resolve the blocker or reassign the task.",
      });
    }

    if (rejectedDocs > 0) {
      riskFactors.push({
        title: `${rejectedDocs} rejected document${rejectedDocs === 1 ? "" : "s"}`,
        severity: "high",
        action: "Replace rejected documents and re-verify them.",
      });
    }

    if (activeUniversities.length === 0) {
      riskFactors.push({
        title: "No university plan",
        severity: "medium",
        action: "Build a university shortlist before application work expands.",
      });
    }

    if (
      activeUniversities.length > 1 &&
      !hasBalancedUniversityPlan
    ) {
      riskFactors.push({
        title: "University plan is not balanced",
        severity: "medium",
        action: "Balance dream, target and safe options.",
      });
    }

    const positives = [];

    if (documentReadiness >= 80) {
      positives.push("Document file is strongly prepared.");
    }

    if (applicationReadiness >= 75) {
      positives.push("Application profile is highly complete.");
    }

    if (taskCompletion >= 70 && overdueTasks === 0) {
      positives.push("Operational task execution is healthy.");
    }

    if (hasBalancedUniversityPlan) {
      positives.push("University shortlist has useful category balance.");
    }

    if (["offer_received", "offer_accepted", "accepted"].includes(offerStatus)) {
      positives.push("An offer-stage signal is already present.");
    }

    if (["visa_approved", "approved"].includes(visaStatus)) {
      positives.push("Visa is approved.");
    }

    const nextAction =
      overdueTasks > 0
        ? "Clear overdue counselor tasks first"
        : blockedTasks > 0
        ? "Resolve blocked tasks"
        : rejectedDocs > 0
        ? "Replace rejected documents"
        : activeDocuments.length === 0
        ? "Create the required document plan"
        : documentReadiness < 50
        ? "Collect and verify missing documents"
        : activeUniversities.length === 0
        ? "Build the university shortlist"
        : !hasBalancedUniversityPlan && activeUniversities.length > 1
        ? "Balance the university shortlist"
        : applicationReadiness < 60
        ? "Complete application information"
        : journeyStage === "Offer Stage"
        ? "Prepare the visa workflow"
        : journeyStage === "Visa Processing"
        ? "Protect visa deadlines and requirements"
        : "Continue the current student journey";

    const studentCountry =
      student.country ||
      student.preferred_country ||
      student.country_interest ||
      "";

    const similarCountryLeads = allLeads.filter((lead) => {
      const leadCountry =
        lead.country ||
        lead.preferred_country ||
        lead.country_interest ||
        "";

      return (
        studentCountry &&
        normalize(leadCountry) === normalize(studentCountry)
      );
    }).length;

    const latestLiveUpdate = [
      safeDate(app.updated_at) || safeDate(app.created_at),
      latestTimestamp(activeDocuments),
      latestTimestamp(activeTasks),
      latestTimestamp(activeUniversities),
    ]
      .filter(Boolean)
      .sort((a, b) => b - a)[0] || null;

    const storedGeneratedAt = safeDate(storedRisk?.generated_at);

    const storedIsStale =
      Boolean(storedRisk) &&
      Boolean(latestLiveUpdate) &&
      (!storedGeneratedAt || latestLiveUpdate > storedGeneratedAt);

    const daysSinceStored = storedGeneratedAt
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - storedGeneratedAt.getTime()) / (24 * 60 * 60 * 1000)
          )
        )
      : null;

    return {
      applicationStatus,
      offerStatus,
      visaStatus,
      documentReadiness,
      applicationReadiness,
      taskCompletion,
      healthScore,
      riskScore,
      riskLevel,
      opportunityScore,
      riskFactors,
      positives,
      nextAction,
      receivedDocs,
      verifiedDocs,
      rejectedDocs,
      missingDocs,
      totalDocs: activeDocuments.length,
      totalTasks: activeTasks.length,
      completedTasks,
      pendingTasks,
      blockedTasks,
      overdueTasks,
      universitiesCount: activeUniversities.length,
      categoryCounts,
      hasBalancedUniversityPlan,
      journeyStage,
      similarCountryLeads,
      latestLiveUpdate,
      storedIsStale,
      daysSinceStored,
    };
  }, [
    student,
    allLeads,
    application,
    documents,
    tasks,
    universities,
    storedRisk,
  ]);

  const snapshotSummary = useMemo(() => {
    const blockers = analytics.riskFactors.map((item) => item.title);

    return [
      `${studentName} is currently in ${analytics.journeyStage}.`,
      `Local risk score is ${analytics.riskScore}/100 (${analytics.riskLevel}).`,
      `Opportunity score is ${analytics.opportunityScore}/100.`,
      `Document readiness is ${analytics.documentReadiness}%.`,
      `Application readiness is ${analytics.applicationReadiness}%.`,
      `Task completion is ${analytics.taskCompletion}%.`,
      blockers.length
        ? `Current blockers: ${blockers.join(", ")}.`
        : "No major operational blockers are detected.",
      `Recommended next action: ${analytics.nextAction}.`,
    ].join(" ");
  }, [analytics, studentName]);

  const saveIntelligenceSnapshot = async () => {
    if (!hasValidStudentId || savingSnapshot) return;

    setSavingSnapshot(true);
    setError("");
    setSuccessMessage("");

    try {
      const now = new Date().toISOString();

      const riskPayload = {
        student_id: String(studentId),
        student_type: studentType,
        risk_score: analytics.riskScore,
        risk_level: analytics.riskLevel,
        opportunity_score: analytics.opportunityScore,
        priority_level: normalize(student.priority || "medium"),
        summary_text: snapshotSummary,
        generated_at: now,
        executive_category:
          analytics.riskScore >= 70
            ? "critical_attention"
            : analytics.opportunityScore >= 75
            ? "high_opportunity"
            : analytics.riskScore >= 40
            ? "monitor"
            : "stable",
        student_name: studentName,
        application_status: analytics.applicationStatus,
        offer_status: analytics.offerStatus,
        visa_status: analytics.visaStatus,
        document_status:
          analytics.documentReadiness >= 80
            ? "ready"
            : analytics.documentReadiness >= 50
            ? "in_progress"
            : "needs_attention",
        document_readiness_percent: analytics.documentReadiness,
        task_completion_percent: analytics.taskCompletion,
        pending_tasks_count: analytics.pendingTasks,
        overdue_tasks_count: analytics.overdueTasks,
        university_plan_count: analytics.universitiesCount,
        has_balanced_university_plan: analytics.hasBalancedUniversityPlan,
        days_since_updated: 0,
      };

      const analysisPayload = {
        student_id: numericStudentId,
        student_type: studentType,
        analysis_type: "local_student_intelligence",
        analysis_text: snapshotSummary,
        risk_level: analytics.riskLevel,
        score: analytics.riskScore,
      };

      const saveRiskSnapshot = async () => {
        let result = await withTimeout(
          supabase
            .from("ai_student_risk_scores")
            .upsert(riskPayload, {
              onConflict: "student_id,student_type",
            })
            .select("*")
            .single(),
          "Risk snapshot save timed out."
        );

        if (
          result?.error &&
          isMissingColumnError(result.error, "student_type")
        ) {
          const legacyPayload = { ...riskPayload };
          delete legacyPayload.student_type;

          result = await withTimeout(
            supabase
              .from("ai_student_risk_scores")
              .upsert(legacyPayload, {
                onConflict: "student_id",
              })
              .select("*")
              .single(),
            "Risk snapshot save timed out."
          );
        }

        if (result?.error) throw result.error;
        return result;
      };

      const saveAnalysisHistory = async () => {
        let result = await withTimeout(
          supabase
            .from("student_ai_analysis")
            .insert(analysisPayload)
            .select("*")
            .single(),
          "Analysis history save timed out."
        );

        if (
          result?.error &&
          isMissingColumnError(result.error, "student_type")
        ) {
          const legacyPayload = { ...analysisPayload };
          delete legacyPayload.student_type;

          result = await withTimeout(
            supabase
              .from("student_ai_analysis")
              .insert(legacyPayload)
              .select("*")
              .single(),
            "Analysis history save timed out."
          );
        }

        if (result?.error) throw result.error;
        return result;
      };

      const [riskResult, historyResult] = await Promise.allSettled([
        saveRiskSnapshot(),
        saveAnalysisHistory(),
      ]);

      const riskSave =
        riskResult.status === "fulfilled" ? riskResult.value : null;
      const historySave =
        historyResult.status === "fulfilled" ? historyResult.value : null;

      const riskError =
        riskResult.status === "rejected"
          ? riskResult.reason
          : riskSave?.error || null;

      const historyError =
        historyResult.status === "rejected"
          ? historyResult.reason
          : historySave?.error || null;

      if (riskSave?.data) {
        safeSet(() => setStoredRisk(riskSave.data));
      }

      if (historySave?.data) {
        safeSet(() => {
          setAnalysisHistory((previous) =>
            [historySave.data, ...previous].filter(Boolean).slice(0, 8)
          );
        });
      }

      if (riskError && historyError) {
        throw new Error(
          riskError?.message ||
            historyError?.message ||
            "Both intelligence snapshot writes failed."
        );
      }

      if (riskError || historyError) {
        safeSet(() => {
          setError(
            riskError
              ? "Analysis history was saved, but the current risk snapshot could not be updated."
              : "The current risk snapshot was saved, but analysis history could not be appended."
          );
        });
      } else {
        safeSet(() => {
          setSuccessMessage(
            "Student intelligence snapshot and analysis history saved to Supabase."
          );
        });
      }
    } catch (saveError) {
      console.error("Student intelligence snapshot save failed:", saveError);
      safeSet(() => {
        setError(
          saveError?.message ||
            "Student intelligence snapshot could not be saved."
        );
      });
    } finally {
      safeSet(() => setSavingSnapshot(false));
    }
  };

  const isLoading =
    applicationLoading ||
    documentsLoading ||
    tasksLoading ||
    universitiesLoading ||
    intelligenceLoading;

  const storedRiskScore =
    storedRisk?.risk_score ?? null;
  const storedOpportunityScore =
    storedRisk?.opportunity_score ?? null;

  return (
    <div className="space-y-5 pb-8 text-[#10233f]">
      <section className="overflow-hidden rounded-[1.85rem] border-[3px] border-orange-400 bg-white shadow-[0_16px_45px_rgba(15,35,63,0.08)]">
        <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
          <div className="bg-[#123865] p-6 text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
              Student Intelligence OS
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Journey, Risk & Opportunity Center
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
              Live Student OS data is analyzed locally first. Stored Supabase
              intelligence adds history and executive context without making
              paid GPT a requirement.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={refreshAnalytics}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white/25 bg-white px-4 py-2.5 text-xs font-black text-[#123865] shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={refreshing ? "animate-spin" : ""}
                />
                {refreshing ? "Refreshing..." : "Refresh Intelligence"}
              </button>

              <button
                type="button"
                onClick={saveIntelligenceSnapshot}
                disabled={savingSnapshot || isLoading}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-orange-300 bg-orange-500 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:opacity-50"
              >
                <Save size={14} />
                {savingSnapshot ? "Saving..." : "Save Intelligence Snapshot"}
              </button>
            </div>
          </div>

          <div className="bg-orange-500 p-6 text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-100">
              Next Best Action
            </p>

            <h3 className="mt-2 text-xl font-black text-white">
              {analytics.nextAction}
            </h3>

            <p className="mt-3 text-sm leading-6 text-orange-50">
              Local rules prioritize overdue work, blockers, document readiness,
              university planning and application progress.
            </p>

            <div className="mt-5 rounded-2xl border border-white/25 bg-white/10 p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-orange-100">
                Journey
              </p>
              <p className="mt-1 text-lg font-black text-white">
                {analytics.journeyStage}
              </p>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <Feedback
          tone={
            error.includes("Risk Snapshot") || error.includes("Analysis History")
              ? "warning"
              : "error"
          }
          onClose={() => setError("")}
        >
          {error}
        </Feedback>
      ) : null}

      {successMessage ? (
        <Feedback tone="success" onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Feedback>
      ) : null}

      {!hasValidStudentId ? (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-900">
          This student does not have a valid numeric Student OS ID. Live local
          analysis can use supplied data, but persistent Supabase intelligence
          cannot be loaded or saved until the record ID is valid.
        </div>
      ) : null}

      {(isLoading || refreshing) && (
        <div className="rounded-2xl border-2 border-blue-300 bg-blue-50 p-4 text-sm font-bold text-blue-800">
          Refreshing student intelligence sources…
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Health Score"
          value={`${analytics.healthScore}%`}
          icon={CheckCircle2}
          tone="navy"
        />
        <MetricCard
          label="Risk Score"
          value={`${analytics.riskScore}/100`}
          icon={ShieldAlert}
          tone={analytics.riskScore >= 70 ? "red" : "orange"}
        />
        <MetricCard
          label="Opportunity"
          value={`${analytics.opportunityScore}/100`}
          icon={TrendingUp}
          tone="green"
        />
        <MetricCard
          label="Journey Stage"
          value={analytics.journeyStage}
          icon={Target}
          tone="orange"
          small
        />
      </div>

      <section className="rounded-[1.7rem] border-[3px] border-orange-300 bg-white p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">
              Persistent Intelligence
            </p>
            <h3 className="mt-1 text-lg font-black text-[#10233f]">
              Stored vs Live Student Snapshot
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Stored intelligence is useful for history and executive reporting,
              while the live engine protects you from trusting stale scores.
            </p>
          </div>

          <StatusPill
            tone={
              !storedRisk
                ? "slate"
                : analytics.storedIsStale
                ? "orange"
                : "green"
            }
            text={
              !storedRisk
                ? "No stored snapshot"
                : analytics.storedIsStale
                ? "Stored snapshot is stale"
                : "Stored snapshot is current"
            }
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InfoTile
            label="Stored Risk"
            value={
              storedRiskScore === null
                ? "Not saved"
                : `${storedRiskScore}/100`
            }
          />
          <InfoTile
            label="Stored Opportunity"
            value={
              storedOpportunityScore === null
                ? "Not saved"
                : `${storedOpportunityScore}/100`
            }
          />
          <InfoTile
            label="Generated"
            value={formatDateTime(storedRisk?.generated_at)}
          />
          <InfoTile
            label="Age"
            value={
              analytics.daysSinceStored === null
                ? "—"
                : `${analytics.daysSinceStored} day${
                    analytics.daysSinceStored === 1 ? "" : "s"
                  }`
            }
          />
        </div>
      </section>

      <section className="rounded-[1.7rem] border-[3px] border-orange-300 bg-[#fff8ee] p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">
          Student Journey Tracker
        </p>

        <JourneyTracker stage={analytics.journeyStage} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[1.7rem] border-[3px] border-red-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-700">
                Risk Engine
              </p>
              <h3 className="mt-1 text-lg font-black text-[#10233f]">
                Operational Blockers
              </h3>
            </div>

            <StatusPill
              tone={
                analytics.riskFactors.some(
                  (risk) => risk.severity === "high"
                )
                  ? "red"
                  : analytics.riskFactors.length
                  ? "orange"
                  : "green"
              }
              text={
                analytics.riskFactors.length
                  ? `${analytics.riskFactors.length} signal${
                      analytics.riskFactors.length === 1 ? "" : "s"
                    }`
                  : "Stable"
              }
            />
          </div>

          <div className="mt-4 space-y-3">
            {analytics.riskFactors.length ? (
              analytics.riskFactors.map((risk) => (
                <RiskRow key={risk.title} risk={risk} />
              ))
            ) : (
              <PositiveEmpty text="No major operational blocker is detected." />
            )}
          </div>
        </section>

        <section className="rounded-[1.7rem] border-[3px] border-[#123865] bg-[#123865] p-5 text-white">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-orange-300" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
              Positive Signals
            </p>
          </div>

          <h3 className="mt-2 text-lg font-black text-white">
            What is going well?
          </h3>

          <div className="mt-4 space-y-3">
            {analytics.positives.length ? (
              analytics.positives.map((text) => (
                <div
                  key={text}
                  className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm font-semibold leading-6 text-white"
                >
                  {text}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm font-semibold text-slate-200">
                Positive signals will appear as documents, tasks,
                applications and university planning improve.
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ProgressCard
          title="Document Readiness"
          value={analytics.documentReadiness}
          footer={`${analytics.receivedDocs}/${analytics.totalDocs || 0} received · ${analytics.verifiedDocs} verified · ${analytics.rejectedDocs} rejected`}
        />

        <ProgressCard
          title="Application Readiness"
          value={analytics.applicationReadiness}
          footer="Country, university, program, intake, application, offer and visa signals"
        />

        <ProgressCard
          title="Task Completion"
          value={analytics.taskCompletion}
          footer={`${analytics.completedTasks}/${analytics.totalTasks} completed · ${analytics.pendingTasks} open · ${analytics.overdueTasks} overdue`}
          danger={analytics.overdueTasks > 0}
        />
      </div>

      <section className="rounded-[1.7rem] border-[3px] border-orange-300 bg-white p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoTile
            label="Universities"
            value={analytics.universitiesCount}
            icon={GraduationCap}
          />
          <InfoTile
            label="Dream / Target / Safe"
            value={`${analytics.categoryCounts.dream} / ${analytics.categoryCounts.target} / ${analytics.categoryCounts.safe}`}
          />
          <InfoTile
            label="Plan Balance"
            value={
              analytics.hasBalancedUniversityPlan ? "Balanced" : "Needs work"
            }
          />
          <InfoTile
            label="Similar Country Leads"
            value={analytics.similarCountryLeads}
          />
        </div>
      </section>

      <section className="rounded-[1.7rem] border-[3px] border-slate-300 bg-white p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-orange-300 bg-orange-50 text-orange-700">
            <Database size={18} />
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">
              Intelligence Data Contract
            </p>

            <h3 className="mt-1 text-lg font-black text-[#10233f]">
              What this panel is using
            </h3>

            <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
              Parent-supplied Student OS data is treated as authoritative when
              provided. Missing shared sources are fetched directly from
              Supabase. Stored risk/history remains separate from live scoring.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <SourceTile
            label="Application"
            value={sharedApplication ? "Shared live data" : "Supabase / fallback"}
          />
          <SourceTile
            label="Documents"
            value={Array.isArray(sharedDocuments) ? "Shared live data" : "Supabase / fallback"}
          />
          <SourceTile
            label="Tasks"
            value={Array.isArray(sharedTasks) ? "Shared live data" : "Supabase / fallback"}
          />
          <SourceTile
            label="Universities"
            value={Array.isArray(sharedUniversities) ? "Shared live data" : "Supabase / fallback"}
          />
          <SourceTile
            label="Stored Intelligence"
            value={storedRisk ? "Persistent snapshot" : "No saved snapshot"}
          />
        </div>
      </section>

      <section className="rounded-[1.7rem] border-[3px] border-orange-300 bg-[#fff8ee] p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">
          AI-Ready Executive Summary
        </p>

        <h3 className="mt-2 text-lg font-black text-[#10233f]">
          Local intelligence summary
        </h3>

        <p className="mt-3 text-sm font-medium leading-7 text-slate-700">
          {snapshotSummary}
        </p>
      </section>

      <section className="rounded-[1.7rem] border-[3px] border-slate-300 bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">
              Analysis History
            </p>
            <h3 className="mt-1 text-lg font-black text-[#10233f]">
              Previous Student Intelligence
            </h3>
          </div>

          <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-[10px] font-black text-slate-600">
            {analysisHistory.length} saved
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {analysisHistory.length ? (
            analysisHistory.map((analysis) => (
              <div
                key={analysis.id}
                className="rounded-2xl border-2 border-slate-200 bg-[#fffaf4] p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill
                    tone={
                      normalize(analysis.risk_level).includes("high")
                        ? "red"
                        : normalize(analysis.risk_level).includes("medium")
                        ? "orange"
                        : "green"
                    }
                    text={analysis.risk_level || "Analysis"}
                  />

                  <span className="text-[10px] font-bold text-slate-500">
                    {pretty(analysis.analysis_type)}
                  </span>

                  <span className="text-[10px] font-bold text-slate-400">
                    {formatDateTime(analysis.created_at)}
                  </span>
                </div>

                <p className="mt-3 text-sm font-medium leading-6 text-slate-700">
                  {analysis.analysis_text}
                </p>
              </div>
            ))
          ) : (
            <PositiveEmpty text="No saved intelligence history yet. Save the first snapshot when this student's data is ready." />
          )}
        </div>
      </section>
    </div>
  );
}

function JourneyTracker({ stage }) {
  const stages = [
    "Inquiry",
    "Counseling",
    "University Planning",
    "Documents Stage",
    "Application Stage",
    "Offer Stage",
    "Visa Processing",
    "Visa Approved",
  ];

  const stageIndex = stages.indexOf(stage);
  const current = stageIndex >= 0 ? stageIndex : 0;

  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
      {stages.map((item, index) => {
        const completed = index <= current;

        return (
          <div
            key={item}
            className={`rounded-2xl border-2 p-3 text-center transition ${
              completed
                ? "border-orange-500 bg-orange-500 text-white"
                : "border-slate-300 bg-white text-slate-500"
            }`}
          >
            <div
              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black ${
                completed
                  ? "border-white/30 bg-white/15 text-white"
                  : "border-slate-300 bg-white text-slate-500"
              }`}
            >
              {index + 1}
            </div>

            <p className="mt-2 text-[9px] font-black uppercase tracking-[0.08em]">
              {item}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "navy",
  small = false,
}) {
  const styles = {
    navy: "border-[#123865] bg-[#123865] text-white",
    orange: "border-orange-500 bg-orange-500 text-white",
    red: "border-red-300 bg-red-50 text-red-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
  };

  return (
    <div
      className={`rounded-[1.5rem] border-[3px] p-5 ${
        styles[tone] || styles.navy
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-80">
          {label}
        </p>
        {Icon ? <Icon size={17} /> : null}
      </div>

      <p className={`mt-3 font-black ${small ? "text-xl" : "text-3xl"}`}>
        {value}
      </p>
    </div>
  );
}

function ProgressCard({ title, value, footer, danger = false }) {
  const safeValue = clamp(value);

  return (
    <div
      className={`rounded-[1.7rem] border-[3px] p-5 ${
        danger
          ? "border-red-300 bg-red-50"
          : "border-orange-300 bg-white"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>

      <p
        className={`mt-3 text-3xl font-black ${
          danger ? "text-red-700" : "text-[#10233f]"
        }`}
      >
        {safeValue}%
      </p>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${
            danger ? "bg-red-500" : "bg-orange-500"
          }`}
          style={{ width: `${safeValue}%` }}
        />
      </div>

      <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
        {footer}
      </p>
    </div>
  );
}

function RiskRow({ risk }) {
  const high = risk.severity === "high";

  return (
    <div
      className={`rounded-2xl border-2 p-4 ${
        high
          ? "border-red-300 bg-red-50"
          : "border-orange-300 bg-orange-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          size={17}
          className={high ? "text-red-600" : "text-orange-600"}
        />

        <div>
          <p
            className={`font-black ${
              high ? "text-red-800" : "text-orange-800"
            }`}
          >
            {risk.title}
          </p>

          <p className="mt-1 text-sm font-medium leading-6 text-slate-700">
            {risk.action}
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ label, value, icon: Icon = FileCheck2 }) {
  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-[#fffaf4] p-4">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-orange-600" />
        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
          {label}
        </p>
      </div>

      <p className="mt-2 break-words text-sm font-black text-[#10233f]">
        {value}
      </p>
    </div>
  );
}

function StatusPill({ text, tone = "slate" }) {
  const styles = {
    slate: "border-slate-300 bg-slate-50 text-slate-700",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    red: "border-red-300 bg-red-50 text-red-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] ${
        styles[tone] || styles.slate
      }`}
    >
      {text}
    </span>
  );
}

function PositiveEmpty({ text }) {
  return (
    <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
      {text}
    </div>
  );
}

function SourceTile({ label, value }) {
  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-[#fffaf4] p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-xs font-black leading-5 text-[#10233f]">
        {value}
      </p>
    </div>
  );
}

function Feedback({ tone, onClose, children }) {
  const isError = tone === "error";
  const isWarning = tone === "warning";

  const style = isError
    ? "border-red-400 bg-red-50 text-red-900"
    : isWarning
    ? "border-amber-400 bg-amber-50 text-amber-900"
    : "border-emerald-400 bg-emerald-50 text-emerald-900";

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-sm font-bold ${style}`}
    >
      {isError || isWarning ? (
        <AlertTriangle size={17} className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
      )}

      <div className="min-w-0 flex-1">{children}</div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss message"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-white/50 transition hover:bg-white"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default StudentAnalyticsPanel;
