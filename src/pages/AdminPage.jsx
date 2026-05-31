import { useMemo, useState } from "react";

import AdminLogin from "../components/admin/AdminLogin";
import AdminHeader from "../components/admin/AdminHeader";
import AdminStats from "../components/admin/AdminStats";
import NotificationCenter from "../components/admin/NotificationCenter";
import AdminSidebar from "../components/admin/AdminSidebar";
import CommandPalette from "../components/admin/CommandPalette";

import AnalyticsPage from "../components/admin/pages/AnalyticsPage";
import FollowUpsPage from "../components/admin/pages/FollowUpsPage";
import AutomationPage from "../components/admin/pages/AutomationPage";
import MyLeadsPage from "../components/admin/pages/MyLeadsPage";
import ActivityLogsPage from "../components/admin/pages/ActivityLogsPage";
import AdminManagementPage from "../components/admin/pages/AdminManagementPage";
import SettingsPage from "../components/admin/pages/SettingsPage";
import PipelinePage from "../components/admin/pages/PipelinePage";

import useAdminAuth from "../hooks/useAdminAuth";
import useAdminDashboardData from "../hooks/useAdminDashboardData";
import useAdminActivityLogger from "../hooks/useAdminActivityLogger";
import useAdminLeadActions from "../hooks/useAdminLeadActions";

import {
  filterInquiries,
  filterAppointments,
  getCrmCounts,
  getTodayCounts,
  getPermissionsForRole,
  getStatusOptions,
  roleLabels,
} from "../utils/crm";

import { shouldShowStats } from "../utils/crm/dashboardFilters";
import { PROFILE_RETRY_LIMIT } from "../utils/crm/constants";
import { supabase } from "../lib/supabaseClient";
import { generateGptCopilotText } from "../services/gptCopilotService";
import { enrichLeadWithAi } from "../services/aiLeadEngine";

