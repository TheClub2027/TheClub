import assert from "node:assert/strict";
import test from "node:test";
import {
  acceptSponsor,
  applyForJob,
  addCalendarDays,
  advanceCareerDays,
  advanceCareerCalendarDay,
  advanceToNextCalendarEvent,
  appointClubCaptain,
  appointViceCaptain,
  beginNextSeason,
  calculateSeasonAwards,
  buyPlayer,
  createCareer,
  createCareerId,
  endManagerLeaveEarly,
  estimateStadiumCommercialIncome,
  generateFixtures,
  getAcademyPlayers,
  getScoutingCost,
  getScoutingAssignment,
  getScoutingDaysRemaining,
  getScoutingReport,
  getManagedMatchPlayerRatings,
  getSetPieceMatchEffects,
  getSetPiecePlan,
  getTeamTalkPerformanceAdjustment,
  getFormationSlots,
  getYouthCandidates,
  getBoardPressureSignals,
  getCurrentBoardAgenda,
  getContractDemand,
  getTransferDemand,
  canOpenContractTalks,
  getClubProjectProgress,
  getClubResponsibilities,
  getClubDNAStatus,
  getResponsibilityEffects,
  getResponsibilityOptions,
  getLeadershipDynamics,
  getManagerBriefing,
  getManagerInbox,
  getUnreadManagerInboxCount,
  markAllManagerInboxRead,
  markManagerInboxRead,
  respondToPressConference,
  resolveClubTransferBid,
  makeManagerPromise,
  requestManagerLeave,
  getMatchPreparation,
  getMatchdaySubstitutionOptions,
  getLiveMatchSubstitutionOptions,
  MATCH_PREPARATION_PLANS,
  getClubFacilityUpgradeCost,
  getClubFinancialForecast,
  getClubSackingPoint,
  getClubArchive,
  getClub,
  getCurrentLeague,
  getActivePlayerLoans,
  getLoanDestinationOptions,
  hireStaff,
  releaseStaff,
  getSeasonWeekCount,
  isSeasonComplete,
  getSecondHalfDirectiveEffects,
  getSecondHalfMatchupPowers,
  getTable,
  getTransferRumours,
  getUserPlayers,
  getPlayerTrainingSummary,
  getPlayerConditionModifier,
  getPlayerRoleAssessment,
  getPlayerRoleOptions,
  launchKitCollection,
  normalizeCareer,
  playMatchday,
  startManagedMatch,
  advanceManagedMatch,
  addManagedMatchSubstitution,
  setManagedMatchDirective,
  setSetPieceSelection,
  finishManagedMatch,
  validateMatchdayManagementPlan,
  proposeClubProject,
  negotiatePlayerContract,
  negotiatePlayerLoan,
  negotiateTransferOffer,
  resolveBoardAgenda,
  promoteYouth,
  renewContract,
  setYouthTraining,
  setPlayerTraining,
  setPlayerRole,
  setClubResponsibility,
  scoutPlayer,
  signYouthPlayer,
  squadLevelForAge,
  setPlayerSelection,
  endPlayerLoan,
  setMatchPreparation,
  sponsorProposal,
  startStadiumProject,
  selectAIManagerStyle,
  tacticalStyleAdvantage,
  upgradeClubFacility,
} from "./game";
import { getWorldPlayerDetails, getWorldPlayerCounts, getWorldPlayerName, getWorldSquadDepth, searchWorldDatabase, WORLD_PLAYER_COUNT } from "./world-database";
import { ENGLISH_CLUB_SEEDS, ENGLISH_LEAGUES } from "./league-pyramid";
import { WORLD_CITY_NAMES_BY_COUNTRY, WORLD_COUNTRIES, WORLD_CLUB_SEEDS, WORLD_LEAGUES } from "./world-leagues";
import { getPlayerFace } from "./player-faces";
import { countWorldStaff, searchWorldStaff, WORLD_STAFF_COUNT, STAFF_ROLES } from "./world-staff-database";
import { formatGameCurrency, formatGameDistance } from "./game-settings";
import { summarizeCareerSave } from "./career-save-store";
import { campusPlotIsOwned, defaultFacilityPlan, facilityBuildFactor, facilityLayoutChangeCost, facilityRevenueFactor, facilitySiteHasCollision, getStadiumLandParcel, normalizeFacilityPlan, siteParcelAcquisitionCost } from "./stadium-facilities";
import { STAND_DESIGN_OPTIONS, STAND_STRUCTURES, defaultStandDesigns, defaultStandFacades, getStandBuildCost, getStandTierChangeCost, standCapacityFactor } from "./stadium-designs";

function continueManagerCareer(career: ReturnType<typeof createCareer>) {
  if (!career.unemployed) return career;
  const vacancy = career.clubs
    .filter((club) => club.id !== career.clubId && club.reputation <= career.managerReputation + 28)
    .sort((first, second) => second.reputation - first.reputation)[0];
  assert.ok(vacancy, "a dismissed manager should have at least one vacancy within their reputation range");
  const appointment = applyForJob(career, vacancy.id);
  assert.notEqual(appointment, career, "the manager should be able to resume the career at an available club");
  return appointment;
}

test("career IDs always match the UUID format required by cloud save storage", () => {
  const first = createCareerId();
  const second = createCareerId();
  assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.match(second, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.notEqual(first, second);
});

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
  assert.equal(getClub(career).name, "Plymouth Sound");
  assert.ok(getClub(career).balance > 2_000_000);
  assert.equal(career.lineup.length, 11);
  assert.deepEqual(career.lineup.map((id) => career.players.find((player) => player.id === id)?.position), getFormationSlots(career.formation));
  assert.ok(career.clubs.find((club) => club.id === "NPA")!.stadium.capacity > career.clubs.find((club) => club.id === "WPR")!.stadium.capacity);
  assert.ok(career.clubs.find((club) => club.id === "MCA")!.stadium.capacity > career.clubs.find((club) => club.id === "WKV")!.stadium.capacity);
  assert.equal(getTable(career).reduce((total, row) => total + row.played, 0), 0);
  assert.ok(getAcademyPlayers(career).some((player) => player.age === 5));
  assert.equal(new Set(career.clubs.map((club) => club.stadium.name)).size, 164);
  assert.ok(new Set(career.clubs.map((club) => club.stadium.architecture)).size >= 5);
  assert.ok(new Set(career.clubs.map((club) => JSON.stringify(club.stadium.standDesigns))).size > 150, "stadiums start with individually seeded stand combinations");
  assert.ok(career.clubs.every((club) => new Set(Object.values(club.stadium.standDesigns ?? {})).size === 4), "each ground starts with four different stand designs");
  assert.ok(new Set(career.clubs.map((club) => [club.badge?.shape, club.badge?.field, club.badge?.emblem].join("/"))).size > 90, "club badges have individually varied silhouettes, heraldic fields and emblems");
  assert.ok(career.clubs.every((club) => club.badge?.accent && club.badge.field), "badge palettes include a distinct accent and a field pattern");
  assert.ok(new Set(career.clubs.map((club) => club.stadium.siteSetting)).size >= 6, "grounds inherit varied neighborhood settings");
  const legacyBadgeClub = career.clubs[0];
  legacyBadgeClub.badge = { shape: "roundel", emblem: "tower", colors: [legacyBadgeClub.colors[0], legacyBadgeClub.colors[1]], foundingYear: 1875 };
  assert.ok(normalizeCareer(career).clubs[0].badge?.field, "a career made with the former shared badge template is upgraded on load");
  const profile = career.players.find((player) => player.clubId === career.clubId)!;
  assert.match(profile.dateOfBirth ?? "", /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(profile.birthPlace);
  assert.ok(profile.attributes && Object.values(profile.attributes).every((value) => value >= 5 && value <= 99));
  assert.ok(getAcademyPlayers(career).find((player) => player.age === 5)?.academyHistory?.length);
  assert.ok(career.clubs.every((club) => club.staff?.length === 8 && club.board?.length === 4));
  assert.ok(career.clubs.every((club) => club.dna?.styleAdaptation[club.dna.tacticalIdentity] === 100));
});

test("new careers assign eligible leaders to all six operating responsibilities", () => {
  const career = createCareer("Jamie Taylor", "WPR");
  const assignments = getClubResponsibilities(career);
  assert.equal(assignments.length, 6);
  for (const responsibility of assignments) {
    assert.ok(responsibility.options.length > 0, `${responsibility.title} has eligible staff`);
    assert.ok(responsibility.assigned, `${responsibility.title} has a named lead`);
    assert.ok(responsibility.roles.includes(responsibility.assigned!.role));
    assert.ok(responsibility.effect.length > 0);
  }
});

test("one staff member can cover compatible duties but loses focus across assignments", () => {
  const career = createCareer("Jamie Taylor", "WPR");
  const coach = getResponsibilityOptions(career, "matchPreparation").find((person) => person.role === "First-Team Coach")!;
  const matchLead = setClubResponsibility(career, "matchPreparation", coach.id);
  const dualLead = setClubResponsibility(matchLead, "firstTeamTraining", coach.id);
  const matchArea = getClubResponsibilities(dualLead).find((item) => item.id === "matchPreparation")!;
  assert.equal(matchArea.effectiveAbility, Math.max(20, coach.ability - 7));
});

test("responsibility delegation changes club outcomes and survives save migration", () => {
  const career = createCareer("Jamie Taylor", "WPR");
  const strong = structuredClone(career);
  const weak = structuredClone(career);
  const setLeadAbility = (save: typeof career, area: "matchPreparation" | "firstTeamTraining" | "academyDevelopment" | "scouting" | "commercial" | "supporters", ability: number) => {
    const club = getClub(save);
    const personId = club.responsibilities![area]!;
    const person = [...club.staff!, ...club.board!].find((member) => member.id === personId)!;
    person.ability = ability;
  };
  for (const area of ["matchPreparation", "firstTeamTraining", "academyDevelopment", "scouting", "commercial", "supporters"] as const) {
    setLeadAbility(strong, area, 90);
    setLeadAbility(weak, area, 40);
  }
  assert.ok(getMatchPreparation(strong)!.coachInsight > getMatchPreparation(weak)!.coachInsight);
  assert.ok(getResponsibilityEffects(strong).trainingBonus > getResponsibilityEffects(weak).trainingBonus);
  assert.ok(getResponsibilityEffects(strong).academyPotentialBonus > getResponsibilityEffects(weak).academyPotentialBonus);
  assert.ok(getResponsibilityEffects(strong).supporterConfidenceShield > getResponsibilityEffects(weak).supporterConfidenceShield);
  const target = career.players.find((player) => player.clubId !== career.clubId)!;
  assert.ok(getScoutingCost(strong, target.id) < getScoutingCost(weak, target.id));
  const strongOffer = sponsorProposal(strong).clubs.find((club) => club.id === career.clubId)!.sponsorOffers![0].annual;
  const weakOffer = sponsorProposal(weak).clubs.find((club) => club.id === career.clubId)!.sponsorOffers![0].annual;
  assert.ok(strongOffer > weakOffer, "commercial leadership improves sponsor proposals");

  const scout = getResponsibilityOptions(career, "scouting")[0];
  const assigned = setClubResponsibility(career, "scouting", scout.id);
  assert.equal(getClub(assigned).responsibilities!.scouting, scout.id);
  const restored = normalizeCareer(JSON.parse(JSON.stringify(assigned)) as typeof career);
  assert.equal(getClub(restored).responsibilities!.scouting, scout.id);
  const legacy = structuredClone(career);
  delete getClub(legacy).responsibilities;
  assert.ok(getClubResponsibilities(normalizeCareer(legacy)).every((item) => item.assigned));

  strong.round = getSeasonWeekCount() + 1;
  weak.round = getSeasonWeekCount() + 1;
  const strongIntake = beginNextSeason(strong);
  const weakIntake = beginNextSeason(weak);
  const newYouth = strongIntake.players.filter((player) => player.clubId === career.clubId && player.id.startsWith(`y${strongIntake.season}-`));
  assert.ok(newYouth.length > 0);
  assert.ok(newYouth.every((player) => player.potential > weakIntake.players.find((candidate) => candidate.id === player.id)!.potential), "the academy lead's ability is reflected in each youth intake");

  const shielded = structuredClone(career);
  const unshielded = structuredClone(career);
  const supporterId = getClub(shielded).responsibilities!.supporters!;
  const supportLeads = [getClub(shielded), getClub(unshielded)].map((club) => [...club.staff!, ...club.board!].find((person) => person.id === supporterId)!);
  supportLeads[0].ability = 90;
  supportLeads[1].ability = 50;
  const initialConfidence = getClub(unshielded).supporterConfidence;
  let protectedDefeat: ReturnType<typeof playMatchday> | null = null;
  let ordinaryDefeat: ReturnType<typeof playMatchday> | null = null;
  for (let seed = 1; seed <= 40 && !ordinaryDefeat; seed += 1) {
    const result = playMatchday(unshielded, seed);
    const [forGoals, againstGoals] = result.lastReport!.result.split("–").map(Number);
    if (forGoals < againstGoals) {
      ordinaryDefeat = result;
      protectedDefeat = playMatchday(shielded, seed);
    }
  }
  assert.ok(ordinaryDefeat && protectedDefeat, "a deterministic trial produces a defeat to review");
  assert.equal(getClub(protectedDefeat).supporterConfidence, getClub(ordinaryDefeat).supporterConfidence + 2);
  assert.equal(getClub(unshielded).supporterConfidence, initialConfidence, "the original career remains unchanged by delegated response");
});

test("responsibility assignments reject ineligible staff and recover after a lead leaves", () => {
  const career = createCareer("Jamie Taylor", "WPR");
  const scout = getResponsibilityOptions(career, "scouting")[0];
  assert.equal(setClubResponsibility(career, "supporters", scout.id), career);
  const assigned = setClubResponsibility(career, "scouting", scout.id);
  const released = releaseStaff(assigned, scout.id);
  assert.equal(getClub(released).responsibilities!.scouting, null);
  const managerHandles = setClubResponsibility(released, "scouting", null);
  const restored = normalizeCareer(managerHandles);
  assert.equal(getClub(restored).responsibilities!.scouting, null, "an intentional manager-led area stays unassigned during save normalization");
});

test("club project proposals use recorded director votes and allow only one active plan", () => {
  const career = createCareer("Jamie Taylor", "WPR");
  const club = getClub(career);
  club.boardTrust = 100;
  const approved = proposeClubProject(career, "academy", 3);
  const project = getClub(approved).project!;
  assert.equal(project.status, "Active");
  assert.equal(project.duration, 3);
  assert.equal(project.target, club.academyLevel + 1);
  assert.ok(project.votes.length >= 3);
  assert.ok(project.votes.filter((vote) => vote.vote === "For").length > project.votes.filter((vote) => vote.vote === "Against").length);
  assert.equal(proposeClubProject(approved, "league", 5), approved, "an active project blocks a second concurrent plan");

  const lowConfidence = structuredClone(career);
  const lowTrustClub = getClub(lowConfidence);
  lowTrustClub.boardTrust = 0;
  for (const member of lowTrustClub.board!) member.ability = 40;
  const rejected = proposeClubProject(lowConfidence, "finances", 5);
  assert.equal(getClub(rejected).project?.status, "Rejected");
  assert.ok(rejected.news[0].headline.includes("rejects"));
});

test("board agendas respond to supporter confidence and record a consequential meeting choice", () => {
  const career = createCareer("Jamie Taylor", "WPR");
  getClub(career).supporterConfidence = 30;
  const meeting = playMatchday(career, 1801);
  const agenda = getCurrentBoardAgenda(meeting).find((item) => item.kind === "supporters");
  assert.ok(agenda, "low supporter confidence should call a board meeting after the match");
  assert.equal(agenda.status, "Open");
  assert.equal(agenda.choices.length, 2);
  assert.ok(agenda.choices.every((choice) => choice.votes.length >= 3));
  assert.ok(agenda.reason.includes("confidence"));

  const confidence = getClub(meeting).supporterConfidence;
  const decision = resolveBoardAgenda(meeting, agenda.id, "supporter-forum");
  const resolved = getCurrentBoardAgenda(decision).find((item) => item.id === agenda.id)!;
  assert.equal(resolved.status, "Resolved");
  assert.equal(resolved.selectedChoice, "supporter-forum");
  assert.equal(getClub(decision).supporterConfidence, Math.min(100, confidence + 5));
  assert.ok(decision.news[0].headline.includes("decision recorded"));
  assert.equal(resolveBoardAgenda(decision, agenda.id, "community-day"), decision, "a completed agenda cannot be decided twice");
  const restored = normalizeCareer(JSON.parse(JSON.stringify(decision)) as typeof career);
  assert.equal(getCurrentBoardAgenda(restored).find((item) => item.id === agenda.id)?.status, "Resolved", "meeting decisions survive save and reload");
});

test("board finance agenda shifts transfer allocation or records a real working-capital loan", () => {
  const career = createCareer("Jamie Taylor", "WPR");
  const club = getClub(career);
  club.balance = -10_000_000;
  club.debt = 10_000_000;
  club.transferBudget = 800_000;
  const meeting = playMatchday(career, 4102);
  const agenda = getCurrentBoardAgenda(meeting).find((item) => item.kind === "finance")!;
  assert.ok(agenda);

  const beforeBalance = getClub(meeting).balance;
  const beforeBudget = getClub(meeting).transferBudget;
  const controlled = resolveBoardAgenda(meeting, agenda.id, "cash-controls");
  const reserve = Math.min(beforeBudget, Math.max(50_000, Math.round(beforeBudget * 0.25)));
  assert.equal(getClub(controlled).transferBudget, beforeBudget - reserve);
  assert.equal(getClub(controlled).balance, beforeBalance + reserve);
  assert.equal(getClub(controlled).debt, getClub(meeting).debt);

  const loan = resolveBoardAgenda(meeting, agenda.id, "working-capital");
  const loanCost = agenda.choices.find((choice) => choice.id === "working-capital")!.cost;
  assert.equal(getClub(loan).balance, beforeBalance + loanCost);
  assert.equal(getClub(loan).debt, getClub(meeting).debt + loanCost);
  assert.ok(loan.finance.some((entry) => entry.label === "Working-capital loan" && entry.amount === loanCost));
});

test("board agendas respond to dressing-room strain and academy decisions apply priced upgrades", () => {
  const career = createCareer("Jamie Taylor", "WPR");
  const club = getClub(career);
  club.dressingRoomTension = 60;
  for (const player of career.players.filter((item) => item.clubId === career.clubId && item.age >= 16)) player.managerRapport = 30;
  const meeting = playMatchday(career, 8123);
  const agenda = getCurrentBoardAgenda(meeting).find((item) => item.kind === "dressing-room")!;
  assert.ok(agenda);
  const tension = getClub(meeting).dressingRoomTension!;
  const players = meeting.players.filter((item) => item.clubId === meeting.clubId && item.age >= 16);
  const rapport = players[0].managerRapport!;
  const united = resolveBoardAgenda(meeting, agenda.id, "captains-council");
  assert.equal(getClub(united).dressingRoomTension, Math.max(0, tension - 14));
  assert.ok(united.players.find((item) => item.id === players[0].id)!.managerRapport! >= rapport + 6);

  const academyCareer = createCareer("Morgan Lee", "EMT");
  academyCareer.season = 3;
  const academyClub = getClub(academyCareer);
  academyClub.academyLevel = 1;
  const academyMeeting = playMatchday(academyCareer, 321);
  const academyAgenda = getCurrentBoardAgenda(academyMeeting).find((item) => item.kind === "academy");
  assert.ok(academyAgenda);
  const cost = academyAgenda.choices.find((choice) => choice.id === "academy-expansion")!.cost;
  const expanded = resolveBoardAgenda(academyMeeting, academyAgenda.id, "academy-expansion");
  assert.equal(getClub(expanded).academyLevel, 2);
  assert.equal(getClub(expanded).balance, getClub(academyMeeting).balance - cost);
});

