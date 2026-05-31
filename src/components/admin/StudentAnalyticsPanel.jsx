import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const REQUEST_TIMEOUT_MS = 20000;

function StudentAnalyticsPanel({ student = {}, allLeads = [] }) {
  const [application, setApplication] = useState(student?.application || null);
  const [documents, setDocuments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [universities, setUniversities] = useState([]);

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

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setApplication(student?.application || null);
    setDocuments(
      Array.isArray(student?.documents)
        ? student.documents
        : Array.isArray(student?.student_documents)
        ? student.student_documents
        : []
    );
    setTasks(
      Array.isArray(student?.tasks)
        ? student.tasks
        : Array.isArray(student?.student_tasks)
        ? student.student_tasks
        : []
    );
    setUniversities(
      Array.isArray(student?.universities)
        ? student.universities
        : Array.isArray(student?.student_universities)
        ? student.student_universities
        : []
    );
    setError("");

    loadApplicationOnly();
    loadDocumentsOnly();
    loadTasksOnly();
    
  }, [studentId]);

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

  const refreshAnalytics = () => {
  setRefreshing(true);
  setError("");

  loadApplicationOnly();
  loadDocumentsOnly();
  loadTasksOnly();

  window.setTimeout(() => {
    setRefreshing(false);
  }, 700);
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

    return {
      documentReadiness,
      applicationReadiness,
      taskCompletion,
      healthScore,
      riskLevel,
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

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.05] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">
              Student Analytics
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Student Journey Intelligence
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
              Real student analytics with independent safe loading for
              applications, documents, tasks, and universities.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshAnalytics}
            disabled={refreshing}
            className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold text-[#D4AF37] transition hover:border-[#D4AF37]/45 disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh Analytics"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {refreshing ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/45">
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

      <div className="rounded-[1.75rem] border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] p-5">
  <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">
    Next Recommended Action
  </p>

  <h3 className="mt-3 text-xl font-black text-white">
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

  <p className="mt-3 text-sm leading-6 text-white/50">
    This recommendation is generated locally from document readiness,
    application readiness, task completion, risk level, and journey stage.
  </p>
</div>

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">
          AI-Ready Summary
        </p>

        <div className="mt-4 grid gap-3 text-sm text-white/55">
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
          ? "border-red-400/25 bg-red-500/10"
          : "border-white/10 bg-white/[0.035]"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <p
        className={`mt-3 font-black ${
          danger ? "text-red-300" : "text-[#D4AF37]"
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
          ? "border-red-400/25 bg-red-500/10"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-white/35">
        {title}
      </p>

      <p
        className={`mt-3 text-3xl font-black ${
          danger ? "text-red-300" : "text-[#D4AF37]"
        }`}
      >
        {value}%
      </p>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${
            danger ? "bg-red-300" : "bg-[#D4AF37]"
          }`}
          style={{ width: `${value}%` }}
        />
      </div>

      <p className="mt-3 text-sm leading-6 text-white/45">{footer}</p>
    </div>
  );
}

function Insight({ text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      {text}
    </div>
  );
}

export default StudentAnalyticsPanel;