"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Activity, BadgeCheck, Building2, Check, Clock3, Dumbbell, GraduationCap, Lightbulb, MapPinned, Search, Store, Trophy, Wrench } from "lucide-react";
import { estimateStadiumCommercialIncome, getClub, getClubFacilityUpgradeCost, normalizeCareer, startStadiumProject, upgradeClubFacility } from "@/lib/game";
import { formatGameDistance } from "@/lib/game-settings";
import { STAND_DESIGN_OPTIONS, STAND_FACADES, STAND_FRONTAGES, STAND_STRUCTURES, defaultExecutiveBoxes, defaultStandDesigns, defaultStandFacades, defaultStandFrontages, defaultStandNames, defaultStandRoofs, defaultStandSeatColors, getStandBuildCost, getStandDesign, getStandTierChangeCost, standCapacityFactor } from "@/lib/stadium-designs";
import { FACILITY_DESIGNS, FACILITY_LOCATIONS, FACILITY_SIZES, defaultFacilityPlan, facilityBuildFactor, facilityLayoutChangeCost, facilitySizeFactor, normalizeFacilityPlan, siteParcelAcquisitionCost, STADIUM_LAND_SIDES } from "@/lib/stadium-facilities";
import type { FacilityLayout, FacilitySize, StadiumFacilityKey, StadiumFacilityPlan, StadiumLandSide } from "@/lib/stadium-facilities";
import type { Career, CornerSide, CornerStands, Roof, StandDesignId, StandDesigns, StandFacades, StandFrontages, StandNames, StandRoofs, StandSeatColors, ExecutiveBoxesBySide, StandSide, StandTiers, Stadium } from "@/lib/game";

const SIDES: { id: StandSide; label: string }[] = [
  { id: "north", label: "North stand" }, { id: "east", label: "East stand" },
  { id: "south", label: "South stand" }, { id: "west", label: "West stand" },
];
const ROOF_OPTIONS: Roof[] = ["Open sky", "Flat canopy", "Cantilever", "Continuous bowl", "Retractable roof", "Wave canopy", "Glazed shell", "Lattice roof"];
const ROOF_COST: Record<Roof, number> = { "Open sky": 0, "Flat canopy": 180_000, Cantilever: 310_000, "Continuous bowl": 560_000, "Retractable roof": 1_450_000, "Wave canopy": 485_000, "Glazed shell": 760_000, "Lattice roof": 390_000 };
const CORNERS: { id: CornerSide; label: string }[] = [
  { id: "northWest", label: "North-west" }, { id: "northEast", label: "North-east" },
  { id: "southWest", label: "South-west" }, { id: "southEast", label: "South-east" },
];
const UPGRADE_TOOLS = [
  { id: "stands", label: "Stands", icon: Building2, target: "upgrade-stands" },
  { id: "youth", label: "Youth team", icon: GraduationCap, target: "upgrade-youth" },
  { id: "transport", label: "Transport", icon: MapPinned, target: "upgrade-transport" },
  { id: "land", label: "Land & plots", icon: Building2, target: "upgrade-land" },
  { id: "commercial", label: "Commercial", icon: Store, target: "upgrade-commercial" },
  { id: "pitch", label: "Pitch & safety", icon: Wrench, target: "upgrade-pitch" },
] as const;
const PROGRAM_FACILITIES: { key: "academyLevel" | "trainingLevel" | "scoutLevel"; name: string; detail: string; icon: typeof Store }[] = [
  { key: "academyLevel", name: "Academy programme", detail: "Coaching, recruitment reach and annual intake quality", icon: GraduationCap },
  { key: "trainingLevel", name: "Training & development", detail: "First-team coaching standards and player growth", icon: Dumbbell },
  { key: "scoutLevel", name: "Scouting network", detail: "Wider coverage and lower report costs", icon: Search },
];
const LEVEL_FACILITIES: { key: keyof Stadium; name: string; detail: string; unitCost: number; icon: typeof Store; group: "commercial" | "development"; asset?: StadiumFacilityKey }[] = [
  { key: "carParkLevel", asset: "carPark", name: "Car parks", detail: "Gravel terraces, marked bays and structured parking", unitCost: 520_000, icon: Building2, group: "commercial" },
  { key: "superstoreLevel", asset: "superstore", name: "Superstore", detail: "A recognisable club shop with a chosen frontage", unitCost: 390_000, icon: Store, group: "commercial" },
  { key: "restaurantLevel", asset: "restaurant", name: "Restaurants", detail: "Matchday dining with year-round trade", unitCost: 620_000, icon: Store, group: "commercial" },
  { key: "hotelLevel", asset: "hotel", name: "Stadium hotel", detail: "Rooms, events and a visible hotel profile", unitCost: 1_450_000, icon: Building2, group: "commercial" },
  { key: "fanZoneLevel", asset: "fanZone", name: "Supporters’ fan zone", detail: "Food, events and family facilities", unitCost: 360_000, icon: Store, group: "commercial" },
  { key: "museumLevel", asset: "museum", name: "Club museum", detail: "Tours and club-history exhibitions", unitCost: 310_000, icon: Building2, group: "commercial" },
  { key: "transportHubLevel", asset: "transportHub", name: "Transport hub", detail: "Rail, coach and active travel links", unitCost: 880_000, icon: Building2, group: "commercial" },
  { key: "siteRoadLevel", name: "Roads & pedestrian routes", detail: "Build the approach road, perimeter drive and landscaped walkways", unitCost: 245_000, icon: MapPinned, group: "commercial" },
  { key: "concourseLevel", name: "Concourse upgrade", detail: "Wider concourses and better kiosks", unitCost: 470_000, icon: Store, group: "commercial" },
  { key: "scoreboardLevel", name: "Scoreboard", detail: "Larger, sharper match presentation", unitCost: 235_000, icon: Building2, group: "commercial" },
  { key: "ledBoardsLevel", name: "LED advertising", detail: "Digital perimeter sponsorship", unitCost: 430_000, icon: Building2, group: "commercial" },
  { key: "securityLevel", name: "Safety systems", detail: "Turnstiles, cameras and stewarding", unitCost: 180_000, icon: BadgeCheck, group: "commercial" },
  { key: "groundskeepingLevel", name: "Grounds team", detail: "More frequent pitch care and upkeep", unitCost: 275_000, icon: Wrench, group: "commercial" },
  { key: "trainingCentreLevel", asset: "trainingGround", name: "First-team training centre", detail: "Gym, recovery suites and performance analysis", unitCost: 1_100_000, icon: Dumbbell, group: "development" },
  { key: "trainingPitchesLevel", asset: "trainingPitches", name: "Training pitches", detail: "Build grass, hybrid or all-weather practice fields", unitCost: 780_000, icon: Activity, group: "development" },
  { key: "academyCampusLevel", asset: "academy", name: "Academy campus", detail: "Classrooms, coaching rooms and youth changing", unitCost: 920_000, icon: GraduationCap, group: "development" },
  { key: "youthStadiumLevel", asset: "youthStadium", name: "Youth stadium", detail: "A dedicated ground for academy fixtures", unitCost: 1_250_000, icon: Trophy, group: "development" },
];

type Props = { career: Career; setCareer: (career: Career) => void };
export type Draft = Stadium & { standTiers: StandTiers; standDesigns: StandDesigns; standFacades: StandFacades; standFrontages: StandFrontages; standSeatColors: StandSeatColors; standNames: StandNames; standRoofs: StandRoofs; executiveBoxesBySide: ExecutiveBoxesBySide; cornerStands: CornerStands; facilityPlan: StadiumFacilityPlan; underfloorHeating: boolean; pitchSurface: "Natural grass" | "Hybrid 5G"; pitchCondition: number; carParkLevel: number; superstoreLevel: number; restaurantLevel: number; hotelLevel: number; fanZoneLevel: number; museumLevel: number; transportHubLevel: number; siteRoadLevel: number; trainingCentreLevel: number; trainingPitchesLevel: number; academyCampusLevel: number; youthStadiumLevel: number; concourseLevel: number; scoreboardLevel: number; ledBoardsLevel: number; securityLevel: number; groundskeepingLevel: number };
const StadiumScene = dynamic(() => import("./stadium-scene"), { ssr: false, loading: () => <div className="stadium-scene-loading">Assembling the stands…</div> });
const MONEY = (value: number) => `£${Math.round(value).toLocaleString("en-GB")}`;

