import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  FileText,
  Lightbulb,
  Megaphone,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function lower(value) {
  return String(value || "").trim().toLowerCase();
}

function priorityTone(priority = "") {
  const value = lower(priority);

  if (value.includes("high")) {
    return "border-[#FB7185] bg-[#FFF4F4] text-red-700";
  }

  if (value.includes("medium")) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
}

function statusTone(status = "") {
  const value = lower(status);

  if (value.includes("published") || value.includes("live")) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (value.includes("scheduled")) {
    return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
  }

  if (value.includes("draft") || value.includes("idea")) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  return "border-[#C9D7E6] bg-[#FFF8EF] text-slate-600";
}

function normaliseContentItem(item = {}, index = 0) {
  return {
    id: item.id || item.content_id || `${item.title || "content"}-${index}`,
    title: String(item.title || item.name || "").trim(),
    channel: String(item.channel || item.platform || item.format || "").trim(),
    goal: String(item.goal || item.objective || "").trim(),
    priority: String(item.priority || "Medium").trim(),
    status: String(item.status || item.state || "Idea").trim(),
    owner: String(item.owner || item.assigned_to || "").trim(),
    dueDate: String(item.dueDate || item.due_date || item.publish_date || "").trim(),
    source: String(item.source || item.origin || "").trim(),
  };
}