test("multi-season project milestones review real club progress and keep a history", () => {
  const career = createCareer("Jamie Taylor", "WPR");
  getClub(career).boardTrust = 100;
  const approved = proposeClubProject(career, "academy", 3);
  const project = getClub(approved).project!;
  getClub(approved).academyLevel = project.target;
  approved.round = getSeasonWeekCount() + 1;
  const reviewed = beginNextSeason(approved);
  const completed = getClub(reviewed).project!;
  assert.equal(completed.status, "Completed");
  assert.equal(completed.seasonsReviewed, 1);
  assert.equal(completed.seasonsRemaining, 2);
  assert.equal(getClubProjectProgress(completed), 100);
  assert.ok(reviewed.news.some((item) => item.headline.includes("delivered at")));

  const nextPlan = proposeClubProject(reviewed, "stadium", 4);
  assert.equal(getClub(nextPlan).project?.kind, "stadium");
  assert.equal(getClub(nextPlan).projectHistory?.[0].status, "Completed");
  const restored = normalizeCareer(JSON.parse(JSON.stringify(nextPlan)) as typeof career);
  assert.equal(getClub(restored).project?.kind, "stadium");
  assert.equal(getClub(restored).projectHistory?.[0].id, completed.id);
});

test("missing a club project deadline lowers board trust and raises pressure", () => {
  const career = createCareer("Jamie Taylor", "WPR");
  const club = getClub(career);
  club.boardTrust = 100;
  club.targetPosition = career.clubs.filter((item) => item.leagueId === club.leagueId).length;
  career.managerContract!.targetPosition = club.targetPosition;
  career.managerContract!.endSeason = 3;
  const approved = proposeClubProject(career, "finances", 3);
  // Give the club a deliberately unreachable target so its matchday revenue
  // cannot complete this project before the three-season deadline.
  getClub(approved).project!.target = Number.MAX_SAFE_INTEGER;
  const withoutPlan = structuredClone(approved);
  delete getClub(withoutPlan).project;
  let reviewed = approved;
  let comparison = withoutPlan;
  for (let season = 0; season < 3; season += 1) {
    reviewed.round = getSeasonWeekCount() + 1;
    comparison.round = getSeasonWeekCount() + 1;
    reviewed = beginNextSeason(reviewed);
    comparison = beginNextSeason(comparison);
  }
  assert.equal(getClub(reviewed).project?.status, "Missed");
  assert.equal(getClub(reviewed).project?.seasonsRemaining, 0);
  assert.equal(getClub(reviewed).boardTrust, getClub(comparison).boardTrust - 7);
  assert.equal(reviewed.pressure, (comparison.pressure ?? 18) + 6);
  assert.ok(reviewed.news.some((item) => item.headline.includes("fall short")));
});

test("stadium and league project metrics update from completed construction and table finishes", () => {
  const career = createCareer("Jamie Taylor", "WPR");
  const club = getClub(career);
  club.boardTrust = 100;
  club.targetPosition = getCurrentLeague(career).clubs;
  career.managerContract!.targetPosition = club.targetPosition;
  career.managerContract!.endSeason = 3;
  const stadiumPlan = proposeClubProject(career, "stadium", 3);
  getClub(stadiumPlan).stadium.capacity = getClub(stadiumPlan).project!.target;
  stadiumPlan.round = getSeasonWeekCount() + 1;
  const stadiumReview = beginNextSeason(stadiumPlan);
  assert.equal(getClub(stadiumReview).project?.status, "Completed");

  const leaguePlan = proposeClubProject(stadiumReview, "league", 3);
  assert.equal(getClub(leaguePlan).project?.target, 2);
  leaguePlan.round = getSeasonWeekCount() + 1;
  const leagueReview = beginNextSeason(leaguePlan);
  assert.equal(getClub(leagueReview).project?.status, "Active");
  assert.equal(getClub(leagueReview).project?.current, 1);
  assert.equal(getClubProjectProgress(getClub(leagueReview).project!), 50);
});

test("club DNA is distinct, compatible with the starting tactics and shapes scouting", () => {
  const career = createCareer("Alex Morgan", "WPR");
  const club = getClub(career);
  assert.ok(club.dna);
  assert.equal(career.style, club.dna!.tacticalIdentity);
  assert.equal(getClubDNAStatus(career).styleFit, 100);
  assert.ok(new Set(career.clubs.map((entry) => JSON.stringify(entry.dna))).size > 100, "club identities are individually seeded");

  const changed = structuredClone(career);
  changed.style = (["Possession", "High press", "Counter attack"] as const).find((style) => style !== club.dna!.tacticalIdentity)!;
  assert.equal(getClubDNAStatus(changed).styleFit, 0, "a new style starts without earned acceptance");

  const youthTarget = career.players.find((player) => player.age < 18 && player.clubId !== career.clubId)!;
  const provenTalentPolicy = structuredClone(career);
  getClub(provenTalentPolicy).dna!.recruitmentPolicy = "Proven talent";
  const academyPolicy = structuredClone(career);
  getClub(academyPolicy).dna!.recruitmentPolicy = "Academy pathway";
  assert.ok(getScoutingCost(academyPolicy, youthTarget.id) < getScoutingCost(provenTalentPolicy, youthTarget.id));
});

test("results gradually earn acceptance for a changed tactical identity", () => {
  const career = createCareer("Avery Stone", "WPR");
  const club = getClub(career);
  club.dna!.tacticalIdentity = "Possession";
  club.dna!.supporterIdentity = "Front-foot football";
  club.dna!.identityStrength = 85;
  club.dna!.styleAdaptation = { Possession: 100 };
  career.style = "Counter attack";
  const supporterLead = club.board!.find((member) => member.id === club.responsibilities!.supporters)!;
  supporterLead.ability = 50;
  assert.equal(getClubDNAStatus(career).supporterStyleFit, 38);
  const originalSupporters = getClub(career).supporterConfidence;
  let win: ReturnType<typeof playMatchday> | null = null;
  let loss: ReturnType<typeof playMatchday> | null = null;
  for (let seed = 1; seed <= 100 && (!win || !loss); seed += 1) {
    const result = playMatchday(career, seed);
    const [forGoals, againstGoals] = result.lastReport!.result.split("–").map(Number);
    if (forGoals > againstGoals) win ??= result;
    if (forGoals < againstGoals) loss ??= result;
  }
  assert.ok(win && loss, "a fixed seed range should produce wins and losses");
  assert.ok(getClubDNAStatus(win).styleFit > 0, "a win increases acceptance of the new style");
  assert.equal(getClub(loss).supporterConfidence, originalSupporters - 5, "strong traditions and a style supporters dislike add a point of frustration");
});

test("the set-piece designer persists valid starters and changes modelled match impact", () => {
  const career = createCareer("Morgan Lee", "WPR");
  const starters = career.lineup.map((id) => career.players.find((player) => player.id === id)!);
  const originalPlan = getSetPiecePlan(career);
  assert.ok([originalPlan.cornerTakerId, originalPlan.cornerTargetId, originalPlan.freeKickTakerId, originalPlan.penaltyTakerId].every((id) => career.lineup.includes(id)));
  assert.ok(getSetPieceMatchEffects(career).attackingXg > 0);
  assert.ok(getSetPieceMatchEffects(career).defendingXg > 0);

  const alternateDelivery = setSetPieceSelection(career, "cornerDelivery", "Outswinging");
  assert.equal(getSetPiecePlan(alternateDelivery).cornerDelivery, "Outswinging");
  assert.notEqual(getSetPieceMatchEffects(alternateDelivery).attackingXg, getSetPieceMatchEffects(career).attackingXg);
  const alternateDefence = setSetPieceSelection(career, "cornerDefence", "Zonal");
  assert.notEqual(getSetPieceMatchEffects(alternateDefence).defendingXg, getSetPieceMatchEffects(career).defendingXg);

  const newTaker = starters.find((player) => player.id !== originalPlan.cornerTakerId)!;
  const assigned = setSetPieceSelection(career, "cornerTakerId", newTaker.id);
  assert.equal(getSetPiecePlan(assigned).cornerTakerId, newTaker.id);
  assert.equal(setSetPieceSelection(career, "cornerTakerId", "opposition-player"), career, "assignments cannot point to players outside the selected XI");
  const restored = normalizeCareer(JSON.parse(JSON.stringify(assigned)) as typeof career);
  assert.deepEqual(getSetPiecePlan(restored), getSetPiecePlan(assigned), "routine choices survive career save/load normalization");
});

test("manager inbox delivers match briefings, press decisions and actionable transfer bids", () => {
  const career = createCareer("Morgan Lee", "WPR");
  const fixture = career.fixtures.find((item) => item.round === career.round && (item.homeClubId === career.clubId || item.awayClubId === career.clubId))!;
  career.calendarDate = addCalendarDays(fixture.date, -1);
  const initial = getManagerInbox(career);
  const briefing = initial.find((message) => message.category === "Match analysis");
  const pressInvite = initial.find((message) => message.category === "Press conference");
  assert.ok(briefing, "opposition analysis should arrive before the next fixture");
  assert.ok(pressInvite, "the media invitation should appear shortly before the match");
  assert.equal(getUnreadManagerInboxCount(career), initial.length);

  const read = markManagerInboxRead(career, [briefing.id]);
  assert.equal(getManagerInbox(read).find((message) => message.id === briefing.id)?.read, true);
  assert.equal(markAllManagerInboxRead(read).inboxReadIds?.length, getManagerInbox(read).length);

  const answered = respondToPressConference(career, fixture.id, "Keep expectations measured");
  assert.equal(answered.pressConferenceResponses?.[fixture.id], "Keep expectations measured");
  assert.equal(getManagerInbox(answered).some((message) => message.id === pressInvite.id), false);
  assert.equal(respondToPressConference(answered, fixture.id, "Demand a response"), answered, "a press invitation can only be answered once");

  const seller = getClub(career);
  const target = career.players.find((player) => player.clubId === seller.id && player.age >= 18 && player.contractYears >= 1)!;
  const buyer = career.clubs.filter((club) => club.id !== seller.id).sort((first, second) => second.balance - first.balance)[0];
  const offerId = "test-incoming-bid";
  career.incomingTransferOffers = [{ id: offerId, playerId: target.id, bidderClubId: buyer.id, fee: 100_000, date: career.calendarDate, expiresDate: addCalendarDays(career.calendarDate, 5), season: career.season, round: career.round, status: "Pending" }];
  const bidMessage = getManagerInbox(career).find((message) => message.id === `transfer-bid:${offerId}`);
  assert.ok(bidMessage, "a formal approach should have an inbox decision");
  const sold = resolveClubTransferBid(career, offerId, "Accept");
  assert.equal(sold.players.find((player) => player.id === target.id)?.clubId, buyer.id);
  assert.equal(sold.incomingTransferOffers?.[0].status, "Accepted");
  assert.ok(getClub(sold).balance >= seller.balance + 100_000);
  assert.ok(sold.transferHistory?.some((record) => record.id === offerId));

  const windowCareer = createCareer("Test Manager", "WPR");
  windowCareer.id = "inbox-window-test";
  const windowMatch = playMatchday(windowCareer, 5);
  const windowOffer = windowMatch.incomingTransferOffers?.find((offer) => offer.status === "Pending");
  assert.ok(windowOffer, "AI clubs should generate a real bid during the summer transfer window");
  assert.ok(windowMatch.news.some((news) => news.id === `incoming-bid:${windowOffer.id}` && news.urgent), "the formal approach should raise an urgent club alert");
  assert.equal(getManagerInbox(windowMatch).filter((message) => message.category === "Transfer offer").length, 1, "the bid should have one actionable inbox entry, without a duplicate news message");
  const pausedDay = advanceCareerCalendarDay(windowMatch);
  assert.equal(pausedDay.event, "inbox");
  assert.equal(pausedDay.advancedDays, 0);
  assert.equal(pausedDay.career, windowMatch, "the calendar must stop until the bid is resolved");
  const rejected = resolveClubTransferBid(windowMatch, windowOffer.id, "Reject");
  assert.equal(rejected.incomingTransferOffers?.[0].status, "Rejected");
  assert.equal(advanceCareerCalendarDay(rejected).advancedDays, 1, "the calendar resumes once the manager makes a decision");
});

test("the tactical laboratory reads the opponent, rehearses a counter and uses it once", () => {
  const career = createCareer("Alex Morgan", "WPR");
  const preview = getMatchPreparation(career);
  assert.ok(preview);
  assert.equal(preview.opponentFormation, preview.opponent.aiTactics?.formation);
  assert.equal(preview.opponentMentality, preview.opponent.aiTactics?.mentality);
  assert.equal(preview.recommendedStyle, preview.opponentStyle === "Possession" ? "High press" : preview.opponentStyle === "High press" ? "Counter attack" : "Possession");
  assert.equal(preview.styleAdvantage, tacticalStyleAdvantage(career.style as "Possession" | "High press" | "Counter attack", preview.opponentStyle as "Possession" | "High press" | "Counter attack"));
  assert.equal(preview.recommendedPlan, preview.opponentStyle === "Possession" ? "Press their build-up" : preview.opponentStyle === "High press" ? "Break the press" : "Protect against counters");
  const prepared = setMatchPreparation(career, preview.recommendedPlan);
  const rehearsal = getMatchPreparation(prepared);
  assert.equal(rehearsal?.plan, preview.recommendedPlan);
  assert.ok(rehearsal!.matchRatingAdjustment > 0);
  const mismatchedPlan = MATCH_PREPARATION_PLANS.find((plan) => plan !== preview.recommendedPlan)!;
  assert.equal(getMatchPreparation(setMatchPreparation(career, mismatchedPlan))?.matchRatingAdjustment, -0.2);

  const played = playMatchday(prepared, 4319);
  assert.ok(played.lastReport?.notes.some((note) => note.includes("Rehearsal matches")));
  assert.equal(played.matchPreparation, undefined, "the selected rehearsal is consumed by its targeted fixture");
});

test("manager briefing turns live injuries, board pressure and opponent scouting into actionable advice", () => {
  const career = createCareer("Morgan Lee", "WPR");
  const injuredStarter = career.players.find((player) => player.id === career.lineup[0])!;
  injuredStarter.injury = "Hamstring strain";
  injuredStarter.injuryWeeksRemaining = 3;
  career.pressure = 81.4;
  career.winlessRun = 8;

  const match = getMatchPreparation(career)!;
  const mismatchedPlan = MATCH_PREPARATION_PLANS.find((plan) => plan !== match.recommendedPlan)!;
  const preparedCareer = setMatchPreparation(career, mismatchedPlan);
  const briefing = getManagerBriefing(preparedCareer);

  assert.ok(briefing.some((item) => item.id === "selection-injuries" && item.route === "squad" && item.evidence.includes("3 weeks")));
  assert.ok(briefing.some((item) => item.id === "board-pressure" && item.priority === "Urgent" && item.evidence.includes("8 without a win")));
  assert.ok(briefing.some((item) => item.id === `match-preparation-${match.fixture.id}` && item.priority === "Watch" && item.route === "tactics"));
  assert.ok(briefing.every((item) => item.headline.length > 0 && item.detail.length > 0 && item.evidence.length > 0));
  assert.deepEqual(getManagerBriefing(preparedCareer), briefing, "the briefing is deterministic for a fixed career state");
});

test("manager briefing highlights contract risk, academy upside and respects its display limit", () => {
  const career = createCareer("Morgan Lee", "WPR");
  const senior = career.players.find((player) => player.clubId === career.clubId && player.age >= 18)!;
  senior.contractYears = 1;
  for (const player of career.players) {
    if (player.clubId === career.clubId && player.age <= 20) player.potential = Math.min(99, player.overall + 25);
  }

  const briefing = getManagerBriefing(career, 6);
  assert.ok(briefing.some((item) => item.id === "contract-watch" && item.route === "transfers" && item.evidence.includes("due within a season")));
  assert.ok(briefing.some((item) => item.id.startsWith("academy-pathway-") && item.route === "academy"));
  assert.ok(getManagerBriefing(career, 2).length <= 2);
  assert.ok(getManagerBriefing(career, 0).length <= 1);
  assert.deepEqual(getManagerBriefing(career, Number.NaN), getManagerBriefing(career), "an invalid limit falls back to the normal briefing size");
});

test("match reports carry rivalry, debut and former-club context", () => {
  const career = createCareer("Jamie Taylor", "WPR");
  const userClub = getClub(career);
  const fixture = career.fixtures.find((item) => item.round === career.round && (item.homeClubId === career.clubId || item.awayClubId === career.clubId))!;
  const opponent = getClub(career, fixture.homeClubId === career.clubId ? fixture.awayClubId : fixture.homeClubId);
  userClub.rivals = [opponent.id];
  for (const playerId of career.lineup) {
    const player = career.players.find((entry) => entry.id === playerId)!;
    player.clubHistory!.push({ clubId: opponent.id, clubName: opponent.name, country: opponent.country, fromSeason: 1, toSeason: 1, squadLevel: "First team", appearances: 0, goals: 0, assists: 0, cleanSheets: 0 });
  }
  let report: ReturnType<typeof playMatchday> | null = null;
  for (let seed = 1; seed <= 40 && !report; seed += 1) {
    const played = playMatchday(career, seed);
    if (played.lastReport?.notes.some((note) => note.includes("scores against a former club"))) report = played;
  }
  assert.ok(report, "the starting XI should have a scoring chance across the fixed seed range");
  assert.ok(report.lastReport!.notes.some((note) => note.includes("Derby context")));
  assert.ok(report.lastReport!.notes.some((note) => note.includes("First-team debut")));
  assert.ok(report.lastReport!.notes.some((note) => note.includes("scores against a former club")));
});

test("career save library summaries identify the manager, club and progress", () => {
  const career = createCareer("Avery Stone", "WPR");
  career.season = 4;
  career.round = 17;
  assert.deepEqual(summarizeCareerSave(career, "2026-11-23T12:00:00.000Z"), {
    id: career.id,
    manager: "Avery Stone",
    club: getClub(career).name,
    country: getClub(career).country,
    season: 4,
    round: 17,
    updatedAt: "2026-11-23T12:00:00.000Z",
  });
});

