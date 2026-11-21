"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Activity,
  BadgeCheck,
  Banknote,
  Building2,
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
  getFormationSlots,
  getNextFixture,
  getTable,
  getUserPlayers,
  playMatchday,
  renewContract,
  ROOF_OPTIONS,
  setPlayerSelection,
  sponsorProposal,
  startStadiumProject,
  TRAINING_OPTIONS,
  upgradeClubFacility,
} from "@/lib/game";
import type { Career, Club, Player, Roof, Stadium } from "@/lib/game";
import { isSupabaseConfigured, loadLatestOnlineCareer, saveOnlineCareer, supabase } from "@/lib/supabase";

type View = "overview" | "squad" | "tactics" | "fixtures" | "table" | "transfers" | "stadium" | "finance" | "clubhouse";
type StadiumDraft = Omit<Stadium, "project">;

const NAV_ITEMS: { id: View; label: string; icon: LucideIcon; section: string }[] = [
  { id: "overview", label: "Overview", icon: Home, section: "Club" },
  { id: "squad", label: "Squad", icon: Users, section: "Club" },
  { id: "tactics", label: "Tactics", icon: Activity, section: "Club" },
  { id: "fixtures", label: "Fixtures", icon: CalendarDays, section: "Competition" },
  { id: "table", label: "League table", icon: Trophy, section: "Competition" },
  { id: "transfers", label: "Transfers", icon: RefreshCw, section: "Recruitment" },
  { id: "stadium", label: "Stadium architect", icon: Building2, section: "Development" },
  { id: "finance", label: "Finances", icon: Wallet, section: "Development" },
  { id: "clubhouse", label: "Clubhouse", icon: Shirt, section: "Development" },
];

const MONEY = (amount: number) => formatMoney(amount, true);

function crestStyle(colors: [string, string]) {
  return { background: `linear-gradient(145deg, ${colors[0]} 0 52%, ${colors[1]} 52% 100%)` };
}

function ClubCrest({ club, size = "normal" }: { club: Pick<Club, "shortName" | "colors">; size?: "small" | "normal" | "large" }) {
  return <span className={`club-crest crest-${size}`} style={crestStyle(club.colors)}>{club.shortName.slice(0, 3)}</span>;
}

function pageDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
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

function SectionHeading({ kicker, title, detail, action }: { kicker: string; title: string; detail?: string; action?: ReactNode }) {
  return <div className="section-heading"><div><p className="eyebrow">{kicker}</p><h1>{title}</h1>{detail && <p className="muted section-detail">{detail}</p>}</div>{action}</div>;
}

function Metric({ icon: Icon, label, value, foot, accent = false }: { icon: LucideIcon; label: string; value: string; foot?: string; accent?: boolean }) {
  return <article className={`metric-card ${accent ? "metric-accent" : ""}`}><div className="metric-top"><span>{label}</span><Icon size={17} strokeWidth={1.7} /></div><strong>{value}</strong>{foot && <small>{foot}</small>}</article>;
}

export default function TheClub() {
  const [ready, setReady] = useState(false);
  const [career, setCareer] = useState<Career | null>(null);
  const [mode, setMode] = useState<"welcome" | "new" | "game">("welcome");
  const [view, setView] = useState<View>("overview");
  const [managerName, setManagerName] = useState("");
  const [selectedClub, setSelectedClub] = useState("WPR");
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
      if (stored) setCareer(JSON.parse(stored) as Career);
    } catch {
      localStorage.removeItem("the-club-career-v1");
    }
    setReady(true);
  }, []);

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
        setCareer(remote);
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
  }, [career, ready, session?.user.id, cloudReady]);

  const startNewCareer = () => {
    const next = createCareer(managerName, selectedClub);
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

  if (!ready) return <div className="boot-screen"><div className="brand-mark"><Shield size={23} /></div><span>Setting the touchline…</span></div>;
  if (mode !== "game" || !career) {
    return (
      <div className="start-screen">
        <div className="start-top"><div className="wordmark"><span className="brand-mark"><Shield size={20} /></span><span>THE CLUB</span><span className="wordmark-sub">FOOTBALL MANAGEMENT</span></div><button className="button button-quiet" onClick={() => setAuthOpen(true)}><Cloud size={16} /> {session ? session.user.email : "Cloud saves"}</button></div>
        <div className="start-layout">
          <div className="start-copy"><div className="live-pill"><span /> A CLUB IS BUILT EVERY DAY</div><h1>Football is a game.<br /><em>Building a club</em> is everything.</h1><p>Pick your ground. Build a squad. Put your name on a season that belongs to you.</p><div className="start-proof"><div><strong>12</strong><span>fictional clubs</span></div><div><strong>22</strong><span>match league</span></div><div><strong>∞</strong><span>seasons to build</span></div></div><div className="start-stadium-glow" /></div>
          {mode === "welcome" && career ? (
            <section className="welcome-card"><p className="eyebrow">YOUR CAREER IS READY</p><h2>Welcome back, {career.manager}</h2><div className="welcome-club"><ClubCrest club={getClub(career)} size="large" /><div><strong>{getClub(career).name}</strong><span>Season {career.season} · Matchday {Math.min(career.round, 22)} of 22</span></div></div><button className="button button-primary button-wide" onClick={() => setMode("game")}>Continue career</button><button className="button button-secondary button-wide" onClick={() => { if (window.confirm("Start a new career? Your current save will remain available in this browser.")) setMode("new"); }}>Start a new career</button><div className="local-save-note"><Save size={14} /> {syncLabel}</div></section>
          ) : mode === "new" ? (
            <section className="setup-card"><div className="setup-heading"><span className="step-count">01</span><div><p className="eyebrow">NEW CAREER</p><h2>Choose your club</h2></div></div><label className="field-label" htmlFor="manager-name">Manager name</label><input id="manager-name" className="text-input" maxLength={28} placeholder="e.g. Jamie Taylor" value={managerName} onChange={(event) => setManagerName(event.target.value)} /><div className="club-picker-heading"><span>League One · England</span><span>{CLUB_OPTIONS.length} clubs</span></div><div className="club-picker">{CLUB_OPTIONS.map((club) => <button key={club.id} onClick={() => setSelectedClub(club.id)} className={`club-choice ${selectedClub === club.id ? "selected" : ""}`}><ClubCrest club={{ shortName: club.id, colors: club.colors }} size="small" /><span><strong>{club.name}</strong><small>{club.city} · {club.capacity.toLocaleString("en-GB")}</small></span>{selectedClub === club.id && <Check size={16} className="choice-check" />}</button>)}</div><button className="button button-primary button-wide start-career" onClick={startNewCareer}>Begin your career <Sparkles size={16} /></button><button className="button button-quiet button-wide" onClick={() => setMode(career ? "welcome" : "new")}>Back</button></section>
          ) : (
            <section className="setup-card welcome-first"><div className="setup-heading"><span className="step-count"><Flag size={17} /></span><div><p className="eyebrow">A NEW CHAPTER</p><h2>Take the chair</h2></div></div><p className="setup-intro">The board has a plan. The supporters have hope. Start with a club and give them a season to remember.</p><button className="button button-primary button-wide" onClick={() => setMode("new")}>New career <Plus size={16} /></button><button className="button button-quiet button-wide" onClick={() => setAuthOpen(true)}><Cloud size={16} /> Set up cloud saves</button><p className="local-note">Careers save automatically in this browser.</p></section>
          )}
        </div>
        <div className="start-footer"><span>EST. 2026</span><span>THE GAME BELONGS TO YOU</span><span>PLAY AT YOUR PACE</span></div>
        {authOpen && <CloudModal session={session} email={authEmail} setEmail={setAuthEmail} message={authMessage} setMessage={setAuthMessage} onClose={() => setAuthOpen(false)} onSubmit={handleMagicLink} onSignOut={signOut} />}
      </div>
    );
  }

  return <CareerLayout career={career} setCareer={setCareer} view={view} setView={setView} session={session} syncLabel={syncLabel} onCloud={() => setAuthOpen(true)} authOpen={authOpen} setAuthOpen={setAuthOpen} authEmail={authEmail} setAuthEmail={setAuthEmail} authMessage={authMessage} setAuthMessage={setAuthMessage} onMagicLink={handleMagicLink} onSignOut={signOut} mobileNav={mobileNav} setMobileNav={setMobileNav} navSearch={navSearch} setNavSearch={setNavSearch} />;
}

