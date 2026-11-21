import assert from "node:assert/strict";
import test from "node:test";
import {
  acceptSponsor,
  beginNextSeason,
  buyPlayer,
  createCareer,
  generateFixtures,
  getClub,
  getTable,
  playMatchday,
  renewContract,
  setPlayerSelection,
  sponsorProposal,
  startStadiumProject,
} from "./game";

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
  assert.equal(career.clubs.length, 12);
  assert.equal(career.fixtures.length, 132);
  assert.equal(career.players.length, 280);
  assert.equal(getClub(career).name, "Westport Rovers");
  assert.ok(getClub(career).balance > 2_000_000);
  assert.equal(career.lineup.length, 11);
  assert.equal(getTable(career).reduce((total, row) => total + row.played, 0), 0);
});

test("playing a matchday resolves all games and updates standings and finances", () => {
  const before = createCareer("Morgan Lee", "EMT");
  const after = playMatchday(before);
  assert.equal(after.round, 2);
  assert.equal(after.fixtures.filter((fixture) => fixture.round === 1 && fixture.played).length, 6);
  assert.equal(after.lastReport?.fixtureId, before.fixtures.find((fixture) => fixture.round === 1 && [fixture.homeClubId, fixture.awayClubId].includes(before.clubId))?.id);
  assert.equal(getTable(after).reduce((total, row) => total + row.played, 0), 12);
  assert.notEqual(getClub(after).balance, getClub(before).balance);
  assert.ok(after.news.some((item) => item.type === "match"));
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
  const signed = buyPlayer(career, freeAgent.id, 0);
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
  for (let matchday = career.round; matchday <= 22; matchday += 1) career = playMatchday(career);
  const youthBefore = career.players.filter((player) => player.clubId === career.clubId && player.age < 19).length;
  const nextSeason = beginNextSeason(career);
  assert.equal(nextSeason.season, 2);
  assert.equal(nextSeason.round, 1);
  assert.equal(nextSeason.history.length, 1);
  assert.equal(nextSeason.fixtures.length, 132);
  assert.ok(nextSeason.players.filter((player) => player.clubId === nextSeason.clubId && player.age < 19).length >= youthBefore);
});
