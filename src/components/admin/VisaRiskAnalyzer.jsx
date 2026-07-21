import { motion } from "framer-motion";
import { AlertTriangle, FileWarning, Stamp } from "lucide-react";

function VisaRiskAnalyzer({ inquiries = [], appointments = [] }) {
  const allLeads = [...inquiries, ...appointments];

  const visaLeads = allLeads.map((lead) => {
    const text = [
      lead.country,
      lead.country_interest,
      lead.field_of_interest,
      lead.study_level,
      lead.consultation_type,
      lead.message,
      lead.notes,
      lead.status,
      lead.appointment_stage,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    let risk = 20;
    const issues = [];

    if (text.includes("visa")) risk += 20;
    if (text.includes("deadline") || text.includes("urgent")) {
      risk += 25;
      issues.push("Urgent visa/deadline signal");
    }
    if (!lead.phone) {
      risk += 15;
      issues.push("Missing phone number");
    }
    if (!lead.email) {
      risk += 10;
      issues.push("Missing email");
    }
    if (text.includes("bank") || text.includes("statement")) risk += 10;
    if (text.includes("rejected") || text.includes("refusal")) {
      risk += 35;
      issues.push("Previous refusal/rejection signal");
    }

    risk = Math.min(100, risk);

    return {
      ...lead,
      risk,
      level: risk >= 75 ? "High" : risk >= 45 ? "Medium" : "Low",
      issues,
      name: lead.full_name || lead.name || "Unnamed Lead",
      country: lead.country || lead.country_interest || "Not selected",
    };
  });

  const high = visaLeads.filter((lead) => lead.level === "High");
  const medium = visaLeads.filter((lead) => lead.level === "Medium");

  return (
    <section className="space-y-5 text-[#10233f]">
      <div className="rounded-[1.8rem] border-2 border-orange-300 bg-[#102f5c] p-6 text-white shadow-[0_16px_40px_rgba(15,35,63,0.14)]">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-300">
          Visa Risk AI
        </p>
        <h2 className="mt-2 text-3xl font-black text-white">
          Visa Risk Analyzer
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-200">
          Detect visa pressure, missing contact details, deadline risk, and refusal signals before they become operational problems.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card icon={Stamp} label="Analyzed" value={visaLeads.length} tone="gold" />
        <Card icon={AlertTriangle} label="High Risk" value={high.length} tone="red" />
        <Card icon={FileWarning} label="Medium Risk" value={medium.length} tone="orange" />
      </div>

      <div className="space-y-3">
        {visaLeads
          .sort((a, b) => b.risk - a.risk)
          .slice(0, 8)
          .map((lead, index) => (
            <motion.div
              key={`${lead.id}-${index}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-[1.5rem] border border-slate-300 bg-white p-5 shadow-[0_6px_18px_rgba(15,35,63,0.04)]"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-black text-[#10233f]">{lead.name}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {lead.country} • Risk Score {lead.risk}/100
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {lead.issues.length ? lead.issues.join(", ") : "No major visa issue detected."}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full border px-4 py-2 text-xs font-black ${
                    lead.level === "High"
                      ? "border-red-300 bg-red-50 text-red-700"
                      : lead.level === "Medium"
                      ? "border-orange-300 bg-orange-50 text-orange-700"
                      : "border-emerald-300 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {lead.level} Risk
                </span>
              </div>
            </motion.div>
          ))}
      </div>
    </section>
  );
}

function Card({ icon: Icon, label, value, tone }) {
  const styles = {
    gold: "border-orange-300 bg-[#fff8ee] text-orange-700",
    red: "border-red-300 bg-red-50 text-red-700",
    orange: "border-orange-300 bg-orange-50 text-orange-700",
  };

  return (
    <div className={`rounded-[1.5rem] border p-5 shadow-[0_6px_18px_rgba(15,35,63,0.035)] ${styles[tone]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] opacity-80">{label}</p>
          <h3 className="mt-2 text-4xl font-black text-[#10233f]">{value}</h3>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
          <Icon size={24} />
        </span>
      </div>
    </div>
  );
}

export default VisaRiskAnalyzer;