function CloudModal({ session, email, setEmail, message, setMessage, onClose, onSubmit, onSignOut }: {
  session: Session | null; email: string; setEmail: (value: string) => void; message: string; setMessage: (value: string) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onSignOut: () => void;
}) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal-card auth-modal"><button className="modal-close" aria-label="Close" onClick={onClose}><X size={18} /></button><div className="modal-icon"><Cloud size={20} /></div><p className="eyebrow">CAREER BACKUP</p><h2>{session ? "Cloud save connected" : "Take your career anywhere"}</h2>{session ? <><p>Your careers are syncing to {session.user.email}. They’ll be ready when you return on another device.</p><div className="cloud-state"><BadgeCheck size={16} /> Cloud sync active</div><div className="modal-actions"><button className="button button-secondary" onClick={onSignOut}>Sign out</button><button className="button button-primary" onClick={onClose}>Done</button></div></> : isSupabaseConfigured ? <form onSubmit={onSubmit}><p>We’ll send a one-time sign-in link. Your career stays private to your account.</p><label className="field-label" htmlFor="cloud-email">Email address</label><input id="cloud-email" className="text-input" type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setMessage(""); }} placeholder="you@example.com" required /><button className="button button-primary button-wide modal-submit" type="submit"><Mail size={15} /> Send sign-in link</button>{message && <p className="form-message">{message}</p>}</form> : <><p>Cloud saves need a Supabase project and its public connection keys. Until that is connected, your career is saved on this browser and can be continued here.</p><div className="setup-note"><span className="note-icon"><Lightbulb size={15} /></span><span>Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> after the project is connected.</span></div><p className="muted">Never add a Supabase secret key to the browser app.</p><button className="button button-primary button-wide" onClick={onClose}>Got it</button></>}</section></div>;
}

