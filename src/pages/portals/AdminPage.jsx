import { lazy, Suspense, useEffect, useMemo, useState } from "react";

import AdminLogin from "../../components/admin/AdminLogin";
const AdminHeader = lazy(() => import("../../components/admin/AdminHeader"));
const AdminStats = lazy(() => import("../../components/admin/AdminStats"));
const NotificationCenter = lazy(() => import("../../components/admin/NotificationCenter"));
import AdminSidebar from "../../components/admin/AdminSidebar";
const CommandPalette = lazy(() => import("../../components/admin/CommandPalette"));

const AnalyticsPage = lazy(() =>
  import("../../components/admin/pages/AnalyticsPage")
);
const FollowUpsPage = lazy(() =>
  import("../../components/admin/pages/FollowUpsPage")
);
const AutomationPage = lazy(() =>
  import("../../components/admin/pages/AutomationPage")
);
const MyLeadsPage = lazy(() =>
  import("../../components/admin/pages/MyLeadsPage")
);
const ActivityLogsPage = lazy(() =>
  import("../../components/admin/pages/ActivityLogsPage")
);
const AdminManagementPage = lazy(() =>
  import("../../components/admin/pages/AdminManagementPage")
);
const SettingsPage = lazy(() =>
  import("../../components/admin/pages/SettingsPage")
);
const PipelinePage = lazy(() =>
  import("../../components/admin/pages/PipelinePage")
);

import useAdminAuth from "../../hooks/useAdminAuth";
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

import { shouldShowStats } from "../../utils/crm/dashboardFilters";
import { PROFILE_RETRY_LIMIT } from "../../utils/crm/constants";
import { supabase } from "../../lib/supabaseClient";
import { generateGptCopilotText } from "../../services/gptCopilotService";
import { enrichLeadWithAi } from "../../services/aiLeadEngine";

