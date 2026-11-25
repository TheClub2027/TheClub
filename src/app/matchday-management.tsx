"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, ClipboardList, Plus, X } from "lucide-react";
import {
  getClub,
  getMatchdaySubstitutionOptions,
  getNextFixture,
  getSecondHalfDirectiveEffects,
  validateMatchdayManagementPlan,
} from "@/lib/game";
import type { Career, MatchdayManagementPlan, MatchdaySubstitution, SecondHalfDirective } from "@/lib/game";

const DIRECTIVES: { value: SecondHalfDirective; detail: string }[] = [
  { value: "Balanced", detail: "Keep the current approach and manage the game." },
  { value: "Raise the press", detail: "Ask the team to press higher after the break." },
  { value: "Protect the lead", detail: "Drop the line and make the centre harder to play through." },
  { value: "Overload the wings", detail: "Stretch their defence and attack the wide areas." },
  { value: "Keep possession", detail: "Slow the match down with safer circulation." },
];

type Props = {
  career: Career;
  onClose: () => void;
  onConfirm: (plan: MatchdayManagementPlan) => void;
};

export default function MatchdayManagementModal({ career, onClose, onConfirm }: Props) {
  const [substitutions, setSubstitutions] = useState<MatchdaySubstitution[]>([]);
  const [directive, setDirective] = useState<SecondHalfDirective>("Balanced");
  const [teamTalk, setTeamTalk] = useState<NonNullable<Career["teamTalk"]>>(career.teamTalk ?? "Encouraging");
  const [message, setMessage] = useState("");
  const fixture = getNextFixture(career);
  const options = useMemo(() => getMatchdaySubstitutionOptions(career), [career]);
  const opponent = fixture ? getClub(career, fixture.homeClubId === career.clubId ? fixture.awayClubId : fixture.homeClubId) : null;
  const plan: MatchdayManagementPlan = { substitutions, secondHalfDirective: directive, teamTalk };
  const availableOutgoing = options.starting.filter((player) => !substitutions.some((entry) => entry.playerOffId === player.id));
  const availableIncoming = options.bench.filter((player) => !substitutions.some((entry) => entry.playerOnId === player.id));
  const completedWindows = new Set(substitutions.map((item) => item.minute)).size;
  const canAddSubstitution = substitutions.length < 5 && (completedWindows < 3 || substitutions.some((item) => item.minute === 60)) && availableOutgoing.length > 0 && availableIncoming.length > 0;

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const updateSubstitution = (index: number, patch: Partial<MatchdaySubstitution>) => {
    setMessage("");
    setSubstitutions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };

  const addSubstitution = () => {
    if (!canAddSubstitution) return;
    const pair = availableOutgoing.flatMap((outgoing) => {
      const incoming = availableIncoming.find((player) => player.position === outgoing.position);
      return incoming ? [{ outgoing, incoming }] : [];
    })[0];
    if (!pair) {
      setMessage("There is no like-for-like replacement available for the players currently selected.");
      return;
    }
    setSubstitutions((current) => [...current, { minute: 60, playerOffId: pair.outgoing.id, playerOnId: pair.incoming.id }]);
  };

  const submit = () => {
    if (!validateMatchdayManagementPlan(career, plan)) {
      setMessage("Choose an eligible like-for-like replacement for each change. You can use up to five substitutes across three windows.");
      return;
    }
    onConfirm(plan);
  };

  return <div className="contract-modal-backdrop matchday-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="contract-modal matchday-modal" role="dialog" aria-modal="true" aria-labelledby="matchday-title">
      <div className="contract-modal-heading">
        <span className="contract-modal-icon"><ClipboardList size={19} /></span>
        <div><p className="eyebrow">LIVE MATCH · ROUND {career.round}</p><h2 id="matchday-title">Team talk & match plan</h2><span>{opponent ? `${fixture?.homeClubId === career.clubId ? "Home to" : "Away at"} ${opponent.name}` : "Prepare the squad for kick-off"}</span></div>
        <button className="contract-modal-close" type="button" aria-label="Close matchday plan" onClick={onClose}><X size={17} /></button>
      </div>

      <div className="matchday-form-section team-talk-section">
        <div className="matchday-section-heading"><div><p className="eyebrow">DRESSING ROOM · BEFORE KICK-OFF</p><strong>Choose your team talk</strong></div><span>Rapport shapes the response</span></div>
        <div className="matchday-directive-grid team-talk-grid">{([
          ["Calm", "Settle the group and take the pressure out of the occasion."],
          ["Encouraging", "Back the players and build confidence together."],
          ["Demanding", "Set a high standard; strong rapport helps this land."],
        ] as const).map(([tone, detail]) => <button type="button" key={tone} className={`matchday-directive ${teamTalk === tone ? "selected" : ""}`} aria-pressed={teamTalk === tone} onClick={() => { setTeamTalk(tone); setMessage(""); }}><strong>{tone}</strong><small>{detail}</small><small className="matchday-directive-effect">PRE-MATCH TONE · {tone === "Demanding" ? "HIGH EXPECTATION" : tone === "Calm" ? "LOWER PRESSURE" : "CONFIDENCE"}</small></button>)}</div>
      </div>

      <div className="matchday-form-section">
        <div className="matchday-section-heading"><div><p className="eyebrow">SECOND HALF</p><strong>Half-time instruction</strong></div><span>Applied to your team</span></div>
        <div className="matchday-directive-grid">{DIRECTIVES.map((option) => {
          const effects = getSecondHalfDirectiveEffects(career, option.value);
          return <button type="button" key={option.value} className={`matchday-directive ${directive === option.value ? "selected" : ""}`} aria-pressed={directive === option.value} onClick={() => { setDirective(option.value); setMessage(""); }}>
            <strong>{option.value}</strong>
            <small>{option.detail}</small>
            <small className="matchday-directive-effect">Team impact · attack {effects.attack > 0 ? "+" : ""}{effects.attack.toFixed(1)} · defence {effects.defence > 0 ? "+" : ""}{effects.defence.toFixed(1)}</small>
          </button>;
        })}</div>
      </div>

      <div className="matchday-form-section">
        <div className="matchday-section-heading"><div><p className="eyebrow">SUBSTITUTIONS</p><strong>Plan up to five changes</strong></div><span>{substitutions.length} / 5 · three windows</span></div>
        <p className="matchday-help">Choose a like-for-like player from the squad. Changes affect who is on the pitch, recorded minutes, and the match timeline.</p>
        {substitutions.length ? <div className="matchday-substitution-list">{substitutions.map((substitution, index) => {
          const outgoing = options.starting.find((player) => player.id === substitution.playerOffId);
          const incoming = options.bench.find((player) => player.id === substitution.playerOnId);
          const outgoingChoices = options.starting.filter((player) => player.id === substitution.playerOffId || !substitutions.some((item, itemIndex) => itemIndex !== index && item.playerOffId === player.id));
          const incomingChoices = options.bench.filter((player) => player.id === substitution.playerOnId || !substitutions.some((item, itemIndex) => itemIndex !== index && item.playerOnId === player.id));
          return <div className="matchday-substitution-row" key={`${index}-${substitution.playerOffId}`}>
            <label><span>OFF · {outgoing?.position ?? "POS"}</span><select value={substitution.playerOffId} onChange={(event) => { const next = options.starting.find((player) => player.id === event.target.value); updateSubstitution(index, { playerOffId: event.target.value, playerOnId: next ? (options.bench.find((candidate) => candidate.position === next.position && (candidate.id === substitution.playerOnId || !substitutions.some((item, itemIndex) => itemIndex !== index && item.playerOnId === candidate.id)))?.id ?? "") : "" }); }}><option value="">Select starter</option>{outgoingChoices.map((player) => <option key={player.id} value={player.id}>{player.name} · {player.overall} OVR</option>)}</select></label>
            <ArrowLeftRight className="matchday-change-icon" size={17} />
            <label><span>ON · {incoming?.position ?? outgoing?.position ?? "POS"}</span><select value={substitution.playerOnId} onChange={(event) => updateSubstitution(index, { playerOnId: event.target.value })}><option value="">Select substitute</option>{incomingChoices.filter((player) => !outgoing || player.position === outgoing.position).map((player) => <option key={player.id} value={player.id}>{player.name} · {player.overall} OVR</option>)}</select></label>
            <label className="matchday-minute"><span>MINUTE</span><select value={substitution.minute} onChange={(event) => { const minute = Number(event.target.value) as MatchdaySubstitution["minute"]; const usedElsewhere = substitutions.some((item, itemIndex) => itemIndex !== index && item.minute === minute); if (!usedElsewhere || substitutions.some((item, itemIndex) => itemIndex !== index && item.minute === substitution.minute)) updateSubstitution(index, { minute }); }}><option value={45}>45′</option><option value={60}>60′</option><option value={75}>75′</option></select></label>
            <button className="matchday-remove" type="button" aria-label={`Remove substitution ${index + 1}`} onClick={() => setSubstitutions((current) => current.filter((_, itemIndex) => itemIndex !== index))}><X size={15} /></button>
          </div>;
        })}</div> : <div className="matchday-empty-subs">No planned substitutions. You can still set a half-time instruction.</div>}
        <button className="matchday-add-sub" type="button" disabled={!canAddSubstitution} onClick={addSubstitution}><Plus size={15} /> Add substitution</button>
        {message && <p className="form-message matchday-error" role="alert">{message}</p>}
      </div>

      <div className="contract-modal-actions"><button className="button button-secondary" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="button" onClick={submit}>Confirm plan & kick off</button></div>
    </section>
  </div>;
}
