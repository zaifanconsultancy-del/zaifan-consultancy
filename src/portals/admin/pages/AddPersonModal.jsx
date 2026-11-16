// "Add a person": the team met someone on the phone or in the office.
// We store it as an inquiry with lead_source = admin_manual through the
// staff_add_person() database function (see supabase/sql/2026-11-14-counselor-scope.sql).

import { useState } from "react";
import { path } from "../lib/paths";
import { useNavigate } from "react-router-dom";

import { useAdminData } from "../data/AdminDataProvider";
import { Button, Field, FormRow, Input, Modal, Select, Textarea, useForm, useToast } from "../ui/kit";

const COUNTRIES = ["Italy", "Germany", "France", "Belgium", "Lithuania", "Hungary", "China", "Vietnam", "Malaysia", "Not sure yet"];
const LEVELS = ["Bachelor", "Master", "PhD", "Language course", "Not sure yet"];

const INITIAL = { full_name: "", phone: "", email: "", country: "Italy", study_level: "Master", field_of_interest: "", message: "", stage: "consulting" };

export default function AddPersonModal({ open, onClose }) {
  const { rpc, reload } = useAdminData();
  const [form, set, reset] = useForm(INITIAL);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    if (!form.full_name.trim()) return toast.push({ tone: "error", message: "Please type the person's name." });
    if (!form.phone.trim() && !form.email.trim()) return toast.push({ tone: "error", message: "Add a phone number or an email so you can reach them." });
    setBusy(true);
    try {
      // One server call: saves the inquiry, finds or creates the person
      // (matched on phone/email) and, for a counselor, puts them on their list.
      const created = await rpc("staff_add_person", {
        p: {
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          country: form.country,
          study_level: form.study_level,
          field_of_interest: form.field_of_interest.trim(),
          message: form.message.trim(),
          stage: form.stage,
        },
      });
      await reload(["inquiries", "identities"]);
      reset();
      onClose();
      if (created?.visible === false) {
        toast.push({ tone: "info", message: `${form.full_name.trim()} is already looked after by another counselor. Ask an admin if they should move to you.` });
      } else {
        toast.push(`${form.full_name.trim()} added.`);
        if (created?.person_id) navigate(path(`/people/${created.person_id}`));
      }
    } catch {
      // toast already shown
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a person"
      subtitle="Someone who called, walked in or messaged you directly. Website forms add themselves."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" busy={busy} onClick={submit}>
            Save person
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" required>
          <Input value={form.full_name} onChange={set("full_name")} placeholder="e.g. Ayesha Khan" autoFocus />
        </Field>
        <FormRow>
          <Field label="Phone / WhatsApp" hint="one of these is needed">
            <Input value={form.phone} onChange={set("phone")} placeholder="03xx xxxxxxx" inputMode="tel" />
          </Field>
          <Field label="Email">
            <Input value={form.email} onChange={set("email")} placeholder="name@example.com" type="email" />
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Country they want">
            <Select value={form.country} onChange={set("country")}>
              {COUNTRIES.map((country) => (
                <option key={country}>{country}</option>
              ))}
            </Select>
          </Field>
          <Field label="Study level">
            <Select value={form.study_level} onChange={set("study_level")}>
              {LEVELS.map((level) => (
                <option key={level}>{level}</option>
              ))}
            </Select>
          </Field>
        </FormRow>
        <Field label="Subject / course" hint="optional">
          <Input value={form.field_of_interest} onChange={set("field_of_interest")} placeholder="e.g. Computer Science" />
        </Field>
        <Field label="Notes from the conversation" hint="optional">
          <Textarea value={form.message} onChange={set("message")} placeholder="Budget, timeline, what they asked…" />
        </Field>
      </form>
    </Modal>
  );
}
