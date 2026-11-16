// Documents: papers Zaifan still needs, everything already uploaded (with the
// result of our check) and one simple upload box.

import { useRef, useState } from "react";
import { Eye, FileText, FileUp, RotateCcw, Upload } from "lucide-react";

import { studentSupabase } from "../../../lib/studentSupabase";
import { cleanNote, fmtDate, timeAgo } from "../../admin/lib/format";
import { Button, Card, CardHeader, Chip, EmptyState, Field, Input, Modal, Notice, PageHeader, Select, useToast } from "../../admin/ui/kit";
import { checkFile, DOCUMENTS_BUCKET, missingRequirements, openOwnFile, sizeLabel, uploadOwnFile } from "../lib";

const COMMON = ["Passport", "CNIC / B-Form", "Photo (passport size)", "Matric certificate", "Intermediate certificate", "Bachelor degree", "Transcript", "English test result (IELTS / other)", "CV", "Motivation letter", "Recommendation letter", "Bank statement"];

const STATUS = {
  verified: { label: "Accepted", color: "#10b981" },
  approved: { label: "Accepted", color: "#10b981" },
  rejected: { label: "Send again", color: "#ef4444" },
};

export default function DocumentsTab({ file, reload }) {
  const toast = useToast();
  const [upload, setUpload] = useState(null); // { name, locked } | null
  const missing = missingRequirements(file);

  const view = async (doc) => {
    try {
      await openOwnFile({ bucket: DOCUMENTS_BUCKET, path: doc.file_path, url: doc.file_url });
    } catch (error) {
      toast.push({ tone: "error", message: error.message });
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Documents"
        title="Your papers"
        subtitle="Upload a clear scan or photo. We check every paper and tell you here if something needs to be sent again."
        actions={
          <Button variant="primary" icon={Upload} onClick={() => setUpload({ name: "", locked: false })}>
            Upload a document
          </Button>
        }
      />

      {missing.length ? (
        <Card className="pb-3">
          <CardHeader icon={FileUp} title="Papers we still need from you" subtitle={`${missing.length} to upload`} />
          <ul className="mt-3 space-y-1.5 px-3">
            {missing.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-[#fff7ed] px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-black">{item.name}</p>
                  {cleanNote(item.notes) ? <p className="mt-0.5 text-[13px] leading-5 text-[#071f50]/60">{cleanNote(item.notes)}</p> : null}
                </div>
                <Button size="sm" variant="navy" icon={Upload} onClick={() => setUpload({ name: item.name, locked: true })}>
                  Upload
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="pb-3">
        <CardHeader icon={FileText} title="What you have sent" subtitle={file.documents.length ? `${file.documents.length} document${file.documents.length === 1 ? "" : "s"}` : undefined} />
        {file.documents.length ? (
          <ul className="mt-3 divide-y divide-[#071f50]/6 px-5">
            {file.documents.map((doc) => {
              const status = STATUS[String(doc.status || "").toLowerCase()] || { label: "Being checked", color: "#f59e0b" };
              const rejected = status.label === "Send again";
              return (
                <li key={doc.id} className="flex flex-wrap items-center gap-3 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14.5px] font-black">{doc.name}</p>
                      <Chip color={status.color}>{status.label}</Chip>
                    </div>
                    <p className="mt-0.5 truncate text-[12.5px] font-semibold text-[#071f50]/50">
                      {[doc.file_name, sizeLabel(doc.size), `sent ${timeAgo(doc.created_at)}`, doc.expiry_date ? `expires ${fmtDate(doc.expiry_date)}` : ""].filter(Boolean).join(" · ")}
                    </p>
                    {rejected ? <p className="mt-1 text-[13px] font-bold leading-5 text-rose-700">Why: {doc.rejection_reason || "Please send a clearer copy."}</p> : null}
                  </div>
                  <div className="flex gap-2">
                    {doc.file_path || doc.file_url ? (
                      <Button size="sm" icon={Eye} onClick={() => view(doc)}>
                        View
                      </Button>
                    ) : null}
                    {rejected ? (
                      <Button size="sm" variant="primary" icon={RotateCcw} onClick={() => setUpload({ name: doc.name, locked: true })}>
                        Send again
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState compact icon={FileText} title="Nothing uploaded yet" text="Start with your passport. It is needed for every country." />
        )}
      </Card>

      {upload ? <UploadModal key={upload.name} preset={upload} file={file} onClose={() => setUpload(null)} onDone={reload} /> : null}
    </div>
  );
}

function UploadModal({ preset, file, onClose, onDone }) {
  const toast = useToast();
  const options = [...new Set([...file.requirements.map((item) => item.name), ...COMMON])];
  const [choice, setChoice] = useState(preset.name || options[0]);
  const [other, setOther] = useState("");
  const [picked, setPicked] = useState(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const input = useRef(null);

  const name = preset.locked ? preset.name : choice === "__other" ? other.trim() : choice;

  const choose = (event) => {
    const next = event.target.files?.[0] || null;
    setPicked(next);
    setProblem(next ? checkFile(next) : "");
  };

  const submit = async () => {
    if (!name) return setProblem("Please say which document this is.");
    const issue = checkFile(picked);
    if (issue) return setProblem(issue);
    setBusy(true);
    try {
      const path = await uploadOwnFile({ bucket: DOCUMENTS_BUCKET, personId: file.person.id, file: picked });
      const { error } = await studentSupabase.rpc("student_add_document", {
        p_name: name,
        p_category: "Student upload",
        p_file_path: path,
        p_file_name: picked.name,
        p_mime: picked.type || "",
        p_size: picked.size,
      });
      if (error) throw new Error(error.message);
      await onDone();
      toast.push(`${name} sent. We will check it and update this page.`);
      onClose();
    } catch (error) {
      setProblem(error.message || "The upload did not work. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      title={preset.locked ? `Upload: ${preset.name}` : "Upload a document"}
      subtitle="PDF, photo (JPG / PNG) or Word file, up to 15 MB. Make sure all four corners are visible and the text is readable."
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" icon={Upload} busy={busy} onClick={submit}>
            Send to Zaifan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {!preset.locked ? (
          <Field label="Which document is this?">
            <Select value={choice} onChange={(event) => setChoice(event.target.value)}>
              {options.map((option) => (
                <option key={option}>{option}</option>
              ))}
              <option value="__other">Something else…</option>
            </Select>
          </Field>
        ) : null}
        {!preset.locked && choice === "__other" ? (
          <Field label="Name of the document">
            <Input value={other} onChange={(event) => setOther(event.target.value)} placeholder="e.g. Experience letter" maxLength={100} />
          </Field>
        ) : null}

        <input ref={input} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,application/pdf,image/*" onChange={choose} className="hidden" />
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[#071f50]/20 bg-[#fff7ed] px-4 py-7 text-center transition hover:border-[#ff4b12]"
        >
          <FileUp size={26} className="text-[#ff4b12]" />
          {picked ? (
            <>
              <span className="max-w-full truncate text-[14px] font-black">{picked.name}</span>
              <span className="text-[12.5px] font-semibold text-[#071f50]/55">{sizeLabel(picked.size)} · tap to choose another file</span>
            </>
          ) : (
            <>
              <span className="text-[14px] font-black">Tap to choose the file</span>
              <span className="text-[12.5px] font-semibold text-[#071f50]/55">From your phone or computer</span>
            </>
          )}
        </button>

        {problem ? <Notice tone="error">{problem}</Notice> : null}
      </div>
    </Modal>
  );
}
