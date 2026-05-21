import { useEffect, useState } from "react";

function CursorGlow() {
  const [position, setPosition] = useState({
    x: 50,
    y: 50,
  });

  useEffect(() => {
    const moveCursor = (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;

      setPosition({ x, y });
    };

    window.addEventListener("mousemove", moveCursor);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[2] opacity-70"
      style={{
        background: `radial-gradient(circle at ${position.x}% ${position.y}%, rgba(212,175,55,0.07), transparent 22%)`,
      }}
    />
  );
}

export default CursorGlow;