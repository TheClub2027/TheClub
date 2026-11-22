"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { BriefcaseBusiness, Check, Crown, Search, Shield, Users } from "lucide-react";
import { formatMoney, getClub, hireStaff, releaseStaff } from "@/lib/game";
import type { Career } from "@/lib/game";
import { countWorldStaff, searchWorldStaff, STAFF_ROLES } from "@/lib/world-staff-database";
import type { StaffRole } from "@/lib/world-staff-database";

type Props = { career: Career; setCareer: (career: Career) => void };

export default function StaffManagement({ career, setCareer }: Props) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<StaffRole | "All roles">("All roles");
  const [status, setStatus] = useState<"Available" | "At a club" | "All">("Available");
  const [page, setPage] = useState(0);
  const [notice, setNotice] = useState("");
  const deferredQuery = useDeferredValue(query);
  const club = getClub(career);
  const overrides = career.staffChanges ?? {};
  const worldCounts = useMemo(() => countWorldStaff(overrides), [overrides]);
  const results = useMemo(() => searchWorldStaff(deferredQuery, role, status, page * 12, 12, overrides), [deferredQuery, role, status, page, overrides]);
  const clubStaff = club.staff ?? [];
  const board = club.board ?? [];
  const appointed = (staffId: string) => {
    const next = hireStaff(career, staffId);
    if (next === career) setNotice("The appointment needs more available funds or the person is already employed.");
    else { setCareer(next); setNotice("Appointment confirmed. The club’s staffing record has been updated."); }
  };
  const release = (staffId: string, name: string) => {
    setCareer(releaseStaff(career, staffId));
    setNotice(name + " has left the club. The severance payment is in the finance ledger.");
  };
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
    <section className="panel people-panel"><div className="people-section-heading"><div><p className="eyebrow">CLUB LEADERSHIP</p><h2>Board members</h2></div><span>{board.length} appointments · changes affect club governance</span></div>{list(board, true)}</section>
    <section className="panel people-panel"><div className="people-section-heading"><div><p className="eyebrow">FIRST TEAM & RECRUITMENT</p><h2>Football staff</h2></div><span>{clubStaff.length} appointments · weekly wages are recorded</span></div>{list(clubStaff)}</section>
    <section className="panel people-panel people-database"><div className="people-section-heading"><div><p className="eyebrow">WORLD STAFF DIRECTORY</p><h2>Find your next appointment</h2></div><span>{results.total.toLocaleString("en-GB")} matches</span></div>
      <div className="people-filters"><label className="people-search"><Search size={15} /><input aria-label="Search staff database" placeholder="Name, specialty, nationality or region" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} /></label><label>ROLE<select value={role} onChange={(event) => { setRole(event.target.value as StaffRole | "All roles"); setPage(0); }}><option>All roles</option>{STAFF_ROLES.map((entry) => <option key={entry}>{entry}</option>)}</select></label><label>EMPLOYMENT<select value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setPage(0); }}><option>Available</option><option>At a club</option><option>All</option></select></label></div>
      {notice && <div className="inline-notice"><Check size={15} />{notice}<button onClick={() => setNotice("")}>Dismiss</button></div>}
      <div className="staff-directory-list">{results.people.map((person) => { const atThisClub = person.clubId === club.id; const available = person.clubId === null; return <article className="staff-directory-row" key={person.id}><div className="people-person-avatar">{person.role.includes("Director") || person.role === "Chairperson" ? <Crown size={16} /> : <BriefcaseBusiness size={16} />}</div><div className="staff-directory-copy"><strong>{person.name}</strong><span>{person.role} · {person.focus}</span><small>{person.nationality} · {person.region} · {person.experience} years · ability {person.ability}</small></div><div className="staff-directory-status"><span className={available ? "staff-available" : atThisClub ? "staff-current" : "staff-employed"}>{available ? "AVAILABLE" : atThisClub ? "YOUR CLUB" : "AT A CLUB"}</span><small>{person.clubName ?? (person.region + " network")}</small></div>{available ? <button className="button button-primary button-small" disabled={club.balance < person.wage * 8} onClick={() => appointed(person.id)}>Appoint · {formatMoney(person.wage * 8, true)}</button> : atThisClub ? <span className="staff-current-action">On your roster</span> : <span className="staff-current-action">Not available</span>}</article>; })}{!results.people.length && <div className="people-empty">No staff matched those filters. Try another role or region.</div>}</div>
      <div className="database-pagination"><span>Showing {results.people.length} of {results.total.toLocaleString("en-GB")}</span><div><button className="button button-secondary button-small" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>Previous</button><button className="button button-secondary button-small" disabled={(page + 1) * 12 >= results.total} onClick={() => setPage((current) => current + 1)}>Next staff</button></div></div>
    </section>
  </>;
}
