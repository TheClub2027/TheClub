export type Position = "GK" | "DEF" | "MID" | "FWD";
export type Roof = "Open sky" | "Flat canopy" | "Cantilever" | "Continuous bowl";

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
  project: { name: string; weeksLeft: number; cost: number; upgrades: Partial<Stadium> } | null;
};

export type Club = {
  id: string;
  name: string;
  shortName: string;
  city: string;
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
};

export type Fixture = {
  id: string;
  season: number;
  round: number;
  homeClubId: string;
  awayClubId: string;
  played: boolean;
  homeGoals: number | null;
  awayGoals: number | null;
  date: string;
};

export type FinanceEntry = { date: string; label: string; amount: number };
export type NewsItem = { id: string; date: string; headline: string; body: string; type: "match" | "club" | "transfer" | "stadium" };
export type MatchReport = { fixtureId: string; result: string; headline: string; notes: string[] };

export type Career = {
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
};

const CLUB_SEEDS = [
  { name: "Northport Athletic", short: "NPA", city: "Northport", reputation: 76, colors: ["#13a38a", "#f2f5f3"] as [string, string], capacity: 24600 },
  { name: "Halloway City", short: "HLC", city: "Halloway", reputation: 73, colors: ["#293b73", "#d3b564"] as [string, string], capacity: 22100 },
  { name: "Kingshaven FC", short: "KHF", city: "Kingshaven", reputation: 70, colors: ["#c94b43", "#f4eee6"] as [string, string], capacity: 18400 },
  { name: "Eastmere Town", short: "EMT", city: "Eastmere", reputation: 68, colors: ["#176e9e", "#e9f0f4"] as [string, string], capacity: 15700 },
  { name: "Brackenford", short: "BRK", city: "Brackenford", reputation: 66, colors: ["#cf6c35", "#f6f1e8"] as [string, string], capacity: 14300 },
  { name: "Alderwich Rovers", short: "ALR", city: "Alderwich", reputation: 64, colors: ["#514383", "#f0e7ad"] as [string, string], capacity: 12800 },
  { name: "Westport Rovers", short: "WPR", city: "Westport", reputation: 62, colors: ["#12a389", "#eef5f2"] as [string, string], capacity: 9100 },
  { name: "Calder Vale", short: "CDV", city: "Calder Vale", reputation: 60, colors: ["#728e41", "#e8e7d5"] as [string, string], capacity: 8800 },
  { name: "Merechester Albion", short: "MCA", city: "Merechester", reputation: 58, colors: ["#b33b43", "#d8b647"] as [string, string], capacity: 8200 },
  { name: "Redcliffe Borough", short: "RCB", city: "Redcliffe", reputation: 56, colors: ["#762d3b", "#e9e3d9"] as [string, string], capacity: 7700 },
  { name: "Wickford Vale", short: "WKV", city: "Wickford", reputation: 54, colors: ["#37636e", "#efe9dc"] as [string, string], capacity: 7100 },
  { name: "Southbank United", short: "SBU", city: "Southbank", reputation: 52, colors: ["#d79837", "#263a4d"] as [string, string], capacity: 6400 },
];

const FIRST_NAMES = ["Ari", "Callum", "Dara", "Elliot", "Finlay", "Hugo", "Isaac", "Jude", "Kian", "Lewis", "Milan", "Noah", "Oscar", "Perry", "Rafi", "Sam", "Tariq", "Vinnie", "Wes", "Zain"];
const LAST_NAMES = ["Ainsley", "Bennett", "Clarke", "Doyle", "Ellery", "Fletcher", "Grady", "Haines", "Irwin", "Keane", "Lowry", "Marlow", "Noble", "Osei", "Pike", "Quinn", "Rowe", "Shaw", "Turner", "Vale"];
const FORMATIONS: Record<string, Position[]> = {
  "4-4-2": ["GK", "DEF", "DEF", "DEF", "DEF", "MID", "MID", "MID", "MID", "FWD", "FWD"],
  "4-3-3": ["GK", "DEF", "DEF", "DEF", "DEF", "MID", "MID", "MID", "FWD", "FWD", "FWD"],
  "4-2-3-1": ["GK", "DEF", "DEF", "DEF", "DEF", "MID", "MID", "MID", "MID", "MID", "FWD"],
  "3-5-2": ["GK", "DEF", "DEF", "DEF", "MID", "MID", "MID", "MID", "MID", "FWD", "FWD"],
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

function createPlayer(id: string, clubId: string, position: Position, base: number, random: () => number): Player {
  const age = 18 + Math.floor(random() * 17);
  const overall = Math.max(43, Math.min(86, base + Math.floor(random() * 12) - 5));
  const potential = Math.min(91, Math.max(overall, overall + Math.floor(random() * Math.max(2, 20 - Math.max(0, age - 20)))));
  const first = FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(random() * LAST_NAMES.length)];
  return {
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
  };
}

