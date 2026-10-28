import { useState } from "react";

/**
 * A university's campus photo. `size="small"` loads the light card version.
 * Without a photo (or if it fails to load) it falls back to a navy tile with
 * the university's initials, so a card never shows a broken image.
 */
function CampusPhoto({ university, size = "large", className = "", imgClassName = "", credit = false, eager = false }) {
  const [failed, setFailed] = useState(false);
  const photo = university.photo;
  const src = photo && (size === "small" ? photo.small : photo.large);

  if (!src || failed) {
    const initials = university.name
      .replace(/\(.*?\)/g, "")
      .split(/\s+/)
      .filter((word) => /^[A-ZÀ-Ý]/.test(word))
      .slice(0, 3)
      .map((word) => word[0])
      .join("");
    return (
      <div className={`relative grid place-items-center overflow-hidden bg-[#071f50] ${className}`}>
        <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.05)_0_12px,transparent_12px_24px)]" />
        <span className="relative text-5xl font-black tracking-[-0.06em] text-white/90">{initials}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[#dfe4ec] ${className}`}>
      <img
        src={src}
        alt={`${university.name} campus`}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover ${imgClassName}`}
        style={photo.focus ? { objectPosition: photo.focus } : undefined}
      />
      {credit && photo.credit && (
        <a
          href={photo.source}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-2 right-2 max-w-[80%] truncate rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-semibold text-white/85 backdrop-blur-sm transition hover:bg-black/70"
        >
          Photo: {photo.credit} · {photo.license}
        </a>
      )}
    </div>
  );
}

export default CampusPhoto;
