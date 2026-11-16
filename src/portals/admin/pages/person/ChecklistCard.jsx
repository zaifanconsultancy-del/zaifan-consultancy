// The student's paper checklist (student_document_requirements).
// Start it from the country lists Zaifan already uses on the website
// (Italy DOV / visa / arrival, Germany apply / visa…), then tick papers off.
// The same list shows in the student's portal as "Upload your …" to-dos.

import { useMemo, useState } from "react";
import { Ban, Check, ClipboardCheck, ListPlus, Plus, RotateCcw, Trash2 } from "lucide-react";

import { DOCUMENT_CHECKLISTS, DOCUMENT_GROUPS, LEVELS } from "../../../../data/countries/documentChecklists";
import { useAdminData } from "../../data/AdminDataProvider";
import { classNames, cleanNote } from "../../lib/format";
import { Button, Card, CardHeader, Chip, Field, Input, Modal, Select, useConfirm, useToast } from "../../ui/kit";

const COUNTRY_NAMES = { italy: "Italy", germany: "Germany", france: "France", belgium: "Belgium", romania: "Romania", lithuania: "Lithuania", turkey: "Turkey", china: "China", vietnam: "Vietnam" };
const DONE = ["verified", "approved", "received"];
const SKIPPED = ["waived", "not_required"];
const norm = (text) => String(text || "").trim().toLowerCase();

