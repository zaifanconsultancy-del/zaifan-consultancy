// "This looks like the same person as …" with a Merge button. Shown on a
// person's file and in the lead drawer when someone else has the same phone
// number or email. Admin only (a counselor cannot see other people's files).

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Combine } from "lucide-react";

import { useAdminData } from "../data/AdminDataProvider";
import { fmtDate } from "../lib/format";
import { path } from "../lib/paths";
import { findDuplicates, pickKeeper, STAGE_BY_ID } from "../lib/people";
import { Avatar, Button, Modal } from "./kit";

export default function DuplicateNotice({ person, onMerged, className = "" }) {
  const { people, isCounselor, mergePeople } = useAdminData();
  const [pair, setPair] = useState(null); // [keep, other]
  const [busy, setBusy] = useState(false);

  const others = useMemo(() => (isCounselor ? [] : findDuplicates(people).get(person.id) || []), [isCounselor, people, person.id]);

  if (!others.length) return null;

  const merge = async () => {
    setBusy(true);
    try {
      const [keep, other] = pair;
      const keptId = await mergePeople(keep, other);
      setPair(null);
      onMerged?.(String(keptId), other.id);
    } catch {
      // toast shown by provider
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 ${className}`}>
      <p className="flex items-center gap-2 text-[13px] font-black text-amber-900">
        <Combine size={15} /> Same phone or email as {others.length === 1 ? "another file" : `${others.length} other files`}
      </p>
      <p className="mt-0.5 text-[12.5px] font-semibold leading-5 text-amber-900/75">If it is the same person, join the files so nothing is split in two places.</p>
      <ul className="mt-2 space-y-1.5">
        {others.map((other) => (
          <li key={other.id} className="flex flex-wrap items-center gap-2.5 rounded-xl bg-white/70 px-3 py-2">
            <Avatar name={other.name} size={30} />
            <div className="min-w-0 flex-1">
              <Link to={path(`/people/${other.id}`)} className="block truncate text-[13.5px] font-black text-[#071f50] hover:underline">
                {other.name}
              </Link>
              <p className="truncate text-[12px] font-semibold text-[#071f50]/55">
                {[STAGE_BY_ID[other.stage]?.label, other.phone, other.email, `since ${fmtDate(other.createdAt)}`].filter(Boolean).join(" · ")}
              </p>
            </div>
            <Button size="sm" variant="navy" icon={Combine} onClick={() => setPair(pickKeeper(person, other))}>
              Join files
            </Button>
          </li>
        ))}
      </ul>

      <Modal
        open={Boolean(pair)}
        onClose={() => (busy ? null : setPair(null))}
        title="Join these two files?"
        subtitle="Use this only when both are the same person. It cannot be undone."
        width="max-w-md"
        footer={
          <>
            <Button onClick={() => setPair(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" busy={busy} onClick={merge}>
              Yes, join them
            </Button>
          </>
        }
      >
        {pair ? (
          <div className="space-y-3">
            <div className="flex items-stretch gap-2">
              <FileCard label="This file goes away" person={pair[1]} muted />
              <span className="flex items-center text-[#071f50]/40">
                <ArrowRight size={18} />
              </span>
              <FileCard label="Everything ends up here" person={pair[0]} />
            </div>
            <p className="text-[13px] leading-5 text-[#071f50]/65">
              All messages, bookings, documents, payments, tasks and notes from both files will be together in one file. Nothing is deleted. The file keeps the name <strong className="text-[#071f50]">{pair[0].name}</strong>
            </p>
            <button type="button" className="text-[12.5px] font-extrabold text-[#ff4b12] hover:underline" onClick={() => setPair([pair[1], pair[0]])} disabled={busy}>
              Keep the other one instead
            </button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function FileCard({ label, person, muted = false }) {
  return (
    <div className={`min-w-0 flex-1 rounded-2xl border p-3 ${muted ? "border-[#071f50]/10 bg-[#071f50]/[0.03]" : "border-[#ff4b12]/30 bg-[#fff1e8]"}`}>
      <p className="text-[10.5px] font-black uppercase tracking-[0.12em] text-[#071f50]/50">{label}</p>
      <p className="mt-1 truncate text-[14px] font-black text-[#071f50]">{person.name}</p>
      <p className="truncate text-[12px] font-semibold text-[#071f50]/55">{person.phone || person.email || "no contact"}</p>
      <p className="mt-1 text-[11.5px] font-bold text-[#071f50]/50">
        {STAGE_BY_ID[person.stage]?.label}
        {person.identity?.auth_user_id ? " · has student login" : ""}
      </p>
    </div>
  );
}
