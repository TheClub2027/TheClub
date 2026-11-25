export type PlayerFace = {
  fingerprint: string;
  skin: string;
  skinShade: string;
  hair: string;
  eye: string;
  background: string;
  hairStyle: number;
  beardStyle: number;
  faceWidth: number;
  faceHeight: number;
  eyeY: number;
  eyeGap: number;
  noseWidth: number;
  mouthWidth: number;
  browTilt: number;
  earSize: number;
  freckles: number;
  collar: number;
  faceShape: number;
  eyeShape: number;
  noseLength: number;
  lipFullness: number;
  chinWidth: number;
};

const SKIN = ["#f5d6bd", "#eac1a1", "#dca882", "#c68b67", "#a96f51", "#8f5b43", "#734631", "#f0c9a8", "#d8b08e", "#b88262", "#9a715c", "#684638"];
const HAIR = ["#171817", "#30251f", "#483429", "#74533b", "#a2784f", "#c5a06c", "#d3d0c1", "#552f2c", "#202c39", "#4f534a", "#8c4b36", "#b6a17a"];
const EYES = ["#3d261d", "#513b28", "#66725b", "#5f7f8a", "#8b6f47", "#302a25", "#577264", "#788e92"];

function fnv32(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

function mix(seed: number, salt: number) {
  let value = (seed ^ Math.imul(salt, 0x9e3779b9)) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x85ebca6b) >>> 0;
  value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35) >>> 0;
  return (value ^ (value >>> 16)) >>> 0;
}

function randomPart(seedA: number, seedB: number, salt: number) {
  const high = mix(seedA, salt);
  const low = mix(seedB, salt * 31 + 1) >>> 11;
  return (high * 0x200000 + low) / 0x20000000000000;
}

function shadeHex(hex: string, amount: number) {
  const value = hex.replace("#", "");
  const channel = (offset: number) => Math.max(0, Math.min(255, Math.round(parseInt(value.slice(offset, offset + 2), 16) * amount))).toString(16).padStart(2, "0");
  return `#${channel(0)}${channel(2)}${channel(4)}`;
}

export function getPlayerFace(id: string): PlayerFace {
  const seed = fnv32(id);
  const secondarySeed = fnv32(`face:${id}`);
  const number = (slot: number, min: number, max: number) => min + randomPart(seed, secondarySeed, slot + 1) * (max - min);
  const skin = SKIN[Math.floor(number(0, 0, SKIN.length))];
  return {
    fingerprint: `${seed.toString(16).padStart(8, "0")}${secondarySeed.toString(16).padStart(8, "0")}-${id}`,
    skin,
    skinShade: shadeHex(skin, number(1, 0.64, 0.81)),
    hair: HAIR[Math.floor(number(2, 0, HAIR.length))],
    eye: EYES[Math.floor(number(3, 0, EYES.length))],
    background: `hsl(${Math.floor(number(4, 150, 215))} 20% ${Math.floor(number(5, 18, 33))}%)`,
    hairStyle: Math.floor(number(6, 0, 20)),
    beardStyle: Math.floor(number(7, 0, 7)),
    faceWidth: number(8, 19.5, 23),
    faceHeight: number(9, 26, 30),
    eyeY: number(10, 37, 42),
    eyeGap: number(11, 7.5, 10),
    noseWidth: number(12, 3.1, 5.6),
    mouthWidth: number(13, 7, 12),
    browTilt: number(14, -2.5, 2.5),
    earSize: number(15, 3.6, 5.3),
    freckles: Math.floor(number(16, 0, 3)),
    collar: number(17, -3, 3),
    faceShape: Math.floor(number(18, 0, 5)),
    eyeShape: Math.floor(number(19, 0, 4)),
    noseLength: number(20, 7.5, 12),
    lipFullness: number(21, 0.7, 1.5),
    chinWidth: number(22, -1.2, 1.2),
  };
}

export function getPlayerFaceFingerprint(id: string) {
  return getPlayerFace(id).fingerprint;
}