export default function ChecklistCard({ person }) {
  const { update, remove, insert, logEvent } = useAdminData();
  const confirm = useConfirm();
  const toast = useToast();
  const [startOpen, setStartOpen] = useState(false);
  const [custom, setCustom] = useState("");

  const items = useMemo(() => [...person.requirements].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)), [person.requirements]);
  const uploads = useMemo(() => new Map(person.documents.map((doc) => [norm(doc.document_name || doc.document_type), doc])), [person.documents]);

  const stateOf = (item) => {
    const status = norm(item.status);
    if (SKIPPED.includes(status)) return "skipped";
    if (DONE.includes(status)) return "done";
    const upload = uploads.get(norm(item.document_name));
    if (upload && ["verified", "approved"].includes(norm(upload.status))) return "done";
    if (upload) return "uploaded";
    return "missing";
  };

  const counted = items.filter((item) => stateOf(item) !== "skipped");
  const done = counted.filter((item) => stateOf(item) === "done").length;
  const groups = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      const key = item.group_name || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return Array.from(map.entries());
  }, [items]);

  const setStatus = async (item, status, label) => {
    await update("requirements", item.id, { status, updated_at: new Date().toISOString() });
    if (label) await logEvent(person, { actionType: "checklist", title: `${item.document_name}: ${label}` });
  };

  const addCustom = async () => {
    if (!custom.trim()) return;
    await insert("requirements", {
      student_id: person.primary.student_id,
      student_type: person.primary.student_type,
      document_name: custom.trim(),
      group_name: "Extra papers",
      required: true,
      status: "active",
    });
    setCustom("");
    toast.push("Added to the checklist.");
  };

  const clearAll = async () => {
    const yes = await confirm({ title: "Remove the whole checklist?", text: "Uploaded files stay. Only the list of papers is removed (from the student's portal too).", confirmLabel: "Remove list", danger: true });
    if (!yes) return;
    for (const item of items) await remove("requirements", item.id);
  };

  return (
    <Card className="pb-4">
      <CardHeader
        icon={ClipboardCheck}
        title="Paper checklist"
        subtitle={items.length ? `${done} of ${counted.length} papers ready. The student sees missing ones as to-dos in their portal.` : "Give the student the exact list of papers for their country. It appears in their portal as to-dos."}
        action={
          items.length ? (
            <>
              <Button size="sm" icon={ListPlus} onClick={() => setStartOpen(true)}>
                Add a list
              </Button>
              <Button size="sm" variant="danger" icon={Trash2} onClick={clearAll}>
                Clear
              </Button>
            </>
          ) : (
            <Button size="sm" variant="primary" icon={ListPlus} onClick={() => setStartOpen(true)} disabled={!person.primary}>
              Start a checklist
            </Button>
          )
        }
      />

      {items.length ? (
        <div className="mt-3 px-5">
          <span className="block h-2 overflow-hidden rounded-full bg-[#071f50]/[0.07]">
            <span className="block h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${counted.length ? (done / counted.length) * 100 : 0}%` }} />
          </span>

          <div className="mt-4 space-y-4">
            {groups.map(([group, list]) => (
              <section key={group}>
                <p className="mb-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#071f50]/45">{group}</p>
                <ul className="divide-y divide-[#071f50]/[0.06] rounded-2xl border border-[#071f50]/8">
                  {list.map((item) => {
                    const state = stateOf(item);
                    return (
                      <li key={item.id} className="group flex items-start gap-3 px-3.5 py-2.5">
                        <button
                          type="button"
                          onClick={() => (state === "done" ? setStatus(item, "active", "marked not received") : setStatus(item, "verified", "received"))}
                          className={classNames(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition",
                            state === "done" ? "border-emerald-500 bg-emerald-500 text-white" : state === "skipped" ? "border-[#071f50]/15 bg-[#071f50]/5" : "border-[#071f50]/25 hover:border-emerald-500"
                          )}
                          aria-label={state === "done" ? `Mark ${item.document_name} not received` : `Mark ${item.document_name} received`}
                          disabled={state === "skipped"}
                        >
                          {state === "done" ? <Check size={13} strokeWidth={3} /> : null}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className={classNames("text-[13.5px] font-bold", state === "skipped" ? "text-[#071f50]/35 line-through" : "text-[#071f50]")}>{item.document_name}</p>
                          {cleanNote(item.notes) ? <p className="text-[12px] leading-5 text-[#071f50]/50">{cleanNote(item.notes)}</p> : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {state === "uploaded" ? <Chip color="#8b5cf6" dot={false}>Uploaded · check it</Chip> : null}
                          {state === "missing" ? <Chip color="#f59e0b" dot={false}>Missing</Chip> : null}
                          {state === "skipped" ? (
                            <button type="button" onClick={() => setStatus(item, "active", "needed again")} className="rounded-lg p-1 text-[#071f50]/40 hover:bg-[#071f50]/5 hover:text-[#071f50]" title="Needed after all">
                              <RotateCcw size={14} />
                            </button>
                          ) : (
                            <button type="button" onClick={() => setStatus(item, "not_required", "not needed")} className="rounded-lg p-1 text-[#071f50]/25 opacity-0 transition hover:bg-[#071f50]/5 hover:text-[#071f50] group-hover:opacity-100" title="Not needed for this student">
                              <Ban size={14} />
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <Input value={custom} onChange={(event) => setCustom(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addCustom()} placeholder="Add another paper, e.g. Experience letter" />
            <Button icon={Plus} onClick={addCustom} disabled={!custom.trim()}>
              Add
            </Button>
          </div>
          <p className="mt-2 text-[11.5px] font-semibold text-[#071f50]/40">Tick = received and checked. ⊘ = not needed for this student. A paper turns green on its own when its upload is marked checked.</p>
        </div>
      ) : null}

      {startOpen ? <StartChecklistModal person={person} existing={items} onClose={() => setStartOpen(false)} /> : null}
    </Card>
  );
}

function StartChecklistModal({ person, existing, onClose }) {
  const { insertMany, logEvent, admin } = useAdminData();
  const toast = useToast();
  const guess = Object.keys(COUNTRY_NAMES).find((slug) => norm(person.country).includes(slug)) || "italy";
  const [country, setCountry] = useState(guess);
  const [stageId, setStageId] = useState(DOCUMENT_CHECKLISTS[guess][0].id);
  const [level, setLevel] = useState("masters");
  const [busy, setBusy] = useState(false);

  const stages = DOCUMENT_CHECKLISTS[country];
  const stage = stages.find((item) => item.id === stageId) || stages[0];
  const have = new Set(existing.map((item) => norm(item.document_name)));
  const papers = stage.items.filter((item) => !item.level || item.level === level);
  const fresh = papers.filter((item) => !have.has(norm(item.title)));

  const groupLabel = (item) => `${stage.label} · ${stage.groups?.[item.group] || DOCUMENT_GROUPS[item.group] || "Papers"}`;

  const save = async () => {
    if (!fresh.length) return onClose();
    setBusy(true);
    try {
      await insertMany(
        "requirements",
        fresh.map((item) => ({
          student_id: person.primary.student_id,
          student_type: person.primary.student_type,
          document_name: item.title,
          group_name: groupLabel(item),
          required: true,
          status: "active",
          notes: [item.note, item.how, item.we ? "Zaifan prepares this with you." : ""].filter(Boolean).join(" · ") || null,
          created_by: admin.kind === "admin" ? admin.id : null,
        }))
      );
      await logEvent(person, { actionType: "checklist", title: `Checklist added: ${COUNTRY_NAMES[country]} · ${stage.label} (${fresh.length} papers)` });
      toast.push(`${fresh.length} papers added. The student sees them in their portal.`);
      onClose();
    } catch {
      // toast shown by provider
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      width="max-w-2xl"
      title="Add a paper checklist"
      subtitle="Pick the country and step. These are the same lists as on the website (Italy uses Zaifan's office DOV and visa lists)."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" busy={busy} onClick={save} disabled={!fresh.length}>
            {fresh.length ? `Add ${fresh.length} papers` : "All already on the list"}
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Country">
          <Select
            value={country}
            onChange={(event) => {
              setCountry(event.target.value);
              setStageId(DOCUMENT_CHECKLISTS[event.target.value][0].id);
            }}
          >
            {Object.keys(DOCUMENT_CHECKLISTS).map((slug) => (
              <option key={slug} value={slug}>
                {COUNTRY_NAMES[slug] || slug}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Step">
          <Select value={stage.id} onChange={(event) => setStageId(event.target.value)}>
            {stages.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Level">
          <Select value={level} onChange={(event) => setLevel(event.target.value)}>
            {LEVELS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {stage.summary ? <p className="mt-3 text-[13px] font-semibold text-[#071f50]/60">{stage.summary}</p> : null}
      <ul className="mt-3 max-h-[42vh] space-y-1 overflow-y-auto rounded-2xl border border-[#071f50]/8 p-2">
        {papers.map((item) => {
          const already = have.has(norm(item.title));
          return (
            <li key={item.title} className={classNames("rounded-xl px-3 py-2", already ? "opacity-45" : "")}>
              <p className="text-[13.5px] font-bold text-[#071f50]">
                {item.title}
                {already ? <span className="ml-2 text-[11px] font-black uppercase text-[#071f50]/50">already on list</span> : null}
                {item.we ? <span className="ml-2 rounded-full bg-[#ff4b12]/10 px-2 py-0.5 text-[10.5px] font-black text-[#ff4b12]">we prepare</span> : null}
              </p>
              {item.note || item.how ? <p className="text-[12px] leading-5 text-[#071f50]/50">{[item.note, item.how].filter(Boolean).join(" · ")}</p> : null}
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
