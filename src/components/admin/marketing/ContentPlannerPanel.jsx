import React, { useMemo, useState } from "react";

const DEFAULT_CONTENT = [
  { title: "UK Student Visa Checklist", channel: "Instagram / Blog", goal: "Visa readiness", priority: "High" },
  { title: "Top Affordable UK Universities", channel: "YouTube / Reels", goal: "Lead generation", priority: "High" },
  { title: "CAS Explained for Pakistani Students", channel: "Short video", goal: "CAS education", priority: "Medium" },
  { title: "Documents Needed Before Applying", channel: "Carousel", goal: "Document quality", priority: "High" },
  { title: "Student Success Story", channel: "Social proof", goal: "Trust", priority: "Medium" },
];

function priorityTone(priority = "") {
  const value = String(priority || "").toLowerCase();
  if (value.includes("high")) return "border-rose-400/25 bg-rose-400/10 text-rose-100";
  if (value.includes("medium")) return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  return "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";
}

export default function ContentPlannerPanel({ marketing = {} }) {
  const [items, setItems] = useState(DEFAULT_CONTENT);
  const [draft, setDraft] = useState({ title: "", channel: "", goal: "", priority: "Medium" });

  const sourceIdeas = useMemo(() => {
    return (marketing.sources || []).slice(0, 3).map((source) => ({
      title: `Campaign for ${source.name} leads`,
      channel: "Organic + paid retargeting",
      goal: `${source.applicationRate}% lead-to-application improvement`,
      priority: source.applicationRate < 25 ? "High" : "Medium",
    }));
  }, [marketing.sources]);

  function addItem() {
    if (!draft.title.trim()) return;
    setItems((previous) => [{ ...draft }, ...previous]);
    setDraft({ title: "", channel: "", goal: "", priority: "Medium" });
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">Content Planner</p>
        <h2 className="mt-2 text-2xl font-black text-white">Growth Content Queue</h2>
        <p className="mt-1 text-sm text-slate-400">Plan content that fixes funnel blockers and creates new demand.</p>
      </div>

      <div className="mb-5 rounded-3xl border border-white/10 bg-slate-950/50 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_0.7fr_0.7fr_180px_auto]">
          <input value={draft.title} onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))} placeholder="Content idea..." className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" />
          <input value={draft.channel} onChange={(event) => setDraft((prev) => ({ ...prev, channel: event.target.value }))} placeholder="Channel..." className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" />
          <input value={draft.goal} onChange={(event) => setDraft((prev) => ({ ...prev, goal: event.target.value }))} placeholder="Goal..." className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" />
          <select value={draft.priority} onChange={(event) => setDraft((prev) => ({ ...prev, priority: event.target.value }))} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none">
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <button type="button" onClick={addItem} className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-100 hover:bg-emerald-400/20">Add</button>
        </div>
      </div>

      {sourceIdeas.length ? (
        <div className="mb-5 grid gap-3 lg:grid-cols-3">
          {sourceIdeas.map((idea) => (
            <div key={idea.title} className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-4">
              <p className="font-black text-white">{idea.title}</p>
              <p className="mt-2 text-sm text-slate-400">{idea.goal}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3">
        {items.map((item, index) => (
          <article key={`${item.title}-${index}`} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr_0.7fr_0.3fr] lg:items-center">
              <p className="font-black text-white">{item.title}</p>
              <p className="text-sm text-slate-400">{item.channel}</p>
              <p className="text-sm text-slate-400">{item.goal}</p>
              <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${priorityTone(item.priority)}`}>{item.priority}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
