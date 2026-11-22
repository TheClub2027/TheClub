import { getPlayerFace } from "@/lib/player-faces";

const HAIRLINES = [
  "M17 34 Q15 18 27 12 Q42 5 53 18 L55 33 Q48 24 42 23 Q32 31 17 34Z",
  "M16 32 Q17 15 31 12 Q45 9 54 19 L52 27 Q44 20 37 22 Q28 27 16 32Z",
  "M16 33 Q12 19 22 14 Q29 9 34 12 Q43 5 51 14 Q58 20 54 34 Q47 25 40 24 Q29 30 16 33Z",
  "M17 31 Q14 17 24 13 Q32 7 39 13 Q50 8 55 20 L52 32 Q43 22 37 24 Q27 29 17 31Z",
  "M17 32 Q15 19 22 13 Q32 8 39 13 Q50 9 55 22 L51 29 Q44 24 37 24 Q27 29 17 32Z",
  "M17 29 Q21 10 35 11 Q48 9 54 21 L53 30 Q45 22 40 24 Q29 28 17 29Z",
  "M18 29 Q18 13 31 11 Q45 9 51 19 L50 26 Q41 21 34 23 Q25 26 18 29Z",
  "M16 31 Q15 20 22 14 Q28 10 32 13 Q43 7 53 17 L54 31 Q45 22 38 24 Q28 29 16 31Z",
  "M17 30 Q18 12 34 11 Q48 10 54 19 L51 24 Q42 19 37 23 Q25 28 17 30Z",
  "M17 31 Q15 16 27 12 Q38 7 48 13 Q56 19 54 31 Q46 24 39 24 Q29 29 17 31Z",
  "M18 33 Q14 18 24 13 Q34 8 40 13 Q51 11 54 24 L51 31 Q43 23 36 25 Q27 30 18 33Z",
  "M17 31 Q15 18 26 12 Q41 5 53 18 L52 25 Q44 21 39 23 Q29 28 17 31Z",
  "M19 30 Q19 15 32 12 Q46 8 53 20 L52 27 Q44 22 38 24 Q28 29 19 30Z",
  "M16 34 Q11 20 21 15 Q27 12 32 15 Q42 9 51 16 Q58 22 54 34 Q47 27 40 26 Q28 32 16 34Z",
];

export function PlayerPortrait({ id, name, size = "small", shirtColor = "#376e5b" }: { id: string; name: string; size?: "tiny" | "small" | "large"; shirtColor?: string }) {
  const face = getPlayerFace(id);
  const hairPath = HAIRLINES[face.hairStyle] ?? HAIRLINES[0];
  const rx = face.faceWidth;
  const ry = face.faceHeight;
  return <span className={`player-portrait portrait-${size}`} aria-label={`${name} player portrait`} title={name}>
    <svg viewBox="0 0 72 88" role="img" aria-hidden="true" data-face-key={face.fingerprint}>
      <defs>
        <linearGradient id={`face-shade-${face.fingerprint}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={face.skin} /><stop offset="1" stopColor={face.skinShade} /></linearGradient>
        <linearGradient id={`shirt-shade-${face.fingerprint}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={shirtColor} /><stop offset="1" stopColor="#101a18" /></linearGradient>
      </defs>
      <rect width="72" height="88" rx="12" fill={face.background} />
      <path d={`M7 88 Q9 67 24 62 L${36 + face.collar} 67 49 62 Q64 67 66 88Z`} fill={`url(#shirt-shade-${face.fingerprint})`} />
      <path d={`M29 56 Q30 67 36 69 Q43 66 43 56Z`} fill={face.skinShade} />
      <path d="M27 66 36 73 45 66 42 88H30Z" fill="#e4e7dd" opacity=".88" />
      <ellipse cx="14" cy="42" rx={face.earSize} ry="7" fill={face.skinShade} />
      <ellipse cx="58" cy="42" rx={face.earSize} ry="7" fill={face.skinShade} />
      <ellipse cx="36" cy="40" rx={rx} ry={ry} fill={`url(#face-shade-${face.fingerprint})`} />
      <path d={hairPath} fill={face.hair} />
      {face.hairStyle % 3 === 0 && <path d="M21 26 Q34 18 50 25" fill="none" stroke={face.hair} strokeWidth="3" strokeLinecap="round" />}
      {face.hairStyle % 4 === 1 && <path d="M17 31 Q14 43 18 51M55 31 Q59 42 55 52" fill="none" stroke={face.hair} strokeWidth="4" strokeLinecap="round" />}
      {face.beardStyle > 0 && <path d={face.beardStyle < 3 ? "M18 48 Q22 58 28 59 Q36 63 44 59 Q51 57 54 48 Q49 53 44 52 Q36 56 28 52 Q22 53 18 48Z" : "M21 50 Q24 60 36 62 Q48 59 51 50 Q46 54 42 52 Q35 57 29 52Z"} fill={face.hair} opacity=".92" />}
      <path d={`M${27 - face.eyeGap / 2} ${face.eyeY - face.browTilt} Q${30 - face.eyeGap / 2} ${face.eyeY - 3} ${33 - face.eyeGap / 2} ${face.eyeY - face.browTilt}M${39 + face.eyeGap / 2} ${face.eyeY - face.browTilt} Q${42 + face.eyeGap / 2} ${face.eyeY - 3} ${45 + face.eyeGap / 2} ${face.eyeY - face.browTilt}`} fill="none" stroke={face.hair} strokeWidth="2.3" strokeLinecap="round" />
      <ellipse cx={30 - face.eyeGap / 2} cy={face.eyeY} rx="2.8" ry="1.8" fill="#fffaf1" /><ellipse cx={42 + face.eyeGap / 2} cy={face.eyeY} rx="2.8" ry="1.8" fill="#fffaf1" />
      <circle cx={30 - face.eyeGap / 2} cy={face.eyeY} r="1.15" fill={face.eye} /><circle cx={42 + face.eyeGap / 2} cy={face.eyeY} r="1.15" fill={face.eye} />
      <path d={`M36 ${face.eyeY + 1} Q${36 - face.noseWidth / 2} 48 36 51 Q${36 + face.noseWidth / 2} 52 38 50`} fill="none" stroke={face.skinShade} strokeWidth="1.5" strokeLinecap="round" />
      <path d={`M${36 - face.mouthWidth / 2} 55 Q36 57.7 ${36 + face.mouthWidth / 2} 55`} fill="none" stroke="#874f49" strokeWidth="1.6" strokeLinecap="round" />
      {face.freckles > 0 && <g fill="#865b48" opacity=".48"><circle cx="26" cy="48" r=".8" /><circle cx="29" cy="49" r=".7" /><circle cx="46" cy="48" r=".8" /><circle cx="43" cy="49" r=".7" /></g>}
      <path d="M19 39 Q17 38 17 43M53 39 Q55 38 55 43" fill="none" stroke={face.skin} strokeWidth="1.4" />
    </svg>
  </span>;
}
