// "My account" in the student portal: who Zaifan has on file, who the
// counselor is, and a way to change the password at any time.

import { useState } from "react";
import { KeyRound, MessageCircle, UserRound } from "lucide-react";

import { studentSupabase } from "../../lib/studentSupabase";
import { waLink } from "../admin/lib/format";
import { Button, Field, Input, KeyValue, Modal, Notice, useToast } from "../admin/ui/kit";

const OFFICE_WHATSAPP = "+923305718131";

export default function AccountModal({ file, onClose }) {
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const person = file.person;

  const save = async (event) => {
    event.preventDefault();
    if (password.length < 8) return setProblem("Please use at least 8 characters.");
    if (password !== again) return setProblem("The two passwords are not the same.");
    setProblem("");
    setBusy(true);
    const { error } = await studentSupabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setProblem(/different from the old/i.test(error.message) ? "That is your current password. Please choose a new one." : error.message);
    setPassword("");
    setAgain("");
    toast.push("Password changed. Use the new one next time you log in.");
  };

  return (
    <Modal open onClose={onClose} title="My account" subtitle="The details Zaifan has for you.">
      <div className="space-y-5">
        <section>
          <p className="mb-2 flex items-center gap-2 text-[13px] font-black">
            <UserRound size={15} className="text-[#ff4b12]" /> You
          </p>
          <KeyValue
            items={[
              { label: "Name", value: person.name || "—" },
              { label: "Email (your login)", value: person.email || "—" },
              { label: "Phone", value: person.phone || "—" },
              { label: "Going to", value: person.country || "Not chosen yet" },
              { label: "Your counselor", value: person.counselor?.name || "Zaifan team" },
            ]}
          />
          <p className="mt-2 text-[12.5px] font-semibold leading-5 text-[#071f50]/55">Something wrong or changed (new phone number, spelling of your name)? Tell us and we will fix it.</p>
          <a
            href={waLink(OFFICE_WHATSAPP, `Hello Zaifan, this is ${person.name || "a student"}. Please update my details: `)}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-[12.5px] font-extrabold text-emerald-700 transition hover:border-emerald-400"
          >
            <MessageCircle size={14} /> Tell us on WhatsApp
          </a>
        </section>

        <form onSubmit={save} className="rounded-2xl bg-[#fff7ed] p-4">
          <p className="mb-3 flex items-center gap-2 text-[13px] font-black">
            <KeyRound size={15} className="text-[#ff4b12]" /> Change your password
          </p>
          <div className="space-y-3">
            <Field label="New password" hint="at least 8 characters">
              <Input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} />
            </Field>
            <Field label="Type it again">
              <Input type="password" autoComplete="new-password" value={again} onChange={(event) => setAgain(event.target.value)} disabled={busy} />
            </Field>
            {problem ? <Notice tone="error">{problem}</Notice> : null}
            <Button type="submit" variant="navy" busy={busy} disabled={!password || !again}>
              Save new password
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
