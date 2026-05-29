export function calculateDashboardStats({
  inquiries = [],
  appointments = [],
}) {
  return {
    totalInquiries: inquiries.length,
    totalAppointments: appointments.length,
    totalLeads: inquiries.length + appointments.length,
  };
}