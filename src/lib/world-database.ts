import type { AcademyRecord, Player, PlayerAttributes, PlayerClubRecord, PlayerStats, Position, SquadLevel } from "./game";
import { ENGLISH_CLUB_SEEDS } from "./league-pyramid";
import { WORLD_CLUB_SEEDS, WORLD_COUNTRIES, WORLD_LEAGUES, type WorldContinent } from "./world-leagues";

export const WORLD_PLAYER_COUNT = 90_000;
export const WORLD_FIRST_TEAM_COUNT = 60_000;
export const WORLD_ACADEMY_COUNT = 22_500;
export const WORLD_FREE_AGENT_COUNT = WORLD_PLAYER_COUNT - WORLD_FIRST_TEAM_COUNT - WORLD_ACADEMY_COUNT;

export type WorldPlayerGroup = "First team" | "Academy" | "Free agent";
export type WorldPlayerFilter = "All players" | WorldPlayerGroup;

export type WorldPlayerListing = {
  id: string;
  name: string;
  age: number;
  position: Position;
  nationality: string;
  clubId: string | null;
  clubName: string;
  country: string;
  continent: WorldContinent;
  leagueName: string;
  group: WorldPlayerGroup;
};

export type WorldPlayerDetail = WorldPlayerListing & Pick<Player, "overall" | "potential" | "wage" | "value" | "contractYears" | "trainingFocus" | "squadLevel" | "morale" | "managerRapport" | "role"> & { dateOfBirth?: string; birthPlace?: string; clubHistory?: PlayerClubRecord[]; academyHistory?: AcademyRecord[]; careerStats?: PlayerStats; seasonStats?: PlayerStats; attributes?: PlayerAttributes };
export type WorldPlayerCriteria = { position?: Position | "Any"; minAge?: number; maxAge?: number; country?: string | "All countries" };
export type WorldSearchPage = { players: WorldPlayerListing[]; hasMore: boolean; total: number };

const COUNTRIES = WORLD_COUNTRIES.map((entry) => ({ ...entry, league: "", cities: [] as string[] }));
const FIRST_NAMES = [
  "Ari", "Callum", "Dara", "Elliot", "Finlay", "Hugo", "Isaac", "Jude", "Kian", "Lewis", "Milan", "Noah", "Oscar", "Perry", "Rafi", "Sam", "Tariq", "Vinnie", "Wes", "Zain",
  "Alba", "Bastien", "Cem", "Dario", "Emil", "Faris", "Gael", "Henrik", "Ivo", "Joao", "Kacper", "Luka", "Matteo", "Niko", "Oskar", "Pavel", "Quim", "Ruben", "Soren", "Tomas",
  "Amina", "Beatriz", "Cleo", "Dalia", "Elif", "Freya", "Greta", "Hana", "Ines", "Jana", "Klara", "Lina", "Mara", "Nadia", "Olena", "Petra", "Runa", "Sara", "Talia", "Yara",
];
export const WORLD_PLAYER_COUNTRIES = COUNTRIES.map((entry) => entry.country);
const LAST_NAMES = [
  "Ainsley", "Bennett", "Clarke", "Doyle", "Ellery", "Fletcher", "Grady", "Haines", "Irwin", "Keane", "Lowry", "Marlow", "Noble", "Osei", "Pike", "Quinn", "Rowe", "Shaw", "Turner", "Vale",
  "Almeida", "Andersson", "Bartosz", "Berg", "Bianchi", "Celik", "Costa", "De Vries", "Eriksen", "Fischer", "Garcia", "Haddad", "Horvat", "Jensen", "Kovac", "Laurent", "Marin", "Novak", "Petrov", "Silva",
  "Abreu", "Bellanova", "Carlsen", "Dumont", "Echeverria", "Fabbri", "Gomes", "Holm", "Ilic", "Jankovic", "Keller", "Lindgren", "Moreau", "Nystrom", "Ortega", "Pereira", "Rossi", "Santos", "Vukovic", "Weber",
];
const NATIONALITIES = COUNTRIES.map((entry) => entry.country);
const POSITIONS: Position[] = ["GK", "DEF", "MID", "FWD"];
const GLOBAL_CLUBS = [
  ...ENGLISH_CLUB_SEEDS.map((club) => ({ ...club, country: "England", continent: "Europe" as const, leagueName: "English pyramid" })),
  ...WORLD_CLUB_SEEDS.map((club) => ({ ...club, leagueName: WORLD_LEAGUES.find((league) => league.id === club.leagueId)?.name ?? club.country })),
];
const CITIES_BY_COUNTRY = new Map<string, string[]>();
const CLUBS_BY_COUNTRY = new Map<string, typeof GLOBAL_CLUBS>();
for (const club of GLOBAL_CLUBS) {
  const places = CITIES_BY_COUNTRY.get(club.country) ?? [];
  if (!places.includes(club.city)) places.push(club.city);
  CITIES_BY_COUNTRY.set(club.country, places);
  const countryClubs = CLUBS_BY_COUNTRY.get(club.country) ?? [];
  countryClubs.push(club);
  CLUBS_BY_COUNTRY.set(club.country, countryClubs);
}