export function generateFixtures(season: number, clubIds = CLUB_SEEDS.map((club) => club.short)): Fixture[] {
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
        id: `s${season}-r${round + 1}-m${index + 1}`,
        season,
        round: round + 1,
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

export function createCareer(manager: string, chosenClubId: string): Career {
  const clubIds = CLUB_SEEDS.map((club) => club.short);
  const chosenIndex = Math.max(0, clubIds.indexOf(chosenClubId));
  const clubs: Club[] = CLUB_SEEDS.map((club, index) => {
    const weeklyBudget = Math.round((club.reputation - 25) * 1350 / 1000) * 1000;
    const initialCapacity = club.capacity;
    return {
      id: club.short,
      name: club.name,
      shortName: club.short,
      city: club.city,
      country: "England",
      colors: club.colors,
      reputation: club.reputation,
      targetPosition: Math.max(1, Math.min(10, index + 1 + (index < 5 ? 1 : -1))),
      stadium: {
        name: `${club.city} Ground`,
        capacity: initialCapacity,
        tiers: initialCapacity > 18000 ? 2 : 1,
        standing: initialCapacity < 15000,
        roof: index === 0 ? "Continuous bowl" : index < 3 ? "Cantilever" : "Flat canopy",
        corners: index < 5,
        seats: initialCapacity > 12000,
        boxes: Math.max(2, Math.round(club.reputation / 8)),
        floodlights: 2,
        pitchQuality: 3,
        drainage: 55,
        carPark: index < 5,
        superstore: index < 3,
        restaurant: index < 2,
        hotel: false,
        project: null,
      },
      balance: Math.round((1.2 + (club.reputation - 52) * 0.13) * 1_000_000),
      transferBudget: Math.round((0.18 + (club.reputation - 52) * 0.05) * 1_000_000),
      wageBudget: weeklyBudget,
      debt: 0,
      boardTrust: 62 + Math.max(0, 5 - Math.abs(index - chosenIndex)) * 2,
      supporterConfidence: 58 + Math.round((club.reputation - 52) / 5),
      sponsor: "Northline Group",
      sponsorAnnual: Math.round(club.reputation * 12000),
      sponsorOffer: null,
      academyLevel: index < 4 ? 3 : 2,
      trainingLevel: index < 4 ? 3 : 2,
      scoutLevel: 1,
    };
  });

  const players: Player[] = [];
  const rosterPositions: Position[] = ["GK", "GK", "DEF", "DEF", "DEF", "DEF", "DEF", "DEF", "DEF", "DEF", "MID", "MID", "MID", "MID", "MID", "MID", "MID", "FWD", "FWD", "FWD", "FWD", "FWD"];
  for (const [clubIndex, club] of clubs.entries()) {
    const random = randomFrom(74821 + clubIndex * 41);
    const base = 50 + Math.round((club.reputation - 52) * 0.4);
    rosterPositions.forEach((position, playerIndex) => {
      players.push(createPlayer(`${club.id}-${String(playerIndex + 1).padStart(2, "0")}`, club.id, position, base, random));
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

  const club = clubs.find((item) => item.id === chosenClubId) ?? clubs[0];
  const selection = players.filter((player) => player.clubId === club.id).sort((a, b) => b.overall - a.overall).slice(0, 11).map((player) => player.id);
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `career-${Date.now()}`;
  return {
    id,
    manager: manager.trim() || "Alex Morgan",
    clubId: club.id,
    season: 1,
    round: 1,
    clubs,
    players,
    fixtures: generateFixtures(1, clubIds),
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
  };
}

export function getTable(career: Career) {
  const rows = career.clubs.map((club) => ({ clubId: club.id, club: club.name, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 }));
  const rowById = new Map(rows.map((row) => [row.clubId, row]));
  for (const fixture of career.fixtures) {
    if (!fixture.played || fixture.homeGoals === null || fixture.awayGoals === null) continue;
    const home = rowById.get(fixture.homeClubId)!;
    const away = rowById.get(fixture.awayClubId)!;
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

export function getClub(career: Career, clubId = career.clubId) {
  return career.clubs.find((club) => club.id === clubId)!;
}

export function getUserPlayers(career: Career) {
  return career.players.filter((player) => player.clubId === career.clubId).sort((a, b) => {
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
  const selected = clubId === career.clubId && career.lineup.length
    ? career.lineup.map((id) => career.players.find((player) => player.id === id)).filter((player): player is Player => Boolean(player && player.clubId === clubId))
    : clubPlayers.sort((a, b) => b.overall - a.overall).slice(0, 11);
  const average = selected.length ? selected.reduce((sum, player) => sum + player.overall + (player.morale - 60) * 0.035, 0) / selected.length : getClub(career, clubId).reputation * 0.78;
  if (clubId !== career.clubId) return average;
  const formationBonus = career.formation === "4-3-3" ? 0.7 : career.formation === "3-5-2" ? 0.25 : 0.45;
  const mentalityBonus = career.mentality === "Attacking" ? 1.2 : career.mentality === "Cautious" ? -0.2 : 0.4;
  const styleBonus = career.style === "Counter attack" ? 0.6 : career.style === "High press" ? 0.3 : 0.45;
  return average + formationBonus + mentalityBonus + styleBonus;
}

function goalsFor(attack: number, defence: number, homeAdvantage: number, random: () => number) {
  const expected = Math.max(0.32, Math.min(3.05, 1.25 + (attack - defence) * 0.048 + homeAdvantage));
  const draw = Math.max(0, Math.min(0.99, 0.5 + gauss(random) * 0.21));
  return Math.max(0, Math.min(6, Math.floor(expected * draw + random() * 0.75)));
}

function dateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function playMatchday(career: Career): Career {
  if (career.round > 22) return career;
  const next: Career = structuredClone(career);
  const fixtures = next.fixtures.filter((fixture) => fixture.round === next.round && !fixture.played);
  if (!fixtures.length) return next;
  const random = randomFrom(Date.now() ^ Math.floor(Math.random() * 0xffffffff));
  const userFixture = fixtures.find((fixture) => fixture.homeClubId === next.clubId || fixture.awayClubId === next.clubId)!;
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
    if (fixture.id === userFixture.id) {
      userGoals = fixture.homeClubId === next.clubId ? fixture.homeGoals : fixture.awayGoals;
      opponentGoals = fixture.homeClubId === next.clubId ? fixture.awayGoals : fixture.homeGoals;
      notes.push(userGoals > opponentGoals ? "The dressing room leaves with three points." : userGoals === opponentGoals ? "A hard-earned point keeps the season moving." : "The squad will be asked to respond next week.");
      notes.push(`${home.name} ${fixture.homeGoals}–${fixture.awayGoals} ${away.name}`);
    }
  }
  const userClub = getClub(next);
  if (userGoals > opponentGoals) {
    userClub.boardTrust = Math.min(100, userClub.boardTrust + 3);
    userClub.supporterConfidence = Math.min(100, userClub.supporterConfidence + 4);
    next.managerReputation = Math.min(100, next.managerReputation + 2);
  } else if (userGoals === opponentGoals) {
    userClub.boardTrust = Math.min(100, userClub.boardTrust + 1);
    userClub.supporterConfidence = Math.min(100, userClub.supporterConfidence + 1);
  } else {
    userClub.boardTrust = Math.max(0, userClub.boardTrust - 4);
    userClub.supporterConfidence = Math.max(0, userClub.supporterConfidence - 3);
    next.managerReputation = Math.max(0, next.managerReputation - 1);
  }

  const userHome = userFixture.homeClubId === next.clubId;
  const attendance = Math.round(userClub.stadium.capacity * (0.42 + userClub.supporterConfidence / 190));
  const gate = userHome ? Math.round(attendance * (13 + userClub.reputation * 0.11)) : 0;
  const wages = next.players.filter((player) => player.clubId === next.clubId).reduce((sum, player) => sum + player.wage, 0);
  const sponsor = Math.round(userClub.sponsorAnnual / 22);
  const repayment = Math.min(userClub.debt, Math.round(userClub.debt / 80));
  const net = gate + sponsor - wages - repayment;
  userClub.debt -= repayment;
  userClub.balance += net;
  userClub.transferBudget = Math.max(0, userClub.transferBudget + Math.round(net * 0.15));
  next.finance.unshift({ date: dateLabel(userFixture.date), label: `${userHome ? "Home gate" : "Matchday"} · wages · sponsor`, amount: net });
  for (const player of next.players.filter((item) => item.clubId === next.clubId)) {
    player.morale = Math.max(20, Math.min(100, player.morale + (userGoals >= opponentGoals ? 2 : -3)));
    const trainingBoost = player.trainingFocus === "Rest" ? 0 : player.trainingFocus === "Technical" || player.trainingFocus === "Physical" ? 0.14 : 0.1;
    if (player.age < 29 && player.overall < player.potential && random() < trainingBoost) player.overall += 1;
    player.value = Math.round(Math.max(25000, (player.overall - 35) ** 2 * 1800) / 1000) * 1000;
  }
  if (userClub.stadium.project) {
    userClub.stadium.project.weeksLeft -= 1;
    if (userClub.stadium.project.weeksLeft <= 0) {
      const project = userClub.stadium.project;
      const updates = project.upgrades;
      Object.assign(userClub.stadium, updates);
      userClub.stadium.project = null;
      next.news.unshift({ id: `build-${Date.now()}`, date: dateLabel(userFixture.date), headline: `${project.name} complete at ${userClub.stadium.name}`, body: "Supporters get their first look around the finished ground.", type: "stadium" });
    }
  }
  const table = getTable(next);
  const position = table.findIndex((row) => row.clubId === next.clubId) + 1;
  const opponent = getClub(next, userFixture.homeClubId === next.clubId ? userFixture.awayClubId : userFixture.homeClubId);
  const score = `${userGoals}–${opponentGoals}`;
  const headline = `${userClub.name} ${userGoals > opponentGoals ? "back among the winners" : userGoals === opponentGoals ? "share the points" : "suffer a setback"}`;
  next.lastReport = { fixtureId: userFixture.id, result: score, headline, notes };
  next.news.unshift({ id: `match-${Date.now()}`, date: dateLabel(userFixture.date), headline, body: `${userGoals > opponentGoals ? "Victory lifts" : userGoals === opponentGoals ? "The draw leaves" : "The defeat leaves"} the club ${position === 1 ? "top of the table" : `in ${position}${position === 2 ? "nd" : position === 3 ? "rd" : "th"} place`}.`, type: "match" });
  next.news = next.news.slice(0, 28);
  if (userClub.boardTrust <= 5) {
    next.unemployed = true;
    next.news.unshift({ id: `sacked-${Date.now()}`, date: dateLabel(userFixture.date), headline: `${next.manager} leaves ${userClub.name}`, body: "The board has ended the manager's tenure. Other clubs are reviewing their options.", type: "club" });
  }
  next.round += 1;
  return next;
}

export function beginNextSeason(career: Career): Career {
  if (career.round <= 22) return career;
  const next: Career = structuredClone(career);
  const table = getTable(next);
  const row = table.find((entry) => entry.clubId === next.clubId)!;
  const finalPosition = table.findIndex((entry) => entry.clubId === next.clubId) + 1;
  next.history.unshift({ season: next.season, club: getClub(next).name, position: finalPosition, points: row.points, wins: row.wins });
  next.season += 1;
  next.round = 1;
  for (const player of next.players) {
    player.age += 1;
    player.contractYears = Math.max(0, player.contractYears - 1);
    if (player.age >= 36 && player.clubId && Math.random() < 0.5) player.clubId = null;
    if (player.age >= 31) player.overall = Math.max(42, player.overall - (player.age > 34 ? 2 : 1));
  }
  const academy = getClub(next).academyLevel;
  const random = randomFrom(22643 + next.season * 90);
  const youthCount = 2 + academy;
  const positions: Position[] = ["GK", "DEF", "MID", "FWD"];
  for (let index = 0; index < youthCount; index += 1) {
    const youth = createPlayer(`y${next.season}-${index + 1}`, next.clubId, positions[index % positions.length], 43 + academy * 1.5, random);
    youth.age = 16 + Math.floor(random() * 3);
    youth.potential = Math.min(91, youth.overall + 14 + Math.floor(random() * 9));
    youth.contractYears = 3;
    next.players.push(youth);
  }
  const club = getClub(next);
  club.transferBudget += Math.round(club.reputation * 18000);
  club.balance -= Math.round(club.reputation * 8000);
  club.boardTrust = Math.min(100, Math.max(0, club.boardTrust + (finalPosition <= club.targetPosition ? 9 : -5)));
  club.supporterConfidence = Math.min(100, Math.max(15, club.supporterConfidence + (finalPosition <= club.targetPosition ? 6 : -7)));
  club.stadium.project = null;
  next.fixtures = generateFixtures(next.season, next.clubs.map((entry) => entry.id));
  next.lineup = next.players.filter((player) => player.clubId === next.clubId).sort((a, b) => b.overall - a.overall).slice(0, 11).map((player) => player.id);
  next.lastReport = null;
  next.news.unshift({ id: `season-${next.season}`, date: "01 Jul", headline: `Pre-season begins · ${2026 + next.season - 1}/${String(2027 + next.season - 1).slice(-2)}`, body: `A new campaign, a new youth intake and another chance to move the club forward. ${youthCount} academy graduates join the senior squad.`, type: "club" });
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
  const player = next.players.find((item) => item.id === playerId);
  const club = getClub(next);
  if (!player || player.clubId === next.clubId || offer < 0 || offer > club.transferBudget) return career;
  if (player.clubId !== null && offer < player.value * 0.72) return career;
  const previousClub = player.clubId ? getClub(next, player.clubId) : null;
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
  const offers = ["Morrow Works", "Lumen Mobile", "Crownwell Insurance", "Northstar Energy"];
  const club = getClub(next);
  const name = offers[(next.season + next.round + next.news.length) % offers.length];
  const annual = Math.round((club.reputation * (17500 + next.season * 220)) / 1000) * 1000;
  club.sponsorOffer = { name, annual };
  return next;
}

export function acceptSponsor(career: Career) {
  const next = structuredClone(career);
  const club = getClub(next);
  if (!club.sponsorOffer) return career;
  club.sponsor = club.sponsorOffer.name;
  club.sponsorAnnual = club.sponsorOffer.annual;
  club.sponsorOffer = null;
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
  const absolute = Math.abs(amount);
  const prefix = amount < 0 ? "−£" : "£";
  if (compact && absolute >= 1_000_000) return `${prefix}${(absolute / 1_000_000).toFixed(1)}m`;
  if (compact && absolute >= 100_000) return `${prefix}${(absolute / 1000).toFixed(0)}k`;
  return `${prefix}${Math.round(absolute).toLocaleString("en-GB")}`;
}

export function formatPlayerValue(amount: number) {
  return amount >= 1_000_000 ? `£${(amount / 1_000_000).toFixed(1)}m` : amount >= 1000 ? `£${Math.round(amount / 1000)}k` : formatMoney(amount);
}

export function getFormationSlots(formation: string) {
  return FORMATIONS[formation] ?? FORMATIONS["4-3-3"];
}

export const CLUB_OPTIONS = CLUB_SEEDS.map((club) => ({ id: club.short, name: club.name, city: club.city, reputation: club.reputation, colors: club.colors, capacity: club.capacity }));
export const FORMATION_OPTIONS = Object.keys(FORMATIONS);
export const TRAINING_OPTIONS = ["Balanced", "Technical", "Physical", "Finishing", "Rest"];
export const ROOF_OPTIONS: Roof[] = ["Open sky", "Flat canopy", "Cantilever", "Continuous bowl"];