function CareerLayout({ career, setCareer, view, setView, session, syncLabel, onCloud, authOpen, setAuthOpen, authEmail, setAuthEmail, authMessage, setAuthMessage, onMagicLink, onSignOut, mobileNav, setMobileNav, navSearch, setNavSearch }: {
  career: Career; setCareer: (career: Career) => void; view: View; setView: (view: View) => void; session: Session | null; syncLabel: string; onCloud: () => void; authOpen: boolean; setAuthOpen: (open: boolean) => void; authEmail: string; setAuthEmail: (email: string) => void; authMessage: string; setAuthMessage: (message: string) => void; onMagicLink: (event: FormEvent<HTMLFormElement>) => void; onSignOut: () => void; mobileNav: boolean; setMobileNav: (open: boolean) => void; navSearch: string; setNavSearch: (search: string) => void;
}) {
  handleCareerNavigation(setView);
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
  const filteredNav = NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(navSearch.toLowerCase()));
  const activeTitle = NAV_ITEMS.find((item) => item.id === view)?.label ?? "Overview";
  const seasonEnd = career.round > 22;
  const nextAction = () => setCareer(seasonEnd ? beginNextSeason(career) : playMatchday(career));

  return <div className="app-shell">
    {mobileNav && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileNav(false)} />}
    <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
      <div className="sidebar-brand"><span className="brand-mark"><Shield size={19} /></span><span>THE CLUB</span><button className="mobile-close" aria-label="Close menu" onClick={() => setMobileNav(false)}><X size={19} /></button></div>
      <button className="club-selector" onClick={() => setView("overview")}><ClubCrest club={club} size="small" /><span className="club-selector-copy"><strong>{club.name}</strong><small>League One · {2026 + career.season - 1}/{String(2027 + career.season - 1).slice(-2)}</small></span><ChevronDown size={15} /></button>
      <div className="nav-search-wrap"><Search size={15} /><input aria-label="Find a section" value={navSearch} onChange={(event) => setNavSearch(event.target.value)} placeholder="Find a section" /><kbd>⌘ K</kbd></div>
      <nav className="main-nav">{["Club", "Competition", "Recruitment", "Development"].map((section) => {
        const links = filteredNav.filter((item) => item.section === section);
        if (!links.length) return null;
        return <div className="nav-group" key={section}><p className="nav-label">{section}</p>{links.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-link ${view === id ? "active" : ""}`} onClick={() => { setView(id); setMobileNav(false); }}><Icon size={17} strokeWidth={1.7} /><span>{label}</span>{id === "stadium" && <span className="nav-badge">NEW</span>}</button>)}</div>;
      })}</nav>
      <div className="sidebar-bottom"><div className="club-trust"><div className="trust-header"><span>Board confidence</span><strong>{club.boardTrust}%</strong></div><div className="progress-track"><span style={{ width: `${club.boardTrust}%` }} /></div><small>{club.boardTrust >= 60 ? "The board is behind you" : club.boardTrust >= 35 ? "Results are being watched" : "Your position is at risk"}</small></div><button className="user-row" onClick={onCloud}><span className="user-avatar">{career.manager.split(" ").map((word) => word[0]).slice(0, 2).join("").toUpperCase()}</span><span className="user-copy"><strong>{career.manager}</strong><small>{session ? "Cloud connected" : "Local career"}</small></span><ChevronDown size={14} /></button></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="topbar-left"><button className="menu-toggle" aria-label="Open menu" onClick={() => setMobileNav(true)}><Menu size={20} /></button><div className="top-crumb"><span>MY CLUB</span><b>/</b><strong>{activeTitle}</strong></div></div><div className="topbar-right"><div className="round-indicator"><CalendarDays size={15} /><span>{seasonEnd ? "Season complete" : `Matchday ${career.round} / 22`}</span></div><div className="top-divider" /><div className="save-indicator" title={syncLabel}><span className={session ? "save-dot online" : "save-dot"} /><span>{session ? "Cloud saved" : "Auto-saved"}</span></div><button className="button button-primary advance-button" onClick={nextAction} disabled={career.unemployed}>{seasonEnd ? "Start pre-season" : "Advance to matchday"}<Clock3 size={15} /></button></div></header>
      <main className="content-area">
        {career.unemployed && <JobSearch career={career} setCareer={setCareer} />}
        {!career.unemployed && view === "overview" && <Overview career={career} setCareer={setCareer} onAdvance={nextAction} seasonEnd={seasonEnd} />}
        {view === "squad" && <Squad career={career} setCareer={setCareer} />}
        {view === "tactics" && <Tactics career={career} setCareer={setCareer} />}
        {view === "fixtures" && <Fixtures career={career} setCareer={setCareer} onAdvance={nextAction} seasonEnd={seasonEnd} />}
        {view === "table" && <LeagueTable career={career} />}
        {view === "transfers" && <Transfers career={career} setCareer={setCareer} />}
        {view === "stadium" && <StadiumArchitect career={career} setCareer={setCareer} />}
        {view === "finance" && <Finance career={career} setCareer={setCareer} />}
        {view === "clubhouse" && <Clubhouse career={career} setCareer={setCareer} />}
      </main>
      <footer className="app-footer"><span><span className="footer-mark" /> THE CLUB · SEASON {career.season}</span><button className="footer-save" onClick={onCloud}><Cloud size={14} /> {syncLabel}</button></footer>
    </div>
    {authOpen && <CloudModal session={session} email={authEmail} setEmail={setAuthEmail} message={authMessage} setMessage={setAuthMessage} onClose={() => setAuthOpen(false)} onSubmit={onMagicLink} onSignOut={onSignOut} />}
  </div>;
}

function Overview({ career, setCareer, onAdvance, seasonEnd }: { career: Career; setCareer: (career: Career) => void; onAdvance: () => void; seasonEnd: boolean }) {
  const club = getClub(career);
  const table = getTable(career);
  const rank = table.findIndex((row) => row.clubId === career.clubId) + 1;
  const nextFixture = getNextFixture(career);
  const homeClub = nextFixture ? getClub(career, nextFixture.homeClubId) : null;
  const awayClub = nextFixture ? getClub(career, nextFixture.awayClubId) : null;
  const currentRow = table.find((row) => row.clubId === career.clubId)!;
  const recentNews = career.news.slice(0, 4);
  const [reportDismissed, setReportDismissed] = useState(false);

  return <>
    <SectionHeading kicker={getCurrentDate(career).toUpperCase()} title={`Good morning, ${career.manager.split(" ")[0]}`} detail={`${club.name} · League One · ${2026 + career.season - 1}/${String(2027 + career.season - 1).slice(-2)}`} action={<button className="button button-secondary" onClick={() => { setCareer(sponsorProposal(career)); document.dispatchEvent(new CustomEvent("the-club-view", { detail: "finance" })); }}><Megaphone size={15} /> Commercial meeting</button>} />
    <div className="metrics-grid"><Metric icon={Trophy} label="League position" value={getPos(rank)} foot={`${currentRow.points} points · ${currentRow.played} played`} accent /><Metric icon={Banknote} label="Club balance" value={MONEY(club.balance)} foot={`${MONEY(club.transferBudget)} transfer budget`} /><Metric icon={Shield} label="Board confidence" value={`${club.boardTrust}%`} foot={club.boardTrust >= 60 ? "Secure" : "Under review"} /><Metric icon={Users} label="Supporter confidence" value={`${club.supporterConfidence}%`} foot="Season average" /></div>
    <div className="overview-grid"><section className="next-match-card"><div className="match-topline"><div className="match-label"><span className="match-live-dot" /> NEXT MATCH</div><span>{seasonEnd ? "PRE-SEASON" : `LEAGUE ONE · MATCHDAY ${career.round}`}</span></div>{nextFixture && homeClub && awayClub ? <><div className="match-date">{pageDate(nextFixture.date)} <span>·</span> 15:00 <span>·</span> {nextFixture.homeClubId === career.clubId ? "Home" : "Away"}</div><div className="match-sides"><div className="match-team"><ClubCrest club={homeClub} size="large" /><strong>{homeClub.name}</strong><small>HOME</small></div><div className="match-vs"><span>VS</span><i /></div><div className="match-team"><ClubCrest club={awayClub} size="large" /><strong>{awayClub.name}</strong><small>AWAY</small></div></div><div className="match-bottom"><span><MapPin size={14} /> {nextFixture.homeClubId === career.clubId ? club.stadium.name : awayClub.city}</span><button className="button button-primary" onClick={onAdvance}>Play matchday <Flag size={15} /></button></div></> : <div className="season-end-card"><div className="season-end-icon"><Trophy size={22} /></div><div><strong>That’s the season</strong><p>Take a look back, then prepare your squad for a new campaign.</p></div><button className="button button-primary" onClick={onAdvance}>Start next season <RefreshCw size={15} /></button></div>}{career.lastReport && !reportDismissed && <div className="match-report"><div className="report-icon"><Newspaper size={15} /></div><div><small>MATCH REPORT · {career.lastReport.result}</small><strong>{career.lastReport.headline}</strong><span>{career.lastReport.notes[0]}</span></div><button aria-label="Dismiss report" onClick={() => setReportDismissed(true)}><X size={15} /></button></div>}</section>
      <section className="table-card"><div className="card-heading"><div><p className="eyebrow">THE RUN-IN</p><h2>League table</h2></div><button className="text-button" onClick={() => document.dispatchEvent(new CustomEvent("the-club-view", { detail: "table" }))}>Full table</button></div><div className="mini-table-head"><span>#</span><span>Club</span><span>P</span><span>GD</span><span>Pts</span></div><div className="mini-table-body">{table.filter((row) => row.clubId !== career.clubId).slice(0, 4).map((row) => { const position = table.findIndex((entry) => entry.clubId === row.clubId) + 1; return <div key={row.clubId} className="mini-table-row"><span className="table-rank">{position}</span><span className="mini-club-name"><ClubCrest club={getClub(career, row.clubId)} size="small" />{row.club}</span><span>{row.played}</span><span className={row.goalsFor - row.goalsAgainst < 0 ? "negative" : ""}>{row.goalsFor - row.goalsAgainst > 0 ? "+" : ""}{row.goalsFor - row.goalsAgainst}</span><strong>{row.points}</strong></div>; })}</div><div className="table-cutline"><span>YOUR CLUB</span><i /></div><div className="mini-table-row current-last current"><span className="table-rank">{rank}</span><span className="mini-club-name"><ClubCrest club={club} size="small" />{club.name}</span><span>{currentRow.played}</span><span>{currentRow.goalsFor - currentRow.goalsAgainst > 0 ? "+" : ""}{currentRow.goalsFor - currentRow.goalsAgainst}</span><strong>{currentRow.points}</strong></div></section></div>
    <div className="lower-grid"><section className="news-card"><div className="card-heading"><div><p className="eyebrow">AROUND THE GROUND</p><h2>Club news</h2></div><Newspaper size={17} /></div><div className="news-list">{recentNews.map((news) => <article key={news.id} className="news-item"><span className={`news-type type-${news.type}`}>{news.type === "match" ? <Flag size={15} /> : news.type === "stadium" ? <Building2 size={15} /> : news.type === "transfer" ? <RefreshCw size={15} /> : <Megaphone size={15} />}</span><div><small>{news.date} · {news.type.toUpperCase()}</small><strong>{news.headline}</strong><p>{news.body}</p></div></article>)}</div></section><section className="club-focus-card"><div className="card-heading"><div><p className="eyebrow">A CLUB WORTH BUILDING</p><h2>On and off the pitch</h2></div><Sparkles size={17} /></div><div className="focus-row"><span className="focus-icon"><Building2 size={16} /></span><div><strong>{club.stadium.name}</strong><small>{club.stadium.capacity.toLocaleString("en-GB")} capacity · {club.stadium.tiers} tier{club.stadium.tiers === 1 ? "" : "s"}</small></div><button className="focus-open" onClick={() => document.dispatchEvent(new CustomEvent("the-club-view", { detail: "stadium" }))}>Design</button></div><div className="focus-row"><span className="focus-icon"><Store size={16} /></span><div><strong>{club.sponsor}</strong><small>{MONEY(club.sponsorAnnual)} annual sponsor</small></div><button className="focus-open" onClick={() => { setCareer(sponsorProposal(career)); document.dispatchEvent(new CustomEvent("the-club-view", { detail: "finance" })); }}>Negotiate</button></div><div className="target-box"><span className="target-icon"><TargetIcon /></span><div><small>BOARD SEASON TARGET</small><strong>Finish in the top {club.targetPosition}</strong></div><span className={`target-status ${rank <= club.targetPosition ? "on-target" : "off-target"}`}>{rank <= club.targetPosition ? "ON COURSE" : "NEED A RUN"}</span></div></section></div>
  </>;
}

function TargetIcon() { return <Flag size={16} />; }

function Squad({ career, setCareer }: { career: Career; setCareer: (career: Career) => void }) {
  const [filter, setFilter] = useState("All players");
  const [notice, setNotice] = useState("");
  const players = getUserPlayers(career).filter((player) => filter === "All players" || player.position === filter);
  const allPlayers = getUserPlayers(career);
  const starters = career.lineup.length;
  const setTraining = (playerId: string, trainingFocus: string) => {
    const next = structuredClone(career);
    const player = next.players.find((item) => item.id === playerId);
    if (player) player.trainingFocus = trainingFocus;
    setCareer(next);
  };

  return <><SectionHeading kicker="FIRST TEAM" title="The squad" detail={`${allPlayers.length} players · ${starters} selected · ${allPlayers.filter((player) => player.contractYears <= 1).length} contracts expiring`} action={<button className="button button-secondary" onClick={() => setCareer({ ...structuredClone(career), lineup: [...allPlayers.sort((a, b) => b.overall - a.overall).slice(0, 11).map((player) => player.id)] })}><Sparkles size={15} /> Auto select XI</button>} />
    <div className="squad-summary"><div><span className="rating-chip">{Math.round(allPlayers.reduce((sum, player) => sum + player.overall, 0) / Math.max(1, allPlayers.length))}</span><span><strong>Squad rating</strong><small>Balanced · {allPlayers.length} senior players</small></span></div><div><span className="summary-stat">{MONEY(allPlayers.reduce((sum, player) => sum + player.wage, 0))}</span><span><strong>Weekly wages</strong><small>{MONEY(getClub(career).wageBudget)} budget</small></span></div><div><span className="summary-stat">{allPlayers.filter((player) => player.contractYears <= 1).length}</span><span><strong>Contract watch</strong><small>Players need a decision</small></span></div></div>
    <section className="panel table-panel"><div className="panel-toolbar"><div className="filter-tabs">{["All players", "GK", "DEF", "MID", "FWD"].map((tab) => <button key={tab} onClick={() => setFilter(tab)} className={filter === tab ? "selected" : ""}>{tab}</button>)}</div><span className="squad-table-caption">SELECTED {starters} / 11</span></div>{notice && <div className="inline-notice"><Check size={15} />{notice}<button onClick={() => setNotice("")}><X size={13} /></button></div>}<div className="data-table-wrap"><table className="data-table squad-table"><thead><tr><th>Player</th><th>Pos</th><th>Age</th><th>OVR</th><th>Potential</th><th>Morale</th><th>Contract</th><th>Wage / wk</th><th>Training</th><th>Role</th><th /></tr></thead><tbody>{players.map((player) => <tr key={player.id}><td><div className="player-cell"><span className={`player-position position-${player.position.toLowerCase()}`}>{player.position.slice(0, 1)}</span><div><strong>{player.name}</strong><small>{player.overall >= 75 ? "Key player" : player.age < 21 ? "Young prospect" : "First team"}</small></div></div></td><td>{player.position}</td><td>{player.age}</td><td><span className={`ovr-badge ${player.overall >= 72 ? "high" : player.overall < 56 ? "low" : ""}`}>{player.overall}</span></td><td><div className="potential-cell"><span>{player.potential}</span><div className="tiny-progress"><i style={{ width: `${Math.round(player.overall / player.potential * 100)}%` }} /></div></div></td><td><span className="morale-cell"><i style={{ width: `${player.morale}%` }} /><span>{player.morale}</span></span></td><td><span className={player.contractYears <= 1 ? "contract-warning" : ""}>{player.contractYears} {player.contractYears === 1 ? "yr" : "yrs"}</span>{player.contractYears <= 1 && <button className="renew-link" onClick={() => { setCareer(renewContract(career, player.id)); setNotice(`${player.name} agrees a new deal.`); }}>Renew</button>}</td><td>{MONEY(player.wage)}</td><td><select className="compact-select" aria-label={`Training focus for ${player.name}`} value={player.trainingFocus} onChange={(event) => setTraining(player.id, event.target.value)}>{TRAINING_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></td><td><button className={`role-button ${career.lineup.includes(player.id) ? "in-xi" : ""}`} onClick={() => setCareer(setPlayerSelection(career, player.id))}>{career.lineup.includes(player.id) ? "Starting XI" : "Select"}</button></td><td><button className="row-more" aria-label={`Renew contract for ${player.name}`} title="Renew contract" onClick={() => { setCareer(renewContract(career, player.id)); setNotice(`${player.name} agrees a new deal.`); }}><Plus size={15} /></button></td></tr>)}</tbody></table></div><div className="table-footer"><span>Showing {players.length} players</span><span>Development is shaped by training, age and potential.</span></div></section></>;
}

function Tactics({ career, setCareer }: { career: Career; setCareer: (career: Career) => void }) {
  const selected = career.lineup.map((id) => career.players.find((player) => player.id === id)).filter((player): player is Player => Boolean(player));
  const positions = getFormationSlots(career.formation);
  const grouped = ["GK", "DEF", "MID", "FWD"].map((position) => selected.filter((player) => player.position === position));
  const update = (field: "formation" | "mentality" | "style", value: string) => setCareer({ ...career, [field]: value });
  return <><SectionHeading kicker="MATCH PREPARATION" title="Tactics board" detail="Set your shape, then choose how the team should play." action={<span className="tactics-status"><span /> READY FOR MATCHDAY</span>} /><div className="tactics-layout"><section className="pitch-panel"><div className="pitch-title"><span>YOUR STARTING SHAPE</span><strong>{career.formation}</strong></div><svg className="tactics-pitch" viewBox="0 0 520 630" role="img" aria-label={`Football pitch showing a ${career.formation} formation`}><defs><linearGradient id="pitchGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#145543" /><stop offset="1" stopColor="#103f34" /></linearGradient></defs><rect x="8" y="8" width="504" height="614" rx="12" fill="url(#pitchGradient)" stroke="#39806d" strokeWidth="1.5" /><path d="M8 315H512M147 8V115H373V8M147 622V515H373V622" fill="none" stroke="#6ba08f" strokeOpacity=".45" strokeWidth="2" /><circle cx="260" cy="315" r="73" fill="none" stroke="#6ba08f" strokeOpacity=".45" strokeWidth="2" /><circle cx="260" cy="315" r="4" fill="#6ba08f" /><rect x="201" y="8" width="118" height="34" fill="none" stroke="#6ba08f" strokeOpacity=".45" strokeWidth="2" /><rect x="201" y="588" width="118" height="34" fill="none" stroke="#6ba08f" strokeOpacity=".45" strokeWidth="2" /><circle cx="260" cy="73" r="4" fill="#6ba08f" /><circle cx="260" cy="557" r="4" fill="#6ba08f" />{positions.map((position, index) => {
    const samePosition = positions.filter((candidate) => candidate === position);
    const offset = samePosition.indexOf(position);
    const x = 90 + (positions.slice(0, index).filter((item) => item === position).length + 1) * (340 / (samePosition.length + 1));
    const y = position === "GK" ? 560 : position === "DEF" ? 450 : position === "MID" ? 330 : 180;
    const player = selected[index];
    return <g key={`${position}-${index}`} className="pitch-player"><circle cx={x} cy={y} r="19" fill={career.kit.home} stroke="#f8fbf8" strokeWidth="2" /><text x={x} y={y + 4} textAnchor="middle" fill={career.kit.trim} fontSize="11" fontWeight="700">{player?.overall ?? "—"}</text><text x={x} y={y + 34} textAnchor="middle" fill="#e9f4ee" fontSize="10">{player?.name.split(" ").at(-1) ?? position}</text></g>;
  })}</svg><div className="pitch-legend"><span><i className="legend-dot" /> Starting player</span><span>{selected.length} / 11 players selected</span></div></section><section className="tactic-controls"><div className="panel card-pad"><div className="card-heading"><div><p className="eyebrow">TEAM SHAPE</p><h2>Formation</h2></div><Activity size={17} /></div><div className="formation-grid">{["4-4-2", "4-3-3", "4-2-3-1", "3-5-2"].map((formation) => <button key={formation} className={`formation-card ${career.formation === formation ? "selected" : ""}`} onClick={() => update("formation", formation)}><span className={`formation-mini formation-${formation.replaceAll("-", "")}`}><i /><i /><i /><i /></span><strong>{formation}</strong><small>{formation === "4-4-2" ? "Balanced" : formation === "4-3-3" ? "Forward press" : formation === "4-2-3-1" ? "Control" : "Midfield overload"}</small></button>)}</div></div><div className="panel card-pad"><div className="card-heading"><div><p className="eyebrow">APPROACH</p><h2>Match mentality</h2></div><Flag size={17} /></div><div className="choice-row">{["Cautious", "Balanced", "Attacking"].map((option) => <button key={option} className={career.mentality === option ? "selected" : ""} onClick={() => update("mentality", option)}>{option}</button>)}</div></div><div className="panel card-pad"><div className="card-heading"><div><p className="eyebrow">ON THE BALL</p><h2>Playing style</h2></div><Sparkles size={17} /></div><div className="choice-row">{["Possession", "High press", "Counter attack"].map((option) => <button key={option} className={career.style === option ? "selected" : ""} onClick={() => update("style", option)}>{option}</button>)}</div></div><div className="lineup-panel"><div className="card-heading"><div><p className="eyebrow">MATCHDAY SELECTION</p><h2>Starting XI</h2></div><span>{selected.length} / 11</span></div>{["GK", "DEF", "MID", "FWD"].map((position, index) => <div className="lineup-row" key={position}><span className="lineup-position">{position}</span><div>{grouped[index].map((player) => <span className="lineup-player" key={player.id}>{player.name}</span>)}</div></div>)}{selected.length < 11 && <p className="lineup-warning"><Lightbulb size={14} /> Choose {11 - selected.length} more player{11 - selected.length === 1 ? "" : "s"} from your squad.</p>}</div></section></div></>;
}

function Fixtures({ career, setCareer, onAdvance, seasonEnd }: { career: Career; setCareer: (career: Career) => void; onAdvance: () => void; seasonEnd: boolean }) {
  const fixtures = career.fixtures.filter((fixture) => fixture.round >= Math.max(1, career.round - 2) && fixture.round <= Math.min(22, career.round + 5));
  const open = career.fixtures.filter((fixture) => fixture.round === career.round);
  return <><SectionHeading kicker="LEAGUE ONE · ${2026 + career.season - 1}/${String(2027 + career.season - 1).slice(-2)}" title="Fixtures & results" detail="Every match in the season, with results added as the weeks pass." action={<button className="button button-primary" disabled={career.unemployed} onClick={onAdvance}>{seasonEnd ? "Begin next season" : "Play next matchday"}<Clock3 size={15} /></button>} /><div className="fixtures-toolbar"><div className="fixtures-key"><span><i className="fixture-current-dot" /> Current matchday</span><span><i className="fixture-played-dot" /> Played</span></div><span>22 MATCHDAYS · HOME & AWAY</span></div><div className="fixture-list">{fixtures.map((fixture) => {
    const isUser = fixture.homeClubId === career.clubId || fixture.awayClubId === career.clubId;
    const isCurrent = fixture.round === career.round;
    const home = getClub(career, fixture.homeClubId);
    const away = getClub(career, fixture.awayClubId);
    return <div key={fixture.id} className={`fixture-row ${isCurrent ? "fixture-current" : ""} ${isUser ? "fixture-user" : ""}`}><div className="fixture-round"><small>MATCHDAY</small><strong>{String(fixture.round).padStart(2, "0")}</strong></div><div className="fixture-date">{pageDate(fixture.date)}</div><div className="fixture-home"><strong>{home.name}</strong><ClubCrest club={home} size="small" /></div><div className="fixture-score">{fixture.played ? `${fixture.homeGoals} – ${fixture.awayGoals}` : <span>15:00</span>}</div><div className="fixture-away"><ClubCrest club={away} size="small" /><strong>{away.name}</strong></div><div className="fixture-status">{fixture.played ? <span className="played-label">FULL TIME</span> : isCurrent ? <span className="up-next-label">UP NEXT</span> : <span className="scheduled-label">SCHEDULED</span>}</div></div>;
  })}</div><div className="season-fixture-foot"><span>{open.length ? `${open.length} fixtures scheduled for this matchday` : "All fixtures completed"}</span><span>Your result updates league position, board confidence and finances.</span></div></>;
}

function LeagueTable({ career }: { career: Career }) {
  const table = getTable(career);
  return <><SectionHeading kicker={`LEAGUE ONE · ${2026 + career.season - 1}/${String(2027 + career.season - 1).slice(-2)}`} title="League table" detail="The table updates across all 12 clubs after every matchday." action={<div className="table-status"><span className="match-live-dot" /> LIVE TABLE</div>} /><section className="panel league-panel"><div className="league-table-caption"><span>LEAGUE ONE</span><span>AFTER MATCHDAY {Math.max(0, career.round - 1)} OF 22</span></div><div className="data-table-wrap"><table className="data-table league-table"><thead><tr><th>Pos</th><th>Club</th><th>Pld</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead><tbody>{table.map((row, index) => <tr key={row.clubId} className={row.clubId === career.clubId ? "current-row" : ""}><td><span className={`league-rank ${index === 0 ? "top-rank" : index >= 10 ? "bottom-rank" : ""}`}>{String(index + 1).padStart(2, "0")}</span></td><td><div className="league-club"><ClubCrest club={getClub(career, row.clubId)} size="small" /><strong>{row.club}</strong>{row.clubId === career.clubId && <span className="you-tag">YOU</span>}</div></td><td>{row.played}</td><td>{row.wins}</td><td>{row.draws}</td><td>{row.losses}</td><td>{row.goalsFor}</td><td>{row.goalsAgainst}</td><td><span className={row.goalsFor - row.goalsAgainst < 0 ? "negative" : "positive"}>{row.goalsFor - row.goalsAgainst > 0 ? "+" : ""}{row.goalsFor - row.goalsAgainst}</span></td><td><strong className="points-cell">{row.points}</strong></td></tr>)}</tbody></table></div><div className="league-legend"><span><i className="legend-promotion" /> Promotion play-off places</span><span><i className="legend-current" /> Your club</span><span><i className="legend-relegation" /> Relegation places</span></div></section><div className="table-note"><Lightbulb size={15} /><span>Positions are decided by points, goal difference, then goals scored. Every club plays each opponent twice.</span></div></>;
}

function Transfers({ career, setCareer }: { career: Career; setCareer: (career: Career) => void }) {
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [offers, setOffers] = useState<Record<string, string>>({});
  const club = getClub(career);
  const market = career.players.filter((player) => player.clubId !== career.clubId && (!query || player.name.toLowerCase().includes(query.toLowerCase()) || player.position.toLowerCase().includes(query.toLowerCase()))).sort((a, b) => b.overall - a.overall).slice(0, 28);
  const makeOffer = (player: Player) => {
    const value = Number(offers[player.id] ?? (player.clubId ? Math.round(player.value * 0.8) : 0));
    const next = buyPlayer(career, player.id, value);
    if (next === career) setNotice(value > club.transferBudget ? "The offer is above your remaining transfer budget." : "The club has rejected that offer. Raise it to at least 72% of the asking value.");
    else {
      setCareer(next);
      setNotice(`${player.name} has signed a three-year contract.`);
    }
  };
  return <><SectionHeading kicker="RECRUITMENT" title="Transfer market" detail="Scout the market, agree a fee, and add quality to your squad." action={<div className="budget-pill"><Wallet size={15} /><span>TRANSFER BUDGET</span><strong>{MONEY(club.transferBudget)}</strong></div>} /><div className="transfer-banner"><div className="transfer-banner-icon"><Search size={19} /></div><div><p className="eyebrow">SCOUTING DEPARTMENT</p><strong>Find the right fit for your club</strong><span>Free agents need no fee. Contracted players require an accepted offer.</span></div><span className="scout-rating">SCOUT LEVEL {club.scoutLevel}</span></div><section className="panel market-panel"><div className="panel-toolbar"><div className="market-heading"><div><p className="eyebrow">AVAILABLE PLAYERS</p><h2>Shortlist</h2></div><span>{market.length} shown</span></div><div className="market-search"><Search size={15} /><input aria-label="Search players" placeholder="Name or position" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div>{notice && <div className="inline-notice"><Check size={15} />{notice}<button onClick={() => setNotice("")}><X size={13} /></button></div>}<div className="data-table-wrap"><table className="data-table transfer-table"><thead><tr><th>Player</th><th>Pos</th><th>Age</th><th>OVR</th><th>Potential</th><th>Club</th><th>Value</th><th>Your offer</th><th>Contract</th><th /></tr></thead><tbody>{market.map((player) => <tr key={player.id}><td><div className="player-cell"><span className={`player-position position-${player.position.toLowerCase()}`}>{player.position.slice(0, 1)}</span><div><strong>{player.name}</strong><small>{player.morale > 75 ? "Happy to move" : "Open to offers"}</small></div></div></td><td>{player.position}</td><td>{player.age}</td><td><span className={`ovr-badge ${player.overall >= 72 ? "high" : ""}`}>{player.overall}</span></td><td>{player.potential}</td><td>{player.clubId ? getClub(career, player.clubId).shortName : <span className="free-agent-label">FREE AGENT</span>}</td><td>{player.clubId ? formatPlayerValue(player.value) : <span className="free-agent-label">Free</span>}</td><td><input aria-label={`Offer for ${player.name}`} className="offer-input" type="number" min="0" step="10000" value={offers[player.id] ?? (player.clubId ? Math.round(player.value * 0.8) : 0)} onChange={(event) => setOffers({ ...offers, [player.id]: event.target.value })} /></td><td>{player.contractYears ? `${player.contractYears} yrs` : "Free agent"}</td><td><button className="button button-small button-secondary" disabled={Number(offers[player.id] ?? (player.clubId ? Math.round(player.value * 0.8) : 0)) > club.transferBudget} onClick={() => makeOffer(player)}>{player.clubId ? "Make offer" : "Sign player"}</button></td></tr>)}</tbody></table></div><div className="table-footer"><span>Wage offers are set to the player’s market rate.</span><span>Transfer budget remaining: {MONEY(club.transferBudget)}</span></div></section></>;
}

function StadiumArchitect({ career, setCareer }: { career: Career; setCareer: (career: Career) => void }) {
  const club = getClub(career);
  const stadium = club.stadium;
  const [draft, setDraft] = useState<StadiumDraft>(() => ({ ...stadium }));
  const [message, setMessage] = useState("");
  useEffect(() => setDraft({ ...getClub(career).stadium }), [career.clubId, stadium.capacity, stadium.tiers, stadium.project?.weeksLeft]);
  const change = <K extends keyof StadiumDraft>(key: K, value: StadiumDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const capacity = Math.round(stadium.capacity * (1 + (draft.tiers - stadium.tiers) * 0.19 + (draft.corners !== stadium.corners ? (draft.corners ? 0.06 : -0.06) : 0) + (draft.seats !== stadium.seats ? (draft.seats ? -0.07 : 0.08) : 0)) / 100) * 100;
  const cost = Math.max(0,
    Math.abs(draft.tiers - stadium.tiers) * 1_050_000 +
    (draft.roof !== stadium.roof ? 420_000 : 0) +
    (draft.corners !== stadium.corners ? 330_000 : 0) +
    (draft.seats !== stadium.seats ? 160_000 : 0) +
    Math.abs(draft.boxes - stadium.boxes) * 18_000 +
    Math.abs(draft.floodlights - stadium.floodlights) * 145_000 +
    Math.abs(draft.pitchQuality - stadium.pitchQuality) * 135_000 +
    Math.round(Math.abs(draft.drainage - stadium.drainage) / 20) * 60_000 +
    (draft.carPark !== stadium.carPark ? 620_000 : 0) +
    (draft.superstore !== stadium.superstore ? 470_000 : 0) +
    (draft.restaurant !== stadium.restaurant ? 760_000 : 0) +
    (draft.hotel !== stadium.hotel ? 2_800_000 : 0));
  const changed = cost > 0;
  const duration = Math.max(2, Math.ceil(cost / 850_000));
  const build = () => {
    if (club.stadium.project || !changed) return;
    const upgrades: Partial<Stadium> = { ...draft, capacity };
    const next = startStadiumProject(career, draft.tiers > stadium.tiers ? `${draft.tiers}-tier stand expansion` : draft.hotel !== stadium.hotel ? "Stadium hotel" : draft.roof !== stadium.roof ? "Roof renovation" : "Ground redevelopment", cost, duration, upgrades);
    if (next === career) setMessage(club.boardTrust < 35 ? "The board needs more confidence before approving construction." : "The club needs more cash reserves to finance this project.");
    else { setCareer(next); setMessage("Construction has started. Work will finish over the next matchdays."); }
  };
  const toggle = (key: "standing" | "corners" | "seats" | "carPark" | "superstore" | "restaurant" | "hotel") => change(key, !draft[key]);
  return <><SectionHeading kicker="GROUNDS DEVELOPMENT" title="Stadium architect" detail="Plan a ground that brings in supporters, revenue and a lasting sense of place." action={<div className="venue-league-check"><BadgeCheck size={16} /><span>LEAGUE READY</span><small>5,000 capacity · floodlights</small></div>} />
    <div className="stadium-layout"><section className="stadium-preview-panel"><div className="stadium-preview-header"><div><p className="eyebrow">LIVE BLUEPRINT</p><h2>{stadium.name}</h2><span>{club.city} · {club.country}</span></div><div className="capacity-chip"><small>PROJECTED CAPACITY</small><strong>{capacity.toLocaleString("en-GB")}</strong></div></div><div className="stadium-canvas"><svg className="stadium-svg" viewBox="0 0 740 450" role="img" aria-label={`${stadium.name} stadium blueprint with ${draft.tiers} tiers and ${draft.roof.toLowerCase()}`}><defs><linearGradient id="ground" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#252c32" /><stop offset="1" stopColor="#1a2227" /></linearGradient><linearGradient id="stands" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#30665a" /><stop offset="1" stopColor="#21483f" /></linearGradient><linearGradient id="standshade" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#34414a" /><stop offset="1" stopColor="#232e35" /></linearGradient></defs><rect width="740" height="450" fill="url(#ground)" /><g opacity=".15" stroke="#b6c2c7" strokeWidth="1">{Array.from({ length: 10 }).map((_, i) => <path key={i} d={`M ${25 + i * 76} 0v450`} />)}{Array.from({ length: 7 }).map((_, i) => <path key={`h${i}`} d={`M0 ${45 + i * 60}h740`} />)}</g><g className="stadium-stands"><polygon points="125,77 605,77 555,149 175,149" fill="url(#standshade)" stroke="#55716c" strokeWidth="2" /><polygon points="125,373 605,373 555,301 175,301" fill="url(#standshade)" stroke="#55716c" strokeWidth="2" /><polygon points="83,120 167,150 167,300 83,330" fill="url(#standshade)" stroke="#55716c" strokeWidth="2" /><polygon points="657,120 573,150 573,300 657,330" fill="url(#standshade)" stroke="#55716c" strokeWidth="2" />{draft.tiers > 1 && <g fill="none" stroke={club.colors[0]} strokeWidth="8" opacity=".95"><path d="M170 101h390M157 355h426M99 142l51 17v132l-51 18M641 142l-51 17v132l51 18" /></g>}{draft.tiers > 2 && <g fill="none" stroke="#95c9b8" strokeWidth="6" opacity=".72"><path d="M180 82h380M169 372h402M88 132l65 22v144l-65 22M652 132l-65 22v144l65 22" /></g>}{draft.tiers > 3 && <g fill="none" stroke="#d5b96b" strokeWidth="6" opacity=".85"><path d="M194 65h352M187 390h366M72 122l74 26v154l-74 26M668 122l-74 26v154l74 26" /></g>}{draft.roof !== "Open sky" && <g fill="none" stroke={club.colors[1]} strokeWidth={draft.roof === "Continuous bowl" ? 18 : 11} opacity=".92"><path d="M130 76Q365 28 600 76" /><path d="M130 374Q365 422 600 374" /><path d="M84 120Q60 225 84 330" /><path d="M656 120Q680 225 656 330" /></g>}{draft.roof === "Open sky" && <g fill="none" stroke="#85929a" strokeWidth="5" opacity=".72"><path d="M132 77l18 29M607 77l-18 29M130 373l20-30M607 373l-20-30" /></g>}<rect x="168" y="145" width="405" height="160" rx="5" fill="url(#stands)" stroke="#86aa93" strokeWidth="2"/><rect x="190" y="164" width="360" height="122" rx="2" fill="#357a51" stroke="#a6c2a1" strokeWidth="1.5"/><path d="M370 164v122M190 225h360M248 164v24h-58v74h58v24M492 164v24h58v74h-58v24" fill="none" stroke="#d0e4ce" strokeOpacity=".72" strokeWidth="1.7"/><circle cx="370" cy="225" r="25" fill="none" stroke="#d0e4ce" strokeOpacity=".72" strokeWidth="1.7"/><circle cx="370" cy="225" r="2.5" fill="#d0e4ce" /><path d="M286 145v16M454 145v16M286 305v-19M454 305v-19" stroke="#d7c68a" strokeWidth="4" opacity={draft.boxes > 4 ? 0.9 : 0.2} />{draft.floodlights > 0 && <g fill="#e6d9a4" opacity=".9"><circle cx="101" cy="103" r="4" /><circle cx="639" cy="103" r="4" /><circle cx="101" cy="347" r="4" /><circle cx="639" cy="347" r="4" /><path d="M101 103l24 18M639 103l-24 18M101 347l24-18M639 347l-24-18" stroke="#d9d0a6" strokeWidth="2" /></g>}{draft.corners && <g fill="#e5e0cf"><circle cx="176" cy="154" r="3" /><circle cx="565" cy="154" r="3" /><circle cx="176" cy="296" r="3" /><circle cx="565" cy="296" r="3" /></g>}</g><text x="370" y="430" textAnchor="middle" fill="#87959c" fontSize="11" letterSpacing="3">THE HOME OF {club.shortName}</text></svg><div className="canvas-corner canvas-corner-one" /><div className="canvas-corner canvas-corner-two" /></div><div className="preview-legend"><span><i className="preview-key key-roof" /> Roofline</span><span><i className="preview-key key-tier" /> Upper tiers</span><span><i className="preview-key key-pitch" /> Match surface</span></div><div className="stadium-stats"><div><span>CAPACITY</span><strong>{capacity.toLocaleString("en-GB")}</strong></div><div><span>TIERS</span><strong>{draft.tiers} / 4</strong></div><div><span>EXECUTIVE BOXES</span><strong>{draft.boxes}</strong></div><div><span>PITCH QUALITY</span><strong>{draft.pitchQuality} / 5</strong></div></div></section>
      <section className="architect-controls"><div className="panel card-pad blueprint-heading"><div className="control-card-head"><div><p className="eyebrow">DESIGN STUDIO</p><h2>Shape your ground</h2></div><Wrench size={17} /></div><label className="field-label" htmlFor="roof-select">Roof structure</label><select id="roof-select" className="field-select" value={draft.roof} onChange={(event) => change("roof", event.target.value as Roof)}>{ROOF_OPTIONS.map((roof) => <option key={roof}>{roof}</option>)}</select><div className="control-group"><div className="control-label"><div><strong>Stand tiers</strong><small>Add a new level to every stand</small></div><div className="stepper"><button aria-label="Remove stand tier" disabled={draft.tiers <= 1} onClick={() => change("tiers", Math.max(1, draft.tiers - 1))}>−</button><span>{draft.tiers}</span><button aria-label="Add stand tier" disabled={draft.tiers >= 4} onClick={() => change("tiers", Math.min(4, draft.tiers + 1))}>+</button></div></div><div className="tier-pips">{[1, 2, 3, 4].map((tier) => <span key={tier} className={draft.tiers >= tier ? "filled" : ""} />)}</div></div><div className="control-group"><div className="control-label"><div><strong>Seated stands</strong><small>All spectator areas use individual seats</small></div><button className={`toggle ${draft.seats ? "enabled" : ""}`} aria-pressed={draft.seats} onClick={() => toggle("seats")}><i /></button></div></div><div className="control-group"><div className="control-label"><div><strong>Standing terrace</strong><small>Swap seats for a safe standing end</small></div><button className={`toggle ${draft.standing ? "enabled" : ""}`} aria-pressed={draft.standing} onClick={() => toggle("standing")}><i /></button></div></div><div className="control-group"><div className="control-label"><div><strong>Join the corners</strong><small>Connect the four stands</small></div><button className={`toggle ${draft.corners ? "enabled" : ""}`} aria-pressed={draft.corners} onClick={() => toggle("corners")}><i /></button></div></div><div className="control-group"><div className="control-label"><div><strong>Executive boxes</strong><small>Matchday hospitality suites</small></div><div className="stepper"><button aria-label="Remove executive boxes" disabled={draft.boxes <= 0} onClick={() => change("boxes", Math.max(0, draft.boxes - 4))}>−</button><span>{draft.boxes}</span><button aria-label="Add executive boxes" disabled={draft.boxes >= 96} onClick={() => change("boxes", Math.min(96, draft.boxes + 4))}>+</button></div></div></div><div className="control-group"><div className="control-label"><div><strong>Floodlights</strong><small>Brightness level</small></div><div className="stepper"><button aria-label="Lower floodlight level" disabled={draft.floodlights <= 0} onClick={() => change("floodlights", Math.max(0, draft.floodlights - 1))}>−</button><span>{draft.floodlights}</span><button aria-label="Raise floodlight level" disabled={draft.floodlights >= 4} onClick={() => change("floodlights", Math.min(4, draft.floodlights + 1))}>+</button></div></div></div><div className="control-duo"><label className="field-label" htmlFor="pitch-quality">Pitch quality<select id="pitch-quality" className="field-select" value={draft.pitchQuality} onChange={(event) => change("pitchQuality", Number(event.target.value))}>{[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>{level} · {level < 3 ? "Needs work" : level === 3 ? "Reliable" : "Premier"}</option>)}</select></label><label className="field-label" htmlFor="drainage">Drainage<select id="drainage" className="field-select" value={draft.drainage} onChange={(event) => change("drainage", Number(event.target.value))}>{[20, 40, 60, 80, 100].map((level) => <option key={level} value={level}>{level}%</option>)}</select></label></div><div className="facilities-checks"><span className="eyebrow">COMMERCIAL FACILITIES</span>{([['carPark', 'Car park', 'More matchday visitors'], ['superstore', 'Club superstore', 'Retail income'], ['restaurant', 'Restaurant', 'Matchday dining'], ['hotel', 'Stadium hotel', 'Year-round revenue']] as const).map(([key, label, detail]) => <button className={`facility-check ${draft[key] ? "checked" : ""}`} key={key} onClick={() => toggle(key)}><span className="check-box">{draft[key] && <Check size={12} />}</span><span><strong>{label}</strong><small>{detail}</small></span></button>)}</div></div><div className="approval-card"><div className="approval-row"><span>Estimated project cost</span><strong>{changed ? MONEY(cost) : "No changes"}</strong></div><div className="approval-row"><span>Construction time</span><strong>{changed ? `${duration} matchdays` : "—"}</strong></div><div className="approval-row"><span>Board approval</span><strong className={club.boardTrust >= 35 ? "approval-yes" : "approval-no"}>{club.boardTrust >= 35 ? `${club.boardTrust}% · Eligible` : `${club.boardTrust}% · Required 35%`}</strong></div>{stadium.project && <div className="construction-progress"><div className="construction-label"><span><Wrench size={14} /> {stadium.project.name}</span><strong>{stadium.project.weeksLeft} matchdays left</strong></div><div className="progress-track"><span style={{ width: `${100 - stadium.project.weeksLeft / Math.max(duration, 1) * 100}%` }} /></div></div>}{message && <div className="approval-message">{message}</div>}<button className="button button-primary button-wide" onClick={build} disabled={!changed || Boolean(stadium.project)}>{stadium.project ? "Construction in progress" : changed ? "Request board approval" : "Blueprint up to date"}<Building2 size={15} /></button><p>League minimum: 5,000 capacity with floodlights.</p></div></section></div>
  </>;
}

function Finance({ career, setCareer }: { career: Career; setCareer: (career: Career) => void }) {
  const club = getClub(career);
  const [notice, setNotice] = useState("");
  const totalWages = career.players.filter((player) => player.clubId === club.id).reduce((sum, player) => sum + player.wage, 0);
  const ledger = career.finance.slice(0, 12);
  return <><SectionHeading kicker="CLUB ACCOUNTS" title="Finances & budget" detail="Keep the club healthy while investing in the team and the ground." action={<div className="balance-pill"><span>CURRENT BALANCE</span><strong>{MONEY(club.balance)}</strong></div>} /><div className="finance-metrics"><Metric icon={Banknote} label="Operating balance" value={MONEY(club.balance)} foot="Available club funds" accent /><Metric icon={Coins} label="Transfer budget" value={MONEY(club.transferBudget)} foot="Player acquisitions" /><Metric icon={Users} label="Weekly wages" value={MONEY(totalWages)} foot={`${MONEY(club.wageBudget)} wage budget`} /><Metric icon={Building2} label="Outstanding debt" value={MONEY(club.debt)} foot="Facility loans" /></div><div className="finance-grid"><section className="panel finance-ledger"><div className="card-heading"><div><p className="eyebrow">CASHFLOW</p><h2>Recent transactions</h2></div><span>GBP · LAST {ledger.length}</span></div><div className="ledger-list">{ledger.map((entry, index) => <div key={`${entry.date}-${entry.label}-${index}`} className="ledger-row"><span className={`ledger-icon ${entry.amount < 0 ? "outgoing" : "incoming"}`}>{entry.amount < 0 ? "−" : "+"}</span><div><strong>{entry.label}</strong><small>{entry.date}</small></div><b className={entry.amount < 0 ? "negative" : "positive"}>{MONEY(entry.amount)}</b></div>)}</div><div className="table-footer"><span>Transactions are recorded as your season advances.</span></div></section><section className="finance-side"><div className="panel sponsor-card"><div className="card-heading"><div><p className="eyebrow">COMMERCIAL PARTNER</p><h2>Sponsorship</h2></div><Megaphone size={17} /></div><div className="sponsor-current"><div className="sponsor-logo"><Star size={19} /></div><div><small>MAIN SHIRT SPONSOR</small><strong>{club.sponsor}</strong><span>{MONEY(club.sponsorAnnual)} per season</span></div></div>{club.sponsorOffer ? <div className="sponsor-offer"><div><span>NEW OFFER</span><strong>{club.sponsorOffer.name}</strong><small>{MONEY(club.sponsorOffer.annual)} per season</small></div><button className="button button-primary button-small" onClick={() => { setCareer(acceptSponsor(career)); setNotice("Sponsorship terms accepted."); }}>Accept offer</button></div> : <button className="button button-secondary button-wide" onClick={() => { setCareer(sponsorProposal(career)); setNotice("A new sponsor has made an offer."); }}>Negotiate a new deal</button>}{notice && <p className="sponsor-notice"><Check size={13} />{notice}</p>}</div><div className="panel loan-card"><div className="loan-head"><span className="loan-icon"><Banknote size={17} /></span><div><p className="eyebrow">FACILITY FINANCING</p><h2>Invest in growth</h2></div></div><p>Secure a £2.0m facility loan for stadium work. Repayments are made from matchday cashflow.</p><div className="loan-terms"><span><small>LOAN OFFER</small><strong>£2.0m</strong></span><span><small>TOTAL REPAYMENT</small><strong>£2.3m</strong></span><span><small>PER MATCHDAY</small><strong>£28.8k</strong></span></div><button className="button button-secondary button-wide" disabled={club.debt > 0} onClick={() => { const next = structuredClone(career); const nextClub = getClub(next); nextClub.balance += 2_000_000; nextClub.debt += 2_300_000; next.finance.unshift({ date: "Today", label: "Facility loan drawdown", amount: 2_000_000 }); setCareer(next); }}> {club.debt > 0 ? "Facility loan active" : "Request facility loan"}<Banknote size={15} /></button></div></section></div></>;
}

function Clubhouse({ career, setCareer }: { career: Career; setCareer: (career: Career) => void }) {
  const club = getClub(career);
  const [kitPattern, setKitPattern] = useState("Classic stripes");
  const [notice, setNotice] = useState("");
  const updateKit = (key: keyof Career["kit"], value: string) => setCareer({ ...career, kit: { ...career.kit, [key]: value } });
  const upgrade = (facility: "academyLevel" | "trainingLevel" | "scoutLevel", price: number) => {
    const result = upgradeClubFacility(career, facility);
    if (result === career) setNotice(`The club needs ${MONEY(price)} available to make this investment.`);
    else { setCareer(result); setNotice("Investment approved. The facility is now stronger."); }
  };
  return <><SectionHeading kicker="CLUB DEVELOPMENT" title="Clubhouse" detail="Shape the club identity, grow young talent and strengthen your backroom." action={<span className="clubhouse-city"><MapPin size={15} /> {club.city}, {club.country}</span>} />
    <div className="clubhouse-grid"><section className="panel kit-panel"><div className="card-heading"><div><p className="eyebrow">CLUB IDENTITY</p><h2>Kit designer</h2></div><Shirt size={18} /></div><div className="kit-preview-area"><div className="kit-preview"><svg viewBox="0 0 180 205" role="img" aria-label="Kit preview"><path d="M54 24 30 35 13 65l25 14 11-17v112h82V62l11 17 25-14-17-30-24-11-17 14H71z" fill={career.kit.home} stroke="#f5f5f3" strokeOpacity=".55" strokeWidth="2" />{kitPattern === "Classic stripes" && <g stroke={career.kit.trim} strokeWidth="8" opacity=".9"><path d="M67 57v117M88 53v121M110 52v122" /></g>}{kitPattern === "Hoops" && <g stroke={career.kit.trim} strokeWidth="10" opacity=".88"><path d="M43 83h94M43 112h94M43 142h94" /></g>}{kitPattern === "Sash" && <path d="m47 49 74 102" stroke={career.kit.trim} strokeWidth="16" opacity=".9" />}{kitPattern === "Solid" && <circle cx="90" cy="86" r="15" fill={career.kit.trim} />}</svg><span>HOME · {club.shortName}</span></div><div className="kit-variants"><div className="mini-kit" style={{ background: career.kit.away }}><span style={{ background: career.kit.trim }} /></div><small>AWAY</small><div className="mini-kit" style={{ background: career.kit.third }}><span style={{ background: career.kit.trim }} /></div><small>THIRD</small></div></div><label className="field-label" htmlFor="pattern-select">Home shirt pattern</label><select id="pattern-select" className="field-select" value={kitPattern} onChange={(event) => setKitPattern(event.target.value)}>{["Classic stripes", "Hoops", "Sash", "Solid"].map((pattern) => <option key={pattern}>{pattern}</option>)}</select><div className="kit-colors">{([['home', 'Home'], ['away', 'Away'], ['third', 'Third'], ['trim', 'Trim']] as const).map(([key, label]) => <label className="color-picker" key={key}><span className="color-swatch" style={{ background: career.kit[key] }} /><span>{label}</span><input aria-label={`${label} kit colour`} type="color" value={career.kit[key]} onChange={(event) => updateKit(key, event.target.value)} /></label>)}</div><div className="kit-brand-note"><Lightbulb size={14} /><span>Colours update the matchday tactics board and your club identity.</span></div></section><section className="panel facilities-panel"><div className="card-heading"><div><p className="eyebrow">INVEST FOR TOMORROW</p><h2>Club facilities</h2></div><Building2 size={18} /></div>{notice && <div className="inline-notice"><Check size={15} />{notice}<button onClick={() => setNotice("")}><X size={13} /></button></div>}<FacilityRow icon={Sparkles} name="Youth academy" detail="Annual intake · high potential" level={club.academyLevel} price={(club.academyLevel + 1) * 225000} onUpgrade={() => upgrade("academyLevel", (club.academyLevel + 1) * 225000)} /> <FacilityRow icon={Dumbbell} name="Training centre" detail="Faster player development" level={club.trainingLevel} price={(club.trainingLevel + 1) * 225000} onUpgrade={() => upgrade("trainingLevel", (club.trainingLevel + 1) * 225000)} /><FacilityRow icon={Search} name="Scouting network" detail="A wider view of the transfer market" level={club.scoutLevel} price={(club.scoutLevel + 1) * 160000} onUpgrade={() => upgrade("scoutLevel", (club.scoutLevel + 1) * 160000)} /><div className="academy-note"><div className="academy-note-icon"><Users size={17} /></div><div><small>THIS SEASON’S INTAKE</small><strong>{2 + club.academyLevel} young players</strong><span>The next intake arrives at the end of the season.</span></div></div><div className="staff-note"><BriefcaseBusiness size={16} /><span><strong>Backroom staff</strong> · Head coach, assistant and club doctor are in place.</span><span className="staff-status">ACTIVE</span></div></section></div></>;
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
