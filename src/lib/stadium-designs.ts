import type { Roof, StadiumArchitecture } from "./game";

export type StandSide = "north" | "east" | "south" | "west";
export type StandProfile = "terrace" | "cantilever" | "glass" | "bowl" | "corner" | "standing" | "truss" | "hospitality" | "crescent" | "heritage" | "retractable" | "asymmetric" | "giant-end" | "brick-pavilion" | "modular" | "split-level" | "open-bank" | "ribbon";

export const STAND_DESIGN_OPTIONS = [
  { id: "compact-terrace", name: "West End Terrace", detail: "Compact single-deck home end", cost: 1_800_000, sheet: 1, tile: 0, roof: "Open sky", preferredTiers: 1, profile: "terrace" },
  { id: "dual-deck-cantilever", name: "Cantilever Grandstand", detail: "Two decks · long unsupported canopy", cost: 2_650_000, sheet: 1, tile: 1, roof: "Cantilever", preferredTiers: 2, profile: "cantilever" },
  { id: "glass-gallery", name: "Glass Galleria", detail: "Layered seating · glazed concourse", cost: 3_250_000, sheet: 1, tile: 2, roof: "Glazed shell", preferredTiers: 2, profile: "glass" },
  { id: "deep-bowl-four-tier", name: "Four-Tier Bowl", detail: "Tall signature stand · continuous roof", cost: 4_200_000, sheet: 1, tile: 3, roof: "Continuous bowl", preferredTiers: 4, profile: "bowl" },
  { id: "curved-corner", name: "Curved Corner", detail: "Wraps the bowl without a hard gap", cost: 2_250_000, sheet: 1, tile: 4, roof: "Wave canopy", preferredTiers: 2, profile: "corner" },
  { id: "rail-standing", name: "Safe-Standing Terrace", detail: "Rail seats · steep compact rake", cost: 1_750_000, sheet: 1, tile: 5, roof: "Cantilever", preferredTiers: 1, profile: "standing" },
  { id: "steel-truss", name: "Foundry Truss", detail: "Exposed steelwork · floating roof", cost: 2_500_000, sheet: 2, tile: 0, roof: "Lattice roof", preferredTiers: 2, profile: "truss" },
  { id: "executive-gallery", name: "Executive Gallery", detail: "Hospitality deck and glass suites", cost: 3_600_000, sheet: 2, tile: 1, roof: "Glazed shell", preferredTiers: 2, profile: "hospitality" },
  { id: "sweeping-bowl", name: "Crescent Bowl", detail: "Sweeping curved rake and roofline", cost: 3_700_000, sheet: 2, tile: 2, roof: "Continuous bowl", preferredTiers: 3, profile: "crescent" },
  { id: "heritage-pavilion", name: "Heritage Pavilion", detail: "Brickwork, balconies and a new roof", cost: 2_300_000, sheet: 2, tile: 3, roof: "Flat canopy", preferredTiers: 1, profile: "heritage" },
  { id: "retractable-shell", name: "Retractable Shell", detail: "Twin sliding roof leaves", cost: 4_800_000, sheet: 2, tile: 4, roof: "Retractable roof", preferredTiers: 3, profile: "retractable" },
  { id: "asymmetric-galleria", name: "Asymmetric Galleria", detail: "Glass corner with a sweeping canopy", cost: 4_100_000, sheet: 2, tile: 5, roof: "Wave canopy", preferredTiers: 2, profile: "asymmetric" },
  { id: "terrace-wall", name: "The Terrace Wall", detail: "A vast, steep single-tier end stand", cost: 5_200_000, sheet: 1, tile: 3, roof: "Cantilever", preferredTiers: 1, profile: "giant-end" },
  { id: "arched-brick-pavilion", name: "Arched Brick Pavilion", detail: "Deep masonry frontage with arched openings", cost: 2_800_000, sheet: 2, tile: 3, roof: "Flat canopy", preferredTiers: 1, profile: "brick-pavilion" },
  { id: "modular-steel-deck", name: "Modular Steel Deck", detail: "Exposed frame with a fast, expandable bowl", cost: 1_950_000, sheet: 2, tile: 0, roof: "Lattice roof", preferredTiers: 1, profile: "modular" },
  { id: "split-level-grandstand", name: "Split-Level Grandstand", detail: "Two generous decks divided by a public concourse", cost: 3_400_000, sheet: 1, tile: 1, roof: "Continuous bowl", preferredTiers: 2, profile: "split-level" },
  { id: "open-bank-terrace", name: "Open Bank Terrace", detail: "Low-cost open stand with a broad shallow rake", cost: 1_500_000, sheet: 1, tile: 0, roof: "Open sky", preferredTiers: 1, profile: "open-bank" },
  { id: "ribbon-cantilever", name: "Ribbon Cantilever", detail: "Long floating roof with a sharp modern edge", cost: 3_400_000, sheet: 2, tile: 2, roof: "Cantilever", preferredTiers: 2, profile: "ribbon" },
] as const satisfies readonly { id: string; name: string; detail: string; cost: number; sheet: 1 | 2; tile: number; roof: Roof; preferredTiers: number; profile: StandProfile }[];

