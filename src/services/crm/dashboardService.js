function safeLength(value) {
  return Array.isArray(value) ? value.length : 0;
}

export function calculateDashboardStats({
  inquiries = [],
  appointments = [],
} = {}) {
  const totalInquiries = safeLength(inquiries);
  const totalAppointments = safeLength(appointments);

  return {
    totalInquiries,
    totalAppointments,
    totalLeads: totalInquiries + totalAppointments,
  };
}