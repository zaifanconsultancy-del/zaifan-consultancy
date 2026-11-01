import { useEffect, useState } from "react";

/** Which step's section is crossing the middle of the screen. */
export default function useActiveStep(steps, key) {
  const [active, setActive] = useState(steps[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setActive(entry.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    steps.forEach((step) => {
      const element = document.getElementById(step.id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [steps, key]);

  return active;
}
