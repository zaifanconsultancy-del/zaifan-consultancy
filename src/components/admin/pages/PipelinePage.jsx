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
}) {
  return (
    <>
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
          />
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export default PipelinePage;