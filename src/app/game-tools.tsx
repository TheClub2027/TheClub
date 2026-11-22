"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Database, Download, Save, Settings2, Users, Wallet } from "lucide-react";
import type { Career, Club, Player, Position } from "@/lib/game";
import { formatMoney } from "@/lib/game";
import type { GameSettings } from "@/lib/game-settings";
import { CURRENCIES } from "@/lib/game-settings";

type EditorTab = "Clubs" | "Players" | "Finances";

export function SettingsPanel({ settings, onChange, onBack, inCareer = false }: {
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
  onBack: () => void;
  inCareer?: boolean;
}) {
  const set = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => onChange({ ...settings, [key]: value });
  return <section className="game-tools-page">
    <header className="game-tools-heading"><span className="game-tools-icon"><Settings2 size={20} /></span><div><p className="eyebrow">GAME PREFERENCES</p><h1>Settings</h1><p>Set how The Club displays the world and runs matchdays.</p></div><button className="button button-secondary" onClick={onBack}><ArrowLeft size={15} /> Back</button></header>
    <div className="game-settings-grid">
      <label className="game-setting-card"><span><strong>Currency</strong><small>Display club budgets and values in your chosen currency.</small></span><select value={settings.currency} onChange={(event) => set("currency", event.target.value as GameSettings["currency"])}>{CURRENCIES.map((currency) => <option key={currency.code} value={currency.code}>{currency.label}</option>)}</select><em>Converted from the game’s base pound values using fixed in-game rates.</em></label>
      <label className="game-setting-card"><span><strong>Date format</strong><small>Fixtures, birthdays and season dates.</small></span><select value={settings.dateFormat} onChange={(event) => set("dateFormat", event.target.value as GameSettings["dateFormat"])}><option value="UK">DD/MM · UK</option><option value="US">MM/DD · US</option><option value="ISO">YYYY-MM-DD · ISO</option></select></label>
      <label className="game-setting-card"><span><strong>Time format</strong><small>Kick-off times in the match centre.</small></span><select value={settings.timeFormat} onChange={(event) => set("timeFormat", event.target.value as GameSettings["timeFormat"])}><option>24-hour</option><option>12-hour</option></select></label>
      <label className="game-setting-card"><span><strong>Measurement units</strong><small>Pitch dimensions and ground measurements.</small></span><select value={settings.units} onChange={(event) => set("units", event.target.value as GameSettings["units"])}><option>Metric</option><option>Imperial</option></select></label>
      <label className="game-setting-card"><span><strong>Career difficulty</strong><small>Sets opening budgets and board confidence in a new career.</small></span><select value={settings.difficulty} onChange={(event) => set("difficulty", event.target.value as GameSettings["difficulty"])}><option>Relaxed</option><option>Standard</option><option>Challenging</option></select></label>
      <label className="game-setting-toggle"><span><strong>Automatic saving</strong><small>Save changes to this browser as you play.</small></span><input type="checkbox" checked={settings.autosave} onChange={(event) => set("autosave", event.target.checked)} /><i /></label>
    </div>
    <div className="game-tools-foot"><Save size={15} /> Settings save automatically on this device{inCareer ? " and apply to the current career" : ""}.</div>
  </section>;
}

