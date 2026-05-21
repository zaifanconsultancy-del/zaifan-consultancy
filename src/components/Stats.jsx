import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

function Counter({ end, duration = 2000, start }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let current = 0;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      current += increment;

      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end, duration, start]);

  return count;
}

function Stats() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.35 });

  const stats = [
    { number: 500, suffix: "+", label: "Students Guided" },
    { number: 98, suffix: "%", label: "Visa Success" },
    { number: 15, suffix: "+", label: "Countries" },
    { number: 24, suffix: "/7", label: "Support" },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#0d0d0d] px-6 py-28 text-white"
    >
      <div className="absolute left-[-10%] top-[-20%] h-[420px] w-[420px] rounded-full bg-[#D4AF37]/10 blur-3xl"></div>

      <div className="relative mx-auto grid max-w-7xl gap-7 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 45 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: index * 0.12 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
            className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-10 text-center backdrop-blur-xl transition duration-500 hover:border-[#D4AF37]/40 hover:bg-white/[0.06]"
          >
            <h2 className="text-5xl font-extrabold text-[#D4AF37]">
              <Counter end={item.number} start={isInView} />
              {item.suffix}
            </h2>

            <p className="mt-4 text-lg text-gray-400">{item.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default Stats;