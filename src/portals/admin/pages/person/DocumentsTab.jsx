// Documents: every file on this student, grouped. Review, open, download, upload.

import { useMemo, useState } from "react";
import { Download, Eye, FileText, Plus, Trash2, Upload } from "lucide-react";

import { downloadPrivateFile, openPrivateFile } from "../../../../lib/storageFiles";
import { useAdminData } from "../../data/AdminDataProvider";
import { fmtDate, timeAgo } from "../../lib/format";
import { Button, Card, CardHeader, EmptyState, Field, FormRow, Input, Modal, Notice, Select, Textarea, useConfirm, useForm, useToast } from "../../ui/kit";
import { StatusChip } from "./shared";
import ChecklistCard from "./ChecklistCard";

const DOCUMENT_CATEGORIES = ["Identity & Civil", "Education", "Application Requirements", "Financial", "Visa file", "Other"];

const COMMON_DOCUMENTS = {
  "Identity & Civil": ["Passport", "CNIC / National ID", "Passport photos", "Birth certificate", "Family registration (FRC)", "Police character certificate"],
  Education: ["Matric certificate", "Intermediate certificate", "Bachelor degree", "Bachelor transcript", "Master degree", "Master transcript"],
  "Application Requirements": ["CV", "Motivation letter", "Recommendation letter", "English test (IELTS / TOEFL)", "Portfolio"],
  Financial: ["Bank statement", "Sponsor letter", "Affidavit of support", "Proof of income"],
  "Visa file": ["Admission letter", "Declaration of Value (DOV)", "Accommodation proof", "Health insurance", "Flight reservation", "Visa form"],
  Other: ["Other"],
};

