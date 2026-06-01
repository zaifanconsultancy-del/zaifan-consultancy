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

function CommunicationCenterPanel({
  student = {},
  sharedCommunications = [],
  onSharedDataChange = () => {},
}) {
  const [communications, setCommunications] = useState(sharedCommunications || []);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingType, setSavingType] = useState("");

  const fullName = student?.full_name || student?.name || "Student";
  const phone = student?.phone || student?.phone_number || "";
  const email = student?.email || "";
  const studentId = student?.id;
  const studentType = student?.student_type || student?.type || "inquiry";

  useEffect(() => {
    setCommunications(sharedCommunications || []);
  }, [sharedCommunications]);

  useEffect(() => {
    loadCommunications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, studentType]);

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

  const saveCommunication = async ({ channel, subject = "", message }) => {
    if (!studentId || !message || savingType) return;

    setSavingType(channel);
    setError("");

    try {
      const payload = {
        student_id: String(studentId),
        student_type: studentType,
        channel,
        subject,
        message,
        status: "draft",
      };

      const { error } = await withTimeout(
        supabase.from("student_communications").insert(payload).select().single(),
        "Communication save timed out."
      );

      if (error) {
        setError(error.message || "Failed to save communication.");
        return;
      }

      await loadCommunications();
      onSharedDataChange();
    } catch (error) {
      console.error("Communication save crashed:", error);
      setError(error.message || "Communication save failed.");
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
      <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-500/[0.05] p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">
          Communication Center
        </p>

        <h2 className="mt-2 text-2xl font-black text-white">
          Student Engagement Hub
        </h2>

        <p className="mt-2 text-white/60">
          Manage WhatsApp, email, counselor outreach, and saved communication
          history.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
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

      <WhatsAppWorkspace student={student} />
      <EmailWorkspace student={student} />

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold text-white">Communication History</h3>

            <p className="mt-2 text-sm text-white/45">
              Save manual communication records for counselor tracking.
            </p>
          </div>

          <button
            type="button"
            onClick={loadCommunications}
            disabled={loading}
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/60 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37] disabled:opacity-50"
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
              })
            }
            className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300 disabled:opacity-50"
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
              })
            }
            className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold text-[#D4AF37] disabled:opacity-50"
          >
            {savingType === "email" ? "Saving..." : "Log Email Follow-up"}
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {loading ? (
            <p className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/40">
              Loading communication history...
            </p>
          ) : communications.length ? (
            communications.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold capitalize text-white">
                    {item.channel || "communication"}
                  </p>

                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/45">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString()
                      : "Unknown date"}
                  </span>
                </div>

                {item.subject ? (
                  <p className="mt-2 text-sm font-semibold text-[#D4AF37]">
                    {item.subject}
                  </p>
                ) : null}

                <p className="mt-2 whitespace-pre-wrap text-sm text-white/55">
                  {item.message || "No message saved."}
                </p>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/40">
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
      className={`rounded-[1.75rem] border p-5 ${
        isGold
          ? "border-[#D4AF37]/20 bg-[#D4AF37]/[0.04]"
          : "border-emerald-400/20 bg-emerald-500/[0.04]"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-white/35">
        {title}
      </p>

      <p className="mt-3 break-words text-sm font-semibold text-white/75">
        {value}
      </p>

      {href ? (
        <a
          href={href}
          target={href.startsWith("mailto:") ? "_self" : "_blank"}
          rel="noreferrer"
          className={`mt-4 inline-flex rounded-full px-5 py-2 text-sm font-black transition hover:-translate-y-0.5 ${
            isGold
              ? "bg-[#D4AF37] text-black hover:bg-[#E7C768]"
              : "bg-emerald-400 text-black hover:bg-emerald-300"
          }`}
        >
          {actionLabel}
        </a>
      ) : (
        <p className="mt-4 text-sm text-white/35">Contact detail missing.</p>
      )}
    </div>
  );
}

export default CommunicationCenterPanel;