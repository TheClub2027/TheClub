"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { BriefcaseBusiness, Check, Crown, Search, Shield, Users } from "lucide-react";
import { CLUB_PROJECT_BLUEPRINTS, formatMoney, getClub, getClubProjectProgress, getClubResponsibilities, getCurrentBoardAgenda, hireStaff, proposeClubProject, releaseStaff, resolveBoardAgenda, setClubResponsibility } from "@/lib/game";
import type { Career } from "@/lib/game";
import type { BoardAgendaChoiceId, ClubProjectKind, ResponsibilityArea } from "@/lib/game";
import { countWorldStaff, searchWorldStaff, STAFF_ROLES } from "@/lib/world-staff-database";
import type { StaffRole } from "@/lib/world-staff-database";

type Props = { career: Career; setCareer: (career: Career) => void };

export default function StaffManagement({ career, setCareer }: Props) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<StaffRole | "All roles">("All roles");
  const [status, setStatus] = useState<"Available" | "At a club" | "All">("Available");
  const [page, setPage] = useState(0);
  const [projectDuration, setProjectDuration] = useState<3 | 4 | 5>(5);
  const [notice, setNotice] = useState("");
  const deferredQuery = useDeferredValue(query);
  const club = getClub(career);
  const overrides = career.staffChanges ?? {};
  const worldCounts = useMemo(() => countWorldStaff(overrides), [overrides]);
  const results = useMemo(() => searchWorldStaff(deferredQuery, role, status, page * 12, 12, overrides), [deferredQuery, role, status, page, overrides]);
  const clubStaff = club.staff ?? [];
  const board = club.board ?? [];
  const responsibilities = getClubResponsibilities(career);
  const boardAgenda = getCurrentBoardAgenda(career);
  const appointed = (staffId: string) => {
    const next = hireStaff(career, staffId);
    if (next === career) setNotice("The appointment needs more available funds or the person is already employed.");
    else { setCareer(next); setNotice("Appointment confirmed. The club’s staffing record has been updated."); }
  };
  const release = (staffId: string, name: string) => {
    setCareer(releaseStaff(career, staffId));
    setNotice(name + " has left the club. The severance payment is in the finance ledger.");
  };
  const delegate = (area: ResponsibilityArea, staffId: string) => {
    const next = setClubResponsibility(career, area, staffId || null);
    if (next === career) return;
    setCareer(next);
    const assignment = responsibilities.find((item) => item.id === area);
    const person = assignment?.options.find((item) => item.id === staffId);
    setNotice(person ? `${person.name} now leads ${assignment?.title.toLowerCase()}.` : `You will handle ${assignment?.title.toLowerCase()} directly.`);
  };
  const presentProject = (kind: ClubProjectKind) => {
    const next = proposeClubProject(career, kind, projectDuration);
    if (next === career) { setNotice("The club already has an active project, or that objective is at its limit."); return; }
    setCareer(next);
    setNotice(getClub(next).project?.status === "Active" ? "The board approved the project. Its milestones will be reviewed at each season end." : "The board voted against the project. Its decision has been recorded.");
  };
  const decideAgenda = (agendaId: string, choiceId: BoardAgendaChoiceId) => {
    const next = resolveBoardAgenda(career, agendaId, choiceId);
    if (next === career) { setNotice("That decision could not be applied. Check the club balance and try again."); return; }
    setCareer(next);
    setNotice("Board decision recorded. Club finances, confidence and the manager file have been updated.");
  };
  const project = club.project;
  const projectMetric = project?.kind === "league" ? `${project.current} / ${project.target} finishes`
    : project?.kind === "academy" ? `Level ${project.current} / ${project.target}`
      : project?.kind === "stadium" ? `${project.current.toLocaleString("en-GB")} / ${project.target.toLocaleString("en-GB")} seats`
        : project ? `${formatMoney(project.current, true)} / ${formatMoney(project.target, true)}` : "";
  const list = (people: typeof clubStaff, isBoard = false) => <div className="people-card-grid">{people.map((person) => <article className="people-person-card" key={person.id}>
    <div className="people-person-avatar">{isBoard ? <Crown size={17} /> : <BriefcaseBusiness size={17} />}</div>
    <div className="people-person-main"><div><strong>{person.name}</strong><span>{person.role}</span></div><small>{person.nationality} · {person.experience} yrs experience · {person.focus}</small></div>
    <div className="people-person-rating"><strong>{person.ability}</strong><span>ABILITY</span></div>
    <div className="people-person-wage"><strong>{formatMoney(person.wage, true)}</strong><span>PER WEEK</span></div>
    <button className="button button-secondary button-small" onClick={() => release(person.id, person.name)} aria-label={"Release " + person.name}>Release</button>
  </article>)}{!people.length && <p className="people-empty">No appointments in this group.</p>}</div>;
  return <>
    <div className="section-heading"><div><p className="eyebrow">PEOPLE & FOOTBALL OPERATIONS</p><h1>Staff & board</h1><p className="muted section-detail">Recruit football expertise and shape the leadership around {club.name}.</p></div><span className="people-club-tag"><Shield size={15} /> {club.name}</span></div>
    <div className="people-metrics"><article><Users size={17} /><span><strong>{worldCounts.total.toLocaleString("en-GB")}</strong><small>FICTIONAL STAFF DATABASE</small></span></article><article><BriefcaseBusiness size={17} /><span><strong>{worldCounts.atClub.toLocaleString("en-GB")}</strong><small>EMPLOYED WORLDWIDE</small></span></article><article><Search size={17} /><span><strong>{worldCounts.available.toLocaleString("en-GB")}</strong><small>AVAILABLE TO APPROACH</small></span></article><article><Crown size={17} /><span><strong>{club.boardTrust}%</strong><small>BOARD TRUST</small></span></article></div>
    {notice && <div className="inline-notice"><Check size={15} />{notice}<button onClick={() => setNotice("")}>Dismiss</button></div>}
    <section className="panel people-panel responsibilities-panel"><div className="people-section-heading"><div><p className="eyebrow">DELEGATION & AUTHORITY</p><h2>Club responsibilities</h2></div><span>Staff ability improves their area · extra duties reduce focus</span></div><p className="responsibilities-intro">Choose who leads each operation. Their experience feeds directly into match preparation, player development, scouting, sponsor negotiations and supporter confidence.</p><div className="responsibility-grid">{responsibilities.map((item) => <article className="responsibility-card" key={item.id}>
      <div className="responsibility-card-heading"><span className="responsibility-mark"><BriefcaseBusiness size={15} /></span><div><h3>{item.title}</h3><p>{item.brief}</p></div><span className="responsibility-rating" aria-label={`Effective ability ${item.effectiveAbility} out of 100`}>{item.effectiveAbility}<small> / 100</small></span></div>
      <label className="responsibility-assignee">LEAD<select value={item.assigned?.id ?? ""} onChange={(event) => delegate(item.id, event.target.value)} aria-label={`Assign ${item.title}`}><option value="">Manager handles this area</option>{item.options.map((person) => <option key={person.id} value={person.id}>{person.name} · {person.role} · {person.ability}</option>)}</select></label>
      <div className="responsibility-outcome"><span>CLUB EFFECT</span><strong>{item.effect}</strong></div>
      {item.assigned && <p className="responsibility-assignee-note">{item.assigned.name} · {item.assigned.role} · {item.assigned.experience} years in football</p>}
    </article>)}</div></section>
    <section className="panel people-panel project-planner"><div className="people-section-heading"><div><p className="eyebrow">BOARDROOM · LONG-TERM DIRECTION</p><h2>Club project planner</h2></div><span>Board-voted milestones · 3 to 5 seasons</span></div><p className="project-planner-intro">Set one measurable priority for the club. Directors vote according to their role, ability and confidence in your leadership; the board reviews progress every season.</p>
      {project && <article className={`club-project-card club-project-${project.status.toLowerCase()}`}>
        <div className="club-project-heading"><div><span className={`club-project-status status-${project.status.toLowerCase()}`}>{project.status}</span><h3>{project.title}</h3></div><strong>{project.status === "Active" ? `${project.seasonsRemaining} season${project.seasonsRemaining === 1 ? "" : "s"} left` : `${project.seasonsReviewed} seasons reviewed`}</strong></div>
        <p>{project.brief}</p><div className="club-project-meter" role="progressbar" aria-label={`${project.title} progress`} aria-valuenow={getClubProjectProgress(project)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${getClubProjectProgress(project)}%` }} /></div>
        <div className="club-project-metric"><span>{project.metricLabel}</span><strong>{projectMetric}</strong><small>{getClubProjectProgress(project)}% of target · seasons {project.startSeason}–{project.startSeason + project.duration - 1}</small></div>
        <div className="club-project-votes"><span>BOARD VOTE</span>{project.votes.map((vote) => <div key={vote.memberId} className={`club-project-vote vote-${vote.vote.toLowerCase()}`}><strong>{vote.name}</strong><small>{vote.role} · {vote.score} support</small><b>{vote.vote}</b></div>)}{!project.votes.length && <small>No board members were available to vote.</small>}</div>
      </article>}
      {!!club.projectHistory?.length && <div className="club-project-history"><span>RECENT PLANS</span>{club.projectHistory.slice(0, 3).map((item) => <div key={item.id}><strong>{item.title}</strong><small>{item.status} · {item.seasonsReviewed} seasons reviewed</small></div>)}</div>}
      <div className="project-planner-options-head"><div><h3>{project?.status === "Active" ? "Current board plan" : "Choose the next club priority"}</h3><span>{project?.status === "Active" ? "An active plan must be reviewed before another is proposed." : "Plans use results and upgrades you make elsewhere in the game."}</span></div><label>HORIZON<select value={projectDuration} disabled={project?.status === "Active"} onChange={(event) => setProjectDuration(Number(event.target.value) as 3 | 4 | 5)} aria-label="Club project duration"><option value={3}>3 seasons</option><option value={4}>4 seasons</option><option value={5}>5 seasons</option></select></label></div>
      <div className="club-project-options">{CLUB_PROJECT_BLUEPRINTS.map((blueprint) => <article className="club-project-option" key={blueprint.id}><div><span className="project-option-kind">{blueprint.id.toUpperCase()}</span><h4>{blueprint.title}</h4><p>{blueprint.brief}</p></div><button type="button" className="button button-secondary button-small" disabled={project?.status === "Active" || (blueprint.id === "academy" && club.academyLevel >= 20)} onClick={() => presentProject(blueprint.id)}>{blueprint.id === "academy" && club.academyLevel >= 20 ? "Academy at level 20" : project?.status === "Active" ? "Plan in progress" : "Present to board"}</button></article>)}</div>
    </section>
    <section className="panel people-panel board-agenda-panel"><div className="people-section-heading"><div><p className="eyebrow">LIVE CLUB GOVERNANCE</p><h2>Board agenda</h2></div><span>Decisions are saved to this club's history</span></div><p className="project-planner-intro">Meetings are called when club conditions need a response. Directors record their preference, and your choice changes the club's position.</p>
      {boardAgenda.map((agenda) => <article className={`board-agenda-card board-agenda-${agenda.status.toLowerCase()}`} key={agenda.id}>
        <div className="board-agenda-head"><div><span className={`club-project-status status-${agenda.status === "Open" ? "active" : "completed"}`}>{agenda.status}</span><h3>{agenda.title}</h3></div><small>SEASON {agenda.season} · ROUND {agenda.round}</small></div>
        <p className="board-agenda-reason">{agenda.reason}</p><div className="board-agenda-sponsor"><Crown size={14} /><span>Raised by <strong>{agenda.sponsorName}</strong> · {agenda.sponsorRole}</span></div>
        {agenda.status === "Open" ? <div className="board-agenda-choices">{agenda.choices.map((choice) => { const forVotes = choice.votes.filter((vote) => vote.vote === "For").length; const againstVotes = choice.votes.length - forVotes; const requiresCash = (["community-day", "academy-expansion", "coach-investment"] as BoardAgendaChoiceId[]).includes(choice.id); const unaffordable = requiresCash && choice.cost > club.balance; return <article className="board-agenda-choice" key={choice.id}><div><h4>{choice.label}</h4><p>{choice.detail}</p><small>DIRECTOR VOTE · {forVotes} FOR / {againstVotes} AGAINST</small><div className="board-agenda-vote-list">{choice.votes.map((vote) => <span className={vote.vote === "For" ? "agenda-vote-for" : "agenda-vote-against"} key={vote.memberId}>{vote.name.split(" ").at(-1)} · {vote.vote}</span>)}</div></div><button type="button" className="button button-secondary button-small" disabled={unaffordable} onClick={() => decideAgenda(agenda.id, choice.id)}>{unaffordable ? "Insufficient funds" : "Choose response"}</button></article>; })}</div> : <div className="board-agenda-resolution"><Check size={15} /><span><strong>{agenda.choices.find((choice) => choice.id === agenda.selectedChoice)?.label}</strong> — {agenda.resolution}</span></div>}
      </article>)}
      {!boardAgenda.length && <div className="board-agenda-empty"><Crown size={20} /><div><strong>No board meeting is called</strong><span>Results, finances, player confidence and supporter sentiment are currently within the board's working range.</span></div></div>}
    </section>
    <section className="panel people-panel"><div className="people-section-heading"><div><p className="eyebrow">CLUB LEADERSHIP</p><h2>Board members</h2></div><span>{board.length} appointments · changes affect club governance</span></div>{list(board, true)}</section>
    <section className="panel people-panel"><div className="people-section-heading"><div><p className="eyebrow">FIRST TEAM & RECRUITMENT</p><h2>Football staff</h2></div><span>{clubStaff.length} appointments · weekly wages are recorded</span></div>{list(clubStaff)}</section>
    <section className="panel people-panel people-database"><div className="people-section-heading"><div><p className="eyebrow">WORLD STAFF DIRECTORY</p><h2>Find your next appointment</h2></div><span>{results.total.toLocaleString("en-GB")} matches</span></div>
      <div className="people-filters"><label className="people-search"><Search size={15} /><input aria-label="Search staff database" placeholder="Name, specialty, nationality or region" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} /></label><label>ROLE<select value={role} onChange={(event) => { setRole(event.target.value as StaffRole | "All roles"); setPage(0); }}><option>All roles</option>{STAFF_ROLES.map((entry) => <option key={entry}>{entry}</option>)}</select></label><label>EMPLOYMENT<select value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setPage(0); }}><option>Available</option><option>At a club</option><option>All</option></select></label></div>
      <div className="staff-directory-list">{results.people.map((person) => { const atThisClub = person.clubId === club.id; const available = person.clubId === null; return <article className="staff-directory-row" key={person.id}><div className="people-person-avatar">{person.role.includes("Director") || person.role === "Chairperson" ? <Crown size={16} /> : <BriefcaseBusiness size={16} />}</div><div className="staff-directory-copy"><strong>{person.name}</strong><span>{person.role} · {person.focus}</span><small>{person.nationality} · {person.region} · {person.experience} years · ability {person.ability}</small></div><div className="staff-directory-status"><span className={available ? "staff-available" : atThisClub ? "staff-current" : "staff-employed"}>{available ? "AVAILABLE" : atThisClub ? "YOUR CLUB" : "AT A CLUB"}</span><small>{person.clubName ?? (person.region + " network")}</small></div>{available ? <button className="button button-primary button-small" disabled={club.balance < person.wage * 8} onClick={() => appointed(person.id)}>Appoint · {formatMoney(person.wage * 8, true)}</button> : atThisClub ? <span className="staff-current-action">On your roster</span> : <span className="staff-current-action">Not available</span>}</article>; })}{!results.people.length && <div className="people-empty">No staff matched those filters. Try another role or region.</div>}</div>
      <div className="database-pagination"><span>Showing {results.people.length} of {results.total.toLocaleString("en-GB")}</span><div><button className="button button-secondary button-small" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>Previous</button><button className="button button-secondary button-small" disabled={(page + 1) * 12 >= results.total} onClick={() => setPage((current) => current + 1)}>Next staff</button></div></div>
    </section>
  </>;
}
