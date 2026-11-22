"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { BadgeCheck, Building2, Check, Clock3, Lightbulb, Store, Wrench } from "lucide-react";
import { estimateStadiumCommercialIncome, getClub, normalizeCareer, startStadiumProject } from "@/lib/game";
import { STAND_DESIGN_OPTIONS, defaultExecutiveBoxes, defaultStandDesigns, defaultStandRoofs, getStandDesign } from "@/lib/stadium-designs";
import type { Career, CornerSide, CornerStands, Roof, StandDesignId, StandDesigns, StandRoofs, ExecutiveBoxesBySide, StandSide, StandTiers, Stadium } from "@/lib/game";

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
const LEVEL_FACILITIES: { key: keyof Stadium; name: string; detail: string; unitCost: number; icon: typeof Store }[] = [
  { key: "carParkLevel", name: "Car parks", detail: "Parking for matchday visitors", unitCost: 520_000, icon: Building2 },
  { key: "superstoreLevel", name: "Superstore", detail: "Club shop and online fulfilment", unitCost: 390_000, icon: Store },
  { key: "restaurantLevel", name: "Restaurants", detail: "Dining and hospitality spaces", unitCost: 620_000, icon: Store },
  { key: "hotelLevel", name: "Stadium hotel", detail: "Rooms, events and year-round trade", unitCost: 1_450_000, icon: Building2 },
  { key: "fanZoneLevel", name: "Supporters’ fan zone", detail: "Food, events and family facilities", unitCost: 360_000, icon: Store },
  { key: "museumLevel", name: "Club museum", detail: "Tours and club-history exhibitions", unitCost: 310_000, icon: Building2 },
  { key: "transportHubLevel", name: "Transport hub", detail: "Rail, coach and active travel links", unitCost: 880_000, icon: Building2 },
  { key: "concourseLevel", name: "Concourse upgrade", detail: "Wider concourses and better kiosks", unitCost: 470_000, icon: Store },
  { key: "scoreboardLevel", name: "Scoreboard", detail: "Larger, sharper match presentation", unitCost: 235_000, icon: Building2 },
  { key: "ledBoardsLevel", name: "LED advertising", detail: "Digital perimeter sponsorship", unitCost: 430_000, icon: Building2 },
  { key: "securityLevel", name: "Safety systems", detail: "Turnstiles, cameras and stewarding", unitCost: 180_000, icon: BadgeCheck },
  { key: "groundskeepingLevel", name: "Grounds team", detail: "More frequent pitch care and upkeep", unitCost: 275_000, icon: Wrench },
];

type Props = { career: Career; setCareer: (career: Career) => void };
export type Draft = Stadium & { standTiers: StandTiers; standDesigns: StandDesigns; standRoofs: StandRoofs; executiveBoxesBySide: ExecutiveBoxesBySide; cornerStands: CornerStands; underfloorHeating: boolean; pitchSurface: "Natural grass" | "Hybrid 5G"; pitchCondition: number; carParkLevel: number; superstoreLevel: number; restaurantLevel: number; hotelLevel: number; fanZoneLevel: number; museumLevel: number; transportHubLevel: number; concourseLevel: number; scoreboardLevel: number; ledBoardsLevel: number; securityLevel: number; groundskeepingLevel: number };
const StadiumScene = dynamic(() => import("./stadium-scene"), { ssr: false, loading: () => <div className="stadium-scene-loading">Assembling the stands…</div> });
const MONEY = (value: number) => `£${Math.round(value).toLocaleString("en-GB")}`;

