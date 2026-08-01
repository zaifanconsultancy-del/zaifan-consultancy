// CommunicationCenterPanel PARTNER OS EXTREME V2 — Compact Student Communication Command
// src/components/admin/workspaces/communications/CommunicationCenterPanel.jsx
//
// Maximum production pass:
// - preserves WhatsAppWorkspace + EmailWorkspace integrations
// - preserves student_communications Supabase table
// - preserves no-blink local mutation strategy
// - preserves student_application_timeline logging
// - safer timeout helper with cleanup
// - separate busy states for create/status/delete/refresh operations
// - duplicate draft protection
// - safer bigint student_id validation
// - improved WhatsApp phone normalization for Pakistan/local formats
// - stronger status transition handling and timestamps
// - delete/archive-style removal with confirmation
// - optional parent refresh only when explicitly useful
// - search, filters, pagination and row counts
// - better large-history handling
// - clearer sent/logged/draft semantics
// - explicit failure reason handling
// - final Partner OS visual alignment while preserving all communication logic
// - #123865 navy / #10233F text / #FF5A0A orange / #FFF8EF cream
// - stronger #C9D7E6 outer borders and #E1E8F0 inner borders
// - navy surfaces use white text only
// - responsive and accessible

import {
  AlertTriangle,
  CheckCircle2,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "../../../../lib/supabaseClient";
import StudentNotificationPreviewModal from "../students/StudentNotificationPreviewModal";
import StudentNotificationComposer from "../students/StudentNotificationComposer";
import {
  buildStudentNotification,
  prepareStudentNotification,
  sendPreparedStudentNotification,
} from "../../../../services/studentNotificationService";
const WhatsAppWorkspace = lazy(() => import("./WhatsAppWorkspace"));
const EmailWorkspace = lazy(() => import("./EmailWorkspace"));

const REQUEST_TIMEOUT_MS = 15000;
const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  "draft",
  "queued",
  "scheduled",
  "sent",
  "delivered",
  "read",
  "received",
  "logged",
  "failed",
  "cancelled",
];

const CHANNEL_OPTIONS = [
  "whatsapp",
  "email",
  "call",
  "sms",
  "portal",
  "manual",
];

const DIRECTION_OPTIONS = [
  "outbound",
  "inbound",
  "internal",
];

const STATUS_FLOW = {
  draft: ["queued", "scheduled", "sent", "cancelled", "failed"],
  queued: ["scheduled", "sent", "cancelled", "failed"],
  scheduled: ["sent", "cancelled", "failed"],
  sent: ["delivered", "read", "failed"],
  delivered: ["read", "failed"],
  read: [],
  received: ["logged"],
  logged: [],
  failed: ["draft", "queued", "sent", "cancelled"],
  cancelled: ["draft"],
};