function makeDraft(stadium: Stadium, clubColor = "#b8ca62", clubId?: string): Draft {
  return {
    ...stadium,
    acquiredLand: [...(stadium.acquiredLand ?? [])],
    standTiers: stadium.standTiers ?? { north: stadium.tiers, east: stadium.tiers, south: stadium.tiers, west: stadium.tiers },
    standDesigns: stadium.standDesigns ?? defaultStandDesigns(stadium.architecture, clubId),
    standFacades: stadium.standFacades ?? defaultStandFacades(stadium.standDesigns ?? defaultStandDesigns(stadium.architecture, clubId)),
    standFrontages: stadium.standFrontages ?? defaultStandFrontages(),
    standSeatColors: stadium.standSeatColors ?? defaultStandSeatColors(clubColor),
    standNames: stadium.standNames ?? defaultStandNames(stadium.name),
    standRoofs: stadium.standRoofs ?? defaultStandRoofs(stadium.roof),
    executiveBoxesBySide: stadium.executiveBoxesBySide ?? defaultExecutiveBoxes(stadium.boxes),
    boxes: Object.values(stadium.executiveBoxesBySide ?? defaultExecutiveBoxes(stadium.boxes)).reduce((sum, value) => sum + value, 0),
    cornerStands: stadium.cornerStands ?? { northWest: stadium.corners, northEast: stadium.corners, southWest: stadium.corners, southEast: stadium.corners },
    facilityPlan: normalizeFacilityPlan(stadium.facilityPlan ?? defaultFacilityPlan()),
    underfloorHeating: stadium.underfloorHeating ?? false,
    pitchSurface: stadium.pitchSurface ?? "Natural grass",
    pitchCondition: stadium.pitchCondition ?? 82,
    carParkLevel: stadium.carParkLevel ?? Number(stadium.carPark), superstoreLevel: stadium.superstoreLevel ?? Number(stadium.superstore),
    restaurantLevel: stadium.restaurantLevel ?? Number(stadium.restaurant), hotelLevel: stadium.hotelLevel ?? Number(stadium.hotel),
    fanZoneLevel: stadium.fanZoneLevel ?? 0, museumLevel: stadium.museumLevel ?? 0, transportHubLevel: stadium.transportHubLevel ?? 0,
    trainingCentreLevel: stadium.trainingCentreLevel ?? 0, trainingPitchesLevel: stadium.trainingPitchesLevel ?? 0,
    academyCampusLevel: stadium.academyCampusLevel ?? 0, youthStadiumLevel: stadium.youthStadiumLevel ?? 0,
    siteRoadLevel: stadium.siteRoadLevel ?? 0,
    concourseLevel: stadium.concourseLevel ?? 1, scoreboardLevel: stadium.scoreboardLevel ?? 1, ledBoardsLevel: stadium.ledBoardsLevel ?? 0,
    securityLevel: stadium.securityLevel ?? 1, groundskeepingLevel: stadium.groundskeepingLevel ?? 1,
  };
}

export function createStadiumDraft(stadium: Stadium, clubColor: string, clubId: string) {
  return makeDraft(stadium, clubColor, clubId);
}

function StandProfileArt({ designId, tiers, color, className }: { designId: StandDesignId; tiers: number; color: string; className?: string }) {
  const design = getStandDesign(designId);
  const uniqueId = useId().replaceAll(":", "");
  const structure = STAND_STRUCTURES[design.profile];
  const levels = Math.max(1, Math.min(4, tiers));
  const width = Math.min(160, 135 * structure.spanFactor);
  const left = (200 - width) / 2;
  const right = left + width;
  const giant = design.profile === "giant-end";
  const height = giant ? 56 : structure.rowFactor < 0.8 ? 30 : structure.rowFactor > 1.12 ? 48 : 40;
  const baseY = 78;
  const topY = baseY - height;
  const roofed = design.profile !== "terrace" && design.profile !== "open-bank";
  const roofHigh = topY - (giant ? 10 : structure.overhang > 10 ? 11 : 7);
  const frame = design.profile === "truss" || design.profile === "modular" || design.profile === "ribbon" || giant;
  const glazed = design.profile === "glass" || design.profile === "hospitality" || design.profile === "asymmetric";
  const brick = design.profile === "heritage" || design.profile === "brick-pavilion";
  const modular = design.profile === "modular";
  const standing = design.profile === "standing";
  const seatColor = color;
  return <svg className={className} viewBox="0 0 200 96" role="img" aria-label={`${design.name}, ${levels} tier${levels === 1 ? "" : "s"} structural preview`}>
    <defs>
      <linearGradient id={`stand-art-sky-${uniqueId}`} x1="0" x2="0.8" y1="0" y2="1"><stop stopColor="#627c6e" /><stop offset="1" stopColor="#24352d" /></linearGradient>
      <linearGradient id={`stand-art-deck-${uniqueId}`} x1="0" x2="1" y1="0" y2="1"><stop stopColor={seatColor} /><stop offset="1" stopColor="#17251d" /></linearGradient>
    </defs>
    <rect width="200" height="96" fill={`url(#stand-art-sky-${uniqueId})`} />
    <path d="M8 83H192" stroke="#9aab91" strokeWidth="1" opacity=".7" />
    <ellipse cx="101" cy="84" rx={width * 0.47} ry="5" fill="#07100c" opacity=".55" />
    {Array.from({ length: levels }, (_, tier) => {
      const deckHeight = height / levels;
      const tierBottom = baseY - tier * deckHeight;
      const tierTop = tierBottom - deckHeight + 2;
      const outerL = left + tier * (giant ? 4 : 2.8);
      const outerR = right - tier * (giant ? 1.8 : 2.8);
      const innerL = left + width * (giant ? 0.36 : 0.28);
      const innerR = right - width * 0.1;
      const deck = `M${outerL} ${tierBottom} L${innerL} ${tierTop} L${innerR} ${tierTop + 2} L${outerR} ${tierBottom}Z`;
      const lines = Array.from({ length: giant ? 12 : 7 }, (_, row) => {
        const t = (row + 1) / (giant ? 13 : 8);
        const y = tierBottom - t * (deckHeight - 4);
        const x1 = outerL + (innerL - outerL) * t + 2;
        const x2 = outerR + (innerR - outerR) * t - 2;
        return <path key={`${tier}-${row}`} d={`M${x1} ${y} L${x2} ${y}`} stroke={row % 2 ? "#d7d8c5" : seatColor} strokeWidth={giant ? 1.35 : 1.7} opacity=".92" />;
      });
      return <g key={tier}>
        <path d={deck} fill={`url(#stand-art-deck-${uniqueId})`} stroke="#d8dec9" strokeWidth="1.3" />
        {lines}
        {tier < levels - 1 && <path d={`M${outerL - 1} ${tierBottom + 1} L${outerR + 1} ${tierBottom + 1}`} stroke="#f1dda2" strokeWidth="2.2" />}
      </g>;
    })}
    <path d={`M${left - 2} ${baseY - 1} H${right + 2} V84 H${left - 2}Z`} fill={brick ? "#9b6d4e" : glazed ? "#8db5ae" : "#455850"} stroke="#e4d2a5" strokeWidth="1" opacity={glazed ? ".82" : ".97"} />
    {brick && <g stroke="#c19570" strokeWidth=".7" opacity=".78">{Array.from({ length: 4 }, (_, row) => <path key={`course-${row}`} d={`M${left + 4} ${80 + row} H${right - 4}`} />)}{Array.from({ length: 5 }, (_, bay) => <path key={`joint-${bay}`} d={`M${left + 11 + bay * (width - 22) / 5} 80 V${81 + bay % 2 * 2}`} />)}</g>}
    {glazed && Array.from({ length: 11 }, (_, index) => <path key={index} d={`M${left + 7 + index * (width - 14) / 10} ${baseY} V84`} stroke="#d5e5db" strokeWidth=".7" opacity=".9" />)}
    {design.profile === "hospitality" && <g><path d={`M${left + 9} ${baseY - 13} H${right - 9} V${baseY - 7} H${left + 9}Z`} fill="#314d46" stroke="#d9bd78" strokeWidth="1" />{Array.from({ length: 7 }, (_, index) => <rect key={index} x={left + 13 + index * (width - 32) / 7} y={baseY - 12} width="4" height="4" fill="#b9d4c7" />)}</g>}
    {standing && Array.from({ length: Math.min(4, levels) }, (_, index) => <path key={index} d={`M${left + 7 + index * 2} ${baseY - 4 - index * height / levels} H${right - 7 - index * 2}`} stroke="#e0bd65" strokeWidth="1.2" />)}
    {modular && <g stroke="#e4e5d5" strokeWidth="1.25" fill="none">{[-1, 0, 1].map((bay) => <path key={bay} d={`M${100 + bay * width * .27} ${baseY} V${topY + 4} M${91 + bay * width * .27} ${baseY - 2} H${109 + bay * width * .27}`} />)}</g>}
    {roofed && <path d={design.profile === "bowl" || design.profile === "crescent" ? `M${left - 12} ${roofHigh + 5} Q100 ${roofHigh - 12} ${right + 12} ${roofHigh + 5}` : `M${left - (structure.overhang / 2)} ${roofHigh + (design.profile === "asymmetric" ? 7 : 3)} L${right + structure.overhang / 2} ${roofHigh - (design.profile === "asymmetric" ? 6 : 1)}`} fill="none" stroke={design.profile === "glass" ? "#d6e6da" : "#d4d6c5"} strokeWidth={design.profile === "ribbon" || giant ? 4 : 3} strokeLinecap="round" />}
    {frame && <g stroke={design.profile === "modular" ? "#d7dac5" : "#c7b878"} strokeWidth={giant ? 2.1 : 1.4} fill="none"><path d={`M${left + 9} ${baseY - 2} L${left + 21} ${topY - 2} L${left + 34} ${baseY - 2} M${right - 35} ${baseY - 2} L${right - 22} ${topY - 2} L${right - 9} ${baseY - 2}`} />{design.profile === "truss" && <path d={`M${left + 13} ${baseY - 6} L${left + 25} ${baseY - 6} L${left + 21} ${topY + 2}Z M${right - 13} ${baseY - 6} L${right - 25} ${baseY - 6} L${right - 21} ${topY + 2}Z`} />}</g>}
  </svg>;
}

