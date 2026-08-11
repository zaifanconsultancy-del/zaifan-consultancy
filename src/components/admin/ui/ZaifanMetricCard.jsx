// ZaifanMetricCard V6 — Shared Partner OS Card Family
// Full replacement for: src/components/admin/ui/ZaifanMetricCard.jsx
//
// BENCHMARK:
// The approved Student OS Mission Control KPI cards.
// One visual family, three hierarchy levels:
// - boss: large metric/summary CARD only
// - coBoss: normal KPI/summary card — primary benchmark
// - baby: compact metric/status block
//
// IMPORTANT:
// This component is presentation-only.
// It must NOT replace orange/navy hero panels, workspace shells, tables,
// forms, alerts, navigation, or other structural Admin surfaces.

function ZaifanMetricCard({
  label,
  value,
  detail = "",
  icon: Icon = null,
  iconText = "",
  tone = "navy",
  level = "coBoss",
  surface = "light",
  className = "",
  footer = null,
}) {
  const visual = getToneVisual(tone);
  const isNavySurface = surface === "navy";

  if (level === "boss") {
    return (
      <article
        className={`group relative min-w-0 overflow-hidden rounded-[1.55rem] border-[3px] p-5 shadow-[0_10px_28px_rgba(18,56,101,0.07)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_15px_34px_rgba(18,56,101,0.11)] sm:p-6 ${className}`}
        style={
          isNavySurface
            ? {
                borderColor: "rgba(255,255,255,0.28)",
                backgroundColor: "rgba(255,255,255,0.10)",
              }
            : {
                borderColor: visual.border,
                backgroundColor: visual.background,
              }
        }
      >
        <div className="flex min-w-0 items-start justify-between gap-5">
          <div className="min-w-0">
            <p
              className={`break-words text-[10px] font-black uppercase leading-4 tracking-[0.18em] ${
                isNavySurface ? "text-white/75" : "text-[#5F7088]"
              }`}
            >
              {label}
            </p>

            <p
              className={`mt-3 break-words text-4xl font-black leading-none tracking-[-0.035em] sm:text-5xl ${
                isNavySurface ? "text-white" : visual.valueClass
              }`}
            >
              {value}
            </p>

            {detail ? (
              <p
                className={`mt-3 max-w-xl break-words text-xs font-semibold leading-5 sm:text-sm sm:leading-6 ${
                  isNavySurface ? "text-white/80" : "text-[#52667F]"
                }`}
              >
                {detail}
              </p>
            ) : null}
          </div>

          <CardIcon
            Icon={Icon}
            iconText={iconText}
            visual={visual}
            surface={surface}
            size="boss"
          />
        </div>

        {footer ? <div className="mt-4">{footer}</div> : null}
      </article>
    );
  }

  if (level === "baby") {
    return (
      <article
        className={`group min-w-0 rounded-[1.15rem] border-2 p-3.5 shadow-[0_5px_14px_rgba(18,56,101,0.045)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(18,56,101,0.075)] ${className}`}
        style={
          isNavySurface
            ? {
                borderColor: "rgba(255,255,255,0.26)",
                backgroundColor: "rgba(255,255,255,0.09)",
              }
            : {
                borderColor: visual.border,
                backgroundColor: visual.background,
              }
        }
      >
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={`break-words text-[8px] font-black uppercase leading-3 tracking-[0.12em] ${
                isNavySurface ? "text-white/74" : "text-[#65758B]"
              }`}
            >
              {label}
            </p>

            <p
              className={`mt-1.5 break-words text-2xl font-black leading-none tracking-[-0.025em] ${
                isNavySurface ? "text-white" : visual.valueClass
              }`}
            >
              {value}
            </p>
          </div>

          <CardIcon
            Icon={Icon}
            iconText={iconText}
            visual={visual}
            surface={surface}
            size="baby"
          />
        </div>

        {detail ? (
          <p
            className={`mt-2 break-words text-[10px] font-semibold leading-4 ${
              isNavySurface ? "text-white/72" : "text-[#596B82]"
            }`}
          >
            {detail}
          </p>
        ) : null}

        {footer ? <div className="mt-3">{footer}</div> : null}
      </article>
    );
  }

  // coBoss — approved Mission Control benchmark.
  return (
    <article
      className={`group h-full min-h-[150px] w-full min-w-0 rounded-[1.4rem] border-[3px] p-5 shadow-[0_8px_22px_rgba(18,56,101,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_13px_28px_rgba(18,56,101,0.10)] ${className}`}
      style={
        isNavySurface
          ? {
              borderColor: "rgba(255,255,255,0.28)",
              backgroundColor: "rgba(255,255,255,0.10)",
            }
          : {
              borderColor: visual.border,
              backgroundColor: visual.background,
            }
      }
    >
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0 pr-1">
          <p
            className={`break-words text-[10px] font-black uppercase leading-4 tracking-[0.17em] ${
              isNavySurface ? "text-white/74" : "text-[#5F7088]"
            }`}
          >
            {label}
          </p>

          <p
            className={`mt-2 break-words text-4xl font-black leading-none tracking-[-0.03em] ${
              isNavySurface ? "text-white" : visual.valueClass
            }`}
          >
            {value}
          </p>

          {detail ? (
            <p
              className={`mt-2 break-words text-xs font-semibold leading-5 ${
                isNavySurface ? "text-white/72" : "text-[#52667F]"
              }`}
            >
              {detail}
            </p>
          ) : null}
        </div>

        <CardIcon
          Icon={Icon}
          iconText={iconText}
          visual={visual}
          surface={surface}
          size="coBoss"
        />
      </div>

      {footer ? <div className="mt-4">{footer}</div> : null}
    </article>
  );
}

