import { lazy, Suspense, useMemo, useState } from "react";
import {
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Filter,
  Link2Off,
  LoaderCircle,
  Link2,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  buildCanonicalStudents,
  getCanonicalStudentStats,
  getRecordLabel,
  getRecordStatus,
  getRecordType,
  normalizeIdentityText,
} from "../workspaces/students/studentIdentity";

import {
  inspectReconciliation,
  linkStudentRecords,
  separateStudentRecord,
} from "../workspaces/students/studentIdentityReconciliation";

const StudentDetailModal = lazy(() => import("../workspaces/students/StudentDetailModal"));

const CONFIDENCE = {
  verified: {
    label: "Verified identity",
    className: "border-emerald-300 bg-emerald-50 text-emerald-800",
    icon: BadgeCheck,
  },
  "portal-linked": {
    label: "Portal linked",
    className: "border-sky-300 bg-sky-50 text-sky-800",
    icon: Link2,
  },
  review: {
    label: "Review match",
    className: "border-amber-300 bg-amber-50 text-amber-800",
    icon: CircleAlert,
  },
  unlinked: {
    label: "Unlinked record",
    className: "border-slate-300 bg-slate-50 text-slate-700",
    icon: CircleAlert,
  },
};

function StudentDirectoryPage({
  inquiries = [],
  appointments = [],
  studentPortalAccounts = [],
  adminProfile = null,
  refreshAdminData = null,
  permissions = {},

  updateInquiryPriority = null,
  updateAppointmentPriority = null,
  updateAppointmentStatus = null,
  updateAppointmentStage = null,
  toggleInquiryStatus = null,
  deleteInquiry = null,
  deleteAppointment = null,
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [expandedKey, setExpandedKey] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reconciliationTarget, setReconciliationTarget] = useState(null);
  const [separateTarget, setSeparateTarget] = useState(null);
  const [confirmationText, setConfirmationText] = useState("");
  const [reconciliationBusy, setReconciliationBusy] = useState(false);
  const [reconciliationNotice, setReconciliationNotice] = useState({
    type: "",
    message: "",
  });

  const canonicalStudents = useMemo(
    () =>
      buildCanonicalStudents({
        inquiries,
        appointments,
        portalAccounts: studentPortalAccounts,
      }),
    [appointments, inquiries, studentPortalAccounts]
  );

  const stats = useMemo(
    () => getCanonicalStudentStats(canonicalStudents),
    [canonicalStudents]
  );

  const visibleStudents = useMemo(() => {
    const query = normalizeIdentityText(search);

    return canonicalStudents.filter((student) => {
      if (filter === "review" && !student.requiresReview) return false;
      if (filter === "portal" && !student.portalConnected) return false;
      if (filter === "multiple" && student.recordCount < 2) return false;

      if (!query) return true;

      return normalizeIdentityText(
        [
          student.name,
          student.email,
          student.phone,
          student.personId,
          ...student.records.map((record) => [
            record?.id,
            record?.full_name,
            record?.name,
            record?.email,
            record?.phone,
            record?.status,
            record?.stage,
          ]),
        ]
          .flat(2)
          .filter(Boolean)
          .join(" ")
      ).includes(query);
    });
  }, [canonicalStudents, filter, search]);

  const openStudent = (canonicalStudent, record = null) => {
    const source = record || canonicalStudent.primaryRecord;
    if (!source) return;

    setSelectedStudent({
      ...source,
      person_id: canonicalStudent.personId || source.person_id || null,
      __leadType: getRecordType(source),
      __canonicalStudentKey: canonicalStudent.key,
      __canonicalStudentName: canonicalStudent.name,
      __canonicalConfidence: canonicalStudent.confidence,
    });
  };

  const closeReconciliation = () => {
    if (reconciliationBusy) return;
    setReconciliationTarget(null);
    setSeparateTarget(null);
    setConfirmationText("");
  };

  const refreshAfterReconciliation = async () => {
    if (typeof refreshAdminData === "function") {
      await refreshAdminData();
    }
  };

  const confirmLinkRecords = async () => {
    if (!reconciliationTarget || confirmationText.trim().toUpperCase() !== "LINK") {
      return;
    }

    setReconciliationBusy(true);
    setReconciliationNotice({ type: "", message: "" });

    try {
      const inspection = inspectReconciliation(reconciliationTarget.records);

      if (inspection.hasConflict) {
        throw new Error(
          "These records already contain different permanent Person IDs. They cannot be combined from this dialog."
        );
      }

      const result = await linkStudentRecords({
        records: reconciliationTarget.records,
        targetPersonId: reconciliationTarget.personId,
      });

      await refreshAfterReconciliation();

      setReconciliationNotice({
        type: "success",
        message: `${result.linkedCount} source records now share one permanent Person ID.`,
      });

      setReconciliationTarget(null);
      setConfirmationText("");
    } catch (error) {
      setReconciliationNotice({
        type: "error",
        message: error?.message || "Could not reconcile these student records.",
      });
    } finally {
      setReconciliationBusy(false);
    }
  };

  const confirmSeparateRecord = async () => {
    if (!separateTarget || confirmationText.trim().toUpperCase() !== "SEPARATE") {
      return;
    }

    setReconciliationBusy(true);
    setReconciliationNotice({ type: "", message: "" });

    try {
      await separateStudentRecord({ record: separateTarget.record });
      await refreshAfterReconciliation();

      setReconciliationNotice({
        type: "success",
        message: `${getRecordLabel(
          separateTarget.record
        )} now has its own permanent Person ID.`,
      });

      setSeparateTarget(null);
      setConfirmationText("");
    } catch (error) {
      setReconciliationNotice({
        type: "error",
        message: error?.message || "Could not separate this source record.",
      });
    } finally {
      setReconciliationBusy(false);
    }
  };

  return (
    <>
      <section className="space-y-5">
        <div className="overflow-hidden rounded-[1.9rem] border-[3px] border-[#FF5A0A] bg-[#FFF8EF] shadow-[0_18px_48px_rgba(16,35,63,0.10)]">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_330px]">
            <div className="bg-[#123865] px-5 py-6 text-white sm:px-6 lg:px-7 lg:py-7">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] text-white">
                      <UsersRound size={13} />
                      Student operations
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] text-white">
                      <ShieldCheck size={13} />
                      Master identity
                    </span>
                  </div>

                  <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-[2.15rem]">
                    Student Command Center
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/85">
                    One person first, source records second. Review identity confidence, portal linkage and record history from one protected workspace.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-3">
                <CommandMetric label="Master students" value={stats.total} />
                <CommandMetric label="Portal connected" value={stats.portalConnected} />
                <CommandMetric label="Multiple records" value={stats.multipleRecords} />
              </div>
            </div>

            <aside className="flex flex-col justify-between bg-[#FF5A0A] px-5 py-6 text-white sm:px-6 lg:py-7">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/90">
                  Identity health
                </p>
                <div className="mt-3 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-black leading-none">
                      {stats.review ? "Needs review" : "Identity healthy"}
                    </h2>
                    <p className="mt-2 text-xs font-black text-white/90">
                      {stats.review} student{stats.review === 1 ? "" : "s"} waiting for reconciliation.
                    </p>
                  </div>
                  <ShieldCheck size={30} className="shrink-0" />
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/40 bg-white/10 p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/80">
                  Identity protection
                </p>
                <p className="mt-1 text-sm font-black">Persistent reconciliation</p>
                <p className="mt-1 text-[11px] font-semibold leading-5 text-white/85">
                  Source records stay intact while permanent Person IDs keep the student history connected.
                </p>
              </div>
            </aside>
          </div>

          <div className="grid gap-3 border-b-2 border-orange-200 bg-[#FFF8EF] p-4 sm:grid-cols-2 xl:grid-cols-5">
            <Stat label="People" value={stats.total} />
            <Stat label="Verified / linked" value={stats.verified} tone="green" />
            <Stat label="Needs review" value={stats.review} tone="amber" />
            <Stat label="Portal connected" value={stats.portalConnected} tone="blue" />
            <Stat label="Multiple records" value={stats.multipleRecords} />
          </div>

          <div className="grid gap-3 border-t border-orange-100 bg-[#FFFDF8] p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
            <label className="relative block">
              <Search
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, phone, Person ID or source record…"
                className="h-12 w-full rounded-xl border-2 border-[#B9C9D9] bg-white pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <Filter size={15} className="text-slate-500" />
              {[
                ["all", "All"],
                ["review", "Needs review"],
                ["portal", "Portal linked"],
                ["multiple", "Multiple records"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`rounded-xl border-2 px-3 py-2 text-xs font-black transition ${
                    filter === id
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "border-[#B9C9D9] bg-white text-[#123865] hover:border-orange-400 hover:bg-orange-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {reconciliationNotice.message ? (
          <div
            className={`rounded-xl border-2 px-4 py-3 text-sm font-bold ${
              reconciliationNotice.type === "success"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-rose-300 bg-rose-50 text-rose-800"
            }`}
          >
            {reconciliationNotice.message}
          </div>
        ) : null}

        {visibleStudents.length ? (
          <div className="grid gap-4">
            {visibleStudents.map((student) => (
              <StudentIdentityCard
                key={student.key}
                student={student}
                expanded={expandedKey === student.key}
                onToggle={() =>
                  setExpandedKey((current) =>
                    current === student.key ? "" : student.key
                  )
                }
                onOpen={(record) => openStudent(student, record)}
                onReconcile={() => {
                  setReconciliationTarget(student);
                  setSeparateTarget(null);
                  setConfirmationText("");
                }}
                onSeparate={(record) => {
                  setSeparateTarget({ student, record });
                  setReconciliationTarget(null);
                  setConfirmationText("");
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.6rem] border-2 border-dashed border-slate-300 bg-white p-10 text-center">
            <UsersRound className="mx-auto text-slate-400" size={30} />
            <h2 className="mt-3 text-lg font-black text-[#10233F]">
              No matching students
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Change the search or reconciliation filter.
            </p>
          </div>
        )}
      </section>

      {selectedStudent ? (
        <Suspense fallback={<ModalLoader />}>
          <StudentDetailModal
            student={selectedStudent}
            type={selectedStudent.__leadType}
            allLeads={[
              ...inquiries.map((item) => ({ ...item, __leadType: "inquiry" })),
              ...appointments.map((item) => ({
                ...item,
                __leadType: "appointment",
              })),
            ]}
            onClose={() => setSelectedStudent(null)}
            adminProfile={adminProfile}
            permissions={permissions}
            updateInquiryPriority={updateInquiryPriority}
            updateAppointmentPriority={updateAppointmentPriority}
            updateAppointmentStatus={updateAppointmentStatus}
            updateAppointmentStage={updateAppointmentStage}
            toggleInquiryStatus={toggleInquiryStatus}
            deleteInquiry={deleteInquiry}
            deleteAppointment={deleteAppointment}
          />
        </Suspense>
      ) : null}

      {reconciliationTarget ? (
        <IdentityConfirmationModal
          title="Link source records"
          eyebrow="Permanent identity change"
          confirmWord="LINK"
          busy={reconciliationBusy}
          confirmationText={confirmationText}
          setConfirmationText={setConfirmationText}
          onCancel={closeReconciliation}
          onConfirm={confirmLinkRecords}
        >
          <p>
            You are about to persist one <strong>Person ID</strong> across{" "}
            <strong>{reconciliationTarget.records.length}</strong> inquiry /
            appointment records for{" "}
            <strong>{reconciliationTarget.name}</strong>.
          </p>
          <p className="mt-2">
            No source row is deleted. This only tells Zaifan which records belong
            to the same real person.
          </p>
        </IdentityConfirmationModal>
      ) : null}

      {separateTarget ? (
        <IdentityConfirmationModal
          title="Separate source record"
          eyebrow="Permanent identity change"
          confirmWord="SEPARATE"
          busy={reconciliationBusy}
          confirmationText={confirmationText}
          setConfirmationText={setConfirmationText}
          onCancel={closeReconciliation}
          onConfirm={confirmSeparateRecord}
          dangerous
        >
          <p>
            <strong>{getRecordLabel(separateTarget.record)}</strong> will receive
            a new Person ID and stop belonging to{" "}
            <strong>{separateTarget.student.name}</strong>'s current identity.
          </p>
          <p className="mt-2">
            Use this only when the record genuinely belongs to a different person.
          </p>
        </IdentityConfirmationModal>
      ) : null}
    </>
  );
}

function StudentIdentityCard({
  student,
  expanded,
  onToggle,
  onOpen,
  onReconcile,
  onSeparate,
}) {
  const confidence =
    CONFIDENCE[student.confidence] || CONFIDENCE.unlinked;
  const ConfidenceIcon = confidence.icon;

  return (
    <article className="overflow-hidden rounded-[1.6rem] border-[3px] border-[#123865] bg-[#FFFDF8] shadow-[0_10px_30px_rgba(15,35,63,0.08)]">
      <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-[#FF5A0A] bg-[#FF5A0A] text-white">
            <UserRound size={20} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-black text-[#10233F]">
                {student.name}
              </h2>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.06em] ${confidence.className}`}
              >
                <ConfidenceIcon size={11} />
                {confidence.label}
              </span>

              {student.portalConnected ? (
                <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase text-emerald-800">
                  Portal connected
                </span>
              ) : null}
            </div>

            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-slate-600">
              <span>{student.email || "No email"}</span>
              <span>{student.phone || "No phone"}</span>
              <span>
                {student.personId
                  ? `Person ID ${student.personIdLabel}`
                  : "No permanent Person ID yet"}
              </span>
            </div>

            <p className="mt-2 text-xs font-semibold text-slate-500">
              {student.requiresReview
                ? "This is a non-destructive match candidate. Review the linked source records before treating it as one permanent identity."
                : "The permanent identity signal is stronger than the individual inquiry / appointment records below."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <span className="rounded-xl border-2 border-[#123865] bg-[#EDF4FA] px-3 py-2 text-xs font-black text-[#123865]">
            {student.recordCount} source record{student.recordCount === 1 ? "" : "s"}
          </span>

          {student.requiresReview ? (
            <button
              type="button"
              onClick={onReconcile}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-600 bg-emerald-600 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-700"
            >
              <Link2 size={14} />
              Review & link
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => onOpen(student.primaryRecord)}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-2 text-xs font-black text-white transition hover:bg-orange-600"
          >
            Open primary workspace
            <ChevronRight size={14} />
          </button>

          <button
            type="button"
            onClick={onToggle}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#123865] bg-white text-[#123865] transition hover:border-orange-400 hover:bg-orange-50"
            aria-label={expanded ? "Hide source records" : "Show source records"}
          >
            <ChevronDown
              size={16}
              className={`transition ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="border-t-[3px] border-[#123865] bg-[#FFF8EF] p-4 sm:p-5">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-600">
                Source history
              </p>
              <h3 className="mt-1 text-base font-black text-[#10233F]">
                Why this student has multiple records
              </h3>
            </div>
            <p className="text-xs font-semibold text-slate-500">
              Primary is recommended automatically; nothing is merged or deleted.
            </p>
          </div>

          <div className="grid gap-2">
            {student.records.map((record) => {
              const primary =
                record.id === student.primaryRecord?.id &&
                getRecordType(record) === getRecordType(student.primaryRecord);

              return (
                <div
                  key={`${getRecordType(record)}:${record.id}`}
                  className={`grid gap-3 rounded-xl border-2 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${
                    primary
                      ? "border-emerald-300 bg-emerald-50/70"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-[#10233F]">
                        {getRecordLabel(record)}
                      </span>

                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-black uppercase text-slate-600">
                        {getRecordStatus(record)}
                      </span>

                      {primary ? (
                        <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-800">
                          Recommended primary
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {record.email || student.email || "No email"} ·{" "}
                      {record.phone || student.phone || "No phone"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {student.recordCount > 1 && student.personId ? (
                      <button
                        type="button"
                        onClick={() => onSeparate(record)}
                        className="inline-flex items-center gap-1.5 rounded-lg border-2 border-rose-200 bg-white px-3 py-2 text-xs font-black text-rose-700 transition hover:border-rose-400 hover:bg-rose-50"
                        title="Separate only if this source record belongs to a different person"
                      >
                        <Link2Off size={13} />
                        Separate
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => onOpen(record)}
                      className={`rounded-lg border-2 px-3 py-2 text-xs font-black transition ${
                      primary
                        ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                        : "border-[#123865] bg-white text-[#123865] hover:border-orange-400 hover:bg-orange-50"
                    }`}
                  >
                    {primary ? "Open primary" : "Open history record"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function IdentityConfirmationModal({
  eyebrow,
  title,
  confirmWord,
  confirmationText,
  setConfirmationText,
  onCancel,
  onConfirm,
  busy,
  dangerous = false,
  children,
}) {
  const confirmed =
    confirmationText.trim().toUpperCase() === confirmWord.toUpperCase();

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#10233F]/65 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-[1.6rem] border-[3px] border-orange-400 bg-white shadow-[0_30px_100px_rgba(16,35,63,0.35)]">
        <div
          className={`border-b-2 px-5 py-4 ${
            dangerous
              ? "border-rose-300 bg-rose-50"
              : "border-orange-200 bg-[#fff8f1]"
          }`}
        >
          <p
            className={`text-[10px] font-black uppercase tracking-[0.16em] ${
              dangerous ? "text-rose-700" : "text-orange-700"
            }`}
          >
            {eyebrow}
          </p>
          <h2 className="mt-1 text-xl font-black text-[#10233F]">{title}</h2>
        </div>

        <div className="p-5 text-sm font-semibold leading-6 text-slate-600">
          {children}

          <label className="mt-5 block">
            <span className="text-xs font-black text-[#10233F]">
              Type <span className="text-orange-600">{confirmWord}</span> to
              confirm
            </span>
            <input
              autoFocus
              value={confirmationText}
              onChange={(event) => setConfirmationText(event.target.value)}
              disabled={busy}
              className="mt-2 h-11 w-full rounded-xl border-2 border-slate-200 px-3 text-sm font-black uppercase text-[#10233F] outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:opacity-60"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-xs font-black text-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={!confirmed || busy}
            className={`inline-flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-xs font-black text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
              dangerous
                ? "border-rose-600 bg-rose-600 hover:bg-rose-700"
                : "border-emerald-600 bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {busy ? <LoaderCircle size={14} className="animate-spin" /> : null}
            {busy ? "Saving…" : title}
          </button>
        </div>
      </div>
    </div>
  );
}

function CommandMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/25 bg-white/10 px-4 py-3.5">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-white/80">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function Stat({ label, value, tone = "slate" }) {
  const tones = {
    slate: "border-[#123865] bg-[#EDF4FA] text-[#123865]",
    green: "border-emerald-500 bg-emerald-50 text-emerald-800",
    amber: "border-orange-500 bg-orange-50 text-orange-800",
    blue: "border-blue-500 bg-blue-50 text-blue-800",
  };

  return (
    <div className={`rounded-2xl border-[3px] p-4 ${tones[tone] || tones.slate}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.12em] opacity-70">
        {label}
      </p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function ModalLoader() {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#10233F]/50 px-4 backdrop-blur-sm">
      <div className="rounded-2xl border-2 border-orange-200 bg-white px-6 py-5 text-center shadow-xl">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-[3px] border-orange-100 border-t-orange-500" />
        <p className="mt-3 text-sm font-black text-[#10233F]">
          Opening master student workspace
        </p>
      </div>
    </div>
  );
}

export default StudentDirectoryPage;
