import { getWorldPlayerDetails, WORLD_PLAYER_COUNTRIES } from "./world-database";
import { BASE_CLUB_STAFF_COUNT, createClubPersonnel, getWorldStaffById, staffStartIndexForClub, STAFF_ROLES } from "./world-staff-database";
import type { StaffMember, StaffRole } from "./world-staff-database";
import { ENGLISH_CLUB_SEEDS, ENGLISH_LEAGUES, leagueDefinition } from "./league-pyramid";
import type { LeagueId } from "./league-pyramid";
import { WORLD_CLUB_SEEDS, WORLD_LEAGUES } from "./world-leagues";
import { defaultExecutiveBoxes, defaultStandDesigns, defaultStandRoofs } from "./stadium-designs";
import { formatGameCurrency, readGameSettings } from "./game-settings";
import type { ExecutiveBoxesBySide, StandDesigns, StandRoofs } from "./stadium-designs";

const CLUB_SEEDS = ENGLISH_CLUB_SEEDS;

export type Position = "GK" | "DEF" | "MID" | "FWD";
export type Roof = "Open sky" | "Flat canopy" | "Cantilever" | "Continuous bowl" | "Retractable roof" | "Wave canopy" | "Glazed shell" | "Lattice roof";
export type SquadLevel = "Foundation" | "Academy" | "U16" | "U18" | "Reserves" | "First team";
export type KitPattern = "Stripes" | "Hoops" | "Sash" | "Solid" | "Halves" | "Quarters" | "Chevron" | "Pinstripes" | "Fade" | "Engineered Grid" | "Topographic" | "Pixel Fade" | "Diagonal Motion" | "Contour Lines" | "Split Panel" | "Shadow Gradient" | "Micro Dot" | "Clean Block";
export type { StandDesignId, StandDesigns, StandRoofs, ExecutiveBoxesBySide, StandSide } from "./stadium-designs";
import type { StandSide } from "./stadium-designs";
export type CornerSide = "northWest" | "northEast" | "southWest" | "southEast";
export type PitchSurface = "Natural grass" | "Hybrid 5G";
export type SponsorSlot = "shirt" | "stadium" | "boards" | "training" | "academy";
export type ClubBadge = { shape: "shield" | "roundel" | "diamond" | "crest"; emblem: "star" | "oak" | "tower" | "eagle" | "anchor" | "bridge"; colors: [string, string]; foundingYear: number };
export type SponsorContract = { id: string; company: string; slot: SponsorSlot; annual: number; yearsRemaining: number; signedSeason: number };
export type SponsorOffer = { id: string; company: string; slot: SponsorSlot; annual: number; years: number; signingBonus: number };
export type ScoutingReport = { id: string; playerId: string; managerId: string; clubId: string; currentAbility: number; potential: number; marketValue: number; season: number; round: number };
export type StandTiers = Record<StandSide, number>;
export type CornerStands = Record<CornerSide, boolean>;
export type StadiumArchitecture = "Dockside steel" | "Clocktower brick" | "Foundry arches" | "Riverside glass" | "Hilltop terraces" | "Railway truss" | "Garden bowl" | "Civic colonnade" | "Lakeside canopy" | "Market hall" | "Beacon tower" | "Southbank lattice";
export type PlayerStats = { appearances: number; goals: number; assists: number; cleanSheets: number; minutes: number };
export type PlayerClubRecord = { clubId: string | null; clubName: string; country: string; fromSeason: number; toSeason: number | null; squadLevel: SquadLevel; appearances: number; goals: number; assists: number; cleanSheets: number };
export type AcademyRecord = { season: number; age: number; squadLevel: SquadLevel; academyLevel: number };
export type PlayerAttributes = { pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number; vision: number; crossing: number; finishing: number; tackling: number; strength: number; stamina: number; reactions: number; handling: number; positioning: number; composure: number };
export type ClubHistoryMoment = { year: number; title: string; detail: string };

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
  morale: number;
  clubId: string | null;
  trainingFocus: string;
  nationality?: string;
  country?: string;
  squadLevel?: SquadLevel;
  managerRapport?: number;
  role?: string;
  dateOfBirth?: string;
  birthPlace?: string;
  clubHistory?: PlayerClubRecord[];
  academyHistory?: AcademyRecord[];
  careerStats?: PlayerStats;
  seasonStats?: PlayerStats;
  attributes?: PlayerAttributes;
};

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
  standRoofs?: StandRoofs;
  executiveBoxesBySide?: ExecutiveBoxesBySide;
  cornerStands?: CornerStands;
  underfloorHeating?: boolean;
  pitchSurface?: PitchSurface;
  pitchCondition?: number;
  groundskeepingLevel?: number;
  carParkLevel?: number;
  superstoreLevel?: number;
  restaurantLevel?: number;
  hotelLevel?: number;
  fanZoneLevel?: number;
  museumLevel?: number;
  transportHubLevel?: number;
  concourseLevel?: number;
  scoreboardLevel?: number;
  ledBoardsLevel?: number;
  securityLevel?: number;
  architecture?: StadiumArchitecture;
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
};

export type FinanceEntry = { date: string; label: string; amount: number };
export type NewsItem = { id: string; date: string; headline: string; body: string; type: "match" | "club" | "transfer" | "stadium" | "press" };
export type MatchReport = { fixtureId: string; result: string; headline: string; notes: string[] };

export type Career = {
  schemaVersion?: number;
  id: string;
  manager: string;
  clubId: string;
  season: number;
  round: number;
  clubs: Club[];
  players: Player[];
  fixtures: Fixture[];
  formation: string;
  mentality: string;
  style: string;
  lineup: string[];
  finance: FinanceEntry[];
  news: NewsItem[];
  history: { season: number; club: string; position: number; points: number; wins: number }[];
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
  staffChanges?: Record<string, string | null>;
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
  { name: "Merechester Crown Ground", architecture: "Clocktower brick", roof: "Continuous bowl", tiers: { north: 3, east: 2, south: 3, west: 2 }, corners: { northWest: true, northEast: true, southWest: true, southEast: true } },
  { name: "Redcliffe Memorial Ground", architecture: "Foundry arches", roof: "Cantilever", tiers: { north: 2, east: 2, south: 2, west: 2 }, corners: { northWest: true, northEast: false, southWest: true, southEast: true } },
  { name: "Beacon Lane", architecture: "Beacon tower", roof: "Cantilever", tiers: { north: 1, east: 1, south: 1, west: 1 }, corners: { northWest: true, northEast: false, southWest: true, southEast: false } },
  { name: "Southbank Exchange", architecture: "Southbank lattice", roof: "Retractable roof", tiers: { north: 1, east: 1, south: 1, west: 1 }, corners: { northWest: false, northEast: true, southWest: false, southEast: true } },
];

