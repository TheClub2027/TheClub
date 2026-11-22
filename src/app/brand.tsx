import type { CSSProperties } from "react";

export function ClubMark({ size }: { size?: number }) {
  return <span className="brand-mark" style={size ? ({ "--brand-size": `${size}px` } as CSSProperties) : undefined} aria-hidden="true">
    <svg viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill="#102019" stroke="#d5bd76" strokeWidth="1.4" />
      <circle cx="24" cy="24" r="18.5" stroke="#e8e2cc" strokeOpacity=".38" />
      <path d="M31.1 15.4A13 13 0 1 0 31.2 32.7" stroke="#88d7b1" strokeWidth="4.8" strokeLinecap="round" />
      <path d="M32.6 16.4v8.2H25" stroke="#e8d59b" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.5 24h9" stroke="#e8e2cc" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="18.2" cy="24" r="2.2" fill="#e8d59b" />
      <path d="M13.5 36.2h21" stroke="#88d7b1" strokeWidth="1.3" strokeLinecap="round" opacity=".78" />
    </svg>
  </span>;
}

export function ClubWordmark({ compact = false }: { compact?: boolean }) {
  return <span className={`club-wordmark ${compact ? "club-wordmark-compact" : ""}`}><strong>THE <b>CLUB</b></strong>{!compact && <small>CAREERS ARE MADE HERE</small>}</span>;
}
