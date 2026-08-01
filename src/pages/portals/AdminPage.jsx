import { lazy, Suspense, useEffect, useMemo, useState } from "react";

import AdminLogin from "../../components/admin/workspaces/core/AdminLogin";
import AdminSidebar from "../../components/admin/workspaces/core/AdminSidebar";
const CommandPalette = lazy(() => import("../../components/admin/workspaces/core/CommandPalette"));

import AdminHomePage from "../../components/admin/pages/AdminHomePage";
const StudentDirectoryPage = lazy(() =>
  import("../../components/admin/pages/StudentDirectoryPage")
);
const CommunicationsPage = lazy(() =>
  import("../../components/admin/pages/CommunicationsPage")
);
const OperationsPage = lazy(() =>
  import("../../components/admin/pages/OperationsPage")
);
const TeamPage = lazy(() =>
  import("../../components/admin/pages/TeamPage")
);
const SystemPage = lazy(() =>
  import("../../components/admin/pages/SystemPage")
);
const EnterprisePage = lazy(() =>
  import("../../components/admin/pages/EnterprisePage")
);
const KnowledgeOSDashboard = lazy(() =>
  import("../../components/admin/knowledge/KnowledgeOSDashboard")
);
const MobileControlCenter = lazy(() =>
  import("../../components/admin/mobile/MobileControlCenter")
);
const AnalyticsPage = lazy(() =>
  import("../../components/admin/pages/AnalyticsPage")
);
const FollowUpsPage = lazy(() =>
  import("../../components/admin/pages/FollowUpsPage")
);
const MyLeadsPage = lazy(() =>
  import("../../components/admin/pages/MyLeadsPage")
);
const PipelinePage = lazy(() =>
  import("../../components/admin/pages/PipelinePage")
);

import useAdminAuthHook from "../../hooks/useAdminAuth";
import useAdminDashboardData from "../../hooks/useAdminDashboardData";
import useAdminActivityLogger from "../../hooks/useAdminActivityLogger";
import useAdminLeadActions from "../../hooks/useAdminLeadActions";

import {
  filterInquiries,
  filterAppointments,
  getCrmCounts,
  getTodayCounts,
  getPermissionsForRole,
  getStatusOptions,
  roleLabels,
} from "../../utils/crm/index";

import { PROFILE_RETRY_LIMIT } from "../../utils/crm/constants";
import { supabase } from "../../lib/supabaseClient";
import { generateGptCopilotText } from "../../services/gptCopilotService";
import { enrichLeadWithAi } from "../../services/aiLeadEngine";
import {
  DEFAULT_ADMIN_TAB,
  normalizeAdminTab,
} from "../../components/admin/workspaces/core/adminNavigation";

const ADMIN_ACTIVE_TAB_KEY = "zaifan_admin_active_tab";
const ADMIN_ANALYTICS_SECTION_KEY = "zaifan_admin_analytics_section";
const ADMIN_SCROLL_KEY = "zaifan_admin_scroll_y";

const ADMIN_CARD_CLASS =
  "group relative overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white p-5 text-[#0b2a57] shadow-[0_12px_36px_rgba(15,23,42,0.07)] transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_46px_rgba(15,23,42,0.10)] sm:p-6";

const ADMIN_INPUT_CLASS =
  "w-full rounded-xl border border-slate-300 bg-white px-5 py-4 text-[15px] font-semibold text-[#0b2a57] outline-none placeholder:text-slate-400 transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

function getStoredValue(key, fallback) {
  if (typeof window === "undefined") return fallback;

  return sessionStorage.getItem(key) || fallback;
}