async function withTimeout(
  promise,
  message = "Request timed out."
) {
  let timeoutId;

  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(
      () => reject(new Error(message)),
      REQUEST_TIMEOUT_MS
    );
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function normalize(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function pretty(value = "") {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatDateTime(value) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isValidBigIntLike(value) {
  if (value === null || value === undefined || value === "") {
    return false;
  }

  const text = String(value).trim();

  return /^\d+$/.test(text);
}

function normalizePhoneForWhatsApp(value = "") {
  let digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  // Pakistan local mobile: 03XXXXXXXXX -> 923XXXXXXXXX
  if (digits.startsWith("03") && digits.length === 11) {
    return `92${digits.slice(1)}`;
  }

  // 3XXXXXXXXX -> 923XXXXXXXXX
  if (digits.startsWith("3") && digits.length === 10) {
    return `92${digits}`;
  }

  return digits;
}

async function createTimelineEvent({
  studentId,
  studentType,
  eventType,
  title,
  description,
  newValue = "",
}) {
  if (!studentId || !eventType || !title) return;

  try {
    await withTimeout(
      supabase
        .from("student_application_timeline")
        .insert({
          student_id: Number(studentId),
          student_type: studentType,
          event_type: eventType,
          title,
          description,
          new_value: newValue || null,
        }),
      "Communication timeline event timed out."
    );
  } catch (error) {
    console.warn(
      "Communication timeline event skipped:",
      error?.message || error
    );
  }
}

function CommunicationCenterPanel({
  student = {},
  sharedCommunications = [],
  onSharedDataChange = () => {},
}) {
  const mountedRef = useRef(true);

  const [communications, setCommunications] = useState(
    Array.isArray(sharedCommunications)
      ? sharedCommunications
      : []
  );

  const [loading, setLoading] = useState(false);
  const [creatingChannel, setCreatingChannel] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [query, setQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [pendingEmailNotification, setPendingEmailNotification] = useState(null);
  const [emailSending, setEmailSending] = useState(false);
  const [safeEmailForm, setSafeEmailForm] = useState({ subject: "", message: "" });

  const [manualForm, setManualForm] = useState({
    channel: "call",
    direction: "outbound",
    subject: "",
    message: "",
    status: "logged",
    related_type: "",
    related_id: "",
  });

  const fullName =
    student?.full_name ||
    student?.name ||
    "Student";

  const phone =
    student?.phone ||
    student?.phone_number ||
    "";

  const email = student?.email || "";

  const rawStudentId =
    student?.id ??
    student?.student_id;

  const studentId = isValidBigIntLike(rawStudentId)
    ? Number(rawStudentId)
    : null;

  const hasValidStudentId =
    Number.isSafeInteger(studentId) &&
    studentId > 0;

  const studentType =
    student?.student_type ||
    student?.__leadType ||
    student?.type ||
    "inquiry";

  const anyMutationBusy =
    Boolean(creatingChannel) ||
    Boolean(updatingId) ||
    Boolean(deletingId);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setCommunications(
      Array.isArray(sharedCommunications)
        ? sharedCommunications
        : []
    );
  }, [sharedCommunications]);

  useEffect(() => {
    setPage(1);
  }, [
    query,
    channelFilter,
    directionFilter,
    statusFilter,
  ]);

  useEffect(() => {
    void loadCommunications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawStudentId, studentType]);

  useEffect(() => {
    if (!successMessage) return undefined;

    const timer = window.setTimeout(() => {
      if (mountedRef.current) {
        setSuccessMessage("");
      }
    }, 3800);

    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const notifyParent = async () => {
    if (
      typeof onSharedDataChange !== "function"
    ) {
      return;
    }

    try {
      await withTimeout(
        Promise.resolve(
          onSharedDataChange({
            source:
              "communication_center",
          })
        ),
        "Student OS refresh after communication mutation timed out."
      );
    } catch (refreshError) {
      console.warn(
        "Communication mutation succeeded, but parent refresh failed:",
        refreshError
      );
    }
  };

  const loadCommunications = async () => {
    if (!hasValidStudentId) {
      setCommunications([]);
      setError(
        "Student ID is missing or invalid."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const {
        data,
        error: loadError,
      } = await withTimeout(
        supabase
          .from("student_communications")
          .select("*")
          .eq("student_id", studentId)
          .eq(
            "student_type",
            studentType
          )
          .order("created_at", {
            ascending: false,
          })
          .limit(1000),
        "Communication history loading timed out."
      );

      if (loadError) throw loadError;

      if (mountedRef.current) {
        setCommunications(
          Array.isArray(data)
            ? data
            : []
        );
      }
    } catch (loadError) {
      console.error(
        "Communication load crashed:",
        loadError
      );

      if (mountedRef.current) {
        setError(
          loadError?.message ||
            "Communication history failed to load."
        );
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const duplicateExists = ({
    channel,
    subject,
    message,
    status,
    direction,
  }) => {
    const cleanChannel = normalize(channel);
    const cleanSubject = String(
      subject || ""
    ).trim();
    const cleanMessage = String(
      message || ""
    ).trim();
    const cleanStatus = normalize(status);
    const cleanDirection = normalize(direction);

    return communications.some((item) => {
      const ageMs =
        Date.now() -
        new Date(
          item.created_at || 0
        ).getTime();

      const recentEnough =
        Number.isFinite(ageMs) &&
        ageMs >= 0 &&
        ageMs <= 60_000;

      return (
        recentEnough &&
        normalize(item.channel) ===
          cleanChannel &&
        String(
          item.subject || ""
        ).trim() === cleanSubject &&
        String(
          item.message || ""
        ).trim() === cleanMessage &&
        normalize(item.status) ===
          cleanStatus &&
        normalize(
          item.direction ||
            "outbound"
        ) === cleanDirection
      );
    });
  };

  const saveCommunication = async ({
    channel,
    subject = "",
    message,
    status = "draft",
    source = "manual",
    direction = "outbound",
    related_type = null,
    related_id = null,
    sent_at = null,
    metadata = {},
  }) => {
    if (!hasValidStudentId) {
      setError(
        "Student ID is missing or invalid."
      );
      return false;
    }

    if (
      !String(message || "").trim()
    ) {
      setError(
        "Communication message cannot be empty."
      );
      return false;
    }

    if (anyMutationBusy) {
      return false;
    }

    const cleanChannel = normalize(
      channel || "manual"
    );
    const cleanStatus = normalize(
      status || "draft"
    );
    const cleanDirection = normalize(
      direction || "outbound"
    );

    if (
      duplicateExists({
        channel: cleanChannel,
        subject,
        message,
        status: cleanStatus,
        direction: cleanDirection,
      })
    ) {
      setError(
        "This communication appears to have just been saved already."
      );
      return false;
    }

    setCreatingChannel(
      cleanChannel || "manual"
    );
    setError("");
    setSuccessMessage("");

    try {
      const now =
        new Date().toISOString();

      const payload = {
        student_id: studentId,
        student_type: studentType,
        channel: cleanChannel,
        direction: cleanDirection,
        subject:
          String(subject || "").trim() ||
          null,
        message:
          String(message || "").trim(),
        status: cleanStatus,
        source:
          source || "manual",
        sent_at:
          sent_at ||
          ([
            "sent",
            "delivered",
            "read",
            "logged",
            "received",
          ].includes(cleanStatus)
            ? now
            : null),
        delivered_at:
          ["delivered", "read"].includes(
            cleanStatus
          )
            ? now
            : null,
        read_at:
          cleanStatus === "read"
            ? now
            : null,
        failed_at:
          cleanStatus === "failed"
            ? now
            : null,
        related_type:
          related_type || null,
        related_id:
          related_id
            ? String(related_id)
            : null,
        metadata: {
          ...metadata,
          student_name: fullName,
          created_from:
            "admin_communication_center",
        },
      };

      const {
        data,
        error: saveError,
      } = await withTimeout(
        supabase
          .from("student_communications")
          .insert(payload)
          .select("*")
          .single(),
        "Communication save timed out."
      );

      if (saveError) throw saveError;

      if (mountedRef.current) {
        setCommunications(
          (previous) => [
            data,
            ...(previous || []),
          ]
        );
      }

      void createTimelineEvent({
        studentId,
        studentType,
        eventType:
          "communication_logged",
        title:
          payload.channel ===
          "whatsapp"
            ? "WhatsApp Communication Logged"
            : payload.channel ===
              "email"
            ? "Email Communication Logged"
            : `${pretty(
                payload.channel
              )} Communication Logged`,
        description:
          payload.subject
            ? `${payload.subject}\n\n${payload.message}`
            : payload.message,
        newValue:
          payload.channel,
      });

      if (mountedRef.current) {
        setSuccessMessage(
          `${pretty(
            payload.channel
          )} communication saved to the student record.`
        );
      }

      return true;
    } catch (saveError) {
      console.error(
        "Communication save crashed:",
        saveError
      );

      if (mountedRef.current) {
        setError(
          saveError?.message ||
            "Communication save failed."
        );
      }

      return false;
    } finally {
      if (mountedRef.current) {
        setCreatingChannel("");
      }
    }
  };

  const updateCommunicationStatus =
    async (item, nextStatus) => {
      if (
        !item?.id ||
        anyMutationBusy
      ) {
        return;
      }

      const currentStatus =
        normalize(
          item.status || "draft"
        );

      const cleanNext = normalize(
        nextStatus || "draft"
      );

      if (
        currentStatus === cleanNext
      ) {
        return;
      }

      const allowed =
        STATUS_FLOW[
          currentStatus
        ] || [];

      if (
        allowed.length &&
        !allowed.includes(cleanNext)
      ) {
        setError(
          `Status cannot move directly from ${pretty(
            currentStatus
          )} to ${pretty(
            cleanNext
          )}.`
        );
        return;
      }

      setUpdatingId(item.id);
      setError("");
      setSuccessMessage("");

      const previous = { ...item };
      const now =
        new Date().toISOString();

      const patch = {
        status: cleanNext,
        updated_at: now,
      };

      if (
        [
          "sent",
          "delivered",
          "read",
          "logged",
          "received",
        ].includes(cleanNext)
      ) {
        patch.sent_at =
          item.sent_at || now;
      }

      if (
        ["delivered", "read"].includes(
          cleanNext
        )
      ) {
        patch.delivered_at =
          item.delivered_at || now;
      }

      if (
        cleanNext === "read"
      ) {
        patch.read_at =
          item.read_at || now;
      }

      if (
        cleanNext === "failed"
      ) {
        patch.failed_at =
          item.failed_at || now;
      }

      setCommunications(
        (previousRows) =>
          previousRows.map((row) =>
            row.id === item.id
              ? {
                  ...row,
                  ...patch,
                }
              : row
          )
      );

      try {
        const {
          data,
          error: updateError,
        } = await withTimeout(
          supabase
            .from(
              "student_communications"
            )
            .update(patch)
            .eq("id", item.id)
            .select("*")
            .single(),
          "Communication status update timed out."
        );

        if (updateError) {
          throw updateError;
        }

        if (mountedRef.current) {
          setCommunications(
            (previousRows) =>
              previousRows.map(
                (row) =>
                  row.id === item.id
                    ? data
                    : row
              )
          );

          setSuccessMessage(
            `Communication marked ${pretty(
              cleanNext
            )}.`
          );
        }

        void createTimelineEvent({
          studentId,
          studentType,
          eventType:
            "communication_status_changed",
          title:
            "Communication Status Updated",
          description: `${pretty(
            item.channel
          )} communication changed from ${pretty(
            currentStatus
          )} to ${pretty(
            cleanNext
          )}.`,
          newValue: cleanNext,
        });
      } catch (updateError) {
        if (mountedRef.current) {
          setCommunications(
            (previousRows) =>
              previousRows.map(
                (row) =>
                  row.id === item.id
                    ? previous
                    : row
              )
          );

          setError(
            updateError?.message ||
              "Communication status could not be updated."
          );
        }
      } finally {
        if (mountedRef.current) {
          setUpdatingId("");
        }
      }
    };

  const deleteCommunication =
    async () => {
      if (
        !pendingDelete?.id ||
        anyMutationBusy
      ) {
        return;
      }

      const item = pendingDelete;

      setDeletingId(item.id);
      setError("");
      setSuccessMessage("");

      try {
        const {
          error: deleteError,
        } = await withTimeout(
          supabase
            .from(
              "student_communications"
            )
            .delete()
            .eq("id", item.id),
          "Communication delete timed out."
        );

        if (deleteError) {
          throw deleteError;
        }

        if (mountedRef.current) {
          setCommunications(
            (previous) =>
              previous.filter(
                (row) =>
                  row.id !== item.id
              )
          );

          setPendingDelete(null);

          setSuccessMessage(
            "Communication record removed."
          );
        }

        void createTimelineEvent({
          studentId,
          studentType,
          eventType:
            "communication_deleted",
          title:
            "Communication Record Deleted",
          description: `${pretty(
            item.channel
          )} communication record was removed from Student Communication OS.`,
          newValue: item.id,
        });
      } catch (deleteError) {
        if (mountedRef.current) {
          setError(
            deleteError?.message ||
              "Communication record could not be deleted."
          );
        }
      } finally {
        if (mountedRef.current) {
          setDeletingId("");
        }
      }
    };

  const handleManualLog =
    async (event) => {
      event.preventDefault();

      const saved =
        await saveCommunication({
          channel:
            manualForm.channel,
          direction:
            manualForm.direction,
          subject:
            manualForm.subject,
          message:
            manualForm.message,
          status:
            manualForm.status,
          source:
            "manual_log_form",
          related_type:
            manualForm.related_type ||
            null,
          related_id:
            manualForm.related_id ||
            null,
        });

      if (saved) {
        setManualForm(
          (previous) => ({
            ...previous,
            subject: "",
            message: "",
            related_type: "",
            related_id: "",
          })
        );
      }
    };

  const previewSafeEmail = async (event) => {
    event.preventDefault();

    if (!email) {
      setError("This student does not have an email address.");
      return;
    }

    if (!safeEmailForm.subject.trim() || !safeEmailForm.message.trim()) {
      setError("Subject and message are required before previewing an email.");
      return;
    }

    const preview = buildStudentNotification({
      domain: "manual_email",
      student,
      subject: safeEmailForm.subject,
      message: safeEmailForm.message,
      relatedType: "manual_email",
      relatedId: null,
    });

    if (!preview) {
      setError("Email preview could not be created.");
      return;
    }

    setError("");
    setSuccessMessage("");

    // Show the composed email instantly; secure the signed preview in the
    // background instead of making Admin wait on the network before seeing it.
    setPendingEmailNotification({
      preview,
      previewToken: null,
      expiresAt: null,
      preparing: true,
      preparationError: "",
    });

    void prepareStudentNotification(preview)
      .then((prepared) => {
        setPendingEmailNotification((current) =>
          current?.preview === preview
            ? {
                ...current,
                ...prepared,
                preparing: false,
                preparationError: "",
              }
            : current
        );
      })
      .catch((previewError) => {
        setPendingEmailNotification((current) =>
          current?.preview === preview
            ? {
                ...current,
                preparing: false,
                preparationError:
                  previewError?.message ||
                  "Email security preparation failed.",
              }
            : current
        );
      });
  };

  const confirmSafeEmail = async (confirmationText = "") => {
    const pending = pendingEmailNotification;
    if (
      !pending ||
      emailSending ||
      pending.preparing ||
      pending.preparationError
    ) return;

    setEmailSending(true);
    setError("");

    try {
      const delivery = await sendPreparedStudentNotification({
        preview: pending.preview,
        previewToken: pending.previewToken,
        confirmationText,
      });

      setPendingEmailNotification(null);
      setSafeEmailForm({ subject: "", message: "" });
      setSuccessMessage(
        delivery.communicationWarning ||
          `Email sent safely to ${pending.preview.recipientEmail}.`
      );

      if (delivery.communicationLogged) {
        await loadCommunications();
      }

      void notifyParent();
    } catch (sendError) {
      setError(sendError?.message || "Student email could not be sent.");
    } finally {
      setEmailSending(false);
    }
  };

  const whatsappUrl = useMemo(() => {
    const cleanPhone =
      normalizePhoneForWhatsApp(
        phone
      );

    const message =
      encodeURIComponent(
        `Hi ${fullName}, this is Zaifan Consultancy. I wanted to follow up regarding your study abroad process.`
      );

    return cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${message}`
      : "";
  }, [phone, fullName]);

  const emailUrl = useMemo(() => {
    const subject =
      encodeURIComponent(
        "Zaifan Consultancy Follow-up"
      );

    const body =
      encodeURIComponent(
        `Hi ${fullName},\n\nI hope you are doing well. This is Zaifan Consultancy following up regarding your study abroad process.\n\nBest regards,\nZaifan Consultancy Team`
      );

    return email
      ? `mailto:${email}?subject=${subject}&body=${body}`
      : "";
  }, [email, fullName]);

  const stats = useMemo(() => {
    const total =
      communications.length;

    const drafts =
      communications.filter(
        (item) =>
          normalize(item.status) ===
          "draft"
      ).length;

    const failed =
      communications.filter(
        (item) =>
          normalize(item.status) ===
          "failed"
      ).length;

    const inbound =
      communications.filter(
        (item) =>
          normalize(
            item.direction
          ) === "inbound"
      ).length;

    const outbound =
      communications.filter(
        (item) =>
          normalize(
            item.direction
          ) === "outbound"
      ).length;

    const pending =
      communications.filter(
        (item) =>
          [
            "queued",
            "scheduled",
          ].includes(
            normalize(item.status)
          )
      ).length;

    return {
      total,
      drafts,
      failed,
      inbound,
      outbound,
      pending,
    };
  }, [communications]);

  const filteredCommunications =
    useMemo(() => {
      const cleanQuery =
        String(
          query || ""
        )
          .trim()
          .toLowerCase();

      return communications.filter(
        (item) => {
          if (
            channelFilter !==
              "all" &&
            normalize(
              item.channel
            ) !==
              normalize(
                channelFilter
              )
          ) {
            return false;
          }

          if (
            directionFilter !==
              "all" &&
            normalize(
              item.direction ||
                "outbound"
            ) !==
              normalize(
                directionFilter
              )
          ) {
            return false;
          }

          if (
            statusFilter !==
              "all" &&
            normalize(
              item.status ||
                "draft"
            ) !==
              normalize(
                statusFilter
              )
          ) {
            return false;
          }

          if (!cleanQuery) {
            return true;
          }

          const haystack = [
            item.channel,
            item.direction,
            item.subject,
            item.message,
            item.status,
            item.source,
            item.related_type,
            item.related_id,
            item.failure_reason,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return haystack.includes(
            cleanQuery
          );
        }
      );
    }, [
      communications,
      query,
      channelFilter,
      directionFilter,
      statusFilter,
    ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredCommunications.length /
        PAGE_SIZE
    )
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const safePage =
    Math.min(page, totalPages);

  const pagedCommunications =
    filteredCommunications.slice(
      (safePage - 1) *
        PAGE_SIZE,
      safePage * PAGE_SIZE
    );

  return (
    <div className="min-w-0 space-y-5 rounded-[2.25rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 pb-8 text-[#10233F] shadow-[0_24px_65px_rgba(18,56,101,0.15)] sm:p-4 lg:p-5">
      <StudentNotificationPreviewModal
        pending={pendingEmailNotification}
        busy={emailSending}
        onCancel={() => !emailSending && setPendingEmailNotification(null)}
        onConfirm={confirmSafeEmail}
      />
      <section className="min-w-0 overflow-hidden rounded-[1.8rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_50px_rgba(18,56,101,0.11)]">
        <div className="grid min-w-0 border-b-[3px] border-[#FF5A0A] lg:grid-cols-[minmax(0,1.45fr)_minmax(16rem,0.55fr)]">
          <div className="min-w-0 bg-[#123865] p-4 text-white sm:p-5">
            <div className="flex flex-wrap gap-2">
              <Badge
                text="Communication OS"
                tone="navyLight"
              />
              <Badge
                text={`Student #${
                  hasValidStudentId
                    ? studentId
                    : "—"
                }`}
                tone="navyLight"
              />
            </div>

            <h2 className="mt-3 break-words text-2xl font-black leading-tight tracking-[-0.03em] text-white sm:text-3xl">
              Student Communication Center
            </h2>

            <p className="mt-2 max-w-3xl break-words text-sm font-semibold leading-5 text-slate-100">
              Keep WhatsApp, email, calls,
              manual outreach and future
              automated communication in one
              permanent student history.
            </p>

            <div className="mt-4 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric
                label="Total"
                value={stats.total}
              />
              <DarkMetric
                label="Outbound"
                value={stats.outbound}
              />
              <DarkMetric
                label="Inbound"
                value={stats.inbound}
              />
              <DarkMetric
                label="Failed"
                value={stats.failed}
              />
            </div>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-4 text-white sm:p-5 lg:border-l-[3px] lg:border-t-0">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white">
              Communication Health
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <OrangeMetric
                label="Drafts"
                value={stats.drafts}
              />
              <OrangeMetric
                label="Queued"
                value={stats.pending}
              />
            </div>

            <div className="mt-3">
              <StudentNotificationComposer
                student={student}
                context="general"
                buttonLabel="Send Student Email"
                compact
              />
            </div>

            <button
              type="button"
              onClick={loadCommunications}
              disabled={loading}
              className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border-2 border-white bg-white px-4 text-xs font-black text-[#123865] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FFF4E8] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25 disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />
              {loading
                ? "Refreshing..."
                : "Refresh History"}
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <Feedback
          tone="error"
          onClose={() =>
            setError("")
          }
        >
          {error}
        </Feedback>
      ) : null}

      {successMessage ? (
        <Feedback
          tone="success"
          onClose={() =>
            setSuccessMessage("")
          }
        >
          {successMessage}
        </Feedback>
      ) : null}

      <div className="grid min-w-0 gap-3 md:grid-cols-2">
        <QuickContactCard
          title="WhatsApp"
          value={
            phone ||
            "No phone added"
          }
          actionLabel="Open WhatsApp"
          href={whatsappUrl}
          icon={MessageCircle}
          tone="green"
        />

        <QuickContactCard
          title="Email"
          value={
            email ||
            "No email added"
          }
          actionLabel="Open Email"
          href={emailUrl}
          icon={Mail}
          tone="orange"
        />
      </div>

      <Suspense fallback={<WorkspaceFallback label="Loading WhatsApp workspace..." />}>
        <WhatsAppWorkspace
        student={student}
        saving={
          creatingChannel ===
          "whatsapp"
        }
        onSaveDraft={(message) =>
          saveCommunication({
            channel:
              "whatsapp",
            direction:
              "outbound",
            message,
            status: "draft",
            source:
              "whatsapp_workspace",
          })
        }
      />
      </Suspense>

      <form
        onSubmit={previewSafeEmail}
        className="min-w-0 rounded-[1.5rem] border-[3px] border-[#123865] bg-white p-4 shadow-[0_10px_28px_rgba(18,56,101,0.06)] sm:p-5"
      >
        <SectionHeading
          eyebrow="Protected Email Delivery"
          title="Send a Real Student Email"
          description="Compose here when Zaifan should actually deliver an email through the verified notification system. Preview and explicit confirmation are mandatory before sending."
        />

        <div className="mt-4 rounded-[1.25rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4 text-xs font-semibold leading-5 text-blue-800 shadow-[0_6px_16px_rgba(18,56,101,0.04)]">
          Recipient: <strong>{email || "No student email"}</strong>. Drafts saved in the workspace below are not delivered automatically.
        </div>

        <label className="mt-4 block">
          <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#10233F]">Subject</span>
          <input
            value={safeEmailForm.subject}
            onChange={(event) =>
              setSafeEmailForm((previous) => ({ ...previous, subject: event.target.value }))
            }
            disabled={emailSending}
            placeholder="Example: Update on your university application"
            className="mt-2 h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100 disabled:opacity-50"
          />
        </label>

        <label className="mt-3 block">
          <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#10233F]">Message</span>
          <textarea
            value={safeEmailForm.message}
            onChange={(event) =>
              setSafeEmailForm((previous) => ({ ...previous, message: event.target.value }))
            }
            disabled={emailSending}
            rows={6}
            placeholder="Write the exact student-facing message..."
            className="mt-2 min-w-0 w-full resize-y rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 py-3 text-sm font-semibold leading-6 text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100 disabled:opacity-50"
          />
        </label>

        <button
          type="submit"
          disabled={
            emailSending ||
            !email ||
            !safeEmailForm.subject.trim() ||
            !safeEmailForm.message.trim()
          }
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#FF5A0A] bg-[#FF5A0A] px-5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-45 sm:w-fit"
        >
          <ShieldCheck size={15} />
          {emailSending ? "Preparing Preview..." : "Preview Before Sending"}
        </button>
      </form>

      <Suspense fallback={<WorkspaceFallback label="Loading email workspace..." />}>
        <EmailWorkspace
        student={student}
        saving={
          creatingChannel ===
          "email"
        }
        onSaveDraft={({
          subject,
          body,
        }) =>
          saveCommunication({
            channel: "email",
            direction:
              "outbound",
            subject,
            message: body,
            status: "draft",
            source:
              "email_workspace",
          })
        }
      />
      </Suspense>

      <form
        onSubmit={
          handleManualLog
        }
        className="min-w-0 rounded-[1.5rem] border-[3px] border-[#123865] bg-white p-4 shadow-[0_10px_28px_rgba(18,56,101,0.06)] sm:p-5"
      >
        <SectionHeading
          eyebrow="Manual Logging"
          title="Record a Communication"
          description="Use this for calls, inbound messages, SMS, portal messages or any interaction that happened outside an automated integration."
        />

        <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Select
            label="Channel"
            value={
              manualForm.channel
            }
            onChange={(value) =>
              setManualForm(
                (previous) => ({
                  ...previous,
                  channel: value,
                })
              )
            }
            options={CHANNEL_OPTIONS.map(
              (item) => [
                item,
                pretty(item),
              ]
            )}
          />

          <Select
            label="Direction"
            value={
              manualForm.direction
            }
            onChange={(value) =>
              setManualForm(
                (previous) => ({
                  ...previous,
                  direction:
                    value,
                })
              )
            }
            options={DIRECTION_OPTIONS.map(
              (item) => [
                item,
                pretty(item),
              ]
            )}
          />

          <Select
            label="Status"
            value={
              manualForm.status
            }
            onChange={(value) =>
              setManualForm(
                (previous) => ({
                  ...previous,
                  status: value,
                })
              )
            }
            options={[
              [
                "logged",
                "Logged / completed",
              ],
              [
                "received",
                "Received",
              ],
              [
                "draft",
                "Draft",
              ],
              [
                "sent",
                "Sent",
              ],
              [
                "failed",
                "Failed",
              ],
            ]}
          />

          <Input
            label="Subject"
            value={
              manualForm.subject
            }
            onChange={(value) =>
              setManualForm(
                (previous) => ({
                  ...previous,
                  subject: value,
                })
              )
            }
            placeholder="Optional"
          />

          <Select
            label="Related to"
            value={
              manualForm.related_type
            }
            onChange={(value) =>
              setManualForm(
                (previous) => ({
                  ...previous,
                  related_type:
                    value,
                })
              )
            }
            options={[
              [
                "",
                "General student communication",
              ],
              [
                "document",
                "Document",
              ],
              [
                "university",
                "University",
              ],
              [
                "application",
                "Application",
              ],
              [
                "visa",
                "Visa case",
              ],
              [
                "invoice",
                "Invoice",
              ],
              [
                "support",
                "Support request",
              ],
            ]}
          />

          <Input
            label="Related record ID"
            value={
              manualForm.related_id
            }
            onChange={(value) =>
              setManualForm(
                (previous) => ({
                  ...previous,
                  related_id:
                    value,
                })
              )
            }
            placeholder="Optional"
          />

          <label className="md:col-span-2 xl:col-span-2">
            <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#10233F]">
              Message / call notes
            </span>

            <textarea
              required
              value={
                manualForm.message
              }
              onChange={(event) =>
                setManualForm(
                  (previous) => ({
                    ...previous,
                    message:
                      event.target.value,
                  })
                )
              }
              rows={4}
              placeholder="What was said, sent, received or agreed?"
              className="mt-2 min-w-0 w-full resize-y rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 py-3 text-sm font-semibold leading-6 text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={
            anyMutationBusy ||
            !manualForm.message.trim()
          }
          className="mt-4 min-h-11 w-full rounded-xl border-2 border-[#FF5A0A] bg-[#FF5A0A] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 sm:w-fit"
        >
          {creatingChannel
            ? "Saving Communication..."
            : "Save Communication"}
        </button>
      </form>

      <section className="min-w-0 rounded-[1.55rem] border-[3px] border-[#123865] bg-white p-4 shadow-[0_12px_34px_rgba(18,56,101,0.07)] sm:p-5">
        <SectionHeading
          eyebrow="Student Contact History"
          title="Communication Timeline"
          description="Search and filter the student record instead of scrolling through an endless wall of messages."
        />

        <div className="mt-5 grid min-w-0 gap-3 rounded-[1.3rem] border-[3px] border-[#C9D7E6] bg-[#FFF8EF] p-3 lg:grid-cols-[minmax(0,1fr)_150px_150px_150px]">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
              placeholder="Search messages, subject, source or linked context..."
              className="h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-9 pr-3 text-sm font-semibold text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <FilterSelect
            value={
              channelFilter
            }
            onChange={
              setChannelFilter
            }
            label="All channels"
            values={
              CHANNEL_OPTIONS
            }
          />

          <FilterSelect
            value={
              directionFilter
            }
            onChange={
              setDirectionFilter
            }
            label="All directions"
            values={
              DIRECTION_OPTIONS
            }
          />

          <FilterSelect
            value={
              statusFilter
            }
            onChange={
              setStatusFilter
            }
            label="All statuses"
            values={
              STATUS_OPTIONS
            }
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-bold text-slate-500">
            {
              filteredCommunications.length
            }{" "}
            matching record
            {filteredCommunications.length ===
            1
              ? ""
              : "s"}{" "}
            · showing up to{" "}
            {PAGE_SIZE} per page
          </p>

          {query ||
          channelFilter !== "all" ||
          directionFilter !== "all" ||
          statusFilter !== "all" ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setChannelFilter(
                  "all"
                );
                setDirectionFilter(
                  "all"
                );
                setStatusFilter(
                  "all"
                );
              }}
              className="rounded-lg border-2 border-[#FF5A0A] bg-[#FFF4E8] px-3 py-1.5 text-xs font-black text-orange-700 transition hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            <EmptyState text="Loading communication history..." />
          ) : pagedCommunications.length ? (
            pagedCommunications.map(
              (item) => (
                <CommunicationRow
                  key={item.id}
                  item={item}
                  busy={
                    updatingId ===
                      item.id ||
                    deletingId ===
                      item.id
                  }
                  onStatus={(
                    value
                  ) =>
                    updateCommunicationStatus(
                      item,
                      value
                    )
                  }
                  onDelete={() =>
                    setPendingDelete(
                      item
                    )
                  }
                />
              )
            )
          ) : (
            <EmptyState text="No communications match the current filters." />
          )}
        </div>

        {filteredCommunications.length >
        PAGE_SIZE ? (
          <div className="mt-5 flex items-center justify-between gap-3 border-t-2 border-[#E1E8F0] pt-4">
            <button
              type="button"
              disabled={
                safePage <= 1
              }
              onClick={() =>
                setPage(
                  (previous) =>
                    Math.max(
                      1,
                      previous - 1
                    )
                )
              }
              className="rounded-xl border-2 border-[#C9D7E6] bg-white px-4 py-2 text-xs font-black text-[#10233F] transition hover:border-[#FF5A0A] hover:bg-[#FFF4E8] disabled:opacity-40"
            >
              Previous
            </button>

            <p className="text-xs font-black text-slate-600">
              Page {safePage} of{" "}
              {totalPages}
            </p>

            <button
              type="button"
              disabled={
                safePage >= totalPages
              }
              onClick={() =>
                setPage(
                  (previous) =>
                    Math.min(
                      totalPages,
                      previous + 1
                    )
                )
              }
              className="rounded-xl border-2 border-[#C9D7E6] bg-white px-4 py-2 text-xs font-black text-[#10233F] transition hover:border-[#FF5A0A] hover:bg-[#FFF4E8] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </section>

      {pendingDelete ? (
        <DeleteConfirmation
          item={pendingDelete}
          deleting={
            deletingId ===
            pendingDelete.id
          }
          onCancel={() =>
            !deletingId &&
            setPendingDelete(null)
          }
          onConfirm={
            deleteCommunication
          }
        />
      ) : null}
    </div>
  );
}

function CommunicationRow({
  item,
  busy,
  onStatus,
  onDelete,
}) {
  const channel = normalize(
    item.channel || "manual"
  );

  const direction = normalize(
    item.direction ||
      "outbound"
  );

  const status = normalize(
    item.status || "draft"
  );

  const Icon =
    channel === "email"
      ? Mail
      : channel === "call"
      ? Phone
      : MessageCircle;

  const allowedNext =
    STATUS_FLOW[status] || [];

  return (
    <article className="min-w-0 rounded-[1.3rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:shadow-md">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#123865]/15 bg-[#FFF8EF] text-[#123865]">
            <Icon size={17} />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-black text-[#10233F]">
                {pretty(channel)}
              </p>

              <DirectionBadge
                value={
                  direction
                }
              />

              <StatusBadge
                value={status}
              />
            </div>

            {item.subject ? (
              <p className="mt-2 text-sm font-black text-[#10233F]">
                {item.subject}
              </p>
            ) : null}

            <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">
              {item.message ||
                "No message saved."}
            </p>

            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
              <span>
                {formatDateTime(
                  item.created_at
                )}
              </span>

              {item.source ? (
                <span>
                  •{" "}
                  {pretty(
                    item.source
                  )}
                </span>
              ) : null}

              {item.related_type ? (
                <span>
                  •{" "}
                  {pretty(
                    item.related_type
                  )}
                  {item.related_id
                    ? ` · ${item.related_id}`
                    : ""}
                </span>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold text-slate-500">
              {item.sent_at ? (
                <span>
                  Sent:{" "}
                  {formatDateTime(
                    item.sent_at
                  )}
                </span>
              ) : null}

              {item.delivered_at ? (
                <span>
                  Delivered:{" "}
                  {formatDateTime(
                    item.delivered_at
                  )}
                </span>
              ) : null}

              {item.read_at ? (
                <span>
                  Read:{" "}
                  {formatDateTime(
                    item.read_at
                  )}
                </span>
              ) : null}
            </div>

            {item.failure_reason ? (
              <p className="mt-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-800">
                Failure:{" "}
                {
                  item.failure_reason
                }
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid min-w-0 gap-2 xl:w-[200px]">
          <label>
            <span className="mb-1 block text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
              Communication Status
            </span>

            <select
              disabled={busy}
              value={status}
              onChange={(event) =>
                onStatus(
                  event.target.value
                )
              }
              className="h-10 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-[#10233F] outline-none transition hover:border-[#FF5A0A] focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100 disabled:opacity-50"
            >
              <option
                value={status}
              >
                {pretty(status)}
              </option>

              {STATUS_OPTIONS.filter(
                (option) =>
                  option !== status &&
                  allowedNext.includes(
                    option
                  )
              ).map((option) => (
                <option
                  key={option}
                  value={option}
                >
                  {pretty(option)}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#FB7185] bg-[#FFF4F4] px-3 text-xs font-black text-red-700 transition hover:-translate-y-0.5 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:opacity-50"
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

function QuickContactCard({
  title,
  value,
  actionLabel,
  href,
  icon: Icon,
  tone,
}) {
  const green =
    tone === "green";

  return (
    <article className="min-w-0 rounded-[1.35rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:shadow-md">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 ${
            green
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-[#FF5A0A] bg-[#FFF4E8] text-orange-700"
          }`}
        >
          <Icon size={18} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            {title}
          </p>

          <p className="mt-2 break-words text-sm font-black text-[#10233F]">
            {value}
          </p>

          {href ? (
            <a
              href={href}
              target={
                href.startsWith(
                  "mailto:"
                )
                  ? "_self"
                  : "_blank"
              }
              rel="noreferrer"
              className={`mt-3 inline-flex rounded-xl px-4 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                green
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-[#FF5A0A] hover:bg-[#E94F08]"
              }`}
            >
              {actionLabel}
            </a>
          ) : (
            <p className="mt-3 text-xs font-semibold text-red-600">
              Contact detail missing.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}) {
  return (
    <div>
      <p className="inline-flex rounded-full border-2 border-[#FF5A0A] bg-[#FFF4E8] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
        {eyebrow}
      </p>

      <h3 className="mt-3 break-words text-2xl font-black tracking-[-0.025em] text-[#10233F]">
        {title}
      </h3>

      <p className="mt-1.5 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function Badge({
  text,
  tone = "slate",
}) {
  const styles = {
    orange:
      "border-[#FF5A0A] bg-[#FFF4E8] text-orange-800",
    navy:
      "border-[#123865] bg-[#123865] text-white",
    navyLight:
      "border-white/20 bg-white/10 text-white",
    slate:
      "border-[#C9D7E6] bg-slate-50 text-slate-700",
  };

  return (
    <span
      className={`rounded-full border-2 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${
        styles[tone] ||
        styles.slate
      }`}
    >
      {text}
    </span>
  );
}

function DirectionBadge({
  value,
}) {
  const clean = normalize(value);

  const style =
    clean === "inbound"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : clean === "internal"
      ? "border-[#C9D7E6] bg-[#F7FAFC] text-slate-700"
      : "border-blue-300 bg-blue-50 text-blue-800";

  return (
    <span
      className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${style}`}
    >
      {pretty(clean)}
    </span>
  );
}

function StatusBadge({
  value,
}) {
  const clean = normalize(value);

  const style =
    [
      "sent",
      "delivered",
      "read",
      "received",
      "logged",
    ].includes(clean)
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : clean === "failed"
      ? "border-red-300 bg-red-50 text-red-800"
      : [
          "queued",
          "scheduled",
        ].includes(clean)
      ? "border-blue-300 bg-blue-50 text-blue-800"
      : clean === "cancelled"
      ? "border-slate-400 bg-slate-100 text-slate-700"
      : "border-[#FF5A0A] bg-[#FFF4E8] text-orange-800";

  return (
    <span
      className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${style}`}
    >
      {pretty(clean)}
    </span>
  );
}

function Feedback({
  tone,
  onClose,
  children,
}) {
  const style =
    tone === "error"
      ? "border-red-400 bg-red-50 text-red-900"
      : "border-emerald-400 bg-emerald-50 text-emerald-900";

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex min-w-0 items-start gap-3 rounded-[1.3rem] border-[3px] p-4 text-sm font-bold shadow-[0_8px_22px_rgba(18,56,101,0.05)] ${style}`}
    >
      {tone === "error" ? (
        <AlertTriangle
          size={17}
          className="mt-0.5 shrink-0"
        />
      ) : (
        <CheckCircle2
          size={17}
          className="mt-0.5 shrink-0"
        />
      )}

      <div className="min-w-0 flex-1">
        {children}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss message"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-current/20 bg-white/50 transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-current/15"
      >
        <XCircle size={16} />
      </button>
    </div>
  );
}

function WorkspaceFallback({ label }) {
  return (
    <div className="min-w-0 rounded-[1.5rem] border-[3px] border-[#123865] bg-white p-4 shadow-[0_10px_28px_rgba(18,56,101,0.06)] sm:p-5">
      <div className="flex min-h-28 items-center justify-center gap-3 rounded-[1.25rem] border-2 border-dashed border-[#C9D7E6] bg-white px-4 text-sm font-black text-[#123865]">
        <RefreshCw size={16} className="animate-spin text-[#FF5A0A]" />
        {label}
      </div>
    </div>
  );
}

function EmptyState({
  text,
}) {
  return (
    <div className="rounded-[1.3rem] border-[3px] border-dashed border-[#FF5A0A] bg-[#FFF8EF] p-7 text-center text-sm font-bold text-slate-500">
      {text}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder = "",
}) {
  return (
    <label>
      <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#10233F]">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        className="mt-2 h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options = [],
}) {
  return (
    <label>
      <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#10233F]">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="mt-2 h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-sm font-bold text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
      >
        {options.map(
          ([
            optionValue,
            optionLabel,
          ]) => (
            <option
              key={optionValue}
              value={optionValue}
            >
              {optionLabel}
            </option>
          )
        )}
      </select>
    </label>
  );
}

function FilterSelect({
  value,
  onChange,
  label,
  values,
}) {
  return (
    <select
      value={value}
      onChange={(event) =>
        onChange(
          event.target.value
        )
      }
      className="h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-xs font-black text-[#10233F] outline-none transition hover:border-[#FF5A0A] focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
    >
      <option value="all">
        {label}
      </option>

      {values.map((option) => (
        <option
          key={option}
          value={option}
        >
          {pretty(option)}
        </option>
      ))}
    </select>
  );
}

function DarkMetric({
  label,
  value,
}) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function OrangeMetric({
  label,
  value,
}) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/30 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function DeleteConfirmation({
  item,
  deleting,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-[#10233F]/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-[1.7rem] border-[4px] border-[#123865] bg-[#FFFDF8] shadow-[0_30px_100px_rgba(15,35,63,0.34)]">
        <div className="border-b-[3px] border-[#FF5A0A] bg-[#123865] p-5 text-white">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10 text-white">
              <ShieldCheck size={17} />
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                Protected Action
              </p>

              <h3 className="mt-1 text-xl font-black text-white">
                Delete Communication?
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-[#FFF8EF] p-5">
          <p className="text-sm font-semibold leading-6 text-slate-700">
            This will remove the selected{" "}
            <strong>
              {pretty(
                item.channel
              )}
            </strong>{" "}
            record from
            <strong>
              {" "}
              student_communications
            </strong>
            .
          </p>

          <div className="mt-4 rounded-xl border-2 border-red-300 bg-red-50 p-4">
            <p className="text-xs font-black text-red-900">
              {item.subject ||
                "No subject"}
            </p>

            <p className="mt-1 line-clamp-3 text-xs font-semibold text-red-800">
              {item.message}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={deleting}
              className="h-11 rounded-xl border-2 border-[#C9D7E6] bg-white text-xs font-black text-[#10233F] transition hover:border-[#FF5A0A] hover:bg-[#FFF4E8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-red-600 bg-red-600 text-xs font-black text-white disabled:opacity-50"
            >
              <Trash2 size={14} />
              {deleting
                ? "Deleting..."
                : "Delete Record"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommunicationCenterPanel;
