import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function toCells(text, length) {
  const clean = String(text).toUpperCase().slice(0, length);
  const padding = length - clean.length;
  const left = Math.floor(padding / 2);
  return (" ".repeat(left) + clean + " ".repeat(padding - left)).split("");
}

/**
 * Airport-board text: when `text` changes, every cell shuffles through random
 * letters and settles left to right. Returns the characters to draw.
 */
function useFlapText(text, length) {
  const reduceMotion = useReducedMotion();
  const target = toCells(text, length);
  const [cells, setCells] = useState(target);
  const key = target.join("");

  useEffect(() => {
    if (reduceMotion) return undefined;
    const goal = key.split("");
    let tick = 0;
    const timer = window.setInterval(() => {
      tick += 1;
      setCells(
        goal.map((char, index) => {
          if (tick >= index * 1.4 + 6) return char;
          if (char === " " && tick > 3) return " ";
          return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
        })
      );
      if (tick > goal.length * 1.4 + 6) window.clearInterval(timer);
    }, 55);
    return () => window.clearInterval(timer);
  }, [key, reduceMotion]);

  return reduceMotion ? target : cells;
}

const SIZES = {
  lg: "h-[42px] w-[30px] text-[24px] rounded-[7px] sm:h-[76px] sm:w-[56px] sm:text-[46px] sm:rounded-[11px]",
  xl: "h-[46px] w-[32px] text-[26px] rounded-[8px] sm:h-[78px] sm:w-[58px] sm:text-[48px] lg:h-[104px] lg:w-[76px] lg:text-[66px] lg:rounded-[14px]",
  md: "h-9 w-7 text-xl rounded-md sm:h-11 sm:w-8 sm:text-2xl",
  sm: "h-7 w-[22px] text-sm rounded-[5px]",
};

/** A row of split-flap tiles. Each tile re-flips when its character changes. */
export function SplitFlapRow({ text, length = text.length, size = "md", tone = "navy", className = "" }) {
  const cells = useFlapText(text, length);
  const toneClass =
    tone === "orange"
      ? "bg-[linear-gradient(180deg,#ff6a2a_0%,#ff5a1c_49.5%,#e8440f_50.5%,#ff4b12_100%)] text-white"
      : "bg-[linear-gradient(180deg,#0d2a63_0%,#0a2558_49.5%,#061a42_50.5%,#071f50_100%)] text-[#fff7ed]";

  return (
    <div className={`flex justify-center gap-[3px] sm:gap-1.5 ${className}`} aria-label={text} role="img">
      {cells.map((char, index) => (
        <span
          // Cells are fixed positions on the board, so the index is the identity.
          key={index}
          aria-hidden="true"
          className={`zaifan-flap-tile relative grid place-items-center overflow-hidden font-black leading-none shadow-[inset_0_-2px_0_rgba(0,0,0,0.25),0_6px_14px_rgba(7,31,80,0.18)] ${SIZES[size]} ${toneClass}`}
        >
          <span key={char} className="zaifan-flap-char">
            {char === " " ? " " : char}
          </span>
        </span>
      ))}
    </div>
  );
}