function AdminPage() {
  const [activeTab, setActiveTab] = useState(() =>
    normalizeAdminTab(
      getStoredValue(ADMIN_ACTIVE_TAB_KEY, DEFAULT_ADMIN_TAB)
    )
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeAnalyticsSection, setActiveAnalyticsSection] = useState(() =>
    getStoredValue(ADMIN_ANALYTICS_SECTION_KEY, "ai-executive")
  );
  const [aiReanalysisState, setAiReanalysisState] = useState({
    loading: false,
    leadId: null,
    leadType: null,
    message: "",
    error: "",
  });
  const [adminEntryHoldDone, setAdminEntryHoldDone] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAdminEntryHoldDone(true);
    }, 700);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const normalizedTab = normalizeAdminTab(activeTab);

    if (normalizedTab !== activeTab) {
      setActiveTab(normalizedTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    sessionStorage.setItem(ADMIN_ACTIVE_TAB_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    sessionStorage.setItem(
      ADMIN_ANALYTICS_SECTION_KEY,
      activeAnalyticsSection
    );
  }, [activeAnalyticsSection]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saveScroll = () => {
      sessionStorage.setItem(ADMIN_SCROLL_KEY, String(window.scrollY || 0));
    };

    window.addEventListener("scroll", saveScroll, { passive: true });
    window.addEventListener("beforeunload", saveScroll);

    return () => {
      saveScroll();
      window.removeEventListener("scroll", saveScroll);
      window.removeEventListener("beforeunload", saveScroll);
    };
  }, []);

  const cardClass = ADMIN_CARD_CLASS;
  const inputClass = ADMIN_INPUT_CLASS;

  const auth = useAdminAuthHook();

  if (
    import.meta.env.DEV &&
    (!auth || typeof auth !== "object" || Array.isArray(auth))
  ) {
    throw new Error(
      "useAdminAuth must be called as a React hook and return the Admin auth state object."
    );
  }

  const {
    isLoggedIn,
    sessionChecked,
    adminUser,
    adminProfile,

    email,
    setEmail,
    password,
    setPassword,

    profileLoading,
    profileError,
    profileRetryCount,

    handleLogin,
    logout,
    loadAdminProfile,
  } = auth;

  const {
    inquiries,
    setInquiries,
    appointments,
    setAppointments,
    followUpReminders,

    studentApplications,
    studentDocuments,
    studentTasks,
    studentUniversities,
    studentRiskScores,

    studentInvoices,
    studentPayments,
    studentReceipts,
    studentPortalAccounts,
    supportRequests,
    counselorPaymentRequests,
    executiveExecutionLogs,

    loading,
    loadError,
    fetchAllData,
    clearLocalData,
  } = useAdminDashboardData({
    isLoggedIn,
    adminProfile,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isLoggedIn || !adminProfile) return;

    const restoreScroll = () => {
      const savedScrollY = Number(sessionStorage.getItem(ADMIN_SCROLL_KEY) || 0);

      if (savedScrollY > 0) {
        window.scrollTo({
          top: savedScrollY,
          behavior: "auto",
        });
      }
    };

    const timers = [300, 800, 1500, 2500, 4000].map((delay) =>
      window.setTimeout(restoreScroll, delay)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [isLoggedIn, adminProfile, activeTab, activeAnalyticsSection, loading]);

  const role = adminProfile?.role || "staff";
  const currentPermissions = useMemo(() => getPermissionsForRole(role), [role]);

  const { logActivity } = useAdminActivityLogger({
    adminUser,
    adminProfile,
  });

  const {
    deleteInquiry,
    deleteAppointment,

    toggleInquiryStatus,
    updateInquiryPriority,
    updateAppointmentPriority,
    updateAppointmentStatus,
    updateAppointmentStage,

    clearInquiries,
    clearAppointments,

    exportInquiriesToCSV,
    exportAppointmentsToCSV,
  } = useAdminLeadActions({
    inquiries,
    setInquiries,
    appointments,
    setAppointments,
    currentPermissions,
    logActivity,
  });

  const allLeads = useMemo(
    () => [
      ...inquiries.map((lead) => ({ ...lead, __leadType: "inquiry" })),
      ...appointments.map((lead) => ({ ...lead, __leadType: "appointment" })),
    ],
    [inquiries, appointments]
  );

  const aiCoverageStats = useMemo(() => {
    const total = allLeads.length;
    const storedGpt = allLeads.filter((lead) => {
      const enriched = enrichLeadWithAi(
        lead,
        lead.__leadType === "appointment" ? "appointment" : "inquiry"
      );

      return enriched.ai_has_stored_gpt;
    }).length;

    return {
      total,
      storedGpt,
      percent: total ? Math.round((storedGpt / total) * 100) : 0,
    };
  }, [allLeads]);

  const handleLogout = async () => {
    await logout();
    clearLocalData();

    if (typeof window !== "undefined") {
      sessionStorage.removeItem(ADMIN_SCROLL_KEY);
      sessionStorage.removeItem(ADMIN_ACTIVE_TAB_KEY);
      sessionStorage.removeItem(ADMIN_ANALYTICS_SECTION_KEY);
    }
  };

  const updateLocalLeadAfterGpt = ({ leadId, leadType, patch }) => {
    if (leadType === "appointment") {
      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === leadId ? { ...appointment, ...patch } : appointment
        )
      );
      return;
    }

    setInquiries((prev) =>
      prev.map((inquiry) =>
        inquiry.id === leadId ? { ...inquiry, ...patch } : inquiry
      )
    );
  };

  const parseFastGptJson = (text) => {
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      const jsonMatch = String(text).match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }
  };

  const buildStoredGptAnalysis = ({ lead, leadType, gptText }) => {
    const localAi = enrichLeadWithAi(lead, leadType);

    return {
      version: "stored_gpt_v1",
      generated_at: new Date().toISOString(),
      generated_by:
        adminProfile?.full_name || adminProfile?.name || "Zaifan Consultancy Team",
      source: "manual_reanalysis",
      model_mode: "counselor_strategy_fallback",
      score: localAi.ai_score,
      intent_level: localAi.ai_intent_level?.label || "Unknown",
      risk_level: localAi.ai_risk_level?.label || "Unknown",
      conversion_probability:
        localAi.ai_conversion_range || localAi.ai_conversion_probability,
      priority: localAi.ai_tier?.label || "Unknown",
      next_action: localAi.ai_recommended_action,
      summary: gptText,
      counselor_strategy: gptText,
      confidence: "medium",
      raw_text: gptText,
      local_engine_snapshot: {
        ai_score: localAi.ai_score,
        ai_tier: localAi.ai_tier?.label,
        ai_urgency: localAi.ai_urgency?.label,
        ai_intent_score: localAi.ai_intent_score,
        ai_risk_score: localAi.ai_risk_score,
        ai_data_completeness_score: localAi.ai_data_completeness_score,
        ai_visa_readiness_score: localAi.ai_visa_readiness_score,
        ai_recommended_action: localAi.ai_recommended_action,
      },
    };
  };

  const normalizeFastAnalysis = ({ lead, leadType, gptText }) => {
    const localAi = enrichLeadWithAi(lead, leadType);
    const parsed = parseFastGptJson(gptText);

    if (!parsed) {
      return buildStoredGptAnalysis({
        lead,
        leadType,
        gptText,
      });
    }

    return {
      version: "stored_gpt_fast_v2",
      generated_at: new Date().toISOString(),
      generated_by:
        adminProfile?.full_name || adminProfile?.name || "Zaifan Consultancy Team",
      source: "manual_fast_reanalysis",
      model_mode: "lead_reanalysis",
      score: Number.isFinite(Number(parsed.score))
        ? Math.max(0, Math.min(100, Math.round(Number(parsed.score))))
        : localAi.ai_score,
      intent_level: parsed.intent_level || localAi.ai_intent_level?.label || "Unknown",
      risk_level: parsed.risk_level || localAi.ai_risk_level?.label || "Unknown",
      conversion_probability:
        parsed.conversion_probability ||
        localAi.ai_conversion_range ||
        localAi.ai_conversion_probability,
      priority: parsed.priority || localAi.ai_tier?.label || "Unknown",
      next_action: parsed.next_action || localAi.ai_recommended_action,
      summary: parsed.summary || gptText,
      counselor_strategy: parsed.counselor_strategy || parsed.summary || gptText,
      confidence: parsed.confidence || "medium",
      missing_data: Array.isArray(parsed.missing_data) ? parsed.missing_data : [],
      risk_signals: Array.isArray(parsed.risk_signals) ? parsed.risk_signals : [],
      opportunity_signals: Array.isArray(parsed.opportunity_signals)
        ? parsed.opportunity_signals
        : [],
      raw_text: gptText,
      local_engine_snapshot: {
        ai_score: localAi.ai_score,
        ai_tier: localAi.ai_tier?.label,
        ai_urgency: localAi.ai_urgency?.label,
        ai_intent_score: localAi.ai_intent_score,
        ai_risk_score: localAi.ai_risk_score,
        ai_data_completeness_score: localAi.ai_data_completeness_score,
        ai_visa_readiness_score: localAi.ai_visa_readiness_score,
        ai_recommended_action: localAi.ai_recommended_action,
      },
    };
  };

  const saveGptIntelligenceToSupabase = async ({ lead, leadType, analysis }) => {
    const table = leadType === "appointment" ? "appointments" : "inquiries";

    const patch = {
      gpt_intelligence: analysis,
      gpt_ai_score: analysis.score,
      gpt_intent_level: analysis.intent_level,
      gpt_risk_level: analysis.risk_level,
      gpt_conversion_probability: analysis.conversion_probability,
      gpt_next_action: analysis.next_action,
      gpt_summary: analysis.summary,
      gpt_counselor_strategy: analysis.counselor_strategy,
      gpt_confidence: analysis.confidence,
      gpt_analyzed_at: analysis.generated_at,
    };

    const { error } = await supabase
      .from(table)
      .update(patch)
      .eq("id", lead.id);

    if (error) throw error;

    updateLocalLeadAfterGpt({
      leadId: lead.id,
      leadType,
      patch,
    });

    await logActivity?.({
      actionType: "gpt_reanalysis_completed",
      title: "GPT Lead Intelligence Updated",
      description: `GPT intelligence was saved for ${
        lead.full_name || lead.name || "student"
      }.`,
      studentId: lead.id,
      studentType: leadType,
      metadata: {
        score: analysis.score,
        intent_level: analysis.intent_level,
        risk_level: analysis.risk_level,
        conversion_probability: analysis.conversion_probability,
      },
    });

    return patch;
  };

  const reanalyzeLeadWithGpt = async (lead, leadType = "inquiry") => {
    if (!lead?.id) return;

    const confirmed = window.confirm(
      "This will use a small OpenAI API call to quickly reanalyze this lead and save GPT intelligence to Supabase. Continue?"
    );

    if (!confirmed) return;

    setAiReanalysisState({
      loading: true,
      leadId: lead.id,
      leadType,
      message: "GPT is quickly analyzing this lead...",
      error: "",
    });

    try {
      const localAi = enrichLeadWithAi(lead, leadType);

      const gptText = await generateGptCopilotText({
        mode: "lead_reanalysis",
        student: lead,
        studentType: leadType,
        adminName:
          adminProfile?.full_name ||
          adminProfile?.name ||
          "Zaifan Consultancy Team",
        leadScore: localAi.ai_score,
        leadHealth: localAi.ai_tier?.label,
        overdueStatus: localAi.ai_urgency?.label,
        extraContext: {
          ai_score: localAi.ai_score,
          ai_tier: localAi.ai_tier?.label,
          ai_urgency: localAi.ai_urgency?.label,
          ai_conversion_probability: localAi.ai_conversion_probability,
          ai_recommended_action: localAi.ai_recommended_action,
          ai_intent_score: localAi.ai_intent_score,
          ai_intent_level: localAi.ai_intent_level?.label,
          ai_risk_score: localAi.ai_risk_score,
          ai_risk_level: localAi.ai_risk_level?.label,
          ai_data_completeness_score: localAi.ai_data_completeness_score,
          ai_visa_readiness_score: localAi.ai_visa_readiness_score,
          missing_items: localAi.ai_missing_items,
          risk_signals: localAi.ai_risk_signals,
          opportunity_signals: localAi.ai_opportunity_signals,
        },
      });

      const analysis = normalizeFastAnalysis({
        lead,
        leadType,
        gptText,
      });

      await saveGptIntelligenceToSupabase({
        lead,
        leadType,
        analysis,
      });

      setAiReanalysisState({
        loading: false,
        leadId: lead.id,
        leadType,
        message: "Fast GPT intelligence saved successfully.",
        error: "",
      });
    } catch (error) {
      console.error(error);

      setAiReanalysisState({
        loading: false,
        leadId: lead.id,
        leadType,
        message: "",
        error: error.message || "GPT reanalysis failed.",
      });
    }
  };

  const filteredInquiries = useMemo(
    () =>
      filterInquiries({
        inquiries,
        search,
        statusFilter,
      }),
    [inquiries, search, statusFilter]
  );

  const filteredAppointments = useMemo(
    () =>
      filterAppointments({
        appointments,
        search,
        statusFilter,
      }),
    [appointments, search, statusFilter]
  );

  const {
    inquiryNewCount,
    inquiryContactedCount,
    appointmentPendingCount,
    appointmentConfirmedCount,
    appointmentCompletedCount,
    appointmentCancelledCount,
  } = useMemo(
    () => getCrmCounts({ inquiries, appointments }),
    [inquiries, appointments]
  );

  const latestInquiry = inquiries[0];
  const latestAppointment = appointments[0];

  const { todayInquiriesCount, todayAppointmentsCount } = useMemo(
    () => getTodayCounts({ inquiries, appointments }),
    [inquiries, appointments]
  );

  const statusOptions = useMemo(() => getStatusOptions(activeTab), [activeTab]);

  const adminCommandMetrics = useMemo(() => {
    const openSupport = supportRequests.filter(
      (item) => !["resolved", "closed"].includes(String(item.status || "").toLowerCase())
    ).length;

    const pendingTasks = studentTasks.filter(
      (item) => !["completed", "done"].includes(String(item.status || "").toLowerCase())
    ).length;

    const activePortalAccounts = studentPortalAccounts.filter(
      (item) => item.is_active !== false
    ).length;

    return {
      totalLeads: allLeads.length,
      pendingAppointments: appointmentPendingCount,
      pendingTasks,
      openSupport,
      activePortalAccounts,
      gptCoverage: aiCoverageStats.percent,
    };
  }, [
    allLeads.length,
    appointmentPendingCount,
    studentTasks,
    supportRequests,
    studentPortalAccounts,
    aiCoverageStats.percent,
  ]);

  if (
    !sessionChecked ||
    (profileLoading && !adminProfile) ||
    (isLoggedIn && !adminEntryHoldDone)
  ) {
    return (
      <AdminEntryLoader
        retryCount={profileRetryCount}
        retryLimit={PROFILE_RETRY_LIMIT}
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <AdminLogin
        email={email}
        password={password}
        setEmail={setEmail}
        setPassword={setPassword}
        handleLogin={handleLogin}
        inputClass={inputClass}
      />
    );
  }

  if (sessionChecked && isLoggedIn && !profileLoading && !adminProfile) {
    return (
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fff7ef] px-6 text-[#0b2a57]">
        <div className="relative z-10 w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_30px_100px_rgba(15,23,42,0.12)]">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-red-400/20 bg-red-500/10 text-3xl">
            🔒
          </div>

          <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">
            Access Check Paused
          </p>

          <h1 className="mt-3 text-3xl font-black text-[#0b2a57]">
            Admin Profile Not Verified Yet
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-slate-500">
            Your login session is active, but Zaifan CRM could not verify your
            admin profile after several attempts. This can happen during Vite hot
            reload or temporary Supabase delay.
          </p>

          {profileError && (
            <div className="mt-5 rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4 text-left text-xs leading-relaxed text-orange-700">
              {profileError}
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-xs text-slate-600">
            <p className="text-slate-400">Your user ID:</p>
            <p className="mt-1 break-all font-mono text-orange-600">
              {adminUser?.id || "No user ID found"}
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => loadAdminProfile(adminUser?.id, { force: true })}
              className="rounded-full bg-orange-500 px-7 py-3 text-sm font-black text-white shadow-sm transition hover:bg-orange-600"
            >
              Retry Profile Check
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-slate-200 bg-white px-7 py-3 text-sm font-bold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen bg-[#fff7ef] text-[#0b2a57]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute right-[-12%] top-[-18%] h-[520px] w-[520px] rounded-full bg-orange-300/20 blur-3xl" />
        <div className="absolute bottom-[-24%] left-[18%] h-[460px] w-[460px] rounded-full bg-[#ffd9c4]/30 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen flex-col xl:flex-row">
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          logout={handleLogout}
          role={role}
          adminProfile={adminProfile}
          permissions={currentPermissions}
        />

        <Suspense fallback={null}>
          <CommandPalette
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          inquiries={inquiries}
          appointments={appointments}
          followUpReminders={followUpReminders}
          permissions={currentPermissions}
          />
        </Suspense>

        <main className="min-w-0 flex-1 overflow-hidden px-3 py-4 sm:px-5 sm:py-5 xl:px-7 2xl:px-9">
          <div className="mx-auto w-full max-w-[1800px]">
            {aiReanalysisState.message && (
              <SystemNotice tone="success">
                {aiReanalysisState.message}
              </SystemNotice>
            )}

            {aiReanalysisState.error && (
              <SystemNotice tone="error">
                {aiReanalysisState.error}
              </SystemNotice>
            )}

            {profileError && adminProfile && (
              <SystemNotice tone="warning">{profileError}</SystemNotice>
            )}

            {loadError && (
              <div className="mb-5 rounded-[1.4rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p>{loadError}</p>

                  <button
                    type="button"
                    onClick={() => fetchAllData()}
                    className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-black text-white transition duration-300 hover:bg-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100"
                  >
                    Retry refresh
                  </button>
                </div>
              </div>
            )}

            <Suspense fallback={null}>
              {activeTab === "home" ? (
                <AdminHomePage
                  cardClass={cardClass}
                  role={role}
                  roleLabel={roleLabels[role] || role}
                  adminProfile={adminProfile}
                  permissions={currentPermissions}
                  inquiries={inquiries}
                  appointments={appointments}
                  inquiryNewCount={inquiryNewCount}
                  inquiryContactedCount={inquiryContactedCount}
                  appointmentPendingCount={appointmentPendingCount}
                  appointmentConfirmedCount={appointmentConfirmedCount}
                  appointmentCompletedCount={appointmentCompletedCount}
                  appointmentCancelledCount={appointmentCancelledCount}
                  studentApplications={studentApplications}
                  studentDocuments={studentDocuments}
                  studentTasks={studentTasks}
                  studentUniversities={studentUniversities}
                  studentRiskScores={studentRiskScores}
                  studentInvoices={studentInvoices}
                  studentPayments={studentPayments}
                  studentReceipts={studentReceipts}
                  studentPortalAccounts={studentPortalAccounts}
                  supportRequests={supportRequests}
                  counselorPaymentRequests={counselorPaymentRequests}
                  executiveExecutionLogs={executiveExecutionLogs}
                  adminCommandMetrics={adminCommandMetrics}
                  aiCoverageStats={aiCoverageStats}
                  fetchAllData={fetchAllData}
                  exportInquiriesToCSV={exportInquiriesToCSV}
                  exportAppointmentsToCSV={exportAppointmentsToCSV}
                  clearInquiries={clearInquiries}
                  clearAppointments={clearAppointments}
                  logout={handleLogout}
                  setActiveTab={setActiveTab}
                  setActiveAnalyticsSection={setActiveAnalyticsSection}
                />
              ) : activeTab === "students" ? (
                <StudentDirectoryPage
                  inquiries={inquiries}
                  appointments={appointments}
                  studentPortalAccounts={studentPortalAccounts}
                  adminProfile={adminProfile}
                  permissions={currentPermissions}
                  updateInquiryPriority={updateInquiryPriority}
                  updateAppointmentPriority={updateAppointmentPriority}
                  updateAppointmentStatus={updateAppointmentStatus}
                  updateAppointmentStage={updateAppointmentStage}
                  toggleInquiryStatus={toggleInquiryStatus}
                  deleteInquiry={deleteInquiry}
                  deleteAppointment={deleteAppointment}
                />
              ) : activeTab === "followups" ? (
                <FollowUpsPage cardClass={cardClass} />
              ) : [
                "communications",
                "communication-email",
                "communication-whatsapp",
                "communication-calls-meetings",
                "communication-notifications",
                "communication-analytics",
              ].includes(activeTab) ? (
                <CommunicationsPage
                  workspaceMode={activeTab}
                  inquiries={inquiries}
                  appointments={appointments}
                  followUpReminders={followUpReminders}
                  adminProfile={adminProfile}
                  setActiveTab={setActiveTab}
                  toggleInquiryStatus={toggleInquiryStatus}
                  updateAppointmentStatus={updateAppointmentStatus}
                />
              ) : [
                "operations-tasks",
                "operations-automation",
                "operations-actions",
              ].includes(activeTab) ? (
                <OperationsPage
                  workspaceMode={activeTab}
                  inquiries={inquiries}
                  appointments={appointments}
                  followUpReminders={followUpReminders}
                  studentTasks={studentTasks}
                  setActiveTab={setActiveTab}
                  toggleInquiryStatus={toggleInquiryStatus}
                  updateAppointmentStatus={updateAppointmentStatus}
                />
              ) : activeTab === "my-leads" ? (
                <MyLeadsPage
                  cardClass={cardClass}
                  adminProfile={adminProfile}
                />
              ) : [
                "enterprise-finance",
                "enterprise-marketing",
                "enterprise-partners",
                "enterprise-agents",
                "enterprise-compliance",
                "enterprise-hr",
              ].includes(activeTab) ? (
                <EnterprisePage
                  workspaceMode={activeTab}
                  adminProfile={adminProfile}
                  inquiries={inquiries}
                  appointments={appointments}
                  followUpReminders={followUpReminders}
                  studentApplications={studentApplications}
                  studentDocuments={studentDocuments}
                  studentTasks={studentTasks}
                  studentUniversities={studentUniversities}
                  studentInvoices={studentInvoices}
                  studentPayments={studentPayments}
                  counselorPaymentRequests={counselorPaymentRequests}
                />
              ) : activeTab === "knowledge-os" ? (
                <KnowledgeOSDashboard
                  adminProfile={adminProfile}
                  snapshot={{
                    sops: [],
                    training: [],
                    universityRules: [],
                    visaGuides: [],
                    policies: [],
                  }}
                  onRefresh={fetchAllData}
                />
              ) : activeTab === "mobile-os" ? (
                <MobileControlCenter
                  adminProfile={adminProfile}
                  snapshot={{
                    students: [...inquiries, ...appointments],
                    supportRequests,
                    studentTasks,
                    studentDocuments,
                    studentPayments,
                  }}
                  onRefresh={fetchAllData}
                />
              ) : [
                "system-overview",
                "system-activity",
                "system-settings",
              ].includes(activeTab) ? (
                <SystemPage
                  workspaceMode={activeTab}
                  cardClass={cardClass}
                  role={role}
                  roleLabel={roleLabels[role] || role}
                  adminProfile={adminProfile}
                  permissions={currentPermissions}
                  setActiveTab={setActiveTab}
                />
              ) : [
                "team-command",
                "team-workload",
                "team-performance",
                "team-access",
              ].includes(activeTab) ? (
                <TeamPage
                  workspaceMode={activeTab}
                  cardClass={cardClass}
                  inquiries={inquiries}
                  appointments={appointments}
                  followUpReminders={followUpReminders}
                  role={role}
                  adminProfile={adminProfile}
                  permissions={currentPermissions}
                />
              ) : [
                "ai-command",
                "crm-analytics",
                "risk-intelligence",
                "executive-intelligence",
              ].includes(activeTab) ? (
                <AnalyticsPage
                  workspaceMode={activeTab}
                  cardClass={cardClass}
                  adminProfile={adminProfile}
                  inquiries={inquiries}
                  appointments={appointments}
                  followUpReminders={followUpReminders}
                  studentApplications={studentApplications}
                  studentDocuments={studentDocuments}
                  studentTasks={studentTasks}
                  studentUniversities={studentUniversities}
                  studentRiskScores={studentRiskScores}
                  activeAnalyticsSection={activeAnalyticsSection}
                  setActiveAnalyticsSection={setActiveAnalyticsSection}
                  toggleInquiryStatus={toggleInquiryStatus}
                  updateAppointmentStage={updateAppointmentStage}
                  updateAppointmentStatus={updateAppointmentStatus}
                  setActiveTab={setActiveTab}
                  todayInquiriesCount={todayInquiriesCount}
                  todayAppointmentsCount={todayAppointmentsCount}
                  latestInquiry={latestInquiry}
                  latestAppointment={latestAppointment}
                  studentInvoices={studentInvoices}
                  studentPayments={studentPayments}
                  studentReceipts={studentReceipts}
                  studentPortalAccounts={studentPortalAccounts}
                  supportRequests={supportRequests}
                  counselorPaymentRequests={counselorPaymentRequests}
                  executiveExecutionLogs={executiveExecutionLogs}
                />
              ) : (
                <PipelinePage
                  activeTab={activeTab}
                  search={search}
                  setSearch={setSearch}
                  statusOptions={statusOptions}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  loading={loading}
                  inquiries={inquiries}
                  filteredInquiries={filteredInquiries}
                  appointments={appointments}
                  filteredAppointments={filteredAppointments}
                  cardClass={cardClass}
                  toggleInquiryStatus={toggleInquiryStatus}
                  updateInquiryPriority={updateInquiryPriority}
                  updateAppointmentPriority={updateAppointmentPriority}
                  deleteInquiry={deleteInquiry}
                  updateAppointmentStatus={updateAppointmentStatus}
                  updateAppointmentStage={updateAppointmentStage}
                  deleteAppointment={deleteAppointment}
                  role={role}
                  adminProfile={adminProfile}
                  permissions={currentPermissions}
                  reanalyzeLeadWithGpt={reanalyzeLeadWithGpt}
                  aiReanalysisState={aiReanalysisState}
                  allLeads={allLeads}
                />
              )}
            </Suspense>
          </div>
        </main>
      </div>
    </section>
  );
}




function AdminEntryLoader({ retryCount = 0, retryLimit = 0 }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FFF8EF] px-6 text-[#10233F]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF5A0A]/[0.045] blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-[430px] flex-col items-center text-center">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-[1.7rem] border border-[#FF5A0A]/20 bg-white shadow-[0_18px_55px_rgba(16,35,63,0.08)]">
          <div className="absolute h-12 w-12 animate-spin rounded-full border-[3px] border-[#123865]/10 border-t-[#FF5A0A]" />

          <svg
            viewBox="0 0 24 24"
            className="relative h-6 w-6 text-[#123865]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 17h16" />
            <path d="M6.5 17V9.5L12 6l5.5 3.5V17" />
            <path d="M9 17v-4h6v4" />
            <path d="M8 7.6V5h8v2.6" />
          </svg>
        </div>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#123865]/10 bg-white/80 px-3.5 py-1.5 shadow-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF5A0A]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#123865]/70">
            Zaifan Admin OS
          </span>
        </div>

        <h1 className="mt-4 text-2xl font-black tracking-[-0.025em] text-[#10233F]">
          Opening Admin workspace
        </h1>

        <p className="mt-2 max-w-[350px] text-sm font-medium leading-6 text-[#58708D]">
          Verifying your session and preparing the Admin command center.
        </p>

        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-[#123865]/45">
          Preparing secure workspace
        </p>

        {retryCount > 0 && retryLimit > 0 && (
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#FF5A0A]">
            Profile check {retryCount}/{retryLimit}
          </p>
        )}
      </div>
    </main>
  );
}

function SystemNotice({ tone = "success", children }) {
  const toneClass =
    tone === "error"
      ? "border-red-400/20 bg-red-500/10 text-red-300"
      : tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-emerald-400/20 bg-emerald-500/10 text-emerald-700";

  return (
    <div
      className={`mb-5 rounded-[1.4rem] border p-4 text-sm shadow-sm ${toneClass}`}
    >
      {children}
    </div>
  );
}

export default AdminPage;