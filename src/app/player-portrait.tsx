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
  "M16 32 Q13 21 22 14 Q29 9 36 13 Q45 8 53 17 L55 31 Q47 24 40 24 Q28 30 16 32Z",
  "M18 29 Q20 12 35 10 Q48 10 54 21 L53 29 Q46 23 39 24 Q27 28 18 29Z",
  "M16 35 Q12 22 17 16 Q21 12 26 16 Q31 7 38 13 Q48 7 54 18 Q58 24 54 35 Q47 27 41 25 Q28 32 16 35Z",
  "M17 29 Q17 14 30 12 Q40 8 47 13 Q53 16 54 25 L52 30 Q45 24 38 24 Q25 28 17 29Z",
  "M15 34 Q12 18 24 12 Q33 8 39 13 Q49 8 55 20 L54 34 Q48 25 39 23 Q27 31 15 34Z",
  "M18 27 Q20 12 36 11 Q50 11 54 22 Q47 19 40 22 Q28 27 18 27Z",
];

export function PlayerPortrait({ id, name, size = "small", shirtColor = "#376e5b" }: { id: string; name: string; size?: "tiny" | "small" | "large"; shirtColor?: string }) {
  const face = getPlayerFace(id);
  const hairPath = HAIRLINES[face.hairStyle] ?? HAIRLINES[0];
  const jawWidths = [0.75, 0.59, 0.86, 0.64, 0.72];
  const chinDepths = [60, 63, 61, 65, 62];
  const rx = face.faceWidth;
  const ry = face.faceHeight;
  const jaw = rx * jawWidths[face.faceShape] + (face.chinWidth ?? 0);
  const chin = chinDepths[face.faceShape];
  const facePath = `M36 11 C${36 + rx * .78} 10 ${36 + rx} 22 ${36 + rx * .94} 35 C${36 + rx * .92} 48 ${36 + rx * .62} 57 ${36 + jaw} ${chin - 2} Q36 ${chin + 3} ${36 - jaw} ${chin - 2} C${36 - rx * .62} 57 ${36 - rx * .92} 48 ${36 - rx * .94} 35 C${36 - rx} 22 ${36 - rx * .78} 10 36 11Z`;
  const eyeRise = [2.4, 1.5, 3.1, 1.9][face.eyeShape] ?? 2.4;
  const eyePath = (x: number) => `M${x} ${face.eyeY} Q${x + 3} ${face.eyeY - eyeRise} ${x + 6} ${face.eyeY} Q${x + 3} ${face.eyeY + eyeRise * .72} ${x} ${face.eyeY}Z`;
  const eyeLeft = 27 - face.eyeGap / 2;
  const eyeRight = 39 + face.eyeGap / 2;
  return <span className={`player-portrait portrait-${size}`} aria-label={`${name} player portrait`} title={name}>
    <svg viewBox="0 0 72 88" role="img" aria-hidden="true" data-face-key={face.fingerprint}>
      <defs>
        <linearGradient id={`face-shade-${face.fingerprint}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff0dc" stopOpacity=".38" /><stop offset=".16" stopColor={face.skin} /><stop offset=".57" stopColor={face.skin} /><stop offset="1" stopColor={face.skinShade} /></linearGradient>
        <radialGradient id={`face-light-${face.fingerprint}`} cx=".31" cy=".25" r=".85"><stop stopColor="#fff4e5" stopOpacity=".47" /><stop offset=".48" stopColor="#fff4e5" stopOpacity=".08" /><stop offset="1" stopColor="#fff4e5" stopOpacity="0" /></radialGradient>
        <radialGradient id={`cheek-shade-${face.fingerprint}`} cx=".5" cy=".25" r=".8"><stop stopColor="#d17e70" stopOpacity=".2" /><stop offset="1" stopColor="#d17e70" stopOpacity="0" /></radialGradient>
        <linearGradient id={`portrait-back-${face.fingerprint}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={face.background} /><stop offset="1" stopColor="#090f0e" /></linearGradient>
        <linearGradient id={`shirt-shade-${face.fingerprint}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={shirtColor} /><stop offset=".5" stopColor={shirtColor} /><stop offset="1" stopColor="#101a18" /></linearGradient>
        <linearGradient id={`hair-shade-${face.fingerprint}`} x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#ffffff" stopOpacity=".22" /><stop offset=".4" stopColor={face.hair} /><stop offset="1" stopColor="#090b0b" stopOpacity=".55" /></linearGradient>
        <filter id={`portrait-soft-${face.fingerprint}`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4" /></filter>
      </defs>
      <rect width="72" height="88" rx="12" fill={`url(#portrait-back-${face.fingerprint})`} />
      <ellipse cx="36" cy="34" rx="30" ry="34" fill="#f4e8da" opacity=".08" filter={`url(#portrait-soft-${face.fingerprint})`} />
      <path d="M4 88 Q7 69 19 64L29 61 36 69 44 61 55 64Q66 69 69 88Z" fill={`url(#shirt-shade-${face.fingerprint})`} />
      <path d="M29 57 Q29 67 36 70 Q43 67 43 57Z" fill={face.skinShade} />
      <path d="M28 64 36 70 44 64 47 88H25Z" fill="#e5e6df" opacity=".9" />
      <path d="M30 65 36 70 42 65" fill="none" stroke="#b7c5b8" strokeWidth=".8" />
      <path d="M8 87 23 70m41 17L49 70" stroke="#ffffff" strokeOpacity=".12" strokeWidth="1.1" />
      <path d="M14 78 Q36 72 58 78" fill="none" stroke="#ffffff" strokeOpacity=".1" strokeWidth=".7" />
      <ellipse cx="14" cy="42" rx={face.earSize} ry="7.3" fill={face.skinShade} />
      <ellipse cx="58" cy="42" rx={face.earSize} ry="7.3" fill={face.skinShade} />
      <path d="M12 41q3-4 5 1m43-1q-3-4-5 1" fill="none" stroke={face.skin} strokeOpacity=".6" strokeWidth="1.1" strokeLinecap="round" />
      <path d={facePath} fill={`url(#face-shade-${face.fingerprint})`} />
      <path d={facePath} fill={`url(#face-light-${face.fingerprint})`} />
      <ellipse cx="25" cy="47" rx="8" ry="6" fill={`url(#cheek-shade-${face.fingerprint})`} />
      <ellipse cx="47" cy="47" rx="8" ry="6" fill={`url(#cheek-shade-${face.fingerprint})`} />
      <path d={`M${36-rx*.72} 48 Q${36-rx*.45} 50 ${36-rx*.1} 48 M${36+rx*.1} 48 Q${36+rx*.45} 50 ${36+rx*.72} 48`} fill="none" stroke={face.skinShade} strokeOpacity=".19" strokeWidth=".7" />
      <path d={hairPath} fill={`url(#hair-shade-${face.fingerprint})`} />
      {face.hairStyle % 3 === 0 && <path d="M21 24 Q34 16 51 24" fill="none" stroke="#fff" strokeOpacity=".16" strokeWidth="1.3" strokeLinecap="round" />}
      {face.hairStyle % 4 === 1 && <path d="M17 29 Q13 42 18 51M55 29 Q59 42 54 51" fill="none" stroke={face.hair} strokeWidth="3.3" strokeLinecap="round" />}
      {face.hairStyle % 5 === 2 && <g fill="none" stroke="#fff" strokeOpacity=".15" strokeWidth=".7">{[0,1,2,3,4].map((line) => <path key={line} d={`M${22 + line * 6} 15q-4 5 0 9`} />)}</g>}
      {face.hairStyle % 6 === 3 && <path d="M19 22 Q29 10 45 15" fill="none" stroke="#fff" strokeOpacity=".19" strokeWidth=".9" />}
      {face.beardStyle > 0 && <path d={face.beardStyle < 3 ? "M18 47 Q20 57 27 60 Q36 64 45 60 Q52 57 54 47 Q50 52 44 52 Q36 56 28 52 Q22 53 18 47Z" : "M21 49 Q24 60 36 62 Q48 59 51 49 Q46 54 42 52 Q35 57 29 52Z"} fill={`url(#hair-shade-${face.fingerprint})`} opacity=".95" />}
      <path d={`M${eyeLeft} ${face.eyeY - face.browTilt} Q${eyeLeft + 3} ${face.eyeY - 4.1} ${eyeLeft + 6} ${face.eyeY - face.browTilt} M${eyeRight} ${face.eyeY - face.browTilt} Q${eyeRight + 3} ${face.eyeY - 4.1} ${eyeRight + 6} ${face.eyeY - face.browTilt}`} fill="none" stroke={face.hair} strokeWidth="1.6" strokeLinecap="round" />
      <path d={eyePath(eyeLeft)} fill="#fff4e8" stroke={face.skinShade} strokeOpacity=".75" strokeWidth=".45" />
      <path d={eyePath(eyeRight)} fill="#fff4e8" stroke={face.skinShade} strokeOpacity=".75" strokeWidth=".45" />
      <path d={`M${eyeLeft} ${face.eyeY - .5} Q${eyeLeft + 3} ${face.eyeY - 2.5} ${eyeLeft + 6} ${face.eyeY - .5} M${eyeRight} ${face.eyeY - .5} Q${eyeRight + 3} ${face.eyeY - 2.5} ${eyeRight + 6} ${face.eyeY - .5}`} fill="none" stroke={face.hair} strokeOpacity=".58" strokeWidth=".7" />
      <circle cx={eyeLeft + 3} cy={face.eyeY} r="1.05" fill={face.eye} /><circle cx={eyeRight + 3} cy={face.eyeY} r="1.05" fill={face.eye} />
      <circle cx={eyeLeft + 2.7} cy={face.eyeY - .4} r=".32" fill="#fff" /><circle cx={eyeRight + 2.7} cy={face.eyeY - .4} r=".32" fill="#fff" />
      <path d={`M36 ${face.eyeY + 1.2} Q${36 - face.noseWidth / 2} ${face.eyeY + face.noseLength * .55} 36 ${face.eyeY + face.noseLength} Q${36 + face.noseWidth / 2} ${face.eyeY + face.noseLength + 1} 38 ${face.eyeY + face.noseLength - 1}`} fill="none" stroke={face.skinShade} strokeOpacity=".78" strokeWidth="1.2" strokeLinecap="round" />
      <path d={`M33.5 ${face.eyeY + face.noseLength}q1.2 1.2 2.2 .4m2.7 0q1 .8 2.2-.4`} fill="none" stroke={face.skinShade} strokeOpacity=".56" strokeWidth=".7" strokeLinecap="round" />
      <path d={`M${36 - face.mouthWidth / 2} 55 Q36 ${55 - face.lipFullness} ${36 + face.mouthWidth / 2} 55 Q36 ${57 + face.lipFullness} ${36 - face.mouthWidth / 2} 55Z`} fill="#9e5c55" fillOpacity={Math.min(1, face.lipFullness)} />
      <path d={`M${36 - face.mouthWidth / 2 + 1} 55.3 Q36 56.6 ${36 + face.mouthWidth / 2 - 1} 55.3`} fill="none" stroke="#f3c4ad" strokeOpacity=".72" strokeWidth=".55" />
      {face.freckles > 0 && <g fill={face.skinShade} opacity=".62"><circle cx="25" cy="48" r=".8" /><circle cx="29" cy="49" r=".65" /><circle cx="47" cy="48" r=".8" /><circle cx="43" cy="49" r=".65" />{face.freckles > 1 && <><circle cx="26" cy="51" r=".55" /><circle cx="46" cy="51" r=".55" /></>}</g>}
    </svg>
  </span>;
}