export type StandDesignId = typeof STAND_DESIGN_OPTIONS[number]["id"];
export type StandDesigns = Record<StandSide, StandDesignId>;
export type StandRoofs = Record<StandSide, Roof>;
export type ExecutiveBoxesBySide = Record<StandSide, number>;
export const STAND_STRUCTURES: Record<StandProfile, { rowFactor: number; treadDepth: number; riserHeight: number; spanFactor: number; overhang: number; curve: number; capacityFactor: number }> = {
  terrace: { rowFactor: 0.74, treadDepth: 1.1, riserHeight: 0.36, spanFactor: 0.94, overhang: 3.8, curve: 0, capacityFactor: 0.76 },
  cantilever: { rowFactor: 1.1, treadDepth: 0.92, riserHeight: 0.54, spanFactor: 1.08, overhang: 13, curve: 0, capacityFactor: 1.03 },
  glass: { rowFactor: 1.04, treadDepth: 0.96, riserHeight: 0.47, spanFactor: 1.06, overhang: 7, curve: 0, capacityFactor: 1 },
  bowl: { rowFactor: 1.22, treadDepth: 0.94, riserHeight: 0.52, spanFactor: 1.12, overhang: 7.5, curve: 0.08, capacityFactor: 1.18 },
  corner: { rowFactor: 0.92, treadDepth: 0.92, riserHeight: 0.5, spanFactor: 1.04, overhang: 6.2, curve: 0.22, capacityFactor: 0.92 },
  standing: { rowFactor: 1.08, treadDepth: 0.82, riserHeight: 0.6, spanFactor: 0.98, overhang: 8, curve: 0, capacityFactor: 1.04 },
  truss: { rowFactor: 0.96, treadDepth: 1, riserHeight: 0.49, spanFactor: 1.02, overhang: 10.5, curve: 0, capacityFactor: 0.98 },
  hospitality: { rowFactor: 0.98, treadDepth: 0.95, riserHeight: 0.49, spanFactor: 1.05, overhang: 8, curve: 0, capacityFactor: 1.02 },
  crescent: { rowFactor: 1.1, treadDepth: 1.02, riserHeight: 0.5, spanFactor: 1.12, overhang: 7.8, curve: 0.2, capacityFactor: 1.13 },
  heritage: { rowFactor: 0.78, treadDepth: 1.06, riserHeight: 0.4, spanFactor: 1.02, overhang: 4.4, curve: 0, capacityFactor: 0.78 },
  retractable: { rowFactor: 1.02, treadDepth: 0.98, riserHeight: 0.5, spanFactor: 1.04, overhang: 9, curve: 0, capacityFactor: 1.08 },
  asymmetric: { rowFactor: 1, treadDepth: 0.96, riserHeight: 0.47, spanFactor: 1.08, overhang: 11, curve: 0.12, capacityFactor: 1.15 },
  "giant-end": { rowFactor: 2.3, treadDepth: 0.76, riserHeight: 0.58, spanFactor: 1.12, overhang: 10, curve: 0, capacityFactor: 2.15 },
  "brick-pavilion": { rowFactor: 0.9, treadDepth: 1.04, riserHeight: 0.42, spanFactor: 1, overhang: 4.5, curve: 0, capacityFactor: 0.9 },
  modular: { rowFactor: 0.86, treadDepth: 0.9, riserHeight: 0.46, spanFactor: 0.92, overhang: 8, curve: 0, capacityFactor: 0.78 },
  "split-level": { rowFactor: 1.06, treadDepth: 0.96, riserHeight: 0.5, spanFactor: 1.04, overhang: 7, curve: 0, capacityFactor: 1.16 },
  "open-bank": { rowFactor: 0.68, treadDepth: 1.16, riserHeight: 0.34, spanFactor: 1, overhang: 0, curve: 0, capacityFactor: 0.74 },
  ribbon: { rowFactor: 0.94, treadDepth: 0.95, riserHeight: 0.48, spanFactor: 1.06, overhang: 15, curve: 0, capacityFactor: 1.02 },
};

export function standCapacityFactor(id: StandDesignId) {
  return STAND_STRUCTURES[getStandDesign(id).profile].capacityFactor;
}
export type StandFacade = "Brick & stone" | "Curtain glass" | "Ribbed metal" | "Exposed concrete" | "Open terrace";
export type StandFrontage = "None" | "Club superstore" | "Restaurant" | "Supporters bar" | "Club museum";
export type StandFacades = Record<StandSide, StandFacade>;
export type StandFrontages = Record<StandSide, StandFrontage>;
export type StandSeatColors = Record<StandSide, string>;
export type StandNames = Record<StandSide, string>;

const STAND_TIER_MULTIPLIER = [0, 1, 1.9, 3, 4.3] as const;

