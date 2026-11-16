// Team: who works here, how much each person is carrying, and adding a
// counselor. Counselors get their own login (emailed temporary password,
// changed on first login) and only ever see the students assigned to them.

import { useMemo, useState } from "react";
import { path } from "../lib/paths";
import { Link } from "react-router-dom";
import { KeyRound, Power, ShieldCheck, UserPlus, UsersRound } from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import { useAdminData } from "../data/AdminDataProvider";
import { humanize } from "../lib/format";
import { isDone, LEAD_STAGES, STUDENT_STAGES } from "../lib/people";
import { Avatar, Button, Card, CardHeader, Chip, EmptyState, Field, Input, Modal, Notice, PageHeader, Spinner, useConfirm, useToast } from "../ui/kit";

/** Calls the staff-invite server function. Returns the reply, or null after showing the error. */
async function callTeam(body, toast) {
  const { data, error } = await supabase.functions.invoke("staff-invite", { body });
  let reply = data;
  if (error) {
    try {
      reply = await error.context.json();
    } catch {
      reply = { success: false, message: error.message };
    }
  }
  if (!reply?.success) {
    toast.push({ tone: "error", message: reply?.message || "The team service did not answer. Try again." });
    return null;
  }
  return reply;
}

export default function TeamPage() {
  const { staff, people, loading, admin, reload } = useAdminData();
  const toast = useToast();
  const confirm = useConfirm();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busy, setBusy] = useState("");

  const rows = useMemo(
    () =>
      staff.map((member) => {
        const mine = people.filter((person) => person.assignedTo === member.id);
        return {
          member,
          leads: mine.filter((person) => LEAD_STAGES.includes(person.stage)),
          students: mine.filter((person) => STUDENT_STAGES.includes(person.stage)),
          openTasks: mine.reduce((sum, person) => sum + person.tasks.filter((task) => !isDone(task.status)).length, 0),
        };
      }),
    [people, staff]
  );

  const unassigned = people.filter((person) => !person.assignedTo && person.stage !== "closed");

  // Shows the password on screen only when the email could not be sent.
  const showPasswordIfNeeded = async (reply, who) => {
    if (reply.emailed) {
      toast.push(`Login details emailed to ${reply.email}.`);
      return;
    }
    await confirm({
      title: "The email could not be sent",
      text: `Give ${who} this temporary password yourself. They must change it when they first log in at zaifanconsultancy.com/counselor.`,
      body: <p className="rounded-xl bg-[#fff7ed] px-4 py-3 text-center font-mono text-xl font-black tracking-wider text-[#071f50]">{reply.temporaryPassword}</p>,
      confirmLabel: "I've noted it",
      cancelLabel: "Close",
    });
  };

  const resetPassword = async (member) => {
    const yes = await confirm({
      title: `Send ${member.name} a new password?`,
      text: "Their old password stops working. We email a temporary one, and they choose their own when they log in.",
      confirmLabel: "Send new password",
    });
    if (!yes) return;
    setBusy(`reset-${member.id}`);
    try {
      const reply = await callTeam({ action: "reset", profileId: member.profileId }, toast);
      if (reply) await showPasswordIfNeeded(reply, member.name);
    } finally {
      setBusy("");
    }
  };

  const toggleActive = async (member) => {
    const off = member.active !== false;
    const yes = await confirm({
      title: off ? `Turn off ${member.name}'s access?` : `Turn ${member.name}'s access back on?`,
      text: off ? "They can't log in until you turn it back on. Their students stay assigned to them, so reassign anyone who needs help." : "They can log in again with their existing password.",
      confirmLabel: off ? "Turn off" : "Turn on",
      danger: off,
    });
    if (!yes) return;
    setBusy(`toggle-${member.id}`);
    try {
      const reply = await callTeam({ action: off ? "disable" : "enable", profileId: member.profileId }, toast);
      if (reply) {
        await reload(["counselors"]);
        toast.push(off ? `${member.name} can no longer log in.` : `${member.name} can log in again.`);
      }
    } finally {
      setBusy("");
    }
  };

  if (loading) return <Spinner label="Loading team…" />;

  return (
    <div>
      <PageHeader
        eyebrow="Team"
        title="Who's on the team"
        subtitle="Admins see everything. Counselors only see the people you assign to them — the database enforces it."
        actions={
          <Button variant="primary" icon={UserPlus} onClick={() => setInviteOpen(true)}>
            Add a counselor
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="pb-2">
          <CardHeader icon={UsersRound} title="People" subtitle={`${staff.length} team member${staff.length === 1 ? "" : "s"}`} />
          <ul className="mt-3 divide-y divide-[#071f50]/[0.06] px-2">
            {rows.map(({ member, leads, students, openTasks }) => {
              const canManage = member.kind === "counselor" && member.profileId && member.id !== admin.id;
              return (
                <li key={member.id} className="flex flex-wrap items-center gap-3 rounded-2xl px-3 py-3.5">
                  <Avatar name={member.name} size={44} src={member.avatar} className={member.active === false ? "opacity-40 grayscale" : ""} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-[15px] font-black text-[#071f50]">
                      {member.name}
                      <Chip color={member.kind === "admin" ? "#ff4b12" : "#0ea5e9"} dot={false}>
                        {member.kind === "admin" ? <ShieldCheck size={11} /> : null}
                        {humanize(member.role)}
                      </Chip>
                      {member.active === false ? <Chip color="#94a3b8">Access off</Chip> : null}
                    </p>
                    <p className="truncate text-[12.5px] font-semibold text-[#071f50]/50">{member.email || "—"}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <Figure label="Leads" value={leads.length} />
                    <Figure label="Students" value={students.length} />
                    <Figure label="Open tasks" value={openTasks} />
                  </div>
                  {canManage ? (
                    <div className="flex w-full gap-2 sm:w-auto">
                      <Button size="sm" icon={KeyRound} busy={busy === `reset-${member.id}`} onClick={() => resetPassword(member)} disabled={member.active === false}>
                        New password
                      </Button>
                      <Button size="sm" variant={member.active === false ? "success" : "danger"} icon={Power} busy={busy === `toggle-${member.id}`} onClick={() => toggleActive(member)}>
                        {member.active === false ? "Turn on" : "Turn off"}
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
            {!rows.length ? <EmptyState compact icon={UsersRound} title="No team members found" /> : null}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-[15px] font-black text-[#071f50]">Nobody assigned yet</h2>
            <p className="mt-1 text-[13px] text-[#071f50]/55">
              {unassigned.length} active {unassigned.length === 1 ? "person has" : "people have"} no counselor. Open their file and pick one under “Counselor”.
            </p>
            <ul className="mt-3 space-y-1">
              {unassigned.slice(0, 8).map((person) => (
                <li key={person.id}>
                  <Link to={path(`/people/${person.id}`)} className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-[13.5px] font-bold text-[#071f50] hover:bg-[#071f50]/[0.03]">
                    <Avatar name={person.name} size={26} />
                    <span className="truncate">{person.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Notice tone="info">
            <strong>How a counselor gets in:</strong> press “Add a counselor”, type their name and email. They get an email with a temporary password, log in at
            zaifanconsultancy.com/counselor and choose their own password. You never type or see their password.
          </Notice>
        </div>
      </div>

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onDone={async (reply, name) => {
          setInviteOpen(false);
          await reload(["counselors"]);
          await showPasswordIfNeeded(reply, name);
        }}
      />
    </div>
  );
}

function InviteModal({ open, onClose, onDone }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return toast.push({ tone: "error", message: "Please type their name." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return toast.push({ tone: "error", message: "Please type a valid email address." });
    setBusy(true);
    try {
      const reply = await callTeam({ action: "invite", fullName: name.trim(), email: email.trim().toLowerCase() }, toast);
      if (reply) {
        setName("");
        setEmail("");
        await onDone(reply, name.trim());
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a counselor"
      subtitle="They get an email with a temporary password and choose their own on first login."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon={UserPlus} busy={busy} onClick={submit}>
            Add and email
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Full name" required>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Imran Ali" />
        </Field>
        <Field label="Email" required hint="They log in with this">
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="imran@zaifanconsultancy.com" />
        </Field>
        <p className="text-[12.5px] leading-5 text-[#071f50]/55">
          Once added, open any lead or student and choose them under “Counselor”. They will only see the people you give them.
        </p>
      </div>
    </Modal>
  );
}

function Figure({ label, value }) {
  return (
    <div>
      <p className="text-[1.25rem] font-black leading-none text-[#071f50]">{value}</p>
      <p className="mt-1 text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-[#071f50]/45">{label}</p>
    </div>
  );
}
