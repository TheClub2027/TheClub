import assert from "node:assert/strict";
import test from "node:test";
import {
  acceptSponsor,
  beginNextSeason,
  buyPlayer,
  createCareer,
  generateFixtures,
  getAcademyPlayers,
  getScoutingCost,
  getScoutingReport,
  getYouthCandidates,
  getBoardPressureSignals,
  getClub,
  hireStaff,
  releaseStaff,
  getSeasonWeekCount,
  getTable,
  launchKitCollection,
  normalizeCareer,
  playMatchday,
  promoteYouth,
  renewContract,
  setYouthTraining,
  scoutPlayer,
  signYouthPlayer,
  squadLevelForAge,
  setPlayerSelection,
  sponsorProposal,
  startStadiumProject,
} from "./game";
import { getWorldPlayerDetails, getWorldPlayerCounts, searchWorldDatabase, WORLD_PLAYER_COUNT } from "./world-database";
import { ENGLISH_LEAGUES } from "./league-pyramid";
import { countWorldStaff, searchWorldStaff, WORLD_STAFF_COUNT } from "./world-staff-database";

test("a 12-club season has a balanced home-and-away fixture list", () => {
  const teams = Array.from({ length: 12 }, (_, index) => `T${index + 1}`);
  const fixtures = generateFixtures(1, teams);
  assert.equal(fixtures.length, 132);
  assert.equal(new Set(fixtures.map((fixture) => fixture.id)).size, 132);
  assert.equal(new Set(fixtures.map((fixture) => fixture.round)).size, 22);
  for (const team of teams) {
    const ownFixtures = fixtures.filter((fixture) => fixture.homeClubId === team || fixture.awayClubId === team);
    assert.equal(ownFixtures.length, 22);
    assert.equal(ownFixtures.filter((fixture) => fixture.homeClubId === team).length, 11);
    assert.equal(ownFixtures.filter((fixture) => fixture.awayClubId === team).length, 11);
  }
  for (let first = 0; first < teams.length; first += 1) {
    for (let second = first + 1; second < teams.length; second += 1) {
      const pair = fixtures.filter((fixture) => [fixture.homeClubId, fixture.awayClubId].includes(teams[first]) && [fixture.homeClubId, fixture.awayClubId].includes(teams[second]));
      assert.equal(pair.length, 2);
      assert.notEqual(pair[0].homeClubId, pair[1].homeClubId);
    }
  }
});

