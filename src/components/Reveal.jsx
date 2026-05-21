import { motion } from "framer-motion";

function Reveal({
  children,
  delay = 0,
  y = 50,
  x = 0,
  duration = 0.75,
  once = true,
  className = "",
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y,
        x,
        filter: "blur(8px)",
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        x: 0,
        filter: "blur(0px)",
      }}
      viewport={{
        once,
        amount: 0.2,
      }}
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

export default Reveal;