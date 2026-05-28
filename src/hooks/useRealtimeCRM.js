import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

function useRealtimeCRM({
  enabled = true,
  onInquiryChange = () => {},
  onAppointmentChange = () => {},
  onReminderChange = () => {},
  onNotification = () => {},
  onAnyChange = () => {},
} = {}) {
  const channelsRef = useRef([]);

  useEffect(() => {
    if (!enabled) return undefined;

    const inquiryChannel = supabase
      .channel("crm-inquiries-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inquiries",
        },
        (payload) => {
          console.log("Realtime inquiry update:", payload);

          onInquiryChange(payload);
          onAnyChange({ type: "inquiry", payload });

          const eventType = payload.eventType;

          if (eventType === "INSERT") {
            onNotification({
              type: "inquiry",
              level: "success",
              title: "New Inquiry",
              message: `${payload.new?.full_name || "New lead"} entered the CRM pipeline.`,
              payload,
            });
          }

          if (eventType === "UPDATE") {
            onNotification({
              type: "inquiry",
              level: "info",
              title: "Inquiry Updated",
              message: `${payload.new?.full_name || "Lead"} was updated.`,
              payload,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("Inquiry realtime status:", status);
      });

    const appointmentChannel = supabase
      .channel("crm-appointments-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
        },
        (payload) => {
          console.log("Realtime appointment update:", payload);

          onAppointmentChange(payload);
          onAnyChange({ type: "appointment", payload });

          const eventType = payload.eventType;

          if (eventType === "INSERT") {
            onNotification({
              type: "appointment",
              level: "success",
              title: "New Appointment",
              message: `${payload.new?.full_name || "Student"} booked an appointment.`,
              payload,
            });
          }

          if (eventType === "UPDATE") {
            onNotification({
              type: "appointment",
              level: "info",
              title: "Appointment Updated",
              message: `${payload.new?.full_name || "Appointment"} was updated.`,
              payload,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("Appointment realtime status:", status);
      });

    const reminderChannel = supabase
      .channel("crm-reminders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "follow_up_reminders",
        },
        (payload) => {
          console.log("Realtime reminder update:", payload);

          onReminderChange(payload);
          onAnyChange({ type: "reminder", payload });

          const eventType = payload.eventType;

          if (eventType === "INSERT") {
            onNotification({
              type: "reminder",
              level: "warning",
              title: "New Reminder",
              message: "A new follow-up reminder was created.",
              payload,
            });
          }

          if (eventType === "UPDATE") {
            onNotification({
              type: "reminder",
              level: "info",
              title: "Reminder Updated",
              message: "A follow-up reminder was updated.",
              payload,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("Reminder realtime status:", status);
      });

    channelsRef.current = [
      inquiryChannel,
      appointmentChannel,
      reminderChannel,
    ];

    return () => {
      channelsRef.current.forEach((channel) => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      });

      channelsRef.current = [];
    };
  }, [
    enabled,
    onInquiryChange,
    onAppointmentChange,
    onReminderChange,
    onNotification,
    onAnyChange,
  ]);

  return {
    reconnectRealtime: () => {
      channelsRef.current.forEach((channel) => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      });

      channelsRef.current = [];

      window.location.reload();
    },
  };
}

export default useRealtimeCRM;
