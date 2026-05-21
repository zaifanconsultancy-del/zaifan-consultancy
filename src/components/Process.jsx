import { motion } from "framer-motion";

function Process() {
  const steps = [
    {
      number: "01",
      title: "Profile Evaluation",
      text: "We analyze academics, budget, goals and study preferences before suggesting suitable options.",
    },
    {
      number: "02",
      title: "Country Selection",
      text: "Students are guided toward countries and universities that match their profile.",
    },
    {
      number: "03",
      title: "Documents Preparation",
      text: "We assist with SOPs, motivation letters and required academic documentation.",
    },
    {
      number: "04",
      title: "Application Submission",
      text: "University applications are prepared carefully with a structured admission approach.",
    },
    {
      number: "05",
      title: "Visa Guidance",
      text: "Complete support for financial documents, interview preparation and visa filing.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#111111] px-6 py-32 text-white">
      <div className="absolute left-[-10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-amber-300/10 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 45 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85 }}
          viewport={{ once: true }}
          className="max-w-3xl"
        >
          <span className="text-base font-semibold uppercase tracking-[0.3em] text-amber-200/70 md:text-lg">
            Process
          </span>

          <h2 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Your study abroad journey{" "}
            <span className="text-[#D4AF37]">step by step.</span>
          </h2>

          <p className="mt-5 text-lg leading-relaxed text-gray-400">
            A structured process designed to make international admissions
            simple, clear and properly guided.
          </p>
        </motion.div>

        <div className="relative mt-24">
          <div className="absolute left-4 top-0 hidden h-full w-px bg-gradient-to-b from-[#D4AF37] via-white/10 to-transparent lg:block"></div>

          <div className="space-y-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -35 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.65,
                  delay: index * 0.08,
                }}
                viewport={{ once: true }}
                className="relative lg:pl-16"
              >
                <div className="absolute left-0 top-8 hidden h-9 w-9 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#111111] text-xs font-bold text-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.18)] lg:flex">
                  {step.number}
                </div>

                <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[#D4AF37]/35 hover:bg-white/[0.055]">
                  <div className="absolute inset-x-0 top-0 h-[3px] scale-x-0 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition duration-500 group-hover:scale-x-100"></div>

                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                        Step {step.number}
                      </p>

                      <h3 className="mt-3 text-2xl font-bold text-white md:text-3xl">
                        {step.title}
                      </h3>
                    </div>

                    <p className="max-w-xl leading-relaxed text-gray-400">
                      {step.text}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Process;