function CardIcon({ Icon, iconText, visual, surface, size }) {
  if (!Icon && !iconText) return null;

  const isNavySurface = surface === "navy";

  const sizeClass =
    size === "boss"
      ? "h-14 w-14 rounded-[1.1rem]"
      : size === "baby"
      ? "h-9 w-9 rounded-xl"
      : "h-12 w-12 rounded-2xl";

  const iconSize = size === "boss" ? 23 : size === "baby" ? 15 : 19;
  const textSize =
    size === "boss" ? "text-2xl" : size === "baby" ? "text-base" : "text-xl";

  return (
    <div
      className={`flex ${sizeClass} ${textSize} shrink-0 items-center justify-center border-2 shadow-[0_4px_11px_rgba(18,56,101,0.08)]`}
      style={
        isNavySurface
          ? {
              borderColor: "rgba(255,255,255,0.30)",
              backgroundColor: "rgba(255,255,255,0.10)",
              color: "#FFFFFF",
            }
          : {
              borderColor: visual.iconBorder,
              backgroundColor: "#FFFFFF",
              color: visual.icon,
            }
      }
      aria-hidden="true"
    >
      {Icon ? <Icon size={iconSize} strokeWidth={2.25} /> : iconText}
    </div>
  );
}

function getToneVisual(tone) {
  const tones = {
    navy: {
      border: "#123865",
      background: "#F1F6FC",
      valueClass: "text-[#123865]",
      iconBorder: "#C7D7E8",
      icon: "#123865",
    },
    orange: {
      border: "#F59E0B",
      background: "#FFF7ED",
      valueClass: "text-[#C93208]",
      iconBorder: "#F7D49D",
      icon: "#C95A13",
    },
    blue: {
      border: "#60A5FA",
      background: "#F2F7FF",
      valueClass: "text-[#075AA3]",
      iconBorder: "#BDD9F8",
      icon: "#2563A8",
    },
    green: {
      border: "#34D399",
      background: "#F0FFF8",
      valueClass: "text-[#087F5B]",
      iconBorder: "#AFE9D3",
      icon: "#0F8A67",
    },
    red: {
      border: "#FB7185",
      background: "#FFF4F4",
      valueClass: "text-[#C42145]",
      iconBorder: "#F8BEC8",
      icon: "#C42145",
    },
    amber: {
      border: "#F59E0B",
      background: "#FFF7ED",
      valueClass: "text-[#B45309]",
      iconBorder: "#F7D49D",
      icon: "#B45309",
    },
    violet: {
      border: "#9B6CFF",
      background: "#F8F5FF",
      valueClass: "text-[#6D28D9]",
      iconBorder: "#D8C8FF",
      icon: "#7C3AED",
    },
    slate: {
      border: "#94A3B8",
      background: "#F8FAFC",
      valueClass: "text-[#334155]",
      iconBorder: "#D6DEE8",
      icon: "#475569",
    },
  };

  return tones[tone] || tones.navy;
}

export default ZaifanMetricCard;
