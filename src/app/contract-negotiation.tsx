"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, Clock3, Handshake, X } from "lucide-react";
import { canOpenContractTalks, formatMoney, getClub, getContractDemand, negotiatePlayerContract } from "@/lib/game";
import type { Career, ContractSquadRole, Player } from "@/lib/game";

type Props = { career: Career; player: Player; setCareer: (career: Career) => void; onClose: () => void; onAccepted: (message: string) => void };

const SQUAD_ROLES: ContractSquadRole[] = ["Prospect", "Rotation", "First team", "Important", "Star"];

export default function ContractNegotiation({ career, player, setCareer, onClose, onAccepted }: Props) {
  const dialogRef = useRef<HTMLElement>(null);
  const demand = getContractDemand(career, player.id);
  const club = getClub(career);
  const [weeklyWage, setWeeklyWage] = useState(() => String(demand?.weeklyWage ?? player.wage));
  const [years, setYears] = useState(() => String(demand?.years ?? 3));
  const [squadRole, setSquadRole] = useState<ContractSquadRole>(demand?.squadRole ?? "Rotation");
  const [signingBonus, setSigningBonus] = useState(() => String(demand?.signingBonus ?? 0));
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState(false);
  const available = canOpenContractTalks(career, player.id);
  const playerWages = career.players.filter((item) => item.clubId === club.id).reduce((sum, item) => sum + item.wage, 0);
  const proposedTotal = playerWages - player.wage + (Number(weeklyWage) || 0);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("input, select")?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), select:not(:disabled), [href], [tabindex]:not([tabindex='-1'])")];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!demand) return;
    const result = negotiatePlayerContract(career, player.id, {
      weeklyWage: Number(weeklyWage),
      years: Number(years),
      squadRole,
      signingBonus: Number(signingBonus),
    });
    if (result.career !== career) setCareer(result.career);
    if (result.accepted) {
      onAccepted(result.message);
      onClose();
      return;
    }
    setError(true);
    setFeedback(result.message);
  };

  return <div className="contract-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialogRef} className="contract-modal" role="dialog" aria-modal="true" aria-labelledby="contract-modal-title" aria-describedby="contract-demand-copy" tabIndex={-1}>
      <header className="contract-modal-heading"><span className="contract-modal-icon"><Handshake size={19} /></span><div><p className="eyebrow">PLAYER REPRESENTATIVE MEETING</p><h2 id="contract-modal-title">Contract offer · {player.name}</h2><span>{player.overall} OVR · {player.age} years old · current deal {player.contractYears} year{player.contractYears === 1 ? "" : "s"} remaining</span></div><button type="button" className="contract-modal-close" onClick={onClose} aria-label="Close contract meeting"><X size={18} /></button></header>
      {demand && <div className="contract-demand-card"><div><small>PLAYER REQUEST</small><strong>{formatMoney(demand.weeklyWage, true)}<i>/week</i></strong></div><div><small>TERM</small><strong>{demand.years} years</strong></div><div><small>SQUAD ROLE</small><strong>{demand.squadRole}</strong></div><div><small>SIGNING BONUS</small><strong>{formatMoney(demand.signingBonus, true)}</strong></div><p id="contract-demand-copy">{demand.reason}</p></div>}
      <form className="contract-offer-form" onSubmit={submit}>
        <label>Weekly wage <span className="contract-input-wrap"><b>{formatMoney(0).replace(/[\d.,\s]/g, "")}</b><input type="number" min="100" step="100" required value={weeklyWage} onChange={(event) => setWeeklyWage(event.target.value)} aria-label="Offered weekly wage" /></span></label>
        <label>Contract length<select value={years} onChange={(event) => setYears(event.target.value)} aria-label="Contract length"><option value="1">1 year</option><option value="2">2 years</option><option value="3">3 years</option><option value="4">4 years</option><option value="5">5 years</option></select></label>
        <label>Promised squad role<select value={squadRole} onChange={(event) => setSquadRole(event.target.value as ContractSquadRole)} aria-label="Promised squad role">{SQUAD_ROLES.map((role) => <option key={role}>{role}</option>)}</select></label>
        <label>Signing bonus <span className="contract-input-wrap"><b>{formatMoney(0).replace(/[\d.,\s]/g, "")}</b><input type="number" min="0" step="100" max={Math.max(0, club.balance)} required value={signingBonus} onChange={(event) => setSigningBonus(event.target.value)} aria-label="Signing bonus" /></span></label>
        <div className={`contract-budget-note ${proposedTotal > club.wageBudget ? "over-budget" : "within-budget"}`}><span>Weekly squad wages after this offer</span><strong>{formatMoney(proposedTotal, true)} <i>/ {formatMoney(club.wageBudget, true)} budget</i></strong></div>
        {proposedTotal > club.wageBudget && <p className="contract-budget-warning">This offer takes the squad above its wage budget. The player can still accept, but the board will expect the overspend to be managed.</p>}
        {!available && <p className="contract-cooldown"><Clock3 size={14} /> The player has asked for time. Contract talks reopen after three matchdays.</p>}
        {feedback && <div className={`contract-feedback ${error ? "feedback-rejected" : "feedback-accepted"}`}><Check size={15} /><span>{feedback}</span></div>}
        <footer className="contract-modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Close meeting</button><button type="submit" className="button button-primary" disabled={!available || !demand}>Submit offer <Handshake size={15} /></button></footer>
      </form>
    </section>
  </div>;
}
