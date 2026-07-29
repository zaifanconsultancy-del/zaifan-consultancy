import { useCallback, useMemo, useRef } from "react";
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

import { getStatusFromAppointmentStage } from "../utils/crm/index";
import { withTimeout } from "../utils/crm/requestUtils";
import {
  buildStudentNotification,
  confirmStudentNotificationPreview,
  prepareStudentNotification,
  sendPreparedStudentNotification,
} from "../services/studentNotificationService";

const sameId = (left, right) => String(left) === String(right);

export default function useAdminLeadActions({
  inquiries,
  setInquiries,
  appointments,
  setAppointments,
  currentPermissions,
  logActivity,
}) {
  const pendingActionKeysRef = useRef(new Set());

  const inquiryById = useMemo(
    () => new Map(inquiries.map((item) => [String(item.id), item])),
    [inquiries]
  );

  const appointmentById = useMemo(
    () => new Map(appointments.map((item) => [String(item.id), item])),
    [appointments]
  );

  const blockAction = useCallback((message) => {
    alert(message);
  }, []);

  const runExclusive = useCallback(async (key, action) => {
    if (pendingActionKeysRef.current.has(key)) {
      return { skipped: true };
    }

    pendingActionKeysRef.current.add(key);

    try {
      return await action();
    } finally {
      pendingActionKeysRef.current.delete(key);
    }
  }, []);

  const safeLogActivity = useCallback(
    async (payload) => {
      if (typeof logActivity !== "function") return;

      try {
        await logActivity(payload);
      } catch (error) {
        console.error("Activity logging failed:", error);
      }
    },
    [logActivity]
  );

  const prepareProtectedAppointmentChange = useCallback(
    async (preview) => {
      if (!preview) {
        return {
          confirmed: true,
          previewToken: null,
          confirmationText: "",
        };
      }

      // Important UX rule: show the human confirmation first. Token creation is
      // a network request and must never delay the preview/confirmation popup.
      const confirmation = confirmStudentNotificationPreview(preview);

      if (!confirmation.confirmed) {
        return {
          confirmed: false,
          previewToken: null,
          confirmationText: confirmation.confirmationText || "",
        };
      }

      if (!preview.sendable) {
        return {
          confirmed: true,
          previewToken: null,
          confirmationText: confirmation.confirmationText || "",
        };
      }

      try {
        const prepared = await prepareStudentNotification(preview);

        return {
          confirmed: true,
          previewToken: prepared.previewToken,
          confirmationText: confirmation.confirmationText || "",
        };
      } catch (error) {
        console.error("Appointment notification preview failed:", error);
        alert(
          error?.message ||
            "The student notification security check could not be prepared. The appointment was not changed."
        );

        return {
          confirmed: false,
          previewToken: null,
          confirmationText: confirmation.confirmationText || "",
        };
      }
    },
    []
  );

  const deleteInquiry = useCallback(
    async (id) => {
      if (!currentPermissions.canDelete) {
        blockAction("Only Admin and Super Admin can delete inquiries.");
        return;
      }

      if (!confirm("Delete this inquiry?")) return;

      await runExclusive(`inquiry:delete:${id}`, async () => {
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
            current.filter((inquiry) => !sameId(inquiry.id, id))
          );

          await safeLogActivity({
            action: "Deleted inquiry",
            targetType: "inquiry",
            targetId: id,
            details: "Inquiry deleted",
          });
        } catch (error) {
          console.error(error);
          alert("Delete inquiry request timed out or failed.");
        }
      });
    },
    [
      blockAction,
      currentPermissions.canDelete,
      runExclusive,
      safeLogActivity,
      setInquiries,
    ]
  );

  const deleteAppointment = useCallback(
    async (id) => {
      if (!currentPermissions.canDelete) {
        blockAction("Only Admin and Super Admin can delete appointments.");
        return;
      }

      if (!confirm("Delete this appointment?")) return;

      await runExclusive(`appointment:delete:${id}`, async () => {
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
            current.filter((appointment) => !sameId(appointment.id, id))
          );

          await safeLogActivity({
            action: "Deleted appointment",
            targetType: "appointment",
            targetId: id,
            details: "Appointment deleted",
          });
        } catch (error) {
          console.error(error);
          alert("Delete appointment request timed out or failed.");
        }
      });
    },
    [
      blockAction,
      currentPermissions.canDelete,
      runExclusive,
      safeLogActivity,
      setAppointments,
    ]
  );

  const toggleInquiryStatus = useCallback(
    async (id, newStatus) => {
      if (!currentPermissions.canUpdateStatus) {
        blockAction("You do not have permission to update inquiry status.");
        return;
      }

      const selectedInquiry = inquiryById.get(String(id));
      const oldStatus = selectedInquiry?.status || "new";

      if (oldStatus === newStatus) return;

      await runExclusive(`inquiry:status:${id}`, async () => {
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
              sameId(inquiry.id, id)
                ? { ...inquiry, status: newStatus }
                : inquiry
            )
          );

          await safeLogActivity({
            action: "Updated inquiry pipeline",
            targetType: "inquiry",
            targetId: id,
            details: `Changed inquiry stage from ${oldStatus} to ${newStatus}.`,
          });
        } catch (error) {
          console.error(error);
          alert("Pipeline update timed out or failed.");
        }
      });
    },
    [
      blockAction,
      currentPermissions.canUpdateStatus,
      inquiryById,
      runExclusive,
      safeLogActivity,
      setInquiries,
    ]
  );

  const updateInquiryPriority = useCallback(
    async (id, newPriority) => {
      if (!currentPermissions.canUpdatePriority) {
        blockAction("You do not have permission to update inquiry priority.");
        return;
      }

      const selectedInquiry = inquiryById.get(String(id));
      if (selectedInquiry?.priority === newPriority) return;

      await runExclusive(`inquiry:priority:${id}`, async () => {
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
              sameId(inquiry.id, id)
                ? { ...inquiry, priority: newPriority }
                : inquiry
            )
          );

          await safeLogActivity({
            action: "Updated inquiry priority",
            targetType: "inquiry",
            targetId: id,
            details: `Changed inquiry priority to ${newPriority}.`,
          });
        } catch (error) {
          console.error(error);
          alert("Priority update timed out or failed.");
        }
      });
    },
    [
      blockAction,
      currentPermissions.canUpdatePriority,
      inquiryById,
      runExclusive,
      safeLogActivity,
      setInquiries,
    ]
  );

  const updateAppointmentPriority = useCallback(
    async (id, newPriority) => {
      if (!currentPermissions.canUpdatePriority) {
        blockAction("You do not have permission to update appointment priority.");
        return;
      }

      const selectedAppointment = appointmentById.get(String(id));
      if (selectedAppointment?.priority === newPriority) return;

      await runExclusive(`appointment:priority:${id}`, async () => {
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
              sameId(appointment.id, id)
                ? { ...appointment, priority: newPriority }
                : appointment
            )
          );

          await safeLogActivity({
            action: "Updated appointment priority",
            targetType: "appointment",
            targetId: id,
            details: `Changed appointment priority to ${newPriority}.`,
          });
        } catch (error) {
          console.error(error);
          alert("Priority update timed out or failed.");
        }
      });
    },
    [
      appointmentById,
      blockAction,
      currentPermissions.canUpdatePriority,
      runExclusive,
      safeLogActivity,
      setAppointments,
    ]
  );

  const updateAppointmentStatus = useCallback(
    async (id, newStatus) => {
      if (!currentPermissions.canUpdateStatus) {
        blockAction("You do not have permission to update appointment status.");
        return;
      }

      const selectedAppointment = appointmentById.get(String(id));
      const oldStatus = selectedAppointment?.status || "pending";

      if (oldStatus === newStatus) return;

      const preview = buildStudentNotification({
        domain: "appointment",
        student: selectedAppointment || {},
        entity: selectedAppointment || {},
        previous: {
          ...(selectedAppointment || {}),
          status: oldStatus,
        },
        next: {
          ...(selectedAppointment || {}),
          status: newStatus,
        },
        relatedType: "appointment",
        relatedId: id,
      });

      const protection = await prepareProtectedAppointmentChange(preview);
      if (!protection.confirmed) return;

      await runExclusive(`appointment:status:${id}`, async () => {
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
              sameId(appointment.id, id)
                ? { ...appointment, status: newStatus }
                : appointment
            )
          );

          await safeLogActivity({
            action: "Updated appointment status",
            targetType: "appointment",
            targetId: id,
            details: `Changed appointment status from ${oldStatus} to ${newStatus}.`,
          });

          if (preview?.sendable) {
            try {
              const delivery = await sendPreparedStudentNotification({
                preview,
                previewToken: protection.previewToken,
                confirmationText: protection.confirmationText,
              });

              alert(
                delivery?.communicationWarning
                  ? `Appointment updated and email sent. ${delivery.communicationWarning}`
                  : "Appointment updated and student email sent."
              );
            } catch (emailError) {
              console.error("Appointment notification failed:", emailError);
              alert(
                "Appointment status was updated, but the student email failed. Review Communications before retrying."
              );
            }
          } else if (preview && !preview.sendable) {
            alert(
              "Appointment updated. No usable student email was available, so no email was sent."
            );
          }
        } catch (error) {
          console.error(error);
          alert("Appointment status update timed out or failed.");
        }
      });
    },
    [
      appointmentById,
      blockAction,
      currentPermissions.canUpdateStatus,
      prepareProtectedAppointmentChange,
      runExclusive,
      safeLogActivity,
      setAppointments,
    ]
  );

  const updateAppointmentStage = useCallback(
    async (id, newStage) => {
      if (!currentPermissions.canUpdateAppointmentPipeline) {
        blockAction(
          "You do not have permission to update appointment pipeline."
        );
        return;
      }

      const selectedAppointment = appointmentById.get(String(id));
      const oldStage =
        selectedAppointment?.appointment_stage || "new_booking";
      const oldStatus = selectedAppointment?.status || "pending";
      const nextStatus = getStatusFromAppointmentStage(newStage);

      if (oldStage === newStage && oldStatus === nextStatus) return;

      const preview = buildStudentNotification({
        domain: "appointment",
        student: selectedAppointment || {},
        entity: selectedAppointment || {},
        previous: {
          ...(selectedAppointment || {}),
          status: oldStatus,
          appointment_stage: oldStage,
        },
        next: {
          ...(selectedAppointment || {}),
          status: nextStatus,
          appointment_stage: newStage,
        },
        relatedType: "appointment",
        relatedId: id,
      });

      const protection = await prepareProtectedAppointmentChange(preview);
      if (!protection.confirmed) return;

      await runExclusive(`appointment:stage:${id}`, async () => {
        setAppointments((current) =>
          current.map((appointment) =>
            sameId(appointment.id, id)
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
                sameId(appointment.id, id)
                  ? {
                      ...appointment,
                      appointment_stage: oldStage,
                      status: oldStatus,
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

          await safeLogActivity({
            action: "Updated appointment pipeline",
            targetType: "appointment",
            targetId: id,
            details: `Changed appointment pipeline from ${oldStage} to ${newStage}.`,
          });

          if (preview?.sendable) {
            try {
              const delivery = await sendPreparedStudentNotification({
                preview,
                previewToken: protection.previewToken,
                confirmationText: protection.confirmationText,
              });

              if (delivery?.communicationWarning) {
                alert(
                  `Appointment pipeline updated and email sent. ${delivery.communicationWarning}`
                );
              }
            } catch (emailError) {
              console.error("Appointment pipeline notification failed:", emailError);
              alert(
                "Appointment pipeline was updated, but the student email failed. Review Communications before retrying."
              );
            }
          } else if (preview && !preview.sendable) {
            alert(
              "Appointment pipeline updated. No usable student email was available, so no email was sent."
            );
          }
        } catch (error) {
          console.error("Appointment pipeline timeout/error:", error);

          setAppointments((current) =>
            current.map((appointment) =>
              sameId(appointment.id, id)
                ? {
                    ...appointment,
                    appointment_stage: oldStage,
                    status: oldStatus,
                  }
                : appointment
            )
          );

          alert(
            "Appointment pipeline update timed out. If it still happens, run the appointments SQL/RLS fix."
          );
        }
      });
    },
    [
      appointmentById,
      blockAction,
      currentPermissions.canUpdateAppointmentPipeline,
      prepareProtectedAppointmentChange,
      runExclusive,
      safeLogActivity,
      setAppointments,
    ]
  );

  const clearInquiries = useCallback(async () => {
    if (!currentPermissions.canClearAll) {
      blockAction("Only Super Admin can clear all inquiries.");
      return;
    }

    if (!confirm("Are you sure you want to delete all inquiries?")) return;

    await runExclusive("inquiries:clear-all", async () => {
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

        await safeLogActivity({
          action: "Cleared all inquiries",
          targetType: "inquiries",
          targetId: "all",
          details: "Super Admin cleared all inquiry records.",
        });
      } catch (error) {
        console.error(error);
        alert("Clear inquiries request timed out or failed.");
      }
    });
  }, [
    blockAction,
    currentPermissions.canClearAll,
    runExclusive,
    safeLogActivity,
    setInquiries,
  ]);

  const clearAppointments = useCallback(async () => {
    if (!currentPermissions.canClearAll) {
      blockAction("Only Super Admin can clear all appointments.");
      return;
    }

    if (!confirm("Are you sure you want to delete all appointments?")) return;

    await runExclusive("appointments:clear-all", async () => {
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

        await safeLogActivity({
          action: "Cleared all appointments",
          targetType: "appointments",
          targetId: "all",
          details: "Super Admin cleared all appointment records.",
        });
      } catch (error) {
        console.error(error);
        alert("Clear appointments request timed out or failed.");
      }
    });
  }, [
    blockAction,
    currentPermissions.canClearAll,
    runExclusive,
    safeLogActivity,
    setAppointments,
  ]);

  const downloadCSV = useCallback(
    (filename, headers, rows) => {
      if (!currentPermissions.canExport) {
        blockAction("Only Admin and Super Admin can export data.");
        return;
      }

      downloadCSVFile(filename, headers, rows);
    },
    [blockAction, currentPermissions.canExport]
  );

  const exportInquiriesToCSV = useCallback(() => {
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
  }, [
    blockAction,
    currentPermissions.canExport,
    downloadCSV,
    inquiries,
  ]);

  const exportAppointmentsToCSV = useCallback(() => {
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
  }, [
    appointments,
    blockAction,
    currentPermissions.canExport,
    downloadCSV,
  ]);

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