// AnimatedSection V3 MAXIMUM — Standardized Zaifan Motion Primitive
// src/components/admin/AnimatedSection.jsx
//
// Maximum pass:
// - preserves the existing public API
// - adds reduced-motion support
// - clamps unsafe negative timing values
// - supports optional viewport-based entrance without changing default behavior
// - supports configurable exit direction while preserving current default
// - avoids unnecessary layout animation work
// - keeps one shared Zaifan easing curve across Admin OS
// - remains intentionally lightweight because this is a foundational wrapper

import { motion, useReducedMotion } from "framer-motion";

const ZAIFAN_EASE = [0.22, 1, 0.36, 1];

function safeNumber(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function AnimatedSection({
  children,
  className = "",
  delay = 0,
  y = 18,
  duration = 0.35,
  exitY = null,
  viewport = false,
  viewportAmount = 0.18,
  viewportOnce = true,
  as = "div",
  ...motionProps
}) {
  const shouldReduceMotion = useReducedMotion();

  const safeDelay = Math.max(0, safeNumber(delay, 0));
  const safeDuration = Math.max(0, safeNumber(duration, 0.35));
  const safeY = safeNumber(y, 18);
  const safeExitY =
    exitY === null || exitY === undefined
      ? -safeY
      : safeNumber(exitY, -safeY);

  const MotionElement =
    typeof motion[as] === "function"
      ? motion[as]
      : motion.div;

  const initialState = shouldReduceMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: safeY };

  const visibleState = {
    opacity: 1,
    y: 0,
  };

  const exitState = shouldReduceMotion
    ? { opacity: 0 }
    : { opacity: 0, y: safeExitY };

  const transition = {
    duration: shouldReduceMotion ? 0 : safeDuration,
    delay: shouldReduceMotion ? 0 : safeDelay,
    ease: ZAIFAN_EASE,
  };

  const sharedProps = {
    initial: initialState,
    exit: exitState,
    transition,
    className,
    ...motionProps,
  };

  if (viewport) {
    return (
      <MotionElement
        {...sharedProps}
        whileInView={visibleState}
        viewport={{
          once: viewportOnce,
          amount: viewportAmount,
        }}
      >
        {children}
      </MotionElement>
    );
  }

  return (
    <MotionElement
      {...sharedProps}
      animate={visibleState}
    >
      {children}
    </MotionElement>
  );
}

export default AnimatedSection;
