import { useCallback, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

const CHANNEL_NAMES = {
  inquiries: "crm-inquiries-realtime",
  appointments: "crm-appointments-realtime",
  reminders: "crm-reminders-realtime",
};

const noop = () => {};

function useLatestRef(value) {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}

function useRealtimeCRM({
  enabled = true,
  onInquiryChange = noop,
  onAppointmentChange = noop,
  onReminderChange = noop,
  onNotification = noop,
  onAnyChange = noop,
} = {}) {
  const channelsRef = useRef([]);
  const generationRef = useRef(0);

  const onInquiryChangeRef = useLatestRef(onInquiryChange);
  const onAppointmentChangeRef = useLatestRef(onAppointmentChange);
  const onReminderChangeRef = useLatestRef(onReminderChange);
  const onNotificationRef = useLatestRef(onNotification);
  const onAnyChangeRef = useLatestRef(onAnyChange);

  const removeChannels = useCallback(() => {
    generationRef.current += 1;

    const channels = channelsRef.current;
    channelsRef.current = [];

    for (const channel of channels) {
      if (!channel) continue;

      try {
        void supabase.removeChannel(channel);
      } catch (error) {
        console.error("Realtime channel cleanup failed:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      removeChannels();
      return undefined;
    }

    removeChannels();
    const generation = generationRef.current;

    const isCurrentGeneration = () =>
      generation === generationRef.current;

    const safeNotify = (payload) => {
      try {
        onNotificationRef.current(payload);
      } catch (error) {
        console.error("Realtime notification handler failed:", error);
      }
    };

    const safeAnyChange = (payload) => {
      try {
        onAnyChangeRef.current(payload);
      } catch (error) {
        console.error("Realtime any-change handler failed:", error);
      }
    };

    const inquiryChannel = supabase
      .channel(CHANNEL_NAMES.inquiries)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inquiries",
        },
        (payload) => {
          if (!isCurrentGeneration()) return;

          try {
            onInquiryChangeRef.current(payload);
          } catch (error) {
            console.error("Realtime inquiry handler failed:", error);
          }

          safeAnyChange({ type: "inquiry", payload });

          if (payload.eventType === "INSERT") {
            safeNotify({
              type: "inquiry",
              level: "success",
              title: "New Inquiry",
              message: `${
                payload.new?.full_name || "New lead"
              } entered the CRM pipeline.`,
              payload,
            });
          } else if (payload.eventType === "UPDATE") {
            safeNotify({
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
        if (
          isCurrentGeneration() &&
          ["CHANNEL_ERROR", "TIMED_OUT"].includes(status)
        ) {
          console.error("Inquiry realtime subscription issue:", status);
        }
      });

    const appointmentChannel = supabase
      .channel(CHANNEL_NAMES.appointments)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
        },
        (payload) => {
          if (!isCurrentGeneration()) return;

          try {
            onAppointmentChangeRef.current(payload);
          } catch (error) {
            console.error("Realtime appointment handler failed:", error);
          }

          safeAnyChange({ type: "appointment", payload });

          if (payload.eventType === "INSERT") {
            safeNotify({
              type: "appointment",
              level: "success",
              title: "New Appointment",
              message: `${
                payload.new?.full_name || "Student"
              } booked an appointment.`,
              payload,
            });
          } else if (payload.eventType === "UPDATE") {
            safeNotify({
              type: "appointment",
              level: "info",
              title: "Appointment Updated",
              message: `${
                payload.new?.full_name || "Appointment"
              } was updated.`,
              payload,
            });
          }
        }
      )
      .subscribe((status) => {
        if (
          isCurrentGeneration() &&
          ["CHANNEL_ERROR", "TIMED_OUT"].includes(status)
        ) {
          console.error("Appointment realtime subscription issue:", status);
        }
      });

    const reminderChannel = supabase
      .channel(CHANNEL_NAMES.reminders)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "follow_up_reminders",
        },
        (payload) => {
          if (!isCurrentGeneration()) return;

          try {
            onReminderChangeRef.current(payload);
          } catch (error) {
            console.error("Realtime reminder handler failed:", error);
          }

          safeAnyChange({ type: "reminder", payload });

          if (payload.eventType === "INSERT") {
            safeNotify({
              type: "reminder",
              level: "warning",
              title: "New Reminder",
              message: "A new follow-up reminder was created.",
              payload,
            });
          } else if (payload.eventType === "UPDATE") {
            safeNotify({
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
        if (
          isCurrentGeneration() &&
          ["CHANNEL_ERROR", "TIMED_OUT"].includes(status)
        ) {
          console.error("Reminder realtime subscription issue:", status);
        }
      });

    channelsRef.current = [
      inquiryChannel,
      appointmentChannel,
      reminderChannel,
    ];

    return removeChannels;
  }, [
    enabled,
    onAnyChangeRef,
    onAppointmentChangeRef,
    onInquiryChangeRef,
    onNotificationRef,
    onReminderChangeRef,
    removeChannels,
  ]);

  const reconnectRealtime = useCallback(() => {
    removeChannels();

    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }, [removeChannels]);

  return { reconnectRealtime };
}

export default useRealtimeCRM;
