"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRightLeft, Check, X } from "lucide-react";
import { formatMoney, getClub, getCurrentLeague, getLoanDestinationOptions, negotiatePlayerLoan } from "@/lib/game";
import type { Career } from "@/lib/game";
import { PlayerPortrait } from "./player-portrait";

type Props = {
  career: Career;
  playerId: string;
  direction: "send" | "receive";
  setCareer: (career: Career) => void;
  onClose: () => void;
  onAccepted: (message: string) => void;
};

export default function PlayerLoanNegotiation({ career, playerId, direction, setCareer, onClose, onAccepted }: Props) {
  const dialogRef = useRef<HTMLElement>(null);
  const player = career.players.find((item) => item.id === playerId);
  const destinations = direction === "send" ? getLoanDestinationOptions(career, playerId) : [];
  const parent = player?.clubId ? career.clubs.find((club) => club.id === player.clubId) : null;
  const [destinationId, setDestinationId] = useState(direction === "receive" ? career.clubId : destinations[0]?.id ?? "");
  const [loanFee, setLoanFee] = useState(() => String(Math.max(5_000, Math.round((player?.value ?? 0) * 0.012 / 1_000) * 1_000)));
  const [wageShare, setWageShare] = useState(() => player && player.age <= 21 ? "35" : "50");
  const [duration, setDuration] = useState("season");
  const [feedback, setFeedback] = useState("");
  const [rejected, setRejected] = useState(false);
  const userClub = getClub(career);
  const activeLoan = (career.playerLoans ?? []).some((loan) => loan.playerId === playerId && loan.status === "Active");
  const seasonRounds = getCurrentLeague(career).rounds;
  const availableRounds = Math.max(1, Math.min(seasonRounds, seasonRounds - career.round + 1));
  const selectedDestination = direction === "receive" ? userClub : destinations.find((club) => club.id === destinationId);
  const remainingBudget = direction === "receive" ? userClub.transferBudget : Number.POSITIVE_INFINITY;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("input, select")?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), select:not(:disabled), [href], [tabindex]:not([tabindex='-1'])")];
      if (!focusable.length) return;
      if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", handleKeyDown); };
  }, [onClose]);

  if (!player || !parent || (direction === "send" && !destinations.length)) return null;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const remaining = Math.max(1, getCurrentLeague(career).rounds - career.round + 1);
    const result = negotiatePlayerLoan(career, playerId, {
      loanClubId: destinationId,
      loanFee: Number(loanFee),
      wageContributionPercent: Number(wageShare),
      durationRounds: duration === "six" ? Math.min(6, remaining) : remaining,
    });
    if (result.status === "accepted") {
      setCareer(result.career);
      onAccepted(result.message);
      onClose();
      return;
    }
    setRejected(result.status === "rejected");
    setFeedback(result.message);
    if (result.status === "countered" && result.counterOffer) {
      setLoanFee(String(result.counterOffer.loanFee));
      setWageShare(String(result.counterOffer.wageContributionPercent));
      setDuration(result.counterOffer.durationRounds <= 6 ? "six" : "season");
    }
  };

  const buttonDisabled = !destinationId || activeLoan || Number(loanFee) > remainingBudget || !Number.isInteger(Number(loanFee)) || Number(loanFee) < 0 || career.round > seasonRounds;
  return <div className="contract-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialogRef} className="contract-modal transfer-modal loan-modal" role="dialog" aria-modal="true" aria-labelledby="loan-modal-title" tabIndex={-1}>
      <header className="contract-modal-heading">
        <PlayerPortrait id={player.id} name={player.name} />
        <div><p className="eyebrow">LOAN DESK · {direction === "send" ? "DEVELOPMENT MOVE" : "FIRST-TEAM REINFORCEMENT"}</p><h2 id="loan-modal-title">{direction === "send" ? "Offer out" : "Request loan"} · {player.name}</h2><span>{player.position} · {player.age} · {player.overall} OVR · {parent.name}</span></div>
        <button type="button" className="contract-modal-close" onClick={onClose} aria-label="Close loan negotiation"><X size={18} /></button>
      </header>
      <div className="contract-demand-card loan-summary-card">
        <div><small>PLAYER WAGE</small><strong>{formatMoney(player.wage, true)}<i>/week</i></strong></div>
        <div><small>WAGE SHARE</small><strong>{wageShare}%</strong></div>
        <div><small>DESTINATION</small><strong>{selectedDestination?.name ?? "Choose a club"}</strong></div>
        <p>{direction === "send" ? "The borrowing club pays the agreed share each matchweek. Your club remains responsible for the rest and retains the player's contract." : "The parent club keeps the player's contract. Your club pays the agreed share of wages and the one-off loan fee."}</p>
      </div>
      <form className="contract-offer-form" onSubmit={submit}>
        {direction === "send" && <label>Destination club<select aria-label="Loan destination club" required value={destinationId} onChange={(event) => setDestinationId(event.target.value)}>{destinations.map((club) => <option key={club.id} value={club.id}>{club.name} · {club.league} · {club.squadSize} players</option>)}</select></label>}
        <label>Loan fee <span className="contract-input-wrap"><b>{formatMoney(0).replace(/[\d.,\s]/g, "")}</b><input type="number" min="0" step="1000" max={Number.isFinite(remainingBudget) ? remainingBudget : undefined} required value={loanFee} onChange={(event) => setLoanFee(event.target.value)} aria-label="Loan fee" /></span></label>
        <label>Wage contribution<select aria-label="Borrowing club wage contribution" value={wageShare} onChange={(event) => setWageShare(event.target.value)}><option value="25">25% · {formatMoney(player.wage * 0.25, true)}/week</option><option value="35">35% · {formatMoney(player.wage * 0.35, true)}/week</option><option value="50">50% · {formatMoney(player.wage * 0.5, true)}/week</option><option value="75">75% · {formatMoney(player.wage * 0.75, true)}/week</option><option value="100">100% · {formatMoney(player.wage, true)}/week</option></select></label>
        <label>Loan length<select aria-label="Loan length" value={duration} onChange={(event) => setDuration(event.target.value)}><option value="six">Next {Math.min(6, availableRounds)} matchdays</option><option value="season">Until the end of this season · {availableRounds} matchdays</option></select></label>
        <div className="contract-budget-note within-budget"><span>{direction === "receive" ? "Transfer budget after fee" : "Your retained wage cost"}</span><strong>{direction === "receive" ? formatMoney(userClub.transferBudget - Number(loanFee)) : formatMoney(player.wage * (1 - Number(wageShare) / 100), true) + " / week"}</strong></div>
        {activeLoan && <p className="contract-cooldown">This player already has an active loan.</p>}
        {feedback && <div className={`contract-feedback ${rejected ? "feedback-rejected" : "feedback-accepted"}`}><Check size={15} /><span>{feedback}</span></div>}
        <footer className="contract-modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary" disabled={buttonDisabled}><ArrowRightLeft size={15} /> Submit loan offer</button></footer>
      </form>
    </section>
  </div>;
}
