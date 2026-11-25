"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRightLeft, Check, Handshake, TrendingUp, X } from "lucide-react";
import { formatMoney, getClub, getTransferDemand, getTransferPlayer, negotiateTransferOffer } from "@/lib/game";
import type { Career, ContractSquadRole, PlayerTransferOffer } from "@/lib/game";
import { PlayerPortrait } from "./player-portrait";

type Props = { career: Career; playerId: string; initialFee?: number; setCareer: (career: Career) => void; onClose: () => void; onAccepted: (message: string) => void };

const SQUAD_ROLES: ContractSquadRole[] = ["Prospect", "Rotation", "First team", "Important", "Star"];

export default function TransferNegotiation({ career, playerId, initialFee, setCareer, onClose, onAccepted }: Props) {
  const dialogRef = useRef<HTMLElement>(null);
  const player = getTransferPlayer(career, playerId);
  const demand = getTransferDemand(career, playerId);
  const club = getClub(career);
  const [fee, setFee] = useState(() => String(initialFee ?? demand?.fee ?? 0));
  const [weeklyWage, setWeeklyWage] = useState(() => String(demand?.weeklyWage ?? player?.wage ?? 100));
  const [years, setYears] = useState(() => String(demand?.years ?? 3));
  const [squadRole, setSquadRole] = useState<ContractSquadRole>(demand?.squadRole ?? "Rotation");
  const [signingBonus, setSigningBonus] = useState(() => String(demand?.signingBonus ?? 0));
  const [feedback, setFeedback] = useState("");
  const [rejected, setRejected] = useState(false);
  const feeValue = Number(fee);
  const bonusValue = Number(signingBonus);
  const playerWages = career.players.filter((item) => item.clubId === club.id).reduce((sum, item) => sum + item.wage, 0);
  const proposedWages = playerWages + (Number(weeklyWage) || 0);
  const fundsAvailableForBonus = Math.max(0, club.balance - Math.max(0, feeValue));
  const canSubmit = Boolean(demand && player && feeValue <= club.transferBudget && feeValue + bonusValue <= club.balance);

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
    const offer: PlayerTransferOffer = {
      fee: Number(fee),
      weeklyWage: Number(weeklyWage),
      years: Number(years),
      squadRole,
      signingBonus: Number(signingBonus),
    };
    const result = negotiateTransferOffer(career, playerId, offer);
    if (result.status === "accepted") {
      setCareer(result.career);
      onAccepted(result.message);
      onClose();
      return;
    }
    setRejected(result.status === "rejected");
    setFeedback(result.message);
    if (result.status === "countered" && result.counterOffer) {
      setFee(String(result.counterOffer.fee));
      setWeeklyWage(String(result.counterOffer.weeklyWage));
      setYears(String(result.counterOffer.years));
      setSquadRole(result.counterOffer.squadRole);
      setSigningBonus(String(result.counterOffer.signingBonus));
    }
  };

  if (!player) return null;
  return <div className="contract-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialogRef} className="contract-modal transfer-modal" role="dialog" aria-modal="true" aria-labelledby="transfer-modal-title" aria-describedby={demand ? "transfer-demand-copy" : undefined} tabIndex={-1}>
      <header className="contract-modal-heading">
        <PlayerPortrait id={player.id} name={player.name} />
        <div><p className="eyebrow">TRANSFER DESK · {player.clubId ? "CLUB + REPRESENTATIVE" : "FREE AGENT"}</p><h2 id="transfer-modal-title">Negotiate with {player.name}</h2><span>{player.position} · {player.age} · {player.overall} OVR · {player.potential} POT · {player.clubId ? demand?.sellerClubName : "Available without a transfer fee"}</span></div>
        <button type="button" className="contract-modal-close" onClick={onClose} aria-label="Close transfer negotiation"><X size={18} /></button>
      </header>
      {demand ? <div className="transfer-demand-card">
        <div><small>{player.clubId ? "SELLING CLUB VALUE" : "TRANSFER FEE"}</small><strong>{demand.fee ? formatMoney(demand.fee, true) : "Free"}</strong></div>
        <div><small>WEEKLY WAGE</small><strong>{formatMoney(demand.weeklyWage, true)}</strong></div>
        <div><small>CONTRACT</small><strong>{demand.years} years</strong></div>
        <div><small>SQUAD ROLE</small><strong>{demand.squadRole}</strong></div>
        <p id="transfer-demand-copy">{demand.reason}</p>
      </div> : <p className="transfer-demand-missing">A completed scouting report is required before formal talks can begin.</p>}
      <form className="contract-offer-form" onSubmit={submit}>
        <label>Transfer fee <span className="contract-input-wrap"><b>{formatMoney(0).replace(/[\d.,\s]/g, "")}</b><input type="number" min="0" max={club.transferBudget} step="10000" required value={fee} onChange={(event) => setFee(event.target.value)} aria-label="Transfer fee offer" disabled={!player.clubId} /></span></label>
        <label>Weekly wage <span className="contract-input-wrap"><b>{formatMoney(0).replace(/[\d.,\s]/g, "")}</b><input type="number" min="100" step="100" required value={weeklyWage} onChange={(event) => setWeeklyWage(event.target.value)} aria-label="Weekly wage offer" /></span></label>
        <label>Contract length<select value={years} onChange={(event) => setYears(event.target.value)} aria-label="Contract length"><option value="1">1 year</option><option value="2">2 years</option><option value="3">3 years</option><option value="4">4 years</option><option value="5">5 years</option></select></label>
        <label>Promised squad role<select value={squadRole} onChange={(event) => setSquadRole(event.target.value as ContractSquadRole)} aria-label="Promised squad role">{SQUAD_ROLES.map((role) => <option key={role}>{role}</option>)}</select></label>
        <label>Signing bonus <span className="contract-input-wrap"><b>{formatMoney(0).replace(/[\d.,\s]/g, "")}</b><input type="number" min="0" max={fundsAvailableForBonus} step="100" required value={signingBonus} onChange={(event) => setSigningBonus(event.target.value)} aria-label="Signing bonus" /></span></label>
        <div className={"contract-budget-note " + (proposedWages > club.wageBudget ? "over-budget" : "within-budget")}><span>Weekly squad wages after signing</span><strong>{formatMoney(proposedWages, true)} <i>/ {formatMoney(club.wageBudget, true)} budget</i></strong></div>
        {(feeValue > club.transferBudget || feeValue + bonusValue > club.balance) && <p className="contract-budget-warning">This offer exceeds the club’s available transfer funds. Lower the fee or signing bonus to continue.</p>}
        {proposedWages > club.wageBudget && <p className="contract-budget-warning">The squad would move above its current wage budget. The board will expect that overspend to be managed.</p>}
        {feedback && <div className={"contract-feedback " + (rejected ? "feedback-rejected" : "feedback-countered")}><span className="transfer-feedback-icon">{rejected ? <X size={15} /> : <TrendingUp size={15} />}</span><span>{feedback}</span></div>}
        <footer className="contract-modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Close talks</button><button type="submit" className="button button-primary" disabled={!canSubmit || !demand}>Submit offer <ArrowRightLeft size={15} /></button></footer>
      </form>
    </section>
  </div>;
}
