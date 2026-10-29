import { useId } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

// Shared building blocks for the multi-country public pages. Styling mirrors
// ItalyGuide (cream #fff7ed, navy #071f50, orange #ff4b12) plus the liquid
// drip motif from the opening intro.

export function Badge({ children, tone = "light" }) {
  const toneClass =
    tone === "dark"
      ? "bg-white/10 text-[#ffb36d] ring-white/15"
      : "bg-white/84 text-[#ff4b12] ring-orange-100";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] shadow-sm ring-1 ${toneClass}`}>
      <Sparkles size={14} fill="currentColor" />
      {children}
    </span>
  );
}

export function SectionHeader({ eyebrow, title, text, align = "center", tone = "light" }) {
  const centered = align === "center";
  const dark = tone === "dark";

  return (
    <div className={centered ? "mx-auto max-w-4xl text-center" : "max-w-4xl"}>
      <Badge tone={tone}>{eyebrow}</Badge>
      <h2
        className={`mt-4 text-3xl font-black leading-[0.98] tracking-[-0.05em] sm:text-4xl md:mt-5 md:text-6xl md:tracking-[-0.06em] ${
          dark ? "text-white" : "text-[#071f50]"
        } ${centered ? "" : "max-w-3xl"}`}
      >
        {title}
      </h2>
      {text && (
        <p
          className={`${centered ? "mx-auto" : ""} mt-3 max-w-3xl text-sm font-semibold leading-7 sm:text-base md:mt-5 md:text-lg md:leading-8 ${
            dark ? "text-white/70" : "text-[#5f6f89]"
          }`}
        >
          {text}
        </p>
      )}
    </div>
  );
}

// Deterministic drip layout so the divider looks hand-poured but never shifts.
const DRIPS = [
  { x: 40, w: 46, l: 34 },
  { x: 150, w: 30, l: 58 },
  { x: 260, w: 54, l: 26 },
  { x: 390, w: 34, l: 72 },
  { x: 520, w: 60, l: 40 },
  { x: 660, w: 28, l: 52 },
  { x: 760, w: 48, l: 30 },
  { x: 880, w: 36, l: 66 },
  { x: 1010, w: 58, l: 36 },
  { x: 1140, w: 30, l: 56 },
  { x: 1250, w: 50, l: 28 },
  { x: 1360, w: 40, l: 48 },
];

// Drips that keep slowly stretching, and the ones that let a droplet fall.
const SWAYING = new Set([150, 390, 660, 880, 1140]);
const FALLING = new Set([390, 880]);

export const ZAIFAN_ORANGE = "#ff4b12";
export const ZAIFAN_NAVY = "#071f50";

const DARK_BACKGROUNDS = new Set([ZAIFAN_NAVY, ZAIFAN_ORANGE, "#071b3a"]);

/**
 * The edge between two sections: the section above pours into the one below,
 * with a few drips stretching and shedding droplets on desktop.
 *
 * `color` is the liquid and `background` the section it lands on. Going into a
 * navy or orange section, the liquid is always the light `above` colour (cream
 * dripping into navy), whatever `color` says; that is the look the site is
 * built around.
 */
export function DripDivider({ color: requestedColor = ZAIFAN_ORANGE, background = ZAIFAN_NAVY, above = "#fff7ed", className = "" }) {
  const filterId = `drip-goo-${useId().replace(/:/g, "")}`;
  const color = DARK_BACKGROUNDS.has(background.toLowerCase()) ? above : requestedColor;

  return (
    <div
      aria-hidden="true"
      className={`relative -mt-px h-16 w-full overflow-hidden sm:h-24 ${className}`}
      // The solid top rows guarantee no hairline between the band and the section above.
      style={{ background: `linear-gradient(to bottom, ${color} 0 6px, ${background} 6px)` }}
    >
      <svg viewBox="0 0 1440 112" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          {/* A generous filter region stops the blur from fading the band's top edge. */}
          <filter id={filterId} x="-5%" y="-50%" width="110%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
          </filter>
        </defs>
        <g filter={`url(#${filterId})`} fill={color}>
          <rect x="-20" y="-40" width="1480" height="56" />
          {DRIPS.map((drip) => (
            <motion.g
              key={drip.x}
              style={{ originY: "0px" }}
              initial={{ scaleY: 0.2 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 1.1, ease: [0.6, 0, 0.3, 1], delay: (drip.x % 7) * 0.04 }}
            >
              <g className={SWAYING.has(drip.x) ? "zaifan-drip-sway" : undefined} style={{ animationDelay: `${(drip.x % 5) * -0.9}s` }}>
                <rect x={drip.x} y="0" width={drip.w} height={drip.l} rx={drip.w / 2} />
                <circle cx={drip.x + drip.w / 2} cy={drip.l} r={drip.w * 0.62} />
              </g>
              {FALLING.has(drip.x) && (
                <circle
                  className="zaifan-drip-fall"
                  cx={drip.x + drip.w / 2}
                  cy={drip.l + drip.w * 0.3}
                  r={drip.w * 0.26}
                  style={{ animationDelay: `${(drip.x % 3) * 1.7}s` }}
                />
              )}
            </motion.g>
          ))}
        </g>
      </svg>
    </div>
  );
}