test("the global world has playable national leagues, unique clubs and deep player records", () => {
  const continents = new Set(WORLD_COUNTRIES.map((entry) => entry.continent));
  assert.deepEqual([...continents].sort(), ["Africa", "Asia", "Europe", "North America", "Oceania", "South America"]);
  assert.equal(WORLD_LEAGUES.length, (WORLD_COUNTRIES.length - 1) * 2);
  assert.equal(WORLD_CLUB_SEEDS.length, WORLD_LEAGUES.reduce((total, league) => total + league.clubs, 0));
  assert.ok(WORLD_LEAGUES.every((league) => league.clubs >= 10 && league.clubs % 2 === 0 && league.rounds >= league.clubs - 1));
  assert.ok(WORLD_COUNTRIES.filter((entry) => entry.country !== "England").every((entry) => WORLD_LEAGUES.some((league) => league.country === entry.country && league.tier === 1) && WORLD_LEAGUES.some((league) => league.country === entry.country && league.tier === 2)));
  assert.ok(WORLD_LEAGUES.filter((league) => league.tier === 1).every((league) => league.relegationPlaces === 2));
  assert.ok(WORLD_LEAGUES.filter((league) => league.tier === 2).every((league) => league.promotionPlaces === 2 && league.automaticPromotion === 2));
  assert.ok(WORLD_LEAGUES.every((league) => WORLD_CITY_NAMES_BY_COUNTRY[league.country]?.length > 0));
  assert.ok(WORLD_CLUB_SEEDS.every((club) => WORLD_CITY_NAMES_BY_COUNTRY[club.country]?.includes(club.city)));
  assert.ok(WORLD_CLUB_SEEDS.every((club) => club.name.includes(club.city)));
  assert.equal(new Set(WORLD_CLUB_SEEDS.map((club) => club.short)).size, WORLD_CLUB_SEEDS.length);
  assert.equal(new Set(WORLD_CLUB_SEEDS.map((club) => club.name)).size, WORLD_CLUB_SEEDS.length);
  assert.equal(WORLD_LEAGUES.find((league) => league.country === "Spain")?.clubs, 20);
  assert.equal(WORLD_LEAGUES.find((league) => league.country === "Spain" && league.tier === 2)?.clubs, 22);
  assert.equal(WORLD_LEAGUES.find((league) => league.country === "France")?.clubs, 18);
  assert.equal(WORLD_LEAGUES.find((league) => league.country === "Italy")?.clubs, 20);
  assert.equal(WORLD_LEAGUES.find((league) => league.country === "Germany")?.clubs, 18);
  assert.equal(WORLD_LEAGUES.find((league) => league.country === "Japan")?.clubs, 20);
  assert.equal(WORLD_LEAGUES.find((league) => league.country === "Japan" && league.tier === 2)?.clubs, 20);
  assert.equal(WORLD_LEAGUES.find((league) => league.country === "Brazil")?.clubs, 20);
  assert.equal(WORLD_LEAGUES.find((league) => league.country === "Argentina")?.clubs, 30);
  assert.equal(WORLD_LEAGUES.find((league) => league.country === "United States")?.clubs, 30);
  assert.equal(WORLD_LEAGUES.find((league) => league.country === "United States" && league.tier === 2)?.clubs, 24);
  for (const league of WORLD_LEAGUES) {
    const clubIds = WORLD_CLUB_SEEDS.filter((club) => club.leagueId === league.id).map((club) => club.short);
    const fixtures = generateFixtures(1, clubIds, league.id);
    assert.equal(fixtures.length, league.clubs * league.rounds / 2);
    assert.ok(clubIds.every((clubId) => fixtures.filter((fixture) => fixture.homeClubId === clubId || fixture.awayClubId === clubId).length === league.rounds));
  }
  assert.ok(WORLD_CLUB_SEEDS.some((club) => club.country === "Spain" && club.city === "Sevilla"));
  assert.ok(WORLD_CLUB_SEEDS.some((club) => club.country === "France" && club.city === "Paris"));
  assert.ok(WORLD_CLUB_SEEDS.some((club) => club.country === "Spain" && club.name === "Sevilla Puerta del Sur"));
  assert.ok(WORLD_CLUB_SEEDS.some((club) => club.country === "France" && club.name === "Paris Union"));
  for (const city of ["Lille", "Lyon", "Nantes"]) {
    const cityClubs = WORLD_CLUB_SEEDS.filter((club) => club.country === "France" && club.city === city);
    assert.ok(cityClubs.length >= 3, `${city} should support several distinct clubs across the two divisions`);
    assert.equal(new Set(cityClubs.map((club) => club.name)).size, cityClubs.length, `${city} clubs should have distinct identities`);
    assert.ok(cityClubs.every((club) => club.name.includes(city)), `${city} should remain visible in each club name`);
    assert.ok(new Set(cityClubs.map((club) => club.name.split(" ")[0])).size >= 3, `${city} should use several naming structures, not only city-first names`);
    assert.equal(new Set(cityClubs.map((club) => club.name.split(city).join("{city}").toLocaleLowerCase("fr"))).size, cityClubs.length, `${city} clubs should not reuse the same naming construction`);
  }
  for (const league of WORLD_LEAGUES.filter((entry) => entry.tier === 1)) {
    const clubs = WORLD_CLUB_SEEDS.filter((club) => club.leagueId === league.id);
    const namingForms = new Set(clubs.map((club) => club.name.split(club.city).join("{city}").toLocaleLowerCase("en").replace(/\s+/g, " ").trim()));
    assert.ok(namingForms.size >= Math.min(8, Math.ceil(league.clubs / 2)), `${league.country} should use a varied mix of naming forms across its top flight`);
  }
  const realFrenchClubNames = new Set(["lille osc", "olympique lyonnais", "fc nantes", "olympique de marseille", "paris saint-germain", "girondins de bordeaux"]);
  assert.ok(WORLD_CLUB_SEEDS.filter((club) => club.country === "France").every((club) => !realFrenchClubNames.has(club.name.toLocaleLowerCase("en"))));
  assert.ok(WORLD_CLUB_SEEDS.every((club) => !club.name.endsWith(` ${club.country}`) || club.city.endsWith(club.country)), "duplicate names should use a local football identity, except where the city itself contains the country name");
  assert.ok(WORLD_CLUB_SEEDS.some((club) => club.country === "Japan" && /Tokyo (Kuroshio|Akatsuki|Aozora|Kintsugi|Raiden|Yamabiko|Shinkai|Hinode|Kazanami|Tenku|Asahi|Sazanami)/.test(club.name)));
  assert.ok(WORLD_CLUB_SEEDS.some((club) => club.country === "Japan" && club.city === "Tokyo"));
  const squadDepth = getWorldSquadDepth();
  assert.equal(squadDepth.clubs, ENGLISH_CLUB_SEEDS.length + WORLD_CLUB_SEEDS.length);
  assert.ok(squadDepth.firstTeamMinimum >= 18);
  assert.ok(squadDepth.academyMinimum >= 12);
  const names = new Set<string>();
  for (let index = 0; index < WORLD_PLAYER_COUNT; index += 1) names.add(getWorldPlayerName(index));
  assert.equal(names.size, WORLD_PLAYER_COUNT);
  assert.ok(WORLD_CLUB_SEEDS.every((club) => WORLD_LEAGUES.some((league) => league.id === club.leagueId && league.country === club.country)));
  assert.ok(STAFF_ROLES.includes("First-Team Manager"));
});

test("a global career starts a full league season with its own academy and staff", () => {
  const chosen = WORLD_CLUB_SEEDS.find((club) => club.country === "Japan")!;
  const career = createCareer("Aiko Tanaka", chosen.short);
  const club = getClub(career);
  assert.equal(club.country, "Japan");
  const clubSeniorPlayers = career.players.filter((player) => player.clubId === club.id && player.id.startsWith(`${club.id}-`) && /^\d{2}$/.test(player.id.slice(club.id.length + 1)));
  const clubAcademyPlayers = career.players.filter((player) => player.id.startsWith(`academy-${club.id}-`));
  assert.equal(clubSeniorPlayers.length, 18);
  assert.ok(clubSeniorPlayers.filter((player) => player.nationality === club.country).length >= 8, "a national club squad should be primarily made up of domestic players");
  assert.ok(clubSeniorPlayers.some((player) => player.nationality !== club.country), "international signings should still appear in senior squads");
  assert.equal(clubAcademyPlayers.length, 48);
  assert.ok(clubAcademyPlayers.filter((player) => player.nationality === club.country).length >= 42, "academy intakes should be strongly rooted in their club's country");
  assert.ok(career.players.every((player) => WORLD_COUNTRIES.some((entry) => entry.country === player.nationality)), "generated player nationalities should use the same country data as the world database");
  assert.equal(getCurrentLeague(career).id, chosen.leagueId);
  const leagueTeams = career.clubs.filter((entry) => entry.leagueId === chosen.leagueId);
  assert.equal(leagueTeams.length, 20);
  assert.equal(career.fixtures.filter((fixture) => fixture.leagueId === chosen.leagueId).length, 380);
  const secondTier = WORLD_LEAGUES.find((league) => league.country === "Japan" && league.tier === 2)!;
  const secondTeams = career.clubs.filter((entry) => entry.leagueId === secondTier.id);
  assert.equal(secondTeams.length, secondTier.clubs);
  assert.equal(career.fixtures.filter((fixture) => fixture.leagueId === secondTier.id).length, secondTier.clubs * secondTier.rounds / 2);
  for (const team of [...leagueTeams, ...secondTeams]) {
    assert.equal(career.players.filter((player) => player.clubId === team.id && player.id.startsWith(`${team.id}-`) && /^\d{2}$/.test(player.id.slice(team.id.length + 1))).length, 18);
    assert.equal(career.players.filter((player) => player.id.startsWith(`academy-${team.id}-`)).length, 48);
  }
  assert.ok(career.players.some((player) => player.clubId === career.clubId && player.age === 5));
  assert.ok(club.staff?.some((person) => person.role === "First-Team Manager"));
  assert.equal(getTable(career).length, 20);
});

test("world season rollover promotes two clubs and relegates two across the active national pyramid", () => {
  const chosen = WORLD_CLUB_SEEDS.find((club) => club.country === "Japan")!;
  const career = createCareer("Aiko Tanaka", chosen.short);
  const top = WORLD_LEAGUES.find((league) => league.country === "Japan" && league.tier === 1)!;
  const second = WORLD_LEAGUES.find((league) => league.country === "Japan" && league.tier === 2)!;
  const topBottom = career.clubs.filter((club) => club.leagueId === top.id).at(-1)!;
  const secondChampion = career.clubs.find((club) => club.leagueId === second.id)!;
  const secondRunnerUp = career.clubs.filter((club) => club.leagueId === second.id)[1];

  for (const fixture of career.fixtures) {
    fixture.played = true;
    fixture.homeGoals = 0;
    fixture.awayGoals = 0;
    if (fixture.leagueId === second.id && (fixture.homeClubId === secondChampion.id || fixture.awayClubId === secondChampion.id)) {
      fixture.homeGoals = fixture.homeClubId === secondChampion.id ? 1 : 0;
      fixture.awayGoals = fixture.awayClubId === secondChampion.id ? 1 : 0;
    }
    if (fixture.leagueId === second.id && (fixture.homeClubId === secondRunnerUp.id || fixture.awayClubId === secondRunnerUp.id)) {
      fixture.homeGoals = fixture.homeClubId === secondRunnerUp.id ? 1 : 0;
      fixture.awayGoals = fixture.awayClubId === secondRunnerUp.id ? 1 : 0;
    }
    if (fixture.leagueId === top.id && (fixture.homeClubId === topBottom.id || fixture.awayClubId === topBottom.id)) {
      fixture.homeGoals = fixture.homeClubId === topBottom.id ? 0 : 1;
      fixture.awayGoals = fixture.awayClubId === topBottom.id ? 0 : 1;
    }
  }
  career.round = 47;

  const next = beginNextSeason(career);
  assert.equal(getClub(next, secondChampion.id).leagueId, top.id);
  assert.equal(getClub(next, secondRunnerUp.id).leagueId, top.id);
  assert.equal(getClub(next, topBottom.id).leagueId, second.id);
  assert.equal(next.clubs.filter((club) => club.leagueId === top.id).length, top.clubs);
  assert.equal(next.clubs.filter((club) => club.leagueId === second.id).length, second.clubs);
  assert.ok(getClub(next, secondChampion.id).history?.some((entry) => entry.title === "Promotion won"));
  assert.ok(getClub(next, topBottom.id).history?.some((entry) => entry.title === "Relegation confirmed"));
  assert.ok(next.news.some((item) => item.body.includes("clubs earn promotion")), "the promotion report remains in the feed alongside season-honours coverage");
});

test("season rollover stores sourced player honours before season statistics reset", () => {
  const career = createCareer("Aiko Tanaka", "WPR");
  const leagueId = getClub(career).leagueId;
  const leagueClubIds = new Set(career.clubs.filter((club) => club.leagueId === leagueId).map((club) => club.id));
  const star = career.players.find((player) => player.clubId === career.clubId && player.age >= 22)!;
  const young = career.players.find((player) => player.clubId && leagueClubIds.has(player.clubId) && player.id !== star.id && player.age <= 21)!;
  star.seasonStats = { appearances: 34, goals: 29, assists: 13, cleanSheets: 0, minutes: 2_850 };
  young.seasonStats = { appearances: 25, goals: 8, assists: 12, cleanSheets: 0, minutes: 1_980 };

  const awards = calculateSeasonAwards(career, career.season);
  assert.ok(awards.some((award) => award.award === "World Player of the Year" && award.playerId === star.id));
  assert.ok(awards.some((award) => award.leagueId === leagueId && award.award === "Top Scorer" && award.playerId === star.id));
  assert.ok(awards.some((award) => award.leagueId === leagueId && award.award === "Young Player of the Season" && award.playerId === young.id));
  career.round = getSeasonWeekCount(career) + 1;

  const next = beginNextSeason(career);
  assert.ok(next.awardHistory?.some((award) => award.season === 1 && award.award === "World Player of the Year" && award.playerId === star.id));
  assert.ok(next.news.some((item) => item.type === "award" && item.source === "World Football Review" && item.reliability === 98 && item.headline.includes(star.name)));
  assert.equal(next.players.find((player) => player.id === star.id)?.seasonStats?.appearances, 0, "award records keep the finished season before player figures reset");
  const restored = normalizeCareer(JSON.parse(JSON.stringify(next)) as typeof next);
  assert.ok(restored.awardHistory?.some((award) => award.id === next.awardHistory?.find((item) => item.playerId === star.id && item.award === "World Player of the Year")?.id));
});

test("transfer whispers use expiring contracts, outlet confidence and no hidden player ratings", () => {
  const career = createCareer("Aiko Tanaka", "WPR");
  const leagueId = getClub(career).leagueId;
  const leagueClubIds = new Set(career.clubs.filter((club) => club.leagueId === leagueId).map((club) => club.id));
  const candidate = career.players.find((player) => player.clubId && player.clubId !== career.clubId && leagueClubIds.has(player.clubId) && player.age >= 18)!;
  for (const player of career.players) if (player.clubId && leagueClubIds.has(player.clubId)) player.contractYears = 3;
  candidate.contractYears = 1;
  career.transferHistory = [];

  const rumours = getTransferRumours(career, leagueId);
  assert.equal(rumours.length, 1);
  assert.equal(rumours[0].playerId, candidate.id);
  assert.notEqual(rumours[0].fromClubId, rumours[0].toClubId);
  assert.ok(rumours[0].reliability >= 25 && rumours[0].reliability <= 92);
  assert.ok(rumours[0].body.includes("unverified transfer speculation"));
  assert.doesNotMatch(rumours[0].body, /overall|potential|rated/i);
  assert.deepEqual(getTransferRumours(career, leagueId), rumours, "the desk is deterministic while the saved career state is unchanged");
  const laterRound = { ...career, round: career.round + 1 };
  assert.notEqual(getTransferRumours(laterRound, leagueId)[0].id, rumours[0].id, "new matchdays produce a new, reviewable rumour item");
});

test("legacy international saves expand to the full country league without replacing the manager's club", () => {
  const chosen = WORLD_CLUB_SEEDS.find((club) => club.country === "Japan")!;
  const legacy = structuredClone(createCareer("Aiko Tanaka", chosen.short));
  const secondTier = WORLD_LEAGUES.find((league) => league.country === "Japan" && league.tier === 2)!;
  const leagueClubIds = new Set(legacy.clubs.filter((club) => club.leagueId === chosen.leagueId).map((club) => club.id));
  const removedIds = new Set([...leagueClubIds].slice(8));
  legacy.clubs = legacy.clubs.filter((club) => !removedIds.has(club.id));
  legacy.players = legacy.players.filter((player) => !removedIds.has(player.clubId ?? ""));
  legacy.playerRelationships = legacy.playerRelationships?.filter((link) => !legacy.players.some((player) => player.id === link.playerId && removedIds.has(player.clubId ?? "")));
  legacy.fixtures = legacy.fixtures.filter((fixture) => fixture.leagueId !== chosen.leagueId);
  legacy.round = 14;
  legacy.schemaVersion = 13;
  const managerClubBalance = getClub(legacy).balance;
  const history = structuredClone(legacy.history);

  const migrated = normalizeCareer(legacy);
  const leagueTeams = migrated.clubs.filter((club) => club.leagueId === chosen.leagueId);
  assert.equal(leagueTeams.length, 20);
  assert.equal(migrated.clubs.filter((club) => club.leagueId === secondTier.id).length, secondTier.clubs);
  assert.equal(migrated.season, legacy.season + 1);
  assert.equal(migrated.round, 1);
  assert.equal(getClub(migrated).balance, managerClubBalance);
  assert.deepEqual(migrated.history, history);
  assert.equal(getTable(migrated).length, 20);
  assert.ok(migrated.news.some((item) => item.headline === "The national pyramid expands"));
  for (const team of leagueTeams.filter((entry) => entry.id !== migrated.clubId)) {
    const seed = WORLD_CLUB_SEEDS.find((entry) => entry.short === team.id)!;
    assert.equal(team.name, seed.name);
    assert.equal(team.city, seed.city);
    assert.ok(migrated.players.some((player) => player.clubId === team.id));
  }
});

test("AI boards replace a manager when accumulated pressure passes the private limit", () => {
  const career = createCareer("Morgan Lee", "WPR");
  const pressuredClub = career.clubs.find((club) => club.id !== career.clubId && club.leagueId === "premier")!;
  const outgoing = pressuredClub.staff?.find((person) => person.role === "First-Team Manager");
  assert.ok(outgoing);
  pressuredClub.aiTactics!.managerPressure = 99;

  const next = playMatchday(career, 97_721);
  const replacementClub = getClub(next, pressuredClub.id);
  const history = next.managerHistory?.find((entry) => entry.clubId === pressuredClub.id);
  assert.ok(history);
  assert.equal(history.outgoingManagerId, outgoing.id);
  assert.notEqual(history.incomingManagerId, outgoing.id);
  assert.ok(replacementClub.staff?.some((person) => person.id === history.incomingManagerId && person.role === "First-Team Manager"));
  assert.ok(!replacementClub.staff?.some((person) => person.id === outgoing.id));
  assert.ok(next.news.some((item) => item.id === history.id && item.headline.includes(replacementClub.name)));
  assert.ok((replacementClub.aiTactics?.managerPressure ?? 100) < 99);
});