function hash(index: number, salt: number) {
  let value = Math.imul(index + 1, 0x45d9f3b) ^ Math.imul(salt + 17, 0x27d4eb2d);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return (value ^ (value >>> 16)) >>> 0;
}

function pick<T>(items: readonly T[], index: number, salt: number): T {
  return items[hash(index, salt) % items.length];
}

function groupFor(index: number): WorldPlayerGroup {
  if (index < WORLD_FIRST_TEAM_COUNT) return "First team";
  if (index < WORLD_FIRST_TEAM_COUNT + WORLD_ACADEMY_COUNT) return "Academy";
  return "Free agent";
}

function ageFor(index: number, group: WorldPlayerGroup) {
  const ageRoll = hash(index, 3);
  if (group === "Academy") return 5 + (ageRoll % 16);
  if (group === "Free agent") return 18 + (ageRoll % 20);
  return 18 + (ageRoll % 18);
}

function clubFor(index: number, group: WorldPlayerGroup) {
  const freeCountry = COUNTRIES[index % COUNTRIES.length];
  if (group === "Free agent") return { id: null, name: "Free agent", country: freeCountry.country, continent: freeCountry.continent, leagueName: "Free agency" };
  const rosterIndex = group === "Academy" ? index - WORLD_FIRST_TEAM_COUNT : index;
  const club = GLOBAL_CLUBS[rosterIndex % GLOBAL_CLUBS.length];
  return { id: club.short, name: group === "Academy" ? `${club.name} Academy` : club.name, country: club.country, continent: club.continent, leagueName: club.leagueName };
}

function levelForAge(age: number): SquadLevel {
  if (age <= 8) return "Foundation";
  if (age <= 11) return "Academy";
  if (age <= 15) return "U16";
  if (age <= 17) return "U18";
  if (age <= 20) return "Reserves";
  return "First team";
}

function worldPlayer(index: number): WorldPlayerDetail {
  const group = groupFor(index);
  const age = ageFor(index, group);
  const club = clubFor(index, group);
  const nationality = group === "Free agent" ? pick(NATIONALITIES, index, 9) : club.country;
  const name = getWorldPlayerName(index);
  const agePotentialBonus = Math.max(0, Math.min(20, 26 - age));
  const overall = group === "Academy"
    ? Math.max(16, Math.min(60, 12 + age * 2 + (hash(index, 37) % 14)))
    : 38 + (hash(index, 41) % 44);
  const potential = Math.max(overall, Math.min(94, overall + agePotentialBonus + (hash(index, 43) % 18)));
  const value = age < 18 ? Math.max(10_000, (overall + 8) * 2_000) : Math.round(Math.max(25_000, (overall - 32) ** 2 * 1_850) / 1_000) * 1_000;
  const wage = age < 16 ? 0 : Math.round((overall * (age < 18 ? 6 : 42) + (age > 30 ? 450 : 0)) / 100) * 100;
  const position = POSITIONS[hash(index, 47) % POSITIONS.length];
  const contractYears = age < 16 ? 0 : 1 + (hash(index, 53) % 4);
  return {
    id: `world-${String(index + 1).padStart(5, "0")}`,
    name,
    age,
    position,
    nationality,
    clubId: club.id,
    clubName: club.name,
    country: club.country,
    continent: club.continent,
    leagueName: club.leagueName,
    group,
    overall,
    potential,
    wage,
    value,
    contractYears,
    trainingFocus: age < 18 ? "Fundamentals" : "Balanced",
    squadLevel: levelForAge(age),
    morale: 55 + (hash(index, 59) % 36),
    managerRapport: 55,
    role: position === "GK" ? "Goalkeeper" : position === "DEF" ? "Defender" : position === "MID" ? "Midfielder" : "Forward",
  };
}