function starPoints(cx, cy, outer, inner = outer * 0.4, rotation = -90) {
  return Array.from({ length: 10 }, (_, index) => {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = ((rotation + index * 36) * Math.PI) / 180;
    return `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
}

const FLAG_LAYOUT = {
  IT: "vertical",
  FR: "vertical",
  BE: "vertical",
  RO: "vertical",
  DE: "horizontal",
  LT: "horizontal",
};

/** SVG flag, used instead of emoji flags (which don't render on Windows). */
export function FlagMark({ country, className = "h-8 w-12" }) {
  const code = country?.code;
  const colors = country?.flagColors || ["#071f50", "#ffffff", "#ff4b12"];
  const layout = FLAG_LAYOUT[code];

  let body;
  if (code === "EU" || country?.slug === "european-union") {
    body = (
      <>
        <rect width="30" height="20" fill="#003399" />
        {Array.from({ length: 12 }, (_, index) => {
          const angle = (index / 12) * Math.PI * 2;
          return <polygon key={index} points={starPoints(15 + Math.cos(angle) * 6, 10 + Math.sin(angle) * 6, 1.1)} fill="#ffcc00" />;
        })}
      </>
    );
  } else if (code === "TR") {
    body = (
      <>
        <rect width="30" height="20" fill="#e30a17" />
        <circle cx="11.5" cy="10" r="5" fill="#ffffff" />
        <circle cx="12.8" cy="10" r="4" fill="#e30a17" />
        <polygon points={starPoints(18.2, 10, 2.4, 1, 0)} fill="#ffffff" />
      </>
    );
  } else if (code === "CN") {
    body = (
      <>
        <rect width="30" height="20" fill="#de2910" />
        <polygon points={starPoints(5.5, 5.5, 3)} fill="#ffde00" />
        <polygon points={starPoints(10.5, 2.5, 1)} fill="#ffde00" />
        <polygon points={starPoints(12.5, 4.8, 1)} fill="#ffde00" />
        <polygon points={starPoints(12.5, 7.8, 1)} fill="#ffde00" />
        <polygon points={starPoints(10.5, 10, 1)} fill="#ffde00" />
      </>
    );
  } else if (code === "VN") {
    body = (
      <>
        <rect width="30" height="20" fill="#da251d" />
        <polygon points={starPoints(15, 10.4, 6)} fill="#ffcd00" />
      </>
    );
  } else if (layout === "horizontal") {
    body = colors.map((color, index) => (
      <rect key={index} y={(20 / 3) * index} width="30" height={20 / 3 + 0.2} fill={color} />
    ));
  } else {
    body = colors.map((color, index) => (
      <rect key={index} x={10 * index} width={10.2} height="20" fill={color} />
    ));
  }

  return (
    <svg
      viewBox="0 0 30 20"
      className={`shrink-0 overflow-hidden rounded-[6px] shadow-[0_6px_16px_rgba(7,31,80,0.18)] ring-1 ring-black/5 ${className}`}
      role="img"
      aria-label={`${country?.name || "Country"} flag`}
    >
      {body}
    </svg>
  );
}

// Hand-placed drips for the 1200 x 60 HangingDrips canvas.
const HANGING = [
  { x: 110, w: 34, l: 22 },
  { x: 270, w: 22, l: 32 },
  { x: 490, w: 40, l: 16 },
  { x: 700, w: 26, l: 34 },
  { x: 880, w: 32, l: 24 },
  { x: 1050, w: 22, l: 30 },
];

/**
 * Drips hanging off the bottom edge of a card. Place it inside a `relative`
 * wrapper together with the card, rendered before it: the strip the drips hang
 * from tucks up behind the card's bottom edge so they pour straight out of it.
 * It spans 6%–94% of the card width (10%–90% on phones, clear of the rounded
 * corners), and the default fill matches ConsultationBand's orange gradient.
 */
export function HangingDrips({ color, className = "" }) {
  const id = useId().replace(/:/g, "");
  const filterId = `hang-goo-${id}`;
  const gradientId = `hang-fill-${id}`;

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 60"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-x-[10%] top-full h-10 -translate-y-2 sm:inset-x-[6%] sm:h-[60px] sm:-translate-y-2.5 ${className}`}
    >
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="-82" y1="0" x2="1282" y2="0">
          <stop offset="0" stopColor="#ff7b1c" />
          <stop offset="0.5" stopColor={ZAIFAN_ORANGE} />
          <stop offset="1" stopColor="#ff7b1c" />
        </linearGradient>
        <filter id={filterId} x="-5%" y="-20%" width="110%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`} fill={color || `url(#${gradientId})`}>
        <rect x="-20" y="-20" width="1240" height="24" />
        {HANGING.map((drip) => (
          <motion.g
            key={drip.x}
            style={{ originY: "0px" }}
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 1.3, ease: [0.6, 0, 0.3, 1], delay: 0.25 + (drip.x % 5) * 0.08 }}
          >
            <g className="zaifan-drip-sway" style={{ animationDelay: `${(drip.x % 7) * -0.8}s` }}>
              <rect x={drip.x} y="0" width={drip.w} height={drip.l} rx={drip.w / 2} />
              <circle cx={drip.x + drip.w / 2} cy={drip.l} r={drip.w * 0.62} />
            </g>
          </motion.g>
        ))}
      </g>
    </svg>
  );
}

