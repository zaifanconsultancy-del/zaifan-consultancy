// CommunicationCenterPanel V2 — Student Engagement Hub
// Preserves Supabase communication history, WhatsApp/email draft logging,
// timeline events, parent Student OS refresh, quick-contact links, and child workspaces.
// Rebuilt as a coherent high-contrast Zaifan Admin OS surface.

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import WhatsAppWorkspace from "./WhatsAppWorkspace";
import EmailWorkspace from "./EmailWorkspace";

const REQUEST_TIMEOUT_MS = 12000;

async function withTimeout(promise, message = "Request timed out.") {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS)
    ),
  ]);
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
      supabase.from("student_application_timeline").insert({
        student_id: Number(studentId),
        student_type: studentType,
        event_type: eventType,
        title,
        description,
        new_value: newValue,
      }),
      "Communication timeline event timed out."
    );
  } catch {
    // Timeline should never break communications.
  }
}

function CommunicationCenterPanel({
  student = {},
  sharedCommunications = [],
  onSharedDataChange = () => {},
}) {
  const [communications, setCommunications] = useState(sharedCommunications || []);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingType, setSavingType] = useState("");

  const fullName = student?.full_name || student?.name || "Student";
  const phone = student?.phone || student?.phone_number || "";
  const email = student?.email || "";
  const studentId = student?.id;
  const studentType =
    student?.student_type || student?.__leadType || student?.type || "inquiry";

  useEffect(() => {
    setCommunications(sharedCommunications || []);
  }, [sharedCommunications]);

  useEffect(() => {
    loadCommunications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, studentType]);

  const notifyParent = async () => {
    if (typeof onSharedDataChange !== "function") return;

    try {
      await withTimeout(
        Promise.resolve(onSharedDataChange({ source: "communication_center" })),
        "Student OS refresh after communication save timed out."
      );
    } catch (refreshError) {
      console.warn(
        "Communication saved, but parent Student OS refresh failed:",
        refreshError
      );
    }
  };

  const loadCommunications = async () => {
    if (!studentId) {
      setCommunications([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("student_communications")
          .select("*")
          .eq("student_id", String(studentId))
          .eq("student_type", studentType)
          .order("created_at", { ascending: false }),
        "Communication history loading timed out."
      );

      if (error) {
        setError(error.message || "Failed to load communications.");
        setCommunications([]);
        return;
      }

      setCommunications(data || []);
    } catch (error) {
      console.error("Communication load crashed:", error);
      setError(error.message || "Communication history failed to load.");
      setCommunications([]);
    } finally {
      setLoading(false);
    }
  };

  const saveCommunication = async ({
    channel,
    subject = "",
    message,
    status = "draft",
    source = "manual",
  }) => {
    if (!studentId || !message || savingType) return false;

    setSavingType(channel);
    setError("");
    setSuccessMessage("");

    try {
      const payload = {
        student_id: String(studentId),
        student_type: studentType,
        channel,
        subject,
        message,
        status,
        source,
      };

      const { data, error } = await withTimeout(
        supabase.from("student_communications").insert(payload).select().single(),
        "Communication save timed out."
      );

      if (error) {
        setError(error.message || "Failed to save communication.");
        return false;
      }

      setCommunications((prev) => [data, ...(prev || [])]);

      await createTimelineEvent({
        studentId,
        studentType,
        eventType: "communication_logged",
        title:
          channel === "whatsapp"
            ? "WhatsApp Draft Saved"
            : channel === "email"
            ? "Email Draft Saved"
            : "Communication Logged",
        description: subject ? `${subject}\n\n${message}` : message,
        newValue: channel,
      });

      setSuccessMessage(
        channel === "whatsapp"
          ? "WhatsApp draft saved to communication history."
          : channel === "email"
          ? "Email draft saved to communication history."
          : "Communication saved."
      );

      await notifyParent();
      return true;
    } catch (error) {
      console.error("Communication save crashed:", error);
      setError(error.message || "Communication save failed.");
      return false;
    } finally {
      setSavingType("");
    }
  };

  const whatsappUrl = useMemo(() => {
    const cleanPhone = String(phone || "").replace(/[^\d]/g, "");
    const message = encodeURIComponent(
      `Hi ${fullName}, this is Zaifan Consultancy. I wanted to follow up regarding your study abroad process.`
    );

    return cleanPhone ? `https://wa.me/${cleanPhone}?text=${message}` : "";
  }, [phone, fullName]);

  const emailUrl = useMemo(() => {
    const subject = encodeURIComponent("Zaifan Consultancy Follow-up");
    const body = encodeURIComponent(
      `Hi ${fullName},\n\nI hope you are doing well. This is Zaifan Consultancy following up regarding your study abroad process.\n\nBest regards,\nZaifan Consultancy Team`
    );

    return email ? `mailto:${email}?subject=${subject}&body=${body}` : "";
  }, [email, fullName]);

  return (
    <div className="space-y-5">
      <div className="rounded-[1.8rem] border-2 border-orange-300 bg-[#102f5c] p-6 text-white shadow-[0_16px_40px_rgba(15,35,63,0.14)]">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">
          Communication Center
        </p>

        <h2 className="mt-2 text-2xl font-black text-white">
          Student Engagement Hub
        </h2>

        <p className="mt-2 text-slate-200">
          Manage WhatsApp, email, counselor outreach, saved drafts, and full
          communication history.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <QuickContactCard
          title="WhatsApp Contact"
          value={phone || "No phone added"}
          actionLabel="Open WhatsApp"
          href={whatsappUrl}
          color="emerald"
        />

        <QuickContactCard
          title="Email Contact"
          value={email || "No email added"}
          actionLabel="Open Email"
          href={emailUrl}
          color="gold"
        />
      </div>

      <WhatsAppWorkspace
        student={student}
        saving={savingType === "whatsapp"}
        onSaveDraft={(message) =>
          saveCommunication({
            channel: "whatsapp",
            message,
            source: "whatsapp_workspace",
          })
        }
      />

      <EmailWorkspace
        student={student}
        saving={savingType === "email"}
        onSaveDraft={({ subject, body }) =>
          saveCommunication({
            channel: "email",
            subject,
            message: body,
            source: "email_workspace",
          })
        }
      />

      <div className="rounded-[1.75rem] border border-slate-300 bg-white p-6 shadow-[0_10px_28px_rgba(15,35,63,0.05)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-black text-[#10233f]">Communication History</h3>

            <p className="mt-2 text-sm text-slate-600">
              Save manual communication records for counselor tracking.
            </p>
          </div>

          <button
            type="button"
            onClick={loadCommunications}
            disabled={loading}
            className="rounded-full border border-orange-300 bg-white px-4 py-2 text-xs font-black text-orange-700 transition hover:border-orange-400 hover:bg-orange-50 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={Boolean(savingType)}
            onClick={() =>
              saveCommunication({
                channel: "whatsapp",
                message: `Follow-up sent to ${fullName} on WhatsApp.`,
                source: "manual_log_button",
              })
            }
            className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
          >
            {savingType === "whatsapp" ? "Saving..." : "Log WhatsApp Follow-up"}
          </button>

          <button
            type="button"
            disabled={Boolean(savingType)}
            onClick={() =>
              saveCommunication({
                channel: "email",
                subject: "Zaifan Consultancy Follow-up",
                message: `Follow-up email prepared for ${fullName}.`,
                source: "manual_log_button",
              })
            }
            className="rounded-full border border-orange-300 bg-orange-50 px-4 py-2 text-xs font-black text-orange-700 transition hover:bg-orange-100 disabled:opacity-50"
          >
            {savingType === "email" ? "Saving..." : "Log Email Follow-up"}
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {loading ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-[#fffaf2] p-4 text-sm text-slate-500">
              Loading communication history...
            </p>
          ) : communications.length ? (
            communications.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-300 bg-[#fffaf2] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black capitalize text-[#10233f]">
                    {item.channel || "communication"}
                  </p>

                  <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString()
                      : "Unknown date"}
                  </span>
                </div>

                {item.subject ? (
                  <p className="mt-2 text-sm font-black text-orange-700">
                    {item.subject}
                  </p>
                ) : null}

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {item.message || "No message saved."}
                </p>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-[#fffaf2] p-4 text-sm text-slate-500">
              No communication history yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickContactCard({ title, value, actionLabel, href, color }) {
  const isGold = color === "gold";

  return (
    <div
      className={`rounded-[1.75rem] border p-5 shadow-[0_8px_22px_rgba(15,35,63,0.04)] ${
        isGold
          ? "border-orange-300 bg-[#fff8ee]"
          : "border-slate-300 bg-white"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
        {title}
      </p>

      <p className="mt-3 break-words text-sm font-bold text-[#10233f]">
        {value}
      </p>

      {href ? (
        <a
          href={href}
          target={href.startsWith("mailto:") ? "_self" : "_blank"}
          rel="noreferrer"
          className={`mt-4 inline-flex rounded-full px-5 py-2 text-sm font-black transition hover:-translate-y-0.5 ${
            isGold
              ? "bg-orange-500 text-white shadow-[0_8px_18px_rgba(249,115,22,0.18)] hover:bg-orange-600"
              : "bg-[#102f5c] text-white shadow-[0_8px_18px_rgba(15,35,63,0.16)] hover:bg-[#183f72]"
          }`}
        >
          {actionLabel}
        </a>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Contact detail missing.</p>
      )}
    </div>
  );
}

export default CommunicationCenterPanel;
