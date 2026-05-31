import { AnimatePresence, motion } from "framer-motion";

import SearchToolbar from "../SearchToolbar";
import DashboardContent from "../DashboardContent";

function PipelinePage({
  activeTab,
  search,
  setSearch,
  statusOptions,
  statusFilter,
  setStatusFilter,
  loading,
  inquiries = [],
  filteredInquiries = [],
  appointments = [],
  filteredAppointments = [],
  allLeads = [],
  cardClass,
  toggleInquiryStatus,
  updateInquiryPriority,
  updateAppointmentPriority,
  deleteInquiry,
  updateAppointmentStatus,
  updateAppointmentStage,
  deleteAppointment,
  role,
  adminProfile,
  permissions,
  reanalyzeLeadWithGpt = null,
  aiReanalysisState = {
    loading: false,
    leadId: null,
    leadType: null,
    message: "",
    error: "",
  },
}) {
  const visibleCount =
    activeTab === "appointments"
      ? filteredAppointments.length
      : filteredInquiries.length;

  const totalCount =
    activeTab === "appointments" ? appointments.length : inquiries.length;

  const sectionLabel =
    activeTab === "appointments" ? "Appointment Pipeline" : "Inquiry Pipeline";

  const completeAllLeads =
    allLeads.length > 0
      ? allLeads
      : [
          ...inquiries.map((lead) => ({ ...lead, __leadType: "inquiry" })),
          ...appointments.map((lead) => ({
            ...lead,
            __leadType: "appointment",
          })),
        ];

  return (
    <>
      <div className="mb-5 rounded-[1.5rem] border border-[#D4AF37]/15 bg-[#D4AF37]/[0.055] p-4 backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#D4AF37]">
              Real AI Pipeline Layer
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              {sectionLabel}
            </h2>

            <p className="mt-1 text-sm text-white/45">
              Showing {visibleCount} of {totalCount} records. Executive AI now
              has access to {completeAllLeads.length} CRM lead(s).
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-xs font-bold text-white/55">
              Local AI: Always On
            </span>

            <span className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold text-[#D4AF37]">
              GPT: Manual Save
            </span>

            <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-300">
              Executive Context: {completeAllLeads.length}
            </span>

            {aiReanalysisState.loading ? (
              <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300">
                GPT Analyzing...
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <SearchToolbar
        activeTab={activeTab}
        search={search}
        setSearch={setSearch}
        statusOptions={statusOptions}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22 }}
        >
          <DashboardContent
            loading={loading}
            activeTab={activeTab}
            inquiries={inquiries}
            filteredInquiries={filteredInquiries}
            appointments={appointments}
            filteredAppointments={filteredAppointments}
            allLeads={completeAllLeads}
            cardClass={cardClass}
            updateInquiryStatus={toggleInquiryStatus}
            updateInquiryPriority={updateInquiryPriority}
            updateAppointmentPriority={updateAppointmentPriority}
            deleteInquiry={deleteInquiry}
            updateAppointmentStatus={updateAppointmentStatus}
            updateAppointmentStage={updateAppointmentStage}
            deleteAppointment={deleteAppointment}
            role={role}
            adminProfile={adminProfile}
            permissions={permissions}
            reanalyzeLeadWithGpt={reanalyzeLeadWithGpt}
            aiReanalysisState={aiReanalysisState}
          />
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export default PipelinePage;