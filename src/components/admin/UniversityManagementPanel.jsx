import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import UniversitySelector from "./UniversitySelector";
import ProgramTracker from "./ProgramTracker";

function UniversityManagementPanel({ student = {} }) {
  const [shortlist, setShortlist] = useState([]);
  const [form, setForm] = useState({
    university: "",
    country: "",
    program: "",
    intake: "",
    status: "shortlisted",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const studentId = student?.id;
  const studentType = student?.student_type || student?.type || "inquiry";

  const country =
    student?.country ||
    student?.preferred_country ||
    student?.country_interest ||
    "Not selected";

  const program =
    student?.program ||
    student?.field_of_interest ||
    student?.course ||
    "Not selected";

  useEffect(() => {
    loadShortlist();
  }, [studentId]);

  const loadShortlist = async () => {
    if (!studentId) return;

    setError("");

    const { data, error } = await supabase
      .from("student_universities")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else setShortlist(data || []);
  };

  const saveUniversity = async () => {
    if (!studentId || !form.university.trim()) return;

    setSaving(true);
    setError("");

    const { error } = await supabase.from("student_universities").insert({
      student_id: studentId,
      student_type: studentType,
      university: form.university,
      country: form.country || country,
      program: form.program || program,
      intake: form.intake,
      status: form.status,
      notes: form.notes,
    });

    if (error) {
      setError(error.message);
    } else {
      setForm({
        university: "",
        country: "",
        program: "",
        intake: "",
        status: "shortlisted",
        notes: "",
      });
      await loadShortlist();
    }

    setSaving(false);
  };

  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from("student_universities")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) setError(error.message);
    else await loadShortlist();
  };

  const stats = useMemo(() => {
    return {
      total: shortlist.length,
      shortlisted: shortlist.filter((item) => item.status === "shortlisted")
        .length,
      applied: shortlist.filter((item) => item.status === "applied").length,
      offer: shortlist.filter((item) => item.status === "offer_received")
        .length,
    };
  }, [shortlist]);

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.05] p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">
          University Management
        </p>

        <h2 className="mt-2 text-2xl font-black text-white">
          Destination Planning Center
        </h2>

        <p className="mt-2 text-white/60">
          Manage university planning, shortlists, program matching, scholarships,
          and intakes.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <PlanningCard label="Target Country" value={country} />
        <PlanningCard label="Target Program" value={program} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total Options" value={stats.total} />
        <MetricCard label="Shortlisted" value={stats.shortlisted} />
        <MetricCard label="Applied" value={stats.applied} />
        <MetricCard label="Offers" value={stats.offer} />
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6">
        <h3 className="font-bold text-white">Add University Option</h3>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Input
            label="University"
            value={form.university}
            onChange={(value) => setForm({ ...form, university: value })}
          />

          <Input
            label="Country"
            value={form.country}
            placeholder={country}
            onChange={(value) => setForm({ ...form, country: value })}
          />

          <Input
            label="Program"
            value={form.program}
            placeholder={program}
            onChange={(value) => setForm({ ...form, program: value })}
          />

          <Input
            label="Intake"
            value={form.intake}
            placeholder="Sep 2026"
            onChange={(value) => setForm({ ...form, intake: value })}
          />

          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-[0.18em] text-white/35">
              Notes
            </p>

            <textarea
              value={form.notes}
              onChange={(event) =>
                setForm({ ...form, notes: event.target.value })
              }
              placeholder="Scholarship, tuition, entry requirements, ranking..."
              className="mt-2 min-h-[110px] w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#D4AF37]/40"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={saveUniversity}
          disabled={saving || !form.university.trim()}
          className="mt-5 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-black text-black transition hover:-translate-y-0.5 hover:bg-[#E7C768] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Add University"}
        </button>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6">
        <h3 className="font-bold text-white">Saved University Shortlist</h3>

        <div className="mt-5 space-y-3">
          {shortlist.length ? (
            shortlist.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-white">
                      {item.university}
                    </p>

                    <p className="mt-1 text-sm text-white/50">
                      {item.country || "No country"} •{" "}
                      {item.program || "No program"} •{" "}
                      {item.intake || "No intake"}
                    </p>

                    {item.notes ? (
                      <p className="mt-2 text-sm text-white/45">
                        {item.notes}
                      </p>
                    ) : null}
                  </div>

                  <select
                    value={item.status || "shortlisted"}
                    onChange={(event) => updateStatus(item.id, event.target.value)}
                    className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                  >
                    <option className="bg-black" value="shortlisted">
                      shortlisted
                    </option>
                    <option className="bg-black" value="applied">
                      applied
                    </option>
                    <option className="bg-black" value="offer_received">
                      offer received
                    </option>
                    <option className="bg-black" value="rejected">
                      rejected
                    </option>
                  </select>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/40">
              No university options saved yet.
            </p>
          )}
        </div>
      </div>

      <UniversitySelector student={student} />
      <ProgramTracker student={student} />
    </div>
  );
}

function PlanningCard({ label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <p className="mt-3 break-words text-lg font-black text-white">{value}</p>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black text-[#D4AF37]">{value}</p>
    </div>
  );
}

function Input({ label, value, onChange, placeholder = "" }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <input
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder || `Enter ${label}`}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#D4AF37]/40"
      />
    </div>
  );
}

export default UniversityManagementPanel;