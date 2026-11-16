// One person's file. The same page serves leads and students: header with the
// stage runway, then tabs for every part of their journey.

import { useEffect, useMemo, useState } from "react";
import { path } from "../lib/paths";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckSquare,
  FileText,
  LayoutPanelTop,
  MessagesSquare,
  Plane,
  Send,
  Stamp,
  Wallet,
} from "lucide-react";

import { useAdminData, usePerson } from "../data/AdminDataProvider";
import { isDone, LEAD_STAGES, STAGE_BY_ID } from "../lib/people";
import { Button, Card, EmptyState, Field, FormRow, Input, Modal, Spinner, Tabs, useConfirm, useForm, useToast } from "../ui/kit";
import useCloseFile from "../ui/useCloseFile";
import DuplicateNotice from "../ui/DuplicateNotice";
import OverviewTab from "./person/OverviewTab";
import ApplicationsTab from "./person/ApplicationsTab";
import DocumentsTab from "./person/DocumentsTab";
import VisaTab from "./person/VisaTab";
import PaymentsTab from "./person/PaymentsTab";
import MessagesTab from "./person/MessagesTab";
import TasksTab from "./person/TasksTab";
import PassHeader from "./person/PassHeader";

export default function PersonPage() {
  const { personId } = useParams();
  const person = usePerson(personId);
  const { loading, staff, setStage, assignPerson, updatePerson, isCounselor } = useAdminData();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "overview";
  const confirm = useConfirm();
  const closeFile = useCloseFile();
  const [editOpen, setEditOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [personId]);

  const tabs = useMemo(() => {
    if (!person) return [];
    const openTasks = person.tasks.filter((task) => !isDone(task.status)).length + person.reminders.filter((r) => !isDone(r.status)).length;
    return [
      { id: "overview", label: "Overview", icon: LayoutPanelTop },
      { id: "applications", label: "Applications", icon: Send, count: person.applications.length },
      { id: "documents", label: "Documents", icon: FileText, count: person.documents.length, alert: person.counts.pendingDocs > 0 },
      { id: "visa", label: "Visa", icon: Stamp, count: person.visas.length },
      { id: "payments", label: "Payments", icon: Wallet, count: person.invoices.length, alert: person.counts.receiptsToReview > 0 },
      { id: "messages", label: "Messages", icon: MessagesSquare, count: person.communications.length + person.supportRequests.length, alert: person.counts.openSupport > 0 },
      { id: "tasks", label: "Tasks", icon: CheckSquare, count: openTasks, alert: person.counts.overdueTasks > 0 },
    ];
  }, [person]);

  if (loading && !person) return <Spinner label="Opening file…" />;

  if (!person) {
    return (
      <Card>
        <EmptyState
          icon={Plane}
          title="This person is not here"
          text="They may have been deleted, or the link is old."
          action={
            <Link to={path("/leads")} className="text-[13px] font-extrabold text-[#ff4b12] hover:underline">
              Back to leads →
            </Link>
          }
        />
      </Card>
    );
  }

  const backTo = LEAD_STAGES.includes(person.stage) ? { to: path("/leads"), label: "Leads" } : { to: path("/students"), label: "Students" };

  const changeStage = async (stageId) => {
    // (closing asks for a reason instead of a plain yes/no)
    if (stageId === person.stage) return;
    if (stageId === "closed") {
      await closeFile(person);
      return;
    }
    const meta = STAGE_BY_ID[stageId];
    const yes = await confirm({
      title: `Move ${person.name} to “${meta.label}”?`,
      text: meta.hint,
      confirmLabel: `Move to ${meta.short}`,
    });
    if (yes) await setStage(person, stageId);
  };

  return (
    <div className="space-y-5">
      <Link to={backTo.to} className="inline-flex items-center gap-1.5 text-[13px] font-extrabold text-[#071f50]/60 hover:text-[#071f50]">
        <ArrowLeft size={15} /> {backTo.label}
      </Link>

      <PassHeader
        person={person}
        staff={staff}
        isCounselor={isCounselor}
        onEdit={() => setEditOpen(true)}
        onStage={changeStage}
        onAssign={(id) => assignPerson(person, id)}
        onPriority={(priority) => updatePerson(person, { priority })}
      />

      <DuplicateNotice
        person={person}
        onMerged={(keptId) => {
          if (keptId !== person.id) navigate(path(`/people/${keptId}`), { replace: true });
        }}
      />

      <Tabs tabs={tabs} value={tab} onChange={(id) => setParams(id === "overview" ? {} : { tab: id })} />

      {tab === "overview" ? <OverviewTab person={person} onChangeTab={(id) => setParams({ tab: id })} /> : null}
      {tab === "applications" ? <ApplicationsTab person={person} /> : null}
      {tab === "documents" ? <DocumentsTab person={person} /> : null}
      {tab === "visa" ? <VisaTab person={person} /> : null}
      {tab === "payments" ? <PaymentsTab person={person} /> : null}
      {tab === "messages" ? <MessagesTab person={person} /> : null}
      {tab === "tasks" ? <TasksTab person={person} /> : null}

      <EditPersonModal key={person.id} person={person} open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}

function EditPersonModal({ person, open, onClose }) {
  const { updatePerson, update } = useAdminData();
  const toast = useToast();
  const [form, set] = useForm({ full_name: person.name, primary_email: person.email, primary_phone: person.phone, country: person.country });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!form.full_name.trim()) return;
    setBusy(true);
    try {
      await updatePerson(person, {
        full_name: form.full_name.trim(),
        primary_email: form.primary_email.trim().toLowerCase() || null,
        primary_phone: form.primary_phone.trim() || null,
        country: form.country.trim() || null,
        normalized_name: form.full_name.trim().toLowerCase(),
        normalized_email: form.primary_email.trim().toLowerCase() || null,
        normalized_phone: form.primary_phone.replace(/\D/g, "") || null,
      });
      // Keep the newest source row in step so older screens show the same name.
      const newest = person.sources[0];
      if (newest) {
        await update(newest.type === "appointment" ? "appointments" : "inquiries", newest.id, {
          full_name: form.full_name.trim(),
          email: form.primary_email.trim().toLowerCase() || null,
          phone: form.primary_phone.trim() || null,
        });
      }
      toast.push("Details updated.");
      onClose();
    } catch {
      // toast shown
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit details"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" busy={busy} onClick={save}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Full name" required>
          <Input value={form.full_name} onChange={set("full_name")} />
        </Field>
        <FormRow>
          <Field label="Phone / WhatsApp">
            <Input value={form.primary_phone} onChange={set("primary_phone")} />
          </Field>
          <Field label="Email">
            <Input value={form.primary_email} onChange={set("primary_email")} type="email" />
          </Field>
        </FormRow>
        <Field label="Country they want">
          <Input value={form.country} onChange={set("country")} placeholder="Italy" />
        </Field>
      </div>
    </Modal>
  );
}
