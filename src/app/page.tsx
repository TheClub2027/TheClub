"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Activity,
  BadgeCheck,
  Banknote,
  Building2,
  Database,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Cloud,
  Coins,
  Crown,
  Dumbbell,
  Flag,
  Home,
  Lightbulb,
  ListChecks,
  Mail,
  Megaphone,
  Menu,
  Newspaper,
  Plus,
  RefreshCw,
  Save,
  Search,
  Shield,
  Shirt,
  Settings2,
  Sparkles,
  Star,
  Store,
  Trophy,
  Users,
  Wallet,
  Wrench,
  X,
  BriefcaseBusiness,
  MapPin,
  GraduationCap,
  Handshake,
  type LucideIcon,
} from "lucide-react";
import {
  acceptSponsor,
  applyForJob,
  beginNextSeason,
  buyPlayer,
  CLUB_OPTIONS,
  createCareer,
  formatMoney,
  formatPlayerValue,
  getClub,
  getAcademyPlayers,
  getScoutingCost,
  getScoutingReport,
  getYouthCandidates,
  getBoardPressureSignals,
  hireStaff,
  getCurrentLeague,
  getFormationSlots,
  getNextFixture,
  getSeasonWeekCount,
  getTable,
  getUserPlayers,
  playMatchday,
  renewContract,
  releaseStaff,
  promoteYouth,
  launchKitCollection,
  setYouthTraining,
  scoutPlayer,
  signYouthPlayer,
  ROOF_OPTIONS,
  setPlayerSelection,
  sponsorProposal,
  FORMATION_OPTIONS,
  TRAINING_OPTIONS,
  upgradeClubFacility,
  normalizeCareer,
} from "@/lib/game";
import type { Career, Club, KitPattern, Player, PlayerAttributes, PlayerStats, Position, SquadLevel, SponsorSlot } from "@/lib/game";
import { ENGLISH_LEAGUES } from "@/lib/league-pyramid";
import type { LeagueId } from "@/lib/league-pyramid";
import { WORLD_COUNTRIES, WORLD_LEAGUES } from "@/lib/world-leagues";
import { DEFAULT_GAME_SETTINGS, GAME_SETTINGS_KEY, formatGameDate, formatGameTime, readGameSettings, type GameSettings } from "@/lib/game-settings";
import { isSupabaseConfigured, loadLatestOnlineCareer, saveOnlineCareer, supabase } from "@/lib/supabase";
import StadiumArchitect from "./stadium-architect";
import StaffManagement from "./staff-management";
import { PlayerPortrait } from "./player-portrait";
import { ClubMark, ClubWordmark } from "./brand";
import { DatabaseEditor, SettingsPanel } from "./game-tools";
import { getWorldPlayerDetails, searchWorldDatabase, worldGroupCount, WORLD_PLAYER_COUNT, WORLD_PLAYER_COUNTRIES } from "@/lib/world-database";
import type { WorldPlayerFilter, WorldPlayerListing } from "@/lib/world-database";

type View = "overview" | "newsroom" | "squad" | "tactics" | "fixtures" | "table" | "transfers" | "people" | "stadium" | "finance" | "clubhouse" | "academy" | "commercial" | "editor" | "settings";

const NAV_ITEMS: { id: View; label: string; icon: LucideIcon; section: string }[] = [
  { id: "overview", label: "Overview", icon: Home, section: "Club" },
  { id: "newsroom", label: "Newsroom", icon: Newspaper, section: "Club" },
  { id: "squad", label: "Squad", icon: Users, section: "Team" },
  { id: "tactics", label: "Tactics", icon: Activity, section: "Team" },
  { id: "fixtures", label: "Fixtures", icon: CalendarDays, section: "Competition" },
  { id: "table", label: "League table", icon: Trophy, section: "Competition" },
  { id: "transfers", label: "Transfers", icon: RefreshCw, section: "Recruitment" },
  { id: "people", label: "Staff & board", icon: BriefcaseBusiness, section: "Recruitment" },
  { id: "stadium", label: "Stadium architect", icon: Building2, section: "Development" },
  { id: "finance", label: "Finances", icon: Wallet, section: "Development" },
  { id: "clubhouse", label: "Clubhouse", icon: Shirt, section: "Development" },
  { id: "academy", label: "Youth academy", icon: GraduationCap, section: "Development" },
  { id: "commercial", label: "Commercial", icon: Handshake, section: "Development" },
  { id: "editor", label: "Editor", icon: Database, section: "Manager" },
  { id: "settings", label: "Settings", icon: Settings2, section: "Manager" },
];

const MONEY = (amount: number) => formatMoney(amount, true);
const KIT_PATTERNS: KitPattern[] = ["Engineered Grid", "Topographic", "Pixel Fade", "Diagonal Motion", "Contour Lines", "Split Panel", "Shadow Gradient", "Micro Dot", "Clean Block"];
const LEAGUE_SHORT_LABEL: Record<string, string> = { premier: "PREM", championship: "CHAMP", "league-one": "L1", "league-two": "L2", national: "NAT", "national-north": "NORTH", "national-south": "SOUTH" };

function leagueShortLabel(id: string) {
  return LEAGUE_SHORT_LABEL[id] ?? id.split("-").filter(Boolean).slice(0, 2).map((part) => part.slice(0, 4).toUpperCase()).join(" ");
}

function ClubCrest({ club, size = "normal" }: { club: Pick<Club, "shortName" | "colors"> & { badge?: Club["badge"] }; size?: "small" | "normal" | "large" }) {
  const badge = club.badge;
  const primary = badge?.colors?.[0] ?? club.colors[0];
  const secondary = badge?.colors?.[1] ?? club.colors[1];
  const shape = badge?.shape ?? "shield";
  const emblem = badge?.emblem ?? "star";
  const shapePath = shape === "roundel" ? "M64 5a59 59 0 1 1 0 118a59 59 0 1 1 0-118" : shape === "diamond" ? "M64 3 119 41 105 101 64 130 23 101 9 41z" : shape === "crest" ? "M15 6h98v65q-2 37-49 58Q17 108 15 71z" : "M12 7h104v55q0 43-52 65Q12 105 12 62z";
  return <span className={`club-crest crest-${size}`} aria-label={`${club.shortName} club badge`}><svg viewBox="0 0 128 136" role="img" aria-hidden="true">
    <defs><linearGradient id={`crest-${club.shortName}-metal`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff0b0" /><stop offset=".48" stopColor="#b69b51" /><stop offset="1" stopColor="#f3dea0" /></linearGradient><clipPath id={`crest-${club.shortName}-clip`}><path d={shapePath} /></clipPath><pattern id={`crest-${club.shortName}-weave`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v8" stroke={secondary} strokeOpacity=".2" strokeWidth="3" /></pattern></defs>
    <path d={shapePath} fill="#101713" stroke="#080d0a" strokeWidth="7" />
    <g clipPath={`url(#crest-${club.shortName}-clip)`}>
      <path d={shapePath} fill={primary} />
      <path d="M0 11h32v127H0zM96 0h32v138H96z" fill={secondary} opacity=".9" />
      <path d="M43 0h42v136H43z" fill={primary} opacity=".92" />
      <path d="M0 0h128v136H0z" fill={`url(#crest-${club.shortName}-weave)`} />
      {emblem === "tower" ? <g fill="#17201a" stroke={`url(#crest-${club.shortName}-metal)`} strokeWidth="2"><path d="M51 30h26v43H51zM46 26h36v8H46zM55 20h18v8H55z"/><path d="M57 39h5v9h-5zm10 0h5v9h-5zM59 57h10v16H59z" fill={secondary}/></g> : emblem === "oak" ? <g fill={`url(#crest-${club.shortName}-metal)`} stroke="#17201a" strokeWidth="1.5"><path d="M63 73V42m0 13L48 44m15 18 17-17M62 66 47 60m16 5 16-7" strokeWidth="4" fill="none"/><circle cx="47" cy="39" r="8"/><circle cx="63" cy="34" r="9"/><circle cx="80" cy="40" r="8"/><circle cx="48" cy="56" r="7"/><circle cx="79" cy="55" r="7"/></g> : emblem === "eagle" ? <path d="m25 50 18-14 15 8 6-13 7 13 15-8 18 14-21 7 12 11-23-3-8-9-8 9-23 3 12-11z" fill={`url(#crest-${club.shortName}-metal)`} stroke="#17201a" strokeWidth="2"/> : emblem === "anchor" ? <g fill="none" stroke={`url(#crest-${club.shortName}-metal)`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"><circle cx="64" cy="36" r="9"/><path d="M64 45v34m-26-18q2 22 26 22t26-22M48 55l-12 13m44-13 12 13"/><path d="M52 48h24" strokeWidth="3"/></g> : emblem === "bridge" ? <g fill="none" stroke={`url(#crest-${club.shortName}-metal)`} strokeWidth="4" strokeLinejoin="round"><path d="M34 70h60M40 65V44m48 21V44M35 44q29-28 58 0M50 44v21m28-21v21"/><path d="M44 74v8m40-8v8" strokeWidth="2"/></g> : <g fill={`url(#crest-${club.shortName}-metal)`} stroke="#17201a" strokeWidth="1.5"><path d="m64 25 8 17 19 3-14 13 4 19-17-9-17 9 4-19-14-13 19-3z"/><circle cx="64" cy="54" r="5" fill={primary}/></g>}
      <path d="M5 88h118l-9 12H14z" fill="#111a15" stroke={`url(#crest-${club.shortName}-metal)`} strokeWidth="2" />
      <text x="64" y="97" textAnchor="middle" fill="#fff4d4" fontSize="12" fontFamily="Georgia,serif" fontWeight="700" letterSpacing="2">{club.shortName}</text>
      <path d="M34 111h60" stroke={`url(#crest-${club.shortName}-metal)`} strokeWidth="2" />
      <text x="64" y="122" textAnchor="middle" fill="#f4e9c2" fontSize="8" fontFamily="Georgia,serif" fontWeight="700" letterSpacing="2">{badge?.foundingYear ?? "EST. 1900"}</text>
    </g>
    <path d={shapePath} fill="none" stroke={`url(#crest-${club.shortName}-metal)`} strokeWidth="3" />
    <path d={shapePath} fill="none" stroke="#fff5cf" strokeOpacity=".35" strokeWidth="1" transform="translate(3 3) scale(.953)" />
  </svg></span>;
}

function pageDate(date: string) {
  return formatGameDate(date);
}

function getCurrentDate(career: Career) {
  const fixture = getNextFixture(career);
  if (fixture) return pageDate(fixture.date);
  return `${2027 + career.season - 2} pre-season`;
}

function getPos(n: number) {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

function applyEditorDatabase(base: Career, draft: Career): Career {
  const next = structuredClone(base);
  const draftClubs = new Map(draft.clubs.map((club) => [club.id, club]));
  for (const club of next.clubs) {
    const edited = draftClubs.get(club.id);
    if (!edited) continue;
    club.name = edited.name;
    club.shortName = edited.shortName;
    club.city = edited.city;
    club.country = edited.country;
    club.region = edited.region;
    club.reputation = edited.reputation;
    club.targetPosition = edited.targetPosition;
    club.colors = [...edited.colors];
    club.balance = edited.balance;
    club.transferBudget = edited.transferBudget;
    club.wageBudget = edited.wageBudget;
    club.debt = edited.debt;
    club.bio = edited.bio;
    club.stadium = { ...club.stadium, name: edited.stadium.name, capacity: edited.stadium.capacity };
  }
  const draftPlayers = new Map(draft.players.map((player) => [player.id, player]));
  for (const player of next.players) {
    const edited = draftPlayers.get(player.id);
    if (!edited) continue;
    player.name = edited.name;
    player.age = edited.age;
    player.nationality = edited.nationality;
    player.position = edited.position;
    player.overall = edited.overall;
    player.potential = edited.potential;
    player.wage = edited.wage;
    player.contractYears = edited.contractYears;
    player.value = edited.value;
  }
  return next;
}

function SectionHeading({ kicker, title, detail, action }: { kicker: string; title: string; detail?: string; action?: ReactNode }) {
  return <div className="section-heading"><div><p className="eyebrow">{kicker}</p><h1>{title}</h1>{detail && <p className="muted section-detail">{detail}</p>}</div>{action}</div>;
}

function Metric({ icon: Icon, label, value, foot, accent = false }: { icon: LucideIcon; label: string; value: string; foot?: string; accent?: boolean }) {
  return <article className={`metric-card ${accent ? "metric-accent" : ""}`}><div className="metric-top"><span>{label}</span><Icon size={17} strokeWidth={1.7} /></div><strong>{value}</strong>{foot && <small>{foot}</small>}</article>;
}

export default function TheClub() {
  const [ready, setReady] = useState(false);
  const [career, setCareer] = useState<Career | null>(null);
  const [mode, setMode] = useState<"welcome" | "new" | "game" | "load" | "editor" | "settings">("welcome");
  const [view, setView] = useState<View>("overview");
  const [managerName, setManagerName] = useState("");
  const [selectedClub, setSelectedClub] = useState("WPR");
  const [selectedLeague, setSelectedLeague] = useState<LeagueId>("league-one");
  const [selectedCountry, setSelectedCountry] = useState("England");
  const [editorCareer, setEditorCareer] = useState<Career | null>(null);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);
  const [loadError, setLoadError] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [syncLabel, setSyncLabel] = useState("Saved on this device");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [navSearch, setNavSearch] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("the-club-career-v1");
      if (stored) setCareer(normalizeCareer(JSON.parse(stored) as Career));
      setSettings(readGameSettings());
    } catch {
      localStorage.removeItem("the-club-career-v1");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(GAME_SETTINGS_KEY, JSON.stringify(settings));
  }, [ready, settings]);

  useEffect(() => {
    if (ready && editorCareer) localStorage.setItem("the-club-editor-draft-v1", JSON.stringify(editorCareer));
  }, [ready, editorCareer]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setCloudReady(false);
      setSession(nextSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!ready || !session?.user.id) return;
    let cancelled = false;
    setCloudReady(false);
    setSyncLabel("Checking cloud save…");
    loadLatestOnlineCareer(session.user.id).then(async (remote) => {
      if (cancelled) return;
      if (remote) {
        setCareer(normalizeCareer(remote));
        setSyncLabel("Cloud career loaded");
      } else if (career) {
        await saveOnlineCareer(session.user.id, career);
        setSyncLabel("Cloud save connected");
      } else {
        setSyncLabel("Cloud account ready");
      }
      setCloudReady(true);
    }).catch((error: unknown) => {
      if (!cancelled) {
        setSyncLabel(error instanceof Error ? error.message : "Cloud save unavailable");
        setCloudReady(true);
      }
    });
    return () => { cancelled = true; };
    // A user ID change starts a new cloud pull; local career edits are saved below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, session?.user.id]);

  useEffect(() => {
    if (!ready || !career) return;
    if (!settings.autosave) {
      setSyncLabel("Autosave off · save manually");
      return;
    }
    localStorage.setItem("the-club-career-v1", JSON.stringify(career));
    if (!session?.user.id) {
      setSyncLabel("Saved on this device");
      return;
    }
    if (!cloudReady) return;
    const timeout = window.setTimeout(() => {
      saveOnlineCareer(session.user.id, career).then(() => setSyncLabel("Saved to your account")).catch((error: unknown) => {
        setSyncLabel(error instanceof Error ? `Cloud save error · ${error.message}` : "Cloud save error");
      });
    }, 750);
    return () => window.clearTimeout(timeout);
  }, [career, ready, session?.user.id, cloudReady, settings.autosave]);

  const startNewCareer = () => {
    let next = createCareer(managerName, selectedClub);
    let draft = editorCareer;
    if (!draft) {
      try {
        const savedDraft = localStorage.getItem("the-club-editor-draft-v1");
        if (savedDraft) draft = normalizeCareer(JSON.parse(savedDraft) as Career);
      } catch { localStorage.removeItem("the-club-editor-draft-v1"); }
    }
    if (draft) next = applyEditorDatabase(next, draft);
    setCareer(next);
    setView("overview");
    setMode("game");
  };

  const handleMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !authEmail.includes("@")) {
      setAuthMessage("Enter a valid email address to receive your sign-in link.");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: authEmail.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setAuthMessage(error ? error.message : "Sign-in link sent. Open it on this browser to turn on cloud saves.");
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
    setSession(null);
    setCloudReady(false);
    setSyncLabel("Saved on this device");
  };

  const openEditor = () => {
    if (career) {
      setView("editor");
      setMode("game");
      return;
    }
    try {
      const saved = localStorage.getItem("the-club-editor-draft-v1");
      setEditorCareer(saved ? normalizeCareer(JSON.parse(saved) as Career) : createCareer("Database Editor", selectedClub));
    } catch {
      setEditorCareer(createCareer("Database Editor", selectedClub));
    }
    setMode("editor");
  };

  const importCareer = async (file?: File) => {
    if (!file) return;
    try {
      const imported = normalizeCareer(JSON.parse(await file.text()) as Career);
      setCareer(imported);
      setMode("game");
      setView("overview");
      setLoadError("");
    } catch {
      setLoadError("That file is not a valid The Club career save.");
    }
  };

  const saveCareerManually = async () => {
    if (!career) return;
    localStorage.setItem("the-club-career-v1", JSON.stringify(career));
    if (session?.user.id) {
      try {
        await saveOnlineCareer(session.user.id, career);
        setSyncLabel("Saved to your account");
      } catch (error) {
        setSyncLabel(error instanceof Error ? `Save failed · ${error.message}` : "Cloud save failed");
      }
    } else setSyncLabel("Saved on this device");
  };

  if (!ready) return <div className="boot-screen"><ClubMark size={48} /><span>Setting the touchline…</span></div>;
  if (mode !== "game" || !career) {
    return (
      <div className="start-screen">
        <div className="start-top"><div className="wordmark"><ClubMark size={31} /><ClubWordmark /></div><button className="button button-quiet" onClick={() => setAuthOpen(true)}><Cloud size={16} /> {session ? session.user.email : "Cloud saves"}</button></div>
        <div className="start-layout">
          <div className="start-copy"><div className="live-pill"><span /> A CLUB IS BUILT EVERY DAY</div><h1>Football is a game.<br /><em>Building a club</em> is everything.</h1><p>Pick your ground. Build a squad. Put your name on a season that belongs to you.</p><div className="start-proof"><div><strong>{CLUB_OPTIONS.length.toLocaleString("en-GB")}</strong><span>clubs across the world</span></div><div><strong>{WORLD_PLAYER_COUNTRIES.length}</strong><span>countries · six continents</span></div><div><strong>∞</strong><span>seasons to build</span></div></div><div className="start-stadium-glow" /></div>
          {mode === "welcome" && career ? (
            <section className="welcome-card"><p className="eyebrow">YOUR CAREER IS READY</p><h2>Welcome back, {career.manager}</h2><div className="welcome-club"><ClubCrest club={getClub(career)} size="large" /><div><strong>{getClub(career).name}</strong><span>{getCurrentLeague(career).name} · Season {career.season}</span></div></div><button className="button button-primary button-wide" onClick={() => setMode("game")}>Continue career</button><button className="button button-secondary button-wide" onClick={() => { setLoadError(""); setMode("load"); }}>Load career</button><button className="button button-secondary button-wide" onClick={() => { if (window.confirm("Start a new career? Your current save will remain available in this browser.")) setMode("new"); }}>New career</button><button className="button button-secondary button-wide" onClick={openEditor}>Editor</button><button className="button button-secondary button-wide" onClick={() => setMode("settings")}>Settings</button><div className="local-save-note"><Save size={14} /> {syncLabel}</div></section>
          ) : mode === "new" ? (
            <section className="setup-card"><div className="setup-heading"><span className="step-count">01</span><div><p className="eyebrow">NEW CAREER</p><h2>Choose your club</h2></div></div><label className="field-label" htmlFor="manager-name">Manager name</label><input id="manager-name" className="text-input" maxLength={28} placeholder="e.g. Jamie Taylor" value={managerName} onChange={(event) => setManagerName(event.target.value)} /><label className="field-label" htmlFor="career-country">Country</label><select id="career-country" className="field-select" value={selectedCountry} onChange={(event) => { const country = event.target.value; setSelectedCountry(country); const leagues = country === "England" ? ENGLISH_LEAGUES : WORLD_LEAGUES.filter((league) => league.country === country); const nextLeague = leagues[0]; if (nextLeague) { setSelectedLeague(nextLeague.id); const firstClub = CLUB_OPTIONS.find((club) => club.leagueId === nextLeague.id); if (firstClub) setSelectedClub(firstClub.id); } }}>{WORLD_PLAYER_COUNTRIES.map((country) => <option key={country}>{country}</option>)}</select><label className="field-label" htmlFor="career-league">League</label><select id="career-league" className="field-select" value={selectedLeague} onChange={(event) => { const leagueId = event.target.value as LeagueId; setSelectedLeague(leagueId); const firstClub = CLUB_OPTIONS.find((club) => club.leagueId === leagueId); if (firstClub) setSelectedClub(firstClub.id); }}>{(selectedCountry === "England" ? ENGLISH_LEAGUES : WORLD_LEAGUES.filter((league) => league.country === selectedCountry)).map((league) => <option key={league.id} value={league.id}>{league.name} · {league.clubs} clubs</option>)}</select><div className="club-picker-heading"><span>{(selectedCountry === "England" ? ENGLISH_LEAGUES : WORLD_LEAGUES.filter((league) => league.country === selectedCountry)).find((league) => league.id === selectedLeague)?.name} · {selectedCountry}</span><span>{CLUB_OPTIONS.filter((club) => club.leagueId === selectedLeague).length} clubs</span></div><div className="club-picker">{CLUB_OPTIONS.filter((club) => club.leagueId === selectedLeague).map((club) => <button key={club.id} onClick={() => setSelectedClub(club.id)} className={`club-choice ${selectedClub === club.id ? "selected" : ""}`}><ClubCrest club={{ shortName: club.id, colors: club.colors }} size="small" /><span><strong>{club.name}</strong><small>{club.city} · {club.region} · {club.capacity.toLocaleString("en-GB")}</small></span>{selectedClub === club.id && <Check size={16} className="choice-check" />}</button>)}</div><button className="button button-primary button-wide start-career" onClick={startNewCareer}>Begin your career <Sparkles size={16} /></button><button className="button button-quiet button-wide" onClick={() => setMode(career ? "welcome" : "welcome")}>Back</button></section>
          ) : mode === "load" ? (
            <section className="setup-card"><div className="setup-heading"><span className="step-count"><Save size={17} /></span><div><p className="eyebrow">LOAD CAREER</p><h2>Return to a save</h2></div></div>{career ? <div className="welcome-club"><ClubCrest club={getClub(career)} size="large" /><div><strong>{getClub(career).name}</strong><span>{career.manager} · Season {career.season} · {syncLabel}</span></div></div> : <p className="setup-intro">No career is saved in this browser yet. Import a career file to continue on this device.</p>}{career && <button className="button button-primary button-wide" onClick={() => setMode("game")}>Load saved career</button>}<label className="button button-secondary button-wide import-career-button">Import career file<input type="file" accept="application/json,.json" onChange={(event) => { void importCareer(event.target.files?.[0]); }} /></label>{loadError && <p className="form-error">{loadError}</p>}<button className="button button-quiet button-wide" onClick={() => setMode("welcome")}>Back</button></section>
          ) : mode === "editor" && editorCareer ? (
            <div className="landing-tool-panel"><DatabaseEditor career={editorCareer} setCareer={setEditorCareer} onBack={() => setMode("welcome")} startFromEditor /></div>
          ) : mode === "settings" ? (
            <div className="landing-tool-panel"><SettingsPanel settings={settings} onChange={setSettings} onBack={() => setMode("welcome")} /></div>
          ) : (
            <section className="setup-card welcome-first"><div className="setup-heading"><span className="step-count"><Flag size={17} /></span><div><p className="eyebrow">A NEW CHAPTER</p><h2>Take the chair</h2></div></div><p className="setup-intro">The board has a plan. The supporters have hope. Start with a club and give them a season to remember.</p><button className="button button-primary button-wide" onClick={() => setMode("new")}>New career <Plus size={16} /></button><button className="button button-secondary button-wide" onClick={() => { setLoadError(""); setMode("load"); }}>Load career <Save size={15} /></button><button className="button button-secondary button-wide" onClick={openEditor}>Editor <Database size={15} /></button><button className="button button-secondary button-wide" onClick={() => setMode("settings")}>Settings <Settings2 size={15} /></button><button className="button button-quiet button-wide" onClick={() => setAuthOpen(true)}><Cloud size={16} /> Set up cloud saves</button><p className="local-note">Careers save automatically in this browser.</p></section>
          )}
        </div>
        <div className="start-footer"><span>EST. 2026</span><span>THE GAME BELONGS TO YOU</span><span>PLAY AT YOUR PACE</span></div>
        {authOpen && <CloudModal session={session} email={authEmail} setEmail={setAuthEmail} message={authMessage} setMessage={setAuthMessage} onClose={() => setAuthOpen(false)} onSubmit={handleMagicLink} onSignOut={signOut} />}
      </div>
    );
  }

  return <CareerLayout career={career} setCareer={setCareer} view={view} setView={setView} session={session} syncLabel={syncLabel} settings={settings} onSettingsChange={setSettings} onManualSave={saveCareerManually} onCloud={() => setAuthOpen(true)} authOpen={authOpen} setAuthOpen={setAuthOpen} authEmail={authEmail} setAuthEmail={setAuthEmail} authMessage={authMessage} setAuthMessage={setAuthMessage} onMagicLink={handleMagicLink} onSignOut={signOut} mobileNav={mobileNav} setMobileNav={setMobileNav} navSearch={navSearch} setNavSearch={setNavSearch} />;
}

function CloudModal({ session, email, setEmail, message, setMessage, onClose, onSubmit, onSignOut }: {
  session: Session | null; email: string; setEmail: (value: string) => void; message: string; setMessage: (value: string) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onSignOut: () => void;
}) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal-card auth-modal"><button className="modal-close" aria-label="Close" onClick={onClose}><X size={18} /></button><div className="modal-icon"><Cloud size={20} /></div><p className="eyebrow">CAREER BACKUP</p><h2>{session ? "Cloud save connected" : "Take your career anywhere"}</h2>{session ? <><p>Your careers are syncing to {session.user.email}. They’ll be ready when you return on another device.</p><div className="cloud-state"><BadgeCheck size={16} /> Cloud sync active</div><div className="modal-actions"><button className="button button-secondary" onClick={onSignOut}>Sign out</button><button className="button button-primary" onClick={onClose}>Done</button></div></> : isSupabaseConfigured ? <form onSubmit={onSubmit}><p>We’ll send a one-time sign-in link. Your career stays private to your account.</p><label className="field-label" htmlFor="cloud-email">Email address</label><input id="cloud-email" className="text-input" type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setMessage(""); }} placeholder="you@example.com" required /><button className="button button-primary button-wide modal-submit" type="submit"><Mail size={15} /> Send sign-in link</button>{message && <p className="form-message">{message}</p>}</form> : <><p>Cloud saves need a Supabase project and its public connection keys. Until that is connected, your career is saved on this browser and can be continued here.</p><div className="setup-note"><span className="note-icon"><Lightbulb size={15} /></span><span>Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> after the project is connected.</span></div><p className="muted">Never add a Supabase secret key to the browser app.</p><button className="button button-primary button-wide" onClick={onClose}>Got it</button></>}</section></div>;
}