const FIRST_NAMES = ["Ari", "Callum", "Dara", "Elliot", "Finlay", "Hugo", "Isaac", "Jude", "Kian", "Lewis", "Milan", "Noah", "Oscar", "Perry", "Rafi", "Sam", "Tariq", "Vinnie", "Wes", "Zain"];
const LAST_NAMES = ["Ainsley", "Bennett", "Clarke", "Doyle", "Ellery", "Fletcher", "Grady", "Haines", "Irwin", "Keane", "Lowry", "Marlow", "Noble", "Osei", "Pike", "Quinn", "Rowe", "Shaw", "Turner", "Vale"];
const NATIONALITIES = WORLD_PLAYER_COUNTRIES;
const NATIONALITY_BIRTHPLACES: Record<string, string[]> = {
  English: ["Northport", "Halloway", "Kingshaven", "Eastmere", "Brackenford", "Alderwich"], Scottish: ["Inverhaven", "Dunross", "Braemar", "Aberloch"], Welsh: ["Brynford", "Llanmere", "Cwmhaven", "Porthwick"], Irish: ["Ardmore", "Kilross", "Dunloe", "Rathwick"],
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

function emptyPlayerStats(): PlayerStats {
  return { appearances: 0, goals: 0, assists: 0, cleanSheets: 0, minutes: 0 };
}

function profileAttributes(id: string, overall: number, position: Position): PlayerAttributes {
  const random = randomFrom(stableSeed(id));
  const rating = (bias: number) => Math.max(5, Math.min(99, Math.round(overall + bias + Math.floor(random() * 19) - 9)));
  const attacking = position === "FWD" ? 10 : position === "MID" ? 2 : position === "DEF" ? -10 : -22;
  const defending = position === "DEF" ? 11 : position === "GK" ? 5 : position === "MID" ? 0 : -13;
  const keeper = position === "GK" ? 30 : -27;
  return { pace: rating(position === "FWD" ? 5 : position === "DEF" ? 0 : -2), shooting: rating(attacking), passing: rating(position === "MID" ? 8 : position === "DEF" ? -3 : 0), dribbling: rating(position === "FWD" ? 7 : position === "MID" ? 5 : -4), defending: rating(defending), physical: rating(position === "DEF" ? 5 : position === "MID" ? 1 : -1), vision: rating(position === "MID" ? 9 : position === "FWD" ? 1 : -4), crossing: rating(position === "MID" || position === "DEF" ? 4 : -3), finishing: rating(attacking + 2), tackling: rating(defending + 2), strength: rating(position === "DEF" ? 8 : position === "FWD" ? 3 : 0), stamina: rating(position === "MID" ? 6 : 1), reactions: rating(keeper + (position === "FWD" ? 2 : 0)), handling: rating(keeper + 3), positioning: rating(position === "GK" ? 19 : position === "DEF" ? 7 : position === "FWD" ? 5 : 0), composure: rating(position === "MID" ? 4 : 1) };
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
  player.attributes ??= profileAttributes(player.id, player.overall, player.position);
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

function createPlayer(id: string, clubId: string, position: Position, base: number, random: () => number, country = "England"): Player {
  const age = 18 + Math.floor(random() * 17);
  const overall = Math.max(43, Math.min(86, base + Math.floor(random() * 12) - 5));
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
    morale: 55 + Math.floor(random() * 36),
    clubId,
    trainingFocus: "Balanced",
    country,
    nationality: NATIONALITIES[Math.floor(random() * NATIONALITIES.length)],
    squadLevel: squadLevelForAge(age),
    managerRapport: 58,
    role: position === "GK" ? "Goalkeeper" : position === "DEF" ? "Defender" : position === "MID" ? "Midfielder" : "Forward",
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
  for (let round = 0; round < rounds.length * 2; round += 1) {
    const returnLeg = round >= rounds.length;
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

export function createCareer(manager: string, chosenClubId: string): Career {
  const difficulty = readGameSettings().difficulty;
  const openingFundsFactor = difficulty === "Relaxed" ? 1.25 : difficulty === "Challenging" ? 0.78 : 1;
  const boardTrustAdjustment = difficulty === "Relaxed" ? 10 : difficulty === "Challenging" ? -8 : 0;
  const internationalChoice = WORLD_CLUB_SEEDS.find((club) => club.short === chosenClubId);
  const careerSeeds = internationalChoice
    ? [...CLUB_SEEDS, ...WORLD_CLUB_SEEDS.filter((club) => club.leagueId === internationalChoice.leagueId)]
    : CLUB_SEEDS;
  const clubIds = careerSeeds.map((club) => club.short);
  const chosenIndex = Math.max(0, clubIds.indexOf(chosenClubId));
  const clubs: Club[] = careerSeeds.map((club, index) => {
    const weeklyBudget = Math.max(18_000, Math.round((club.reputation - 15) * 1350 / 1000) * 1000);
    const initialCapacity = club.capacity;
    const identity = STADIUM_IDENTITIES[index % STADIUM_IDENTITIES.length];
    const league = leagueDefinition(club.leagueId);
    const story = makeClubStory(club, index);
    const personnel = createClubPersonnel(club.short, club.name, staffStartIndexForClub(club.short));
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
        name: index < STADIUM_IDENTITIES.length ? identity.name : `${club.city} ${["Park", "Ground", "Lane", "Stadium", "Field", "End"][index % 6]}`,
        capacity: initialCapacity,
        tiers: Math.max(...Object.values(identity.tiers)),
        standing: initialCapacity < 15000,
        roof: identity.roof,
        corners: Object.values(identity.corners).every(Boolean),
        seats: initialCapacity > 12000,
        boxes: Math.max(2, Math.round(club.reputation / 5)),
        floodlights: 2,
        pitchQuality: 3,
        drainage: 55,
        carPark: index < 5,
        superstore: index < 3,
        restaurant: index < 2,
        hotel: false,
        standTiers: identity.tiers,
        cornerStands: identity.corners,
        underfloorHeating: false,
        pitchSurface: "Natural grass",
        pitchCondition: 82,
        groundskeepingLevel: 1,
        carParkLevel: index < 5 ? 1 : 0,
        superstoreLevel: index < 3 ? 1 : 0,
        restaurantLevel: index < 2 ? 1 : 0,
        hotelLevel: 0,
        fanZoneLevel: 0,
        museumLevel: 0,
        transportHubLevel: 0,
        concourseLevel: 1,
        scoreboardLevel: 1,
        ledBoardsLevel: 0,
        securityLevel: 1,
        architecture: identity.architecture,
        project: null,
      },
      balance: Math.max(420_000, Math.round((1.2 + (club.reputation - 52) * 0.13) * 1_000_000 * openingFundsFactor)),
      transferBudget: Math.max(90_000, Math.round((0.3 + (club.reputation - 35) * 0.06) * 1_000_000 * openingFundsFactor)),
      wageBudget: weeklyBudget,
      debt: 0,
      boardTrust: Math.max(10, Math.min(95, 62 + Math.max(0, 5 - Math.abs(index - chosenIndex)) * 2 + boardTrustAdjustment)),
      supporterConfidence: 58 + Math.round((club.reputation - 52) / 5),
      sponsor: story.sponsor,
      sponsorAnnual: Math.round(club.reputation * 14000),
      sponsorOffer: null,
      badge: { shape: index % 2 ? "shield" : "roundel", emblem: (["tower", "oak", "eagle", "anchor", "bridge", "star"] as const)[index % 6], colors: club.colors, foundingYear: 1875 + (index % 45) },
      sponsorContracts: [{ id: `legacy-${club.short}`, company: story.sponsor, slot: "shirt", annual: Math.round(club.reputation * 14000), yearsRemaining: 2, signedSeason: 1 }],
      sponsorOffers: [],
      staff: personnel.staff,
      board: personnel.board,
      academyLevel: club.reputation >= 70 ? 5 : club.reputation >= 55 ? 3 : 1,
      trainingLevel: club.reputation >= 70 ? 5 : club.reputation >= 55 ? 3 : 1,
      scoutLevel: club.reputation >= 70 ? 3 : 1,
    };
  });

  const players: Player[] = [];
  const rosterPositions: Position[] = ["GK", "GK", "DEF", "DEF", "DEF", "DEF", "DEF", "MID", "MID", "MID", "MID", "MID", "MID", "FWD", "FWD", "FWD", "FWD", "FWD"];
  for (const [clubIndex, club] of clubs.entries()) {
    const random = randomFrom(74821 + clubIndex * 41);
    const base = 50 + Math.round((club.reputation - 52) * 0.4);
    rosterPositions.forEach((position, playerIndex) => {
      players.push(createPlayer(`${club.id}-${String(playerIndex + 1).padStart(2, "0")}`, club.id, position, base, random, club.country ?? "England"));
    });
    for (let index = 0; index < 2; index += 1) {
      const youth = createPlayer(`${club.id}-youth-${index + 1}`, club.id, (["DEF", "MID", "FWD", "GK"] as Position[])[(clubIndex + index) % 4], Math.max(24, base - 17), random, club.country ?? "England");
      youth.age = 15 + index;
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
  for (let index = 0; index < 16; index += 1) {
    const random = randomFrom(9200 + index * 97);
    const position = (["GK", "DEF", "MID", "FWD"] as Position[])[index % 4];
    const player = createPlayer(`free-${index + 1}`, `free-${index + 1}`, position, 52 + Math.floor(random() * 14), random);
    player.clubId = null;
    player.contractYears = 0;
    players.push(player);
  }
  // A visible academy pipeline starts at age five and spans each development band.
  const academyClub = careerSeeds[chosenIndex]?.short ?? CLUB_SEEDS[0].short;
  const academyRandom = randomFrom(41573 + chosenIndex * 29);
  const academyAges = Array.from({ length: 16 }, (_, index) => index + 5);
  academyAges.forEach((age, ageIndex) => {
    for (let intake = 0; intake < 3; intake += 1) {
      const playerIndex = ageIndex * 3 + intake;
      const position = (["GK", "DEF", "MID", "FWD"] as Position[])[(ageIndex + intake) % 4];
      const youth = createPlayer(`academy-${academyClub}-${playerIndex + 1}`, academyClub, position, 35 + Math.floor(age * 0.65) + Math.floor(academyRandom() * 5), academyRandom);
      youth.age = age;
      youth.overall = Math.max(18, Math.min(62, Math.round(18 + age * 1.8 + academyRandom() * 7)));
      youth.potential = Math.min(91, youth.overall + 20 + Math.floor(academyRandom() * 18));
      youth.wage = 0;
      youth.value = 0;
      youth.contractYears = age >= 16 ? 2 : 0;
      youth.clubId = academyClub;
      youth.squadLevel = squadLevelForAge(age);
      youth.managerRapport = 55;
      refreshPlayerProfile(youth, 1);
      players.push(youth);
    }
  });

  const scoutPoolRandom = randomFrom(77241 + chosenIndex * 103);
  for (let index = 0; index < 14; index += 1) {
    const age = index === 0 ? 5 : 5 + Math.floor(scoutPoolRandom() * 12);
    const position = (["GK", "DEF", "MID", "FWD"] as Position[])[index % 4];
    const prospect = createPlayer(`scout-${academyClub}-${index + 1}`, `scout-${academyClub}`, position, 34 + age * 0.7, scoutPoolRandom);
    prospect.age = age;
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
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `career-${Date.now()}`;
  return {
    schemaVersion: 2,
    id,
    manager: manager.trim() || "Alex Morgan",
    clubId: club.id,
    season: 1,
    round: 1,
    clubs,
    players,
    fixtures: generateCareerFixtures(1, clubs),
    formation: "4-3-3",
    mentality: "Balanced",
    style: "Possession",
    lineup: selection,
    finance: [{ date: "01 Jul 2026", label: "Season opening balance", amount: club.balance }],
    news: [{ id: "welcome", date: "01 Jul", headline: `${club.name} unveil ${manager.trim() || "Alex Morgan"}`, body: "A new era starts at the ground. The board expects a competitive first season.", type: "club" }],
    history: [],
    managerReputation: 48,
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
    teamTalk: "Encouraging",
    kitDesignReady: false,
    kitPatterns: { home: "Engineered Grid", away: "Clean Block", third: "Pixel Fade" },
    kitCollectionSeason: 0,
    scoutingReports: [],
    staffChanges: {},
  };
}

function createStartingXI(players: Player[], clubId: string, formation: string) {
  const available = players.filter((player) => player.clubId === clubId && player.age >= 16).sort((a, b) => b.overall - a.overall);
  const lineup: Player[] = [];
  for (const position of getFormationSlots(formation)) {
    const matchIndex = available.findIndex((player) => player.position === position);
    const chosen = available.splice(matchIndex >= 0 ? matchIndex : 0, 1)[0];
    if (chosen) lineup.push(chosen);
  }
  return lineup.map((player) => player.id);
}

export function squadLevelForAge(age: number): SquadLevel {
  if (age <= 8) return "Foundation";
  if (age <= 11) return "Academy";
  if (age <= 15) return "U16";
  if (age <= 17) return "U18";
  if (age <= 20) return "Reserves";
  return "First team";
}

export function normalizeCareer(career: Career): Career {
  let next = structuredClone(career);
  if (next.clubs.length < ENGLISH_CLUB_SEEDS.length) {
    const legacyClubIds = new Set(next.clubs.map((club) => club.id));
    const legacyPlayerIds = new Set(next.players.map((player) => player.id));
    const baseline = createCareer(next.manager, next.clubId);
    const migratedSeason = next.season + (next.round > 1 ? 1 : 0);
    const clubs = baseline.clubs.map((baseClub) => {
      const oldClub = next.clubs.find((club) => club.id === baseClub.id);
      return oldClub ? { ...baseClub, ...oldClub, leagueId: baseClub.leagueId, region: baseClub.region } : baseClub;
    });
    const players = [
      ...baseline.players.filter((player) => !legacyClubIds.has(player.clubId ?? "") && !legacyPlayerIds.has(player.id)),
      ...next.players,
    ];
    next = {
      ...baseline,
      ...next,
      season: migratedSeason,
      round: 1,
      clubs,
      players,
      fixtures: generateCareerFixtures(migratedSeason, clubs),
      history: [...next.history],
      lastReport: null,
      news: [{ id: `pyramid-${migratedSeason}`, date: "01 Jul", headline: "The English league pyramid expands", body: "A full seven-division national and regional pyramid is now in place. The manager keeps their club, squad and finances as the new campaign begins.", type: "club" }, ...next.news],
    };
  }
  if ((next.schemaVersion ?? 1) < 2) {
    const oldDefaultXI = next.players.filter((player) => player.clubId === next.clubId && player.age >= 16).sort((a, b) => b.overall - a.overall).slice(0, 11).map((player) => player.id);
    if (next.lineup.length === oldDefaultXI.length && next.lineup.every((playerId, index) => playerId === oldDefaultXI[index])) {
      next.lineup = createStartingXI(next.players, next.clubId, next.formation);
    }
    next.schemaVersion = 2;
  }
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
    const stadium = club.stadium;
    const baseTiers = Math.max(1, Math.min(4, stadium.tiers || 1));
    stadium.architecture ??= STADIUM_IDENTITIES[next.clubs.findIndex((item) => item.id === club.id)]?.architecture ?? "Civic colonnade";
    stadium.standTiers ??= { north: baseTiers, east: baseTiers, south: baseTiers, west: baseTiers };
    stadium.standDesigns ??= defaultStandDesigns(stadium.architecture);
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
    stadium.concourseLevel ??= 1;
    stadium.scoreboardLevel ??= 1;
    stadium.ledBoardsLevel ??= 0;
    stadium.securityLevel ??= 1;
    club.leagueId ??= seed?.leagueId ?? "regional-north";
    club.region ??= seed?.region ?? "England";
    club.badge ??= { shape: "shield", emblem: "star", colors: club.colors, foundingYear: 1900 };
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
  }
  for (const player of next.players) {
    player.squadLevel ??= squadLevelForAge(player.age);
    player.managerRapport ??= 58;
    player.nationality ??= "English";
    player.role ??= player.position === "GK" ? "Goalkeeper" : player.position === "DEF" ? "Defender" : player.position === "MID" ? "Midfielder" : "Forward";
    addPlayerProfile(player, next.season);
  }
  next.pressure ??= 18;
  next.pressPressure ??= 12;
  next.winlessRun ??= 0;
  next.tacticalFamiliarity ??= 55;
  next.pressingIntensity ??= 55;
  next.defensiveLine ??= 50;
  next.passingTempo ??= 50;
  next.attackingWidth ??= 50;
  next.matchMode ??= "Highlights";
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
  next.playerPositions ??= {};
  next.scoutingReports ??= [];
  return next;
}

export function getCurrentLeague(career: Career) {
  return leagueDefinition(getClub(career).leagueId);
}

export function getSeasonWeekCount() {
  return Math.max(...ENGLISH_LEAGUES.map((league) => league.rounds));
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

export function getBoardPressureSignals(career: Career) {
  const club = getClub(career);
  const table = getTable(career);
  const row = table.find((entry) => entry.clubId === career.clubId)!;
  const position = table.findIndex((entry) => entry.clubId === career.clubId) + 1;
  const senior = career.players.filter((player) => player.clubId === career.clubId && player.age >= 16);
  const averageRapport = senior.reduce((sum, player) => sum + (player.managerRapport ?? 58), 0) / Math.max(1, senior.length);
  return {
    form: Math.min(5, (career.winlessRun ?? 0) * 0.45),
    press: Math.min(5, (career.pressPressure ?? 12) / 22),
    supporters: Math.min(6, Math.max(0, (68 - club.supporterConfidence) / 7)),
    players: Math.min(6, Math.max(0, (60 - averageRapport) / 6)),
    board: Math.min(5, Math.max(0, (55 - club.boardTrust) / 8)),
    expectations: row.played ? Math.min(7, Math.max(0, position - club.targetPosition) * (0.4 + club.reputation / 115)) : 0,
    averageRapport: Math.round(averageRapport),
    position,
  };
}

function privateBoardTolerance(club: Club) {
  const clubCode = [...club.id].reduce((sum, letter) => sum + letter.charCodeAt(0), 0);
  const clubSpecificAdjustment = clubCode % 9 - 4;
  const highExpectationsPenalty = Math.round(Math.max(0, club.reputation - 52) * 0.28);
  return Math.max(66, Math.min(94, 88 - highExpectationsPenalty + clubSpecificAdjustment));
}

export function getClub(career: Career, clubId = career.clubId) {
  return career.clubs.find((club) => club.id === clubId)!;
}

export function getUserPlayers(career: Career) {
  return career.players.filter((player) => player.clubId === career.clubId && player.age >= 16).sort((a, b) => {
    const positionOrder: Position[] = ["GK", "DEF", "MID", "FWD"];
    return positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position) || b.overall - a.overall;
  });
}

export function getNextFixture(career: Career) {
  return career.fixtures.find((fixture) => fixture.round === career.round && (fixture.homeClubId === career.clubId || fixture.awayClubId === career.clubId)) ?? null;
}

function gauss(random: () => number) {
  return Math.sqrt(-2 * Math.log(Math.max(random(), 0.00001))) * Math.cos(2 * Math.PI * random());
}

function clubPower(career: Career, clubId: string) {
  const clubPlayers = career.players.filter((player) => player.clubId === clubId);
  const club = getClub(career, clubId);
  const selected = clubId === career.clubId && career.lineup.length
    ? career.lineup.map((id) => career.players.find((player) => player.id === id)).filter((player): player is Player => Boolean(player && player.clubId === clubId))
    : clubPlayers.sort((a, b) => b.overall - a.overall).slice(0, 11);
  const average = selected.length ? selected.reduce((sum, player) => sum + player.overall + (player.morale - 60) * 0.035 + ((player.managerRapport ?? 58) - 50) * 0.025, 0) / selected.length : getClub(career, clubId).reputation * 0.78;
  const relevantCoaches = (club.staff ?? []).filter((person) => ["First-Team Manager", "Assistant Manager", "First-Team Coach", "Goalkeeping Coach", "Fitness Coach"].includes(person.role));
  const staffAverage = relevantCoaches.length ? relevantCoaches.reduce((sum, person) => sum + person.ability, 0) / relevantCoaches.length : 50;
  const backroomBonus = (staffAverage - 50) * 0.025;
  if (clubId !== career.clubId) return average + backroomBonus;
  const formationBonus = career.formation === "4-3-3" ? 0.7 : career.formation === "3-5-2" ? 0.25 : 0.45;
  const mentalityBonus = career.mentality === "Attacking" ? 1.2 : career.mentality === "Cautious" ? -0.2 : 0.4;
  const styleBonus = career.style === "Counter attack" ? 0.6 : career.style === "High press" ? 0.3 : 0.45;
  const roleBonus = clubId === career.clubId && selected.length ? selected.reduce((sum, player) => {
    const role = (player.role ?? "").toLowerCase();
    const fit = (career.style === "Possession" && role.includes("playmaker")) || (career.style === "High press" && role.includes("pressing")) || (career.formation.includes("3-") && role.includes("wing-back")) || (career.formation === "4-3-3" && role.includes("inside forward")) || (career.defensiveLine! > 65 && role.includes("sweeper"));
    return sum + Number(fit) * 0.42;
  }, 0) / selected.length : 0;
  const tacticalFit = ((career.tacticalFamiliarity ?? 55) - 50) * 0.025;
  const pitchFit = (getClub(career, clubId).stadium.pitchQuality - 3) * 0.18;
  const pressFit = career.style === "High press" ? ((career.pressingIntensity ?? 55) - 50) * 0.025 : 0;
  const lineRisk = ((career.defensiveLine ?? 50) - 50) * (career.mentality === "Cautious" ? -0.012 : 0.009);
  const tempoFit = ((career.passingTempo ?? 50) - 50) * 0.012;
  const widthFit = ((career.attackingWidth ?? 50) - 50) * (career.formation === "3-5-2" || career.formation === "5-3-2" ? -0.006 : 0.008);
  return average + backroomBonus + formationBonus + mentalityBonus + styleBonus + roleBonus + tacticalFit + pitchFit + pressFit + lineRisk + tempoFit + widthFit;
}

function goalsFor(attack: number, defence: number, homeAdvantage: number, random: () => number) {
  const expected = Math.max(0.32, Math.min(3.05, 1.25 + (attack - defence) * 0.048 + homeAdvantage));
  const draw = Math.max(0, Math.min(0.99, 0.5 + gauss(random) * 0.21));
  return Math.max(0, Math.min(6, Math.floor(expected * draw + random() * 0.75)));
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

export function estimateStadiumCommercialIncome(stadium: Stadium, reputation: number) {
  const base = (stadium.carParkLevel ?? Number(stadium.carPark)) * 8500 + (stadium.superstoreLevel ?? Number(stadium.superstore)) * 8000 + (stadium.restaurantLevel ?? Number(stadium.restaurant)) * 12000 + (stadium.hotelLevel ?? Number(stadium.hotel)) * 18000 + (stadium.fanZoneLevel ?? 0) * 9000 + (stadium.museumLevel ?? 0) * 4500 + (stadium.transportHubLevel ?? 0) * 6000 + (stadium.ledBoardsLevel ?? 0) * 6500 + stadium.boxes * (350 + reputation * 1.2);
  return Math.round(base * (0.65 + reputation / 100));
}

export function playMatchday(career: Career, seed?: number): Career {
  if (career.round > getSeasonWeekCount()) return career;
  const next: Career = normalizeCareer(career);
  const fixtures = next.fixtures.filter((fixture) => fixture.round === next.round && !fixture.played);
  if (!fixtures.length) return next;
  const simulationSeed = seed ?? (Date.now() ^ Math.floor(Math.random() * 0xffffffff));
  const random = randomFrom(simulationSeed);
  const statsRandom = randomFrom(simulationSeed ^ 0x6d2b79f5);
  const userFixture = fixtures.find((fixture) => fixture.homeClubId === next.clubId || fixture.awayClubId === next.clubId);
  const notes: string[] = [];
  let userGoals = 0;
  let opponentGoals = 0;
  for (const fixture of fixtures) {
    const home = getClub(next, fixture.homeClubId);
    const away = getClub(next, fixture.awayClubId);
    const homePower = clubPower(next, home.id);
    const awayPower = clubPower(next, away.id);
    fixture.homeGoals = goalsFor(homePower, awayPower, 0.18, random);
    fixture.awayGoals = goalsFor(awayPower, homePower, 0, random);
    fixture.played = true;
    if (fixture.id === userFixture?.id) {
      userGoals = fixture.homeClubId === next.clubId ? fixture.homeGoals : fixture.awayGoals;
      opponentGoals = fixture.homeClubId === next.clubId ? fixture.awayGoals : fixture.homeGoals;
      notes.push(userGoals > opponentGoals ? "The dressing room leaves with three points." : userGoals === opponentGoals ? "A hard-earned point keeps the season moving." : "The squad will be asked to respond next week.");
      notes.push(`${home.name} ${fixture.homeGoals}–${fixture.awayGoals} ${away.name}`);
    }
  }
  const userClub = getClub(next);
  const outcome = userGoals > opponentGoals ? "win" : userGoals === opponentGoals ? "draw" : "loss";
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
    userClub.supporterConfidence = Math.max(0, userClub.supporterConfidence - 3);
    next.managerReputation = Math.max(0, next.managerReputation - 1);
    next.winlessRun = (next.winlessRun ?? 0) + 1;
  }

  const userHome = Boolean(userFixture && userFixture.homeClubId === next.clubId);
  const selectedPlayers = next.lineup.map((id) => next.players.find((player) => player.id === id)).filter((player): player is Player => Boolean(player && player.clubId === next.clubId));
  const matchdayXI = selectedPlayers.length ? selectedPlayers : next.players.filter((player) => player.clubId === next.clubId && player.age >= 16).sort((a, b) => b.overall - a.overall).slice(0, 11);
  if (userFixture) for (const player of matchdayXI) updatePlayerRecord(player, userClub.id, userClub.name, userClub.country, next.season, { appearances: 1, minutes: 90, cleanSheets: opponentGoals === 0 && (player.position === "GK" || player.position === "DEF") ? 1 : 0 });
  const scorers: string[] = [];
  for (let goalIndex = 0; userFixture && goalIndex < userGoals; goalIndex += 1) {
    const attackers = matchdayXI.map((player) => ({ player, weight: (player.position === "FWD" ? 5 : player.position === "MID" ? 3 : player.position === "DEF" ? 1.1 : 0.12) * (0.75 + player.overall / 100) }));
    const totalWeight = attackers.reduce((sum, entry) => sum + entry.weight, 0);
    let draw = statsRandom() * totalWeight;
    let scorer = attackers[0]?.player;
    for (const entry of attackers) { draw -= entry.weight; if (draw <= 0) { scorer = entry.player; break; } }
    if (!scorer) continue;
    creditPlayerStatistic(scorer, "goals", userClub.id, userClub.name, userClub.country, next.season);
    scorers.push(scorer.name);
    const assistCandidates = matchdayXI.filter((player) => player.id !== scorer!.id && player.position !== "GK");
    if (assistCandidates.length && statsRandom() < 0.72) {
      const assister = assistCandidates[Math.floor(statsRandom() * assistCandidates.length)];
      creditPlayerStatistic(assister, "assists", userClub.id, userClub.name, userClub.country, next.season);
    }
  }
  if (scorers.length) notes.push(`Scorers: ${scorers.join(", ")}.`);
  const attendance = Math.round(userClub.stadium.capacity * (0.42 + userClub.supporterConfidence / 190));
  const gate = userHome ? Math.round(attendance * (13 + userClub.reputation * 0.11)) : 0;
  const playerWages = next.players.filter((player) => player.clubId === next.clubId).reduce((sum, player) => sum + player.wage, 0);
  const staffWages = [...(userClub.staff ?? []), ...(userClub.board ?? [])].reduce((sum, person) => sum + person.wage, 0);
  const wages = playerWages + staffWages;
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
  for (const player of next.players.filter((item) => item.clubId === next.clubId)) {
    if (userFixture) {
      player.morale = Math.max(20, Math.min(100, player.morale + (userGoals >= opponentGoals ? 2 : -3)));
      player.managerRapport = Math.max(0, Math.min(100, (player.managerRapport ?? 58) + (next.teamTalk === "Demanding" ? (userGoals > opponentGoals ? 2 : -2) : next.teamTalk === "Calm" ? 1 : userGoals >= opponentGoals ? 2 : -1)));
    }
    const technicalPlan = ["Technical", "Tactical", "Physical", "Finishing", "Goalkeeping", "Fundamentals"].includes(player.trainingFocus);
    const academyDirector = (userClub.staff ?? []).find((person) => person.role === "Academy Director")?.ability ?? 50;
    const youthCoaching = player.age < 21 ? Math.max(-0.025, Math.min(0.055, (academyDirector - 50) * 0.0015)) : 0;
    const trainingBoost = player.trainingFocus === "Rest" ? 0 : Math.max(0, (technicalPlan ? (player.age < 13 && player.trainingFocus === "Fundamentals" ? 0.15 : 0.14) : 0.1) + youthCoaching);
    if (player.age < 29 && player.overall < player.potential && random() < trainingBoost) player.overall += 1;
    player.attributes = profileAttributes(player.id, player.overall, player.position);
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
  if (userFixture) {
  const table = getTable(next, userClub.leagueId);
  const position = table.findIndex((row) => row.clubId === next.clubId) + 1;
  const expectationMultiplier = 0.86 + userClub.reputation / 250;
  const pressChange = outcome === "win" ? -8 : outcome === "draw" ? 4 : 12;
  next.pressPressure = Math.max(0, Math.min(100, (next.pressPressure ?? 12) + pressChange * expectationMultiplier));
  const signals = getBoardPressureSignals(next);
  const resultPressure = (outcome === "win" ? -7.5 : outcome === "draw" ? 2 : 8.5) * expectationMultiplier;
  const supportingPressure = signals.form + signals.press * 0.62 + signals.supporters * 0.65 + signals.players * 0.7 + signals.board * 0.55 + signals.expectations * 0.8;
  next.pressure = Math.max(0, Math.min(100, (next.pressure ?? 18) + resultPressure + supportingPressure));
  if (signals.players >= 3) notes.push("Senior players' rapport with the manager is low, reducing the team's belief and increasing board concern.");
  if (outcome !== "win" && (next.pressPressure ?? 0) >= 54) {
    next.news.unshift({ id: `press-${Date.now()}`, date: dateLabel(userFixture.date), headline: `Results bring sharper scrutiny at ${userClub.name}`, body: "Supporters and local reporters are asking whether the current plan can deliver the club's season target.", type: "press" });
  }
  const opponent = getClub(next, userFixture.homeClubId === next.clubId ? userFixture.awayClubId : userFixture.homeClubId);
  const score = `${userGoals}–${opponentGoals}`;
  const headline = `${userClub.name} ${userGoals > opponentGoals ? "back among the winners" : userGoals === opponentGoals ? "share the points" : "suffer a setback"}`;
  next.lastReport = { fixtureId: userFixture.id, result: score, headline, notes };
  next.news.unshift({ id: `match-${Date.now()}`, date: dateLabel(userFixture.date), headline, body: `${userGoals > opponentGoals ? "Victory lifts" : userGoals === opponentGoals ? "The draw leaves" : "The defeat leaves"} the club ${position === 1 ? "top of the table" : `in ${position}${position === 2 ? "nd" : position === 3 ? "rd" : "th"} place`}.`, type: "match" });
  next.news = next.news.slice(0, 28);
  if ((next.pressure ?? 0) >= privateBoardTolerance(userClub)) {
    next.unemployed = true;
    next.news.unshift({ id: `sacked-${Date.now()}`, date: dateLabel(userFixture.date), headline: `${next.manager} leaves ${userClub.name}`, body: "After reviewing the club's results, media scrutiny, supporter confidence and dressing-room mood, the board has ended the manager's tenure.", type: "club" });
  }
  } else {
    next.lastReport = null;
  }
  next.round += 1;
  return next;
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
    staff: personnel.staff,
    board: personnel.board,
    badge: { shape: "shield", emblem: "oak", colors, foundingYear: 1890 + ((season * 9 + index * 13) % 100) },
    stadium: {
      ...structuredClone(template.stadium), name: `${city} Park`, capacity: 5_800 + index * 250, tiers: 1, standing: true, roof: "Open sky", corners: false, seats: false, boxes: 2, floodlights: 2, pitchQuality: 2, drainage: 45,
      standTiers: { north: 1, east: 1, south: 1, west: 1 }, cornerStands: { northWest: false, northEast: false, southWest: false, southEast: false }, project: null,
    },
  };
  const positions: Position[] = ["GK", "GK", "DEF", "DEF", "DEF", "DEF", "DEF", "MID", "MID", "MID", "MID", "MID", "FWD", "FWD", "FWD", "FWD", "FWD", "MID"];
  const random = randomFrom(stableSeed(id));
  const players = positions.map((position, playerIndex) => createPlayer(`${id}-${String(playerIndex + 1).padStart(2, "0")}`, id, position, 30, random));
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

export function beginNextSeason(career: Career): Career {
  if (career.round <= getSeasonWeekCount()) return career;
  const next: Career = structuredClone(career);
  const table = getTable(next, getClub(next).leagueId);
  const oldLeague = getCurrentLeague(next);
  const row = table.find((entry) => entry.clubId === next.clubId)!;
  const finalPosition = table.findIndex((entry) => entry.clubId === next.clubId) + 1;
  next.history.unshift({ season: next.season, club: getClub(next).name, position: finalPosition, points: row.points, wins: row.wins });
  const movement = applyEnglishPromotionsAndRelegations(next);
  next.season += 1;
  next.round = 1;
  for (const player of next.players) {
    player.age += 1;
    const ageLevel = squadLevelForAge(player.age);
    const pathwayOrder: SquadLevel[] = ["Foundation", "Academy", "U16", "U18", "Reserves", "First team"];
    if (!player.squadLevel || pathwayOrder.indexOf(ageLevel) > pathwayOrder.indexOf(player.squadLevel)) player.squadLevel = ageLevel;
    player.contractYears = Math.max(0, player.contractYears - 1);
    player.seasonStats = emptyPlayerStats();
    if (player.age >= 36 && player.clubId && Math.random() < 0.5) {
      player.clubHistory?.forEach((record) => { if (record.clubId === player.clubId && record.toSeason === null) record.toSeason = next.season - 1; });
      player.clubId = null;
    }
    if (player.age >= 31) player.overall = Math.max(42, player.overall - (player.age > 34 ? 2 : 1));
    player.attributes = profileAttributes(player.id, player.overall, player.position);
    if (player.age < 21) {
      const latest = player.academyHistory?.at(-1);
      if (latest && latest.squadLevel !== ageLevel) player.academyHistory!.push({ season: next.season, age: player.age, squadLevel: ageLevel, academyLevel: getClub(next, player.clubId ?? next.clubId).academyLevel });
    }
  }
  const academy = getClub(next).academyLevel;
  const random = randomFrom(22643 + next.season * 90);
  const youthCount = 8 + academy;
  const positions: Position[] = ["GK", "DEF", "MID", "FWD"];
  for (let index = 0; index < youthCount; index += 1) {
    const youth = createPlayer(`y${next.season}-${index + 1}`, next.clubId, positions[index % positions.length], 43 + academy * 1.5, random);
    youth.age = 5 + Math.floor(random() * 13);
    youth.overall = Math.max(18, Math.round(18 + youth.age * 1.8 + random() * 8));
    youth.potential = Math.min(91, youth.overall + 20 + Math.floor(random() * 18));
    youth.wage = 0;
    youth.value = 0;
    youth.squadLevel = squadLevelForAge(youth.age);
    youth.managerRapport = 55;
    youth.contractYears = youth.age >= 16 ? 2 : 0;
    refreshPlayerProfile(youth, next.season);
    next.players.push(youth);
  }
  for (let index = 0; index < 6; index += 1) {
    const age = 5 + Math.floor(random() * 12);
    const prospect = createPlayer(`scout-${next.season}-${index + 1}`, `scout-${next.season}`, positions[(next.season + index) % positions.length], 35 + age * 0.65, random);
    prospect.age = age;
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
  for (const contract of club.sponsorContracts ?? []) contract.yearsRemaining -= 1;
  club.sponsorContracts = (club.sponsorContracts ?? []).filter((contract) => contract.yearsRemaining > 0);
  const shirtContract = club.sponsorContracts.find((contract) => contract.slot === "shirt");
  if (shirtContract) { club.sponsor = shirtContract.company; club.sponsorAnnual = shirtContract.annual; }
  club.transferBudget += Math.round(club.reputation * 18000);
  club.balance -= Math.round(club.reputation * 8000);
  club.boardTrust = Math.min(100, Math.max(0, club.boardTrust + (finalPosition <= club.targetPosition ? 9 : -5)));
  club.supporterConfidence = Math.min(100, Math.max(15, club.supporterConfidence + (finalPosition <= club.targetPosition ? 6 : -7)));
  next.pressure = Math.max(10, (next.pressure ?? 18) - (finalPosition <= club.targetPosition ? 8 : -8));
  next.pressPressure = Math.max(0, (next.pressPressure ?? 12) - 18);
  next.winlessRun = 0;
  if (next.kitCollectionSeason !== next.season) next.kitDesignReady = false;
  next.fixtures = generateCareerFixtures(next.season, next.clubs);
  next.lineup = createStartingXI(next.players, next.clubId, next.formation);
  next.lastReport = null;
  const newLeague = getCurrentLeague(next);
  const clubMovement = newLeague.id === oldLeague.id ? "The club holds its place in the pyramid." : `${oldLeague.name} → ${newLeague.name} is confirmed.`;
  next.news.unshift({ id: `season-${next.season}`, date: "01 Jul", headline: `Pre-season begins · ${2026 + next.season - 1}/${String(2027 + next.season - 1).slice(-2)}`, body: `A new campaign begins. ${clubMovement} ${youthCount} new academy players join the pathway.`, type: "club" });
  return next;
}

export function setPlayerSelection(career: Career, playerId: string) {
  const next = structuredClone(career);
  const selected = next.lineup.includes(playerId);
  if (selected) next.lineup = next.lineup.filter((id) => id !== playerId);
  else if (next.lineup.length < 11) next.lineup.push(playerId);
  else next.lineup = [...next.lineup.slice(0, 10), playerId];
  return next;
}

export function buyPlayer(career: Career, playerId: string, offer: number) {
  const next: Career = structuredClone(career);
  let player = next.players.find((item) => item.id === playerId);
  const club = getClub(next);
  const report = getScoutingReport(career, playerId);
  if (!report || !Number.isFinite(offer) || offer < 0 || offer > club.transferBudget) return career;
  if (!player) {
    const worldPlayer = getWorldPlayerDetails(playerId);
    if (!worldPlayer || worldPlayer.age < 18) return career;
    player = worldPlayerToPlayer(worldPlayer);
    next.players.push(player);
  }
  if (player.age < 18 || player.clubId === next.clubId) return career;
  if (player.clubId !== null && offer < player.value * 0.72) return career;
  const previousClub = player.clubId ? next.clubs.find((item) => item.id === player!.clubId) ?? null : null;
  if (previousClub) {
    previousClub.balance += offer;
    previousClub.transferBudget += offer * 0.1;
  }
  club.balance -= offer;
  club.transferBudget -= offer;
  player.clubId = club.id;
  player.contractYears = 3;
  player.wage = Math.max(player.wage, Math.round(player.overall * 48));
  player.morale = 82;
  player.clubHistory ??= [];
  player.clubHistory.forEach((record) => { if (record.toSeason === null) record.toSeason = next.season; });
  player.clubHistory.push({ clubId: club.id, clubName: club.name, country: club.country, fromSeason: next.season, toSeason: null, squadLevel: player.squadLevel ?? squadLevelForAge(player.age), appearances: 0, goals: 0, assists: 0, cleanSheets: 0 });
  next.finance.unshift({ date: "Today", label: `${previousClub ? "Transfer fee" : "Signing bonus"} · ${player.name}`, amount: -offer });
  next.news.unshift({ id: `sign-${Date.now()}`, date: "Today", headline: `${player.name} joins ${club.name}`, body: `${previousClub ? `${previousClub.name} accept an offer` : "A free agent signs"} worth ${formatMoney(offer)}.`, type: "transfer" });
  return next;
}

export function renewContract(career: Career, playerId: string) {
  const next = structuredClone(career);
  const player = next.players.find((item) => item.id === playerId);
  if (!player || player.clubId !== next.clubId) return career;
  player.contractYears = Math.max(3, player.contractYears + 2);
  player.wage = Math.round(player.wage * 1.13 / 100) * 100;
  return next;
}

export function sponsorProposal(career: Career) {
  const next = structuredClone(career);
  const club = getClub(next);
  const companies = ["Morrow Works", "Lumen Mobile", "Crownwell Insurance", "Northstar Energy", "Asteron Motors", "Bluehaven Bank", "Copperline Travel", "Evergreen Foods", "Foundry Cloud", "Granite Telecom", "Harbor & Heath", "Juniper Athletic", "Kestrel Sportswear", "Larkspur Hotels", "Meridian Mobility", "Redwood Brewing"];
  const slots: SponsorSlot[] = ["shirt", "stadium", "boards", "training", "academy"];
  const seed = next.season * 11 + next.round * 7 + next.news.length;
  club.sponsorOffers = Array.from({ length: 5 }, (_, index) => {
    const slot = slots[index];
    const company = companies[(seed + index * 3) % companies.length];
    const multiplier = slot === "shirt" ? 18000 : slot === "stadium" ? 14500 : slot === "boards" ? 8500 : 6500;
    const annual = Math.round((club.reputation * (multiplier + next.season * 180) * (0.82 + index * 0.08)) / 1000) * 1000;
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
  next.staffChanges![staffId] = null;
  const severance = Math.round(member.wage * 4);
  club.balance -= severance;
  if (isBoardRole(member.role)) club.boardTrust = Math.max(0, club.boardTrust - (member.role === "Chairperson" ? 4 : 2));
  next.finance.unshift({ date: "Today", label: `Staff contract ended · ${member.name} · ${member.role}`, amount: -severance });
  next.news.unshift({ id: `staff-release-${member.id}-${next.season}-${next.round}`, date: "Today", headline: `${member.name} leaves ${club.name}`, body: `${member.role} duties return to the board while the club searches for a replacement.`, type: "club" });
  next.news = next.news.slice(0, 28);
  return next;
}

export function launchKitCollection(career: Career) {
  const next = normalizeCareer(career);
  const club = getClub(next);
  if (next.round <= getSeasonWeekCount() || next.kitCollectionSeason === next.season) return career;
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
  };
}

export function getScoutingReport(career: Career, playerId: string) {
  return (career.scoutingReports ?? []).find((report) => report.playerId === playerId && (report.managerId === career.id || report.clubId === career.clubId)) ?? null;
}

export function getScoutingCost(career: Career, playerId: string) {
  if (getScoutingReport(career, playerId)) return 0;
  const player = career.players.find((item) => item.id === playerId) ?? getWorldPlayerDetails(playerId);
  if (!player || player.clubId === career.clubId) return 0;
  const base = player.age < 18 ? 1_400 : player.clubId === null ? 1_800 : 2_800;
  const discount = 1 - Math.min(0.2, Math.max(0, getClub(career).scoutLevel - 1) * 0.04);
  return Math.round((base * discount) / 100) * 100;
}

export function scoutPlayer(career: Career, playerId: string) {
  const next = normalizeCareer(career);
  if (getScoutingReport(career, playerId)) return career;
  const player = next.players.find((item) => item.id === playerId) ?? getWorldPlayerDetails(playerId);
  const club = getClub(next);
  if (!player || player.clubId === club.id) return career;
  const cost = getScoutingCost(career, playerId);
  if (!cost || club.balance < cost) return career;
  const report: ScoutingReport = {
    id: `scout-${career.id}-${playerId}`,
    playerId,
    managerId: career.id,
    clubId: club.id,
    currentAbility: player.overall,
    potential: player.potential,
    marketValue: player.value,
    season: career.season,
    round: career.round,
  };
  next.scoutingReports!.push(report);
  club.balance -= cost;
  next.finance.unshift({ date: "Today", label: `Scouting report · ${player.name}`, amount: -cost });
  next.news.unshift({ id: report.id, date: "Today", headline: `${player.name} scouting report completed`, body: `The report is saved to ${career.manager}'s manager file and ${club.name}'s club scouting file.`, type: "club" });
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
  const next = normalizeCareer(career);
  const player = next.players.find((item) => item.id === playerId && item.clubId === next.clubId && item.age < 21);
  if (!player) return career;
  player.trainingFocus = focus;
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
  if (level >= 5) return career;
  const price = (level + 1) * (facility === "scoutLevel" ? 160000 : 225000);
  if (club.balance < price) return career;
  club[facility] += 1;
  club.balance -= price;
  next.finance.unshift({ date: "Today", label: `Facility investment · ${facility.replace("Level", "")}`, amount: -price });
  return next;
}

export function applyForJob(career: Career, clubId: string) {
  const next: Career = structuredClone(career);
  if (!next.unemployed || !next.clubs.some((club) => club.id === clubId)) return career;
  next.clubId = clubId;
  next.unemployed = false;
  getClub(next).boardTrust = Math.max(getClub(next).boardTrust, 45);
  getClub(next).supporterConfidence = Math.max(getClub(next).supporterConfidence, 40);
  next.lineup = next.players.filter((player) => player.clubId === clubId).sort((a, b) => b.overall - a.overall).slice(0, 11).map((player) => player.id);
  next.news.unshift({ id: `job-${Date.now()}`, date: "Today", headline: `${next.manager} takes charge at ${getClub(next).name}`, body: "A new opportunity opens up after a change in the dugout.", type: "club" });
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
export const ROOF_OPTIONS: Roof[] = ["Open sky", "Flat canopy", "Cantilever", "Continuous bowl"];
