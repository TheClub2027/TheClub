export type StadiumFacilityKey = "carPark" | "superstore" | "restaurant" | "hotel" | "fanZone" | "museum" | "transportHub" | "trainingGround" | "trainingPitches" | "academy" | "youthStadium";
export type FacilitySize = "Compact" | "Standard" | "Flagship";
export type FacilityLocation = "north" | "east" | "south" | "west";
export type StadiumLandSide = "north" | "east" | "south" | "west";
export const STADIUM_LAND_SIDES = [
  { id: "north", label: "North", district: "North approach" },
  { id: "east", label: "East", district: "East precinct" },
  { id: "south", label: "South", district: "South approach" },
  { id: "west", label: "West", district: "West precinct" },
] as const satisfies { id: StadiumLandSide; label: string; district: string }[];
export type FacilityLayout = { style: string; size: FacilitySize; location: FacilityLocation; position?: { x: number; z: number } };
export type StadiumFacilityPlan = Record<StadiumFacilityKey, FacilityLayout>;
export type FacilitySiteFootprint = { key: StadiumFacilityKey; x: number; z: number; width: number; depth: number };

export function facilitySiteHasCollision(candidate: FacilitySiteFootprint, existing: FacilitySiteFootprint[], clearance = 3) {
  return existing.some((site) => site.key !== candidate.key && Math.abs(candidate.x - site.x) < (candidate.width + site.width) / 2 + clearance && Math.abs(candidate.z - site.z) < (candidate.depth + site.depth) / 2 + clearance);
}

const SITE_LAND_COSTS: Record<string, number> = {
  "Dense terraces": 1_750_000,
  "Railway quarter": 1_550_000,
  "Waterside quay": 2_250_000,
  "Industrial fringe": 1_050_000,
  Parkland: 1_250_000,
  "Hillside green": 1_150_000,
  "Suburban campus": 1_300_000,
  "Market streets": 1_950_000,
  "Harbour edge": 2_650_000,
  "Riverside mills": 1_850_000,
};

export type StadiumLandParcel = { centerX: number; centerZ: number; width: number; depth: number };
const LAND_PARCEL_OFFSET = 170;
const LAND_PARCEL_LONG = 112;
const LAND_PARCEL_SHORT = 92;

export function getStadiumLandParcel(siteInnerX: number, siteInnerZ: number, side: StadiumLandSide): StadiumLandParcel {
  if (side === "north") return { centerX: 0, centerZ: -(siteInnerZ + LAND_PARCEL_OFFSET), width: LAND_PARCEL_LONG, depth: LAND_PARCEL_SHORT };
  if (side === "south") return { centerX: 0, centerZ: siteInnerZ + LAND_PARCEL_OFFSET, width: LAND_PARCEL_LONG, depth: LAND_PARCEL_SHORT };
  if (side === "east") return { centerX: siteInnerX + LAND_PARCEL_OFFSET, centerZ: 0, width: LAND_PARCEL_SHORT, depth: LAND_PARCEL_LONG };
  return { centerX: -(siteInnerX + LAND_PARCEL_OFFSET), centerZ: 0, width: LAND_PARCEL_SHORT, depth: LAND_PARCEL_LONG };
}

export function siteParcelAcquisitionCost(siteSetting: string | undefined, side: StadiumLandSide, capacity: number) {
  const base = SITE_LAND_COSTS[siteSetting ?? ""] ?? 1_400_000;
  const groundScale = Math.max(0.72, Math.min(2.05, Math.sqrt(Math.max(5_000, capacity) / 10_000)));
  const sideScale = side === "east" || side === "west" ? 1.08 : 0.96;
  return Math.round(base * groundScale * sideScale / 10_000) * 10_000;
}

export function campusPlotIsOwned(
  x: number,
  z: number,
  width: number,
  depth: number,
  siteInnerX: number,
  siteInnerZ: number,
  acquiredLand: StadiumLandSide[] = [],
) {
  const baseLimitX = siteInnerX + 65;
  const baseLimitZ = siteInnerZ + 65;
  if (Math.abs(x) + width / 2 <= baseLimitX && Math.abs(z) + depth / 2 <= baseLimitZ) return true;

  return acquiredLand.some((side) => {
    const plot = getStadiumLandParcel(siteInnerX, siteInnerZ, side);
    return Math.abs(x - plot.centerX) + width / 2 <= plot.width / 2 && Math.abs(z - plot.centerZ) + depth / 2 <= plot.depth / 2;
  });
}