export function DatabaseEditor({ career, setCareer, onBack, startFromEditor }: {
  career: Career;
  setCareer: (career: Career) => void;
  onBack: () => void;
  startFromEditor?: boolean;
}) {
  const [tab, setTab] = useState<EditorTab>("Clubs");
  const [clubId, setClubId] = useState(career.clubId);
  const [playerQuery, setPlayerQuery] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState(career.players[0]?.id ?? "");
  const club = career.clubs.find((item) => item.id === clubId) ?? career.clubs[0];
  const filteredPlayers = useMemo(() => career.players.filter((player) => !playerQuery.trim() || `${player.name} ${player.nationality ?? ""} ${player.clubId ?? ""}`.toLowerCase().includes(playerQuery.trim().toLowerCase())).slice(0, 200), [career.players, playerQuery]);
  const player = career.players.find((item) => item.id === selectedPlayerId) ?? filteredPlayers[0];

  const updateClub = (patch: Partial<Club>) => {
    const next = structuredClone(career);
    const current = next.clubs.find((item) => item.id === club.id);
    if (current) Object.assign(current, patch);
    setCareer(next);
  };
  const updateFinance = (key: "balance" | "transferBudget" | "wageBudget" | "debt", value: number) => updateClub({ [key]: Number.isFinite(value) ? Math.max(0, value) : 0 });
  const updatePlayer = (patch: Partial<Player>) => {
    const next = structuredClone(career);
    const current = next.players.find((item) => item.id === player?.id);
    if (current) Object.assign(current, patch);
    setCareer(next);
  };
  const exportCareer = () => {
    const blob = new Blob([JSON.stringify(career, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${club.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-database.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return <section className="game-tools-page">
    <header className="game-tools-heading"><span className="game-tools-icon"><Database size={20} /></span><div><p className="eyebrow">CAREER DATABASE</p><h1>Editor</h1><p>Edit club identities, player records and starting finances. Changes save with this career.</p></div><div className="game-tools-actions"><button className="button button-secondary" onClick={exportCareer}><Download size={15} /> Export database</button><button className="button button-secondary" onClick={onBack}><ArrowLeft size={15} /> Back</button></div></header>
    <div className="editor-toolbar"><div className="filter-tabs">{(["Clubs", "Players", "Finances"] as EditorTab[]).map((entry) => <button key={entry} className={tab === entry ? "selected" : ""} onClick={() => setTab(entry)}>{entry}</button>)}</div><span>{career.clubs.length} clubs · {career.players.length.toLocaleString("en-GB")} player records</span></div>
    {tab !== "Players" && <div className="editor-club-select"><label>Selected club<select value={club.id} onChange={(event) => setClubId(event.target.value)}>{career.clubs.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.country}</option>)}</select></label><strong>{club.leagueId}</strong></div>}
    {tab === "Clubs" && <div className="editor-form-grid">
      <label>Club name<input value={club.name} maxLength={60} onChange={(event) => updateClub({ name: event.target.value, shortName: event.target.value.slice(0, 3).toUpperCase() })} /></label>
      <label>Town / city<input value={club.city} maxLength={48} onChange={(event) => updateClub({ city: event.target.value })} /></label>
      <label>Country<input value={club.country} maxLength={48} onChange={(event) => updateClub({ country: event.target.value })} /></label>
      <label>Region<input value={club.region} maxLength={48} onChange={(event) => updateClub({ region: event.target.value })} /></label>
      <label>Club reputation<input type="number" min="1" max="100" value={club.reputation} onChange={(event) => updateClub({ reputation: Math.max(1, Math.min(100, Number(event.target.value))) })} /></label>
      <label>Season target · top<input type="number" min="1" value={club.targetPosition} onChange={(event) => updateClub({ targetPosition: Math.max(1, Number(event.target.value)) })} /></label>
      <label>Stadium name<input value={club.stadium.name} maxLength={60} onChange={(event) => updateClub({ stadium: { ...club.stadium, name: event.target.value } })} /></label>
      <label>Stadium capacity<input type="number" min="100" value={club.stadium.capacity} onChange={(event) => updateClub({ stadium: { ...club.stadium, capacity: Math.max(100, Number(event.target.value)) } })} /></label>
      <label>Home colour<input type="color" value={club.colors[0]} onChange={(event) => updateClub({ colors: [event.target.value, club.colors[1]] })} /></label>
      <label>Second colour<input type="color" value={club.colors[1]} onChange={(event) => updateClub({ colors: [club.colors[0], event.target.value] })} /></label>
      <label className="editor-wide">Club history<textarea rows={3} value={club.bio ?? ""} onChange={(event) => updateClub({ bio: event.target.value })} /></label>
    </div>}
    {tab === "Players" && <div className="editor-player-layout"><div className="editor-player-list"><label className="editor-search"><Users size={15} /><input placeholder="Search players in this career" value={playerQuery} onChange={(event) => { setPlayerQuery(event.target.value); setSelectedPlayerId(""); }} /></label>{filteredPlayers.map((item) => <button key={item.id} className={item.id === player?.id ? "selected" : ""} onClick={() => setSelectedPlayerId(item.id)}><span><strong>{item.name}</strong><small>{item.position} · {item.age} · {item.clubId ?? "Free agent"}</small></span><b>{item.overall}</b></button>)}</div>{player && <div className="editor-form-grid editor-player-form">
      <label>Player name<input value={player.name} maxLength={48} onChange={(event) => updatePlayer({ name: event.target.value })} /></label>
      <label>Age<input type="number" min="5" max="50" value={player.age} onChange={(event) => updatePlayer({ age: Math.max(5, Math.min(50, Number(event.target.value))) })} /></label>
      <label>Nationality<input value={player.nationality ?? "English"} maxLength={48} onChange={(event) => updatePlayer({ nationality: event.target.value })} /></label>
      <label>Position<select value={player.position} onChange={(event) => updatePlayer({ position: event.target.value as Position })}>{["GK", "DEF", "MID", "FWD"].map((position) => <option key={position}>{position}</option>)}</select></label>
      <label>Ability<input type="number" min="1" max="99" value={player.overall} onChange={(event) => updatePlayer({ overall: Math.max(1, Math.min(99, Number(event.target.value))) })} /></label>
      <label>Potential<input type="number" min={player.overall} max="99" value={Math.max(player.overall, player.potential)} onChange={(event) => updatePlayer({ potential: Math.max(player.overall, Math.min(99, Number(event.target.value))) })} /></label>
      <label>Wage / week<input type="number" min="0" value={player.wage} onChange={(event) => updatePlayer({ wage: Math.max(0, Number(event.target.value)) })} /></label>
      <label>Contract years<input type="number" min="0" max="8" value={player.contractYears} onChange={(event) => updatePlayer({ contractYears: Math.max(0, Math.min(8, Number(event.target.value))) })} /></label>
      <div className="editor-player-note">ID {player.id} · face identity stays tied to this player record.</div>
    </div>}</div>}
    {tab === "Finances" && <div className="editor-finance-grid">
      <div className="editor-finance-copy"><span className="game-tools-icon"><Wallet size={19} /></span><p className="eyebrow">CLUB ACCOUNTS</p><h2>{club.name}</h2><p>Use the editor to rebalance a career database or set up a custom challenge.</p></div>
      <div className="editor-form-grid"><label>Club balance<input type="number" min="0" step="10000" value={club.balance} onChange={(event) => updateFinance("balance", Number(event.target.value))} /><small>{formatMoney(club.balance)}</small></label><label>Transfer budget<input type="number" min="0" step="10000" value={club.transferBudget} onChange={(event) => updateFinance("transferBudget", Number(event.target.value))} /><small>{formatMoney(club.transferBudget)}</small></label><label>Weekly wage budget<input type="number" min="0" step="1000" value={club.wageBudget} onChange={(event) => updateFinance("wageBudget", Number(event.target.value))} /><small>{formatMoney(club.wageBudget)} / week</small></label><label>Debt<input type="number" min="0" step="10000" value={club.debt} onChange={(event) => updateFinance("debt", Number(event.target.value))} /><small>{formatMoney(club.debt)}</small></label></div>
    </div>}
    <footer className="editor-footer"><span><Save size={14} /> Edits apply immediately to the open career record.</span>{startFromEditor && <button className="button button-primary" onClick={onBack}>Use database and continue <Database size={14} /></button>}</footer>
  </section>;
}