test("club finances reflect the large gap between the top flight and the bottom tiers", () => {
  const career = createCareer("Morgan Lee", "ASH118");
  const lowerLeagueClub = getClub(career);
  const richestClub = [...career.clubs].sort((first, second) => second.wageBudget - first.wageBudget)[0];
  assert.ok(richestClub.wageBudget > lowerLeagueClub.wageBudget * 15);
  assert.ok(richestClub.balance > lowerLeagueClub.balance * 75);
});

test("Premier League ownership funds create a near-£2bn top-six summer market", () => {
  const lowerLeagueClub = ENGLISH_CLUB_SEEDS.find((club) => club.leagueId !== "premier")!;
  const career = createCareer("Casey Rowan", lowerLeagueClub.short);
  const topSix = career.clubs.filter((club) => club.leagueId === "premier").sort((first, second) => second.reputation - first.reputation || first.id.localeCompare(second.id)).slice(0, 6);
  const topSixIds = new Set(topSix.map((club) => club.id));
  const summerMoves = (career.transferHistory ?? []).filter((transfer) => topSixIds.has(transfer.toClubId) && transfer.date === "01 Jul" && transfer.fee > 0);
  const spending = summerMoves.reduce((sum, transfer) => sum + transfer.fee, 0);
  assert.equal(topSix.length, 6);
  assert.ok(topSix.every((club) => (club.ownerWealth ?? 0) >= 5_000_000_000));
  assert.ok(summerMoves.length >= 15, "the leading clubs should each make several meaningful signings");
  assert.ok(spending >= 1_800_000_000 && spending <= 2_000_000_000, `top-six summer spending was ${spending}`);
  assert.ok(summerMoves.every((transfer) => career.players.find((player) => player.id === transfer.playerId)?.clubId === transfer.toClubId));
});

test("AI managers adapt after a losing run and the January rescue window stays smaller", () => {
  const career = createCareer("Casey Rowan", "NPA");
  const fixture = career.fixtures.find((item) => item.round === 23 && item.homeClubId !== career.clubId && item.awayClubId !== career.clubId)!;
  const losingClubId = fixture.homeClubId;
  const opponentId = fixture.awayClubId;
  const losingClub = getClub(career, losingClubId);
  losingClub.aiTactics!.winlessRun = 2;
  losingClub.aiTactics!.adaptationCooldown = 0;
  const manager = losingClub.staff?.find((person) => person.role === "First-Team Manager");
  if (manager) manager.ability = 60;
  for (const player of career.players) {
    if (player.clubId === losingClubId) { player.overall = 1; player.morale = 20; player.managerRapport = 20; }
    if (player.clubId === opponentId) player.overall = 99;
  }
  career.round = 23;
  const next = playMatchday(career, 12345);
  const updatedManager = getClub(next, losingClubId).aiTactics!;
  const januaryMoves = (next.transferHistory ?? []).filter((transfer) => transfer.date === "01 Jan" && transfer.fee > 0);
  const summerMoves = (next.transferHistory ?? []).filter((transfer) => transfer.date === "01 Jul" && transfer.fee > 0);
  assert.equal(updatedManager.adaptations, 1);
  assert.equal(updatedManager.winlessRun, 3);
  assert.deepEqual(next.winterTransferSeasons, [1]);
  assert.ok(januaryMoves.length > 0, "clubs near relegation should make targeted January signings");
  assert.ok(januaryMoves.reduce((sum, transfer) => sum + transfer.fee, 0) < summerMoves.reduce((sum, transfer) => sum + transfer.fee, 0));
});

test("AI managers scout opponents, choose a tactical counter and the style cycle is consistent", () => {
  assert.equal(tacticalStyleAdvantage("High press", "Possession"), 1.7);
  assert.equal(tacticalStyleAdvantage("Possession", "Counter attack"), 1.7);
  assert.equal(tacticalStyleAdvantage("Counter attack", "High press"), 1.7);
  assert.equal(tacticalStyleAdvantage("Possession", "High press"), -1.7);
  assert.equal(tacticalStyleAdvantage("Counter attack", "Counter attack"), 0);

  const career = createCareer("Jordan Ellis", "WPR");
  const club = career.clubs.find((item) => item.id !== career.clubId)!;
  club.dna!.tacticalIdentity = "Counter attack";
  club.dna!.styleAdaptation = { "Counter attack": 100, "High press": 0, Possession: 0 };
  club.aiTactics!.style = "Counter attack";
  const manager = club.staff!.find((person) => person.role === "First-Team Manager")!;
  manager.ability = 95;
  assert.equal(selectAIManagerStyle(club, "Possession", career.season, career.round), "High press");
  assert.equal(club.aiTactics!.style, "High press");
});

test("half-time instructions create distinct tactical trade-offs for either home or away side", () => {
  const career = createCareer("Jordan Ellis", "WPR");
  career.style = "High press";
  career.pressingIntensity = 80;
  career.attackingWidth = 72;
  career.formation = "3-5-2";
  career.tacticalFamiliarity = 88;

  const balanced = getSecondHalfDirectiveEffects(career, "Balanced");
  const press = getSecondHalfDirectiveEffects(career, "Raise the press");
  const protect = getSecondHalfDirectiveEffects(career, "Protect the lead");
  const overload = getSecondHalfDirectiveEffects(career, "Overload the wings");
  const possession = getSecondHalfDirectiveEffects(career, "Keep possession");
  assert.deepEqual(balanced, { attack: 0, defence: 0 });
  assert.ok(press.attack > possession.attack && press.defence > 0);
  assert.ok(protect.attack < 0 && protect.defence > 0, "protecting a lead sacrifices attack to strengthen defence");
  assert.ok(overload.attack > 0 && overload.defence < 0, "wing overload creates transition risk");
  assert.ok(possession.attack > 0 && possession.defence > 0);

  for (const userIsHome of [true, false]) {
    const powers = getSecondHalfMatchupPowers(80, 78, userIsHome, overload);
    const userAttack = userIsHome ? powers.homeAttack : powers.awayAttack;
    const userDefence = userIsHome ? powers.homeDefence : powers.awayDefence;
    const opponentAttack = userIsHome ? powers.awayAttack : powers.homeAttack;
    const opponentDefence = userIsHome ? powers.awayDefence : powers.homeDefence;
    assert.equal(userAttack, (userIsHome ? 80 : 78) + overload.attack);
    assert.equal(userDefence, (userIsHome ? 80 : 78) + overload.defence);
    assert.equal(opponentAttack, userIsHome ? 78 : 80);
    assert.equal(opponentDefence, userIsHome ? 78 : 80);
  }
});

test("elite AI clubs keep first-team squads at a believable size across summer windows", () => {
  let career = createCareer("Casey Rowan", "WPR");
  for (let season = 0; season < 3; season += 1) {
    career.round = getSeasonWeekCount() + 1;
    career = beginNextSeason(career);
  }
  const topSix = career.clubs.filter((club) => club.leagueId === "premier").sort((first, second) => second.reputation - first.reputation || first.id.localeCompare(second.id)).slice(0, 6);
  for (const club of topSix) {
    const seniorPlayers = career.players.filter((player) => player.clubId === club.id && player.age >= 18);
    assert.ok(seniorPlayers.length >= 18, `${club.name} should keep enough senior cover`);
    assert.ok(seniorPlayers.length <= 24, `${club.name} should release fringe players before overfilling its squad`);
  }
});

test("AI clubs renew contracts and replenish squads instead of emptying over seasons", () => {
  const career = createCareer("Morgan Lee", "WPR");
  const targetClub = career.clubs.find((club) => club.id !== career.clubId)!;
  let retained = 0;
  career.round = getSeasonWeekCount() + 1;
  for (const player of career.players) {
    if (player.clubId !== targetClub.id) continue;
    if (player.age >= 18 && retained < 4) {
      retained += 1;
      player.contractYears = 1;
    } else player.clubId = null;
  }
  const nextSeason = beginNextSeason(career);
  for (const club of nextSeason.clubs.filter((item) => item.id !== nextSeason.clubId)) {
    assert.ok(nextSeason.players.filter((player) => player.clubId === club.id && player.age >= 18).length >= 18, `${club.name} should maintain an 18-player senior squad`);
  }
  assert.ok(nextSeason.transferHistory?.some((transfer) => transfer.id.startsWith(`ai-free-agent-s${nextSeason.season}-`)));
  assert.ok(nextSeason.transferHistory?.some((transfer) => transfer.toClubId === targetClub.id && transfer.fromClubName === "Free agent"));
});

test("all generated world player portraits have their own render identity", () => {
  const portraitKeys = new Set<string>();
  for (let index = 1; index <= WORLD_PLAYER_COUNT; index += 1) {
    const playerId = `world-${String(index).padStart(5, "0")}`;
    const face = getPlayerFace(playerId);
    const renderedFace = JSON.stringify([face.skin, face.skinShade, face.hair, face.eye, face.background, face.hairStyle, face.beardStyle, face.faceWidth, face.faceHeight, face.eyeY, face.eyeGap, face.noseWidth, face.mouthWidth, face.browTilt, face.earSize, face.freckles, face.collar]);
    portraitKeys.add(renderedFace);
  }
  assert.equal(portraitKeys.size, WORLD_PLAYER_COUNT);
});

test("currency and pitch-unit settings change the displayed values", () => {
  assert.match(formatGameCurrency(1_000_000, true, "EUR"), /€/);
  assert.match(formatGameCurrency(1_000_000, true, "USD"), /\$/);
  assert.equal(formatGameDistance(105), "105 m");
});

