import { motion } from "framer-motion";
import { useRef } from "react";

function MagneticButton({
  children,
  className = "",
  onClick,
  href,
}) {
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    const element = ref.current;

    if (!element) return;

    const rect = element.getBoundingClientRect();

    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    element.style.transform = `translate(${x * 0.12}px, ${
      y * 0.12
    }px)`;
  };

  const handleMouseLeave = () => {
    const element = ref.current;

    if (!element) return;

    element.style.transform = `translate(0px, 0px)`;
  };

  const Component = href ? "a" : "button";

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      transition={{
        type: "spring",
        stiffness: 150,
        damping: 15,
      }}
      className="inline-block transition-transform duration-200"
    >
      <Component
        href={href}
        onClick={onClick}
        className={className}
      >
        {children}
      </Component>
    </motion.div>
  );
}

export default MagneticButton;