export function getWorldPlayerName(index: number) {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length];
  const middle = String.fromCharCode(65 + Math.floor(index / (FIRST_NAMES.length * LAST_NAMES.length)) % 26);
  return `${first} ${middle}. ${last}`;
}

function toListing(player: WorldPlayerDetail): WorldPlayerListing {
  const { id, name, age, position, nationality, clubId, clubName, country, continent, leagueName, group } = player;
  return { id, name, age, position, nationality, clubId, clubName, country, continent, leagueName, group };
}

export function getWorldPlayerDetails(playerId: string): WorldPlayerDetail | null {
  if (!playerId.startsWith("world-")) return null;
  const index = Number(playerId.slice(6)) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= WORLD_PLAYER_COUNT) return null;
  const player = worldPlayer(index);
  const birthplace = pick(CITIES_BY_COUNTRY.get(player.nationality ?? "") ?? CITIES_BY_COUNTRY.get("England") ?? ["Aldervane"], index, 61);
  const month = 1 + hash(index, 63) % 6;
  const day = 1 + hash(index, 67) % 27;
  const rating = (bias: number, salt: number) => Math.max(5, Math.min(99, player.overall + bias + (hash(index, salt) % 19) - 9));
  const attackBias = player.position === "FWD" ? 9 : player.position === "MID" ? 1 : player.position === "DEF" ? -10 : -25;
  const defendBias = player.position === "DEF" ? 10 : player.position === "MID" ? 0 : player.position === "GK" ? 3 : -12;
  const keeperBias = player.position === "GK" ? 30 : -27;
  const appearances = player.age >= 18 ? hash(index, 71) % 151 : hash(index, 71) % 35;
  const goals = Math.round(appearances * (player.position === "FWD" ? 0.24 : player.position === "MID" ? 0.09 : player.position === "DEF" ? 0.025 : 0.002));
  const assists = Math.round(appearances * (player.position === "FWD" ? 0.13 : player.position === "MID" ? 0.15 : player.position === "DEF" ? 0.045 : 0));
  const stats: PlayerStats = { appearances, goals, assists, cleanSheets: player.position === "GK" || player.position === "DEF" ? Math.round(appearances * 0.28) : 0, minutes: appearances * 73 };
  const pathway = ([{ age: 5, squadLevel: "Foundation" }, { age: 9, squadLevel: "Academy" }, { age: 12, squadLevel: "U16" }, { age: 16, squadLevel: "U18" }, { age: 18, squadLevel: "Reserves" }, { age: 21, squadLevel: "First team" }] as { age: number; squadLevel: SquadLevel }[]).filter((stage) => stage.age <= player.age);
  const academyHistory: AcademyRecord[] = pathway.map((stage) => ({ season: Math.max(1, 2026 - player.age + stage.age - 2005), age: stage.age, squadLevel: stage.squadLevel, academyLevel: stage.age <= 11 ? 1 : 2 }));
  const formerClubRegion = pick(COUNTRIES, index, 73);
  const formerClubName = CLUBS_BY_COUNTRY.get(formerClubRegion.country)?.[index % 8]?.name ?? "Unattached";
  const records: PlayerClubRecord[] = player.clubId ? [{ clubId: player.clubId, clubName: player.clubName, country: player.country, fromSeason: Math.max(1, 2026 - Math.max(1, player.age - 18) - 2025), toSeason: null, squadLevel: player.squadLevel ?? "First team", ...stats }] : [{ clubId: null, clubName: formerClubName, country: player.country, fromSeason: Math.max(1, 2026 - Math.max(1, player.age - 18) - 2025), toSeason: 2026, squadLevel: "First team", ...stats }];
  return {
    ...player,
    dateOfBirth: `${String(2026 - player.age).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    birthPlace: birthplace,
    clubHistory: records,
    academyHistory,
    careerStats: stats,
    seasonStats: { appearances: Math.min(31, appearances), goals: Math.round(goals / 5), assists: Math.round(assists / 5), cleanSheets: Math.min(12, Math.round(stats.cleanSheets / 5)), minutes: Math.min(2_790, appearances * 73) },
    attributes: { pace: rating(player.position === "FWD" ? 5 : 0, 83), shooting: rating(attackBias, 89), passing: rating(player.position === "MID" ? 8 : 0, 97), dribbling: rating(player.position === "FWD" ? 6 : player.position === "MID" ? 4 : -4, 101), defending: rating(defendBias, 103), physical: rating(player.position === "DEF" ? 5 : 0, 107), vision: rating(player.position === "MID" ? 9 : 0, 109), crossing: rating(player.position === "MID" || player.position === "DEF" ? 4 : -3, 113), finishing: rating(attackBias + 2, 127), tackling: rating(defendBias + 2, 131), strength: rating(player.position === "DEF" ? 8 : 2, 137), stamina: rating(player.position === "MID" ? 6 : 1, 139), reactions: rating(keeperBias + (player.position === "FWD" ? 2 : 0), 149), handling: rating(keeperBias + 3, 151), positioning: rating(player.position === "GK" ? 19 : player.position === "DEF" ? 7 : player.position === "FWD" ? 5 : 0, 157), composure: rating(player.position === "MID" ? 4 : 1, 163) },
  };
}

export function getWorldPlayerListing(playerId: string): WorldPlayerListing | null {
  const player = getWorldPlayerDetails(playerId);
  return player ? toListing(player) : null;
}

export function getWorldPlayerCounts() {
  return { firstTeam: WORLD_FIRST_TEAM_COUNT, academy: WORLD_ACADEMY_COUNT, freeAgents: WORLD_FREE_AGENT_COUNT, total: WORLD_PLAYER_COUNT };
}

export function searchWorldDatabase(query: string, group: WorldPlayerFilter, page: number, pageSize = 20, criteria: WorldPlayerCriteria = {}): WorldSearchPage {
  const cleanQuery = query.trim().toLocaleLowerCase();
  const offset = Math.max(0, page) * pageSize;
  const players: WorldPlayerListing[] = [];
  let matched = 0;
  for (let index = 0; index < WORLD_PLAYER_COUNT; index += 1) {
    const playerGroup = groupFor(index);
    if (group !== "All players" && playerGroup !== group) continue;
    const player = worldPlayer(index);
    if (criteria.position && criteria.position !== "Any" && player.position !== criteria.position) continue;
    if (criteria.minAge !== undefined && player.age < criteria.minAge) continue;
    if (criteria.maxAge !== undefined && player.age > criteria.maxAge) continue;
    if (criteria.country && criteria.country !== "All countries" && player.country !== criteria.country) continue;
    if (cleanQuery && !`${player.name} ${player.position} ${player.nationality} ${player.clubName} ${player.country}`.toLocaleLowerCase().includes(cleanQuery)) continue;
    if (matched >= offset && players.length < pageSize) players.push(toListing(player));
    matched += 1;
  }
  const hasMore = offset + players.length < matched;
  return { players, hasMore, total: matched };
}

export function worldGroupCount(group: WorldPlayerFilter) {
  if (group === "All players") return WORLD_PLAYER_COUNT;
  if (group === "First team") return WORLD_FIRST_TEAM_COUNT;
  if (group === "Academy") return WORLD_ACADEMY_COUNT;
  return WORLD_FREE_AGENT_COUNT;
}