function StandBlueprint({ designId, tiers, seating, color }: { designId: StandDesignId; tiers: number; seating: boolean; color: string }) {
  const design = getStandDesign(designId);
  const index = Math.max(0, STAND_DESIGN_OPTIONS.findIndex((option) => option.id === designId));
  const atlasIndex = index % 12;
  const cell = atlasIndex % 6;
  const column = cell % 3;
  const row = Math.floor(cell / 3);
  const image = atlasIndex < 6 ? "/stadium-stand-options.png" : "/stadium-stand-options-2.png";
  return <span className={`stand-render-thumb ${seating ? "seated" : "terrace"}`} role="img" aria-label={`${design.name}, ${tiers} tier${tiers === 1 ? "" : "s"} photographic design reference`} style={{ backgroundImage: `linear-gradient(0deg,#08120fe0,transparent 52%),url("${image}")`, backgroundSize: "100% 100%,300% 200%", backgroundPosition: `center,${column * 50}% ${row * 100}%` }}><span className="stand-thumb-tier">{tiers} TIER{tiers === 1 ? "" : "S"}</span><span className="stand-thumb-seat"><i style={{ backgroundColor: color }} />{seating ? "SEATED" : "TERRACE"}</span></span>;
}

function StandGalleryPhoto({ designId, tiers, color }: { designId: StandDesignId; tiers: number; color: string }) {
  const design = getStandDesign(designId);
  const index = Math.max(0, STAND_DESIGN_OPTIONS.findIndex((option) => option.id === designId));
  const atlasIndex = index % 12;
  const cell = atlasIndex % 6;
  const column = cell % 3;
  const row = Math.floor(cell / 3);
  const image = atlasIndex < 6 ? "/stadium-stand-options.png" : "/stadium-stand-options-2.png";
  return <span className="stand-gallery-art" role="img" aria-label={`${design.name}, ${tiers} tier${tiers === 1 ? "" : "s"} example`} style={{ backgroundImage: `linear-gradient(0deg,#08120fe8,transparent 65%),url("${image}")`, backgroundSize: "100% 100%,300% 200%", backgroundPosition: `center,${column * 50}% ${row * 100}%` }}><span className="stand-photo-tier">{tiers} TIER{tiers === 1 ? "" : "S"}</span><span className="stand-photo-seat"><i style={{ backgroundColor: color }} />SEAT FINISH</span></span>;
}

const FACILITY_PHOTO_CELLS: Record<StadiumFacilityKey, [number, number]> = {
  carPark: [1, 0], superstore: [0, 0], restaurant: [2, 0], hotel: [0, 1], fanZone: [2, 1], museum: [1, 1], transportHub: [1, 0],
  trainingGround: [0, 0], trainingPitches: [2, 1], academy: [0, 1], youthStadium: [2, 1],
};
const FACILITY_SIZE_CAPTION: Record<FacilitySize, string> = { Compact: "72% footprint", Standard: "Standard plot", Flagship: "165% footprint" };

function FacilitySizePhoto({ asset, size }: { asset: StadiumFacilityKey; size: FacilitySize }) {
  const [column, row] = FACILITY_PHOTO_CELLS[asset];
  const scale = facilitySizeFactor(size);
  return <span className={`facility-size-visual size-${size.toLowerCase()}`} aria-hidden="true"><i style={{ backgroundImage: "url('/stadium-facilities-contact-sheet.png')", backgroundSize: "300% 200%", backgroundPosition: `${column * 50}% ${row * 100}%`, transform: `scale(${scale})` }} /></span>;
}

function CornerBlueprint({ connected, color }: { connected: boolean; color: string }) {
  return <span className={`corner-render-thumb ${connected ? "connected" : "open"}`} role="img" aria-label={connected ? "Enclosed curved corner stand preview" : "Open stadium corner preview"} style={{ backgroundImage: `linear-gradient(0deg, #09120f88, transparent 40%), url("/stadium-stand-options.png")`, backgroundSize: "100% 100%, 300% 200%", backgroundPosition: "center, 50% 100%", outlineColor: color }} />;
}

