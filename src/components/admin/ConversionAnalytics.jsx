import { motion } from "framer-motion";

function ConversionAnalytics({ cardClass = "", inquiries = [], appointments = [] }) {
  const inquiryStages = [
    "new",
    "contacted",
    "documents_pending",
    "applied",
    "offer_letter",
    "visa_process",
    "approved",
  ];

  const appointmentStages = [
    "new_booking",
    "confirmed",
    "consultation_done",
    "follow_up_needed",
    "converted_to_lead",
    "not_interested",
    "cancelled",
  ];

  const inquiryCounts = inquiryStages.map((stage) => ({
    stage,
    label: stage.replaceAll("_", " "),
    count: inquiries.filter((item) => (item.status || "new") === stage).length,
  }));

  const appointmentCounts = appointmentStages.map((stage) => ({
    stage,
    label: stage.replaceAll("_", " "),
    count: appointments.filter(
      (item) => (item.appointment_stage || "new_booking") === stage
    ).length,
  }));

  return (
    <motion.section
      key="conversion-analytics"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`${cardClass} p-6 sm:p-8`}
    >
      <p className="text-[11px] uppercase tracking-[0.35em] text-[#D4AF37]">
        Pipeline Intelligence
      </p>

      <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
        Conversion Analytics
      </h2>

      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
        Visual breakdown of where students are sitting inside inquiry and
        appointment pipelines.
      </p>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <PipelineColumn title="Inquiry Pipeline" items={inquiryCounts} />
        <PipelineColumn title="Appointment Pipeline" items={appointmentCounts} />
      </div>
    </motion.section>
  );
}

function PipelineColumn({ title, items = [] }) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <div className="rounded-[1.7rem] border border-white/10 bg-black/25 p-5">
      <h3 className="text-lg font-black text-white">{title}</h3>

      <div className="mt-5 space-y-4">
        {items.map((item) => {
          const width = Math.max((item.count / max) * 100, item.count > 0 ? 8 : 2);

          return (
            <div key={item.stage}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-bold capitalize text-gray-300">
                  {item.label}
                </p>
                <span className="text-xs font-black text-[#D4AF37]">
                  {item.count}
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 0.6 }}
                  className="h-full rounded-full bg-[#D4AF37]"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ConversionAnalytics;