import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import WhatsAppWorkspace from "./WhatsAppWorkspace";
import EmailWorkspace from "./EmailWorkspace";

function CommunicationCenterPanel({ student = {} }) {
  const [communications, setCommunications] = useState([]);
  const [error, setError] = useState("");

  const fullName = student?.full_name || student?.name || "Student";
  const phone = student?.phone || student?.phone_number || "";
  const email = student?.email || "";
  const studentId = student?.id;
  const studentType = student?.student_type || student?.type || "inquiry";

  useEffect(() => {
    loadCommunications();
  }, [studentId]);

  const loadCommunications = async () => {
    if (!studentId) return;

    const { data, error } = await supabase
      .from("student_communications")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else setCommunications(data || []);
  };

  const saveCommunication = async ({ channel, subject = "", message }) => {
    if (!studentId || !message) return;

    const { error } = await supabase.from("student_communications").insert({
      student_id: studentId,
      student_type: studentType,
      channel,
      subject,
      message,
      status: "draft",
    });

    if (error) setError(error.message);
    else await loadCommunications();
  };

  const whatsappUrl = useMemo(() => {
    const cleanPhone = phone.replace(/[^\d]/g, "");
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
          Manage WhatsApp, email, counselor outreach, and saved communication history.
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
        <h3 className="font-bold text-white">Communication History</h3>

        <p className="mt-2 text-sm text-white/45">
          Save manual communication records for counselor tracking.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              saveCommunication({
                channel: "whatsapp",
                message: `Follow-up sent to ${fullName} on WhatsApp.`,
              })
            }
            className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300"
          >
            Log WhatsApp Follow-up
          </button>

          <button
            type="button"
            onClick={() =>
              saveCommunication({
                channel: "email",
                subject: "Zaifan Consultancy Follow-up",
                message: `Follow-up email prepared for ${fullName}.`,
              })
            }
            className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold text-[#D4AF37]"
          >
            Log Email Follow-up
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {communications.length ? (
            communications.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold capitalize text-white">
                    {item.channel}
                  </p>

                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/45">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>

                {item.subject ? (
                  <p className="mt-2 text-sm font-semibold text-[#D4AF37]">
                    {item.subject}
                  </p>
                ) : null}

                <p className="mt-2 text-sm text-white/55">{item.message}</p>
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