export function getStandBuildCost(id: StandDesignId, tiers: number, stadiumCapacity = 20_000) {
  const level = Math.max(1, Math.min(4, Math.round(tiers)));
  const sizeFactor = Math.max(0.55, Math.min(2.1, Math.sqrt(Math.max(5_000, stadiumCapacity) / 20_000)));
  const rawCost = getStandDesign(id).cost * sizeFactor * STAND_TIER_MULTIPLIER[level];
  return Math.max(1_200_000, Math.round(rawCost / 100_000) * 100_000);
}

export function getStandTierChangeCost(id: StandDesignId, fromTiers: number, toTiers: number, stadiumCapacity = 20_000) {
  const from = Math.max(1, Math.min(4, Math.round(fromTiers)));
  const to = Math.max(1, Math.min(4, Math.round(toTiers)));
  if (from === to) return 0;
  const sizeFactor = Math.max(0.55, Math.min(2.1, Math.sqrt(Math.max(5_000, stadiumCapacity) / 20_000)));
  const baseCost = getStandDesign(id).cost * sizeFactor;
  let total = 0;
  if (to > from) {
    for (let tier = from + 1; tier <= to; tier += 1) total += baseCost * (STAND_TIER_MULTIPLIER[tier] - STAND_TIER_MULTIPLIER[tier - 1]);
  } else {
    for (let tier = from; tier > to; tier -= 1) total += baseCost * (STAND_TIER_MULTIPLIER[tier] - STAND_TIER_MULTIPLIER[tier - 1]) * 0.15;
  }
  return Math.round(total / 100_000) * 100_000;
}

export const STAND_FACADES: StandFacade[] = ["Brick & stone", "Curtain glass", "Ribbed metal", "Exposed concrete", "Open terrace"];
export const STAND_FRONTAGES: StandFrontage[] = ["None", "Club superstore", "Restaurant", "Supporters bar", "Club museum"];

export function defaultStandFacades(designs: StandDesigns): StandFacades {
  return Object.fromEntries((Object.keys(designs) as StandSide[]).map((side) => {
    const profile = getStandDesign(designs[side]).profile;
    const facade: StandFacade = profile === "heritage" || profile === "brick-pavilion" ? "Brick & stone" : profile === "glass" || profile === "hospitality" || profile === "asymmetric" ? "Curtain glass" : profile === "truss" || profile === "modular" ? "Ribbed metal" : profile === "terrace" || profile === "open-bank" || profile === "standing" ? "Open terrace" : "Exposed concrete";
    return [side, facade];
  })) as StandFacades;
}

export function defaultStandFrontages(): StandFrontages {
  return { north: "None", east: "Club superstore", south: "Restaurant", west: "None" };
}

export function defaultStandSeatColors(color: string): StandSeatColors {
  return { north: color, east: color, south: color, west: color };
}

export function defaultStandNames(_stadiumName: string): StandNames {
  return { north: "North Stand", east: "East Stand", south: "South Stand", west: "West Stand" };
}

const ARCHITECTURE_DEFAULT: Record<StadiumArchitecture, StandDesignId> = {
  "Dockside steel": "steel-truss",
  "Clocktower brick": "heritage-pavilion",
  "Foundry arches": "deep-bowl-four-tier",
  "Riverside glass": "glass-gallery",
  "Hilltop terraces": "compact-terrace",
  "Railway truss": "steel-truss",
  "Garden bowl": "sweeping-bowl",
  "Civic colonnade": "dual-deck-cantilever",
  "Lakeside canopy": "asymmetric-galleria",
  "Market hall": "heritage-pavilion",
  "Beacon tower": "executive-gallery",
  "Southbank lattice": "retractable-shell",
};

function standSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function defaultStandDesigns(architecture?: StadiumArchitecture, clubId?: string): StandDesigns {
  const design = ARCHITECTURE_DEFAULT[architecture ?? "Civic colonnade"];
  if (!clubId) return { north: design, east: "executive-gallery", south: design, west: "heritage-pavilion" };
  const used = new Set<StandDesignId>([design]);
  const choose = (side: StandSide) => {
    const start = standSeed(`${clubId}:${side}`) % STAND_DESIGN_OPTIONS.length;
    for (let offset = 0; offset < STAND_DESIGN_OPTIONS.length; offset += 1) {
      const candidate = STAND_DESIGN_OPTIONS[(start + offset) % STAND_DESIGN_OPTIONS.length].id;
      if (!used.has(candidate)) {
        used.add(candidate);
        return candidate;
      }
    }
    return design;
  };
  return { north: design, east: choose("east"), south: choose("south"), west: choose("west") };
}

export function defaultStandRoofs(roof: Roof): StandRoofs {
  return { north: roof, east: roof, south: roof, west: roof };
}

export function defaultExecutiveBoxes(boxes: number): ExecutiveBoxesBySide {
  const east = Math.ceil(Math.max(0, boxes) / 2);
  return { north: 0, east, south: 0, west: Math.max(0, boxes - east) };
}

export function getStandDesign(id: StandDesignId) {
  return STAND_DESIGN_OPTIONS.find((option) => option.id === id) ?? STAND_DESIGN_OPTIONS[0];
}
