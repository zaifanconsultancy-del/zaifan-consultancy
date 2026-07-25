export function getLatestRecords({
  inquiries = [],
  appointments = [],
} = {}) {
  const safeInquiries = Array.isArray(inquiries) ? inquiries : [];
  const safeAppointments = Array.isArray(appointments) ? appointments : [];

  return {
    latestInquiry: safeInquiries[0],
    latestAppointment: safeAppointments[0],
  };
}