function makeDraft(stadium: Stadium): Draft {
  return {
    ...stadium,
    standTiers: stadium.standTiers ?? { north: stadium.tiers, east: stadium.tiers, south: stadium.tiers, west: stadium.tiers },
    standDesigns: stadium.standDesigns ?? defaultStandDesigns(stadium.architecture),
    standRoofs: stadium.standRoofs ?? defaultStandRoofs(stadium.roof),
    executiveBoxesBySide: stadium.executiveBoxesBySide ?? defaultExecutiveBoxes(stadium.boxes),
    boxes: Object.values(stadium.executiveBoxesBySide ?? defaultExecutiveBoxes(stadium.boxes)).reduce((sum, value) => sum + value, 0),
    cornerStands: stadium.cornerStands ?? { northWest: stadium.corners, northEast: stadium.corners, southWest: stadium.corners, southEast: stadium.corners },
    underfloorHeating: stadium.underfloorHeating ?? false,
    pitchSurface: stadium.pitchSurface ?? "Natural grass",
    pitchCondition: stadium.pitchCondition ?? 82,
    carParkLevel: stadium.carParkLevel ?? Number(stadium.carPark), superstoreLevel: stadium.superstoreLevel ?? Number(stadium.superstore),
    restaurantLevel: stadium.restaurantLevel ?? Number(stadium.restaurant), hotelLevel: stadium.hotelLevel ?? Number(stadium.hotel),
    fanZoneLevel: stadium.fanZoneLevel ?? 0, museumLevel: stadium.museumLevel ?? 0, transportHubLevel: stadium.transportHubLevel ?? 0,
    concourseLevel: stadium.concourseLevel ?? 1, scoreboardLevel: stadium.scoreboardLevel ?? 1, ledBoardsLevel: stadium.ledBoardsLevel ?? 0,
    securityLevel: stadium.securityLevel ?? 1, groundskeepingLevel: stadium.groundskeepingLevel ?? 1,
  };
}

function StandBlueprint({ designId, tiers, seating }: { designId: StandDesignId; tiers: number; seating: boolean }) {
  const design = getStandDesign(designId);
  const column = (design.tile % 3) * 50;
  const row = design.tile >= 3 ? 100 : 0;
  return <span className={`stand-render-thumb ${seating ? "seated" : "terrace"}`} role="img" aria-label={`${design.name}, ${tiers} tier${tiers === 1 ? "" : "s"}, ${seating ? "seated" : "terrace"}`} style={{ backgroundImage: `linear-gradient(0deg, #09120f99, transparent 45%), url("/stadium-stand-options${design.sheet === 2 ? "-2" : ""}.png")`, backgroundSize: "100% 100%, 300% 200%", backgroundPosition: `center, ${column}% ${row}%` }} />;
}

function CornerBlueprint({ connected, color }: { connected: boolean; color: string }) {
  return <span className={`corner-render-thumb ${connected ? "connected" : "open"}`} role="img" aria-label={connected ? "Enclosed curved corner stand preview" : "Open stadium corner preview"} style={{ backgroundImage: `linear-gradient(0deg, #09120f88, transparent 40%), url("/stadium-stand-options.png")`, backgroundSize: "100% 100%, 300% 200%", backgroundPosition: "center, 50% 100%", outlineColor: color }} />;
}

