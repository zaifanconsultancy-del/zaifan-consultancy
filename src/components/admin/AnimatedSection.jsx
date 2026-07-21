// AnimatedSection V2 — Standardized Zaifan Motion
// Preserves the same reusable entrance/exit wrapper while aligning easing
// with the smoother shared Zaifan Admin OS motion language.

import { motion } from "framer-motion";

function AnimatedSection({
  children,
  className = "",
  delay = 0,
  y = 18,
  duration = 0.35,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -y }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default AnimatedSection;