export default function StadiumArchitect({ career, setCareer }: Props) {
  const club = getClub(career);
  const stadium = club.stadium;
  const seatColorOptions = useMemo(() => [
    { label: "Club home colour", value: club.colors[0] },
    { label: "Club away colour", value: club.colors[1] },
    { label: "Ivory", value: "#e4dfc9" },
    { label: "Antique gold", value: "#d2aa4c" },
    { label: "Garnet red", value: "#9a3b37" },
    { label: "Harbour blue", value: "#375b83" },
    { label: "Midnight charcoal", value: "#252c2b" },
  ].filter((option, index, options) => options.findIndex((candidate) => candidate.value.toLowerCase() === option.value.toLowerCase()) === index), [club.colors]);
  const [draft, setDraft] = useState<Draft>(() => { const current = normalizeCareer(career).clubs.find((item) => item.id === career.clubId)!.stadium; return makeDraft({ ...current, ...(current.project?.upgrades ?? {}) }, club.colors[0], club.id); });
  const [message, setMessage] = useState("");
  const [pickerSide, setPickerSide] = useState<StandSide | null>(null);
  const [selectedStand, setSelectedStand] = useState<StandSide | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<StadiumFacilityKey | null>(null);
  const [placementFacility, setPlacementFacility] = useState<StadiumFacilityKey | null>(null);
  const [activeUpgradeTool, setActiveUpgradeTool] = useState<(typeof UPGRADE_TOOLS)[number]["id"]>("stands");
  const [placementBaseline, setPlacementBaseline] = useState<{ key: StadiumFacilityKey; levelKey: keyof Stadium; beforeLevel: number; before?: { x: number; z: number } } | null>(null);
  const [placementDecision, setPlacementDecision] = useState<{ key: StadiumFacilityKey; levelKey: keyof Stadium; beforeLevel: number; before?: { x: number; z: number }; placed: { x: number; z: number } } | null>(null);
  const selectStand = useCallback((side: StandSide) => { setSelectedStand(side); setPickerSide(null); }, []);
  useEffect(() => setDraft(makeDraft({ ...stadium, ...(stadium.project?.upgrades ?? {}) }, club.colors[0], club.id)), [career.clubId, stadium.capacity, stadium.tiers, stadium.project?.weeksLeft, club.colors, club.id]);

  const cost = useMemo(() => {
    const currentDesigns = stadium.standDesigns ?? defaultStandDesigns(stadium.architecture, club.id);
    const currentFacades = stadium.standFacades ?? defaultStandFacades(currentDesigns);
    const currentFrontages = stadium.standFrontages ?? defaultStandFrontages();
    const currentSeatColors = stadium.standSeatColors ?? defaultStandSeatColors(club.colors[0]);
    const currentNames = stadium.standNames ?? defaultStandNames(stadium.name);
    const currentRoofs = stadium.standRoofs ?? defaultStandRoofs(stadium.roof);
    const currentBoxes = stadium.executiveBoxesBySide ?? defaultExecutiveBoxes(stadium.boxes);
    const standCost = SIDES.reduce((sum, side) => {
      const currentTier = stadium.standTiers?.[side.id] ?? stadium.tiers;
      return sum + (draft.standDesigns[side.id] === currentDesigns[side.id]
        ? getStandTierChangeCost(draft.standDesigns[side.id], currentTier, draft.standTiers[side.id], stadium.capacity)
        : getStandBuildCost(draft.standDesigns[side.id], draft.standTiers[side.id], stadium.capacity));
    }, 0);
    const finishCost = SIDES.reduce((sum, side) => sum + (draft.standFacades[side.id] === currentFacades[side.id] ? 0 : 330_000) + (draft.standFrontages[side.id] === currentFrontages[side.id] ? 0 : 285_000) + (draft.standSeatColors[side.id] === currentSeatColors[side.id] ? 0 : 72_000) + (draft.standNames[side.id] === currentNames[side.id] ? 0 : 18_000), 0);
    const roofCost = SIDES.reduce((sum, side) => sum + (draft.standDesigns[side.id] !== currentDesigns[side.id] || draft.standRoofs[side.id] === currentRoofs[side.id] ? 0 : ROOF_COST[draft.standRoofs[side.id]]), 0);
    const boxCost = SIDES.reduce((sum, side) => sum + Math.abs(draft.executiveBoxesBySide[side.id] - currentBoxes[side.id]) * 18_000, 0);
    const cornerCost = CORNERS.reduce((sum, corner) => sum + (draft.cornerStands[corner.id] !== (stadium.cornerStands?.[corner.id] ?? stadium.corners) ? 265_000 : 0), 0);
    const oldFacilityPlan = normalizeFacilityPlan(stadium.facilityPlan);
    const facilityCost = LEVEL_FACILITIES.reduce((sum, item) => {
      const previousLevel = Number(stadium[item.key] ?? 0);
      const nextLevel = Number(draft[item.key] ?? 0);
      const layout = item.asset ? draft.facilityPlan[item.asset] : null;
      const previousLayout = item.asset ? oldFacilityPlan[item.asset] : null;
      const constructionCost = layout ? Math.abs(nextLevel - previousLevel) * item.unitCost * facilityBuildFactor(layout) : Math.abs(nextLevel - previousLevel) * item.unitCost;
      const refitCost = layout && previousLayout && previousLevel > 0 && nextLevel > 0 ? facilityLayoutChangeCost(item.unitCost, previousLayout, layout) : 0;
      return sum + constructionCost + refitCost;
    }, 0);
    const seatingCost = (draft.seats !== stadium.seats ? 180_000 : 0) + (draft.standing !== stadium.standing ? 190_000 : 0);
    const ownedLand = new Set(stadium.acquiredLand ?? []);
    const landCost = (draft.acquiredLand ?? []).filter((side) => !ownedLand.has(side)).reduce((sum, side) => sum + siteParcelAcquisitionCost(stadium.siteSetting, side, stadium.capacity), 0);
    return standCost + finishCost + roofCost + boxCost + cornerCost + facilityCost + landCost + seatingCost + Math.abs(draft.floodlights - stadium.floodlights) * 145_000 + Math.abs(draft.pitchQuality - stadium.pitchQuality) * 150_000 + Math.ceil(Math.abs(draft.drainage - stadium.drainage) / 20) * 65_000 + (draft.pitchSurface !== (stadium.pitchSurface ?? "Natural grass") ? 1_050_000 : 0) + (draft.underfloorHeating !== (stadium.underfloorHeating ?? false) ? 1_300_000 : 0) + (draft.pitchCondition === 100 && (stadium.pitchCondition ?? 82) < 100 ? 420_000 : 0);
  }, [club.colors, club.id, draft, stadium]);
  const currentCommercialIncome = estimateStadiumCommercialIncome(stadium, club.reputation);
  const projectedCommercialIncome = estimateStadiumCommercialIncome(draft, club.reputation);
  const nextIncomePerExecutiveSuite = Math.round((350 + club.reputation * 1.2) * (0.65 + club.reputation / 100));
  const changed = cost > 0;
  const duration = Math.max(2, Math.ceil(cost / 850_000));
  const capacity = useMemo(() => {
    const currentDesigns = stadium.standDesigns ?? defaultStandDesigns(stadium.architecture, club.id);
    const designDelta = SIDES.reduce((sum, side) => sum + standCapacityFactor(draft.standDesigns[side.id]) - standCapacityFactor(currentDesigns[side.id]), 0) / SIDES.length;
    const tierDelta = SIDES.reduce((sum, side) => sum + draft.standTiers[side.id] - (stadium.standTiers?.[side.id] ?? stadium.tiers), 0) * 0.047;
    const cornerDelta = CORNERS.reduce((sum, corner) => sum + Number(draft.cornerStands[corner.id]) - Number(stadium.cornerStands?.[corner.id] ?? stadium.corners), 0) * 0.014;
    const seatingDelta = draft.seats === stadium.seats ? 0 : draft.seats ? -0.055 : 0.075;
    const standingDelta = draft.standing === stadium.standing ? 0 : draft.standing ? 0.035 : -0.025;
    return Math.max(5000, Math.round(stadium.capacity * (1 + designDelta + tierDelta + cornerDelta + seatingDelta + standingDelta) / 100) * 100);
  }, [club.id, draft, stadium]);

  const change = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const updateSideTier = (side: StandSide, delta: number) => change("standTiers", { ...draft.standTiers, [side]: Math.max(1, Math.min(4, draft.standTiers[side] + delta)) });
  const chooseStandDesign = (side: StandSide, designId: StandDesignId) => {
    const selectedDesign = getStandDesign(designId);
    setDraft((current) => ({
      ...current,
      standDesigns: { ...current.standDesigns, [side]: designId },
      standRoofs: { ...current.standRoofs, [side]: selectedDesign.roof },
      standTiers: { ...current.standTiers, [side]: selectedDesign.preferredTiers },
      standFacades: { ...current.standFacades, [side]: defaultStandFacades({ ...current.standDesigns, [side]: designId })[side] },
    }));
  };
  const updateFacilityLayout = <K extends keyof FacilityLayout>(key: StadiumFacilityKey, field: K, value: FacilityLayout[K]) => {
    if (field === "location") {
      setPlacementDecision((current) => current?.key === key ? null : current);
      setPlacementBaseline((current) => current?.key === key ? null : current);
    }
    setDraft((current) => {
    const layout = { ...current.facilityPlan[key], [field]: value };
    if (field === "location") layout.position = undefined;
    return { ...current, facilityPlan: { ...current.facilityPlan, [key]: layout } };
    });
  };
  const updateStandSetting = <K extends "standFacades" | "standFrontages" | "standSeatColors" | "standNames", V extends string>(map: K, side: StandSide, value: V) => setDraft((current) => ({ ...current, [map]: { ...current[map], [side]: value } }));
  const placeFacility = useCallback((key: StadiumFacilityKey, position: { x: number; z: number }) => {
    const baseline = placementBaseline?.key === key ? placementBaseline : undefined;
    const facility = LEVEL_FACILITIES.find((item) => item.asset === key);
    if (!facility) return;
    setPlacementDecision({ key, levelKey: facility.key, beforeLevel: baseline?.beforeLevel ?? Number(draft[facility.key] ?? 0), before: baseline?.before ?? draft.facilityPlan[key].position, placed: position });
    setDraft((current) => ({ ...current, facilityPlan: { ...current.facilityPlan, [key]: { ...current.facilityPlan[key], position } } }));
    setPlacementFacility(null);
    setPlacementBaseline(null);
  }, [draft, placementBaseline]);
  const confirmFacilityPlacement = () => { setPlacementDecision(null); setMessage("Building location confirmed. Submit the full campus plan for board approval when ready."); };
  const undoFacilityPlacement = () => {
    if (!placementDecision) return;
    const { key, before, beforeLevel, levelKey } = placementDecision;
    setDraft((current) => ({ ...current, [levelKey]: beforeLevel, facilityPlan: { ...current.facilityPlan, [key]: { ...current.facilityPlan[key], position: before } } }));
    setPlacementDecision(null);
    setPlacementBaseline(null);
    setMessage(`${FACILITY_DESIGNS[key].label} moved back to its previous plot.`);
  };
  const startFacilityPlacement = (asset: StadiumFacilityKey, levelKey: keyof Stadium, level: number, position?: { x: number; z: number }) => {
    if (placementDecision) return;
    if (placementFacility === asset) {
      setPlacementFacility(null);
      if (level === 0) change(levelKey, 0 as Stadium[typeof levelKey]);
      setPlacementBaseline(null);
      return;
    }
    setPlacementBaseline({ key: asset, levelKey, beforeLevel: level, before: position });
    if (level === 0) change(levelKey, 1 as Stadium[typeof levelKey]);
    setSelectedFacility(asset);
    setPlacementFacility(asset);
    setMessage("");
  };
  const updateStandRoof = (side: StandSide, roof: Roof) => setDraft((current) => ({ ...current, standRoofs: { ...current.standRoofs, [side]: roof } }));
  const updateExecutiveBoxes = (side: StandSide, delta: number) => setDraft((current) => {
    const executiveBoxesBySide = { ...current.executiveBoxesBySide, [side]: Math.max(0, Math.min(48, current.executiveBoxesBySide[side] + delta * 4)) };
    return { ...current, executiveBoxesBySide, boxes: Object.values(executiveBoxesBySide).reduce((sum, value) => sum + value, 0) };
  });
  const toggleCorner = (corner: CornerSide) => change("cornerStands", { ...draft.cornerStands, [corner]: !draft.cornerStands[corner] });
  const toggleLandAcquisition = (side: StadiumLandSide) => {
    if (stadium.acquiredLand?.includes(side)) return;
    setDraft((current) => {
      const proposed = new Set(current.acquiredLand ?? []);
      if (proposed.has(side)) proposed.delete(side);
      else proposed.add(side);
      return { ...current, acquiredLand: [...proposed] };
    });
  };
  const changeEveryRoof = (roof: Roof) => setDraft((current) => ({ ...current, roof, standRoofs: { north: roof, east: roof, south: roof, west: roof } }));
  const build = () => {
    if (!changed || stadium.project) return;
    if (placementDecision) { setMessage("Confirm or undo the current building location before submitting the project."); return; }
    if (capacity < 5000 || draft.floodlights < 1) { setMessage("League rules require at least 5,000 seats and working floodlights."); return; }
    const upgrades: Partial<Stadium> = {
      ...draft,
      tiers: Math.max(...Object.values(draft.standTiers)), boxes: Object.values(draft.executiveBoxesBySide).reduce((sum, value) => sum + value, 0), corners: Object.values(draft.cornerStands).every(Boolean), capacity,
      carPark: draft.carParkLevel > 0, superstore: draft.superstoreLevel > 0, restaurant: draft.restaurantLevel > 0, hotel: draft.hotelLevel > 0,
    };
    const name = draft.pitchCondition === 100 && (stadium.pitchCondition ?? 82) < 100 ? "Pitch relay and grounds renewal" : `Stadium redevelopment · ${club.name}`;
    const next = startStadiumProject(career, name, cost, duration, upgrades);
    if (next === career) setMessage(club.boardTrust < 35 ? "The board needs at least 35% confidence to approve the plan." : `The club needs more cash reserves to finance this £${cost.toLocaleString("en-GB")} project.`);
    else { setCareer(next); setMessage("The board approved the project. Matchday progress will continue into future seasons."); }
  };

  const renderFacilityEntries = (group: "commercial" | "development", area: "transport" | "commercial" | "development") => LEVEL_FACILITIES.filter((item) => {
    if (item.group !== group) return false;
    const transportItem = item.key === "carParkLevel" || item.key === "transportHubLevel" || item.key === "siteRoadLevel";
    return area === "development" ? group === "development" : area === "transport" ? transportItem : group === "commercial" && !transportItem;
  }).map(({ key, asset, name, detail, unitCost, icon: Icon }) => {
    const level = Number(draft[key] ?? 0);
    const yieldNext = level >= 3 ? 0 : estimateStadiumCommercialIncome({ ...draft, [key]: level + 1 }, club.reputation) - estimateStadiumCommercialIncome(draft, club.reputation);
    const layout = asset ? draft.facilityPlan[asset] : null;
    const editorOpen = Boolean(asset && selectedFacility === asset);
    return <article className="facility-level-entry" key={key}>
      <div className="facility-level-row">
        <span className="facility-icon"><Icon size={17} /></span>
        {asset && <span className={`facility-visual facility-photo facility-photo-${key}`} role="img" aria-label={`${name} visual example`}><span>{level > 0 ? `BUILT · LEVEL ${level}` : "DESIGN EXAMPLE"}</span></span>}
        {!asset && <span className="facility-road-visual" aria-hidden="true"><MapPinned size={22} /><i /></span>}
        <span className="facility-level-copy"><strong>{name}</strong><small>{detail}</small>{asset && <button type="button" className="facility-config-toggle" aria-expanded={editorOpen} onClick={() => setSelectedFacility(editorOpen ? null : asset)}>{editorOpen ? "Close design and site plan" : "Design & place"}</button>}</span>
        <div className="stepper"><button aria-label={`Reduce ${name}`} disabled={level <= 0} onClick={() => change(key, (level - 1) as Draft[typeof key])}>−</button><span>Lv {level}</span><button aria-label={`Preview or upgrade ${name}`} disabled={level >= 3} onClick={() => change(key, (level + 1) as Draft[typeof key])}>+</button></div>
        <small className="facility-unit-cost">{level >= 3 ? "MAX" : <>{MONEY(unitCost * (layout ? facilityBuildFactor(layout) : 1))}<br />{group === "development" ? "per upgrade" : asset ? `+${MONEY(yieldNext)}/MD` : "per level"}</>}</small>
      </div>
      {asset && editorOpen && layout && <div className="facility-layout-editor">
        <div className="facility-layout-heading"><span><small>LIVE 3D CAMPUS PREVIEW</small><strong>{FACILITY_DESIGNS[asset].label} · {layout.size}</strong></span><span>{level ? "Preview appears on the campus" : "Stage the first build to preview"}</span></div>
        <label className="facility-style-control">Architectural style<select className="field-select" value={layout.style} onChange={(event) => updateFacilityLayout(asset, "style", event.target.value)}>{FACILITY_DESIGNS[asset].styles.map((style) => <option key={style}>{style}</option>)}</select></label>
        <div className="facility-size-grid" role="group" aria-label={`${FACILITY_DESIGNS[asset].label} size`}>
          {FACILITY_SIZES.map((size) => <button type="button" key={size} className={`facility-size-choice ${layout.size === size ? "selected" : ""}`} aria-pressed={layout.size === size} onClick={() => updateFacilityLayout(asset, "size", size)}><FacilitySizePhoto asset={asset} size={size} /><strong>{size}</strong><small>{FACILITY_SIZE_CAPTION[size]}</small></button>)}
        </div>
        <label className="facility-location-control">Campus district<select className="field-select" value={layout.location} onChange={(event) => updateFacilityLayout(asset, "location", event.target.value as FacilityLayout["location"])}>{FACILITY_LOCATIONS.map((location) => <option value={location.id} key={location.id}>{location.label}</option>)}</select></label>
        <div className="facility-placement-actions"><span>{layout.position ? `Campus plot · ${Math.round(layout.position.x)}, ${Math.round(layout.position.z)}` : `Suggested plot · ${FACILITY_LOCATIONS.find((location) => location.id === layout.location)?.label}`}</span><button type="button" className={`button button-small ${placementFacility === asset ? "button-primary" : "button-secondary"}`} disabled={Boolean(placementDecision)} onClick={() => startFacilityPlacement(asset, key, level, layout.position)}>{placementFacility === asset ? "Cancel placement" : level > 0 ? "Move on campus" : "Place preview"}</button></div>
        <p>Click an open plot on the expanded campus. Confirm or undo the location before sending the full project to the board.</p>
      </div>}
    </article>;
  });

  const tiers = draft.standTiers;
  const colors = club.colors;
  const roofSelection = SIDES.every((side) => draft.standRoofs[side.id] === draft.standRoofs.north) ? draft.standRoofs.north : "Mixed roofs";
  const investInProgram = (facility: (typeof PROGRAM_FACILITIES)[number]["key"]) => {
    const currentClub = getClub(career);
    const price = getClubFacilityUpgradeCost(currentClub[facility], facility);
    const next = upgradeClubFacility(career, facility);
    if (next === career) setMessage(`The club needs ${MONEY(price)} available for this next level.`);
    else {
      setCareer(next);
      setMessage(`${PROGRAM_FACILITIES.find((item) => item.key === facility)?.name} improved to level ${getClub(next)[facility]}.`);
    }
  };
  const goToUpgrade = (tool: { id: (typeof UPGRADE_TOOLS)[number]["id"]; label: string; icon: typeof Building2; target: string }) => {
    setActiveUpgradeTool(tool.id);
    document.getElementById(tool.target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return <>
    <div className="section-heading"><div><p className="eyebrow">GROUND · CAMPUS · DEVELOPMENT</p><h1>Club Facilities</h1><p className="muted section-detail">Plan the ground and the wider club campus in one place. Preview changes before construction.</p></div><div className="venue-league-check"><BadgeCheck size={16} /><span>LEAGUE REQUIREMENTS</span><small>5,000 capacity · floodlights</small></div></div>
    <div className="stadium-layout stadium-layout-rich">
      <section className="stadium-preview-panel"><div className="stadium-preview-header"><div><p className="eyebrow">LIVE ARCHITECTURAL PREVIEW</p><h2>{stadium.name}</h2><span>{club.city} · {club.country}</span></div><div className="capacity-chip"><small>PROJECTED CAPACITY</small><strong>{capacity.toLocaleString("en-GB")}</strong></div></div>
        <div className="stadium-canvas rich-stadium-canvas"><StadiumScene club={club} draft={draft} selectedStand={selectedStand} onSelectStand={selectStand} placementFacility={placementFacility} onPlaceFacility={placeFacility} /></div>
        {placementDecision && <div className="facility-placement-confirmation" role="status"><div><small>LOCATION PREVIEW · {FACILITY_DESIGNS[placementDecision.key].label.toUpperCase()}</small><strong>Keep this plot?</strong><span>Campus coordinates {Math.round(placementDecision.placed.x)}, {Math.round(placementDecision.placed.z)}. The building remains a preview until board approval.</span></div><div><button type="button" className="button button-secondary button-small" onClick={undoFacilityPlacement}>Undo move</button><button type="button" className="button button-primary button-small" onClick={confirmFacilityPlacement}>Confirm location</button></div></div>}
        <div className={`stadium-selection-bar ${selectedStand ? "has-selection" : ""}`} aria-live="polite"><div><small>{selectedStand ? "STAND SELECTED IN THE 3D VIEW" : "STAND UPGRADE PLANNER"}</small><strong>{selectedStand ? SIDES.find((side) => side.id === selectedStand)?.label : "Click a stand in the stadium to begin"}</strong>{!selectedStand && <span>The selected stand will glow; its upgrade choices open below.</span>}</div>{selectedStand && <button type="button" className="button button-primary button-small" aria-expanded={pickerSide === selectedStand} onClick={() => setPickerSide(pickerSide === selectedStand ? null : selectedStand)}>{pickerSide === selectedStand ? "Close stand options" : "Choose stand upgrade"}</button>}</div>
        <div className="stadium-stats"><div><span>CAPACITY</span><strong>{capacity.toLocaleString("en-GB")}</strong></div><div><span>TIERS N / E / S / W</span><strong>{tiers.north} · {tiers.east} · {tiers.south} · {tiers.west}</strong></div><div><span>EXECUTIVE BOXES</span><strong>{draft.boxes}</strong></div><div><span>PITCH · {formatGameDistance(105)} × {formatGameDistance(68)}</span><strong>{draft.pitchCondition}% condition</strong></div></div>
        <div className="stadium-outlook stadium-income-outlook"><span><Lightbulb size={15} /> Matchday estimate from shops, hospitality, parking, partnerships and executive suites.</span><div className="stadium-income-compare"><span><small>NOW / HOME MATCH</small><strong>{MONEY(currentCommercialIncome)}</strong></span><b>→</b><span><small>AFTER PLAN</small><strong>{MONEY(projectedCommercialIncome)}</strong></span><em>{projectedCommercialIncome >= currentCommercialIncome ? "+" : "−"}{MONEY(Math.abs(projectedCommercialIncome - currentCommercialIncome))} / home game</em></div></div>
      </section>
      <section className="architect-controls"><nav className="facility-upgrade-toolbar" aria-label="Upgrade tools"><span>UPGRADE</span>{UPGRADE_TOOLS.map(({ id, label, icon: Icon, target }) => <button type="button" key={id} className={activeUpgradeTool === id ? "active" : ""} aria-current={activeUpgradeTool === id ? "location" : undefined} onClick={() => goToUpgrade({ id, label, icon: Icon, target })}><Icon size={16} /><span>{label}</span></button>)}</nav><div className="architect-control-content"><div id="upgrade-stands" className="panel card-pad rich-controls architect-tool-section">
        <div className="control-card-head"><div><p className="eyebrow">STAND DESIGN LIBRARY</p><h2>Build each side of the bowl</h2><small className="stand-live-note">Select a stand in the 360° view, choose Upgrade, then compare designs live. Preview changes only enter the plan; construction starts after board approval.</small></div><Building2 size={17} /></div>
        <label className="field-label" htmlFor="rich-roof">Apply one roof to all stands</label><select id="rich-roof" className="field-select" value={roofSelection} onChange={(event) => changeEveryRoof(event.target.value as Roof)}>{roofSelection === "Mixed roofs" && <option disabled>Mixed roofs</option>}{ROOF_OPTIONS.map((roof) => <option key={roof}>{roof}</option>)}</select>
        <div className="stand-tier-list">{SIDES.map((side) => {
          const designId = draft.standDesigns[side.id];
          const design = getStandDesign(designId);
          const sideRoof = draft.standRoofs[side.id];
          const suites = draft.executiveBoxesBySide[side.id];
          const open = pickerSide === side.id;
          const selected = selectedStand === side.id;
          return <article className={`stand-design-card ${open ? "picker-open" : ""} ${selected ? "stand-selected" : ""}`} key={side.id}>
            <div className="stand-option-main"><StandBlueprint designId={designId} tiers={tiers[side.id]} seating={draft.seats} color={draft.standSeatColors[side.id]} /><div className="stand-option-copy"><span className="eyebrow">{side.label.toUpperCase()} · {tiers[side.id]} TIER{tiers[side.id] === 1 ? "" : "S"}</span><strong>{design.name}</strong><small>{design.detail}</small><em>{sideRoof}</em></div><div className="stepper stand-tier-stepper"><button aria-label={`Reduce ${side.label} tier`} disabled={tiers[side.id] <= 1} onClick={() => updateSideTier(side.id, -1)}>−</button><span>{tiers[side.id]}</span><button aria-label={`Add ${side.label} tier`} disabled={tiers[side.id] >= 4} onClick={() => updateSideTier(side.id, 1)}>+</button></div><button className="button button-secondary button-small stand-change-button" aria-expanded={open} onClick={() => { setSelectedStand(side.id); setPickerSide(open ? null : side.id); }}>{open ? "Close upgrades" : "Upgrade stand"}</button></div>
            <div className="stand-option-adjustments"><label>Roof<select className="field-select" aria-label={`${side.label} roof`} value={sideRoof} onChange={(event) => updateStandRoof(side.id, event.target.value as Roof)}>{ROOF_OPTIONS.map((roof) => <option key={roof}>{roof}</option>)}</select><small>{sideRoof === "Open sky" ? "No roof" : `${MONEY(ROOF_COST[sideRoof])} roof specification`}</small></label><div className="stand-suites-control"><span>Executive boxes <small>£18k each · revenue-ready</small></span><div className="stepper"><button aria-label={`Remove ${side.label} executive boxes`} disabled={suites <= 0} onClick={() => updateExecutiveBoxes(side.id, -1)}>−</button><b>{suites}</b><button aria-label={`Add ${side.label} executive boxes`} disabled={draft.boxes >= 192} onClick={() => updateExecutiveBoxes(side.id, 1)}>+</button></div></div></div>
            <div className="stand-option-adjustments stand-finish-grid">
              <label>Stand name<input className="field-input" aria-label={`${side.label} name`} maxLength={26} value={draft.standNames[side.id]} onChange={(event) => updateStandSetting("standNames", side.id, event.target.value)} /></label>
              <label>Exterior<select className="field-select" aria-label={`${side.label} exterior`} value={draft.standFacades[side.id]} onChange={(event) => updateStandSetting("standFacades", side.id, event.target.value as StandFacades[StandSide])}>{STAND_FACADES.map((facade) => <option key={facade}>{facade}</option>)}</select></label>
              <label>Built-in frontage<select className="field-select" aria-label={`${side.label} frontage`} value={draft.standFrontages[side.id]} onChange={(event) => updateStandSetting("standFrontages", side.id, event.target.value as StandFrontages[StandSide])}>{STAND_FRONTAGES.map((frontage) => <option key={frontage}>{frontage}</option>)}</select></label>
              <label>Seat colour<select className="field-select" aria-label={`${side.label} seating colour`} value={draft.standSeatColors[side.id]} onChange={(event) => updateStandSetting("standSeatColors", side.id, event.target.value)}>{seatColorOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            </div>
            {open && <div className="stand-design-gallery">
              <div className="stand-gallery-heading"><strong>Upgrade {side.label.toLowerCase()}</strong><span>Choose a structure to preview · each design starts at its own tier configuration</span></div>
              <div className="stand-gallery-grid">{STAND_DESIGN_OPTIONS.map((option) => {
                const active = designId === option.id;
                return <button type="button" className={`stand-gallery-option ${active ? "selected" : ""}`} key={option.id} aria-pressed={active} onClick={() => chooseStandDesign(side.id, option.id)}>
                  <StandGalleryPhoto designId={option.id} tiers={option.preferredTiers} color={draft.standSeatColors[side.id]} />
                  <span className="stand-gallery-copy"><strong>{option.name}</strong><small>{option.detail}</small><b>{active ? `${tiers[side.id]} tier${tiers[side.id] === 1 ? "" : "s"} · Live preview` : `${option.preferredTiers} tier${option.preferredTiers === 1 ? "" : "s"} · From ${MONEY(getStandBuildCost(option.id, option.preferredTiers, stadium.capacity))}`}</b></span>
                  {active && <Check className="stand-gallery-check" size={14} />}
                </button>;
              })}</div>
              <small className="stand-preview-reminder">Selecting a design changes its structure and default tiers on the live model. You can adjust tiers, roof and finishes before board approval.</small>
            </div>}
          </article>;
        })}</div>
        <div className="corner-grid"><span className="eyebrow">CORNER STANDS · £265K EACH</span><div>{CORNERS.map((corner) => <button key={corner.id} className={`facility-check ${draft.cornerStands[corner.id] ? "checked" : ""}`} onClick={() => toggleCorner(corner.id)}><CornerBlueprint connected={draft.cornerStands[corner.id]} color={club.colors[0]} /><span><strong>{corner.label}</strong><small>{draft.cornerStands[corner.id] ? "Connected" : "Open corner"}</small></span><span className="check-box">{draft.cornerStands[corner.id] && <Check size={12} />}</span></button>)}</div></div>
        <div className="control-duo"><label className="field-label">Seating format<select className="field-select" value={!draft.seats ? "terrace" : draft.standing ? "rail" : "seated"} onChange={(event) => { const choice = event.target.value; change("seats", choice !== "terrace"); change("standing", choice !== "seated"); }}><option value="seated">All-seater bowl</option><option value="rail">Safe-standing rail seats</option><option value="terrace">Open terrace</option></select></label><label className="field-label">Floodlight level<div className="stepper"><button aria-label="Lower floodlight level" disabled={draft.floodlights <= 0} onClick={() => change("floodlights", Math.max(0, draft.floodlights - 1))}>−</button><span>{draft.floodlights} / 4</span><button aria-label="Raise floodlight level" disabled={draft.floodlights >= 4} onClick={() => change("floodlights", Math.min(4, draft.floodlights + 1))}>+</button></div></label></div>
        <p className="stand-box-income-note">{draft.boxes} executive boxes · about {MONEY(nextIncomePerExecutiveSuite)} per suite at each home match. Choose the stand where they belong above.</p>
      </div>
      <div id="upgrade-pitch" className="panel card-pad rich-controls architect-tool-section"><div className="control-card-head"><div><p className="eyebrow">PITCH & MAINTENANCE</p><h2>Keep the surface match-ready</h2></div><Wrench size={17} /></div>
        <label className="field-label">Playing surface<select className="field-select" value={draft.pitchSurface} onChange={(event) => change("pitchSurface", event.target.value as Draft["pitchSurface"])}><option>Natural grass</option><option>Hybrid 5G</option></select></label>
        <label className="field-label">Pitch quality<select className="field-select" value={draft.pitchQuality} onChange={(event) => change("pitchQuality", Number(event.target.value))}>{[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>{level} · {level < 3 ? "Needs work" : level === 3 ? "Reliable" : "Premier"}</option>)}</select></label>
        <label className="field-label">Drainage<select className="field-select" value={draft.drainage} onChange={(event) => change("drainage", Number(event.target.value))}>{[20, 40, 55, 60, 80, 100].map((level) => <option key={level} value={level}>{level}% capacity</option>)}</select></label>
        <label className="facility-check checked"><input type="checkbox" checked={draft.underfloorHeating} onChange={(event) => change("underfloorHeating", event.target.checked)} /><span><strong>Underfloor heating</strong><small>Protect the pitch during cold weather</small></span></label>
        <div className="pitch-relay-row"><span><strong>Current condition</strong><small>{draft.pitchCondition}% · Relay restores the playing surface</small></span><button className="button button-secondary button-small" disabled={draft.pitchCondition >= 100} onClick={() => change("pitchCondition", 100)}>Relay pitch</button></div>
      </div>
      <div id="upgrade-youth" className="panel card-pad rich-controls architect-tool-section"><div className="control-card-head"><div><p className="eyebrow">YOUTH TEAM & FACILITIES</p><h2>Build the player pathway</h2><small className="stand-live-note">Programme investment is tracked over 20 levels. Campus buildings and pitches are previewed on the model and enter construction after board approval.</small></div><GraduationCap size={17} /></div>
        <div className="program-facility-list">{PROGRAM_FACILITIES.map(({ key, name, detail, icon: Icon }) => {
          const level = club[key];
          const price = getClubFacilityUpgradeCost(level, key);
          return <article className="program-facility-row" key={key}><span className="facility-icon"><Icon size={17} /></span><div className="program-facility-copy"><strong>{name}</strong><small>{detail}</small><span className="facility-level-track" role="progressbar" aria-label={`${name} level`} aria-valuemin={0} aria-valuemax={20} aria-valuenow={level}><i style={{ width: `${Math.min(100, level / 20 * 100)}%` }} /></span></div><div className="facility-level"><strong>{level}<small> / 20</small></strong><small>LEVEL</small></div><button type="button" className="facility-upgrade" disabled={level >= 20} onClick={() => investInProgram(key)}>{level >= 20 ? "MAX LEVEL" : `Improve · ${MONEY(price)}`}</button></article>;
        })}</div>
        <div className="facility-group-heading development-group-heading"><span><strong>Campus buildings & pitches</strong><small>Choose a style and site; projects use the same board approval and construction budget.</small></span><span>BUILDINGS · SIZE · SITE</span></div>
        <div className="facility-level-list">{renderFacilityEntries("development", "development")}</div>
      </div>
      <div id="upgrade-land" className="panel card-pad rich-controls architect-tool-section"><div className="control-card-head"><div><p className="eyebrow">LAND · REGENERATION · DEVELOPMENT</p><h2>Acquire neighboring plots</h2><small className="stand-live-note">Buy an adjacent parcel, clear nearby buildings where the site allows, then place training, academy or commercial facilities on the newly owned ground. Prices reflect the local district and club scale.</small></div><Building2 size={17} /></div><div className="site-land-location"><MapPinned size={14} /><span>{draft.siteSetting ?? "Suburban campus"} · {club.city}</span><small>Waterfronts and railway links keep their public access.</small></div><div className="site-land-grid">{STADIUM_LAND_SIDES.map((side) => {
        const owned = stadium.acquiredLand?.includes(side.id) ?? false;
        const planned = draft.acquiredLand?.includes(side.id) ?? false;
        const price = siteParcelAcquisitionCost(stadium.siteSetting, side.id, stadium.capacity);
        return <article className={`site-land-card ${owned ? "owned" : planned ? "planned" : ""}`} key={side.id}><div className={`site-parcel-art site-parcel-${side.id} ${owned || planned ? "site-parcel-cleared" : ""}`} aria-hidden="true"><span /><i /><b /></div><div className="site-land-copy"><span className="site-land-district">{side.district}</span><strong>{side.label} development plot</strong><small>{owned ? "Owned club land · facilities can be placed here" : planned ? stadium.project ? "Acquisition and clearance are under way" : "Preview the cleared parcel before submitting the board plan" : "Neighboring land · price reflects the district and club scale"}</small><b>{owned ? "OWNED" : planned ? stadium.project ? "IN CONSTRUCTION" : `PROPOSED · ${MONEY(price)}` : MONEY(price)}</b></div><button type="button" className={`button button-small ${planned ? "button-secondary" : "button-primary"}`} disabled={owned || Boolean(stadium.project)} aria-pressed={planned || owned} onClick={() => toggleLandAcquisition(side.id)}>{owned ? "Owned" : planned ? stadium.project ? "In construction" : "Undo purchase" : "Acquire land"}</button></article>;
      })}</div><p className="site-land-note">The board funds each land purchase through the stadium plan. Existing district roads, tracks and water access remain connected to their neighborhoods.</p></div>
      <div id="upgrade-transport" className="panel card-pad rich-controls architect-tool-section"><div className="control-card-head"><div><p className="eyebrow">TRANSPORT</p><h2>Connect the ground</h2><small className="stand-live-note">Place parking, road links and rail or coach access around the stadium. Choose the scale and see its cost before approval.</small></div><MapPinned size={17} /></div><div className="facility-level-list">{renderFacilityEntries("commercial", "transport")}</div></div>
      <div id="upgrade-commercial" className="panel card-pad rich-controls architect-tool-section"><div className="control-card-head"><div><p className="eyebrow">COMMERCIAL & OPERATIONS</p><h2>Build matchday income</h2><small className="stand-live-note">Add superstores, restaurants, hotels and other club operations. The preview, cost and estimated home-match income update with your plan.</small></div><Store size={17} /></div><div className="facility-level-list">{renderFacilityEntries("commercial", "commercial")}</div></div>
      <div className="approval-card rich-approval"><div className="approval-row"><span>Estimated project cost</span><strong>{changed ? MONEY(cost) : "No changes"}</strong></div><div className="approval-row"><span>Construction time</span><strong>{changed ? `${duration} matchdays` : "—"}</strong></div><div className="approval-row"><span>Board approval</span><strong className={club.boardTrust >= 35 ? "approval-yes" : "approval-no"}>{club.boardTrust >= 35 ? `${club.boardTrust}% · Eligible` : `${club.boardTrust}% · Need 35%`}</strong></div>
        {stadium.project && <div className="construction-progress"><div className="construction-label"><span><Wrench size={14} /> {stadium.project.name}</span><strong>{stadium.project.weeksLeft} matchdays left</strong></div><div className="progress-track"><span style={{ width: `${Math.max(4, 100 - stadium.project.weeksLeft / Math.max(duration, 1) * 100)}%` }} /></div><small>Work continues over season breaks until the project is complete.</small></div>}
        {message && <p className="approval-message" role="status">{message}</p>}<button className="button button-primary button-wide" onClick={build} disabled={!changed || Boolean(stadium.project)}>{stadium.project ? "Construction in progress" : changed ? "Submit plan for board approval" : "Blueprint up to date"}<Building2 size={15} /></button>
      </div></div></section>
    </div>
  </>;
}