export function ConsultationBand({ title, text, to, label = "Book a free consultation" }) {
  return (
    <section className="px-4 pb-24 sm:px-5 md:pb-28">
      <div className="relative mx-auto max-w-[1350px]">
        <div className="relative overflow-hidden rounded-[34px] bg-gradient-to-r from-[#ff7b1c] via-[#ff4b12] to-[#ff7b1c] p-7 text-white shadow-[0_30px_90px_rgba(255,75,18,0.28)] sm:rounded-[42px] md:p-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border-[36px] border-white/10" />
          <div className="pointer-events-none absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-amber-300/30 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-black leading-[1] tracking-[-0.05em] md:text-5xl">{title}</h2>
              <p className="mt-3 text-sm font-semibold leading-7 text-white/85 md:text-base">{text}</p>
            </div>
            <Link
              to={to}
              className="inline-flex shrink-0 items-center justify-center gap-3 rounded-full bg-[#071f50] px-7 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(7,31,80,0.35)] transition hover:-translate-y-1 hover:bg-[#0b2a6b] md:px-9 md:py-5 md:text-base"
            >
              {label}
              <ArrowRight size={20} strokeWidth={3} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HonestyNote({ lastReviewed, sources = [] }) {
  return (
    <div className="mx-auto mt-10 max-w-[1350px] rounded-[26px] bg-white/80 p-5 text-xs font-semibold leading-6 text-[#61708a] ring-1 ring-orange-100 md:p-6 md:text-sm">
      <p>
        <span className="font-black text-[#071f50]">Honest guidance:</span> fees, scholarship rules and visa amounts change
        every year. Figures here are approximate and were last reviewed in {lastReviewed}. Always confirm with the
        university or embassy. We do this for you during your consultation.
      </p>
      {sources.length > 0 && (
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <span className="font-black text-[#071f50]">Official sources:</span>
          {sources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="font-black text-[#ff4b12] underline-offset-4 hover:underline"
            >
              {source.label}
            </a>
          ))}
        </p>
      )}
    </div>
  );
}