export default function StadiumArchitect({ career, setCareer }: Props) {
  const club = getClub(career);
  const stadium = club.stadium;
  const [draft, setDraft] = useState<Draft>(() => { const current = normalizeCareer(career).clubs.find((item) => item.id === career.clubId)!.stadium; return makeDraft({ ...current, ...(current.project?.upgrades ?? {}) }); });
  const [message, setMessage] = useState("");
  const [pickerSide, setPickerSide] = useState<StandSide | null>(null);
  useEffect(() => setDraft(makeDraft({ ...stadium, ...(stadium.project?.upgrades ?? {}) })), [career.clubId, stadium.capacity, stadium.tiers, stadium.project?.weeksLeft]);

  const cost = useMemo(() => {
    const currentDesigns = stadium.standDesigns ?? defaultStandDesigns(stadium.architecture);
    const currentRoofs = stadium.standRoofs ?? defaultStandRoofs(stadium.roof);
    const currentBoxes = stadium.executiveBoxesBySide ?? defaultExecutiveBoxes(stadium.boxes);
    const standCost = SIDES.reduce((sum, side) => sum + Math.abs(draft.standTiers[side.id] - (stadium.standTiers?.[side.id] ?? stadium.tiers)) * 790_000, 0);
    const designCost = SIDES.reduce((sum, side) => sum + (draft.standDesigns[side.id] === currentDesigns[side.id] ? 0 : getStandDesign(draft.standDesigns[side.id]).cost), 0);
    const roofCost = SIDES.reduce((sum, side) => sum + (draft.standRoofs[side.id] === currentRoofs[side.id] ? 0 : ROOF_COST[draft.standRoofs[side.id]]), 0);
    const boxCost = SIDES.reduce((sum, side) => sum + Math.abs(draft.executiveBoxesBySide[side.id] - currentBoxes[side.id]) * 18_000, 0);
    const cornerCost = CORNERS.reduce((sum, corner) => sum + (draft.cornerStands[corner.id] !== (stadium.cornerStands?.[corner.id] ?? stadium.corners) ? 265_000 : 0), 0);
    const facilityCost = LEVEL_FACILITIES.reduce((sum, item) => sum + Math.abs(Number(draft[item.key] ?? 0) - Number(stadium[item.key] ?? 0)) * item.unitCost, 0);
    const seatingCost = (draft.seats !== stadium.seats ? 180_000 : 0) + (draft.standing !== stadium.standing ? 190_000 : 0);
    return standCost + designCost + roofCost + boxCost + cornerCost + facilityCost + seatingCost + Math.abs(draft.floodlights - stadium.floodlights) * 145_000 + Math.abs(draft.pitchQuality - stadium.pitchQuality) * 150_000 + Math.ceil(Math.abs(draft.drainage - stadium.drainage) / 20) * 65_000 + (draft.pitchSurface !== (stadium.pitchSurface ?? "Natural grass") ? 1_050_000 : 0) + (draft.underfloorHeating !== (stadium.underfloorHeating ?? false) ? 1_300_000 : 0) + (draft.pitchCondition === 100 && (stadium.pitchCondition ?? 82) < 100 ? 420_000 : 0);
  }, [draft, stadium]);
  const currentCommercialIncome = estimateStadiumCommercialIncome(stadium, club.reputation);
  const projectedCommercialIncome = estimateStadiumCommercialIncome(draft, club.reputation);
  const nextIncomePerExecutiveSuite = Math.round((350 + club.reputation * 1.2) * (0.65 + club.reputation / 100));
  const changed = cost > 0;
  const duration = Math.max(2, Math.ceil(cost / 850_000));
  const capacity = useMemo(() => {
    const tierDelta = SIDES.reduce((sum, side) => sum + draft.standTiers[side.id] - (stadium.standTiers?.[side.id] ?? stadium.tiers), 0) * 0.047;
    const cornerDelta = CORNERS.reduce((sum, corner) => sum + Number(draft.cornerStands[corner.id]) - Number(stadium.cornerStands?.[corner.id] ?? stadium.corners), 0) * 0.014;
    const seatingDelta = draft.seats === stadium.seats ? 0 : draft.seats ? -0.055 : 0.075;
    const standingDelta = draft.standing === stadium.standing ? 0 : draft.standing ? 0.035 : -0.025;
    return Math.max(5000, Math.round(stadium.capacity * (1 + tierDelta + cornerDelta + seatingDelta + standingDelta) / 100) * 100);
  }, [draft, stadium]);

  const change = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const updateSideTier = (side: StandSide, delta: number) => change("standTiers", { ...draft.standTiers, [side]: Math.max(1, Math.min(4, draft.standTiers[side] + delta)) });
  const chooseStandDesign = (side: StandSide, designId: StandDesignId) => {
    const roof = getStandDesign(designId).roof;
    setDraft((current) => ({ ...current, standDesigns: { ...current.standDesigns, [side]: designId }, standRoofs: { ...current.standRoofs, [side]: roof } }));
  };
  const updateStandRoof = (side: StandSide, roof: Roof) => setDraft((current) => ({ ...current, standRoofs: { ...current.standRoofs, [side]: roof } }));
  const updateExecutiveBoxes = (side: StandSide, delta: number) => setDraft((current) => {
    const executiveBoxesBySide = { ...current.executiveBoxesBySide, [side]: Math.max(0, Math.min(48, current.executiveBoxesBySide[side] + delta * 4)) };
    return { ...current, executiveBoxesBySide, boxes: Object.values(executiveBoxesBySide).reduce((sum, value) => sum + value, 0) };
  });
  const toggleCorner = (corner: CornerSide) => change("cornerStands", { ...draft.cornerStands, [corner]: !draft.cornerStands[corner] });
  const changeEveryRoof = (roof: Roof) => setDraft((current) => ({ ...current, roof, standRoofs: { north: roof, east: roof, south: roof, west: roof } }));
  const build = () => {
    if (!changed || stadium.project) return;
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

  const tiers = draft.standTiers;
  const colors = club.colors;
  const roofSelection = SIDES.every((side) => draft.standRoofs[side.id] === draft.standRoofs.north) ? draft.standRoofs.north : "Mixed roofs";
  return <>
    <div className="section-heading"><div><p className="eyebrow">GROUNDS DEVELOPMENT</p><h1>Stadium architect</h1><p className="muted section-detail">Design every stand, invest in the pitch and build year-round matchday income.</p></div><div className="venue-league-check"><BadgeCheck size={16} /><span>LEAGUE REQUIREMENTS</span><small>5,000 capacity · floodlights</small></div></div>
    <div className="stadium-layout stadium-layout-rich">
      <section className="stadium-preview-panel"><div className="stadium-preview-header"><div><p className="eyebrow">LIVE ARCHITECTURAL PREVIEW</p><h2>{stadium.name}</h2><span>{club.city} · {club.country}</span></div><div className="capacity-chip"><small>PROJECTED CAPACITY</small><strong>{capacity.toLocaleString("en-GB")}</strong></div></div>
        <div className="stadium-canvas rich-stadium-canvas"><StadiumScene club={club} draft={draft} /></div>
        <div className="stadium-stats"><div><span>CAPACITY</span><strong>{capacity.toLocaleString("en-GB")}</strong></div><div><span>TIERS N / E / S / W</span><strong>{tiers.north} · {tiers.east} · {tiers.south} · {tiers.west}</strong></div><div><span>EXECUTIVE BOXES</span><strong>{draft.boxes}</strong></div><div><span>PITCH CONDITION</span><strong>{draft.pitchCondition}%</strong></div></div>
        <div className="stadium-outlook stadium-income-outlook"><span><Lightbulb size={15} /> Matchday estimate from shops, hospitality, parking, partnerships and executive suites.</span><div className="stadium-income-compare"><span><small>NOW / HOME MATCH</small><strong>{MONEY(currentCommercialIncome)}</strong></span><b>→</b><span><small>AFTER PLAN</small><strong>{MONEY(projectedCommercialIncome)}</strong></span><em>{projectedCommercialIncome >= currentCommercialIncome ? "+" : "−"}{MONEY(Math.abs(projectedCommercialIncome - currentCommercialIncome))} / home game</em></div></div>
      </section>
      <section className="architect-controls"><div className="panel card-pad rich-controls">
        <div className="control-card-head"><div><p className="eyebrow">STAND DESIGN LIBRARY</p><h2>Build each side of the bowl</h2><small className="stand-live-note">Choose a design to preview it live. Nothing is bought until board approval.</small></div><Building2 size={17} /></div>
        <label className="field-label" htmlFor="rich-roof">Apply one roof to all stands</label><select id="rich-roof" className="field-select" value={roofSelection} onChange={(event) => changeEveryRoof(event.target.value as Roof)}>{roofSelection === "Mixed roofs" && <option disabled>Mixed roofs</option>}{ROOF_OPTIONS.map((roof) => <option key={roof}>{roof}</option>)}</select>
        <div className="stand-tier-list">{SIDES.map((side) => { const designId = draft.standDesigns[side.id]; const design = getStandDesign(designId); const sideRoof = draft.standRoofs[side.id]; const suites = draft.executiveBoxesBySide[side.id]; const open = pickerSide === side.id; return <article className={`stand-design-card ${open ? "picker-open" : ""}`} key={side.id}>
          <div className="stand-option-main"><StandBlueprint designId={designId} tiers={tiers[side.id]} seating={draft.seats} /><div className="stand-option-copy"><span className="eyebrow">{side.label.toUpperCase()} · {tiers[side.id]} TIER{tiers[side.id] === 1 ? "" : "S"}</span><strong>{design.name}</strong><small>{design.detail}</small><em>{sideRoof}</em></div><div className="stepper stand-tier-stepper"><button aria-label={`Reduce ${side.label} tier`} disabled={tiers[side.id] <= 1} onClick={() => updateSideTier(side.id, -1)}>−</button><span>{tiers[side.id]}</span><button aria-label={`Add ${side.label} tier`} disabled={tiers[side.id] >= 4} onClick={() => updateSideTier(side.id, 1)}>+</button></div><button className="button button-secondary button-small stand-change-button" aria-expanded={open} onClick={() => setPickerSide(open ? null : side.id)}>{open ? "Close designs" : "Choose design"}</button></div>
          <div className="stand-option-adjustments"><label>Roof<select className="field-select" aria-label={`${side.label} roof`} value={sideRoof} onChange={(event) => updateStandRoof(side.id, event.target.value as Roof)}>{ROOF_OPTIONS.map((roof) => <option key={roof}>{roof}</option>)}</select><small>{sideRoof === "Open sky" ? "No roof" : `${MONEY(ROOF_COST[sideRoof])} roof specification`}</small></label><div className="stand-suites-control"><span>Executive boxes <small>£18k each · revenue-ready</small></span><div className="stepper"><button aria-label={`Remove ${side.label} executive boxes`} disabled={suites <= 0} onClick={() => updateExecutiveBoxes(side.id, -1)}>−</button><b>{suites}</b><button aria-label={`Add ${side.label} executive boxes`} disabled={draft.boxes >= 192} onClick={() => updateExecutiveBoxes(side.id, 1)}>+</button></div></div></div>
        {open && <div className="stand-design-gallery"><div className="stand-gallery-heading"><strong>Choose {side.label.toLowerCase()} style</strong><span>Live preview · {tiers[side.id]} tier{tiers[side.id] === 1 ? "" : "s"} · {draft.seats ? "seated" : "terrace"}</span></div><div className="stand-gallery-grid">{STAND_DESIGN_OPTIONS.map((option) => { const column = (option.tile % 3) * 50; const row = option.tile >= 3 ? 100 : 0; const active = designId === option.id; return <button type="button" className={`stand-gallery-option ${active ? "selected" : ""}`} key={option.id} aria-pressed={active} onClick={() => chooseStandDesign(side.id, option.id)}><span className="stand-gallery-art" style={{ backgroundImage: `url("/stadium-stand-options${option.sheet === 2 ? "-2" : ""}.png")`, backgroundSize: "300% 200%", backgroundPosition: `${column}% ${row}%` }} /><span className="stand-gallery-copy"><strong>{option.name}</strong><small>{option.detail}</small><b>{active ? "Installed now" : `From ${MONEY(option.cost)}`}</b></span>{active && <Check className="stand-gallery-check" size={14} />}</button>; })}</div></div>}
        </article>; })}</div>
        <div className="corner-grid"><span className="eyebrow">CORNER STANDS · £265K EACH</span><div>{CORNERS.map((corner) => <button key={corner.id} className={`facility-check ${draft.cornerStands[corner.id] ? "checked" : ""}`} onClick={() => toggleCorner(corner.id)}><CornerBlueprint connected={draft.cornerStands[corner.id]} color={club.colors[0]} /><span><strong>{corner.label}</strong><small>{draft.cornerStands[corner.id] ? "Connected" : "Open corner"}</small></span><span className="check-box">{draft.cornerStands[corner.id] && <Check size={12} />}</span></button>)}</div></div>
        <div className="control-duo"><label className="field-label">Seating format<select className="field-select" value={!draft.seats ? "terrace" : draft.standing ? "rail" : "seated"} onChange={(event) => { const choice = event.target.value; change("seats", choice !== "terrace"); change("standing", choice !== "seated"); }}><option value="seated">All-seater bowl</option><option value="rail">Safe-standing rail seats</option><option value="terrace">Open terrace</option></select></label><label className="field-label">Floodlight level<div className="stepper"><button aria-label="Lower floodlight level" disabled={draft.floodlights <= 0} onClick={() => change("floodlights", Math.max(0, draft.floodlights - 1))}>−</button><span>{draft.floodlights} / 4</span><button aria-label="Raise floodlight level" disabled={draft.floodlights >= 4} onClick={() => change("floodlights", Math.min(4, draft.floodlights + 1))}>+</button></div></label></div>
        <p className="stand-box-income-note">{draft.boxes} executive boxes · about {MONEY(nextIncomePerExecutiveSuite)} per suite at each home match. Choose the stand where they belong above.</p>
      </div>
      <div className="panel card-pad rich-controls"><div className="control-card-head"><div><p className="eyebrow">PITCH & MAINTENANCE</p><h2>Keep the surface match-ready</h2></div><Wrench size={17} /></div>
        <label className="field-label">Playing surface<select className="field-select" value={draft.pitchSurface} onChange={(event) => change("pitchSurface", event.target.value as Draft["pitchSurface"])}><option>Natural grass</option><option>Hybrid 5G</option></select></label>
        <label className="field-label">Pitch quality<select className="field-select" value={draft.pitchQuality} onChange={(event) => change("pitchQuality", Number(event.target.value))}>{[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>{level} · {level < 3 ? "Needs work" : level === 3 ? "Reliable" : "Premier"}</option>)}</select></label>
        <label className="field-label">Drainage<select className="field-select" value={draft.drainage} onChange={(event) => change("drainage", Number(event.target.value))}>{[20, 40, 55, 60, 80, 100].map((level) => <option key={level} value={level}>{level}% capacity</option>)}</select></label>
        <label className="facility-check checked"><input type="checkbox" checked={draft.underfloorHeating} onChange={(event) => change("underfloorHeating", event.target.checked)} /><span><strong>Underfloor heating</strong><small>Protect the pitch during cold weather</small></span></label>
        <div className="pitch-relay-row"><span><strong>Current condition</strong><small>{draft.pitchCondition}% · Relay restores the playing surface</small></span><button className="button button-secondary button-small" disabled={draft.pitchCondition >= 100} onClick={() => change("pitchCondition", 100)}>Relay pitch</button></div>
      </div>
      <div className="panel card-pad rich-controls"><div className="control-card-head"><div><p className="eyebrow">COMMERCIAL & OPERATIONS</p><h2>Grow the ground’s income</h2></div><Store size={17} /></div>
        <div className="facility-level-list">{LEVEL_FACILITIES.map(({ key, name, detail, unitCost, icon: Icon }) => { const level = Number(draft[key] ?? 0); const yieldNext = level >= 3 ? 0 : estimateStadiumCommercialIncome({ ...draft, [key]: level + 1 }, club.reputation) - estimateStadiumCommercialIncome(draft, club.reputation); return <div className="facility-level-row" key={key}><span className="facility-icon"><Icon size={16} /></span><span className={`facility-visual facility-photo facility-photo-${key}`} role="img" aria-label={`${name} architectural preview`}><span>{level > 0 ? `INSTALLED · LEVEL ${level}` : "CONCEPT PREVIEW"}</span></span><span className="facility-level-copy"><strong>{name}</strong><small>{detail}</small></span><div className="stepper"><button aria-label={`Reduce ${name}`} disabled={level <= 0} onClick={() => change(key, (level - 1) as Draft[typeof key])}>−</button><span>Lv {level}</span><button aria-label={`Upgrade ${name}`} disabled={level >= 3} onClick={() => change(key, (level + 1) as Draft[typeof key])}>+</button></div><small className="facility-unit-cost">{level >= 3 ? "MAX" : <>{MONEY(unitCost)}<br />+{MONEY(yieldNext)}/MD</>}</small></div>; })}</div>
      </div>
      <div className="approval-card rich-approval"><div className="approval-row"><span>Estimated project cost</span><strong>{changed ? MONEY(cost) : "No changes"}</strong></div><div className="approval-row"><span>Construction time</span><strong>{changed ? `${duration} matchdays` : "—"}</strong></div><div className="approval-row"><span>Board approval</span><strong className={club.boardTrust >= 35 ? "approval-yes" : "approval-no"}>{club.boardTrust >= 35 ? `${club.boardTrust}% · Eligible` : `${club.boardTrust}% · Need 35%`}</strong></div>
        {stadium.project && <div className="construction-progress"><div className="construction-label"><span><Wrench size={14} /> {stadium.project.name}</span><strong>{stadium.project.weeksLeft} matchdays left</strong></div><div className="progress-track"><span style={{ width: `${Math.max(4, 100 - stadium.project.weeksLeft / Math.max(duration, 1) * 100)}%` }} /></div><small>Work continues over season breaks until the project is complete.</small></div>}
        {message && <p className="approval-message" role="status">{message}</p>}<button className="button button-primary button-wide" onClick={build} disabled={!changed || Boolean(stadium.project)}>{stadium.project ? "Construction in progress" : changed ? "Submit plan for board approval" : "Blueprint up to date"}<Building2 size={15} /></button>
      </div></section>
    </div>
  </>;
}
