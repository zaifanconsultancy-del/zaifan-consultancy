import { supabase } from "../lib/supabaseClient";

import {
  deleteInquiryRow,
  updateInquiryPriorityRow,
  updateInquiryStatusRow,
} from "../services/crm/inquiryService";

import {
  deleteAppointmentRow,
  updateAppointmentPriorityRow,
  updateAppointmentStageRow,
  updateAppointmentStatusRow,
} from "../services/crm/appointmentService";

import { downloadCSVFile } from "../services/crm/csvExportService";

import { getStatusFromAppointmentStage } from "../utils/crm";
import { withTimeout } from "../utils/crm/requestUtils";

export default function useAdminLeadActions({
  inquiries,
  setInquiries,
  appointments,
  setAppointments,
  currentPermissions,
  logActivity,
}) {
  const blockAction = (message) => {
    alert(message);
  };

  const deleteInquiry = async (id) => {
    if (!currentPermissions.canDelete) {
      blockAction("Only Admin and Super Admin can delete inquiries.");
      return;
    }

    const confirmDelete = confirm("Delete this inquiry?");
    if (!confirmDelete) return;

    try {
      const { error } = await withTimeout(
        deleteInquiryRow(id),
        "Delete inquiry"
      );

      if (error) {
        console.error(error);
        alert("Failed to delete inquiry.");
        return;
      }

      setInquiries((current) =>
        current.filter((inquiry) => inquiry.id !== id)
      );

      await logActivity({
        action: "Deleted inquiry",
        targetType: "inquiry",
        targetId: id,
        details: "Inquiry deleted",
      });
    } catch (error) {
      console.error(error);
      alert("Delete inquiry request timed out or failed.");
    }
  };

  const deleteAppointment = async (id) => {
    if (!currentPermissions.canDelete) {
      blockAction("Only Admin and Super Admin can delete appointments.");
      return;
    }

    const confirmDelete = confirm("Delete this appointment?");
    if (!confirmDelete) return;

    try {
      const { error } = await withTimeout(
        deleteAppointmentRow(id),
        "Delete appointment"
      );

      if (error) {
        console.error(error);
        alert("Failed to delete appointment.");
        return;
      }

      setAppointments((current) =>
        current.filter((appointment) => appointment.id !== id)
      );

      await logActivity({
        action: "Deleted appointment",
        targetType: "appointment",
        targetId: id,
        details: "Appointment deleted",
      });
    } catch (error) {
      console.error(error);
      alert("Delete appointment request timed out or failed.");
    }
  };

  const toggleInquiryStatus = async (id, newStatus) => {
    if (!currentPermissions.canUpdateStatus) {
      blockAction("You do not have permission to update inquiry status.");
      return;
    }

    const selectedInquiry = inquiries.find((inquiry) => inquiry.id === id);
    const oldStatus = selectedInquiry?.status || "new";

    try {
      const { error } = await withTimeout(
        updateInquiryStatusRow(id, newStatus),
        "Update inquiry status"
      );

      if (error) {
        console.error(error);
        alert("Failed to update inquiry status.");
        return;
      }

      setInquiries((current) =>
        current.map((inquiry) =>
          inquiry.id === id ? { ...inquiry, status: newStatus } : inquiry
        )
      );

      await logActivity({
        action: "Updated inquiry pipeline",
        targetType: "inquiry",
        targetId: id,
        details: `Changed inquiry stage from ${oldStatus} to ${newStatus}.`,
      });
    } catch (error) {
      console.error(error);
      alert("Pipeline update timed out or failed.");
    }
  };

  const updateInquiryPriority = async (id, newPriority) => {
    if (!currentPermissions.canUpdatePriority) {
      blockAction("You do not have permission to update inquiry priority.");
      return;
    }

    try {
      const { error } = await withTimeout(
        updateInquiryPriorityRow(id, newPriority),
        "Update inquiry priority"
      );

      if (error) {
        console.error(error);
        alert("Failed to update inquiry priority.");
        return;
      }

      setInquiries((current) =>
        current.map((inquiry) =>
          inquiry.id === id ? { ...inquiry, priority: newPriority } : inquiry
        )
      );

      await logActivity({
        action: "Updated inquiry priority",
        targetType: "inquiry",
        targetId: id,
        details: `Changed inquiry priority to ${newPriority}.`,
      });
    } catch (error) {
      console.error(error);
      alert("Priority update timed out or failed.");
    }
  };

  const updateAppointmentPriority = async (id, newPriority) => {
    if (!currentPermissions.canUpdatePriority) {
      blockAction("You do not have permission to update appointment priority.");
      return;
    }

    try {
      const { error } = await withTimeout(
        updateAppointmentPriorityRow(id, newPriority),
        "Update appointment priority"
      );

      if (error) {
        console.error(error);
        alert("Failed to update appointment priority.");
        return;
      }

      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === id
            ? { ...appointment, priority: newPriority }
            : appointment
        )
      );

      await logActivity({
        action: "Updated appointment priority",
        targetType: "appointment",
        targetId: id,
        details: `Changed appointment priority to ${newPriority}.`,
      });
    } catch (error) {
      console.error(error);
      alert("Priority update timed out or failed.");
    }
  };

  const updateAppointmentStatus = async (id, newStatus) => {
    if (!currentPermissions.canUpdateStatus) {
      blockAction("You do not have permission to update appointment status.");
      return;
    }

    const selectedAppointment = appointments.find(
      (appointment) => appointment.id === id
    );

    const oldStatus = selectedAppointment?.status || "pending";

    try {
      const { error } = await withTimeout(
        updateAppointmentStatusRow(id, newStatus),
        "Update appointment status"
      );

      if (error) {
        console.error(error);
        alert("Failed to update appointment status.");
        return;
      }

      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === id
            ? { ...appointment, status: newStatus }
            : appointment
        )
      );

      await logActivity({
        action: "Updated appointment status",
        targetType: "appointment",
        targetId: id,
        details: `Changed appointment status from ${oldStatus} to ${newStatus}.`,
      });

      if (newStatus === "confirmed" && oldStatus !== "confirmed") {
        const { data: emailData, error: emailError } = await withTimeout(
          supabase.functions.invoke("send-appointment-status-email", {
            body: {
              fullName: selectedAppointment?.full_name,
              email: selectedAppointment?.email,
              phone: selectedAppointment?.phone,
              country: selectedAppointment?.country_interest,
              service: selectedAppointment?.consultation_type,
              appointmentDate: selectedAppointment?.appointment_date,
              appointmentTime: selectedAppointment?.appointment_time,
              status: newStatus,
            },
          }),
          "Appointment status email"
        );

        console.log("STATUS EMAIL DATA:", emailData);
        console.log("STATUS EMAIL ERROR:", emailError);

        if (emailError) {
          alert("Status updated, but confirmation email failed.");
          return;
        }

        alert("Appointment confirmed and confirmation email sent.");
      }
    } catch (error) {
      console.error(error);
      alert("Appointment status update timed out or failed.");
    }
  };

  const updateAppointmentStage = async (id, newStage) => {
    if (!currentPermissions.canUpdateAppointmentPipeline) {
      blockAction("You do not have permission to update appointment pipeline.");
      return;
    }

    const selectedAppointment = appointments.find(
      (appointment) => String(appointment.id) === String(id)
    );

    const oldStage = selectedAppointment?.appointment_stage || "new_booking";
    const nextStatus = getStatusFromAppointmentStage(newStage);

    setAppointments((current) =>
      current.map((appointment) =>
        String(appointment.id) === String(id)
          ? {
              ...appointment,
              appointment_stage: newStage,
              status: nextStatus,
            }
          : appointment
      )
    );

    try {
      const { error } = await withTimeout(
        updateAppointmentStageRow(id, newStage, nextStatus),
        "Update appointment pipeline"
      );

      if (error) {
        console.error("Appointment pipeline update error:", error);

        setAppointments((current) =>
          current.map((appointment) =>
            String(appointment.id) === String(id)
              ? {
                  ...appointment,
                  appointment_stage: oldStage,
                  status: selectedAppointment?.status || appointment.status,
                }
              : appointment
          )
        );

        alert(
          error.message ||
            "Failed to update appointment pipeline. Check Supabase column/RLS."
        );
        return;
      }

      await logActivity({
        action: "Updated appointment pipeline",
        targetType: "appointment",
        targetId: id,
        details: `Changed appointment pipeline from ${oldStage} to ${newStage}.`,
      });
    } catch (error) {
      console.error("Appointment pipeline timeout/error:", error);

      setAppointments((current) =>
        current.map((appointment) =>
          String(appointment.id) === String(id)
            ? {
                ...appointment,
                appointment_stage: oldStage,
                status: selectedAppointment?.status || appointment.status,
              }
            : appointment
        )
      );

      alert(
        "Appointment pipeline update timed out. If it still happens, run the appointments SQL/RLS fix."
      );
    }
  };

  const clearInquiries = async () => {
    if (!currentPermissions.canClearAll) {
      blockAction("Only Super Admin can clear all inquiries.");
      return;
    }

    const confirmDelete = confirm("Are you sure you want to delete all inquiries?");
    if (!confirmDelete) return;

    try {
      const { error } = await withTimeout(
        supabase.from("inquiries").delete().neq("id", 0),
        "Clear inquiries"
      );

      if (error) {
        console.error(error);
        alert("Failed to clear inquiries.");
        return;
      }

      setInquiries([]);

      await logActivity({
        action: "Cleared all inquiries",
        targetType: "inquiries",
        targetId: "all",
        details: "Super Admin cleared all inquiry records.",
      });
    } catch (error) {
      console.error(error);
      alert("Clear inquiries request timed out or failed.");
    }
  };

  const clearAppointments = async () => {
    if (!currentPermissions.canClearAll) {
      blockAction("Only Super Admin can clear all appointments.");
      return;
    }

    const confirmDelete = confirm(
      "Are you sure you want to delete all appointments?"
    );
    if (!confirmDelete) return;

    try {
      const { error } = await withTimeout(
        supabase.from("appointments").delete().neq("id", 0),
        "Clear appointments"
      );

      if (error) {
        console.error(error);
        alert("Failed to clear appointments.");
        return;
      }

      setAppointments([]);

      await logActivity({
        action: "Cleared all appointments",
        targetType: "appointments",
        targetId: "all",
        details: "Super Admin cleared all appointment records.",
      });
    } catch (error) {
      console.error(error);
      alert("Clear appointments request timed out or failed.");
    }
  };

  const downloadCSV = (filename, headers, rows) => {
    if (!currentPermissions.canExport) {
      blockAction("Only Admin and Super Admin can export data.");
      return;
    }

    downloadCSVFile(filename, headers, rows);
  };

  const exportInquiriesToCSV = () => {
    if (!currentPermissions.canExport) {
      blockAction("Only Admin and Super Admin can export inquiries.");
      return;
    }

    if (inquiries.length === 0) {
      alert("No inquiries to export.");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Field Of Interest",
      "Study Level",
      "Country",
      "Counseling Mode",
      "Preferred Date",
      "Time Slot",
      "City",
      "Message",
      "Status",
      "Priority",
      "Assigned Admin",
      "Date",
    ];

    const rows = inquiries.map((inquiry) => [
      inquiry.full_name,
      inquiry.email,
      inquiry.phone,
      inquiry.field_of_interest,
      inquiry.study_level,
      inquiry.country,
      inquiry.counseling_mode,
      inquiry.preferred_date,
      inquiry.time_slot,
      inquiry.city,
      inquiry.message,
      inquiry.status || "new",
      inquiry.priority || "low",
      inquiry.assigned_admin_name || "Unassigned",
      inquiry.created_at,
    ]);

    downloadCSV("zaifan-inquiries.csv", headers, rows);
  };

  const exportAppointmentsToCSV = () => {
    if (!currentPermissions.canExport) {
      blockAction("Only Admin and Super Admin can export appointments.");
      return;
    }

    if (appointments.length === 0) {
      alert("No appointments to export.");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Country Interest",
      "Consultation Type",
      "Appointment Date",
      "Appointment Time",
      "Message",
      "Status",
      "Appointment Stage",
      "Priority",
      "Assigned Admin",
      "Created At",
    ];

    const rows = appointments.map((appointment) => [
      appointment.full_name,
      appointment.email,
      appointment.phone,
      appointment.country_interest,
      appointment.consultation_type,
      appointment.appointment_date,
      appointment.appointment_time,
      appointment.message,
      appointment.status || "pending",
      appointment.appointment_stage || "new_booking",
      appointment.priority || "low",
      appointment.assigned_admin_name || "Unassigned",
      appointment.created_at,
    ]);

    downloadCSV("zaifan-appointments.csv", headers, rows);
  };

  return {
    deleteInquiry,
    deleteAppointment,

    toggleInquiryStatus,
    updateInquiryPriority,
    updateAppointmentPriority,
    updateAppointmentStatus,
    updateAppointmentStage,

    clearInquiries,
    clearAppointments,

    exportInquiriesToCSV,
    exportAppointmentsToCSV,
  };
}