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
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default AnimatedSection;
