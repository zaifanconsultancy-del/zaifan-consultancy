export function normalizeFilterValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

export function filterInquiries({
  inquiries = [],
  search = "",
  statusFilter = "All",
}) {
  const searchText = search.toLowerCase();
  const filterValue = normalizeFilterValue(statusFilter);

  return inquiries.filter((inquiry) => {
    const status = inquiry.status || "new";
    const priority = inquiry.priority || "low";

    const matchesSearch =
      inquiry.full_name?.toLowerCase().includes(searchText) ||
      inquiry.email?.toLowerCase().includes(searchText) ||
      inquiry.phone?.toLowerCase().includes(searchText) ||
      priority.toLowerCase().includes(searchText) ||
      inquiry.country?.toLowerCase().includes(searchText) ||
      inquiry.city?.toLowerCase().includes(searchText) ||
      inquiry.field_of_interest?.toLowerCase().includes(searchText) ||
      inquiry.study_level?.toLowerCase().includes(searchText) ||
      inquiry.assigned_admin_name?.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "All" || status === filterValue || priority === filterValue;

    return matchesSearch && matchesStatus;
  });
}

export function filterAppointments({
  appointments = [],
  search = "",
  statusFilter = "All",
}) {
  const searchText = search.toLowerCase();
  const filterValue = normalizeFilterValue(statusFilter);

  return appointments.filter((appointment) => {
    const status = appointment.status || "pending";
    const appointmentStage = appointment.appointment_stage || "new_booking";
    const priority = appointment.priority || "low";

    const matchesSearch =
      appointment.full_name?.toLowerCase().includes(searchText) ||
      appointment.email?.toLowerCase().includes(searchText) ||
      appointment.phone?.toLowerCase().includes(searchText) ||
      appointment.country_interest?.toLowerCase().includes(searchText) ||
      appointment.consultation_type?.toLowerCase().includes(searchText) ||
      appointment.appointment_date?.toLowerCase().includes(searchText) ||
      appointment.appointment_time?.toLowerCase().includes(searchText) ||
      appointmentStage.toLowerCase().includes(searchText) ||
      priority.toLowerCase().includes(searchText) ||
      appointment.assigned_admin_name?.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "All" ||
      status === filterValue ||
      appointmentStage === filterValue ||
      priority === filterValue;

    return matchesSearch && matchesStatus;
  });
}