const ADMIN_ACTIVE_TAB_KEY = "zaifan_admin_active_tab";
const ADMIN_ANALYTICS_SECTION_KEY = "zaifan_admin_analytics_section";
const ADMIN_SCROLL_KEY = "zaifan_admin_scroll_y";
const ADMIN_OVERVIEW_COLLAPSED_KEY = "zaifan_admin_overview_collapsed";

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
    getStoredValue(ADMIN_ACTIVE_TAB_KEY, "inquiries")
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeAnalyticsSection, setActiveAnalyticsSection] = useState(() =>
    getStoredValue(ADMIN_ANALYTICS_SECTION_KEY, "ai-executive")
  );
  const [overviewCollapsed, setOverviewCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(ADMIN_OVERVIEW_COLLAPSED_KEY) === "1";
  });
  const [aiReanalysisState, setAiReanalysisState] = useState({
    loading: false,
    leadId: null,
    leadType: null,
    message: "",
    error: "",
  });

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
    sessionStorage.setItem(
      ADMIN_OVERVIEW_COLLAPSED_KEY,
      overviewCollapsed ? "1" : "0"
    );
  }, [overviewCollapsed]);

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

  const auth = useAdminAuth();

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
  const showOverviewStats = useMemo(() => shouldShowStats(activeTab), [activeTab]);

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

  if (!sessionChecked || (profileLoading && !adminProfile)) {
    return (
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fff7ef] px-6 text-[#0b2a57]">
        <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_30px_100px_rgba(15,23,42,0.12)]">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-2 border-orange-500 border-t-transparent"></div>

          <h1 className="text-2xl font-black text-[#0b2a57]">
            Checking Admin Role
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Please wait while Zaifan CRM verifies your permissions.
          </p>

          {profileRetryCount > 0 && (
            <p className="mt-3 text-xs text-orange-600">
              Profile check attempt {profileRetryCount}/{PROFILE_RETRY_LIMIT}
            </p>
          )}
        </div>
      </section>
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
            <div className="sticky top-2 z-40 mb-3 flex items-center justify-between gap-3 rounded-[1.15rem] border-2 border-orange-300 bg-[#fff8ee]/95 px-3 py-2.5 shadow-[0_8px_24px_rgba(15,35,63,0.10)] backdrop-blur-md sm:px-4">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
                  Workspace Focus
                </p>
                <p className="truncate text-xs font-bold text-[#10233f] sm:text-sm">
                  {overviewCollapsed
                    ? "Overview hidden — working area moved to the top."
                    : "Overview visible — hide it to reach the active workspace instantly."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOverviewCollapsed((current) => !current);
                  window.requestAnimationFrame(() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  });
                }}
                className={`shrink-0 rounded-xl border-2 px-4 py-2 text-xs font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${
                  overviewCollapsed
                    ? "border-orange-500 bg-orange-500 text-white hover:bg-orange-600"
                    : "border-[#234e78] bg-[#123865] text-white hover:bg-[#0d2d50]"
                }`}
              >
                {overviewCollapsed ? "Show Overview" : "Hide Overview"}
              </button>
            </div>

            {!overviewCollapsed && (
            <>
            <div className="relative mb-6 overflow-hidden rounded-[2rem] border-2 border-orange-400 bg-[#173f69] text-white shadow-[0_24px_70px_rgba(16,49,86,0.16)]">
              <div className="grid lg:grid-cols-[minmax(0,1fr)_380px]">
                <div className="relative p-5 sm:p-7">
                  <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-28 right-10 h-56 w-56 rounded-full bg-[#2f6ea8]/25 blur-3xl" />

                  <div className="relative">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                        System online
                      </span>

                      <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white">
                        GPT Coverage {aiCoverageStats.percent}%
                      </span>
                    </div>

                    <h2 className="mt-4 truncate text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl">
                      Welcome back, {adminProfile.full_name || "Admin User"}
                    </h2>

                    <p className="mt-2 max-w-3xl text-[15px] font-semibold leading-6 text-white/85">
                      Operating as{" "}
                      <span className="font-black text-[#ff8a2a]">
                        {roleLabels[role] || role}
                      </span>
                      . Your workspace is ready.
                    </p>
                  </div>
                </div>

                <aside className="relative border-t-2 border-orange-300/50 bg-[#ff5a0a] p-5 text-white lg:border-l-2 lg:border-t-0 lg:border-orange-300/50 sm:p-6">
                  <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

                  <div className="relative">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/90">
                      Operator permissions
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-white">
                      {roleLabels[role] || role}
                    </h3>
                    <p className="mt-1 text-xs font-bold text-white/85">
                      Live access controls for this session
                    </p>

                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <PermissionPill
                        label="Delete"
                        enabled={currentPermissions.canDelete}
                        dark
                      />
                      <PermissionPill
                        label="Export"
                        enabled={currentPermissions.canExport}
                        dark
                      />
                      <PermissionPill
                        label="Clear all"
                        enabled={currentPermissions.canClearAll}
                        dark
                      />
                    </div>
                  </div>
                </aside>
              </div>

              <div className="border-t border-orange-200/80 bg-[#fff8f1] p-4 sm:p-5">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
                  <AdminCommandMetric
                    label="Student leads"
                    value={adminCommandMetrics.totalLeads}
                    detail="Unified inquiry + appointment portfolio"
                  />
                  <AdminCommandMetric
                    label="Pending appointments"
                    value={adminCommandMetrics.pendingAppointments}
                    detail="Consultations awaiting action"
                    tone="orange"
                  />
                  <AdminCommandMetric
                    label="Open tasks"
                    value={adminCommandMetrics.pendingTasks}
                    detail="Student operations still active"
                    tone="blue"
                  />
                  <AdminCommandMetric
                    label="Support queue"
                    value={adminCommandMetrics.openSupport}
                    detail="Unresolved student requests"
                    tone={adminCommandMetrics.openSupport ? "red" : "green"}
                  />
                  <AdminCommandMetric
                    label="Portal accounts"
                    value={adminCommandMetrics.activePortalAccounts}
                    detail="Active Student OS access"
                    tone="green"
                  />
                  <AdminCommandMetric
                    label="GPT coverage"
                    value={`${adminCommandMetrics.gptCoverage}%`}
                    detail="Leads with stored GPT intelligence"
                    tone="orange"
                  />
                </div>
              </div>
            </div>

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

            <div className="zaifan-admin-embedded-dark relative z-20 mb-6 overflow-visible">
              <AdminHeader
              inquiries={inquiries}
              appointments={appointments}
              appointmentPendingCount={appointmentPendingCount}
              fetchAllData={fetchAllData}
              activeTab={activeTab}
              exportInquiriesToCSV={exportInquiriesToCSV}
              exportAppointmentsToCSV={exportAppointmentsToCSV}
              logout={handleLogout}
              clearInquiries={clearInquiries}
              clearAppointments={clearAppointments}
              role={role}
              adminProfile={adminProfile}
              permissions={currentPermissions}
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
              setActiveTab={setActiveTab}
              setActiveAnalyticsSection={setActiveAnalyticsSection}
            />
            </div>

            {showOverviewStats && (
              <div className="mb-4 flex flex-col gap-1 px-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-orange-600">Live operating picture</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-[#0b2a57] sm:text-3xl">What needs attention right now</h2>
                </div>
                <p className="max-w-xl text-sm font-medium leading-6 text-slate-600">A focused view of CRM pressure, student readiness, finance, access and support signals.</p>
              </div>
            )}

            {showOverviewStats && (
              <Suspense fallback={<AdminInsightLoader />}>
                <>
                <div className="zaifan-admin-embedded-dark mb-4">
                <NotificationCenter
                  cardClass={cardClass}
                  inquiryNewCount={inquiryNewCount}
                  appointmentPendingCount={appointmentPendingCount}
                  appointmentConfirmedCount={appointmentConfirmedCount}
                  role={role}
                  permissions={currentPermissions}
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
                  setActiveTab={setActiveTab}
                  setActiveAnalyticsSection={setActiveAnalyticsSection}
                />
                </div>

                <AdminStats
                  cardClass={cardClass}
                  inquiries={inquiries}
                  inquiryNewCount={inquiryNewCount}
                  inquiryContactedCount={inquiryContactedCount}
                  appointments={appointments}
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
                />
                </>
              </Suspense>
            )}

            </>
            )}

            <Suspense fallback={<AdminModuleLoader />}>
              {activeTab === "followups" ? (
                <FollowUpsPage cardClass={cardClass} />
              ) : activeTab === "automation" ? (
                <AutomationPage
                  cardClass={cardClass}
                  inquiries={inquiries}
                  appointments={appointments}
                />
              ) : activeTab === "my-leads" ? (
                <MyLeadsPage
                  cardClass={cardClass}
                  adminProfile={adminProfile}
                />
              ) : activeTab === "activity-logs" ? (
                <ActivityLogsPage cardClass={cardClass} />
              ) : activeTab === "admin-management" ? (
                <AdminManagementPage
                  cardClass={cardClass}
                  role={role}
                  adminProfile={adminProfile}
                  permissions={currentPermissions}
                />
              ) : activeTab === "analytics" ? (
                <AnalyticsPage
                  cardClass={cardClass}
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
              ) : activeTab === "settings" ? (
                <SettingsPage
                  cardClass={cardClass}
                  currentPermissions={currentPermissions}
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



function AdminCommandMetric({ label, value, detail, tone = "slate" }) {
  const tones = {
    slate: "border-orange-300 bg-[#fff8f1]",
    orange: "border-orange-300 bg-[#fff7ef]",
    blue: "border-blue-300 bg-[#eef6ff]",
    red: "border-rose-300 bg-[#fff1f3]",
    green: "border-emerald-300 bg-[#ecfbf4]",
  };

  const values = {
    slate: "text-[#102b4c]",
    orange: "text-[#c93208]",
    blue: "text-[#164fa3]",
    red: "text-[#c42145]",
    green: "text-[#087f5b]",
  };

  return (
    <div
      className={`rounded-2xl border-2 p-3.5 shadow-[0_4px_10px_rgba(16,43,76,0.06)] ${
        tones[tone] || tones.slate
      }`}
    >
      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#63738a]">
        {label}
      </p>
      <p className={`mt-1.5 text-xl font-black ${values[tone] || values.slate}`}>
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-4 text-[#415674]">{detail}</p>
    </div>
  );
}

function AdminInsightLoader() {
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-28 animate-pulse rounded-[1.4rem] border border-slate-200 bg-white shadow-sm"
        />
      ))}
    </div>
  );
}

function PermissionPill({ label, enabled, dark = false }) {
  if (dark) {
    return (
      <div
        className={`whitespace-nowrap rounded-xl border px-2.5 py-2.5 text-center text-[9px] font-black uppercase tracking-[0.06em] ${
          enabled
            ? "border-white/45 bg-white/15 text-white"
            : "border-white/20 bg-[#173f69]/25 text-white/55"
        }`}
      >
        {label}: {enabled ? "Yes" : "No"}
      </div>
    );
  }

  return (
    <div
      className={`whitespace-nowrap rounded-xl border px-3 py-2 text-center text-[11px] font-extrabold uppercase tracking-[0.08em] ${
        enabled
          ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-400"
      }`}
    >
      {label}: {enabled ? "Yes" : "No"}
    </div>
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

function AdminModuleLoader() {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-[1.4rem] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.04)]">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-orange-100 border-t-orange-500" />
        <p className="mt-4 text-sm font-black text-slate-800">
          Opening workspace
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Loading only the module you need.
        </p>
      </div>
    </div>
  );
}

export default AdminPage;