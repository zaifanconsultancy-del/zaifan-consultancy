function normalize(value = "") {
  return String(value ?? "").trim().toLowerCase();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function isSameLocalDay(value, referenceDate) {
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  return (
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth() &&
    date.getDate() === referenceDate.getDate()
  );
}

export function getCrmCounts({ inquiries = [], appointments = [] } = {}) {
  let inquiryNewCount = 0;
  let inquiryContactedCount = 0;

  let appointmentPendingCount = 0;
  let appointmentConfirmedCount = 0;
  let appointmentCompletedCount = 0;
  let appointmentCancelledCount = 0;

  for (const inquiry of safeArray(inquiries)) {
    const status = normalize(inquiry?.status || "new");

    if (status === "new") inquiryNewCount += 1;
    else if (status === "contacted") inquiryContactedCount += 1;
  }

  for (const appointment of safeArray(appointments)) {
    const status = normalize(appointment?.status || "pending");

    if (status === "pending") appointmentPendingCount += 1;
    else if (status === "confirmed") appointmentConfirmedCount += 1;
    else if (
      status === "completed" ||
      status === "complete" ||
      status === "done"
    ) {
      appointmentCompletedCount += 1;
    } else if (status === "cancelled" || status === "canceled") {
      appointmentCancelledCount += 1;
    }
  }

  return {
    inquiryNewCount,
    inquiryContactedCount,
    appointmentPendingCount,
    appointmentConfirmedCount,
    appointmentCompletedCount,
    appointmentCancelledCount,
  };
}

export function getTodayCounts({
  inquiries = [],
  appointments = [],
} = {}) {
  const today = new Date();

  let todayInquiriesCount = 0;
  let todayAppointmentsCount = 0;

  for (const inquiry of safeArray(inquiries)) {
    if (isSameLocalDay(inquiry?.created_at, today)) {
      todayInquiriesCount += 1;
    }
  }

  for (const appointment of safeArray(appointments)) {
    if (isSameLocalDay(appointment?.created_at, today)) {
      todayAppointmentsCount += 1;
    }
  }

  return {
    todayInquiriesCount,
    todayAppointmentsCount,
  };
}