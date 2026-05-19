import { motion } from "framer-motion";

function Process() {
  const steps = [
    {
      number: "01",
      title: "Profile Evaluation",
      text: "We analyze academics, budget, goals and study preferences before suggesting options.",
    },
    {
      number: "02",
      title: "Country Selection",
      text: "Students are guided toward countries and universities suitable for their profile.",
    },
    {
      number: "03",
      title: "Application Process",
      text: "We assist with university applications, SOPs and required documentation.",
    },
    {
      number: "04",
      title: "Visa Preparation",
      text: "Complete support for financial documents, interview preparation and visa filing.",
    },
    {
      number: "05",
      title: "Departure Support",
      text: "Students receive final guidance before travelling abroad for studies.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#111111] py-32 px-6 text-white">

      {/* Glow */}
      <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-amber-300/10 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 45 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85 }}
          viewport={{ once: true }}
          className="max-w-3xl"
        >
          <span className="text-base md:text-lg uppercase tracking-[0.3em] font-semibold text-amber-200/70">
            Process
          </span>

          <h2 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Your study abroad journey{" "}
            <span className="text-[#D4AF37]">step by step.</span>
          </h2>

          <p className="mt-5 text-lg leading-relaxed text-gray-400">
            A structured process designed to make international admissions simple and clear.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="mt-20 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 55 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.65,
                delay: index * 0.08,
              }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl transition duration-500 hover:border-[#D4AF37]/30"
            >

              {/* Hover Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100"></div>

              {/* Number */}
              <div className="relative z-10 text-5xl font-extrabold text-[#D4AF37]/35">
                {step.number}
              </div>

              {/* Title */}
              <h3 className="relative z-10 mt-8 text-2xl font-bold leading-snug">
                {step.title}
              </h3>

              {/* Text */}
              <p className="relative z-10 mt-4 leading-relaxed text-gray-400">
                {step.text}
              </p>

              {/* Line */}
              <div className="relative z-10 mt-8 h-[2px] w-0 bg-[#D4AF37] transition-all duration-500 group-hover:w-full"></div>

            </motion.div>
          ))}

        </div>

      </div>
    </section>
  );
}

export default Process;