export function getLatestRecords({
  inquiries = [],
  appointments = [],
}) {
  return {
    latestInquiry: inquiries[0],
    latestAppointment: appointments[0],
  };
}