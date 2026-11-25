import { useId, type CSSProperties } from "react";

function Laurel({ side, id }: { side: "left" | "right"; id: string }) {
  const flip = side === "right" ? "translate(160 0) scale(-1 1)" : undefined;
  return <g transform={flip} fill={`url(#${id}-gold)`} stroke={`url(#${id}-gold-edge)`} strokeWidth=".65" strokeLinejoin="round">
    <path d="M27 133Q17 112 20 89" fill="none" stroke={`url(#${id}-gold-edge)`} strokeWidth="1.5" />
    <path d="M22 124Q10 119 10 108Q19 108 24 117ZM20 112Q8 105 11 94Q20 96 22 105ZM20 99Q11 89 16 80Q24 84 22 93ZM22 88Q16 77 22 69Q29 75 25 82Z" />
    <path d="M24 130Q31 119 38 117M22 115Q29 106 36 104M21 100Q28 92 34 89M22 87Q28 79 32 77" fill="none" stroke={`url(#${id}-gold-edge)`} strokeWidth="1.1" />
  </g>;
}

export function ClubMark({ size }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return <span className="brand-mark" style={size ? ({ "--brand-size": `${size}px` } as CSSProperties) : undefined} aria-hidden="true">
    <svg viewBox="0 0 160 180" fill="none" role="presentation">
      <defs>
        <linearGradient id={`${id}-gold`} x1="18" y1="15" x2="137" y2="159" gradientUnits="userSpaceOnUse"><stop stopColor="#fff2be" /><stop offset=".2" stopColor="#dca642" /><stop offset=".43" stopColor="#fff0a8" /><stop offset=".66" stopColor="#b97b1d" /><stop offset=".85" stopColor="#f1cc6d" /><stop offset="1" stopColor="#9b6419" /></linearGradient>
        <linearGradient id={`${id}-gold-edge`} x1="30" y1="24" x2="127" y2="150" gradientUnits="userSpaceOnUse"><stop stopColor="#fff4c9" /><stop offset=".5" stopColor="#dcae53" /><stop offset="1" stopColor="#8b5b19" /></linearGradient>
        <linearGradient id={`${id}-shield`} x1="80" y1="14" x2="80" y2="168" gradientUnits="userSpaceOnUse"><stop stopColor="#202019" /><stop offset=".43" stopColor="#090b0a" /><stop offset="1" stopColor="#17140c" /></linearGradient>
        <linearGradient id={`${id}-suit`} x1="62" y1="59" x2="105" y2="105" gradientUnits="userSpaceOnUse"><stop stopColor="#36404a" /><stop offset=".5" stopColor="#14191f" /><stop offset="1" stopColor="#050708" /></linearGradient>
        <radialGradient id={`${id}-lights`} cx="0" cy="0" r="1" gradientTransform="matrix(0 35 -59 0 80 67)" gradientUnits="userSpaceOnUse"><stop stopColor="#e4ab46" stopOpacity=".3" /><stop offset="1" stopColor="#e4ab46" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}-skin`} x1="70" y1="42" x2="87" y2="66" gradientUnits="userSpaceOnUse"><stop stopColor="#f5d2a1" /><stop offset=".6" stopColor="#c68245" /><stop offset="1" stopColor="#744223" /></linearGradient>
      </defs>

      <path d="M80 10 139 32 134 105Q129 146 80 172 31 146 26 105L21 32 80 10Z" fill={`url(#${id}-shield)`} stroke={`url(#${id}-gold)`} strokeWidth="3.2" />
      <path d="M80 17 132 37 127 104Q123 139 80 162 37 139 33 104L28 37 80 17Z" stroke="#f5df9a" strokeOpacity=".7" strokeWidth="1" />
      <path d="m55 23-3-14 18 10L80 4l10 15 18-10-3 14 15 8-40-6-40 6z" fill={`url(#${id}-gold)`} stroke="#fff0b3" strokeWidth="1" strokeLinejoin="round" />
      <circle cx="80" cy="11" r="2.1" fill="#fff3c7" />

      <Laurel side="left" id={id} /><Laurel side="right" id={id} />
      <path d="M31 80V60Q80 25 129 60V80" fill="#111512" stroke="#c3933c" strokeWidth="1.4" />
      <path d="M36 70Q80 39 124 70M38 76Q80 48 122 76M40 82Q80 57 120 82" stroke="#c5974b" strokeOpacity=".52" strokeWidth="1.2" />
      <path d="M32 76V51M128 76V51" stroke="#9da99d" strokeWidth="1.5" />
      <path d="M28 52h8v3h-8zm96 0h8v3h-8z" fill="#f4d684" />
      <g fill="#f2d58a" opacity=".9">
        <circle cx="29" cy="49" r="1.1"/><circle cx="32" cy="48" r="1"/><circle cx="35" cy="49" r=".9"/><circle cx="125" cy="49" r=".9"/><circle cx="128" cy="48" r="1"/><circle cx="131" cy="49" r="1.1"/>
        <circle cx="45" cy="66" r=".8"/><circle cx="51" cy="63" r=".8"/><circle cx="57" cy="61" r=".8"/><circle cx="63" cy="59" r=".8"/><circle cx="69" cy="58" r=".8"/><circle cx="75" cy="57" r=".8"/><circle cx="81" cy="57" r=".8"/><circle cx="87" cy="58" r=".8"/><circle cx="93" cy="59" r=".8"/><circle cx="99" cy="61" r=".8"/><circle cx="105" cy="63" r=".8"/><circle cx="111" cy="66" r=".8"/>
      </g>
      <path d="M29 78Q80 45 131 78V91Q80 69 29 91Z" fill={`url(#${id}-lights)`} />

      {/* A fictional touchline manager, drawn as a clean engraved emblem rather than a real person. */}
      <path d="M68 56Q65 44 71 38 76 32 84 35 93 37 94 48L91 59 70 61Z" fill="#211a14" />
      <path d="M71 43Q74 36 82 36 90 37 92 44L88 48 78 46 72 50Z" fill="#25221d" />
      <path d="M73 46Q77 42 85 43L90 48 88 59Q85 65 79 64L73 59Z" fill={`url(#${id}-skin)`} stroke="#f0bd7c" strokeOpacity=".55" strokeWidth=".7" />
      <path d="M73 48Q77 44 81 45M84 45l5 2M77 52h2m6 0h2" stroke="#211811" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M80 52v4l3 1m-6 3q4 3 8 0" stroke="#744523" strokeWidth=".8" strokeLinecap="round" />
      <path d="M73 57q4 5 10 4l4-4q-1 7-6 8-6-1-8-8Z" fill="#3c261a" />
      <path d="M69 40q3-7 12-7 10 1 12 9-7-4-14-3-5 3-10 6Z" fill="#151616" />

      <path d="M67 62 73 60l7 4 7-4 7 3 10 9-6 21H61l-6-21Z" fill={`url(#${id}-suit)`} stroke="#d7b66b" strokeOpacity=".8" strokeWidth="1" />
      <path d="m72 61 8 7 8-7-5 12h-6z" fill="#f3efe4" />
      <path d="m78 67 2-2 2 2 2 13-4 5-4-5z" fill="#111518" stroke="#c6a45d" strokeWidth=".55" />
      <path d="m58 77 13-7 8 4-11 8 22 5-5 8-28-6-7-7z" fill="#20252b" stroke="#879097" strokeWidth=".7" />
      <path d="m102 77-13-7-8 4 11 8-22 5 5 8 28-6 7-7z" fill="#161b20" stroke="#76828a" strokeWidth=".7" />
      <path d="m67 81 11 4m15-4-11 4" stroke="#b7c0c4" strokeOpacity=".4" strokeWidth=".8" />

      <path d="M40 96h80l-4 9H44Z" fill="#090a09" stroke={`url(#${id}-gold)`} strokeWidth="1.4" />
      <path d="M47 100h16m34 0h16" stroke={`url(#${id}-gold)`} strokeWidth="1.3" />
      <text x="80" y="102.7" textAnchor="middle" fill="#f8e7bb" fontSize="5.4" fontFamily="Georgia,serif" fontWeight="700" letterSpacing="1.8">THE</text>
      <text x="80" y="119" textAnchor="middle" fill={`url(#${id}-gold)`} stroke="#3b2812" strokeWidth=".6" paintOrder="stroke" fontSize="15" fontFamily="Arial,sans-serif" fontWeight="900" letterSpacing="1.15">CLUB</text>
      <path d="M47 123h23m20 0h23" stroke="#e7c36f" strokeOpacity=".8" strokeWidth=".8" />

      <circle cx="80" cy="141" r="12" fill="#0b0c0b" stroke={`url(#${id}-gold)`} strokeWidth="1.6" />
      <path d="m80 132 4 3-1 4h-6l-1-4zm-8 6 4 1 1 5-4 2-4-4zm16 0 3 4-4 4-4-2 1-5zm-13 9 4-2 4 2-1 5h-6zm13 0 4-1 2 4-4 3-3-2z" fill={`url(#${id}-gold)`} stroke="#130f09" strokeWidth=".7" />
      <path d="M61 157Q80 169 99 157" stroke={`url(#${id}-gold)`} strokeOpacity=".7" strokeWidth="1.2" />
    </svg>
  </span>;
}

export function ClubWordmark({ compact = false }: { compact?: boolean }) {
  return <span className={`club-wordmark ${compact ? "club-wordmark-compact" : ""}`}><strong>THE <b>CLUB</b></strong>{!compact && <small>CAREERS ARE MADE HERE</small>}</span>;
}
