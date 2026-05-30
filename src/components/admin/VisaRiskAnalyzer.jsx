import { motion } from "framer-motion";
import { AlertTriangle, FileWarning, Globe2, ShieldCheck, Stamp } from "lucide-react";

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
    <section className="space-y-5">
      <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/10 via-white/[0.035] to-black/40 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]">
          Visa Risk AI
        </p>
        <h2 className="mt-2 text-3xl font-black text-white">
          Visa Risk Analyzer
        </h2>
        <p className="mt-2 text-sm text-white/50">
          Detects visa pressure, missing contact details, deadline risk, and refusal signals.
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
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-black text-white">{lead.name}</h3>
                  <p className="mt-1 text-xs text-white/45">
                    {lead.country} • Risk Score {lead.risk}/100
                  </p>
                  <p className="mt-2 text-sm text-white/55">
                    {lead.issues.length ? lead.issues.join(", ") : "No major visa issue detected."}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full border px-4 py-2 text-xs font-black ${
                    lead.level === "High"
                      ? "border-red-400/20 bg-red-500/10 text-red-300"
                      : lead.level === "Medium"
                      ? "border-orange-400/20 bg-orange-500/10 text-orange-300"
                      : "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
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
    gold: "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]",
    red: "border-red-400/20 bg-red-500/10 text-red-300",
    orange: "border-orange-400/20 bg-orange-500/10 text-orange-300",
  };

  return (
    <div className={`rounded-[1.5rem] border p-5 ${styles[tone]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs opacity-75">{label}</p>
          <h3 className="mt-2 text-4xl font-black">{value}</h3>
        </div>
        <Icon size={28} />
      </div>
    </div>
  );
}

export default VisaRiskAnalyzer;