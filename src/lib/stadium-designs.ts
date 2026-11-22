import type { Roof, StadiumArchitecture } from "./game";

export type StandSide = "north" | "east" | "south" | "west";

export const STAND_DESIGN_OPTIONS = [
  { id: "compact-terrace", name: "West End Terrace", detail: "Compact single-deck home end", cost: 285_000, sheet: 1, tile: 0, roof: "Open sky", profile: "terrace" },
  { id: "dual-deck-cantilever", name: "Cantilever Grandstand", detail: "Two decks · long unsupported canopy", cost: 680_000, sheet: 1, tile: 1, roof: "Cantilever", profile: "cantilever" },
  { id: "glass-gallery", name: "Glass Galleria", detail: "Layered seating · glazed concourse", cost: 1_150_000, sheet: 1, tile: 2, roof: "Glazed shell", profile: "glass" },
  { id: "deep-bowl-four-tier", name: "Four-Tier Bowl", detail: "Tall signature stand · continuous roof", cost: 2_450_000, sheet: 1, tile: 3, roof: "Continuous bowl", profile: "bowl" },
  { id: "curved-corner", name: "Curved Corner", detail: "Wraps the bowl without a hard gap", cost: 940_000, sheet: 1, tile: 4, roof: "Wave canopy", profile: "corner" },
  { id: "rail-standing", name: "Safe-Standing Terrace", detail: "Rail seats · steep compact rake", cost: 380_000, sheet: 1, tile: 5, roof: "Cantilever", profile: "standing" },
  { id: "steel-truss", name: "Foundry Truss", detail: "Exposed steelwork · floating roof", cost: 820_000, sheet: 2, tile: 0, roof: "Lattice roof", profile: "truss" },
  { id: "executive-gallery", name: "Executive Gallery", detail: "Hospitality deck and glass suites", cost: 1_780_000, sheet: 2, tile: 1, roof: "Glazed shell", profile: "hospitality" },
  { id: "sweeping-bowl", name: "Crescent Bowl", detail: "Sweeping curved rake and roofline", cost: 1_420_000, sheet: 2, tile: 2, roof: "Continuous bowl", profile: "crescent" },
  { id: "heritage-pavilion", name: "Heritage Pavilion", detail: "Brickwork, balconies and a new roof", cost: 1_060_000, sheet: 2, tile: 3, roof: "Flat canopy", profile: "heritage" },
  { id: "retractable-shell", name: "Retractable Shell", detail: "Twin sliding roof leaves", cost: 3_250_000, sheet: 2, tile: 4, roof: "Retractable roof", profile: "retractable" },
  { id: "asymmetric-galleria", name: "Asymmetric Galleria", detail: "Glass corner with a sweeping canopy", cost: 1_960_000, sheet: 2, tile: 5, roof: "Wave canopy", profile: "asymmetric" },
] as const satisfies readonly { id: string; name: string; detail: string; cost: number; sheet: 1 | 2; tile: number; roof: Roof; profile: string }[];

export type StandDesignId = typeof STAND_DESIGN_OPTIONS[number]["id"];
export type StandDesigns = Record<StandSide, StandDesignId>;
export type StandRoofs = Record<StandSide, Roof>;
export type ExecutiveBoxesBySide = Record<StandSide, number>;

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

export function defaultStandDesigns(architecture?: StadiumArchitecture): StandDesigns {
  const design = ARCHITECTURE_DEFAULT[architecture ?? "Civic colonnade"];
  return { north: design, east: "executive-gallery", south: design, west: "glass-gallery" };
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
