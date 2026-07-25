export function normalizeFilterValue(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function normalizeSearchValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function matchesSearch(searchText, values) {
  if (!searchText) return true;

  for (const value of values) {
    if (normalizeSearchValue(value).includes(searchText)) {
      return true;
    }
  }

  return false;
}

export function filterInquiries({
  inquiries = [],
  search = "",
  statusFilter = "All",
} = {}) {
  const searchText = normalizeSearchValue(search);
  const filterValue = normalizeFilterValue(statusFilter);
  const showAll = filterValue === "all";

  return safeArray(inquiries).filter((inquiry) => {
    const status = normalizeFilterValue(inquiry?.status || "new");
    const priority = normalizeFilterValue(inquiry?.priority || "low");

    const matchesStatus =
      showAll || status === filterValue || priority === filterValue;

    if (!matchesStatus) return false;

    return matchesSearch(searchText, [
      inquiry?.full_name,
      inquiry?.name,
      inquiry?.email,
      inquiry?.phone,
      inquiry?.phone_number,
      inquiry?.whatsapp,
      inquiry?.priority,
      inquiry?.country,
      inquiry?.country_interest,
      inquiry?.city,
      inquiry?.field_of_interest,
      inquiry?.study_level,
      inquiry?.assigned_admin_name,
    ]);
  });
}

export function filterAppointments({
  appointments = [],
  search = "",
  statusFilter = "All",
} = {}) {
  const searchText = normalizeSearchValue(search);
  const filterValue = normalizeFilterValue(statusFilter);
  const showAll = filterValue === "all";

  return safeArray(appointments).filter((appointment) => {
    const status = normalizeFilterValue(
      appointment?.status || "pending"
    );
    const appointmentStage = normalizeFilterValue(
      appointment?.appointment_stage || "new_booking"
    );
    const priority = normalizeFilterValue(
      appointment?.priority || "low"
    );

    const matchesStatus =
      showAll ||
      status === filterValue ||
      appointmentStage === filterValue ||
      priority === filterValue;

    if (!matchesStatus) return false;

    return matchesSearch(searchText, [
      appointment?.full_name,
      appointment?.name,
      appointment?.email,
      appointment?.phone,
      appointment?.phone_number,
      appointment?.country_interest,
      appointment?.consultation_type,
      appointment?.appointment_date,
      appointment?.appointment_time,
      appointment?.appointment_stage,
      appointment?.priority,
      appointment?.assigned_admin_name,
    ]);
  });
}