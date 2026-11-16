// "Send a message": pick a ready-made template, edit it, then open WhatsApp
// or email with the text filled in. What was sent is saved to the student's
// Messages tab so the whole team can see it.

import { useMemo, useState } from "react";
import { Copy, Mail, MessageCircle, Sparkles } from "lucide-react";

import { useAdminData } from "../data/AdminDataProvider";
import { classNames, mailLink, waLink } from "../lib/format";
import { fillTemplate, templatesFor, templateValues } from "../lib/templates";
import { Button, Modal, Textarea, useToast } from "./kit";

export default function MessageComposer({ person, open, onClose }) {
  const { admin, insert, logEvent } = useAdminData();
  const toast = useToast();
  const list = useMemo(() => templatesFor(person), [person]);
  const values = useMemo(() => templateValues(person, admin), [person, admin]);
  const [picked, setPicked] = useState(list[0]?.id || "");
  const [text, setText] = useState(() => (list[0] ? fillTemplate(list[0].text, values) : ""));

  const template = list.find((item) => item.id === picked);

  const pick = (item) => {
    setPicked(item.id);
    setText(fillTemplate(item.text, values));
  };

  // Saved to the Messages tab; never blocks the actual sending.
  const record = async (channel) => {
    if (!person.primary) return;
    try {
      await insert("communications", {
        student_id: person.primary.student_id,
        student_type: person.primary.student_type,
        channel,
        direction: "outbound",
        subject: template?.subject || null,
        message: text.trim(),
        status: "sent",
        source: "template",
        sender_id: admin.id,
        sent_at: new Date().toISOString(),
        is_internal: false,
        metadata: { template: picked, sent_by: admin.name },
      });
      await logEvent(person, { actionType: "message_sent", title: `${channel === "whatsapp" ? "WhatsApp" : "Email"}: ${template?.label || "message"}` });
    } catch {
      // toast shown by provider
    }
  };

  const whatsapp = waLink(person.phone, text);
  const email = mailLink(person.email, template?.subject || "Zaifan Consultancy");

  const send = (channel) => {
    const href = channel === "whatsapp" ? whatsapp : `${email}${email.includes("?") ? "&" : "?"}body=${encodeURIComponent(text)}`;
    window.open(href, "_blank", "noopener");
    record(channel);
    toast.push(channel === "whatsapp" ? "WhatsApp opened. Press send there." : "Email opened. Press send there.");
    onClose();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.push("Copied.");
    } catch {
      toast.push({ tone: "error", message: "Couldn't copy. Select the text and copy it yourself." });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="max-w-3xl"
      title={`Message ${person.name.split(" ")[0]}`}
      subtitle="Pick a ready-made message, change anything you like, then send it on WhatsApp or email."
      footer={
        <>
          <Button icon={Copy} onClick={copy} disabled={!text.trim()}>
            Copy
          </Button>
          {email ? (
            <Button icon={Mail} onClick={() => send("email")} disabled={!text.trim()}>
              Email
            </Button>
          ) : null}
          <Button variant="success" icon={MessageCircle} onClick={() => send("whatsapp")} disabled={!whatsapp || !text.trim()}>
            Open WhatsApp
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
        <ul className="max-h-[52vh] space-y-1 overflow-y-auto pr-1">
          {list.map((item, index) => (
            <li key={item.id}>
              {index > 0 && item.suggested !== list[index - 1].suggested ? <p className="mb-1 mt-3 px-2 text-[10.5px] font-black uppercase tracking-[0.14em] text-[#071f50]/40">Other messages</p> : null}
              {index === 0 && item.suggested ? (
                <p className="mb-1 flex items-center gap-1 px-2 text-[10.5px] font-black uppercase tracking-[0.14em] text-[#ff4b12]">
                  <Sparkles size={11} /> Good for this stage
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => pick(item)}
                className={classNames(
                  "w-full rounded-xl px-3 py-2 text-left text-[13.5px] font-bold transition",
                  picked === item.id ? "bg-[#071f50] text-white" : "text-[#071f50] hover:bg-[#071f50]/[0.05]"
                )}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
        <div className="min-w-0">
          <Textarea value={text} onChange={(event) => setText(event.target.value)} rows={12} className="text-[14px] leading-6" />
          <p className="mt-1.5 text-[11.5px] font-semibold text-[#071f50]/45">
            {person.phone ? `WhatsApp: ${person.phone}` : "No phone number on file"}
            {person.email ? ` · Email: ${person.email}` : ""} · Saved to the Messages tab when you send.
          </p>
        </div>
      </div>
    </Modal>
  );
}
