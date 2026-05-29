export function getStatusOptions(activeTab) {
  if (activeTab === "inquiries") {
    return [
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
    ];
  }

  return [
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
  ];
}