function AdminPage() {
  const [activeTab, setActiveTab] = useState("inquiries");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeAnalyticsSection, setActiveAnalyticsSection] =
    useState("ai-executive");
  const [aiReanalysisState, setAiReanalysisState] = useState({
    loading: false,
    leadId: null,
    leadType: null,
    message: "",
    error: "",
  });

  const cardClass =
    "group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[#D4AF37]/35 hover:bg-white/[0.055] sm:rounded-[2rem] sm:p-6";

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-white outline-none placeholder:text-gray-500 focus:border-[#D4AF37]";

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
    loading,
    loadError,
    fetchAllData,
    clearLocalData,
  } = useAdminDashboardData({
    isLoggedIn,
    adminProfile,
  });

  const role = adminProfile?.role || "staff";
  const currentPermissions = getPermissionsForRole(role);

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
      }.` ,
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

  const filteredInquiries = filterInquiries({
    inquiries,
    search,
    statusFilter,
  });

  const filteredAppointments = filterAppointments({
    appointments,
    search,
    statusFilter,
  });

  const {
    inquiryNewCount,
    inquiryContactedCount,
    appointmentPendingCount,
    appointmentConfirmedCount,
    appointmentCompletedCount,
    appointmentCancelledCount,
  } = getCrmCounts({ inquiries, appointments });

  const latestInquiry = inquiries[0];
  const latestAppointment = appointments[0];

  const { todayInquiriesCount, todayAppointmentsCount } = getTodayCounts({
    inquiries,
    appointments,
  });

  const statusOptions = getStatusOptions(activeTab);

  if (!sessionChecked || (profileLoading && !adminProfile)) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
        <div className={`${cardClass} max-w-md text-center`}>
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent"></div>

          <h1 className="text-2xl font-black text-white">
            Checking Admin Role
          </h1>

          <p className="mt-3 text-sm text-gray-400">
            Please wait while Zaifan CRM verifies your permissions.
          </p>

          {profileRetryCount > 0 && (
            <p className="mt-3 text-xs text-[#D4AF37]">
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
      <section className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
        <div className={`${cardClass} max-w-lg text-center`}>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-red-400/20 bg-red-500/10 text-3xl">
            🔒
          </div>

          <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">
            Access Check Paused
          </p>

          <h1 className="mt-3 text-3xl font-black text-white">
            Admin Profile Not Verified Yet
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-gray-400">
            Your login session is active, but Zaifan CRM could not verify your
            admin profile after several attempts. This can happen during Vite hot
            reload or temporary Supabase delay.
          </p>

          {profileError && (
            <div className="mt-5 rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4 text-left text-xs leading-relaxed text-orange-200">
              {profileError}
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4 text-left text-xs text-gray-300">
            <p className="text-gray-500">Your user ID:</p>
            <p className="mt-1 break-all font-mono text-[#D4AF37]">
              {adminUser?.id || "No user ID found"}
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => loadAdminProfile(adminUser?.id, { force: true })}
              className="rounded-full bg-[#D4AF37] px-7 py-3 text-sm font-black text-black transition hover:bg-[#f1cf65]"
            >
              Retry Profile Check
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-white/10 bg-white/[0.04] px-7 py-3 text-sm font-bold text-white transition hover:border-red-400/30 hover:bg-red-500/10"
            >
              Logout
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="absolute right-[-35%] top-[-12%] h-[320px] w-[320px] rounded-full bg-[#D4AF37]/10 blur-3xl sm:right-[-12%] sm:top-[-18%] sm:h-[520px] sm:w-[520px]"></div>
      <div className="absolute bottom-[-18%] left-[-35%] h-[320px] w-[320px] rounded-full bg-[#D4AF37]/5 blur-3xl sm:bottom-[-25%] sm:left-[-12%] sm:h-[520px] sm:w-[520px]"></div>

      <div className="relative flex flex-col xl:flex-row">
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          logout={handleLogout}
          role={role}
          adminProfile={adminProfile}
          permissions={currentPermissions}
        />

        <CommandPalette
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          inquiries={inquiries}
          appointments={appointments}
          followUpReminders={followUpReminders}
          permissions={currentPermissions}
        />

        <main className="min-w-0 flex-1 overflow-hidden px-3 py-4 sm:px-6 sm:py-6 xl:px-10">
          <div className="mb-5 flex flex-col gap-3 rounded-[1.5rem] border border-[#D4AF37]/15 bg-[#D4AF37]/5 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#D4AF37]">
                Role System Active
              </p>

              <h2 className="mt-1 text-xl font-black text-white">
                {adminProfile.full_name || "Admin User"}
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Logged in as{" "}
                <span className="font-bold text-[#D4AF37]">
                  {roleLabels[role] || role}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs text-gray-300">
                Delete: {currentPermissions.canDelete ? "Yes" : "No"}
              </span>

              <span className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs text-gray-300">
                Export: {currentPermissions.canExport ? "Yes" : "No"}
              </span>

              <span className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs text-gray-300">
                Clear All: {currentPermissions.canClearAll ? "Yes" : "No"}
              </span>

              <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold text-[#D4AF37]">
                GPT Coverage: {aiCoverageStats.percent}%
              </span>
            </div>
          </div>

          {aiReanalysisState.message && (
            <div className="mb-5 rounded-[1.5rem] border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              {aiReanalysisState.message}
            </div>
          )}

          {aiReanalysisState.error && (
            <div className="mb-5 rounded-[1.5rem] border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
              {aiReanalysisState.error}
            </div>
          )}

          {profileError && adminProfile && (
            <div className="mb-5 rounded-[1.5rem] border border-orange-400/20 bg-orange-500/10 p-4 text-sm text-orange-200">
              {profileError}
            </div>
          )}

          {loadError && (
            <div className="mb-5 rounded-[1.5rem] border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p>{loadError}</p>

                <button
                  type="button"
                  onClick={() => fetchAllData()}
                  className="rounded-full bg-[#D4AF37] px-5 py-2.5 text-xs font-black text-black transition hover:bg-[#E7C768]"
                >
                  Retry Refresh
                </button>
              </div>
            </div>
          )}

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
          />

          {shouldShowStats(activeTab) && (
            <>
              <NotificationCenter
                cardClass={cardClass}
                inquiryNewCount={inquiryNewCount}
                appointmentPendingCount={appointmentPendingCount}
                appointmentConfirmedCount={appointmentConfirmedCount}
                role={role}
                permissions={currentPermissions}
              />

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
              />
            </>
          )}

          {activeTab === "followups" ? (
            <FollowUpsPage cardClass={cardClass} />
          ) : activeTab === "automation" ? (
            <AutomationPage
              cardClass={cardClass}
              inquiries={inquiries}
              appointments={appointments}
            />
          ) : activeTab === "my-leads" ? (
            <MyLeadsPage cardClass={cardClass} adminProfile={adminProfile} />
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
        </main>
      </div>
    </section>
  );
}

export default AdminPage;
