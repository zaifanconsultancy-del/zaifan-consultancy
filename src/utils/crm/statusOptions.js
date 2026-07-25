const INQUIRY_STATUS_OPTIONS = Object.freeze([
  "All",
  "New",
  "Contacted",
  "Documents Pending",
  "Applied",
  "Offer Letter",
  "Visa Process",
  "Approved",
  "VIP",
  "High",
  "Medium",
  "Low",
]);

const APPOINTMENT_STATUS_OPTIONS = Object.freeze([
  "All",
  "New Booking",
  "Confirmed",
  "Consultation Done",
  "Follow Up Needed",
  "Converted To Lead",
  "Not Interested",
  "Cancelled",
  "Pending",
  "Completed",
  "VIP",
  "High",
  "Medium",
  "Low",
]);

export function getStatusOptions(activeTab) {
  return String(activeTab ?? "").trim().toLowerCase() === "inquiries"
    ? INQUIRY_STATUS_OPTIONS
    : APPOINTMENT_STATUS_OPTIONS;
}