export const FACILITY_DESIGNS: Record<StadiumFacilityKey, { label: string; styles: string[]; defaultStyle: string; defaultLocation: FacilityLocation }> = {
  carPark: { label: "Car park", styles: ["Gravel terrace", "Marked asphalt", "Open parking deck", "Solar canopy"], defaultStyle: "Gravel terrace", defaultLocation: "east" },
  superstore: { label: "Superstore", styles: ["Heritage brick", "Flagship glass", "Market hall"], defaultStyle: "Heritage brick", defaultLocation: "west" },
  restaurant: { label: "Restaurant", styles: ["Clubhouse grill", "Garden courtyard", "Glass dining room"], defaultStyle: "Clubhouse grill", defaultLocation: "north" },
  hotel: { label: "Hotel", styles: ["Boutique brick", "City glass tower", "Garden hotel"], defaultStyle: "Boutique brick", defaultLocation: "south" },
  fanZone: { label: "Fan zone", styles: ["Covered terrace", "Family garden", "Street food court"], defaultStyle: "Covered terrace", defaultLocation: "north" },
  museum: { label: "Museum", styles: ["Heritage pavilion", "Interactive gallery", "Club archive"], defaultStyle: "Heritage pavilion", defaultLocation: "west" },
  transportHub: { label: "Transport hub", styles: ["Coach terminal", "Rail plaza", "Mobility interchange"], defaultStyle: "Coach terminal", defaultLocation: "east" },
  trainingGround: { label: "Training centre", styles: ["Performance centre", "Brick pavilion", "Glass performance lab"], defaultStyle: "Performance centre", defaultLocation: "west" },
  trainingPitches: { label: "Training pitches", styles: ["Natural grass complex", "Hybrid training park", "All-weather campus"], defaultStyle: "Natural grass complex", defaultLocation: "north" },
  academy: { label: "Academy campus", styles: ["Academy lodge", "Learning campus", "Player pathway centre"], defaultStyle: "Academy lodge", defaultLocation: "east" },
  youthStadium: { label: "Youth stadium", styles: ["Community bowl", "Academy terrace", "Covered youth arena"], defaultStyle: "Community bowl", defaultLocation: "south" },
};

export const FACILITY_SIZES: FacilitySize[] = ["Compact", "Standard", "Flagship"];
export const FACILITY_LOCATIONS: { id: FacilityLocation; label: string }[] = [
  { id: "north", label: "North approach" }, { id: "east", label: "East precinct" },
  { id: "south", label: "South approach" }, { id: "west", label: "West precinct" },
];

const DEFAULT_SIZE: FacilitySize = "Standard";
const SIZE_FACTOR: Record<FacilitySize, number> = { Compact: 0.72, Standard: 1, Flagship: 1.65 };
const PREMIUM_STYLES = new Set(["Flagship glass", "Glass dining room", "City glass tower", "Interactive gallery", "Solar canopy", "Mobility interchange", "Glass performance lab", "Hybrid training park", "Learning campus", "Covered youth arena"]);
const VALUE_STYLES = new Set(["Gravel terrace", "Heritage brick", "Clubhouse grill", "Covered terrace", "Coach terminal", "Natural grass complex", "Academy lodge", "Community bowl"]);
const REVENUE_STYLES = new Set(["Flagship glass", "Market hall", "Glass dining room", "City glass tower", "Street food court", "Interactive gallery", "Mobility interchange"]);

export function defaultFacilityPlan(): StadiumFacilityPlan {
  return Object.fromEntries(Object.entries(FACILITY_DESIGNS).map(([key, definition]) => [key, { style: definition.defaultStyle, size: DEFAULT_SIZE, location: definition.defaultLocation }])) as StadiumFacilityPlan;
}

export function normalizeFacilityPlan(plan?: Partial<StadiumFacilityPlan>): StadiumFacilityPlan {
  const defaults = defaultFacilityPlan();
  for (const key of Object.keys(FACILITY_DESIGNS) as StadiumFacilityKey[]) {
    const candidate = plan?.[key];
    if (!candidate) continue;
    defaults[key] = {
      style: FACILITY_DESIGNS[key].styles.includes(candidate.style) ? candidate.style : defaults[key].style,
      size: FACILITY_SIZES.includes(candidate.size) ? candidate.size : defaults[key].size,
      location: FACILITY_LOCATIONS.some((location) => location.id === candidate.location) ? candidate.location : defaults[key].location,
      ...(candidate.position && Number.isFinite(candidate.position.x) && Number.isFinite(candidate.position.z)
        ? { position: { x: Math.max(-320, Math.min(320, candidate.position.x)), z: Math.max(-320, Math.min(320, candidate.position.z)) } }
        : {}),
    };
  }
  return defaults;
}

export function facilitySizeFactor(size: FacilitySize) {
  return SIZE_FACTOR[size];
}

export function facilityBuildFactor(layout: FacilityLayout) {
  const stylePremium = PREMIUM_STYLES.has(layout.style) ? 0.24 : VALUE_STYLES.has(layout.style) ? -0.06 : 0.08;
  return SIZE_FACTOR[layout.size] * (1 + stylePremium);
}

export function facilityRevenueFactor(layout: FacilityLayout) {
  return SIZE_FACTOR[layout.size] * (REVENUE_STYLES.has(layout.style) ? 1.12 : 1);
}

export function facilityLayoutChangeCost(baseCost: number, previous: FacilityLayout, next: FacilityLayout) {
  const moved = Math.hypot((previous.position?.x ?? 0) - (next.position?.x ?? 0), (previous.position?.z ?? 0) - (next.position?.z ?? 0)) > 1;
  if (previous.style === next.style && previous.size === next.size && previous.location === next.location && !moved) return 0;
  const sizeRefit = Math.abs(SIZE_FACTOR[next.size] - SIZE_FACTOR[previous.size]) * 0.55;
  const styleRefit = previous.style === next.style ? 0 : 0.2 + (PREMIUM_STYLES.has(next.style) ? 0.12 : 0);
  const siteRefit = (previous.location === next.location && !moved) ? 0 : moved ? 0.22 : 0.14;
  return Math.round(baseCost * (0.12 + sizeRefit + styleRefit + siteRefit));
}
