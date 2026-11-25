import { getWorldPlayerDetails, WORLD_FIRST_TEAM_COUNT, WORLD_PLAYER_COUNTRIES } from "./world-database";
import { BASE_CLUB_STAFF_COUNT, createClubPersonnel, getWorldStaffById, searchWorldStaff, staffStartIndexForClub, STAFF_ROLES } from "./world-staff-database";
import type { StaffMember, StaffRole } from "./world-staff-database";
import { ENGLISH_CLUB_SEEDS, ENGLISH_LEAGUES, leagueDefinition } from "./league-pyramid";
import type { LeagueId } from "./league-pyramid";
import { WORLD_CLUB_SEEDS, WORLD_COUNTRIES, WORLD_LEAGUES } from "./world-leagues";
import { defaultExecutiveBoxes, defaultStandDesigns, defaultStandFacades, defaultStandFrontages, defaultStandNames, defaultStandRoofs, defaultStandSeatColors } from "./stadium-designs";
import { formatGameCurrency, readGameSettings } from "./game-settings";
import type { ExecutiveBoxesBySide, StandDesigns, StandFacades, StandFrontages, StandNames, StandRoofs, StandSeatColors } from "./stadium-designs";
import { facilityRevenueFactor, normalizeFacilityPlan, STADIUM_LAND_SIDES } from "./stadium-facilities";
import type { StadiumFacilityPlan, StadiumLandSide } from "./stadium-facilities";

const CLUB_SEEDS = ENGLISH_CLUB_SEEDS;

const LEAGUE_ECONOMY: Record<number, { weeklyWageBudget: number; openingBalance: number; startingTransferBudget: number; annualBroadcast: number; annualMerit: number; playerWageMultiplier: number }> = {
  1: { weeklyWageBudget: 1_450_000, openingBalance: 48_000_000, startingTransferBudget: 28_000_000, annualBroadcast: 58_000_000, annualMerit: 42_000_000, playerWageMultiplier: 12 },
  2: { weeklyWageBudget: 430_000, openingBalance: 10_000_000, startingTransferBudget: 4_500_000, annualBroadcast: 7_500_000, annualMerit: 5_000_000, playerWageMultiplier: 5 },
  3: { weeklyWageBudget: 155_000, openingBalance: 3_800_000, startingTransferBudget: 1_450_000, annualBroadcast: 2_300_000, annualMerit: 2_500_000, playerWageMultiplier: 3 },
  4: { weeklyWageBudget: 92_000, openingBalance: 1_800_000, startingTransferBudget: 750_000, annualBroadcast: 900_000, annualMerit: 1_100_000, playerWageMultiplier: 2 },
  5: { weeklyWageBudget: 76_000, openingBalance: 780_000, startingTransferBudget: 260_000, annualBroadcast: 330_000, annualMerit: 430_000, playerWageMultiplier: 1.15 },
  6: { weeklyWageBudget: 66_000, openingBalance: 520_000, startingTransferBudget: 145_000, annualBroadcast: 185_000, annualMerit: 210_000, playerWageMultiplier: 0.92 },
  7: { weeklyWageBudget: 55_000, openingBalance: 380_000, startingTransferBudget: 95_000, annualBroadcast: 95_000, annualMerit: 115_000, playerWageMultiplier: 0.78 },
};

function leagueEconomy(tier: number) {
  return LEAGUE_ECONOMY[Math.max(1, Math.min(7, Math.round(tier)))] ?? LEAGUE_ECONOMY[7];
}

export type Position = "GK" | "DEF" | "MID" | "FWD";
export type TacticalRole = "Goalkeeper" | "Sweeper keeper" | "Defender" | "Centre-back" | "Ball-playing defender" | "Full-back" | "Wing-back" | "Midfielder" | "Holding midfielder" | "Box-to-box" | "Playmaker" | "Wide midfielder" | "Forward" | "Pressing forward" | "Target forward" | "Inside forward";
export type Roof = "Open sky" | "Flat canopy" | "Cantilever" | "Continuous bowl" | "Retractable roof" | "Wave canopy" | "Glazed shell" | "Lattice roof";
export type SquadLevel = "Foundation" | "Academy" | "U16" | "U18" | "Reserves" | "First team";
export type KitPattern = "Stripes" | "Hoops" | "Sash" | "Solid" | "Halves" | "Quarters" | "Chevron" | "Pinstripes" | "Fade" | "Engineered Grid" | "Topographic" | "Pixel Fade" | "Diagonal Motion" | "Contour Lines" | "Split Panel" | "Shadow Gradient" | "Micro Dot" | "Clean Block";
export type { StandDesignId, StandDesigns, StandRoofs, ExecutiveBoxesBySide, StandSide, StandFacade, StandFrontage, StandFacades, StandFrontages, StandNames, StandSeatColors } from "./stadium-designs";
import type { StandSide } from "./stadium-designs";
export type CornerSide = "northWest" | "northEast" | "southWest" | "southEast";
export type PitchSurface = "Natural grass" | "Hybrid 5G";
export type StadiumSiteSetting = "Dense terraces" | "Railway quarter" | "Waterside quay" | "Industrial fringe" | "Parkland" | "Hillside green" | "Suburban campus" | "Market streets" | "Harbour edge" | "Riverside mills";
export type SponsorSlot = "shirt" | "stadium" | "boards" | "training" | "academy";
export type ClubBadgeShape = "shield" | "roundel" | "diamond" | "crest" | "heater" | "hexagon" | "oval" | "arch" | "banner" | "lozenge";
export type ClubBadgeField = "vertical" | "horizontal" | "diagonal" | "quartered" | "sash" | "chevron" | "hoops" | "saltire";
export type ClubBadgeEmblem = "star" | "oak" | "tower" | "eagle" | "anchor" | "bridge" | "crown" | "ship" | "lighthouse" | "mountain" | "rose" | "wheel" | "flame" | "lion" | "stag" | "compass" | "mill" | "torch";
export const CLUB_BADGE_SHAPES: ClubBadgeShape[] = ["shield", "roundel", "diamond", "crest", "heater", "hexagon", "oval", "arch", "banner", "lozenge"];
export const CLUB_BADGE_FIELDS: ClubBadgeField[] = ["vertical", "horizontal", "diagonal", "quartered", "sash", "chevron", "hoops", "saltire"];
export const CLUB_BADGE_EMBLEMS: ClubBadgeEmblem[] = ["star", "oak", "tower", "eagle", "anchor", "bridge", "crown", "ship", "lighthouse", "mountain", "rose", "wheel", "flame", "lion", "stag", "compass", "mill", "torch"];
export type ClubBadge = { shape: ClubBadgeShape; emblem: ClubBadgeEmblem; field?: ClubBadgeField; accent?: string; colors: [string, string]; foundingYear: number };
export type SponsorContract = { id: string; company: string; slot: SponsorSlot; annual: number; yearsRemaining: number; signedSeason: number };
export type SponsorOffer = { id: string; company: string; slot: SponsorSlot; annual: number; years: number; signingBonus: number };
export type ResponsibilityArea = "matchPreparation" | "firstTeamTraining" | "academyDevelopment" | "scouting" | "commercial" | "supporters";
export type ClubResponsibilities = Record<ResponsibilityArea, string | null>;
export type ClubProjectKind = "league" | "academy" | "stadium" | "finances";
export type ClubProjectStatus = "Active" | "Completed" | "Missed" | "Rejected";
export type BoardProjectVote = { memberId: string; name: string; role: StaffRole; score: number; vote: "For" | "Against" };
export type ClubProject = { id: string; kind: ClubProjectKind; title: string; brief: string; metricLabel: string; unit: string; startSeason: number; duration: number; seasonsReviewed: number; seasonsRemaining: number; baseline: number; target: number; current: number; targetPosition?: number; status: ClubProjectStatus; votes: BoardProjectVote[] };
export type BoardAgendaKind = "results" | "finance" | "supporters" | "dressing-room" | "academy";
export type BoardAgendaChoiceId = "cash-controls" | "working-capital" | "supporter-forum" | "community-day" | "captains-council" | "manager-standards" | "public-backing" | "tactical-review" | "academy-expansion" | "coach-investment";
export type BoardAgendaChoice = { id: BoardAgendaChoiceId; label: string; detail: string; cost: number; votes: BoardProjectVote[] };
export type ClubBoardAgenda = { id: string; clubId: string; season: number; round: number; kind: BoardAgendaKind; title: string; brief: string; reason: string; sponsorName: string; sponsorRole: StaffRole; choices: BoardAgendaChoice[]; status: "Open" | "Resolved"; selectedChoice?: BoardAgendaChoiceId; resolution?: string; resolvedRound?: number };
export type ScoutingReport = { id: string; playerId: string; managerId: string; clubId: string; currentAbility: number; potential: number; marketValue: number; season: number; round: number; availableDate?: string };
export type ScoutingAssignment = { id: string; playerId: string; managerId: string; clubId: string; commissionedDate: string; availableDate: string; season: number; round: number };
export type StandTiers = Record<StandSide, number>;
export type CornerStands = Record<CornerSide, boolean>;
export type StadiumArchitecture = "Dockside steel" | "Clocktower brick" | "Foundry arches" | "Riverside glass" | "Hilltop terraces" | "Railway truss" | "Garden bowl" | "Civic colonnade" | "Lakeside canopy" | "Market hall" | "Beacon tower" | "Southbank lattice";
export type PlayerStats = { appearances: number; goals: number; assists: number; cleanSheets: number; minutes: number };
export type PlayerClubRecord = { clubId: string | null; clubName: string; country: string; fromSeason: number; toSeason: number | null; squadLevel: SquadLevel; appearances: number; goals: number; assists: number; cleanSheets: number };
export type AcademyRecord = { season: number; age: number; squadLevel: SquadLevel; academyLevel: number };
export type PlayerAttributes = { pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number; vision: number; crossing: number; finishing: number; tackling: number; strength: number; stamina: number; reactions: number; handling: number; positioning: number; composure: number };
export type PlayerAttributeKey = keyof PlayerAttributes;
export type PlayerAttributeMap = Partial<Record<PlayerAttributeKey, number>>;
const TRAINING_ATTRIBUTE_TARGETS: Record<string, PlayerAttributeKey[]> = {
  Balanced: ["pace", "shooting", "passing", "dribbling", "defending", "physical", "vision", "crossing", "finishing", "tackling", "strength", "stamina", "reactions", "handling", "positioning", "composure"],
  Fundamentals: ["pace", "shooting", "passing", "dribbling", "defending", "physical", "vision", "crossing", "finishing", "tackling", "strength", "stamina", "reactions", "handling", "positioning", "composure"],
  Technical: ["passing", "dribbling", "vision", "crossing", "composure"],
  Tactical: ["positioning", "vision", "composure", "defending", "tackling"],
  Physical: ["pace", "physical", "strength", "stamina"],
  Finishing: ["shooting", "finishing", "composure"],
  Goalkeeping: ["handling", "reactions", "positioning"],
};
const ATTRIBUTE_TRAINING_RATE: Record<string, number> = { Balanced: 0.012, Fundamentals: 0.018, Technical: 0.04, Tactical: 0.04, Physical: 0.045, Finishing: 0.062, Goalkeeping: 0.062 };
export type ClubHistoryMoment = { year: number; title: string; detail: string };
export type PlayerPersonality = "Professional" | "Ambitious" | "Team-first" | "Reserved" | "Fiery" | "Natural leader";
export type ContractSquadRole = "Prospect" | "Rotation" | "First team" | "Important" | "Star";
export type PlayerContractOffer = { weeklyWage: number; years: number; squadRole: ContractSquadRole; signingBonus: number };
export type PlayerContractDemand = PlayerContractOffer & { reason: string };
export type PlayerContractNegotiation = { career: Career; accepted: boolean; willingness: number; message: string };
export type PlayerTransferOffer = { fee: number; weeklyWage: number; years: number; squadRole: ContractSquadRole; signingBonus: number };
export type PlayerTransferDemand = PlayerTransferOffer & { sellerClubName: string; reason: string };
export type PlayerTransferNegotiation = { career: Career; status: "accepted" | "countered" | "rejected"; message: string; counterOffer?: PlayerTransferOffer };
export type PlayerRelationship = { playerId: string; linkedPlayerId: string; type: "Mentor" | "Friend" | "Rival"; strength: number };
export type ManagerPromiseKind = "League target" | "Regular starts" | "Winning run";
export type ManagerPromise = { id: string; kind: ManagerPromiseKind; audience: "Board" | "Player" | "Supporters"; season: number; createdRound: number; deadlineRound: number; target: number; progress: number; playerId?: string; status: "Active" | "Kept" | "Broken"; resolvedRound?: number };
export type FootballStyle = "Possession" | "High press" | "Counter attack";
export type CornerDelivery = "Inswinging" | "Outswinging" | "Short routine";
export type CornerDefence = "Zonal" | "Man marking" | "Hybrid";
export type FreeKickRoutine = "Direct shot" | "Whipped delivery" | "Short combination";
export type SetPiecePlan = {
  cornerDelivery: CornerDelivery;
  cornerTakerId: string;
  cornerTargetId: string;
  freeKickRoutine: FreeKickRoutine;
  freeKickTakerId: string;
  penaltyTakerId: string;
  cornerDefence: CornerDefence;
};
export type ClubDNA = {
  tacticalIdentity: FootballStyle;
  recruitmentPolicy: "Academy pathway" | "Regional scouting" | "Value market" | "Proven talent";
  academyTradition: "Technical pathway" | "Local roots" | "Late developers" | "Elite production";
  supporterIdentity: "Front-foot football" | "Homegrown heroes" | "Hard-working side" | "Big-match winners";
  spendingPolicy: "Sustainable growth" | "Balanced investment" | "Bold ambition";
  preferredManager: "Development coach" | "Tactical innovator" | "Man-manager" | "Proven winner";
  identityStrength: number;
  styleAdaptation: Partial<Record<FootballStyle, number>>;
};

export type AIClubTactics = {
  formation: string;
  mentality: "Attacking" | "Balanced" | "Cautious";
  /** The manager's chosen style for the current fixture, learned from club DNA and scouting. */
  style: FootballStyle;
  winlessRun: number;
  adaptationCooldown: number;
  adaptations: number;
  managerPressure: number;
};

export type AIManagerChange = {
  id: string;
  clubId: string;
  clubName: string;
  outgoingManagerId: string;
  outgoingManagerName: string;
  incomingManagerId: string;
  incomingManagerName: string;
  season: number;
  round: number;
  reason: string;
};

const AI_FORMATIONS = ["4-2-3-1", "4-3-3", "4-4-2", "4-1-4-1", "3-5-2", "5-3-2"];

function createAIClubTactics(id: string, reputation: number): AIClubTactics {
  const seed = stableSeed(`${id}:manager-tactics`);
  const style = createClubDNA(id, id, reputation).tacticalIdentity;
  const preferredFormations = style === "Possession" ? ["4-3-3", "4-2-3-1", "4-1-4-1"]
    : style === "High press" ? ["4-3-3", "4-2-3-1", "3-5-2"]
      : ["4-4-2", "5-3-2", "4-2-3-1"];
  const formation = preferredFormations[seed % preferredFormations.length];
  const mentality: AIClubTactics["mentality"] = reputation >= 72 ? "Attacking" : reputation <= 38 ? "Cautious" : "Balanced";
  return { formation, mentality, style, winlessRun: 0, adaptationCooldown: 0, adaptations: 0, managerPressure: 18 };
}

export type Player = {
  id: string;
  name: string;
  age: number;
  position: Position;
  overall: number;
  potential: number;
  wage: number;
  value: number;
  contractYears: number;
  contractRole?: ContractSquadRole;
  lastContractTalkSeason?: number;
  lastContractTalkRound?: number;
  injury?: string | null;
  injuryWeeksRemaining?: number;
  yellowCardsThisSeason?: number;
  suspensionMatchesRemaining?: number;
  morale: number;
  condition?: number;
  clubId: string | null;
  trainingFocus: string;
  nationality?: string;
  country?: string;
  squadLevel?: SquadLevel;
  managerRapport?: number;
  role?: string;
  roleFamiliarity?: number;
  dateOfBirth?: string;
  birthPlace?: string;
  clubHistory?: PlayerClubRecord[];
  academyHistory?: AcademyRecord[];
  careerStats?: PlayerStats;
  seasonStats?: PlayerStats;
  attributes?: PlayerAttributes;
  attributeGrowth?: PlayerAttributeMap;
  attributeTrainingProgress?: PlayerAttributeMap;
  personality?: PlayerPersonality;
  leadership?: number;
  internationalCaps?: number;
  internationalGoals?: number;
};

const POSITION_ROLE_OPTIONS: Record<Position, TacticalRole[]> = {
  GK: ["Goalkeeper", "Sweeper keeper"],
  DEF: ["Defender", "Centre-back", "Ball-playing defender", "Full-back", "Wing-back"],
  MID: ["Midfielder", "Holding midfielder", "Box-to-box", "Playmaker", "Wide midfielder"],
  FWD: ["Forward", "Pressing forward", "Target forward", "Inside forward"],
};

const ROLE_ATTRIBUTE_WEIGHTS: Record<TacticalRole, Partial<Record<PlayerAttributeKey, number>>> = {
  "Goalkeeper": { reactions: .25, handling: .3, positioning: .3, composure: .15 },
  "Sweeper keeper": { reactions: .2, handling: .18, positioning: .2, pace: .15, passing: .15, composure: .12 },
  "Defender": { defending: .28, positioning: .23, tackling: .22, physical: .16, strength: .11 },
  "Centre-back": { defending: .3, positioning: .25, tackling: .2, physical: .15, strength: .1 },
  "Ball-playing defender": { defending: .2, positioning: .15, tackling: .12, passing: .22, vision: .13, composure: .1, physical: .08 },
  "Full-back": { defending: .22, tackling: .15, pace: .18, stamina: .15, crossing: .15, passing: .15 },
  "Wing-back": { pace: .2, crossing: .2, stamina: .18, dribbling: .15, passing: .12, defending: .1, physical: .05 },
  "Midfielder": { passing: .25, vision: .2, positioning: .18, stamina: .12, composure: .15, tackling: .1 },
  "Holding midfielder": { defending: .24, positioning: .2, passing: .19, tackling: .2, strength: .08, composure: .09 },
  "Box-to-box": { stamina: .2, physical: .15, passing: .19, defending: .13, shooting: .1, pace: .1, strength: .07, composure: .06 },
  "Playmaker": { passing: .25, vision: .25, dribbling: .15, composure: .15, crossing: .1, positioning: .1 },
  "Wide midfielder": { pace: .18, crossing: .22, dribbling: .2, stamina: .14, passing: .12, defending: .08, positioning: .06 },
  "Forward": { finishing: .3, positioning: .24, shooting: .2, pace: .12, composure: .14 },
  "Pressing forward": { stamina: .2, pace: .15, strength: .08, finishing: .15, positioning: .12, tackling: .08, physical: .1, composure: .12 },
  "Target forward": { strength: .22, physical: .16, positioning: .2, finishing: .18, shooting: .1, composure: .08, passing: .06 },
  "Inside forward": { pace: .18, dribbling: .2, finishing: .2, shooting: .14, positioning: .12, composure: .1, vision: .06 },
};

const CONTRACT_ROLE_LEVEL: Record<ContractSquadRole, number> = { Prospect: 0, Rotation: 1, "First team": 2, Important: 3, Star: 4 };

function defaultContractSquadRole(player: Pick<Player, "age" | "overall" | "potential">) {
  if (player.age < 21 && player.potential - player.overall >= 12) return "Prospect" as const;
  if (player.overall >= 78) return "Star" as const;
  if (player.overall >= 69) return "Important" as const;
  if (player.overall >= 58) return "First team" as const;
  return "Rotation" as const;
}

export type Stadium = {
  name: string;
  capacity: number;
  tiers: number;
  standing: boolean;
  roof: Roof;
  corners: boolean;
  seats: boolean;
  boxes: number;
  floodlights: number;
  pitchQuality: number;
  drainage: number;
  carPark: boolean;
  superstore: boolean;
  restaurant: boolean;
  hotel: boolean;
  standTiers?: StandTiers;
  standDesigns?: StandDesigns;
  standFacades?: StandFacades;
  standFrontages?: StandFrontages;
  standSeatColors?: StandSeatColors;
  standNames?: StandNames;
  standRoofs?: StandRoofs;
  executiveBoxesBySide?: ExecutiveBoxesBySide;
  cornerStands?: CornerStands;
  underfloorHeating?: boolean;
  pitchSurface?: PitchSurface;
  pitchCondition?: number;
  groundskeepingLevel?: number;
  facilityPlan?: StadiumFacilityPlan;
  carParkLevel?: number;
  superstoreLevel?: number;
  restaurantLevel?: number;
  hotelLevel?: number;
  fanZoneLevel?: number;
  museumLevel?: number;
  transportHubLevel?: number;
  trainingCentreLevel?: number;
  trainingPitchesLevel?: number;
  academyCampusLevel?: number;
  youthStadiumLevel?: number;
  siteRoadLevel?: number;
  concourseLevel?: number;
  scoreboardLevel?: number;
  ledBoardsLevel?: number;
  securityLevel?: number;
  architecture?: StadiumArchitecture;
  siteSetting?: StadiumSiteSetting;
  acquiredLand?: StadiumLandSide[];
  project: { name: string; weeksLeft: number; cost: number; upgrades: Partial<Stadium> } | null;
};

export type Club = {
  id: string;
  name: string;
  shortName: string;
  city: string;
  leagueId: string;
  region: string;
  foundedYear?: number;
  nickname?: string;
  bio?: string;
  rivals?: string[];
  history?: ClubHistoryMoment[];
  country: string;
  colors: [string, string];
  reputation: number;
  targetPosition: number;
  /** Private board tolerance; editable only through the paid in-game editor. */
  managerSackingPoint?: number;
  stadium: Stadium;
  balance: number;
  transferBudget: number;
  wageBudget: number;
  debt: number;
  boardTrust: number;
  supporterConfidence: number;
  sponsor: string;
  sponsorAnnual: number;
  sponsorOffer: { name: string; annual: number } | null;
  academyLevel: number;
  trainingLevel: number;
  scoutLevel: number;
  badge?: ClubBadge;
  sponsorContracts?: SponsorContract[];
  sponsorOffers?: SponsorOffer[];
  staff?: StaffMember[];
  board?: StaffMember[];
  dna?: ClubDNA;
  captainId?: string;
  viceCaptainId?: string;
  dressingRoomTension?: number;
  tacticalFamiliarity?: number;
  aiTactics?: AIClubTactics;
  ownerWealth?: number;
  responsibilities?: ClubResponsibilities;
  project?: ClubProject;
  projectHistory?: ClubProject[];
  boardAgenda?: ClubBoardAgenda[];
};

const FOOTBALL_STYLES: FootballStyle[] = ["Possession", "High press", "Counter attack"];

export const CLUB_RESPONSIBILITY_DEFINITIONS: { id: ResponsibilityArea; title: string; roles: StaffRole[]; brief: string }[] = [
  { id: "matchPreparation", title: "Match preparation", roles: ["Assistant Manager", "First-Team Coach", "First-Team Manager"], brief: "Opponent analysis and tactical rehearsal" },
  { id: "firstTeamTraining", title: "First-team training", roles: ["First-Team Coach", "Fitness Coach", "Goalkeeping Coach"], brief: "Player development and weekly training" },
  { id: "academyDevelopment", title: "Academy development", roles: ["Academy Director"], brief: "Youth progression and intake potential" },
  { id: "scouting", title: "Scouting network", roles: ["Head Scout"], brief: "Player reports and recruitment intelligence" },
  { id: "commercial", title: "Commercial strategy", roles: ["Finance Director", "Sporting Director"], brief: "Sponsor bids and commercial planning" },
  { id: "supporters", title: "Supporter relations", roles: ["Supporter Director"], brief: "Confidence and community response" },
];

export const CLUB_PROJECT_BLUEPRINTS: { id: ClubProjectKind; title: string; brief: string }[] = [
  { id: "league", title: "Sustained league performance", brief: "Meet the board's league target across multiple seasons." },
  { id: "academy", title: "Academy pathway", brief: "Build the academy level and make youth development a lasting strength." },
  { id: "stadium", title: "Ground development", brief: "Expand the stadium's capacity through real stand projects." },
  { id: "finances", title: "Financial resilience", brief: "Grow the club's cash balance through sustainable operations." },
];

function createClubDNA(id: string, name: string, reputation: number): ClubDNA {
  const seed = stableSeed(`${id}:${name}`);
  const tacticalIdentity = FOOTBALL_STYLES[seed % FOOTBALL_STYLES.length];
  const pick = <T,>(items: readonly T[], offset: number) => items[Math.floor(seed / offset) % items.length];
  return {
    tacticalIdentity,
    recruitmentPolicy: pick(["Academy pathway", "Regional scouting", "Value market", "Proven talent"], 3),
    academyTradition: pick(["Technical pathway", "Local roots", "Late developers", "Elite production"], 7),
    supporterIdentity: pick(["Front-foot football", "Homegrown heroes", "Hard-working side", "Big-match winners"], 13),
    spendingPolicy: pick(["Sustainable growth", "Balanced investment", "Bold ambition"], 17),
    preferredManager: pick(["Development coach", "Tactical innovator", "Man-manager", "Proven winner"], 23),
    identityStrength: Math.max(35, Math.min(96, 48 + (seed % 41) + Math.round((reputation - 50) * 0.22))),
    styleAdaptation: { [tacticalIdentity]: 100 },
  };
}

function supporterStyleAffinity(dna: ClubDNA, style: string) {
  if (!FOOTBALL_STYLES.includes(style as FootballStyle)) return 50;
  if (dna.supporterIdentity === "Front-foot football") return style === "Counter attack" ? 38 : 100;
  if (dna.supporterIdentity === "Homegrown heroes") return style === "Possession" ? 100 : 52;
  if (dna.supporterIdentity === "Hard-working side") return style === "Possession" ? 42 : 100;
  return style === "Counter attack" ? 100 : style === "High press" ? 72 : 48;
}

function dnaStyleFit(dna: ClubDNA, style: string) {
  if (!FOOTBALL_STYLES.includes(style as FootballStyle)) return 50;
  const activeStyle = style as FootballStyle;
  if (activeStyle === dna.tacticalIdentity) return 100;
  return Math.max(0, Math.min(100, dna.styleAdaptation[activeStyle] ?? 0));
}

function aiFormationFit(style: FootballStyle, formation: string) {
  if (style === "Possession") return ["4-3-3", "4-2-3-1", "4-1-4-1"].includes(formation) ? 0.48 : -0.12;
  if (style === "High press") return ["4-3-3", "4-2-3-1", "3-5-2"].includes(formation) ? 0.48 : -0.12;
  return ["4-4-2", "5-3-2", "4-2-3-1"].includes(formation) ? 0.48 : -0.12;
}

/**
 * The three broad tactical identities form a readable counter cycle. The edge is
 * deliberately modest: player quality still decides most matches, but choosing
 * the right approach can move a close fixture in either direction.
 */
export function tacticalStyleAdvantage(style: FootballStyle, opponentStyle: FootballStyle) {
  if (style === opponentStyle) return 0;
  if ((style === "High press" && opponentStyle === "Possession")
    || (style === "Possession" && opponentStyle === "Counter attack")
    || (style === "Counter attack" && opponentStyle === "High press")) return 1.7;
  return -1.7;
}

function counterStyleFor(style: FootballStyle): FootballStyle {
  if (style === "Possession") return "High press";
  if (style === "High press") return "Counter attack";
  return "Possession";
}

function safeFootballStyle(style: string): FootballStyle {
  return FOOTBALL_STYLES.includes(style as FootballStyle) ? style as FootballStyle : "Possession";
}

export function selectAIManagerStyle(club: Club, opponentStyle: FootballStyle, season: number, round: number) {
  const tactics = club.aiTactics ?? (club.aiTactics = createAIClubTactics(club.id, club.reputation));
  const dna = club.dna ?? createClubDNA(club.id, club.name, club.reputation);
  const identity = dna.tacticalIdentity;
  const counter = counterStyleFor(opponentStyle);
  const managerAbility = (club.staff ?? []).find((person) => person.role === "First-Team Manager")?.ability ?? 50;
  if (counter === identity || tacticalStyleAdvantage(counter, opponentStyle) <= tacticalStyleAdvantage(identity, opponentStyle)) {
    tactics.style = identity;
    return identity;
  }

  const adaptation = dna.styleAdaptation[counter] ?? 0;
  const tacticalReadiness = Math.max(0, Math.min(88, (managerAbility - 50) * 2.2 + adaptation * 0.28 + tactics.winlessRun * 9));
  const decisionRoll = stableSeed(`${club.id}:${season}:${round}:style-read`) % 100;
  const style = managerAbility >= 90 || decisionRoll < tacticalReadiness ? counter : identity;
  tactics.style = style;
  return style;
}

function recordClubStyleResult(club: Club, style: string, outcome: "win" | "draw" | "loss") {
  if (!club.dna || !FOOTBALL_STYLES.includes(style as FootballStyle)) return;
  const activeStyle = style as FootballStyle;
  if (activeStyle === club.dna.tacticalIdentity) return;
  const current = club.dna.styleAdaptation[activeStyle] ?? 0;
  const progress = outcome === "win" ? 5 : outcome === "draw" ? 2 : -1;
  club.dna.styleAdaptation[activeStyle] = Math.max(0, Math.min(100, current + progress));
}

export type MatchEventType = "goal" | "yellow-card" | "red-card" | "injury" | "substitution" | "tactical-change" | "half-time" | "full-time";
export type MatchEvent = {
  id: string;
  minute: number;
  type: MatchEventType;
  clubId: string | null;
  playerId?: string;
  playerName?: string;
  assistPlayerId?: string;
  assistPlayerName?: string;
  x?: number;
  y?: number;
  description: string;
};
export type MatchTeamStats = { shots: number; shotsOnTarget: number; possession: number; corners: number; expectedGoals: number };
export type MatchStats = { home: MatchTeamStats; away: MatchTeamStats };
export type MatchPreparationPlan = "Press their build-up" | "Break the press" | "Protect against counters";
export type MatchPreparation = { fixtureId: string; plan: MatchPreparationPlan };
export type MatchdaySubstitution = { minute: 45 | 60 | 75; playerOffId: string; playerOnId: string };
export type SecondHalfDirective = "Balanced" | "Raise the press" | "Protect the lead" | "Overload the wings" | "Keep possession";
export type MatchdayManagementPlan = { substitutions: MatchdaySubstitution[]; secondHalfDirective: SecondHalfDirective; teamTalk?: "Calm" | "Encouraging" | "Demanding" };
export type ActiveManagedMatch = {
  fixtureId: string;
  seed: number;
  minute: number;
  homeGoals: number;
  awayGoals: number;
  events: MatchEvent[];
  stats: MatchStats;
  plan: MatchdayManagementPlan;
  executedSubstitutions: MatchdaySubstitution[];
  playerRatings?: Record<string, number>;
  otherFixtureResults?: { fixtureId: string; homeGoals: number; awayGoals: number }[];
};

export type Fixture = {
  id: string;
  season: number;
  round: number;
  leagueId?: string;
  homeClubId: string;
  awayClubId: string;
  played: boolean;
  homeGoals: number | null;
  awayGoals: number | null;
  date: string;
  events?: MatchEvent[];
  stats?: MatchStats;
};

export type InternationalWindowName = "September" | "October" | "November" | "March";
export type InternationalFixture = {
  id: string;
  season: number;
  window: InternationalWindowName;
  date: string;
  confederation: string;
  competition: "International friendly";
  homeCountry: string;
  awayCountry: string;
  played: boolean;
  homeGoals: number | null;
  awayGoals: number | null;
  homeScorerIds?: string[];
  awayScorerIds?: string[];
};
export type InternationalCallup = { country: string; players: Player[] };

export type FinanceEntry = { date: string; label: string; amount: number };
export type NewsItem = { id: string; date: string; headline: string; body: string; type: "match" | "club" | "transfer" | "stadium" | "press" | "award"; urgent?: boolean; source?: string; reliability?: number };
export type ManagerInboxRoute = "overview" | "newsroom" | "tactics" | "fixtures" | "transfers" | "finance" | "academy" | "commercial" | "people" | "stadium";
export type ManagerInboxCategory = "Club news" | "Match analysis" | "Press conference" | "Transfer offer" | "Contracts" | "Scouting" | "Commercial";
export type ManagerInboxPriority = "Urgent" | "Action needed" | "Update";
export type ManagerInboxMessage = {
  id: string;
  date: string;
  category: ManagerInboxCategory;
  subject: string;
  body: string;
  priority: ManagerInboxPriority;
  route: ManagerInboxRoute;
  read: boolean;
  choices?: { id: string; label: string }[];
};
export type ClubTransferBid = { id: string; playerId: string; bidderClubId: string; fee: number; date: string; expiresDate: string; season: number; round: number; status: "Pending" | "Accepted" | "Rejected" | "Expired" };
export type PressConferenceChoice = "Back the players" | "Keep expectations measured" | "Demand a response";
export type SeasonAwardName = "World Player of the Year" | "Player of the Season" | "Top Scorer" | "Young Player of the Season";
export type SeasonAward = { id: string; season: number; award: SeasonAwardName; leagueId: string; leagueName: string; playerId: string; playerName: string; clubId: string; clubName: string; appearances: number; goals: number; assists: number; cleanSheets: number; performanceScore: number };
export type TransferRumour = { id: string; date: string; headline: string; body: string; type: "transfer"; source: string; reliability: number; playerId: string; fromClubId: string; toClubId: string };
export type ManagerLeave = { startDate: string; endDate: string; days: number; status: "active" | "completed" | "interrupted"; message: string };
export type MatchReport = { fixtureId: string; result: string; headline: string; notes: string[] };
export type ManagerCareerSeason = {
  season: number;
  leagueId: LeagueId;
  leagueName: string;
  position: number;
  clubCount: number;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  champion: boolean;
  promoted: boolean;
  relegated: boolean;
  recordTracked: boolean;
};
export type ManagerContract = {
  clubId: string;
  weeklyWage: number;
  startSeason: number;
  endSeason: number;
  targetPosition: number;
};
export type ManagerCareerAppointment = {
  id: string;
  clubId: string;
  clubName: string;
  city: string;
  country: string;
  leagueId: LeagueId;
  startSeason: number;
  startRound: number;
  endSeason: number | null;
  endRound: number | null;
  endReason: "Dismissed" | "Moved" | "Contract Expired" | "Historical" | null;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  contract?: ManagerContract;
  seasons: ManagerCareerSeason[];
};
export type TransferRecord = { id: string; season: number; playerId: string; playerName: string; fromClubId: string | null; fromClubName: string; toClubId: string; toClubName: string; fee: number; date: string };
export type ClubArchiveLeader = { playerId: string; playerName: string; appearances: number; goals: number; assists: number; cleanSheets: number };
export type ClubArchiveSeason = { season: number; club: string; clubId?: string; leagueId?: LeagueId; leagueName?: string; position: number; points: number; wins: number; draws?: number; losses?: number; goalsFor?: number; goalsAgainst?: number };
export type PlayerLoan = {
  id: string;
  playerId: string;
  playerName: string;
  parentClubId: string;
  parentClubName: string;
  loanClubId: string;
  loanClubName: string;
  startSeason: number;
  startRound: number;
  endSeason: number;
  endRound: number;
  loanFee: number;
  wageContributionPercent: number;
  status: "Active" | "Completed" | "Recalled" | "Returned" | "Released";
  startAppearances?: number;
  startGoals?: number;
  appearances?: number;
  goals?: number;
  returnSeason?: number;
  returnReason?: string;
};
export type PlayerLoanOffer = { loanClubId: string; loanFee: number; wageContributionPercent: number; durationRounds: number };
export type PlayerLoanNegotiation = { career: Career; status: "accepted" | "countered" | "rejected"; message: string; counterOffer?: PlayerLoanOffer };

export type Career = {
  schemaVersion?: number;
  id: string;
  manager: string;
  clubId: string;
  season: number;
  round: number;
  calendarDate?: string;
  managerLeave?: ManagerLeave | null;
  clubs: Club[];
  players: Player[];
  fixtures: Fixture[];
  activeMatch?: ActiveManagedMatch | null;
  matchArchive?: Fixture[];
  internationalFixtures?: InternationalFixture[];
  internationalArchive?: InternationalFixture[];
  matchPreparation?: MatchPreparation;
  setPiecePlan?: SetPiecePlan;
  playerRelationships?: PlayerRelationship[];
  managerPromises?: ManagerPromise[];
  awardHistory?: SeasonAward[];
  managerHistory?: AIManagerChange[];
  managerCareerHistory?: ManagerCareerAppointment[];
  managerContract?: ManagerContract | null;
  transferHistory?: TransferRecord[];
  winterTransferSeasons?: number[];
  playerLoans?: PlayerLoan[];
  formation: string;
  mentality: string;
  style: string;
  lineup: string[];
  finance: FinanceEntry[];
  news: NewsItem[];
  history: ClubArchiveSeason[];
  managerReputation: number;
  unemployed: boolean;
  lastReport: MatchReport | null;
  kit: { home: string; away: string; third: string; trim: string };
  pressure?: number;
  pressPressure?: number;
  winlessRun?: number;
  tacticalFamiliarity?: number;
  pressingIntensity?: number;
  defensiveLine?: number;
  passingTempo?: number;
  attackingWidth?: number;
  matchMode?: "Instant result" | "Highlights" | "Full management";
  teamTalk?: "Calm" | "Encouraging" | "Demanding";
  kitDesignReady?: boolean;
  kitPatterns?: { home: KitPattern; away: KitPattern; third: KitPattern };
  playerPositions?: Record<string, { x: number; y: number }>;
  recruitmentPitches?: Record<string, number>;
  kitCollectionSeason?: number;
  scoutingReports?: ScoutingReport[];
  scoutingAssignments?: ScoutingAssignment[];
  staffChanges?: Record<string, string | null>;
  inboxReadIds?: string[];
  pressConferenceResponses?: Record<string, PressConferenceChoice>;
  incomingTransferOffers?: ClubTransferBid[];
};


const STADIUM_IDENTITIES: { name: string; architecture: StadiumArchitecture; roof: Roof; tiers: StandTiers; corners: CornerStands }[] = [
  { name: "Harbourlight Park", architecture: "Dockside steel", roof: "Retractable roof", tiers: { north: 3, east: 2, south: 3, west: 2 }, corners: { northWest: true, northEast: true, southWest: false, southEast: true } },
  { name: "The Old Clock Ground", architecture: "Clocktower brick", roof: "Continuous bowl", tiers: { north: 2, east: 3, south: 2, west: 3 }, corners: { northWest: true, northEast: false, southWest: true, southEast: true } },
  { name: "Foundry End", architecture: "Foundry arches", roof: "Cantilever", tiers: { north: 2, east: 2, south: 3, west: 2 }, corners: { northWest: true, northEast: true, southWest: true, southEast: false } },
  { name: "The Glassbank", architecture: "Riverside glass", roof: "Flat canopy", tiers: { north: 2, east: 2, south: 2, west: 3 }, corners: { northWest: false, northEast: true, southWest: true, southEast: false } },
  { name: "Highfield Terrace", architecture: "Hilltop terraces", roof: "Open sky", tiers: { north: 1, east: 2, south: 1, west: 2 }, corners: { northWest: true, northEast: false, southWest: false, southEast: true } },
  { name: "Railway Crescent", architecture: "Railway truss", roof: "Cantilever", tiers: { north: 2, east: 1, south: 2, west: 2 }, corners: { northWest: false, northEast: true, southWest: true, southEast: true } },
  { name: "Bracken Bowl", architecture: "Garden bowl", roof: "Continuous bowl", tiers: { north: 1, east: 1, south: 2, west: 1 }, corners: { northWest: true, northEast: false, southWest: false, southEast: false } },
  { name: "The Civic Stand", architecture: "Civic colonnade", roof: "Flat canopy", tiers: { north: 1, east: 2, south: 1, west: 1 }, corners: { northWest: false, northEast: true, southWest: false, southEast: true } },
  { name: "Manchester Crescent Ground", architecture: "Clocktower brick", roof: "Continuous bowl", tiers: { north: 3, east: 2, south: 3, west: 2 }, corners: { northWest: true, northEast: true, southWest: true, southEast: true } },
  { name: "Birmingham Crown Ground", architecture: "Foundry arches", roof: "Cantilever", tiers: { north: 2, east: 2, south: 2, west: 2 }, corners: { northWest: true, northEast: false, southWest: true, southEast: true } },
  { name: "Beacon Lane", architecture: "Beacon tower", roof: "Cantilever", tiers: { north: 1, east: 1, south: 1, west: 1 }, corners: { northWest: true, northEast: false, southWest: true, southEast: false } },
  { name: "London Docklands Arena", architecture: "Southbank lattice", roof: "Retractable roof", tiers: { north: 1, east: 1, south: 1, west: 1 }, corners: { northWest: false, northEast: true, southWest: false, southEast: true } },
];

const FIRST_NAMES = ["Ari", "Callum", "Dara", "Elliot", "Finlay", "Hugo", "Isaac", "Jude", "Kian", "Lewis", "Milan", "Noah", "Oscar", "Perry", "Rafi", "Sam", "Tariq", "Vinnie", "Wes", "Zain"];
const LAST_NAMES = ["Ainsley", "Bennett", "Clarke", "Doyle", "Ellery", "Fletcher", "Grady", "Haines", "Irwin", "Keane", "Lowry", "Marlow", "Noble", "Osei", "Pike", "Quinn", "Rowe", "Shaw", "Turner", "Vale"];
const NATIONALITIES = WORLD_PLAYER_COUNTRIES;
const NATIONALITY_CONTINENT = new Map(WORLD_COUNTRIES.map(({ country, continent }) => [country, continent]));
const NATIONALITY_BIRTHPLACES: Record<string, string[]> = {
  English: ["Sunderland", "Reading", "Stoke-on-Trent", "York", "Northampton", "Blackpool", "Plymouth", "Huddersfield", "Manchester", "Birmingham", "Wickford", "London"], Scottish: ["Inverhaven", "Dunross", "Braemar", "Aberloch"], Welsh: ["Brynford", "Llanmere", "Cwmhaven", "Porthwick"], Irish: ["Ardmore", "Kilross", "Dunloe", "Rathwick"],
  French: ["Clairmont", "Douvray", "Montfleur", "Valeroux"], Spanish: ["Almaraz", "Estrella", "Monteluz", "Puerto Real"], German: ["Altenburg", "Dornheim", "Lindenau", "Waldheim"], Dutch: ["Aarden", "Dijkhaven", "Havenwijk", "Veldrecht"],
  Italian: ["Bellacqua", "Fontesole", "Portovivo", "San Celso"], Portuguese: ["Alvorada", "Costa Nova", "Porteluz", "Vale do Sol"], Swedish: ["Alvesta", "Bjorvik", "Hammarby Strand", "Vallvik"], Danish: ["Aalholm", "Egeborg", "Lindholm", "Sonderby"], Belgian: ["Beaufort", "Clairval", "Montclair", "Westerloo"], Norwegian: ["Austvik", "Fjellhamn", "Nordhavn", "Vestfjord"], Polish: ["Czarnow", "Dabrowa", "Nowa Rzeka", "Sokolow"],
};
const WORLD_BIRTHPLACES = new Map<string, string[]>();
for (const seed of [...WORLD_CLUB_SEEDS, ...ENGLISH_CLUB_SEEDS.map((club) => ({ ...club, country: "England" }))]) {
  const places = WORLD_BIRTHPLACES.get(seed.country) ?? [];
  if (!places.includes(seed.city)) places.push(seed.city);
  WORLD_BIRTHPLACES.set(seed.country, places);
}
const FORMATIONS: Record<string, Position[]> = {
  "4-4-2": ["GK", "DEF", "DEF", "DEF", "DEF", "MID", "MID", "MID", "MID", "FWD", "FWD"],
  "4-3-3": ["GK", "DEF", "DEF", "DEF", "DEF", "MID", "MID", "MID", "FWD", "FWD", "FWD"],
  "4-2-3-1": ["GK", "DEF", "DEF", "DEF", "DEF", "MID", "MID", "MID", "MID", "MID", "FWD"],
  "3-5-2": ["GK", "DEF", "DEF", "DEF", "MID", "MID", "MID", "MID", "MID", "FWD", "FWD"],
  "4-1-4-1": ["GK", "DEF", "DEF", "DEF", "DEF", "MID", "MID", "MID", "MID", "MID", "FWD"],
  "3-4-3": ["GK", "DEF", "DEF", "DEF", "MID", "MID", "MID", "MID", "FWD", "FWD", "FWD"],
  "5-3-2": ["GK", "DEF", "DEF", "DEF", "DEF", "DEF", "MID", "MID", "MID", "FWD", "FWD"],
  "4-5-1": ["GK", "DEF", "DEF", "DEF", "DEF", "MID", "MID", "MID", "MID", "MID", "FWD"],
};

function randomFrom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stableSeed(value: string) {
  return [...value].reduce((seed, character) => Math.imul(seed ^ character.charCodeAt(0), 16777619), 2166136261) >>> 0;
}

const BADGE_ACCENTS = ["#d9b86c", "#e8e6d4", "#75bdb0", "#c47b55", "#8ea1c2", "#d88caa", "#c9d26c", "#8bbaa0", "#d1a1cf", "#dfd0a5"];
export const STADIUM_SITE_SETTINGS: StadiumSiteSetting[] = ["Dense terraces", "Railway quarter", "Waterside quay", "Industrial fringe", "Parkland", "Hillside green", "Suburban campus", "Market streets", "Harbour edge", "Riverside mills"];

function createClubBadge(clubId: string, colors: [string, string], foundingYear: number): ClubBadge {
  const choose = <T,>(values: T[], part: string) => values[stableSeed(`${clubId}:club-identity:${part}`) % values.length];
  return {
    shape: choose(CLUB_BADGE_SHAPES, "silhouette"),
    field: choose(CLUB_BADGE_FIELDS, "heraldry"),
    emblem: choose(CLUB_BADGE_EMBLEMS, "symbol"),
    accent: choose(BADGE_ACCENTS, "accent"),
    colors: [colors[0], colors[1]],
    foundingYear,
  };
}

export function getStadiumSiteSetting(clubId: string, city: string, region: string, country = "England"): StadiumSiteSetting {
  const seed = stableSeed(`${clubId}:${city}:${region}:${country}:stadium-site`);
  const place = `${city} ${region}`.toLowerCase();
  if (/harbour|harbor|coast|dock|sound|bay|port|estuary|mariner|tide/.test(place)) {
    return (["Waterside quay", "Harbour edge", "Riverside mills", "Dense terraces", "Railway quarter"] as StadiumSiteSetting[])[seed % 5];
  }
  if (/rail|junction|station|exchange/.test(place)) return seed % 2 ? "Railway quarter" : "Market streets";
  return STADIUM_SITE_SETTINGS[seed % STADIUM_SITE_SETTINGS.length];
}

const PLAYER_PERSONALITIES: PlayerPersonality[] = ["Professional", "Ambitious", "Team-first", "Reserved", "Fiery", "Natural leader"];

function personalityForPlayer(id: string): PlayerPersonality {
  return PLAYER_PERSONALITIES[stableSeed(`${id}:personality`) % PLAYER_PERSONALITIES.length];
}

function leadershipForPlayer(id: string, age: number, personality = personalityForPlayer(id)) {
  const traitBonus = personality === "Natural leader" ? 18 : personality === "Professional" || personality === "Team-first" ? 8 : 0;
  return Math.max(18, Math.min(98, 34 + Math.max(0, age - 16) * 0.8 + stableSeed(`${id}:leadership`) % 26 + traitBonus));
}

function emptyPlayerStats(): PlayerStats {
  return { appearances: 0, goals: 0, assists: 0, cleanSheets: 0, minutes: 0 };
}

function profileAttributes(id: string, overall: number, position: Position, growth: PlayerAttributeMap = {}): PlayerAttributes {
  const random = randomFrom(stableSeed(id));
  const rating = (bias: number) => Math.max(5, Math.min(99, Math.round(overall + bias + Math.floor(random() * 19) - 9)));
  const attacking = position === "FWD" ? 10 : position === "MID" ? 2 : position === "DEF" ? -10 : -22;
  const defending = position === "DEF" ? 11 : position === "GK" ? 5 : position === "MID" ? 0 : -13;
  const keeper = position === "GK" ? 30 : -27;
  const attributes: PlayerAttributes = { pace: rating(position === "FWD" ? 5 : position === "DEF" ? 0 : -2), shooting: rating(attacking), passing: rating(position === "MID" ? 8 : position === "DEF" ? -3 : 0), dribbling: rating(position === "FWD" ? 7 : position === "MID" ? 5 : -4), defending: rating(defending), physical: rating(position === "DEF" ? 5 : position === "MID" ? 1 : -1), vision: rating(position === "MID" ? 9 : position === "FWD" ? 1 : -4), crossing: rating(position === "MID" || position === "DEF" ? 4 : -3), finishing: rating(attacking + 2), tackling: rating(defending + 2), strength: rating(position === "DEF" ? 8 : position === "FWD" ? 3 : 0), stamina: rating(position === "MID" ? 6 : 1), reactions: rating(keeper + (position === "FWD" ? 2 : 0)), handling: rating(keeper + 3), positioning: rating(position === "GK" ? 19 : position === "DEF" ? 7 : position === "FWD" ? 5 : 0), composure: rating(position === "MID" ? 4 : 1) };
  for (const key of Object.keys(attributes) as PlayerAttributeKey[]) {
    attributes[key] = Math.min(99, attributes[key] + Math.max(0, Math.floor(growth[key] ?? 0)));
  }
  return attributes;
}

function addPlayerProfile(player: Player, season = 1) {
  const seed = stableSeed(player.id);
  const gameYear = 2026 + season - 1;
  const month = 1 + seed % 6;
  const day = 1 + Math.floor(seed / 7) % 27;
  const nationality = player.nationality ?? "English";
  const places = NATIONALITY_BIRTHPLACES[nationality] ?? WORLD_BIRTHPLACES.get(nationality) ?? NATIONALITY_BIRTHPLACES.English;
  player.dateOfBirth ??= `${String(gameYear - player.age).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  player.birthPlace ??= places[Math.floor(seed / 13) % places.length];
  player.careerStats ??= emptyPlayerStats();
  player.seasonStats ??= emptyPlayerStats();
  player.attributeGrowth ??= {};
  player.attributeTrainingProgress ??= {};
  player.attributes ??= profileAttributes(player.id, player.overall, player.position, player.attributeGrowth);
  const currentClub = CLUB_SEEDS.find((club) => club.short === player.clubId);
  if (!player.clubHistory) {
    const clubName = player.clubId === null || player.id.startsWith("free-") || player.id.startsWith("scout-") ? "Unattached" : currentClub?.name ?? `${player.clubId} Academy`;
    player.clubHistory = player.clubId && !player.id.startsWith("free-") && !player.id.startsWith("scout-") ? [{ clubId: player.clubId, clubName, country: player.country ?? currentClub?.country ?? "England", fromSeason: season, toSeason: null, squadLevel: player.squadLevel ?? squadLevelForAge(player.age), appearances: 0, goals: 0, assists: 0, cleanSheets: 0 }] : [];
  }
  if (!player.academyHistory) player.academyHistory = player.age < 21 && player.clubId && !player.id.startsWith("scout-") ? [{ season, age: player.age, squadLevel: player.squadLevel ?? squadLevelForAge(player.age), academyLevel: player.age < 16 ? 1 : 2 }] : [];
  return player;
}

function makeClubStory(seed: (typeof CLUB_SEEDS)[number], index: number) {
  const nicknames = ["the Ironworks", "the Mariners", "the Lanterns", "the Foundry", "the Rovers", "the Ravens", "the Robins", "the Vale", "the Dockers", "the Borough", "the Railwaymen", "the Comets", "the Oaks", "the Harriers", "the Phoenix", "the Pilots"];
  const origin = seed.region.includes("Coast") || seed.region.includes("Harbour") ? "dock workers and shipwrights" : seed.region.includes("Midland") ? "foundry hands and railway families" : seed.region.includes("Yorkshire") || seed.region.includes("North") ? "mill workers and neighbourhood teams" : seed.region.includes("Anglia") || seed.region.includes("East") ? "market traders and village sides" : "local tradespeople and community clubs";
  const foundingYear = 1870 + stableSeed(seed.short) % 88;
  const expansionYear = Math.min(2000, foundingYear + 24 + index % 24);
  const modernYear = Math.min(2025, expansionYear + 12 + (index * 7) % 17);
  const nickname = nicknames[(stableSeed(seed.short) + index) % nicknames.length];
  const companyTypes = ["Renewables", "Freight & Rail", "Mutual", "Digital Works", "Marine Group", "Engineering", "Building Society", "Foods", "Motors", "Telecom", "Steel & Fabrication", "Community Bank"];
  const sponsor = `${seed.city} ${companyTypes[(index * 5 + stableSeed(seed.city)) % companyTypes.length]}`;
  const heritage = `${seed.region} football has always been shaped by close-knit grounds and local pride.`;
  const fallenGiant = seed.short === "MCA" || seed.short === "RCB";
  const bio = fallenGiant
    ? `${seed.name} were formed in ${foundingYear} around ${seed.city}. For generations the club was a fixture in the top division, filling a ground built for bigger nights. Relegation and financial strain brought the old stand's crowds down, but the town still sees a return to the top as part of its story. ${heritage} Today ${sponsor} backs the rebuild.`
    : `${seed.name} were formed in ${foundingYear} by ${origin} around ${seed.city}. The club's ${nickname.toLowerCase()} identity grew alongside the town's working life, and generations of families have made the ground a meeting place on matchday. ${heritage} Today the club remains locally rooted while ${sponsor} backs its next chapter.`;
  const history: ClubHistoryMoment[] = [
    { year: foundingYear, title: "A club takes shape", detail: `${seed.name} begin as a community side for ${seed.city} and its surrounding neighbourhoods.` },
    { year: expansionYear, title: "The town gets behind the side", detail: `A new stand and a growing local following establish ${seed.name} as one of the area's best-known institutions.` },
    { year: modernYear, title: "A modern chapter", detail: `The club refreshes its ground and academy, carrying ${seed.region} traditions into a new generation.` },
  ];
  if (fallenGiant) {
    history.splice(2, 0,
      { year: Math.max(foundingYear + 20, modernYear - 28), title: "A giant of the old division", detail: `${seed.name} win promotion to the top flight and expand the ground to hold more than 18,000 supporters.` },
      { year: Math.max(foundingYear + 24, modernYear - 12), title: "The long fall", detail: `A financial squeeze and successive relegations leave the club playing far below the level its stadium was built for.` },
    );
  }
  return { foundingYear, nickname, sponsor, bio, history };
}

function nearbyRivals(seed: { short: string; region: string }, seeds: readonly { short: string; region: string }[] = CLUB_SEEDS) {
  const regionalMatches = seeds.filter((club) => club.short !== seed.short && club.region === seed.region);
  const broadRegion = seed.region.includes("North") || seed.region.includes("Yorkshire") || seed.region.includes("West Midlands") ? "North" : "South";
  const nearby = regionalMatches.length >= 2 ? regionalMatches : [
    ...regionalMatches,
    ...seeds.filter((club) => club.short !== seed.short && (club.region.includes("North") || club.region.includes("Yorkshire") || club.region.includes("West Midlands") ? "North" : "South") === broadRegion),
  ];
  return [...new Set(nearby.map((club) => club.short))].slice(0, 2);
}

function refreshPlayerProfile(player: Player, season: number) {
  delete player.dateOfBirth;
  delete player.attributes;
  if (player.clubHistory?.length) player.clubHistory = player.clubHistory.map((record) => record.toSeason === null ? { ...record, squadLevel: player.squadLevel ?? squadLevelForAge(player.age) } : record);
  if (player.academyHistory?.length && player.age < 21) player.academyHistory[player.academyHistory.length - 1] = { season, age: player.age, squadLevel: player.squadLevel ?? squadLevelForAge(player.age), academyLevel: player.age < 16 ? 1 : 2 };
  addPlayerProfile(player, season);
  if (player.age < 21 && player.clubId && !player.id.startsWith("scout-") && !player.academyHistory?.length) player.academyHistory = [{ season, age: player.age, squadLevel: player.squadLevel ?? squadLevelForAge(player.age), academyLevel: player.age < 16 ? 1 : 2 }];
  return player;
}

function domesticNationalityShare(country: string, tier: number, reputation: number) {
  const lowerTierShare = country === "England" ? 0.68 : 0.75;
  const tierAdjustment = Math.min(0.15, Math.max(0, tier - 1) * 0.025);
  const reputationAdjustment = Math.min(0.1, Math.max(0, reputation - 68) * 0.003);
  return Math.max(0.58, Math.min(0.9, lowerTierShare + tierAdjustment - reputationAdjustment));
}

function generatedNationality(country: string | undefined, random: () => number, domesticShare: number) {
  if (!country) return NATIONALITIES[Math.floor(random() * NATIONALITIES.length)];
  if (random() < domesticShare) return country;
  const continent = NATIONALITY_CONTINENT.get(country);
  const regionalPool = continent ? WORLD_COUNTRIES.filter((entry) => entry.continent === continent && entry.country !== country).map((entry) => entry.country) : [];
  const foreignPool = regionalPool.length ? regionalPool : NATIONALITIES.filter((nationality) => nationality !== country);
  return foreignPool[Math.floor(random() * foreignPool.length)] ?? country;
}

function createPlayer(id: string, clubId: string, position: Position, base: number, random: () => number, country?: string, domesticShare = 0.78): Player {
  const age = 18 + Math.floor(random() * 17);
  const overall = Math.max(34, Math.min(86, base + Math.floor(random() * 12) - 5));
  const potential = Math.min(91, Math.max(overall, overall + Math.floor(random() * Math.max(2, 20 - Math.max(0, age - 20)))));
  const first = FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(random() * LAST_NAMES.length)];
  const player: Player = {
    id,
    name: `${first} ${last}`,
    age,
    position,
    overall,
    potential,
    wage: Math.round((overall * 42 + (age > 30 ? 450 : 0)) / 100) * 100,
    value: Math.round(Math.max(25000, (overall - 35) ** 2 * 1800) / 1000) * 1000,
    contractYears: 1 + Math.floor(random() * 4),
    contractRole: defaultContractSquadRole({ age, overall, potential }),
    injury: null,
    injuryWeeksRemaining: 0,
    yellowCardsThisSeason: 0,
    suspensionMatchesRemaining: 0,
    morale: 55 + Math.floor(random() * 36),
    condition: 100,
    clubId,
    trainingFocus: "Balanced",
    country,
    nationality: generatedNationality(country, random, domesticShare),
    squadLevel: squadLevelForAge(age),
    managerRapport: 58,
    role: position === "GK" ? "Goalkeeper" : position === "DEF" ? "Defender" : position === "MID" ? "Midfielder" : "Forward",
    roleFamiliarity: 55,
    personality: personalityForPlayer(id),
    leadership: leadershipForPlayer(id, age),
  };
  return addPlayerProfile(player);
}

export function generateFixtures(season: number, clubIds = CLUB_SEEDS.map((club) => club.short), leagueId?: LeagueId): Fixture[] {
  if (clubIds.length < 2 || clubIds.length % 2 !== 0) throw new Error("A league needs an even number of at least two clubs.");
  const rotation = [...clubIds];
  const rounds: { home: string; away: string }[][] = [];
  for (let round = 0; round < clubIds.length - 1; round += 1) {
    const games: { home: string; away: string }[] = [];
    for (let index = 0; index < clubIds.length / 2; index += 1) {
      const first = rotation[index];
      const second = rotation[rotation.length - 1 - index];
      const flip = (round + index) % 2 === 1;
      games.push(flip ? { home: second, away: first } : { home: first, away: second });
    }
    rounds.push(games);
    rotation.splice(1, 0, rotation.pop()!);
  }
  const fixtureList: Fixture[] = [];
  const scheduledRounds = leagueId ? leagueDefinition(leagueId).rounds : rounds.length * 2;
  for (let round = 0; round < scheduledRounds; round += 1) {
    const returnLeg = Math.floor(round / rounds.length) % 2 === 1;
    const games = rounds[round % rounds.length];
    for (const [index, game] of games.entries()) {
      const date = new Date(Date.UTC(2026 + season - 1, 7, 8 + round * 7));
      fixtureList.push({
        id: `s${season}-${leagueId ?? "league"}-r${round + 1}-m${index + 1}`,
        season,
        round: round + 1,
        leagueId,
        homeClubId: returnLeg ? game.away : game.home,
        awayClubId: returnLeg ? game.home : game.away,
        played: false,
        homeGoals: null,
        awayGoals: null,
        date: date.toISOString().slice(0, 10),
      });
    }
  }
  return fixtureList;
}

export function generateEnglishFixtures(season: number, clubs: Pick<Club, "id" | "leagueId">[]): Fixture[] {
  return ENGLISH_LEAGUES.flatMap((league) => generateFixtures(
    season,
    clubs.filter((club) => club.leagueId === league.id).map((club) => club.id),
    league.id,
  ));
}

export function generateCareerFixtures(season: number, clubs: Pick<Club, "id" | "leagueId">[]): Fixture[] {
  const fixtures = generateEnglishFixtures(season, clubs);
  const activeWorldLeagues = [...new Set(clubs.map((club) => club.leagueId).filter((id) => WORLD_LEAGUES.some((league) => league.id === id)))];
  for (const leagueId of activeWorldLeagues) {
    const clubIds = clubs.filter((club) => club.leagueId === leagueId).map((club) => club.id);
    fixtures.push(...generateFixtures(season, clubIds, leagueId));
  }
  return fixtures;
}

const INTERNATIONAL_WINDOWS: { name: InternationalWindowName; month: number; yearOffset: number }[] = [
  { name: "September", month: 8, yearOffset: 0 },
  { name: "October", month: 9, yearOffset: 0 },
  { name: "November", month: 10, yearOffset: 0 },
  { name: "March", month: 2, yearOffset: 1 },
];

function nthWeekdayDate(year: number, month: number, weekday: number, occurrence: number) {
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const day = 1 + ((weekday - firstWeekday + 7) % 7) + (occurrence - 1) * 7;
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

export function generateInternationalFixtures(season: number): InternationalFixture[] {
  const firstYear = 2026 + season - 1;
  const continents = [...new Set(WORLD_COUNTRIES.map((entry) => entry.continent))];
  return INTERNATIONAL_WINDOWS.flatMap((window) => {
    const date = nthWeekdayDate(firstYear + window.yearOffset, window.month, 3, 2);
    return continents.flatMap((continent) => {
      const countries = WORLD_COUNTRIES.filter((entry) => entry.continent === continent).map((entry) => entry.country);
      const random = randomFrom(stableSeed(`international:${season}:${window.name}:${continent}`));
      for (let index = countries.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(random() * (index + 1));
        [countries[index], countries[swap]] = [countries[swap], countries[index]];
      }
      return Array.from({ length: Math.floor(countries.length / 2) }, (_, pairIndex) => {
        const homeCountry = countries[pairIndex * 2];
        const awayCountry = countries[pairIndex * 2 + 1];
        return {
          id: `s${season}-intl-${window.name.toLowerCase()}-${continent.replaceAll(" ", "-").toLowerCase()}-${pairIndex + 1}`,
          season,
          window: window.name,
          date,
          confederation: continent,
          competition: "International friendly" as const,
          homeCountry,
          awayCountry,
          played: false,
          homeGoals: null,
          awayGoals: null,
        };
      });
    });
  });
}

function internationalPlayerPools(career: Career) {
  const pools = new Map<string, Player[]>();
  for (const player of career.players) {
    if (!player.nationality || player.age < 16 || player.clubId === null || (player.injuryWeeksRemaining ?? 0) > 0) continue;
    const pool = pools.get(player.nationality) ?? [];
    pool.push(player);
    pools.set(player.nationality, pool);
  }
  for (const pool of pools.values()) pool.sort((first, second) => second.overall - first.overall || (second.internationalCaps ?? 0) - (first.internationalCaps ?? 0) || first.id.localeCompare(second.id));
  return pools;
}

function selectInternationalXI(squad: Player[]) {
  const remaining = [...squad];
  const eleven: Player[] = [];
  const take = (position: Position, count: number) => {
    for (let index = 0; index < count; index += 1) {
      const found = remaining.findIndex((player) => player.position === position);
      if (found < 0) continue;
      eleven.push(remaining.splice(found, 1)[0]);
    }
  };
  take("GK", 1);
  take("DEF", 4);
  take("MID", 3);
  take("FWD", 3);
  while (eleven.length < Math.min(11, squad.length)) eleven.push(remaining.shift()!);
  return eleven;
}

export function getInternationalCallups(career: Career, date?: string): InternationalCallup[] {
  const fixtures = career.internationalFixtures ?? [];
  const targetDate = date ?? fixtures.filter((fixture) => !fixture.played && fixture.date >= getCalendarDate(career)).map((fixture) => fixture.date).sort()[0];
  if (!targetDate) return [];
  const pools = internationalPlayerPools(career);
  const countries = new Set(fixtures.filter((fixture) => fixture.date === targetDate).flatMap((fixture) => [fixture.homeCountry, fixture.awayCountry]));
  return [...countries].map((country) => {
    const selected = (pools.get(country) ?? []).slice(0, 23);
    return { country, players: selected.filter((player) => player.clubId === career.clubId) };
  }).filter((callup) => callup.players.length > 0).sort((first, second) => first.country.localeCompare(second.country));
}

function poissonGoals(random: () => number, expected: number) {
  const threshold = Math.exp(-Math.max(0.1, expected));
  let product = 1;
  let count = 0;
  while (product > threshold && count < 6) {
    count += 1;
    product *= Math.max(Number.EPSILON, random());
  }
  return Math.max(0, count - 1);
}

export function simulateInternationalWindow(career: Career, date: string): Career {
  const next = structuredClone(career);
  const fixtures = next.internationalFixtures ?? [];
  const scheduled = fixtures.filter((fixture) => fixture.date === date && !fixture.played);
  if (!scheduled.length) return career;
  const clubPlayersByCountry = new Map<string, Set<string>>();
  const playerPools = internationalPlayerPools(next);

  for (const fixture of scheduled) {
    const homeSquad = (playerPools.get(fixture.homeCountry) ?? []).slice(0, 23);
    const awaySquad = (playerPools.get(fixture.awayCountry) ?? []).slice(0, 23);
    const homeXI = selectInternationalXI(homeSquad);
    const awayXI = selectInternationalXI(awaySquad);
    const nationalRating = (country: string, xi: Player[]) => {
      const fallback = 44 + stableSeed(`national-team:${country}`) % 31;
      const playerAverage = xi.length ? xi.reduce((sum, player) => sum + player.overall, 0) / xi.length : fallback;
      return playerAverage * 0.82 + fallback * 0.18;
    };
    const homeRating = nationalRating(fixture.homeCountry, homeXI);
    const awayRating = nationalRating(fixture.awayCountry, awayXI);
    const random = randomFrom(stableSeed(`${fixture.id}:${date}:result`));
    const difference = homeRating - awayRating + 2.2;
    const homeGoals = poissonGoals(random, Math.max(0.25, Math.min(2.7, 1.25 + difference / 34)));
    const awayGoals = poissonGoals(random, Math.max(0.2, Math.min(2.5, 1.05 - difference / 36)));
    const homeAppearances = [...homeXI, ...homeSquad.filter((player) => !homeXI.some((starter) => starter.id === player.id)).slice(0, 3)];
    const awayAppearances = [...awayXI, ...awaySquad.filter((player) => !awayXI.some((starter) => starter.id === player.id)).slice(0, 3)];
    const recordAppearances = (country: string, players: Player[]) => {
      const ids = clubPlayersByCountry.get(country) ?? new Set<string>();
      for (const player of players) {
        player.internationalCaps = (player.internationalCaps ?? 0) + 1;
        player.internationalGoals ??= 0;
        player.condition = Math.max(35, (player.condition ?? 100) - 4);
        if (player.clubId === next.clubId) ids.add(player.id);
      }
      clubPlayersByCountry.set(country, ids);
    };
    recordAppearances(fixture.homeCountry, homeAppearances);
    recordAppearances(fixture.awayCountry, awayAppearances);
    const scorerIds = (players: Player[], goals: number) => Array.from({ length: goals }, () => {
      if (!players.length) return undefined;
      const attackOptions = players.filter((player) => player.position === "FWD" || player.position === "MID");
      const scorer = (attackOptions.length ? attackOptions : players)[Math.floor(random() * (attackOptions.length || players.length))];
      scorer.internationalGoals = (scorer.internationalGoals ?? 0) + 1;
      return scorer.id;
    }).filter((id): id is string => Boolean(id));
    fixture.homeGoals = homeGoals;
    fixture.awayGoals = awayGoals;
    fixture.homeScorerIds = scorerIds(homeXI, homeGoals);
    fixture.awayScorerIds = scorerIds(awayXI, awayGoals);
    fixture.played = true;
  }

  const calledUpIds = [...clubPlayersByCountry.values()].flatMap((ids) => [...ids]);
  const calledUpNames = calledUpIds.map((id) => next.players.find((player) => player.id === id)?.name).filter((name): name is string => Boolean(name));
  const windowName = scheduled[0].window;
  const homeClub = getClub(next);
  const resultSummary = scheduled.slice(0, 4).map((fixture) => `${fixture.homeCountry} ${fixture.homeGoals}–${fixture.awayGoals} ${fixture.awayCountry}`).join(" · ");
  next.news.unshift({
    id: `international-${next.season}-${windowName.toLowerCase()}`,
    date: dateLabel(date),
    headline: calledUpNames.length ? `${calledUpNames.length} ${homeClub.name} players represent their countries` : `${windowName} international window concludes`,
    body: calledUpNames.length
      ? `${calledUpNames.slice(0, 5).join(", ")}${calledUpNames.length > 5 ? ` and ${calledUpNames.length - 5} more` : ""} appeared for their national teams. International duty is recorded in each player dossier. ${resultSummary}`
      : `${scheduled.length} international friendlies were completed across ${new Set(scheduled.flatMap((fixture) => [fixture.homeCountry, fixture.awayCountry])).size} national teams. ${resultSummary}`,
    type: "match",
    source: "The International Desk",
    reliability: 100,
  });
  return next;
}

export function createCareerId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined") crypto.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function createManagerContract(club: Club, managerReputation: number, season: number): ManagerContract {
  const clubReputation = Math.max(5, Math.min(100, club.reputation));
  const reputation = Math.max(20, Math.min(100, managerReputation));
  const term = reputation >= clubReputation + 18 ? 3 : reputation + 12 < clubReputation ? 1 : 2;
  const weeklyWage = Math.round((500 + clubReputation * clubReputation * 8 + reputation * 25) / 250) * 250;
  return {
    clubId: club.id,
    weeklyWage,
    startSeason: season,
    endSeason: season + term - 1,
    targetPosition: club.targetPosition,
  };
}

function createManagerCareerAppointment(careerId: string, club: Club, season: number, round: number, sequence: number, contract?: ManagerContract): ManagerCareerAppointment {
  return {
    id: `${careerId}:appointment:${sequence}:${club.id}`,
    clubId: club.id,
    clubName: club.name,
    city: club.city,
    country: club.country ?? club.region,
    leagueId: club.leagueId,
    startSeason: season,
    startRound: round,
    endSeason: null,
    endRound: null,
    endReason: null,
    matches: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    ...(contract ? { contract: { ...contract } } : {}),
    seasons: [],
  };
}

function migrateManagerCareerHistory(career: Career): ManagerCareerAppointment[] {
  const appointments: ManagerCareerAppointment[] = [];
  const legacySeasons = [...career.history].sort((first, second) => first.season - second.season);
  for (const result of legacySeasons) {
    const club = career.clubs.find((item) => item.name === result.club);
    if (!club) continue;
    let appointment = appointments.at(-1);
    if (!appointment || appointment.clubId !== club.id) {
      if (appointment && appointment.endSeason === null) {
        appointment.endSeason = Math.max(appointment.startSeason, result.season - 1);
        appointment.endReason = "Historical";
      }
      appointment = createManagerCareerAppointment(career.id, club, result.season, 1, appointments.length);
      appointments.push(appointment);
    }
    const league = leagueDefinition(club.leagueId);
    appointment.seasons.push({
      season: result.season,
      leagueId: club.leagueId,
      leagueName: league.name,
      position: result.position,
      clubCount: league.clubs,
      points: result.points,
      wins: result.wins,
      draws: 0,
      losses: 0,
      champion: result.position === 1,
      promoted: false,
      relegated: false,
      recordTracked: false,
    });
    appointment.wins += result.wins;
    appointment.endSeason = result.season;
    appointment.endReason = "Historical";
  }

  const lastAppointment = appointments.at(-1);
  if (career.unemployed) {
    const dismissedAppointment = lastAppointment?.clubId === career.clubId
      ? lastAppointment
      : createManagerCareerAppointment(career.id, getClub(career), career.season, career.round, appointments.length);
    if (dismissedAppointment !== lastAppointment) appointments.push(dismissedAppointment);
    dismissedAppointment.endSeason = career.season;
    dismissedAppointment.endRound = career.round;
    dismissedAppointment.endReason = "Dismissed";
  } else if (lastAppointment?.clubId === career.clubId) {
    lastAppointment.endSeason = null;
    lastAppointment.endRound = null;
    lastAppointment.endReason = null;
  } else {
    appointments.push(createManagerCareerAppointment(career.id, getClub(career), career.season, career.round, appointments.length));
  }
  return appointments;
}

function activeManagerCareerAppointment(career: Career) {
  return [...(career.managerCareerHistory ?? [])].reverse().find((appointment) => appointment.clubId === career.clubId && appointment.endSeason === null);
}

function recordManagerCareerMatch(career: Career, result: "win" | "draw" | "loss") {
  const appointment = activeManagerCareerAppointment(career);
  if (!appointment) return;
  appointment.matches += 1;
  if (result === "win") appointment.wins += 1;
  else if (result === "draw") appointment.draws += 1;
  else appointment.losses += 1;
}

function endManagerCareerAppointment(career: Career, reason: ManagerCareerAppointment["endReason"], round = career.round, season = career.season) {
  const appointment = activeManagerCareerAppointment(career);
  if (!appointment) return;
  appointment.endSeason = season;
  appointment.endRound = round;
  appointment.endReason = reason;
}

export function createCareer(manager: string, chosenClubId: string): Career {
  const difficulty = readGameSettings().difficulty;
  const openingFundsFactor = difficulty === "Relaxed" ? 1.25 : difficulty === "Challenging" ? 0.78 : 1;
  const boardTrustAdjustment = difficulty === "Relaxed" ? 10 : difficulty === "Challenging" ? -8 : 0;
  const internationalChoice = WORLD_CLUB_SEEDS.find((club) => club.short === chosenClubId);
  const careerSeeds = internationalChoice
    ? [...CLUB_SEEDS, ...WORLD_CLUB_SEEDS.filter((club) => club.country === internationalChoice.country)]
    : CLUB_SEEDS;
  const premierLeagueRank = new Map(careerSeeds.filter((club) => club.leagueId === "premier")
    .sort((first, second) => second.reputation - first.reputation || first.short.localeCompare(second.short))
    .map((club, index) => [club.short, index + 1]));
  const clubIds = careerSeeds.map((club) => club.short);
  const chosenIndex = Math.max(0, clubIds.indexOf(chosenClubId));
  const clubs: Club[] = careerSeeds.map((club, index) => {
    const league = leagueDefinition(club.leagueId);
    const economy = leagueEconomy(league.tier);
    const reputationScale = Math.max(0.72, Math.min(1.38, 0.58 + club.reputation / 125));
    const weeklyBudget = Math.round(economy.weeklyWageBudget * reputationScale / 10_000) * 10_000;
    const initialCapacity = club.capacity;
    const identity = STADIUM_IDENTITIES[index % STADIUM_IDENTITIES.length];
    const maximumDefaultTiers = initialCapacity < 8_000 ? 1 : initialCapacity < 25_000 ? 2 : initialCapacity < 45_000 ? 3 : 4;
    const standTiers = Object.fromEntries(Object.entries(identity.tiers).map(([side, tier]) => [side, Math.min(maximumDefaultTiers, tier)])) as StandTiers;
    const story = makeClubStory(club, index);
    const personnel = createClubPersonnel(club.short, club.name, staffStartIndexForClub(club.short));
    const stadiumName = index < STADIUM_IDENTITIES.length ? identity.name : `${club.city} ${["Park", "Ground", "Lane", "Stadium", "Field", "End"][index % 6]}`;
    const standDesigns = defaultStandDesigns(identity.architecture, club.short);
    const boxes = Math.max(2, Math.round(club.reputation / 5));
    return {
      id: club.short,
      name: club.name,
      shortName: club.short,
      city: club.city,
      leagueId: club.leagueId,
      region: club.region,
      foundedYear: story.foundingYear,
      nickname: story.nickname,
      bio: story.bio,
      rivals: nearbyRivals(club, careerSeeds),
      history: story.history,
      country: club.country ?? "England",
      colors: club.colors,
      reputation: club.reputation,
      targetPosition: Math.max(1, Math.min(league.clubs, Math.round(league.clubs * (club.reputation >= 70 ? 0.28 : club.reputation >= 50 ? 0.5 : 0.57)))),
      stadium: {
        name: stadiumName,
        capacity: initialCapacity,
        tiers: Math.max(...Object.values(standTiers)),
        standing: initialCapacity < 15000,
        roof: identity.roof,
        corners: Object.values(identity.corners).every(Boolean),
        seats: initialCapacity > 12000,
        boxes,
        floodlights: 2,
        pitchQuality: 3,
        drainage: 55,
        carPark: index < 5,
        superstore: index < 3,
        restaurant: index < 2,
        hotel: false,
        standTiers,
        standDesigns,
        standFacades: defaultStandFacades(standDesigns),
        standFrontages: defaultStandFrontages(),
        standSeatColors: defaultStandSeatColors(club.colors[0]),
        standNames: defaultStandNames(stadiumName),
        standRoofs: defaultStandRoofs(identity.roof),
        executiveBoxesBySide: defaultExecutiveBoxes(boxes),
        cornerStands: identity.corners,
        underfloorHeating: false,
        pitchSurface: "Natural grass",
        pitchCondition: 82,
        groundskeepingLevel: 1,
        carParkLevel: index < 5 ? 1 : 0,
        superstoreLevel: index < 3 ? 1 : 0,
        restaurantLevel: index < 2 ? 1 : 0,
        hotelLevel: 0,
        trainingCentreLevel: 0,
        trainingPitchesLevel: 0,
        academyCampusLevel: 0,
        youthStadiumLevel: 0,
        fanZoneLevel: 0,
        museumLevel: 0,
        transportHubLevel: 0,
        concourseLevel: 1,
        scoreboardLevel: 1,
        ledBoardsLevel: 0,
        securityLevel: 1,
        architecture: identity.architecture,
        siteSetting: getStadiumSiteSetting(club.short, club.city, club.region, club.country ?? "England"),
        acquiredLand: [],
        project: null,
      },
      balance: Math.max(350_000, Math.round(economy.openingBalance * reputationScale * openingFundsFactor)),
      transferBudget: Math.max(75_000, Math.round(economy.startingTransferBudget * reputationScale * openingFundsFactor)),
      wageBudget: weeklyBudget,
      debt: 0,
      boardTrust: Math.max(10, Math.min(95, 62 + Math.max(0, 5 - Math.abs(index - chosenIndex)) * 2 + boardTrustAdjustment)),
      supporterConfidence: 58 + Math.round((club.reputation - 52) / 5),
      dna: createClubDNA(club.short, club.name, club.reputation),
      sponsor: story.sponsor,
      sponsorAnnual: Math.round(club.reputation * 14000),
      sponsorOffer: null,
      badge: createClubBadge(club.short, club.colors, story.foundingYear),
      sponsorContracts: [{ id: `legacy-${club.short}`, company: story.sponsor, slot: "shirt", annual: Math.round(club.reputation * 14000), yearsRemaining: 2, signedSeason: 1 }],
      sponsorOffers: [],
      staff: personnel.staff,
      board: personnel.board,
      responsibilities: defaultClubResponsibilities(personnel.staff, personnel.board),
      tacticalFamiliarity: 55,
      aiTactics: createAIClubTactics(club.short, club.reputation),
      ownerWealth: club.leagueId === "premier"
        ? (premierLeagueRank.get(club.short) ?? 20) <= 6
          ? [18_000_000_000, 15_000_000_000, 12_000_000_000, 9_000_000_000, 7_000_000_000, 5_000_000_000][(premierLeagueRank.get(club.short) ?? 6) - 1]
          : 1_000_000_000 + (stableSeed(`${club.short}:owner`) % 2_500_000_000)
        : 0,
      academyLevel: club.reputation >= 70 ? 5 : club.reputation >= 55 ? 3 : 1,
      trainingLevel: club.reputation >= 70 ? 5 : club.reputation >= 55 ? 3 : 1,
      scoutLevel: club.reputation >= 70 ? 3 : 1,
    };
  });

  const players: Player[] = [];
  const rosterPositions: Position[] = ["GK", "GK", "DEF", "DEF", "DEF", "DEF", "DEF", "MID", "MID", "MID", "MID", "MID", "MID", "FWD", "FWD", "FWD", "FWD", "FWD"];
  for (const [clubIndex, club] of clubs.entries()) {
    const random = randomFrom(74821 + clubIndex * 41);
    const wageMultiplier = leagueEconomy(leagueDefinition(club.leagueId).tier).playerWageMultiplier;
    const leagueTier = leagueDefinition(club.leagueId).tier;
    const base = 50 + Math.round((club.reputation - 52) * 0.4) - Math.max(0, leagueTier - 4) * 2.6;
    const domesticShare = domesticNationalityShare(club.country ?? "England", leagueTier, club.reputation);
    rosterPositions.forEach((position, playerIndex) => {
      const player = createPlayer(`${club.id}-${String(playerIndex + 1).padStart(2, "0")}`, club.id, position, base, random, club.country ?? "England", domesticShare);
      player.wage = Math.round(player.wage * wageMultiplier / 50) * 50;
      players.push(player);
    });
    for (let index = 0; index < 2; index += 1) {
      const youth = createPlayer(`${club.id}-youth-${index + 1}`, club.id, (["DEF", "MID", "FWD", "GK"] as Position[])[(clubIndex + index) % 4], Math.max(24, base - 17), random, club.country ?? "England", 0.97);
      youth.age = 15 + index;
      youth.leadership = leadershipForPlayer(youth.id, youth.age, youth.personality);
      youth.overall = Math.max(24, 25 + Math.round(youth.age * 0.9) + Math.floor(random() * 7));
      youth.potential = Math.min(91, youth.overall + 23 + Math.floor(random() * 20));
      youth.wage = 0;
      youth.value = Math.max(0, youth.overall * 500);
      youth.contractYears = youth.age >= 16 ? 2 : 0;
      youth.squadLevel = squadLevelForAge(youth.age);
      refreshPlayerProfile(youth, 1);
      players.push(youth);
    }
  }
  // Every club starts with a real academy pathway. The manager's club gets a
  // deeper view of its intake, but AI clubs must have comparable age groups so
  // their line-ups do not become empty or artificially weak as seasons pass.
  for (const [academyClubIndex, academyTeam] of clubs.entries()) {
    const academyRandom = randomFrom(41573 + academyClubIndex * 29);
    const academyAges = Array.from({ length: 16 }, (_, index) => index + 5);
    const leagueTier = leagueDefinition(academyTeam.leagueId).tier;
    const academyQuality = Math.max(-3, Math.min(5, (academyTeam.academyLevel - 2) * 1.5 + (5 - leagueTier) * 0.25));
    academyAges.forEach((age, ageIndex) => {
      for (let intake = 0; intake < 3; intake += 1) {
        const playerIndex = ageIndex * 3 + intake;
        const position = (["GK", "DEF", "MID", "FWD"] as Position[])[(ageIndex + intake) % 4];
        const youth = createPlayer(`academy-${academyTeam.id}-${playerIndex + 1}`, academyTeam.id, position, 35 + Math.floor(age * 0.65) + Math.floor(academyRandom() * 5), academyRandom, academyTeam.country, 0.97);
        youth.age = age;
        youth.leadership = leadershipForPlayer(youth.id, youth.age, youth.personality);
        youth.overall = Math.max(18, Math.min(62, Math.round(12 + age * 1.55 + academyRandom() * 7 + academyQuality)));
        youth.potential = Math.min(91, youth.overall + 20 + Math.floor(academyRandom() * 18));
        youth.wage = 0;
        youth.value = 0;
        youth.contractYears = age >= 16 ? 2 : 0;
        youth.squadLevel = squadLevelForAge(age);
        youth.managerRapport = 55;
        refreshPlayerProfile(youth, 1);
        players.push(youth);
      }
    });
  }
  for (let index = 0; index < 16; index += 1) {
    const random = randomFrom(9200 + index * 97);
    const position = (["GK", "DEF", "MID", "FWD"] as Position[])[index % 4];
    const player = createPlayer(`free-${index + 1}`, `free-${index + 1}`, position, 52 + Math.floor(random() * 14), random);
    player.clubId = null;
    player.contractYears = 0;
    players.push(player);
  }
  const scoutPoolRandom = randomFrom(77241 + chosenIndex * 103);
  const scoutPoolClub = careerSeeds[chosenIndex]?.short ?? CLUB_SEEDS[0].short;
  const scoutPoolCountry = careerSeeds[chosenIndex]?.country ?? "England";
  for (let index = 0; index < 14; index += 1) {
    const age = index === 0 ? 5 : 5 + Math.floor(scoutPoolRandom() * 12);
    const position = (["GK", "DEF", "MID", "FWD"] as Position[])[index % 4];
    const prospect = createPlayer(`scout-${scoutPoolClub}-${index + 1}`, `scout-${scoutPoolClub}`, position, 34 + age * 0.7, scoutPoolRandom, scoutPoolCountry, 0.94);
    prospect.age = age;
    prospect.leadership = leadershipForPlayer(prospect.id, prospect.age, prospect.personality);
    prospect.overall = Math.max(16, Math.round(15 + age * 1.7 + scoutPoolRandom() * 8));
    prospect.potential = Math.min(91, prospect.overall + 24 + Math.floor(scoutPoolRandom() * 20));
    prospect.wage = 0;
    prospect.value = 0;
    prospect.contractYears = 0;
    prospect.clubId = null;
    prospect.squadLevel = squadLevelForAge(age);
    prospect.managerRapport = 50;
    refreshPlayerProfile(prospect, 1);
    players.push(prospect);
  }

  const club = clubs.find((item) => item.id === chosenClubId) ?? clubs[0];
  const selection = createStartingXI(players, club.id, "4-3-3");
  for (const team of clubs) {
    const seniorPlayers = players.filter((player) => player.clubId === team.id && player.age >= 16)
      .sort((a, b) => (b.leadership ?? 50) + b.age * 0.25 - ((a.leadership ?? 50) + a.age * 0.25) || a.id.localeCompare(b.id));
    team.captainId = seniorPlayers[0]?.id;
    team.viceCaptainId = seniorPlayers.find((player) => player.id !== team.captainId)?.id;
    team.dressingRoomTension = 8 + stableSeed(`${team.id}:dressing-room`) % 9;
  }
  const playerRelationships = clubs.flatMap((team) => createClubRelationships(players, team.id));
  const id = createCareerId();
  const managerReputation = 48;
  const initialManagerContract = createManagerContract(club, managerReputation, 1);
  const career: Career = {
    schemaVersion: 22,
    id,
    manager: manager.trim() || "Alex Morgan",
    clubId: club.id,
    season: 1,
    round: 1,
    calendarDate: "2026-07-01",
    managerLeave: null,
    clubs,
    players,
    playerRelationships,
    fixtures: generateCareerFixtures(1, clubs),
    internationalFixtures: generateInternationalFixtures(1),
    internationalArchive: [],
    formation: "4-3-3",
    mentality: "Balanced",
    style: club.dna?.tacticalIdentity ?? "Possession",
    lineup: selection,
    finance: [{ date: "01 Jul 2026", label: "Season opening balance", amount: club.balance }],
    news: [{ id: "welcome", date: "01 Jul", headline: `${club.name} unveil ${manager.trim() || "Alex Morgan"}`, body: "A new era starts at the ground. The board expects a competitive first season.", type: "club" }],
    awardHistory: [],
    history: [],
    managerHistory: [],
    managerCareerHistory: [createManagerCareerAppointment(id, club, 1, 1, 0, initialManagerContract)],
    managerContract: initialManagerContract,
    managerReputation,
    unemployed: false,
    lastReport: null,
    kit: { home: club.colors[0], away: "#f1f4ef", third: "#d5ad51", trim: club.colors[1] },
    pressure: 18,
    winlessRun: 0,
    tacticalFamiliarity: 55,
    pressingIntensity: 55,
    defensiveLine: 50,
    passingTempo: 50,
    attackingWidth: 50,
    matchMode: "Highlights",
    activeMatch: null,
    teamTalk: "Encouraging",
    kitDesignReady: false,
    kitPatterns: { home: "Engineered Grid", away: "Clean Block", third: "Pixel Fade" },
    kitCollectionSeason: 0,
    scoutingReports: [],
    inboxReadIds: [],
    pressConferenceResponses: {},
    incomingTransferOffers: [],
    staffChanges: {},
  };
  runSummerTransferWindow(career);
  career.setPiecePlan = getSetPiecePlan(career);
  return career;
}

function createStartingXI(players: Player[], clubId: string, formation: string, clubPlayers?: Player[]) {
  const selectionRating = (player: Player) => player.overall + getPlayerConditionModifier(player.condition ?? 100) + (player.morale - 60) * 0.025;
  const available = (clubPlayers ?? players.filter((player) => player.clubId === clubId)).filter((player) => player.age >= 16 && (player.injuryWeeksRemaining ?? 0) === 0 && (player.suspensionMatchesRemaining ?? 0) === 0).sort((a, b) => selectionRating(b) - selectionRating(a));
  const lineup: Player[] = [];
  for (const position of getFormationSlots(formation)) {
    const matchIndex = available.findIndex((player) => player.position === position);
    const chosen = available.splice(matchIndex >= 0 ? matchIndex : 0, 1)[0];
    if (chosen) lineup.push(chosen);
  }
  return lineup.map((player) => player.id);
}

export function getPlayerConditionModifier(condition: number) {
  const normalized = Math.max(0, Math.min(100, Number.isFinite(condition) ? condition : 100));
  return (normalized - 100) * 0.045;
}

export function squadLevelForAge(age: number): SquadLevel {
  if (age <= 8) return "Foundation";
  if (age <= 11) return "Academy";
  if (age <= 15) return "U16";
  if (age <= 17) return "U18";
  if (age <= 20) return "Reserves";
  return "First team";
}

function createClubRelationships(players: Player[], clubId: string): PlayerRelationship[] {
  const squad = players.filter((player) => player.clubId === clubId && player.age >= 16);
  if (squad.length < 4) return [];
  const links: PlayerRelationship[] = [];
  const add = (first: Player | undefined, second: Player | undefined, type: PlayerRelationship["type"], seed: string) => {
    if (!first || !second || first.id === second.id) return;
    links.push({ playerId: first.id, linkedPlayerId: second.id, type, strength: 48 + stableSeed(`${seed}:${first.id}:${second.id}`) % 49 });
  };
  const senior = [...squad].filter((player) => player.age >= 24).sort((a, b) => b.age - a.age || stableSeed(`${clubId}:${a.id}:mentor`) - stableSeed(`${clubId}:${b.id}:mentor`));
  const younger = [...squad].filter((player) => player.age <= 23).sort((a, b) => a.age - b.age || stableSeed(`${clubId}:${a.id}:mentee`) - stableSeed(`${clubId}:${b.id}:mentee`));
  add(senior[0] ?? [...squad].sort((a, b) => b.age - a.age)[0], younger.find((player) => player.id !== senior[0]?.id) ?? squad.find((player) => player.id !== senior[0]?.id), "Mentor", clubId);
  const shuffled = [...squad].sort((a, b) => stableSeed(`${clubId}:${a.id}:social`) - stableSeed(`${clubId}:${b.id}:social`));
  add(shuffled[0], shuffled[1], "Friend", clubId);
  add(shuffled[2], shuffled[3], "Rival", clubId);
  return links;
}

function refreshPlayerRelationships(career: Career) {
  const activePlayers = new Map(career.players.filter((player) => player.clubId).map((player) => [player.id, player.clubId]));
  const relationships = (career.playerRelationships ?? []).filter((link) => activePlayers.get(link.playerId) === activePlayers.get(link.linkedPlayerId) && activePlayers.has(link.playerId));
  const known = new Set(relationships.map((link) => `${link.playerId}:${link.linkedPlayerId}:${link.type}`));
  for (const club of career.clubs) {
    for (const link of createClubRelationships(career.players, club.id)) {
      const key = `${link.playerId}:${link.linkedPlayerId}:${link.type}`;
      if (!known.has(key)) {
        relationships.push(link);
        known.add(key);
      }
    }
  }
  career.playerRelationships = relationships;
}

function initialLeader(clubId: string, players: Player[], excludedId?: string) {
  return players.filter((player) => player.clubId === clubId && player.age >= 16 && player.id !== excludedId)
    .sort((a, b) => (b.leadership ?? 50) + b.age * 0.25 - ((a.leadership ?? 50) + a.age * 0.25) || a.id.localeCompare(b.id))[0];
}

export function normalizeCareer(career: Career): Career {
  let next = structuredClone(career);
  const existingClubIds = new Set(next.clubs.map((club) => club.id));
  const managedWorldCountry = WORLD_CLUB_SEEDS.find((seed) => seed.short === next.clubId)?.country
    ?? WORLD_LEAGUES.find((league) => next.clubs.some((club) => club.id === next.clubId && club.leagueId === league.id))?.country;
  const requiredSeedIds = [
    ...ENGLISH_CLUB_SEEDS.map((seed) => seed.short),
    ...WORLD_CLUB_SEEDS.filter((seed) => seed.country === managedWorldCountry).map((seed) => seed.short),
  ];
  const missingSeedIds = requiredSeedIds.filter((id) => !existingClubIds.has(id));
  if (missingSeedIds.length > 0) {
    const legacyClubIds = new Set(next.clubs.map((club) => club.id));
    const legacyPlayerIds = new Set(next.players.map((player) => player.id));
    const baseline = createCareer(next.manager, next.clubId);
    const migratedSeason = next.season + (next.round > 1 ? 1 : 0);
    const clubs = baseline.clubs.map((baseClub) => {
      const oldClub = next.clubs.find((club) => club.id === baseClub.id);
      if (!oldClub) return baseClub;
      const refreshWorldIdentity = Boolean(managedWorldCountry && baseClub.country === managedWorldCountry && baseClub.id !== next.clubId);
      return {
        ...baseClub,
        ...oldClub,
        ...(refreshWorldIdentity ? {
          name: baseClub.name,
          shortName: baseClub.shortName,
          city: baseClub.city,
          country: baseClub.country,
          colors: baseClub.colors,
          reputation: baseClub.reputation,
          targetPosition: baseClub.targetPosition,
          foundedYear: baseClub.foundedYear,
          nickname: baseClub.nickname,
          bio: baseClub.bio,
          rivals: baseClub.rivals,
          history: baseClub.history,
          badge: oldClub.badge ? { ...oldClub.badge, colors: baseClub.colors } : baseClub.badge,
        } : {}),
        leagueId: oldClub.leagueId ?? baseClub.leagueId,
        region: baseClub.region,
      };
    });
    const players = [
      ...baseline.players.filter((player) => !legacyClubIds.has(player.clubId ?? "") && !legacyPlayerIds.has(player.id)),
      ...next.players,
    ];
    next = {
      ...baseline,
      ...next,
      schemaVersion: 16,
      season: migratedSeason,
      round: 1,
      calendarDate: `${2026 + migratedSeason - 1}-07-01`,
      managerLeave: null,
      clubs,
      players,
      fixtures: generateCareerFixtures(migratedSeason, clubs),
      history: [...next.history],
      lastReport: null,
      news: [{ id: `structure-${migratedSeason}`, date: "01 Jul", headline: managedWorldCountry ? "The national pyramid expands" : "The English league pyramid expands", body: managedWorldCountry ? "A second national division adds promotion and relegation routes, more local rivals and full squads across both tiers. Your club and career history carry on into the new campaign." : "A full seven-division national and regional pyramid is now in place. The manager keeps their club, squad and finances as the new campaign begins.", type: "club" }, ...next.news],
    };
    refreshPlayerRelationships(next);
  }
  if ((next.schemaVersion ?? 1) < 2) {
    const oldDefaultXI = next.players.filter((player) => player.clubId === next.clubId && player.age >= 16).sort((a, b) => b.overall - a.overall).slice(0, 11).map((player) => player.id);
    if (next.lineup.length === oldDefaultXI.length && next.lineup.every((playerId, index) => playerId === oldDefaultXI[index])) {
      next.lineup = createStartingXI(next.players, next.clubId, next.formation);
    }
    next.schemaVersion = 2;
  }
  next.transferHistory ??= [];
  next.managerHistory ??= [];
  next.managerReputation ??= 48;
  if (!next.managerCareerHistory?.length) next.managerCareerHistory = migrateManagerCareerHistory(next);
  else if (!next.unemployed && !activeManagerCareerAppointment(next)) {
    next.managerCareerHistory.push(createManagerCareerAppointment(next.id, getClub(next), next.season, next.round, next.managerCareerHistory.length));
  }
  if (next.unemployed) next.managerContract = null;
  else if (!next.managerContract || next.managerContract.clubId !== next.clubId) next.managerContract = createManagerContract(getClub(next), next.managerReputation, next.season);
  const activeAppointment = activeManagerCareerAppointment(next);
  if (activeAppointment && next.managerContract) activeAppointment.contract ??= { ...next.managerContract };
  next.playerLoans ??= [];
  next.winterTransferSeasons ??= [];
  next.matchArchive ??= [];
  next.awardHistory ??= [];
  next.staffChanges ??= {};
  for (const club of next.clubs) {
    const seedIndex = CLUB_SEEDS.findIndex((item) => item.short === club.id);
    const seed = seedIndex >= 0 ? CLUB_SEEDS[seedIndex] : null;
    const story = seed ? makeClubStory(seed, seedIndex) : null;
    const feederParts = club.id.match(/^feeder-(n|s)-(\d+)-(\d+)$/);
    const feederSeason = feederParts ? Number(feederParts[2]) : next.season;
    const feederIndex = feederParts ? Number(feederParts[3]) - 1 : 0;
    const globalStaffStart = staffStartIndexForClub(club.id);
    const staffStart = seedIndex >= 0 || globalStaffStart > 0 ? globalStaffStart : BASE_CLUB_STAFF_COUNT + Math.max(0, feederSeason - 2) * 96 + (feederParts?.[1] === "s" ? 48 : 0) + feederIndex * 12;
    const personnel = createClubPersonnel(club.id, club.name, staffStart);
    club.staff ??= personnel.staff;
    club.board ??= personnel.board;
    for (const person of [...club.staff, ...club.board]) {
      person.clubId = club.id;
      person.clubName = club.name;
      const databasePerson = getWorldStaffById(person.id);
      if (databasePerson && databasePerson.clubId !== club.id && !Object.prototype.hasOwnProperty.call(next.staffChanges, person.id)) next.staffChanges[person.id] = club.id;
    }
    ensureClubResponsibilities(club);
    club.projectHistory ??= [];
    club.boardAgenda ??= [];
    const stadium = club.stadium;
    const baseTiers = Math.max(1, Math.min(4, stadium.tiers || 1));
    stadium.architecture ??= STADIUM_IDENTITIES[next.clubs.findIndex((item) => item.id === club.id)]?.architecture ?? "Civic colonnade";
    stadium.siteSetting ??= getStadiumSiteSetting(club.id, club.city, club.region, club.country ?? "England");
    stadium.acquiredLand = [...new Set((stadium.acquiredLand ?? []).filter((side): side is StadiumLandSide => STADIUM_LAND_SIDES.some((candidate) => candidate.id === side)))];
    stadium.standTiers ??= { north: baseTiers, east: baseTiers, south: baseTiers, west: baseTiers };
    stadium.standDesigns ??= defaultStandDesigns(stadium.architecture, club.id);
    stadium.standFacades ??= defaultStandFacades(stadium.standDesigns);
    stadium.standFrontages ??= defaultStandFrontages();
    stadium.standSeatColors ??= defaultStandSeatColors(club.colors[0]);
    stadium.standNames ??= defaultStandNames(stadium.name);
    stadium.standRoofs ??= defaultStandRoofs(stadium.roof);
    stadium.executiveBoxesBySide ??= defaultExecutiveBoxes(stadium.boxes);
    stadium.cornerStands ??= { northWest: Boolean(stadium.corners), northEast: Boolean(stadium.corners), southWest: Boolean(stadium.corners), southEast: Boolean(stadium.corners) };
    stadium.underfloorHeating ??= false;
    stadium.pitchSurface ??= "Natural grass";
    stadium.pitchCondition ??= 82;
    stadium.groundskeepingLevel ??= 1;
    stadium.carParkLevel ??= stadium.carPark ? 1 : 0;
    stadium.superstoreLevel ??= stadium.superstore ? 1 : 0;
    stadium.restaurantLevel ??= stadium.restaurant ? 1 : 0;
    stadium.hotelLevel ??= stadium.hotel ? 1 : 0;
    stadium.fanZoneLevel ??= 0;
    stadium.museumLevel ??= 0;
    stadium.transportHubLevel ??= 0;
    stadium.trainingCentreLevel ??= 0;
    stadium.trainingPitchesLevel ??= 0;
    stadium.academyCampusLevel ??= 0;
    stadium.youthStadiumLevel ??= 0;
    stadium.siteRoadLevel ??= 0;
    stadium.concourseLevel ??= 1;
    stadium.scoreboardLevel ??= 1;
    stadium.ledBoardsLevel ??= 0;
    stadium.securityLevel ??= 1;
    club.leagueId ??= seed?.leagueId ?? "regional-north";
    club.region ??= seed?.region ?? "England";
    club.tacticalFamiliarity ??= 55;
    club.aiTactics ??= createAIClubTactics(club.id, club.reputation);
    if (!AI_FORMATIONS.includes(club.aiTactics.formation)) club.aiTactics.formation = createAIClubTactics(club.id, club.reputation).formation;
    club.aiTactics.mentality ??= createAIClubTactics(club.id, club.reputation).mentality;
    club.aiTactics.style ??= club.dna?.tacticalIdentity ?? createClubDNA(club.id, club.name, club.reputation).tacticalIdentity;
    if (!FOOTBALL_STYLES.includes(club.aiTactics.style)) club.aiTactics.style = club.dna?.tacticalIdentity ?? createClubDNA(club.id, club.name, club.reputation).tacticalIdentity;
    club.aiTactics.winlessRun ??= 0;
    club.aiTactics.adaptationCooldown ??= 0;
    club.aiTactics.adaptations ??= 0;
    club.aiTactics.managerPressure ??= 18;
    club.ownerWealth ??= club.leagueId === "premier" ? 1_500_000_000 + stableSeed(`${club.id}:owner`) % 4_000_000_000 : 0;
    club.badge ??= createClubBadge(club.id, club.colors, club.foundedYear ?? 1900);
    const legacyBadgeIndex = next.clubs.findIndex((item) => item.id === club.id);
    const legacyBadgeEmblem = (["tower", "oak", "eagle", "anchor", "bridge", "star"] as const)[legacyBadgeIndex % 6];
    const legacyDefaultBadge = !club.badge.field && legacyBadgeIndex >= 0 && club.badge.shape === (legacyBadgeIndex % 2 ? "shield" : "roundel") && club.badge.emblem === legacyBadgeEmblem && club.badge.foundingYear === 1875 + (legacyBadgeIndex % 45) && club.badge.colors[0] === club.colors[0] && club.badge.colors[1] === club.colors[1];
    if (legacyDefaultBadge) club.badge = createClubBadge(club.id, club.colors, club.badge.foundingYear);
    else {
      club.badge.field ??= CLUB_BADGE_FIELDS[stableSeed(`${club.id}:club-identity:heraldry`) % CLUB_BADGE_FIELDS.length];
      club.badge.accent ??= BADGE_ACCENTS[stableSeed(`${club.id}:club-identity:accent`) % BADGE_ACCENTS.length];
    }
    club.sponsorContracts ??= [{ id: `legacy-${club.id}`, company: club.sponsor, slot: "shirt", annual: club.sponsorAnnual, yearsRemaining: 1, signedSeason: Math.max(1, next.season) }];
    club.sponsorOffers ??= [];
    if (club.sponsor === "Northline Group" && story) {
      club.sponsor = story.sponsor;
      club.sponsorContracts = club.sponsorContracts.map((contract) => contract.company === "Northline Group" ? { ...contract, company: story.sponsor } : contract);
    }
    club.foundedYear ??= story?.foundingYear ?? 1900;
    club.nickname ??= story?.nickname ?? "the Supporters";
    club.bio ??= story?.bio ?? `${club.name} represent ${club.city} and its surrounding communities in ${club.region}.`;
    club.rivals ??= seed ? nearbyRivals(seed) : [];
    club.history ??= story?.history ?? [{ year: club.foundedYear, title: "Club founded", detail: `${club.name} are formed in ${club.city}.` }];
    club.dna ??= createClubDNA(club.id, club.name, club.reputation);
    club.dna.styleAdaptation ??= { [club.dna.tacticalIdentity]: 100 };
    club.dna.styleAdaptation[club.dna.tacticalIdentity] = 100;
  }
  for (const player of next.players) {
    player.squadLevel ??= squadLevelForAge(player.age);
    player.attributeGrowth ??= {};
    player.attributeTrainingProgress ??= {};
    player.contractRole ??= defaultContractSquadRole(player);
    player.injury ??= null;
    player.injuryWeeksRemaining = Math.max(0, Math.floor(player.injuryWeeksRemaining ?? 0));
    player.yellowCardsThisSeason = Math.max(0, Math.floor(player.yellowCardsThisSeason ?? 0));
    player.suspensionMatchesRemaining = Math.max(0, Math.floor(player.suspensionMatchesRemaining ?? 0));
    player.condition = Math.max(0, Math.min(100, Number.isFinite(player.condition) ? player.condition! : 100));
    if (player.injuryWeeksRemaining === 0) player.injury = null;
    player.managerRapport ??= 58;
    player.nationality ??= "English";
    player.role ??= POSITION_ROLE_OPTIONS[player.position][0];
    if (!POSITION_ROLE_OPTIONS[player.position].includes(player.role as TacticalRole)) player.role = POSITION_ROLE_OPTIONS[player.position][0];
    player.roleFamiliarity = Math.max(0, Math.min(100, Number.isFinite(player.roleFamiliarity) ? player.roleFamiliarity! : 55));
    player.personality ??= personalityForPlayer(player.id);
    player.leadership ??= leadershipForPlayer(player.id, player.age, player.personality);
    addPlayerProfile(player, next.season);
  }
  for (const club of next.clubs) {
    const previousCaptain = club.captainId;
    const captainValid = next.players.some((player) => player.id === club.captainId && player.clubId === club.id && player.age >= 16);
    if (!captainValid) {
      if (previousCaptain) club.dressingRoomTension = Math.min(100, (club.dressingRoomTension ?? 12) + 8);
      club.captainId = initialLeader(club.id, next.players)?.id;
    }
    const viceValid = next.players.some((player) => player.id === club.viceCaptainId && player.clubId === club.id && player.age >= 16 && player.id !== club.captainId);
    if (!viceValid) club.viceCaptainId = initialLeader(club.id, next.players, club.captainId)?.id;
    club.dressingRoomTension ??= 12;
  }
  next.playerRelationships ??= next.clubs.flatMap((club) => createClubRelationships(next.players, club.id));
  next.managerPromises ??= [];
  next.pressure ??= 18;
  const openingYear = 2026 + next.season - 1;
  const previousRoundDate = next.fixtures.find((fixture) => fixture.round === next.round - 1)?.date;
  next.calendarDate ??= previousRoundDate ?? `${openingYear}-07-01`;
  next.internationalArchive ??= [];
  next.internationalFixtures ??= generateInternationalFixtures(next.season).filter((fixture) => fixture.date > getCalendarDate(next));
  next.managerLeave ??= null;
  next.pressPressure ??= 12;
  next.winlessRun ??= 0;
  next.tacticalFamiliarity ??= 55;
  next.pressingIntensity ??= 55;
  next.defensiveLine ??= 50;
  next.passingTempo ??= 50;
  next.attackingWidth ??= 50;
  next.matchMode ??= "Highlights";
  next.activeMatch ??= null;
  next.teamTalk ??= "Encouraging";
  next.kitDesignReady ??= false;
  next.kitPatterns ??= { home: "Engineered Grid", away: "Clean Block", third: "Pixel Fade" };
  const modernPattern: Partial<Record<KitPattern, KitPattern>> = { Stripes: "Engineered Grid", Hoops: "Topographic", Sash: "Diagonal Motion", Solid: "Clean Block", Halves: "Split Panel", Quarters: "Pixel Fade", Chevron: "Contour Lines", Pinstripes: "Micro Dot", Fade: "Shadow Gradient" };
  next.kitPatterns = {
    home: modernPattern[next.kitPatterns.home] ?? next.kitPatterns.home,
    away: modernPattern[next.kitPatterns.away] ?? next.kitPatterns.away,
    third: modernPattern[next.kitPatterns.third] ?? next.kitPatterns.third,
  };
  next.kitCollectionSeason ??= 0;
  next.schemaVersion = Math.max(next.schemaVersion ?? 1, 22);
  next.playerPositions ??= {};
  next.scoutingReports ??= [];
  next.scoutingAssignments ??= [];
  next.inboxReadIds ??= [];
  next.pressConferenceResponses ??= {};
  next.incomingTransferOffers ??= [];
  next.setPiecePlan = getSetPiecePlan(next);
  return next;
}

export function getCurrentLeague(career: Career) {
  return leagueDefinition(getClub(career).leagueId);
}

export function getSeasonWeekCount(career?: Pick<Career, "clubs">) {
  const activeWorldLeagues = career
    ? WORLD_LEAGUES.filter((league) => career.clubs.some((club) => club.leagueId === league.id)).map((league) => league.rounds)
    : [];
  return Math.max(...ENGLISH_LEAGUES.map((league) => league.rounds), ...activeWorldLeagues);
}

export function isSeasonComplete(career: Pick<Career, "round" | "clubs">) {
  return career.round > getSeasonWeekCount(career);
}

export function getTable(career: Career, leagueId = getClub(career).leagueId) {
  const rows = career.clubs.filter((club) => club.leagueId === leagueId).map((club) => ({ clubId: club.id, club: club.name, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 }));
  const rowById = new Map(rows.map((row) => [row.clubId, row]));
  for (const fixture of career.fixtures) {
    if (fixture.leagueId !== leagueId) continue;
    if (!fixture.played || fixture.homeGoals === null || fixture.awayGoals === null) continue;
    const home = rowById.get(fixture.homeClubId);
    const away = rowById.get(fixture.awayClubId);
    if (!home || !away) continue;
    home.played += 1;
    away.played += 1;
    home.goalsFor += fixture.homeGoals;
    home.goalsAgainst += fixture.awayGoals;
    away.goalsFor += fixture.awayGoals;
    away.goalsAgainst += fixture.homeGoals;
    if (fixture.homeGoals > fixture.awayGoals) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
    } else if (fixture.homeGoals < fixture.awayGoals) {
      away.wins += 1;
      away.points += 3;
      home.losses += 1;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  }
  return rows.sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor || a.club.localeCompare(b.club));
}

export function getTransferRumours(career: Career, leagueId = getClub(career).leagueId): TransferRumour[] {
  const table = getTable(career, leagueId);
  if (table.length < 2) return [];
  const tablePositions = new Map(table.map((row, index) => [row.clubId, index]));
  const transferredThisSeason = new Set((career.transferHistory ?? []).filter((transfer) => transfer.season === career.season).map((transfer) => transfer.playerId));
  const eligible = career.players.filter((player) => {
    const position = player.clubId ? tablePositions.get(player.clubId) : undefined;
    return player.age >= 18 && player.contractYears > 0 && player.contractYears <= 1 && position !== undefined
      && !transferredThisSeason.has(player.id);
  }).sort((first, second) => stableSeed(`${career.season}:${career.round}:media:${first.id}`) - stableSeed(`${career.season}:${career.round}:media:${second.id}`) || first.id.localeCompare(second.id));
  const outlets = [
    { name: "Touchline Wire", trust: 62 },
    { name: "Window Watch", trust: 76 },
    { name: "The Transfer Ledger", trust: 84 },
    { name: "Inside Football", trust: 49 },
    { name: "Continental Scout", trust: 68 },
  ];
  const selected: TransferRumour[] = [];
  for (const player of eligible) {
    if (selected.length >= 3) break;
    const sourcePosition = tablePositions.get(player.clubId!)!;
    const destinationRow = table[(sourcePosition + 1 + selected.length) % table.length];
    if (!destinationRow || destinationRow.clubId === player.clubId) continue;
    const seed = stableSeed(`${career.id}:${career.season}:${career.round}:${player.id}:transfer-rumour`);
    const outlet = outlets[seed % outlets.length];
    const reliability = Math.max(25, Math.min(92, outlet.trust + ((seed >>> 9) % 19) - 9));
    const sourceClub = career.clubs.find((club) => club.id === player.clubId);
    const destination = career.clubs.find((club) => club.id === destinationRow.clubId);
    if (!sourceClub || !destination) continue;
    selected.push({
      id: `rumour-s${career.season}-r${career.round}-${player.id}-${destination.id}`,
      date: dateLabel(career.calendarDate ?? "Today"),
      headline: `${player.name} linked with ${destination.name}`,
      body: `${outlet.name} report informal interest from ${destination.name}. Neither club has confirmed talks and no bid is recorded. This is unverified transfer speculation; use scouting before acting.`,
      type: "transfer",
      source: outlet.name,
      reliability,
      playerId: player.id,
      fromClubId: sourceClub.id,
      toClubId: destination.id,
    });
  }
  return selected;
}

export function getBoardPressureSignals(career: Career) {
  const club = getClub(career);
  const table = getTable(career);
  const row = table.find((entry) => entry.clubId === career.clubId)!;
  const position = table.findIndex((entry) => entry.clubId === career.clubId) + 1;
  const senior = career.players.filter((player) => player.clubId === career.clubId && player.age >= 16);
  const averageRapport = senior.reduce((sum, player) => sum + (player.managerRapport ?? 58), 0) / Math.max(1, senior.length);
  return {
    form: Math.min(5, (career.winlessRun ?? 0) * 0.45),
    press: Math.min(5, Math.max(0, ((career.pressPressure ?? 12) - 24) / 14)),
    supporters: Math.min(6, Math.max(0, (55 - club.supporterConfidence) / 7)),
    players: Math.min(6, Math.max(0, (45 - averageRapport) / 6)),
    dressingRoom: Math.min(6, Math.max(0, ((club.dressingRoomTension ?? 12) - 30) / 10)),
    board: Math.min(5, Math.max(0, (50 - club.boardTrust) / 8)),
    expectations: row.played ? Math.min(7, Math.max(0, position - club.targetPosition) * (0.4 + club.reputation / 115)) : 0,
    averageRapport: Math.round(averageRapport),
    position,
  };
}

export function getClubSackingPoint(club: Club) {
  if (Number.isFinite(club.managerSackingPoint)) return Math.max(35, Math.min(100, Math.round(club.managerSackingPoint!)));
  const clubCode = [...club.id].reduce((sum, letter) => sum + letter.charCodeAt(0), 0);
  const clubSpecificAdjustment = clubCode % 9 - 4;
  const highExpectationsPenalty = Math.round(Math.max(0, club.reputation - 52) * 0.28);
  return Math.max(66, Math.min(94, 88 - highExpectationsPenalty + clubSpecificAdjustment));
}

const privateBoardTolerance = getClubSackingPoint;

function updateAIManagerAfterResult(career: Career, club: Club, result: "win" | "draw" | "loss", season: number, round: number, date: string, squad: Player[]) {
  if (club.id === career.clubId) return;
  const tactics = club.aiTactics ?? (club.aiTactics = createAIClubTactics(club.id, club.reputation));
  updateDressingRoomAfterResult(career, club.id, result);
  for (const player of squad) {
    if (player.age < 16) continue;
    player.morale = Math.max(20, Math.min(100, player.morale + (result === "loss" ? -3 : 2)));
    player.managerRapport = Math.max(0, Math.min(100, (player.managerRapport ?? 58) + (result === "loss" ? -1 : 1)));
  }
  club.boardTrust = Math.max(0, Math.min(100, club.boardTrust + (result === "win" ? 2 : result === "draw" ? 0.5 : -2.5)));
  club.supporterConfidence = Math.max(0, Math.min(100, club.supporterConfidence + (result === "win" ? 2 : result === "draw" ? 0.5 : -3)));

  const table = getTable(career, club.leagueId);
  const position = table.findIndex((row) => row.clubId === club.id) + 1;
  const seniorSquad = squad.filter((player) => player.age >= 16);
  const averageRapport = seniorSquad.length
    ? seniorSquad.reduce((sum, player) => sum + (player.managerRapport ?? 58), 0) / seniorSquad.length
    : 58;
  const expectationPressure = round >= 6 && position > club.targetPosition
    ? Math.min(1.5, 0.18 * (position - club.targetPosition) * (0.65 + club.reputation / 140))
    : 0;
  const formPressure = result === "loss" ? 3.1 : result === "draw" ? 0.8 : -2.1;
  const losingRunPressure = Math.min(2.1, Math.max(0, tactics.winlessRun - 3) * 0.38);
  const boardPressure = Math.max(0, 55 - club.boardTrust) * 0.035;
  const supporterPressure = Math.max(0, 52 - club.supporterConfidence) * 0.025;
  const playerPressure = Math.max(0, 45 - averageRapport) * 0.02;
  const dressingRoomPressure = Math.max(0, (club.dressingRoomTension ?? 0) - 35) * 0.018;
  tactics.managerPressure = Math.max(0, Math.min(100, tactics.managerPressure + formPressure + losingRunPressure + expectationPressure + boardPressure + supporterPressure + playerPressure + dressingRoomPressure));

  if (tactics.managerPressure < privateBoardTolerance(club)) return;
  const outgoing = club.staff?.find((person) => person.role === "First-Team Manager");
  if (!outgoing) return;
  const candidates = searchWorldStaff("", "First-Team Manager", "Available", 0, 256, career.staffChanges ?? {}).people;
  const focus = ({
    "Development coach": "player development",
    "Tactical innovator": "tactical identity",
    "Man-manager": "squad leadership",
    "Proven winner": "tactical identity",
  } as const)[club.dna?.preferredManager ?? "Man-manager"];
  const shortlist = candidates
    .filter((candidate) => candidate.id !== outgoing.id)
    .sort((first, second) => {
      const score = (person: StaffMember) => person.ability * 0.72 + Math.min(30, person.experience) * 0.38 + (person.focus.toLowerCase().includes(focus) ? 7 : 0);
      return score(second) - score(first) || first.id.localeCompare(second.id);
    })
    .slice(0, 12);
  if (!shortlist.length) {
    tactics.managerPressure = Math.max(0, privateBoardTolerance(club) - 1);
    return;
  }
  const replacement = shortlist[stableSeed(`${club.id}:${season}:${round}:manager-successor`) % shortlist.length];
  const reasons: string[] = [];
  if (tactics.winlessRun >= 6) reasons.push(`${tactics.winlessRun} matches without a win`);
  if (round >= 6 && position > club.targetPosition) reasons.push(`the club sit below their top ${club.targetPosition} target`);
  if (club.supporterConfidence < 35) reasons.push(`supporter confidence has fallen to ${club.supporterConfidence}%`);
  if (averageRapport < 35) reasons.push(`senior-player rapport has fallen to ${Math.round(averageRapport)}%`);
  if (club.boardTrust < 35) reasons.push(`board confidence has fallen to ${club.boardTrust}%`);
  const reason = reasons.length ? reasons.join(", ") : "results and club expectations have pushed board pressure beyond its private limit";
  const entry: AIManagerChange = {
    id: `ai-manager-change-${season}-${round}-${club.id}`,
    clubId: club.id,
    clubName: club.name,
    outgoingManagerId: outgoing.id,
    outgoingManagerName: outgoing.name,
    incomingManagerId: replacement.id,
    incomingManagerName: replacement.name,
    season,
    round,
    reason,
  };
  club.staff = (club.staff ?? []).filter((person) => person.id !== outgoing.id);
  club.staff.push({ ...replacement, clubId: club.id, clubName: club.name });
  career.staffChanges ??= {};
  career.staffChanges[outgoing.id] = null;
  career.staffChanges[replacement.id] = club.id;
  career.managerHistory ??= [];
  career.managerHistory.unshift(entry);
  tactics.managerPressure = 22;
  tactics.winlessRun = 0;
  tactics.adaptationCooldown = 2;
  tactics.formation = createAIClubTactics(club.id, club.reputation).formation;
  tactics.mentality = club.reputation >= 72 ? "Attacking" : club.reputation <= 38 ? "Cautious" : "Balanced";
  tactics.style = club.dna?.tacticalIdentity ?? tactics.style;
  club.tacticalFamiliarity = Math.max(36, (club.tacticalFamiliarity ?? 55) - 10);
  ensureClubResponsibilities(club);
  career.news.unshift({
    id: entry.id,
    date: dateLabel(date),
    headline: `${replacement.name} appointed at ${club.name}`,
    body: `${outgoing.name} leaves the club. The board moves for ${replacement.name} after ${reason}; the new manager brings ${replacement.focus.toLowerCase()} and ${replacement.experience} years in football.`,
    type: "club",
  });
  career.news = career.news.slice(0, 28);
}

export function getClub(career: Career, clubId = career.clubId) {
  return career.clubs.find((club) => club.id === clubId)!;
}

export function getClubArchive(career: Career, clubId = career.clubId) {
  const club = getClub(career, clubId);
  const totals = career.players.flatMap((player) => {
    const records = (player.clubHistory ?? []).filter((record) => record.clubId === club.id);
    if (!records.length) return [];
    return [{
      playerId: player.id,
      playerName: player.name,
      appearances: records.reduce((sum, record) => sum + record.appearances, 0),
      goals: records.reduce((sum, record) => sum + record.goals, 0),
      assists: records.reduce((sum, record) => sum + record.assists, 0),
      cleanSheets: records.reduce((sum, record) => sum + record.cleanSheets, 0),
    }];
  });
  const rank = (metric: keyof Omit<ClubArchiveLeader, "playerId" | "playerName">) => totals
    .filter((leader) => leader[metric] > 0)
    .sort((first, second) => second[metric] - first[metric] || first.playerName.localeCompare(second.playerName) || first.playerId.localeCompare(second.playerId))
    .slice(0, 8);
  const seasons = career.history
    .filter((record) => record.clubId === club.id || (record.clubId === undefined && record.club === club.name))
    .sort((first, second) => second.season - first.season);
  const transfers = (career.transferHistory ?? [])
    .filter((record) => record.fromClubId === club.id || record.toClubId === club.id)
    .sort((first, second) => second.season - first.season || second.fee - first.fee || first.playerName.localeCompare(second.playerName));
  const incoming = transfers.filter((record) => record.toClubId === club.id).sort((first, second) => second.fee - first.fee || second.season - first.season || first.playerName.localeCompare(second.playerName));
  const outgoing = transfers.filter((record) => record.fromClubId === club.id).sort((first, second) => second.fee - first.fee || second.season - first.season || first.playerName.localeCompare(second.playerName));
  return {
    club,
    trackedAppearances: totals.reduce((sum, leader) => sum + leader.appearances, 0),
    trackedGoals: totals.reduce((sum, leader) => sum + leader.goals, 0),
    leagueTitlesLogged: seasons.filter((record) => record.position === 1).length,
    appearanceLeaders: rank("appearances"),
    goalLeaders: rank("goals"),
    assistLeaders: rank("assists"),
    cleanSheetLeaders: rank("cleanSheets"),
    seasons,
    honours: (career.awardHistory ?? []).filter((award) => award.clubId === club.id).sort((first, second) => second.season - first.season || first.award.localeCompare(second.award)),
    transfers,
    recordSigning: incoming.find((record) => record.fee > 0) ?? null,
    recordSale: outgoing.find((record) => record.fee > 0) ?? null,
    moments: [...(club.history ?? [])].sort((first, second) => first.year - second.year || first.title.localeCompare(second.title)),
  };
}

export function getClubDNAStatus(career: Career) {
  const club = getClub(career);
  const dna = club.dna ?? createClubDNA(club.id, club.name, club.reputation);
  const styleFit = dnaStyleFit(dna, career.style);
  return {
    dna,
    activeStyle: FOOTBALL_STYLES.includes(career.style as FootballStyle) ? career.style as FootballStyle : dna.tacticalIdentity,
    styleFit,
    supporterStyleFit: supporterStyleAffinity(dna, career.style),
    adapting: career.style !== dna.tacticalIdentity,
    remainingFit: Math.max(0, 100 - styleFit),
  };
}

export function getUserPlayers(career: Career) {
  return career.players.filter((player) => player.clubId === career.clubId && player.age >= 16).sort((a, b) => {
    const positionOrder: Position[] = ["GK", "DEF", "MID", "FWD"];
    return positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position) || b.overall - a.overall;
  });
}

export function getLeadershipDynamics(career: Career, clubId = career.clubId, playersByClub?: Map<string, Player[]>) {
  const club = getClub(career, clubId);
  const squad = (playersByClub?.get(clubId) ?? career.players.filter((player) => player.clubId === clubId)).filter((player) => player.age >= 16);
  const captain = squad.find((player) => player.id === club.captainId) ?? null;
  const viceCaptain = squad.find((player) => player.id === club.viceCaptainId) ?? null;
  const selected = clubId === career.clubId && career.lineup.length
    ? career.lineup.filter((id) => squad.some((player) => player.id === id))
    : [...squad].sort((a, b) => b.overall - a.overall).slice(0, 11).map((player) => player.id);
  const selectedIds = new Set(selected);
  const connections = (career.playerRelationships ?? []).filter((link) => link.playerId !== link.linkedPlayerId && selectedIds.has(link.playerId) && selectedIds.has(link.linkedPlayerId));
  const relationshipImpact = connections.reduce((sum, link) => sum + (link.type === "Mentor" ? 0.16 : link.type === "Friend" ? 0.19 : -0.2) * (link.strength / 100), 0);
  const leaderImpact = (player: Player | null, multiplier: number) => {
    if (!player) return 0;
    const selectedFactor = selectedIds.has(player.id) ? 1 : 0.32;
    const traitBonus = player.personality === "Natural leader" ? 0.28 : player.personality === "Professional" || player.personality === "Team-first" ? 0.1 : 0;
    return (((player.leadership ?? 50) - 50) * 0.014 + traitBonus) * multiplier * selectedFactor;
  };
  const tension = Math.max(0, Math.min(100, club.dressingRoomTension ?? 12));
  const matchImpact = Math.max(-2.4, Math.min(1.8, leaderImpact(captain, 1) + leaderImpact(viceCaptain, 0.45) + relationshipImpact - tension * 0.015));
  return { captain, viceCaptain, tension, connections, matchImpact, squadSize: squad.length };
}

function leadershipAppointmentTension(previous: Player | null, next: Player, current: number) {
  const change = previous ? ((previous.leadership ?? 50) - (next.leadership ?? 50)) * 0.08 : 0;
  const personalityAdjustment = next.personality === "Natural leader" ? -4 : next.personality === "Professional" || next.personality === "Team-first" ? -2 : next.personality === "Fiery" ? 3 : 0;
  return Math.max(0, Math.min(100, Math.round(current + change + personalityAdjustment)));
}

export function appointClubCaptain(career: Career, playerId: string) {
  const next = structuredClone(career);
  const club = getClub(next);
  const player = next.players.find((item) => item.id === playerId && item.clubId === club.id && item.age >= 16);
  if (!player || player.id === club.captainId) return career;
  const previous = next.players.find((item) => item.id === club.captainId) ?? null;
  const oldCaptainId = club.captainId;
  club.captainId = player.id;
  club.viceCaptainId = oldCaptainId && oldCaptainId !== player.id ? oldCaptainId : next.players.find((item) => item.id === club.viceCaptainId && item.clubId === club.id && item.id !== player.id)?.id;
  club.dressingRoomTension = leadershipAppointmentTension(previous, player, club.dressingRoomTension ?? 12);
  next.news.unshift({ id: `captain-${next.season}-${next.round}-${player.id}`, date: "Today", headline: `${player.name} takes the captain's armband`, body: `${club.name} confirm a change in the dressing-room leadership group.`, type: "club" });
  return next;
}

export function appointViceCaptain(career: Career, playerId: string) {
  const next = structuredClone(career);
  const club = getClub(next);
  const player = next.players.find((item) => item.id === playerId && item.clubId === club.id && item.age >= 16 && item.id !== club.captainId);
  if (!player || player.id === club.viceCaptainId) return career;
  const previous = next.players.find((item) => item.id === club.viceCaptainId) ?? null;
  club.viceCaptainId = player.id;
  club.dressingRoomTension = leadershipAppointmentTension(previous, player, club.dressingRoomTension ?? 12);
  next.news.unshift({ id: `vice-captain-${next.season}-${next.round}-${player.id}`, date: "Today", headline: `${player.name} named vice-captain`, body: `${club.name} strengthen the leadership group ahead of the next fixture.`, type: "club" });
  return next;
}

export function makeManagerPromise(career: Career, kind: ManagerPromiseKind, playerId?: string) {
  const activePromises = (career.managerPromises ?? []).filter((promise) => promise.status === "Active");
  if (activePromises.length >= 3 || activePromises.some((promise) => promise.kind === kind)) return career;
  const rounds = getCurrentLeague(career).rounds;
  if (!getNextFixture(career) || career.round > rounds) return career;
  const player = kind === "Regular starts" ? career.players.find((item) => item.id === playerId && item.clubId === career.clubId && item.age >= 16) : null;
  if (kind === "Regular starts" && (!player || career.round > rounds - 7)) return career;
  if (kind === "Winning run" && career.round > rounds - 1) return career;
  const audience: ManagerPromise["audience"] = kind === "League target" ? "Board" : kind === "Regular starts" ? "Player" : "Supporters";
  const target = kind === "League target" ? getClub(career).targetPosition : kind === "Regular starts" ? 8 : 2;
  const promise: ManagerPromise = {
    id: `${career.id}-promise-${career.season}-${career.round}-${(career.managerPromises ?? []).length + 1}`,
    kind,
    audience,
    season: career.season,
    createdRound: career.round,
    deadlineRound: kind === "Winning run" ? Math.min(rounds, career.round + 4) : rounds,
    target,
    progress: 0,
    ...(player ? { playerId: player.id } : {}),
    status: "Active",
  };
  const next = structuredClone(career);
  next.managerPromises ??= [];
  next.managerPromises.unshift(promise);
  const detail = kind === "League target" ? `The board have been told ${getClub(career).name} will finish in the top ${target}.` : kind === "Regular starts" ? `${player!.name} has been promised at least ${target} first-team starts this season.` : `Supporters have been promised two consecutive wins before round ${promise.deadlineRound}.`;
  next.news.unshift({ id: promise.id, date: "Today", headline: `${career.manager} makes a promise to ${audience.toLowerCase()}`, body: detail, type: "club" });
  return next;
}

function resolveManagerPromise(career: Career, promise: ManagerPromise, kept: boolean) {
  promise.status = kept ? "Kept" : "Broken";
  promise.resolvedRound = career.round;
  const club = getClub(career);
  const player = promise.playerId ? career.players.find((item) => item.id === promise.playerId) : null;
  if (promise.audience === "Board") club.boardTrust = Math.max(0, Math.min(100, club.boardTrust + (kept ? 4 : -8)));
  if (promise.audience === "Supporters") club.supporterConfidence = Math.max(0, Math.min(100, club.supporterConfidence + (kept ? 5 : -7)));
  if (promise.audience === "Player" && player) {
    player.managerRapport = Math.max(0, Math.min(100, (player.managerRapport ?? 58) + (kept ? 7 : -10)));
    player.morale = Math.max(0, Math.min(100, player.morale + (kept ? 4 : -8)));
  }
  if (!kept) career.pressure = Math.min(100, (career.pressure ?? 18) + 4);
  const headline = kept ? `${career.manager} keeps a promise to ${promise.audience.toLowerCase()}` : `${career.manager} falls short on a promise to ${promise.audience.toLowerCase()}`;
  career.news.unshift({ id: `${promise.id}-${promise.status.toLowerCase()}`, date: "Today", headline, body: kept ? "The commitment is fulfilled. Trust in the manager rises." : "The commitment is missed. Confidence falls and questions follow.", type: kept ? "club" : "press" });
}

function updateManagerPromisesAfterMatch(career: Career, outcome: "win" | "draw" | "loss", startingPlayers: Player[]) {
  const startingIds = new Set(startingPlayers.map((player) => player.id));
  for (const promise of career.managerPromises ?? []) {
    if (promise.status !== "Active" || promise.season !== career.season) continue;
    if (promise.kind === "Regular starts" && startingIds.has(promise.playerId ?? "")) promise.progress += 1;
    if (promise.kind === "Winning run") promise.progress = outcome === "win" ? promise.progress + 1 : 0;
    if (promise.kind !== "League target" && promise.progress >= promise.target) resolveManagerPromise(career, promise, true);
    else if (promise.kind !== "League target" && career.round >= promise.deadlineRound) resolveManagerPromise(career, promise, false);
  }
}

function settleSeasonPromises(career: Career, finishedSeason: number, finalPosition: number) {
  for (const promise of career.managerPromises ?? []) {
    if (promise.status !== "Active" || promise.season !== finishedSeason) continue;
    const kept = promise.kind === "League target" ? finalPosition <= promise.target : promise.progress >= promise.target;
    resolveManagerPromise(career, promise, kept);
  }
}

export function getNextFixture(career: Career) {
  return career.fixtures.find((fixture) => fixture.round === career.round && (fixture.homeClubId === career.clubId || fixture.awayClubId === career.clubId)) ?? null;
}

export function addCalendarDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function advanceCareerDays(career: Career, days = 1) {
  if (career.unemployed || (career.activeMatch && career.activeMatch.minute < 90)) return career;
  const count = Math.max(0, Math.min(365, Math.floor(days)));
  if (count === 0) return career;
  const next = structuredClone(career);
  const previousDate = getCalendarDate(career);
  next.calendarDate = addCalendarDays(previousDate, count);
  addScoutingCompletionNews(next, previousDate, next.calendarDate);
  return next;
}

export type DailyAdvanceResult = { career: Career; event: "day" | "matchday" | "international" | "scouting" | "inbox" | "unavailable"; advancedDays: number; message: string };

function nextInternationalFixtureDate(career: Career, afterDate: string) {
  return (career.internationalFixtures ?? []).filter((fixture) => !fixture.played && fixture.date > afterDate).map((fixture) => fixture.date).sort()[0];
}

/** Advances one in-game day. Reaching a fixture date pauses on the tactics screen instead of simulating the match. */
export function advanceCareerCalendarDay(career: Career): DailyAdvanceResult {
  if (career.unemployed) return { career, event: "unavailable", advancedDays: 0, message: "Apply for a new club before advancing your career." };
  if (career.activeMatch && career.activeMatch.minute < 90) return { career, event: "unavailable", advancedDays: 0, message: "Finish the live match before advancing the calendar." };
  if (isSeasonComplete(career)) return { career, event: "unavailable", advancedDays: 0, message: "The season is complete. Start pre-season to continue." };
  const currentDate = getCalendarDate(career);
  const unresolvedBid = (career.incomingTransferOffers ?? []).find((offer) => offer.status === "Pending" && offer.expiresDate >= currentDate);
  if (unresolvedBid) {
    return { career, event: "inbox", advancedDays: 0, message: "A club has made a formal bid. Resolve the urgent transfer message before the calendar or matchday can continue." };
  }
  const scheduled = career.fixtures.filter((item) => item.round === career.round && !item.played);
  const fixture = scheduled.find((item) => item.homeClubId === career.clubId || item.awayClubId === career.clubId);
  const eventDate = scheduled[0]?.date;
  if (!eventDate) return { career, event: "unavailable", advancedDays: 0, message: "There are no fixtures scheduled for this world week." };
  const todaysInternationalFixtures = (career.internationalFixtures ?? []).some((item) => !item.played && item.date <= currentDate);
  if (todaysInternationalFixtures) {
    const next = simulateInternationalWindow(career, (career.internationalFixtures ?? []).filter((item) => !item.played && item.date <= currentDate).map((item) => item.date).sort()[0]);
    return { career: next, event: "international", advancedDays: 0, message: "International friendlies have finished. Call-ups, appearances and results are saved in the international centre." };
  }
  if (fixture && currentDate >= fixture.date) return { career, event: "matchday", advancedDays: 0, message: "It is matchday. Set your team and match plan." };
  if (!fixture && currentDate >= eventDate) {
    const next = playMatchday(career, undefined);
    return { career: next, event: "day", advancedDays: 0, message: "The other leagues have completed their fixtures for this world week." };
  }
  const nextDate = addCalendarDays(currentDate, 1);
  const nextInternationalDate = nextInternationalFixtureDate(career, currentDate);
  if (nextInternationalDate && nextInternationalDate <= nextDate && nextInternationalDate <= eventDate) {
    const next = simulateInternationalWindow({ ...career, calendarDate: nextInternationalDate }, nextInternationalDate);
    addScoutingCompletionNews(next, currentDate, nextInternationalDate);
    const days = Math.max(1, Math.round((new Date(`${nextInternationalDate}T12:00:00Z`).getTime() - new Date(`${currentDate}T12:00:00Z`).getTime()) / 86_400_000));
    return { career: next, event: "international", advancedDays: days, message: "International friendlies have finished. Call-ups, appearances and results are saved in the international centre." };
  }
  if (!fixture && nextDate >= eventDate) {
    const next = playMatchday({ ...career, calendarDate: eventDate });
    addScoutingCompletionNews(next, currentDate, eventDate);
    return { career: next, event: "day", advancedDays: Math.max(1, Math.round((new Date(`${eventDate}T12:00:00Z`).getTime() - new Date(`${currentDate}T12:00:00Z`).getTime()) / 86_400_000)), message: "The other leagues have completed their fixtures for this world week." };
  }
  const next = structuredClone(career);
  next.calendarDate = nextDate;
  addScoutingCompletionNews(next, currentDate, nextDate);
  const event = fixture && nextDate === fixture.date ? "matchday" : (next.scoutingReports ?? []).some((report) => report.availableDate === nextDate && (report.managerId === career.id || report.clubId === career.clubId)) ? "scouting" : "day";
  return { career: next, event, advancedDays: 1, message: event === "matchday" ? "It is matchday. Set your team and match plan." : event === "scouting" ? "Your five-day scouting assessment is complete. Ratings are now available." : "The club day has advanced." };
}

export function getCalendarDate(career: Career) {
  if (career.calendarDate) return career.calendarDate;
  const previous = career.fixtures.find((fixture) => fixture.round === career.round - 1)?.date;
  return previous ?? `${2026 + career.season - 1}-07-01`;
}

export function requestManagerLeave(career: Career, days: number) {
  if (![3, 7, 14].includes(days)) return { career, approved: false, message: "Choose a three, seven or fourteen day request." };
  if (career.unemployed || isSeasonComplete(career) || career.activeMatch) return { career, approved: false, message: "The board cannot approve leave during this management situation." };
  if (career.managerLeave?.status === "active") return { career, approved: false, message: "You are already on approved leave." };
  const club = getClub(career);
  const pressure = career.pressure ?? 18;
  const boardTrust = club.boardTrust;
  const minimumTrust = days === 14 ? 55 : days === 7 ? 40 : 25;
  const maximumPressure = days === 14 ? 48 : days === 7 ? 60 : 78;
  const approved = boardTrust >= minimumTrust && pressure < maximumPressure;
  if (!approved) {
    const reason = boardTrust < minimumTrust ? "The board wants to see stronger confidence before approving time away." : "The board needs you available while results and club pressure are high.";
    const next = structuredClone(career);
    next.news.unshift({ id: `leave-refused-s${career.season}-r${career.round}`, date: "Today", headline: "The board declines the holiday request", body: reason, type: "club" });
    return { career: next, approved: false, message: reason };
  }
  const startDate = addCalendarDays(getCalendarDate(career), 1);
  const endDate = addCalendarDays(getCalendarDate(career), days);
  const next = structuredClone(career);
  const message = `The board approves ${days} days away. Your assistant will handle selection and matchday decisions; urgent club news can bring you back early.`;
  next.managerLeave = { startDate, endDate, days, status: "active", message };
  next.news.unshift({ id: `leave-approved-s${career.season}-r${career.round}`, date: "Today", headline: `${career.manager} takes ${days} days away`, body: message, type: "club" });
  return { career: next, approved: true, message };
}

export function endManagerLeaveEarly(career: Career) {
  const leave = career.managerLeave;
  if (!leave || leave.status !== "active") return career;
  const next = structuredClone(career);
  const message = "You have returned from leave and resumed matchday responsibilities.";
  next.managerLeave = { ...leave, status: "completed", message };
  next.news.unshift({ id: `leave-return-s${career.season}-r${career.round}`, date: "Today", headline: `${career.manager} returns to the club`, body: message, type: "club" });
  return next;
}

export type CalendarAdvanceResult = { career: Career; advancedDays: number; event: "matchday" | "international" | "holiday-return" | "scouting" | "unavailable"; urgentNews: NewsItem[]; message: string };

export function advanceToNextCalendarEvent(career: Career, seed?: number): CalendarAdvanceResult {
  if (career.unemployed) return { career, advancedDays: 0, event: "unavailable", urgentNews: [], message: "Apply for a new club before advancing your career." };
  if (career.activeMatch?.minute !== undefined && career.activeMatch.minute < 90) {
    return { career, advancedDays: 0, event: "unavailable", urgentNews: [], message: "Finish the live match before advancing the calendar." };
  }
  const scheduledWeek = career.fixtures.filter((fixture) => fixture.round === career.round && !fixture.played);
  const eventDate = scheduledWeek[0]?.date;
  if (!eventDate) return { career, advancedDays: 0, event: "unavailable", urgentNews: [], message: "There are no further fixtures in this calendar week." };
  const currentDate = getCalendarDate(career);
  const internationalDate = nextInternationalFixtureDate(career, currentDate);
  const nextMajorDate = internationalDate && internationalDate < eventDate ? internationalDate : eventDate;
  const nextScoutingDate = (career.scoutingReports ?? [])
    .filter((report) => report.availableDate && report.availableDate > currentDate && report.availableDate < nextMajorDate && (report.managerId === career.id || report.clubId === career.clubId))
    .map((report) => report.availableDate!)
    .sort()[0];
  if (nextScoutingDate) {
    const next = structuredClone(career);
    next.calendarDate = nextScoutingDate;
    addScoutingCompletionNews(next, currentDate, nextScoutingDate);
    const days = Math.max(0, Math.round((new Date(`${nextScoutingDate}T12:00:00Z`).getTime() - new Date(`${currentDate}T12:00:00Z`).getTime()) / 86_400_000));
    return { career: next, advancedDays: days, event: "scouting", urgentNews: [], message: "The five-day scouting assessment is complete. Ratings are now available in the club file." };
  }
  if (career.managerLeave?.status === "active" && nextMajorDate > career.managerLeave.endDate) {
    const next = structuredClone(career);
    const days = Math.max(0, Math.round((new Date(`${career.managerLeave.endDate}T12:00:00Z`).getTime() - new Date(`${currentDate}T12:00:00Z`).getTime()) / 86_400_000));
    next.calendarDate = career.managerLeave.endDate;
    next.managerLeave = { ...career.managerLeave, status: "completed", message: "Your approved leave has ended. You are back in charge." };
    addScoutingCompletionNews(next, currentDate, next.calendarDate);
    return { career: next, advancedDays: days, event: "holiday-return", urgentNews: [], message: next.managerLeave.message };
  }
  if (internationalDate && internationalDate < eventDate) {
    const next = simulateInternationalWindow({ ...career, calendarDate: internationalDate }, internationalDate);
    addScoutingCompletionNews(next, currentDate, internationalDate);
    const days = Math.max(0, Math.round((new Date(`${internationalDate}T12:00:00Z`).getTime() - new Date(`${currentDate}T12:00:00Z`).getTime()) / 86_400_000));
    return { career: next, advancedDays: days, event: "international", urgentNews: [], message: "International friendlies have finished. Call-ups, appearances and results are saved in the international centre." };
  }
  const beforeIds = new Set(career.news.map((item) => item.id));
  const days = Math.max(0, Math.round((new Date(`${eventDate}T12:00:00Z`).getTime() - new Date(`${currentDate}T12:00:00Z`).getTime()) / 86_400_000));
  const next = playMatchday({ ...career, calendarDate: eventDate }, seed);
  addScoutingCompletionNews(next, currentDate, eventDate);
  const urgentNews = next.news.filter((item) => item.urgent && !beforeIds.has(item.id));
  if (next.managerLeave?.status === "active") {
    if (urgentNews.length) {
      next.managerLeave = { ...next.managerLeave, status: "interrupted", message: "Your leave has been interrupted by urgent club news. You are back in charge." };
    } else if (eventDate >= next.managerLeave.endDate) {
      next.managerLeave = { ...next.managerLeave, status: "completed", message: "Your approved leave has ended. You are back in charge." };
    }
  }
  const message = urgentNews.length ? urgentNews[0].headline : next.managerLeave?.status === "completed" ? next.managerLeave.message : "The calendar has advanced to matchday.";
  return { career: next, advancedDays: days, event: "matchday", urgentNews, message };
}

export const MATCH_PREPARATION_PLANS: MatchPreparationPlan[] = ["Press their build-up", "Break the press", "Protect against counters"];

export function getMatchPreparation(career: Career) {
  const fixture = getNextFixture(career);
  if (!fixture || fixture.played) return null;
  const opponentId = fixture.homeClubId === career.clubId ? fixture.awayClubId : fixture.homeClubId;
  const opponent = getClub(career, opponentId);
  const opponentStyle = opponent.dna?.tacticalIdentity ?? "Possession";
  const recommendedStyle = counterStyleFor(opponentStyle);
  const styleAdvantage = tacticalStyleAdvantage(safeFootballStyle(career.style), opponentStyle);
  const opponentFormation = opponent.aiTactics?.formation ?? "4-2-3-1";
  const opponentMentality = opponent.aiTactics?.mentality ?? "Balanced";
  const recommendedPlan: MatchPreparationPlan = opponentStyle === "Possession"
    ? "Press their build-up"
    : opponentStyle === "High press"
      ? "Break the press"
      : "Protect against counters";
  const plan = career.matchPreparation?.fixtureId === fixture.id ? career.matchPreparation.plan : null;
  const coachInsight = Math.round(responsibilityAbility(career, "matchPreparation"));
  const matchRatingAdjustment = plan === null ? 0 : plan === recommendedPlan
    ? 0.55 + (coachInsight - 50) * 0.008
    : -0.2;
  const feedback = plan === null
    ? `Staff read ${opponent.name} as a ${opponentStyle.toLowerCase()} side. ${recommendedPlan} is the suggested rehearsal.`
    : plan === recommendedPlan
      ? `Rehearsal matches their ${opponentStyle.toLowerCase()} approach. The staff expect this plan to create a small edge.`
      : `This rehearsal does not address their ${opponentStyle.toLowerCase()} pattern. ${recommendedPlan} is the staff recommendation.`;
  return { fixture, opponent, opponentStyle, recommendedStyle, styleAdvantage, opponentFormation, opponentMentality, plan, recommendedPlan, coachInsight, matchRatingAdjustment, feedback };
}

export type ManagerBriefingRoute = "squad" | "tactics" | "transfers" | "finance" | "academy" | "clubhouse";
export type ManagerBriefingPriority = "Urgent" | "Watch" | "Opportunity";
export type ManagerBriefingItem = {
  id: string;
  priority: ManagerBriefingPriority;
  headline: string;
  detail: string;
  evidence: string;
  actionLabel: string;
  route: ManagerBriefingRoute;
};

/** Builds a deterministic manager briefing from the current saved career data. */
export function getManagerBriefing(career: Career, limit = 4): ManagerBriefingItem[] {
  const club = getClub(career);
  const table = getTable(career);
  const position = table.findIndex((row) => row.clubId === career.clubId) + 1;
  const row = table.find((entry) => entry.clubId === career.clubId)!;
  const items: ManagerBriefingItem[] = [];
  const selected = career.lineup
    .map((id) => career.players.find((player) => player.id === id && player.clubId === career.clubId))
    .filter((player): player is Player => Boolean(player));
  const unavailable = selected.filter((player) => (player.injuryWeeksRemaining ?? 0) > 0 || (player.suspensionMatchesRemaining ?? 0) > 0);

  if (unavailable.length) {
    const names = unavailable.slice(0, 2).map((player) => player.name).join(" and ");
    items.push({
      id: "selection-injuries",
      priority: "Urgent",
      headline: `${unavailable.length} selected player${unavailable.length === 1 ? " is" : "s are"} unavailable`,
      detail: `${names}${unavailable.length > 2 ? ` and ${unavailable.length - 2} more` : ""} cannot take part while injured or serving a ban. Review the XI before the next match.`,
      evidence: unavailable.map((player) => player.suspensionMatchesRemaining
        ? `${player.name} · Suspended ${player.suspensionMatchesRemaining} match${player.suspensionMatchesRemaining === 1 ? "" : "es"}`
        : `${player.name} · ${player.injuryWeeksRemaining} week${player.injuryWeeksRemaining === 1 ? "" : "s"}`).join("  /  "),
      actionLabel: "Review selection",
      route: "squad",
    });
  }

  const pressure = career.pressure ?? 18;
  const signals = getBoardPressureSignals(career);
  const winlessRun = career.winlessRun ?? 0;
  if (pressure >= 62 || winlessRun >= 6) {
    items.push({
      id: "board-pressure",
      priority: pressure >= 78 || winlessRun >= 9 ? "Urgent" : "Watch",
      headline: "Results are feeding board pressure",
      detail: `${club.name}'s pressure is ${pressure.toFixed(1)}. The board weighs results alongside supporter confidence, player rapport and the club target.`,
      evidence: `${winlessRun} without a win · ${signals.averageRapport}% player rapport · ${club.supporterConfidence}% supporter confidence`,
      actionLabel: "Review club outlook",
      route: "clubhouse",
    });
  }

  const preparation = getMatchPreparation(career);
  if (preparation) {
    const mismatch = Boolean(preparation.plan && preparation.plan !== preparation.recommendedPlan);
    items.push({
      id: `match-preparation-${preparation.fixture.id}`,
      priority: mismatch ? "Watch" : "Opportunity",
      headline: `Prepare for ${preparation.opponent.name}`,
      detail: mismatch
        ? `The current rehearsal does not target their ${preparation.opponentStyle.toLowerCase()} approach. Staff recommend ${preparation.recommendedPlan.toLowerCase()}.`
        : `They use ${preparation.opponentStyle.toLowerCase()} football. Staff recommend ${preparation.recommendedPlan.toLowerCase()} for this fixture.`,
      evidence: `${preparation.opponentFormation} · ${preparation.opponentMentality} · staff insight ${preparation.coachInsight}/100`,
      actionLabel: "Open match preparation",
      route: "tactics",
    });
  }

  const expiringDeals = career.players
    .filter((player) => player.clubId === career.clubId && player.age >= 16 && player.contractYears <= 1)
    .sort((first, second) => second.overall - first.overall || first.name.localeCompare(second.name));
  if (expiringDeals.length) {
    const names = expiringDeals.slice(0, 2).map((player) => `${player.name} (${player.contractYears} yr${player.contractYears === 1 ? "" : "s"})`).join(" · ");
    items.push({
      id: "contract-watch",
      priority: expiringDeals.some((player) => player.contractYears === 0) ? "Urgent" : "Watch",
      headline: `${expiringDeals.length} senior contract${expiringDeals.length === 1 ? "" : "s"} need attention`,
      detail: `${names}${expiringDeals.length > 2 ? ` · and ${expiringDeals.length - 2} more` : ""}. Start talks early to protect the squad's value and avoid a last-minute decision.`,
      evidence: `${expiringDeals.filter((player) => player.contractYears === 1).length} due within a season · ${expiringDeals.filter((player) => player.contractYears === 0).length} already expired`,
      actionLabel: "Review contracts",
      route: "transfers",
    });
  }

  if (club.balance < 0) {
    items.push({
      id: "cash-flow",
      priority: "Urgent",
      headline: "The club is operating below zero",
      detail: "A negative balance puts day-to-day operations under strain. Review spending and commercial income before committing to another project.",
      evidence: `Current balance ${formatMoney(club.balance)} · outstanding debt ${formatMoney(club.debt)}`,
      actionLabel: "Open club finances",
      route: "finance",
    });
  }

  const academyProspect = career.players
    .filter((player) => player.clubId === career.clubId && player.age <= 20 && player.potential - player.overall >= 17)
    .sort((first, second) => (second.potential - second.overall) - (first.potential - first.overall) || second.potential - first.potential)[0];
  if (academyProspect) {
    items.push({
      id: `academy-pathway-${academyProspect.id}`,
      priority: "Opportunity",
      headline: `A high-upside pathway is available`,
      detail: `${academyProspect.name} is ${academyProspect.age} and has ${academyProspect.potential - academyProspect.overall} points of development headroom. Give their role and training focus a review.`,
      evidence: `${academyProspect.squadLevel ?? "Academy"} · ${academyProspect.overall} current · ${academyProspect.potential} potential`,
      actionLabel: "Review academy",
      route: "academy",
    });
  }

  if (!items.length) {
    items.push({
      id: "season-focus",
      priority: "Opportunity",
      headline: "Keep the season target in view",
      detail: "No immediate squad, contract or cash-flow issue has surfaced. Continue preparing the team to meet the board's season target.",
      evidence: `${position ? `League position ${position}/${table.length}` : "League table not started"} · target top ${club.targetPosition} · ${row.points} points`,
      actionLabel: "Review the squad",
      route: "squad",
    });
  }

  const priorityOrder: Record<ManagerBriefingPriority, number> = { Urgent: 0, Watch: 1, Opportunity: 2 };
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(6, Math.floor(limit))) : 4;
  return items.sort((first, second) => priorityOrder[first.priority] - priorityOrder[second.priority] || first.id.localeCompare(second.id)).slice(0, safeLimit);
}

function inboxRead(career: Career, id: string) {
  return (career.inboxReadIds ?? []).includes(id);
}

/** Collects saved club news and time-sensitive decisions into one manager inbox. */
export function getManagerInbox(career: Career): ManagerInboxMessage[] {
  const today = getCalendarDate(career);
  const messages: ManagerInboxMessage[] = [];
  const add = (message: Omit<ManagerInboxMessage, "read">) => messages.push({ ...message, read: inboxRead(career, message.id) });
  const newsRoutes: Record<NewsItem["type"], ManagerInboxRoute> = {
    match: "fixtures", club: "overview", transfer: "transfers", stadium: "stadium", press: "newsroom", award: "newsroom",
  };
  for (const news of career.news.slice(0, 24)) {
    if (news.id.startsWith("incoming-bid:")) continue;
    add({
      id: `news:${news.id}`,
      date: news.date,
      category: "Club news",
      subject: news.headline,
      body: news.body,
      priority: news.urgent ? "Urgent" : "Update",
      route: newsRoutes[news.type],
    });
  }

  const preparation = getMatchPreparation(career);
  if (preparation) add({
    id: `match-analysis:${preparation.fixture.id}`,
    date: dateLabel(preparation.fixture.date),
    category: "Match analysis",
    subject: `Opposition briefing · ${preparation.opponent.name}`,
    body: `${preparation.opponent.name} are expected to use ${preparation.opponentStyle.toLowerCase()} football in a ${preparation.opponentFormation}. Staff recommend ${preparation.recommendedPlan.toLowerCase()}. ${preparation.feedback}`,
    priority: "Action needed",
    route: "tactics",
  });

  const fixture = getNextFixture(career);
  const daysUntilMatch = fixture ? Math.round((new Date(`${fixture.date}T12:00:00Z`).getTime() - new Date(`${today}T12:00:00Z`).getTime()) / 86_400_000) : Infinity;
  if (fixture && daysUntilMatch >= 0 && daysUntilMatch <= 2 && !career.pressConferenceResponses?.[fixture.id]) {
    const opponent = getClub(career, fixture.homeClubId === career.clubId ? fixture.awayClubId : fixture.homeClubId);
    const topic = (career.winlessRun ?? 0) >= 3
      ? `Reporters will ask how you plan to stop the ${career.winlessRun}-match winless run.`
      : `Expect questions about the squad's preparation for ${opponent.name}.`;
    add({
      id: `press-conference:${fixture.id}`,
      date: dateLabel(today),
      category: "Press conference",
      subject: `Pre-match media briefing · ${opponent.name}`,
      body: `${topic} Choose a tone. Your response affects press pressure, player rapport and the next team talk.`,
      priority: "Action needed",
      route: "newsroom",
      choices: [
        { id: "Back the players", label: "Back the players" },
        { id: "Keep expectations measured", label: "Keep expectations measured" },
        { id: "Demand a response", label: "Demand a response" },
      ],
    });
  }

  const club = getClub(career);
  const openBids = (career.incomingTransferOffers ?? []).filter((offer) => offer.status === "Pending" && offer.expiresDate >= today);
  for (const offer of openBids) {
    const player = career.players.find((item) => item.id === offer.playerId);
    const bidder = career.clubs.find((item) => item.id === offer.bidderClubId);
    if (!player || !bidder) continue;
    add({
      id: `transfer-bid:${offer.id}`,
      date: dateLabel(offer.date),
      category: "Transfer offer",
      subject: `${bidder.name} bid for ${player.name}`,
      body: `${bidder.name} offer ${formatMoney(offer.fee)} for ${player.name}. The bid expires ${dateLabel(offer.expiresDate)}. Accept the fee or reject the approach.`,
      priority: "Urgent",
      route: "transfers",
    });
  }

  const expiring = career.players
    .filter((player) => player.clubId === career.clubId && player.age >= 16 && player.contractYears <= 1)
    .sort((first, second) => second.overall - first.overall || first.name.localeCompare(second.name))
    .slice(0, 8);
  for (const player of expiring) add({
    id: `contract:${career.season}:${player.id}`,
    date: dateLabel(today),
    category: "Contracts",
    subject: `${player.name} contract needs review`,
    body: `${player.name} has ${player.contractYears <= 0 ? "no contracted seasons remaining" : "one season remaining"}. Open contract talks or review the player's role before the next renewal window.`,
    priority: player.contractYears <= 0 ? "Urgent" : "Action needed",
    route: "transfers",
  });

  const completedReports = (career.scoutingReports ?? []).filter((report) => report.clubId === career.clubId && report.managerId === career.id && (!report.availableDate || report.availableDate <= today)).slice(-8);
  for (const report of completedReports) {
    const player = career.players.find((item) => item.id === report.playerId) ?? getWorldPlayerDetails(report.playerId);
    if (!player) continue;
    add({
      id: `scouting:${report.id}`,
      date: dateLabel(report.availableDate ?? today),
      category: "Scouting",
      subject: `Scouting assessment ready · ${player.name}`,
      body: `The five-day report is ready in the player directory. The assessment records current ability ${report.currentAbility}, potential ${report.potential} and a value of ${formatMoney(report.marketValue)}.`,
      priority: "Update",
      route: "transfers",
    });
  }

  const sponsorOffers = club.sponsorOffers ?? [];
  if (sponsorOffers.length) add({
    id: `commercial-offers:${career.season}:${sponsorOffers.map((offer) => offer.id).sort().join("|")}`,
    date: dateLabel(today),
    category: "Commercial",
    subject: `${sponsorOffers.length} sponsorship proposal${sponsorOffers.length === 1 ? "" : "s"} await a decision`,
    body: `The commercial team have partner terms ready for the club's shirt, ground and development assets. Compare their values and contract lengths before accepting.`,
    priority: "Action needed",
    route: "commercial",
  });

  const priority: Record<ManagerInboxPriority, number> = { Urgent: 0, "Action needed": 1, Update: 2 };
  return messages.sort((first, second) => priority[first.priority] - priority[second.priority] || Number(first.read) - Number(second.read) || second.id.localeCompare(first.id));
}

export function getUnreadManagerInboxCount(career: Career) {
  return getManagerInbox(career).filter((message) => !message.read).length;
}

export function markManagerInboxRead(career: Career, ids: string[]) {
  const validIds = new Set(getManagerInbox(career).map((message) => message.id));
  const readIds = new Set(career.inboxReadIds ?? []);
  for (const id of ids) if (validIds.has(id)) readIds.add(id);
  if (readIds.size === (career.inboxReadIds ?? []).length) return career;
  return { ...career, inboxReadIds: [...readIds].slice(-1000) };
}

export function markAllManagerInboxRead(career: Career) {
  return markManagerInboxRead(career, getManagerInbox(career).map((message) => message.id));
}

export function respondToPressConference(career: Career, fixtureId: string, choice: PressConferenceChoice) {
  const allowed: PressConferenceChoice[] = ["Back the players", "Keep expectations measured", "Demand a response"];
  const fixture = getNextFixture(career);
  if (!fixture || fixture.id !== fixtureId || !allowed.includes(choice) || career.pressConferenceResponses?.[fixtureId]) return career;
  const next = structuredClone(career);
  const club = getClub(next);
  next.pressConferenceResponses ??= {};
  next.pressConferenceResponses[fixtureId] = choice;
  next.inboxReadIds ??= [];
  next.inboxReadIds.push(`press-conference:${fixtureId}`);
  if (choice === "Back the players") {
    for (const player of next.players) if (player.clubId === next.clubId && next.lineup.includes(player.id)) player.managerRapport = Math.min(100, (player.managerRapport ?? 58) + 2);
    next.pressPressure = Math.max(0, Math.min(100, (next.pressPressure ?? 12) + 2));
  } else if (choice === "Keep expectations measured") {
    next.pressPressure = Math.max(0, (next.pressPressure ?? 12) - 6);
    club.boardTrust = Math.min(100, club.boardTrust + 1);
  } else {
    next.teamTalk = "Demanding";
    next.pressPressure = Math.max(0, Math.min(100, (next.pressPressure ?? 12) + 3));
    for (const player of next.players) if (player.clubId === next.clubId && next.lineup.includes(player.id)) player.morale = Math.max(20, player.morale - 1);
  }
  const consequence = choice === "Back the players" ? "The squad appreciate the public support." : choice === "Keep expectations measured" ? "The measured response cools the press cycle and reassures the board." : "The demand is carried into the pre-match team talk; some players feel the pressure.";
  next.news.unshift({ id: `conference-response:${fixtureId}`, date: dateLabel(getCalendarDate(next)), headline: `${next.manager} addresses the press before ${getClub(next, fixture.homeClubId === next.clubId ? fixture.awayClubId : fixture.homeClubId).name}`, body: `${choice}. ${consequence}`, type: "press" });
  next.news = next.news.slice(0, 28);
  return next;
}

export function resolveClubTransferBid(career: Career, offerId: string, decision: "Accept" | "Reject") {
  const offer = (career.incomingTransferOffers ?? []).find((item) => item.id === offerId && item.status === "Pending");
  if (!offer) return career;
  const today = getCalendarDate(career);
  if (offer.expiresDate < today) {
    const expired = structuredClone(career);
    expired.incomingTransferOffers!.find((item) => item.id === offerId)!.status = "Expired";
    return expired;
  }
  const player = career.players.find((item) => item.id === offer.playerId && item.clubId === career.clubId && item.age >= 16);
  const buyer = career.clubs.find((item) => item.id === offer.bidderClubId && item.id !== career.clubId);
  if (!player || !buyer || decision === "Accept" && (buyer.balance < offer.fee || (career.playerLoans ?? []).some((loan) => loan.playerId === player.id && loan.status === "Active"))) return career;
  if (decision === "Accept" && career.lineup.includes(player.id)) {
    const replacement = career.players.filter((item) => item.clubId === career.clubId && item.id !== player.id && !career.lineup.includes(item.id) && item.age >= 16 && (item.injuryWeeksRemaining ?? 0) === 0 && (item.suspensionMatchesRemaining ?? 0) === 0)
      .sort((first, second) => Number(second.position === player.position) - Number(first.position === player.position) || second.overall - first.overall)[0];
    if (!replacement) return career;
  }

  const next = structuredClone(career);
  const nextOffer = next.incomingTransferOffers!.find((item) => item.id === offerId)!;
  next.inboxReadIds ??= [];
  next.inboxReadIds.push(`transfer-bid:${offerId}`);
  if (decision === "Reject") {
    nextOffer.status = "Rejected";
    return next;
  }
  const nextPlayer = next.players.find((item) => item.id === player.id)!;
  const sellingClub = getClub(next);
  const buyingClub = next.clubs.find((item) => item.id === buyer.id)!;
  const oldRecord = nextPlayer.clubHistory?.find((record) => record.clubId === sellingClub.id && record.toSeason === null);
  if (oldRecord) oldRecord.toSeason = next.season;
  nextPlayer.clubHistory ??= [];
  nextPlayer.clubHistory.push({ clubId: buyingClub.id, clubName: buyingClub.name, country: buyingClub.country, fromSeason: next.season, toSeason: null, squadLevel: nextPlayer.squadLevel ?? squadLevelForAge(nextPlayer.age), appearances: 0, goals: 0, assists: 0, cleanSheets: 0 });
  nextPlayer.clubId = buyingClub.id;
  sellingClub.balance += offer.fee;
  sellingClub.transferBudget += Math.round(offer.fee * 0.65);
  buyingClub.balance -= offer.fee;
  buyingClub.transferBudget = Math.max(0, buyingClub.transferBudget - offer.fee);
  if (sellingClub.captainId === nextPlayer.id || sellingClub.viceCaptainId === nextPlayer.id) {
    sellingClub.captainId = initialLeader(sellingClub.id, next.players, nextPlayer.id)?.id;
    sellingClub.viceCaptainId = initialLeader(sellingClub.id, next.players, sellingClub.captainId)?.id;
    sellingClub.dressingRoomTension = Math.min(100, (sellingClub.dressingRoomTension ?? 12) + 6);
  }
  if (next.lineup.includes(nextPlayer.id)) {
    const replacement = next.players.filter((item) => item.clubId === sellingClub.id && item.age >= 16 && (item.injuryWeeksRemaining ?? 0) === 0 && (item.suspensionMatchesRemaining ?? 0) === 0 && !next.lineup.includes(item.id))
      .sort((first, second) => Number(second.position === nextPlayer.position) - Number(first.position === nextPlayer.position) || second.overall - first.overall)[0];
    next.lineup[next.lineup.indexOf(nextPlayer.id)] = replacement.id;
  }
  nextPlayer.managerRapport = Math.max(35, (nextPlayer.managerRapport ?? 58) - 4);
  nextOffer.status = "Accepted";
  next.transferHistory ??= [];
  next.transferHistory.push({ id: offer.id, season: next.season, playerId: nextPlayer.id, playerName: nextPlayer.name, fromClubId: sellingClub.id, fromClubName: sellingClub.name, toClubId: buyingClub.id, toClubName: buyingClub.name, fee: offer.fee, date: dateLabel(today) });
  next.transferHistory = next.transferHistory.slice(-500);
  next.finance.unshift({ date: dateLabel(today), label: `Transfer fee · ${nextPlayer.name}`, amount: offer.fee });
  next.news.unshift({ id: `incoming-bid-accepted:${offer.id}`, date: dateLabel(today), headline: `${nextPlayer.name} joins ${buyingClub.name}`, body: `${sellingClub.name} accept a ${formatMoney(offer.fee)} bid. The fee is added to the club balance and transfer allocation.`, type: "transfer" });
  next.news = next.news.slice(0, 28);
  refreshPlayerRelationships(next);
  return next;
}

function maybeGenerateIncomingTransferBid(career: Career, date: string, seed: number) {
  const month = Number(date.slice(5, 7));
  if (![8, 1, 2].includes(month)) return;
  if ((career.incomingTransferOffers ?? []).some((offer) => offer.status === "Pending" && offer.expiresDate >= date)) return;
  const random = randomFrom(stableSeed(`${career.id}:${career.season}:${career.round}:${date}:${seed}:outside-bid`));
  if (random() > 0.2) return;
  const candidates = career.players.filter((player) => player.clubId === career.clubId && player.age >= 18 && player.contractYears >= 1 && !(career.playerLoans ?? []).some((loan) => loan.playerId === player.id && loan.status === "Active"))
    .sort((first, second) => second.overall + second.potential * 0.12 - (first.overall + first.potential * 0.12) || first.id.localeCompare(second.id));
  if (!candidates.length) return;
  const player = candidates[Math.floor(random() * Math.min(6, candidates.length))];
  const fee = Math.max(50_000, Math.round(player.value * (1.2 + random() * 0.6) / 10_000) * 10_000);
  const managerClub = getClub(career);
  const buyers = career.clubs.filter((club) => club.id !== managerClub.id && club.balance >= fee && (club.country === managerClub.country || club.reputation >= managerClub.reputation + 12))
    .sort((first, second) => second.reputation - first.reputation || first.id.localeCompare(second.id));
  if (!buyers.length) return;
  const bidder = buyers[Math.floor(random() * Math.min(5, buyers.length))];
  career.incomingTransferOffers ??= [];
  const offer: ClubTransferBid = { id: `bid-${career.season}-${career.round}-${player.id}-${bidder.id}`, playerId: player.id, bidderClubId: bidder.id, fee, date, expiresDate: addCalendarDays(date, 5), season: career.season, round: career.round, status: "Pending" };
  career.incomingTransferOffers.push(offer);
  const target = career.players.find((player) => player.id === offer.playerId)!;
  const buyingClub = career.clubs.find((club) => club.id === offer.bidderClubId)!;
  career.news.unshift({ id: `incoming-bid:${offer.id}`, date: dateLabel(date), headline: `Formal bid received for ${target.name}`, body: `${buyingClub.name} have offered ${formatMoney(offer.fee)} for ${target.name}. The offer expires ${dateLabel(offer.expiresDate)}; resolve it in the manager inbox.`, type: "transfer", urgent: true, source: "Transfer desk", reliability: 100 });
  career.news = career.news.slice(0, 28);
}

export function setMatchPreparation(career: Career, plan: MatchPreparationPlan) {
  const preparation = getMatchPreparation(career);
  if (!preparation) return career;
  const next = structuredClone(career);
  next.matchPreparation = { fixtureId: preparation.fixture.id, plan };
  return next;
}

function clubPower(career: Career, clubId: string, playersByClub?: Map<string, Player[]>, playersById?: Map<string, Player>) {
  const clubPlayers = (playersByClub?.get(clubId) ?? career.players.filter((player) => player.clubId === clubId)).filter((player) => (player.injuryWeeksRemaining ?? 0) === 0 && (player.suspensionMatchesRemaining ?? 0) === 0);
  const club = getClub(career, clubId);
  const selected = clubId === career.clubId ? fixtureXI(career, clubId, playersByClub, playersById) : createStartingXI(career.players, clubId, club.aiTactics?.formation ?? "4-2-3-1", clubPlayers).map((id) => playersById?.get(id) ?? career.players.find((player) => player.id === id)).filter((player): player is Player => Boolean(player));
  const average = selected.length ? selected.reduce((sum, player) => sum + player.overall + getPlayerConditionModifier(player.condition ?? 100) + (player.morale - 60) * 0.035 + ((player.managerRapport ?? 58) - 50) * 0.025, 0) / selected.length : getClub(career, clubId).reputation * 0.78;
  const relevantCoaches = (club.staff ?? []).filter((person) => ["First-Team Manager", "Assistant Manager", "First-Team Coach", "Goalkeeping Coach", "Fitness Coach"].includes(person.role));
  const staffAverage = relevantCoaches.length ? relevantCoaches.reduce((sum, person) => sum + person.ability, 0) / relevantCoaches.length : 50;
  const backroomBonus = (staffAverage - 50) * 0.025;
  const leadershipBonus = getLeadershipDynamics(career, clubId, playersByClub).matchImpact;
  const tacticalFamiliarity = clubId === career.clubId ? career.tacticalFamiliarity ?? 55 : club.tacticalFamiliarity ?? 55;
  const tacticalFit = (tacticalFamiliarity - 50) * 0.045;
  if (clubId !== career.clubId) {
    const dna = club.dna ?? createClubDNA(club.id, club.name, club.reputation);
    const tactics = club.aiTactics ?? createAIClubTactics(club.id, club.reputation);
    const activeStyle = tactics.style ?? dna.tacticalIdentity;
    const identityFit = dnaStyleFit(dna, activeStyle);
    const dnaTacticalBonus = (identityFit - 55) * 0.018;
    const mentalityBonus = tactics.mentality === "Attacking" ? 0.3 : tactics.mentality === "Cautious" ? 0.08 : 0.2;
    return average + backroomBonus + leadershipBonus + tacticalFit + dnaTacticalBonus + mentalityBonus + aiFormationFit(activeStyle, tactics.formation);
  }
  const formationBonus = career.formation === "4-3-3" ? 0.35 : career.formation === "3-5-2" ? 0.15 : 0.25;
  const mentalityBonus = career.mentality === "Attacking" ? 0.35 : career.mentality === "Cautious" ? -0.25 : 0.1;
  const styleBonus = career.style === "Counter attack" ? 0.25 : career.style === "High press" ? 0.15 : 0.2;
  const roleBonus = clubId === career.clubId && selected.length ? selected.reduce((sum, player) => {
    const assessment = getPlayerRoleAssessment(player);
    const role = assessment.role.toLowerCase();
    const styleFit = (career.style === "Possession" && role.includes("playmaker")) || (career.style === "High press" && role.includes("pressing"));
    const shapeFit = (career.formation.includes("3-") && role.includes("wing-back")) || (career.formation === "4-3-3" && role.includes("inside forward")) || (career.defensiveLine! > 65 && role.includes("sweeper"));
    return sum + (assessment.fit - 60) * 0.035 + Number(styleFit) * 0.12 + Number(shapeFit) * 0.08;
  }, 0) / selected.length : 0;
  const pitchFit = (getClub(career, clubId).stadium.pitchQuality - 3) * 0.18;
  const pressFit = career.style === "High press" ? ((career.pressingIntensity ?? 55) - 50) * 0.018 : 0;
  const lineRisk = ((career.defensiveLine ?? 50) - 50) * (career.mentality === "Cautious" ? -0.012 : 0.009);
  const tempoFit = ((career.passingTempo ?? 50) - 50) * 0.008;
  const widthFit = ((career.attackingWidth ?? 50) - 50) * (career.formation === "3-5-2" || career.formation === "5-3-2" ? -0.006 : 0.008);
  const identityFit = dnaStyleFit(club.dna ?? createClubDNA(club.id, club.name, club.reputation), career.style);
  const dnaTacticalBonus = (identityFit - 55) * 0.018;
  const matchPreparationBonus = getMatchPreparation(career)?.matchRatingAdjustment ?? 0;
  return average + backroomBonus + formationBonus + mentalityBonus + styleBonus + roleBonus + tacticalFit + pitchFit + pressFit + lineRisk + tempoFit + widthFit + dnaTacticalBonus + matchPreparationBonus + leadershipBonus;
}

function goalsFor(attack: number, defence: number, homeAdvantage: number, random: () => number, minutes = 90, xgAdjustment = 0) {
  // A goal-count distribution keeps small ability gaps competitive while still
  // letting genuinely stronger sides create and finish more chances.
  const expectedGoals = Math.max(0.24, Math.min(3.5, 1.3 + (attack - defence) * 0.05 + homeAdvantage + xgAdjustment));
  return samplePoisson(expectedGoals * Math.max(0, Math.min(90, minutes)) / 90, random);
}

function updateDressingRoomAfterResult(career: Career, clubId: string, result: "win" | "draw" | "loss") {
  const club = getClub(career, clubId);
  const captain = career.players.find((player) => player.id === club.captainId && player.clubId === clubId);
  const change = result === "win" ? -2 - (captain && (captain.managerRapport ?? 58) >= 68 ? 1 : 0)
    : result === "draw" ? (club.dressingRoomTension ?? 12) >= 35 ? 1 : 0
      : 3 + (captain?.personality === "Fiery" ? 2 : 0);
  club.dressingRoomTension = Math.max(0, Math.min(100, (club.dressingRoomTension ?? 12) + change));
}

function updateAIClubTactics(club: Club, result: "win" | "draw" | "loss", season: number, round: number) {
  const tactics = club.aiTactics ?? (club.aiTactics = createAIClubTactics(club.id, club.reputation));
  tactics.adaptationCooldown = Math.max(0, tactics.adaptationCooldown - 1);
  tactics.winlessRun = result === "win" ? 0 : tactics.winlessRun + 1;
  club.tacticalFamiliarity = Math.min(100, (club.tacticalFamiliarity ?? 55) + 1.15);
  const manager = (club.staff ?? []).find((person) => person.role === "First-Team Manager");
  const changeThreshold = (manager?.ability ?? 50) >= 78 ? 2 : (manager?.ability ?? 50) < 48 ? 4 : 3;
  if (tactics.winlessRun < changeThreshold || tactics.adaptationCooldown > 0) return false;

  const style = club.dna?.tacticalIdentity ?? "Possession";
  const suitable = (style === "Possession" ? ["4-3-3", "4-2-3-1", "4-1-4-1"]
    : style === "High press" ? ["4-3-3", "4-2-3-1", "3-5-2"]
      : ["4-4-2", "5-3-2", "4-2-3-1"]).filter((formation) => formation !== tactics.formation);
  if (suitable.length) tactics.formation = suitable[(tactics.adaptations + stableSeed(`${club.id}:${season}:${round}:tactical-reset`)) % suitable.length];
  tactics.mentality = tactics.winlessRun >= 5 || tactics.mentality === "Cautious" ? "Attacking" : tactics.mentality === "Attacking" ? "Balanced" : "Attacking";
  tactics.adaptations += 1;
  tactics.adaptationCooldown = 5;
  club.tacticalFamiliarity = Math.max(32, (club.tacticalFamiliarity ?? 55) - 8);
  return true;
}

function aiTacticalMatchAdjustment(club: Club, ownPower: number, oppositionPower: number) {
  const tactics = club.aiTactics ?? createAIClubTactics(club.id, club.reputation);
  const edge = ownPower - oppositionPower;
  const mentality = tactics.mentality === "Attacking" ? edge >= 0 ? 0.38 : -0.28
    : tactics.mentality === "Cautious" ? edge < 0 ? 0.34 : -0.18
      : 0.08;
  const cohesion = Math.max(-0.3, Math.min(0.45, ((club.tacticalFamiliarity ?? 55) - 50) * 0.012));
  const style = tactics.style ?? club.dna?.tacticalIdentity ?? "Possession";
  return mentality + cohesion + aiFormationFit(style, tactics.formation) * 0.45;
}

function updatePlayerRecord(player: Player, clubId: string, clubName: string, country: string, season: number, change: Partial<PlayerStats>) {
  const add = (stats: PlayerStats): PlayerStats => ({
    appearances: stats.appearances + (change.appearances ?? 0), goals: stats.goals + (change.goals ?? 0), assists: stats.assists + (change.assists ?? 0),
    cleanSheets: stats.cleanSheets + (change.cleanSheets ?? 0), minutes: stats.minutes + (change.minutes ?? 0),
  });
  player.careerStats = add(player.careerStats ?? emptyPlayerStats());
  player.seasonStats = add(player.seasonStats ?? emptyPlayerStats());
  player.clubHistory ??= [];
  let current = player.clubHistory.find((record) => record.clubId === clubId && record.toSeason === null);
  if (!current) {
    player.clubHistory.forEach((record) => { if (record.toSeason === null) record.toSeason = Math.max(record.fromSeason, season - 1); });
    current = { clubId, clubName, country, fromSeason: season, toSeason: null, squadLevel: player.squadLevel ?? squadLevelForAge(player.age), appearances: 0, goals: 0, assists: 0, cleanSheets: 0 };
    player.clubHistory.push(current);
  }
  current.appearances += change.appearances ?? 0;
  current.goals += change.goals ?? 0;
  current.assists += change.assists ?? 0;
  current.cleanSheets += change.cleanSheets ?? 0;
}

function creditPlayerStatistic(player: Player, field: "goals" | "assists", clubId: string, clubName: string, country: string, season: number) {
  const current = player.clubHistory?.find((record) => record.clubId === clubId && record.toSeason === null);
  if (!current) updatePlayerRecord(player, clubId, clubName, country, season, { [field]: 1 });
  else {
    player.careerStats ??= emptyPlayerStats();
    player.seasonStats ??= emptyPlayerStats();
    player.careerStats[field] += 1;
    player.seasonStats[field] += 1;
    current[field] += 1;
  }
}

function dateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function fixtureXI(career: Career, clubId: string, playersByClub?: Map<string, Player[]>, playersById?: Map<string, Player>) {
  const club = getClub(career, clubId);
  const managerAway = career.managerLeave?.status === "active" && career.calendarDate !== undefined && career.calendarDate >= career.managerLeave.startDate && career.calendarDate <= career.managerLeave.endDate;
  if (clubId === career.clubId && !managerAway) {
    const selected = career.lineup.map((id) => playersById?.get(id) ?? career.players.find((player) => player.id === id)).filter((player): player is Player => Boolean(player && player.clubId === clubId && player.age >= 16 && (player.injuryWeeksRemaining ?? 0) === 0 && (player.suspensionMatchesRemaining ?? 0) === 0));
    if (selected.length === 11) return selected;
  }
  return createStartingXI(career.players, clubId, clubId === career.clubId ? career.formation : club.aiTactics?.formation ?? "4-2-3-1", playersByClub?.get(clubId))
    .map((id) => playersById?.get(id) ?? career.players.find((player) => player.id === id))
    .filter((player): player is Player => Boolean(player));
}

export function getMatchdaySubstitutionOptions(career: Career) {
  const starting = fixtureXI(career, career.clubId);
  const startingIds = new Set(starting.map((player) => player.id));
  const eligible = (player: Player) => player.clubId === career.clubId && player.age >= 16 && (player.injuryWeeksRemaining ?? 0) === 0 && (player.suspensionMatchesRemaining ?? 0) === 0;
  return {
    starting: starting.filter(eligible).map(({ id, name, position, overall, morale }) => ({ id, name, position, overall, morale })),
    bench: career.players.filter((player) => eligible(player) && !startingIds.has(player.id))
      .sort((a, b) => b.overall + b.morale * 0.04 - a.overall - a.morale * 0.04)
      .slice(0, 12)
      .map(({ id, name, position, overall, morale }) => ({ id, name, position, overall, morale })),
  };
}

export function getLiveMatchSubstitutionOptions(career: Career) {
  const live = career.activeMatch;
  const starting = fixtureXI(career, career.clubId);
  const onField = new Map(starting.map((player) => [player.id, player]));
  const withdrawn = new Set<string>();
  for (const substitution of [...(live?.executedSubstitutions ?? [])].sort((a, b) => a.minute - b.minute)) {
    onField.delete(substitution.playerOffId);
    withdrawn.add(substitution.playerOffId);
    const incoming = career.players.find((player) => player.id === substitution.playerOnId);
    if (incoming) onField.set(incoming.id, incoming);
  }
  const dismissedPlayers = new Set(live?.events.filter((event) => event.type === "red-card" && event.playerId).map((event) => event.playerId) ?? []);
  const eligible = (player: Player) => player.clubId === career.clubId && player.age >= 16 && (player.injuryWeeksRemaining ?? 0) === 0 && (player.suspensionMatchesRemaining ?? 0) === 0 && !dismissedPlayers.has(player.id);
  const currentIds = new Set(onField.keys());
  const project = ({ id, name, position, overall, morale }: Player) => ({ id, name, position, overall, morale });
  return {
    starting: [...onField.values()].filter(eligible).map(project),
    bench: career.players.filter((player) => eligible(player) && !currentIds.has(player.id) && !withdrawn.has(player.id))
      .sort((a, b) => b.overall + b.morale * 0.04 - a.overall - a.morale * 0.04)
      .slice(0, 18)
      .map(project),
  };
}

export function validateMatchdayManagementPlan(career: Career, plan: MatchdayManagementPlan) {
  const allowedDirectives: SecondHalfDirective[] = ["Balanced", "Raise the press", "Protect the lead", "Overload the wings", "Keep possession"];
  const allowedMinutes = new Set([45, 60, 75]);
  if (!allowedDirectives.includes(plan.secondHalfDirective) || !Array.isArray(plan.substitutions) || plan.substitutions.length > 5) return false;
  const starting = fixtureXI(career, career.clubId);
  const onField = new Set(starting.map((player) => player.id));
  const eligible = new Set(career.players.filter((player) => player.clubId === career.clubId && player.age >= 16 && (player.injuryWeeksRemaining ?? 0) === 0 && (player.suspensionMatchesRemaining ?? 0) === 0).map((player) => player.id));
  const onBench = new Set([...eligible].filter((id) => !onField.has(id)));
  const players = new Map(career.players.map((player) => [player.id, player]));
  const windows = new Set<number>();
  const substitutions = [...plan.substitutions].sort((first, second) => first.minute - second.minute);
  for (const substitution of substitutions) {
    const outgoing = players.get(substitution.playerOffId);
    const incoming = players.get(substitution.playerOnId);
    if (!allowedMinutes.has(substitution.minute) || !outgoing || !incoming || outgoing.id === incoming.id
      || !onField.has(outgoing.id) || !onBench.has(incoming.id) || outgoing.position !== incoming.position) return false;
    onField.delete(outgoing.id);
    onBench.delete(incoming.id);
    onField.add(incoming.id);
    windows.add(substitution.minute);
  }
  return windows.size <= 3;
}

export type SecondHalfTacticalEffects = { attack: number; defence: number };

export function getSecondHalfDirectiveEffects(career: Career, directive: SecondHalfDirective): SecondHalfTacticalEffects {
  const familiarity = Math.max(0, Math.min(100, career.tacticalFamiliarity ?? 50));
  const round = (value: number) => Math.round(value * 10) / 10;
  if (directive === "Raise the press") {
    const pressReadiness = Math.max(-0.5, Math.min(0.5, ((career.pressingIntensity ?? 50) - 50) * 0.02));
    return { attack: round(1 + (career.style === "High press" ? 0.55 : 0) + pressReadiness), defence: round(0.45 + pressReadiness) };
  }
  if (directive === "Protect the lead") {
    const lineFit = Math.max(-0.45, Math.min(0.45, (50 - (career.defensiveLine ?? 50)) * 0.015));
    return { attack: -0.8, defence: round(1.15 + lineFit + (career.mentality === "Cautious" ? 0.25 : 0)) };
  }
  if (directive === "Overload the wings") {
    const widthFit = (career.attackingWidth ?? 50) >= 60 ? 0.55 : 0.05;
    const wingbackFit = career.formation.includes("3-") ? 0.2 : 0;
    return { attack: round(0.7 + widthFit + wingbackFit), defence: -0.7 };
  }
  if (directive === "Keep possession") {
    const controlFit = (career.style === "Possession" ? 0.55 : 0) + (familiarity - 50) * 0.01;
    return { attack: round(0.55 + controlFit), defence: round(0.45 + controlFit * 0.65) };
  }
  return { attack: 0, defence: 0 };
}

export type MatchupPowers = { homeAttack: number; homeDefence: number; awayAttack: number; awayDefence: number };

export function getSecondHalfMatchupPowers(homePower: number, awayPower: number, userIsHome: boolean, effects: SecondHalfTacticalEffects): MatchupPowers {
  return {
    homeAttack: homePower + (userIsHome ? effects.attack : 0),
    homeDefence: homePower + (userIsHome ? effects.defence : 0),
    awayAttack: awayPower + (!userIsHome ? effects.attack : 0),
    awayDefence: awayPower + (!userIsHome ? effects.defence : 0),
  };
}

function emptyMatchStats(): MatchStats {
  const team = (): MatchTeamStats => ({ shots: 0, shotsOnTarget: 0, possession: 50, corners: 0, expectedGoals: 0 });
  return { home: team(), away: team() };
}

function samplePoisson(lambda: number, random: () => number) {
  const threshold = Math.exp(-Math.max(0, lambda));
  let product = 1;
  let count = 0;
  do {
    count += 1;
    product *= random();
  } while (product > threshold && count < 8);
  return count - 1;
}

function playersOnPitch(career: Career, clubId: string, minute: number, plan: MatchdayManagementPlan) {
  const dismissed = new Set(career.activeMatch?.events.filter((event) => event.type === "red-card" && event.clubId === clubId && event.playerId).map((event) => event.playerId) ?? []);
  const players = new Map(fixtureXI(career, clubId).filter((player) => !dismissed.has(player.id)).map((player) => [player.id, player]));
  if (clubId !== career.clubId) return [...players.values()];
  for (const substitution of [...plan.substitutions].sort((a, b) => a.minute - b.minute)) {
    if (minute < substitution.minute) continue;
    if (dismissed.has(substitution.playerOffId)) continue;
    players.delete(substitution.playerOffId);
    const incoming = career.players.find((player) => player.id === substitution.playerOnId);
    if (incoming && !dismissed.has(incoming.id)) players.set(incoming.id, incoming);
  }
  return [...players.values()];
}

export function getManagedMatchPlayerRatings(career: Career) {
  const live = career.activeMatch;
  const fixture = live && career.fixtures.find((item) => item.id === live.fixtureId);
  if (!live || !fixture) return null;
  const playersFor = (clubId: string) => playersOnPitch(career, clubId, live.minute, live.plan)
    .map((player) => ({ id: player.id, name: player.name, position: player.position, rating: Math.round((live.playerRatings?.[player.id] ?? 6.2) * 10) / 10 }));
  return { home: playersFor(fixture.homeClubId), away: playersFor(fixture.awayClubId) };
}

export const CORNER_DELIVERIES: CornerDelivery[] = ["Inswinging", "Outswinging", "Short routine"];
export const CORNER_DEFENCES: CornerDefence[] = ["Zonal", "Man marking", "Hybrid"];
export const FREE_KICK_ROUTINES: FreeKickRoutine[] = ["Direct shot", "Whipped delivery", "Short combination"];

function setPieceCandidates(career: Career) {
  return fixtureXI(career, career.clubId).filter((player) => player.age >= 16);
}

function bestSetPiecePlayer(players: Player[], score: (player: Player) => number, fallbackPosition?: Position) {
  return [...players].sort((first, second) => score(second) - score(first) || first.id.localeCompare(second.id))[0]
    ?? players.find((player) => player.position === fallbackPosition)
    ?? players[0];
}

/**
 * Existing saves receive sensible assignments from their selected XI. If a player
 * is removed from the XI later, their responsibility moves to the next-best starter.
 */
export function getSetPiecePlan(career: Career): SetPiecePlan {
  const candidates = setPieceCandidates(career);
  const saved = career.setPiecePlan;
  const isSelected = (id: string | undefined) => Boolean(id && candidates.some((player) => player.id === id));
  const cornerTaker = isSelected(saved?.cornerTakerId) ? saved!.cornerTakerId : bestSetPiecePlayer(candidates, (player) => (player.attributes?.crossing ?? 50) * 0.7 + (player.attributes?.passing ?? 50) * 0.3)?.id ?? "";
  const cornerTarget = isSelected(saved?.cornerTargetId) ? saved!.cornerTargetId : bestSetPiecePlayer(candidates.filter((player) => player.position !== "GK"), (player) => (player.attributes?.strength ?? 50) * 0.4 + (player.attributes?.physical ?? 50) * 0.25 + player.overall * 0.2 + (player.position === "FWD" || player.position === "DEF" ? 15 : 0), "FWD")?.id ?? "";
  const freeKickTaker = isSelected(saved?.freeKickTakerId) ? saved!.freeKickTakerId : bestSetPiecePlayer(candidates, (player) => (player.attributes?.shooting ?? 50) * 0.35 + (player.attributes?.passing ?? 50) * 0.35 + (player.attributes?.composure ?? 50) * 0.3)?.id ?? "";
  const penaltyTaker = isSelected(saved?.penaltyTakerId) ? saved!.penaltyTakerId : bestSetPiecePlayer(candidates, (player) => (player.attributes?.finishing ?? 50) * 0.58 + (player.attributes?.composure ?? 50) * 0.42)?.id ?? "";
  return {
    cornerDelivery: CORNER_DELIVERIES.includes(saved?.cornerDelivery as CornerDelivery) ? saved!.cornerDelivery : "Inswinging",
    cornerTakerId: cornerTaker,
    cornerTargetId: cornerTarget,
    freeKickRoutine: FREE_KICK_ROUTINES.includes(saved?.freeKickRoutine as FreeKickRoutine) ? saved!.freeKickRoutine : "Whipped delivery",
    freeKickTakerId: freeKickTaker,
    penaltyTakerId: penaltyTaker,
    cornerDefence: CORNER_DEFENCES.includes(saved?.cornerDefence as CornerDefence) ? saved!.cornerDefence : "Hybrid",
  };
}

export function setSetPieceSelection(career: Career, field: keyof SetPiecePlan, value: string) {
  const plan = getSetPiecePlan(career);
  if (field === "cornerDelivery" && CORNER_DELIVERIES.includes(value as CornerDelivery)) plan.cornerDelivery = value as CornerDelivery;
  else if (field === "cornerDefence" && CORNER_DEFENCES.includes(value as CornerDefence)) plan.cornerDefence = value as CornerDefence;
  else if (field === "freeKickRoutine" && FREE_KICK_ROUTINES.includes(value as FreeKickRoutine)) plan.freeKickRoutine = value as FreeKickRoutine;
  else if (field === "cornerTakerId" && setPieceCandidates(career).some((player) => player.id === value)) plan.cornerTakerId = value;
  else if (field === "cornerTargetId" && setPieceCandidates(career).some((player) => player.id === value)) plan.cornerTargetId = value;
  else if (field === "freeKickTakerId" && setPieceCandidates(career).some((player) => player.id === value)) plan.freeKickTakerId = value;
  else if (field === "penaltyTakerId" && setPieceCandidates(career).some((player) => player.id === value)) plan.penaltyTakerId = value;
  else return career;
  return { ...career, setPiecePlan: plan };
}

export type SetPieceMatchEffects = { attackingXg: number; defendingXg: number };

/** The routine quality feeds the same expected-goals model used by both match modes. */
export function getSetPieceMatchEffects(career: Career): SetPieceMatchEffects {
  const plan = getSetPiecePlan(career);
  const candidates = setPieceCandidates(career);
  const player = (id: string) => candidates.find((candidate) => candidate.id === id);
  const cornerTaker = player(plan.cornerTakerId);
  const cornerTarget = player(plan.cornerTargetId);
  const freeKickTaker = player(plan.freeKickTakerId);
  const penaltyTaker = player(plan.penaltyTakerId);
  const cornerDelivery = cornerTaker?.attributes
    ? cornerTaker.attributes.crossing * 0.7 + cornerTaker.attributes.passing * 0.3
    : 50;
  const aerialThreat = cornerTarget
    ? (cornerTarget.attributes?.strength ?? 50) * 0.4 + (cornerTarget.attributes?.physical ?? 50) * 0.25 + cornerTarget.overall * 0.2 + (cornerTarget.position === "FWD" || cornerTarget.position === "DEF" ? 15 : 0)
    : 50;
  const cornerRoutineEdge = plan.cornerDelivery === "Inswinging" ? 0.035 : plan.cornerDelivery === "Short routine" ? 0.018 : 0.012;
  const freeKickQuality = freeKickTaker?.attributes
    ? plan.freeKickRoutine === "Direct shot"
      ? freeKickTaker.attributes.shooting * 0.55 + freeKickTaker.attributes.composure * 0.45
      : plan.freeKickRoutine === "Whipped delivery"
        ? freeKickTaker.attributes.crossing * 0.55 + freeKickTaker.attributes.passing * 0.45
        : freeKickTaker.attributes.passing * 0.55 + freeKickTaker.attributes.vision * 0.45
    : 50;
  const freeKickEdge = plan.freeKickRoutine === "Direct shot" ? 0.014 : 0.024;
  const penaltyQuality = penaltyTaker?.attributes ? (penaltyTaker.attributes.finishing + penaltyTaker.attributes.composure) / 2 : 50;
  const attack = 0.015 + (cornerDelivery - 50) * 0.00075 + (aerialThreat - 50) * 0.00055 + cornerRoutineEdge
    + (freeKickQuality - 50) * 0.00045 + freeKickEdge + (penaltyQuality - 50) * 0.00016;
  const defenders = candidates.filter((candidate) => candidate.position === "DEF" || candidate.position === "GK");
  const defensiveQuality = defenders.length
    ? defenders.reduce((sum, candidate) => sum + ((candidate.attributes?.defending ?? 50) * 0.55 + (candidate.attributes?.positioning ?? 50) * 0.45), 0) / defenders.length
    : 50;
  const defenceShapeEdge = plan.cornerDefence === "Hybrid" ? 0.045 : plan.cornerDefence === "Zonal" ? 0.03 : 0.018;
  return {
    attackingXg: Math.round(Math.max(0, Math.min(0.24, attack)) * 1000) / 1000,
    defendingXg: Math.round(Math.max(0, Math.min(0.12, 0.035 + (defensiveQuality - 50) * 0.00055 + defenceShapeEdge)) * 1000) / 1000,
  };
}

function managedClubPower(career: Career, clubId: string, minute: number, plan: MatchdayManagementPlan) {
  let power = clubPower(career, clubId);
  const original = fixtureXI(career, clubId);
  const current = playersOnPitch(career, clubId, minute, plan);
  const average = (players: Player[]) => players.length ? players.reduce((sum, player) => sum + player.overall, 0) / players.length : 0;
  const redCards = career.activeMatch?.events.filter((event) => event.type === "red-card" && event.clubId === clubId).length ?? 0;
  power += (average(current) - average(original)) * 0.22 - redCards * 4.5;
  if (clubId !== career.clubId) return power;
  power += getTeamTalkPerformanceAdjustment(career, plan.teamTalk ?? career.teamTalk ?? "Encouraging");
  return power;
}

export function getTeamTalkPerformanceAdjustment(career: Career, talk: NonNullable<Career["teamTalk"]>) {
  const xi = fixtureXI(career, career.clubId);
  const rapport = xi.length ? xi.reduce((sum, player) => sum + (player.managerRapport ?? 58), 0) / xi.length : 58;
  if (talk === "Calm") return (career.pressure ?? 18) >= 62 ? 0.34 : 0.05;
  if (talk === "Encouraging") return Math.max(0.08, Math.min(0.42, 0.26 + (62 - rapport) * 0.009));
  return rapport >= 68 ? 0.4 : -0.58;
}

function sortMatchEvents(events: MatchEvent[]) {
  const priority = (type: MatchEventType) => type === "goal" || type === "yellow-card" || type === "red-card" || type === "injury" ? 0 : type === "half-time" ? 1 : type === "tactical-change" ? 2 : type === "substitution" ? 3 : 4;
  return events.sort((first, second) => first.minute - second.minute || priority(first.type) - priority(second.type));
}

export function startManagedMatch(career: Career, plan: MatchdayManagementPlan, seed?: number) {
  if (career.activeMatch) return career;
  const next = normalizeCareer(career);
  if (next.round > getSeasonWeekCount(next)) return career;
  const fixture = next.fixtures.find((item) => item.round === next.round && !item.played && [item.homeClubId, item.awayClubId].includes(next.clubId));
  if (!fixture || !validateMatchdayManagementPlan(next, plan)) return career;
  const previousDate = getCalendarDate(career);
  next.calendarDate = fixture.date;
  addScoutingCompletionNews(next, previousDate, fixture.date);
  next.teamTalk = plan.teamTalk ?? next.teamTalk;
  const opponent = getClub(next, fixture.homeClubId === next.clubId ? fixture.awayClubId : fixture.homeClubId);
  const opponentStyle = selectAIManagerStyle(opponent, safeFootballStyle(next.style), next.season, next.round);
  const tacticalEvents: MatchEvent[] = opponentStyle !== (opponent.dna?.tacticalIdentity ?? "Possession") ? [{
    id: `${fixture.id}-${opponent.id}-scouting-plan`, minute: 1, type: "tactical-change", clubId: opponent.id,
    description: `${opponent.name} use a ${opponentStyle.toLowerCase()} plan to counter ${safeFootballStyle(next.style).toLowerCase()} football.`,
  }] : [];
  const liveMatch: ActiveManagedMatch = {
    fixtureId: fixture.id,
    seed: seed ?? (Date.now() ^ Math.floor(Math.random() * 0xffffffff)),
    minute: 0,
    homeGoals: 0,
    awayGoals: 0,
    events: tacticalEvents,
    stats: emptyMatchStats(),
    plan: structuredClone(plan),
    executedSubstitutions: [],
    playerRatings: Object.fromEntries([...fixtureXI(next, fixture.homeClubId), ...fixtureXI(next, fixture.awayClubId)].map((player) => [player.id, 6.2])),
  };
  // Lock the rest of the round at kick-off so the in-game score ticker and live
  // table show the same results that will be committed at full-time.
  const roundPreview = playMatchday(structuredClone(next), liveMatch.seed, liveMatch.plan);
  liveMatch.otherFixtureResults = roundPreview.fixtures
    .filter((item) => item.id !== fixture.id && item.leagueId === fixture.leagueId && item.round === fixture.round && item.played && item.homeGoals !== null && item.awayGoals !== null)
    .map((item) => ({ fixtureId: item.id, homeGoals: item.homeGoals!, awayGoals: item.awayGoals! }));
  next.activeMatch = liveMatch;
  return next;
}

export function setManagedMatchDirective(career: Career, directive: SecondHalfDirective) {
  const live = career.activeMatch;
  const allowed: SecondHalfDirective[] = ["Balanced", "Raise the press", "Protect the lead", "Overload the wings", "Keep possession"];
  if (!live || live.minute !== 45 || !allowed.includes(directive)) return career;
  const next = normalizeCareer(career);
  const state = next.activeMatch!;
  state.plan.secondHalfDirective = directive;
  state.events = state.events.filter((event) => event.minute !== 45 || event.type !== "tactical-change");
  if (directive !== "Balanced") {
    const fixture = next.fixtures.find((item) => item.id === state.fixtureId)!;
    state.events.push({ id: `${fixture.id}-directive`, minute: 45, type: "tactical-change", clubId: next.clubId, description: `Half-time instruction · ${directive}.` });
  }
  sortMatchEvents(state.events);
  return next;
}

export function addManagedMatchSubstitution(career: Career, minute: 45 | 60 | 75, playerOffId: string, playerOnId: string) {
  const live = career.activeMatch;
  if (!live || minute <= live.minute || ![45, 60, 75].includes(minute) || live.plan.substitutions.length >= 5) return career;
  const options = getLiveMatchSubstitutionOptions(career);
  const outgoing = options.starting.find((player) => player.id === playerOffId);
  const incoming = options.bench.find((player) => player.id === playerOnId);
  const nextPlan = { ...live.plan, substitutions: [...live.plan.substitutions, { minute, playerOffId, playerOnId }].sort((a, b) => a.minute - b.minute) };
  if (!outgoing || !incoming || outgoing.position !== incoming.position || !validateMatchdayManagementPlan(career, nextPlan)) return career;
  const next = normalizeCareer(career);
  next.activeMatch!.plan = nextPlan;
  return next;
}

export function advanceManagedMatch(career: Career) {
  const live = career.activeMatch;
  if (!live || live.minute >= 90) return career;
  const next = normalizeCareer(career);
  const state = next.activeMatch!;
  const fixture = next.fixtures.find((item) => item.id === state.fixtureId);
  if (!fixture || fixture.played) return career;
  const from = state.minute;
  const to = Math.min(90, from + 15);
  const duration = to - from;
  const home = getClub(next, fixture.homeClubId);
  const away = getClub(next, fixture.awayClubId);
  const userHome = fixture.homeClubId === next.clubId;
  const plans = state.plan;
  const homeStyle = home.id === next.clubId ? safeFootballStyle(next.style) : home.aiTactics?.style ?? home.dna?.tacticalIdentity ?? "Possession";
  const awayStyle = away.id === next.clubId ? safeFootballStyle(next.style) : away.aiTactics?.style ?? away.dna?.tacticalIdentity ?? "Possession";
  const homeBasePower = managedClubPower(next, home.id, to, plans) + tacticalStyleAdvantage(homeStyle, awayStyle);
  const awayBasePower = managedClubPower(next, away.id, to, plans) + tacticalStyleAdvantage(awayStyle, homeStyle);
  const userDirective = from >= 45 ? getSecondHalfDirectiveEffects(next, plans.secondHalfDirective) : { attack: 0, defence: 0 };
  const matchupPowers = getSecondHalfMatchupPowers(homeBasePower, awayBasePower, userHome, userDirective);
  const setPieceEffects = getSetPieceMatchEffects(next);
  const simulateSide = (club: Club, attack: number, defence: number, homeAdvantage: number) => {
    const random = randomFrom(stableSeed(`${state.seed}:${fixture.id}:live:${from}-${to}:${club.id}`));
    const setPieceAdjustment = club.id === career.clubId ? setPieceEffects.attackingXg : -setPieceEffects.defendingXg;
    const expectedNinety = Math.max(0.32, Math.min(3.05, 1.25 + (attack - defence) * 0.048 + homeAdvantage + setPieceAdjustment));
    const expected = expectedNinety * duration / 90;
    const goals = samplePoisson(expected, random);
    const players = playersOnPitch(next, club.id, to, plans);
    const events: MatchEvent[] = [];
    for (let index = 0; index < goals; index += 1) {
      const minute = from + 1 + Math.floor(random() * duration);
      const onField = playersOnPitch(next, club.id, minute, plans);
      const weighted = onField.map((player) => ({ player, weight: (player.position === "FWD" ? 5 : player.position === "MID" ? 3 : player.position === "DEF" ? 1.1 : 0.12) * (0.75 + player.overall / 100) }));
      const total = weighted.reduce((sum, item) => sum + item.weight, 0);
      let draw = random() * total;
      let scorer = weighted[0]?.player;
      for (const item of weighted) { draw -= item.weight; if (draw <= 0) { scorer = item.player; break; } }
      if (!scorer) continue;
      const assistPool = onField.filter((player) => player.id !== scorer!.id && player.position !== "GK");
      const assister = assistPool.length && random() < 0.72 ? assistPool[Math.floor(random() * assistPool.length)] : undefined;
      events.push({ id: `${fixture.id}-${club.id}-live-${minute}-goal-${index + 1}`, minute, type: "goal", clubId: club.id, playerId: scorer.id, playerName: scorer.name, assistPlayerId: assister?.id, assistPlayerName: assister?.name, x: club.id === home.id ? 90 + Math.floor(random() * 8) : 2 + Math.floor(random() * 8), y: 24 + Math.floor(random() * 53), description: assister ? `Goal! ${scorer.name} finishes a move created by ${assister.name}.` : `Goal! ${scorer.name} finds the net.` });
    }
    const cardMinute = from + 1 + Math.floor(random() * duration);
    const cardCandidates = players.filter((player) => player.position === "DEF" || player.position === "MID");
    if (cardCandidates.length && random() < 0.13) {
      const player = cardCandidates[Math.floor(random() * cardCandidates.length)];
      const bookedEarlier = state.events.some((event) => event.type === "yellow-card" && event.playerId === player.id);
      events.push({ id: `${fixture.id}-${club.id}-live-${cardMinute}-${bookedEarlier ? "red" : "yellow"}`, minute: cardMinute, type: bookedEarlier ? "red-card" : "yellow-card", clubId: club.id, playerId: player.id, playerName: player.name, x: 20 + Math.floor(random() * 61), y: 18 + Math.floor(random() * 65), description: bookedEarlier ? `Second yellow · ${player.name} is sent off.` : `Yellow card · ${player.name}` });
    }
    const shots = goals + 1 + Math.floor(random() * 3);
    const shotsOnTarget = Math.min(shots, goals + Math.floor(random() * 2));
    return { goals, expected, shots, shotsOnTarget, corners: Math.floor(random() * 3), possession: 42 + Math.floor(random() * 17), events, random };
  };
  const homePeriod = simulateSide(home, matchupPowers.homeAttack, matchupPowers.awayDefence, 0.18);
  const awayPeriod = simulateSide(away, matchupPowers.awayAttack, matchupPowers.homeDefence, 0);
  state.playerRatings ??= Object.fromEntries([...fixtureXI(next, home.id), ...fixtureXI(next, away.id)].map((player) => [player.id, 6.2]));
  const ratingRandom = randomFrom(stableSeed(`${state.seed}:${fixture.id}:ratings:${from}-${to}`));
  for (const [club, performance] of [[home, homePeriod], [away, awayPeriod]] as const) {
    for (const player of playersOnPitch(next, club.id, to, plans)) {
      const currentRating = state.playerRatings[player.id] ?? 6.2;
      const positionWeight = player.position === "FWD" ? 0.055 : player.position === "MID" ? 0.04 : player.position === "DEF" ? 0.025 : 0.01;
      const chanceImpact = Math.max(-0.12, Math.min(0.16, (performance.expected - 0.22) * positionWeight));
      state.playerRatings[player.id] = Math.round(Math.max(4, Math.min(10, currentRating + (ratingRandom() - 0.44) * 0.22 + chanceImpact)) * 10) / 10;
    }
  }
  state.homeGoals += homePeriod.goals;
  state.awayGoals += awayPeriod.goals;
  state.stats.home.shots += homePeriod.shots;
  state.stats.home.shotsOnTarget += homePeriod.shotsOnTarget;
  state.stats.home.expectedGoals = Math.round((state.stats.home.expectedGoals + homePeriod.expected) * 10) / 10;
  state.stats.home.corners += homePeriod.corners;
  state.stats.away.shots += awayPeriod.shots;
  state.stats.away.shotsOnTarget += awayPeriod.shotsOnTarget;
  state.stats.away.expectedGoals = Math.round((state.stats.away.expectedGoals + awayPeriod.expected) * 10) / 10;
  state.stats.away.corners += awayPeriod.corners;
  state.stats.home.possession = Math.round((state.stats.home.possession * from + homePeriod.possession * duration) / to);
  state.stats.away.possession = 100 - state.stats.home.possession;
  state.events.push(...homePeriod.events, ...awayPeriod.events);
  for (const event of [...homePeriod.events, ...awayPeriod.events]) {
    if (event.type === "goal" && event.playerId) state.playerRatings[event.playerId] = Math.min(10, Math.round(((state.playerRatings[event.playerId] ?? 6.2) + 0.75) * 10) / 10);
    if (event.type === "goal" && event.assistPlayerId) state.playerRatings[event.assistPlayerId] = Math.min(10, Math.round(((state.playerRatings[event.assistPlayerId] ?? 6.2) + 0.35) * 10) / 10);
    if (event.type === "yellow-card" && event.playerId) state.playerRatings[event.playerId] = Math.max(4, Math.round(((state.playerRatings[event.playerId] ?? 6.2) - 0.3) * 10) / 10);
    if (event.type === "red-card" && event.playerId) state.playerRatings[event.playerId] = 4;
  }
  for (const substitution of plans.substitutions) {
    if (substitution.minute <= from || substitution.minute > to) continue;
    const outgoing = next.players.find((player) => player.id === substitution.playerOffId);
    const incoming = next.players.find((player) => player.id === substitution.playerOnId);
    if (!outgoing || !incoming) continue;
    state.executedSubstitutions.push(substitution);
    state.playerRatings[incoming.id] ??= 6.2;
    state.events.push({ id: `${fixture.id}-${next.clubId}-sub-${substitution.minute}-${incoming.id}`, minute: substitution.minute, type: "substitution", clubId: next.clubId, playerId: incoming.id, playerName: incoming.name, description: `${outgoing.name} replaced by ${incoming.name}.` });
  }
  state.minute = to;
  if (to === 45) state.events.push({ id: `${fixture.id}-half-time`, minute: 45, type: "half-time", clubId: null, description: "Half-time" });
  if (to === 45 && plans.secondHalfDirective !== "Balanced") state.events.push({ id: `${fixture.id}-directive`, minute: 45, type: "tactical-change", clubId: next.clubId, description: `Half-time instruction · ${plans.secondHalfDirective}.` });
  if (to === 90) state.events.push({ id: `${fixture.id}-full-time`, minute: 90, type: "full-time", clubId: null, description: "Full-time" });
  sortMatchEvents(state.events);
  return next;
}

function simulateFixtureDetails(career: Career, fixture: Fixture, seed: number, managementPlan?: MatchdayManagementPlan, liveResult?: ActiveManagedMatch, playersByClub?: Map<string, Player[]>, playersById?: Map<string, Player>) {
  const home = getClub(career, fixture.homeClubId);
  const away = getClub(career, fixture.awayClubId);
  const homeXI = fixtureXI(career, home.id, playersByClub, playersById);
  const awayXI = fixtureXI(career, away.id, playersByClub, playersById);
  const userIsPlaying = fixture.homeClubId === career.clubId || fixture.awayClubId === career.clubId;
  const substitutions = userIsPlaying ? managementPlan?.substitutions ?? [] : [];
  const random = randomFrom(seed);
  const onFieldAt = (minute: number, xi: Player[], teamId: string) => {
    const dismissed = new Set(liveResult?.events.filter((event) => event.type === "red-card" && event.clubId === teamId && event.minute <= minute && event.playerId).map((event) => event.playerId) ?? []);
    const players = new Map(xi.filter((player) => !dismissed.has(player.id)).map((player) => [player.id, player]));
    for (const substitution of substitutions) {
      if (minute < substitution.minute) continue;
      if (dismissed.has(substitution.playerOffId)) continue;
      players.delete(substitution.playerOffId);
      const substitute = playersById?.get(substitution.playerOnId) ?? career.players.find((player) => player.id === substitution.playerOnId);
      if (substitute && !dismissed.has(substitute.id)) players.set(substitute.id, substitute);
    }
    return [...players.values()];
  };
  const goalsForSide = (teamId: string, goals: number) => {
    const club = getClub(career, teamId);
    const xi = teamId === home.id ? homeXI : awayXI;
    const events: MatchEvent[] = [];
    const sideSubs = teamId === career.clubId ? substitutions : [];
    const appearances = new Map<string, { player: Player; minutes: number }>();
    for (const player of xi) appearances.set(player.id, { player, minutes: 90 });
    const dismissalMinutes = new Map((liveResult?.events ?? []).filter((event) => event.type === "red-card" && event.clubId === teamId && event.playerId).map((event) => [event.playerId!, event.minute]));
    for (const [playerId, minute] of dismissalMinutes) {
      const dismissed = appearances.get(playerId);
      if (dismissed) dismissed.minutes = Math.max(0, Math.min(dismissed.minutes, minute));
    }
    for (const substitution of sideSubs) {
      const outgoing = appearances.get(substitution.playerOffId);
      if ((dismissalMinutes.get(substitution.playerOffId) ?? Infinity) <= substitution.minute) continue;
      const incoming = playersById?.get(substitution.playerOnId) ?? career.players.find((player) => player.id === substitution.playerOnId);
      if (outgoing) outgoing.minutes = substitution.minute;
      if (incoming) appearances.set(incoming.id, { player: incoming, minutes: 90 - substitution.minute });
      const outgoingPlayer = outgoing?.player;
      if (outgoingPlayer && incoming) events.push({
        id: `${fixture.id}-${teamId}-sub-${substitution.minute}-${incoming.id}`,
        minute: substitution.minute,
        type: "substitution",
        clubId: teamId,
        playerId: incoming.id,
        playerName: incoming.name,
        description: `${outgoingPlayer.name} replaced by ${incoming.name}.`,
      });
    }
    for (const { player, minutes } of appearances.values()) {
      if (minutes <= 0) continue;
      const teamStyle = teamId === career.clubId ? career.style : club.aiTactics?.style ?? club.dna?.tacticalIdentity ?? "Possession";
      const pressIntensity = teamId === career.clubId ? career.pressingIntensity ?? 55 : 55;
      const stamina = Math.max(0, Math.min(100, player.attributes?.stamina ?? 55));
      const matchLoad = (minutes / 90) * (20 + (teamStyle === "High press" ? pressIntensity * 0.045 : 0)) * (1.08 - stamina * 0.0016);
      player.condition = Math.max(0, Math.min(100, (player.condition ?? 100) - matchLoad));
      updatePlayerRecord(player, club.id, club.name, club.country, career.season, {
        appearances: 1,
        minutes,
        cleanSheets: (teamId === home.id ? fixture.awayGoals : fixture.homeGoals) === 0 && (player.position === "GK" || player.position === "DEF") ? 1 : 0,
      });
    }
    for (let index = 0; index < goals; index += 1) {
      const minute = 1 + Math.floor(random() * 89);
      const onField = onFieldAt(minute, xi, teamId);
      const weighted = onField.map((player) => ({ player, weight: (player.position === "FWD" ? 5 : player.position === "MID" ? 3 : player.position === "DEF" ? 1.1 : 0.12) * (0.75 + player.overall / 100) }));
      const total = weighted.reduce((sum, item) => sum + item.weight, 0);
      let draw = random() * total;
      let scorer = weighted[0]?.player;
      for (const item of weighted) { draw -= item.weight; if (draw <= 0) { scorer = item.player; break; } }
      if (!scorer) continue;
      const assistPool = onField.filter((player) => player.id !== scorer!.id && player.position !== "GK");
      const assister = assistPool.length && random() < 0.72 ? assistPool[Math.floor(random() * assistPool.length)] : undefined;
      creditPlayerStatistic(scorer, "goals", club.id, club.name, club.country, career.season);
      if (assister) creditPlayerStatistic(assister, "assists", club.id, club.name, club.country, career.season);
      events.push({
        id: `${fixture.id}-${teamId}-goal-${index + 1}`,
        minute,
        type: "goal",
        clubId: teamId,
        playerId: scorer.id,
        playerName: scorer.name,
        assistPlayerId: assister?.id,
        assistPlayerName: assister?.name,
        x: teamId === home.id ? 90 + Math.floor(random() * 8) : 2 + Math.floor(random() * 8),
        y: 24 + Math.floor(random() * 53),
        description: assister ? `Goal! ${scorer.name} finishes a move created by ${assister.name}.` : `Goal! ${scorer.name} finds the net.`,
      });
    }
    if (xi.length && random() < 0.77) {
      const cardMinute = 8 + Math.floor(random() * 79);
      const cardCandidates = onFieldAt(cardMinute, xi, teamId).filter((player) => player.position === "DEF" || player.position === "MID");
      const player = cardCandidates[Math.floor(random() * cardCandidates.length)];
      if (player) events.push({ id: `${fixture.id}-${teamId}-yellow`, minute: cardMinute, type: "yellow-card", clubId: teamId, playerId: player.id, playerName: player.name, x: 20 + Math.floor(random() * 61), y: 18 + Math.floor(random() * 65), description: `Yellow card · ${player.name}` });
    }
    return events;
  };

  if (liveResult) {
    // Record player minutes and appearances through the same path used by a quick-sim match,
    // then credit goals from the exact live timeline that produced the final score.
    goalsForSide(home.id, 0);
    goalsForSide(away.id, 0);
    for (const event of liveResult.events) {
      if (event.type !== "goal" || !event.playerId || !event.clubId) continue;
      const scorer = playersById?.get(event.playerId) ?? career.players.find((player) => player.id === event.playerId);
      const club = career.clubs.find((candidate) => candidate.id === event.clubId);
      if (scorer && club) creditPlayerStatistic(scorer, "goals", club.id, club.name, club.country, career.season);
      const assister = event.assistPlayerId ? playersById?.get(event.assistPlayerId) ?? career.players.find((player) => player.id === event.assistPlayerId) : null;
      if (assister && club) creditPlayerStatistic(assister, "assists", club.id, club.name, club.country, career.season);
    }
    return { events: structuredClone(liveResult.events), stats: structuredClone(liveResult.stats) };
  }

  const events = [
    ...goalsForSide(home.id, fixture.homeGoals ?? 0),
    ...goalsForSide(away.id, fixture.awayGoals ?? 0),
    ...(userIsPlaying && managementPlan && managementPlan.secondHalfDirective !== "Balanced" ? [{ id: `${fixture.id}-${career.clubId}-directive`, minute: 45, type: "tactical-change" as const, clubId: career.clubId, description: `Half-time instruction · ${managementPlan.secondHalfDirective}.` }] : []),
    { id: `${fixture.id}-half-time`, minute: 45, type: "half-time" as const, clubId: null, description: "Half-time" },
    { id: `${fixture.id}-full-time`, minute: 90, type: "full-time" as const, clubId: null, description: "Full-time" },
  ].sort((first, second) => {
    if (first.minute !== second.minute) return first.minute - second.minute;
    const priority = (type: MatchEventType) => type === "goal" || type === "yellow-card" || type === "red-card" || type === "injury" ? 0 : type === "half-time" ? 1 : type === "tactical-change" ? 2 : type === "substitution" ? 3 : 4;
    return priority(first.type) - priority(second.type);
  });
  const setPieceEffects = userIsPlaying ? getSetPieceMatchEffects(career) : { attackingXg: 0, defendingXg: 0 };
  const statLine = (goals: number, xgAdjustment: number): MatchTeamStats => {
    const shots = goals + 3 + Math.floor(random() * 9);
    const shotsOnTarget = Math.min(shots, goals + Math.floor(random() * 5));
    const expectedGoals = Math.round(Math.max(0.12, goals * 0.72 + shotsOnTarget * 0.18 + random() * 0.6 + xgAdjustment) * 10) / 10;
    return { shots, shotsOnTarget, possession: 0, corners: 2 + Math.floor(random() * 9), expectedGoals };
  };
  const homeStats = statLine(fixture.homeGoals ?? 0, home.id === career.clubId ? setPieceEffects.attackingXg : away.id === career.clubId ? -setPieceEffects.defendingXg : 0);
  const awayStats = statLine(fixture.awayGoals ?? 0, away.id === career.clubId ? setPieceEffects.attackingXg : home.id === career.clubId ? -setPieceEffects.defendingXg : 0);
  homeStats.possession = Math.max(34, Math.min(66, 48 + Math.floor(random() * 13)));
  awayStats.possession = 100 - homeStats.possession;
  return { events, stats: { home: homeStats, away: awayStats } };
}

export function estimateStadiumCommercialIncome(stadium: Stadium, reputation: number) {
  const plan = normalizeFacilityPlan(stadium.facilityPlan);
  const frontageYield = { "None": 0, "Club superstore": 4_800, Restaurant: 5_600, "Supporters bar": 3_700, "Club museum": 2_600 };
  const standFrontageIncome = Object.values(stadium.standFrontages ?? {}).reduce((sum, frontage) => sum + frontageYield[frontage], 0);
  const base = (stadium.carParkLevel ?? Number(stadium.carPark)) * 8500 * facilityRevenueFactor(plan.carPark)
    + (stadium.superstoreLevel ?? Number(stadium.superstore)) * 8000 * facilityRevenueFactor(plan.superstore)
    + (stadium.restaurantLevel ?? Number(stadium.restaurant)) * 12000 * facilityRevenueFactor(plan.restaurant)
    + (stadium.hotelLevel ?? Number(stadium.hotel)) * 18000 * facilityRevenueFactor(plan.hotel)
    + (stadium.fanZoneLevel ?? 0) * 9000 * facilityRevenueFactor(plan.fanZone)
    + (stadium.museumLevel ?? 0) * 4500 * facilityRevenueFactor(plan.museum)
    + (stadium.transportHubLevel ?? 0) * 6000 * facilityRevenueFactor(plan.transportHub)
    + standFrontageIncome
    + (stadium.ledBoardsLevel ?? 0) * 6500 + stadium.boxes * (350 + reputation * 1.2);
  return Math.round(base * (0.65 + reputation / 100));
}

export type ClubFinancialForecastYear = {
  year: number;
  income: number;
  expenditure: number;
  net: number;
  closingBalance: number;
  closingDebt: number;
};

function weeklyManagementPayroll(career: Career, club: Club) {
  const contract = !career.unemployed && career.managerContract?.clubId === club.id ? career.managerContract : null;
  const staff = (club.staff ?? []).filter((person) => !contract || person.role !== "First-Team Manager");
  return [...staff, ...(club.board ?? [])].reduce((sum, person) => sum + person.wage, 0) + (contract?.weeklyWage ?? 0);
}

/**
 * Ten-year planning estimate using the same gate, sponsor, stadium upkeep,
 * payroll and debt repayment rules as matchday finance. It assumes the club
 * keeps its current league place, squad, facilities and sponsor value; transfer
 * business and new borrowing are excluded.
 */
export function getClubFinancialForecast(career: Career, clubId = career.clubId, horizon = 10): ClubFinancialForecastYear[] {
  const club = career.clubs.find((item) => item.id === clubId) ?? getClub(career);
  const league = leagueDefinition(club.leagueId);
  const matches = league.rounds;
  const homeMatches = Math.floor(matches / 2);
  const table = getTable(career, club.leagueId);
  const position = Math.max(1, table.findIndex((row) => row.clubId === club.id) + 1);
  const economy = leagueEconomy(league.tier);
  const reputationScale = Math.max(0.72, Math.min(1.38, 0.58 + club.reputation / 125));
  const meritShare = (league.clubs - position) / Math.max(1, league.clubs - 1);
  const broadcast = Math.round((economy.annualBroadcast + economy.annualMerit * meritShare) * reputationScale);
  const sponsorship = (club.sponsorContracts ?? []).filter((contract) => contract.yearsRemaining > 0).reduce((sum, contract) => sum + contract.annual, 0) || club.sponsorAnnual;
  const attendance = Math.round(club.stadium.capacity * (0.42 + club.supporterConfidence / 190));
  const gate = Math.round(attendance * (13 + club.reputation * 0.11)) * homeMatches;
  const commercial = estimateStadiumCommercialIncome(club.stadium, club.reputation) * homeMatches;
  const activeLoans = (career.playerLoans ?? []).filter((loan) => loan.status === "Active" && (loan.parentClubId === club.id || loan.loanClubId === club.id));
  const incomingLoanIds = new Set(activeLoans.filter((loan) => loan.loanClubId === club.id).map((loan) => loan.playerId));
  const playerWages = career.players.filter((player) => player.clubId === club.id && !incomingLoanIds.has(player.id)).reduce((sum, player) => sum + player.wage, 0);
  const loanWages = activeLoans.reduce((sum, loan) => {
    const player = career.players.find((item) => item.id === loan.playerId);
    if (!player) return sum;
    const share = loan.wageContributionPercent / 100;
    return sum + player.wage * (loan.loanClubId === club.id ? share : 1 - share);
  }, 0);
  const staffWages = weeklyManagementPayroll(career, club);
  const annualPayroll = (playerWages + loanWages + staffWages) * matches;
  const s = club.stadium;
  const upkeepPerHomeMatch = Math.round((
    (s.groundskeepingLevel ?? 0) * 1600 + (s.securityLevel ?? 0) * 1200
    + (s.transportHubLevel ?? 0) * 900 + (s.carParkLevel ?? Number(s.carPark)) * 700
    + s.pitchQuality * 700
  ) * (s.underfloorHeating ? 1.18 : 1));
  const annualUpkeep = upkeepPerHomeMatch * homeMatches;
  const startingYear = Number(getCalendarDate(career).slice(0, 4)) || (2026 + career.season - 1);
  const years = Math.max(1, Math.min(10, Math.floor(horizon)));
  let balance = club.balance;
  let debt = club.debt;
  return Array.from({ length: years }, (_, index) => {
    const inflation = Math.pow(1.02, index);
    const wageInflation = Math.pow(1.03, index);
    const income = Math.round((broadcast + sponsorship + gate + commercial) * inflation);
    let repayment = 0;
    for (let match = 0; match < matches && debt > 0; match += 1) {
      const payment = Math.min(debt, Math.round(debt / 80));
      repayment += payment;
      debt -= payment;
    }
    const expenditure = Math.round((annualPayroll * wageInflation) + (annualUpkeep * inflation) + repayment);
    const net = income - expenditure;
    balance += net;
    return { year: startingYear + index, income, expenditure, net, closingBalance: balance, closingDebt: debt };
  });
}

export function playMatchday(career: Career, seed?: number, managementPlan?: MatchdayManagementPlan, liveResult?: ActiveManagedMatch): Career {
  if (career.unemployed) return career;
  if (career.activeMatch && career.activeMatch.minute < 90) return career;
  if (career.round > getSeasonWeekCount(career)) return career;
  const next: Career = normalizeCareer(career);
  const playersById = new Map(next.players.map((player) => [player.id, player]));
  const playersByClub = new Map<string, Player[]>();
  for (const player of next.players) {
    if (!player.clubId) continue;
    const roster = playersByClub.get(player.clubId) ?? [];
    roster.push(player);
    playersByClub.set(player.clubId, roster);
  }
  const injuriesAtRoundStart = new Set(next.players.filter((player) => (player.injuryWeeksRemaining ?? 0) > 0).map((player) => player.id));
  const suspensionsAtRoundStart = new Set(next.players.filter((player) => (player.suspensionMatchesRemaining ?? 0) > 0).map((player) => player.id));
  const fixtures = next.fixtures.filter((fixture) => fixture.round === next.round && !fixture.played);
  if (!fixtures.length) return next;
  const simulationSeed = seed ?? (Date.now() ^ Math.floor(Math.random() * 0xffffffff));
  const random = randomFrom(simulationSeed);
  const userFixture = fixtures.find((fixture) => fixture.homeClubId === next.clubId || fixture.awayClubId === next.clubId);
  const appliedPlan = managementPlan && userFixture && validateMatchdayManagementPlan(next, managementPlan) ? managementPlan : undefined;
  const preparation = getMatchPreparation(next);
  const userOpponent = userFixture ? getClub(next, userFixture.homeClubId === next.clubId ? userFixture.awayClubId : userFixture.homeClubId) : null;
  const userStartingXI = userFixture ? fixtureXI(next, next.clubId, playersByClub, playersById) : [];
  const userMatchParticipants = new Set(userStartingXI.map((player) => player.id));
  const debutingPlayers = userStartingXI.filter((player) => (player.careerStats?.appearances ?? 0) === 0);
  const appearanceMilestones = userStartingXI.filter((player) => [49, 99, 199, 299].includes(player.careerStats?.appearances ?? 0)).map((player) => ({ name: player.name, milestone: (player.careerStats?.appearances ?? 0) + 1 }));
  const notes: string[] = [];
  const AIResults: { clubId: string; result: "win" | "draw" | "loss"; date: string }[] = [];
  let userGoals = 0;
  let opponentGoals = 0;
  for (const fixture of fixtures) {
    const home = getClub(next, fixture.homeClubId);
    const away = getClub(next, fixture.awayClubId);
    const homeBaseStyle = home.id === next.clubId ? safeFootballStyle(next.style) : home.dna?.tacticalIdentity ?? "Possession";
    const awayBaseStyle = away.id === next.clubId ? safeFootballStyle(next.style) : away.dna?.tacticalIdentity ?? "Possession";
    const homeStyle = home.id === next.clubId ? safeFootballStyle(next.style) : selectAIManagerStyle(home, awayBaseStyle, next.season, next.round);
    const awayStyle = away.id === next.clubId ? safeFootballStyle(next.style) : selectAIManagerStyle(away, homeBaseStyle, next.season, next.round);
    const homeBasePower = clubPower(next, home.id, playersByClub, playersById);
    const awayBasePower = clubPower(next, away.id, playersByClub, playersById);
    let homePower = home.id === next.clubId ? homeBasePower : homeBasePower + aiTacticalMatchAdjustment(home, homeBasePower, awayBasePower);
    let awayPower = away.id === next.clubId ? awayBasePower : awayBasePower + aiTacticalMatchAdjustment(away, awayBasePower, homeBasePower);
    homePower += tacticalStyleAdvantage(homeStyle, awayStyle);
    awayPower += tacticalStyleAdvantage(awayStyle, homeStyle);
    if (fixture.id === userFixture?.id && !liveResult) {
      const teamTalkEdge = getTeamTalkPerformanceAdjustment(next, appliedPlan?.teamTalk ?? next.teamTalk ?? "Encouraging");
      if (fixture.homeClubId === next.clubId) homePower += teamTalkEdge;
      else awayPower += teamTalkEdge;
    }
    const lockedRoundResult = fixture.id !== userFixture?.id ? liveResult?.otherFixtureResults?.find((result) => result.fixtureId === fixture.id) : undefined;
    const setPieceEffects = fixture.id === userFixture?.id ? getSetPieceMatchEffects(next) : { attackingXg: 0, defendingXg: 0 };
    const homeSetPieceXg = home.id === next.clubId ? setPieceEffects.attackingXg : away.id === next.clubId ? -setPieceEffects.defendingXg : 0;
    const awaySetPieceXg = away.id === next.clubId ? setPieceEffects.attackingXg : home.id === next.clubId ? -setPieceEffects.defendingXg : 0;
    if (lockedRoundResult) {
      fixture.homeGoals = lockedRoundResult.homeGoals;
      fixture.awayGoals = lockedRoundResult.awayGoals;
    } else if (fixture.id === userFixture?.id && liveResult?.fixtureId === fixture.id && liveResult.minute === 90) {
      fixture.homeGoals = liveResult.homeGoals;
      fixture.awayGoals = liveResult.awayGoals;
    } else if (fixture.id === userFixture?.id && appliedPlan && appliedPlan.secondHalfDirective !== "Balanced") {
      const effects = getSecondHalfDirectiveEffects(next, appliedPlan.secondHalfDirective);
      const userIsHome = fixture.homeClubId === next.clubId;
      const secondHalfPowers = getSecondHalfMatchupPowers(homePower, awayPower, userIsHome, effects);
      fixture.homeGoals = goalsFor(homePower, awayPower, 0.18, random, 45, homeSetPieceXg)
        + goalsFor(secondHalfPowers.homeAttack, secondHalfPowers.awayDefence, 0.18, random, 45, homeSetPieceXg);
      fixture.awayGoals = goalsFor(awayPower, homePower, 0, random, 45, awaySetPieceXg)
        + goalsFor(secondHalfPowers.awayAttack, secondHalfPowers.homeDefence, 0, random, 45, awaySetPieceXg);
    } else {
      fixture.homeGoals = goalsFor(homePower, awayPower, 0.18, random, 90, homeSetPieceXg);
      fixture.awayGoals = goalsFor(awayPower, homePower, 0, random, 90, awaySetPieceXg);
    }
    fixture.played = true;
    const details = simulateFixtureDetails(next, fixture, stableSeed(`${simulationSeed}:${fixture.id}:match-report`), fixture.id === userFixture?.id ? (liveResult?.fixtureId === fixture.id ? liveResult.plan : appliedPlan) : undefined, fixture.id === userFixture?.id && liveResult?.fixtureId === fixture.id ? liveResult : undefined, playersByClub, playersById);
    if (fixture.id === userFixture?.id) {
      for (const event of details.events) if (event.type === "substitution" && event.playerId) userMatchParticipants.add(event.playerId);
    }
    const suspensionNoticesThisMatch = new Set<string>();
    for (const event of details.events) {
      if ((event.type !== "yellow-card" && event.type !== "red-card") || !event.playerId) continue;
      const player = playersById.get(event.playerId);
      if (!player) continue;
      const secondYellow = event.type === "red-card";
      if (event.type === "yellow-card" || secondYellow) {
        const previous = player.yellowCardsThisSeason ?? 0;
        const current = previous + 1;
        player.yellowCardsThisSeason = current;
        const threshold = [{ cards: 15, matches: 3 }, { cards: 10, matches: 2 }, { cards: 5, matches: 1 }].find((item) => previous < item.cards && current >= item.cards);
        if (threshold) {
          player.suspensionMatchesRemaining = Math.max(player.suspensionMatchesRemaining ?? 0, threshold.matches);
          event.description = `${event.description} · ${current} bookings this season; ${threshold.matches}-match suspension.`;
          if (player.clubId === next.clubId) {
            next.news.unshift({ id: `suspension-${next.season}-${next.round}-${player.id}`, date: dateLabel(fixture.date), headline: `${player.name} suspended after ${current} bookings`, body: `${player.name} receives a ${threshold.matches}-match suspension after reaching the ${current}-booking disciplinary threshold. The ban is saved to the squad and selection will exclude the player until served.`, type: "match" });
            suspensionNoticesThisMatch.add(player.id);
          }
        } else if (event.type === "yellow-card") {
          event.description = `${event.description} · ${current} booking${current === 1 ? "" : "s"} this season.`;
        }
      }
      if (secondYellow) {
        player.suspensionMatchesRemaining = Math.max(player.suspensionMatchesRemaining ?? 0, 1);
        event.description = `${event.description} · Suspended for the next match.`;
        if (player.clubId === next.clubId && !suspensionNoticesThisMatch.has(player.id)) next.news.unshift({ id: `red-card-${next.season}-${next.round}-${player.id}`, date: dateLabel(fixture.date), headline: `${player.name} sent off and suspended`, body: `${player.name} sees red after a second yellow card and will miss the next league fixture.`, type: "match" });
      }
    }
    const injuryEvents: MatchEvent[] = [];
    for (const team of [home, away]) {
      const available = fixtureXI(next, team.id, playersByClub, playersById);
      if (!available.length) continue;
      const averageCondition = available.reduce((sum, player) => sum + (player.condition ?? 100), 0) / available.length;
      const style = team.id === next.clubId ? next.style : team.aiTactics?.style ?? team.dna?.tacticalIdentity ?? "Possession";
      const intensity = team.id === next.clubId ? next.pressingIntensity ?? 55 : 55;
      const injuryChance = Math.min(0.14, 0.085 + Math.max(0, 78 - averageCondition) * 0.001 + (style === "High press" ? Math.max(0, intensity - 50) * 0.00035 : 0));
      if (random() >= injuryChance) continue;
      const weightedPlayers = available.map((player) => ({ player, weight: Math.max(0.25, 1 + (75 - (player.condition ?? 100)) * 0.012 + (55 - (player.attributes?.stamina ?? 55)) * 0.004) }));
      const totalWeight = weightedPlayers.reduce((sum, item) => sum + item.weight, 0);
      let injuryDraw = random() * totalWeight;
      let player = weightedPlayers[0].player;
      for (const item of weightedPlayers) { injuryDraw -= item.weight; if (injuryDraw <= 0) { player = item.player; break; } }
      const injury = ["hamstring strain", "ankle sprain", "calf strain", "groin injury", "knee knock"][Math.floor(random() * 5)];
      const weeks = random() < 0.18 ? 6 + Math.floor(random() * 5) : 1 + Math.floor(random() * 4);
      const minute = 12 + Math.floor(random() * 73);
      player.injury = injury;
      player.injuryWeeksRemaining = weeks;
      injuryEvents.push({ id: `${fixture.id}-${team.id}-injury-${player.id}`, minute, type: "injury", clubId: team.id, playerId: player.id, playerName: player.name, x: 35 + Math.floor(random() * 30), y: 22 + Math.floor(random() * 56), description: `${player.name} suffers a ${injury}; expected out for ${weeks} week${weeks === 1 ? "" : "s"}.` });
      if (team.id === next.clubId) {
        notes.push(`${player.name} suffers a ${injury}; the medical team expect ${weeks} week${weeks === 1 ? "" : "s"} out.`);
        next.news.unshift({ id: `${fixture.id}-${player.id}-injury-news`, date: dateLabel(fixture.date), headline: `${player.name} ruled out at ${team.name}`, body: `The medical team diagnose a ${injury}. The player is expected to miss ${weeks} week${weeks === 1 ? "" : "s"}.`, type: "match", urgent: weeks >= 5 });
      }
    }
    const tacticalEvents: MatchEvent[] = [];
    for (const [team, style, opponentStyle] of [[home, homeStyle, awayStyle], [away, awayStyle, homeStyle]] as const) {
      const identity = team.dna?.tacticalIdentity ?? "Possession";
      if (team.id === next.clubId || style === identity || liveResult?.events.some((event) => event.id === `${fixture.id}-${team.id}-scouting-plan`)) continue;
      tacticalEvents.push({ id: `${fixture.id}-${team.id}-scouting-plan`, minute: 1, type: "tactical-change", clubId: team.id, description: `${team.name} use a ${style.toLowerCase()} plan to counter ${opponentStyle.toLowerCase()} football.` });
    }
    fixture.events = [...details.events, ...injuryEvents, ...tacticalEvents].sort((first, second) => first.minute - second.minute);
    fixture.stats = details.stats;
    const homeOutcome = fixture.homeGoals > fixture.awayGoals ? "win" : fixture.homeGoals === fixture.awayGoals ? "draw" : "loss";
    const awayOutcome = homeOutcome === "win" ? "loss" : homeOutcome === "loss" ? "win" : "draw";
    if (home.id !== next.clubId) AIResults.push({ clubId: home.id, result: homeOutcome, date: fixture.date });
    if (away.id !== next.clubId) AIResults.push({ clubId: away.id, result: awayOutcome, date: fixture.date });
    if (home.id !== next.clubId) recordClubStyleResult(home, homeStyle, homeOutcome);
    if (away.id !== next.clubId) recordClubStyleResult(away, awayStyle, awayOutcome);
    const homeAdapted = home.id === next.clubId ? false : updateAIClubTactics(home, homeOutcome, next.season, next.round);
    const awayAdapted = away.id === next.clubId ? false : updateAIClubTactics(away, awayOutcome, next.season, next.round);
    for (const [team, adapted] of [[home, homeAdapted], [away, awayAdapted]] as const) {
      if (!adapted || team.reputation < 68) continue;
      next.news.unshift({ id: `ai-tactics-${next.season}-${next.round}-${team.id}`, date: dateLabel(fixture.date), headline: `${team.name} change their tactical approach`, body: `${team.name} move to ${team.aiTactics?.formation} with a ${team.aiTactics?.mentality.toLowerCase()} mentality after a difficult run. The manager is asking the squad to learn the revised system quickly.`, type: "club" });
    }
    if (fixture.id === userFixture?.id) {
      userGoals = fixture.homeClubId === next.clubId ? fixture.homeGoals : fixture.awayGoals;
      opponentGoals = fixture.homeClubId === next.clubId ? fixture.awayGoals : fixture.homeGoals;
      if (next.round === getCurrentLeague(next).rounds - 8) {
        const expiringContracts = next.players.filter((player) => player.clubId === next.clubId && player.age >= 16 && player.contractYears === 1);
        if (expiringContracts.length) {
          const names = expiringContracts.slice(0, 4).map((player) => player.name).join(", ");
          notes.push(`Contract deadline: ${names}${expiringContracts.length > 4 ? ` and ${expiringContracts.length - 4} others` : ""} can leave at season end unless new terms are agreed.`);
          next.news.unshift({ id: `contract-watch-${next.season}-${next.clubId}`, date: dateLabel(fixture.date), headline: `${expiringContracts.length} contracts enter their final year`, body: `${names}${expiringContracts.length > 4 ? ` and ${expiringContracts.length - 4} others` : ""} can negotiate with other clubs as the season ends. Open contract talks before the final matchday.`, type: "transfer" });
        }
      }
      notes.push(userGoals > opponentGoals ? "The dressing room leaves with three points." : userGoals === opponentGoals ? "A hard-earned point keeps the season moving." : "The squad will be asked to respond next week.");
      notes.push(`${home.name} ${fixture.homeGoals}–${fixture.awayGoals} ${away.name}`);
      if (preparation?.plan) notes.push(preparation.feedback);
      if (appliedPlan?.secondHalfDirective && appliedPlan.secondHalfDirective !== "Balanced") notes.push(`Half-time instruction applied: ${appliedPlan.secondHalfDirective}.`);
      if (appliedPlan?.substitutions.length) notes.push(`Substitution plan completed: ${appliedPlan.substitutions.length} change${appliedPlan.substitutions.length === 1 ? "" : "s"}, with match minutes and events recorded.`);
      if (userOpponent && (getClub(next).rivals ?? []).includes(userOpponent.id)) notes.push(`Derby context: ${userOpponent.name} are one of ${getClub(next).name}'s established rivals.`);
      if (debutingPlayers.length) notes.push(`First-team debut${debutingPlayers.length === 1 ? "" : "s"} for ${debutingPlayers.slice(0, 3).map((player) => player.name).join(", ")}${debutingPlayers.length > 3 ? ` and ${debutingPlayers.length - 3} more` : ""}.`);
      const scorers = details.events.filter((event) => event.type === "goal" && event.clubId === next.clubId).map((event) => event.playerName).filter((name): name is string => Boolean(name));
      if (scorers.length) notes.push(`Scorers: ${scorers.join(", ")}.`);
      const formerClubScorer = details.events.find((event) => event.type === "goal" && event.clubId === next.clubId && event.playerId && next.players.find((player) => player.id === event.playerId)?.clubHistory?.some((record) => record.clubId === userOpponent?.id && record.toSeason !== null));
      if (formerClubScorer?.playerName && userOpponent) notes.push(`${formerClubScorer.playerName} scores against a former club, ${userOpponent.name}.`);
      if (appearanceMilestones.length) notes.push(`${appearanceMilestones.slice(0, 2).map((item) => `${item.name} reaches ${item.milestone} first-team appearances`).join(" · ")}.`);
    }
  }
  const userClub = getClub(next);
  const outcome = userGoals > opponentGoals ? "win" : userGoals === opponentGoals ? "draw" : "loss";
  if (userFixture) recordManagerCareerMatch(next, outcome);
  if (userFixture && userOpponent) {
    const opponentResult = outcome === "win" ? "loss" : outcome === "loss" ? "win" : "draw";
    for (const player of playersByClub.get(userOpponent.id) ?? []) {
      if (player.age < 16) continue;
      player.morale = Math.max(20, Math.min(100, player.morale + (opponentResult === "loss" ? -3 : 2)));
      player.managerRapport = Math.max(0, Math.min(100, (player.managerRapport ?? 58) + (opponentResult === "loss" ? -1 : 1)));
    }
  }
  for (const matchResult of AIResults) {
    const club = getClub(next, matchResult.clubId);
    updateAIManagerAfterResult(next, club, matchResult.result, next.season, next.round, matchResult.date, playersByClub.get(club.id) ?? []);
  }
  const matchdayStyleFit = dnaStyleFit(userClub.dna ?? createClubDNA(userClub.id, userClub.name, userClub.reputation), next.style);
  if (userFixture) recordClubStyleResult(userClub, next.style, outcome);
  if (userFixture && outcome === "win") {
    userClub.boardTrust = Math.min(100, userClub.boardTrust + 3);
    userClub.supporterConfidence = Math.min(100, userClub.supporterConfidence + 4);
    next.managerReputation = Math.min(100, next.managerReputation + 2);
    next.winlessRun = 0;
  } else if (userFixture && outcome === "draw") {
    userClub.boardTrust = Math.min(100, userClub.boardTrust + 1);
    userClub.supporterConfidence = Math.min(100, userClub.supporterConfidence + 1);
    next.winlessRun = (next.winlessRun ?? 0) + 1;
  } else if (userFixture) {
    userClub.boardTrust = Math.max(0, userClub.boardTrust - 4);
    const dna = userClub.dna ?? createClubDNA(userClub.id, userClub.name, userClub.reputation);
    const supporterBacklash = matchdayStyleFit < 45 && supporterStyleAffinity(dna, next.style) < 50
      ? dna.identityStrength >= 80 ? 2 : 1
      : 0;
    const supporterShield = getResponsibilityEffects(next).supporterConfidenceShield;
    userClub.supporterConfidence = Math.max(0, userClub.supporterConfidence - 3 - supporterBacklash + supporterShield);
    next.managerReputation = Math.max(0, next.managerReputation - 1);
    next.winlessRun = (next.winlessRun ?? 0) + 1;
  }
  if (userFixture) {
    const leaders = getLeadershipDynamics(next);
    const captainSupport = (leaders.captain?.managerRapport ?? 58) >= 68 ? 1 : 0;
    const resultTension = outcome === "win" ? -3 - captainSupport : outcome === "draw" ? 1 : 4 + (leaders.captain?.personality === "Fiery" ? 2 : 0) + Math.min(4, Math.floor((next.winlessRun ?? 0) / 3));
    userClub.dressingRoomTension = Math.max(0, Math.min(100, (userClub.dressingRoomTension ?? 12) + resultTension));
    if (userClub.dressingRoomTension >= 48) notes.push("Frustration is spreading through the dressing room; a strong response is needed to restore unity.");
    else if (leaders.matchImpact >= 0.65) notes.push("The captain's leadership and strong player connections helped the starting XI play as a unit.");
    updateManagerPromisesAfterMatch(next, outcome, userStartingXI);
  }

  const userHome = Boolean(userFixture && userFixture.homeClubId === next.clubId);
  const attendance = Math.round(userClub.stadium.capacity * (0.42 + userClub.supporterConfidence / 190));
  const gate = userHome ? Math.round(attendance * (13 + userClub.reputation * 0.11)) : 0;
  const activeLoans = getActivePlayerLoans(next, next.clubId);
  const incomingLoanIds = new Set(activeLoans.filter((loan) => loan.loanClubId === next.clubId).map((loan) => loan.playerId));
  const playerWages = next.players.filter((player) => player.clubId === next.clubId && !incomingLoanIds.has(player.id)).reduce((sum, player) => sum + player.wage, 0);
  const loanWages = activeLoans.reduce((sum, loan) => {
    const loanPlayer = next.players.find((player) => player.id === loan.playerId);
    if (!loanPlayer) return sum;
    const contribution = loan.wageContributionPercent / 100;
    return sum + loanPlayer.wage * (loan.loanClubId === next.clubId ? contribution : 1 - contribution);
  }, 0);
  const staffWages = weeklyManagementPayroll(next, userClub);
  const wages = playerWages + loanWages + staffWages;
  const contractedAnnual = userClub.sponsorContracts!.reduce((sum, contract) => sum + contract.annual, 0);
  const sponsor = Math.round((contractedAnnual || userClub.sponsorAnnual) / getCurrentLeague(next).rounds);
  const commercialIncome = userHome ? estimateStadiumCommercialIncome(userClub.stadium, userClub.reputation) : 0;
  const groundsUpkeep = userHome ? Math.round((userClub.stadium.groundskeepingLevel! * 1600 + userClub.stadium.securityLevel! * 1200 + userClub.stadium.transportHubLevel! * 900 + userClub.stadium.carParkLevel! * 700 + userClub.stadium.pitchQuality * 700) * (userClub.stadium.underfloorHeating ? 1.18 : 1)) : 0;
  const repayment = Math.min(userClub.debt, Math.round(userClub.debt / 80));
  const net = gate + sponsor + commercialIncome - wages - repayment - groundsUpkeep;
  userClub.debt -= repayment;
  userClub.balance += net;
  userClub.transferBudget = Math.max(0, userClub.transferBudget + Math.round(net * 0.15));
  const worldDate = fixtures[0]?.date ?? "01 Jul 2026";
  next.finance.unshift({ date: dateLabel(userFixture?.date ?? worldDate), label: userFixture ? `${userHome ? "Gate, commercial & sponsor" : "Away matchday"} · wages · upkeep` : "World week · sponsorship · wages · upkeep", amount: net });
  if (userHome) {
    userClub.stadium.pitchCondition = Math.max(35, (userClub.stadium.pitchCondition ?? 82) - (userClub.stadium.underfloorHeating ? 1 : 2) + Math.floor(userClub.stadium.groundskeepingLevel! / 2));
    if (userClub.stadium.pitchCondition < 55) notes.push("The grounds team reports a tired pitch. Relaying or raising the maintenance level will help.");
  }
  const responsibilityEffects = getResponsibilityEffects(next);
  for (const player of next.players.filter((item) => item.clubId === next.clubId)) {
    if (userFixture) {
      const rolePractice = (userMatchParticipants.has(player.id) ? 1.15 : 0) + (player.trainingFocus === "Tactical" ? 0.6 : 0);
      if (rolePractice > 0) player.roleFamiliarity = Math.min(100, (player.roleFamiliarity ?? 55) + rolePractice);
      player.morale = Math.max(20, Math.min(100, player.morale + (userGoals >= opponentGoals ? 2 : -3)));
      player.managerRapport = Math.max(0, Math.min(100, (player.managerRapport ?? 58) + (next.teamTalk === "Demanding" ? (userGoals > opponentGoals ? 2 : -2) : next.teamTalk === "Calm" ? 1 : userGoals >= opponentGoals ? 2 : -1)));
      const contractRole = player.contractRole ?? defaultContractSquadRole(player);
      const roleExpectation = CONTRACT_ROLE_LEVEL[contractRole];
      if (next.lineup.includes(player.id)) {
        if (roleExpectation >= CONTRACT_ROLE_LEVEL["First team"]) {
          player.morale = Math.min(100, player.morale + 1);
          player.managerRapport = Math.min(100, (player.managerRapport ?? 58) + 1);
        }
      } else if (roleExpectation >= CONTRACT_ROLE_LEVEL["First team"]) {
        const frustration = roleExpectation - CONTRACT_ROLE_LEVEL["Rotation"];
        player.morale = Math.max(20, player.morale - frustration);
        player.managerRapport = Math.max(0, (player.managerRapport ?? 58) - frustration);
      }
    }
    const technicalPlan = ["Technical", "Tactical", "Physical", "Finishing", "Goalkeeping", "Fundamentals"].includes(player.trainingFocus);
    const academyDirector = responsibilityAbility(next, "academyDevelopment");
    const youthCoaching = player.age < 21 ? Math.max(-0.025, Math.min(0.055, (academyDirector - 50) * 0.0015)) : 0;
    const trainingGroundBonus = Math.min(0.03, (userClub.stadium.trainingCentreLevel ?? 0) * 0.003 + (userClub.stadium.trainingPitchesLevel ?? 0) * 0.002 + userClub.trainingLevel * 0.002);
    const trainingBoost = player.trainingFocus === "Rest" ? 0 : Math.max(0, (technicalPlan ? 0.035 : 0.012) + youthCoaching + trainingGroundBonus + responsibilityEffects.trainingBonus);
    const trainingTargets = TRAINING_ATTRIBUTE_TARGETS[player.trainingFocus] ?? [];
    const ageTrainingFactor = player.age < 13 ? 0.65 : player.age < 18 ? 1.15 : player.age < 24 ? 1 : player.age < 29 ? 0.62 : 0;
    const facilityFactor = 1 + Math.min(0.4, (userClub.stadium.trainingCentreLevel ?? 0) * 0.025 + (userClub.stadium.trainingPitchesLevel ?? 0) * 0.02 + userClub.trainingLevel * 0.015);
    const coachingFactor = player.age < 21
      ? Math.max(0.82, Math.min(1.18, 1 + (academyDirector - 50) * 0.003))
      : Math.max(0.85, Math.min(1.18, 1 + responsibilityEffects.trainingBonus * 2));
    if (player.trainingFocus !== "Rest" && ageTrainingFactor > 0 && trainingTargets.length) {
      player.attributeGrowth ??= {};
      player.attributeTrainingProgress ??= {};
      const baseline = profileAttributes(player.id, player.overall, player.position, player.attributeGrowth);
      const progressPerSession = (ATTRIBUTE_TRAINING_RATE[player.trainingFocus] ?? 0.012) * ageTrainingFactor * facilityFactor * coachingFactor;
      for (const key of trainingTargets) {
        if (baseline[key] >= 99) continue;
        const progress = (player.attributeTrainingProgress[key] ?? 0) + progressPerSession;
        const earned = Math.floor(progress);
        if (earned > 0) {
          const increase = Math.min(earned, 99 - baseline[key]);
          player.attributeGrowth[key] = (player.attributeGrowth[key] ?? 0) + increase;
          player.attributeTrainingProgress[key] = increase < earned ? 0 : progress - earned;
        } else player.attributeTrainingProgress[key] = progress;
      }
    }
    if (player.age < 29 && player.overall < player.potential && random() < trainingBoost) player.overall += 1;
    player.attributes = profileAttributes(player.id, player.overall, player.position, player.attributeGrowth);
    player.value = Math.round(Math.max(25000, (player.overall - 35) ** 2 * 1800) / 1000) * 1000;
  }
  if (userClub.stadium.project) {
    userClub.stadium.project.weeksLeft -= 1;
    if (userClub.stadium.project.weeksLeft <= 0) {
      const project = userClub.stadium.project;
      const updates = project.upgrades;
      Object.assign(userClub.stadium, updates);
      userClub.stadium.project = null;
      next.news.unshift({ id: `build-${Date.now()}`, date: dateLabel(userFixture?.date ?? worldDate), headline: `${project.name} complete at ${userClub.stadium.name}`, body: "Supporters get their first look around the finished ground.", type: "stadium" });
    }
  }
  if (userFixture) next.tacticalFamiliarity = Math.min(100, (next.tacticalFamiliarity ?? 55) + 1.4);
  if (userFixture) next.matchPreparation = undefined;
  if (userFixture) {
  const table = getTable(next, userClub.leagueId);
  const position = table.findIndex((row) => row.clubId === next.clubId) + 1;
  const expectationMultiplier = 0.86 + userClub.reputation / 250;
  const pressChange = outcome === "win" ? -8 : outcome === "draw" ? 4 : 12;
  next.pressPressure = Math.max(0, Math.min(100, (next.pressPressure ?? 12) + pressChange * expectationMultiplier));
  const signals = getBoardPressureSignals(next);
  const resultPressure = (outcome === "win" ? -7.5 : outcome === "draw" ? 2 : 8.5) * expectationMultiplier;
  const supportingPressure = signals.form + signals.press * 0.62 + signals.supporters * 0.65 + signals.players * 0.7 + signals.dressingRoom * 0.55 + signals.board * 0.55 + signals.expectations * 0.8;
  next.pressure = Math.max(0, Math.min(100, (next.pressure ?? 18) + resultPressure + supportingPressure));
  if (signals.players >= 3) notes.push("Senior players' rapport with the manager is low, reducing the team's belief and increasing board concern.");
  if (outcome !== "win" && (next.pressPressure ?? 0) >= 54) {
      next.news.unshift({ id: `press-${Date.now()}`, date: dateLabel(userFixture.date), headline: `Results bring sharper scrutiny at ${userClub.name}`, body: "Supporters and local reporters are asking whether the current plan can deliver the club's season target.", type: "press", urgent: (next.pressPressure ?? 0) >= 70 });
  }
  const opponent = getClub(next, userFixture.homeClubId === next.clubId ? userFixture.awayClubId : userFixture.homeClubId);
  const score = `${userGoals}–${opponentGoals}`;
  const headline = `${userClub.name} ${userGoals > opponentGoals ? "back among the winners" : userGoals === opponentGoals ? "share the points" : "suffer a setback"}`;
  next.lastReport = { fixtureId: userFixture.id, result: score, headline, notes };
  next.news.unshift({ id: `match-${Date.now()}`, date: dateLabel(userFixture.date), headline, body: `${userGoals > opponentGoals ? "Victory lifts" : userGoals === opponentGoals ? "The draw leaves" : "The defeat leaves"} the club ${position === 1 ? "top of the table" : `in ${position}${position === 2 ? "nd" : position === 3 ? "rd" : "th"} place`}.`, type: "match" });
  next.news = next.news.slice(0, 28);
  if ((next.pressure ?? 0) >= privateBoardTolerance(userClub)) {
    next.unemployed = true;
    endManagerCareerAppointment(next, "Dismissed", next.round);
    next.managerContract = null;
    next.news.unshift({ id: `sacked-${Date.now()}`, date: dateLabel(userFixture.date), headline: `${next.manager} leaves ${userClub.name}`, body: "After reviewing the club's results, media scrutiny, supporter confidence and dressing-room mood, the board has ended the manager's tenure.", type: "club", urgent: true });
  }
  } else {
    next.lastReport = null;
  }
  refreshClubBoardAgenda(next);
  for (const player of next.players) {
    if (!injuriesAtRoundStart.has(player.id) || (player.injuryWeeksRemaining ?? 0) <= 0) continue;
    player.injuryWeeksRemaining = Math.max(0, player.injuryWeeksRemaining! - 1);
    if (player.injuryWeeksRemaining === 0) player.injury = null;
  }
  const clubsThatPlayed = new Set(fixtures.flatMap((fixture) => [fixture.homeClubId, fixture.awayClubId]));
  for (const player of next.players) {
    if (!player.clubId || !clubsThatPlayed.has(player.clubId)) continue;
    const recovery = (player.injuryWeeksRemaining ?? 0) > 0 ? 10 : player.trainingFocus === "Rest" ? 24 : 16;
    player.condition = Math.min(100, (player.condition ?? 100) + recovery);
  }
  for (const player of next.players) {
    const servedClubId = player.clubId;
    if (!suspensionsAtRoundStart.has(player.id) || !servedClubId || !clubsThatPlayed.has(servedClubId) || (player.suspensionMatchesRemaining ?? 0) <= 0) continue;
    player.suspensionMatchesRemaining = Math.max(0, player.suspensionMatchesRemaining! - 1);
    if (player.suspensionMatchesRemaining === 0 && servedClubId === next.clubId) next.news.unshift({ id: `suspension-served-${next.season}-${next.round}-${player.id}`, date: dateLabel(fixtures.find((fixture) => fixture.homeClubId === servedClubId || fixture.awayClubId === servedClubId)?.date ?? getCalendarDate(next)), headline: `${player.name} returns from suspension`, body: `${player.name} has served the suspension and is available for selection again.`, type: "match" });
  }
  if (next.round === 23) simulateAIWinterTransferWindow(next);
  next.calendarDate = userFixture?.date ?? fixtures[0]?.date ?? next.calendarDate;
  maybeGenerateIncomingTransferBid(next, next.calendarDate, simulationSeed);
  next.round += 1;
  settleDuePlayerLoans(next);
  next.activeMatch = null;
  return next;
}

export function finishManagedMatch(career: Career) {
  const live = career.activeMatch;
  if (!live || live.minute < 90) return career;
  return playMatchday(career, live.seed, live.plan, live);
}

function playoffWinner(career: Career, leagueId: LeagueId, table: ReturnType<typeof getTable>, places: number[]) {
  const candidates = table.filter((_, index) => places.includes(index + 1));
  return candidates.sort((first, second) => {
    const rating = (clubId: string, row: (typeof candidates)[number]) => {
      const club = getClub(career, clubId);
      const goalDifference = row.goalsFor - row.goalsAgainst;
      const seasonTieBreak = stableSeed(`${career.season}:${leagueId}:${clubId}`) % 100 / 100;
      return row.points + club.reputation * 0.4 + goalDifference * 0.08 + seasonTieBreak * 3;
    };
    return rating(second.clubId, second) - rating(first.clubId, first);
  })[0]?.clubId;
}

function makeRegionalEntrant(career: Career, leagueId: "national-north" | "national-south", season: number, index: number): { club: Club; players: Player[] } {
  const north = leagueId === "national-north";
  const bases = north
    ? ["Mossfield", "Caldershaw", "Ashbank", "Rookfell", "Brackenby", "Fellbridge", "Kirkstead", "Greyhaven", "Linton Cross", "Burnethorpe", "Hartsfell", "Staveley Reach", "Keldmouth", "Wrenborough", "Whitwell", "Alder Beck"]
    : ["Fernleigh", "Cranmere", "Averton", "Hazelwick", "Elmstead", "Southmere", "Bellport", "Gorsefield", "Duncombe", "Roselands", "Port Amber", "Willow Cross", "Marlin Quay", "Havenstow", "Mallow Down", "Briarby"];
  const baseCity = bases[(season * 3 + index) % bases.length];
  const city = season > 1 ? `${baseCity} ${["Ridge", "Cross", "Quay", "Down", "Gate", "Reach"][((season - 2) * 5 + index) % 6]}` : baseCity;
  const id = `feeder-${north ? "n" : "s"}-${season}-${index + 1}`;
  const suffix = ["Athletic", "Town", "Rovers", "United", "City", "Albion", "Borough", "Wanderers", "County", "Harbour", "Rangers", "Vale", "Railway", "Phoenix"][((season + index) * 3) % 14];
  const name = `${city} ${suffix}`;
  const template = career.clubs.find((club) => club.leagueId === leagueId)!;
  const colors = [["#486b52", "#e9e0c6"], ["#9b483b", "#e7cb75"], ["#365f83", "#efe9dd"], ["#6c5682", "#ddd19f"]][(season + index) % 4] as [string, string];
  const region = north ? ["North West", "Yorkshire", "North East", "North Midlands"][index % 4] : ["South East", "South Coast", "London", "South West"][index % 4];
  const sponsor = `${city} Community Trust`;
  const staffStart = BASE_CLUB_STAFF_COUNT + Math.max(0, season - 2) * 96 + (north ? 0 : 48) + index * 12;
  const personnel = createClubPersonnel(id, name, staffStart);
  const club: Club = {
    ...structuredClone(template),
    id,
    shortName: id,
    name,
    city,
    leagueId,
    region,
    country: "England",
    colors,
    reputation: 22 + (index % 3),
    targetPosition: 17,
    foundedYear: 1890 + ((season * 9 + index * 13) % 100),
    nickname: north ? "the Pitmen" : "the Orchardmen",
    bio: `${name} represent ${city} and the surrounding communities. Founded in ${1890 + ((season * 9 + index * 13) % 100)}, the club earned promotion through the regional pyramid after years of volunteer-led football. Local partner ${sponsor} now helps them take the next step in ${region}.`,
    rivals: [],
    history: [{ year: 1890 + ((season * 9 + index * 13) % 100), title: "Club founded", detail: `${name} are established to represent ${city}.` }, { year: 2026 + season, title: "A regional breakthrough", detail: `${name} win promotion from the regional leagues and join the National League pyramid.` }],
    balance: 490_000,
    transferBudget: 125_000,
    wageBudget: 32_000,
    debt: 0,
    boardTrust: 66,
    supporterConfidence: 66,
    sponsor,
    sponsorAnnual: 105_000,
    sponsorOffer: null,
    sponsorContracts: [{ id: `feeder-sponsor-${id}`, company: sponsor, slot: "shirt", annual: 105_000, yearsRemaining: 1, signedSeason: season }],
    sponsorOffers: [],
    academyLevel: 1,
    trainingLevel: 1,
    scoutLevel: 1,
    aiTactics: createAIClubTactics(id, 22),
    ownerWealth: 0,
    staff: personnel.staff,
    board: personnel.board,
    badge: createClubBadge(id, colors, 1890 + ((season * 9 + index * 13) % 100)),
    stadium: {
      ...structuredClone(template.stadium), name: `${city} Park`, capacity: 5_800 + index * 250, tiers: 1, standing: true, roof: "Open sky", corners: false, seats: false, boxes: 2, floodlights: 2, pitchQuality: 2, drainage: 45,
      standTiers: { north: 1, east: 1, south: 1, west: 1 }, cornerStands: { northWest: false, northEast: false, southWest: false, southEast: false }, siteSetting: getStadiumSiteSetting(id, city, "England"), acquiredLand: [], project: null,
    },
  };
  const positions: Position[] = ["GK", "GK", "DEF", "DEF", "DEF", "DEF", "DEF", "MID", "MID", "MID", "MID", "MID", "FWD", "FWD", "FWD", "FWD", "FWD", "MID"];
  const random = randomFrom(stableSeed(id));
  const players = positions.map((position, playerIndex) => createPlayer(`${id}-${String(playerIndex + 1).padStart(2, "0")}`, id, position, 30, random, "England", 0.98));
  return { club, players };
}

function applyEnglishPromotionsAndRelegations(career: Career) {
  const formerLeagues = new Map(career.clubs.map((club) => [club.id, club.leagueId]));
  const tables = new Map<LeagueId, ReturnType<typeof getTable>>();
  for (const league of ENGLISH_LEAGUES) tables.set(league.id, getTable(career, league.id));
  const idsAt = (leagueId: LeagueId, places: number[]) => places.map((place) => tables.get(leagueId)?.[place - 1]?.clubId).filter((id): id is string => Boolean(id));
  const playOff = (leagueId: LeagueId, places: number[]) => {
    const winner = playoffWinner(career, leagueId, tables.get(leagueId) ?? [], places);
    return winner ? [winner] : [];
  };
  const promoted = new Map<LeagueId, string[]>([
    ["premier", [...idsAt("championship", [1, 2]), ...playOff("championship", [3, 4, 5, 6, 7, 8])]],
    ["championship", [...idsAt("league-one", [1, 2]), ...playOff("league-one", [3, 4, 5, 6])]],
    ["league-one", [...idsAt("league-two", [1, 2, 3]), ...playOff("league-two", [4, 5, 6, 7])]],
    ["league-two", [...idsAt("national", [1]), ...playOff("national", [2, 3, 4, 5, 6, 7])]],
    ["national", [...idsAt("national-north", [1]), ...playOff("national-north", [2, 3, 4, 5, 6, 7]), ...idsAt("national-south", [1]), ...playOff("national-south", [2, 3, 4, 5, 6, 7])]],
    ["national-north", []],
    ["national-south", []],
  ]);
  const relegated = new Map<LeagueId, string[]>([
    ["premier", idsAt("premier", [18, 19, 20])],
    ["championship", idsAt("championship", [22, 23, 24])],
    ["league-one", idsAt("league-one", [21, 22, 23, 24])],
    ["league-two", idsAt("league-two", [23, 24])],
    ["national", idsAt("national", [21, 22, 23, 24])],
    ["national-north", idsAt("national-north", [21, 22, 23, 24])],
    ["national-south", idsAt("national-south", [21, 22, 23, 24])],
  ]);

  for (const [leagueId, ids] of promoted) {
    for (const clubId of ids) getClub(career, clubId).leagueId = leagueId;
  }
  for (const [leagueIndex, league] of ENGLISH_LEAGUES.entries()) {
    if (leagueIndex < 4) {
      const down = relegated.get(league.id) ?? [];
      for (const clubId of down) getClub(career, clubId).leagueId = ENGLISH_LEAGUES[leagueIndex + 1].id;
    }
  }

  const nationalRelegated = relegated.get("national") ?? [];
  const geographicallyNorth = nationalRelegated.map((id) => getClub(career, id)).filter((club) => /north|york|midland/i.test(club.region)).map((club) => club.id);
  const northbound = [...geographicallyNorth.slice(0, 2), ...nationalRelegated.filter((id) => !geographicallyNorth.includes(id)).slice(0, Math.max(0, 2 - geographicallyNorth.length))];
  const southbound = nationalRelegated.filter((id) => !northbound.includes(id)).slice(0, 2);
  for (const clubId of northbound) getClub(career, clubId).leagueId = "national-north";
  for (const clubId of southbound) getClub(career, clubId).leagueId = "national-south";

  const replacementIds: string[] = [];
  for (const leagueId of ["national-north", "national-south"] as const) {
    for (const clubId of relegated.get(leagueId) ?? []) getClub(career, clubId).leagueId = leagueId === "national-north" ? "regional-north" : "regional-south";
    for (let index = 0; index < 4; index += 1) {
      const entrant = makeRegionalEntrant(career, leagueId, career.season + 1, index);
      career.clubs.push(entrant.club);
      career.players.push(...entrant.players);
      for (const person of [...(entrant.club.staff ?? []), ...(entrant.club.board ?? [])]) career.staffChanges![person.id] = entrant.club.id;
      replacementIds.push(entrant.club.name);
    }
  }
  for (const club of career.clubs) {
    const oldLeagueId = formerLeagues.get(club.id);
    if (!oldLeagueId || oldLeagueId === club.leagueId) continue;
    const oldLeague = oldLeagueId.startsWith("regional-") ? "Regional Step 3" : leagueDefinition(oldLeagueId).name;
    const newLeague = club.leagueId.startsWith("regional-") ? "Regional Step 3" : leagueDefinition(club.leagueId).name;
    const oldTier = oldLeagueId.startsWith("regional-") ? 7 : leagueDefinition(oldLeagueId).tier;
    const newTier = club.leagueId.startsWith("regional-") ? 7 : leagueDefinition(club.leagueId).tier;
    const promotedUp = newTier < oldTier;
    const year = 2026 + career.season - 1;
    club.history ??= [];
    club.history.push({ year, title: promotedUp ? "Promotion won" : "Relegation confirmed", detail: `${club.name} move from the ${oldLeague} to the ${newLeague} for the ${year + 1}–${String(year + 2).slice(-2)} season.` });
  }
  return { promoted, relegated, replacementIds };
}

function applyWorldPromotionsAndRelegations(career: Career) {
  const country = getClub(career).country;
  if (!country || country === "England") return null;
  const top = WORLD_LEAGUES.find((league) => league.country === country && league.tier === 1);
  const second = WORLD_LEAGUES.find((league) => league.country === country && league.tier === 2);
  if (!top || !second) return null;
  const topTeams = career.clubs.filter((club) => club.leagueId === top.id);
  const secondTeams = career.clubs.filter((club) => club.leagueId === second.id);
  if (topTeams.length !== top.clubs || secondTeams.length !== second.clubs) return null;

  const promotedIds = getTable(career, second.id).slice(0, second.promotionPlaces).map((row) => row.clubId);
  const relegatedIds = getTable(career, top.id).slice(-top.relegationPlaces).map((row) => row.clubId);
  for (const id of promotedIds) getClub(career, id).leagueId = top.id;
  for (const id of relegatedIds) getClub(career, id).leagueId = second.id;

  const year = 2026 + career.season - 1;
  for (const id of [...promotedIds, ...relegatedIds]) {
    const club = getClub(career, id);
    club.history ??= [];
    const promoted = promotedIds.includes(id);
    club.history.push({
      year,
      title: promoted ? "Promotion won" : "Relegation confirmed",
      detail: promoted
        ? `${club.name} finish in a promotion place in the ${second.name} and move to the ${top.name} for ${year + 1}–${String(year + 2).slice(-2)}.`
        : `${club.name} finish in a relegation place in the ${top.name} and move to the ${second.name} for ${year + 1}–${String(year + 2).slice(-2)}.`,
    });
  }
  return { country, promotedIds, relegatedIds };
}

const PREMIER_LEAGUE_ELITE_SPEND = 2_000_000_000;
const PREMIER_LEAGUE_ELITE_WEIGHTS = [1.16, 1.1, 1.05, 1, 0.94, 0.88];

function premierLeagueTopSix(career: Career) {
  return career.clubs.filter((club) => club.leagueId === "premier")
    .sort((first, second) => second.reputation - first.reputation || first.id.localeCompare(second.id))
    .slice(0, 6);
}

function fundPremierLeagueOwners(career: Career) {
  const topSix = premierLeagueTopSix(career);
  const weightTotal = PREMIER_LEAGUE_ELITE_WEIGHTS.reduce((sum, weight) => sum + weight, 0);
  const allocations = new Map<string, number>();
  topSix.forEach((club, index) => {
    const allocation = Math.round(PREMIER_LEAGUE_ELITE_SPEND * PREMIER_LEAGUE_ELITE_WEIGHTS[index] / weightTotal);
    allocations.set(club.id, allocation);
    club.ownerWealth = Math.max(club.ownerWealth ?? 0, [18, 15, 12, 9, 7, 5][index] * 1_000_000_000);
    club.balance += allocation;
    club.transferBudget += allocation;
    if (club.id === career.clubId) {
      career.finance.unshift({ date: "01 Jul", label: "Premier League ownership transfer fund", amount: allocation });
    }
  });
  for (const club of career.clubs.filter((item) => item.leagueId === "premier" && !allocations.has(item.id))) {
    const investment = 22_000_000 + Math.round(club.reputation * 240_000);
    club.ownerWealth = Math.max(club.ownerWealth ?? 0, 1_000_000_000);
    club.balance += investment;
    club.transferBudget += investment;
  }
  return allocations;
}

function weakestSeniorPosition(career: Career, club: Club) {
  const slots: Record<Position, number> = { GK: 1, DEF: 4, MID: 4, FWD: 2 };
  const senior = career.players.filter((player) => player.clubId === club.id && player.age >= 18 && (player.injuryWeeksRemaining ?? 0) === 0);
  return (Object.keys(slots) as Position[]).sort((first, second) => {
    const strength = (position: Position) => {
      const players = senior.filter((player) => player.position === position).sort((a, b) => b.overall - a.overall).slice(0, slots[position]);
      return players.reduce((sum, player) => sum + player.overall, 0) / slots[position];
    };
    return strength(first) - strength(second);
  })[0];
}

function eliteTransferFee(player: { value: number }, remainingBudget: number, slotsLeft: number) {
  const marketPrice = Math.round(player.value * 30 / 1_000_000) * 1_000_000;
  const reserveForLater = Math.max(0, slotsLeft - 1) * 42_000_000;
  return Math.min(marketPrice, Math.max(0, remainingBudget - reserveForLater));
}

function winterTransferFee(player: { value: number }, tier: number) {
  const multipliers = [12, 4.5, 2.5, 1.5, 0.75, 0.55, 0.4];
  return Math.round(player.value * (multipliers[Math.max(1, Math.min(7, tier)) - 1] ?? 0.4) / 1_000) * 1_000;
}

function findWorldRecruitmentTarget(
  career: Career,
  club: Club,
  random: () => number,
  usedPlayerIds: Set<string>,
  preferredPosition: Position,
  minimumOverall: number,
  maximumOverall: number,
  maximumFee: number,
  price: (player: NonNullable<ReturnType<typeof getWorldPlayerDetails>>) => number,
) {
  const existingIds = new Set(career.players.map((player) => player.id));
  const options: { player: NonNullable<ReturnType<typeof getWorldPlayerDetails>>; fee: number; score: number }[] = [];
  for (let attempt = 0; attempt < 220; attempt += 1) {
    const worldIndex = Math.floor(random() * WORLD_FIRST_TEAM_COUNT);
    const candidate = getWorldPlayerDetails(`world-${String(worldIndex + 1).padStart(5, "0")}`);
    if (!candidate || candidate.age < 18 || candidate.age > 31 || candidate.overall < minimumOverall || candidate.overall > maximumOverall) continue;
    if (!candidate.clubId || candidate.clubId === club.id || candidate.clubId === career.clubId || existingIds.has(candidate.id) || usedPlayerIds.has(candidate.id)) continue;
    const fee = price(candidate);
    if (fee <= 0 || fee > maximumFee) continue;
    const seller = career.clubs.find((item) => item.id === candidate.clubId);
    if (seller?.id === career.clubId) continue;
    const positionFit = candidate.position === preferredPosition ? 1 : 0;
    const targetOverall = minimumOverall + Math.min(5, Math.round((maximumOverall - minimumOverall) * 0.45));
    const ratingFit = Math.abs(candidate.overall - targetOverall);
    const score = positionFit * 18 - ratingFit * 2.3 - Math.max(0, candidate.age - 26) * 0.45 + random() * 1.2;
    options.push({ player: candidate, fee, score });
  }
  options.sort((first, second) => second.score - first.score || first.fee - second.fee || first.player.id.localeCompare(second.player.id));
  return options[0] ?? null;
}

function completeAITransfer(career: Career, club: Club, source: NonNullable<ReturnType<typeof getWorldPlayerDetails>>, fee: number, date: string) {
  const player = worldPlayerToPlayer(source);
  const seller = source.clubId ? career.clubs.find((item) => item.id === source.clubId) : null;
  const fromClubId = seller?.id ?? source.clubId;
  const fromClubName = seller?.name ?? source.clubName;
  if (seller) {
    seller.balance += fee;
    seller.transferBudget += Math.round(fee * 0.1);
  }
  club.balance -= fee;
  club.transferBudget = Math.max(0, club.transferBudget - fee);
  player.clubHistory ??= [];
  player.clubHistory.forEach((record) => { if (record.toSeason === null) record.toSeason = Math.max(1, career.season - 1); });
  player.clubId = club.id;
  player.contractYears = 4;
  player.contractRole = player.overall >= 78 ? "Star" : "Important";
  player.wage = Math.max(player.wage, Math.round((player.overall * 1_350 + (player.overall >= 78 ? 12_000 : 4_000)) / 1_000) * 1_000);
  player.value = fee;
  player.morale = Math.min(90, Math.max(70, player.morale));
  player.managerRapport = 70;
  player.squadLevel = "First team";
  player.clubHistory.push({ clubId: club.id, clubName: club.name, country: club.country, fromSeason: career.season, toSeason: null, squadLevel: "First team", appearances: 0, goals: 0, assists: 0, cleanSheets: 0 });
  career.players.push(player);
  const record: TransferRecord = { id: `ai-transfer-s${career.season}-${club.id}-${player.id}`, season: career.season, playerId: player.id, playerName: player.name, fromClubId, fromClubName, toClubId: club.id, toClubName: club.name, fee, date };
  career.transferHistory!.push(record);
  career.news.unshift({ id: record.id, date, headline: `${player.name} joins ${club.name}`, body: `${fromClubName} receive ${formatMoney(fee)} as ${club.name} add a ${player.overall}-rated ${player.position} to their first team.`, type: "transfer" });
  return record;
}

function releaseAIFringePlayer(career: Career, club: Club, preferredPosition: Position) {
  const loanedPlayerIds = new Set((career.playerLoans ?? []).filter((loan) => loan.status === "Active").map((loan) => loan.playerId));
  const candidates = career.players.filter((player) => player.clubId === club.id && player.age >= 18
    && player.id !== club.captainId && player.id !== club.viceCaptainId && !loanedPlayerIds.has(player.id));
  candidates.sort((first, second) => {
    const score = (player: Player) => player.overall - Math.max(0, player.age - 28) * 0.7 - player.wage / 10_000 + (player.position === preferredPosition ? -20 : 0);
    return score(first) - score(second) || first.id.localeCompare(second.id);
  });
  const player = candidates[0];
  if (!player) return null;
  player.clubHistory ??= [];
  player.clubHistory.forEach((record) => { if (record.clubId === club.id && record.toSeason === null) record.toSeason = Math.max(1, career.season - 1); });
  player.clubHistory.push({ clubId: null, clubName: "Free agent", country: player.country ?? club.country, fromSeason: career.season, toSeason: null, squadLevel: player.squadLevel ?? "First team", appearances: 0, goals: 0, assists: 0, cleanSheets: 0 });
  player.clubId = null;
  player.contractYears = 0;
  player.wage = 0;
  player.contractRole = "Rotation";
  player.morale = Math.min(70, player.morale);
  player.managerRapport = 50;
  career.news.unshift({ id: `ai-release-s${career.season}-${club.id}-${player.id}`, date: "01 Jul", headline: `${player.name} leaves ${club.name}`, body: `${club.name} release the ${player.position.toLowerCase()} as the manager reshapes the senior squad for the new season.`, type: "transfer" });
  return player;
}

function trimAIEliteSquad(career: Career, club: Club, targetSize = 21) {
  let seniorCount = career.players.filter((player) => player.clubId === club.id && player.age >= 18).length;
  while (seniorCount > targetSize) {
    const released = releaseAIFringePlayer(career, club, weakestSeniorPosition(career, club));
    if (!released) break;
    seniorCount -= 1;
  }
}

function runSummerTransferWindow(career: Career) {
  career.transferHistory ??= [];
  const allocations = fundPremierLeagueOwners(career);
  const eliteIds = new Set(allocations.keys());
  const signedPlayers = new Set(career.players.map((player) => player.id));
  let totalSpend = 0;
  let topSixSignings = 0;
  for (const club of premierLeagueTopSix(career)) {
    if (club.id === career.clubId) continue;
    trimAIEliteSquad(career, club);
    let remaining = Math.min(allocations.get(club.id) ?? 0, club.transferBudget, club.balance);
    const random = randomFrom(stableSeed(`${career.id}:${career.season}:${club.id}:elite-summer-market`));
    for (let slot = 0; slot < 3 && remaining >= 42_000_000; slot += 1) {
      const position = weakestSeniorPosition(career, club);
      const target = findWorldRecruitmentTarget(career, club, random, signedPlayers, position, 72, 81, remaining, (player) => eliteTransferFee(player, remaining, 3 - slot));
      if (!target) break;
      const record = completeAITransfer(career, club, target.player, target.fee, "01 Jul");
      signedPlayers.add(target.player.id);
      remaining -= record.fee;
      totalSpend += record.fee;
      topSixSignings += 1;
    }
  }
  simulateAITransferWindow(career, eliteIds);
  refreshPlayerRelationships(career);
  if (topSixSignings) {
    career.news.unshift({ id: `elite-window-s${career.season}`, date: "01 Jul", headline: "Premier League's leading clubs reshape the market", body: `The leading six clubs have owner-backed funds totalling ${formatMoney(PREMIER_LEAGUE_ELITE_SPEND)}. Their AI recruitment has committed ${formatMoney(totalSpend)} across ${topSixSignings} summer signings; any remaining allocation stays available to the clubs.`, type: "transfer" });
  }
}

function simulateAIWinterTransferWindow(career: Career) {
  career.winterTransferSeasons ??= [];
  if (career.winterTransferSeasons.includes(career.season)) return;
  career.winterTransferSeasons.push(career.season);
  const rescueFunds = [42_000_000, 8_000_000, 3_200_000, 1_800_000, 800_000, 500_000, 500_000];
  const usedPlayers = new Set(career.players.map((player) => player.id));
  let signingCount = 0;
  let spend = 0;
  for (const league of ENGLISH_LEAGUES) {
    if (!league.relegationPlaces) continue;
    const table = getTable(career, league.id);
    const threatened = table.slice(-Math.min(league.relegationPlaces + 1, table.length));
    for (const row of threatened) {
      const club = career.clubs.find((item) => item.id === row.clubId);
      if (!club) continue;
      const tier = league.tier;
      const rescue = rescueFunds[tier - 1] ?? 250_000;
      club.balance += rescue;
      club.transferBudget += rescue;
      if (club.id === career.clubId) career.finance.unshift({ date: "01 Jan", label: "January survival transfer fund", amount: rescue });
      if (club.id === career.clubId) continue;
      const position = weakestSeniorPosition(career, club);
      const baseTarget = Math.max(40, Math.min(76, club.reputation + (tier <= 2 ? 1 : -2)));
      const random = randomFrom(stableSeed(`${career.id}:${career.season}:${club.id}:winter-rescue`));
      const target = findWorldRecruitmentTarget(career, club, random, usedPlayers, position, Math.max(38, baseTarget - 8), Math.min(81, baseTarget + 5), Math.min(rescue, club.balance, club.transferBudget), (player) => winterTransferFee(player, tier));
      if (!target) continue;
      const record = completeAITransfer(career, club, target.player, target.fee, "01 Jan");
      usedPlayers.add(target.player.id);
      signingCount += 1;
      spend += record.fee;
    }
  }
  if (signingCount) {
    career.news.unshift({ id: `winter-window-s${career.season}`, date: "01 Jan", headline: "Relegation-threatened clubs move early", body: `${signingCount} clubs in danger of dropping down add targeted reinforcements, spending ${formatMoney(spend)}. January remains far quieter than the summer window.`, type: "transfer" });
  }
}

function simulateAITransferWindow(career: Career, clubsWithSummerBusiness = new Set<string>()) {
  career.transferHistory ??= [];
  const tradedClubs = new Set<string>();
  const positionSlots: Record<Position, number> = { GK: 1, DEF: 4, MID: 4, FWD: 2 };
  const teamStrength = (club: Club, position: Position) => {
    const players = career.players.filter((player) => player.clubId === club.id && player.age >= 18 && player.position === position).sort((first, second) => second.overall - first.overall).slice(0, positionSlots[position]);
    return players.length ? players.reduce((sum, player) => sum + player.overall, 0) / positionSlots[position] : 0;
  };

  for (const club of career.clubs) {
    if (club.id === career.clubId || tradedClubs.has(club.id) || clubsWithSummerBusiness.has(club.id)) continue;
    const roster = career.players.filter((player) => player.clubId === club.id && player.age >= 18);
    const random = randomFrom(stableSeed(`${career.id}:${career.season}:${club.id}:recruitment`));
    if (roster.length >= 21 || (roster.length >= 14 && random() > 0.22)) continue;
    const weakestPosition = (Object.keys(positionSlots) as Position[]).sort((first, second) => teamStrength(club, first) - teamStrength(club, second))[0];
    const weeklyWages = roster.reduce((sum, player) => sum + player.wage, 0);
    const wageRoom = Math.max(0, club.wageBudget * 1.5 - weeklyWages);
    const sellers = career.clubs.filter((seller) => seller.id !== club.id && seller.id !== career.clubId && !tradedClubs.has(seller.id) && career.players.filter((player) => player.clubId === seller.id && player.age >= 18).length > 17);
    const available = career.players.filter((player) => {
      if (player.age < 18 || player.clubId === career.clubId || player.clubId === club.id || (career.playerLoans ?? []).some((loan) => loan.playerId === player.id && loan.status === "Active")) return false;
      const seller = player.clubId ? sellers.find((entry) => entry.id === player.clubId) : null;
      const freeAgent = player.clubId === null || player.contractYears === 0;
      if (!freeAgent && !seller) return false;
      const fee = seller && player.contractYears > 0 ? Math.round(player.value * 0.28) : 0;
      return player.wage <= wageRoom && fee <= club.transferBudget && player.overall <= club.reputation + 15;
    });
    const exactNeed = available.filter((player) => player.position === weakestPosition);
    const shortlist = (exactNeed.length ? exactNeed : available).sort((first, second) => second.overall + second.potential * 0.12 - (first.overall + first.potential * 0.12));
    const signing = shortlist[0];
    if (!signing) continue;

    const seller = signing.clubId ? career.clubs.find((entry) => entry.id === signing.clubId) ?? null : null;
    const fee = seller && signing.contractYears > 0 ? Math.round(signing.value * 0.28) : 0;
    const fromClubId = seller?.id ?? null;
    const fromClubName = seller?.name ?? "Free agent";
    if (seller && fee > 0) {
      seller.balance += fee;
      seller.transferBudget += Math.round(fee * 0.12);
      club.balance -= fee;
      club.transferBudget = Math.max(0, club.transferBudget - fee);
      tradedClubs.add(seller.id);
    }
    signing.clubHistory ??= [];
    signing.clubHistory.forEach((record) => { if (record.toSeason === null) record.toSeason = career.season - 1; });
    signing.clubId = club.id;
    signing.contractYears = 2 + Math.floor(random() * 3);
    signing.wage = Math.min(Math.max(signing.wage, Math.round(signing.overall * 30)), Math.max(500, wageRoom));
    signing.morale = Math.min(88, Math.max(signing.morale, 68));
    signing.clubHistory.push({ clubId: club.id, clubName: club.name, country: club.country, fromSeason: career.season, toSeason: null, squadLevel: signing.squadLevel ?? squadLevelForAge(signing.age), appearances: 0, goals: 0, assists: 0, cleanSheets: 0 });
    const transfer: TransferRecord = { id: `ai-transfer-s${career.season}-${club.id}-${signing.id}`, season: career.season, playerId: signing.id, playerName: signing.name, fromClubId, fromClubName, toClubId: club.id, toClubName: club.name, fee, date: "01 Jul" };
    career.transferHistory.push(transfer);
    tradedClubs.add(club.id);
    career.news.unshift({ id: transfer.id, date: transfer.date, headline: `${signing.name} joins ${club.name}`, body: `${fromClubId ? `${fromClubName} agree a ${formatMoney(fee)} fee` : "The free agent signs"} as ${club.name} strengthen their ${weakestPosition.toLowerCase()} options.`, type: "transfer" });
  }

  // Keep AI squads viable after contracts, retirements and promotion movement.
  // Without an adequate free-agent class, every unattended club slowly empties
  // and the human player ends up winning by default after a few seasons.
  const rosterTargets: Record<Position, number> = { GK: 2, DEF: 5, MID: 6, FWD: 5 };
  let generatedSignings = 0;
  for (const club of career.clubs) {
    if (club.id === career.clubId) continue;
    const roster = career.players.filter((player) => player.clubId === club.id && player.age >= 18);
    const counts = Object.fromEntries((Object.keys(rosterTargets) as Position[]).map((position) => [position, roster.filter((player) => player.position === position).length])) as Record<Position, number>;
    const vacancies = Math.max(0, 18 - roster.length);
    if (!vacancies) continue;
    const random = randomFrom(stableSeed(`${career.id}:${career.season}:${club.id}:academy-free-agents`));
    const tier = leagueDefinition(club.leagueId).tier;
    const economy = leagueEconomy(tier);
    const base = 50 + Math.round((club.reputation - 52) * 0.4) - Math.max(0, tier - 4) * 2.6;
    let weeklyPlayerWages = roster.reduce((sum, player) => sum + player.wage, 0);
    for (let slot = 0; slot < vacancies; slot += 1) {
      const position = (Object.keys(rosterTargets) as Position[]).sort((first, second) => (counts[first] - rosterTargets[first]) - (counts[second] - rosterTargets[second]))[0];
      const playerId = `regen-s${career.season}-${club.id}-${slot + 1}`;
      const player = createPlayer(playerId, club.id, position, base - 1, random, club.country, domesticNationalityShare(club.country, tier, club.reputation));
      player.age = 18 + Math.floor(random() * 13);
      player.contractYears = 2 + Math.floor(random() * 3);
      player.wage = Math.round(player.wage * economy.playerWageMultiplier / 50) * 50;
      const remainingWageRoom = Math.max(600, club.wageBudget * 0.96 - weeklyPlayerWages);
      player.wage = Math.min(player.wage, Math.max(600, Math.round(remainingWageRoom / Math.max(1, vacancies - slot) / 50) * 50));
      player.value = Math.round(Math.max(25000, (player.overall - 35) ** 2 * 1800) / 1000) * 1000;
      player.clubHistory = [{ clubId: club.id, clubName: club.name, country: club.country, fromSeason: career.season, toSeason: null, squadLevel: "First team", appearances: 0, goals: 0, assists: 0, cleanSheets: 0 }];
      player.morale = 64 + Math.floor(random() * 18);
      refreshPlayerProfile(player, career.season);
      career.players.push(player);
      counts[position] += 1;
      weeklyPlayerWages += player.wage;
      generatedSignings += 1;
      career.transferHistory.push({ id: `ai-free-agent-s${career.season}-${club.id}-${slot + 1}`, season: career.season, playerId: player.id, playerName: player.name, fromClubId: null, fromClubName: "Free agent", toClubId: club.id, toClubName: club.name, fee: 0, date: "01 Jul" });
    }
  }
  if (generatedSignings) career.news.unshift({ id: `ai-recruitment-s${career.season}`, date: "01 Jul", headline: "Clubs replenish their first-team squads", body: `${generatedSignings} free agents join clubs across the leagues as teams replace players who retired or left at the end of their contracts.`, type: "transfer" });
  career.transferHistory = career.transferHistory.slice(-500);
}

function seasonPerformanceScore(player: Player) {
  const stats = player.seasonStats ?? emptyPlayerStats();
  return stats.goals * 5 + stats.assists * 3 + stats.cleanSheets * 2 + stats.appearances + Math.round(player.overall * 0.15);
}

export function calculateSeasonAwards(career: Career, season = career.season): SeasonAward[] {
  const clubById = new Map(career.clubs.map((club) => [club.id, club]));
  const eligible = career.players.filter((player) => player.age >= 16 && player.clubId && clubById.has(player.clubId) && (player.seasonStats?.appearances ?? 0) >= 10);
  const awards: SeasonAward[] = [];
  const addAward = (award: SeasonAwardName, leagueId: string, leagueName: string, player: Player) => {
    const club = clubById.get(player.clubId!)!;
    const stats = player.seasonStats ?? emptyPlayerStats();
    awards.push({
      id: `${season}-${leagueId}-${award.toLowerCase().replaceAll(" ", "-")}-${player.id}`,
      season,
      award,
      leagueId,
      leagueName,
      playerId: player.id,
      playerName: player.name,
      clubId: club.id,
      clubName: club.name,
      appearances: stats.appearances,
      goals: stats.goals,
      assists: stats.assists,
      cleanSheets: stats.cleanSheets,
      performanceScore: seasonPerformanceScore(player),
    });
  };
  const bestPerformance = (players: Player[]) => [...players].sort((first, second) => seasonPerformanceScore(second) - seasonPerformanceScore(first) || (second.seasonStats?.goals ?? 0) - (first.seasonStats?.goals ?? 0) || (second.seasonStats?.assists ?? 0) - (first.seasonStats?.assists ?? 0) || first.name.localeCompare(second.name) || first.id.localeCompare(second.id))[0];

  for (const leagueId of [...new Set(career.clubs.map((club) => club.leagueId))].sort()) {
    const leagueClubs = new Set(career.clubs.filter((club) => club.leagueId === leagueId).map((club) => club.id));
    const leaguePlayers = eligible.filter((player) => player.clubId && leagueClubs.has(player.clubId));
    if (!leaguePlayers.length) continue;
    const leagueName = leagueDefinition(leagueId).name;
    const playerOfTheSeason = bestPerformance(leaguePlayers);
    if (playerOfTheSeason) addAward("Player of the Season", leagueId, leagueName, playerOfTheSeason);
    const topScorer = [...leaguePlayers].filter((player) => (player.seasonStats?.goals ?? 0) > 0).sort((first, second) => (second.seasonStats?.goals ?? 0) - (first.seasonStats?.goals ?? 0) || (second.seasonStats?.assists ?? 0) - (first.seasonStats?.assists ?? 0) || (second.seasonStats?.appearances ?? 0) - (first.seasonStats?.appearances ?? 0) || first.name.localeCompare(second.name))[0];
    if (topScorer) addAward("Top Scorer", leagueId, leagueName, topScorer);
    const youngPlayer = bestPerformance(leaguePlayers.filter((player) => player.age <= 21));
    if (youngPlayer) addAward("Young Player of the Season", leagueId, leagueName, youngPlayer);
  }
  const worldWinner = bestPerformance(eligible);
  if (worldWinner) addAward("World Player of the Year", "career-world", "Active career leagues", worldWinner);
  return awards;
}

export function beginNextSeason(career: Career): Career {
  if (career.unemployed || !isSeasonComplete(career)) return career;
  const next: Career = structuredClone(career);
  const finishedSeason = next.season;
  const seasonAwards = calculateSeasonAwards(next, finishedSeason);
  next.awardHistory = [...(next.awardHistory ?? []), ...seasonAwards];
  const table = getTable(next, getClub(next).leagueId);
  const oldLeague = getCurrentLeague(next);
  const row = table.find((entry) => entry.clubId === next.clubId)!;
  const finalPosition = table.findIndex((entry) => entry.clubId === next.clubId) + 1;
  next.matchArchive = [...(next.matchArchive ?? []), ...next.fixtures.filter((fixture) => fixture.played && (fixture.homeClubId === next.clubId || fixture.awayClubId === next.clubId))].slice(-5000);
  next.history.unshift({
    season: next.season,
    club: getClub(next).name,
    clubId: next.clubId,
    leagueId: oldLeague.id,
    leagueName: oldLeague.name,
    position: finalPosition,
    points: row.points,
    wins: row.wins,
    draws: row.draws,
    losses: row.losses,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
  });
  const managerAppointment = activeManagerCareerAppointment(next);
  if (managerAppointment) managerAppointment.seasons.push({
    season: finishedSeason,
    leagueId: oldLeague.id,
    leagueName: oldLeague.name,
    position: finalPosition,
    clubCount: oldLeague.clubs,
    points: row.points,
    wins: row.wins,
    draws: row.draws,
    losses: row.losses,
    champion: finalPosition === 1,
    promoted: false,
    relegated: false,
    recordTracked: true,
  });
  applyEnglishPromotionsAndRelegations(next);
  const worldMovement = applyWorldPromotionsAndRelegations(next);
  const retirementRandom = randomFrom(stableSeed(`${next.id}:${next.season + 1}:retirements`));
  next.internationalArchive = [...(next.internationalArchive ?? []), ...(next.internationalFixtures ?? []).filter((fixture) => fixture.played)].slice(-1_500);
  next.season += 1;
  next.round = 1;
  next.calendarDate = `${2026 + next.season - 1}-07-01`;
  if (next.managerLeave?.status === "active") next.managerLeave = { ...next.managerLeave, status: "completed", message: "Your leave has ended as the new season begins." };
  settleDuePlayerLoans(next);
  const userContractDepartures: string[] = [];
  const aiPayroll = new Map(next.clubs.map((club) => [club.id, next.players.filter((player) => player.clubId === club.id && player.age >= 18).reduce((sum, player) => sum + player.wage, 0)]));
  for (const player of next.players) {
    player.age += 1;
    player.leadership = leadershipForPlayer(player.id, player.age, player.personality);
    const ageLevel = squadLevelForAge(player.age);
    const pathwayOrder: SquadLevel[] = ["Foundation", "Academy", "U16", "U18", "Reserves", "First team"];
    if (!player.squadLevel || pathwayOrder.indexOf(ageLevel) > pathwayOrder.indexOf(player.squadLevel)) player.squadLevel = ageLevel;
    if (player.clubId && player.clubId !== next.clubId && player.age >= 18 && player.contractYears <= 1) {
      const club = next.clubs.find((item) => item.id === player.clubId);
      const payroll = aiPayroll.get(player.clubId) ?? 0;
      const renewalChance = Math.max(0.3, Math.min(0.93, 0.76 + ((club?.boardTrust ?? 50) - 50) * 0.003 + (player.morale - 60) * 0.002 - Math.max(0, payroll - (club?.wageBudget ?? 0)) * 0.000002));
      const renewalRandom = randomFrom(stableSeed(`${next.id}:${next.season}:renewal:${player.id}`));
      if (renewalRandom() < renewalChance) player.contractYears = 2 + Math.floor(renewalRandom() * 3);
    }
    player.contractYears = Math.max(0, player.contractYears - 1);
    player.yellowCardsThisSeason = 0;
    player.seasonStats = emptyPlayerStats();
    const developmentRandom = randomFrom(stableSeed(`${next.id}:${next.season}:development:${player.id}`));
    const developmentClub = player.clubId ? next.clubs.find((club) => club.id === player.clubId) : null;
    const coaches = (developmentClub?.staff ?? []).filter((person) => ["First-Team Manager", "Assistant Manager", "First-Team Coach", "Fitness Coach", "Goalkeeping Coach"].includes(person.role));
    const coachAbility = coaches.length ? coaches.reduce((sum, person) => sum + person.ability, 0) / coaches.length : 45;
    const ageGrowth = player.age <= 12 ? 0.78 : player.age <= 17 ? 0.72 : player.age <= 22 ? 0.56 : player.age <= 25 ? 0.34 : player.age <= 28 ? 0.14 : 0;
    const focusGrowth = player.trainingFocus === "Rest" ? -0.15 : ["Technical", "Tactical", "Physical", "Finishing", "Goalkeeping", "Fundamentals"].includes(player.trainingFocus) ? 0.1 : 0;
    const annualDevelopmentChance = Math.max(0, Math.min(0.94, ageGrowth + (coachAbility - 50) * 0.002 + ((developmentClub?.trainingLevel ?? 1) - 1) * 0.025 + focusGrowth));
    if (player.age < 29 && player.overall < player.potential && developmentRandom() < annualDevelopmentChance) player.overall += 1;
    if (player.age >= 36 && player.clubId && retirementRandom() < 0.5) {
      player.clubHistory?.forEach((record) => { if (record.clubId === player.clubId && record.toSeason === null) record.toSeason = next.season - 1; });
      player.clubId = null;
    } else if (player.age >= 18 && player.clubId && player.contractYears === 0) {
      const previousClubId = player.clubId;
      player.clubHistory?.forEach((record) => { if (record.clubId === player.clubId && record.toSeason === null) record.toSeason = next.season - 1; });
      player.clubId = null;
      if (previousClubId === next.clubId) userContractDepartures.push(player.name);
    }
    if (player.age >= 31) player.overall = Math.max(42, player.overall - (player.age > 34 ? 2 : 1));
    player.attributes = profileAttributes(player.id, player.overall, player.position, player.attributeGrowth);
    if (player.age < 21) {
      const latest = player.academyHistory?.at(-1);
      if (latest && latest.squadLevel !== ageLevel) player.academyHistory!.push({ season: next.season, age: player.age, squadLevel: ageLevel, academyLevel: getClub(next, player.clubId ?? next.clubId).academyLevel });
    }
  }
  const youthClub = getClub(next);
  const academy = youthClub.academyLevel;
  const traditionPotentialBonus = youthClub.dna?.academyTradition === "Elite production" ? 4 : youthClub.dna?.academyTradition === "Technical pathway" ? 3 : 2;
  const pathwayPotentialBonus = youthClub.dna?.recruitmentPolicy === "Academy pathway" ? 2 : 0;
  const delegatedAcademyBonus = getResponsibilityEffects(next).academyPotentialBonus;
  const random = randomFrom(22643 + next.season * 90);
  const youthCount = 8 + academy + (youthClub.stadium.academyCampusLevel ?? 0) + (youthClub.stadium.youthStadiumLevel ?? 0);
  const positions: Position[] = ["GK", "DEF", "MID", "FWD"];
  const userAcademyQuality = Math.max(-3, Math.min(5, (academy - 2) * 1.5 + (youthClub.stadium.academyCampusLevel ?? 0) * 0.5));
  for (let index = 0; index < youthCount; index += 1) {
    const youth = createPlayer(`y${next.season}-${index + 1}`, next.clubId, positions[index % positions.length], 43 + academy * 1.5, random, youthClub.country, 0.97);
    youth.age = 5 + Math.floor(random() * 13);
    youth.leadership = leadershipForPlayer(youth.id, youth.age, youth.personality);
    youth.overall = Math.max(18, Math.min(62, Math.round(12 + youth.age * 1.55 + random() * 7 + userAcademyQuality)));
    youth.potential = Math.min(91, youth.overall + 20 + Math.floor(random() * 18) + traditionPotentialBonus + pathwayPotentialBonus + delegatedAcademyBonus);
    youth.wage = 0;
    youth.value = 0;
    youth.squadLevel = squadLevelForAge(youth.age);
    youth.managerRapport = 55;
    youth.contractYears = youth.age >= 16 ? 2 : 0;
    refreshPlayerProfile(youth, next.season);
    next.players.push(youth);
  }
  let aiYouthIntakes = 0;
  for (const academyClub of next.clubs.filter((item) => item.id !== next.clubId)) {
    const intakeRandom = randomFrom(stableSeed(`${next.id}:${next.season}:youth-intake:${academyClub.id}`));
    const intakeCount = 4 + Math.floor(academyClub.academyLevel / 2) + (academyClub.stadium.academyCampusLevel ?? 0);
    const academyQuality = Math.max(-3, Math.min(5, (academyClub.academyLevel - 2) * 1.5 + (academyClub.stadium.academyCampusLevel ?? 0) * 0.5));
    const traditionBonus = academyClub.dna?.academyTradition === "Elite production" ? 4 : academyClub.dna?.academyTradition === "Technical pathway" ? 3 : 2;
    const pathwayBonus = academyClub.dna?.recruitmentPolicy === "Academy pathway" ? 2 : 0;
    for (let index = 0; index < intakeCount; index += 1) {
      const age = 5 + Math.floor(intakeRandom() * 13);
      const position = positions[Math.floor(intakeRandom() * positions.length)];
      const youth = createPlayer(`ai-y${next.season}-${academyClub.id}-${index + 1}`, academyClub.id, position, 34 + age * 0.7 + academyQuality, intakeRandom, academyClub.country, 0.97);
      youth.age = age;
      youth.leadership = leadershipForPlayer(youth.id, age, youth.personality);
      youth.overall = Math.max(18, Math.min(62, Math.round(12 + age * 1.55 + intakeRandom() * 7 + academyQuality)));
      youth.potential = Math.min(91, youth.overall + 20 + Math.floor(intakeRandom() * 18) + traditionBonus + pathwayBonus);
      youth.wage = 0;
      youth.value = 0;
      youth.contractYears = age >= 16 ? 2 : 0;
      youth.squadLevel = squadLevelForAge(age);
      youth.managerRapport = 55;
      refreshPlayerProfile(youth, next.season);
      next.players.push(youth);
      aiYouthIntakes += 1;
    }
  }
  if (aiYouthIntakes) next.news.unshift({ id: `world-youth-intake-s${next.season}`, date: "01 Jul", headline: "A new generation enters the academies", body: `${aiYouthIntakes} young players join academy pathways across the active leagues. Youth quality reflects each club's development facilities.`, type: "club" });
  for (let index = 0; index < 6; index += 1) {
    const age = 5 + Math.floor(random() * 12);
    const prospect = createPlayer(`scout-${next.season}-${index + 1}`, `scout-${next.season}`, positions[(next.season + index) % positions.length], 35 + age * 0.65, random, youthClub.country, 0.94);
    prospect.age = age;
    prospect.leadership = leadershipForPlayer(prospect.id, prospect.age, prospect.personality);
    prospect.overall = Math.max(16, Math.round(15 + age * 1.7 + random() * 8));
    prospect.potential = Math.min(91, prospect.overall + 24 + Math.floor(random() * 20));
    prospect.wage = 0;
    prospect.value = 0;
    prospect.contractYears = 0;
    prospect.clubId = null;
    prospect.squadLevel = squadLevelForAge(age);
    refreshPlayerProfile(prospect, next.season);
    next.players.push(prospect);
  }
  const club = getClub(next);
  if (userContractDepartures.length) {
    const names = userContractDepartures.slice(0, 5).join(", ");
    next.news.unshift({ id: `contracts-expired-${next.season}-${club.id}`, date: "01 Jul", headline: `${userContractDepartures.length} player contract${userContractDepartures.length === 1 ? "" : "s"} expire at ${club.name}`, body: `${names}${userContractDepartures.length > 5 ? ` and ${userContractDepartures.length - 5} others` : ""} leave as free agents after their deals run out. Renewals need to be agreed before the season ends.`, type: "transfer" });
  }
  for (const contract of club.sponsorContracts ?? []) contract.yearsRemaining -= 1;
  club.sponsorContracts = (club.sponsorContracts ?? []).filter((contract) => contract.yearsRemaining > 0);
  const shirtContract = club.sponsorContracts.find((contract) => contract.slot === "shirt");
  if (shirtContract) { club.sponsor = shirtContract.company; club.sponsorAnnual = shirtContract.annual; }
  const spendingFactor = club.dna?.spendingPolicy === "Bold ambition" ? 1.14 : club.dna?.spendingPolicy === "Sustainable growth" ? 0.88 : 1;
  for (const leagueId of new Set(next.clubs.map((item) => item.leagueId))) {
    const league = leagueDefinition(leagueId);
    const tableForLeague = getTable(next, leagueId);
    for (const leagueClub of next.clubs.filter((item) => item.leagueId === leagueId)) {
      const place = Math.max(1, tableForLeague.findIndex((item) => item.clubId === leagueClub.id) + 1);
      const economy = leagueEconomy(league.tier);
      const reputationScale = Math.max(0.72, Math.min(1.38, 0.58 + leagueClub.reputation / 125));
      const meritShare = (league.clubs - place) / Math.max(1, league.clubs - 1);
      const distribution = Math.round((economy.annualBroadcast + economy.annualMerit * meritShare) * reputationScale);
      leagueClub.balance += distribution;
      leagueClub.transferBudget += Math.round((distribution * 0.14 + leagueClub.reputation * 18_000) * (leagueClub.id === next.clubId ? spendingFactor : 1));
      leagueClub.wageBudget = Math.round(economy.weeklyWageBudget * reputationScale / 10_000) * 10_000;
      if (leagueClub.id === next.clubId) {
        next.finance.unshift({ date: "01 Jul", label: `${league.name} broadcast & merit distribution · ${place}${place === 1 ? "st" : place === 2 ? "nd" : place === 3 ? "rd" : "th"}`, amount: distribution });
      }
    }
  }
  club.boardTrust = Math.min(100, Math.max(0, club.boardTrust + (finalPosition <= club.targetPosition ? 9 : -5)));
  club.supporterConfidence = Math.min(100, Math.max(15, club.supporterConfidence + (finalPosition <= club.targetPosition ? 6 : -7)));
  next.pressure = Math.max(10, (next.pressure ?? 18) - (finalPosition <= club.targetPosition ? 8 : -8));
  next.pressPressure = Math.max(0, (next.pressPressure ?? 12) - 18);
  next.winlessRun = 0;
  if (next.kitCollectionSeason !== next.season) next.kitDesignReady = false;
  runSummerTransferWindow(next);
  refreshPlayerRelationships(next);
  settleSeasonPromises(next, finishedSeason, finalPosition);
  reviewClubProject(next, finalPosition, finishedSeason);
  next.fixtures = generateCareerFixtures(next.season, next.clubs);
  next.internationalFixtures = generateInternationalFixtures(next.season);
  next.lineup = createStartingXI(next.players, next.clubId, next.formation);
  next.lastReport = null;
  const newLeague = getCurrentLeague(next);
  if (managerAppointment) managerAppointment.leagueId = newLeague.id;
  const managerSeason = managerAppointment?.seasons.find((result) => result.season === finishedSeason);
  if (managerSeason) {
    managerSeason.promoted = newLeague.tier < oldLeague.tier;
    managerSeason.relegated = newLeague.tier > oldLeague.tier;
  }
  const managerContract = next.managerContract;
  if (managerContract?.clubId === next.clubId) {
    if (managerContract.endSeason <= finishedSeason) {
      const boardSatisfied = club.boardTrust >= 45 && next.pressure < privateBoardTolerance(club) * 0.72;
      const targetAchieved = finalPosition <= managerContract.targetPosition;
      if (targetAchieved && boardSatisfied) {
        const renewedContract: ManagerContract = {
          ...managerContract,
          weeklyWage: Math.max(managerContract.weeklyWage + 250, Math.round(managerContract.weeklyWage * 1.08 / 250) * 250),
          startSeason: next.season,
          endSeason: next.season + 1,
          targetPosition: club.targetPosition,
        };
        next.managerContract = renewedContract;
        if (managerAppointment) managerAppointment.contract = { ...renewedContract };
        next.news.unshift({
          id: `manager-contract-renewed-${next.season}-${club.id}`,
          date: "01 Jul",
          headline: `${club.name} renew ${next.manager}’s contract`,
          body: `The board extend the manager’s deal through season ${renewedContract.endSeason} after the season target was achieved. Weekly pay rises to ${formatMoney(renewedContract.weeklyWage)} and the new objective is a top-${renewedContract.targetPosition} finish.`,
          type: "club",
        });
      } else {
        next.unemployed = true;
        next.managerContract = null;
        endManagerCareerAppointment(next, "Contract Expired", oldLeague.rounds, finishedSeason);
        next.news.unshift({
          id: `manager-contract-expired-${finishedSeason}-${club.id}`,
          date: "01 Jul",
          headline: `${club.name} do not renew ${next.manager}’s contract`,
          body: `The deal has ended after ${club.name} finished ${finalPosition} of ${oldLeague.clubs} clubs. The board decided that the season target, trust and overall pressure did not justify a new contract. You must apply for another role before advancing the calendar.`,
          type: "club",
          urgent: true,
        });
      }
    } else if (managerContract.endSeason === finishedSeason + 1) {
      next.news.unshift({
        id: `manager-contract-one-year-${next.season}-${club.id}`,
        date: "01 Jul",
        headline: `One season left on ${next.manager}’s ${club.name} contract`,
        body: `The current deal runs through season ${managerContract.endSeason}. Board confidence and the season target will shape renewal discussions.`,
        type: "club",
      });
    }
  }
  const clubMovement = newLeague.id === oldLeague.id ? "The club holds its place in the pyramid." : `${oldLeague.name} → ${newLeague.name} is confirmed.`;
  const worldMovementNote = worldMovement
    ? `${worldMovement.promotedIds.length} clubs earn promotion into ${WORLD_LEAGUES.find((league) => league.country === worldMovement.country && league.tier === 1)?.name}; ${worldMovement.relegatedIds.length} move down to ${WORLD_LEAGUES.find((league) => league.country === worldMovement.country && league.tier === 2)?.name}.`
    : "";
  next.news.unshift({ id: `season-${next.season}`, date: "01 Jul", headline: `Pre-season begins · ${2026 + next.season - 1}/${String(2027 + next.season - 1).slice(-2)}`, body: `A new campaign begins. ${clubMovement} ${worldMovementNote} ${youthCount} new academy players join the pathway.`, type: "club" });
  for (const award of seasonAwards) {
    next.news.unshift({
      id: `season-award-${award.id}`,
      date: "01 Jul",
      headline: `${award.playerName} named ${award.award}`,
      body: award.leagueId === "career-world"
        ? `${award.playerName} of ${award.clubName} wins the ${award.award.toLowerCase()} after ${award.appearances} appearances, ${award.goals} goals and ${award.assists} assists. The award is judged across the active career leagues.`
        : `${award.playerName} of ${award.clubName} wins ${award.leagueName}'s ${award.award.toLowerCase()}, with ${award.appearances} appearances, ${award.goals} goals and ${award.assists} assists.`,
      type: "award",
      source: award.leagueId === "career-world" ? "World Football Review" : "The League Gazette",
      reliability: 98,
    });
  }
  refreshClubBoardAgenda(next);
  return normalizeCareer(next);
}

export function setPlayerSelection(career: Career, playerId: string) {
  const next = structuredClone(career);
  const selected = next.lineup.includes(playerId);
  if (selected) next.lineup = next.lineup.filter((id) => id !== playerId);
  else if ((next.players.find((player) => player.id === playerId)?.injuryWeeksRemaining ?? 0) > 0 || (next.players.find((player) => player.id === playerId)?.suspensionMatchesRemaining ?? 0) > 0) return career;
  else if (next.lineup.length < 11) next.lineup.push(playerId);
  else next.lineup = [...next.lineup.slice(0, 10), playerId];
  return next;
}

export function buyPlayer(career: Career, playerId: string, offer: number, terms?: PlayerTransferOffer) {
  const next: Career = structuredClone(career);
  let player = next.players.find((item) => item.id === playerId);
  const club = getClub(next);
  const report = getScoutingReport(career, playerId);
  const bonus = terms?.signingBonus ?? 0;
  if (!report || !Number.isFinite(offer) || offer < 0 || offer > club.transferBudget || !Number.isFinite(bonus) || bonus < 0 || offer + bonus > club.balance
    || (terms && (terms.fee !== offer || !Number.isFinite(terms.weeklyWage) || terms.weeklyWage < 100 || !Number.isInteger(terms.years) || terms.years < 1 || terms.years > 5 || !["Prospect", "Rotation", "First team", "Important", "Star"].includes(terms.squadRole)))) return career;
  if (!player) {
    const worldPlayer = getWorldPlayerDetails(playerId);
    if (!worldPlayer || worldPlayer.age < 18) return career;
    player = worldPlayerToPlayer(worldPlayer);
    next.players.push(player);
  }
  if (player.age < 18 || player.clubId === next.clubId || (next.playerLoans ?? []).some((loan) => loan.playerId === playerId && loan.status === "Active")) return career;
  if (player.clubId !== null && !terms && offer < player.value * 0.72) return career;
  const previousClub = player.clubId ? next.clubs.find((item) => item.id === player!.clubId) ?? null : null;
  if ((player.clubId !== null && !previousClub) || (player.clubId === null && offer !== 0)) return career;
  if (previousClub) {
    if (previousClub.captainId === player.id) {
      previousClub.captainId = previousClub.viceCaptainId && previousClub.viceCaptainId !== player.id ? previousClub.viceCaptainId : initialLeader(previousClub.id, next.players, player.id)?.id;
      previousClub.dressingRoomTension = Math.min(100, (previousClub.dressingRoomTension ?? 12) + 10);
      previousClub.viceCaptainId = initialLeader(previousClub.id, next.players, previousClub.captainId)?.id;
      next.news.unshift({ id: `captain-exit-${next.season}-${player.id}`, date: "Today", headline: `${previousClub.name} lose their captain`, body: `${player.name}'s departure leaves the club to settle a new leadership group.`, type: "transfer" });
    } else if (previousClub.viceCaptainId === player.id) {
      previousClub.viceCaptainId = initialLeader(previousClub.id, next.players, previousClub.captainId)?.id;
      previousClub.dressingRoomTension = Math.min(100, (previousClub.dressingRoomTension ?? 12) + 4);
    }
    previousClub.balance += offer;
    previousClub.transferBudget += offer * 0.1;
  }
  club.balance -= offer + bonus;
  club.transferBudget -= offer;
  player.clubId = club.id;
  refreshPlayerRelationships(next);
  player.contractYears = terms?.years ?? 3;
  player.wage = terms?.weeklyWage ?? Math.max(player.wage, Math.round(player.overall * 48));
  player.contractRole = terms?.squadRole ?? defaultContractSquadRole(player);
  player.morale = 82;
  player.managerRapport = Math.max(66, player.managerRapport ?? 58);
  player.clubHistory ??= [];
  player.clubHistory.forEach((record) => { if (record.toSeason === null) record.toSeason = next.season; });
  player.clubHistory.push({ clubId: club.id, clubName: club.name, country: club.country, fromSeason: next.season, toSeason: null, squadLevel: player.squadLevel ?? squadLevelForAge(player.age), appearances: 0, goals: 0, assists: 0, cleanSheets: 0 });
  if (offer > 0) next.finance.unshift({ date: "Today", label: `Transfer fee · ${player.name}`, amount: -offer });
  if (bonus > 0) next.finance.unshift({ date: "Today", label: `Signing bonus · ${player.name}`, amount: -bonus });
  const transfer: TransferRecord = {
    id: `manager-transfer-s${next.season}-r${next.round}-${player.id}`,
    season: next.season,
    playerId: player.id,
    playerName: player.name,
    fromClubId: previousClub?.id ?? null,
    fromClubName: previousClub?.name ?? "Free agent",
    toClubId: club.id,
    toClubName: club.name,
    fee: offer,
    date: "Today",
  };
  next.transferHistory ??= [];
  next.transferHistory.push(transfer);
  next.transferHistory = next.transferHistory.slice(-500);
  next.news.unshift({ id: transfer.id, date: "Today", headline: `${player.name} joins ${club.name}`, body: `${previousClub ? `${previousClub.name} accept a ${formatMoney(offer)} fee` : "The free agent signs"}. The player agrees a ${player.contractYears}-year deal at ${formatMoney(player.wage, true)} per week as a ${player.contractRole.toLowerCase()}.`, type: "transfer" });
  next.news = next.news.slice(0, 28);
  return next;
}

export function getContractDemand(career: Career, playerId: string): PlayerContractDemand | null {
  const player = career.players.find((item) => item.id === playerId && item.clubId === career.clubId && item.age >= 16 && !(career.playerLoans ?? []).some((loan) => loan.playerId === item.id && loan.status === "Active"));
  if (!player) return null;
  const role = player.contractRole ?? defaultContractSquadRole(player);
  const growthPremium = Math.max(0, player.potential - player.overall) * (player.age < 24 ? 13 : 6);
  const personalityPremium = player.personality === "Ambitious" ? 1.12 : player.personality === "Natural leader" ? 1.07 : player.personality === "Team-first" ? 0.97 : 1;
  const contractPremium = player.contractYears <= 1 ? 1.1 : player.contractYears === 2 ? 1.04 : 1;
  const relationshipPremium = (player.managerRapport ?? 58) < 35 ? 1.07 : player.morale < 40 ? 1.04 : 1;
  const ageFactor = player.age > 32 ? 0.92 : player.age < 21 ? 1.05 : 1;
  const wageBase = Math.max(player.wage, player.overall * 44 + growthPremium);
  const weeklyWage = Math.max(player.wage, Math.round(wageBase * personalityPremium * contractPremium * relationshipPremium * ageFactor / 100) * 100);
  const years = player.age <= 20 ? 4 : player.age <= 25 ? (player.personality === "Ambitious" ? 4 : 3) : player.age <= 30 ? 2 : 1;
  const signingBonus = Math.round(weeklyWage * (player.personality === "Ambitious" ? 8 : player.personality === "Natural leader" ? 5 : 3) / 100) * 100;
  const reason = player.personality === "Ambitious"
    ? "Ambition raises the wage and squad-status expectations."
    : player.personality === "Natural leader"
      ? "The player values leadership status and a secure role."
      : player.age <= 21
        ? "A young player values a longer development pathway."
        : player.age > 31
          ? "At this stage of their career, the player prefers a shorter commitment."
          : "Form, current wages and the promised squad role shape the request.";
  return { weeklyWage, years, squadRole: role, signingBonus, reason };
}

export function getTransferPlayer(career: Career, playerId: string): Player | null {
  const careerPlayer = career.players.find((item) => item.id === playerId);
  if (careerPlayer) return careerPlayer;
  const worldPlayer = getWorldPlayerDetails(playerId);
  return worldPlayer ? worldPlayerToPlayer(worldPlayer) : null;
}

export function getActivePlayerLoans(career: Career, clubId = career.clubId) {
  return (career.playerLoans ?? []).filter((loan) => loan.status === "Active" && (loan.parentClubId === clubId || loan.loanClubId === clubId));
}

export function getLoanDestinationOptions(career: Career, playerId: string) {
  const player = career.players.find((item) => item.id === playerId);
  if (!player || player.clubId !== career.clubId || player.age < 16 || player.contractYears < 1 || career.lineup.includes(playerId)) return [];
  const parent = career.clubs.find((club) => club.id === player.clubId);
  if (!parent || parent.captainId === playerId || (career.playerLoans ?? []).some((loan) => loan.playerId === playerId && loan.status === "Active")) return [];
  return career.clubs.filter((club) => club.id !== parent.id && career.players.filter((item) => item.clubId === club.id && item.age >= 18).length < 38)
    .sort((a, b) => b.reputation - a.reputation || a.name.localeCompare(b.name))
    .map((club) => ({ id: club.id, name: club.name, league: leagueDefinition(club.leagueId).name, reputation: club.reputation, squadSize: career.players.filter((playerItem) => playerItem.clubId === club.id && playerItem.age >= 18).length }));
}

function closeClubRecord(player: Player, clubId: string, season: number) {
  player.clubHistory ??= [];
  player.clubHistory.forEach((record) => {
    if (record.clubId === clubId && record.toSeason === null) record.toSeason = Math.max(record.fromSeason, season);
  });
}

export function negotiatePlayerLoan(career: Career, playerId: string, offer: PlayerLoanOffer): PlayerLoanNegotiation {
  const player = career.players.find((item) => item.id === playerId);
  const parent = player?.clubId ? career.clubs.find((club) => club.id === player.clubId) : null;
  const borrower = career.clubs.find((club) => club.id === offer.loanClubId);
  const isLender = Boolean(parent && parent.id === career.clubId);
  const isBorrower = offer.loanClubId === career.clubId;
  const activeLoan = (career.playerLoans ?? []).some((loan) => loan.playerId === playerId && loan.status === "Active");
  if (!player || !parent || !borrower || (!isLender && !isBorrower) || parent.id === borrower.id || player.age < 16 || player.contractYears < 1 || activeLoan
    || !Number.isFinite(offer.loanFee) || offer.loanFee < 0 || !Number.isFinite(offer.wageContributionPercent) || offer.wageContributionPercent < 0 || offer.wageContributionPercent > 100
    || !Number.isInteger(offer.durationRounds) || offer.durationRounds < 1 || !Number.isInteger(offer.loanFee)) {
    return { career, status: "rejected", message: "A loan needs an eligible contracted player, a valid club, wage share, fee and duration." };
  }
  if (isLender && (career.lineup.includes(playerId) || parent.captainId === playerId || player.age < 16)) {
    return { career, status: "rejected", message: "Remove this player from the starting XI and leadership group before offering them out; players under 16 cannot be loaned." };
  }
  if (isBorrower && !getScoutingReport(career, playerId)) {
    return { career, status: "rejected", message: "Commission a scouting report before discussing a loan for this player." };
  }
  if (isBorrower && player.clubId === career.clubId) {
    return { career, status: "rejected", message: "This player is already registered with your club." };
  }
  const league = leagueDefinition(getClub(career).leagueId);
  const remainingRounds = Math.max(1, league.rounds - career.round + 1);
  if (offer.durationRounds > remainingRounds || career.round > league.rounds) {
    return { career, status: "rejected", message: "The loan duration must end before this season's final league match." };
  }
  const requestedFee = Math.max(5_000, Math.round(player.value * 0.012 / 1_000) * 1_000);
  const requestedShare = player.age <= 21 ? 35 : 50;
  const counterOffer: PlayerLoanOffer = {
    loanClubId: offer.loanClubId,
    loanFee: requestedFee,
    wageContributionPercent: Math.max(requestedShare, offer.wageContributionPercent),
    durationRounds: Math.min(offer.durationRounds, remainingRounds),
  };
  const feeOkay = offer.loanFee >= requestedFee;
  const shareOkay = offer.wageContributionPercent >= requestedShare;
  if (!feeOkay || !shareOkay) {
    if (offer.loanFee >= requestedFee * 0.55 && offer.wageContributionPercent >= requestedShare * 0.55) {
      return { career, status: "countered", counterOffer, message: `${parent.name} want a ${formatMoney(requestedFee)} loan fee and at least ${requestedShare}% of the player's wages.` };
    }
    return { career, status: "rejected", message: `${parent.name} reject the loan terms. Their minimum is ${formatMoney(requestedFee)} with a ${requestedShare}% wage contribution.` };
  }
  const userClub = getClub(career);
  if (isBorrower && (offer.loanFee > userClub.transferBudget || offer.loanFee > userClub.balance)) {
    return { career, status: "rejected", message: "The loan fee is above the club's available transfer budget or cash balance." };
  }
  if (isLender && (offer.loanFee > borrower.transferBudget || offer.loanFee > borrower.balance)) {
    return { career, status: "rejected", message: `${borrower.name} cannot cover the loan fee from its current funds.` };
  }
  const next: Career = structuredClone(career);
  const loanPlayer = next.players.find((item) => item.id === playerId)!;
  const nextParent = next.clubs.find((club) => club.id === parent.id)!;
  const nextBorrower = next.clubs.find((club) => club.id === borrower.id)!;
  closeClubRecord(loanPlayer, nextParent.id, next.season);
  loanPlayer.clubId = nextBorrower.id;
  loanPlayer.clubHistory!.push({ clubId: nextBorrower.id, clubName: nextBorrower.name, country: nextBorrower.country, fromSeason: next.season, toSeason: null, squadLevel: loanPlayer.squadLevel ?? squadLevelForAge(loanPlayer.age), appearances: 0, goals: 0, assists: 0, cleanSheets: 0 });
  const loanId = `loan-${next.id}-s${next.season}-r${next.round}-${playerId}-${(next.playerLoans ?? []).length + 1}`;
  const loan: PlayerLoan = {
    id: loanId, playerId, playerName: loanPlayer.name,
    parentClubId: nextParent.id, parentClubName: nextParent.name, loanClubId: nextBorrower.id, loanClubName: nextBorrower.name,
    startSeason: next.season, startRound: next.round, endSeason: next.season, endRound: next.round + offer.durationRounds - 1,
    loanFee: offer.loanFee, wageContributionPercent: offer.wageContributionPercent, status: "Active",
    startAppearances: loanPlayer.seasonStats?.appearances ?? 0, startGoals: loanPlayer.seasonStats?.goals ?? 0,
  };
  next.playerLoans ??= [];
  next.playerLoans.push(loan);
  nextParent.balance += offer.loanFee;
  nextParent.transferBudget += Math.round(offer.loanFee * 0.1);
  nextBorrower.balance -= offer.loanFee;
  nextBorrower.transferBudget = Math.max(0, nextBorrower.transferBudget - offer.loanFee);
  next.finance.unshift({ date: "Today", label: `Loan fee · ${loanPlayer.name}`, amount: isLender ? offer.loanFee : -offer.loanFee });
  refreshPlayerRelationships(next);
  next.news.unshift({ id: loanId, date: "Today", headline: `${loanPlayer.name} joins ${nextBorrower.name} on loan`, body: `${nextParent.name} agree a ${loan.endRound - loan.startRound + 1}-matchday loan with a ${offer.loanFee ? formatMoney(offer.loanFee) + " fee" : "no fee"}. ${nextBorrower.name} cover ${offer.wageContributionPercent}% of the player's wages.`, type: "transfer" });
  next.news = next.news.slice(0, 28);
  return { career: next, status: "accepted", message: `${loanPlayer.name} joins ${nextBorrower.name} on loan until matchday ${loan.endRound}.` };
}

function closePlayerLoan(career: Career, loan: PlayerLoan, reason: "Completed" | "Recalled" | "Returned" | "Released") {
  const player = career.players.find((item) => item.id === loan.playerId);
  if (!player) return;
  const parent = career.clubs.find((club) => club.id === loan.parentClubId);
  const loanClub = career.clubs.find((club) => club.id === loan.loanClubId);
  const stats = player.seasonStats ?? emptyPlayerStats();
  loan.appearances = Math.max(0, stats.appearances - (loan.startAppearances ?? 0));
  loan.goals = Math.max(0, stats.goals - (loan.startGoals ?? 0));
  loan.status = reason;
  loan.returnSeason = career.season;
  loan.returnReason = reason === "Completed" ? "Agreed loan period ended" : reason === "Recalled" ? "Recalled by parent club" : reason === "Released" ? "Parent club contract ended" : "Returned early by borrowing club";
  closeClubRecord(player, loan.loanClubId, reason === "Completed" ? loan.endSeason : career.season);
  const borrower = career.clubs.find((club) => club.id === loan.loanClubId);
  if (borrower?.captainId === player.id) borrower.captainId = initialLeader(loanClub?.id ?? "", career.players, player.id)?.id;
  if (borrower?.viceCaptainId === player.id) borrower.viceCaptainId = initialLeader(loanClub?.id ?? "", career.players, borrower.captainId)?.id;
  player.clubId = reason === "Released" || !parent || player.contractYears <= 0 ? null : parent.id;
  if (player.clubId && parent) {
    player.clubHistory!.push({ clubId: parent.id, clubName: parent.name, country: parent.country, fromSeason: career.season, toSeason: null, squadLevel: player.squadLevel ?? squadLevelForAge(player.age), appearances: 0, goals: 0, assists: 0, cleanSheets: 0 });
  }
  if (career.clubId === loan.loanClubId) career.lineup = createStartingXI(career.players, career.clubId, career.formation);
  career.news.unshift({ id: `${loan.id}-${reason.toLowerCase()}-s${career.season}-r${career.round}`, date: "Today", headline: reason === "Completed" ? `${player.name} returns from loan` : `${player.name}'s loan ends`, body: reason === "Released" ? `${player.name} becomes a free agent after their parent club contract expires.` : `${player.name} returns to ${parent?.name ?? "free agency"} after ${loan.appearances} appearances and ${loan.goals} goals for ${loanClub?.name ?? loan.loanClubName}.`, type: "transfer" });
  career.news = career.news.slice(0, 28);
}

export function endPlayerLoan(career: Career, loanId: string) {
  const next: Career = structuredClone(career);
  const loan = (next.playerLoans ?? []).find((item) => item.id === loanId && item.status === "Active");
  if (!loan || (loan.parentClubId !== next.clubId && loan.loanClubId !== next.clubId)) return career;
  closePlayerLoan(next, loan, loan.parentClubId === next.clubId ? "Recalled" : "Returned");
  refreshPlayerRelationships(next);
  return next;
}

function settleDuePlayerLoans(career: Career) {
  for (const loan of career.playerLoans ?? []) {
    if (loan.status !== "Active" || loan.endSeason > career.season || (loan.endSeason === career.season && career.round <= loan.endRound)) continue;
    const player = career.players.find((item) => item.id === loan.playerId);
    closePlayerLoan(career, loan, !player || player.age >= 36 || player.contractYears <= 0 ? "Released" : "Completed");
  }
  refreshPlayerRelationships(career);
}

export function getTransferDemand(career: Career, playerId: string): PlayerTransferDemand | null {
  if (!getScoutingReport(career, playerId) || (career.playerLoans ?? []).some((loan) => loan.playerId === playerId && loan.status === "Active")) return null;
  const player = getTransferPlayer(career, playerId);
  if (!player || player.age < 18 || player.clubId === career.clubId) return null;
  const seller = player.clubId ? career.clubs.find((club) => club.id === player.clubId) : null;
  if (player.clubId && !seller) return null;
  const expiringDiscount = player.contractYears <= 1 ? 0.72 : player.contractYears === 2 ? 0.84 : player.contractYears >= 4 ? 0.98 : 0.91;
  const veteranDiscount = player.age >= 31 ? 0.78 : 1;
  const financialPressure = seller && seller.balance < 350_000 ? 0.88 : 1;
  const starPremium = seller && player.overall >= seller.reputation + 18 ? 1.1 : 1;
  const fee = seller ? Math.max(10_000, Math.round(player.value * expiringDiscount * veteranDiscount * financialPressure * starPremium / 1_000) * 1_000) : 0;
  const growthPremium = Math.max(0, player.potential - player.overall) * (player.age < 24 ? 13 : 6);
  const personalityPremium = player.personality === "Ambitious" ? 1.12 : player.personality === "Natural leader" ? 1.07 : player.personality === "Team-first" ? 0.97 : 1;
  const weeklyWage = Math.max(player.wage, Math.round(Math.max(player.overall * 44 + growthPremium, player.wage) * personalityPremium / 100) * 100);
  const years = player.age <= 20 ? 4 : player.age <= 25 ? 3 : player.age <= 30 ? 2 : 1;
  const role = player.contractRole ?? defaultContractSquadRole(player);
  const signingBonus = Math.round(weeklyWage * (player.personality === "Ambitious" ? 8 : 5) / 100) * 100;
  const reason = seller
    ? seller.name + " value the player at " + formatMoney(fee) + (player.contractYears <= 1 ? " because the current deal is nearing expiry" : player.contractYears >= 4 ? " with several years left on the current deal" : "") + ". The player wants a " + years + "-year deal as " + role.toLowerCase() + "."
    : "The free agent is looking for a " + years + "-year deal as " + role.toLowerCase() + ", with a signing bonus to complete the move.";
  return { fee, weeklyWage, years, squadRole: role, signingBonus, sellerClubName: seller?.name ?? "Free agent", reason };
}

export function negotiateTransferOffer(career: Career, playerId: string, offer: PlayerTransferOffer): PlayerTransferNegotiation {
  const player = getTransferPlayer(career, playerId);
  const demand = getTransferDemand(career, playerId);
  if (!player || !demand || !["Prospect", "Rotation", "First team", "Important", "Star"].includes(offer.squadRole)
    || !Number.isFinite(offer.fee) || offer.fee < 0 || !Number.isFinite(offer.weeklyWage) || offer.weeklyWage < 100
    || !Number.isInteger(offer.years) || offer.years < 1 || offer.years > 5 || !Number.isFinite(offer.signingBonus) || offer.signingBonus < 0) {
    return { career, status: "rejected", message: "This bid needs a valid transfer fee, wage, one-to-five-year contract, squad role and signing bonus." };
  }
  const club = getClub(career);
  if (offer.fee > club.transferBudget) return { career, status: "rejected", message: "The transfer fee is above the club's remaining transfer budget." };
  if (offer.fee + offer.signingBonus > club.balance) return { career, status: "rejected", message: "The club cannot cover the fee and signing bonus from its current balance." };

  const seller = player.clubId ? career.clubs.find((item) => item.id === player.clubId) : null;
  if (!seller && offer.fee > 0) return { career, status: "rejected", message: "A free agent has no selling club, so the transfer fee must be zero." };
  if (seller && offer.fee < demand.fee) {
    if (offer.fee >= demand.fee * 0.62) {
      const counterOffer = { ...offer, fee: demand.fee };
      return { career, status: "countered", counterOffer, message: seller.name + " reject the opening bid and counter at " + formatMoney(demand.fee) + "." };
    }
    return { career, status: "rejected", message: seller.name + " turn down the bid. Their current valuation is " + formatMoney(demand.fee) + "." };
  }

  const effectivePay = offer.weeklyWage + offer.signingBonus / Math.max(52, offer.years * 52);
  const payRatio = effectivePay / Math.max(1, demand.weeklyWage);
  const roleGap = CONTRACT_ROLE_LEVEL[offer.squadRole] - CONTRACT_ROLE_LEVEL[demand.squadRole];
  const termGap = offer.years - demand.years;
  const payScore = Math.max(-55, Math.min(22, (payRatio - 1) * 90));
  const roleScore = roleGap >= 0 ? roleGap * 9 : roleGap * 14;
  const termScore = termGap >= 0 ? Math.min(8, termGap * 2) : termGap * 5;
  const personalityScore = player.personality === "Team-first" ? 4 : player.personality === "Professional" ? 3 : player.personality === "Natural leader" ? 2 : player.personality === "Ambitious" ? -5 : player.personality === "Fiery" ? -2 : 0;
  const willingness = Math.max(0, Math.min(100, Math.round(68 + payScore + roleScore + termScore + personalityScore)));
  if (payRatio < 0.8 || willingness < 60) {
    if (payRatio < 0.55 && roleGap < -1) return { career, status: "rejected", message: player.name + " and their representative reject the personal terms." };
    const counterOffer: PlayerTransferOffer = {
      ...offer,
      weeklyWage: Math.max(demand.weeklyWage, offer.weeklyWage),
      years: termGap < 0 ? demand.years : offer.years,
      squadRole: roleGap < 0 ? demand.squadRole : offer.squadRole,
      signingBonus: Math.max(demand.signingBonus, offer.signingBonus),
    };
    return { career, status: "countered", counterOffer, message: player.name + "'s representative counter with improved pay, contract length or squad status." };
  }

  const next = buyPlayer(career, playerId, offer.fee, offer);
  if (next === career) return { career, status: "rejected", message: "The transfer could not be completed with the club's available funds." };
  return { career: next, status: "accepted", message: player.name + " agrees the move to " + club.name + " on a " + offer.years + "-year deal." };
}

export function canOpenContractTalks(career: Career, playerId: string) {
  const player = career.players.find((item) => item.id === playerId && item.clubId === career.clubId);
  return Boolean(player && player.age >= 16 && !(player.lastContractTalkSeason === career.season && career.round - (player.lastContractTalkRound ?? career.round) < 3));
}

export function negotiatePlayerContract(career: Career, playerId: string, offer: PlayerContractOffer): PlayerContractNegotiation {
  const player = career.players.find((item) => item.id === playerId && item.clubId === career.clubId && item.age >= 16);
  const demand = getContractDemand(career, playerId);
  if (!player || !demand || !["Prospect", "Rotation", "First team", "Important", "Star"].includes(offer.squadRole)
    || !Number.isFinite(offer.weeklyWage) || offer.weeklyWage < 100 || !Number.isInteger(offer.years) || offer.years < 1 || offer.years > 5
    || !Number.isFinite(offer.signingBonus) || offer.signingBonus < 0) {
    return { career, accepted: false, willingness: 0, message: "The offer needs a valid player, wage, one-to-five-year term, squad role and non-negative signing bonus." };
  }
  if (!canOpenContractTalks(career, playerId)) {
    return { career, accepted: false, willingness: 0, message: `${player.name} has asked for time after the last meeting. Return after three matchdays.` };
  }
  const club = getClub(career);
  if (offer.signingBonus > club.balance) {
    return { career, accepted: false, willingness: 0, message: `The club cannot cover the ${formatMoney(offer.signingBonus, true)} signing bonus from its current balance.` };
  }

  const effectiveWeeklyPay = offer.weeklyWage + offer.signingBonus / Math.max(52, offer.years * 52);
  const payRatio = effectiveWeeklyPay / Math.max(1, demand.weeklyWage);
  const roleGap = CONTRACT_ROLE_LEVEL[offer.squadRole] - CONTRACT_ROLE_LEVEL[demand.squadRole];
  const termGap = offer.years - demand.years;
  const payScore = Math.max(-55, Math.min(22, (payRatio - 1) * 90));
  const roleScore = roleGap >= 0 ? roleGap * 10 : roleGap * 15;
  const termScore = termGap >= 0 ? Math.min(8, termGap * (player.age > 31 ? -3 : 2)) : termGap * 5;
  const rapportScore = ((player.managerRapport ?? 58) - 55) * 0.18;
  const personalityScore = player.personality === "Team-first" ? 4 : player.personality === "Professional" ? 3 : player.personality === "Natural leader" ? 2 : player.personality === "Ambitious" ? -5 : player.personality === "Fiery" ? -2 : 0;
  const willingness = Math.max(0, Math.min(100, Math.round(67 + payScore + roleScore + termScore + rapportScore + personalityScore)));
  const accepted = payRatio >= 0.8 && willingness >= 60;
  const next = structuredClone(career);
  const nextPlayer = next.players.find((item) => item.id === playerId)!;
  const nextClub = getClub(next);
  if (accepted) {
    nextPlayer.wage = Math.round(offer.weeklyWage / 10) * 10;
    nextPlayer.contractYears = offer.years;
    nextPlayer.contractRole = offer.squadRole;
    nextPlayer.morale = Math.min(100, nextPlayer.morale + 5);
    nextPlayer.managerRapport = Math.min(100, (nextPlayer.managerRapport ?? 58) + 6);
    delete nextPlayer.lastContractTalkSeason;
    delete nextPlayer.lastContractTalkRound;
    nextClub.balance -= offer.signingBonus;
    if (offer.signingBonus > 0) next.finance.unshift({ date: "Today", label: `Contract signing bonus · ${nextPlayer.name}`, amount: -offer.signingBonus });
    next.news.unshift({ id: `player-contract-${playerId}-${next.season}-${next.round}`, date: "Today", headline: `${nextPlayer.name} commits to ${nextClub.name}`, body: `${nextPlayer.name} signs for ${offer.years} year${offer.years === 1 ? "" : "s"} on ${formatMoney(nextPlayer.wage, true)} per week as a ${offer.squadRole.toLowerCase()}. The signing bonus is ${formatMoney(offer.signingBonus, true)}.`, type: "club" });
    next.news = next.news.slice(0, 28);
    return { career: next, accepted: true, willingness, message: `${player.name} accepts ${offer.years} year${offer.years === 1 ? "" : "s"} at ${formatMoney(nextPlayer.wage, true)} per week as a ${offer.squadRole.toLowerCase()}.` };
  }

  nextPlayer.morale = Math.max(15, nextPlayer.morale - (willingness < 40 ? 4 : 2));
  nextPlayer.managerRapport = Math.max(0, (nextPlayer.managerRapport ?? 58) - (willingness < 40 ? 5 : 3));
  nextPlayer.lastContractTalkSeason = next.season;
  nextPlayer.lastContractTalkRound = next.round;
  const reason = roleGap < 0
    ? `They want at least a ${demand.squadRole.toLowerCase()} squad role.`
    : offer.years < demand.years
      ? `They want a contract closer to ${demand.years} years.`
      : `They are seeking at least ${formatMoney(demand.weeklyWage, true)} per week, with a ${formatMoney(demand.signingBonus, true)} signing bonus.`;
  next.news.unshift({ id: `contract-talks-${playerId}-${next.season}-${next.round}`, date: "Today", headline: `Contract talks stall with ${player.name}`, body: `${player.name} has turned down the current proposal. ${reason} The player wants time before another meeting.`, type: "press" });
  next.news = next.news.slice(0, 28);
  return { career: next, accepted: false, willingness, message: `${player.name} turns down the offer. ${reason} Wait three matchdays before reopening talks.` };
}

export function renewContract(career: Career, playerId: string) {
  const demand = getContractDemand(career, playerId);
  if (!demand) return career;
  return negotiatePlayerContract(career, playerId, demand).career;
}

export function sponsorProposal(career: Career) {
  const next = structuredClone(career);
  const club = getClub(next);
  const companies = ["Morrow Works", "Lumen Mobile", "Crownwell Insurance", "Northstar Energy", "Asteron Motors", "Bluehaven Bank", "Copperline Travel", "Evergreen Foods", "Foundry Cloud", "Granite Telecom", "Harbor & Heath", "Juniper Athletic", "Kestrel Sportswear", "Larkspur Hotels", "Meridian Mobility", "Redwood Brewing"];
  const slots: SponsorSlot[] = ["shirt", "stadium", "boards", "training", "academy"];
  const seed = next.season * 11 + next.round * 7 + next.news.length;
  const commercialUplift = getResponsibilityEffects(next).commercialUplift;
  club.sponsorOffers = Array.from({ length: 5 }, (_, index) => {
    const slot = slots[index];
    const company = companies[(seed + index * 3) % companies.length];
    const multiplier = slot === "shirt" ? 18000 : slot === "stadium" ? 14500 : slot === "boards" ? 8500 : 6500;
    const annual = Math.round((club.reputation * (multiplier + next.season * 180) * (0.82 + index * 0.08) * (1 + commercialUplift)) / 1000) * 1000;
    const years = 1 + ((seed + index) % 4);
    return { id: `offer-${next.season}-${seed}-${index}`, company, slot, annual, years, signingBonus: Math.round(annual * (0.12 + (index % 3) * 0.04)) };
  });
  const lead = club.sponsorOffers[0];
  club.sponsorOffer = { name: lead.company, annual: lead.annual };
  return next;
}

export function acceptSponsor(career: Career, offerId?: string) {
  const next = structuredClone(career);
  const club = getClub(next);
  const offer = club.sponsorOffers?.find((item) => item.id === offerId) ?? club.sponsorOffers?.[0];
  if (!offer && !club.sponsorOffer) return career;
  const accepted = offer ?? { id: `legacy-${Date.now()}`, company: club.sponsorOffer!.name, slot: "shirt" as SponsorSlot, annual: club.sponsorOffer!.annual, years: 2, signingBonus: 0 };
  club.sponsorContracts = (club.sponsorContracts ?? []).filter((contract) => contract.slot !== accepted.slot);
  club.sponsorContracts.push({ id: `contract-${accepted.id}`, company: accepted.company, slot: accepted.slot, annual: accepted.annual, yearsRemaining: accepted.years, signedSeason: next.season });
  if (accepted.slot === "shirt") {
    club.sponsor = accepted.company;
    club.sponsorAnnual = accepted.annual;
  }
  club.balance += accepted.signingBonus;
  next.finance.unshift({ date: "Today", label: `${accepted.slot} sponsorship signing bonus · ${accepted.company}`, amount: accepted.signingBonus });
  club.sponsorOffers = (club.sponsorOffers ?? []).filter((item) => item.id !== accepted.id);
  club.sponsorOffer = null;
  return next;
}

function isBoardRole(role: StaffRole) {
  return role === "Chairperson" || role === "Sporting Director" || role === "Finance Director" || role === "Supporter Director";
}

function responsibilityPeople(club: Club) {
  return [...(club.staff ?? []), ...(club.board ?? [])];
}

function defaultClubResponsibilities(staff: StaffMember[] = [], board: StaffMember[] = []): ClubResponsibilities {
  const people = [...staff, ...board];
  return Object.fromEntries(CLUB_RESPONSIBILITY_DEFINITIONS.map((definition) => {
    const best = people.filter((person) => definition.roles.includes(person.role)).sort((first, second) => second.ability - first.ability)[0];
    return [definition.id, best?.id ?? null];
  })) as ClubResponsibilities;
}

function ensureClubResponsibilities(club: Club) {
  const people = responsibilityPeople(club);
  if (!club.responsibilities || typeof club.responsibilities !== "object" || Array.isArray(club.responsibilities)) {
    club.responsibilities = defaultClubResponsibilities(club.staff, club.board);
  }
  for (const definition of CLUB_RESPONSIBILITY_DEFINITIONS) {
    if (!Object.prototype.hasOwnProperty.call(club.responsibilities, definition.id)) {
      const replacement = people.filter((person) => definition.roles.includes(person.role)).sort((first, second) => second.ability - first.ability)[0];
      club.responsibilities[definition.id] = replacement?.id ?? null;
      continue;
    }
    const currentId = club.responsibilities[definition.id];
    if (currentId === null) continue;
    const current = people.find((person) => person.id === currentId && definition.roles.includes(person.role));
    if (current) continue;
    const replacement = people.filter((person) => definition.roles.includes(person.role)).sort((first, second) => second.ability - first.ability)[0];
    club.responsibilities[definition.id] = replacement?.id ?? null;
  }
}

function responsibilityMember(club: Club, area: ResponsibilityArea) {
  const definition = CLUB_RESPONSIBILITY_DEFINITIONS.find((item) => item.id === area)!;
  return responsibilityPeople(club).find((person) => person.id === club.responsibilities?.[area] && definition.roles.includes(person.role)) ?? null;
}

function responsibilityAbility(career: Career, area: ResponsibilityArea) {
  const club = getClub(career);
  const person = responsibilityMember(club, area);
  if (!person) return 50;
  const workload = Object.values(club.responsibilities ?? {}).filter((personId) => personId === person.id).length;
  return Math.max(20, person.ability - Math.max(0, workload - 1) * 7);
}

export function getResponsibilityOptions(career: Career, area: ResponsibilityArea) {
  const definition = CLUB_RESPONSIBILITY_DEFINITIONS.find((item) => item.id === area)!;
  return responsibilityPeople(getClub(career)).filter((person) => definition.roles.includes(person.role)).sort((first, second) => second.ability - first.ability);
}

export function getClubResponsibilities(career: Career) {
  const club = getClub(career);
  const definitions = CLUB_RESPONSIBILITY_DEFINITIONS;
  return definitions.map((definition) => {
    const assigned = responsibilityMember(club, definition.id);
    const ability = responsibilityAbility(career, definition.id);
    const effect = definition.id === "matchPreparation" ? `Assistant insight ${ability}/100`
      : definition.id === "firstTeamTraining" ? `${getResponsibilityTrainingBonus(ability) >= 0 ? "+" : ""}${(getResponsibilityTrainingBonus(ability) * 100).toFixed(1)}% weekly development chance`
        : definition.id === "academyDevelopment" ? `+${Math.max(0, Math.round((ability - 50) * 0.08))} intake potential`
          : definition.id === "scouting" ? `${Math.round(Math.max(0, Math.min(0.2, (ability - 50) * 0.003)) * 100)}% report discount`
            : definition.id === "commercial" ? `${Math.round(Math.max(0, Math.min(0.12, (ability - 50) * 0.0025)) * 100)}% sponsor uplift`
              : `${Math.max(0, Math.min(2, Math.floor((ability - 50) / 20)))} confidence protected after a defeat`;
    return { ...definition, options: getResponsibilityOptions(career, definition.id), assigned, effectiveAbility: ability, effect };
  });
}

export function getResponsibilityEffects(career: Career) {
  const ability = (area: ResponsibilityArea) => responsibilityAbility(career, area);
  return {
    matchInsight: ability("matchPreparation"),
    trainingBonus: getResponsibilityTrainingBonus(ability("firstTeamTraining")),
    academyPotentialBonus: Math.max(0, Math.min(5, Math.round((ability("academyDevelopment") - 50) * 0.08))),
    scoutingDiscount: Math.max(0, Math.min(0.2, (ability("scouting") - 50) * 0.003)),
    commercialUplift: Math.max(0, Math.min(0.12, (ability("commercial") - 50) * 0.0025)),
    supporterConfidenceShield: Math.max(0, Math.min(2, Math.floor((ability("supporters") - 50) / 20))),
  };
}

function getResponsibilityTrainingBonus(ability: number) {
  return Math.max(-0.005, Math.min(0.012, (ability - 50) * 0.00025));
}

const PROJECT_ROLE_ALIGNMENT: Record<ClubProjectKind, Partial<Record<StaffRole, number>>> = {
  league: { Chairperson: 12, "Sporting Director": 18, "Finance Director": -8, "Supporter Director": 5 },
  academy: { Chairperson: 8, "Sporting Director": 12, "Finance Director": -2, "Supporter Director": 18 },
  stadium: { Chairperson: 12, "Sporting Director": 3, "Finance Director": 14, "Supporter Director": 12 },
  finances: { Chairperson: 8, "Sporting Director": -4, "Finance Director": 22, "Supporter Director": 0 },
};

type BoardAgendaBlueprint = {
  title: string;
  sponsorRole: StaffRole;
  choices: { id: BoardAgendaChoiceId; label: string; alignment: Partial<Record<StaffRole, number>> }[];
};

const BOARD_AGENDA_BLUEPRINTS: Record<BoardAgendaKind, BoardAgendaBlueprint> = {
  results: {
    title: "Results and the club's direction",
    sponsorRole: "Chairperson",
    choices: [
      { id: "public-backing", label: "Back the manager publicly", alignment: { Chairperson: 8, "Supporter Director": 4, "Finance Director": 1, "Sporting Director": 2 } },
      { id: "tactical-review", label: "Commission a tactical review", alignment: { "Sporting Director": 12, Chairperson: -2, "Finance Director": 3, "Supporter Director": 1 } },
    ],
  },
  finance: {
    title: "Cash flow and spending controls",
    sponsorRole: "Finance Director",
    choices: [
      { id: "cash-controls", label: "Move transfer funds into reserves", alignment: { "Finance Director": 14, Chairperson: 3, "Sporting Director": -3, "Supporter Director": 1 } },
      { id: "working-capital", label: "Take a short-term working-capital loan", alignment: { "Finance Director": -8, Chairperson: 7, "Sporting Director": 4, "Supporter Director": 1 } },
    ],
  },
  supporters: {
    title: "Supporter confidence and community contact",
    sponsorRole: "Supporter Director",
    choices: [
      { id: "supporter-forum", label: "Hold a supporter listening forum", alignment: { "Supporter Director": 12, Chairperson: 3, "Finance Director": 2, "Sporting Director": 1 } },
      { id: "community-day", label: "Fund a community open day", alignment: { "Supporter Director": 8, Chairperson: 4, "Finance Director": -5, "Sporting Director": 2 } },
    ],
  },
  "dressing-room": {
    title: "Dressing-room confidence",
    sponsorRole: "Sporting Director",
    choices: [
      { id: "captains-council", label: "Let the captain lead a squad council", alignment: { "Supporter Director": 8, "Sporting Director": 5, Chairperson: 1, "Finance Director": 0 } },
      { id: "manager-standards", label: "Set new standards with the manager", alignment: { "Sporting Director": 8, Chairperson: 4, "Finance Director": 1, "Supporter Director": -5 } },
    ],
  },
  academy: {
    title: "Youth development investment",
    sponsorRole: "Sporting Director",
    choices: [
      { id: "academy-expansion", label: "Expand academy provision", alignment: { "Sporting Director": 11, "Supporter Director": 4, Chairperson: 2, "Finance Director": -7 } },
      { id: "coach-investment", label: "Invest in first-team and youth coaching", alignment: { "Sporting Director": 8, Chairperson: 2, "Supporter Director": 4, "Finance Director": -3 } },
    ],
  },
};

const AGENDA_CHOICE_DETAILS: Record<BoardAgendaChoiceId, string> = {
  "cash-controls": "Reduce the transfer budget and move the same amount into the club balance. No new debt is created.",
  "working-capital": "Bring in short-term cash for operations, while recording the same amount as new debt.",
  "supporter-forum": "Listen to supporter concerns and rebuild confidence without a major event cost.",
  "community-day": "Pay for a club-hosted community event to make a stronger public commitment.",
  "captains-council": "Give senior players a direct role in repairing unity and their relationship with the manager.",
  "manager-standards": "The manager leads a reset of expectations; tactical familiarity rises, but some players may resent it.",
  "public-backing": "Public support steadies the board, players and supporters while results are scrutinised.",
  "tactical-review": "Give the sporting department authority to review the system; tactical familiarity improves, but the public backing is cooler.",
  "academy-expansion": "Pay for one academy level now, improving future development and youth intake quality.",
  "coach-investment": "Pay for one training level now, improving player development across the club.",
};

function boardAgendaChoiceCost(career: Career, choiceId: BoardAgendaChoiceId) {
  const club = getClub(career);
  if (choiceId === "working-capital") {
    const weeklyWages = career.players.filter((player) => player.clubId === club.id).reduce((sum, player) => sum + player.wage, 0)
      + weeklyManagementPayroll(career, club);
    return Math.max(250_000, weeklyWages * 12);
  }
  if (choiceId === "community-day") return Math.max(12_000, Math.round(club.reputation * 650));
  if (choiceId === "academy-expansion") return getClubFacilityUpgradeCost(club.academyLevel, "academyLevel");
  if (choiceId === "coach-investment") return getClubFacilityUpgradeCost(club.trainingLevel, "trainingLevel");
  return 0;
}

function isBoardAgendaExpense(choiceId: BoardAgendaChoiceId) {
  return choiceId === "community-day" || choiceId === "academy-expansion" || choiceId === "coach-investment";
}

function boardAgendaVotes(career: Career, choiceId: BoardAgendaChoiceId): BoardProjectVote[] {
  const club = getClub(career);
  const blueprint = Object.values(BOARD_AGENDA_BLUEPRINTS).flatMap((item) => item.choices).find((choice) => choice.id === choiceId);
  if (!blueprint) return [];
  return (club.board ?? []).map((person) => {
    const roleAlignment = blueprint.alignment[person.role] ?? 0;
    const score = Math.max(0, Math.min(100, Math.round(48 + (club.boardTrust - 50) * 0.18 + (person.ability - 50) * 0.2 + roleAlignment)));
    return { memberId: person.id, name: person.name, role: person.role, score, vote: score >= 50 ? "For" : "Against" };
  });
}

function refreshClubBoardAgenda(career: Career) {
  if (career.unemployed) return;
  const club = getClub(career);
  club.boardAgenda ??= [];
  const currentSeasonItems = club.boardAgenda.filter((item) => item.season === career.season);
  if (currentSeasonItems.some((item) => item.status === "Open") || currentSeasonItems.length >= 2) return;

  const firstTeam = career.players.filter((player) => player.clubId === club.id && player.age >= 16);
  const averageRapport = firstTeam.length ? firstTeam.reduce((sum, player) => sum + (player.managerRapport ?? 58), 0) / firstTeam.length : 58;
  const candidates: { kind: BoardAgendaKind; reason: string }[] = [];
  const debtAlert = Math.max(4_000_000, club.reputation * 100_000);
  if (club.balance < 0 || club.debt > debtAlert) candidates.push({ kind: "finance", reason: club.balance < 0 ? `The club balance is ${formatMoney(club.balance, true)} and operating costs need a response.` : `Club debt has reached ${formatMoney(club.debt, true)}; directors want a plan to protect cash flow.` });
  if ((club.dressingRoomTension ?? 0) >= 48 || averageRapport <= 40) candidates.push({ kind: "dressing-room", reason: (club.dressingRoomTension ?? 0) >= 48 ? `Dressing-room tension is ${Math.round(club.dressingRoomTension ?? 0)} out of 100.` : `First-team rapport with the manager has fallen to ${Math.round(averageRapport)} out of 100.` });
  if (club.supporterConfidence <= 45) candidates.push({ kind: "supporters", reason: `Supporter confidence has fallen to ${club.supporterConfidence} out of 100.` });
  if ((career.pressure ?? 0) >= 42 || (career.winlessRun ?? 0) >= 4 || (career.pressPressure ?? 0) >= 58) candidates.push({ kind: "results", reason: `Managerial pressure is ${(career.pressure ?? 0).toFixed(1)}; form, press scrutiny and the season target are on the agenda.` });
  if (club.academyLevel <= 2 && career.season >= 3 && career.season % 3 === 0) candidates.push({ kind: "academy", reason: `The academy is level ${club.academyLevel}; directors want to review the next step in the youth pathway.` });

  const candidate = candidates.find(({ kind }) => !currentSeasonItems.some((item) => item.kind === kind));
  if (!candidate) return;
  const blueprint = BOARD_AGENDA_BLUEPRINTS[candidate.kind];
  const sponsor = (club.board ?? []).find((person) => person.role === blueprint.sponsorRole) ?? (club.board ?? []).find((person) => person.role === "Chairperson");
  const choices: BoardAgendaChoice[] = blueprint.choices.map(({ id, label }) => {
    const cost = boardAgendaChoiceCost(career, id);
    const costText = cost ? id === "working-capital" ? ` Loan amount: ${formatMoney(cost, true)}.` : ` Cost: ${formatMoney(cost, true)}.` : "";
    return { id, label, detail: `${AGENDA_CHOICE_DETAILS[id]}${costText}`, cost, votes: boardAgendaVotes(career, id) };
  });
  const agenda: ClubBoardAgenda = {
    id: `${club.id}-agenda-${career.season}-${candidate.kind}`,
    clubId: club.id,
    season: career.season,
    round: career.round,
    kind: candidate.kind,
    title: blueprint.title,
    brief: "The board has put this issue to a decision. Choose a response and the recorded director votes will shape the trust adjustment.",
    reason: candidate.reason,
    sponsorName: sponsor?.name ?? "Board chair",
    sponsorRole: sponsor?.role ?? blueprint.sponsorRole,
    choices,
    status: "Open",
  };
  club.boardAgenda = [...club.boardAgenda, agenda].slice(-40);
  career.news.unshift({ id: agenda.id, date: "Board meeting", headline: `${agenda.sponsorName} calls a board meeting`, body: `${agenda.title}: ${agenda.reason}`, type: "club" });
  career.news = career.news.slice(0, 28);
}

export function getCurrentBoardAgenda(career: Career) {
  return (getClub(career).boardAgenda ?? []).filter((item) => item.season === career.season);
}

export function resolveBoardAgenda(career: Career, agendaId: string, choiceId: BoardAgendaChoiceId) {
  const club = getClub(career);
  const agenda = (club.boardAgenda ?? []).find((item) => item.id === agendaId && item.clubId === club.id && item.status === "Open");
  const choice = agenda?.choices.find((item) => item.id === choiceId);
  if (!agenda || !choice || !agenda.choices.some((item) => item.id === choiceId)) return career;
  if (isBoardAgendaExpense(choiceId) && choice.cost > club.balance) return career;

  const next = structuredClone(career);
  const nextClub = getClub(next);
  const nextAgenda = nextClub.boardAgenda!.find((item) => item.id === agendaId)!;
  const nextChoice = nextAgenda.choices.find((item) => item.id === choiceId)!;
  const firstTeam = next.players.filter((player) => player.clubId === nextClub.id && player.age >= 16);
  let resolution = "The board records the decision.";
  if (choiceId === "cash-controls") {
    const reserve = Math.min(nextClub.transferBudget, Math.max(50_000, Math.round(nextClub.transferBudget * 0.25)));
    nextClub.transferBudget -= reserve;
    nextClub.balance += reserve;
    next.finance.unshift({ date: "Board meeting", label: "Transfer reserve moved to cash", amount: reserve });
    resolution = `${formatMoney(reserve, true)} moved from the transfer budget into cash reserves.`;
  } else if (choiceId === "working-capital") {
    nextClub.balance += choice.cost;
    nextClub.debt += choice.cost;
    nextClub.transferBudget += Math.round(choice.cost * 0.35);
    nextClub.boardTrust = Math.max(0, nextClub.boardTrust - 3);
    next.finance.unshift({ date: "Board meeting", label: "Working-capital loan", amount: choice.cost });
    resolution = `${formatMoney(choice.cost, true)} received as working capital; the same amount is added to club debt.`;
  } else if (choiceId === "supporter-forum") {
    nextClub.supporterConfidence = Math.min(100, nextClub.supporterConfidence + 5);
    nextClub.boardTrust = Math.min(100, nextClub.boardTrust + 1);
    resolution = "Supporter confidence rises after the board hears concerns directly.";
  } else if (choiceId === "community-day") {
    nextClub.balance -= choice.cost;
    nextClub.supporterConfidence = Math.min(100, nextClub.supporterConfidence + 9);
    nextClub.boardTrust = Math.min(100, nextClub.boardTrust + 1);
    next.finance.unshift({ date: "Board meeting", label: "Community open day", amount: -choice.cost });
    resolution = `The club funds a community open day for ${formatMoney(choice.cost, true)}; supporter confidence rises.`;
  } else if (choiceId === "captains-council") {
    nextClub.dressingRoomTension = Math.max(0, (nextClub.dressingRoomTension ?? 12) - 14);
    for (const player of firstTeam) { player.morale = Math.min(100, player.morale + 3); player.managerRapport = Math.min(100, (player.managerRapport ?? 58) + 6); }
    const captain = next.players.find((player) => player.id === nextClub.captainId);
    if (captain) captain.managerRapport = Math.min(100, (captain.managerRapport ?? 58) + 3);
    resolution = "The captain's council lowers tension and restores trust across the first team.";
  } else if (choiceId === "manager-standards") {
    nextClub.dressingRoomTension = Math.max(0, (nextClub.dressingRoomTension ?? 12) - 5);
    next.tacticalFamiliarity = Math.min(100, (next.tacticalFamiliarity ?? 55) + 4);
    for (const player of firstTeam) player.managerRapport = Math.max(0, (player.managerRapport ?? 58) - 2);
    resolution = "Tactical familiarity improves, while player rapport dips under the stricter reset.";
  } else if (choiceId === "public-backing") {
    nextClub.boardTrust = Math.min(100, nextClub.boardTrust + 4);
    nextClub.supporterConfidence = Math.min(100, nextClub.supporterConfidence + 2);
    next.pressPressure = Math.max(0, (next.pressPressure ?? 12) - 5);
    next.pressure = Math.max(0, (next.pressure ?? 18) - 4);
    for (const player of firstTeam) { player.morale = Math.min(100, player.morale + 2); player.managerRapport = Math.min(100, (player.managerRapport ?? 58) + 3); }
    resolution = "The public statement steadies the manager, players and supporters.";
  } else if (choiceId === "tactical-review") {
    next.tacticalFamiliarity = Math.min(100, (next.tacticalFamiliarity ?? 55) + 7);
    next.pressure = Math.min(100, (next.pressure ?? 18) + 2);
    for (const player of firstTeam) player.morale = Math.max(0, player.morale - 2);
    resolution = "The sporting department starts a tactical review; familiarity improves as the squad accepts a short-term challenge.";
  } else if (choiceId === "academy-expansion") {
    if (nextClub.academyLevel >= 20) return career;
    nextClub.academyLevel += 1;
    nextClub.balance -= choice.cost;
    next.finance.unshift({ date: "Board meeting", label: "Board-approved academy expansion", amount: -choice.cost });
    resolution = `Academy provision rises to level ${nextClub.academyLevel}.`;
  } else if (choiceId === "coach-investment") {
    if (nextClub.trainingLevel >= 20) return career;
    nextClub.trainingLevel += 1;
    nextClub.balance -= choice.cost;
    next.finance.unshift({ date: "Board meeting", label: "Board-approved coaching investment", amount: -choice.cost });
    resolution = `Training and coaching provision rises to level ${nextClub.trainingLevel}.`;
  }

  const votesFor = nextChoice.votes.filter((vote) => vote.vote === "For").length;
  const votesAgainst = nextChoice.votes.length - votesFor;
  const boardBacked = votesFor > votesAgainst || (votesFor === votesAgainst && nextChoice.votes.find((vote) => vote.role === "Chairperson")?.vote === "For");
  nextClub.boardTrust = Math.max(0, Math.min(100, nextClub.boardTrust + (boardBacked ? 2 : -2)));
  nextAgenda.status = "Resolved";
  nextAgenda.selectedChoice = choiceId;
  nextAgenda.resolution = resolution;
  nextAgenda.resolvedRound = next.round;
  next.news.unshift({ id: `${agendaId}-resolved`, date: "Board meeting", headline: `${nextAgenda.title} · decision recorded`, body: `${nextChoice.label}: ${resolution} Director vote: ${votesFor} for, ${votesAgainst} against.`, type: "club" });
  next.news = next.news.slice(0, 28);
  return next;
}

export function getClubProjectProgress(project: ClubProject) {
  const span = project.target - project.baseline;
  if (span <= 0) return project.current >= project.target ? 100 : 0;
  return Math.max(0, Math.min(100, Math.round(((project.current - project.baseline) / span) * 100)));
}

export function proposeClubProject(career: Career, kind: ClubProjectKind, duration: number) {
  if (![3, 4, 5].includes(duration)) return career;
  const blueprint = CLUB_PROJECT_BLUEPRINTS.find((item) => item.id === kind);
  const currentClub = getClub(career);
  if (!blueprint || currentClub.project?.status === "Active") return career;
  const weeklyWages = career.players.filter((player) => player.clubId === currentClub.id).reduce((total, player) => total + player.wage, 0)
    + weeklyManagementPayroll(career, currentClub);
  const baseline = kind === "league" ? 0
    : kind === "academy" ? currentClub.academyLevel
      : kind === "stadium" ? currentClub.stadium.capacity
        : currentClub.balance;
  const target = kind === "league" ? Math.max(1, Math.ceil(duration * 0.6))
    : kind === "academy" ? Math.min(20, baseline + Math.max(1, Math.ceil(duration / 3)))
      : kind === "stadium" ? baseline + Math.max(2_500, Math.round(baseline * 0.12))
        : baseline + Math.max(750_000, Math.round(weeklyWages * 52 * duration * 0.08));
  if (target <= baseline) return career;
  const metricLabel = kind === "league" ? `Meet the top ${currentClub.targetPosition} target`
    : kind === "academy" ? "Academy level"
      : kind === "stadium" ? "Stadium capacity"
        : "Club balance";
  const unit = kind === "league" ? "target finishes"
    : kind === "academy" ? "academy levels"
      : kind === "stadium" ? "additional seats"
        : "cash growth";
  const brief = kind === "league" ? `Finish in the top ${currentClub.targetPosition} in at least ${target} of the next ${duration} seasons.`
    : kind === "academy" ? `Raise the academy from level ${baseline} to level ${target} within ${duration} seasons.`
      : kind === "stadium" ? `Expand the stadium from ${baseline.toLocaleString("en-GB")} to ${target.toLocaleString("en-GB")} seats within ${duration} seasons.`
        : `Grow the club balance by ${formatMoney(target - baseline, true)} within ${duration} seasons.`;
  const votes: BoardProjectVote[] = (currentClub.board ?? []).map((person) => {
    const alignment = PROJECT_ROLE_ALIGNMENT[kind][person.role] ?? 0;
    const score = Math.max(0, Math.min(100, Math.round(45 + (currentClub.boardTrust - 50) * 0.42 + (person.ability - 50) * 0.2 + alignment)));
    return { memberId: person.id, name: person.name, role: person.role, score, vote: score >= 50 ? "For" : "Against" };
  });
  const forVotes = votes.filter((vote) => vote.vote === "For").length;
  const againstVotes = votes.length - forVotes;
  const chairVote = votes.find((vote) => vote.role === "Chairperson");
  const approved = forVotes > againstVotes || (forVotes === againstVotes && chairVote?.vote === "For");
  const next = structuredClone(career);
  const club = getClub(next);
  if (club.project) club.projectHistory = [club.project, ...(club.projectHistory ?? [])].slice(0, 20);
  const project: ClubProject = {
    id: `${club.id}-project-${career.season}-${career.round}-${(club.projectHistory ?? []).length + 1}`,
    kind,
    title: blueprint.title,
    brief,
    metricLabel,
    unit,
    startSeason: career.season,
    duration,
    seasonsReviewed: 0,
    seasonsRemaining: duration,
    baseline,
    target,
    current: baseline,
    ...(kind === "league" ? { targetPosition: club.targetPosition } : {}),
    status: approved ? "Active" : "Rejected",
    votes,
  };
  club.project = project;
  if (approved) club.boardTrust = Math.min(100, club.boardTrust + 2);
  next.news.unshift({
    id: `club-project-vote-${project.id}`,
    date: "Today",
    headline: approved ? `Board approves ${project.title.toLowerCase()}` : `Board rejects ${project.title.toLowerCase()}`,
    body: `${forVotes} for · ${againstVotes} against. ${project.brief}`,
    type: "club",
  });
  next.news = next.news.slice(0, 28);
  return next;
}

function reviewClubProject(career: Career, finalPosition: number, finishedSeason: number) {
  const club = getClub(career);
  const project = club.project;
  if (!project || project.status !== "Active") return;
  const current = project.kind === "league"
    ? project.current + (finalPosition <= (project.targetPosition ?? club.targetPosition) ? 1 : 0)
    : project.kind === "academy"
      ? club.academyLevel
      : project.kind === "stadium"
        ? club.stadium.capacity
        : club.balance;
  const seasonsReviewed = project.seasonsReviewed + 1;
  const seasonsRemaining = Math.max(0, project.duration - seasonsReviewed);
  const completed = current >= project.target;
  const missed = !completed && seasonsRemaining === 0;
  const status: ClubProjectStatus = completed ? "Completed" : missed ? "Missed" : "Active";
  club.project = { ...project, current, seasonsReviewed, seasonsRemaining, status };
  const progressLabel = project.kind === "league"
    ? `${current} of ${project.target} target finishes`
    : project.kind === "academy"
      ? `Academy level ${current} of ${project.target}`
      : project.kind === "stadium"
        ? `${current.toLocaleString("en-GB")} of ${project.target.toLocaleString("en-GB")} seats`
        : `${formatMoney(current, true)} of ${formatMoney(project.target, true)}`;
  if (completed) {
    club.boardTrust = Math.min(100, club.boardTrust + 6);
    career.pressure = Math.max(0, (career.pressure ?? 18) - 5);
  } else if (missed) {
    club.boardTrust = Math.max(0, club.boardTrust - 7);
    career.pressure = Math.min(100, (career.pressure ?? 18) + 6);
  }
  const headline = completed ? `${project.title} delivered at ${club.name}`
    : missed ? `${club.name} fall short of the ${project.title.toLowerCase()} plan`
      : `${project.title} reviewed · ${club.name}`;
  const outcome = completed ? "The board records the plan as achieved."
    : missed ? "The deadline has passed; the board records the plan as missed."
      : `${seasonsRemaining} season${seasonsRemaining === 1 ? "" : "s"} remain.`;
  career.news.unshift({ id: `club-project-review-${project.id}-${finishedSeason}`, date: "01 Jul", headline, body: `${progressLabel}. ${outcome}`, type: "club" });
  career.news = career.news.slice(0, 28);
}

export function setClubResponsibility(career: Career, area: ResponsibilityArea, staffId: string | null) {
  const definition = CLUB_RESPONSIBILITY_DEFINITIONS.find((item) => item.id === area);
  const club = getClub(career);
  const person = staffId ? responsibilityPeople(club).find((member) => member.id === staffId && definition?.roles.includes(member.role)) : null;
  if (!definition || (staffId && !person)) return career;
  const next = structuredClone(career);
  const nextClub = getClub(next);
  ensureClubResponsibilities(nextClub);
  nextClub.responsibilities![area] = person?.id ?? null;
  next.news.unshift({ id: `responsibility-${area}-${career.season}-${career.round}-${career.news.length}-${staffId ?? "manager"}`, date: "Today", headline: person ? `${person.name} takes responsibility for ${definition.title.toLowerCase()}` : `${definition.title} duties return to the manager`, body: person ? `${person.role} · ${person.ability} ability · ${definition.brief}.` : `The manager will handle ${definition.brief.toLowerCase()} directly.`, type: "club" });
  next.news = next.news.slice(0, 28);
  return next;
}

export function hireStaff(career: Career, staffId: string) {
  const candidate = getWorldStaffById(staffId);
  if (!candidate) return career;
  const assignment = Object.prototype.hasOwnProperty.call(career.staffChanges ?? {}, staffId) ? career.staffChanges?.[staffId] : candidate.clubId;
  if (assignment !== null) return career;
  const next = normalizeCareer(career);
  const club = getClub(next);
  const roster = isBoardRole(candidate.role) ? (club.board ??= []) : (club.staff ??= []);
  const predecessor = roster.find((person) => person.role === candidate.role);
  const signingFee = Math.max(2_000, candidate.wage * 8);
  if (club.balance < signingFee) return career;
  if (predecessor) {
    roster.splice(roster.indexOf(predecessor), 1);
    next.staffChanges![predecessor.id] = null;
  }
  const signed: StaffMember = { ...candidate, clubId: club.id, clubName: club.name };
  roster.push(signed);
  ensureClubResponsibilities(club);
  next.staffChanges![candidate.id] = club.id;
  club.balance -= signingFee;
  if (candidate.role === "Chairperson") club.boardTrust = Math.min(100, club.boardTrust + Math.round((candidate.ability - (predecessor?.ability ?? 50)) * 0.08));
  next.finance.unshift({ date: "Today", label: `Staff appointment · ${candidate.name} · ${candidate.role}`, amount: -signingFee });
  next.news.unshift({ id: `staff-hire-${candidate.id}-${next.season}-${next.round}`, date: "Today", headline: `${candidate.name} appointed ${candidate.role.toLowerCase()} at ${club.name}`, body: `${candidate.name} joins from ${candidate.region} with ${candidate.experience} years in football and a focus on ${candidate.focus.toLowerCase()}.`, type: "club" });
  next.news = next.news.slice(0, 28);
  return next;
}

export function releaseStaff(career: Career, staffId: string) {
  const next = normalizeCareer(career);
  const club = getClub(next);
  const collection = [club.staff ?? [], club.board ?? []].find((people) => people.some((person) => person.id === staffId));
  const member = collection?.find((person) => person.id === staffId);
  if (!collection || !member) return career;
  collection.splice(collection.indexOf(member), 1);
  ensureClubResponsibilities(club);
  next.staffChanges![staffId] = null;
  const severance = Math.round(member.wage * 4);
  club.balance -= severance;
  if (isBoardRole(member.role)) club.boardTrust = Math.max(0, club.boardTrust - (member.role === "Chairperson" ? 4 : 2));
  next.finance.unshift({ date: "Today", label: `Staff contract ended · ${member.name} · ${member.role}`, amount: -severance });
  next.news.unshift({ id: `staff-release-${member.id}-${next.season}-${next.round}`, date: "Today", headline: `${member.name} leaves ${club.name}`, body: "The club reviews delegated responsibilities and reassigns them to eligible staff where possible.", type: "club" });
  next.news = next.news.slice(0, 28);
  return next;
}

export function launchKitCollection(career: Career) {
  const next = normalizeCareer(career);
  const club = getClub(next);
  if (next.round <= getSeasonWeekCount(next) || next.kitCollectionSeason === next.season || !next.kitDesignReady) return career;
  const patternCount = Object.values(next.kitPatterns!).filter((pattern) => pattern !== "Solid").length;
  const revenue = Math.round(club.reputation * (1450 + patternCount * 190) * (0.75 + club.supporterConfidence / 200));
  club.balance += revenue;
  next.kitCollectionSeason = next.season;
  next.kitDesignReady = true;
  next.finance.unshift({ date: "End of season", label: "New kit collection sales", amount: revenue });
  next.news.unshift({ id: `kits-${next.season}`, date: "End of season", headline: `${club.name} launch next season's kit collection`, body: `The new home, away and third shirts generate ${formatMoney(revenue)} in launch sales.`, type: "club" });
  return next;
}

export function getAcademyPlayers(career: Career) {
  return career.players.filter((player) => player.clubId === career.clubId && player.age < 21).sort((a, b) => a.age - b.age || b.potential - a.potential);
}

export function getYouthCandidates(career: Career) {
  return career.players.filter((player) => player.clubId === null && player.age < 18).sort((a, b) => a.age - b.age || b.potential - a.potential);
}

function worldPlayerToPlayer(player: NonNullable<ReturnType<typeof getWorldPlayerDetails>>): Player {
  const personality = personalityForPlayer(player.id);
  return {
    id: player.id,
    name: player.name,
    age: player.age,
    position: player.position,
    overall: player.overall,
    potential: player.potential,
    wage: player.wage,
    value: player.value,
    contractYears: player.contractYears,
    morale: player.morale,
    clubId: player.clubId,
    trainingFocus: player.trainingFocus,
    nationality: player.nationality,
    country: player.country,
    squadLevel: player.squadLevel,
    managerRapport: player.managerRapport,
    role: player.role,
    dateOfBirth: player.dateOfBirth,
    birthPlace: player.birthPlace,
    clubHistory: player.clubHistory,
    academyHistory: player.academyHistory,
    careerStats: player.careerStats,
    seasonStats: player.seasonStats,
    attributes: player.attributes,
    personality,
    leadership: leadershipForPlayer(player.id, player.age, personality),
  };
}

export function getScoutingAssignment(career: Career, playerId: string) {
  return (career.scoutingAssignments ?? []).find((assignment) => assignment.playerId === playerId && assignment.managerId === career.id && assignment.clubId === career.clubId) ?? null;
}

export function getScoutingDaysRemaining(career: Career, playerId: string) {
  const assignment = getScoutingAssignment(career, playerId);
  if (!assignment) return 0;
  const current = new Date(`${getCalendarDate(career)}T12:00:00.000Z`).getTime();
  const available = new Date(`${assignment.availableDate}T12:00:00.000Z`).getTime();
  return Math.max(0, Math.ceil((available - current) / 86_400_000));
}

export function getScoutingReport(career: Career, playerId: string) {
  const report = (career.scoutingReports ?? []).find((item) => item.playerId === playerId && (item.managerId === career.id || item.clubId === career.clubId)) ?? null;
  return report && (!report.availableDate || getCalendarDate(career) >= report.availableDate) ? report : null;
}

function completeDueScoutingAssignments(career: Career, throughDate: string) {
  const pending = career.scoutingAssignments ?? [];
  const completed: ScoutingAssignment[] = [];
  for (let index = pending.length - 1; index >= 0; index -= 1) {
    const assignment = pending[index];
    if (assignment.availableDate > throughDate) continue;
    const player = career.players.find((item) => item.id === assignment.playerId) ?? getWorldPlayerDetails(assignment.playerId);
    pending.splice(index, 1);
    if (!player || (career.scoutingReports ?? []).some((report) => report.playerId === assignment.playerId && report.managerId === assignment.managerId && report.clubId === assignment.clubId)) continue;
    career.scoutingReports ??= [];
    career.scoutingReports.push({
      id: assignment.id,
      playerId: player.id,
      managerId: assignment.managerId,
      clubId: assignment.clubId,
      currentAbility: player.overall,
      potential: player.potential,
      marketValue: player.value,
      season: assignment.season,
      round: assignment.round,
      availableDate: assignment.availableDate,
    });
    career.news.unshift({
      id: `scout-complete-${assignment.id}`,
      date: dateLabel(assignment.availableDate),
      headline: `${player.name} scouting assessment complete`,
      body: `The five-day assessment is filed in ${career.manager}'s manager file and ${getClub(career, assignment.clubId).name}'s club scouting file. Ability, potential and valuation are now available.`,
      type: "club",
    });
    completed.push(assignment);
  }
  return completed;
}

function addScoutingCompletionNews(career: Career, _fromDate: string, throughDate: string) {
  completeDueScoutingAssignments(career, throughDate);
}

export function getScoutingCost(career: Career, playerId: string) {
  if (getScoutingReport(career, playerId) || getScoutingAssignment(career, playerId)) return 0;
  const player = career.players.find((item) => item.id === playerId) ?? getWorldPlayerDetails(playerId);
  if (!player || player.clubId === career.clubId) return 0;
  const base = player.age < 18 ? 1_400 : player.clubId === null ? 1_800 : 2_800;
  const club = getClub(career);
  const levelDiscount = Math.min(0.2, Math.max(0, club.scoutLevel - 1) * 0.04);
  const discount = 1 - Math.min(0.36, levelDiscount + getResponsibilityEffects(career).scoutingDiscount);
  const dna = club.dna ?? createClubDNA(club.id, club.name, club.reputation);
  const playerCountry = "country" in player ? String(player.country ?? "") : "";
  const recruitmentDiscount = dna.recruitmentPolicy === "Academy pathway" && player.age < 18
    ? 0.18
    : dna.recruitmentPolicy === "Regional scouting" && playerCountry === club.country
      ? 0.18
      : dna.recruitmentPolicy === "Value market" && player.clubId === null
        ? 0.16
        : dna.recruitmentPolicy === "Proven talent" && player.age >= 25
          ? 0.12
          : 0;
  return Math.round((base * discount * (1 - recruitmentDiscount)) / 100) * 100;
}

export function scoutPlayer(career: Career, playerId: string) {
  const next = normalizeCareer(career);
  if (getScoutingReport(career, playerId) || getScoutingAssignment(career, playerId)) return career;
  const player = next.players.find((item) => item.id === playerId) ?? getWorldPlayerDetails(playerId);
  const club = getClub(next);
  if (!player || player.clubId === club.id) return career;
  const cost = getScoutingCost(career, playerId);
  if (!cost || club.balance < cost) return career;
  const commissionedDate = getCalendarDate(next);
  const availableDate = addCalendarDays(commissionedDate, 5);
  const assignment: ScoutingAssignment = {
    id: `scout-${career.id}-${playerId}`,
    playerId,
    managerId: career.id,
    clubId: club.id,
    commissionedDate,
    availableDate,
    season: career.season,
    round: career.round,
  };
  next.scoutingAssignments!.push(assignment);
  club.balance -= cost;
  next.finance.unshift({ date: dateLabel(commissionedDate), label: `Scouting assessment · ${player.name}`, amount: -cost });
  next.news.unshift({ id: assignment.id, date: dateLabel(commissionedDate), headline: `Scouts begin a five-day assessment of ${player.name}`, body: `A detailed ability, potential and valuation report is due ${dateLabel(availableDate)}. The commission is saved to ${career.manager}'s manager file and ${club.name}'s club file.`, type: "club" });
  return next;
}

export function signYouthPlayer(career: Career, playerId: string) {
  const next = normalizeCareer(career);
  if (!getScoutingReport(career, playerId)) return career;
  let prospect = next.players.find((player) => player.id === playerId);
  if (!prospect) {
    const worldPlayer = getWorldPlayerDetails(playerId);
    if (worldPlayer) {
      prospect = worldPlayerToPlayer(worldPlayer);
      next.players.push(prospect);
    }
  }
  const club = getClub(next);
  if (!prospect || prospect.age >= 18 || prospect.clubId === club.id) return career;
  const fee = 8_000 + prospect.age * 3_500 + club.academyLevel * 4_000;
  if (club.balance < fee) return career;
  prospect.clubId = club.id;
  prospect.squadLevel = squadLevelForAge(prospect.age);
  prospect.contractYears = prospect.age >= 16 ? 2 : 0;
  prospect.wage = prospect.age >= 16 ? Math.round(prospect.overall * 6) : 0;
  prospect.morale = 78;
  prospect.managerRapport = 65;
  prospect.clubHistory ??= [];
  prospect.clubHistory.forEach((record) => { if (record.toSeason === null) record.toSeason = next.season; });
  prospect.clubHistory.push({ clubId: club.id, clubName: `${club.name} Academy`, country: club.country, fromSeason: next.season, toSeason: null, squadLevel: prospect.squadLevel, appearances: 0, goals: 0, assists: 0, cleanSheets: 0 });
  prospect.academyHistory ??= [];
  prospect.academyHistory.push({ season: next.season, age: prospect.age, squadLevel: prospect.squadLevel, academyLevel: club.academyLevel });
  club.balance -= fee;
  next.finance.unshift({ date: "Today", label: `Academy registration · ${prospect.name}`, amount: -fee });
  next.news.unshift({ id: `youth-sign-${prospect.id}`, date: "Today", headline: `${prospect.name} joins the ${club.name} academy`, body: `The ${prospect.age}-year-old prospect signs a ${prospect.age >= 16 ? "scholarship agreement" : "youth development registration"}.`, type: "transfer" });
  return next;
}

export function setYouthTraining(career: Career, playerId: string, focus: string) {
  if (!TRAINING_OPTIONS.includes(focus)) return career;
  const next = structuredClone(career);
  const player = next.players.find((item) => item.id === playerId && item.clubId === next.clubId && item.age < 21);
  if (!player) return career;
  player.trainingFocus = focus;
  return next;
}

export function setPlayerTraining(career: Career, playerId: string, focus: string) {
  if (!TRAINING_OPTIONS.includes(focus)) return career;
  const next = structuredClone(career);
  const player = next.players.find((item) => item.id === playerId && item.clubId === next.clubId);
  if (!player) return career;
  player.trainingFocus = focus;
  return next;
}

export function setPlayerRole(career: Career, playerId: string, role: string) {
  const next = structuredClone(career);
  const player = next.players.find((item) => item.id === playerId && item.clubId === next.clubId);
  if (!player || !POSITION_ROLE_OPTIONS[player.position].includes(role as TacticalRole) || player.role === role) return career;
  player.role = role;
  player.roleFamiliarity = 35;
  return next;
}

export function promoteYouth(career: Career, playerId: string) {
  const next = normalizeCareer(career);
  const player = next.players.find((item) => item.id === playerId && item.clubId === next.clubId && item.age >= 16 && item.age < 21);
  if (!player) return career;
  if (player.squadLevel === "First team") return career;
  if (player.squadLevel === "U18" && player.age >= 16) player.squadLevel = "Reserves";
  else if (player.squadLevel === "Reserves" && player.age >= 18) player.squadLevel = "First team";
  else return career;
  player.contractYears = Math.max(3, player.contractYears);
  player.wage = Math.max(player.wage, Math.round(player.overall * (player.squadLevel === "First team" ? 24 : 12)));
  const current = player.clubHistory?.find((record) => record.clubId === next.clubId && record.toSeason === null);
  if (current) current.squadLevel = player.squadLevel;
  if (player.academyHistory?.at(-1)?.squadLevel !== player.squadLevel) player.academyHistory?.push({ season: next.season, age: player.age, squadLevel: player.squadLevel, academyLevel: getClub(next).academyLevel });
  return next;
}

export function startStadiumProject(career: Career, name: string, cost: number, weeks: number, upgrades: Partial<Stadium>) {
  const next: Career = structuredClone(career);
  const club = getClub(next);
  if (club.stadium.project || club.boardTrust < 35 || club.balance < cost * 0.55) return career;
  club.balance -= cost;
  club.transferBudget = Math.max(0, club.transferBudget - Math.round(cost * 0.1));
  club.stadium.project = { name, weeksLeft: weeks, cost, upgrades };
  next.finance.unshift({ date: "Today", label: `Construction · ${name}`, amount: -cost });
  next.news.unshift({ id: `works-${Date.now()}`, date: "Today", headline: `Work starts on ${name}`, body: `The board approves a ${weeks}-week project for ${formatMoney(cost)}.`, type: "stadium" });
  return next;
}

export function upgradeClubFacility(career: Career, facility: "academyLevel" | "trainingLevel" | "scoutLevel") {
  const next: Career = structuredClone(career);
  const club = getClub(next);
  const level = club[facility];
  if (level >= 20) return career;
  const price = getClubFacilityUpgradeCost(level, facility);
  if (club.balance < price) return career;
  club[facility] += 1;
  club.balance -= price;
  next.finance.unshift({ date: "Today", label: `Facility investment · ${facility.replace("Level", "")}`, amount: -price });
  return next;
}

export function getClubFacilityUpgradeCost(currentLevel: number, facility: "academyLevel" | "trainingLevel" | "scoutLevel") {
  const base = facility === "scoutLevel" ? 160_000 : 225_000;
  const nextLevel = Math.max(1, Math.floor(currentLevel) + 1);
  const progression = nextLevel <= 15
    ? Math.pow(nextLevel, 1.35)
    : Math.pow(15, 1.35) * Math.pow(2.2, nextLevel - 15);
  return Math.round(base * progression / 1000) * 1000;
}

export function applyForJob(career: Career, clubId: string) {
  const next = normalizeCareer(career);
  if (!next.unemployed || !next.clubs.some((club) => club.id === clubId)) return career;
  next.clubId = clubId;
  next.unemployed = false;
  const appointedClub = getClub(next);
  appointedClub.boardTrust = Math.max(appointedClub.boardTrust, 45);
  appointedClub.supporterConfidence = Math.max(appointedClub.supporterConfidence, 40);
  const previousAppointment = activeManagerCareerAppointment(next);
  if (previousAppointment) endManagerCareerAppointment(next, "Moved", next.round);
  next.managerCareerHistory ??= [];
  next.managerContract = createManagerContract(appointedClub, next.managerReputation, next.season);
  next.managerCareerHistory.push(createManagerCareerAppointment(next.id, appointedClub, next.season, next.round, next.managerCareerHistory.length, next.managerContract));
  next.pressure = Math.max(8, Math.min(40, 20 + (appointedClub.reputation - next.managerReputation) * 0.25 + (62 - appointedClub.boardTrust) * 0.18));
  next.pressPressure = 12;
  next.winlessRun = 0;
  next.tacticalFamiliarity = 42;
  next.managerPromises = [];
  next.matchPreparation = undefined;
  next.managerLeave = null;
  for (const player of next.players.filter((item) => item.clubId === clubId && item.age >= 16)) {
    player.managerRapport = Math.max(38, Math.min(62, 50 + (next.managerReputation - 50) * 0.2));
  }
  next.lineup = createStartingXI(next.players, clubId, next.formation);
  next.news.unshift({ id: `job-${Date.now()}`, date: "Today", headline: `${next.manager} takes charge at ${getClub(next).name}`, body: `The board agree a contract through season ${next.managerContract.endSeason}, worth ${formatMoney(next.managerContract.weeklyWage)} per week, with a top-${next.managerContract.targetPosition} target.`, type: "club" });
  return next;
}

export function formatMoney(amount: number, compact = false) {
  return formatGameCurrency(amount, compact);
}

export function formatPlayerValue(amount: number) {
  return formatMoney(amount, true);
}

export function getFormationSlots(formation: string) {
  return FORMATIONS[formation] ?? FORMATIONS["4-3-3"];
}

const INTERNATIONAL_CAREER_OPTIONS = WORLD_CLUB_SEEDS.map((club) => ({ ...club, leagueName: leagueDefinition(club.leagueId).name }));
export const CLUB_OPTIONS = [...CLUB_SEEDS, ...INTERNATIONAL_CAREER_OPTIONS].map((club) => ({ id: club.short, name: club.name, city: club.city, country: club.country ?? "England", region: club.region, leagueId: club.leagueId, leagueName: leagueDefinition(club.leagueId).name, reputation: club.reputation, colors: club.colors, capacity: club.capacity }));
export const FORMATION_OPTIONS = Object.keys(FORMATIONS);
export const TRAINING_OPTIONS = ["Balanced", "Fundamentals", "Technical", "Tactical", "Physical", "Finishing", "Goalkeeping", "Rest"];
export function getPlayerRoleOptions(player: Pick<Player, "position">) {
  return POSITION_ROLE_OPTIONS[player.position];
}

export function getPlayerRoleAssessment(player: Player) {
  const role = POSITION_ROLE_OPTIONS[player.position].includes(player.role as TacticalRole)
    ? player.role as TacticalRole
    : POSITION_ROLE_OPTIONS[player.position][0];
  const weights = ROLE_ATTRIBUTE_WEIGHTS[role];
  const attributes = player.attributes ?? profileAttributes(player.id, player.overall, player.position, player.attributeGrowth);
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + (weight ?? 0), 0);
  const skillFit = totalWeight
    ? Object.entries(weights).reduce((sum, [key, weight]) => sum + (attributes[key as PlayerAttributeKey] ?? player.overall) * (weight ?? 0), 0) / totalWeight
    : player.overall;
  const familiarity = Math.max(0, Math.min(100, player.roleFamiliarity ?? 55));
  const fit = Math.round(skillFit * 0.78 + familiarity * 0.22);
  return {
    role,
    fit,
    skillFit: Math.round(skillFit),
    familiarity: Math.round(familiarity),
    label: fit >= 82 ? "Natural" : fit >= 70 ? "Strong" : fit >= 55 ? "Developing" : "Learning",
  };
}

export function getPlayerTrainingSummary(player: Player) {
  const targets = TRAINING_ATTRIBUTE_TARGETS[player.trainingFocus] ?? [];
  const progress = player.attributeTrainingProgress ?? {};
  const improvedAttributes = Object.entries(player.attributeGrowth ?? {})
    .filter((entry): entry is [PlayerAttributeKey, number] => Boolean(entry[1] && entry[1] > 0))
    .sort((first, second) => second[1] - first[1])
    .map(([key, value]) => ({ name: key[0].toUpperCase() + key.slice(1), value }));
  return {
    focus: player.trainingFocus,
    focusAttributes: targets.map((key) => key[0].toUpperCase() + key.slice(1)),
    progressPercent: targets.length ? Math.round(targets.reduce((sum, key) => sum + Math.min(1, progress[key] ?? 0), 0) / targets.length * 100) : 0,
    improvedAttributes,
    totalImprovements: improvedAttributes.reduce((sum, attribute) => sum + attribute.value, 0),
  };
}
export const ROOF_OPTIONS: Roof[] = ["Open sky", "Flat canopy", "Cantilever", "Continuous bowl"];