const sizeLabel = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export default function DocumentsTab({ person }) {
  const { update, logEvent, uploadDocument, admin } = useAdminData();
  const toast = useToast();
  const confirm = useConfirm();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [busyId, setBusyId] = useState("");

  const grouped = useMemo(() => {
    const groups = new Map();
    for (const doc of person.documents) {
      const key = doc.document_category || "Other";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(doc);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => DOCUMENT_CATEGORIES.indexOf(a) - DOCUMENT_CATEGORIES.indexOf(b));
  }, [person.documents]);

  const act = async (doc, fn) => {
    setBusyId(doc.id);
    try {
      await fn();
    } catch (error) {
      toast.push({ tone: "error", message: error.message });
    } finally {
      setBusyId("");
    }
  };

  const verify = (doc) =>
    act(doc, async () => {
      await update("documents", doc.id, { status: "verified", verified_by: admin.id, verified_at: new Date().toISOString(), rejected_by: null, rejected_at: null, rejection_reason: null });
      await logEvent(person, { actionType: "document_verified", title: `${doc.document_name} verified` });
      toast.push(`${doc.document_name} marked as verified.`);
    });

  const reject = async (doc) => {
    const answer = await confirm({
      title: `Send “${doc.document_name}” back?`,
      text: "Tell the student what is wrong. They see this in their portal and can upload again.",
      noteLabel: "What should they fix",
      noteValue: doc.rejection_reason || "",
      quickNotes: ["The scan is blurry, please upload a clearer copy.", "Pages are missing.", "This is the wrong document.", "It has expired, please send a valid one.", "It needs attestation / translation first."],
      confirmLabel: "Send back",
      danger: true,
    });
    if (!answer) return;
    const reason = answer.note;
    await act(doc, async () => {
      await update("documents", doc.id, { status: "rejected", rejected_by: admin.id, rejected_at: new Date().toISOString(), rejection_reason: reason.trim() || "Please upload a clearer copy." });
      await logEvent(person, { actionType: "document_rejected", title: `${doc.document_name} needs re-upload`, description: reason });
      toast.push(`${doc.document_name} sent back.`);
    });
  };

  const trash = async (doc) => {
    const yes = await confirm({ title: `Delete ${doc.document_name}?`, text: "The file is hidden from the student and the team.", confirmLabel: "Delete", danger: true });
    if (!yes) return;
    await act(doc, async () => {
      await update("documents", doc.id, { is_deleted: true, deleted_at: new Date().toISOString() });
      await logEvent(person, { actionType: "document_deleted", title: `${doc.document_name} deleted` });
    });
  };

  const fileTarget = (doc) => (doc.file_path ? { bucket: "student-documents", path: doc.file_path } : doc.file_url);

  return (
    <div className="space-y-4">
      <ChecklistCard person={person} />
      <Card className="pb-4">
        <CardHeader
          icon={FileText}
          title="Documents"
          subtitle={`${person.documents.length} file${person.documents.length === 1 ? "" : "s"} · ${person.counts.pendingDocs} waiting for review`}
          action={
            <Button variant="primary" size="sm" icon={Upload} onClick={() => setUploadOpen(true)} disabled={!person.primary}>
              Upload a document
            </Button>
          }
        />

        {person.counts.pendingDocs ? (
          <div className="mt-3 px-5">
            <Notice tone="warning">
              {person.counts.pendingDocs} document{person.counts.pendingDocs === 1 ? " is" : "s are"} waiting for you. Open each one, then press <strong>Looks good</strong> or <strong>Send back</strong>.
            </Notice>
          </div>
        ) : null}

        <div className="mt-3 space-y-5 px-5">
          {grouped.map(([category, docs]) => (
            <section key={category}>
              <h3 className="mb-2 text-[11.5px] font-black uppercase tracking-[0.16em] text-[#071f50]/45">{category}</h3>
              <ul className="divide-y divide-[#071f50]/8 rounded-2xl border border-[#071f50]/8">
                {docs.map((doc) => {
                  const pending = !["verified", "rejected"].includes(String(doc.status || "").toLowerCase());
                  return (
                    <li key={doc.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#071f50]/[0.05] text-[#071f50]/60">
                        <FileText size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 text-[14px] font-black text-[#071f50]">
                          {doc.document_name}
                          <StatusChip status={doc.status} label={pending ? "To review" : undefined} />
                        </p>
                        <p className="truncate text-[12px] font-semibold text-[#071f50]/50">
                          {[doc.original_file_name, sizeLabel(doc.file_size_bytes), `uploaded ${timeAgo(doc.created_at)}`, doc.expiry_date ? `expires ${fmtDate(doc.expiry_date)}` : ""].filter(Boolean).join(" · ")}
                        </p>
                        {doc.status === "rejected" && doc.rejection_reason ? <p className="mt-0.5 text-[12px] font-bold text-rose-700">Sent back: {doc.rejection_reason}</p> : null}
                        {doc.notes ? <p className="mt-0.5 text-[12px] text-[#071f50]/60">{doc.notes}</p> : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {doc.file_url || doc.file_path ? (
                          <>
                            <Button size="sm" icon={Eye} onClick={() => act(doc, () => openPrivateFile(fileTarget(doc)))} busy={busyId === doc.id}>
                              Open
                            </Button>
                            <Button size="icon" aria-label="Download" onClick={() => act(doc, () => downloadPrivateFile(fileTarget(doc), doc.original_file_name || doc.document_name))}>
                              <Download size={15} />
                            </Button>
                          </>
                        ) : null}
                        {doc.status !== "verified" ? (
                          <Button size="sm" variant="success" onClick={() => verify(doc)} busy={busyId === doc.id}>
                            Looks good
                          </Button>
                        ) : null}
                        {doc.status !== "rejected" ? (
                          <Button size="sm" variant="danger" onClick={() => reject(doc)} busy={busyId === doc.id}>
                            Send back
                          </Button>
                        ) : null}
                        <Button size="icon" aria-label="Delete" onClick={() => trash(doc)}>
                          <Trash2 size={15} className="text-[#071f50]/50" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        {!person.documents.length ? (
          <EmptyState compact icon={FileText} title="No documents yet" text="Upload scans here, or the student uploads them from their portal." />
        ) : null}
      </Card>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={async (form) => {
          await uploadDocument(person, { file: form.file, name: form.name, category: form.category, status: form.verified ? "verified" : "pending_review", notes: form.notes });
          await logEvent(person, { actionType: "document_uploaded", title: `${form.name} uploaded by ${admin.name}` });
          toast.push(`${form.name} uploaded.`);
          setUploadOpen(false);
        }}
      />
    </div>
  );
}

function UploadModal({ open, onClose, onUpload }) {
  const [form, set, , setForm] = useForm({ category: "Identity & Civil", name: "Passport", custom: "", file: null, notes: "", verified: true });
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const names = COMMON_DOCUMENTS[form.category] || ["Other"];
  const finalName = form.name === "Other" ? form.custom.trim() : form.name;

  const submit = async () => {
    if (!form.file) return toast.push({ tone: "error", message: "Choose a file first." });
    if (!finalName) return toast.push({ tone: "error", message: "Give the document a name." });
    if (form.file.size > 25 * 1024 * 1024) return toast.push({ tone: "error", message: "Files must be under 25 MB." });
    setBusy(true);
    try {
      await onUpload({ ...form, name: finalName });
      setForm({ category: "Identity & Civil", name: "Passport", custom: "", file: null, notes: "", verified: true });
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
      title="Upload a document"
      subtitle="PDF, JPG or PNG. Files are private: only the team and this student can open them."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" busy={busy} icon={Plus} onClick={submit}>
            Upload
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <FormRow>
          <Field label="Category">
            <Select
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value, name: COMMON_DOCUMENTS[event.target.value][0] }))}
            >
              {DOCUMENT_CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </Select>
          </Field>
          <Field label="Document">
            <Select value={form.name} onChange={set("name")}>
              {names.map((name) => (
                <option key={name}>{name}</option>
              ))}
              {!names.includes("Other") ? <option>Other</option> : null}
            </Select>
          </Field>
        </FormRow>
        {form.name === "Other" ? (
          <Field label="Document name">
            <Input value={form.custom} onChange={set("custom")} placeholder="e.g. Scholarship award letter" />
          </Field>
        ) : null}
        <Field label="File">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
            onChange={(event) => setForm((current) => ({ ...current, file: event.target.files?.[0] || null }))}
            className="block w-full text-[13px] font-semibold text-[#071f50] file:mr-3 file:rounded-xl file:border-0 file:bg-[#071f50] file:px-4 file:py-2.5 file:text-[13px] file:font-black file:text-white"
          />
        </Field>
        <Field label="Note" hint="optional">
          <Textarea value={form.notes} onChange={set("notes")} rows={2} placeholder="e.g. Attested copy received in office" />
        </Field>
        <label className="flex items-center gap-2 text-[13px] font-bold text-[#071f50]">
          <input type="checkbox" checked={form.verified} onChange={set("verified")} className="h-4 w-4 accent-[#ff4b12]" />
          I've checked this file, mark it as verified
        </label>
      </div>
    </Modal>
  );
}