function PlannerMetric({ label, value, helper, tone = "blue", icon: Icon }) {
  const tones = {
    navy: "border-[#123865] bg-[#123865]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    green: "border-[#34D399] bg-[#F0FFF8]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
    violet: "border-[#9B6CFF] bg-[#F8F5FF]",
  };

  const dark = tone === "navy";

  return (
    <article
      className={`rounded-[1.35rem] border-[3px] p-4 shadow-[0_6px_18px_rgba(15,35,63,0.05)] ${
        tones[tone] || tones.blue
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-[9px] font-black uppercase tracking-[0.11em] ${
              dark ? "text-orange-300" : "text-slate-500"
            }`}
          >
            {label}
          </p>
          <p
            className={`mt-2 text-2xl font-black ${
              dark ? "text-white" : "text-[#10233F]"
            }`}
          >
            {value}
          </p>
        </div>

        {Icon ? (
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${
              dark
                ? "border-white/20 bg-white/10 text-orange-200"
                : "border-[#123865]/15 bg-white text-[#123865]"
            }`}
          >
            <Icon size={16} />
          </div>
        ) : null}
      </div>

      <p
        className={`mt-2 text-xs font-semibold leading-5 ${
          dark ? "text-slate-200" : "text-slate-600"
        }`}
      >
        {helper}
      </p>
    </article>
  );
}

function ContentRow({ item, onRemove, canRemove }) {
  return (
    <article className="rounded-[1.3rem] border-2 border-[#C9D7E6] bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)] transition hover:border-[#F97316]">
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(19rem,1.5fr)_12rem_14rem_10rem_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 [overflow-wrap:anywhere] font-black text-[#10233F]">
              {item.title || "Untitled content idea"}
            </p>

            <span
              className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${priorityTone(
                item.priority
              )}`}
            >
              {item.priority || "Medium"}
            </span>

            <span
              className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${statusTone(
                item.status
              )}`}
            >
              {item.status || "Idea"}
            </span>
          </div>

          <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">
            {[item.owner ? `Owner: ${item.owner}` : null, item.source]
              .filter(Boolean)
              .join(" · ") || "No owner/source metadata yet"}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Channel
          </p>
          <p className="mt-1 truncate text-xs font-black text-[#10233F]">
            {item.channel || "Not chosen"}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Goal
          </p>
          <p className="mt-1 line-clamp-2 text-xs font-black text-[#10233F]">
            {item.goal || "Not defined"}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Due
          </p>
          <p className="mt-1 truncate text-xs font-black text-[#10233F]">
            {item.dueDate || "Not scheduled"}
          </p>
        </div>

        {canRemove ? (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#FB7185] bg-[#FFF4F4] text-red-700 transition hover:bg-red-50"
            aria-label={`Remove ${item.title || "content item"}`}
          >
            <Trash2 size={15} />
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default function ContentPlannerPanel({
  marketing = {},
  records = [],
  onCreateContent,
  onDeleteContent,
}) {
  const sourceRecords = useMemo(() => {
    const direct = safeArray(records);
    if (direct.length) return direct;

    return safeArray(
      marketing.content ||
        marketing.contentItems ||
        marketing.contentPlan ||
        marketing.contentRecords
    );
  }, [records, marketing]);

  const initialItems = useMemo(
    () => sourceRecords.map(normaliseContentItem),
    [sourceRecords]
  );

  const [localItems, setLocalItems] = useState([]);
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [draft, setDraft] = useState({
    title: "",
    channel: "",
    goal: "",
    priority: "Medium",
    status: "Idea",
    dueDate: "",
  });
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const items = useMemo(
    () => [...localItems, ...initialItems],
    [localItems, initialItems]
  );

  const filtered = useMemo(() => {
    const search = lower(query);

    return items.filter((item) => {
      if (
        priorityFilter !== "All" &&
        String(item.priority || "") !== priorityFilter
      ) {
        return false;
      }

      if (
        statusFilter !== "All" &&
        String(item.status || "") !== statusFilter
      ) {
        return false;
      }

      if (!search) return true;

      return [
        item.title,
        item.channel,
        item.goal,
        item.priority,
        item.status,
        item.owner,
        item.source,
      ]
        .map(lower)
        .join(" ")
        .includes(search);
    });
  }, [items, query, priorityFilter, statusFilter]);

  const sourceIdeas = useMemo(() => {
    return safeArray(marketing.sources)
      .filter((source) => source?.name)
      .slice(0, 4)
      .map((source) => {
        const applicationRate = Number(source.applicationRate);
        const measurable = Number.isFinite(applicationRate);

        return {
          title: `Create content for ${source.name} leads`,
          channel: "Choose channel",
          goal: measurable
            ? `Investigate ${applicationRate}% lead → application conversion`
            : "Improve source qualification and conversion",
          priority:
            measurable && applicationRate < 25 ? "High" : "Medium",
          status: "Idea",
          source: "Source intelligence",
        };
      });
  }, [marketing.sources]);

  const metrics = useMemo(() => {
    const highPriority = items.filter(
      (item) => lower(item.priority) === "high"
    ).length;

    const scheduled = items.filter(
      (item) => lower(item.status).includes("scheduled")
    ).length;

    const live = items.filter((item) => {
      const status = lower(item.status);
      return status.includes("published") || status.includes("live");
    }).length;

    return {
      total: items.length,
      highPriority,
      scheduled,
      live,
    };
  }, [items]);

  const filtersActive =
    Boolean(query.trim()) ||
    priorityFilter !== "All" ||
    statusFilter !== "All";

  function clearFilters() {
    setQuery("");
    setPriorityFilter("All");
    setStatusFilter("All");
  }

  async function addItem() {
    const title = draft.title.trim();

    if (!title) {
      setMessage({
        type: "error",
        text: "Add a clear content title before creating the item.",
      });
      return;
    }

    const payload = {
      ...draft,
      title,
      channel: draft.channel.trim(),
      goal: draft.goal.trim(),
      dueDate: draft.dueDate.trim(),
      source: "Marketing OS",
    };

    try {
      setSaving(true);
      setMessage(null);

      if (typeof onCreateContent === "function") {
        const result = await onCreateContent(payload);
        if (result?.error) throw result.error;

        setMessage({
          type: "success",
          text: "Content item saved through the connected workflow.",
        });
      } else {
        setLocalItems((previous) => [
          {
            ...normaliseContentItem(payload, Date.now()),
            id: `local-${Date.now()}`,
            source: "Local planning draft",
          },
          ...previous,
        ]);

        setMessage({
          type: "info",
          text: "Saved as a local planning draft only. No backend content table is connected yet.",
        });
      }

      setDraft({
        title: "",
        channel: "",
        goal: "",
        priority: "Medium",
        status: "Idea",
        dueDate: "",
      });
    } catch (error) {
      console.error("Content planner save failed:", error);
      setMessage({
        type: "error",
        text:
          error?.message ||
          "The content item could not be saved. Your draft has been kept.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(id) {
    const isLocal = String(id).startsWith("local-");

    if (isLocal) {
      setLocalItems((previous) =>
        previous.filter((item) => item.id !== id)
      );
      return;
    }

    if (typeof onDeleteContent !== "function") {
      setMessage({
        type: "info",
        text: "This connected record cannot be deleted from here until a real delete workflow is wired.",
      });
      return;
    }

    try {
      const result = await onDeleteContent(id);
      if (result?.error) throw result.error;
      setMessage({
        type: "success",
        text: "Content record removed through the connected workflow.",
      });
    } catch (error) {
      console.error("Content planner delete failed:", error);
      setMessage({
        type: "error",
        text:
          error?.message ||
          "The content record could not be removed.",
      });
    }
  }

  function addSuggestedIdea(idea) {
    setDraft((previous) => ({
      ...previous,
      title: idea.title,
      channel: idea.channel,
      goal: idea.goal,
      priority: idea.priority,
      status: idea.status,
    }));
    setMessage(null);
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <Lightbulb size={12} />
            Content Planner
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Growth Content Queue
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Plan useful content around real acquisition gaps and student questions.
            Zaifan does not pre-fill fake success stories, outcomes or destination
            claims just to make the planner look busy.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em]">
            Current Queue
          </p>

          <p className="mt-2 text-3xl font-black">{metrics.total}</p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {metrics.highPriority} high priority · {metrics.scheduled} scheduled ·{" "}
            {metrics.live} live/published.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
            Evidence-led planning
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <PlannerMetric
            label="Content Items"
            value={metrics.total}
            helper="Connected records plus local unsaved-backend planning drafts."
            tone="navy"
            icon={FileText}
          />
          <PlannerMetric
            label="High Priority"
            value={metrics.highPriority}
            helper="Ideas marked high priority by the current planning queue."
            tone={metrics.highPriority > 0 ? "amber" : "green"}
            icon={Target}
          />
          <PlannerMetric
            label="Scheduled"
            value={metrics.scheduled}
            helper="Items explicitly marked as scheduled."
            tone="blue"
            icon={CalendarDays}
          />
          <PlannerMetric
            label="Published"
            value={metrics.live}
            helper="Items explicitly marked published or live."
            tone="green"
            icon={CheckCircle2}
          />
        </div>

        {message ? (
          <div
            className={`rounded-[1.2rem] border-2 px-4 py-3 text-sm font-semibold ${
              message.type === "error"
                ? "border-[#FB7185] bg-[#FFF4F4] text-red-800"
                : message.type === "success"
                  ? "border-[#34D399] bg-[#F0FFF8] text-emerald-800"
                  : "border-[#60A5FA] bg-[#F2F7FF] text-blue-800"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <section className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">
                New Content
              </p>
              <h3 className="mt-1 text-lg font-black text-[#10233F]">
                Add a real planning item
              </h3>
            </div>

            <p className="text-xs font-semibold text-slate-500">
              Backend write:{" "}
              <span className="font-black text-[#10233F]">
                {typeof onCreateContent === "function"
                  ? "Connected"
                  : "Local draft only"}
              </span>
            </p>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(15rem,1.2fr)_minmax(10rem,0.8fr)_minmax(12rem,1fr)_8rem_9rem_9rem_auto]">
            <input
              value={draft.title}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  title: event.target.value,
                }))
              }
              placeholder="Content idea..."
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 focus:border-[#F97316]"
            />

            <input
              value={draft.channel}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  channel: event.target.value,
                }))
              }
              placeholder="Channel..."
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 focus:border-[#F97316]"
            />

            <input
              value={draft.goal}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  goal: event.target.value,
                }))
              }
              placeholder="Goal..."
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 focus:border-[#F97316]"
            />

            <select
              value={draft.priority}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  priority: event.target.value,
                }))
              }
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>

            <select
              value={draft.status}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  status: event.target.value,
                }))
              }
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              <option>Idea</option>
              <option>Draft</option>
              <option>Scheduled</option>
              <option>Published</option>
            </select>

            <input
              type="date"
              value={draft.dueDate}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  dueDate: event.target.value,
                }))
              }
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-sm font-semibold text-[#10233F] outline-none focus:border-[#F97316]"
            />

            <button
              type="button"
              onClick={addItem}
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 text-xs font-black text-white transition hover:border-[#F97316] hover:bg-[#102F56] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={14} />
              {saving ? "Saving..." : "Add"}
            </button>
          </div>
        </section>

        {sourceIdeas.length ? (
          <section className="rounded-[1.5rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-blue-700" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.11em] text-blue-700">
                  Source-Informed Ideas
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-600">
                  Suggestions are generated only from currently visible lead-source evidence.
                </p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
              {sourceIdeas.map((idea) => (
                <button
                  key={`${idea.title}-${idea.goal}`}
                  type="button"
                  onClick={() => addSuggestedIdea(idea)}
                  className="rounded-[1.2rem] border-2 border-[#C9D7E6] bg-white p-3 text-left transition hover:border-[#F97316]"
                >
                  <p className="font-black text-[#10233F]">{idea.title}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                    {idea.goal}
                  </p>
                  <span
                    className={`mt-3 inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${priorityTone(
                      idea.priority
                    )}`}
                  >
                    {idea.priority}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <label className="relative block">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search content, channel, goal..."
              className="min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 focus:border-[#F97316]"
            />
          </label>

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
          >
            <option>All</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
          >
            <option>All</option>
            <option>Idea</option>
            <option>Draft</option>
            <option>Scheduled</option>
            <option>Published</option>
          </select>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!filtersActive}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-slate-700 disabled:opacity-40"
          >
            <X size={13} />
            Clear
          </button>
        </div>

        <div className="space-y-2.5">
          {filtered.length ? (
            filtered.map((item) => (
              <ContentRow
                key={item.id}
                item={item}
                onRemove={removeItem}
                canRemove={
                  String(item.id).startsWith("local-") ||
                  typeof onDeleteContent === "function"
                }
              />
            ))
          ) : (
            <div className="rounded-[1.5rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
              <Megaphone size={24} className="mx-auto text-orange-700" />
              <p className="mt-3 font-black text-[#10233F]">
                {items.length
                  ? "No content items match these filters."
                  : "No real content plan yet."}
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                {items.length
                  ? "Clear or change the filters."
                  : "Add your first genuine content idea. Zaifan intentionally does not pre-populate fake success stories or destination claims."}
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-[1.3rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-700" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                  Content Integrity
                </p>
                <p className="mt-1 font-black text-[#10233F]">
                  Real claims only
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Success stories, visa outcomes and admissions claims should only be planned when Zaifan has genuine evidence.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.3rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
            <div className="flex items-start gap-3">
              <Target size={17} className="mt-0.5 shrink-0 text-blue-700" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                  Funnel Connection
                </p>
                <p className="mt-1 font-black text-[#10233F]">
                  Content should solve a real gap
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Source-informed ideas are based on currently visible acquisition evidence, not invented demand.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.3rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-700" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                  Save Boundary
                </p>
                <p className="mt-1 font-black text-[#10233F]">
                  Local draft ≠ database record
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Until a real backend content workflow is wired, newly added items remain local planning drafts only.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
