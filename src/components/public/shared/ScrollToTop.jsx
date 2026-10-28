import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      // Jump instantly: smooth-scrolling up from deep in a long page made every
      // navigation feel slow.
      window.scrollTo({ top: 0, behavior: "instant" });
      return undefined;
    }

    // Links like /countries#documents: pages load lazily, so keep looking for
    // the section for up to two seconds.
    let tries = 0;
    const timer = window.setInterval(() => {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      tries += 1;
      if (target || tries > 40) {
        window.clearInterval(timer);
        target?.scrollIntoView({ behavior: "instant" });
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [pathname, hash]);

  return null;
}

export default ScrollToTop;
