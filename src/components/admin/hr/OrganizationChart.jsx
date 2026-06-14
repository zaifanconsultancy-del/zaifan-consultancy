import React from "react";

function DepartmentCard({ department }) {
  const width = Math.max(4, Math.min(100, department.avgPerformance || 0));

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-lg font-black text-white">{department.name}</p>
          <p className="mt-1 text-sm text-slate-400">{department.headcount} people · {department.active} active</p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs lg:min-w-[260px]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
            <p className="font-black text-white">{department.tasks}</p>
            <p className="text-slate-500">Tasks</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
            <p className="font-black text-white">{department.applications}</p>
            <p className="text-slate-500">Apps</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
            <p className="font-black text-white">{department.avgPerformance}%</p>
            <p className="text-slate-500">Perf</p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs">
          <span className="font-bold text-slate-500">Department performance</span>
          <span className="text-slate-300">{department.avgPerformance}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-white" style={{ width: `${width}%` }} />
        </div>
      </div>
    </article>
  );
}

export default function OrganizationChart({ hr = {}, compact = false }) {
  const departments = hr.departments || [];
  const visible = compact ? departments.slice(0, 4) : departments;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-violet-300">Organization Chart</p>
        <h2 className="mt-2 text-2xl font-black text-white">Department Structure</h2>
        <p className="mt-1 text-sm text-slate-400">Founder-level view of departments, headcount, workload, and performance.</p>
      </div>

      <div className="space-y-3">
        {visible.length ? visible.map((department) => <DepartmentCard key={department.name} department={department} />) : (
          <div className="rounded-3xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm font-black text-white">No department structure found.</p>
            <p className="mt-2 text-sm text-slate-400">Departments will populate from employee/team records.</p>
          </div>
        )}
      </div>
    </section>
  );
}