test("new careers include a working league, editable squad and believable funds", () => {
  const career = createCareer("Jamie Taylor", "WPR");
  assert.equal(career.manager, "Jamie Taylor");
  assert.equal(career.clubs.length, 164);
  assert.equal(career.fixtures.length, 3692);
  assert.ok(career.players.length > 3000);
  for (const league of ENGLISH_LEAGUES) assert.equal(career.clubs.filter((club) => club.leagueId === league.id).length, league.clubs);
  assert.equal(getClub(career).name, "Westport Rovers");
  assert.ok(getClub(career).balance > 2_000_000);
  assert.equal(career.lineup.length, 11);
  assert.equal(getTable(career).reduce((total, row) => total + row.played, 0), 0);
  assert.ok(getAcademyPlayers(career).some((player) => player.age === 5));
  assert.equal(new Set(career.clubs.map((club) => club.stadium.name)).size, 164);
  assert.ok(new Set(career.clubs.map((club) => club.stadium.architecture)).size >= 5);
  const profile = career.players.find((player) => player.clubId === career.clubId)!;
  assert.match(profile.dateOfBirth ?? "", /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(profile.birthPlace);
  assert.ok(profile.attributes && Object.values(profile.attributes).every((value) => value >= 5 && value <= 99));
  assert.ok(getAcademyPlayers(career).find((player) => player.age === 5)?.academyHistory?.length);
  assert.ok(career.clubs.every((club) => club.staff?.length === 8 && club.board?.length === 4));
});

test("the 25,000-person staff world supports searchable appointments and releases", () => {
  const career = createCareer("Riley Shaw", "WPR");
  assert.equal(WORLD_STAFF_COUNT, 25_000);
  assert.deepEqual(countWorldStaff(career.staffChanges), { total: 25_000, atClub: 1_968, available: 23_032 });
  const search = searchWorldStaff("", "Assistant Manager", "Available", 0, 1, career.staffChanges);
  assert.equal(search.total, 1_920);
  const candidate = search.people[0];
  const hired = hireStaff(career, candidate.id);
  assert.notEqual(hired, career);
  assert.ok(getClub(hired).staff?.some((person) => person.id === candidate.id && person.role === "Assistant Manager"));
  assert.equal(Object.prototype.hasOwnProperty.call(hired.staffChanges, candidate.id), true);
  const released = releaseStaff(hired, candidate.id);
  assert.notEqual(released, hired);
  assert.equal(released.staffChanges?.[candidate.id], null);
  assert.ok(!getClub(released).staff?.some((person) => person.id === candidate.id));
});

test("playing a matchday resolves all games and updates standings and finances", () => {
  const before = createCareer("Morgan Lee", "EMT");
  const after = playMatchday(before);
  assert.equal(after.round, 2);
  assert.equal(after.fixtures.filter((fixture) => fixture.round === 1 && fixture.played).length, 82);
  assert.equal(after.lastReport?.fixtureId, before.fixtures.find((fixture) => fixture.round === 1 && [fixture.homeClubId, fixture.awayClubId].includes(before.clubId))?.id);
  assert.equal(getTable(after).reduce((total, row) => total + row.played, 0), ENGLISH_LEAGUES.find((league) => league.id === getClub(after).leagueId)!.clubs);
  assert.notEqual(getClub(after).balance, getClub(before).balance);
  assert.ok(after.news.some((item) => item.type === "match"));
  const selected = after.players.filter((player) => after.lineup.includes(player.id));
  assert.ok(selected.length > 0 && selected.every((player) => player.careerStats?.appearances === 1));
  assert.ok(selected.every((player) => player.clubHistory?.some((record) => record.clubId === after.clubId && record.appearances === 1)));
});

test("executive suites produce matchday income and can be expanded in a stadium project", () => {
  const career = createCareer("Morgan Lee", "WPR");
  const homeFixture = career.fixtures.find((fixture) => fixture.homeClubId === career.clubId)!;
  career.round = homeFixture.round;
  const withoutSuites = structuredClone(career);
  getClub(withoutSuites).stadium.boxes = 0;
  const withSuites = structuredClone(career);
  getClub(withSuites).stadium.boxes += 8;
  const baseResult = playMatchday(withoutSuites, 881);
  const suiteResult = playMatchday(withSuites, 881);
  assert.ok(getClub(suiteResult).balance > getClub(baseResult).balance);
  const cost = Math.abs(getClub(withSuites).stadium.boxes - getClub(withoutSuites).stadium.boxes) * 18_000;
  const project = startStadiumProject(career, "Executive suite wing", cost, 2, { boxes: getClub(career).stadium.boxes + 8 });
  assert.notEqual(project, career);
  assert.equal(getClub(project).stadium.project?.cost, cost);
});

test("selection, renewals, free-agent signings and sponsor offers change career data", () => {
  const career = createCareer("Alex Morgan", "WPR");
  const substitute = career.players.find((player) => player.clubId === career.clubId && !career.lineup.includes(player.id))!;
  const selected = setPlayerSelection(career, substitute.id);
  assert.ok(selected.lineup.includes(substitute.id));
  assert.equal(selected.lineup.length, 11);

  const player = career.players.find((item) => item.clubId === career.clubId)!;
  const renewed = renewContract(career, player.id);
  assert.ok(renewed.players.find((item) => item.id === player.id)!.contractYears >= 3);
  assert.ok(renewed.players.find((item) => item.id === player.id)!.wage > player.wage);

  const freeAgent = career.players.find((item) => item.clubId === null)!;
  assert.equal(buyPlayer(career, freeAgent.id, 0), career, "players must be scouted before a signing");
  const report = scoutPlayer(career, freeAgent.id);
  assert.equal(getScoutingReport(report, freeAgent.id)?.currentAbility, freeAgent.overall);
  const signed = buyPlayer(report, freeAgent.id, 0);
  assert.equal(signed.players.find((item) => item.id === freeAgent.id)!.clubId, career.clubId);
  assert.equal(signed.players.find((item) => item.id === freeAgent.id)!.contractYears, 3);

  const offered = sponsorProposal(career);
  assert.ok(getClub(offered).sponsorOffer);
  const accepted = acceptSponsor(offered);
  assert.equal(getClub(accepted).sponsor, getClub(offered).sponsorOffer?.name ?? "Morrow Works");
  assert.ok(getClub(accepted).sponsorAnnual > 0);
});

test("stadium construction completes over matchdays and seasons continue indefinitely", () => {
  let career = createCareer("Taylor Quinn", "WPR");
  const existing = getClub(career).stadium.capacity;
  const project = startStadiumProject(career, "Two-tier stand", 500_000, 1, { tiers: 2, capacity: existing + 1200 });
  assert.notEqual(project, career);
  career = playMatchday(project);
  assert.equal(getClub(career).stadium.tiers, 2);
  assert.equal(getClub(career).stadium.capacity, existing + 1200);
  for (let matchday = career.round; matchday <= getSeasonWeekCount(); matchday += 1) career = playMatchday(career);
  const youthBefore = career.players.filter((player) => player.clubId === career.clubId && player.age < 19).length;
  const nextSeason = beginNextSeason(career);
  assert.equal(nextSeason.season, 2);
  assert.equal(nextSeason.round, 1);
  assert.equal(nextSeason.history.length, 1);
  assert.equal(nextSeason.fixtures.length, 3692);
  assert.ok(nextSeason.players.filter((player) => player.clubId === nextSeason.clubId && player.age < 19).length >= youthBefore);
});

test("academy prospects can be trained and promoted through age bands", () => {
  const career = createCareer("Jamie Taylor", "WPR");
  assert.equal(squadLevelForAge(5), "Foundation");
  assert.equal(squadLevelForAge(10), "Academy");
  assert.equal(squadLevelForAge(14), "U16");
  assert.equal(squadLevelForAge(17), "U18");
  const youth = getAcademyPlayers(career).find((player) => player.age === 5)!;
  const trained = setYouthTraining(career, youth.id, "Technical");
  assert.equal(trained.players.find((player) => player.id === youth.id)?.trainingFocus, "Technical");
  const prospect = getAcademyPlayers(career).find((player) => player.age === 16)!;
  const promoted = promoteYouth(career, prospect.id);
  assert.equal(promoted.players.find((player) => player.id === prospect.id)?.squadLevel, "Reserves");
  assert.ok(promoted.players.find((player) => player.id === prospect.id)!.contractYears >= 3);
  const reserve = getAcademyPlayers(career).find((player) => player.age === 18)!;
  const firstTeam = promoteYouth(career, reserve.id);
  assert.equal(firstTeam.players.find((player) => player.id === reserve.id)?.squadLevel, "First team");
});

test("academy recruitment signs an unattached five-year-old into the right pathway", () => {
  const career = createCareer("Jamie Taylor", "WPR");
  const prospect = getYouthCandidates(career).find((player) => player.age === 5)!;
  const balance = getClub(career).balance;
  assert.equal(signYouthPlayer(career, prospect.id), career, "an unscouted youth prospect cannot be signed");
  const report = scoutPlayer(career, prospect.id);
  assert.ok(getScoutingReport(report, prospect.id));
  const signed = signYouthPlayer(report, prospect.id);
  const player = signed.players.find((item) => item.id === prospect.id)!;
  assert.equal(player.clubId, career.clubId);
  assert.equal(player.squadLevel, "Foundation");
  assert.equal(player.wage, 0);
  assert.equal(player.contractYears, 0);
  assert.ok(getClub(signed).balance < balance);
  assert.ok(getAcademyPlayers(signed).some((item) => item.id === prospect.id));
  assert.ok(signed.news.some((item) => item.headline.includes("joins") && item.body.includes("5-year-old")));
});

test("global player directory contains 70,000 records but listings hide ability and potential", () => {
  const counts = getWorldPlayerCounts();
  assert.equal(WORLD_PLAYER_COUNT, 70_000);
  assert.equal(counts.total, 70_000);
  assert.equal(counts.firstTeam + counts.academy + counts.freeAgents, 70_000);
  const firstTeam = searchWorldDatabase("", "First team", 0, 12);
  const academy = searchWorldDatabase("", "Academy", 0, 12);
  const freeAgents = searchWorldDatabase("", "Free agent", 0, 12);
  assert.equal(firstTeam.players.length, 12);
  assert.equal(academy.players.length, 12);
  assert.equal(freeAgents.players.length, 12);
  assert.ok(firstTeam.hasMore && academy.hasMore && freeAgents.hasMore);
  assert.equal("overall" in firstTeam.players[0], false);
  assert.equal("potential" in firstTeam.players[0], false);
  assert.ok(getWorldPlayerDetails(firstTeam.players[0].id)?.overall);
  const detail = getWorldPlayerDetails(firstTeam.players[0].id)!;
  assert.notEqual(firstTeam.players[0].country, "Unknown");
  assert.ok(detail.dateOfBirth && detail.birthPlace && detail.clubHistory?.length && detail.attributes);
});

test("world player search filters by position, age and country before pagination", () => {
  const filters = { position: "GK" as const, minAge: 18, maxAge: 21, country: "Germany" };
  const firstPage = searchWorldDatabase("", "First team", 0, 12, filters);
  const nextPage = searchWorldDatabase("", "First team", 1, 12, filters);
  assert.ok(firstPage.total > 12);
  assert.equal(firstPage.players.length, 12);
  assert.equal(nextPage.total, firstPage.total);
  assert.ok(firstPage.players.every((player) => player.position === "GK" && player.age >= 18 && player.age <= 21 && player.country === "Germany"));
  assert.ok(nextPage.players.every((player) => player.position === "GK" && player.age >= 18 && player.age <= 21 && player.country === "Germany"));
  assert.notEqual(firstPage.players[0].id, nextPage.players[0].id);
});

test("fictional international clubs use country-specific naming styles", () => {
  const clubIds = ["world-00001", "world-00051", "world-00101", "world-00201", "world-00351"];
  const names = clubIds.map((id) => getWorldPlayerDetails(id)!.clubName);
  assert.equal(new Set(names).size, names.length);
  assert.match(names[0], /Athletic$/);
  assert.match(names[3], /Sporting$/);
  assert.match(names[4], /Calcio$/);
});

test("scouting reports are filed to the manager and commissioning club", () => {
  const career = createCareer("Jamie Taylor", "EMT");
  const listing = searchWorldDatabase("", "First team", 0, 1).players[0];
  const cost = getScoutingCost(career, listing.id);
  const scouted = scoutPlayer(career, listing.id);
  const report = getScoutingReport(scouted, listing.id)!;
  assert.ok(report);
  assert.equal(report.managerId, career.id);
  assert.equal(report.clubId, career.clubId);
  assert.equal(getClub(scouted).balance, getClub(career).balance - cost);
  const managerMoved = structuredClone(scouted);
  managerMoved.clubId = "WPR";
  assert.equal(getScoutingReport(managerMoved, listing.id)?.currentAbility, report.currentAbility);
  const colleagueAtOldClub = structuredClone(scouted);
  colleagueAtOldClub.id = "another-manager-career";
  assert.equal(getScoutingReport(colleagueAtOldClub, listing.id)?.potential, report.potential);
  assert.ok(scouted.finance[0].label.includes("Scouting report"));
});

test("scouted world free agents and academy players can join a career", () => {
  const career = createCareer("Jamie Taylor", "WPR");
  const freeListing = searchWorldDatabase("", "Free agent", 0, 1).players[0];
  const freeReport = scoutPlayer(career, freeListing.id);
  const freeSigned = buyPlayer(freeReport, freeListing.id, 0);
  assert.equal(freeSigned.players.find((player) => player.id === freeListing.id)?.clubId, career.clubId);

  const academyListing = searchWorldDatabase("", "Academy", 0, 1).players[0];
  const youthReport = scoutPlayer(freeSigned, academyListing.id);
  assert.ok(getScoutingReport(youthReport, academyListing.id));
  const academySigned = signYouthPlayer(youthReport, academyListing.id);
  const youth = academySigned.players.find((player) => player.id === academyListing.id)!;
  assert.equal(youth.clubId, career.clubId);
  assert.ok(youth.age < 18);
  assert.equal(youth.squadLevel, squadLevelForAge(youth.age));
});

test("older local saves gain the new optional stadium, badge and pressure data", () => {
  const career = createCareer("Alex Morgan", "WPR");
  const legacy = structuredClone(career);
  delete legacy.pressure;
  delete legacy.clubs[0].stadium.standTiers;
  delete legacy.clubs[0].badge;
  delete legacy.scoutingReports;
  const restored = normalizeCareer(legacy);
  assert.equal(restored.pressure, 18);
  assert.equal(restored.clubs[0].stadium.standTiers?.north, restored.clubs[0].stadium.tiers);
  assert.ok(restored.clubs[0].badge);
  assert.deepEqual(restored.scoutingReports, []);
});

test("commercial assets have multi-year sponsor deals and seasonal kit sales", () => {
  const career = createCareer("Morgan Lee", "EMT");
  const offers = sponsorProposal(career);
  const stadiumOffer = getClub(offers).sponsorOffers!.find((offer) => offer.slot === "stadium")!;
  const signed = acceptSponsor(offers, stadiumOffer.id);
  assert.ok(getClub(signed).sponsorContracts!.some((contract) => contract.slot === "stadium" && contract.yearsRemaining === stadiumOffer.years));
  const endOfSeason = { ...signed, round: getSeasonWeekCount() + 1 };
  const launched = launchKitCollection(endOfSeason);
  assert.equal(launched.kitCollectionSeason, 1);
  assert.ok(getClub(launched).balance > getClub(signed).balance);
});

test("board pressure responds to poor results, press heat, supporters, players and club expectations", () => {
  const career = createCareer("Morgan Lee", "WPR");
  const baseline = getBoardPressureSignals(career);
  assert.equal(baseline.expectations, 0);
  const stressed = structuredClone(career);
  stressed.pressPressure = 90;
  stressed.winlessRun = 7;
  const club = getClub(stressed);
  club.supporterConfidence = 18;
  club.boardTrust = 15;
  for (const player of stressed.players.filter((item) => item.clubId === stressed.clubId && item.age >= 16)) player.managerRapport = 16;
  const fixture = stressed.fixtures.find((item) => item.homeClubId === stressed.clubId || item.awayClubId === stressed.clubId)!;
  fixture.played = true;
  fixture.homeGoals = fixture.homeClubId === stressed.clubId ? 0 : 3;
  fixture.awayGoals = fixture.awayClubId === stressed.clubId ? 0 : 3;
  const signals = getBoardPressureSignals(stressed);
  assert.ok(signals.form > baseline.form);
  assert.ok(signals.press > baseline.press);
  assert.ok(signals.supporters > baseline.supporters);
  assert.ok(signals.players > baseline.players);
  assert.ok(signals.board > baseline.board);
  assert.ok(signals.expectations > baseline.expectations);
});

test("bad match results raise manager pressure", () => {
  const career = createCareer("Morgan Lee", "WPR");
  let losingMatch: ReturnType<typeof playMatchday> | undefined;
  for (let seed = 1; seed <= 100 && !losingMatch; seed += 1) {
    const resolved = playMatchday(career, seed);
    const [goalsFor, goalsAgainst] = resolved.lastReport!.result.split("–").map(Number);
    if (goalsFor < goalsAgainst) losingMatch = resolved;
  }
  assert.ok(losingMatch);
  assert.ok(losingMatch.pressure! > career.pressure!);
  assert.equal(losingMatch.winlessRun, 1);
});