test("the 75,000-person staff world supports searchable appointments and releases", () => {
  const career = createCareer("Riley Shaw", "WPR");
  assert.equal(WORLD_STAFF_COUNT, 75_000);
  const staffCounts = countWorldStaff(career.staffChanges);
  assert.equal(staffCounts.total, 75_000);
  assert.ok(staffCounts.atClub > 20_000);
  assert.equal(staffCounts.atClub + staffCounts.available, 75_000);
  const search = searchWorldStaff("", "Assistant Manager", "Available", 0, 1, career.staffChanges);
  assert.ok(search.total > 0);
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

test("match reports persist score-matched goal events, match statistics and player records", () => {
  const before = createCareer("Morgan Lee", "EMT");
  const after = playMatchday(before, 80421);
  const played = after.fixtures.filter((fixture) => fixture.round === 1 && fixture.played);
  assert.ok(played.length > 0);
  for (const fixture of played) {
    const goals = fixture.events?.filter((event) => event.type === "goal") ?? [];
    assert.equal(goals.filter((event) => event.clubId === fixture.homeClubId).length, fixture.homeGoals);
    assert.equal(goals.filter((event) => event.clubId === fixture.awayClubId).length, fixture.awayGoals);
    assert.ok(goals.every((event) => typeof event.x === "number" && event.x >= 0 && event.x <= 100 && typeof event.y === "number" && event.y >= 0 && event.y <= 100));
    assert.ok(goals.filter((event) => event.clubId === fixture.homeClubId).every((event) => event.x! >= 90));
    assert.ok(goals.filter((event) => event.clubId === fixture.awayClubId).every((event) => event.x! <= 10));
    assert.ok((fixture.events ?? []).filter((event) => event.type === "yellow-card").every((event) => typeof event.x === "number" && event.x >= 0 && event.x <= 100 && typeof event.y === "number" && event.y >= 0 && event.y <= 100));
    assert.equal((fixture.stats?.home.possession ?? 0) + (fixture.stats?.away.possession ?? 0), 100);
    assert.ok(fixture.events?.some((event) => event.type === "half-time"));
    assert.ok(fixture.events?.some((event) => event.type === "full-time"));
  }
  const managedFixture = played.find((fixture) => fixture.homeClubId === after.clubId || fixture.awayClubId === after.clubId)!;
  const creditedGoals = managedFixture.events?.filter((event) => event.type === "goal" && event.clubId === after.clubId).length;
  assert.equal(after.players.filter((player) => player.clubId === after.clubId).reduce((sum, player) => sum + (player.seasonStats?.goals ?? 0), 0), creditedGoals);
  const aiClubId = managedFixture.homeClubId === after.clubId ? managedFixture.awayClubId : managedFixture.homeClubId;
  assert.ok(after.players.filter((player) => player.clubId === aiClubId && player.age >= 16).some((player) => player.seasonStats?.appearances === 1));
  assert.equal(playMatchday(before, 80421).fixtures.find((fixture) => fixture.id === managedFixture.id)?.events?.map((event) => event.description).join("|"), managedFixture.events?.map((event) => event.description).join("|"));
  assert.deepEqual(playMatchday(before, 80421).fixtures.find((fixture) => fixture.id === managedFixture.id)?.events?.map((event) => [event.x, event.y]), managedFixture.events?.map((event) => [event.x, event.y]));
});

test("full-management plans apply like-for-like substitutions, minutes and half-time instructions", () => {
  const before = createCareer("Morgan Lee", "EMT");
  const options = getMatchdaySubstitutionOptions(before);
  const substitutionPair = options.starting.flatMap((outgoing) => {
    const incoming = options.bench.find((player) => player.position === outgoing.position);
    return incoming ? [{ outgoing, incoming }] : [];
  })[0];
  assert.ok(substitutionPair, "the opening squad should provide at least one like-for-like replacement");
  const plan = {
    substitutions: [{ minute: 60 as const, playerOffId: substitutionPair.outgoing.id, playerOnId: substitutionPair.incoming.id }],
    secondHalfDirective: "Keep possession" as const,
  };
  assert.equal(validateMatchdayManagementPlan(before, plan), true);
  assert.equal(validateMatchdayManagementPlan(before, { ...plan, substitutions: [{ ...plan.substitutions[0], minute: 30 as 45 }] }), false);
  assert.equal(validateMatchdayManagementPlan(before, { ...plan, substitutions: [{ ...plan.substitutions[0], playerOnId: substitutionPair.outgoing.id }] }), false);

  const after = playMatchday(before, 23941, plan);
  const managedFixture = after.fixtures.find((fixture) => fixture.round === 1 && [fixture.homeClubId, fixture.awayClubId].includes(after.clubId))!;
  assert.ok(managedFixture.events?.some((event) => event.type === "substitution" && event.playerId === substitutionPair.incoming.id));
  assert.ok(managedFixture.events?.some((event) => event.type === "tactical-change" && event.description.includes("Keep possession")));
  assert.ok(after.lastReport?.notes.some((note) => note.includes("Substitution plan completed")));
  assert.ok(after.lastReport?.notes.some((note) => note.includes("Half-time instruction applied: Keep possession")));
  assert.equal(after.players.find((player) => player.id === substitutionPair.outgoing.id)?.seasonStats?.minutes, 60);
  assert.equal(after.players.find((player) => player.id === substitutionPair.incoming.id)?.seasonStats?.minutes, 30);
  assert.equal(after.players.find((player) => player.id === substitutionPair.incoming.id)?.seasonStats?.appearances, 1);
});

test("a live match can be saved at half-time, managed, and resolved from its exact timeline", () => {
  const before = createCareer("Morgan Lee", "EMT");
  const plan = { substitutions: [], secondHalfDirective: "Balanced" as const };
  const fixtureBefore = before.fixtures.find((fixture) => fixture.round === before.round && [fixture.homeClubId, fixture.awayClubId].includes(before.clubId))!;
  const opponentBefore = getClub(before, fixtureBefore.homeClubId === before.clubId ? fixtureBefore.awayClubId : fixtureBefore.homeClubId);
  opponentBefore.dna!.tacticalIdentity = "High press";
  opponentBefore.dna!.styleAdaptation = { Possession: 0, "High press": 100, "Counter attack": 0 };
  opponentBefore.staff!.find((member) => member.role === "First-Team Manager")!.ability = 95;
  before.style = "Counter attack";
  let live = startManagedMatch(before, plan, 613902);
  assert.equal(live.calendarDate, fixtureBefore.date, "the calendar moves to matchday when the live match begins");
  assert.equal(live.activeMatch?.minute, 0);
  assert.equal(Object.keys(live.activeMatch?.playerRatings ?? {}).length, 22, "both starting elevens get a live rating record");
  assert.ok((live.activeMatch?.otherFixtureResults?.length ?? 0) > 0, "other league fixtures receive locked scorelines at kick-off");
  assert.equal(getManagedMatchPlayerRatings(live)?.home.length, 11);
  assert.equal(getManagedMatchPlayerRatings(live)?.away.length, 11);
  assert.ok(live.activeMatch?.events.some((event) => event.description.includes("possession plan to counter counter attack")), "an experienced opponent shows its scouting adjustment in the live timeline");
  assert.equal(live.round, before.round);
  assert.equal(live.fixtures.find((fixture) => fixture.id === fixtureBefore.id)?.played, false);
  assert.equal(playMatchday(live, 22), live, "a live match cannot be skipped by quick-sim");

  live = advanceManagedMatch(advanceManagedMatch(advanceManagedMatch(live)));
  assert.equal(live.activeMatch?.minute, 45);
  assert.ok(Object.values(live.activeMatch?.playerRatings ?? {}).some((rating) => rating !== 6.2), "match events and play update player ratings during the first half");
  assert.ok(live.activeMatch?.events.some((event) => event.type === "half-time"));
  const restored = normalizeCareer(JSON.parse(JSON.stringify(live)) as typeof live);
  assert.equal(restored.activeMatch?.minute, 45, "active match state survives a save/load round trip");
  live = setManagedMatchDirective(restored, "Keep possession");
  assert.equal(live.activeMatch?.plan.secondHalfDirective, "Keep possession");

  const options = getLiveMatchSubstitutionOptions(live);
  const outgoing = options.starting[0];
  const incoming = options.bench.find((player) => player.position === outgoing?.position);
  assert.ok(outgoing && incoming, "a like-for-like live change is available");
  live = addManagedMatchSubstitution(live, 60, outgoing.id, incoming.id);
  assert.equal(live.activeMatch?.plan.substitutions.length, 1);
  live = advanceManagedMatch(live);
  assert.equal(live.activeMatch?.minute, 60);
  assert.ok(live.activeMatch?.executedSubstitutions.some((substitution) => substitution.playerOnId === incoming.id));
  live = advanceManagedMatch(advanceManagedMatch(live));
  assert.equal(live.activeMatch?.minute, 90);
  assert.ok(live.activeMatch?.events.some((event) => event.type === "full-time"));
  assert.equal(live.fixtures.find((fixture) => fixture.id === fixtureBefore.id)?.played, false, "full time waits for the manager to confirm the result");

  const finalScore = { home: live.activeMatch!.homeGoals, away: live.activeMatch!.awayGoals };
  const result = finishManagedMatch(live);
  const played = result.fixtures.find((fixture) => fixture.id === fixtureBefore.id)!;
  assert.equal(played.played, true);
  assert.equal(played.homeGoals, finalScore.home);
  assert.equal(played.awayGoals, finalScore.away);
  for (const lockedResult of live.activeMatch!.otherFixtureResults ?? []) {
    const playedOtherFixture = result.fixtures.find((candidate) => candidate.id === lockedResult.fixtureId)!;
    assert.equal(playedOtherFixture.homeGoals, lockedResult.homeGoals, "score ticker results remain identical after the round is committed");
    assert.equal(playedOtherFixture.awayGoals, lockedResult.awayGoals, "score ticker results remain identical after the round is committed");
  }
  assert.equal(played.events?.filter((event) => event.description.includes("possession plan to counter counter attack")).length, 1, "the scouting change is recorded once across the live save and full-time resolution");
  assert.equal(played.stats?.home.shots, live.activeMatch!.stats.home.shots);
  assert.equal(played.stats?.away.expectedGoals, live.activeMatch!.stats.away.expectedGoals);
  assert.equal(played.events?.filter((event) => event.type === "goal" && event.clubId === played.homeClubId).length, played.homeGoals);
  assert.equal(played.events?.filter((event) => event.type === "goal" && event.clubId === played.awayClubId).length, played.awayGoals);
  assert.ok(played.events?.some((event) => event.type === "tactical-change" && event.description.includes("Keep possession")));
  assert.ok(played.events?.some((event) => event.type === "substitution" && event.playerId === incoming.id));
  assert.equal(result.players.find((player) => player.id === outgoing.id)?.seasonStats?.minutes, 60);
  assert.equal(result.players.find((player) => player.id === incoming.id)?.seasonStats?.minutes, 30);
  assert.equal(result.round, before.round + 1);
  assert.equal(result.activeMatch, null);
  assert.equal(result.lastReport?.fixtureId, played.id);
});

test("a live second yellow removes a player, creates a ban, and the ban is served after one fixture", () => {
  const career = createCareer("Morgan Lee", "EMT");
  const plan = { substitutions: [], secondHalfDirective: "Balanced" as const };
  let live = startManagedMatch(career, plan, 60419);
  const fixture = live.fixtures.find((item) => item.id === live.activeMatch?.fixtureId)!;
  const dismissed = live.players.find((player) => player.clubId === live.clubId && live.lineup.includes(player.id) && (player.position === "DEF" || player.position === "MID"))!;
  live.activeMatch!.minute = 30;
  live.activeMatch!.events.push({ id: `${fixture.id}-test-dismissal`, minute: 24, type: "red-card", clubId: live.clubId, playerId: dismissed.id, playerName: dismissed.name, x: 44, y: 32, description: `Second yellow · ${dismissed.name} is sent off.` });

  assert.equal(getManagedMatchPlayerRatings(live)!.home.concat(getManagedMatchPlayerRatings(live)!.away).some((player) => player.id === dismissed.id), false, "a sent-off player no longer appears in live ratings");
  const liveOptions = getLiveMatchSubstitutionOptions(live);
  assert.equal([...liveOptions.starting, ...liveOptions.bench].some((player) => player.id === dismissed.id), false, "the match console cannot select a player after dismissal");

  live.activeMatch!.minute = 90;
  const finished = finishManagedMatch(live);
  const dismissedAfterMatch = finished.players.find((player) => player.id === dismissed.id)!;
  assert.equal(dismissedAfterMatch.yellowCardsThisSeason, 1, "a second-yellow red also enters the season booking record");
  assert.equal(dismissedAfterMatch.suspensionMatchesRemaining, 1, "the player receives a one-match ban");
  assert.equal(getMatchdaySubstitutionOptions(finished).starting.concat(getMatchdaySubstitutionOptions(finished).bench).some((player) => player.id === dismissed.id), false, "the next matchday selection excludes the banned player");
  assert.ok(getManagerInbox(finished).some((message) => message.subject.includes("sent off and suspended")));

  const afterBan = playMatchday(finished, 90514);
  assert.equal(afterBan.players.find((player) => player.id === dismissed.id)?.suspensionMatchesRemaining, 0, "the ban is served after the club's next fixture");
});

test("the new-season transfer window creates consistent AI moves and is repeatable", () => {
  const career = createCareer("Casey Rowan", "WPR");
  career.round = getSeasonWeekCount() + 1;
  const first = beginNextSeason(career);
  const second = beginNextSeason(career);
  assert.equal(first.season, 2);
  assert.ok((first.transferHistory?.length ?? 0) > 0);
  assert.deepEqual(first.transferHistory, second.transferHistory);
  assert.equal(new Set(first.transferHistory?.map((transfer) => transfer.playerId)).size, first.transferHistory?.length);
  for (const transfer of first.transferHistory ?? []) {
    assert.notEqual(transfer.toClubId, first.clubId, "the AI window never moves players into the manager's club");
    const player = first.players.find((candidate) => candidate.id === transfer.playerId);
    assert.ok(player, "every recorded signing remains in the player database");
    assert.ok(player.clubHistory?.some((record) => record.clubId === transfer.toClubId && record.fromSeason === transfer.season), "the player's permanent history records the club and season of the signing");
    assert.ok(transfer.fee >= 0);
  }
  assert.ok(first.clubs.every((club) => club.transferBudget >= 0 && club.balance >= 0));
});

test("club DNA changes annual academy potential and transfer funding", () => {
  const baseline = createCareer("Casey Rowan", "WPR");
  const sustainable = structuredClone(baseline);
  const bold = structuredClone(baseline);
  const sustainableClub = getClub(sustainable);
  const boldClub = getClub(bold);
  sustainableClub.dna!.academyTradition = "Local roots";
  sustainableClub.dna!.recruitmentPolicy = "Proven talent";
  sustainableClub.dna!.spendingPolicy = "Sustainable growth";
  boldClub.dna!.academyTradition = "Elite production";
  boldClub.dna!.recruitmentPolicy = "Academy pathway";
  boldClub.dna!.spendingPolicy = "Bold ambition";
  sustainable.round = getSeasonWeekCount() + 1;
  bold.round = sustainable.round;
  const sustainableNext = beginNextSeason(sustainable);
  const boldNext = beginNextSeason(bold);
  const sustainableYouth = sustainableNext.players.filter((player) => player.id.startsWith("y2-")).reduce((sum, player) => sum + player.potential, 0);
  const boldYouth = boldNext.players.filter((player) => player.id.startsWith("y2-")).reduce((sum, player) => sum + player.potential, 0);
  assert.ok(boldYouth > sustainableYouth, "elite academy culture and an academy-first policy improve the intake");
  const sustainableAllocation = getClub(sustainableNext).transferBudget - sustainableClub.transferBudget;
  const boldAllocation = getClub(boldNext).transferBudget - boldClub.transferBudget;
  assert.ok(boldAllocation > sustainableAllocation, "an ambitious board allocates more transfer funding at the season boundary");
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

test("club campus parcels have distinct land costs, clear boundaries and usable build footprints", () => {
  const siteInnerX = 112;
  const siteInnerZ = 86;
  const north = getStadiumLandParcel(siteInnerX, siteInnerZ, "north");
  const east = getStadiumLandParcel(siteInnerX, siteInnerZ, "east");
  assert.equal(north.centerX, 0);
  assert.equal(north.centerZ, -(siteInnerZ + 170));
  assert.equal(east.centerX, siteInnerX + 170);
  assert.equal(north.width, east.depth);
  assert.equal(north.depth, east.width);
  assert.equal(campusPlotIsOwned(0, 0, 24, 18, siteInnerX, siteInnerZ), true, "the original stadium campus remains buildable");
  assert.equal(campusPlotIsOwned(north.centerX, north.centerZ, 36, 28, siteInnerX, siteInnerZ), false, "neighboring plots are not club land before purchase");
  assert.equal(campusPlotIsOwned(north.centerX, north.centerZ, 36, 28, siteInnerX, siteInnerZ, ["north"]), true, "a normal facility footprint fits after acquisition");
  assert.equal(campusPlotIsOwned(north.centerX + 52, north.centerZ, 18, 18, siteInnerX, siteInnerZ, ["north"]), false, "the parcel boundary rejects buildings extending beyond the purchased plot");
  assert.ok(siteParcelAcquisitionCost("Harbour edge", "north", 30_000) > siteParcelAcquisitionCost("Industrial fringe", "north", 30_000), "waterfront plots cost more than industrial fringe land");
  assert.ok(siteParcelAcquisitionCost("Suburban campus", "north", 40_000) > siteParcelAcquisitionCost("Suburban campus", "north", 8_000), "larger clubs pay more for land acquisition");
});

test("land acquisition remains part of a construction project until completion and saves with the club", () => {
  let career = createCareer("Avery Quinn", "ASH118");
  const club = getClub(career);
  club.balance = 20_000_000;
  const cost = siteParcelAcquisitionCost(club.stadium.siteSetting, "north", club.stadium.capacity);
  const project = startStadiumProject(career, "North campus plot", cost, 1, { acquiredLand: ["north"] });
  assert.notEqual(project, career);
  assert.deepEqual(getClub(project).stadium.acquiredLand, [], "the title transfers when the project finishes, not when it is approved");
  assert.deepEqual(getClub(project).stadium.project?.upgrades.acquiredLand, ["north"]);
  career = playMatchday(project, 41_882);
  assert.equal(getClub(career).stadium.project, null);
  assert.deepEqual(getClub(career).stadium.acquiredLand, ["north"]);
  assert.deepEqual(getClub(normalizeCareer(JSON.parse(JSON.stringify(career)) as ReturnType<typeof createCareer>)).stadium.acquiredLand, ["north"], "owned land persists through save normalization");
});

test("club facilities can reach twenty levels and become sharply more expensive after level fifteen", () => {
  const career = createCareer("Jordan Ellis", "WPR");
  const club = getClub(career);
  club.trainingLevel = 15;
  club.balance = 5_000_000_000;
  const levelFifteenCost = getClubFacilityUpgradeCost(14, "trainingLevel");
  const levelSixteenCost = getClubFacilityUpgradeCost(15, "trainingLevel");
  assert.ok(levelSixteenCost > levelFifteenCost * 2);
  const upgraded = upgradeClubFacility(career, "trainingLevel");
  assert.equal(getClub(upgraded).trainingLevel, 16);
  assert.equal(getClub(upgraded).balance, club.balance - levelSixteenCost);
  const capped = structuredClone(upgraded);
  getClub(capped).trainingLevel = 20;
  assert.equal(upgradeClubFacility(capped, "trainingLevel"), capped);
});

test("editor financial outlook projects ten seasons from the club's operating rules", () => {
  const career = createCareer("Jordan Ellis", "WPR");
  const club = getClub(career);
  club.debt = 12_000_000;
  const forecast = getClubFinancialForecast(career);
  assert.equal(forecast.length, 10);
  assert.equal(forecast[0].year + 1, forecast[1].year);
  assert.ok(forecast.every((year) => year.income > 0 && year.expenditure > 0));
  assert.ok(forecast[0].closingDebt < club.debt);
  assert.equal(forecast[0].closingBalance, club.balance + forecast[0].net);
  assert.equal(getClubFinancialForecast(career, club.id, 40).length, 10);
  const higherWages = structuredClone(career);
  const player = higherWages.players.find((item) => item.clubId === club.id)!;
  player.wage += 1_000;
  assert.ok(getClubFinancialForecast(higherWages)[0].expenditure > forecast[0].expenditure);
});

test("manager contract payroll appears in the forecast without double-charging the club's staff manager", () => {
  const career = createCareer("Jordan Ellis", "WPR");
  const club = getClub(career);
  const contract = career.managerContract!;
  const staffManagerWage = club.staff?.find((person) => person.role === "First-Team Manager")?.wage ?? 0;
  assert.equal(contract.clubId, club.id);
  assert.equal(contract.startSeason, career.season);
  assert.equal(contract.targetPosition, club.targetPosition);
  assert.ok(contract.weeklyWage > 0);
  assert.deepEqual(career.managerCareerHistory?.[0].contract, contract);

  const withoutUserContract = structuredClone(career);
  withoutUserContract.managerContract = null;
  const forecastWithContract = getClubFinancialForecast(career)[0];
  const forecastWithoutContract = getClubFinancialForecast(withoutUserContract)[0];
  assert.equal(
    forecastWithContract.expenditure - forecastWithoutContract.expenditure,
    (contract.weeklyWage - staffManagerWage) * getCurrentLeague(career).rounds,
    "the user manager's deal replaces the existing staff manager's salary",
  );
});

test("stadium assets have safe defaults, distinct commercial designs and priced layout changes", () => {
  const plan = defaultFacilityPlan();
  assert.equal(Object.keys(plan).length, 11);
  assert.deepEqual(plan.trainingPitches, { style: "Natural grass complex", size: "Standard", location: "north" });
  assert.equal(normalizeFacilityPlan({ hotel: { style: "not a hotel", size: "Huge" as never, location: "moon" as never } }).hotel.style, "Boutique brick");
  assert.ok(facilityBuildFactor({ style: "City glass tower", size: "Flagship", location: "south" }) > facilityBuildFactor({ style: "Boutique brick", size: "Compact", location: "south" }));
  assert.ok(facilityRevenueFactor({ style: "City glass tower", size: "Flagship", location: "south" }) > facilityRevenueFactor({ style: "Boutique brick", size: "Compact", location: "south" }));
  assert.ok(facilityLayoutChangeCost(1_000_000, plan.hotel, { ...plan.hotel, location: "north" }) > 0);
  assert.ok(facilityLayoutChangeCost(1_000_000, plan.hotel, { ...plan.hotel, position: { x: 38, z: -52 } }) > 0, "moving a built facility adds a site refit cost");
  assert.equal(facilitySiteHasCollision({ key: "hotel", x: 0, z: 0, width: 20, depth: 14 }, [{ key: "restaurant", x: 10, z: 0, width: 18, depth: 12 }]), true);
  assert.equal(facilitySiteHasCollision({ key: "hotel", x: 0, z: 0, width: 20, depth: 14 }, [{ key: "restaurant", x: 40, z: 0, width: 18, depth: 12 }]), false);
  assert.deepEqual(normalizeFacilityPlan({ carPark: { ...plan.carPark, position: { x: 999, z: -999 } } }).carPark.position, { x: 320, z: -320 });
  assert.equal(new Set(STAND_DESIGN_OPTIONS.map((option) => option.id)).size, STAND_DESIGN_OPTIONS.length);
  assert.ok(STAND_DESIGN_OPTIONS.some((option) => option.profile === "giant-end"), "the library includes a deep single-tier terrace wall");
  assert.ok(STAND_DESIGN_OPTIONS.length >= 18, "stadium stand catalog has broad structural variety");
  assert.equal(STAND_DESIGN_OPTIONS.find((option) => option.id === "deep-bowl-four-tier")?.preferredTiers, 4);
  assert.equal(STAND_DESIGN_OPTIONS.find((option) => option.id === "open-bank-terrace")?.preferredTiers, 1);
  assert.ok(STAND_DESIGN_OPTIONS.every((option) => option.cost >= 1_500_000), "every new stand begins at a multi-million construction scale");
  assert.ok(STAND_DESIGN_OPTIONS.every((option) => getStandBuildCost(option.id, 1, 5_000) >= 1_200_000), "even compact lower-league grounds pay a million-plus price to build a new stand");
  assert.ok(getStandBuildCost("deep-bowl-four-tier", 4) > getStandBuildCost("deep-bowl-four-tier", 3));
  assert.ok(getStandBuildCost("deep-bowl-four-tier", 3) > getStandBuildCost("deep-bowl-four-tier", 2));
  assert.ok(getStandBuildCost("deep-bowl-four-tier", 2) > getStandBuildCost("deep-bowl-four-tier", 1));
  assert.ok(getStandBuildCost("deep-bowl-four-tier", 4, 60_000) > getStandBuildCost("deep-bowl-four-tier", 4, 8_000), "large grounds require a larger stand construction budget");
  assert.ok(getStandTierChangeCost("deep-bowl-four-tier", 3, 4) > getStandTierChangeCost("deep-bowl-four-tier", 1, 2), "higher tiers have rising construction costs");
  assert.ok(getStandTierChangeCost("deep-bowl-four-tier", 4, 3) > 0, "removing a tier still includes demolition cost");
  assert.ok(STAND_STRUCTURES["giant-end"].rowFactor > STAND_STRUCTURES.terrace.rowFactor * 2, "the single-tier terrace wall has visibly deeper seating geometry");
  assert.ok(standCapacityFactor("terrace-wall") > standCapacityFactor("compact-terrace") * 2, "a giant end stand increases ground capacity when selected");
  assert.ok(STAND_STRUCTURES.ribbon.overhang > STAND_STRUCTURES.heritage.overhang * 3, "floating ribbon canopies differ from heritage roofs");
  const defaultFacades = defaultStandFacades(defaultStandDesigns());
  assert.notEqual(defaultFacades.west, "Curtain glass", "the default exterior is not mostly see-through");
  const stadium = { ...getClub(createCareer("Taylor Reed", "WPR")).stadium, hotelLevel: 1, facilityPlan: plan };
  const glassHotel = { ...stadium, facilityPlan: { ...plan, hotel: { style: "City glass tower", size: "Flagship" as const, location: "south" as const } } };
  assert.ok(estimateStadiumCommercialIncome(glassHotel, 65) > estimateStadiumCommercialIncome(stadium, 65));
  const standBusinesses = { ...stadium, standFrontages: { north: "Club superstore" as const, east: "Restaurant" as const, south: "None" as const, west: "Supporters bar" as const } };
  assert.ok(estimateStadiumCommercialIncome(standBusinesses, 65) > estimateStadiumCommercialIncome(stadium, 65), "built-in stand businesses produce matchday revenue");
});

test("generated English grounds get smaller down the pyramid while legacy lower-league giants remain", () => {
  const averageCapacity = (leagueId: string) => {
    const leagueClubs = ENGLISH_CLUB_SEEDS.filter((club) => club.leagueId === leagueId);
    return leagueClubs.reduce((sum, club) => sum + club.capacity, 0) / leagueClubs.length;
  };
  const averages = ["premier", "championship", "league-one", "league-two", "national"].map(averageCapacity);
  assert.ok(averages.every((capacity, index) => index === 0 || capacity < averages[index - 1]), "average ground size descends at each national tier");
  assert.ok(averageCapacity("national-north") < averageCapacity("national"));
  assert.ok(averageCapacity("national-south") < averageCapacity("national"));
  assert.ok(ENGLISH_CLUB_SEEDS.find((club) => club.short === "MCA")!.capacity > 20_000, "Manchester Exchange stays a fallen giant with a large historic ground");
  assert.ok(ENGLISH_CLUB_SEEDS.find((club) => club.short === "RCB")!.capacity > 18_000, "Birmingham Engine Works retains its oversized legacy stadium");
  assert.ok(ENGLISH_CLUB_SEEDS.filter((club) => club.leagueId === "national-south").some((club) => club.capacity < 5_000), "regional clubs include properly compact grounds");
  assert.equal(new Set(ENGLISH_CLUB_SEEDS.map((club) => club.city.toLocaleLowerCase("en"))).size, ENGLISH_CLUB_SEEDS.length, "English clubs use distinct towns and cities rather than repeating the same place");
  assert.ok(ENGLISH_CLUB_SEEDS.every((club) => club.name.includes(club.city)), "each English club identity keeps its town or city visible");
  const englishNameForms = new Set(ENGLISH_CLUB_SEEDS.map((club) => {
    if (club.name.startsWith("The ")) return "article-first";
    if (club.name.startsWith("Sporting Club ")) return "sporting-club-first";
    if (club.name.startsWith("Association of ")) return "association-first";
    if (club.name.includes(" & District ")) return "district-name";
    if (club.name.endsWith(`of ${club.city}`)) return "of-city";
    return "city-first";
  }));
  assert.ok(englishNameForms.size >= 5, "English club names should use a broad mix of local naming forms");
  for (const league of ENGLISH_LEAGUES) {
    const clubs = ENGLISH_CLUB_SEEDS.filter((club) => club.leagueId === league.id);
    const namingForms = new Set(clubs.map((club) => club.name.split(club.city).join("{city}").toLocaleLowerCase("en").replace(/\s+/g, " ").trim()));
    assert.ok(namingForms.size >= Math.min(8, Math.ceil(league.clubs / 2)), `${league.name} should retain varied fictional naming forms`);
  }
  assert.ok(ENGLISH_CLUB_SEEDS.some((club) => club.city === "Sunderland" && club.name === "Sunderland Wear"));
  assert.ok(ENGLISH_CLUB_SEEDS.some((club) => club.city === "Reading" && club.name === "Royal Reading"));
  for (const city of ["London", "Manchester", "Liverpool", "Birmingham", "Bradford", "Blackpool", "Brighton", "Exeter"]) {
    assert.ok(ENGLISH_CLUB_SEEDS.some((club) => club.city === city), `${city} should be represented in the English pyramid`);
  }
  const exactRealEnglishClubNames = new Set(["arsenal", "chelsea", "liverpool", "manchester united", "manchester city", "newcastle united", "leicester city", "bristol city", "tottenham hotspur", "west ham united"]);
  assert.ok(ENGLISH_CLUB_SEEDS.every((club) => !exactRealEnglishClubNames.has(club.name.toLocaleLowerCase("en"))), "fictional clubs should not reuse prominent real English club names");
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
  const report = advanceCareerDays(scoutPlayer(career, freeAgent.id), 5);
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

test("a selling club counters, then records an agreed player transfer and negotiated deal", () => {
  const career = createCareer("Taylor Quinn", "WPR");
  const target = career.players.find((item) => item.age >= 18 && item.clubId !== null && item.clubId !== career.clubId && item.value < 500_000)!;
  assert.equal(getTransferDemand(career, target.id), null, "undiscovered demands stay hidden until the manager scouts the player");
  const report = advanceCareerDays(scoutPlayer(career, target.id), 5);
  const demand = getTransferDemand(report, target.id)!;
  assert.ok(demand.fee > 0);
  const tightBudget = structuredClone(report);
  getClub(tightBudget).transferBudget = 0;
  assert.equal(negotiateTransferOffer(tightBudget, target.id, demand).status, "rejected");
  assert.equal(tightBudget.players.find((item) => item.id === target.id)?.clubId, target.clubId);
  const buyer = getClub(report);
  buyer.transferBudget = Math.max(buyer.transferBudget, demand.fee + 100_000);
  buyer.balance = Math.max(buyer.balance, demand.fee + demand.signingBonus + 100_000);
  const seller = getClub(report, target.clubId!);
  const sellerBalance = seller.balance;
  const buyerBalance = buyer.balance;
  const lowOffer = { ...demand, fee: Math.floor(demand.fee * 0.8 / 1_000) * 1_000 };
  const counter = negotiateTransferOffer(report, target.id, lowOffer);
  assert.equal(counter.status, "countered");
  assert.equal(counter.career, report, "countering leaves the saved career untouched");
  assert.ok(counter.counterOffer!.fee > lowOffer.fee);

  const completed = negotiateTransferOffer(report, target.id, counter.counterOffer!);
  assert.equal(completed.status, "accepted", completed.message);
  const signed = completed.career.players.find((item) => item.id === target.id)!;
  assert.equal(signed.clubId, report.clubId);
  assert.equal(signed.wage, demand.weeklyWage);
  assert.equal(signed.contractYears, demand.years);
  assert.equal(signed.contractRole, demand.squadRole);
  assert.equal(getClub(completed.career).balance, buyerBalance - demand.fee - demand.signingBonus);
  assert.equal(getClub(completed.career, seller.id).balance, sellerBalance + demand.fee);
  assert.ok(completed.career.transferHistory?.some((move) => move.playerId === target.id && move.fee === demand.fee && move.toClubId === report.clubId));
  assert.ok(completed.career.finance.some((entry) => entry.label === "Transfer fee · " + target.name && entry.amount === -demand.fee));
  assert.ok(completed.career.finance.some((entry) => entry.label === "Signing bonus · " + target.name && entry.amount === -demand.signingBonus));
  assert.equal(signed.clubHistory?.at(-1)?.clubId, report.clubId);
  assert.ok(completed.career.news[0].headline.includes("joins"));
});

test("free-agent representatives counter low personal terms before accepting without a fee", () => {
  const career = createCareer("Alex Morgan", "WPR");
  const target = career.players.find((item) => item.age >= 18 && item.clubId === null)!;
  const report = advanceCareerDays(scoutPlayer(career, target.id), 5);
  const demand = getTransferDemand(report, target.id)!;
  assert.equal(demand.fee, 0);
  assert.equal(negotiateTransferOffer(report, target.id, { ...demand, fee: 1_000 }).status, "rejected", "free agents cannot generate a transfer fee");
  const counter = negotiateTransferOffer(report, target.id, { ...demand, weeklyWage: Math.round(demand.weeklyWage * 0.65 / 100) * 100, signingBonus: 0 });
  assert.equal(counter.status, "countered");
  assert.ok(counter.counterOffer!.weeklyWage >= demand.weeklyWage);
  const completed = negotiateTransferOffer(report, target.id, counter.counterOffer!);
  assert.equal(completed.status, "accepted", completed.message);
  assert.equal(completed.career.players.find((item) => item.id === target.id)?.clubId, report.clubId);
  assert.equal(completed.career.transferHistory?.at(-1)?.fee, 0);
  assert.equal(completed.career.transferHistory?.at(-1)?.fromClubName, "Free agent");
});

test("outgoing loans move a player temporarily, credit the parent and support recall", () => {
  const career = createCareer("Alex Morgan", "WPR");
  const parent = getClub(career);
  const player = career.players.find((item) => item.clubId === parent.id && item.age >= 16 && item.contractYears > 0 && !career.lineup.includes(item.id) && parent.captainId !== item.id)!;
  const destination = getLoanDestinationOptions(career, player.id)[0];
  assert.ok(destination, "the manager can choose a suitable club in the career world");
  const fee = Math.max(5_000, Math.round(player.value * 0.012 / 1_000) * 1_000);
  const offer = { loanClubId: destination.id, loanFee: fee, wageContributionPercent: 50, durationRounds: 2 };
  const selectedCareer = structuredClone(career);
  selectedCareer.lineup.push(player.id);
  assert.equal(negotiatePlayerLoan(selectedCareer, player.id, offer).status, "rejected", "a selected player cannot be loaned out");
  const startingBalance = parent.balance;
  const result = negotiatePlayerLoan(career, player.id, offer);
  assert.equal(result.status, "accepted", result.message);
  const loan = getActivePlayerLoans(result.career).find((item) => item.playerId === player.id)!;
  assert.ok(loan);
  assert.equal(result.career.players.find((item) => item.id === player.id)?.clubId, destination.id);
  assert.equal(getClub(result.career).balance, startingBalance + fee);
  assert.equal(result.career.players.find((item) => item.id === player.id)?.clubHistory?.at(-1)?.clubId, destination.id);
  assert.equal(result.career.players.find((item) => item.id === player.id)?.clubHistory?.at(-2)?.toSeason, career.season);
  assert.equal(negotiatePlayerLoan(result.career, player.id, offer).status, "rejected", "an active loanee cannot be moved again");

  const recalled = endPlayerLoan(result.career, loan.id);
  assert.equal(recalled.playerLoans?.find((item) => item.id === loan.id)?.status, "Recalled");
  assert.equal(recalled.players.find((item) => item.id === player.id)?.clubId, parent.id);
  assert.equal(recalled.players.find((item) => item.id === player.id)?.clubHistory?.at(-1)?.clubId, parent.id);
  assert.ok(recalled.news[0].headline.includes("loan ends"));
  assert.equal(endPlayerLoan(recalled, "missing-loan"), recalled, "unknown loan IDs leave a career untouched");
});

test("incoming loans require scouting, share weekly wages and return automatically", () => {
  const career = createCareer("Alex Morgan", "WPR");
  const target = career.players.find((item) => item.age >= 16 && item.contractYears > 0 && item.clubId !== career.clubId)!;
  const requestedFee = Math.max(5_000, Math.round(target.value * 0.012 / 1_000) * 1_000);
  const offer = { loanClubId: career.clubId, loanFee: requestedFee, wageContributionPercent: 50, durationRounds: 1 };
  const hidden = negotiatePlayerLoan(career, target.id, offer);
  assert.equal(hidden.status, "rejected");
  assert.equal(hidden.career, career, "an undiscovered target cannot start talks");

  const report = advanceCareerDays(scoutPlayer(career, target.id), 5);
  const accepted = negotiatePlayerLoan(report, target.id, offer);
  assert.equal(accepted.status, "accepted", accepted.message);
  const loan = getActivePlayerLoans(accepted.career).find((item) => item.playerId === target.id)!;
  assert.ok(loan);
  const restoredSave = normalizeCareer(JSON.parse(JSON.stringify(accepted.career)) as typeof accepted.career);
  assert.deepEqual(restoredSave.playerLoans, accepted.career.playerLoans, "active loan terms survive the same JSON round-trip used by local and cloud saves");
  assert.equal(accepted.career.players.find((item) => item.id === target.id)?.clubId, career.clubId);
  assert.equal(getTransferDemand(accepted.career, target.id), null, "active loanees cannot be permanently transferred mid-loan");
  assert.equal(buyPlayer(accepted.career, target.id, requestedFee), accepted.career);

  const fullWageCareer = structuredClone(accepted.career);
  fullWageCareer.playerLoans = [];
  const fullWageMatch = playMatchday(fullWageCareer, 9271);
  const sharedWageMatch = playMatchday(accepted.career, 9271);
  const expectedWeeklySaving = Math.round(target.wage * 0.5);
  assert.equal(sharedWageMatch.finance[0].amount - fullWageMatch.finance[0].amount, expectedWeeklySaving, "the borrower pays only its agreed share of wages");
  assert.equal(sharedWageMatch.playerLoans?.find((item) => item.id === loan.id)?.status, "Completed");
  assert.equal(sharedWageMatch.players.find((item) => item.id === target.id)?.clubId, target.clubId);
  assert.equal(sharedWageMatch.playerLoans?.find((item) => item.id === loan.id)?.appearances, sharedWageMatch.players.find((item) => item.id === target.id)?.seasonStats?.appearances ?? 0);
});

test("contract requests adapt to player potential, personality and time remaining", () => {
  const career = createCareer("Alex Morgan", "WPR");
  const prospect = career.players.find((item) => item.clubId === career.clubId && item.age >= 16)!;
  prospect.age = 19;
  prospect.overall = 55;
  prospect.potential = 84;
  prospect.wage = 2_200;
  prospect.contractYears = 1;
  prospect.contractRole = "Prospect";
  prospect.personality = "Ambitious";
  prospect.managerRapport = 80;
  const demand = getContractDemand(career, prospect.id)!;
  assert.ok(demand.weeklyWage > prospect.wage, "a high-potential prospect requests a development premium");
  assert.equal(demand.years, 4);
  assert.equal(demand.squadRole, "Prospect");
  assert.ok(demand.signingBonus > 0);

  const originalBalance = getClub(career).balance;
  const result = negotiatePlayerContract(career, prospect.id, demand);
  assert.equal(result.accepted, true, result.message);
  const renewed = result.career.players.find((item) => item.id === prospect.id)!;
  assert.equal(renewed.contractYears, 4);
  assert.equal(renewed.contractRole, "Prospect");
  assert.equal(renewed.wage, demand.weeklyWage);
  assert.equal(result.career.players.find((item) => item.id === prospect.id)?.managerRapport, 86);
  assert.equal(getClub(result.career).balance, originalBalance - demand.signingBonus);
  assert.ok(result.career.finance.some((entry) => entry.label === `Contract signing bonus · ${prospect.name}`));
  assert.ok(result.career.news[0].headline.includes("commits"));
  assert.equal(prospect.contractYears, 1, "negotiating does not mutate the source career");
});

test("contract talks stay unavailable for players under sixteen", () => {
  const career = createCareer("Taylor Quinn", "WPR");
  const youth = career.players.find((item) => item.clubId === career.clubId && item.age >= 16)!;
  youth.age = 15;
  assert.equal(getContractDemand(career, youth.id), null);
  assert.equal(canOpenContractTalks(career, youth.id), false);
  assert.equal(negotiatePlayerContract(career, youth.id, { weeklyWage: 1_000, years: 3, squadRole: "Prospect", signingBonus: 0 }).accepted, false);
});

test("a poor contract proposal hurts rapport and cannot be spammed before the cooling-off period", () => {
  const career = createCareer("Taylor Quinn", "WPR");
  const player = career.players.find((item) => item.clubId === career.clubId && item.age >= 16)!;
  player.personality = "Ambitious";
  player.contractRole = "Star";
  player.contractYears = 1;
  player.managerRapport = 30;
  const demand = getContractDemand(career, player.id)!;
  const rapport = player.managerRapport;
  const morale = player.morale;
  const rejected = negotiatePlayerContract(career, player.id, { weeklyWage: Math.floor(demand.weeklyWage * 0.5), years: 1, squadRole: "Rotation", signingBonus: 0 });
  assert.equal(rejected.accepted, false);
  assert.ok(rejected.message.includes("turns down"));
  assert.equal(rejected.career.players.find((item) => item.id === player.id)!.managerRapport, rapport - 5);
  assert.equal(rejected.career.players.find((item) => item.id === player.id)!.morale, morale - 4);
  assert.equal(canOpenContractTalks(rejected.career, player.id), false);
  assert.equal(negotiatePlayerContract(rejected.career, player.id, demand).career, rejected.career);
  const afterThreeMatchdays = structuredClone(rejected.career);
  afterThreeMatchdays.round += 3;
  assert.equal(canOpenContractTalks(afterThreeMatchdays, player.id), true);
});

test("promised first-team status affects morale and manager rapport when a player is left out", () => {
  const career = createCareer("Alex Morgan", "WPR");
  const substitute = career.players.find((item) => item.clubId === career.clubId && item.age >= 16 && !career.lineup.includes(item.id))!;
  const starPromise = structuredClone(career);
  const rotationPromise = structuredClone(career);
  starPromise.players.find((item) => item.id === substitute.id)!.contractRole = "Star";
  rotationPromise.players.find((item) => item.id === substitute.id)!.contractRole = "Rotation";
  const starMatch = playMatchday(starPromise, 90331);
  const rotationMatch = playMatchday(rotationPromise, 90331);
  const star = starMatch.players.find((item) => item.id === substitute.id)!;
  const rotation = rotationMatch.players.find((item) => item.id === substitute.id)!;
  assert.equal(rotation.morale - star.morale, 3);
  assert.equal(rotation.managerRapport! - star.managerRapport!, 3);
});

test("stadium construction completes over matchdays and seasons continue indefinitely", () => {
  let career = createCareer("Taylor Quinn", "ASH118");
  const existing = getClub(career).stadium.capacity;
  const project = startStadiumProject(career, "Two-tier stand", 500_000, 1, { tiers: 2, capacity: existing + 1200 });
  assert.notEqual(project, career);
  career = playMatchday(project, 10_001);
  assert.equal(getClub(career).stadium.tiers, 2);
  assert.equal(getClub(career).stadium.capacity, existing + 1200);
  for (let matchday = career.round; matchday <= getSeasonWeekCount(); matchday += 1) {
    career = continueManagerCareer(career);
    career = playMatchday(career, 10_000 + matchday);
  }
  career = continueManagerCareer(career);
  const seasonRow = getTable(career).find((entry) => entry.clubId === career.clubId)!;
  assert.ok(seasonRow.wins < seasonRow.played * 0.8, "a lower-league side should not steamroll the division on quick-sim alone");
  assert.ok(seasonRow.losses > 0, "league opponents should be able to beat the selected club");
  const youthBefore = career.players.filter((player) => player.clubId === career.clubId && player.age < 19).length;
  const nextSeason = beginNextSeason(career);
  assert.equal(nextSeason.season, 2);
  assert.equal(nextSeason.round, 1);
  assert.equal(nextSeason.history.length, 1);
  const regionalEntrants = nextSeason.clubs.filter((club) => club.id.startsWith("feeder-"));
  assert.equal(regionalEntrants.length, 8);
  assert.equal(new Set(regionalEntrants.map((club) => JSON.stringify(club.badge))).size, regionalEntrants.length, "new regional clubs receive their own crest designs");
  assert.ok(new Set(regionalEntrants.map((club) => club.stadium.siteSetting)).size >= 3, "new regional clubs get varied neighborhood stadium settings");
  assert.equal(nextSeason.matchArchive?.length, career.fixtures.filter((fixture) => fixture.played && (fixture.homeClubId === career.clubId || fixture.awayClubId === career.clubId)).length);
  assert.equal(nextSeason.fixtures.length, 3692);
  assert.ok(nextSeason.players.filter((player) => player.clubId === nextSeason.clubId && player.age < 19).length >= youthBefore);
  assert.ok(nextSeason.clubs.filter((club) => club.id !== nextSeason.clubId).every((club) => nextSeason.players.filter((player) => player.clubId === club.id && player.age >= 18).length >= 18));
});

test("top-flight clubs advance through the shared world calendar before pre-season", () => {
  let career = createCareer("Taylor Quinn", "NPA");
  const premierLeagueRounds = getCurrentLeague(career).rounds;
  assert.equal(premierLeagueRounds, 38);
  assert.equal(isSeasonComplete(career), false);

  for (let week = 1; week <= premierLeagueRounds; week += 1) {
    career = continueManagerCareer(career);
    career = playMatchday(career, 73_000 + week);
  }
  assert.equal(career.round, 39);
  assert.equal(getTable(career).find((row) => row.clubId === career.clubId)!.played, 38);
  assert.equal(isSeasonComplete(career), false);
  assert.equal(beginNextSeason(career), career, "pre-season must wait for the other divisions");

  const worldWeek = career.round;
  career = continueManagerCareer(career);
  const worldResult = playMatchday(career, 74_000 + worldWeek);
  assert.equal(worldResult.round, 40);
  assert.ok(worldResult.fixtures.some((fixture) => fixture.round === worldWeek && fixture.leagueId !== "premier" && fixture.played));

  career = worldResult;
  for (let week = career.round; week <= getSeasonWeekCount(); week += 1) {
    career = continueManagerCareer(career);
    career = playMatchday(career, 74_000 + week);
  }
  career = continueManagerCareer(career);
  assert.equal(career.round, getSeasonWeekCount() + 1);
  assert.equal(isSeasonComplete(career), true);
  assert.equal(beginNextSeason(career).season, 2);
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
  assert.equal(setYouthTraining(career, youth.id, "invented focus"), career, "the academy only accepts listed programmes");
  const prospect = getAcademyPlayers(career).find((player) => player.age === 16)!;
  const promoted = promoteYouth(career, prospect.id);
  assert.equal(promoted.players.find((player) => player.id === prospect.id)?.squadLevel, "Reserves");
  assert.ok(promoted.players.find((player) => player.id === prospect.id)!.contractYears >= 3);
  const reserve = getAcademyPlayers(career).find((player) => player.age === 18)!;
  const firstTeam = promoteYouth(career, reserve.id);
  assert.equal(firstTeam.players.find((player) => player.id === reserve.id)?.squadLevel, "First team");
});

test("individual training permanently improves its target attributes and survives rating refreshes", () => {
  const career = createCareer("Jamie Taylor", "WPR");
  const prospect = getUserPlayers(career).find((player) => player.age < 24 && player.overall < player.potential)!;
  const before = prospect.attributes!;
  const focused = setPlayerTraining(career, prospect.id, "Finishing");
  assert.equal(focused.players.find((player) => player.id === prospect.id)?.trainingFocus, "Finishing");
  assert.equal(setPlayerTraining(career, prospect.id, "invented focus"), career, "an unknown training programme cannot be assigned");
  const player = focused.players.find((item) => item.id === prospect.id)!;
  player.attributeGrowth = {};
  player.attributeTrainingProgress = { shooting: 0.98, finishing: 0.98, passing: 0.55 };

  const result = playMatchday(focused, 6_281);
  const developed = result.players.find((item) => item.id === prospect.id)!;
  assert.equal(developed.attributeGrowth?.shooting, 1);
  assert.equal(developed.attributeGrowth?.finishing, 1);
  assert.equal(developed.attributeTrainingProgress?.passing, 0.55, "a finishing session must not advance an unrelated skill");
  assert.ok(developed.attributes!.shooting >= before.shooting + 1);
  assert.ok(developed.attributes!.finishing >= before.finishing + 1);

  const savedAndLoaded = normalizeCareer(JSON.parse(JSON.stringify(result)) as typeof result);
  const retained = savedAndLoaded.players.find((item) => item.id === prospect.id)!;
  assert.equal(retained.attributeGrowth?.shooting, 1, "career save/load retains training gains");
  assert.ok(retained.attributes!.shooting >= developed.attributes!.shooting, "career normalisation retains the trained rating");
  assert.ok(getPlayerTrainingSummary(retained).improvedAttributes.some((attribute) => attribute.name === "Finishing" && attribute.value >= 1));
});

test("player roles are position-safe, attribute-aware, and learned through match use and tactical training", () => {
  const career = createCareer("Jamie Taylor", "WPR");
  const defender = getUserPlayers(career).find((player) => player.position === "DEF")!;
  assert.ok(getPlayerRoleOptions(defender).includes("Defender"), "the default defender role is available in the squad editor");
  assert.equal(setPlayerRole(career, defender.id, "Playmaker"), career, "a player cannot be assigned a role for another position");
  const changedRole = setPlayerRole(career, defender.id, "Ball-playing defender");
  assert.equal(changedRole.players.find((player) => player.id === defender.id)?.roleFamiliarity, 35, "changing roles starts a new learning curve");
  assert.equal(setPlayerRole(changedRole, defender.id, "Ball-playing defender"), changedRole, "reselecting a role does not reset familiarity");

  const midfielder = getUserPlayers(career).find((player) => player.position === "MID")!;
  const skilledPlaymaker = { ...midfielder, role: "Playmaker", roleFamiliarity: 80, attributes: { ...midfielder.attributes!, passing: 95, vision: 95, dribbling: 95, composure: 95, crossing: 95, positioning: 95 } };
  const poorFitPlaymaker = structuredClone(skilledPlaymaker);
  for (const attribute of Object.keys(poorFitPlaymaker.attributes!) as (keyof NonNullable<typeof poorFitPlaymaker.attributes>)[]) poorFitPlaymaker.attributes![attribute] = 20;
  assert.ok(getPlayerRoleAssessment(skilledPlaymaker).fit > getPlayerRoleAssessment(poorFitPlaymaker).fit + 30, "role suitability reflects the player's actual attributes");

  const starter = career.players.find((player) => player.id === career.lineup[0])!;
  starter.roleFamiliarity = 40;
  const reserve = getUserPlayers(career).find((player) => player.age >= 16 && !career.lineup.includes(player.id) && (player.injuryWeeksRemaining ?? 0) === 0 && (player.suspensionMatchesRemaining ?? 0) === 0)!;
  const trainedCareer = setPlayerTraining(career, reserve.id, "Tactical");
  const afterMatch = playMatchday(trainedCareer, 6281);
  assert.ok(afterMatch.players.find((player) => player.id === starter.id)!.roleFamiliarity! > 40, "starting minutes improve role understanding");
  assert.ok(afterMatch.players.find((player) => player.id === reserve.id)!.roleFamiliarity! > (reserve.roleFamiliarity ?? 55), "tactical training improves role understanding for non-starters");
  const saveLoaded = normalizeCareer(JSON.parse(JSON.stringify(afterMatch)) as typeof afterMatch);
  assert.equal(saveLoaded.players.find((player) => player.id === starter.id)!.roleFamiliarity, afterMatch.players.find((player) => player.id === starter.id)!.roleFamiliarity, "role familiarity survives save/load");
});

test("academy recruitment signs an unattached five-year-old into the right pathway", () => {
  const career = createCareer("Jamie Taylor", "WPR");
  const prospect = getYouthCandidates(career).find((player) => player.age === 5)!;
  const balance = getClub(career).balance;
  assert.equal(signYouthPlayer(career, prospect.id), career, "an unscouted youth prospect cannot be signed");
  const report = advanceCareerDays(scoutPlayer(career, prospect.id), 5);
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

test("global player directory contains 200,000 records but listings hide ability and potential", () => {
  const counts = getWorldPlayerCounts();
  assert.equal(WORLD_PLAYER_COUNT, 200_000);
  assert.equal(counts.total, 200_000);
  assert.equal(counts.firstTeam + counts.academy + counts.freeAgents, 200_000);
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

test("fictional international clubs use country-specific naming and league styles", () => {
  const countries = ["Spain", "France", "Japan"];
  const profiles = countries.map((country) => searchWorldDatabase("", "First team", 0, 1, { country }).players[0]!);
  assert.equal(new Set(profiles.map((profile) => profile.country)).size, profiles.length);
  assert.equal(new Set(profiles.map((profile) => profile.clubName)).size, profiles.length);
  assert.deepEqual(profiles.map((profile) => profile.leagueName), ["Primera División", "Ligue 1", "J1 League"]);
});

test("scouting reports are filed to the manager and commissioning club", () => {
  const career = createCareer("Jamie Taylor", "EMT");
  const listing = searchWorldDatabase("", "First team", 0, 1).players[0];
  const cost = getScoutingCost(career, listing.id);
  const commissioned = scoutPlayer(career, listing.id);
  assert.equal(getScoutingReport(commissioned, listing.id), null, "ratings stay hidden while a report is in progress");
  assert.equal(getScoutingDaysRemaining(commissioned, listing.id), 5);
  assert.equal(getClub(commissioned).balance, getClub(career).balance - cost);
  assert.equal(scoutPlayer(commissioned, listing.id), commissioned, "an assignment cannot be commissioned or charged twice");
  assert.equal(getScoutingCost(commissioned, listing.id), 0);
  const fourDays = advanceCareerDays(commissioned, 4);
  assert.equal(getScoutingDaysRemaining(fourDays, listing.id), 1);
  assert.equal(getScoutingReport(fourDays, listing.id), null, "the report stays private through the fourth day");
  const scouted = advanceCareerDays(fourDays, 1);
  const report = getScoutingReport(scouted, listing.id)!;
  assert.ok(report);
  assert.equal(report.managerId, career.id);
  assert.equal(report.clubId, career.clubId);
  assert.equal(getScoutingAssignment(scouted, listing.id), null);
  assert.equal(getClub(scouted).balance, getClub(career).balance - cost);
  const managerMoved = structuredClone(scouted);
  managerMoved.clubId = "WPR";
  assert.equal(getScoutingReport(managerMoved, listing.id)?.currentAbility, report.currentAbility);
  const colleagueAtOldClub = structuredClone(scouted);
  colleagueAtOldClub.id = "another-manager-career";
  assert.equal(getScoutingReport(colleagueAtOldClub, listing.id)?.potential, report.potential);
  assert.ok(scouted.finance[0].label.includes("Scouting assessment"));
  assert.ok(scouted.news.some((item) => item.headline.includes("assessment complete") && item.body.includes("five-day")));
});

test("scouted world free agents and academy players can join a career", () => {
  const career = createCareer("Jamie Taylor", "WPR");
  const freeListing = searchWorldDatabase("", "Free agent", 0, 1).players[0];
  const freeReport = advanceCareerDays(scoutPlayer(career, freeListing.id), 5);
  const freeSigned = buyPlayer(freeReport, freeListing.id, 0);
  assert.equal(freeSigned.players.find((player) => player.id === freeListing.id)?.clubId, career.clubId);

  const academyListing = searchWorldDatabase("", "Academy", 0, 1, { minAge: 5, maxAge: 17 }).players[0];
  const youthReport = advanceCareerDays(scoutPlayer(freeSigned, academyListing.id), 5);
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
  legacy.lineup = legacy.players.filter((player) => player.clubId === legacy.clubId && player.age >= 16).sort((a, b) => b.overall - a.overall).slice(0, 11).map((player) => player.id);
  delete legacy.schemaVersion;
  delete legacy.calendarDate;
  delete legacy.managerLeave;
  delete legacy.pressure;
  legacy.players.forEach((player) => { delete player.condition; });
  delete legacy.clubs[0].stadium.standTiers;
  delete legacy.clubs[0].stadium.acquiredLand;
  delete legacy.clubs[0].badge;
  Reflect.deleteProperty(legacy.clubs[0].aiTactics!, "style");
  delete legacy.clubs[0].dna;
  delete legacy.clubs[0].projectHistory;
  delete legacy.clubs[0].boardAgenda;
  delete legacy.scoutingReports;
  delete legacy.playerLoans;
  delete legacy.awardHistory;
  delete legacy.managerCareerHistory;
  delete legacy.managerContract;
  const restored = normalizeCareer(legacy);
  assert.equal(restored.pressure, 18);
  assert.equal(restored.clubs[0].stadium.standTiers?.north, restored.clubs[0].stadium.tiers);
  assert.deepEqual(restored.clubs[0].stadium.acquiredLand, [], "legacy stadium saves start with no acquired neighboring land");
  assert.ok(restored.clubs[0].badge);
  assert.equal(restored.managerCareerHistory?.length, 1, "older saves receive a current manager appointment");
  assert.equal(restored.managerCareerHistory?.[0].endSeason, null);
  assert.equal(restored.managerContract?.clubId, restored.clubId);
  assert.deepEqual(restored.managerCareerHistory?.[0].contract, restored.managerContract, "older saves receive a contract on their current appointment");
  assert.ok(restored.clubs[0].dna);
  assert.equal(restored.clubs[0].aiTactics?.style, restored.clubs[0].dna?.tacticalIdentity, "older saves inherit the club's established tactical identity");
  assert.deepEqual(restored.clubs[0].projectHistory, []);
  assert.equal(restored.schemaVersion, 21);
  assert.equal(restored.calendarDate, "2026-07-01");
  assert.equal(restored.managerLeave, null);
  assert.deepEqual(restored.scoutingReports, []);
  assert.deepEqual(restored.playerLoans, []);
  assert.deepEqual(restored.awardHistory, []);
  assert.deepEqual(restored.clubs[0].boardAgenda, []);
  assert.ok(restored.players.every((player) => player.contractRole));
  assert.ok(restored.players.every((player) => player.condition === 100), "legacy players enter the new workload model fully fit");
  assert.deepEqual(restored.lineup.map((id) => restored.players.find((player) => player.id === id)?.position), getFormationSlots(restored.formation));
});

test("match workload, tactical pressing and recovery make fitness affect squad choices", () => {
  const career = createCareer("Morgan Lee", "WPR");
  const starters = new Set(career.lineup);
  const restPlayer = career.players.find((player) => player.clubId === career.clubId && player.age >= 16 && !starters.has(player.id))!;
  const balancedPlayer = career.players.find((player) => player.clubId === career.clubId && player.age >= 16 && !starters.has(player.id) && player.id !== restPlayer.id)!;
  assert.ok(restPlayer && balancedPlayer, "the squad has rotation options");
  restPlayer.condition = 70;
  restPlayer.trainingFocus = "Rest";
  balancedPlayer.condition = 70;
  balancedPlayer.trainingFocus = "Balanced";
  const resolved = playMatchday(career, 74021);
  const resolvedById = new Map(resolved.players.map((player) => [player.id, player]));
  assert.ok(career.lineup.some((id) => (resolvedById.get(id)?.condition ?? 100) < 100), "players lose condition after match minutes");
  assert.equal(resolvedById.get(restPlayer.id)?.condition, 94, "Rest focus gives stronger recovery to an unused player");
  assert.equal(resolvedById.get(balancedPlayer.id)?.condition, 86, "unused players regain condition between match weeks");
  assert.equal(getPlayerConditionModifier(100), 0);
  assert.ok(getPlayerConditionModifier(60) < getPlayerConditionModifier(90), "low condition has a larger performance penalty");
});

test("commercial assets have multi-year sponsor deals and seasonal kit sales", () => {
  const career = createCareer("Morgan Lee", "EMT");
  const offers = sponsorProposal(career);
  const stadiumOffer = getClub(offers).sponsorOffers!.find((offer) => offer.slot === "stadium")!;
  const signed = acceptSponsor(offers, stadiumOffer.id);
  assert.ok(getClub(signed).sponsorContracts!.some((contract) => contract.slot === "stadium" && contract.yearsRemaining === stadiumOffer.years));
  const endOfSeason = { ...signed, round: getSeasonWeekCount() + 1 };
  assert.equal(launchKitCollection(endOfSeason), endOfSeason, "the club cannot release designs before board approval");
  const approved = { ...endOfSeason, kitDesignReady: true };
  const launched = launchKitCollection(approved);
  assert.equal(launched.kitCollectionSeason, 1);
  assert.ok(getClub(launched).balance > getClub(approved).balance);
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

test("the editor override lowers a club's hidden sacking point and the board uses it", () => {
  const career = createCareer("Morgan Lee", "WPR");
  const club = getClub(career);
  const generatedPoint = getClubSackingPoint(club);
  club.managerSackingPoint = 35;
  career.pressure = 34;
  assert.equal(getClubSackingPoint(club), 35);
  assert.ok(generatedPoint >= 66);
  let dismissed: ReturnType<typeof createCareer> | undefined;
  for (let seed = 1; seed <= 100 && !dismissed; seed += 1) {
    const resolved = playMatchday(career, seed);
    if (resolved.unemployed) dismissed = resolved;
  }
  assert.ok(dismissed, "a poor result at the configured short-fuse club should cross its board threshold");
});

test("clubs have saved leadership groups and distinct personality/relationship data", () => {
  const career = createCareer("Morgan Lee", "WPR");
  assert.ok(career.playerRelationships && career.playerRelationships.length > 300);
  assert.ok(career.playerRelationships.some((link) => link.type === "Mentor"));
  assert.ok(career.playerRelationships.some((link) => link.type === "Friend"));
  assert.ok(career.playerRelationships.some((link) => link.type === "Rival"));
  assert.ok(career.players.every((player) => player.personality && player.leadership !== undefined && player.leadership >= 18 && player.leadership <= 98));
  for (const club of career.clubs) {
    assert.ok(career.players.some((player) => player.id === club.captainId && player.clubId === club.id));
    assert.ok(career.players.some((player) => player.id === club.viceCaptainId && player.clubId === club.id));
    assert.notEqual(club.captainId, club.viceCaptainId);
  }
});

test("captain and vice-captain appointments update the saved hierarchy", () => {
  const career = createCareer("Morgan Lee", "WPR");
  const initial = getLeadershipDynamics(career);
  const nextCaptain = getUserPlayers(career).find((player) => player.id !== initial.captain?.id && player.id !== initial.viceCaptain?.id)!;
  const appointed = appointClubCaptain(career, nextCaptain.id);
  assert.equal(getClub(appointed).captainId, nextCaptain.id);
  assert.equal(getClub(appointed).viceCaptainId, initial.captain?.id);
  assert.ok(appointed.news[0].headline.includes("captain"));
  const nextVice = getUserPlayers(appointed).find((player) => player.id !== nextCaptain.id && player.id !== getClub(appointed).viceCaptainId)!;
  const viceAppointed = appointViceCaptain(appointed, nextVice.id);
  assert.equal(getClub(viceAppointed).viceCaptainId, nextVice.id);
  const underAgePlayer = career.players.find((player) => player.clubId === career.clubId && player.age < 16)!;
  assert.equal(appointClubCaptain(career, underAgePlayer.id), career);
});

test("dressing-room tension lowers match cohesion and adds to board pressure", () => {
  const career = createCareer("Morgan Lee", "WPR");
  const baseline = getLeadershipDynamics(career);
  const tense = structuredClone(career);
  getClub(tense).dressingRoomTension = 90;
  const strained = getLeadershipDynamics(tense);
  assert.ok(strained.matchImpact < baseline.matchImpact);
  assert.ok(getBoardPressureSignals(tense).dressingRoom > getBoardPressureSignals(career).dressingRoom);
});

test("AI match results also move club dressing-room tension", () => {
  const career = createCareer("Morgan Lee", "WPR");
  const played = playMatchday(career, 771);
  const aiDefeat = played.fixtures.find((fixture) => fixture.round === career.round && fixture.played && fixture.homeClubId !== career.clubId && fixture.awayClubId !== career.clubId && fixture.homeGoals !== fixture.awayGoals);
  assert.ok(aiDefeat);
  const loserId = aiDefeat.homeGoals! < aiDefeat.awayGoals! ? aiDefeat.homeClubId : aiDefeat.awayClubId;
  assert.ok((getClub(played, loserId).dressingRoomTension ?? 0) > (getClub(career, loserId).dressingRoomTension ?? 0));
});

test("leadership hierarchy and player relationships survive career save serialization", () => {
  const career = createCareer("Morgan Lee", "WPR");
  const captain = getClub(career).captainId;
  const links = career.playerRelationships;
  const restored = normalizeCareer(JSON.parse(JSON.stringify(career)) as typeof career);
  assert.equal(getClub(restored).captainId, captain);
  assert.deepEqual(restored.playerRelationships, links);
});

test("save migration repairs missing or departed dressing-room leaders", () => {
  const career = createCareer("Morgan Lee", "WPR");
  const legacy = structuredClone(career);
  const club = getClub(legacy);
  const oldCaptain = club.captainId;
  legacy.players = legacy.players.filter((player) => player.id !== oldCaptain);
  delete club.viceCaptainId;
  delete club.dressingRoomTension;
  delete legacy.playerRelationships;
  for (const player of legacy.players) {
    delete player.personality;
    delete player.leadership;
  }
  const migrated = normalizeCareer(legacy);
  const restoredClub = getClub(migrated);
  assert.ok(restoredClub.captainId && restoredClub.captainId !== oldCaptain);
  assert.ok(restoredClub.viceCaptainId && restoredClub.viceCaptainId !== restoredClub.captainId);
  assert.ok((restoredClub.dressingRoomTension ?? 0) >= 20);
  assert.ok(migrated.playerRelationships && migrated.playerRelationships.length > 300);
  assert.ok(migrated.players.every((player) => player.personality && player.leadership !== undefined));
});

test("manager promises have clear audiences, limits and duplicate protection", () => {
  const career = createCareer("Morgan Lee", "WPR");
  const boardPromise = makeManagerPromise(career, "League target");
  assert.equal(boardPromise.managerPromises?.[0].audience, "Board");
  assert.equal(boardPromise.managerPromises?.[0].target, getClub(career).targetPosition);
  assert.equal(makeManagerPromise(boardPromise, "League target"), boardPromise);
  const regularStarts = makeManagerPromise(boardPromise, "Regular starts", career.lineup[0]);
  assert.equal(regularStarts.managerPromises?.[0].audience, "Player");
  const winRun = makeManagerPromise(regularStarts, "Winning run");
  assert.equal(winRun.managerPromises?.filter((promise) => promise.status === "Active").length, 3);
  assert.equal(makeManagerPromise(winRun, "Winning run"), winRun);
});

test("regular-start and winning-run promises track match results", () => {
  const career = createCareer("Morgan Lee", "WPR");
  const playerId = career.lineup[0];
  const pledged = makeManagerPromise(makeManagerPromise(career, "Regular starts", playerId), "Winning run");
  const played = playMatchday(pledged, 4721);
  const regularStarts = played.managerPromises?.find((promise) => promise.kind === "Regular starts")!;
  const winRun = played.managerPromises?.find((promise) => promise.kind === "Winning run")!;
  assert.equal(regularStarts.progress, 1);
  assert.equal(regularStarts.status, "Active");
  const result = played.lastReport!.result.split("–").map(Number);
  assert.equal(winRun.progress, result[0] > result[1] ? 1 : 0);
});

test("a promise to meet the board target is resolved at season review", () => {
  const career = createCareer("Morgan Lee", "WPR");
  const club = getClub(career);
  club.targetPosition = 1;
  const promised = makeManagerPromise(career, "League target");
  for (const fixture of promised.fixtures.filter((item) => item.leagueId === club.leagueId)) {
    fixture.played = true;
    fixture.homeGoals = fixture.homeClubId === club.id ? 3 : 0;
    fixture.awayGoals = fixture.awayClubId === club.id ? 3 : 0;
  }
  promised.round = getSeasonWeekCount() + 1;
  const reviewed = beginNextSeason(promised);
  assert.equal(reviewed.managerPromises?.[0].status, "Kept");
  assert.ok(reviewed.news.some((item) => item.headline.includes("keeps a promise")));
});

test("missing a board promise has a real trust and pressure cost", () => {
  const career = createCareer("Morgan Lee", "WPR");
  const club = getClub(career);
  club.targetPosition = 1;
  career.pressure = 30;
  const boardTrust = club.boardTrust;
  const promised = makeManagerPromise(career, "League target");
  for (const fixture of promised.fixtures.filter((item) => item.leagueId === club.leagueId)) {
    fixture.played = true;
    fixture.homeGoals = fixture.awayClubId === club.id ? 3 : 0;
    fixture.awayGoals = fixture.homeClubId === club.id ? 3 : 0;
  }
  promised.round = getSeasonWeekCount() + 1;
  const reviewed = beginNextSeason(promised);
  assert.equal(reviewed.managerPromises?.[0].status, "Broken");
  assert.ok(getClub(reviewed).boardTrust < boardTrust);
  assert.ok((reviewed.pressure ?? 0) > 30);
  assert.ok(reviewed.news.some((item) => item.headline.includes("falls short")));
});

test("manager holidays are approved by the board, saved to the career and return on the requested day", () => {
  const career = createCareer("Morgan Lee", "WPR");
  assert.equal(career.calendarDate, "2026-07-01");
  const leave = requestManagerLeave(career, 7);
  assert.equal(leave.approved, true);
  assert.equal(leave.career.managerLeave?.status, "active");
  assert.equal(leave.career.managerLeave?.startDate, "2026-07-02");
  assert.equal(leave.career.managerLeave?.endDate, "2026-07-08");
  const returnEvent = advanceToNextCalendarEvent(leave.career, 45);
  assert.equal(returnEvent.event, "holiday-return");
  assert.equal(returnEvent.career.round, career.round, "the calendar can reach the return date without simulating a match");
  assert.equal(returnEvent.career.calendarDate, "2026-07-08");
  assert.equal(returnEvent.career.managerLeave?.status, "completed");
  const returnedEarly = endManagerLeaveEarly(leave.career);
  assert.equal(returnedEarly.managerLeave?.status, "completed");

  const refusingCareer = createCareer("Morgan Lee", "WPR");
  getClub(refusingCareer).boardTrust = 10;
  const refused = requestManagerLeave(refusingCareer, 14);
  assert.equal(refused.approved, false);
  assert.match(refused.message, /confidence/i);
  assert.ok(refused.career.news[0].headline.includes("declines"));
});

test("calendar advances one date at a time and pauses for tactics on matchday", () => {
  const career = createCareer("Jamie Taylor", "WPR");
  const fixture = career.fixtures.find((item) => item.round === career.round && (item.homeClubId === career.clubId || item.awayClubId === career.clubId))!;
  const round = career.round;
  let current = career;
  let result = advanceCareerCalendarDay(current);
  while (result.event !== "matchday") {
    assert.equal(result.event, "day");
    assert.equal(result.advancedDays, 1);
    current = result.career;
    result = advanceCareerCalendarDay(current);
  }
  assert.equal(result.career.calendarDate, fixture.date);
  assert.equal(result.career.round, round);
  assert.equal(result.career.fixtures.find((item) => item.id === fixture.id)?.played, false, "reaching matchday does not silently simulate the user's result");
  const ready = advanceCareerCalendarDay(result.career);
  assert.equal(ready.event, "matchday");
  assert.equal(ready.advancedDays, 0);
  assert.equal(ready.career.round, round);
});

test("pre-match team-talk impact responds to player rapport", () => {
  const career = createCareer("Jamie Taylor", "WPR");
  const lowRapport = structuredClone(career);
  const highRapport = structuredClone(career);
  for (const player of lowRapport.players.filter((item) => lowRapport.lineup.includes(item.id))) player.managerRapport = 35;
  for (const player of highRapport.players.filter((item) => highRapport.lineup.includes(item.id))) player.managerRapport = 88;
  assert.ok(getTeamTalkPerformanceAdjustment(lowRapport, "Demanding") < 0);
  assert.ok(getTeamTalkPerformanceAdjustment(highRapport, "Demanding") > 0);
  assert.ok(getTeamTalkPerformanceAdjustment(lowRapport, "Encouraging") > getTeamTalkPerformanceAdjustment(highRapport, "Encouraging"));
});

test("urgent matchday news interrupts approved leave and stops further calendar progression", () => {
  const career = createCareer("Morgan Lee", "WPR");
  const fixture = career.fixtures.find((item) => item.round === career.round && (item.homeClubId === career.clubId || item.awayClubId === career.clubId))!;
  career.calendarDate = addCalendarDays(fixture.date, -7);
  career.pressure = 100;
  career.managerLeave = {
    startDate: fixture.date,
    endDate: addCalendarDays(fixture.date, 7),
    days: 7,
    status: "active",
    message: "Approved leave",
  };
  const progression = advanceToNextCalendarEvent(career, 4721);
  assert.equal(progression.event, "matchday");
  assert.equal(progression.career.calendarDate, fixture.date);
  assert.ok(progression.urgentNews.some((item) => item.urgent && item.headline.includes("leaves")));
  assert.equal(progression.career.managerLeave?.status, "interrupted");
  assert.equal(progression.career.unemployed, true);
});

test("manager career records season finishes, dismissal and a clean new appointment", () => {
  const career = createCareer("Casey Rowan", "WPR");
  const firstClub = getClub(career);
  firstClub.managerSackingPoint = 35;
  career.pressure = 34;
  assert.equal(career.managerCareerHistory?.length, 1);
  let dismissed: ReturnType<typeof createCareer> | undefined;
  for (let seed = 1; seed <= 100 && !dismissed; seed += 1) {
    const resolved = playMatchday(career, seed);
    if (resolved.unemployed) dismissed = resolved;
  }
  assert.ok(dismissed, "the poor result reaches the club's private board threshold");
  const previousAppointment = dismissed.managerCareerHistory?.find((appointment) => appointment.clubId === firstClub.id);
  assert.equal(previousAppointment?.endReason, "Dismissed");
  assert.equal(previousAppointment?.endSeason, dismissed.season);
  assert.equal(previousAppointment?.matches, 1);
  assert.equal(playMatchday(dismissed, 901), dismissed, "a dismissed manager cannot keep simulating the old club");
  assert.equal(advanceCareerCalendarDay(dismissed).event, "unavailable");

  const nextClub = dismissed.clubs.find((club) => club.id !== dismissed!.clubId)!;
  const appointed = applyForJob(dismissed, nextClub.id);
  assert.equal(appointed.clubId, nextClub.id);
  assert.equal(appointed.unemployed, false);
  assert.equal(appointed.managerCareerHistory?.length, 2);
  assert.equal(appointed.managerCareerHistory?.at(-1)?.endSeason, null);
  assert.equal(appointed.managerCareerHistory?.at(-1)?.clubId, nextClub.id);
  assert.equal(appointed.winlessRun, 0);
  const expectedNewClubPressure = Math.max(8, Math.min(40, 20 + (nextClub.reputation - appointed.managerReputation) * 0.25 + (62 - nextClub.boardTrust) * 0.18));
  assert.equal(appointed.pressure, expectedNewClubPressure, "the new board sets a fresh pressure level");
  assert.ok(appointed.lineup.every((playerId) => appointed.players.find((player) => player.id === playerId)?.clubId === nextClub.id));
  assert.ok(appointed.players.filter((player) => player.clubId === nextClub.id && player.age >= 16).every((player) => player.managerRapport !== 0));
});

test("manager career season cards save the table finish and promotion outcome", () => {
  const career = createCareer("Jordan Ellis", "WPR");
  const club = getClub(career);
  const league = getCurrentLeague(career);
  for (const fixture of career.fixtures.filter((item) => item.leagueId === club.leagueId)) {
    fixture.played = true;
    fixture.homeGoals = fixture.homeClubId === club.id ? 2 : fixture.awayClubId === club.id ? 0 : 1;
    fixture.awayGoals = fixture.awayClubId === club.id ? 2 : fixture.homeClubId === club.id ? 0 : 1;
  }
  career.round = getSeasonWeekCount(career) + 1;
  const expected = getTable(career, club.leagueId).find((row) => row.clubId === club.id)!;
  const expectedPosition = getTable(career, club.leagueId).findIndex((row) => row.clubId === club.id) + 1;
  const reviewed = beginNextSeason(career);
  const appointment = reviewed.managerCareerHistory?.find((item) => item.clubId === career.clubId);
  const season = appointment?.seasons.find((item) => item.season === 1);
  assert.equal(reviewed.season, 2);
  assert.equal(reviewed.history[0]?.clubId, club.id, "season history keeps the stable club identity across future job moves");
  assert.equal(reviewed.history[0]?.leagueId, league.id);
  assert.equal(reviewed.history[0]?.leagueName, league.name);
  assert.equal(reviewed.history[0]?.draws, expected.draws);
  assert.equal(reviewed.history[0]?.losses, expected.losses);
  assert.equal(reviewed.history[0]?.goalsFor, expected.goalsFor);
  assert.equal(reviewed.history[0]?.goalsAgainst, expected.goalsAgainst);
  assert.equal(season?.recordTracked, true);
  assert.equal(season?.position, expectedPosition);
  assert.equal(season?.points, expected.points);
  assert.equal(season?.wins, expected.wins);
  assert.equal(season?.draws, expected.draws);
  assert.equal(season?.losses, expected.losses);
  assert.equal(season?.champion, expectedPosition === 1);
  assert.equal(season?.promoted, getClub(reviewed).leagueId !== club.leagueId && getCurrentLeague(reviewed).tier < getCurrentLeague(career).tier);
});

test("club archive aggregates permanent player records and keeps seasons, honours and transfers club-specific", () => {
  const career = createCareer("Jordan Ellis", "WPR");
  const club = getClub(career);
  const otherClub = career.clubs.find((item) => item.id !== club.id)!;
  const player = career.players.find((item) => item.clubId === club.id)!;
  player.clubHistory = [
    { clubId: club.id, clubName: club.name, country: club.country, fromSeason: 1, toSeason: 1, squadLevel: "First team", appearances: 10, goals: 3, assists: 1, cleanSheets: 2 },
    { clubId: club.id, clubName: club.name, country: club.country, fromSeason: 3, toSeason: null, squadLevel: "First team", appearances: 20, goals: 9, assists: 4, cleanSheets: 5 },
    { clubId: otherClub.id, clubName: otherClub.name, country: otherClub.country, fromSeason: 2, toSeason: 2, squadLevel: "First team", appearances: 80, goals: 40, assists: 20, cleanSheets: 0 },
  ];
  const league = getCurrentLeague(career);
  career.history = [
    { season: 3, club: club.name, clubId: club.id, leagueId: league.id, leagueName: league.name, position: 1, points: 81, wins: 25, draws: 6, losses: 7, goalsFor: 74, goalsAgainst: 31 },
    { season: 2, club: otherClub.name, clubId: otherClub.id, leagueId: league.id, leagueName: league.name, position: 4, points: 68, wins: 19, draws: 11, losses: 8, goalsFor: 61, goalsAgainst: 40 },
    { season: 1, club: club.name, position: 6, points: 58, wins: 15 },
  ];
  const signing = { id: "archive-signing", season: 3, playerId: player.id, playerName: player.name, fromClubId: otherClub.id, fromClubName: otherClub.name, toClubId: club.id, toClubName: club.name, fee: 4_500_000, date: "01 Jul" };
  const sale = { id: "archive-sale", season: 4, playerId: player.id, playerName: player.name, fromClubId: club.id, fromClubName: club.name, toClubId: otherClub.id, toClubName: otherClub.name, fee: 7_250_000, date: "15 Aug" };
  career.transferHistory = [signing, sale, { ...sale, id: "unrelated", fromClubId: otherClub.id, toClubId: otherClub.id }];
  career.awardHistory = [{ id: "archive-award", season: 3, award: "Player of the Season", leagueId: league.id, leagueName: league.name, playerId: player.id, playerName: player.name, clubId: club.id, clubName: club.name, appearances: 30, goals: 12, assists: 5, cleanSheets: 5, performanceScore: 89 }];

  const archive = getClubArchive(career);
  assert.equal(archive.trackedAppearances, 30);
  assert.equal(archive.trackedGoals, 12);
  assert.equal(archive.appearanceLeaders[0]?.playerId, player.id);
  assert.equal(archive.goalLeaders[0]?.goals, 12);
  assert.equal(archive.leagueTitlesLogged, 1);
  assert.deepEqual(archive.seasons.map((record) => record.season), [3, 1], "new records use club IDs, with a name fallback for older saves");
  assert.equal(archive.seasons[0]?.leagueName, league.name);
  assert.equal(archive.seasons[0]?.goalsAgainst, 31);
  assert.deepEqual(archive.transfers.map((record) => record.id).sort(), ["archive-sale", "archive-signing"]);
  assert.equal(archive.recordSigning?.fee, 4_500_000);
  assert.equal(archive.recordSale?.fee, 7_250_000);
  assert.equal(archive.honours[0]?.playerId, player.id);
});

test("the board renews an expiring manager contract after the target is met and trust remains high", () => {
  const career = createCareer("Avery Cole", "WPR");
  const club = getClub(career);
  club.targetPosition = career.clubs.filter((item) => item.leagueId === club.leagueId).length;
  club.boardTrust = 96;
  career.pressure = 10;
  const originalContract = career.managerContract!;
  originalContract.endSeason = career.season;
  originalContract.targetPosition = club.targetPosition;
  const originalWage = originalContract.weeklyWage;
  for (const fixture of career.fixtures.filter((item) => item.leagueId === club.leagueId)) {
    fixture.played = true;
    fixture.homeGoals = 0;
    fixture.awayGoals = 0;
  }
  career.round = getSeasonWeekCount(career) + 1;

  const reviewed = beginNextSeason(career);
  const contract = reviewed.managerContract!;
  const appointment = reviewed.managerCareerHistory?.find((item) => item.clubId === club.id)!;
  assert.equal(reviewed.unemployed, false);
  assert.equal(contract.startSeason, reviewed.season);
  assert.equal(contract.endSeason, reviewed.season + 1, "a renewal adds a two-season contract");
  assert.equal(contract.weeklyWage, Math.max(originalWage + 250, Math.round(originalWage * 1.08 / 250) * 250));
  assert.equal(contract.targetPosition, club.targetPosition);
  assert.deepEqual(appointment.contract, contract);
  assert.ok(reviewed.news.some((item) => item.headline.includes("renew") && item.body.includes("Weekly pay rises")));
});

test("a failed contract review ends the appointment and returns the manager to the job market", () => {
  const career = createCareer("Avery Cole", "WPR");
  const club = getClub(career);
  club.targetPosition = 1;
  club.boardTrust = 20;
  career.pressure = 100;
  career.managerContract!.targetPosition = 1;
  career.managerContract!.endSeason = career.season;
  for (const fixture of career.fixtures.filter((item) => item.leagueId === club.leagueId)) {
    fixture.played = true;
    if (fixture.homeClubId === club.id) {
      fixture.homeGoals = 0;
      fixture.awayGoals = 3;
    } else if (fixture.awayClubId === club.id) {
      fixture.homeGoals = 3;
      fixture.awayGoals = 0;
    } else {
      fixture.homeGoals = 1;
      fixture.awayGoals = 1;
    }
  }
  career.round = getSeasonWeekCount(career) + 1;

  const reviewed = beginNextSeason(career);
  const appointment = reviewed.managerCareerHistory?.find((item) => item.clubId === club.id)!;
  assert.equal(reviewed.season, 2, "the season closes before the board's contract decision takes effect");
  assert.equal(reviewed.unemployed, true);
  assert.equal(reviewed.managerContract, null);
  assert.equal(appointment.endSeason, 1, "the appointment records the season whose review ended the deal");
  assert.equal(appointment.endReason, "Contract Expired");
  assert.ok(reviewed.news.some((item) => item.urgent && item.headline.includes("do not renew")));
  assert.equal(advanceCareerCalendarDay(reviewed).event, "unavailable");

  const nextClub = reviewed.clubs.find((item) => item.id !== club.id)!;
  const appointed = applyForJob(reviewed, nextClub.id);
  assert.equal(appointed.unemployed, false);
  assert.equal(appointed.managerContract?.clubId, nextClub.id);
  assert.equal(appointed.managerCareerHistory?.at(-1)?.clubId, nextClub.id);
});
