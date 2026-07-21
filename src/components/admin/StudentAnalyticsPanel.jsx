// StudentAnalyticsPanel V2 — Student Intelligence Center
// Preserves independent Supabase loading, application/document/task/university analytics,
// health score, risk engine, journey stage, readiness metrics and local recommendations.
// Visual system rebuilt for the approved Zaifan Admin OS: cream, white, navy and orange.

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const REQUEST_TIMEOUT_MS = 20000;

function StudentAnalyticsPanel({
  student = {},
  allLeads = [],
  sharedApplication = null,
  sharedDocuments = null,
  sharedTasks = null,
  sharedUniversities = null,
}) {
  const [application, setApplication] = useState(sharedApplication || student?.application || null);
  const [documents, setDocuments] = useState(Array.isArray(sharedDocuments) ? sharedDocuments : []);
  const [tasks, setTasks] = useState(Array.isArray(sharedTasks) ? sharedTasks : []);
  const [universities, setUniversities] = useState(Array.isArray(sharedUniversities) ? sharedUniversities : []);

  const [applicationLoading, setApplicationLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [universitiesLoading, setUniversitiesLoading] = useState(false);
  const [error, setError] = useState("");

  const mountedRef = useRef(true);
  const requestRef = useRef(0);

  const studentId = student?.id;
  const numericStudentId = Number(studentId);
  const hasValidStudentId = Number.isFinite(numericStudentId);
  const studentType = student?.student_type || student?.__leadType || student?.type || "inquiry";

  const [refreshing, setRefreshing] = useState(false);

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

    loadApplicationOnly();
    loadDocumentsOnly();
    loadTasksOnly();
    loadUniversitiesOnly();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, sharedApplication?.id, sharedApplication?.updated_at, sharedDocuments?.length, sharedTasks?.length, sharedUniversities?.length]);

  const safeSet = (callback) => {
    if (mountedRef.current) callback();
  };

  const withTimeout = (promise, message = "Request timed out.") =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        window.setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS)
      ),
    ]);

  const loadApplicationOnly = async () => {
    const requestId = Date.now();
    requestRef.current = requestId;

    if (!hasValidStudentId) {
      safeSet(() => setApplication(student?.application || null));
      return;
    }

    safeSet(() => setApplicationLoading(true));

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("student_applications")
          .select("*")
          .eq("student_id", numericStudentId)
          .eq("student_type", studentType)
          .order("created_at", { ascending: false })
          .limit(1),
        "Application analytics loading timed out."
      );

      if (requestRef.current !== requestId) return;
      if (error) throw error;

      safeSet(() => {
        setApplication(data?.[0] || student?.application || null);
      });
    } catch {
      safeSet(() => {
        setApplication(student?.application || null);
      });
    } finally {
      safeSet(() => setApplicationLoading(false));
    }
  };

  const loadDocumentsOnly = async () => {
    if (!hasValidStudentId) return;

    safeSet(() => setDocumentsLoading(true));

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("student_documents")
          .select("*")
          .eq("student_id", numericStudentId)
          .order("created_at", { ascending: true }),
        "Documents analytics loading timed out."
      );

      if (error) throw error;

      safeSet(() => {
        setDocuments(data || []);
      });
    } catch {
      safeSet(() => {
        setDocuments(
          Array.isArray(student?.documents) ? student.documents : []
        );
      });
    } finally {
      safeSet(() => setDocumentsLoading(false));
    }
  };

  const loadTasksOnly = async () => {
    if (!hasValidStudentId) return;

    safeSet(() => setTasksLoading(true));

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("student_tasks")
          .select("*")
          .eq("student_id", numericStudentId)
          .eq("student_type", studentType)
          .order("created_at", { ascending: false })
          .limit(100),
        "Tasks analytics loading timed out."
      );

      if (error) throw error;

      safeSet(() => {
        setTasks(data || []);
      });
    } catch {
      safeSet(() => {
        setTasks(Array.isArray(student?.tasks) ? student.tasks : []);
      });
    } finally {
      safeSet(() => setTasksLoading(false));
    }
  };

  const loadUniversitiesOnly = async () => {
    if (!hasValidStudentId) return;

    safeSet(() => setUniversitiesLoading(true));

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("student_universities")
          .select("*")
          .eq("student_id", numericStudentId)
          .eq("student_type", studentType)
          .order("created_at", { ascending: false })
          .limit(50),
        "Universities analytics loading timed out."
      );

      if (error) throw error;

      safeSet(() => {
        setUniversities(data || []);
      });
    } catch {
      safeSet(() => {
        setUniversities(
          Array.isArray(student?.universities) ? student.universities : []
        );
      });
    } finally {
      safeSet(() => setUniversitiesLoading(false));
    }
  };

  const refreshAnalytics = async () => {
  setRefreshing(true);
  setError("");

  try {
    await Promise.allSettled([
      loadApplicationOnly(),
      loadDocumentsOnly(),
      loadTasksOnly(),
      loadUniversitiesOnly(),
    ]);
  } finally {
    safeSet(() => setRefreshing(false));
  }
};

  const analytics = useMemo(() => {
    const app = application || {};
    const requiredDocs = [
      "Passport",
      "Transcript",
      "Degree",
      "IELTS",
      "Personal Statement",
      "CV",
      "Financial Documents",
    ];

    const verifiedDocs = documents.filter((doc) => doc.status === "verified").length;
    const receivedDocs = documents.filter((doc) =>
      ["received", "verified"].includes(doc.status)
    ).length;

    const documentReadiness = Math.round(
      (receivedDocs / requiredDocs.length) * 100
    );

    const applicationReadinessItems = [
      app.country || student.country || student.preferred_country,
      app.university || student.university,
      app.program || student.program || student.field_of_interest,
      app.intake || student.intake,
      app.application_status && app.application_status !== "not_started",
      app.offer_status && app.offer_status !== "pending",
      app.visa_status && app.visa_status !== "not_started",
    ].filter(Boolean);

    const applicationReadiness = Math.round(
      (applicationReadinessItems.length / 7) * 100
    );

    const completedTasks = tasks.filter((task) => task.status === "completed").length;
    const overdueTasks = tasks.filter((task) => {
      if (!task.due_date || task.status === "completed") return false;
      return new Date(task.due_date) < new Date();
    }).length;

    const taskCompletion = tasks.length
      ? Math.round((completedTasks / tasks.length) * 100)
      : 0;

    const visaStatus = app.visa_status || student.visa_status || "not_started";
    const offerStatus = app.offer_status || student.offer_status || "pending";
    const priority = student.priority || "medium";

    const riskScore =
      overdueTasks * 15 +
      (documentReadiness < 50 ? 20 : 0) +
      (applicationReadiness < 50 ? 20 : 0) +
      (priority === "high" || priority === "vip" ? 10 : 0);

    const healthScore = Math.max(
  0,
  Math.min(
    100,
    Math.round(
      documentReadiness * 0.3 +
      applicationReadiness * 0.35 +
      taskCompletion * 0.2 +
      (universities.length > 0 ? 10 : 0) +
      (visaStatus !== "not_started" ? 15 : 5)
    )
  )
);

    const riskLevel =
      riskScore >= 45 ? "High Risk" : riskScore >= 25 ? "Medium Risk" : "Stable";

    const journeyStage =
      visaStatus === "visa_approved"
        ? "Visa Approved"
        : visaStatus !== "not_started"
        ? "Visa Processing"
        : offerStatus === "offer_received" || offerStatus === "offer_accepted"
        ? "Offer Stage"
        : app.application_status && app.application_status !== "not_started"
        ? "Application Stage"
        : "Counseling Stage";

    const studentCountry =
      student.country || student.preferred_country || student.country_interest || "";

    const similarCountryLeads = allLeads.filter((lead) => {
      const leadCountry =
        lead.country || lead.preferred_country || lead.country_interest || "";
      return (
        studentCountry &&
        String(leadCountry).toLowerCase() === String(studentCountry).toLowerCase()
      );
    }).length;
const riskFactors = [];

if (documentReadiness < 50) {
  riskFactors.push({
    title: "Low document readiness",
    severity: "high",
    action: "Collect missing documents.",
  });
}

if (applicationReadiness < 60) {
  riskFactors.push({
    title: "Incomplete application",
    severity: "medium",
    action: "Complete application profile.",
  });
}

if (overdueTasks > 0) {
  riskFactors.push({
    title: "Overdue tasks",
    severity: "high",
    action: "Resolve overdue counselor tasks.",
  });
}

if (universities.length === 0) {
  riskFactors.push({
    title: "No universities saved",
    severity: "medium",
    action: "Create a university shortlist.",
  });
}

const primaryRiskAction =
  riskFactors[0]?.action ||
  "No major risk detected.";
    return {
      documentReadiness,
      applicationReadiness,
      taskCompletion,
      healthScore,
      riskLevel,
      riskFactors,
primaryRiskAction,
      journeyStage,
      verifiedDocs,
      receivedDocs,
      totalDocs: requiredDocs.length,
      totalTasks: tasks.length,
      completedTasks,
      overdueTasks,
      universitiesCount: universities.length,
      similarCountryLeads,
    };
  }, [student, allLeads, application, documents, tasks, universities]);

  const isLoading =
  applicationLoading ||
  documentsLoading ||
  tasksLoading ||
  universitiesLoading;

  return (
    <div className="space-y-5">
      <div className="rounded-[1.8rem] border-2 border-orange-300 bg-[#102f5c] p-6 shadow-[0_16px_40px_rgba(15,35,63,0.14)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-orange-700">
              Student Analytics
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Student Journey Intelligence
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
              Real student analytics with independent safe loading for
              applications, documents, tasks, and universities.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshAnalytics}
            disabled={refreshing}
            className="rounded-full border border-orange-400 bg-orange-500 px-4 py-2 text-xs font-black text-[#10233f] transition hover:bg-orange-600 disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh Analytics"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading || refreshing ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-700">
          Loading analytics safely...
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Health Score" value={`${analytics.healthScore}%`} />
        <MetricCard label="Journey Stage" value={analytics.journeyStage} small />
        <MetricCard
          label="Risk Level"
          value={analytics.riskLevel}
          small
          danger={analytics.riskLevel === "High Risk"}
        />
        <MetricCard label="Country Leads" value={analytics.similarCountryLeads} />
      </div>

      <div className="rounded-[1.75rem] border border-orange-200 bg-[#fff8ee] p-5 shadow-[0_8px_24px_rgba(15,35,63,0.04)]">
  <p className="text-xs uppercase tracking-[0.22em] text-orange-700">
    Student Journey Tracker
  </p>

  <div className="mt-6 grid gap-3 md:grid-cols-7">
    {[
      "Inquiry",
      "Counseling",
      "Documents",
      "Application",
      "Offer",
      "Visa",
      "Enrollment",
    ].map((stage, index) => {
      const currentStage =
        analytics.journeyStage === "Visa Approved"
          ? 6
          : analytics.journeyStage === "Visa Processing"
          ? 5
          : analytics.journeyStage === "Offer Stage"
          ? 4
          : analytics.journeyStage === "Application Stage"
          ? 3
          : 1;

      const completed = index <= currentStage;

      return (
        <div
          key={stage}
          className={`rounded-2xl border p-4 text-center transition ${
            completed
              ? "border-orange-500 bg-orange-500 text-white shadow-[0_6px_16px_rgba(249,115,22,0.16)]"
              : "border-slate-300 bg-white"
          }`}
        >
          <div
            className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border text-sm font-black ${
              completed
                ? "border-white/40 bg-white/15 text-white"
                : "border-slate-300 text-slate-500"
            }`}
          >
            {index + 1}
          </div>

          <p
            className={`mt-3 text-xs font-semibold uppercase tracking-[0.14em] ${
              completed ? "text-white" : "text-slate-500"
            }`}
          >
            {stage}
          </p>
        </div>
      );
    })}
  </div>
</div>
<div className="rounded-[1.75rem] border border-slate-300 bg-white p-5 shadow-[0_8px_24px_rgba(15,35,63,0.04)]">
  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-orange-700">
        Student Risk Engine
      </p>

      <h3 className="mt-2 text-xl font-black text-[#10233f]">
        {analytics.riskFactors.length > 0
          ? `${analytics.riskFactors.length} Risk Signal${
              analytics.riskFactors.length > 1 ? "s" : ""
            } Detected`
          : "No Major Risk Detected"}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {analytics.primaryRiskAction}
      </p>
    </div>

    <div
      className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${
        analytics.riskFactors.some(
          (risk) => risk.severity === "high"
        )
          ? "border-red-300 bg-red-50 text-red-700"
          : analytics.riskFactors.length > 0
          ? "border-amber-300 bg-amber-50 text-amber-800"
          : "border-emerald-300 bg-emerald-50 text-emerald-700"
      }`}
    >
      {analytics.riskFactors.some(
        (risk) => risk.severity === "high"
      )
        ? "High Attention"
        : analytics.riskFactors.length > 0
        ? "Monitor"
        : "Stable"}
    </div>
  </div>

  <div className="mt-5 grid gap-3 md:grid-cols-2">
    {analytics.riskFactors.length === 0 ? (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
        Student has no major operational risk signals.
      </div>
    ) : (
      analytics.riskFactors.map((risk) => (
        <div
          key={risk.title}
          className={`rounded-2xl border p-4 ${
            risk.severity === "high"
              ? "border-red-300 bg-red-50"
              : "border-amber-300 bg-amber-50"
          }`}
        >
          <p
            className={`font-black ${
              risk.severity === "high"
                ? "text-red-700"
                : "text-amber-800"
            }`}
          >
            {risk.title}
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {risk.action}
          </p>
        </div>
      ))
    )}
  </div>
</div>
      <div className="grid gap-4 lg:grid-cols-3">
        <ProgressCard
          title="Document Readiness"
          value={analytics.documentReadiness}
          footer={`${analytics.receivedDocs}/${analytics.totalDocs} received • ${analytics.verifiedDocs} verified`}
        />

        <ProgressCard
          title="Application Readiness"
          value={analytics.applicationReadiness}
          footer="Country, university, program, intake, offer, visa and status completion"
        />

        <ProgressCard
          title="Task Completion"
          value={analytics.taskCompletion}
          footer={`${analytics.completedTasks}/${analytics.totalTasks} completed • ${analytics.overdueTasks} overdue`}
          danger={analytics.overdueTasks > 0}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Saved Universities" value={analytics.universitiesCount} />
        <MetricCard label="Saved Tasks" value={analytics.totalTasks} />
        <MetricCard label="Overdue Tasks" value={analytics.overdueTasks} danger={analytics.overdueTasks > 0} />
      </div>

      <div className="rounded-[1.75rem] border border-orange-200 bg-[#fff8ee] p-5 shadow-[0_8px_24px_rgba(15,35,63,0.04)]">
  <p className="text-xs uppercase tracking-[0.22em] text-orange-700">
    Next Recommended Action
  </p>

  <h3 className="mt-3 text-xl font-black text-[#10233f]">
    {analytics.documentReadiness < 50
      ? "Collect missing documents first"
      : analytics.applicationReadiness < 60
      ? "Complete application profile"
      : analytics.overdueTasks > 0
      ? "Clear overdue counselor tasks"
      : analytics.journeyStage === "Offer Stage"
      ? "Prepare visa workflow"
      : "Continue regular follow-up"}
  </h3>

  <p className="mt-3 text-sm leading-6 text-slate-600">
    This recommendation is generated locally from document readiness,
    application readiness, task completion, risk level, and journey stage.
  </p>
</div>

      <div className="rounded-[1.75rem] border border-slate-300 bg-white p-5 shadow-[0_8px_24px_rgba(15,35,63,0.04)]">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-700">
          AI-Ready Summary
        </p>

        <div className="mt-4 grid gap-3 text-sm text-slate-600">
          <Insight text={`Student is currently in ${analytics.journeyStage}.`} />
          <Insight text={`Overall journey health is ${analytics.healthScore}%.`} />
          <Insight text={`Document readiness is ${analytics.documentReadiness}%.`} />
          <Insight text={`Application readiness is ${analytics.applicationReadiness}%.`} />
          <Insight text={`Task completion is ${analytics.taskCompletion}%.`} />
          <Insight text={`Risk level is ${analytics.riskLevel}.`} />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, small = false, danger = false }) {
  return (
    <div
      className={`rounded-[1.5rem] border p-5 ${
        danger
          ? "border-red-300 bg-red-50"
          : "border-white/10 bg-white/[0.035]"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>

      <p
        className={`mt-3 font-black ${
          danger ? "text-red-700" : "text-[#10233f]"
        } ${small ? "text-xl" : "text-3xl"}`}
      >
        {value}
      </p>
    </div>
  );
}

function ProgressCard({ title, value, footer, danger = false }) {
  return (
    <div
      className={`rounded-[1.75rem] border p-5 ${
        danger
          ? "border-red-300 bg-red-50"
          : "border-slate-300 bg-white shadow-[0_6px_18px_rgba(15,35,63,0.035)]"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
        {title}
      </p>

      <p
        className={`mt-3 text-3xl font-black ${
          danger ? "text-red-700" : "text-[#10233f]"
        }`}
      >
        {value}%
      </p>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${
            danger ? "bg-red-500" : "bg-orange-500"
          }`}
          style={{ width: `${value}%` }}
        />
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{footer}</p>
    </div>
  );
}

function Insight({ text }) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-[#fffaf2] p-4 text-slate-700">
      {text}
    </div>
  );
}

export default StudentAnalyticsPanel;