function CareerLayout({ career, setCareer, view, setView, session, syncLabel, settings, onSettingsChange, onManualSave, onCloud, authOpen, setAuthOpen, authEmail, setAuthEmail, authMessage, setAuthMessage, onMagicLink, onSignOut, mobileNav, setMobileNav, navSearch, setNavSearch }: {
  career: Career; setCareer: (career: Career) => void; view: View; setView: (view: View) => void; session: Session | null; syncLabel: string; settings: GameSettings; onSettingsChange: (settings: GameSettings) => void; onManualSave: () => void; onCloud: () => void; authOpen: boolean; setAuthOpen: (open: boolean) => void; authEmail: string; setAuthEmail: (email: string) => void; authMessage: string; setAuthMessage: (message: string) => void; onMagicLink: (event: FormEvent<HTMLFormElement>) => void; onSignOut: () => void; mobileNav: boolean; setMobileNav: (open: boolean) => void; navSearch: string; setNavSearch: (search: string) => void;
}) {
  handleCareerNavigation(setView);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.querySelector<HTMLInputElement>(".nav-search-wrap input")?.focus();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  const club = getClub(career);
  const nextFixture = getNextFixture(career);
  const [profilePlayerId, setProfilePlayerId] = useState<string | null>(null);
  const profilePlayer = profilePlayerId ? career.players.find((player) => player.id === profilePlayerId) ?? getWorldPlayerDetails(profilePlayerId) : null;
  const profileReport = profilePlayerId ? getScoutingReport(career, profilePlayerId) : null;
  const filteredNav = NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(navSearch.toLowerCase()));
  const activeTitle = NAV_ITEMS.find((item) => item.id === view)?.label ?? "Overview";
  const activeLeague = getCurrentLeague(career);
  const seasonEnd = career.round > activeLeague.rounds;
  const nextAction = () => setCareer(seasonEnd ? beginNextSeason(career) : playMatchday(career));

  return <div className="app-shell">
    {mobileNav && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileNav(false)} />}
    <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
      <div className="sidebar-brand"><ClubMark size={29} /><ClubWordmark compact /><button className="mobile-close" aria-label="Close menu" onClick={() => setMobileNav(false)}><X size={19} /></button></div>
      <button className="club-selector" onClick={() => setView("overview")}><ClubCrest club={club} size="small" /><span className="club-selector-copy"><strong>{club.name}</strong><small>{activeLeague.name} · {2026 + career.season - 1}/{String(2027 + career.season - 1).slice(-2)}</small></span><ChevronDown size={15} /></button>
      <div className="nav-search-wrap"><Search size={15} /><input aria-label="Find a section" value={navSearch} onChange={(event) => setNavSearch(event.target.value)} placeholder="Find a section" /><kbd>⌘ K</kbd></div>
      <nav className="main-nav">{["Club", "Team", "Competition", "Recruitment", "Development", "Manager"].map((section) => {
        const links = filteredNav.filter((item) => item.section === section);
        if (!links.length) return null;
        return <div className="nav-group" key={section}><p className="nav-label">{section}</p>{links.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-link ${view === id ? "active" : ""}`} onClick={() => { setView(id); setMobileNav(false); }}><Icon size={17} strokeWidth={1.7} /><span>{label}</span>{id === "stadium" && <span className="nav-badge">NEW</span>}</button>)}</div>;
      })}</nav>
      <div className="sidebar-bottom"><div className="club-trust"><div className="trust-header"><span>Board confidence</span><strong>{club.boardTrust}%</strong></div><div className="progress-track"><span style={{ width: `${club.boardTrust}%` }} /></div><small>{club.boardTrust >= 60 ? "The board is behind you" : club.boardTrust >= 35 ? "Results are being watched" : "Your position is at risk"}</small></div><button className="user-row" onClick={onCloud}><span className="user-avatar">{career.manager.split(" ").map((word) => word[0]).slice(0, 2).join("").toUpperCase()}</span><span className="user-copy"><strong>{career.manager}</strong><small>{session ? "Cloud connected" : "Local career"}</small></span><ChevronDown size={14} /></button></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="topbar-left"><button className="menu-toggle" aria-label="Open menu" onClick={() => setMobileNav(true)}><Menu size={20} /></button><div className="top-crumb"><span>MY CLUB</span><b>/</b><strong>{activeTitle}</strong></div></div><div className="topbar-right"><div className="round-indicator"><CalendarDays size={15} /><span>{seasonEnd ? "Season complete" : `Round ${career.round} / ${activeLeague.rounds}`}</span></div><div className="top-divider" /><div className="save-indicator" title={syncLabel}><span className={session ? "save-dot online" : "save-dot"} /><span>{settings.autosave ? session ? "Cloud saved" : "Auto-saved" : "Unsaved changes"}</span></div><button className="button button-primary advance-button" onClick={nextAction} disabled={career.unemployed}>{seasonEnd ? "Start pre-season" : "Advance to matchday"}<Clock3 size={15} /></button></div></header>
      <main className="content-area">
        {career.unemployed && <JobSearch career={career} setCareer={setCareer} />}
        {!career.unemployed && view === "overview" && <Overview career={career} setCareer={setCareer} onAdvance={nextAction} seasonEnd={seasonEnd} />}
        {view === "newsroom" && <Newsroom career={career} setView={setView} />}
        {(view === "squad" || view === "tactics") && <SquadTacticsArea career={career} setCareer={setCareer} onPlayerProfile={setProfilePlayerId} view={view} setView={setView} />}
        {view === "fixtures" && <Fixtures career={career} setCareer={setCareer} onAdvance={nextAction} seasonEnd={seasonEnd} />}
        {view === "table" && <LeagueTable career={career} />}
        {view === "transfers" && <Transfers career={career} setCareer={setCareer} onPlayerProfile={setProfilePlayerId} />}
        {view === "people" && <StaffManagement career={career} setCareer={setCareer} />}
        {view === "stadium" && <StadiumArchitect career={career} setCareer={setCareer} />}
        {view === "finance" && <Finance career={career} setCareer={setCareer} />}
        {view === "clubhouse" && <Clubhouse career={career} setCareer={setCareer} />}
        {view === "academy" && <Academy career={career} setCareer={setCareer} onPlayerProfile={setProfilePlayerId} />}
        {view === "commercial" && <Commercial career={career} setCareer={setCareer} />}
        {view === "editor" && <DatabaseEditor career={career} setCareer={setCareer} onBack={() => setView("overview")} />}
        {view === "settings" && <SettingsPanel settings={settings} onChange={onSettingsChange} inCareer onBack={() => setView("overview")} />}
      </main>
      <footer className="app-footer"><span><span className="footer-mark" /> THE CLUB · SEASON {career.season}</span><div className="footer-actions"><button className="footer-save" onClick={onManualSave}><Save size={14} /> Save career</button><button className="footer-save" onClick={onCloud}><Cloud size={14} /> {session ? "Cloud account" : "Cloud saves"}</button></div></footer>
    </div>
    {authOpen && <CloudModal session={session} email={authEmail} setEmail={setAuthEmail} message={authMessage} setMessage={setAuthMessage} onClose={() => setAuthOpen(false)} onSubmit={onMagicLink} onSignOut={onSignOut} />}
    {profilePlayer && <PlayerProfile player={profilePlayer} report={profileReport} known={!profilePlayerId?.startsWith("world-") || Boolean(profileReport)} onClose={() => setProfilePlayerId(null)} />}
  </div>;
}

function Overview({ career, setCareer, onAdvance, seasonEnd }: { career: Career; setCareer: (career: Career) => void; onAdvance: () => void; seasonEnd: boolean }) {
  const club = getClub(career);
  const league = getCurrentLeague(career);
  const table = getTable(career);
  const rank = table.findIndex((row) => row.clubId === career.clubId) + 1;
  const nextFixture = getNextFixture(career);
  const homeClub = nextFixture ? getClub(career, nextFixture.homeClubId) : null;
  const awayClub = nextFixture ? getClub(career, nextFixture.awayClubId) : null;
  const currentRow = table.find((row) => row.clubId === career.clubId)!;
  const pressureSignals = getBoardPressureSignals(career);
  const recentNews = career.news.slice(0, 4);
  const [reportDismissed, setReportDismissed] = useState(false);

  return <>
    <SectionHeading kicker={getCurrentDate(career).toUpperCase()} title={`Good morning, ${career.manager.split(" ")[0]}`} detail={`${club.name} · ${league.name} · ${2026 + career.season - 1}/${String(2027 + career.season - 1).slice(-2)}`} action={<button className="button button-secondary" onClick={() => { setCareer(sponsorProposal(career)); document.dispatchEvent(new CustomEvent("the-club-view", { detail: "finance" })); }}><Megaphone size={15} /> Commercial meeting</button>} />
    <div className="metrics-grid"><Metric icon={Trophy} label="League position" value={getPos(rank)} foot={`${currentRow.points} points · ${currentRow.played} played`} accent /><Metric icon={Banknote} label="Club balance" value={MONEY(club.balance)} foot={`${MONEY(club.transferBudget)} transfer budget`} /><Metric icon={Shield} label="Board confidence" value={`${club.boardTrust}%`} foot={club.boardTrust >= 60 ? "Secure" : "Under review"} /><Metric icon={Users} label="Supporter confidence" value={`${club.supporterConfidence}%`} foot="Season average" /></div>
    <section className={`pressure-panel ${career.pressure! >= 70 ? "pressure-high" : ""}`}><div className="pressure-copy"><div><p className="eyebrow">PRESSURE FACTORS</p><strong>Managerial pressure</strong><small>Results, press coverage, supporter confidence, player rapport and the club target all shape this measure.</small></div><b>{(career.pressure ?? 18).toFixed(1)}<span> / 100</span></b></div><div className="pressure-meter" role="meter" aria-label="Managerial pressure" aria-valuemin={0} aria-valuemax={100} aria-valuenow={career.pressure ?? 18}><i style={{ width: `${career.pressure ?? 18}%` }} /></div><div className="pressure-signals"><span>FORM <b>+{pressureSignals.form.toFixed(1)}</b></span><span>PRESS <b>+{(pressureSignals.press * 0.62).toFixed(1)}</b></span><span>SUPPORTERS <b>+{(pressureSignals.supporters * 0.65).toFixed(1)}</b></span><span>PLAYERS <b>+{(pressureSignals.players * 0.7).toFixed(1)}</b></span><span>BOARD TARGET <b>+{(pressureSignals.expectations * 0.8).toFixed(1)}</b></span></div><div className="pressure-foot"><span>Current run without a win <strong>{career.winlessRun ?? 0} match{(career.winlessRun ?? 0) === 1 ? "" : "es"}</strong></span><span>{pressureSignals.averageRapport}% average rapport · supporters {club.supporterConfidence}%</span></div></section>
    <div className="overview-grid"><section className="next-match-card"><div className="match-topline"><div className="match-label"><span className="match-live-dot" /> NEXT MATCH</div><span>{seasonEnd ? "PRE-SEASON" : career.round > league.rounds ? "WORLD WEEK " + career.round : league.name.toUpperCase() + " · ROUND " + career.round}</span></div>{nextFixture && homeClub && awayClub ? <><div className="match-date">{pageDate(nextFixture.date)} <span>·</span> {formatGameTime(15)} <span>·</span> {nextFixture.homeClubId === career.clubId ? "Home" : "Away"}</div><div className="match-sides"><div className="match-team"><ClubCrest club={homeClub} size="large" /><strong>{homeClub.name}</strong><small>HOME</small></div><div className="match-vs"><span>VS</span><i /></div><div className="match-team"><ClubCrest club={awayClub} size="large" /><strong>{awayClub.name}</strong><small>AWAY</small></div></div><div className="match-bottom"><span><MapPin size={14} /> {nextFixture.homeClubId === career.clubId ? club.stadium.name : awayClub.city}</span><button className="button button-primary" onClick={onAdvance}>Play matchday <Flag size={15} /></button></div></> : seasonEnd ? <div className="season-end-card"><div className="season-end-icon"><Trophy size={22} /></div><div><strong>That’s the season</strong><p>Take a look back, then prepare your squad for a new campaign.</p></div><button className="button button-primary" onClick={onAdvance}>Start next season <RefreshCw size={15} /></button></div> : <div className="world-rest-card"><span className="eyebrow">WORLD WEEK {career.round} OF {getSeasonWeekCount()}</span><strong>No league fixture this week</strong><p>Your {league.name} season is complete; the other divisions are finishing their campaign.</p><button className="button button-secondary" onClick={onAdvance}>Advance the world <Clock3 size={15} /></button></div>}{career.lastReport && !reportDismissed && <div className="match-report"><div className="report-icon"><Newspaper size={15} /></div><div><small>MATCH REPORT · {career.lastReport.result}</small><strong>{career.lastReport.headline}</strong><span>{career.lastReport.notes[0]}</span></div><button aria-label="Dismiss report" onClick={() => setReportDismissed(true)}><X size={15} /></button></div>}</section>
      <section className="table-card"><div className="card-heading"><div><p className="eyebrow">THE RUN-IN</p><h2>League table</h2></div><button className="text-button" onClick={() => document.dispatchEvent(new CustomEvent("the-club-view", { detail: "table" }))}>Full table</button></div><div className="mini-table-head"><span>#</span><span>Club</span><span>P</span><span>GD</span><span>Pts</span></div><div className="mini-table-body">{table.filter((row) => row.clubId !== career.clubId).slice(0, 4).map((row) => { const position = table.findIndex((entry) => entry.clubId === row.clubId) + 1; return <div key={row.clubId} className="mini-table-row"><span className="table-rank">{position}</span><span className="mini-club-name"><ClubCrest club={getClub(career, row.clubId)} size="small" />{row.club}</span><span>{row.played}</span><span className={row.goalsFor - row.goalsAgainst < 0 ? "negative" : ""}>{row.goalsFor - row.goalsAgainst > 0 ? "+" : ""}{row.goalsFor - row.goalsAgainst}</span><strong>{row.points}</strong></div>; })}</div><div className="table-cutline"><span>YOUR CLUB</span><i /></div><div className="mini-table-row current-last current"><span className="table-rank">{rank}</span><span className="mini-club-name"><ClubCrest club={club} size="small" />{club.name}</span><span>{currentRow.played}</span><span>{currentRow.goalsFor - currentRow.goalsAgainst > 0 ? "+" : ""}{currentRow.goalsFor - currentRow.goalsAgainst}</span><strong>{currentRow.points}</strong></div></section></div>
    <div className="lower-grid"><section className="news-card"><div className="card-heading"><div><p className="eyebrow">AROUND THE GROUND</p><h2>Club news</h2></div><button className="text-button" onClick={() => document.dispatchEvent(new CustomEvent("the-club-view", { detail: "newsroom" }))}>Open newsroom</button></div><div className="news-list">{recentNews.map((news) => <article key={news.id} className="news-item"><span className={`news-type type-${news.type}`}>{news.type === "match" ? <Flag size={15} /> : news.type === "stadium" ? <Building2 size={15} /> : news.type === "transfer" ? <RefreshCw size={15} /> : <Megaphone size={15} />}</span><div><small>{news.date} · {news.type.toUpperCase()}</small><strong>{news.headline}</strong><p>{news.body}</p></div></article>)}</div></section><section className="club-focus-card"><div className="card-heading"><div><p className="eyebrow">A CLUB WORTH BUILDING</p><h2>On and off the pitch</h2></div><Sparkles size={17} /></div><div className="focus-row"><span className="focus-icon"><Building2 size={16} /></span><div><strong>{club.stadium.name}</strong><small>{club.stadium.capacity.toLocaleString("en-GB")} capacity · {club.stadium.tiers} tier{club.stadium.tiers === 1 ? "" : "s"}</small></div><button className="focus-open" onClick={() => document.dispatchEvent(new CustomEvent("the-club-view", { detail: "stadium" }))}>Design</button></div><div className="focus-row"><span className="focus-icon"><Store size={16} /></span><div><strong>{club.sponsor}</strong><small>{MONEY(club.sponsorAnnual)} annual sponsor</small></div><button className="focus-open" onClick={() => { setCareer(sponsorProposal(career)); document.dispatchEvent(new CustomEvent("the-club-view", { detail: "finance" })); }}>Negotiate</button></div><div className="target-box"><span className="target-icon"><TargetIcon /></span><div><small>BOARD SEASON TARGET</small><strong>Finish in the top {club.targetPosition}</strong></div><span className={`target-status ${rank <= club.targetPosition ? "on-target" : "off-target"}`}>{rank <= club.targetPosition ? "ON COURSE" : "NEED A RUN"}</span></div></section></div>
    <ClubHeritageCard club={club} career={career} />
  </>;
}

type NewsroomStory = { id: string; date: string; headline: string; body: string; type: "match" | "club" | "transfer" | "stadium" | "press"; league?: string; route: View; score?: string };

function Newsroom({ career, setView }: { career: Career; setView: (view: View) => void }) {
  const club = getClub(career);
  const [leagueId, setLeagueId] = useState<LeagueId>(club.leagueId as LeagueId);
  const [category, setCategory] = useState<"all" | NewsroomStory["type"]>("all");
  const [query, setQuery] = useState("");
  const [expandedStory, setExpandedStory] = useState<string | null>(null);
  const availableLeagues = [...ENGLISH_LEAGUES, ...WORLD_LEAGUES.filter((league) => career.clubs.some((entry) => entry.leagueId === league.id))];
  const leagueTables = useMemo(() => availableLeagues.map((league) => ({ league, rows: getTable(career, league.id) })), [career]);
  const selectedLeague = leagueTables.find((entry) => entry.league.id === leagueId) ?? leagueTables[0];
  const playedInDivision = career.fixtures.filter((fixture) => fixture.leagueId === leagueId && fixture.played && fixture.homeGoals !== null && fixture.awayGoals !== null);
  const latestDivisionRound = playedInDivision.reduce((latest, fixture) => Math.max(latest, fixture.round), 0);
  const matchdayFixtures = (latestDivisionRound
    ? playedInDivision.filter((fixture) => fixture.round === latestDivisionRound)
    : career.fixtures.filter((fixture) => fixture.leagueId === leagueId && fixture.round === career.round))
    .sort((first, second) => first.date.localeCompare(second.date));
  const matchdayCaption = latestDivisionRound ? `ROUND ${latestDivisionRound} · FULL TIME` : `ROUND ${career.round} · UPCOMING`;
  const scoreStories: NewsroomStory[] = matchdayFixtures.filter((fixture) => fixture.homeGoals !== null && fixture.awayGoals !== null).slice(0, 8).map((fixture) => {
    const home = getClub(career, fixture.homeClubId);
    const away = getClub(career, fixture.awayClubId);
    const result = `${fixture.homeGoals}–${fixture.awayGoals}`;
    return { id: `world-${fixture.id}`, date: fixture.date, headline: `${home.name} ${result} ${away.name}`, body: `${selectedLeague.league.name} · Round ${fixture.round}. ${home.name} and ${away.name} share the latest chapter of the title race.`, type: "match", league: leagueShortLabel(leagueId), route: "fixtures", score: result };
  });
  const personalStories: NewsroomStory[] = career.news.map((item) => ({
    ...item,
    route: item.type === "match" ? "fixtures" : item.type === "transfer" ? "transfers" : item.type === "stadium" ? "stadium" : item.type === "press" ? "overview" : "clubhouse",
  }));
  const allStories = [...personalStories, ...scoreStories.filter((story) => !matchdayFixtures.some((fixture) => (fixture.homeClubId === career.clubId || fixture.awayClubId === career.clubId) && story.id === `world-${fixture.id}`))];
  const filteredStories = allStories.filter((story) => (category === "all" || story.type === category) && (!query.trim() || `${story.headline} ${story.body} ${story.league ?? ""}`.toLowerCase().includes(query.trim().toLowerCase())));
  const lead: NewsroomStory = scoreStories[0] ?? personalStories[0] ?? { id: "season-start", date: "Pre-season", headline: "A new season is taking shape", body: `${club.name} begin the campaign with a full schedule ahead. Follow results, deals and the stories shaping the English pyramid.`, type: "club", route: "overview" };
  const transfers = personalStories.filter((story) => story.type === "transfer").slice(0, 3);
  const leader = selectedLeague.rows[0];
  const runnerUp = selectedLeague.rows[1];
  const pressureSignals = getBoardPressureSignals(career);
  const leagueWatch = leagueTables.map(({ league, rows }) => ({ league, leader: rows[0] }));

  return <div className="newsroom-page">
    <header className="newsroom-heading"><div><p className="eyebrow">THE CLUB · WORLD DESK</p><h1>Newsroom</h1><p>Every result, rumour and turning point from the world you’re building.</p></div><div className="newsroom-live"><i /> SEASON {career.season} · {getCurrentDate(career).toUpperCase()}<span>LIVE CAREER FEED</span></div></header>

    <div className="news-league-ticker" aria-label="League table leaders">
      <div className="news-ticker-label"><span>THE RACE</span><small>{leagueTables.length} LIVE LEAGUES · {WORLD_COUNTRIES.length} NATIONS</small></div>
      <div className="news-ticker-options">{leagueWatch.map(({ league, leader: divisionLeader }) => <button type="button" key={league.id} className={leagueId === league.id ? "selected" : ""} onClick={() => setLeagueId(league.id)} aria-pressed={leagueId === league.id} title={`${league.name} leader`}><span>{leagueShortLabel(league.id)}</span><strong>{divisionLeader?.club ?? "—"}</strong><small>{divisionLeader?.points ?? 0} PTS</small></button>)}</div>
    </div>

    <div className="newsroom-top-grid">
      <article className={`news-lead type-${lead.type}`}>
        <div className="news-lead-art" aria-hidden="true"><div className="news-art-lines" /><span className="news-art-word">THE<br />CLUB</span><span className="news-art-orbit" /></div>
        <div className="news-lead-copy"><div className="news-lead-kicker"><span>{lead.type === "press" ? "PRESSURE WATCH" : lead.type === "match" ? "MATCHDAY LEAD" : lead.type === "transfer" ? "TRANSFER DESK" : "THE LEAD STORY"}</span><time>{lead.date}</time></div><h2>{lead.headline}</h2><p>{lead.body}</p><div className="news-lead-footer"><span><ClubCrest club={club} size="small" /> {club.name} · {leagueShortLabel(club.leagueId)}</span><button className="button button-primary" onClick={() => setView(lead.route)}>{lead.type === "match" ? "Open match centre" : lead.type === "transfer" ? "Open recruitment" : lead.type === "stadium" ? "Visit the ground" : "Open club desk"}</button></div></div>
      </article>
      <section className="news-race-card"><div className="news-block-heading"><div><p className="eyebrow">TABLE WATCH</p><h2>{selectedLeague.league.name}</h2></div><Trophy size={18} /></div><p className="news-race-caption">THE PROMOTION AND TITLE PICTURE</p>{selectedLeague.rows.slice(0, 4).map((row, index) => <div className={`news-race-row ${row.clubId === career.clubId ? "your-club" : ""}`} key={row.clubId}><span className="race-position">{String(index + 1).padStart(2, "0")}</span><span className="race-team"><ClubCrest club={getClub(career, row.clubId)} size="small" /><strong>{row.club}</strong></span><span className="race-record">{row.played}P · {row.goalsFor - row.goalsAgainst > 0 ? "+" : ""}{row.goalsFor - row.goalsAgainst}GD</span><b>{row.points}</b></div>)}<div className="race-gap-note">{leader && runnerUp ? `${leader.points - runnerUp.points} point${leader.points - runnerUp.points === 1 ? "" : "s"} separate first and second.` : "The table will take shape after the opening round."}</div><button className="text-button" onClick={() => setView("table")}>Open league table</button></section>
    </div>

    <section className="news-match-centre"><div className="news-match-heading"><div><p className="eyebrow">SCORES & FIXTURES</p><h2>Match centre</h2></div><div><label htmlFor="news-league-select">Competition</label><select id="news-league-select" className="compact-select" value={selectedLeague.league.id} onChange={(event) => setLeagueId(event.target.value as LeagueId)}>{availableLeagues.map((league) => <option value={league.id} key={league.id}>{league.name}</option>)}</select><button className="text-button" onClick={() => setView("fixtures")}>Full fixtures</button></div></div><div className="news-match-status"><span>{matchdayCaption}</span><small>{selectedLeague.league.name} · {matchdayFixtures.length} matches</small></div><div className="news-scores">{matchdayFixtures.slice(0, 6).map((fixture) => { const home = getClub(career, fixture.homeClubId); const away = getClub(career, fixture.awayClubId); return <button type="button" className="news-score-card" key={fixture.id} onClick={() => setView("fixtures")} aria-label={`View ${home.name} against ${away.name} in fixtures`}><span className="score-club"><ClubCrest club={home} size="small" /><strong>{home.shortName}</strong></span><span className="scoreline">{fixture.played && fixture.homeGoals !== null && fixture.awayGoals !== null ? `${fixture.homeGoals}–${fixture.awayGoals}` : "v"}</span><span className="score-club"><ClubCrest club={away} size="small" /><strong>{away.shortName}</strong></span><small>{fixture.played ? "FULL TIME" : "UP NEXT"}</small></button>; })}{!matchdayFixtures.length && <div className="news-no-matches"><CalendarDays size={18} /><span>No fixtures are scheduled for this division this week.</span></div>}</div></section>

    <div className="newsroom-lower-grid">
      <section className="news-feed-panel"><div className="news-feed-heading"><div><p className="eyebrow">ACROSS THE PYRAMID</p><h2>Latest stories</h2></div><span>{filteredStories.length} stories</span></div><div className="news-filters" role="group" aria-label="Filter news stories">{([ ["all", "All"], ["match", "Results"], ["transfer", "Transfers"], ["club", "Club"], ["press", "Pressure"], ["stadium", "Stadium"] ] as const).map(([value, label]) => <button type="button" key={value} className={category === value ? "active" : ""} onClick={() => setCategory(value)} aria-pressed={category === value}>{label}</button>)}<label className="news-search"><Search size={15} /><input aria-label="Search news" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search headlines" /></label></div><div className="news-story-list">{filteredStories.slice(0, 20).map((story) => <article className="news-story-row" key={story.id}><span className={`news-story-mark type-${story.type}`}>{story.type === "match" ? <Flag size={16} /> : story.type === "transfer" ? <RefreshCw size={16} /> : story.type === "stadium" ? <Building2 size={16} /> : story.type === "press" ? <Megaphone size={16} /> : <Newspaper size={16} />}</span><div className="news-story-content"><div className="news-story-meta"><span>{story.league ?? story.type.toUpperCase()}</span><time>{story.date}</time></div><h3>{story.headline}</h3><p>{expandedStory === story.id ? story.body : story.body.length > 116 ? `${story.body.slice(0, 116).trimEnd()}…` : story.body}</p>{expandedStory === story.id && <button className="news-story-action" onClick={() => setView(story.route)}>{story.type === "match" ? "View fixtures" : story.type === "transfer" ? "Open recruitment" : story.type === "stadium" ? "Open stadium architect" : story.type === "club" ? "Open club profile" : "Review club overview"}</button>}</div><button className="news-read-button" type="button" aria-expanded={expandedStory === story.id} onClick={() => setExpandedStory(expandedStory === story.id ? null : story.id)}>{expandedStory === story.id ? "Close" : "Read story"}</button></article>)}{!filteredStories.length && <div className="news-empty"><Newspaper size={22} /><strong>No stories match this view</strong><span>Try another desk or clear your search.</span><button className="text-button" onClick={() => { setCategory("all"); setQuery(""); }}>Reset filters</button></div>}</div></section>
      <aside className="news-side-desk">
        <section className="news-transfer-desk"><div className="news-block-heading"><div><p className="eyebrow">THE MARKET</p><h2>Transfer desk</h2></div><RefreshCw size={17} /></div>{transfers.length ? transfers.map((story) => <article className="transfer-news-item" key={story.id}><small>{story.date} · DEAL</small><strong>{story.headline}</strong><p>{story.body}</p></article>) : <div className="transfer-desk-empty"><span className="transfer-desk-icon"><RefreshCw size={20} /></span><strong>The market is waiting</strong><p>Deals made in your career appear here. Scout players to turn rumours into informed decisions.</p></div>}<button className="button button-secondary button-wide" onClick={() => setView("transfers")}>Open recruitment hub</button></section>
        <section className="news-pressure-desk"><div className="news-block-heading"><div><p className="eyebrow">CLUB IN FOCUS</p><h2>The mood around {club.shortName}</h2></div><Activity size={17} /></div><div className="news-pressure-score"><strong>{(career.pressure ?? 18).toFixed(1)}<small>/100</small></strong><span>MANAGER PRESSURE</span></div><div className="news-pressure-meter"><i style={{ width: `${career.pressure ?? 18}%` }} /></div><div className="news-pressure-factors"><span>Form <b>{(career.winlessRun ?? 0)} without a win</b></span><span>Supporters <b>{club.supporterConfidence}% confidence</b></span><span>Players <b>{pressureSignals.averageRapport}% rapport</b></span></div><button className="news-pressure-link" onClick={() => setView("overview")}>Read the latest club briefing</button></section>
      </aside>
    </div>
  </div>;
}

function ClubHeritageCard({ club, career }: { club: Club; career: Career }) {
  const rivals = (club.rivals ?? []).map((id) => career.clubs.find((candidate) => candidate.id === id)).filter((rival): rival is Club => Boolean(rival));
  const moments = club.history?.slice(-3).reverse() ?? [];
  return <section className="panel club-heritage-panel">
    <div className="heritage-heading"><div><p className="eyebrow">ROOTED IN {club.region.toUpperCase()}</p><h2>{club.name} <span>{club.nickname}</span></h2></div><ClubCrest club={club} size="large" /></div>
    <div className="heritage-summary"><div className="heritage-foundation"><span>EST.</span><strong>{club.foundedYear}</strong><small>{club.city} · {club.country}</small></div><p>{club.bio}</p></div>
    <div className="heritage-columns"><div><small className="eyebrow">MILESTONES</small><div className="heritage-timeline">{moments.map((moment) => <article key={moment.year + moment.title}><span>{moment.year}</span><div><strong>{moment.title}</strong><p>{moment.detail}</p></div></article>)}</div></div><div className="heritage-links"><small className="eyebrow">LOCAL CONNECTIONS</small><strong>Nearby rivalry</strong>{rivals.length ? rivals.map((rival) => <span className="heritage-rival" key={rival.id}>{rival.name}<small>{rival.city} · {rival.region}</small></span>) : <span className="heritage-rival">The county derby circuit<small>{club.region} · England</small></span>}<strong>Current shirt partner</strong><span className="heritage-sponsor"><Handshake size={15} />{club.sponsor}<small>Based in {club.city} · {MONEY(club.sponsorAnnual)} / year</small></span></div></div>
  </section>;
}

function TargetIcon() { return <Flag size={16} />; }

function SquadTacticsArea({ career, setCareer, onPlayerProfile, view, setView }: {
  career: Career;
  setCareer: (career: Career) => void;
  onPlayerProfile: (playerId: string) => void;
  view: "squad" | "tactics";
  setView: (view: View) => void;
}) {
  const selectedCount = career.lineup.length;
  return <>
    <SectionHeading kicker="FIRST TEAM · MATCH PREPARATION" title="Squad & tactics" detail="Choose your XI, assign roles and shape how the team plays from one place." action={<span className={`team-xi-status ${selectedCount === 11 ? "complete" : "incomplete"}`}><Users size={15} /> {selectedCount} / 11 selected</span>} />
    <div className="team-area-tabs" role="tablist" aria-label="First team workspace">
      <button type="button" role="tab" id="team-squad-tab" aria-selected={view === "squad"} aria-controls="team-squad-panel" className={view === "squad" ? "active" : ""} onClick={() => setView("squad")}><Users size={15} /><span>Squad</span><small>{getUserPlayers(career).length} players</small></button>
      <button type="button" role="tab" id="team-tactics-tab" aria-selected={view === "tactics"} aria-controls="team-tactics-panel" className={view === "tactics" ? "active" : ""} onClick={() => setView("tactics")}><Activity size={15} /><span>Tactics board</span><small>{career.formation}</small></button>
    </div>
    {view === "squad"
      ? <div className="team-tab-panel" id="team-squad-panel" role="tabpanel" aria-labelledby="team-squad-tab"><Squad career={career} setCareer={setCareer} onPlayerProfile={onPlayerProfile} /></div>
      : <div className="team-tab-panel" id="team-tactics-panel" role="tabpanel" aria-labelledby="team-tactics-tab"><Tactics career={career} setCareer={setCareer} /></div>}
  </>;
}

function Squad({ career, setCareer, onPlayerProfile }: { career: Career; setCareer: (career: Career) => void; onPlayerProfile: (playerId: string) => void }) {
  const [filter, setFilter] = useState("All players");
  const [notice, setNotice] = useState("");
  const players = getUserPlayers(career).filter((player) => filter === "All players" || player.position === filter);
  const allPlayers = getUserPlayers(career);
  const starters = career.lineup.length;
  const selectedPlayers = career.lineup.map((id) => allPlayers.find((player) => player.id === id)).filter((player): player is Player => Boolean(player));
  const autoSelectXI = () => {
    const remaining = [...allPlayers].sort((a, b) => b.overall - a.overall);
    const chosen: Player[] = [];
    for (const position of getFormationSlots(career.formation)) {
      const index = remaining.findIndex((player) => player.position === position);
      const player = remaining.splice(index >= 0 ? index : 0, 1)[0];
      if (player) chosen.push(player);
    }
    for (const player of remaining) if (chosen.length < 11) chosen.push(player);
    setCareer({ ...structuredClone(career), lineup: chosen.slice(0, 11).map((player) => player.id) });
  };
  const setTraining = (playerId: string, trainingFocus: string) => {
    const next = structuredClone(career);
    const player = next.players.find((item) => item.id === playerId);
    if (player) player.trainingFocus = trainingFocus;
    setCareer(next);
  };
  const setRole = (playerId: string, role: string) => {
    const next = structuredClone(career);
    const player = next.players.find((item) => item.id === playerId);
    if (player) player.role = role;
    setCareer(next);
  };

  return <>
    <div className="squad-summary"><div><span className="rating-chip">{Math.round(allPlayers.reduce((sum, player) => sum + player.overall, 0) / Math.max(1, allPlayers.length))}</span><span><strong>Squad rating</strong><small>Balanced · {allPlayers.length} senior players</small></span></div><div><span className="summary-stat">{MONEY(allPlayers.reduce((sum, player) => sum + player.wage, 0))}</span><span><strong>Weekly wages</strong><small>{MONEY(getClub(career).wageBudget)} budget</small></span></div><div><span className="summary-stat">{allPlayers.filter((player) => player.contractYears <= 1).length}</span><span><strong>Contract watch</strong><small>Players need a decision</small></span></div></div>
    <section className="matchday-selection-panel"><div className="matchday-selection-head"><div><p className="eyebrow">MATCHDAY SELECTION</p><h2>First XI · {career.formation}</h2><span>Choose a shirt on the player list to change the squad. Your formation updates on the tactics board.</span></div><div className="matchday-shape-preview"><FormationMini formation={career.formation} /><strong>{selectedPlayers.length} / 11</strong><small>XI SELECTED</small><button className="button button-secondary button-small" onClick={autoSelectXI}><Sparkles size={14} /> Auto select</button></div></div><div className="matchday-player-strip">{selectedPlayers.map((player, index) => <button className="matchday-player-chip" key={player.id} onClick={() => setCareer(setPlayerSelection(career, player.id))} aria-label={"Remove " + player.name + " from starting XI"}><span className={`player-position position-${player.position.toLowerCase()}`}>{player.position.slice(0, 1)}</span><span><strong>{String(index + 1).padStart(2, "0")} · {player.name}</strong><small>{player.position} · {player.role ?? "First-team role"}</small></span><b>{player.overall}</b><i>×</i></button>)}{!selectedPlayers.length && <p className="matchday-selection-empty">No players selected yet. Use the player list below or let the assistant choose an XI.</p>}</div><div className="matchday-selection-footer"><span><Users size={14} /> {Math.max(0, allPlayers.length - selectedPlayers.length)} squad players available</span><span>Selection is saved with this career</span></div></section>
    <section className="panel table-panel"><div className="panel-toolbar"><div className="filter-tabs">{["All players", "GK", "DEF", "MID", "FWD"].map((tab) => <button key={tab} onClick={() => setFilter(tab)} className={filter === tab ? "selected" : ""}>{tab}</button>)}</div><span className="squad-table-caption">SELECTED {starters} / 11</span></div>{notice && <div className="inline-notice"><Check size={15} />{notice}<button onClick={() => setNotice("")}><X size={13} /></button></div>}<div className="data-table-wrap"><table className="data-table squad-table"><thead><tr><th>Player</th><th>Pos</th><th>Age</th><th>OVR</th><th>Potential</th><th>Morale</th><th>Contract</th><th>Wage / wk</th><th>Training</th><th>Role / selection</th><th /></tr></thead><tbody>{players.map((player) => { const roleOptions = player.position === "GK" ? ["Goalkeeper", "Sweeper keeper"] : player.position === "DEF" ? ["Centre-back", "Ball-playing defender", "Full-back", "Wing-back"] : player.position === "MID" ? ["Midfielder", "Holding midfielder", "Box-to-box", "Playmaker", "Wide midfielder"] : ["Forward", "Pressing forward", "Target forward", "Inside forward"]; return <tr key={player.id}><td><div className="player-cell"><PlayerPortrait id={player.id} name={player.name} /><div><button className="player-profile-link" onClick={() => onPlayerProfile(player.id)}>{player.name}</button><small>{player.overall >= 75 ? "Key player" : player.age < 21 ? "Young prospect" : "First team"} · Rapport {player.managerRapport ?? 58}</small></div></div></td><td>{player.position}</td><td>{player.age}</td><td><span className={`ovr-badge ${player.overall >= 72 ? "high" : player.overall < 56 ? "low" : ""}`}>{player.overall}</span></td><td><div className="potential-cell"><span>{player.potential}</span><div className="tiny-progress"><i style={{ width: `${Math.round(player.overall / player.potential * 100)}%` }} /></div></div></td><td><span className="morale-cell"><i style={{ width: `${player.morale}%` }} /><span>{player.morale}</span></span></td><td><span className={player.contractYears <= 1 ? "contract-warning" : ""}>{player.contractYears} {player.contractYears === 1 ? "yr" : "yrs"}</span>{player.contractYears <= 1 && <button className="renew-link" onClick={() => { setCareer(renewContract(career, player.id)); setNotice(`${player.name} agrees a new deal.`); }}>Renew</button>}</td><td>{MONEY(player.wage)}</td><td><select className="compact-select" aria-label={`Training focus for ${player.name}`} value={player.trainingFocus} onChange={(event) => setTraining(player.id, event.target.value)}>{TRAINING_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></td><td><div className="role-selection-cell"><select className="compact-select" aria-label={`Role for ${player.name}`} value={player.role ?? roleOptions[0]} onChange={(event) => setRole(player.id, event.target.value)}>{roleOptions.map((option) => <option key={option}>{option}</option>)}</select><button className={`role-button ${career.lineup.includes(player.id) ? "in-xi" : ""}`} onClick={() => setCareer(setPlayerSelection(career, player.id))}>{career.lineup.includes(player.id) ? "Starting XI" : "Select"}</button></div></td><td><button className="row-more" aria-label={`Renew contract for ${player.name}`} title="Renew contract" onClick={() => { setCareer(renewContract(career, player.id)); setNotice(`${player.name} agrees a new deal.`); }}><Plus size={15} /></button></td></tr>; })}</tbody></table></div><div className="table-footer"><span>Showing {players.length} players</span><span>Low rapport affects player morale and match performance.</span></div></section></>;
}

function PlayerProfile({ player, report, known, onClose }: { player: Player; report: ReturnType<typeof getScoutingReport>; known: boolean; onClose: () => void }) {
  const attributes = player.attributes;
  const careerStats: PlayerStats = player.careerStats ?? { appearances: 0, goals: 0, assists: 0, cleanSheets: 0, minutes: 0 };
  const seasonStats: PlayerStats = player.seasonStats ?? { appearances: 0, goals: 0, assists: 0, cleanSheets: 0, minutes: 0 };
  const rating = (key: keyof PlayerAttributes) => attributes?.[key] ?? 0;
  const groups: { title: string; items: [keyof PlayerAttributes, string][] }[] = [
    { title: "Attacking", items: [["shooting", "Shooting"], ["finishing", "Finishing"], ["crossing", "Crossing"]] },
    { title: "Technical", items: [["passing", "Passing"], ["dribbling", "Dribbling"], ["vision", "Vision"], ["composure", "Composure"]] },
    { title: "Defending", items: [["defending", "Defending"], ["tackling", "Tackling"], ["positioning", "Positioning"]] },
    { title: "Physical", items: [["pace", "Pace"], ["strength", "Strength"], ["stamina", "Stamina"], ["reactions", "Reactions"]] },
  ];
  const dateOfBirth = player.dateOfBirth ? new Date(`${player.dateOfBirth}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Unknown";
  const history = player.clubHistory ?? [];
  const academyHistory = player.academyHistory ?? [];
  const currentClub = history.find((record) => record.toSeason === null)?.clubName ?? "Unattached";
  const reportedOverall = report?.currentAbility ?? player.overall;
  const reportedPotential = report?.potential ?? player.potential;
  return <div className="modal-backdrop player-profile-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal-card player-profile-modal" role="dialog" aria-modal="true" aria-labelledby="player-profile-title"><button className="modal-close" aria-label="Close player profile" onClick={onClose}><X size={18} /></button>
    <div className="player-profile-hero"><div className="profile-player-avatar"><PlayerPortrait id={player.id} name={player.name} size="large" /></div><div className="profile-identity"><p className="eyebrow">PLAYER DOSSIER · {player.nationality ?? "English"}</p><h2 id="player-profile-title">{player.name}</h2><p>{currentClub} · Age {player.age} · {player.squadLevel ?? "First team"}</p><div className="profile-bio-facts"><span><small>DATE OF BIRTH</small><b>{dateOfBirth}</b></span><span><small>BIRTHPLACE</small><b>{player.birthPlace ?? "Unknown"}</b></span><span><small>CONTRACT</small><b>{player.contractYears ? `${player.contractYears} years` : "Youth / free"}</b></span></div></div><div className="profile-ovr"><small>OVR</small><strong>{known ? reportedOverall : "—"}</strong><span>POT {known ? reportedPotential : "?"}</span></div></div>
    {!known ? <div className="profile-scout-lock"><Shield size={18} /><div><strong>Scouting report required</strong><span>Biography and club history are available. Ratings, attributes and potential stay hidden until your club commissions a report.</span></div></div> : <>
      <div className="profile-primary-ratings">{([["PAC", "pace"], ["SHO", "shooting"], ["PAS", "passing"], ["DRI", "dribbling"], ["DEF", "defending"], ["PHY", "physical"]] as [string, keyof PlayerAttributes][]).map(([label, key]) => <div key={key}><strong>{rating(key)}</strong><span>{label}</span></div>)}</div>
      <div className="profile-section-heading"><div><p className="eyebrow">ATTRIBUTE BREAKDOWN</p><h3>Player ratings</h3></div><span>ALL RATINGS OUT OF 100</span></div>
      <div className="profile-attribute-groups">{[...groups, ...(player.position === "GK" ? [{ title: "Goalkeeping", items: [["handling", "Handling"], ["reactions", "Reflexes"], ["positioning", "Positioning"]] as [keyof PlayerAttributes, string][] }] : [])].map((group) => <section className="profile-attribute-group" key={group.title}><h4>{group.title}</h4>{group.items.map(([key, label]) => <div className="profile-attribute-row" key={key}><span>{label}</span><i><b style={{ width: `${rating(key)}%` }} /></i><strong>{rating(key)}</strong></div>)}</section>)}</div>
    </>}
    <div className="profile-lower-grid"><section className="profile-data-panel"><div className="profile-section-heading"><div><p className="eyebrow">MATCH RECORD</p><h3>Career statistics</h3></div><span>SEASON {seasonStats.appearances} APPS</span></div><div className="profile-stat-grid">{[["Apps", careerStats.appearances], ["Goals", careerStats.goals], ["Assists", careerStats.assists], ["Clean sheets", careerStats.cleanSheets], ["Minutes", careerStats.minutes.toLocaleString("en-GB")], ["This season", `${seasonStats.goals}G · ${seasonStats.assists}A`]].map(([label, value]) => <div key={String(label)}><strong>{value}</strong><span>{label}</span></div>)}</div><div className="profile-subheading"><strong>Club history</strong><span>{history.length} club{history.length === 1 ? "" : "s"}</span></div>{history.length ? <div className="profile-history-list">{[...history].reverse().map((record, index) => <div className="profile-history-row" key={`${record.clubId}-${record.fromSeason}-${index}`}><i /><div><strong>{record.clubName}</strong><small>{record.country} · {record.squadLevel} · S{record.fromSeason}{record.toSeason ? `–S${record.toSeason}` : "–Present"}</small></div><span>{record.appearances} apps<br />{record.goals} G · {record.assists} A</span></div>)}</div> : <p className="profile-empty-note">No senior club appearances recorded yet.</p>}</section>
      <section className="profile-data-panel academy-profile-panel"><div className="profile-section-heading"><div><p className="eyebrow">DEVELOPMENT PATHWAY</p><h3>Academy record</h3></div><GraduationCap size={17} /></div>{academyHistory.length ? <div className="academy-timeline">{academyHistory.map((entry, index) => <div className="academy-timeline-row" key={`${entry.season}-${entry.squadLevel}-${index}`}><span className="academy-timeline-dot">{index + 1}</span><div><strong>{entry.squadLevel}</strong><small>Age {entry.age} · Season {entry.season} · Academy level {entry.academyLevel}</small></div></div>)}</div> : <p className="profile-empty-note">No academy registration recorded.</p>}{player.squadLevel && <div className="profile-current-stage"><span>CURRENT DEVELOPMENT STAGE</span><strong>{player.squadLevel}</strong><small>{player.trainingFocus} programme · {player.managerRapport ?? 58}% manager rapport</small></div>}</section></div>
    <div className="profile-footer"><span>PLAYER VALUE <strong>{known ? MONEY(player.value) : "Scout to assess"}</strong></span><button className="button button-secondary button-small" onClick={onClose}>Close profile</button></div>
  </section></div>;
}

const TACTIC_FORMATION_LINES: Record<string, Position[][]> = {
  "4-4-2": [["FWD", "FWD"], ["MID", "MID", "MID", "MID"], ["DEF", "DEF", "DEF", "DEF"], ["GK"]],
  "4-3-3": [["FWD", "FWD", "FWD"], ["MID", "MID", "MID"], ["DEF", "DEF", "DEF", "DEF"], ["GK"]],
  "4-2-3-1": [["FWD"], ["MID", "MID", "MID"], ["MID", "MID"], ["DEF", "DEF", "DEF", "DEF"], ["GK"]],
  "3-5-2": [["FWD", "FWD"], ["MID", "MID", "MID", "MID", "MID"], ["DEF", "DEF", "DEF"], ["GK"]],
  "4-1-4-1": [["FWD"], ["MID", "MID", "MID", "MID"], ["MID"], ["DEF", "DEF", "DEF", "DEF"], ["GK"]],
  "3-4-3": [["FWD", "FWD", "FWD"], ["MID", "MID", "MID", "MID"], ["DEF", "DEF", "DEF"], ["GK"]],
  "5-3-2": [["FWD", "FWD"], ["MID", "MID", "MID"], ["DEF", "DEF", "DEF", "DEF", "DEF"], ["GK"]],
  "4-5-1": [["FWD"], ["MID", "MID", "MID", "MID", "MID"], ["DEF", "DEF", "DEF", "DEF"], ["GK"]],
};

function formationLines(formation: string) {
  const lines = TACTIC_FORMATION_LINES[formation] ?? TACTIC_FORMATION_LINES["4-3-3"];
  return lines;
}

function FormationMini({ formation }: { formation: string }) {
  const rows = formationLines(formation);
  const lineY = (index: number) => 7 + ((index + 1) * 94) / (rows.length + 1);
  return <svg className="formation-mini" viewBox="0 0 72 108" role="img" aria-label={formation + " formation on a football pitch"}>
    <rect x="2" y="2" width="68" height="104" rx="5" fill="#143326" stroke="#9ac49b" strokeOpacity=".72" strokeWidth="1.2" />
    <path d="M2 54H70M18 2v14h36V2M18 106V92h36v14" fill="none" stroke="#c9d8ae" strokeOpacity=".56" strokeWidth="1" />
    <circle cx="36" cy="54" r="9" fill="none" stroke="#c9d8ae" strokeOpacity=".56" strokeWidth="1" /><circle cx="36" cy="54" r="1.5" fill="#c9d8ae" />
    {rows.flatMap((line, lineIndex) => line.map((position, playerIndex) => {
      const x = 5 + (playerIndex + 1) * (62 / (line.length + 1));
      const y = lineY(lineIndex);
      const fill = position === "GK" ? "#d9dfba" : position === "FWD" ? "#d1ed85" : "#76cfaa";
      return <g key={`${lineIndex}-${playerIndex}`}><circle cx={x} cy={y} r="3.7" fill="#071710" opacity=".72" /><circle cx={x} cy={y - .7} r="2.8" fill={fill} stroke="#e3efcf" strokeWidth=".7" /></g>;
    }))}
  </svg>;
}

function Tactics({ career, setCareer }: { career: Career; setCareer: (career: Career) => void }) {
  const selected = career.lineup.map((id) => career.players.find((player) => player.id === id)).filter((player): player is Player => Boolean(player));
  const lines = formationLines(career.formation);
  const [phase, setPhase] = useState<"In possession" | "Out of possession">("In possession");
  const [dragging, setDragging] = useState<string | null>(null);
  const pitchRef = useRef<SVGSVGElement | null>(null);
  const remaining = [...selected];
  const assignments = lines.flatMap((line, lineIndex) => line.map((position) => {
    const matchIndex = remaining.findIndex((player) => player.position === position);
    const player = remaining.splice(matchIndex >= 0 ? matchIndex : 0, 1)[0];
    return { position, player, lineIndex, lineSize: line.length };
  }));
  const grouped = ["GK", "DEF", "MID", "FWD"].map((position) => selected.filter((player) => player.position === position));
  const update = (field: "formation" | "mentality" | "style", value: string) => {
    const next = { ...career, [field]: value };
    if (field === "formation") next.playerPositions = {};
    next.tacticalFamiliarity = Math.max(0, (career.tacticalFamiliarity ?? 55) - (field === "formation" ? 9 : 5));
    setCareer(next);
  };
  const adjust = (field: "pressingIntensity" | "defensiveLine" | "passingTempo" | "attackingWidth", value: number) => setCareer({ ...career, [field]: value, tacticalFamiliarity: Math.max(0, (career.tacticalFamiliarity ?? 55) - 2) });
  const movePlayer = (playerId: string, x: number, y: number) => {
    const key = phase + "|" + playerId;
    setCareer({ ...career, playerPositions: { ...(career.playerPositions ?? {}), [key]: { x: Math.round(Math.min(408, Math.max(32, x))), y: Math.round(Math.min(648, Math.max(32, y))) } } });
  };
  const defaultPoint = (slot: { position: Position; player: Player | undefined; lineIndex: number; lineSize: number }) => {
    const slotIndex = assignments.filter((item) => item.lineIndex === slot.lineIndex).findIndex((item) => item.player?.id === slot.player?.id);
    const spread = phase === "Out of possession" ? 258 : 322;
    const x = 220 + (slotIndex - (slot.lineSize - 1) / 2) * (spread / Math.max(slot.lineSize, 1));
    const yRows = lines.length === 5 ? [110, 220, 330, 455, 590] : [135, 310, 470, 590];
    const phaseShift = phase === "Out of possession" ? (lines.length - 1 - slot.lineIndex) * 19 : 0;
    const baseY = yRows[slot.lineIndex] ?? (slot.position === "GK" ? 590 : slot.position === "DEF" ? 470 : slot.position === "MID" ? 310 : 135);
    const key = phase + "|" + (slot.player?.id ?? "");
    return career.playerPositions?.[key] ?? { x, y: Math.min(630, baseY + phaseShift) };
  };
  const pitchPoint = (event: ReactPointerEvent<SVGSVGElement>) => {
    const svg = pitchRef.current;
    if (!svg) return null;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const screenMatrix = svg.getScreenCTM();
    if (!screenMatrix) return null;
    const local = point.matrixTransform(screenMatrix.inverse());
    return { x: local.x, y: local.y };
  };
  return <>
    <div className="tactics-layout">
      <section className="pitch-panel">
        <div className="pitch-title"><span>DRAG PLAYERS TO SET YOUR SHAPE</span><strong>{career.formation}</strong></div>
        <div className="tactics-phase-tabs"><button className={phase === "In possession" ? "selected" : ""} onClick={() => setPhase("In possession")}>WITH THE BALL</button><button className={phase === "Out of possession" ? "selected" : ""} onClick={() => setPhase("Out of possession")}>WITHOUT THE BALL</button></div>
        <svg ref={pitchRef} className="tactics-pitch draggable-pitch" viewBox="0 0 440 680" role="img" aria-label={phase + " shape: " + career.formation + ", showing draggable starting players"} onPointerMove={(event) => { if (!dragging) return; const point = pitchPoint(event); if (point) movePlayer(dragging, point.x, point.y); }} onPointerUp={() => setDragging(null)} onPointerCancel={() => setDragging(null)}>
          <defs><linearGradient id="pitchGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#194f3f" /><stop offset="1" stopColor="#0f382d" /></linearGradient><pattern id="pitchStripes" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M0 0h40v80H0z" fill="#a8d27d" opacity=".06" /></pattern></defs>
          <rect x="8" y="8" width="424" height="664" rx="10" fill="url(#pitchGradient)" stroke="#8ebd72" strokeOpacity=".55" strokeWidth="1.5" /><rect x="8" y="8" width="424" height="664" rx="10" fill="url(#pitchStripes)" />
          <path d="M8 340H432M130 8V138H310V8M130 672V542H310V672" fill="none" stroke="#d0ddb0" strokeOpacity=".55" strokeWidth="2" /><circle cx="220" cy="340" r="56" fill="none" stroke="#d0ddb0" strokeOpacity=".55" strokeWidth="2" /><circle cx="220" cy="340" r="4" fill="#d0ddb0" />
          <rect x="180" y="8" width="80" height="32" fill="none" stroke="#d0ddb0" strokeOpacity=".6" strokeWidth="2" /><rect x="180" y="640" width="80" height="32" fill="none" stroke="#d0ddb0" strokeOpacity=".6" strokeWidth="2" /><circle cx="220" cy="78" r="4" fill="#d0ddb0" /><circle cx="220" cy="602" r="4" fill="#d0ddb0" />
          {assignments.map((slot) => {
            const player = slot.player;
            if (!player) return null;
            const point = defaultPoint(slot);
            const shortName = player.name.split(" ").at(-1) ?? player.name;
            const role = player.role ?? slot.position;
            return <g key={player.id} className={"pitch-player" + (dragging === player.id ? " pitch-player-dragging" : "")} transform={"translate(" + point.x + " " + point.y + ")"} tabIndex={0} role="button" aria-label={player.name + ", " + slot.position + ", " + role + ". Drag to reposition."} onPointerDown={(event) => { event.stopPropagation(); setDragging(player.id); pitchRef.current?.setPointerCapture(event.pointerId); }} onKeyDown={(event) => { const shift = event.shiftKey ? 20 : 8; if (event.key === "ArrowLeft") { event.preventDefault(); movePlayer(player.id, point.x - shift, point.y); } else if (event.key === "ArrowRight") { event.preventDefault(); movePlayer(player.id, point.x + shift, point.y); } else if (event.key === "ArrowUp") { event.preventDefault(); movePlayer(player.id, point.x, point.y - shift); } else if (event.key === "ArrowDown") { event.preventDefault(); movePlayer(player.id, point.x, point.y + shift); } }}>
              <circle r="21" fill="#07150f" opacity=".54" cy="3" /><circle r="19" fill={career.kit.home} stroke="#f2f0df" strokeWidth="2.2" /><circle r="15" fill="none" stroke={career.kit.trim} strokeOpacity=".7" strokeWidth="1" /><text y="4" textAnchor="middle" fill={career.kit.trim} fontSize="11" fontWeight="800">{player.overall}</text><rect x="-31" y="24" width="62" height="17" rx="5" fill="#0d1914" fillOpacity=".9" /><text y="36" textAnchor="middle" fill="#eff3e4" fontSize="9" fontWeight="700">{shortName}</text><text y="51" textAnchor="middle" fill="#cedab5" fontSize="6.5" letterSpacing=".35">{role.toUpperCase().slice(0, 18)}</text>
            </g>;
          })}
        </svg>
        <div className="pitch-legend"><span><i className="legend-dot" /> Drag a shirt · keyboard arrows also work</span><span>{selected.length} / 11 selected</span></div>
      </section>
      <section className="tactic-controls">
        <div className="panel card-pad"><div className="card-heading"><div><p className="eyebrow">TEAM SHAPE</p><h2>Formation</h2></div><Activity size={17} /></div><div className="formation-grid">{FORMATION_OPTIONS.map((formation) => <button type="button" key={formation} className={"formation-card" + (career.formation === formation ? " selected" : "")} aria-pressed={career.formation === formation} onClick={() => update("formation", formation)}><FormationMini formation={formation} /><strong>{formation}</strong><small>{formation === "4-1-4-1" ? "Compact block" : formation === "3-4-3" ? "Wide attack" : formation === "5-3-2" ? "Low block" : formation === "4-5-1" ? "Midfield control" : formation === "4-4-2" ? "Balanced" : formation === "4-3-3" ? "Forward press" : formation === "4-2-3-1" ? "Two holding · three advanced" : "Midfield overload"}</small></button>)}</div><div className="familiarity-row"><span>Shape understanding</span><strong>{career.tacticalFamiliarity ?? 55}%</strong><div className="progress-track"><span style={{ width: (career.tacticalFamiliarity ?? 55) + "%" }} /></div><small>Training and match continuity build familiarity. A formation change resets manual positions so the new shape fits the pitch.</small></div></div>
        <div className="panel card-pad"><div className="card-heading"><div><p className="eyebrow">APPROACH</p><h2>Match mentality</h2></div><Flag size={17} /></div><div className="choice-row">{["Cautious", "Balanced", "Attacking"].map((option) => <button type="button" key={option} aria-pressed={career.mentality === option} className={career.mentality === option ? "selected" : ""} onClick={() => update("mentality", option)}>{option}</button>)}</div></div>
        <div className="panel card-pad"><div className="card-heading"><div><p className="eyebrow">ON THE BALL</p><h2>Playing style</h2></div><Sparkles size={17} /></div><div className="choice-row">{["Possession", "High press", "Counter attack"].map((option) => <button type="button" key={option} aria-pressed={career.style === option} className={career.style === option ? "selected" : ""} onClick={() => update("style", option)}>{option}</button>)}</div><div className="tactic-slider-list">{([["pressingIntensity", "Pressing intensity"], ["defensiveLine", "Defensive line"], ["passingTempo", "Passing tempo"], ["attackingWidth", "Attacking width"]] as const).map(([field, label]) => <label className="tactic-slider" key={field}><span><strong>{label}</strong><b>{career[field] ?? 50}</b></span><input type="range" min="0" max="100" value={career[field] ?? 50} onChange={(event) => adjust(field, Number(event.target.value))} /><small>{field === "pressingIntensity" ? "Lower conserves energy · higher applies pressure" : field === "defensiveLine" ? "Deep block · high line" : field === "passingTempo" ? "Patient circulation · quick transitions" : "Narrow combinations · stretch the pitch"}</small></label>)}</div><div className="team-talk"><div><p className="eyebrow">DRESSING ROOM</p><strong>Pre-match team talk</strong><small>Choose the tone before the next match</small></div><div className="choice-row">{(["Calm", "Encouraging", "Demanding"] as const).map((talk) => <button type="button" key={talk} aria-pressed={career.teamTalk === talk} className={career.teamTalk === talk ? "selected" : ""} onClick={() => setCareer({ ...career, teamTalk: talk })}>{talk}</button>)}</div></div></div>
        <div className="lineup-panel"><div className="card-heading"><div><p className="eyebrow">MATCHDAY SELECTION</p><h2>Starting XI</h2></div><span>{selected.length} / 11</span></div>{["GK", "DEF", "MID", "FWD"].map((position, index) => <div className="lineup-row" key={position}><span className="lineup-position">{position}</span><div>{grouped[index].map((player) => <span className="lineup-player" key={player.id}>{player.name} · {player.role ?? position}</span>)}</div></div>)}{selected.length < 11 && <p className="lineup-warning"><Lightbulb size={14} /> Choose {11 - selected.length} more player{selected.length === 10 ? "" : "s"} from your squad.</p>}</div>
      </section>
    </div>
  </>;
}

function Fixtures({ career, setCareer, onAdvance, seasonEnd }: { career: Career; setCareer: (career: Career) => void; onAdvance: () => void; seasonEnd: boolean }) {
  const league = getCurrentLeague(career);
  const fixtures = career.fixtures.filter((fixture) => fixture.leagueId === league.id && fixture.round >= Math.max(1, career.round - 2) && fixture.round <= Math.min(league.rounds, career.round + 5));
  const open = career.fixtures.filter((fixture) => fixture.leagueId === league.id && fixture.round === career.round);
  return <><SectionHeading kicker={league.name.toUpperCase() + " · " + (2026 + career.season - 1) + "/" + String(2027 + career.season - 1).slice(-2)} title="Fixtures & results" detail="Every match in the season, with results added as the weeks pass." action={<button className="button button-primary" disabled={career.unemployed} onClick={onAdvance}>{seasonEnd ? "Begin next season" : career.round > league.rounds ? "Advance world week" : "Play next matchday"}<Clock3 size={15} /></button>} /><div className="fixtures-toolbar"><div className="fixtures-key"><span><i className="fixture-current-dot" /> Current matchday</span><span><i className="fixture-played-dot" /> Played</span></div><span>{league.rounds} MATCHDAYS · {league.clubs} CLUBS</span></div><div className="fixture-list">{fixtures.map((fixture) => {
    const isUser = fixture.homeClubId === career.clubId || fixture.awayClubId === career.clubId;
    const isCurrent = fixture.round === career.round;
    const home = getClub(career, fixture.homeClubId);
    const away = getClub(career, fixture.awayClubId);
    return <div key={fixture.id} className={`fixture-row ${isCurrent ? "fixture-current" : ""} ${isUser ? "fixture-user" : ""}`}><div className="fixture-round"><small>MATCHDAY</small><strong>{String(fixture.round).padStart(2, "0")}</strong></div><div className="fixture-date">{pageDate(fixture.date)}</div><div className="fixture-home"><strong>{home.name}</strong><ClubCrest club={home} size="small" /></div><div className="fixture-score">{fixture.played ? `${fixture.homeGoals} – ${fixture.awayGoals}` : <span>{formatGameTime(15)}</span>}</div><div className="fixture-away"><ClubCrest club={away} size="small" /><strong>{away.name}</strong></div><div className="fixture-status">{fixture.played ? <span className="played-label">FULL TIME</span> : isCurrent ? <span className="up-next-label">UP NEXT</span> : <span className="scheduled-label">SCHEDULED</span>}</div></div>;
  })}</div><div className="season-fixture-foot"><span>{open.length ? `${open.length} fixtures scheduled for this matchday` : "All fixtures completed"}</span><span>Your result updates league position, board confidence and finances.</span></div></>;
}

function LeagueTable({ career }: { career: Career }) {
  const [leagueId, setLeagueId] = useState<LeagueId>(getCurrentLeague(career).id);
  const availableLeagues = [...ENGLISH_LEAGUES, ...WORLD_LEAGUES.filter((entry) => career.clubs.some((club) => club.leagueId === entry.id))];
  const league = availableLeagues.find((entry) => entry.id === leagueId) ?? getCurrentLeague(career);
  const table = getTable(career, league.id);
  const seasonLabel = (2026 + career.season - 1) + "/" + String(2027 + career.season - 1).slice(-2);
  const zoneFor = (index: number) => {
    const place = index + 1;
    if (place <= league.automaticPromotion) return "top-rank";
    if (place <= league.automaticPromotion + league.playoffPlaces) return "playoff-rank";
    if (place > league.clubs - league.relegationPlaces) return "bottom-rank";
    return "";
  };
  return <>
    <SectionHeading kicker={league.name.toUpperCase() + " · " + seasonLabel} title="League table" detail={`${league.clubs} clubs · ${league.rounds} league matches · ${league.country}`} action={<label className="league-select-label">DIVISION<select className="compact-select" aria-label="Choose a league table" value={league.id} onChange={(event) => setLeagueId(event.target.value as LeagueId)}>{availableLeagues.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>} />
    <section className="panel league-panel">
      <div className="league-table-caption"><span>{league.name.toUpperCase()}</span><span>AFTER ROUND {Math.min(league.rounds, Math.max(0, career.round - 1))} OF {league.rounds}</span></div>
      <div className="data-table-wrap"><table className="data-table league-table"><thead><tr><th>Pos</th><th>Club</th><th>Pld</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead><tbody>{table.map((row, index) => <tr key={row.clubId} className={row.clubId === career.clubId ? "current-row" : ""}><td><span className={"league-rank " + zoneFor(index)}>{String(index + 1).padStart(2, "0")}</span></td><td><div className="league-club"><ClubCrest club={getClub(career, row.clubId)} size="small" /><strong>{row.club}</strong>{row.clubId === career.clubId && <span className="you-tag">YOU</span>}</div></td><td>{row.played}</td><td>{row.wins}</td><td>{row.draws}</td><td>{row.losses}</td><td>{row.goalsFor}</td><td>{row.goalsAgainst}</td><td><span className={row.goalsFor - row.goalsAgainst < 0 ? "negative" : "positive"}>{row.goalsFor - row.goalsAgainst > 0 ? "+" : ""}{row.goalsFor - row.goalsAgainst}</span></td><td><strong className="points-cell">{row.points}</strong></td></tr>)}</tbody></table></div>
      <div className="league-legend">
        {league.automaticPromotion > 0 && <span><i className="legend-promotion" />Automatic promotion · top {league.automaticPromotion}</span>}
        {league.playoffPlaces > 0 && <span><i className="legend-playoff" />{league.playoffLabel}</span>}
        {league.relegationPlaces > 0 && <span><i className="legend-relegation" />Relegation · bottom {league.relegationPlaces}</span>}
        <span><i className="legend-current" />Your club</span>
      </div>
    </section>
    <div className="table-note"><Lightbulb size={15} /><span>Every club plays each opponent home and away. End-of-season promotions include the listed playoff route; all division sizes are preserved.</span></div>
  </>;
}

function Transfers({ career, setCareer, onPlayerProfile }: { career: Career; setCareer: (career: Career) => void; onPlayerProfile: (playerId: string) => void }) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [notice, setNotice] = useState("");
  const [offers, setOffers] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<WorldPlayerFilter | "Career clubs">("All players");
  const [positionFilter, setPositionFilter] = useState<Position | "Any">("Any");
  const [ageFilter, setAgeFilter] = useState("Any age");
  const [countryFilter, setCountryFilter] = useState("All countries");
  const [page, setPage] = useState(0);
  const club = getClub(career);
  const ageRange = ageFilter === "Under 18" ? { minAge: 5, maxAge: 17 } : ageFilter === "18–21" ? { minAge: 18, maxAge: 21 } : ageFilter === "22–26" ? { minAge: 22, maxAge: 26 } : ageFilter === "27+" ? { minAge: 27, maxAge: 99 } : {};
  const criteria = { position: positionFilter, country: countryFilter, ...ageRange };
  const localPlayers = career.players.filter((player) => {
    if (player.age < 18 || player.clubId === career.clubId) return false;
    if (positionFilter !== "Any" && player.position !== positionFilter) return false;
    if (ageRange.minAge !== undefined && player.age < ageRange.minAge) return false;
    if (ageRange.maxAge !== undefined && player.age > ageRange.maxAge) return false;
    const playerClub = player.clubId ? getClub(career, player.clubId) : null;
    if (countryFilter !== "All countries" && (playerClub?.country ?? "England") !== countryFilter) return false;
    return !deferredQuery || `${player.name} ${player.position} ${player.nationality ?? ""} ${playerClub?.name ?? "Free agent"}`.toLowerCase().includes(deferredQuery.toLowerCase());
  }).sort((a, b) => a.name.localeCompare(b.name));
  const localPageSize = 18;
  const worldPage = useMemo(() => filter === "Career clubs" ? null : searchWorldDatabase(deferredQuery, filter, page, localPageSize, criteria), [deferredQuery, filter, page, positionFilter, ageFilter, countryFilter]);
  const localPage = filter === "Career clubs" ? localPlayers.slice(page * localPageSize, (page + 1) * localPageSize) : [];
  const listings: WorldPlayerListing[] = filter === "Career clubs"
    ? localPage.map((player) => {
      const playerClub = player.clubId ? career.clubs.find((entry) => entry.id === player.clubId) : null;
      const country = playerClub?.country ?? player.nationality ?? "England";
      const geography = WORLD_COUNTRIES.find((entry) => entry.country === country);
      const league = playerClub ? [...ENGLISH_LEAGUES, ...WORLD_LEAGUES].find((entry) => entry.id === playerClub.leagueId) : null;
      return { id: player.id, name: player.name, age: player.age, position: player.position, nationality: player.nationality ?? "English", clubId: playerClub?.id ?? null, clubName: playerClub?.name ?? "Free agent", country, continent: geography?.continent ?? "Europe", leagueName: league?.name ?? "Free agency", group: playerClub ? "First team" : "Free agent" };
    })
    : worldPage?.players ?? [];
  const hasMore = filter === "Career clubs" ? (page + 1) * localPageSize < localPlayers.length : Boolean(worldPage?.hasMore);
  const resultCount = filter === "Career clubs" ? localPlayers.length : worldPage?.total ?? worldGroupCount(filter);
  const knownReports = (career.scoutingReports ?? []).filter((report) => report.managerId === career.id || report.clubId === career.clubId).length;
  const makeOffer = (playerId: string, isFree: boolean, askingValue: number) => {
    const value = Number(offers[playerId] ?? (isFree ? 0 : askingValue));
    const next = buyPlayer(career, playerId, value);
    if (next === career) setNotice(value > club.transferBudget ? "The offer is above your remaining transfer budget." : "The club needs an offer at least 72% of the reported market value.");
    else {
      setCareer(next);
      const player = next.players.find((item) => item.id === playerId);
      setNotice(`${player?.name ?? "The player"} has signed a three-year contract.`);
    }
  };
  const commissionReport = (playerId: string) => {
    const next = scoutPlayer(career, playerId);
    if (next === career) setNotice("The club needs more available funds, or this player already has a report.");
    else { setCareer(next); setNotice("Full report filed with your manager and club scouting records."); }
  };
  const signAcademyPlayer = (playerId: string) => {
    const next = signYouthPlayer(career, playerId);
    if (next === career) setNotice("The academy cannot complete this registration with the available balance.");
    else { setCareer(next); setNotice("The scouted prospect has joined the academy pathway."); }
  };
  return <>
    <SectionHeading kicker="RECRUITMENT" title="World player database" detail={`Search ${WORLD_PLAYER_COUNT.toLocaleString("en-GB")} players across ${WORLD_PLAYER_COUNTRIES.length} countries. Filter by position, age and nation, then commission a report before ability and potential are revealed.`} action={<div className="budget-pill"><Wallet size={15} /><span>TRANSFER BUDGET</span><strong>{MONEY(club.transferBudget)}</strong></div>} />
    <div className="world-database-intro"><div className="database-emblem"><Search size={20} /></div><div><p className="eyebrow">GLOBAL SCOUTING NETWORK</p><strong>{WORLD_PLAYER_COUNT.toLocaleString("en-GB")} players · {WORLD_PLAYER_COUNTRIES.length} countries · clubs, academies and free agents</strong><span>Identity is visible to every club. Ability, potential and market value are revealed only after a scout report.</span></div><div className="scout-file-count"><strong>{knownReports}</strong><span>reports in your manager file</span></div></div>
    <section className="panel market-panel world-market-panel">
      <div className="panel-toolbar world-market-toolbar"><div className="market-heading"><div><p className="eyebrow">PLAYER DIRECTORY</p><h2>{filter === "Career clubs" ? "Career clubs" : filter}</h2></div><span>{resultCount.toLocaleString("en-GB")} matching players</span></div><div className="market-search"><Search size={15} /><input aria-label="Search players" placeholder="Name, club, country or position" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} /></div></div>
      <div className="database-filters">{(["All players", "First team", "Academy", "Free agent", "Career clubs"] as const).map((option) => <button key={option} className={filter === option ? "selected" : ""} onClick={() => { setFilter(option); setPage(0); }}>{option}{option !== "Career clubs" && <small>{worldGroupCount(option).toLocaleString("en-GB")}</small>}</button>)}</div>
      <div className="player-directory-filters"><label>POSITION<select aria-label="Filter players by position" value={positionFilter} onChange={(event) => { setPositionFilter(event.target.value as Position | "Any"); setPage(0); }}><option value="Any">Any position</option>{(["GK", "DEF", "MID", "FWD"] as const).map((position) => <option key={position}>{position}</option>)}</select></label><label>AGE<select aria-label="Filter players by age" value={ageFilter} onChange={(event) => { setAgeFilter(event.target.value); setPage(0); }}><option>Any age</option><option>Under 18</option><option>18–21</option><option>22–26</option><option>27+</option></select></label><label>COUNTRY<select aria-label="Filter players by country" value={countryFilter} onChange={(event) => { setCountryFilter(event.target.value); setPage(0); }}><option>All countries</option>{WORLD_PLAYER_COUNTRIES.map((country) => <option key={country}>{country}</option>)}</select></label></div>
      {notice && <div className="inline-notice"><Check size={15} />{notice}<button onClick={() => setNotice("")}><X size={13} /></button></div>}
      <div className="database-results">{listings.map((listing) => {
        const report = getScoutingReport(career, listing.id);
        const inClub = career.players.some((player) => player.id === listing.id && player.clubId === club.id);
        const scoutingCost = getScoutingCost(career, listing.id);
        const registrationFee = 8_000 + listing.age * 3_500 + club.academyLevel * 4_000;
        const isFree = listing.group === "Free agent";
        const availablePlayer = career.players.find((player) => player.id === listing.id);
        const value = report?.marketValue ?? availablePlayer?.value ?? 0;
        return <article className="database-player" key={listing.id}>
          <PlayerPortrait id={listing.id} name={listing.name} />
          <span className={`player-position position-${listing.position.toLowerCase()}`}>{listing.position.slice(0, 1)}</span>
          <div className="database-player-main"><div className="database-player-title"><button className="player-profile-link" onClick={() => onPlayerProfile(listing.id)}>{listing.name}</button><span>{listing.age} yrs · {listing.nationality}</span></div><div className="database-player-origin"><span>{listing.clubName}</span><i>·</i><span>{listing.country}</span><i>·</i><span>{listing.group}</span></div></div>
          <div className="database-player-report">{report ? <><strong>ABILITY {report.currentAbility}<b>·</b> POTENTIAL {report.potential}</strong><span>{formatPlayerValue(report.marketValue)} market value</span><small>{report.clubId === club.id ? "MANAGER + CLUB FILE" : "MANAGER FILE"} · S{report.season} MD{report.round}</small></> : <><strong className="ratings-hidden">ABILITY ? <b>·</b> POTENTIAL ?</strong><span>Scout to reveal ratings</span><small>Not yet assessed</small></>}</div>
          <div className="database-player-action">{inClub ? <span className="signed-player-label">YOUR SQUAD</span> : report ? listing.age < 18 ? <button className="button button-small button-secondary" onClick={() => signAcademyPlayer(listing.id)} disabled={club.balance < registrationFee}>Invite · {MONEY(registrationFee)}</button> : <><label className="database-offer-label">{isFree ? "No fee" : "Your offer"}<input aria-label={`Offer for ${listing.name}`} className="offer-input" type="number" min="0" step="10000" disabled={isFree} value={isFree ? 0 : offers[listing.id] ?? value} onChange={(event) => setOffers({ ...offers, [listing.id]: event.target.value })} /></label><button className="button button-small button-secondary" disabled={Number(offers[listing.id] ?? (isFree ? 0 : value)) > club.transferBudget} onClick={() => makeOffer(listing.id, isFree, value)}>{isFree ? "Sign player" : "Make offer"}</button></> : <button className="button button-small button-primary" onClick={() => commissionReport(listing.id)} disabled={club.balance < scoutingCost}>Scout · {MONEY(scoutingCost)}</button>}</div>
        </article>;
      })}{!listings.length && <div className="database-empty"><Search size={20} /><strong>No players match that search</strong><span>Try a name, position, club or country.</span></div>}</div>
      <div className="database-pagination"><span>Page {page + 1} · {filter === "Career clubs" ? "Players in this career world" : "Global player database"}</span><div><button className="button button-secondary button-small" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0}>Previous</button><button className="button button-secondary button-small" onClick={() => setPage((current) => current + 1)} disabled={!hasMore}>Next players</button></div></div>
      <div className="table-footer"><span>A scouting report is saved to your manager file and the club file that commissioned it.</span><span>Reports found · {knownReports}</span></div>
    </section>
  </>;
}

function Academy({ career, setCareer, onPlayerProfile }: { career: Career; setCareer: (career: Career) => void; onPlayerProfile: (playerId: string) => void }) {
  const club = getClub(career);
  const youth = getAcademyPlayers(career);
  const candidates = getYouthCandidates(career);
  const [notice, setNotice] = useState("");
  const [stageFilter, setStageFilter] = useState<"All" | SquadLevel>("All");
  const pathway: { level: SquadLevel; age: string; name: string; phase: string; description: string }[] = [
    { level: "Foundation", age: "5–8", name: "Foundation", phase: "FOUNDATION PHASE", description: "Movement, confidence and first touches" },
    { level: "Academy", age: "9–11", name: "Academy", phase: "FOUNDATION PHASE", description: "Ball mastery and love of the game" },
    { level: "U16", age: "12–15", name: "Under 16s", phase: "YOUTH DEVELOPMENT", description: "Technical skills and game understanding" },
    { level: "U18", age: "16–17", name: "Under 18s", phase: "PROFESSIONAL DEVELOPMENT", description: "Scholarship years and senior training" },
    { level: "Reserves", age: "18–20", name: "Reserves", phase: "PROFESSIONAL DEVELOPMENT", description: "Reserve football, loans and first-team bridge" },
  ];
  const stages = [...pathway, { level: "First team" as const, age: "18+", name: "First team", phase: "SENIOR FOOTBALL", description: "Earn a place in the senior squad" }];
  const seniorCount = career.players.filter((player) => player.clubId === career.clubId && (player.age >= 21 || player.squadLevel === "First team")).length;
  const counts = stages.map((stage) => ({ ...stage, count: stage.level === "First team" ? seniorCount : youth.filter((player) => player.squadLevel === stage.level).length }));
  const visiblePlayers = stageFilter === "All" ? youth : youth.filter((player) => player.squadLevel === stageFilter);
  const upgrade = () => {
    const result = upgradeClubFacility(career, "academyLevel");
    if (result === career) setNotice(`The next academy level costs ${MONEY((club.academyLevel + 1) * 225000)}.`);
    else { setCareer(result); setNotice("Academy investment approved. It improves future intakes and player development."); }
  };
  const signProspect = (player: Player) => {
    const result = signYouthPlayer(career, player.id);
    if (result === career) setNotice(`${player.name} is still available, but the club cannot cover the academy registration fee.`);
    else { setCareer(result); setNotice(`${player.name} signs a youth registration and joins ${club.name}.`); }
  };
  const scoutProspect = (player: Player) => {
    const result = scoutPlayer(career, player.id);
    if (result === career) setNotice(`The club needs ${MONEY(getScoutingCost(career, player.id))} available to complete the report.`);
    else { setCareer(result); setNotice(`${player.name}'s ratings are now on the manager and club scouting files.`); }
  };
  const trainingFor = (player: Player) => player.squadLevel === "Foundation" || player.squadLevel === "Academy"
    ? ["Fundamentals", "Technical", "Tactical", "Rest"]
    : ["Technical", "Tactical", "Physical", player.position === "GK" ? "Goalkeeping" : "Finishing", "Balanced", "Rest"];
  const stageLabel = (player: Player) => stages.find((stage) => stage.level === player.squadLevel)?.name ?? player.squadLevel ?? "Academy";
  const eligibleForPromotion = (player: Player) => (player.squadLevel === "U18" && player.age >= 16) || (player.squadLevel === "Reserves" && player.age >= 18);
  const promotionLabel = (player: Player) => player.squadLevel === "U18" ? "Promote to reserves" : "Promote to first team";
  return <><SectionHeading kicker="THE PLAYER PATHWAY" title="Youth academy" detail="A club-built route from first football to first-team minutes, with individual development at every step." action={<span className="clubhouse-city"><GraduationCap size={16} /> ACADEMY LEVEL {club.academyLevel}</span>} />
    <section className="academy-pathway-hero"><div className="academy-pathway-heading"><div><p className="eyebrow">ONE PATH THROUGH THE CLUB</p><h2>Build a player, season by season</h2></div><span>{youth.length} registered prospects</span></div><div className="academy-stage-track">{counts.map((stage, index) => <article className={`academy-stage-card stage-${stage.level.toLowerCase().replaceAll(" ", "-")}`} key={stage.level}><div className="academy-stage-top"><span>{String(index + 1).padStart(2, "0")}</span><strong>{stage.count}</strong></div><small>{stage.phase}</small><h3>{stage.name}</h3><p>{stage.description}</p><div className="stage-age-line"><span>AGES {stage.age}</span><i /></div></article>)}</div><p className="academy-phase-note">Academy ages follow the club’s development phases: foundation learning, youth development and professional development. An early registration is not a senior contract.</p></section>
    <div className="academy-layout"><section className="panel academy-roster"><div className="card-heading"><div><p className="eyebrow">REGISTERED PLAYERS</p><h2>{visiblePlayers.length} in this development group</h2></div><GraduationCap size={18} /></div>{notice && <div className="inline-notice"><Check size={15} />{notice}<button aria-label="Dismiss message" onClick={() => setNotice("")}><X size={13} /></button></div>}<div className="academy-stage-filters">{(["All", ...stages.map((stage) => stage.level)] as ("All" | SquadLevel)[]).map((level) => <button key={level} className={stageFilter === level ? "selected" : ""} onClick={() => setStageFilter(level)}>{level === "All" ? "All ages" : stages.find((stage) => stage.level === level)?.name}</button>)}</div>
      {visiblePlayers.length ? <div className="youth-player-list">{visiblePlayers.map((player) => <article className="youth-player-card" key={player.id}><div className="youth-player-top"><PlayerPortrait id={player.id} name={player.name} /><div className="youth-name"><button className="player-profile-link" onClick={() => onPlayerProfile(player.id)}>{player.name}</button><small>{player.nationality ?? "English"} · Age {player.age} · {stageLabel(player)}</small></div><span className="ovr-badge">{player.overall}</span></div><div className="youth-growth"><div><span>Potential</span><strong>{player.potential}</strong></div><div className="tiny-progress"><i style={{ width: `${Math.min(100, Math.round(player.overall / Math.max(player.potential, 1) * 100))}%` }} /></div><span className="youth-potential-label">{player.potential - player.overall} growth points</span></div><div className="youth-actions"><label>Individual programme<select className="compact-select" value={player.trainingFocus} onChange={(event) => setCareer(setYouthTraining(career, player.id, event.target.value))}>{trainingFor(player).map((option) => <option key={option}>{option}</option>)}</select></label>{eligibleForPromotion(player) ? <button className="button button-secondary button-small" onClick={() => { const next = promoteYouth(career, player.id); setCareer(next); setNotice(next === career ? "This player is not eligible for the next pathway step yet." : `${player.name} advances to the next squad group.`); }}>{promotionLabel(player)}</button> : player.squadLevel === "First team" ? <span className="academy-contract">Senior squad member</span> : <span className="academy-contract">{player.age >= 16 ? "Scholarship agreement" : "Youth development registration"}</span>}</div><div className="academy-player-foot"><span>{player.age < 13 ? "FOUNDATION TRAINING" : player.age < 16 ? "YOUTH DEVELOPMENT" : player.age < 18 ? "SCHOLARSHIP PHASE" : "PROFESSIONAL DEVELOPMENT"}</span><span>RAPPORT {player.managerRapport ?? 55}</span></div></article>)}</div> : <div className="academy-empty"><GraduationCap size={22} /><strong>No players in this age band yet</strong><span>Scouting and future intakes will add prospects to the pathway.</span></div>}
      <div className="table-footer"><span>Training carries on each matchday.</span><span>Age, potential, development plan and squad level shape a player’s progress.</span></div>
    </section><aside className="panel academy-investment"><div className="card-heading"><div><p className="eyebrow">RECRUITMENT & FACILITIES</p><h2>Find the next prospect</h2></div><Search size={18} /></div><div className="academy-highlight"><strong>{candidates.length} unattached prospects</strong><p>Scout a prospect before their ability and potential are revealed. A young player begins on development registration; scholarship terms arrive at 16.</p></div>{candidates.length ? <div className="academy-candidate-list">{candidates.slice(0, 6).map((player) => { const fee = 8_000 + player.age * 3_500 + club.academyLevel * 4_000; const report = getScoutingReport(career, player.id); const reportCost = getScoutingCost(career, player.id); return <article className="academy-candidate" key={player.id}><PlayerPortrait id={player.id} name={player.name} /><div><button className="player-profile-link" onClick={() => onPlayerProfile(player.id)}>{player.name}</button><small>{player.nationality ?? "English"} · Age {player.age} · {stageLabel(player)}</small><span>{report ? <>Potential <b>{report.potential}</b> · OVR {report.currentAbility}</> : "Ability and potential unknown"}</span></div>{report ? <button className="button button-secondary button-small" onClick={() => signProspect(player)} disabled={club.balance < fee}>{MONEY(fee)} · Sign</button> : <button className="button button-primary button-small" onClick={() => scoutProspect(player)} disabled={club.balance < reportCost}>Scout · {MONEY(reportCost)}</button>}</article>; })}</div> : <div className="academy-empty academy-candidate-empty"><Check size={19} /><strong>Scout pool clear</strong><span>New youth prospects arrive each season.</span></div>}<div className="academy-invest-divider"><p className="eyebrow">INVEST IN THE PATHWAY</p><div className="academy-invest-stat"><span>Next intake</span><strong>{2 + club.academyLevel} players</strong><small>Arrives at the end of each season</small></div><button className="button button-primary button-wide" onClick={upgrade} disabled={club.academyLevel >= 5}>{club.academyLevel >= 5 ? "Academy at maximum level" : `Improve academy · ${MONEY((club.academyLevel + 1) * 225000)}`}<Building2 size={15} /></button></div><p className="muted academy-footnote">A stronger academy increases intake size. Individual plans, age and match experience affect development.</p></aside></div>
  </>;
}
function Commercial({ career, setCareer }: { career: Career; setCareer: (career: Career) => void }) {
  const club = getClub(career);
  const [notice, setNotice] = useState("");
  const offers = club.sponsorOffers ?? [];
  const contracts = club.sponsorContracts ?? [];
  const negotiate = () => { setCareer(sponsorProposal(career)); setNotice("Five fictional partners have submitted offers for available club assets."); };
  const accept = (offerId: string, company: string, slot: SponsorSlot) => { setCareer(acceptSponsor(career, offerId)); setNotice(`${company} now sponsors the ${slot} deal.`); };
  const slotLabel = (slot: SponsorSlot) => ({ shirt: "Shirt front", stadium: "Stadium naming", boards: "Perimeter boards", training: "Training ground", academy: "Academy" })[slot];
  return <><SectionHeading kicker="PARTNERS & REVENUE" title="Commercial" detail="Negotiate multi-year sponsorships across the shirt, stadium, boards and development sites." action={<button className="button button-primary" onClick={negotiate}><Handshake size={15} /> Request partner offers</button>} />
    {notice && <div className="inline-notice commercial-notice"><Check size={15} />{notice}<button aria-label="Dismiss message" onClick={() => setNotice("")}><X size={13} /></button></div>}
    <div className="commercial-summary"><Metric icon={Banknote} label="Current commercial contracts" value={`${contracts.length}`} foot="Separate asset deals" accent /><Metric icon={Megaphone} label="Contracted annual revenue" value={MONEY(contracts.reduce((sum, contract) => sum + contract.annual, 0) || club.sponsorAnnual)} foot="Before matchday income" /><Metric icon={Clock3} label="Next expiry" value={contracts.length ? `${Math.min(...contracts.map((contract) => contract.yearsRemaining))} yr${Math.min(...contracts.map((contract) => contract.yearsRemaining)) === 1 ? "" : "s"}` : "No active deals"} foot="Terms roll forward each season" /></div>
    <div className="commercial-layout"><section className="panel sponsor-deal-panel"><div className="card-heading"><div><p className="eyebrow">AVAILABLE PARTNERS</p><h2>Negotiated offers</h2></div><span className="deal-count">{offers.length} offers</span></div>{!offers.length ? <div className="empty-offers"><Handshake size={22} /><strong>No open negotiations</strong><p>Ask the commercial team to approach fictional brands for the open club assets.</p><button className="button button-secondary" onClick={negotiate}>Find sponsors</button></div> : <div className="sponsor-offer-grid">{offers.map((offer) => <article className="commercial-offer" key={offer.id}><div className="offer-card-top"><span className={`sponsor-slot-icon slot-${offer.slot}`}><Star size={17} /></span><span className="offer-slot">{slotLabel(offer.slot)}</span></div><h3>{offer.company}</h3><div className="offer-annual"><strong>{MONEY(offer.annual)}</strong><span>per season</span></div><div className="offer-terms"><span><small>TERM</small><strong>{offer.years} years</strong></span><span><small>SIGNING BONUS</small><strong>{MONEY(offer.signingBonus)}</strong></span></div><button className="button button-primary button-wide" onClick={() => accept(offer.id, offer.company, offer.slot)}>Accept offer</button></article>)}</div>}</section>
      <aside className="panel active-partners"><div className="card-heading"><div><p className="eyebrow">CURRENT PARTNERS</p><h2>Club assets</h2></div><Star size={17} /></div>{contracts.length ? contracts.map((contract) => <article className="active-contract" key={contract.id}><span className={`sponsor-slot-icon slot-${contract.slot}`}><Star size={15} /></span><div><small>{slotLabel(contract.slot).toUpperCase()}</small><strong>{contract.company}</strong><span>{MONEY(contract.annual)} / season · {contract.yearsRemaining} year{contract.yearsRemaining === 1 ? "" : "s"} remaining</span></div></article>) : <div className="empty-offers"><p>No signed sponsors yet.</p></div>}<div className="commercial-guidance"><Megaphone size={15} /><span>Different sponsors can occupy different assets. Accepting a new deal replaces only the existing contract for that asset.</span></div></aside></div>
  </>;
}

function Finance({ career, setCareer }: { career: Career; setCareer: (career: Career) => void }) {
  const club = getClub(career);
  const [notice, setNotice] = useState("");
  const totalWages = career.players.filter((player) => player.clubId === club.id).reduce((sum, player) => sum + player.wage, 0);
  const ledger = career.finance.slice(0, 12);
  return <><SectionHeading kicker="CLUB ACCOUNTS" title="Finances & budget" detail="Keep the club healthy while investing in the team and the ground." action={<div className="balance-pill"><span>CURRENT BALANCE</span><strong>{MONEY(club.balance)}</strong></div>} /><div className="finance-metrics"><Metric icon={Banknote} label="Operating balance" value={MONEY(club.balance)} foot="Available club funds" accent /><Metric icon={Coins} label="Transfer budget" value={MONEY(club.transferBudget)} foot="Player acquisitions" /><Metric icon={Users} label="Weekly wages" value={MONEY(totalWages)} foot={`${MONEY(club.wageBudget)} wage budget`} /><Metric icon={Building2} label="Outstanding debt" value={MONEY(club.debt)} foot="Facility loans" /></div><div className="finance-grid"><section className="panel finance-ledger"><div className="card-heading"><div><p className="eyebrow">CASHFLOW</p><h2>Recent transactions</h2></div><span>GBP · LAST {ledger.length}</span></div><div className="ledger-list">{ledger.map((entry, index) => <div key={`${entry.date}-${entry.label}-${index}`} className="ledger-row"><span className={`ledger-icon ${entry.amount < 0 ? "outgoing" : "incoming"}`}>{entry.amount < 0 ? "−" : "+"}</span><div><strong>{entry.label}</strong><small>{entry.date}</small></div><b className={entry.amount < 0 ? "negative" : "positive"}>{MONEY(entry.amount)}</b></div>)}</div><div className="table-footer"><span>Transactions are recorded as your season advances.</span></div></section><section className="finance-side"><div className="panel sponsor-card"><div className="card-heading"><div><p className="eyebrow">COMMERCIAL PARTNER</p><h2>Sponsorship</h2></div><Megaphone size={17} /></div><div className="sponsor-current"><div className="sponsor-logo"><Star size={19} /></div><div><small>MAIN SHIRT SPONSOR</small><strong>{club.sponsor}</strong><span>{MONEY(club.sponsorAnnual)} per season</span></div></div>{club.sponsorOffer ? <div className="sponsor-offer"><div><span>NEW OFFER</span><strong>{club.sponsorOffer.name}</strong><small>{MONEY(club.sponsorOffer.annual)} per season</small></div><button className="button button-primary button-small" onClick={() => { setCareer(acceptSponsor(career)); setNotice("Sponsorship terms accepted."); }}>Accept offer</button></div> : <button className="button button-secondary button-wide" onClick={() => { setCareer(sponsorProposal(career)); setNotice("A new sponsor has made an offer."); }}>Negotiate a new deal</button>}{notice && <p className="sponsor-notice"><Check size={13} />{notice}</p>}</div><div className="panel loan-card"><div className="loan-head"><span className="loan-icon"><Banknote size={17} /></span><div><p className="eyebrow">FACILITY FINANCING</p><h2>Invest in growth</h2></div></div><p>Secure a £2.0m facility loan for stadium work. Repayments are made from matchday cashflow.</p><div className="loan-terms"><span><small>LOAN OFFER</small><strong>£2.0m</strong></span><span><small>TOTAL REPAYMENT</small><strong>£2.3m</strong></span><span><small>PER MATCHDAY</small><strong>£28.8k</strong></span></div><button className="button button-secondary button-wide" disabled={club.debt > 0} onClick={() => { const next = structuredClone(career); const nextClub = getClub(next); nextClub.balance += 2_000_000; nextClub.debt += 2_300_000; next.finance.unshift({ date: "Today", label: "Facility loan drawdown", amount: 2_000_000 }); setCareer(next); }}> {club.debt > 0 ? "Facility loan active" : "Request facility loan"}<Banknote size={15} /></button></div></section></div></>;
}

function KitShirt({ club, color, trim, pattern, sponsor, edition }: { club: Club; color: string; trim: string; pattern: KitPattern; sponsor: string; edition: string }) {
  const id = club.id + "-" + edition.toLowerCase().replace(/\s+/g, "-");
  const shirt = "M61 24 43 31 22 38 7 69l29 15 12-16 2 82h80l2-82 12 16 29-15-15-31-21-7-18-7-11 13H72z";
  const brand = sponsor.trim().split(/\s+/).slice(0, 2).join(" ").toUpperCase().slice(0, 15) || club.shortName;
  return <svg viewBox="0 0 200 190" className="kit-shirt-illustration" role="img" aria-label={edition + " " + pattern.toLowerCase() + " performance shirt for " + club.name}>
    <defs>
      <linearGradient id={"fabric-" + id} x1="0" y1="0" x2="1" y2="1"><stop stopColor={color} /><stop offset=".47" stopColor={color} /><stop offset="1" stopColor="#0b1412" stopOpacity=".4" /></linearGradient>
      <linearGradient id={"shine-" + id} x1="0" y1="0" x2="0.9" y2="1"><stop stopColor="#fff" stopOpacity=".24" /><stop offset=".34" stopColor="#fff" stopOpacity=".025" /><stop offset="1" stopColor="#07100e" stopOpacity=".25" /></linearGradient>
      <linearGradient id={"fade-" + id} x1="0" y1="0" x2="0" y2="1"><stop stopColor={color} /><stop offset=".62" stopColor={color} /><stop offset="1" stopColor={trim} /></linearGradient>
      <pattern id={"micro-" + id} width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1.6" cy="1.6" r=".65" fill="#fff" opacity=".34" /><circle cx="5.1" cy="5.1" r=".5" fill="#09110f" opacity=".32" /></pattern>
      <clipPath id={"shirt-clip-" + id}><path d={shirt} /></clipPath>
      <filter id={"shadow-" + id} x="-25%" y="-20%" width="150%" height="160%"><feGaussianBlur stdDeviation="7" /></filter>
    </defs>
    <ellipse cx="101" cy="166" rx="65" ry="10" fill="#000" opacity=".24" filter={"url(#shadow-" + id + ")"} />
    <path d={shirt} transform="translate(0 5)" fill="#050b09" opacity=".42" />
    <path d={shirt} fill={"url(#fabric-" + id + ")"} stroke="#eaf3ed" strokeOpacity=".54" strokeWidth="1.5" />
    <g clipPath={"url(#shirt-clip-" + id + ")"}>
      {["Engineered Grid", "Micro Dot"].includes(pattern) && <path d={shirt} fill={"url(#micro-" + id + ")"} opacity=".37" />}
      {pattern === "Stripes" && <g stroke={trim} strokeWidth="7"><path d="M70 20v133M91 20v133M112 20v133M133 23v128" /></g>}
      {pattern === "Hoops" && <g stroke={trim} strokeWidth="9" opacity=".9"><path d="M24 79h152M28 105h145M38 132h126" /></g>}
      {pattern === "Sash" && <path d="m49 37 15-6 82 109-17 8z" fill={trim} />}
      {pattern === "Halves" && <path d="M101 21h79v135h-79z" fill={trim} />}
      {pattern === "Quarters" && <g fill={trim}><path d="M33 39h68v54H33zM101 94h69v49h-69z" /></g>}
      {pattern === "Chevron" && <path d="m29 76 72 28 72-28v17l-72 37-72-37z" fill={trim} />}
      {pattern === "Pinstripes" && <g stroke={trim} strokeWidth="1.5" opacity=".8">{Array.from({ length: 13 }, (_, index) => <path key={index} d={"M" + (45 + index * 9) + " 23v133"} />)}</g>}
      {pattern === "Fade" && <path d={shirt} fill={"url(#fade-" + id + ")"} />}
      {pattern === "Engineered Grid" && <g fill="none" stroke={trim} opacity=".42" strokeWidth="1"><path d="M48 39h105M43 47h114M40 55h119M41 63h118M42 71h116M44 79h112M47 87h106" /><path d="M57 35v30m16-34v44m16-47v60m16-60v60m16-56v53m16-46v42" /></g>}
      {pattern === "Topographic" && <g fill="none" stroke={trim} strokeWidth="1.6" opacity=".75"><path d="M24 67q34-34 73 0t80 0M20 76q41-33 78 1t84-1M18 88q45-31 83 1t82 0M27 100q32-27 74 1t72 1M39 115q30-19 61 0t60 2M44 128q30-17 55 0t53 2" /><path d="M39 57q30-25 57-2t57 1" /></g>}
      {pattern === "Pixel Fade" && <g fill={trim}>{Array.from({ length: 36 }, (_, index) => { const row = Math.floor(index / 6); const column = index % 6; return <rect key={index} x={56 + column * 14 + (row % 2) * 3} y={66 + row * 10} width={6 + (column % 3)} height={6 + (row % 2)} opacity={Math.max(.12, .76 - row * .1 - column * .055)} />; })}</g>}
      {pattern === "Diagonal Motion" && <g fill={trim}><path d="m34 48 14-9 80 107-14 9z" opacity=".8" /><path d="m49 38 5-3 81 108-5 4z" opacity=".5" /><path d="m34 91 5-3 39 51-5 4z" opacity=".65" /></g>}
      {pattern === "Contour Lines" && <g fill="none" stroke={trim} strokeWidth="2" opacity=".7"><path d="M35 72q24-22 47 0t48 0q17-16 36-4M34 82q27-22 51 0t49 0q17-14 33-4M37 94q24-19 47 0t48 0q18-13 32-3M45 108q21-16 39 0t42 0q18-11 30-3" /></g>}
      {pattern === "Split Panel" && <g fill={trim}><path d="M29 42h19v102H36zM154 42h18l-6 102h-18z" opacity=".78" /><path d="M28 149h143v8H28z" opacity=".55" /></g>}
      {pattern === "Shadow Gradient" && <path d={shirt} fill={"url(#fade-" + id + ")"} opacity=".92" />}
      {pattern === "Clean Block" && <g fill="none" stroke={trim} strokeWidth="2"><path d="M44 146h115" /><path d="M49 42h17M137 42h17" /></g>}
      {pattern === "Solid" && <path d="M47 146h108" stroke={trim} strokeWidth="4" />}
      <path d={shirt} fill={"url(#shine-" + id + ")"} />
      <path d="M31 142h138" stroke="#07100e" strokeOpacity=".1" strokeWidth="1" />
    </g>
    <path d="M44 37 31 62m124-25 13 25M47 61 38 74m115-13 9 13" fill="none" stroke={trim} strokeWidth="3.5" />
    <path d="M72 25q4 17 29 20 25-3 29-20" fill="#111b18" stroke={trim} strokeWidth="2.5" />
    <path d="M80 28q6 10 21 11 15-1 21-11" fill="none" stroke="#f4f5ec" strokeOpacity=".31" strokeWidth="1" />
    <path d="M51 67v74m100-74v74" stroke="#f6f2df" strokeOpacity=".18" strokeWidth="1" />
    <path d="m58 55 12-5 10 7-4 17-15-1z" fill="#e8e6d8" stroke="#132019" strokeWidth="1.7" />
    <path d="m63 59 7-3 6 4-2 11-8 0z" fill={club.colors[0]} />
    <text x="96" y="99" textAnchor="middle" fill="#fff" stroke="#101714" strokeOpacity=".24" strokeWidth=".55" fontSize="9" fontFamily="Arial,sans-serif" fontWeight="800" letterSpacing=".7">{brand}</text>
    <path d="M67 106h58" stroke={trim} strokeOpacity=".7" strokeWidth="1.2" />
    <text x="96" y="134" textAnchor="middle" fill="#fff" fontSize="7" fontFamily="Arial,sans-serif" fontWeight="700" letterSpacing="1.2">{club.shortName}</text>
    <text x="100" y="178" textAnchor="middle" fill="#c1cfc6" fontSize="7" fontFamily="monospace" letterSpacing="1.7">{edition.toUpperCase()} · {pattern.toUpperCase()}</text>
  </svg>;
}

function Clubhouse({ career, setCareer }: { career: Career; setCareer: (career: Career) => void }) {
  const club = getClub(career);
  const kitPatterns = career.kitPatterns ?? { home: "Engineered Grid" as const, away: "Clean Block" as const, third: "Pixel Fade" as const };
  const [notice, setNotice] = useState("");
  const [focusedKit, setFocusedKit] = useState<"home" | "away" | "third">("home");
  const designOpen = career.round > getSeasonWeekCount() && career.kitCollectionSeason !== career.season;
  const shirtSponsor = (club.sponsorContracts ?? []).find((contract) => contract.slot === "shirt")?.company ?? club.sponsor;
  const updateKit = (key: keyof Career["kit"], value: string) => setCareer({ ...career, kit: { ...career.kit, [key]: value } });
  const updatePattern = (key: "home" | "away" | "third", value: NonNullable<Career["kitPatterns"]>["home"]) => setCareer({ ...career, kitPatterns: { ...kitPatterns, [key]: value } });
  const updateBadge = (field: "shape" | "emblem" | "foundingYear", value: string | number) => {
    const next = structuredClone(career);
    const nextClub = getClub(next);
    const badge = nextClub.badge ?? { shape: "shield" as const, emblem: "star" as const, colors: nextClub.colors, foundingYear: 1900 };
    nextClub.badge = { ...badge, [field]: field === "foundingYear" ? Number(value) : value } as NonNullable<Club["badge"]>;
    setCareer(next);
  };
  const updateBadgeColor = (index: 0 | 1, value: string) => {
    const next = structuredClone(career);
    const nextClub = getClub(next);
    const colors: [string, string] = [...nextClub.colors];
    colors[index] = value;
    nextClub.colors = colors;
    if (nextClub.badge) nextClub.badge.colors = colors;
    setCareer(next);
  };
  const upgrade = (facility: "academyLevel" | "trainingLevel" | "scoutLevel", price: number) => {
    const result = upgradeClubFacility(career, facility);
    if (result === career) setNotice(`The club needs ${MONEY(price)} available to make this investment.`);
    else { setCareer(result); setNotice("Investment approved. The facility is now stronger."); }
  };
  return <><SectionHeading kicker="CLUB DEVELOPMENT" title="Clubhouse" detail="Shape the club identity, grow young talent and strengthen your backroom." action={<span className="clubhouse-city"><MapPin size={15} /> {club.city}, {club.country}</span>} />
    <div className="clubhouse-grid"><section className="panel kit-panel"><div className="card-heading"><div><p className="eyebrow">CLUB IDENTITY</p><h2>Season kit designer</h2></div><Shirt size={18} /></div><div className="kit-collection-board">{([['home', 'HOME'], ['away', 'AWAY'], ['third', 'THIRD']] as const).map(([key, label]) => <article className={`kit-card ${focusedKit === key ? "kit-card-focused" : ""}`} key={key}><button type="button" className="kit-art-button" onClick={() => setFocusedKit(key)} aria-label={`Focus ${label.toLowerCase()} shirt design`} aria-pressed={focusedKit === key}><KitShirt club={club} color={career.kit[key]} trim={career.kit.trim} pattern={kitPatterns[key]} sponsor={shirtSponsor} edition={label} /><span className="kit-edit-ribbon">{focusedKit === key ? "IN THE DESIGN ROOM" : "SELECT DESIGN"}</span></button><div className="kit-card-caption"><strong>{label} KIT</strong><small>{key === "home" ? "THE COLOURS OF HOME" : key === "away" ? "MADE FOR THE ROAD" : "A DIFFERENT SIDE"}</small></div><label className="field-label kit-pattern-label">Shirt identity<select className="field-select" value={kitPatterns[key]} disabled={!designOpen} onChange={(event) => updatePattern(key, event.target.value as KitPattern)}>{KIT_PATTERNS.map((pattern) => <option key={pattern}>{pattern}</option>)}</select></label></article>)}</div>
      <div className="kit-room-status"><span className={designOpen ? "kit-room-open" : ""}><Shirt size={14} /> {designOpen ? "PRE-SEASON DESIGN WINDOW" : `SEASON ${career.season} COLLECTION`}</span><small>{designOpen ? "Finish the home, away and third shirts, then release the collection." : "Kit room opens when the final whistle of the season sounds."}</small></div><div className="kit-colors">{([['home', 'Home'], ['away', 'Away'], ['third', 'Third'], ['trim', 'Trim']] as const).map(([key, label]) => <label className="color-picker" key={key}><span className="color-swatch" style={{ background: career.kit[key] }} /><span>{label}</span><input aria-label={`${label} kit colour`} type="color" value={career.kit[key]} disabled={!designOpen} onChange={(event) => updateKit(key, event.target.value)} /></label>)}</div><div className="kit-brand-note"><Lightbulb size={14} /><span>{designOpen ? `Choose the new ${club.name} shirts. ${shirtSponsor} appears across the chest.` : "The squad wears this season’s collection. A new three-kit design window opens after the final match."}</span></div>{designOpen && <button className="button button-primary button-wide kit-launch" onClick={() => { const next = launchKitCollection(career); setCareer(next); setNotice(`Kit collection launched. ${MONEY(getClub(next).balance - club.balance)} in sales revenue has been added.`); }}>Release collection · launch next season<Shirt size={15} /></button>}{career.kitCollectionSeason === career.season && <div className="kit-launched"><Check size={14} /> Collection launched. Kit sales have been added to club finances.</div>}<div className="badge-editor"><div><p className="eyebrow">CLUB BADGE</p><h3>Badge & colours</h3></div><div className="badge-editor-body"><ClubCrest club={club} size="normal" /><label>Shape<select className="compact-select" value={club.badge?.shape ?? "shield"} onChange={(event) => updateBadge("shape", event.target.value)}>{["shield", "roundel", "diamond", "crest"].map((shape) => <option key={shape}>{shape}</option>)}</select></label><label>Emblem<select className="compact-select" value={club.badge?.emblem ?? "star"} onChange={(event) => updateBadge("emblem", event.target.value)}>{["star", "oak", "tower", "eagle", "anchor", "bridge"].map((emblem) => <option key={emblem}>{emblem}</option>)}</select></label><label>Founded<input className="compact-input" type="number" min="1850" max="2026" value={club.badge?.foundingYear ?? 1900} onChange={(event) => updateBadge("foundingYear", Number(event.target.value))} /></label><label className="badge-color-picker">Primary<input type="color" value={club.badge?.colors[0] ?? club.colors[0]} onChange={(event) => updateBadgeColor(0, event.target.value)} /></label><label className="badge-color-picker">Secondary<input type="color" value={club.badge?.colors[1] ?? club.colors[1]} onChange={(event) => updateBadgeColor(1, event.target.value)} /></label></div></div></section><section className="panel facilities-panel"><div className="card-heading"><div><p className="eyebrow">INVEST FOR TOMORROW</p><h2>Club facilities</h2></div><Building2 size={18} /></div>{notice && <div className="inline-notice"><Check size={15} />{notice}<button onClick={() => setNotice("")}><X size={13} /></button></div>}<FacilityRow icon={Sparkles} name="Youth academy" detail="Annual intake · high potential" level={club.academyLevel} price={(club.academyLevel + 1) * 225000} onUpgrade={() => upgrade("academyLevel", (club.academyLevel + 1) * 225000)} /> <FacilityRow icon={Dumbbell} name="Training centre" detail="Faster player development" level={club.trainingLevel} price={(club.trainingLevel + 1) * 225000} onUpgrade={() => upgrade("trainingLevel", (club.trainingLevel + 1) * 225000)} /><FacilityRow icon={Search} name="Scouting network" detail="A wider view of the transfer market" level={club.scoutLevel} price={(club.scoutLevel + 1) * 160000} onUpgrade={() => upgrade("scoutLevel", (club.scoutLevel + 1) * 160000)} /><div className="academy-note"><div className="academy-note-icon"><Users size={17} /></div><div><small>THIS SEASON’S INTAKE</small><strong>{2 + club.academyLevel} young players</strong><span>The next intake arrives at the end of the season.</span></div></div><div className="staff-note"><BriefcaseBusiness size={16} /><span><strong>Backroom staff</strong> · Head coach, assistant and club doctor are in place.</span><span className="staff-status">ACTIVE</span></div></section></div></>;
}

function FacilityRow({ icon: Icon, name, detail, level, price, onUpgrade }: { icon: LucideIcon; name: string; detail: string; level: number; price: number; onUpgrade: () => void }) {
  return <div className="facility-row"><span className="facility-icon"><Icon size={17} /></span><div className="facility-copy"><strong>{name}</strong><small>{detail}</small></div><div className="facility-level"><div className="level-pips">{[1, 2, 3, 4, 5].map((item) => <i key={item} className={item <= level ? "filled" : ""} />)}</div><small>LEVEL {level}</small></div><button className="facility-upgrade" onClick={onUpgrade} disabled={level >= 5}>{level >= 5 ? "MAX" : `Upgrade · ${MONEY(price)}`}</button></div>;
}

function JobSearch({ career, setCareer }: { career: Career; setCareer: (career: Career) => void }) {
  const vacancies = career.clubs.filter((club) => club.id !== career.clubId && club.reputation <= career.managerReputation + 28).sort((a, b) => b.reputation - a.reputation).slice(0, 4);
  return <section className="job-search"><span className="job-icon"><BriefcaseBusiness size={23} /></span><div className="job-intro"><p className="eyebrow">A NEW CHAPTER</p><h1>Your next job starts here</h1><p>The board has made a decision. Your reputation still carries weight around the league.</p></div><div className="job-stats"><div><span>MANAGER REP</span><strong>{career.managerReputation}</strong></div><div><span>SEASONS MANAGED</span><strong>{career.history.length + 1}</strong></div></div><div className="vacancies-title"><p className="eyebrow">CURRENT VACANCIES</p><span>{vacancies.length} clubs interested</span></div><div className="vacancy-grid">{vacancies.map((club) => <article className="vacancy-card" key={club.id}><ClubCrest club={club} size="normal" /><div><strong>{club.name}</strong><small>{club.city} · Reputation {club.reputation}</small><span>Target · Top {club.targetPosition}</span></div><button className="button button-secondary button-small" onClick={() => setCareer(applyForJob(career, club.id))}>Apply for job</button></article>)}</div>{!vacancies.length && <p className="muted">There are no open positions at your reputation level right now. Improve your profile and try again later.</p>}</section>;
}

export function handleCareerNavigation(setView: (view: View) => void) {
  useEffect(() => {
    const listener = (event: Event) => {
      const target = (event as CustomEvent<string>).detail as View;
      if (NAV_ITEMS.some((item) => item.id === target)) setView(target);
    };
    document.addEventListener("the-club-view", listener);
    return () => document.removeEventListener("the-club-view", listener);
  }, [setView]);
}
