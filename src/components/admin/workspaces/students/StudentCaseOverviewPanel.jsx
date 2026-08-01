import {
  Bot,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  FolderKey,
  FolderOpen,
  GraduationCap,
  History,
  LifeBuoy,
  ListChecks,
  Map as MapIcon,
  UsersRound,
  WalletCards,
} from "lucide-react";

// StudentCaseOverviewPanel PARTNER OS EXTREME V2 — Refined Counselor Control
function StudentCaseOverviewPanel({
  workingStudent,
  studentType,
  studentApplication,
  studentDocuments,
  studentUniversities,
  studentTasks,
  studentCommunications,
  studentInvoices,
  studentPayments,
  studentReceipts,
  portalAccount,
  documentStatusSummary,
  documentHealthScore,
  verifiedDocuments,
  completedTasks,
  openSupportRequests,
  pipelineProgress,
  currentStage,
  currentStageId,
  stages,
  priority,
  status,
  priorityOptions,
  statusOptions,
  savingPriority,
  savingStatus,
  savingStage,
  safePermissions,
  isAppointment,
  fullName,
  email,
  notes,
  profileReadiness,
  getPriorityStyle,
  getStatusStyle,
  handlePriorityChange,
  handleStatusChange,
  handleStageChange,
  setActivePanel,
}) {

const cleanTaskStatus = (value = "") =>
                  String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");

                const nowMs = Date.now();

                const activeTasks = studentTasks.filter(
                  (task) =>
                    !["completed", "done", "cancelled", "archived"].includes(
                      cleanTaskStatus(task?.status)
                    ) && !task?.is_archived
                );

                const overdueTasks = activeTasks.filter((task) => {
                  if (!task?.due_date) return false;
                  const dueMs = new Date(task.due_date).getTime();
                  return Number.isFinite(dueMs) && dueMs < nowMs;
                });

                const blockedTasks = activeTasks.filter(
                  (task) => cleanTaskStatus(task?.status) === "blocked"
                );

                const urgentTasks = activeTasks.filter((task) =>
                  ["critical", "urgent", "high"].includes(
                    cleanTaskStatus(task?.priority)
                  )
                );

                const openInvoices = studentInvoices.filter(
                  (invoice) =>
                    !["paid", "cancelled", "void"].includes(
                      cleanTaskStatus(invoice?.status)
                    )
                );

                const totalOutstanding = openInvoices.reduce((sum, invoice) => {
                  const explicitOutstanding = Number(invoice?.outstanding_amount);
                  if (Number.isFinite(explicitOutstanding)) {
                    return sum + Math.max(0, explicitOutstanding);
                  }

                  const total = Number(
                    invoice?.total_amount ?? invoice?.amount ?? 0
                  );
                  const paid = Number(invoice?.paid_amount ?? 0);

                  return (
                    sum +
                    Math.max(
                      0,
                      (Number.isFinite(total) ? total : 0) -
                        (Number.isFinite(paid) ? paid : 0)
                    )
                  );
                }, 0);

                const applicationStatus =
                  studentApplication?.application_status ||
                  studentApplication?.status ||
                  "Not started";

                const offerStatus =
                  studentApplication?.offer_status || "No offer yet";

                const visaStatus =
                  studentApplication?.visa_status || "Not started";

                const selectedUniversity =
                  studentApplication?.university ||
                  studentApplication?.university_name ||
                  studentApplication?.source_university_name ||
                  studentUniversities?.[0]?.university ||
                  studentUniversities?.[0]?.name ||
                  "Not selected";

                const intake =
                  studentApplication?.intake ||
                  studentUniversities?.[0]?.intake ||
                  "Not assigned";

                const ownerName =
                  workingStudent?.assigned_admin_name ||
                  workingStudent?.assigned_to_name ||
                  workingStudent?.counselor_name ||
                  "Open ownership panel";

                const portalLabel = portalAccount
                  ? portalAccount.is_active
                    ? "Active"
                    : "Paused"
                  : "Not created";

                const portalNeedsAction =
                  !portalAccount ||
                  !portalAccount.is_active ||
                  portalAccount.must_change_password;

                const phone =
                  workingStudent?.phone ||
                  workingStudent?.phone_number ||
                  "No phone added";

                const country =
                  workingStudent?.country ||
                  workingStudent?.country_interest ||
                  workingStudent?.preferred_country ||
                  "Not selected";

                const field =
                  workingStudent?.field_of_interest ||
                  workingStudent?.course ||
                  workingStudent?.program ||
                  workingStudent?.study_field ||
                  workingStudent?.consultation_type ||
                  "Not selected";

                const createdAt = workingStudent?.created_at
                  ? new Date(workingStudent.created_at).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Not available";

                const infoRows = [
                  ["Email", email || "No email added"],
                  ["Phone", phone],
                  ["Country", country],
                  ["Field / Route", field],
                  ["Created", createdAt],
                  ["Record ID", workingStudent?.id || "Not available"],
                ];

                const appointmentRows = [
                  [
                    "Consultation",
                    workingStudent?.consultation_type ||
                      workingStudent?.type ||
                      "Consultation",
                  ],
                  [
                    "Appointment Date",
                    workingStudent?.appointment_date ||
                      workingStudent?.date ||
                      "Not selected",
                  ],
                  [
                    "Appointment Time",
                    workingStudent?.appointment_time ||
                      workingStudent?.time ||
                      "Not selected",
                  ],
                ];

                const attentionSignals = [
                  documentStatusSummary.rejected > 0
                    ? {
                        id: "rejected-documents",
                        title: `${documentStatusSummary.rejected} rejected document${
                          documentStatusSummary.rejected === 1 ? "" : "s"
                        }`,
                        text: "Open the Student Master File and replace or verify the affected records.",
                        panel: "documents",
                        tone: "danger",
                      }
                    : null,
                  documentStatusSummary.expired > 0
                    ? {
                        id: "expired-documents",
                        title: `${documentStatusSummary.expired} expired document${
                          documentStatusSummary.expired === 1 ? "" : "s"
                        }`,
                        text: "Fresh evidence is required before this case should move forward.",
                        panel: "documents",
                        tone: "warning",
                      }
                    : null,
                  overdueTasks.length > 0
                    ? {
                        id: "overdue-tasks",
                        title: `${overdueTasks.length} overdue task${
                          overdueTasks.length === 1 ? "" : "s"
                        }`,
                        text: "Clear overdue operational work before deadlines create downstream risk.",
                        panel: "operations",
                        tone: "danger",
                      }
                    : null,
                  blockedTasks.length > 0
                    ? {
                        id: "blocked-tasks",
                        title: `${blockedTasks.length} blocked task${
                          blockedTasks.length === 1 ? "" : "s"
                        }`,
                        text: "Resolve the blocker or reassign the task so the case can continue.",
                        panel: "operations",
                        tone: "danger",
                      }
                    : null,
                  openSupportRequests > 0
                    ? {
                        id: "support",
                        title: `${openSupportRequests} open support request${
                          openSupportRequests === 1 ? "" : "s"
                        }`,
                        text: "The student is waiting for Zaifan support or counselor action.",
                        panel: "support-requests",
                        tone: "warning",
                      }
                    : null,
                  !studentApplication
                    ? {
                        id: "application",
                        title: "No application case connected",
                        text: "Create or connect an application when the shortlist is ready.",
                        panel: "applications",
                        tone: "warning",
                      }
                    : null,
                  studentUniversities.length === 0
                    ? {
                        id: "universities",
                        title: "University shortlist is empty",
                        text: "Add realistic dream, target and safe options before application planning.",
                        panel: "universities",
                        tone: "warning",
                      }
                    : null,
                  portalNeedsAction
                    ? {
                        id: "portal",
                        title: !portalAccount
                          ? "Student portal not created"
                          : !portalAccount.is_active
                            ? "Student portal is paused"
                            : "Student must change portal password",
                        text: "Review Student Portal access and security state.",
                        panel: "portal-account",
                        tone: "info",
                      }
                    : null,
                  totalOutstanding > 0
                    ? {
                        id: "finance",
                        title: "Outstanding finance balance",
                        text: `${studentInvoices.length} invoice${
                          studentInvoices.length === 1 ? "" : "s"
                        } on file with an unpaid balance requiring review.`,
                        panel: "payments",
                        tone: "warning",
                      }
                    : null,
                ].filter(Boolean);

                const criticalAttention = attentionSignals.filter(
                  (item) => item.tone === "danger"
                ).length;

                const attentionLabel =
                  criticalAttention > 0
                    ? `${criticalAttention} critical`
                    : attentionSignals.length > 0
                      ? `${attentionSignals.length} to review`
                      : "Case clear";

                const formatMoney = (amount) => {
                  const value = Number(amount || 0);
                  if (!Number.isFinite(value)) return "PKR 0";
                  return `PKR ${value.toLocaleString("en-PK", {
                    maximumFractionDigits: 0,
                  })}`;
                };

                const commandCards = [
                  {
                    label: "Documents",
                    value: `${verifiedDocuments}/${studentDocuments.length}`,
                    helper:
                      documentStatusSummary.attention > 0
                        ? `${documentStatusSummary.attention} need attention`
                        : "Vault health clear",
                    icon: FolderOpen,
                    panel: "documents",
                    accent: "navy",
                  },
                  {
                    label: "Application",
                    value: String(applicationStatus).replace(/_/g, " "),
                    helper: String(offerStatus).replace(/_/g, " "),
                    icon: GraduationCap,
                    panel: "applications",
                    accent: "orange",
                  },
                  {
                    label: "Universities",
                    value: studentUniversities.length,
                    helper: selectedUniversity,
                    icon: Building2,
                    panel: "universities",
                    accent: "cream",
                  },
                  {
                    label: "Tasks",
                    value: `${completedTasks}/${studentTasks.length}`,
                    helper:
                      overdueTasks.length > 0
                        ? `${overdueTasks.length} overdue`
                        : `${activeTasks.length} active`,
                    icon: ClipboardCheck,
                    panel: "operations",
                    accent: "cream",
                  },
                  {
                    label: "Support",
                    value: openSupportRequests,
                    helper:
                      openSupportRequests > 0 ? "Needs response" : "Queue clear",
                    icon: LifeBuoy,
                    panel: "support-requests",
                    accent: "cream",
                  },
                  {
                    label: "Finance",
                    value:
                      totalOutstanding > 0
                        ? formatMoney(totalOutstanding)
                        : "Clear",
                    helper: `${studentPayments.length} payment${
                      studentPayments.length === 1 ? "" : "s"
                    } recorded`,
                    icon: WalletCards,
                    panel: "payments",
                    accent: totalOutstanding > 0 ? "orange" : "navy",
                  },
                ];

                const actionCards = [
                  {
                    label: "Master File",
                    text: "Documents, evidence and permanent case vault",
                    icon: FolderKey,
                    panel: "documents",
                  },
                  {
                    label: "Applications",
                    text: "University application workflow and offer tracking",
                    icon: GraduationCap,
                    panel: "applications",
                  },
                  {
                    label: "Visa",
                    text: "Visa readiness, requirements and risk workflow",
                    icon: MapIcon,
                    panel: "visa",
                  },
                  {
                    label: "Task Command",
                    text: "Deadlines, ownership, blockers and next actions",
                    icon: ListChecks,
                    panel: "operations",
                  },
                  {
                    label: "Support Desk",
                    text: "Student requests, counselor response and resolution",
                    icon: LifeBuoy,
                    panel: "support-requests",
                  },
                  {
                    label: "Timeline",
                    text: "Permanent Student Journey and CRM audit history",
                    icon: History,
                    panel: "timeline",
                  },
                ];

                return (
                  <div className="min-w-0 space-y-5 rounded-[2.25rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 text-[#10233F] shadow-[0_24px_65px_rgba(18,56,101,0.15)] sm:p-4 lg:p-5">
                    <section className="min-w-0 overflow-hidden rounded-[1.8rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_50px_rgba(18,56,101,0.11)]">
                      <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
                        <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6 lg:p-7">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-[#FF5A0A]/30 bg-orange-400/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-orange-300">
                              Student Command Center
                            </span>

                            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                              {isAppointment ? "Appointment Case" : "Inquiry Case"}
                            </span>
                          </div>

                          <h3 className="mt-4 max-w-4xl break-words text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-4xl">
                            {fullName}
                          </h3>

                          <p className="mt-3 max-w-3xl break-words text-sm font-semibold leading-6 text-slate-100">
                            One operational view for identity, readiness, applications,
                            documents, finance, portal access, tasks, support and next actions.
                          </p>

                          <div className="mt-5 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
                            <CommandHeroStat
                              label="Profile Ready"
                              value={`${profileReadiness}%`}
                            />
                            <CommandHeroStat
                              label="Pipeline"
                              value={`${pipelineProgress || 0}%`}
                            />
                            <CommandHeroStat
                              label="Stage"
                              value={currentStage?.label || "Stage"}
                            />
                            <CommandHeroStat
                              label="Owner"
                              value={ownerName}
                            />
                          </div>
                        </div>

                        <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white sm:p-6 lg:border-l-[3px] lg:border-t-0 lg:p-7">
                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white">
                            Needs Attention Now
                          </p>

                          <p className="mt-3 text-4xl font-black text-white">
                            {attentionSignals.length}
                          </p>

                          <p className="mt-1 text-sm font-black text-white">
                            {attentionLabel}
                          </p>

                          <p className="mt-3 text-sm leading-6 text-white">
                            {attentionSignals.length
                              ? "Open the flagged modules below and clear blockers before moving the case forward."
                              : "No immediate operational blockers were detected from the currently loaded Student OS data."}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              setActivePanel(
                                attentionSignals[0]?.panel || "analytics"
                              )
                            }
                            className="mt-5 inline-flex items-center gap-2 rounded-xl border-2 border-white/40 bg-white px-4 py-2.5 text-xs font-black text-orange-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50"
                          >
                            {attentionSignals.length
                              ? "Open Highest Priority"
                              : "Open Student Analytics"}
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </section>

                    <section className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                      {commandCards.map((card) => {
                        const Icon = card.icon;

                        const className =
                          card.accent === "navy"
                            ? "border-[#123865] bg-[#123865] text-white"
                            : card.accent === "orange"
                              ? "border-orange-500 bg-[#FF5A0A] text-white"
                              : "border-[#FF5A0A] bg-white text-[#10233F]";

                        return (
                          <button
                            key={card.label}
                            type="button"
                            onClick={() => setActivePanel(card.panel)}
                            className={`group min-w-0 rounded-[1.4rem] border-[3px] p-4 text-left shadow-[0_7px_20px_rgba(18,56,101,0.05)] transition hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(18,56,101,0.10)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${className}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span
                                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                                  card.accent === "navy" ||
                                  card.accent === "orange"
                                    ? "border border-white/20 bg-white/10 text-white"
                                    : "border-2 border-[#FFB37A] bg-orange-50 text-orange-700"
                                }`}
                              >
                                <Icon size={15} />
                              </span>

                              <ChevronRight
                                size={14}
                                className="opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                              />
                            </div>

                            <p
                              className={`mt-3 text-[8px] font-black uppercase tracking-[0.13em] ${
                                card.accent === "navy" ||
                                card.accent === "orange"
                                  ? "text-white"
                                  : "text-slate-500"
                              }`}
                            >
                              {card.label}
                            </p>

                            <p
                              className={`mt-1 break-words text-lg font-black capitalize ${
                                card.accent === "navy" ||
                                card.accent === "orange"
                                  ? "text-white"
                                  : "text-[#10233F]"
                              }`}
                            >
                              {card.value}
                            </p>

                            <p
                              className={`mt-1 line-clamp-2 text-[10px] font-semibold leading-4 ${
                                card.accent === "navy" ||
                                card.accent === "orange"
                                  ? "text-white"
                                  : "text-slate-500"
                              }`}
                            >
                              {card.helper}
                            </p>
                          </button>
                        );
                      })}
                    </section>

                    {attentionSignals.length ? (
                      <section className="min-w-0 rounded-[1.65rem] border-[3px] border-[#FB7185] bg-white p-5 shadow-[0_12px_34px_rgba(18,56,101,0.06)]">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-red-700">
                              Intervention Queue
                            </p>
                            <h3 className="mt-1 text-xl font-black text-[#10233F]">
                              What needs attention before this case moves?
                            </h3>
                          </div>

                          <span className="rounded-full border-2 border-red-300 bg-red-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-red-800">
                            {attentionSignals.length} signal
                            {attentionSignals.length === 1 ? "" : "s"}
                          </span>
                        </div>

                        <div className="mt-4 grid min-w-0 gap-3 lg:grid-cols-2">
                          {attentionSignals.slice(0, 6).map((signal) => {
                            const danger = signal.tone === "danger";

                            return (
                              <button
                                key={signal.id}
                                type="button"
                                onClick={() => setActivePanel(signal.panel)}
                                className={`group min-w-0 rounded-[1.3rem] border-[3px] p-4 text-left shadow-[0_6px_16px_rgba(18,56,101,0.04)] transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${
                                  danger
                                    ? "border-red-300 bg-red-50"
                                    : signal.tone === "info"
                                      ? "border-blue-300 bg-blue-50"
                                      : "border-[#FF5A0A] bg-orange-50"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <span
                                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 bg-white ${
                                      danger
                                        ? "border-red-300 text-red-700"
                                        : signal.tone === "info"
                                          ? "border-blue-300 text-blue-700"
                                          : "border-[#FF5A0A] text-orange-700"
                                    }`}
                                  >
                                    <CircleAlert size={15} />
                                  </span>

                                  <span className="min-w-0 flex-1">
                                    <span className="block font-black text-[#10233F]">
                                      {signal.title}
                                    </span>
                                    <span className="mt-1 block text-xs font-medium leading-5 text-slate-600">
                                      {signal.text}
                                    </span>
                                  </span>

                                  <ChevronRight
                                    size={15}
                                    className="mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-orange-600"
                                  />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    ) : (
                      <section className="min-w-0 rounded-[1.65rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-5 shadow-[0_12px_34px_rgba(18,56,101,0.05)]">
                        <div className="flex items-start gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-emerald-300 bg-white text-emerald-700">
                            <CheckCircle2 size={18} />
                          </span>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-700">
                              Operational Health
                            </p>
                            <h3 className="mt-1 text-lg font-black text-[#10233F]">
                              No immediate blockers detected
                            </h3>
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              Continue normal counselor review and use Student Analytics
                              for deeper journey intelligence.
                            </p>
                          </div>
                        </div>
                      </section>
                    )}

                    <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
                      <div className="min-w-0 rounded-[1.65rem] border-[3px] border-[#123865] bg-white p-5 shadow-[0_12px_34px_rgba(18,56,101,0.07)]">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-700">
                              Case Identity
                            </p>
                            <h3 className="mt-1 text-xl font-black text-[#10233F]">
                              Student Master Record
                            </h3>
                          </div>

                          <span className="rounded-full border-2 border-[#123865] bg-[#123865] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                            {studentType}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          {infoRows.map(([label, value]) => (
                            <div
                              key={label}
                              className="min-w-0 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] p-3 shadow-[0_4px_12px_rgba(18,56,101,0.03)]"
                            >
                              <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">
                                {label}
                              </p>
                              <p className="mt-1 break-words text-sm font-black text-[#10233F]">
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>

                        {isAppointment ? (
                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            {appointmentRows.map(([label, value]) => (
                              <div
                                key={label}
                                className="rounded-xl border-2 border-[#FF5A0A] bg-orange-50 p-3"
                              >
                                <p className="text-[8px] font-black uppercase tracking-[0.12em] text-orange-700">
                                  {label}
                                </p>
                                <p className="mt-1 break-words text-xs font-black text-[#10233F]">
                                  {value}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="min-w-0 rounded-[1.65rem] border-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white shadow-[0_12px_34px_rgba(18,56,101,0.09)]">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white">
                          Academic Route
                        </p>

                        <h3 className="mt-2 text-xl font-black text-white">
                          {selectedUniversity}
                        </h3>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          <CommandOrangeStat
                            label="Application"
                            value={String(applicationStatus).replace(/_/g, " ")}
                          />
                          <CommandOrangeStat
                            label="Offer"
                            value={String(offerStatus).replace(/_/g, " ")}
                          />
                          <CommandOrangeStat
                            label="Visa"
                            value={String(visaStatus).replace(/_/g, " ")}
                          />
                          <CommandOrangeStat label="Intake" value={intake} />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setActivePanel("applications")}
                            className="rounded-xl border-2 border-white/40 bg-white px-3 py-2 text-xs font-black text-orange-700 transition hover:-translate-y-0.5 hover:bg-orange-50"
                          >
                            Open Application
                          </button>

                          <button
                            type="button"
                            onClick={() => setActivePanel("universities")}
                            className="rounded-xl border-2 border-white/40 bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-white/20"
                          >
                            Open Universities
                          </button>
                        </div>
                      </div>
                    </section>

                    <section className="grid min-w-0 gap-4 lg:grid-cols-3">
                      <div className="min-w-0 rounded-[1.55rem] border-[3px] border-[#FF5A0A] bg-white p-5 shadow-[0_10px_28px_rgba(18,56,101,0.06)]">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-700">
                          Document Readiness
                        </p>
                        <div className="mt-3 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-3xl font-black text-[#10233F]">
                              {documentHealthScore}%
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {verifiedDocuments} verified ·{" "}
                              {documentStatusSummary.pending} pending
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setActivePanel("documents")}
                            className="rounded-xl border-2 border-[#FF5A0A] bg-orange-50 px-3 py-2 text-xs font-black text-orange-800 transition hover:bg-orange-100"
                          >
                            Master File
                          </button>
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#FF5A0A] transition-all duration-500"
                            style={{ width: `${documentHealthScore}%` }}
                          />
                        </div>
                      </div>

                      <div className="min-w-0 rounded-[1.55rem] border-[3px] border-[#FF5A0A] bg-[#123865] p-5 text-white shadow-[0_10px_28px_rgba(18,56,101,0.09)]">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-300">
                          Portal & Communication
                        </p>
                        <p className="mt-3 text-2xl font-black text-white">
                          {portalLabel}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-white">
                          {studentCommunications.length} communication
                          {studentCommunications.length === 1 ? "" : "s"} logged
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setActivePanel("portal-account")}
                            className="rounded-xl border-2 border-white/30 bg-white px-3 py-2 text-xs font-black text-[#123865] transition hover:-translate-y-0.5 hover:bg-orange-50"
                          >
                            Portal Access
                          </button>
                          <button
                            type="button"
                            onClick={() => setActivePanel("communication")}
                            className="rounded-xl border-2 border-white/30 bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-white/20"
                          >
                            Communications
                          </button>
                        </div>
                      </div>

                      <div className="min-w-0 rounded-[1.55rem] border-[3px] border-[#FF5A0A] bg-white p-5 shadow-[0_10px_28px_rgba(18,56,101,0.06)]">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-700">
                          Finance Health
                        </p>
                        <p className="mt-3 text-2xl font-black text-[#10233F]">
                          {totalOutstanding > 0
                            ? formatMoney(totalOutstanding)
                            : "No outstanding balance"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {studentInvoices.length} invoices ·{" "}
                          {studentReceipts.length} receipts ·{" "}
                          {studentPayments.length} payments
                        </p>

                        <button
                          type="button"
                          onClick={() => setActivePanel("payments")}
                          className="mt-4 rounded-xl border-2 border-[#FF5A0A] bg-[#FF5A0A] px-3 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-orange-600"
                        >
                          Open Finance Center
                        </button>
                      </div>
                    </section>

                    <section className="min-w-0 overflow-hidden rounded-[1.65rem] border-[3px] border-[#123865] bg-white shadow-[0_12px_34px_rgba(18,56,101,0.07)]">
                      <div className="flex min-w-0 flex-col gap-3 border-b-[3px] border-[#FF5A0A] bg-[#123865] px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-300">
                            Counselor Control
                          </p>
                          <h3 className="mt-1 break-words text-xl font-black text-white">
                            Pipeline, Priority & CRM Status
                          </h3>
                          <p className="mt-1 max-w-3xl text-sm font-semibold leading-5 text-slate-200">
                            Keep the student's live operating state current from one command surface.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActivePanel("assignment")}
                          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-white bg-white px-4 text-xs font-black text-[#123865] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FFF4E8] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
                        >
                          <UsersRound size={14} />
                          Ownership
                        </button>
                      </div>

                      <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.9fr)_minmax(0,0.95fr)]">
                        <div className="min-w-0 border-b-[3px] border-[#DCE5EE] p-4 lg:border-b-0 lg:border-r-[3px]">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-500">
                                Journey Stage
                              </p>
                              <p className="mt-1 truncate text-sm font-black text-[#10233F]">
                                {currentStage?.label || "Select stage"}
                              </p>
                            </div>

                            <span className="rounded-full border-2 border-[#FF5A0A] bg-[#FFF4E8] px-2.5 py-1 text-[9px] font-black text-orange-700">
                              {pipelineProgress || 0}%
                            </span>
                          </div>

                          <select
                            value={currentStageId || ""}
                            onChange={(event) =>
                              handleStageChange(event.target.value)
                            }
                            disabled={savingStage}
                            className="mt-3 min-h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 py-2.5 text-sm font-black text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {stages.map((stage) => (
                              <option key={stage.id} value={stage.id}>
                                {stage.label}
                              </option>
                            ))}
                          </select>

                          <div className="mt-3 h-2.5 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[#FF5A0A] transition-all duration-500"
                              style={{ width: `${pipelineProgress || 0}%` }}
                            />
                          </div>

                          {savingStage ? (
                            <p className="mt-2 text-[10px] font-black text-orange-700">
                              Saving stage...
                            </p>
                          ) : null}
                        </div>

                        <div className="min-w-0 border-b-[3px] border-[#DCE5EE] p-4 lg:border-b-0 lg:border-r-[3px]">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-500">
                                Priority
                              </p>
                              <p className="mt-1 text-sm font-black capitalize text-[#10233F]">
                                {priority || "Not set"}
                              </p>
                            </div>

                            {savingPriority ? (
                              <span className="text-[10px] font-black text-orange-700">
                                Saving...
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-3 grid min-w-0 grid-cols-2 gap-2">
                            {priorityOptions.map((item) => {
                              const isSelected = priority === item;

                              return (
                                <button
                                  key={item}
                                  type="button"
                                  aria-pressed={isSelected}
                                  disabled={
                                    !safePermissions.canUpdatePriority ||
                                    savingPriority
                                  }
                                  onClick={() => handlePriorityChange(item)}
                                  className={`min-h-10 min-w-0 rounded-xl border-2 px-3 text-xs font-black capitalize transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-40 ${
                                    isSelected
                                      ? getPriorityStyle(item)
                                      : "border-[#C9D7E6] bg-white text-[#10233F] hover:border-[#FF5A0A] hover:bg-[#FFF4E8]"
                                  }`}
                                >
                                  {item}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="min-w-0 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-500">
                                CRM Status
                              </p>
                              <p className="mt-1 text-sm font-black capitalize text-[#10233F]">
                                {status || "Not set"}
                              </p>
                            </div>

                            {savingStatus ? (
                              <span className="text-[10px] font-black text-orange-700">
                                Saving...
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-3 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                            {statusOptions.map((item) => {
                              const isSelected = status === item;

                              return (
                                <button
                                  key={item}
                                  type="button"
                                  aria-pressed={isSelected}
                                  disabled={
                                    !safePermissions.canUpdateStatus || savingStatus
                                  }
                                  onClick={() => handleStatusChange(item)}
                                  className={`min-h-10 min-w-0 rounded-xl border-2 px-3 text-xs font-black capitalize transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-40 ${
                                    isSelected
                                      ? getStatusStyle(item)
                                      : "border-[#C9D7E6] bg-white text-[#10233F] hover:border-[#FF5A0A] hover:bg-[#FFF4E8]"
                                  }`}
                                >
                                  {item}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.75fr)]">
                      <div className="min-w-0 rounded-[1.65rem] border-[3px] border-[#FF5A0A] bg-[#123865] p-5 text-white shadow-[0_12px_34px_rgba(18,56,101,0.09)]">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-300">
                          Counselor Context
                        </p>
                        <h3 className="mt-2 text-xl font-black text-white">
                          Notes / Student Message
                        </h3>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white">
                          {notes}
                        </p>
                      </div>

                      <div className="min-w-0 rounded-[1.65rem] border-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white shadow-[0_12px_34px_rgba(18,56,101,0.09)]">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white">
                          Real GPT Counselor Desk
                        </p>
                        <h3 className="mt-2 text-xl font-black text-white">
                          Generate only when human-ready output is useful.
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-white">
                          Open the connected GPT workspace for summaries, email,
                          WhatsApp, call scripts, visa reasoning and follow-up plans.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActivePanel("ai-workspace")}
                          className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-white/40 bg-white px-4 py-2.5 text-xs font-black text-orange-700 transition hover:-translate-y-0.5 hover:bg-orange-50"
                        >
                          <Bot size={14} />
                          Launch Real GPT
                        </button>
                      </div>
                    </section>

                    <section className="min-w-0 rounded-[1.65rem] border-[3px] border-[#123865] bg-white p-5 shadow-[0_12px_34px_rgba(18,56,101,0.07)]">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-700">
                          Quick Navigation
                        </p>
                        <h3 className="mt-1 text-xl font-black text-[#10233F]">
                          Move directly to the operating module
                        </h3>
                      </div>

                      <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {actionCards.map((action) => {
                          const Icon = action.icon;

                          return (
                            <button
                              key={action.label}
                              type="button"
                              onClick={() => setActivePanel(action.panel)}
                              className="group min-w-0 rounded-[1.3rem] border-[3px] border-[#C9D7E6] bg-[#FFF8EF] p-4 text-left shadow-[0_6px_16px_rgba(18,56,101,0.04)] transition hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:bg-[#FFF4E8] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
                            >
                              <div className="flex items-start gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#FF5A0A] bg-white text-orange-700">
                                  <Icon size={16} />
                                </span>

                                <span className="min-w-0 flex-1">
                                  <span className="block font-black text-[#10233F]">
                                    {action.label}
                                  </span>
                                  <span className="mt-1 block text-xs font-medium leading-5 text-slate-600">
                                    {action.text}
                                  </span>
                                </span>

                                <ChevronRight
                                  size={15}
                                  className="mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-orange-600"
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                );
}


function CommandHeroStat({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/20 bg-white/10 p-3 shadow-inner">
      <p className="text-[8px] font-black uppercase tracking-[0.13em] text-white">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-white">{value}</p>
    </div>
  );
}

function CommandOrangeStat({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3 shadow-inner">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-white">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black capitalize text-white">
        {value}
      </p>
    </div>
  );
}

export default StudentCaseOverviewPanel;
