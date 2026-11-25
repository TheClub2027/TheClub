"use client";

import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { FormEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Activity,
  AlertTriangle,
  Archive,
  BadgeCheck,
  BarChart3,
  Banknote,
  Building2,
  Database,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronDown,
  Download,
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
  Play,
  Plus,
  Radio,
  RefreshCw,
  Save,
  Search,
  Shield,
  Shirt,
  Settings2,
  Sparkles,
  Star,
  Store,
  Trash2,
  Trophy,
  Users,
  Wallet,
  Wrench,
  X,
  BriefcaseBusiness,
  MapPin,
  GraduationCap,
  Handshake,
  Globe,
  type LucideIcon,
} from "lucide-react";
import {
  acceptSponsor,
  applyForJob,
  beginNextSeason,
  CLUB_BADGE_EMBLEMS,
  CLUB_BADGE_FIELDS,
  CLUB_BADGE_SHAPES,
  CLUB_OPTIONS,
  createCareerId,
  createCareer,
  formatMoney,
  formatPlayerValue,
  getClub,
  getClubArchive,
  getClubDNAStatus,
  getLeadershipDynamics,
  getAcademyPlayers,
  getScoutingCost,
  getScoutingAssignment,
  getScoutingDaysRemaining,
  getScoutingReport,
  getPlayerTrainingSummary,
  getPlayerRoleAssessment,
  getPlayerRoleOptions,
  getYouthCandidates,
  getBoardPressureSignals,
  getActivePlayerLoans,
  endPlayerLoan,
  hireStaff,
  getCurrentLeague,
  addCalendarDays,
  getCalendarDate,
  getFormationSlots,
  getNextFixture,
  getInternationalCallups,
  getInternationalTables,
  advanceToNextCalendarEvent,
  advanceCareerCalendarDay,
  endManagerLeaveEarly,
  getSecondHalfDirectiveEffects,
  getMatchPreparation,
  getManagerBriefing,
  getManagerInbox,
  getUnreadManagerInboxCount,
  markAllManagerInboxRead,
  markManagerInboxRead,
  respondToPressConference,
  resolveClubTransferBid,
  MATCH_PREPARATION_PLANS,
  getSeasonWeekCount,
  isSeasonComplete,
  getTable,
  getTransferRumours,
  getUserPlayers,
  appointClubCaptain,
  appointViceCaptain,
  canOpenContractTalks,
  addManagedMatchSubstitution,
  advanceManagedMatch,
  finishManagedMatch,
  getLiveMatchSubstitutionOptions,
  getManagedMatchPlayerRatings,
  getSetPieceMatchEffects,
  getSetPiecePlan,
  makeManagerPromise,
  playMatchday,
  requestManagerLeave,
  setManagedMatchDirective,
  setSetPieceSelection,
  startManagedMatch,
  releaseStaff,
  promoteYouth,
  launchKitCollection,
  setYouthTraining,
  setPlayerTraining,
  setPlayerRole,
  scoutPlayer,
  signYouthPlayer,
  ROOF_OPTIONS,
  setPlayerSelection,
  setMatchPreparation,
  sponsorProposal,
  FORMATION_OPTIONS,
  TRAINING_OPTIONS,
  normalizeCareer,
  CORNER_DELIVERIES,
  CORNER_DEFENCES,
  FREE_KICK_ROUTINES,
} from "@/lib/game";
import type { Career, Club, ClubArchiveLeader, ClubBadge, Fixture, InternationalFixture, KitPattern, ManagerBriefingRoute, ManagerCareerAppointment, ManagerInboxCategory, ManagerInboxMessage, ManagerPromise, ManagerPromiseKind, MatchEvent, MatchdayManagementPlan, NewsItem, Player, PlayerAttributes, PlayerStats, Position, PressConferenceChoice, SquadLevel, SponsorSlot } from "@/lib/game";
import { ENGLISH_LEAGUES } from "@/lib/league-pyramid";
import type { LeagueId } from "@/lib/league-pyramid";
import { WORLD_COUNTRIES, WORLD_LEAGUES } from "@/lib/world-leagues";
import { DEFAULT_GAME_SETTINGS, GAME_SETTINGS_KEY, formatGameDate, formatGameTime, readGameSettings, type GameSettings } from "@/lib/game-settings";
import { deleteOnlineCareer, isSupabaseConfigured, listOnlineCareerSaves, loadOnlineCareer, saveOnlineCareer, supabase } from "@/lib/supabase";
import type { OnlineCareerSave } from "@/lib/supabase";
import { deleteLocalCareer, getActiveCareerId, LEGACY_CAREER_KEY, listLocalCareerSaves, loadLocalCareer, saveLocalCareer, setActiveCareerId, type CareerSaveSummary } from "@/lib/career-save-store";
import StadiumArchitect, { createStadiumDraft } from "./stadium-architect";
import type { MatchSceneMarker } from "./stadium-scene";
import StaffManagement from "./staff-management";
import { PlayerPortrait } from "./player-portrait";
import ContractNegotiation from "./contract-negotiation";
import TransferNegotiation from "./transfer-negotiation";
import PlayerLoanNegotiation from "./player-loan-negotiation";
import MatchdayManagementModal from "./matchday-management";
import { ClubMark, ClubWordmark } from "./brand";
import { EditorLocked, SettingsPanel } from "./game-tools";
import { getWorldPlayerDetails, searchWorldDatabase, worldGroupCount, WORLD_PLAYER_COUNT, WORLD_PLAYER_COUNTRIES } from "@/lib/world-database";
import type { WorldPlayerFilter, WorldPlayerListing } from "@/lib/world-database";

const MatchStadiumScene = dynamic(() => import("./stadium-scene"), { ssr: false, loading: () => <div className="stadium-scene-loading">Preparing the matchday ground…</div> });

type View = "overview" | "inbox" | "newsroom" | "archive" | "squad" | "tactics" | "fixtures" | "international" | "calendar" | "table" | "transfers" | "people" | "stadium" | "finance" | "clubhouse" | "academy" | "commercial" | "editor" | "manager-career" | "settings";

const NAV_ITEMS: { id: View; label: string; icon: LucideIcon; section: string }[] = [
  { id: "overview", label: "Overview", icon: Home, section: "Club" },
  { id: "inbox", label: "Inbox", icon: Mail, section: "Club" },
  { id: "newsroom", label: "Newsroom", icon: Newspaper, section: "Club" },
  { id: "archive", label: "Club archive", icon: Archive, section: "Club" },
  { id: "squad", label: "Squad", icon: Users, section: "Team" },
  { id: "tactics", label: "Tactics", icon: Activity, section: "Team" },
  { id: "fixtures", label: "Fixtures", icon: CalendarDays, section: "Competition" },
  { id: "international", label: "International football", icon: Globe, section: "Competition" },
  { id: "calendar", label: "Calendar & leave", icon: CalendarDays, section: "Competition" },
  { id: "table", label: "League table", icon: Trophy, section: "Competition" },
  { id: "transfers", label: "Transfers", icon: RefreshCw, section: "Recruitment" },
  { id: "people", label: "Staff & board", icon: BriefcaseBusiness, section: "Recruitment" },
  { id: "stadium", label: "Club Facilities", icon: Building2, section: "Development" },
  { id: "finance", label: "Finances", icon: Wallet, section: "Development" },
  { id: "clubhouse", label: "Clubhouse", icon: Shirt, section: "Development" },
  { id: "academy", label: "Youth academy", icon: GraduationCap, section: "Development" },
  { id: "commercial", label: "Commercial", icon: Handshake, section: "Development" },
  { id: "editor", label: "Editor", icon: Database, section: "Manager" },
  { id: "manager-career", label: "Manager career", icon: BriefcaseBusiness, section: "Manager" },
  { id: "settings", label: "Settings", icon: Settings2, section: "Manager" },
];

const MONEY = (amount: number) => formatMoney(amount, true);
const KIT_PATTERNS: KitPattern[] = ["Engineered Grid", "Topographic", "Pixel Fade", "Diagonal Motion", "Contour Lines", "Split Panel", "Shadow Gradient", "Micro Dot", "Clean Block"];
const LEAGUE_SHORT_LABEL: Record<string, string> = { premier: "PREM", championship: "CHAMP", "league-one": "L1", "league-two": "L2", national: "NAT", "national-north": "NORTH", "national-south": "SOUTH" };

function leagueShortLabel(id: string) {
  return LEAGUE_SHORT_LABEL[id] ?? id.split("-").filter(Boolean).slice(0, 2).map((part) => part.slice(0, 4).toUpperCase()).join(" ");
}

function ClubBadgeEmblemArt({ emblem, metal, ink, accent }: { emblem: ClubBadge["emblem"]; metal: string; ink: string; accent: string }) {
  switch (emblem) {
    case "tower": return <g fill={ink} stroke={metal} strokeWidth="2"><path d="M51 30h26v43H51zM46 26h36v8H46zM55 20h18v8H55z"/><path d="M57 39h5v9h-5zm10 0h5v9h-5zM59 57h10v16H59z" fill={accent}/></g>;
    case "oak": return <g fill={metal} stroke={ink} strokeWidth="1.5"><path d="M63 76V43m0 13L45 46m18 17 19-18M62 69 43 62m19 8 20-8" strokeWidth="4" fill="none"/><circle cx="45" cy="40" r="9"/><circle cx="63" cy="33" r="10"/><circle cx="82" cy="40" r="9"/><circle cx="45" cy="58" r="7"/><circle cx="82" cy="57" r="7"/></g>;
    case "eagle": return <g fill={metal} stroke={ink} strokeWidth="2" strokeLinejoin="round"><path d="m22 48 22-15 17 9 3-12 5 12 17-9 22 15-23 10 15 15-27-6-9-10-9 10-27 6 15-15z"/><path d="m50 48 14 11 14-11-5 20-9 7-9-7z" fill={accent}/></g>;
    case "anchor": return <g fill="none" stroke={metal} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"><circle cx="64" cy="35" r="9"/><path d="M64 44v35m-27-18q2 23 27 23t27-23M48 54 35 68m45-14 13 14M52 48h24"/><path d="M64 51v26" stroke={accent}/></g>;
    case "bridge": return <g fill="none" stroke={metal} strokeWidth="4" strokeLinejoin="round"><path d="M31 72h66M37 66V43m54 23V43M32 43q32-31 64 0M51 43v23m26-23v23M43 76v7m42-7v7"/><path d="M39 46q25-19 50 0" stroke={accent} strokeWidth="2"/></g>;
    case "crown": return <g fill={metal} stroke={ink} strokeWidth="2" strokeLinejoin="round"><path d="m35 42 9 30h40l9-30-18 13-11-25-11 25z"/><path d="M42 79h44v7H42z" fill={accent}/><circle cx="35" cy="40" r="4"/><circle cx="64" cy="27" r="4"/><circle cx="93" cy="40" r="4"/></g>;
    case "ship": return <g fill="none" stroke={metal} strokeWidth="3.5" strokeLinejoin="round"><path d="M29 67h70L86 81H43zM64 27v39m4-34 21 33H68zm-7 7L41 64h20z" fill={accent}/><path d="M34 88q10-8 20 0t20 0 20 0 20 0" strokeWidth="3"/></g>;
    case "lighthouse": return <g stroke={ink} strokeWidth="2" strokeLinejoin="round"><path d="M51 76 56 40h16l5 36z" fill={metal}/><path d="M52 43h24V31H52zM49 29h30v-5H49zM58 46h5v8h-5zm9 0h5v8h-5z" fill={accent}/><path d="m53 35-18-9m40 9 18-9" stroke={metal} strokeWidth="3"/></g>;
    case "mountain": return <g fill={metal} stroke={ink} strokeWidth="2" strokeLinejoin="round"><path d="m25 76 24-38 13 18 10-14 32 34z"/><path d="m43 55 7-11 7 10-7-3zm31-4 5-7 7 10-7-3z" fill={accent}/><path d="M29 82h71" fill="none" stroke={accent} strokeWidth="3"/></g>;
    case "rose": return <g fill={metal} stroke={ink} strokeWidth="2"><path d="M64 40c-13-18-29-3-14 9-19 5-11 25 5 18 3 18 24 18 18 1 19 6 25-13 8-19 16-13 0-29-13-13z"/><circle cx="64" cy="53" r="8" fill={accent}/><path d="M63 68v14m0-9-12-7m12 9 12-8" fill="none" stroke={metal} strokeWidth="3"/></g>;
    case "wheel": return <g fill="none" stroke={metal} strokeWidth="3.2"><circle cx="64" cy="54" r="25"/><circle cx="64" cy="54" r="8" fill={accent}/><path d="M64 29v17m0 16v17M39 54h17m16 0h17M46 36l12 12m12 12 12 12m0-36L70 48M58 60 46 72"/></g>;
    case "flame": return <g fill={metal} stroke={ink} strokeWidth="2" strokeLinejoin="round"><path d="M65 23c5 18-10 20-4 32 5-8 12-9 13-20 16 15 22 34 9 48-11 13-34 10-43-4-10-16 1-33 14-45-1 13 1 17 6 20 8-11 5-19 5-31z"/><path d="M64 56c10 9 11 20 3 27-6 5-16 2-17-6-1-7 5-13 14-21z" fill={accent}/></g>;
    case "lion": return <g fill={metal} stroke={ink} strokeWidth="2" strokeLinejoin="round"><path d="m64 25 12 9 15-2 1 15 9 11-9 11-2 15-15-2-11 9-12-9-15 2-1-15-10-11 10-11 1-15 15 2z"/><path d="m52 48 8 4 4-4 4 4 8-4-3 16q-9 12-18 0z" fill={accent}/><circle cx="57" cy="56" r="2" fill={ink}/><circle cx="71" cy="56" r="2" fill={ink}/></g>;
    case "stag": return <g fill="none" stroke={metal} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M64 43v37m0-31L50 34l-9 6-9-6m32 15 14-15 9 6 9-6M50 34v-9m-9 15-8 7m31 2 15-15v-9m9 17 8 7M53 58l11 8 11-8"/><circle cx="55" cy="58" r="2" fill={accent}/><circle cx="73" cy="58" r="2" fill={accent}/></g>;
    case "compass": return <g fill={metal} stroke={ink} strokeWidth="2" strokeLinejoin="round"><circle cx="64" cy="54" r="29" fill="none" stroke={metal} strokeWidth="3"/><path d="m64 25 8 29-8 29-8-29z"/><path d="m35 54 29-7 29 7-29 7z" fill={accent}/><circle cx="64" cy="54" r="5" fill={ink}/></g>;
    case "mill": return <g fill="none" stroke={metal} strokeWidth="4" strokeLinejoin="round"><path d="M47 78V56h34v22M43 53h42L64 36z" fill={accent}/><circle cx="64" cy="35" r="5" fill={metal}/><path d="M64 35 41 22m23 13 23-13M64 35l-2-25m2 25 2 26"/><path d="M51 64h8v14m10-14h8v14" strokeWidth="2"/></g>;
    case "torch": return <g fill={metal} stroke={ink} strokeWidth="2" strokeLinejoin="round"><path d="M64 25c12 12 14 21 0 29-14-8-12-17 0-29z" fill={accent}/><path d="M56 54h16l-3 24H59zM51 80h26v7H51z"/><path d="M64 59v16" stroke={accent} strokeWidth="3"/></g>;
    default: return <g fill={metal} stroke={ink} strokeWidth="1.5"><path d="m64 25 8 17 19 3-14 13 4 19-17-9-17 9 4-19-14-13 19-3z"/><circle cx="64" cy="54" r="5" fill={accent}/></g>;
  }
}

function ClubCrest({ club, size = "normal" }: { club: Pick<Club, "shortName" | "colors"> & { badge?: Club["badge"] }; size?: "small" | "normal" | "large" }) {
  const crestId = useId().replace(/:/g, "");
  const badge = club.badge;
  const primary = badge?.colors?.[0] ?? club.colors[0];
  const secondary = badge?.colors?.[1] ?? club.colors[1];
  const shape = badge?.shape ?? "shield";
  const emblem = badge?.emblem ?? "star";
  const field = badge?.field ?? "vertical";
  const accent = badge?.accent ?? "#d5b76d";
  const shapePath = shape === "roundel" ? "M64 5a59 59 0 1 1 0 118a59 59 0 1 1 0-118" : shape === "diamond" ? "M64 3 119 41 105 101 64 130 23 101 9 41z" : shape === "crest" ? "M15 6h98v65q-2 37-49 58Q17 108 15 71z" : shape === "heater" ? "M14 7h100v54q0 47-50 70Q14 108 14 61z" : shape === "hexagon" ? "M64 4 113 31v65l-49 36-49-36V31z" : shape === "oval" ? "M64 4c35 0 55 24 55 62s-20 66-55 66S9 104 9 66 29 4 64 4z" : shape === "arch" ? "M15 128V57a49 49 0 0 1 98 0v71z" : shape === "banner" ? "M15 7h98v82l-11 8-13-5-12 7-13-6-13 6-13-7-12 5-11-8z" : shape === "lozenge" ? "M64 4 112 39 101 101 64 132 27 101 16 39z" : "M12 7h104v55q0 43-52 65Q12 105 12 62z";
  return <span className={`club-crest crest-${size}`} aria-label={`${club.shortName} club badge`}><svg viewBox="0 0 128 136" role="img" aria-hidden="true">
    <defs><linearGradient id={`crest-${crestId}-metal`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff0b0" /><stop offset=".48" stopColor="#b69b51" /><stop offset="1" stopColor="#f3dea0" /></linearGradient><clipPath id={`crest-${crestId}-clip`}><path d={shapePath} /></clipPath><pattern id={`crest-${crestId}-weave`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v8" stroke={secondary} strokeOpacity=".2" strokeWidth="3" /></pattern></defs>
    <path d={shapePath} fill="#101713" stroke="#080d0a" strokeWidth="7" />
    <g clipPath={`url(#crest-${crestId}-clip)`}>
      <path d={shapePath} fill={primary} />
      {field === "vertical" && <path d="M0 0h27v136H0zm50 0h28v136H50zm51 0h27v136h-27z" fill={secondary} />}
      {field === "horizontal" && <path d="M0 12h128v19H0zm0 48h128v19H0zm0 48h128v19H0z" fill={secondary} />}
      {field === "diagonal" && <path d="m-12 96 42-42 19 19-42 42zm39 39 42-42 19 19-42 42zm38-92 42-42 19 19-42 42z" fill={secondary} />}
      {field === "quartered" && <path d="M0 0h64v68H0zm64 68h64v68H64z" fill={secondary} />}
      {field === "sash" && <path d="M-8 105 83 14l19 19-91 91z" fill={secondary} />}
      {field === "chevron" && <path d="M-6 21 64 58l70-37v25L64 84-6 46zm0 50 70 37 70-37v25l-70 37-70-37z" fill={secondary} />}
      {field === "hoops" && <path d="M0 19h128v15H0zm0 34h128v15H0zm0 34h128v15H0z" fill={secondary} />}
      {field === "saltire" && <path d="m-7 18 19-20 123 119-19 20zm123-20 19 20L12 137l-19-20z" fill={secondary} />}
      <path d="M0 0h128v136H0z" fill={`url(#crest-${crestId}-weave)`} />
      <path d="M18 18h92v66H18z" fill="#101713" fillOpacity=".3" stroke={accent} strokeOpacity=".82" strokeWidth="2" />
      <ClubBadgeEmblemArt emblem={emblem} metal={`url(#crest-${crestId}-metal)`} ink="#17201a" accent={accent} />
      <path d="M5 88h118l-9 12H14z" fill="#111a15" stroke={accent} strokeWidth="2" />
      <text x="64" y="97" textAnchor="middle" fill="#fff4d4" fontSize="12" fontFamily="Georgia,serif" fontWeight="700" letterSpacing="2">{club.shortName}</text>
      <path d="M34 111h60" stroke={`url(#crest-${crestId}-metal)`} strokeWidth="2" />
      <text x="64" y="122" textAnchor="middle" fill="#f4e9c2" fontSize="8" fontFamily="Georgia,serif" fontWeight="700" letterSpacing="2">{badge?.foundingYear ?? "EST. 1900"}</text>
    </g>
    <path d={shapePath} fill="none" stroke={accent} strokeWidth="4" />
    <path d={shapePath} fill="none" stroke="#fff5cf" strokeOpacity=".35" strokeWidth="1" transform="translate(3 3) scale(.953)" />
  </svg></span>;
}

const BADGE_PALETTE_OPTIONS: [string, string][] = [
  ["#163d2b", "#e8d78c"], ["#1d3658", "#edf1e6"], ["#7c2534", "#f0d9a6"], ["#e2762e", "#17211b"],
  ["#147766", "#e4f1dd"], ["#5b3d70", "#c7d5e4"], ["#2253a0", "#f0c84f"], ["#252a2a", "#ddef8a"],
  ["#9b402f", "#f4e8c9"], ["#314b3c", "#e7c0a9"], ["#25446c", "#df7469"], ["#6e5365", "#c6dfcf"],
];

function BadgeVariationPicker({ club, selected, onSelect }: { club: Club; selected: ClubBadge; onSelect: (badge: ClubBadge) => void }) {
  const [page, setPage] = useState(0);
  const designs = useMemo(() => {
    const palettes: [string, string][] = [[...club.colors], [...club.colors].reverse() as [string, string], ...BADGE_PALETTE_OPTIONS];
    return CLUB_BADGE_SHAPES.flatMap((shape, shapeIndex) => CLUB_BADGE_EMBLEMS.flatMap((emblem, emblemIndex) => CLUB_BADGE_FIELDS.map((field, fieldIndex) => {
      const colors = palettes[(shapeIndex * 3 + emblemIndex + fieldIndex) % palettes.length];
      return { shape, emblem, field, accent: BADGE_PALETTE_OPTIONS[(shapeIndex + emblemIndex * 2 + fieldIndex) % BADGE_PALETTE_OPTIONS.length][1], colors: [colors[0], colors[1]] as [string, string], foundingYear: selected.foundingYear };
    })));
  }, [club.colors, selected.foundingYear]);
  const perPage = 12;
  const pages = Math.ceil(designs.length / perPage);
  const options = designs.slice(page * perPage, page * perPage + perPage);
  return <div className="badge-gallery" aria-label="Club crest design gallery">
    <div className="badge-gallery-heading"><span><strong>{designs.length.toLocaleString("en-GB")} crest blueprints</strong><small>Silhouette, heraldic field and club symbol all change. Preview one, then present it to the board.</small></span><div><button type="button" aria-label="Previous badge designs" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>Previous</button><span>{page + 1} / {pages}</span><button type="button" aria-label="Next badge designs" disabled={page >= pages - 1} onClick={() => setPage((current) => Math.min(pages - 1, current + 1))}>Next</button></div></div>
    <div className="badge-gallery-options">{options.map((badge, index) => { const selectedOption = badge.shape === selected.shape && badge.emblem === selected.emblem && badge.field === selected.field && badge.colors[0] === selected.colors[0] && badge.colors[1] === selected.colors[1]; const absoluteIndex = page * perPage + index; return <button key={`${absoluteIndex}-${badge.shape}-${badge.emblem}-${badge.field}`} type="button" className={`badge-gallery-option ${selectedOption ? "selected" : ""}`} aria-pressed={selectedOption} aria-label={`Preview badge design ${absoluteIndex + 1}: ${badge.shape}, ${badge.field}, with ${badge.emblem}`} onClick={() => onSelect({ ...badge, foundingYear: selected.foundingYear })}><ClubCrest club={{ ...club, badge }} size="small" /><span>Design {String(absoluteIndex + 1).padStart(3, "0")}</span></button>; })}</div>
  </div>;
}

function pageDate(date: string) {
  return formatGameDate(date);
}

function getCurrentDate(career: Career) {
  return new Date(`${getCalendarDate(career)}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function getTopbarDate(career: Career) {
  return new Date(`${getCalendarDate(career)}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function CalendarRibbon({ career }: { career: Career }) {
  const today = getCalendarDate(career);
  const firstTeamFixtures = career.fixtures.filter((fixture) => !fixture.played && (fixture.homeClubId === career.clubId || fixture.awayClubId === career.clubId)).sort((a, b) => a.date.localeCompare(b.date));
  const nextFixture = firstTeamFixtures[0];
  const nextOpponent = nextFixture ? getClub(career, nextFixture.homeClubId === career.clubId ? nextFixture.awayClubId : nextFixture.homeClubId) : null;
  const dates = Array.from({ length: 9 }, (_, index) => addCalendarDays(today, index - 3));
  return <div className="calendar-ribbon" aria-label="Career calendar">
    <div className="calendar-ribbon-days">{dates.map((date) => {
      const day = new Date(`${date}T12:00:00`);
      const match = firstTeamFixtures.find((fixture) => fixture.date === date);
      const opponent = match ? getClub(career, match.homeClubId === career.clubId ? match.awayClubId : match.homeClubId) : null;
      const scoutDue = (career.scoutingAssignments ?? []).some((assignment) => assignment.availableDate === date && assignment.managerId === career.id);
      return <div key={date} className={`calendar-ribbon-day ${date === today ? "is-today" : ""} ${match ? "is-matchday" : ""}`} aria-current={date === today ? "date" : undefined}>
        <small>{date === today ? "TODAY" : day.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase()}</small>
        <strong>{day.toLocaleDateString("en-GB", { day: "2-digit" })}</strong>
        <span>{match ? `MATCH · ${opponent?.shortName ?? "FIRST TEAM"}` : scoutDue ? "SCOUT REPORT" : day.toLocaleDateString("en-GB", { month: "short" }).toUpperCase()}</span>
      </div>;
    })}</div>
    <div className="calendar-ribbon-meta"><span>SEASON {2026 + career.season - 1}/{String(2027 + career.season - 1).slice(-2)}</span><strong>{nextFixture && nextOpponent ? `NEXT · ${nextFixture.date === today ? "TODAY" : pageDate(nextFixture.date)} · ${nextOpponent.shortName}` : "SEASON COMPLETE"}</strong></div>
  </div>;
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
  const [localSaves, setLocalSaves] = useState<CareerSaveSummary[]>([]);
  const [mode, setMode] = useState<"welcome" | "new" | "game" | "load" | "editor" | "settings">("welcome");
  const [view, setView] = useState<View>("overview");
  const [managerName, setManagerName] = useState("");
  const [selectedClub, setSelectedClub] = useState("WPR");
  const [selectedLeague, setSelectedLeague] = useState<LeagueId>("league-one");
  const [selectedCountry, setSelectedCountry] = useState("England");
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);
  const [loadError, setLoadError] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudSaves, setCloudSaves] = useState<OnlineCareerSave[]>([]);
  const [cloudConflict, setCloudConflict] = useState<{ id: string; deviceCareer: Career; cloudSave: OnlineCareerSave } | null>(null);
  const [cloudExcludedIds, setCloudExcludedIds] = useState<string[]>([]);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [syncLabel, setSyncLabel] = useState("Saved on this device");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [navSearch, setNavSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    const initialize = async () => {
      try {
        setSettings(readGameSettings());
        let legacyCareer: Career | null = null;
        try {
          const stored = localStorage.getItem(LEGACY_CAREER_KEY);
          if (stored) legacyCareer = normalizeCareer(JSON.parse(stored) as Career);
        } catch {
          // Keep the legacy key for recovery if it cannot be parsed.
        }

        try {
          let summaries = await listLocalCareerSaves();
          if (legacyCareer) {
            if (!summaries.some((save) => save.id === legacyCareer!.id)) await saveLocalCareer(legacyCareer);
            summaries = await listLocalCareerSaves();
            localStorage.removeItem(LEGACY_CAREER_KEY);
          }
          if (cancelled) return;

          const preferredId = getActiveCareerId();
          const selected = summaries.find((save) => save.id === preferredId) ?? summaries[0];
          const storedCareer = selected ? await loadLocalCareer(selected.id) : null;
          if (cancelled) return;
          if (storedCareer) {
            const normalized = normalizeCareer(storedCareer);
            setCareer(normalized);
            setActiveCareerId(normalized.id);
          } else {
            setActiveCareerId(null);
          }
          setLocalSaves(summaries);
        } catch (error) {
          // Older or restricted browsers retain the original single-save path.
          if (legacyCareer) {
            setCareer(legacyCareer);
            setActiveCareerId(legacyCareer.id);
          }
          setSyncLabel(error instanceof Error ? `Local save library unavailable · ${error.message}` : "Local save library unavailable");
        }
      } catch {
        setSettings(DEFAULT_GAME_SETTINGS);
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    void initialize();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(GAME_SETTINGS_KEY, JSON.stringify(settings));
  }, [ready, settings]);

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
    if (!ready) return;
    if (!session?.user.id) {
      setCloudReady(false);
      setCloudSaves([]);
      setCloudConflict(null);
      setCloudExcludedIds([]);
      return;
    }
    let cancelled = false;
    setCloudReady(false);
    setCloudConflict(null);
    setSyncLabel("Checking cloud save…");
    listOnlineCareerSaves(session.user.id).then(async (remoteSaves) => {
      if (cancelled) return;
      setCloudSaves(remoteSaves);
      if (!career && remoteSaves[0]) {
        const remote = normalizeCareer(remoteSaves[0].career);
        setCareer(remote);
        setActiveCareerId(remote.id);
        await saveLocalCareer(remote);
        setSyncLabel("Cloud career loaded");
      } else if (career) {
        const matchingSave = remoteSaves.find((save) => save.summary.id === career.id);
        if (matchingSave) {
          const localSummary = localSaves.find((save) => save.id === career.id);
          if (!localSummary || Date.parse(matchingSave.summary.updatedAt) > Date.parse(localSummary.updatedAt)) {
            setCloudConflict({ id: career.id, deviceCareer: career, cloudSave: matchingSave });
            setSyncLabel("Cloud conflict · choose a version");
          } else {
            const updated = await saveOnlineCareer(session.user.id, career);
            setCloudSaves((saves) => [updated, ...saves.filter((save) => save.summary.id !== updated.summary.id)].sort((a, b) => b.summary.updatedAt.localeCompare(a.summary.updatedAt)));
            setSyncLabel("Cloud save connected");
          }
        } else if (remoteSaves.length === 0) {
          const created = await saveOnlineCareer(session.user.id, career);
          setCloudSaves([created]);
          setSyncLabel("Cloud save connected");
        } else {
          setSyncLabel("Cloud library ready · device career preserved");
        }
      } else {
        setSyncLabel("Cloud account ready");
      }
      setCloudReady(true);
    }).catch((error: unknown) => {
      if (!cancelled) {
        setSyncLabel(error instanceof Error ? error.message : "Cloud save unavailable");
        setCloudReady(false);
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
    const timeout = window.setTimeout(() => {
      setActiveCareerId(career.id);
      saveLocalCareer(career).then(async (summary) => {
        setLocalSaves((saves) => [summary, ...saves.filter((save) => save.id !== summary.id)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
        if (!session?.user.id) {
          setSyncLabel("Saved on this device");
          return;
        }
        if (!cloudReady) {
          setSyncLabel("Saved on this device · cloud sync pending");
          return;
        }
        if (cloudConflict?.id === career.id) {
          setSyncLabel("Cloud conflict · choose a version");
          return;
        }
        if (cloudExcludedIds.includes(career.id)) {
          setSyncLabel("Saved on this device · cloud copy deleted");
          return;
        }
        try {
          const onlineSave = await saveOnlineCareer(session.user.id, career);
          setCloudSaves((saves) => [onlineSave, ...saves.filter((save) => save.summary.id !== onlineSave.summary.id)].sort((a, b) => b.summary.updatedAt.localeCompare(a.summary.updatedAt)));
          setSyncLabel("Saved to your account");
        } catch (error) {
          setSyncLabel(error instanceof Error ? `Cloud save error · ${error.message}` : "Cloud save error");
        }
      }).catch((error: unknown) => {
        try { localStorage.setItem(LEGACY_CAREER_KEY, JSON.stringify(career)); } catch { /* IndexedDB reports the durable save failure below. */ }
        setSyncLabel(error instanceof Error ? `Device save error · ${error.message}` : "Device save error");
      });
    }, 750);
    return () => window.clearTimeout(timeout);
  }, [career, ready, session?.user.id, cloudReady, cloudConflict?.id, cloudExcludedIds, settings.autosave]);

  const startNewCareer = () => {
    const next = createCareer(managerName, selectedClub);
    setActiveCareerId(next.id);
    setCareer(next);
    void saveLocalCareer(next).then((summary) => setLocalSaves((saves) => [summary, ...saves.filter((save) => save.id !== summary.id)])).catch((error: unknown) => {
      setSyncLabel(error instanceof Error ? `Device save error · ${error.message}` : "Device save error");
    });
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
    setMode("editor");
  };

  const importCareer = async (file?: File) => {
    if (!file) return;
    try {
      let imported = normalizeCareer(JSON.parse(await file.text()) as Career);
      const existing = await listLocalCareerSaves();
      if (existing.some((save) => save.id === imported.id)) {
        imported = { ...imported, id: createCareerId() };
      }
      setActiveCareerId(imported.id);
      setCareer(imported);
      await saveLocalCareer(imported);
      setLocalSaves(await listLocalCareerSaves());
      setMode("game");
      setView("overview");
      setLoadError("");
    } catch {
      setLoadError("That file is not a valid The Club career save.");
    }
  };

  const saveCareerManually = async () => {
    if (!career) return;
    try {
      const summary = await saveLocalCareer(career);
      setActiveCareerId(career.id);
      setLocalSaves((saves) => [summary, ...saves.filter((save) => save.id !== summary.id)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    } catch (error) {
      setSyncLabel(error instanceof Error ? `Device save error · ${error.message}` : "Device save error");
      return;
    }
    if (session?.user.id) {
      if (cloudConflict?.id === career.id) {
        setSyncLabel("Saved on this device · resolve the cloud conflict to sync");
        return;
      }
      if (!cloudReady) {
        setSyncLabel("Saved on this device · cloud sync pending");
        return;
      }
      setCloudExcludedIds((ids) => ids.filter((id) => id !== career.id));
      try {
        const onlineSave = await saveOnlineCareer(session.user.id, career);
        setCloudSaves((saves) => [onlineSave, ...saves.filter((save) => save.summary.id !== onlineSave.summary.id)].sort((a, b) => b.summary.updatedAt.localeCompare(a.summary.updatedAt)));
        setSyncLabel("Saved to your account");
      } catch (error) {
        setSyncLabel(error instanceof Error ? `Save failed · ${error.message}` : "Cloud save failed");
      }
    } else setSyncLabel("Saved on this device");
  };

  const loadCloudSave = async (id: string) => {
    if (!session?.user.id) return;
    if (cloudConflict?.id === id) {
      setSyncLabel("Choose Keep device version or Use cloud version to resolve this save");
      return;
    }
    setCloudBusy(true);
    try {
      const cloudSave = await loadOnlineCareer(session.user.id, id);
      if (!cloudSave) throw new Error("That cloud career is no longer available.");
      if (career && career.id !== cloudSave.summary.id) await saveLocalCareer(career);
      const loaded = normalizeCareer(cloudSave.career);
      await saveLocalCareer(loaded);
      setActiveCareerId(loaded.id);
      setCareer(loaded);
      setLocalSaves(await listLocalCareerSaves());
      setCloudSaves((saves) => [cloudSave, ...saves.filter((save) => save.summary.id !== cloudSave.summary.id)]);
      setCloudConflict((conflict) => conflict?.id === id ? null : conflict);
      setSyncLabel("Cloud career loaded · saved on this device");
      setView("overview");
      setMode("game");
    } catch (error) {
      setSyncLabel(error instanceof Error ? `Cloud load failed · ${error.message}` : "Cloud load failed");
    } finally {
      setCloudBusy(false);
    }
  };

  const removeCloudSave = async (save: OnlineCareerSave) => {
    if (!session?.user.id || !window.confirm(`Permanently delete ${save.summary.manager}'s ${save.summary.club} cloud career? This cannot be undone.`)) return;
    setCloudBusy(true);
    try {
      await deleteOnlineCareer(session.user.id, save.summary.id);
      setCloudSaves((saves) => saves.filter((item) => item.summary.id !== save.summary.id));
      setCloudConflict((conflict) => conflict?.id === save.summary.id ? null : conflict);
      setCloudExcludedIds((ids) => ids.includes(save.summary.id) ? ids : [...ids, save.summary.id]);
      setSyncLabel(career?.id === save.summary.id ? "Cloud career deleted · this device keeps its local save" : "Cloud career deleted");
    } catch (error) {
      setSyncLabel(error instanceof Error ? `Cloud delete failed · ${error.message}` : "Cloud delete failed");
    } finally {
      setCloudBusy(false);
    }
  };

  const keepDeviceCareer = async () => {
    if (!session?.user.id || !cloudConflict) return;
    setCloudBusy(true);
    try {
      const deviceVersion = career?.id === cloudConflict.id ? career : cloudConflict.deviceCareer;
      await saveLocalCareer(deviceVersion);
      const saved = await saveOnlineCareer(session.user.id, deviceVersion);
      setCloudSaves((saves) => [saved, ...saves.filter((item) => item.summary.id !== saved.summary.id)].sort((a, b) => b.summary.updatedAt.localeCompare(a.summary.updatedAt)));
      setCloudConflict(null);
      setSyncLabel("Device version kept · cloud updated");
    } catch (error) {
      setSyncLabel(error instanceof Error ? `Could not keep device version · ${error.message}` : "Could not keep device version");
    } finally {
      setCloudBusy(false);
    }
  };

  const useCloudCareer = async () => {
    if (!session?.user.id || !cloudConflict) return;
    setCloudBusy(true);
    try {
      const conflict = cloudConflict;
      const deviceVersion = career?.id === conflict.id ? career : conflict.deviceCareer;
      const preservedDeviceCopy = { ...deviceVersion, id: createCareerId() };
      await saveLocalCareer(preservedDeviceCopy);
      const preservedOnlineCopy = await saveOnlineCareer(session.user.id, preservedDeviceCopy);
      const latestCloud = await loadOnlineCareer(session.user.id, conflict.id);
      if (!latestCloud) throw new Error("The cloud version was deleted before it could be loaded.");
      const loaded = normalizeCareer(latestCloud.career);
      await saveLocalCareer(loaded);
      setActiveCareerId(loaded.id);
      setCareer(loaded);
      setLocalSaves(await listLocalCareerSaves());
      setCloudSaves((saves) => [latestCloud, preservedOnlineCopy, ...saves.filter((item) => item.summary.id !== latestCloud.summary.id && item.summary.id !== preservedOnlineCopy.summary.id)].sort((a, b) => b.summary.updatedAt.localeCompare(a.summary.updatedAt)));
      setCloudConflict(null);
      setSyncLabel("Cloud version loaded · device version kept as a separate career");
      setView("overview");
      setMode("game");
    } catch (error) {
      setSyncLabel(error instanceof Error ? `Could not load cloud version · ${error.message}` : "Could not load cloud version");
    } finally {
      setCloudBusy(false);
    }
  };

  const loadLocalSave = async (id: string) => {
    try {
      if (career && career.id !== id && settings.autosave) {
        const currentSummary = await saveLocalCareer(career);
        setLocalSaves((saves) => [currentSummary, ...saves.filter((save) => save.id !== currentSummary.id)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      }
      const saved = await loadLocalCareer(id);
      if (!saved) throw new Error("That career save is no longer available.");
      const normalized = normalizeCareer(saved);
      setActiveCareerId(id);
      setCareer(normalized);
      setView("overview");
      setMode("game");
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load this career save.");
    }
  };

  const exportLocalSave = async (id: string) => {
    try {
      const saved = await loadLocalCareer(id);
      if (!saved) throw new Error("That career save is no longer available.");
      const blob = new Blob([JSON.stringify(saved, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${saved.manager.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "manager"}-${saved.season}-the-club.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not export this career save.");
    }
  };

  const removeLocalSave = async (save: CareerSaveSummary) => {
    if (!window.confirm(`Permanently delete ${save.manager}'s ${save.club} career from this browser? Export a backup first if you may want it later.`)) return;
    try {
      await deleteLocalCareer(save.id);
      const remaining = await listLocalCareerSaves();
      setLocalSaves(remaining);
      if (getActiveCareerId() === save.id) {
        const next = remaining[0] ? await loadLocalCareer(remaining[0].id) : null;
        setActiveCareerId(next?.id ?? null);
        setCareer(next ? normalizeCareer(next) : null);
      }
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not delete this career save.");
    }
  };

  if (!ready) return <div className="boot-screen"><ClubMark size={48} /><span>Setting the touchline…</span></div>;
  if (mode !== "game" || !career) {
    return (
      <div className="start-screen">
        <div className="start-top"><div className="wordmark"><ClubMark size={56} /><ClubWordmark /></div><button className="button button-quiet" onClick={() => setAuthOpen(true)}><Cloud size={16} /> {session ? session.user.email : "Cloud saves"}</button></div>
        <div className="start-layout">
          <div className="start-copy"><div className="live-pill"><span /> A CLUB IS BUILT EVERY DAY</div><h1>Football is a game.<br /><em>Building a club</em> is everything.</h1><p>Pick your ground. Build a squad. Put your name on a season that belongs to you.</p><div className="start-proof"><div><strong>{CLUB_OPTIONS.length.toLocaleString("en-GB")}</strong><span>clubs across the world</span></div><div><strong>{WORLD_PLAYER_COUNTRIES.length}</strong><span>countries · six continents</span></div><div><strong>∞</strong><span>seasons to build</span></div></div><div className="start-stadium-glow" /></div>
          {mode === "welcome" && career ? (
            <section className="welcome-card"><p className="eyebrow">YOUR CAREER IS READY</p><h2>Welcome back, {career.manager}</h2><div className="welcome-club"><ClubCrest club={getClub(career)} size="large" /><div><strong>{getClub(career).name}</strong><span>{getCurrentLeague(career).name} · Season {career.season}</span></div></div><button className="button button-primary button-wide" onClick={() => setMode("game")}>Continue career</button><button className="button button-secondary button-wide" onClick={() => { setLoadError(""); setMode("load"); }}>Load career</button><button className="button button-secondary button-wide" onClick={() => { if (window.confirm("Start a new career? Your current save will remain available in this browser.")) setMode("new"); }}>New career</button><button className="button button-secondary button-wide" onClick={openEditor}>Editor</button><button className="button button-secondary button-wide" onClick={() => setMode("settings")}>Settings</button><div className="local-save-note"><Save size={14} /> {syncLabel}</div></section>
          ) : mode === "new" ? (
            <section className="setup-card"><div className="setup-heading"><span className="step-count">01</span><div><p className="eyebrow">NEW CAREER</p><h2>Choose your club</h2></div></div><label className="field-label" htmlFor="manager-name">Manager name</label><input id="manager-name" className="text-input" maxLength={28} placeholder="e.g. Jamie Taylor" value={managerName} onChange={(event) => setManagerName(event.target.value)} /><label className="field-label" htmlFor="career-country">Country</label><select id="career-country" className="field-select" value={selectedCountry} onChange={(event) => { const country = event.target.value; setSelectedCountry(country); const leagues = country === "England" ? ENGLISH_LEAGUES : WORLD_LEAGUES.filter((league) => league.country === country); const nextLeague = leagues[0]; if (nextLeague) { setSelectedLeague(nextLeague.id); const firstClub = CLUB_OPTIONS.find((club) => club.leagueId === nextLeague.id); if (firstClub) setSelectedClub(firstClub.id); } }}>{WORLD_PLAYER_COUNTRIES.map((country) => <option key={country}>{country}</option>)}</select><label className="field-label" htmlFor="career-league">League</label><select id="career-league" className="field-select" value={selectedLeague} onChange={(event) => { const leagueId = event.target.value as LeagueId; setSelectedLeague(leagueId); const firstClub = CLUB_OPTIONS.find((club) => club.leagueId === leagueId); if (firstClub) setSelectedClub(firstClub.id); }}>{(selectedCountry === "England" ? ENGLISH_LEAGUES : WORLD_LEAGUES.filter((league) => league.country === selectedCountry)).map((league) => <option key={league.id} value={league.id}>{league.name} · {league.clubs} clubs</option>)}</select><div className="club-picker-heading"><span>{(selectedCountry === "England" ? ENGLISH_LEAGUES : WORLD_LEAGUES.filter((league) => league.country === selectedCountry)).find((league) => league.id === selectedLeague)?.name} · {selectedCountry}</span><span>{CLUB_OPTIONS.filter((club) => club.leagueId === selectedLeague).length} clubs</span></div><div className="club-picker">{CLUB_OPTIONS.filter((club) => club.leagueId === selectedLeague).map((club) => <button key={club.id} onClick={() => setSelectedClub(club.id)} className={`club-choice ${selectedClub === club.id ? "selected" : ""}`}><ClubCrest club={{ shortName: club.id, colors: club.colors }} size="small" /><span><strong>{club.name}</strong><small>{club.city} · {club.region} · {club.capacity.toLocaleString("en-GB")}</small></span>{selectedClub === club.id && <Check size={16} className="choice-check" />}</button>)}</div><button className="button button-primary button-wide start-career" onClick={startNewCareer}>Begin your career <Sparkles size={16} /></button><button className="button button-quiet button-wide" onClick={() => setMode(career ? "welcome" : "welcome")}>Back</button></section>
          ) : mode === "load" ? (
            <section className="setup-card save-library-card"><div className="setup-heading"><span className="step-count"><Save size={17} /></span><div><p className="eyebrow">CAREER LIBRARY</p><h2>Return to a save</h2></div></div><p className="setup-intro">Careers are stored separately on this device. Export a file to keep a portable backup.</p>{localSaves.length ? <div className="career-save-list" aria-label="Saved careers">{localSaves.map((save) => <article className={`career-save-row ${career?.id === save.id ? "career-save-active" : ""}`} key={save.id}><button className="career-save-open" onClick={() => { void loadLocalSave(save.id); }}><span className="career-save-crest">{save.club.slice(0, 2).toUpperCase()}</span><span className="career-save-copy"><strong>{save.club}</strong><small>{save.manager} · {save.country}</small><small>Season {save.season} · Round {save.round} · Saved {new Date(save.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</small></span><span className="career-save-load">{career?.id === save.id ? "ACTIVE" : "LOAD"}</span></button><div className="career-save-actions"><button type="button" aria-label={`Export ${save.manager}'s ${save.club} save`} title="Export backup" onClick={() => { void exportLocalSave(save.id); }}><Download size={15} /></button><button type="button" className="career-save-delete" aria-label={`Delete ${save.manager}'s ${save.club} save`} title="Delete save" onClick={() => { void removeLocalSave(save); }}><Trash2 size={15} /></button></div></article>)}</div> : <p className="career-save-empty">No local career saves yet. Start a career or import a backup file.</p>}<label className="button button-secondary button-wide import-career-button">Import career file<input type="file" accept="application/json,.json" onChange={(event) => { void importCareer(event.target.files?.[0]); }} /></label>{loadError && <p className="form-error">{loadError}</p>}<button className="button button-quiet button-wide" onClick={() => setMode("welcome")}>Back</button></section>
          ) : mode === "editor" ? (
            <div className="landing-tool-panel"><EditorLocked onBack={() => setMode("welcome")} startFromEditor /></div>
          ) : mode === "settings" ? (
            <div className="landing-tool-panel"><SettingsPanel settings={settings} onChange={setSettings} onBack={() => setMode("welcome")} /></div>
          ) : (
            <section className="setup-card welcome-first"><div className="setup-heading"><span className="step-count"><Flag size={17} /></span><div><p className="eyebrow">A NEW CHAPTER</p><h2>Take the chair</h2></div></div><p className="setup-intro">The board has a plan. The supporters have hope. Start with a club and give them a season to remember.</p><button className="button button-primary button-wide" onClick={() => setMode("new")}>New career <Plus size={16} /></button><button className="button button-secondary button-wide" onClick={() => { setLoadError(""); setMode("load"); }}>Load career <Save size={15} /></button><button className="button button-secondary button-wide" onClick={openEditor}>Editor <Database size={15} /></button><button className="button button-secondary button-wide" onClick={() => setMode("settings")}>Settings <Settings2 size={15} /></button><button className="button button-quiet button-wide" onClick={() => setAuthOpen(true)}><Cloud size={16} /> Set up cloud saves</button><p className="local-note">Careers save automatically in this browser.</p></section>
          )}
        </div>
        <div className="start-footer"><span>EST. 2026</span><span>THE GAME BELONGS TO YOU</span><span>PLAY AT YOUR PACE</span></div>
        {authOpen && <CloudModal session={session} email={authEmail} setEmail={setAuthEmail} message={authMessage} setMessage={setAuthMessage} syncLabel={syncLabel} saves={cloudSaves} conflict={cloudConflict} busy={cloudBusy} onLoadCareer={loadCloudSave} onDeleteCareer={removeCloudSave} onKeepDevice={keepDeviceCareer} onUseCloud={useCloudCareer} onClose={() => setAuthOpen(false)} onSubmit={handleMagicLink} onSignOut={signOut} />}
      </div>
    );
  }

  return <CareerLayout career={career} setCareer={setCareer} view={view} setView={setView} session={session} syncLabel={syncLabel} settings={settings} onSettingsChange={setSettings} onManualSave={saveCareerManually} onCloud={() => setAuthOpen(true)} authOpen={authOpen} setAuthOpen={setAuthOpen} authEmail={authEmail} setAuthEmail={setAuthEmail} authMessage={authMessage} setAuthMessage={setAuthMessage} onMagicLink={handleMagicLink} onSignOut={signOut} mobileNav={mobileNav} setMobileNav={setMobileNav} navSearch={navSearch} setNavSearch={setNavSearch} cloudSaves={cloudSaves} cloudConflict={cloudConflict} cloudBusy={cloudBusy} onLoadCloudCareer={loadCloudSave} onDeleteCloudCareer={removeCloudSave} onKeepDevice={keepDeviceCareer} onUseCloud={useCloudCareer} />;
}

function CloudModal({ session, email, setEmail, message, setMessage, syncLabel, saves, conflict, busy, onLoadCareer, onDeleteCareer, onKeepDevice, onUseCloud, onClose, onSubmit, onSignOut }: {
  session: Session | null; email: string; setEmail: (value: string) => void; message: string; setMessage: (value: string) => void; syncLabel: string; saves: OnlineCareerSave[]; conflict: { id: string; deviceCareer: Career; cloudSave: OnlineCareerSave } | null; busy: boolean; onLoadCareer: (id: string) => void; onDeleteCareer: (save: OnlineCareerSave) => void; onKeepDevice: () => void; onUseCloud: () => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onSignOut: () => void;
}) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal-card auth-modal"><button className="modal-close" aria-label="Close" onClick={onClose}><X size={18} /></button><div className="modal-icon"><Cloud size={20} /></div><p className="eyebrow">CAREER BACKUP</p><h2>{session ? "Your cloud careers" : "Take your career anywhere"}</h2>{session ? <><p>Private to {session.user.email}. Load a career here to bring it onto this device.</p><div className={`cloud-state ${conflict ? "cloud-state-conflict" : ""}`}><BadgeCheck size={16} /> {conflict ? "Two versions of this career need your choice" : syncLabel}</div>{conflict && <div className="cloud-conflict-card"><strong>Different versions found</strong><p>Keep the device version in the cloud, or load the cloud version. Loading it preserves the device version as a separate career first.</p><div className="cloud-conflict-actions"><button className="button button-secondary" disabled={busy} onClick={onKeepDevice}>Keep device version</button><button className="button button-primary" disabled={busy} onClick={onUseCloud}>Use cloud version</button></div></div>}<div className="cloud-library-heading"><strong>Saved careers</strong><span>{saves.length}</span></div>{saves.length ? <div className="cloud-career-list">{saves.map((save) => <article className={`cloud-career-row ${conflict?.id === save.summary.id ? "cloud-career-conflict" : ""}`} key={save.summary.id}><button className="cloud-career-load" disabled={busy} onClick={() => onLoadCareer(save.summary.id)}><span className="career-save-crest">{save.summary.club.slice(0, 2).toUpperCase()}</span><span className="career-save-copy"><strong>{save.summary.club}</strong><small>{save.summary.manager} · {save.summary.country}</small><small>Season {save.summary.season} · Round {save.summary.round} · {new Date(save.summary.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</small></span><span className="career-save-load">{conflict?.id === save.summary.id ? "REVIEW" : "LOAD"}</span></button><button className="cloud-career-delete" aria-label={`Delete ${save.summary.manager}'s ${save.summary.club} cloud save`} title="Delete cloud save" disabled={busy} onClick={() => onDeleteCareer(save)}><Trash2 size={15} /></button></article>)}</div> : <p className="career-save-empty">No cloud careers yet. A career on this device will be added after it saves.</p>}<p className="cloud-sync-label">{syncLabel}</p><div className="modal-actions"><button className="button button-secondary" onClick={onSignOut}>Sign out</button><button className="button button-primary" onClick={onClose}>Done</button></div></> : isSupabaseConfigured ? <form onSubmit={onSubmit}><p>We’ll send a one-time sign-in link. Your career stays private to your account.</p><label className="field-label" htmlFor="cloud-email">Email address</label><input id="cloud-email" className="text-input" type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setMessage(""); }} placeholder="you@example.com" required /><button className="button button-primary button-wide modal-submit" type="submit"><Mail size={15} /> Send sign-in link</button>{message && <p className="form-message">{message}</p>}</form> : <><p>Cloud saves need a Supabase project and its public connection keys. Until that is connected, your career is saved on this browser and can be continued here.</p><div className="setup-note"><span className="note-icon"><Lightbulb size={15} /></span><span>Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> after the project is connected.</span></div><p className="muted">Never add a Supabase secret key to the browser app.</p><button className="button button-primary button-wide" onClick={onClose}>Got it</button></>}</section></div>;
}

function CareerLayout({ career, setCareer, view, setView, session, syncLabel, settings, onSettingsChange, onManualSave, onCloud, authOpen, setAuthOpen, authEmail, setAuthEmail, authMessage, setAuthMessage, onMagicLink, onSignOut, mobileNav, setMobileNav, navSearch, setNavSearch, cloudSaves, cloudConflict, cloudBusy, onLoadCloudCareer, onDeleteCloudCareer, onKeepDevice, onUseCloud }: {
  career: Career; setCareer: (career: Career) => void; view: View; setView: (view: View) => void; session: Session | null; syncLabel: string; settings: GameSettings; onSettingsChange: (settings: GameSettings) => void; onManualSave: () => void; onCloud: () => void; authOpen: boolean; setAuthOpen: (open: boolean) => void; authEmail: string; setAuthEmail: (email: string) => void; authMessage: string; setAuthMessage: (message: string) => void; onMagicLink: (event: FormEvent<HTMLFormElement>) => void; onSignOut: () => void; mobileNav: boolean; setMobileNav: (open: boolean) => void; navSearch: string; setNavSearch: (search: string) => void; cloudSaves: OnlineCareerSave[]; cloudConflict: { id: string; deviceCareer: Career; cloudSave: OnlineCareerSave } | null; cloudBusy: boolean; onLoadCloudCareer: (id: string) => void; onDeleteCloudCareer: (save: OnlineCareerSave) => void; onKeepDevice: () => void; onUseCloud: () => void;
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
  const unreadInboxCount = getUnreadManagerInboxCount(career);
  const nextFixture = getNextFixture(career);
  const [profilePlayerId, setProfilePlayerId] = useState<string | null>(null);
  const [matchdayManagerOpen, setMatchdayManagerOpen] = useState(false);
  const [postMatchReport, setPostMatchReport] = useState<{ career: Career; fixtureId: string } | null>(null);
  const [calendarAlert, setCalendarAlert] = useState<NewsItem[] | null>(null);
  const [calendarNotice, setCalendarNotice] = useState("");
  const profilePlayer = profilePlayerId ? career.players.find((player) => player.id === profilePlayerId) ?? getWorldPlayerDetails(profilePlayerId) : null;
  const profileReport = profilePlayerId ? getScoutingReport(career, profilePlayerId) : null;
  const filteredNav = NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(navSearch.toLowerCase()));
  const activeTitle = NAV_ITEMS.find((item) => item.id === view)?.label ?? "Overview";
  const activeLeague = getCurrentLeague(career);
  const seasonEnd = isSeasonComplete(career);
  const worldWeek = career.round > activeLeague.rounds && !seasonEnd;
  const currentDate = getCalendarDate(career);
  const isMatchday = Boolean(nextFixture && !nextFixture.played && currentDate >= nextFixture.date);
  const syncText = cloudConflict?.id === career.id
    ? "Choose save version"
    : !settings.autosave
      ? "Unsaved changes"
      : !session
        ? "Auto-saved"
        : /error|failed|unavailable/i.test(syncLabel)
          ? "Cloud issue"
          : /pending|checking/i.test(syncLabel)
            ? "Syncing"
            : /device|deleted/i.test(syncLabel)
              ? "Device saved"
              : /saved|connected|loaded/i.test(syncLabel)
                ? "Cloud saved"
                : "Cloud ready";
  const nextAction = () => {
    if (seasonEnd) { setCareer(beginNextSeason(career)); return; }
    const pendingBid = (career.incomingTransferOffers ?? []).some((offer) => offer.status === "Pending" && offer.expiresDate >= currentDate);
    if (pendingBid) { setCalendarNotice("A formal bid needs your decision. Resolve it in the inbox before advancing."); setView("inbox"); return; }
    const onLeave = career.managerLeave?.status === "active";
    if (isMatchday && !onLeave) { setView("tactics"); return; }
    if (!onLeave) {
      const progression = advanceCareerCalendarDay(career);
      setCareer(progression.career);
      setCalendarNotice(progression.message);
      if (progression.event === "matchday") setView("tactics");
      if (progression.event === "international") setView("international");
      if (progression.event === "inbox") setView("inbox");
      return;
    }
    const progression = advanceToNextCalendarEvent(career);
    const result = progression.career;
    setCareer(result);
    setCalendarNotice(progression.message);
    if (progression.urgentNews.length) setCalendarAlert(progression.urgentNews);
    if (progression.event === "international" && !onLeave) setView("international");
    if (result.lastReport) setPostMatchReport({ career: result, fixtureId: result.lastReport.fixtureId });
  };
  const playInstantResult = () => {
    if (!isMatchday || !nextFixture) return;
    if ((career.incomingTransferOffers ?? []).some((offer) => offer.status === "Pending" && offer.expiresDate >= currentDate)) { setCalendarNotice("Resolve the urgent transfer bid in the inbox before playing this fixture."); setView("inbox"); return; }
    const beforeIds = new Set(career.news.map((item) => item.id));
    const result = playMatchday({ ...career, calendarDate: nextFixture.date });
    setCareer(result);
    setCalendarNotice("Instant result recorded. Review the score, scorers and match report.");
    if (result.lastReport) setPostMatchReport({ career: result, fixtureId: result.lastReport.fixtureId });
    const urgent = result.news.filter((item) => item.urgent && !beforeIds.has(item.id));
    if (urgent.length) setCalendarAlert(urgent);
  };
  const confirmMatchdayPlan = (plan: MatchdayManagementPlan) => {
    if ((career.incomingTransferOffers ?? []).some((offer) => offer.status === "Pending" && offer.expiresDate >= currentDate)) { setMatchdayManagerOpen(false); setCalendarNotice("Resolve the urgent transfer bid in the inbox before starting the match."); setView("inbox"); return; }
    const result = startManagedMatch(career, plan);
    setCareer(result);
    setMatchdayManagerOpen(false);
  };
  const finishLiveMatch = () => {
    const result = finishManagedMatch(career);
    if (result === career || !result.lastReport) return;
    setCareer(result);
    setPostMatchReport({ career: result, fixtureId: result.lastReport.fixtureId });
  };
  const postMatchFixture = postMatchReport ? postMatchReport.career.fixtures.find((fixture) => fixture.id === postMatchReport.fixtureId) ?? null : null;

  return <div className="app-shell">
    {mobileNav && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileNav(false)} />}
    <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
      <div className="sidebar-brand"><ClubMark size={29} /><ClubWordmark compact /><button className="mobile-close" aria-label="Close menu" onClick={() => setMobileNav(false)}><X size={19} /></button></div>
      <button className="club-selector" onClick={() => setView("overview")}><ClubCrest club={club} size="small" /><span className="club-selector-copy"><strong>{club.name}</strong><small>{activeLeague.name} · {2026 + career.season - 1}/{String(2027 + career.season - 1).slice(-2)}</small></span><ChevronDown size={15} /></button>
      <div className="nav-search-wrap"><Search size={15} /><input aria-label="Find a section" value={navSearch} onChange={(event) => setNavSearch(event.target.value)} placeholder="Find a section" /><kbd>⌘ K</kbd></div>
      <nav className="main-nav">{["Club", "Team", "Competition", "Recruitment", "Development", "Manager"].map((section) => {
        const links = filteredNav.filter((item) => item.section === section);
        if (!links.length) return null;
        return <div className="nav-group" key={section}><p className="nav-label">{section}</p>{links.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-link ${view === id ? "active" : ""}`} onClick={() => { setView(id); setMobileNav(false); }}><Icon size={17} strokeWidth={1.7} /><span>{label}</span>{id === "inbox" && unreadInboxCount > 0 && <span className="inbox-nav-count" aria-label={`${unreadInboxCount} unread messages`}>{unreadInboxCount > 99 ? "99+" : unreadInboxCount}</span>}{id === "stadium" && <span className="nav-badge">NEW</span>}</button>)}</div>;
      })}</nav>
      <div className="sidebar-bottom"><div className="club-trust"><div className="trust-header"><span>Board confidence</span><strong>{club.boardTrust}%</strong></div><div className="progress-track"><span style={{ width: `${club.boardTrust}%` }} /></div><small>{club.boardTrust >= 60 ? "The board is behind you" : club.boardTrust >= 35 ? "Results are being watched" : "Your position is at risk"}</small></div><button className="user-row" onClick={onCloud}><span className="user-avatar">{career.manager.split(" ").map((word) => word[0]).slice(0, 2).join("").toUpperCase()}</span><span className="user-copy"><strong>{career.manager}</strong><small>{session ? "Cloud connected" : "Local career"}</small></span><ChevronDown size={14} /></button></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="topbar-left"><button className="menu-toggle" aria-label="Open menu" onClick={() => setMobileNav(true)}><Menu size={20} /></button><div className="top-crumb"><span>MY CLUB</span><b>/</b><strong>{activeTitle}</strong></div></div><div className="topbar-right"><div className="round-indicator"><CalendarDays size={15} /><span>{seasonEnd ? "Season complete" : `${getTopbarDate(career)} · ${worldWeek ? `World week ${career.round}` : `Round ${career.round} / ${activeLeague.rounds}`}`}</span></div><div className="top-divider" /><div className={`save-indicator ${cloudConflict?.id === career.id ? "save-indicator-conflict" : ""}`} title={syncLabel}><span className={session ? "save-dot online" : "save-dot"} /><span>{syncText}</span></div><button className="button button-primary advance-button" onClick={nextAction} disabled={career.unemployed || (isMatchday && view === "tactics")}>{seasonEnd ? "Start pre-season" : career.managerLeave?.status === "active" ? "Continue holiday" : isMatchday ? "Match Day" : "Advance one day"}{isMatchday ? <Flag size={15} /> : <Clock3 size={15} />}</button></div></header>
      <CalendarRibbon career={career} />
      {calendarNotice && <div className={`calendar-status-message ${isMatchday ? "calendar-status-matchday" : ""}`} role="status"><span>{calendarNotice}</span><button type="button" aria-label="Dismiss calendar update" onClick={() => setCalendarNotice("")}><X size={13} /></button></div>}
      <main className="content-area">
        {career.unemployed && view !== "manager-career" && <JobSearch career={career} setCareer={setCareer} />}
        {!career.unemployed && view === "overview" && <Overview career={career} setCareer={setCareer} onAdvance={nextAction} seasonEnd={seasonEnd} />}
        {view === "manager-career" && <ManagerCareerPage career={career} setCareer={setCareer} setView={setView} />}
        {view === "inbox" && <ManagerInbox career={career} setCareer={setCareer} setView={setView} />}
        {view === "newsroom" && <Newsroom career={career} setView={setView} />}
        {view === "archive" && <ClubArchivePage career={career} onPlayerProfile={setProfilePlayerId} />}
        {(view === "squad" || view === "tactics") && <SquadTacticsArea career={career} setCareer={setCareer} onPlayerProfile={setProfilePlayerId} view={view} setView={setView} isMatchday={isMatchday} onInstantResult={playInstantResult} onLiveMatch={() => setMatchdayManagerOpen(true)} />}
        {view === "fixtures" && <Fixtures career={career} setCareer={setCareer} onAdvance={nextAction} seasonEnd={seasonEnd} />}
        {view === "international" && <InternationalFootball career={career} onPlayerProfile={setProfilePlayerId} />}
        {view === "calendar" && <CareerCalendar career={career} setCareer={setCareer} onAdvance={nextAction} />}
        {view === "table" && <LeagueTable career={career} />}
        {view === "transfers" && <Transfers career={career} setCareer={setCareer} onPlayerProfile={setProfilePlayerId} />}
        {view === "people" && <StaffManagement career={career} setCareer={setCareer} />}
        {view === "stadium" && <StadiumArchitect career={career} setCareer={setCareer} />}
        {view === "finance" && <Finance career={career} setCareer={setCareer} />}
        {view === "clubhouse" && <Clubhouse career={career} setCareer={setCareer} setView={setView} />}
        {view === "academy" && <Academy career={career} setCareer={setCareer} onPlayerProfile={setProfilePlayerId} setView={setView} />}
        {view === "commercial" && <Commercial career={career} setCareer={setCareer} />}
        {view === "editor" && <EditorLocked onBack={() => setView("overview")} />}
        {view === "settings" && <SettingsPanel settings={settings} onChange={onSettingsChange} inCareer onBack={() => setView("overview")} />}
      </main>
      <footer className="app-footer"><span><span className="footer-mark" /> THE CLUB · SEASON {career.season}</span><div className="footer-actions"><button className="footer-save" onClick={onManualSave}><Save size={14} /> Save career</button><button className="footer-save" onClick={onCloud}><Cloud size={14} /> {session ? "Cloud account" : "Cloud saves"}</button></div></footer>
    </div>
    {authOpen && <CloudModal session={session} email={authEmail} setEmail={setAuthEmail} message={authMessage} setMessage={setAuthMessage} syncLabel={syncLabel} saves={cloudSaves} conflict={cloudConflict} busy={cloudBusy} onLoadCareer={onLoadCloudCareer} onDeleteCareer={onDeleteCloudCareer} onKeepDevice={onKeepDevice} onUseCloud={onUseCloud} onClose={() => setAuthOpen(false)} onSubmit={onMagicLink} onSignOut={onSignOut} />}
    {profilePlayer && <PlayerProfile player={profilePlayer} report={profileReport} known={!profilePlayerId?.startsWith("world-") || Boolean(profileReport)} onClose={() => setProfilePlayerId(null)} />}
    {matchdayManagerOpen && <MatchdayManagementModal career={career} onClose={() => setMatchdayManagerOpen(false)} onConfirm={confirmMatchdayPlan} />}
    {career.activeMatch && <LiveMatchCenter career={career} setCareer={setCareer} onFinish={finishLiveMatch} />}
    {postMatchFixture && postMatchReport && <MatchReportDialog career={postMatchReport.career} fixture={postMatchFixture} onClose={() => setPostMatchReport(null)} />}
    {calendarAlert && <div className="modal-backdrop calendar-alert-backdrop"><section className="modal-card calendar-alert-dialog" role="alertdialog" aria-modal="true" aria-labelledby="calendar-alert-title"><span className="calendar-alert-icon"><AlertTriangle size={22} /></span><p className="eyebrow">CALENDAR PAUSED · URGENT CLUB NEWS</p><h2 id="calendar-alert-title">{calendarAlert.length === 1 ? calendarAlert[0].headline : `${calendarAlert.length} urgent updates need your attention`}</h2>{calendarAlert.map((item) => <article key={item.id}><strong>{item.headline}</strong><p>{item.body}</p></article>)}<div className="calendar-alert-actions"><button type="button" className="button button-secondary" onClick={() => { setCalendarAlert(null); setPostMatchReport(null); setView("newsroom"); }}>Open newsroom</button><button type="button" className="button button-primary" onClick={() => setCalendarAlert(null)}>Acknowledge</button></div></section></div>}
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
    <section className={`pressure-panel ${career.pressure! >= 70 ? "pressure-high" : ""}`}><div className="pressure-copy"><div><p className="eyebrow">PRESSURE FACTORS</p><strong>Managerial pressure</strong><small>Results, press coverage, supporter confidence, player rapport, dressing-room tension and the club target all shape this measure.</small></div><b>{(career.pressure ?? 18).toFixed(1)}<span> / 100</span></b></div><div className="pressure-meter" role="meter" aria-label="Managerial pressure" aria-valuemin={0} aria-valuemax={100} aria-valuenow={career.pressure ?? 18}><i style={{ width: `${career.pressure ?? 18}%` }} /></div><div className="pressure-signals"><span>FORM <b>+{pressureSignals.form.toFixed(1)}</b></span><span>PRESS <b>+{(pressureSignals.press * 0.62).toFixed(1)}</b></span><span>SUPPORTERS <b>+{(pressureSignals.supporters * 0.65).toFixed(1)}</b></span><span>PLAYERS <b>+{(pressureSignals.players * 0.7).toFixed(1)}</b></span><span>DRESSING ROOM <b>+{(pressureSignals.dressingRoom * 0.55).toFixed(1)}</b></span><span>BOARD TARGET <b>+{(pressureSignals.expectations * 0.8).toFixed(1)}</b></span></div><div className="pressure-foot"><span>Current run without a win <strong>{career.winlessRun ?? 0} match{(career.winlessRun ?? 0) === 1 ? "" : "es"}</strong></span><span>{pressureSignals.averageRapport}% average rapport · supporters {club.supporterConfidence}%</span></div></section>
    <ManagerPromiseDesk career={career} setCareer={setCareer} />
    <ManagerBriefing career={career} />
    <div className="overview-grid"><section className="next-match-card"><div className="match-topline"><div className="match-label"><span className="match-live-dot" /> NEXT MATCH</div><span>{seasonEnd ? "PRE-SEASON" : career.round > league.rounds ? "WORLD WEEK " + career.round : league.name.toUpperCase() + " · ROUND " + career.round}</span></div>{nextFixture && homeClub && awayClub ? <><div className="match-date">{pageDate(nextFixture.date)} <span>·</span> {formatGameTime(15)} <span>·</span> {nextFixture.homeClubId === career.clubId ? "Home" : "Away"}</div><div className="match-sides"><div className="match-team"><ClubCrest club={homeClub} size="large" /><strong>{homeClub.name}</strong><small>HOME</small></div><div className="match-vs"><span>VS</span><i /></div><div className="match-team"><ClubCrest club={awayClub} size="large" /><strong>{awayClub.name}</strong><small>AWAY</small></div></div><div className="match-bottom"><span><MapPin size={14} /> {nextFixture.homeClubId === career.clubId ? club.stadium.name : awayClub.city}</span><button className="button button-primary" onClick={onAdvance}>{getCalendarDate(career) >= nextFixture.date ? "Set match plan" : "Advance one day"} <Flag size={15} /></button></div></> : seasonEnd ? <div className="season-end-card"><div className="season-end-icon"><Trophy size={22} /></div><div><strong>That’s the season</strong><p>Take a look back, then prepare your squad for a new campaign.</p></div><button className="button button-primary" onClick={onAdvance}>Start next season <RefreshCw size={15} /></button></div> : <div className="world-rest-card"><span className="eyebrow">WORLD WEEK {career.round} OF {getSeasonWeekCount(career)}</span><strong>No league fixture this week</strong><p>Your {league.name} season is complete; the other divisions are finishing their campaign.</p><button className="button button-secondary" onClick={onAdvance}>Advance one day <Clock3 size={15} /></button></div>}{career.lastReport && !reportDismissed && <div className="match-report"><div className="report-icon"><Newspaper size={15} /></div><div><small>MATCH REPORT · {career.lastReport.result}</small><strong>{career.lastReport.headline}</strong><span>{career.lastReport.notes[0]}</span></div><button aria-label="Dismiss report" onClick={() => setReportDismissed(true)}><X size={15} /></button></div>}</section>
      <section className="table-card"><div className="card-heading"><div><p className="eyebrow">THE RUN-IN</p><h2>League table</h2></div><button className="text-button" onClick={() => document.dispatchEvent(new CustomEvent("the-club-view", { detail: "table" }))}>Full table</button></div><div className="mini-table-head"><span>#</span><span>Club</span><span>P</span><span>GD</span><span>Pts</span></div><div className="mini-table-body">{table.filter((row) => row.clubId !== career.clubId).slice(0, 4).map((row) => { const position = table.findIndex((entry) => entry.clubId === row.clubId) + 1; return <div key={row.clubId} className="mini-table-row"><span className="table-rank">{position}</span><span className="mini-club-name"><ClubCrest club={getClub(career, row.clubId)} size="small" />{row.club}</span><span>{row.played}</span><span className={row.goalsFor - row.goalsAgainst < 0 ? "negative" : ""}>{row.goalsFor - row.goalsAgainst > 0 ? "+" : ""}{row.goalsFor - row.goalsAgainst}</span><strong>{row.points}</strong></div>; })}</div><div className="table-cutline"><span>YOUR CLUB</span><i /></div><div className="mini-table-row current-last current"><span className="table-rank">{rank}</span><span className="mini-club-name"><ClubCrest club={club} size="small" />{club.name}</span><span>{currentRow.played}</span><span>{currentRow.goalsFor - currentRow.goalsAgainst > 0 ? "+" : ""}{currentRow.goalsFor - currentRow.goalsAgainst}</span><strong>{currentRow.points}</strong></div></section></div>
    <div className="lower-grid"><section className="news-card"><div className="card-heading"><div><p className="eyebrow">AROUND THE GROUND</p><h2>Club news</h2></div><button className="text-button" onClick={() => document.dispatchEvent(new CustomEvent("the-club-view", { detail: "newsroom" }))}>Open newsroom</button></div><div className="news-list">{recentNews.map((news) => <article key={news.id} className="news-item"><span className={`news-type type-${news.type}`}>{news.type === "match" ? <Flag size={15} /> : news.type === "stadium" ? <Building2 size={15} /> : news.type === "transfer" ? <RefreshCw size={15} /> : news.type === "award" ? <Trophy size={15} /> : <Megaphone size={15} />}</span><div><small>{news.date} · {news.type.toUpperCase()}</small><strong>{news.headline}</strong><p>{news.body}</p></div></article>)}</div></section><section className="club-focus-card"><div className="card-heading"><div><p className="eyebrow">A CLUB WORTH BUILDING</p><h2>On and off the pitch</h2></div><Sparkles size={17} /></div><div className="focus-row"><span className="focus-icon"><Building2 size={16} /></span><div><strong>{club.stadium.name}</strong><small>{club.stadium.capacity.toLocaleString("en-GB")} capacity · {club.stadium.tiers} tier{club.stadium.tiers === 1 ? "" : "s"}</small></div><button className="focus-open" onClick={() => document.dispatchEvent(new CustomEvent("the-club-view", { detail: "stadium" }))}>Design</button></div><div className="focus-row"><span className="focus-icon"><Store size={16} /></span><div><strong>{club.sponsor}</strong><small>{MONEY(club.sponsorAnnual)} annual sponsor</small></div><button className="focus-open" onClick={() => { setCareer(sponsorProposal(career)); document.dispatchEvent(new CustomEvent("the-club-view", { detail: "finance" })); }}>Negotiate</button></div><div className="target-box"><span className="target-icon"><TargetIcon /></span><div><small>BOARD SEASON TARGET</small><strong>Finish in the top {club.targetPosition}</strong></div><span className={`target-status ${rank <= club.targetPosition ? "on-target" : "off-target"}`}>{rank <= club.targetPosition ? "ON COURSE" : "NEED A RUN"}</span></div></section></div>
    <ClubDNACard career={career} />
    <ClubHeritageCard club={club} career={career} />
  </>;
}

function ManagerBriefing({ career }: { career: Career }) {
  const items = getManagerBriefing(career);
  const icons: Record<ManagerBriefingRoute, LucideIcon> = {
    squad: Users,
    tactics: Flag,
    transfers: RefreshCw,
    finance: Banknote,
    academy: GraduationCap,
    clubhouse: Shield,
  };

  return <section className="manager-briefing" aria-labelledby="manager-briefing-title">
    <div className="manager-briefing-header"><div><p className="eyebrow"><Sparkles size={13} /> MANAGER’S OFFICE · LIVE READ</p><h2 id="manager-briefing-title">Assistant briefing</h2><span>Recommendations based on this career’s current squad, board and opposition data.</span></div><span className="briefing-count">{items.length} {items.length === 1 ? "priority" : "priorities"}</span></div>
    <div className="manager-briefing-list">{items.map((item) => {
      const Icon = icons[item.route];
      return <article className={`manager-briefing-item briefing-${item.priority.toLowerCase()}`} key={item.id}>
        <span className="manager-briefing-icon"><Icon size={16} /></span>
        <div className="manager-briefing-copy"><div className="manager-briefing-meta"><span>{item.priority}</span><small>{item.evidence}</small></div><h3>{item.headline}</h3><p>{item.detail}</p></div>
        <button type="button" className="manager-briefing-action" onClick={() => document.dispatchEvent(new CustomEvent("the-club-view", { detail: item.route }))}>{item.actionLabel}<ChevronDown size={13} /></button>
      </article>;
    })}</div>
  </section>;
}

const INBOX_FILTERS: (ManagerInboxCategory | "All")[] = ["All", "Club news", "Match analysis", "Press conference", "Transfer offer", "Contracts", "Scouting", "Commercial"];

function ManagerInbox({ career, setCareer, setView }: { career: Career; setCareer: (career: Career) => void; setView: (view: View) => void }) {
  const [filter, setFilter] = useState<ManagerInboxCategory | "All">("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const messages = getManagerInbox(career);
  const unread = messages.filter((message) => !message.read).length;
  const visibleMessages = filter === "All" ? messages : messages.filter((message) => message.category === filter);
  const selected = visibleMessages.find((message) => message.id === selectedId) ?? null;
  const selectMessage = (message: ManagerInboxMessage) => {
    setSelectedId(message.id);
    setFeedback("");
    if (!message.read) setCareer(markManagerInboxRead(career, [message.id]));
  };
  const openRoute = (message: ManagerInboxMessage) => {
    if (!message.read) setCareer(markManagerInboxRead(career, [message.id]));
    setView(message.route);
  };
  const respond = (choice: PressConferenceChoice) => {
    const fixtureId = selected?.id.replace("press-conference:", "");
    if (!selected || !fixtureId) return;
    const next = respondToPressConference(career, fixtureId, choice);
    if (next === career) { setFeedback("That press briefing has already been answered or is no longer active."); return; }
    setCareer(next);
    setFeedback(`Response recorded: ${choice}. The effects are reflected in the squad and club mood.`);
  };
  const decideBid = (decision: "Accept" | "Reject") => {
    const offerId = selected?.id.replace("transfer-bid:", "");
    if (!selected || !offerId) return;
    const next = resolveClubTransferBid(career, offerId, decision);
    if (next === career) { setFeedback(decision === "Accept" ? "The club cannot complete that sale right now. Check the bid, player status and replacement cover." : "This bid is no longer active."); return; }
    setCareer(next);
    setFeedback(decision === "Accept" ? "Bid accepted. The transfer and club accounts have been updated." : "Bid rejected. The player remains at the club.");
    setSelectedId(null);
  };
  const priorityLabel = (priority: ManagerInboxMessage["priority"]) => priority === "Urgent" ? "URGENT" : priority === "Action needed" ? "ACTION" : "UPDATE";
  const title = selected ? selected.subject : "Your office is clear";

  return <div className="manager-inbox-page">
    <SectionHeading kicker="THE MANAGER’S OFFICE" title="Inbox" detail="Club news, press briefings, recruitment decisions and match intelligence in one place." action={<button type="button" className="button button-secondary" onClick={() => setView("newsroom")}><Newspaper size={15} /> Open newsroom</button>} />
    <section className="inbox-summary-strip" aria-label="Inbox summary"><div><Mail size={17} /><span><strong>{messages.length}</strong><small>MESSAGES</small></span></div><div><span className="inbox-unread-dot" /><span><strong>{unread}</strong><small>UNREAD</small></span></div><button type="button" className="button button-secondary button-small" onClick={() => { setCareer(markAllManagerInboxRead(career)); setFeedback("All current messages marked as read."); }} disabled={unread === 0}><Check size={14} /> Mark all read</button></section>
    <div className="inbox-filter-row" role="group" aria-label="Filter inbox messages">{INBOX_FILTERS.map((item) => <button type="button" key={item} className={filter === item ? "active" : ""} aria-pressed={filter === item} onClick={() => { setFilter(item); setSelectedId(null); setFeedback(""); }}>{item}</button>)}</div>
    <section className="inbox-workspace" aria-label="Manager inbox">
      <div className="inbox-message-list" aria-label="Messages">
        <div className="inbox-list-heading"><span>{filter === "All" ? "ALL CORRESPONDENCE" : filter.toUpperCase()}</span><small>{visibleMessages.length} {visibleMessages.length === 1 ? "message" : "messages"}</small></div>
        {visibleMessages.map((message) => <button type="button" key={message.id} className={`inbox-message-row ${message.read ? "is-read" : "is-unread"} ${selected?.id === message.id ? "is-selected" : ""} inbox-priority-${message.priority.toLowerCase().replaceAll(" ", "-")}`} onClick={() => selectMessage(message)} aria-current={selected?.id === message.id ? "true" : undefined}>
          <span className="inbox-message-dot" aria-label={message.read ? "Read" : "Unread"} /><span className="inbox-message-copy"><span className="inbox-message-meta"><small>{message.category}</small><b>{priorityLabel(message.priority)}</b></span><strong>{message.subject}</strong><span>{message.body}</span><time>{message.date}</time></span>
        </button>)}
        {!visibleMessages.length && <div className="inbox-empty-list"><Mail size={21} /><strong>No messages in this folder</strong><span>News and decisions will appear here as your career progresses.</span></div>}
      </div>
      <article className="inbox-reading-pane" aria-live="polite">
        {selected ? <>
          <div className="inbox-reading-meta"><span className={`inbox-priority-pill inbox-pill-${selected.priority.toLowerCase().replaceAll(" ", "-")}`}>{priorityLabel(selected.priority)}</span><span>{selected.category}</span><time>{selected.date}</time></div>
          <h2>{title}</h2><p className="inbox-message-body">{selected.body}</p>
          {selected.category === "Press conference" && selected.choices && <div className="inbox-action-block"><div><p className="eyebrow">YOUR RESPONSE · BEFORE THE NEXT MATCH</p><strong>Set the tone with the press</strong><span>Your answer shapes pressure, player rapport and the team’s pre-match mood.</span></div><div className="inbox-choice-actions">{selected.choices.map((choice) => <button type="button" className="button button-secondary" key={choice.id} onClick={() => respond(choice.id as PressConferenceChoice)}>{choice.label}</button>)}</div></div>}
          {selected.category === "Transfer offer" && <div className="inbox-action-block inbox-bid-action"><div><p className="eyebrow">A DECISION IS REQUIRED</p><strong>Respond to the formal approach</strong><span>Accepting moves the player immediately and updates the squad, transfer record and finances.</span></div><div className="inbox-choice-actions"><button type="button" className="button button-secondary" onClick={() => decideBid("Reject")}>Reject bid</button><button type="button" className="button button-primary" onClick={() => decideBid("Accept")}>Accept bid</button></div></div>}
          {selected.category !== "Press conference" && selected.category !== "Transfer offer" && <div className="inbox-route-card"><span><span className="eyebrow">RELATED CLUB DESK</span><strong>{NAV_ITEMS.find((item) => item.id === selected.route)?.label ?? "Club overview"}</strong></span><button type="button" className="button button-secondary" onClick={() => openRoute(selected)}>Open section <ChevronRight size={15} /></button></div>}
          {feedback && <p className="inbox-feedback" role="status"><Check size={14} /> {feedback}</p>}
        </> : <div className="inbox-empty-reading"><span><Mail size={24} /></span><p className="eyebrow">MANAGER’S OFFICE</p><h2>{feedback ? "Decision recorded" : title}</h2><p>{feedback || "As your season unfolds, important updates will arrive here: opposition analysis, press questions, contract alerts, scouting reports and offers from other clubs."}</p><button type="button" className="button button-secondary" onClick={() => setView("calendar")}>Review calendar <CalendarDays size={14} /></button></div>}
      </article>
    </section>
  </div>;
}

function ManagerPromiseDesk({ career, setCareer }: { career: Career; setCareer: (career: Career) => void }) {
  const club = getClub(career);
  const players = getUserPlayers(career);
  const [playerId, setPlayerId] = useState(players[0]?.id ?? "");
  const promises = career.managerPromises ?? [];
  const activePromises = promises.filter((promise) => promise.status === "Active");
  const table = getTable(career);
  const position = table.findIndex((row) => row.clubId === career.clubId) + 1;
  const hasPromise = (kind: ManagerPromiseKind) => activePromises.some((promise) => promise.kind === kind);
  const atLimit = activePromises.length >= 3;
  const make = (kind: ManagerPromiseKind) => setCareer(makeManagerPromise(career, kind, playerId));
  const detail = (promise: ManagerPromise) => {
    if (promise.kind === "League target") return `Current position ${position} · finish top ${promise.target}`;
    if (promise.kind === "Regular starts") {
      const player = career.players.find((item) => item.id === promise.playerId);
      return `${player?.name ?? "Player"} · ${promise.progress} / ${promise.target} starts · by season end`;
    }
    return `${promise.progress} / ${promise.target} consecutive wins · due by round ${promise.deadlineRound}`;
  };

  return <section className="promise-desk" aria-labelledby="promise-desk-title"><div className="promise-desk-head"><div><p className="eyebrow">ACCOUNTABILITY · BOARD, PLAYERS & SUPPORTERS</p><h2 id="promise-desk-title">Promises to keep</h2><span>Commit to clear targets. The people around the club remember what you say.</span></div><b>{activePromises.length}<small> / 3 ACTIVE</small></b></div><div className="promise-actions"><button type="button" disabled={atLimit || hasPromise("League target") || !getNextFixture(career)} onClick={() => make("League target")}><Shield size={15} /><span><strong>Back the board target</strong><small>Promise a top {club.targetPosition} finish</small></span></button><label className="promise-player-action"><span><Users size={15} /> Promise regular starts</span><select className="compact-select" aria-label="Player promised regular starts" value={playerId} onChange={(event) => setPlayerId(event.target.value)}>{players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select><button type="button" disabled={atLimit || hasPromise("Regular starts") || career.round > getCurrentLeague(career).rounds - 7 || !playerId} onClick={() => make("Regular starts")}>Promise 8 starts</button></label><button type="button" disabled={atLimit || hasPromise("Winning run") || !getNextFixture(career)} onClick={() => make("Winning run")}><Trophy size={15} /><span><strong>Promise a response</strong><small>Win twice in a row for the support</small></span></button></div>{promises.length ? <div className="promise-list">{promises.slice(0, 5).map((promise) => <article key={promise.id} className={`promise-row promise-${promise.status.toLowerCase()}`}><span className="promise-status">{promise.status === "Active" ? <Clock3 size={13} /> : promise.status === "Kept" ? <Check size={13} /> : <X size={13} />}{promise.status}</span><div><strong>{promise.kind === "League target" ? "League finish" : promise.kind === "Regular starts" ? "Regular starts" : "Winning run"}<small> TO {promise.audience.toUpperCase()}</small></strong><span>{detail(promise)}</span></div></article>)}</div> : <div className="promise-empty"><Handshake size={16} /> No active commitments. Make one when you’re ready to be held to it.</div>}</section>;
}

function ClubDNACard({ career }: { career: Career }) {
  const { dna, activeStyle, styleFit, supporterStyleFit, adapting } = getClubDNAStatus(career);
  const facts = [
    ["RECRUITMENT", dna.recruitmentPolicy],
    ["ACADEMY", dna.academyTradition],
    ["SUPPORTERS", dna.supporterIdentity],
    ["FINANCES", dna.spendingPolicy],
    ["BOARD'S IDEAL MANAGER", dna.preferredManager],
  ];
  return <section className="club-dna-panel" aria-labelledby="club-dna-title">
    <div className="club-dna-lead"><div className="club-dna-kicker"><Sparkles size={14} /> CLUB IDENTITY · {dna.identityStrength}% ROOTED</div><h2 id="club-dna-title">Football DNA</h2><p>Tradition shapes the club. Results can earn the room to evolve.</p><div className="club-dna-style"><span>TACTICAL IDENTITY</span><strong>{dna.tacticalIdentity}</strong></div><div className="club-dna-adaptation"><div><span>{adapting ? `${activeStyle} acceptance` : "Playing with the club's grain"}</span><strong>{styleFit}%</strong></div><div className="club-dna-track" role="progressbar" aria-label="Supporter and club acceptance of current tactical style" aria-valuemin={0} aria-valuemax={100} aria-valuenow={styleFit}><i style={{ width: `${styleFit}%` }} /></div><small>{adapting ? "Positive results build acceptance; setbacks slow the change." : "The squad and support recognise this approach."}</small><small>Supporter affinity for this approach · {supporterStyleFit}%</small></div></div>
    <div className="club-dna-facts">{facts.map(([label, value]) => <div className="club-dna-fact" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
  </section>;
}

type NewsroomCategory = "all" | "rumours" | NewsItem["type"];
type NewsroomStory = NewsItem & { league?: string; route: View; score?: string; editorial?: "rumour" };

const NEWSROOM_OUTLETS: Record<NewsItem["type"], string[]> = {
  match: ["Matchday Wire", "The Football Ledger", "Final Whistle"],
  club: ["The Club Journal", "Touchline Review", "The Ground Report"],
  transfer: ["Window Watch", "Touchline Wire", "The Transfer Ledger", "Continental Scout"],
  stadium: ["Ground & City", "The Football Ledger", "The Matchday Review"],
  press: ["The Press Box", "Terrace Voice", "Touchline Review"],
  award: ["World Football Review", "The League Gazette", "The Players' Journal"],
};

function newsroomOutlet(id: string, type: NewsItem["type"]) {
  const index = [...id].reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 7);
  return NEWSROOM_OUTLETS[type][index % NEWSROOM_OUTLETS[type].length];
}

function newsroomReliability(type: NewsItem["type"]) {
  return type === "award" || type === "match" || type === "transfer" || type === "stadium" ? 96 : type === "press" ? 78 : 91;
}

function Newsroom({ career, setView }: { career: Career; setView: (view: View) => void }) {
  const club = getClub(career);
  const [leagueId, setLeagueId] = useState<LeagueId>(club.leagueId as LeagueId);
  const [category, setCategory] = useState<NewsroomCategory>("all");
  const [query, setQuery] = useState("");
  const [expandedStory, setExpandedStory] = useState<string | null>(null);
  const [openedMatchId, setOpenedMatchId] = useState<string | null>(null);
  const openedMatch = openedMatchId ? career.fixtures.find((fixture) => fixture.id === openedMatchId) ?? null : null;
  const availableLeagues = [...ENGLISH_LEAGUES, ...WORLD_LEAGUES.filter((league) => career.clubs.some((entry) => entry.leagueId === league.id))];
  const leagueTables = useMemo(() => availableLeagues.map((league) => ({ league, rows: getTable(career, league.id) })), [career]);
  const selectedLeague = leagueTables.find((entry) => entry.league.id === leagueId) ?? leagueTables[0];
  const playedInDivision = career.fixtures.filter((fixture) => fixture.leagueId === leagueId && fixture.played && fixture.homeGoals !== null && fixture.awayGoals !== null);
  const latestDivisionRound = playedInDivision.reduce((latest, fixture) => Math.max(latest, fixture.round), 0);
  const matchdayFixtures = (latestDivisionRound
    ? playedInDivision.filter((fixture) => fixture.round === latestDivisionRound)
    : career.fixtures.filter((fixture) => fixture.leagueId === leagueId && fixture.round === career.round))
    .sort((first, second) => first.date.localeCompare(second.date));
  const archivedMatches = (career.matchArchive ?? []).slice(-8).reverse();
  const matchdayCaption = latestDivisionRound ? `ROUND ${latestDivisionRound} · FULL TIME` : `ROUND ${career.round} · UPCOMING`;
  const scoreStories: NewsroomStory[] = matchdayFixtures.filter((fixture) => fixture.homeGoals !== null && fixture.awayGoals !== null).slice(0, 8).map((fixture) => {
    const home = getClub(career, fixture.homeClubId);
    const away = getClub(career, fixture.awayClubId);
    const result = `${fixture.homeGoals}–${fixture.awayGoals}`;
    return { id: `world-${fixture.id}`, date: fixture.date, headline: `${home.name} ${result} ${away.name}`, body: `${selectedLeague.league.name} · Round ${fixture.round}. ${home.name} and ${away.name} share the latest chapter of the title race.`, type: "match", league: leagueShortLabel(leagueId), route: "fixtures", score: result, source: "Matchday Live", reliability: 100 };
  });
  const personalStories: NewsroomStory[] = career.news.map((item) => ({
    ...item,
    source: item.source ?? newsroomOutlet(item.id, item.type),
    reliability: item.reliability ?? newsroomReliability(item.type),
    route: item.type === "match" ? "fixtures" : item.type === "transfer" ? "transfers" : item.type === "stadium" ? "stadium" : item.type === "press" ? "overview" : item.type === "award" ? "newsroom" : "clubhouse",
  }));
  const transferRumours: NewsroomStory[] = getTransferRumours(career, leagueId).map((rumour) => ({ ...rumour, league: selectedLeague.league.name, route: "transfers", editorial: "rumour" }));
  const allStories = [...personalStories, ...scoreStories.filter((story) => !matchdayFixtures.some((fixture) => (fixture.homeClubId === career.clubId || fixture.awayClubId === career.clubId) && story.id === `world-${fixture.id}`)), ...transferRumours];
  const filteredStories = allStories.filter((story) => (category === "all" || (category === "rumours" ? story.editorial === "rumour" : story.type === category)) && (!query.trim() || `${story.headline} ${story.body} ${story.league ?? ""} ${story.source ?? ""}`.toLowerCase().includes(query.trim().toLowerCase())));
  const lead: NewsroomStory = scoreStories[0] ?? personalStories[0] ?? { id: "season-start", date: "Pre-season", headline: "A new season is taking shape", body: `${club.name} begin the campaign with a full schedule ahead. Follow results, deals and the stories shaping the English pyramid.`, type: "club", route: "overview" };
  const transfers = personalStories.filter((story) => story.type === "transfer").slice(0, 3);
  const latestAwards = (career.awardHistory ?? []).filter((award) => award.leagueId === leagueId || award.leagueId === "career-world").slice(-4).reverse();
  const leader = selectedLeague.rows[0];
  const runnerUp = selectedLeague.rows[1];
  const pressureSignals = getBoardPressureSignals(career);
  const leagueWatch = leagueTables.map(({ league, rows }) => ({ league, leader: rows[0] }));

  return <><div className="newsroom-page">
    <header className="newsroom-heading"><div><p className="eyebrow">THE CLUB · WORLD DESK</p><h1>Newsroom</h1><p>Every result, rumour and turning point from the world you’re building.</p></div><div className="newsroom-live"><i /> SEASON {career.season} · {getCurrentDate(career).toUpperCase()}<span>LIVE CAREER FEED</span></div></header>

    <div className="news-league-ticker" aria-label="League table leaders">
      <div className="news-ticker-label"><span>THE RACE</span><small>{leagueTables.length} LIVE LEAGUES · {WORLD_COUNTRIES.length} NATIONS</small></div>
      <div className="news-ticker-options">{leagueWatch.map(({ league, leader: divisionLeader }) => <button type="button" key={league.id} className={leagueId === league.id ? "selected" : ""} onClick={() => setLeagueId(league.id)} aria-pressed={leagueId === league.id} title={`${league.name} leader`}><span>{leagueShortLabel(league.id)}</span><strong>{divisionLeader?.club ?? "—"}</strong><small>{divisionLeader?.points ?? 0} PTS</small></button>)}</div>
    </div>

    <div className="newsroom-top-grid">
      <article className={`news-lead type-${lead.type}`}>
        <div className="news-lead-art" aria-hidden="true"><div className="news-art-lines" /><span className="news-art-word">THE<br />CLUB</span><span className="news-art-orbit" /></div>
        <div className="news-lead-copy"><div className="news-lead-kicker"><span>{lead.type === "press" ? "PRESSURE WATCH" : lead.type === "match" ? "MATCHDAY LEAD" : lead.type === "transfer" ? "TRANSFER DESK" : lead.type === "award" ? "SEASON HONOURS" : "THE LEAD STORY"}</span><time>{lead.date}</time></div><h2>{lead.headline}</h2><p>{lead.body}</p><div className="news-lead-footer"><span><ClubCrest club={club} size="small" /> {club.name} · {leagueShortLabel(club.leagueId)}</span><button className="button button-primary" onClick={() => lead.type === "award" ? setCategory("award") : setView(lead.route)}>{lead.type === "match" ? "Open match centre" : lead.type === "transfer" ? "Open recruitment" : lead.type === "stadium" ? "Visit the ground" : lead.type === "award" ? "Explore honours" : "Open club desk"}</button></div></div>
      </article>
      <section className="news-race-card"><div className="news-block-heading"><div><p className="eyebrow">TABLE WATCH</p><h2>{selectedLeague.league.name}</h2></div><Trophy size={18} /></div><p className="news-race-caption">THE PROMOTION AND TITLE PICTURE</p>{selectedLeague.rows.slice(0, 4).map((row, index) => <div className={`news-race-row ${row.clubId === career.clubId ? "your-club" : ""}`} key={row.clubId}><span className="race-position">{String(index + 1).padStart(2, "0")}</span><span className="race-team"><ClubCrest club={getClub(career, row.clubId)} size="small" /><strong>{row.club}</strong></span><span className="race-record">{row.played}P · {row.goalsFor - row.goalsAgainst > 0 ? "+" : ""}{row.goalsFor - row.goalsAgainst}GD</span><b>{row.points}</b></div>)}<div className="race-gap-note">{leader && runnerUp ? `${leader.points - runnerUp.points} point${leader.points - runnerUp.points === 1 ? "" : "s"} separate first and second.` : "The table will take shape after the opening round."}</div><button className="text-button" onClick={() => setView("table")}>Open league table</button></section>
    </div>

    <section className="news-match-centre"><div className="news-match-heading"><div><p className="eyebrow">SCORES & FIXTURES</p><h2>Match centre</h2></div><div><label htmlFor="news-league-select">Competition</label><select id="news-league-select" className="compact-select" value={selectedLeague.league.id} onChange={(event) => setLeagueId(event.target.value as LeagueId)}>{availableLeagues.map((league) => <option value={league.id} key={league.id}>{league.name}</option>)}</select><button className="text-button" onClick={() => setView("fixtures")}>Full fixtures</button></div></div><div className="news-match-status"><span>{matchdayCaption}</span><small>{selectedLeague.league.name} · {matchdayFixtures.length} matches</small></div><div className="news-scores">{matchdayFixtures.slice(0, 6).map((fixture) => { const home = getClub(career, fixture.homeClubId); const away = getClub(career, fixture.awayClubId); return <button type="button" className="news-score-card" key={fixture.id} onClick={() => fixture.played ? setOpenedMatchId(fixture.id) : setView("fixtures")} aria-label={fixture.played ? `Open match report for ${home.name} against ${away.name}` : `View ${home.name} against ${away.name} in fixtures`}><span className="score-club"><ClubCrest club={home} size="small" /><strong>{home.shortName}</strong></span><span className="scoreline">{fixture.played && fixture.homeGoals !== null && fixture.awayGoals !== null ? `${fixture.homeGoals}–${fixture.awayGoals}` : "v"}</span><span className="score-club"><ClubCrest club={away} size="small" /><strong>{away.shortName}</strong></span><small>{fixture.played ? "OPEN MATCH REPORT" : "UP NEXT"}</small></button>; })}{!matchdayFixtures.length && <div className="news-no-matches"><CalendarDays size={18} /><span>No fixtures are scheduled for this division this week.</span></div>}</div>{archivedMatches.length > 0 && <div className="club-match-archive"><div className="club-match-archive-heading"><div><p className="eyebrow">YOUR CLUB · PERMANENT RECORD</p><h3>Recent results</h3></div><span>{career.matchArchive?.length ?? 0} archived matches</span></div><div className="club-match-archive-list">{archivedMatches.map((fixture) => { const home = getClub(career, fixture.homeClubId); const away = getClub(career, fixture.awayClubId); return <button type="button" key={fixture.id} onClick={() => setOpenedMatchId(fixture.id)} aria-label={`Read archived match report, ${home.name} ${fixture.homeGoals} to ${fixture.awayGoals} ${away.name}`}><span>SEASON {fixture.season} · R{fixture.round}</span><strong>{home.shortName}<b>{fixture.homeGoals}–{fixture.awayGoals}</b>{away.shortName}</strong><small>{pageDate(fixture.date)} · OPEN REPORT</small></button>; })}</div></div>}</section>

    <div className="newsroom-lower-grid">
      <section className="news-feed-panel"><div className="news-feed-heading"><div><p className="eyebrow">ACROSS THE PYRAMID</p><h2>Latest stories</h2></div><span>{filteredStories.length} stories</span></div><div className="news-filters" role="group" aria-label="Filter news stories">{([ ["all", "All"], ["match", "Results"], ["transfer", "Transfers"], ["rumours", "Rumours"], ["award", "Awards"], ["club", "Club"], ["press", "Pressure"], ["stadium", "Stadium"] ] as const).map(([value, label]) => <button type="button" key={value} className={category === value ? "active" : ""} onClick={() => setCategory(value)} aria-pressed={category === value}>{label}</button>)}<label className="news-search"><Search size={15} /><input aria-label="Search news" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search headlines" /></label></div><div className="news-story-list">{filteredStories.slice(0, 20).map((story) => <article className={`news-story-row ${story.editorial === "rumour" ? "is-rumour" : ""}`} key={story.id}><span className={`news-story-mark type-${story.editorial === "rumour" ? "rumour" : story.type}`}>{story.editorial === "rumour" ? <Search size={16} /> : story.type === "match" ? <Flag size={16} /> : story.type === "transfer" ? <RefreshCw size={16} /> : story.type === "stadium" ? <Building2 size={16} /> : story.type === "press" ? <Megaphone size={16} /> : story.type === "award" ? <Trophy size={16} /> : <Newspaper size={16} />}</span><div className="news-story-content"><div className="news-story-meta"><span>{story.source ?? newsroomOutlet(story.id, story.type)} · {story.league ?? story.type.toUpperCase()}</span><time>{story.date}</time></div><div className="news-story-verification"><b className={story.editorial === "rumour" ? "unconfirmed" : story.type === "award" ? "honours" : "verified"}>{story.editorial === "rumour" ? "UNCONFIRMED" : story.type === "award" ? "SEASON HONOURS" : "REPORT"}</b><span>{story.reliability ?? newsroomReliability(story.type)}% source confidence</span></div><h3>{story.headline}</h3><p>{expandedStory === story.id ? story.body : story.body.length > 116 ? `${story.body.slice(0, 116).trimEnd()}…` : story.body}</p>{expandedStory === story.id && <button className="news-story-action" onClick={() => story.type === "award" ? setCategory("award") : setView(story.route)}>{story.type === "match" ? "View fixtures" : story.type === "transfer" ? "Open recruitment" : story.type === "stadium" ? "Open stadium architect" : story.type === "club" ? "Open club profile" : story.type === "award" ? "View season honours" : "Review club overview"}</button>}</div><button className="news-read-button" type="button" aria-expanded={expandedStory === story.id} onClick={() => setExpandedStory(expandedStory === story.id ? null : story.id)}>{expandedStory === story.id ? "Close" : "Read story"}</button></article>)}{!filteredStories.length && <div className="news-empty"><Newspaper size={22} /><strong>No stories match this view</strong><span>Try another desk or clear your search.</span><button className="text-button" onClick={() => { setCategory("all"); setQuery(""); }}>Reset filters</button></div>}</div></section>
      <aside className="news-side-desk">
        <section className="news-transfer-desk"><div className="news-block-heading"><div><p className="eyebrow">THE MARKET</p><h2>Transfer desk</h2></div><RefreshCw size={17} /></div>{transfers.length ? transfers.map((story) => <article className="transfer-news-item" key={story.id}><small>{story.date} · DEAL · {story.source}</small><strong>{story.headline}</strong><p>{story.body}</p></article>) : <div className="transfer-desk-empty"><span className="transfer-desk-icon"><RefreshCw size={20} /></span><strong>The market is waiting</strong><p>Completed deals are reported here. Unconfirmed links are kept on a separate desk.</p></div>}<button className="button button-secondary button-wide" onClick={() => setView("transfers")}>Open recruitment hub</button></section>
        <section className="news-rumour-desk"><div className="news-block-heading"><div><p className="eyebrow">UNCONFIRMED · {transferRumours.length} LINKS</p><h2>Transfer whispers</h2></div><Radio size={17} /></div>{transferRumours.length ? transferRumours.map((story) => <article className="rumour-news-item" key={story.id}><div><small>{story.source} · {story.reliability}% source confidence</small><strong>{story.headline}</strong><p>{story.body}</p></div></article>) : <div className="rumour-empty"><strong>No credible links today</strong><p>Rumours appear when contracted first-team players in this division near the end of their deals.</p></div>}<button className="button button-secondary button-wide" onClick={() => { setCategory("rumours"); setQuery(""); }}>Read all rumours</button></section>
        <section className="news-awards-desk"><div className="news-block-heading"><div><p className="eyebrow">THE HONOURS ROLL</p><h2>Season awards</h2></div><Trophy size={17} /></div>{latestAwards.length ? latestAwards.map((award) => <article className="award-news-item" key={award.id}><small>SEASON {award.season} · {award.leagueName.toUpperCase()}</small><strong>{award.award}</strong><span>{award.playerName} · {award.clubName}</span><p>{award.goals} goals · {award.assists} assists · {award.appearances} appearances</p></article>) : <div className="award-empty"><strong>The season is still being written</strong><p>Player, scorer and young-player honours are decided from saved season statistics at the final whistle.</p></div>}<button className="button button-secondary button-wide" onClick={() => { setCategory("award"); setQuery(""); }}>Open award stories</button></section>
        <section className="news-pressure-desk"><div className="news-block-heading"><div><p className="eyebrow">CLUB IN FOCUS</p><h2>The mood around {club.shortName}</h2></div><Activity size={17} /></div><div className="news-pressure-score"><strong>{(career.pressure ?? 18).toFixed(1)}<small>/100</small></strong><span>MANAGER PRESSURE</span></div><div className="news-pressure-meter"><i style={{ width: `${career.pressure ?? 18}%` }} /></div><div className="news-pressure-factors"><span>Form <b>{(career.winlessRun ?? 0)} without a win</b></span><span>Supporters <b>{club.supporterConfidence}% confidence</b></span><span>Players <b>{pressureSignals.averageRapport}% rapport</b></span></div><button className="news-pressure-link" onClick={() => setView("overview")}>Read the latest club briefing</button></section>
      </aside>
    </div>
  </div>{openedMatch && <MatchReportDialog career={career} fixture={openedMatch} onClose={() => setOpenedMatchId(null)} />}</>;
}

function matchFormationPoints(formation: string, attacksRight: boolean) {
  const lanes = formation.split("-").map(Number).filter((count) => Number.isFinite(count) && count > 0);
  const points: { x: number; y: number; role: string }[] = [{ x: attacksRight ? 8 : 92, y: 32, role: "GK" }];
  lanes.forEach((count, laneIndex) => {
    const x = [25, 48, 72, 84][laneIndex] ?? 84;
    for (let index = 0; index < count; index += 1) {
      points.push({ x: attacksRight ? x : 100 - x, y: 8 + (index + 1) * (48 / (count + 1)), role: laneIndex === 0 ? "DEF" : laneIndex === lanes.length - 1 ? "FWD" : "MID" });
    }
  });
  return points;
}

function LiveMatchCenter({ career, setCareer, onFinish }: { career: Career; setCareer: (career: Career) => void; onFinish: () => void }) {
  const live = career.activeMatch!;
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);
  const [feedMode, setFeedMode] = useState<"Commentary" | "Highlights" | "Off">("Commentary");
  const options = getLiveMatchSubstitutionOptions(career);
  const [playerOffId, setPlayerOffId] = useState(options.starting[0]?.id ?? "");
  const [playerOnId, setPlayerOnId] = useState(options.bench[0]?.id ?? "");
  const fixture = career.fixtures.find((candidate) => candidate.id === live.fixtureId);
  const home = fixture ? getClub(career, fixture.homeClubId) : getClub(career);
  const away = fixture ? getClub(career, fixture.awayClubId) : getClub(career);
  const nextSubstitutionMinute = live.minute === 45 ? 60 : live.minute === 60 ? 75 : null;
  const selectedOff = options.starting.some((player) => player.id === playerOffId) ? playerOffId : options.starting[0]?.id ?? "";
  const selectedOn = options.bench.some((player) => player.id === playerOnId) ? playerOnId : options.bench[0]?.id ?? "";
  const selectedEvent = [...live.events].reverse().find((event) => event.type === "goal") ?? null;
  const userIsHome = fixture?.homeClubId === career.clubId;
  const homeFormation = userIsHome ? career.formation : home.aiTactics?.formation ?? "4-2-3-1";
  const awayFormation = userIsHome ? away.aiTactics?.formation ?? "4-2-3-1" : career.formation;
  const homeShape = matchFormationPoints(homeFormation, true);
  const awayShape = matchFormationPoints(awayFormation, false);
  const teamName = (clubId: string | null) => clubId ? getClub(career, clubId).shortName : "THE MATCH";
  const plannedSubs = live.plan.substitutions;
  const directiveEffect = getSecondHalfDirectiveEffects(career, live.plan.secondHalfDirective);
  const feedEvents = [...live.events].reverse().filter((event) => feedMode === "Commentary" || (feedMode === "Highlights" && ["goal", "yellow-card", "red-card", "injury", "substitution", "full-time"].includes(event.type)));
  const liveRatings = getManagedMatchPlayerRatings(career);
  const [sceneSnapshot] = useState(() => {
    if (!fixture || !liveRatings) return null;
    const markersFor = (players: typeof liveRatings.home, shape: ReturnType<typeof matchFormationPoints>, color: string): MatchSceneMarker[] => players.slice(0, 11).map((player, index) => ({ id: player.id, number: index + 1, color, x: ((shape[index]?.x ?? 50) - 50) * 1.04, z: ((shape[index]?.y ?? 32) - 32) * 1.02 }));
    const homeSide = getClub(career, fixture.homeClubId);
    const awaySide = getClub(career, fixture.awayClubId);
    return {
      club: homeSide,
      draft: createStadiumDraft(homeSide.stadium, homeSide.colors[0], homeSide.id),
      markers: [...markersFor(liveRatings.home, homeShape, homeSide.colors[0]), ...markersFor(liveRatings.away, awayShape, awaySide.colors[0])],
    };
  });
  const roundFixtures = fixture ? career.fixtures.filter((item) => item.round === fixture.round && item.leagueId === fixture.leagueId) : [];
  const liveFixtures = fixture ? career.fixtures.map((item) => {
    if (item.id === fixture.id) return { ...item, played: true, homeGoals: live.homeGoals, awayGoals: live.awayGoals };
    const result = live.otherFixtureResults?.find((entry) => entry.fixtureId === item.id);
    return result ? { ...item, played: true, homeGoals: result.homeGoals, awayGoals: result.awayGoals } : item;
  }) : career.fixtures;
  const liveTable = getTable({ ...career, fixtures: liveFixtures }, home.leagueId);
  const managerPosition = Math.max(0, liveTable.findIndex((row) => row.clubId === career.clubId));
  const tableStart = Math.max(0, Math.min(liveTable.length - 5, managerPosition - 2));
  const compactTable = liveTable.slice(tableStart, tableStart + 5);
  useEffect(() => {
    if (!playing || !career.activeMatch || live.minute >= 90) return;
    const timer = window.setTimeout(() => {
      const next = advanceManagedMatch(career);
      setCareer(next);
      if ((next.activeMatch?.minute ?? 90) === 45 || (next.activeMatch?.minute ?? 90) >= 90) setPlaying(false);
    }, 4000 / speed);
    return () => window.clearTimeout(timer);
  }, [career, live.minute, playing, setCareer, speed]);
  const addSubstitution = () => {
    if (!nextSubstitutionMinute || !selectedOff || !selectedOn) return;
    setCareer(addManagedMatchSubstitution(career, nextSubstitutionMinute, selectedOff, selectedOn));
  };

  if (!fixture || !sceneSnapshot) return null;

  return <div className="modal-backdrop live-match-backdrop"><section className="live-match-dialog" role="dialog" aria-modal="true" aria-labelledby="live-match-title">
    <header className="live-match-header"><div><p className="eyebrow">THE CLUB · LIVE MATCH CENTRE</p><h2 id="live-match-title">{fixture.round} · {home.shortName} v {away.shortName}</h2></div><div className="live-match-phase"><span className={live.minute === 90 ? "live-match-live-dot is-full-time" : "live-match-live-dot"} />{live.minute === 90 ? "FULL TIME" : live.minute === 45 ? "HALF TIME" : "LIVE"}</div></header>
    <div className="live-match-score"><div><ClubCrest club={home} size="large" /><strong>{home.name}</strong><small>HOME</small></div><div className="live-score-number"><span>{live.minute === 45 ? "HT" : `${live.minute}′`}</span><strong>{live.homeGoals}<i>–</i>{live.awayGoals}</strong><small>{pageDate(fixture.date)}</small></div><div><ClubCrest club={away} size="large" /><strong>{away.name}</strong><small>AWAY</small></div></div>
    <div className="live-match-progress" aria-label={`Match time ${live.minute} of 90 minutes`}><span style={{ width: `${live.minute / 90 * 100}%` }} /></div>
    <div className="live-match-content"><section className="live-match-pitch-panel"><div className="live-match-pitch-caption"><div><p className="eyebrow">TACTICAL CAMERA · {home.stadium.name}</p><strong>{homeFormation} v {awayFormation} · {career.mentality}</strong></div><span>{selectedEvent ? `${selectedEvent.minute}′ ${selectedEvent.description}` : "Players are moving into their shape"}</span></div><div className="live-match-stadium"><MatchStadiumScene club={sceneSnapshot.club} draft={sceneSnapshot.draft} selectedStand={null} onSelectStand={() => undefined} placementFacility={null} onPlaceFacility={() => undefined} mode="match" matchMinute={live.minute} matchPlayers={sceneSnapshot.markers} /></div><div className="live-match-shape-heading"><strong>Match shape</strong><span>Moving players · home side attacks right</span></div><svg className="live-match-pitch" viewBox="0 0 100 64" role="img" aria-label={`Live football pitch. ${home.shortName} ${live.homeGoals}, ${away.shortName} ${live.awayGoals}.`}>
      <defs><pattern id="live-pitch-stripes" width="20" height="64" patternUnits="userSpaceOnUse"><rect width="10" height="64" fill="#b9d79a" opacity=".22" /></pattern></defs><rect width="100" height="64" rx="2" fill="#337449" /><rect width="100" height="64" rx="2" fill="url(#live-pitch-stripes)" /><g fill="none" stroke="#edf5e8" strokeOpacity=".83" strokeWidth=".48"><rect x="1.5" y="1.5" width="97" height="61" rx="1" /><path d="M50 1.5v61" /><circle cx="50" cy="32" r="8.7" /><circle cx="50" cy="32" r=".55" fill="#edf5e8" /><rect x="1.5" y="13" width="15.7" height="38" /><rect x="1.5" y="23.4" width="5.2" height="17.2" /><rect x="82.8" y="13" width="15.7" height="38" /><rect x="93.3" y="23.4" width="5.2" height="17.2" /></g><g>{homeShape.map((point, index) => <circle key={`home-${index}`} cx={point.x} cy={point.y} r="1.05" fill="#d7ee7c" stroke="#203529" strokeWidth=".35" />)}{awayShape.map((point, index) => <circle key={`away-${index}`} cx={point.x} cy={point.y} r="1.05" fill="#e7eee7" stroke="#203529" strokeWidth=".35" />)}</g>{live.events.filter((event) => event.x !== undefined && event.y !== undefined && (event.type === "goal" || event.type === "yellow-card" || event.type === "red-card")).map((event) => <g key={event.id} transform={`translate(${event.x} ${(event.y ?? 50) * .64})`}><circle r="2.1" fill={event.type === "goal" ? "#efff9c" : event.type === "red-card" ? "#ee6558" : "#ffcf57"} stroke="#1c2920" strokeWidth=".6" /><text y=".8" textAnchor="middle" fontSize="2.3" fontWeight="bold" fill="#1c2920">{event.type === "goal" ? "G" : event.type === "red-card" ? "R" : "Y"}</text></g>)}</svg><div className="live-match-statstrip"><span><small>SHOTS</small><strong>{live.stats.home.shots} – {live.stats.away.shots}</strong></span><span><small>ON TARGET</small><strong>{live.stats.home.shotsOnTarget} – {live.stats.away.shotsOnTarget}</strong></span><span><small>POSSESSION</small><strong>{live.stats.home.possession}% – {live.stats.away.possession}%</strong></span><span><small>EXPECTED GOALS</small><strong>{live.stats.home.expectedGoals.toFixed(1)} – {live.stats.away.expectedGoals.toFixed(1)}</strong></span></div></section>
      <aside className="live-match-sidebar"><section className="live-match-roundup"><div className="live-match-side-heading"><div><p className="eyebrow">AROUND THE LEAGUE</p><h3>Round {fixture.round}</h3></div><Activity size={15} /></div><div className="live-match-scoreticker">{roundFixtures.filter((item) => item.id !== fixture.id).slice(0, 6).map((item) => { const match = career.fixtures.find((candidate) => candidate.id === item.id)!; const result = live.otherFixtureResults?.find((entry) => entry.fixtureId === match.id); const homeClub = getClub(career, match.homeClubId); const awayClub = getClub(career, match.awayClubId); return <div className="live-match-scoreticker-row" key={match.id}><span>{homeClub.shortName}</span><b>{result ? `${result.homeGoals} – ${result.awayGoals}` : "v"}</b><span>{awayClub.shortName}</span></div>; })}</div><div className="live-match-table-head"><strong>LIVE TABLE</strong><span>POS · PTS · GD</span></div><div className="live-match-mini-table">{compactTable.map((row, index) => <div className={row.clubId === career.clubId ? "is-user" : ""} key={row.clubId}><span>{tableStart + index + 1}</span><strong>{row.club.replace(/ FC$| AFC$/i, "")}</strong><small>{row.points}</small><small>{row.goalsFor - row.goalsAgainst > 0 ? "+" : ""}{row.goalsFor - row.goalsAgainst}</small></div>)}</div><small className="live-match-table-note">Provisional standings include the live score.</small></section><section className="live-match-ratings"><div className="live-match-side-heading"><div><p className="eyebrow">PLAYER RATINGS</p><h3>On the pitch</h3></div><Star size={15} /></div><div className="live-match-rating-columns">{([{ club: home, players: liveRatings?.home ?? [] }, { club: away, players: liveRatings?.away ?? [] }] as const).map(({ club, players }) => <div key={club.id}><span>{club.shortName}</span>{[...players].sort((first, second) => second.rating - first.rating).slice(0, 4).map((player) => <div className="live-match-rating-row" key={player.id}><b>{player.rating.toFixed(1)}</b><span>{player.name}</span><small>{player.position}</small></div>)}</div>)}</div></section><section className="live-match-timeline"><div className="live-match-side-heading"><div><p className="eyebrow">MATCH EVENTS</p><h3>As it happens</h3></div><label className="live-feed-control"><span>FEED</span><select aria-label="Live match commentary display" value={feedMode} onChange={(event) => setFeedMode(event.target.value as typeof feedMode)}><option>Commentary</option><option>Highlights</option><option>Off</option></select></label></div>{feedMode !== "Off" && feedEvents.length ? <ol>{feedEvents.map((event) => <li key={event.id}><time>{event.minute}′</time><span className={`live-event-mark event-${event.type}`}>{event.type === "goal" ? "G" : event.type === "yellow-card" ? "Y" : event.type === "red-card" ? "R" : event.type === "substitution" ? "↔" : event.type === "injury" ? "!" : event.type === "half-time" ? "HT" : event.type === "full-time" ? "FT" : "T"}</span><div><strong>{event.description}</strong><small>{teamName(event.clubId)}</small></div></li>)}</ol> : <div className="live-timeline-empty">{feedMode === "Off" ? "Commentary and highlights are hidden." : feedMode === "Highlights" ? "No match highlights yet." : "The opening whistle has gone. Match events will appear here."}</div>}</section>
        {live.minute === 45 && <section className="live-match-control-card"><p className="eyebrow">HALF-TIME TEAM TALK</p><label>Second-half approach<select value={live.plan.secondHalfDirective} onChange={(event) => setCareer(setManagedMatchDirective(career, event.target.value as MatchdayManagementPlan["secondHalfDirective"]))}><option>Balanced</option><option>Raise the press</option><option>Protect the lead</option><option>Overload the wings</option><option>Keep possession</option></select></label><small>Attacking edge {directiveEffect.attack > 0 ? "+" : ""}{directiveEffect.attack.toFixed(1)} · defensive edge {directiveEffect.defence > 0 ? "+" : ""}{directiveEffect.defence.toFixed(1)}. The instruction changes second-half chances and exposure.</small></section>}
        {nextSubstitutionMinute && live.minute >= 45 && <section className="live-match-control-card"><p className="eyebrow">MAKE A CHANGE · {nextSubstitutionMinute}′ WINDOW</p>{options.starting.length && options.bench.length ? <><label>Take off<select value={selectedOff} onChange={(event) => setPlayerOffId(event.target.value)}>{options.starting.map((player) => <option key={player.id} value={player.id}>{player.name} · {player.position}</option>)}</select></label><label>Bring on<select value={selectedOn} onChange={(event) => setPlayerOnId(event.target.value)}>{options.bench.map((player) => <option key={player.id} value={player.id}>{player.name} · {player.position}</option>)}</select></label><button className="button button-secondary button-wide" type="button" onClick={addSubstitution}><RefreshCw size={14} /> Queue substitution</button></> : <p>No eligible like-for-like changes remain.</p>}<small>Changes: {plannedSubs.length}/5 · queued changes show in the match plan.</small></section>}
      </aside></div>
    <footer className="live-match-footer"><div><span>YOUR NEXT CHANGE</span><strong>{plannedSubs.length ? plannedSubs.map((sub) => `${sub.minute}′`).join(" · ") : "No changes queued"}</strong></div>{live.minute < 90 ? <><div className="live-match-pace"><span>PACE</span>{([1, 2, 4] as const).map((value) => <button type="button" key={value} aria-pressed={speed === value} className={speed === value ? "selected" : ""} onClick={() => setSpeed(value)}>{value}×</button>)}</div><div className="live-match-footer-actions"><button type="button" className="button button-secondary" onClick={() => setPlaying((current) => !current)}><Play size={14} fill="currentColor" />{playing ? "Pause" : live.minute === 45 ? "Resume second half" : "Resume"}</button><button type="button" className="button button-primary" disabled={playing} onClick={() => { setPlaying(false); setCareer(advanceManagedMatch(career)); }}><Clock3 size={14} />{live.minute === 45 ? "Step into second half" : `Step to ${Math.min(90, live.minute + 15)}′`}</button></div></> : <button className="button button-primary" type="button" onClick={onFinish}><Check size={16} />Finish match</button>}</footer>
  </section></div>;
}

function MatchReportDialog({ career, fixture, onClose }: { career: Career; fixture: Fixture; onClose: () => void }) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  const home = getClub(career, fixture.homeClubId);
  const away = getClub(career, fixture.awayClubId);
  const league = [...ENGLISH_LEAGUES, ...WORLD_LEAGUES].find((entry) => entry.id === fixture.leagueId);
  const stats = fixture.stats;
  const events = fixture.events ?? [];
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? events.find((event) => event.type === "goal") ?? events[0] ?? null;
  const homePositions = matchFormationPoints(career.formation, true);
  const awayPositions = matchFormationPoints("4-4-2", false);
  const homeScore = fixture.homeGoals ?? 0;
  const awayScore = fixture.awayGoals ?? 0;
  const statRows: { label: string; home: string; away: string; homeWidth: number; awayWidth: number }[] = stats ? [
    { label: "Expected goals", home: stats.home.expectedGoals.toFixed(1), away: stats.away.expectedGoals.toFixed(1), homeWidth: Math.min(100, stats.home.expectedGoals * 32), awayWidth: Math.min(100, stats.away.expectedGoals * 32) },
    { label: "Possession", home: `${stats.home.possession}%`, away: `${stats.away.possession}%`, homeWidth: stats.home.possession, awayWidth: stats.away.possession },
    { label: "Shots on target", home: String(stats.home.shotsOnTarget), away: String(stats.away.shotsOnTarget), homeWidth: stats.home.shots ? stats.home.shotsOnTarget / stats.home.shots * 100 : 0, awayWidth: stats.away.shots ? stats.away.shotsOnTarget / stats.away.shots * 100 : 0 },
    { label: "Total shots", home: String(stats.home.shots), away: String(stats.away.shots), homeWidth: Math.min(100, stats.home.shots * 6), awayWidth: Math.min(100, stats.away.shots * 6) },
    { label: "Corners", home: String(stats.home.corners), away: String(stats.away.corners), homeWidth: Math.min(100, stats.home.corners * 10), awayWidth: Math.min(100, stats.away.corners * 10) },
  ] : [];
  const eventClub = (event: MatchEvent) => event.clubId ? getClub(career, event.clubId) : null;

  return <div className="modal-backdrop match-report-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal-card match-report-dialog" role="dialog" aria-modal="true" aria-labelledby="match-report-title"><button className="modal-close" type="button" aria-label="Close match report" onClick={onClose}><X size={18} /></button>
    <div className="match-report-kicker"><span>THE CLUB · MATCH CENTRE</span><span>{league?.name ?? "LEAGUE MATCH"} · ROUND {fixture.round}</span></div>
    <div className="match-report-scoreboard"><div className="match-report-side"><ClubCrest club={home} size="large" /><strong>{home.name}</strong><small>HOME</small></div><div className="match-report-result"><span>FULL TIME</span><h2 id="match-report-title">{homeScore}<i>–</i>{awayScore}</h2><time>{pageDate(fixture.date)}</time></div><div className="match-report-side"><ClubCrest club={away} size="large" /><strong>{away.name}</strong><small>AWAY</small></div></div>
    <section className="match-report-pitch-panel" aria-label="Match event pitch map"><div className="match-report-section-head"><div><p className="eyebrow">TACTICAL VIEW · {career.formation}</p><h3>{selectedEvent ? `${selectedEvent.minute}′ · ${selectedEvent.type.replace("-", " ")}` : "Match map"}</h3></div><span>{selectedEvent ? selectedEvent.description : "No event selected"}</span></div><svg className="match-report-pitch" viewBox="0 0 100 64" role="img" aria-label={`Football pitch showing ${selectedEvent?.description ?? "the formations"}`}>
      <defs><pattern id="match-pitch-stripes" width="20" height="64" patternUnits="userSpaceOnUse"><rect width="10" height="64" fill="#8cae68" opacity=".28" /></pattern><filter id="match-event-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="1.3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
      <rect x="0" y="0" width="100" height="64" rx="2" fill="#346b45" /><rect x="0" y="0" width="100" height="64" rx="2" fill="url(#match-pitch-stripes)" />
      <g className="match-pitch-lines" fill="none" stroke="#e4efdc" strokeOpacity=".83" strokeWidth=".48"><rect x="1.5" y="1.5" width="97" height="61" rx="1" /><path d="M50 1.5v61" /><circle cx="50" cy="32" r="8.7" /><circle cx="50" cy="32" r=".55" fill="#e4efdc" /><rect x="1.5" y="13" width="15.7" height="38" /><rect x="1.5" y="23.4" width="5.2" height="17.2" /><path d="M17.2 27.5a5 5 0 0 1 0 9" /><rect x="82.8" y="13" width="15.7" height="38" /><rect x="93.3" y="23.4" width="5.2" height="17.2" /><path d="M82.8 27.5a5 5 0 0 0 0 9" /><circle cx="11" cy="32" r=".55" fill="#e4efdc" /><circle cx="89" cy="32" r=".55" fill="#e4efdc" /></g>
      <g className="match-pitch-players" aria-hidden="true">{homePositions.map((point, index) => <circle key={`home-${index}`} cx={point.x} cy={point.y} r="1.25" className="match-pitch-player match-pitch-player-home" />)}{awayPositions.map((point, index) => <circle key={`away-${index}`} cx={point.x} cy={point.y} r="1.25" className="match-pitch-player match-pitch-player-away" />)}</g>
      {events.filter((event) => typeof event.x === "number" && typeof event.y === "number").map((event) => <circle key={event.id} cx={event.x} cy={(event.y ?? 50) * .64} r={event.id === selectedEvent?.id ? "1.8" : "1.05"} className={`match-pitch-event ${event.type === "goal" ? "match-pitch-event-goal" : event.type === "yellow-card" ? "match-pitch-event-card" : event.type === "red-card" ? "match-pitch-event-dismissal" : event.type === "injury" ? "match-pitch-event-injury" : "match-pitch-event-change"} ${event.id === selectedEvent?.id ? "is-selected" : ""}`} />)}
      {selectedEvent && <g className="match-pitch-active-event" filter="url(#match-event-glow)"><circle cx={selectedEvent.x ?? 50} cy={(selectedEvent.y ?? 50) * .64} r="3.1" /><text x={selectedEvent.x ?? 50} y={(selectedEvent.y ?? 50) * .64 + .8} textAnchor="middle">{selectedEvent.type === "goal" ? "G" : selectedEvent.type === "yellow-card" ? "Y" : selectedEvent.type === "red-card" ? "R" : selectedEvent.type === "substitution" ? "↔" : selectedEvent.type === "tactical-change" ? "T" : "•"}</text></g>}
    </svg><div className="match-pitch-legend"><span><i className="match-pitch-home-swatch" />{home.shortName}</span><span><i className="match-pitch-away-swatch" />{away.shortName}</span><span><i className="match-pitch-event-swatch" />Selected moment</span></div></section>
    <div className="match-report-columns"><section className="match-report-timeline"><div className="match-report-section-head"><div><p className="eyebrow">THE STORY OF THE GAME</p><h3>Key moments</h3></div><span>{events.filter((event) => event.type === "goal").length} goals</span></div>{events.length ? <ol>{events.map((event) => { const team = eventClub(event); return <li key={event.id} className={`match-event event-${event.type}`}><button type="button" className="match-event-button" aria-pressed={selectedEvent?.id === event.id} onClick={() => setSelectedEventId(event.id)}><time>{event.minute === 45 || event.minute === 90 ? event.minute : `${event.minute}′`}</time><span className="match-event-marker">{event.type === "goal" ? "●" : event.type === "yellow-card" ? "▰" : event.type === "red-card" ? "R" : event.type === "substitution" ? "↔" : event.type === "tactical-change" ? "T" : event.type === "injury" ? "!" : event.type === "half-time" ? "Ⅱ" : "FT"}</span><span className="match-event-detail"><strong>{event.description}</strong>{team && <small><ClubCrest club={team} size="small" />{team.shortName}{event.assistPlayerName ? ` · Assist: ${event.assistPlayerName}` : ""}</small>}</span></button></li>; })}</ol> : <div className="match-report-legacy"><Newspaper size={18} /><span>Detailed match events were not stored for this older result. New results include a full timeline and match statistics.</span></div>}</section>
      <section className="match-report-statistics"><div className="match-report-section-head"><div><p className="eyebrow">MATCH DATA</p><h3>By the numbers</h3></div><BarChart3 size={17} /></div>{statRows.length ? <><div className="match-stat-team-head"><span>{home.shortName}</span><span>HOME</span><span>AWAY</span><span>{away.shortName}</span></div>{statRows.map((row) => <div className="match-stat-row" key={row.label}><strong>{row.home}</strong><div><span>{row.label}</span><div className="match-stat-bars"><i style={{ width: `${row.homeWidth}%` }} /><i style={{ width: `${row.awayWidth}%` }} /></div></div><strong>{row.away}</strong></div>)}<div className="match-report-key"><span><i /> {home.shortName}</span><span><i /> {away.shortName}</span></div></> : <div className="match-report-legacy">This save predates detailed match statistics.</div>}</section></div>
    <div className="match-report-footer"><span><ClubCrest club={home} size="small" /> {home.city} <i>·</i> {away.city}</span><button className="button button-secondary" type="button" onClick={onClose}>Back to match centre</button></div>
  </section></div>;
}

function ClubArchivePage({ career, onPlayerProfile }: { career: Career; onPlayerProfile: (playerId: string) => void }) {
  const archive = getClubArchive(career);
  const club = archive.club;
  const recordSeasonLabel = (season: number) => `${2026 + season - 1}/${String(2027 + season - 1).slice(-2)}`;
  const seasonBest = [...archive.seasons].sort((first, second) => first.position - second.position || second.season - first.season)[0];
  const recentTransfers = archive.transfers.slice(0, 8);
  return <>
    <SectionHeading kicker="HISTORY · RECORDS · HONOURS" title={`${club.name} archive`} detail={`${club.city}, ${club.country} · founded ${club.foundedYear ?? "—"}. A living record of seasons, players, honours and transfer business in this career.`} action={<span className="clubhouse-city"><Archive size={16} /> SAVED CAREER RECORDS</span>} />
    <section className="panel club-archive-identity"><ClubCrest club={club} size="large" /><div><p className="eyebrow">THE STORY SO FAR</p><h2>{club.name} <span>{club.nickname}</span></h2><p>{club.bio}</p></div><div className="archive-identity-tag"><small>CLUB COLOURS</small><span><i style={{ background: club.colors[0] }} /><i style={{ background: club.colors[1] }} /></span></div></section>
    <div className="archive-stat-grid"><Metric icon={CalendarDays} label="Seasons on record" value={String(archive.seasons.length)} foot="League finishes recorded in this save" /><Metric icon={Trophy} label="League titles logged" value={String(archive.leagueTitlesLogged)} foot="First-place finishes in this save" accent /><Metric icon={Users} label="Appearances on record" value={archive.trackedAppearances.toLocaleString("en-GB")} foot="Across recorded club spells" /><Metric icon={Activity} label="Goals on record" value={archive.trackedGoals.toLocaleString("en-GB")} foot={seasonBest ? `Best finish · ${getPos(seasonBest.position)} in ${recordSeasonLabel(seasonBest.season)}` : "Scoring history grows as matches are played"} /></div>
    <div className="archive-content-grid">
      <section className="panel archive-panel"><div className="archive-panel-heading"><div><p className="eyebrow">THE RECORD BOOK</p><h2>Players who shaped the club</h2></div><span>CAREER TOTALS</span></div><div className="archive-record-grid">
        <ArchiveRecordList title="Appearances" metric="appearances" suffix="apps" leaders={archive.appearanceLeaders} onPlayerProfile={onPlayerProfile} />
        <ArchiveRecordList title="Goals" metric="goals" suffix="goals" leaders={archive.goalLeaders} onPlayerProfile={onPlayerProfile} />
        <ArchiveRecordList title="Assists" metric="assists" suffix="assists" leaders={archive.assistLeaders} onPlayerProfile={onPlayerProfile} />
        <ArchiveRecordList title="Clean sheets" metric="cleanSheets" suffix="clean sheets" leaders={archive.cleanSheetLeaders} onPlayerProfile={onPlayerProfile} />
      </div><p className="archive-data-note">Figures are summed from each player's recorded spell at {club.name}; older careers keep their data when a player leaves.</p></section>
      <section className="panel archive-panel"><div className="archive-panel-heading"><div><p className="eyebrow">SEASON BY SEASON</p><h2>League ledger</h2></div><span>{archive.seasons.length} RECORDS</span></div>{archive.seasons.length ? <div className="data-table-wrap"><table className="data-table archive-season-table"><thead><tr><th>Season</th><th>Division</th><th>Pos</th><th>W–D–L</th><th>Pts</th><th>GF–GA</th></tr></thead><tbody>{archive.seasons.map((record) => <tr key={`${record.clubId ?? record.club}-${record.season}`}><td>{recordSeasonLabel(record.season)}</td><td>{record.leagueName ?? "Earlier season"}</td><td><strong className={record.position === 1 ? "archive-champion" : ""}>{getPos(record.position)}</strong></td><td>{record.wins}–{record.draws ?? "—"}–{record.losses ?? "—"}</td><td><b>{record.points}</b></td><td>{record.goalsFor ?? "—"}–{record.goalsAgainst ?? "—"}</td></tr>)}</tbody></table></div> : <div className="archive-empty"><CalendarDays size={18} /><span>League finishes will be added here when a season ends.</span></div>}</section>
    </div>
    <div className="archive-content-grid archive-content-secondary">
      <section className="panel archive-panel"><div className="archive-panel-heading"><div><p className="eyebrow">ON THE HONOURS ROLL</p><h2>Player awards</h2></div><Trophy size={17} /></div>{archive.honours.length ? <div className="archive-award-list">{archive.honours.slice(0, 8).map((award) => <article key={award.id}><span>{recordSeasonLabel(award.season)}</span><div><strong>{award.award}</strong><small>{award.playerName} · {award.leagueName}</small></div><b>{award.goals}G · {award.assists}A</b></article>)}</div> : <div className="archive-empty"><Trophy size={18} /><span>Individual honours won by club players will be kept here.</span></div>}</section>
      <section className="panel archive-panel"><div className="archive-panel-heading"><div><p className="eyebrow">TRANSFER LEDGER</p><h2>Record business</h2></div><RefreshCw size={16} /></div><div className="archive-record-transfer-pair"><div><small>RECORD SIGNING</small>{archive.recordSigning ? <><strong>{archive.recordSigning.playerName}</strong><span>{archive.recordSigning.fromClubName} · {recordSeasonLabel(archive.recordSigning.season)}</span><b>{MONEY(archive.recordSigning.fee)}</b></> : <span>No fee-paying signings recorded.</span>}</div><div><small>RECORD SALE</small>{archive.recordSale ? <><strong>{archive.recordSale.playerName}</strong><span>to {archive.recordSale.toClubName} · {recordSeasonLabel(archive.recordSale.season)}</span><b>{MONEY(archive.recordSale.fee)}</b></> : <span>No fee-paying sales recorded.</span>}</div></div>{recentTransfers.length > 0 && <div className="archive-transfer-list">{recentTransfers.map((transfer) => <article key={transfer.id}><span>{recordSeasonLabel(transfer.season)}</span><div><strong>{transfer.playerName}</strong><small>{transfer.fromClubName} <i>→</i> {transfer.toClubName}</small></div><b>{transfer.fee ? MONEY(transfer.fee) : "Free"}</b></article>)}</div>}</section>
    </div>
    <section className="panel archive-panel archive-milestones"><div className="archive-panel-heading"><div><p className="eyebrow">FROM THE CLUB CHRONICLE</p><h2>Milestones & turning points</h2></div><span>{archive.moments.length} ENTRIES</span></div>{archive.moments.length ? <div className="archive-timeline">{archive.moments.slice(-10).reverse().map((moment) => <article key={`${moment.year}-${moment.title}`}><strong>{moment.year}</strong><div><h3>{moment.title}</h3><p>{moment.detail}</p></div></article>)}</div> : <div className="archive-empty"><Archive size={18} /><span>Club milestones will be recorded as your story unfolds.</span></div>}</section>
  </>;
}

function ArchiveRecordList({ title, metric, suffix, leaders, onPlayerProfile }: { title: string; metric: "appearances" | "goals" | "assists" | "cleanSheets"; suffix: string; leaders: ClubArchiveLeader[]; onPlayerProfile: (playerId: string) => void }) {
  return <section className="archive-record-list"><h3>{title}</h3>{leaders.length ? leaders.slice(0, 5).map((leader, index) => <div className="archive-record-row" key={leader.playerId}><span>{String(index + 1).padStart(2, "0")}</span><button type="button" onClick={() => onPlayerProfile(leader.playerId)} title={`Open ${leader.playerName}'s player profile`}>{leader.playerName}</button><strong>{leader[metric].toLocaleString("en-GB")}<small>{suffix}</small></strong></div>) : <p className="archive-record-empty">No figures recorded yet.</p>}</section>;
}

function ClubHeritageCard({ club, career }: { club: Club; career: Career }) {
  const rivals = (club.rivals ?? []).map((id) => career.clubs.find((candidate) => candidate.id === id)).filter((rival): rival is Club => Boolean(rival));
  const moments = club.history?.slice(-3).reverse() ?? [];
  return <section className="panel club-heritage-panel">
    <div className="heritage-heading"><div><p className="eyebrow">ROOTED IN {club.region.toUpperCase()}</p><h2>{club.name} <span>{club.nickname}</span></h2></div><div className="heritage-heading-actions"><button type="button" className="button button-secondary" onClick={() => document.dispatchEvent(new CustomEvent("the-club-view", { detail: "archive" }))}><Archive size={14} /> Open club archive</button><ClubCrest club={club} size="large" /></div></div>
    <div className="heritage-summary"><div className="heritage-foundation"><span>EST.</span><strong>{club.foundedYear}</strong><small>{club.city} · {club.country}</small></div><p>{club.bio}</p></div>
    <div className="heritage-columns"><div><small className="eyebrow">MILESTONES</small><div className="heritage-timeline">{moments.map((moment) => <article key={moment.year + moment.title}><span>{moment.year}</span><div><strong>{moment.title}</strong><p>{moment.detail}</p></div></article>)}</div></div><div className="heritage-links"><small className="eyebrow">LOCAL CONNECTIONS</small><strong>Nearby rivalry</strong>{rivals.length ? rivals.map((rival) => <span className="heritage-rival" key={rival.id}>{rival.name}<small>{rival.city} · {rival.region}</small></span>) : <span className="heritage-rival">The county derby circuit<small>{club.region} · England</small></span>}<strong>Current shirt partner</strong><span className="heritage-sponsor"><Handshake size={15} />{club.sponsor}<small>Based in {club.city} · {MONEY(club.sponsorAnnual)} / year</small></span></div></div>
  </section>;
}

function TargetIcon() { return <Flag size={16} />; }

function SquadTacticsArea({ career, setCareer, onPlayerProfile, view, setView, isMatchday, onInstantResult, onLiveMatch }: {
  career: Career;
  setCareer: (career: Career) => void;
  onPlayerProfile: (playerId: string) => void;
  view: "squad" | "tactics";
  setView: (view: View) => void;
  isMatchday: boolean;
  onInstantResult: () => void;
  onLiveMatch: () => void;
}) {
  const selectedCount = career.lineup.length;
  return <>
    <SectionHeading kicker="FIRST TEAM · MATCH PREPARATION" title="Squad & tactics" detail="Choose your XI, assign roles and shape how the team plays from one place." action={<span className={`team-xi-status ${selectedCount === 11 ? "complete" : "incomplete"}`}><Users size={15} /> {selectedCount} / 11 selected</span>} />
    {view === "tactics" && isMatchday && <MatchdayDecisionPanel career={career} onInstantResult={onInstantResult} onLiveMatch={onLiveMatch} onSquad={() => setView("squad")} />}
    <div className="team-area-tabs" role="tablist" aria-label="First team workspace">
      <button type="button" role="tab" id="team-squad-tab" aria-selected={view === "squad"} aria-controls="team-squad-panel" className={view === "squad" ? "active" : ""} onClick={() => setView("squad")}><Users size={15} /><span>Squad</span><small>{getUserPlayers(career).length} players</small></button>
      <button type="button" role="tab" id="team-tactics-tab" aria-selected={view === "tactics"} aria-controls="team-tactics-panel" className={view === "tactics" ? "active" : ""} onClick={() => setView("tactics")}><Activity size={15} /><span>Tactics board</span><small>{career.formation}</small></button>
    </div>
    {view === "squad"
      ? <div className="team-tab-panel" id="team-squad-panel" role="tabpanel" aria-labelledby="team-squad-tab"><Squad career={career} setCareer={setCareer} onPlayerProfile={onPlayerProfile} /></div>
      : <div className="team-tab-panel" id="team-tactics-panel" role="tabpanel" aria-labelledby="team-tactics-tab"><Tactics career={career} setCareer={setCareer} isMatchday={isMatchday} /></div>}
  </>;
}

function MatchdayDecisionPanel({ career, onInstantResult, onLiveMatch, onSquad }: { career: Career; onInstantResult: () => void; onLiveMatch: () => void; onSquad: () => void }) {
  const fixture = getNextFixture(career);
  if (!fixture) return null;
  const home = getClub(career, fixture.homeClubId);
  const away = getClub(career, fixture.awayClubId);
  const opponent = fixture.homeClubId === career.clubId ? away : home;
  const healthySelected = career.lineup.map((id) => career.players.find((player) => player.id === id)).filter((player): player is Player => Boolean(player && player.clubId === career.clubId && player.age >= 16 && (player.injuryWeeksRemaining ?? 0) === 0 && (player.suspensionMatchesRemaining ?? 0) === 0));
  const ready = healthySelected.length === 11;
  return <section className="matchday-decision-panel" aria-labelledby="matchday-decision-title">
    <div className="matchday-decision-match"><span className="matchday-decision-kicker"><Flag size={13} /> MATCHDAY · ROUND {fixture.round}</span><div className="matchday-decision-teams"><div><ClubCrest club={home} size="normal" /><strong>{home.shortName}</strong></div><b>v</b><div><ClubCrest club={away} size="normal" /><strong>{away.shortName}</strong></div></div><span className="matchday-decision-venue">{home.stadium.name} · {pageDate(fixture.date)} · {fixture.homeClubId === career.clubId ? "HOME" : "AWAY"}</span></div>
    <div className="matchday-decision-actions"><div><p className="eyebrow">YOUR CALL</p><h2 id="matchday-decision-title">Choose how to play</h2><p>{ready ? `Your selected XI is ready. Review the shape, roles and team talk, then choose a match experience.` : `${healthySelected.length} fit starters selected. Complete your XI before kick-off.`}</p></div><div className="matchday-decision-buttons"><button type="button" className="button button-secondary" disabled={!ready} onClick={onInstantResult}><Activity size={15} /> Instant Result</button><button type="button" className="button button-primary" disabled={!ready} onClick={onLiveMatch}><Play size={15} fill="currentColor" /> Live Match</button></div><button type="button" className="text-button matchday-return-squad" onClick={onSquad}>Review squad selection <ChevronRight size={14} /></button></div>
  </section>;
}

function Squad({ career, setCareer, onPlayerProfile }: { career: Career; setCareer: (career: Career) => void; onPlayerProfile: (playerId: string) => void }) {
  const [filter, setFilter] = useState("All players");
  const [notice, setNotice] = useState("");
  const [contractPlayerId, setContractPlayerId] = useState<string | null>(null);
  const [loanPlayerId, setLoanPlayerId] = useState<string | null>(null);
  const players = getUserPlayers(career).filter((player) => filter === "All players" || player.position === filter);
  const allPlayers = getUserPlayers(career);
  const contractPlayer = contractPlayerId ? allPlayers.find((player) => player.id === contractPlayerId) ?? null : null;
  const activeLoans = getActivePlayerLoans(career);
  const leadership = getLeadershipDynamics(career);
  const selectedPlayers = career.lineup.map((id) => allPlayers.find((player) => player.id === id)).filter((player): player is Player => Boolean(player && (player.injuryWeeksRemaining ?? 0) === 0 && (player.suspensionMatchesRemaining ?? 0) === 0));
  const starters = selectedPlayers.length;
  const autoSelectXI = () => {
    const remaining = [...allPlayers].filter((player) => (player.injuryWeeksRemaining ?? 0) === 0 && (player.suspensionMatchesRemaining ?? 0) === 0).sort((a, b) => b.overall + ((b.condition ?? 100) - 100) * 0.045 - a.overall - ((a.condition ?? 100) - 100) * 0.045);
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
    setCareer(setPlayerTraining(career, playerId, trainingFocus));
  };
  const setRole = (playerId: string, role: string) => {
    setCareer(setPlayerRole(career, playerId, role));
  };

  return <>
    <SquadInjurySummary players={allPlayers} />
    <div className="squad-summary"><div><span className="rating-chip">{Math.round(allPlayers.reduce((sum, player) => sum + player.overall, 0) / Math.max(1, allPlayers.length))}</span><span><strong>Squad rating</strong><small>Balanced · {allPlayers.length} senior players</small></span></div><div><span className="summary-stat">{MONEY(allPlayers.reduce((sum, player) => sum + player.wage, 0))}</span><span><strong>Weekly wages</strong><small>{MONEY(getClub(career).wageBudget)} budget</small></span></div><div><span className="summary-stat">{allPlayers.filter((player) => player.contractYears <= 1).length}</span><span><strong>Contract watch</strong><small>Players need a decision</small></span></div></div>
    <section className="dressing-room-panel" aria-labelledby="dressing-room-title"><div className="dressing-room-heading"><div><p className="eyebrow">SQUAD DYNAMICS</p><h2 id="dressing-room-title">Dressing room</h2><span>Leadership and player connections shape how this XI performs together.</span></div><div className="unity-meter"><strong>{Math.max(0, Math.min(100, 100 - leadership.tension))}</strong><span>UNITY</span><i><b style={{ width: `${Math.max(0, Math.min(100, 100 - leadership.tension))}%` }} /></i></div></div><div className="leadership-controls"><label><span><Crown size={14} /> Captain</span><select className="compact-select" aria-label="Choose team captain" value={leadership.captain?.id ?? ""} onChange={(event) => setCareer(appointClubCaptain(career, event.target.value))}>{allPlayers.map((player) => <option key={player.id} value={player.id}>{player.name} · {player.leadership ?? 50} leadership</option>)}</select><small>{leadership.captain?.personality ?? "No captain"} · {leadership.captain?.managerRapport ?? 0} rapport</small></label><label><span><Shield size={14} /> Vice-captain</span><select className="compact-select" aria-label="Choose vice-captain" value={leadership.viceCaptain?.id ?? ""} onChange={(event) => setCareer(appointViceCaptain(career, event.target.value))}>{allPlayers.filter((player) => player.id !== leadership.captain?.id).map((player) => <option key={player.id} value={player.id}>{player.name} · {player.leadership ?? 50} leadership</option>)}</select><small>{leadership.viceCaptain?.personality ?? "Leadership group"} · support the captain on matchday</small></label></div><div className="dressing-room-footer"><span><Users size={14} /> {leadership.connections.length} active XI connection{leadership.connections.length === 1 ? "" : "s"}</span><span className={leadership.tension >= 45 ? "tension-high" : ""}>Dressing-room tension · {leadership.tension}%</span><span>Match influence · {leadership.matchImpact >= 0 ? "+" : ""}{leadership.matchImpact.toFixed(1)}</span></div>{leadership.connections.length > 0 && <div className="connection-list">{leadership.connections.map((connection) => { const first = allPlayers.find((player) => player.id === connection.playerId); const second = allPlayers.find((player) => player.id === connection.linkedPlayerId); return <span key={`${connection.playerId}-${connection.linkedPlayerId}`}><b>{connection.type}</b> · {first?.name} ↔ {second?.name}</span>; })}</div>}</section>
    <section className="matchday-selection-panel"><div className="matchday-selection-head"><div><p className="eyebrow">MATCHDAY SELECTION</p><h2>First XI · {career.formation}</h2><span>Choose a shirt on the player list to change the squad. Your formation updates on the tactics board.</span></div><div className="matchday-shape-preview"><FormationMini formation={career.formation} /><strong>{selectedPlayers.length} / 11</strong><small>XI SELECTED</small><button className="button button-secondary button-small" onClick={autoSelectXI}><Sparkles size={14} /> Auto select</button></div></div><div className="matchday-player-strip">{selectedPlayers.map((player, index) => <button className="matchday-player-chip" key={player.id} onClick={() => setCareer(setPlayerSelection(career, player.id))} aria-label={"Remove " + player.name + " from starting XI"}><span className={`player-position position-${player.position.toLowerCase()}`}>{player.position.slice(0, 1)}</span><span><strong>{String(index + 1).padStart(2, "0")} · {player.name}</strong><small>{player.position} · {player.role ?? "First-team role"}</small></span><b>{player.overall}</b><i>×</i></button>)}{!selectedPlayers.length && <p className="matchday-selection-empty">No players selected yet. Use the player list below or let the assistant choose an XI.</p>}</div><div className="matchday-selection-footer"><span><Users size={14} /> {Math.max(0, allPlayers.length - selectedPlayers.length)} squad players available</span><span>Selection is saved with this career</span></div></section>
    <section className="panel table-panel"><div className="panel-toolbar"><div className="filter-tabs">{["All players", "GK", "DEF", "MID", "FWD"].map((tab) => <button key={tab} onClick={() => setFilter(tab)} className={filter === tab ? "selected" : ""}>{tab}</button>)}</div><span className="squad-table-caption">SELECTED {starters} / 11</span></div>{notice && <div className="inline-notice"><Check size={15} />{notice}<button onClick={() => setNotice("")}><X size={13} /></button></div>}<div className="data-table-wrap"><table className="data-table squad-table"><thead><tr><th>Player</th><th>Pos</th><th>Age</th><th>OVR</th><th>Potential</th><th>Morale</th><th>Contract</th><th>Wage / wk</th><th>Training</th><th>Role / selection</th><th /></tr></thead><tbody>{players.map((player) => { const roleOptions = getPlayerRoleOptions(player); return <tr key={player.id}><td><div className="player-cell"><PlayerPortrait id={player.id} name={player.name} /><div><button className="player-profile-link" onClick={() => onPlayerProfile(player.id)}>{player.name}</button><small>{(player.suspensionMatchesRemaining ?? 0) > 0 ? `Suspended · ${player.suspensionMatchesRemaining} match${player.suspensionMatchesRemaining === 1 ? "" : "es"}` : (player.yellowCardsThisSeason ?? 0) > 0 ? `${player.yellowCardsThisSeason}/5 bookings` : player.overall >= 75 ? "Key player" : player.age < 21 ? "Young prospect" : "First team"} · Rapport {player.managerRapport ?? 58}</small><span className={"player-condition " + ((player.condition ?? 100) < 55 ? "low" : (player.condition ?? 100) < 75 ? "tired" : "")} title="Match condition affects performance and injury risk"><span>FIT</span><i><b style={{ width: String(player.condition ?? 100) + "%" }} /></i><strong>{Math.round(player.condition ?? 100)}%</strong></span></div></div></td><td>{player.position}</td><td>{player.age}</td><td><span className={`ovr-badge ${player.overall >= 72 ? "high" : player.overall < 56 ? "low" : ""}`}>{player.overall}</span></td><td><div className="potential-cell"><span>{player.potential}</span><div className="tiny-progress"><i style={{ width: `${Math.round(player.overall / player.potential * 100)}%` }} /></div></div></td><td><span className="morale-cell"><i style={{ width: `${player.morale}%` }} /><span>{player.morale}</span></span></td><td><span className={player.contractYears <= 1 ? "contract-warning" : ""}>{player.contractYears} {player.contractYears === 1 ? "yr" : "yrs"}</span><button type="button" className="renew-link" disabled={player.age < 16 || !canOpenContractTalks(career, player.id)} title={player.age < 16 ? "Players can discuss contracts from age 16" : !canOpenContractTalks(career, player.id) ? "Contract talks reopen after three matchdays" : "Open player contract talks"} onClick={() => setContractPlayerId(player.id)}>{player.age < 16 ? "Age 16" : !canOpenContractTalks(career, player.id) ? "Wait" : player.contractYears <= 1 ? "Renew" : "Negotiate"}</button></td><td>{MONEY(player.wage)}</td><td><select className="compact-select" aria-label={`Training focus for ${player.name}`} value={player.trainingFocus} onChange={(event) => setTraining(player.id, event.target.value)}>{TRAINING_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></td><td><div className="role-selection-cell"><select className="compact-select" aria-label={`Role for ${player.name}`} value={player.role ?? roleOptions[0]} onChange={(event) => setRole(player.id, event.target.value)}>{roleOptions.map((option) => <option key={option}>{option}</option>)}</select><button className={`role-button ${career.lineup.includes(player.id) ? "in-xi" : ""}`} disabled={!career.lineup.includes(player.id) && ((player.injuryWeeksRemaining ?? 0) > 0 || (player.suspensionMatchesRemaining ?? 0) > 0)} title={(player.suspensionMatchesRemaining ?? 0) > 0 ? "Suspended until the ban is served" : (player.injuryWeeksRemaining ?? 0) > 0 ? "Unavailable while injured" : "Add player to the starting XI"} onClick={() => setCareer(setPlayerSelection(career, player.id))}>{career.lineup.includes(player.id) ? "Starting XI" : (player.suspensionMatchesRemaining ?? 0) > 0 ? "Suspended" : (player.injuryWeeksRemaining ?? 0) > 0 ? "Injured" : "Select"}</button></div></td><td><button type="button" className="renew-link" disabled={player.age < 16 || player.contractYears < 1 || career.lineup.includes(player.id) || getClub(career).captainId === player.id || activeLoans.some((loan) => loan.playerId === player.id)} onClick={() => setLoanPlayerId(player.id)} title="Offer this contracted player to another club on loan">Loan out</button></td></tr>; })}</tbody></table></div><div className="table-footer"><span>Showing {players.length} players</span><span>Low rapport affects player morale and match performance.</span></div></section><ActiveLoans career={career} setCareer={setCareer} onMessage={(message) => setNotice(message)} />{contractPlayer && <ContractNegotiation career={career} player={contractPlayer} setCareer={setCareer} onClose={() => setContractPlayerId(null)} onAccepted={(message) => setNotice(message)} />}{loanPlayerId && <PlayerLoanNegotiation career={career} playerId={loanPlayerId} direction="send" setCareer={setCareer} onClose={() => setLoanPlayerId(null)} onAccepted={(message) => setNotice(message)} />}</>;
}

function SquadInjurySummary({ players }: { players: Player[] }) {
  const unavailable = players.filter((player) => (player.injuryWeeksRemaining ?? 0) > 0 || (player.suspensionMatchesRemaining ?? 0) > 0)
    .sort((a, b) => (b.suspensionMatchesRemaining ?? 0) - (a.suspensionMatchesRemaining ?? 0) || (b.injuryWeeksRemaining ?? 0) - (a.injuryWeeksRemaining ?? 0));
  if (!unavailable.length) return null;
  return <section className="squad-injury-summary" aria-label="Unavailable players"><strong>Medical &amp; discipline · {unavailable.length}</strong><div>{unavailable.map((player) => <span key={player.id}><b>{player.name}</b> · {(player.suspensionMatchesRemaining ?? 0) > 0 ? `Suspended · ${player.suspensionMatchesRemaining} match${player.suspensionMatchesRemaining === 1 ? "" : "es"} remaining` : `${player.injury ?? "Injury assessment"} · ${player.injuryWeeksRemaining} week${player.injuryWeeksRemaining === 1 ? "" : "s"}`}</span>)}</div></section>;
}

function ActiveLoans({ career, setCareer, onMessage }: { career: Career; setCareer: (career: Career) => void; onMessage: (message: string) => void }) {
  const loans = getActivePlayerLoans(career);
  if (!loans.length) return null;
  return <section className="panel active-loans-panel"><div className="transfer-window-heading"><div><p className="eyebrow">TEMPORARY SQUAD MOVES</p><h2>Active loans</h2><span>Parent clubs keep the contract; the borrowing club pays the agreed wage share.</span></div><strong>{loans.length}<small>ACTIVE</small></strong></div><div className="active-loans-list">{loans.map((loan) => {
    const player = career.players.find((item) => item.id === loan.playerId);
    const incoming = loan.loanClubId === career.clubId;
    const otherClub = incoming ? loan.parentClubName : loan.loanClubName;
    const appearances = loan.appearances ?? Math.max(0, (player?.seasonStats?.appearances ?? 0) - (loan.startAppearances ?? 0));
    const goals = loan.goals ?? Math.max(0, (player?.seasonStats?.goals ?? 0) - (loan.startGoals ?? 0));
    return <article key={loan.id}><PlayerPortrait id={loan.playerId} name={loan.playerName} /><div><small>{incoming ? "LOANED IN FROM" : "LOANED OUT TO"} · {otherClub}</small><strong>{loan.playerName}</strong><span>{appearances} apps · {goals} goals · {loan.wageContributionPercent}% wages · returns after MD {loan.endRound}</span></div><button type="button" className="button button-small button-secondary" onClick={() => { const next = endPlayerLoan(career, loan.id); if (next !== career) { setCareer(next); onMessage(incoming ? `${loan.playerName} returned to ${loan.parentClubName}.` : `${loan.playerName} was recalled from ${loan.loanClubName}.`); } }}>{incoming ? "Return early" : "Recall player"}</button></article>;
  })}</div></section>;
}
function PlayerProfile({ player, report, known, onClose }: { player: Player; report: ReturnType<typeof getScoutingReport>; known: boolean; onClose: () => void }) {
  const attributes = player.attributes;
  const trainingSummary = getPlayerTrainingSummary(player);
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
      <section className="profile-training-summary"><div className="profile-training-heading"><div><p className="eyebrow">INDIVIDUAL DEVELOPMENT</p><strong>{trainingSummary.focus} programme</strong></div><span>{trainingSummary.progressPercent}%</span></div><div className="profile-training-track" role="progressbar" aria-label="Progress toward the next trained attribute increase" aria-valuemin={0} aria-valuemax={100} aria-valuenow={trainingSummary.progressPercent}><i style={{ width: `${trainingSummary.progressPercent}%` }} /></div><p>{trainingSummary.focusAttributes.length ? `Progress toward a ${trainingSummary.focus.toLowerCase()} attribute increase.` : "Rest programme selected; no attribute training is scheduled."}</p><div className="profile-training-gains">{trainingSummary.improvedAttributes.length ? trainingSummary.improvedAttributes.slice(0, 6).map((attribute) => <span key={attribute.name}>{attribute.name} <b>+{attribute.value}</b></span>) : <span className="profile-training-empty">No permanent attribute gains recorded yet.</span>}</div></section>
    </>}
    <div className="profile-lower-grid"><section className="profile-data-panel"><div className="profile-section-heading"><div><p className="eyebrow">MATCH RECORD</p><h3>Career statistics</h3></div><span>SEASON {seasonStats.appearances} APPS</span></div><div className="profile-stat-grid">{[["Apps", careerStats.appearances], ["Goals", careerStats.goals], ["Assists", careerStats.assists], ["Clean sheets", careerStats.cleanSheets], ["Minutes", careerStats.minutes.toLocaleString("en-GB")], ["This season", `${seasonStats.goals}G · ${seasonStats.assists}A`], ["International caps", player.internationalCaps ?? 0], ["International goals", player.internationalGoals ?? 0]].map(([label, value]) => <div key={String(label)}><strong>{value}</strong><span>{label}</span></div>)}</div><div className="profile-subheading"><strong>Club history</strong><span>{history.length} club{history.length === 1 ? "" : "s"}</span></div>{history.length ? <div className="profile-history-list">{[...history].reverse().map((record, index) => <div className="profile-history-row" key={`${record.clubId}-${record.fromSeason}-${index}`}><i /><div><strong>{record.clubName}</strong><small>{record.country} · {record.squadLevel} · S{record.fromSeason}{record.toSeason ? `–S${record.toSeason}` : "–Present"}</small></div><span>{record.appearances} apps<br />{record.goals} G · {record.assists} A</span></div>)}</div> : <p className="profile-empty-note">No senior club appearances recorded yet.</p>}</section>
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

function Tactics({ career, setCareer, isMatchday }: { career: Career; setCareer: (career: Career) => void; isMatchday: boolean }) {
  const selected = career.lineup.map((id) => career.players.find((player) => player.id === id)).filter((player): player is Player => Boolean(player));
  const setPiecePlan = getSetPiecePlan(career);
  const setPieceEffects = getSetPieceMatchEffects(career);
  const setPiecePlayers = selected.filter((player) => player.age >= 16);
  const lines = formationLines(career.formation);
  const preparation = getMatchPreparation(career);
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
    <section className="panel match-mode-panel"><div><p className="eyebrow">MATCHDAY WORKSPACE</p><strong>Selection first. The match is your call.</strong><small>When matchday arrives, choose Instant Result or Live Match above the tactics board. Your XI and system shape either route.</small></div><span className="matchday-workspace-status"><Activity size={15} /> {isMatchday ? "MATCHDAY · READY" : "AWAITING FIXTURE DAY"}</span></section>
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
        {preparation && <section className="panel card-pad tactical-lab-panel"><div className="card-heading"><div><p className="eyebrow">OPPOSITION PREPARATION · ROUND {preparation.fixture.round}</p><h2>Tactical laboratory</h2></div><Activity size={17} /></div><div className="prep-opponent"><ClubCrest club={preparation.opponent} size="small" /><div><strong>{preparation.opponent.name}</strong><small>{preparation.opponentStyle} · {preparation.opponentFormation} · {preparation.opponentMentality} · {preparation.opponent.city}</small></div></div><div className="prep-choices" role="group" aria-label="Choose a match preparation rehearsal">{MATCH_PREPARATION_PLANS.map((plan) => <button type="button" key={plan} aria-pressed={preparation.plan === plan} className={preparation.plan === plan ? "selected" : ""} onClick={() => setCareer(setMatchPreparation(career, plan))}>{plan}</button>)}</div><div className="prep-feedback"><Lightbulb size={16} /><div><strong>ASSISTANT COACH · INSIGHT {preparation.coachInsight}</strong><p>{preparation.feedback}</p><small>Style read: {preparation.recommendedStyle} counters their {preparation.opponentStyle.toLowerCase()} approach. Current system: {preparation.styleAdvantage > 0 ? "favourable matchup" : preparation.styleAdvantage < 0 ? "opposition has the style edge" : "even matchup"}. {preparation.plan ? `Rehearsal effect: ${preparation.matchRatingAdjustment > 0 ? "+" : ""}${preparation.matchRatingAdjustment.toFixed(2)} team rating for this match.` : "Choose a rehearsal and decide whether your current system can exploit the matchup."}</small></div></div></section>}
        <div className="lineup-panel"><div className="card-heading"><div><p className="eyebrow">MATCHDAY SELECTION</p><h2>Starting XI</h2></div><span>{selected.length} / 11</span></div>{["GK", "DEF", "MID", "FWD"].map((position, index) => <div className="lineup-row" key={position}><span className="lineup-position">{position}</span><div>{grouped[index].map((player) => <span className="lineup-player" key={player.id}>{player.name} · {player.role ?? position}</span>)}</div></div>)}{selected.length < 11 && <p className="lineup-warning"><Lightbulb size={14} /> Choose {11 - selected.length} more player{selected.length === 10 ? "" : "s"} from your squad.</p>}</div>
        <section className="panel card-pad set-piece-panel"><div className="card-heading"><div><p className="eyebrow">DEAD-BALL PREPARATION</p><h2>Set-piece designer</h2></div><Flag size={17} /></div><p className="set-piece-intro">Assign the delivery, target and takers from your selected XI. These plans influence chance quality in instant and live matches.</p><div className="set-piece-grid">
          <label>Corners · delivery<select className="field-select" value={setPiecePlan.cornerDelivery} onChange={(event) => setCareer(setSetPieceSelection(career, "cornerDelivery", event.target.value))}>{CORNER_DELIVERIES.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label>Corner taker<select className="field-select" value={setPiecePlan.cornerTakerId} onChange={(event) => setCareer(setSetPieceSelection(career, "cornerTakerId", event.target.value))}>{setPiecePlayers.map((player) => <option key={player.id} value={player.id}>{player.name} · {player.attributes?.crossing ?? 50} cross</option>)}</select></label>
          <label>Primary target<select className="field-select" value={setPiecePlan.cornerTargetId} onChange={(event) => setCareer(setSetPieceSelection(career, "cornerTargetId", event.target.value))}>{setPiecePlayers.filter((player) => player.position !== "GK").map((player) => <option key={player.id} value={player.id}>{player.name} · {player.position} · {player.attributes?.strength ?? 50} strength</option>)}</select></label>
          <label>Free-kick routine<select className="field-select" value={setPiecePlan.freeKickRoutine} onChange={(event) => setCareer(setSetPieceSelection(career, "freeKickRoutine", event.target.value))}>{FREE_KICK_ROUTINES.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label>Free-kick taker<select className="field-select" value={setPiecePlan.freeKickTakerId} onChange={(event) => setCareer(setSetPieceSelection(career, "freeKickTakerId", event.target.value))}>{setPiecePlayers.map((player) => <option key={player.id} value={player.id}>{player.name} · {player.attributes?.shooting ?? 50} shoot</option>)}</select></label>
          <label>Penalty taker<select className="field-select" value={setPiecePlan.penaltyTakerId} onChange={(event) => setCareer(setSetPieceSelection(career, "penaltyTakerId", event.target.value))}>{setPiecePlayers.map((player) => <option key={player.id} value={player.id}>{player.name} · {player.attributes?.finishing ?? 50} finish</option>)}</select></label>
          <label>Defend corners<select className="field-select" value={setPiecePlan.cornerDefence} onChange={(event) => setCareer(setSetPieceSelection(career, "cornerDefence", event.target.value))}>{CORNER_DEFENCES.map((option) => <option key={option}>{option}</option>)}</select></label>
        </div><div className="set-piece-impact"><span><small>ATTACKING ROUTINES</small><strong>+{setPieceEffects.attackingXg.toFixed(3)} xG / match</strong></span><span><small>CORNER DEFENCE</small><strong>−{setPieceEffects.defendingXg.toFixed(3)} xG allowed / match</strong></span><small>Estimated from the starters’ current technical and physical attributes.</small></div></section>
      </section>
      <section className="panel card-pad role-learning-panel"><div className="card-heading"><div><p className="eyebrow">PLAYER INSTRUCTIONS</p><h2>Tactical role map</h2></div><Activity size={17} /></div><p>Assign each starter a job that suits their attributes. Match minutes and Tactical training build role understanding; changing role resets it while the player learns the new brief.</p><div className="tactical-role-list">{selected.map((player) => { const assessment = getPlayerRoleAssessment(player); return <article className="tactical-role-row" key={player.id}><div className="tactical-role-player"><strong>{player.name}</strong><span>{player.position} · {assessment.label} fit</span></div><select className="compact-select" aria-label={`Tactical role for ${player.name}`} value={assessment.role} onChange={(event) => setCareer(setPlayerRole(career, player.id, event.target.value))}>{getPlayerRoleOptions(player).map((role) => <option key={role}>{role}</option>)}</select><div className="tactical-role-readiness"><span><b>{assessment.fit}</b> overall fit</span><i><b style={{ width: `${assessment.fit}%` }} /></i><small>{assessment.familiarity}% role understanding · {assessment.skillFit}% attribute match</small></div></article>; })}{!selected.length && <div className="tactical-role-empty">Select your starting players to assign tactical roles.</div>}</div></section>
    </div>
  </>;
}

function Fixtures({ career, setCareer, onAdvance, seasonEnd }: { career: Career; setCareer: (career: Career) => void; onAdvance: () => void; seasonEnd: boolean }) {
  const [openedMatchId, setOpenedMatchId] = useState<string | null>(null);
  const league = getCurrentLeague(career);
  const fixtures = career.fixtures.filter((fixture) => fixture.leagueId === league.id && fixture.round >= Math.max(1, career.round - 2) && fixture.round <= Math.min(league.rounds, career.round + 5));
  const open = career.fixtures.filter((fixture) => fixture.leagueId === league.id && fixture.round === career.round);
  const openedMatch = openedMatchId ? career.fixtures.find((fixture) => fixture.id === openedMatchId) ?? null : null;
  const currentFixture = getNextFixture(career);
  const matchday = Boolean(currentFixture && getCalendarDate(career) >= currentFixture.date);
  return <><SectionHeading kicker={league.name.toUpperCase() + " · " + (2026 + career.season - 1) + "/" + String(2027 + career.season - 1).slice(-2)} title="Fixtures & results" detail="Every match in the season, with results added as the weeks pass." action={<button className="button button-primary" disabled={career.unemployed} onClick={onAdvance}>{seasonEnd ? "Begin next season" : matchday ? "Match Day" : "Advance one day"}{matchday ? <Flag size={15} /> : <Clock3 size={15} />}</button>} /><div className="fixtures-toolbar"><div className="fixtures-key"><span><i className="fixture-current-dot" /> Current matchday</span><span><i className="fixture-played-dot" /> Played</span></div><span>{league.rounds} MATCHDAYS · {league.clubs} CLUBS</span></div><div className="fixture-list">{fixtures.map((fixture) => {
    const isUser = fixture.homeClubId === career.clubId || fixture.awayClubId === career.clubId;
    const isCurrent = fixture.round === career.round;
    const home = getClub(career, fixture.homeClubId);
    const away = getClub(career, fixture.awayClubId);
    return <div key={fixture.id} className={`fixture-row ${isCurrent ? "fixture-current" : ""} ${isUser ? "fixture-user" : ""}`}><div className="fixture-round"><small>MATCHDAY</small><strong>{String(fixture.round).padStart(2, "0")}</strong></div><div className="fixture-date">{pageDate(fixture.date)}</div><div className="fixture-home"><strong>{home.name}</strong><ClubCrest club={home} size="small" /></div><div className="fixture-score">{fixture.played ? `${fixture.homeGoals} – ${fixture.awayGoals}` : <span>{formatGameTime(15)}</span>}</div><div className="fixture-away"><ClubCrest club={away} size="small" /><strong>{away.name}</strong></div><div className="fixture-status">{fixture.played ? <button type="button" className="fixture-report-button" onClick={() => setOpenedMatchId(fixture.id)}>MATCH REPORT</button> : isCurrent ? <span className="up-next-label">UP NEXT</span> : <span className="scheduled-label">SCHEDULED</span>}</div></div>;
  })}</div><div className="season-fixture-foot"><span>{open.length ? `${open.length} fixtures scheduled for this matchday` : "All fixtures completed"}</span><span>Open a played result for its timeline and match data.</span></div>{openedMatch && <MatchReportDialog career={career} fixture={openedMatch} onClose={() => setOpenedMatchId(null)} />}</>;
}

function InternationalFootball({ career, onPlayerProfile }: { career: Career; onPlayerProfile: (playerId: string) => void }) {
  const clubCountry = getClub(career).country;
  const defaultConfederation = WORLD_COUNTRIES.find((entry) => entry.country === clubCountry)?.continent ?? "Europe";
  const confederations = [...new Set(WORLD_COUNTRIES.map((entry) => entry.continent))];
  const [selectedConfederation, setSelectedConfederation] = useState<string>(defaultConfederation);
  useEffect(() => setSelectedConfederation(defaultConfederation), [career.id, career.clubId, defaultConfederation]);
  const currentFixtures = career.internationalFixtures ?? [];
  const archivedFixtures = career.internationalArchive ?? [];
  const allFixtures = [...archivedFixtures, ...currentFixtures];
  const upcomingFixtures = currentFixtures.filter((fixture) => !fixture.played).sort((first, second) => first.date.localeCompare(second.date));
  const nextDate = upcomingFixtures[0]?.date;
  const previousDate = allFixtures.filter((fixture) => fixture.played).map((fixture) => fixture.date).sort().at(-1);
  const focusDate = nextDate ?? previousDate;
  const focusFixtures = focusDate ? currentFixtures.filter((fixture) => fixture.date === focusDate).sort((first, second) => first.homeCountry.localeCompare(second.homeCountry)) : [];
  const representedCountries = new Set(career.players.map((player) => player.nationality).filter((country): country is string => Boolean(country)));
  const spotlightFixtures = focusFixtures.filter((fixture) => representedCountries.has(fixture.homeCountry) || representedCountries.has(fixture.awayCountry));
  const displayFixtures = (spotlightFixtures.length ? spotlightFixtures : focusFixtures).slice(0, 12);
  const callups = nextDate ? getInternationalCallups(career, nextDate) : [];
  const caps = career.players.reduce((sum, player) => sum + (player.internationalCaps ?? 0), 0);
  const clubCaps = career.players.filter((player) => player.clubId === career.clubId && (player.internationalCaps ?? 0) > 0).sort((first, second) => (second.internationalCaps ?? 0) - (first.internationalCaps ?? 0)).slice(0, 5);
  const windows = [...new Map(currentFixtures.map((fixture) => [fixture.window, fixture])).values()];
  const groupTables = getInternationalTables(career).filter((group) => group.confederation === selectedConfederation);
  const focWindow = focusFixtures[0]?.window;
  const dateLabel = focusDate ? pageDate(focusDate) : "To be scheduled";
  const scorerNames = (fixture: InternationalFixture, side: "home" | "away") => (side === "home" ? fixture.homeScorerIds : fixture.awayScorerIds)
    ?.map((id) => career.players.find((player) => player.id === id)?.name)
    .filter((name): name is string => Boolean(name)) ?? [];

  return <div className="international-page">
    <SectionHeading kicker={`THE WORLD GAME · ${2026 + career.season - 1}/${String(2027 + career.season - 1).slice(-2)}`} title="International football" detail="National-team windows, player call-ups and results from across the game's six confederations." action={<span className="international-next-chip"><Globe size={15} /> {nextDate ? `NEXT WINDOW · ${dateLabel}` : "SEASON WINDOWS COMPLETE"}</span>} />
    <section className="international-hero">
      <div className="international-hero-copy"><p className="eyebrow">NATIONAL TEAM CENTRE</p><h2>{focWindow ? `${focWindow} internationals` : "A world between matchdays"}</h2><p>{nextDate ? `The next window falls on ${dateLabel}. Career players are selected from their eligible national squads, then results and appearances are recorded as the calendar reaches the date.` : "International activity returns with the next season's calendar."}</p><div className="international-hero-meta"><span><b>{focusFixtures.length}</b> fixtures in this window</span><span><b>{callups.reduce((sum, group) => sum + group.players.length, 0)}</b> of your players in call-up range</span></div></div>
      <div className="international-orbit" aria-hidden="true"><Globe size={56} strokeWidth={1.1} /><span>WORLD<br />FOOTBALL</span></div>
    </section>
    <section className="international-stat-grid" aria-label="International football overview">
      <article><span>ASSOCIATIONS</span><strong>{WORLD_COUNTRIES.length}</strong><small>Across six confederations</small></article>
      <article><span>WINDOWS</span><strong>{windows.length}</strong><small>Four dates each season</small></article>
      <article><span>SEASON FIXTURES</span><strong>{currentFixtures.length}</strong><small>{currentFixtures.filter((fixture) => fixture.played).length} results recorded</small></article>
      <article><span>CAREER CAPS</span><strong>{caps.toLocaleString("en-GB")}</strong><small>Across players in this save</small></article>
    </section>
    <div className="international-window-grid">
      {windows.map((window) => {
        const matches = currentFixtures.filter((fixture) => fixture.window === window.window);
        const date = matches[0]?.date;
        const completed = matches.length > 0 && matches.every((fixture) => fixture.played);
        return <article className={`international-window-card ${completed ? "is-complete" : "is-upcoming"}`} key={window.window}><div className="international-window-icon"><CalendarDays size={16} /></div><div><span>{completed ? "WINDOW COMPLETE" : "UPCOMING WINDOW"}</span><strong>{window.window}</strong><small>{date ? pageDate(date) : "Date pending"} · {matches.length} international fixtures</small></div><b>{completed ? "DONE" : "SCHEDULED"}</b></article>;
      })}
    </div>
    <section className="panel international-tables-panel">
      <div className="international-panel-heading">
        <div><p className="eyebrow">CONTINENTAL COMPETITION</p><h2>Confederation Nations League</h2><span>Three group rounds set the table; the March window is reserved for international friendlies.</span></div>
        <label className="international-confederation-select"><span>CONFEDERATION</span><select value={selectedConfederation} onChange={(event) => setSelectedConfederation(event.target.value)}>{confederations.map((confederation) => <option value={confederation} key={confederation}>{confederation}</option>)}</select></label>
      </div>
      <div className="international-group-grid">
        {groupTables.map((group) => {
          const fixtures = currentFixtures.filter((fixture) => fixture.competitionGroup === group.group);
          const played = fixtures.filter((fixture) => fixture.played).length;
          const label = group.group.split(" · ").at(-1) ?? group.group;
          return <article className="international-group-card" key={group.group}>
            <header><div><span>{group.confederation.toUpperCase()}</span><h3>{label}</h3></div><b>{played}/{fixtures.length} PLAYED</b></header>
            <div className="international-table-scroll"><table><thead><tr><th>#</th><th>Nation</th><th>P</th><th>W-D-L</th><th>GD</th><th>PTS</th></tr></thead><tbody>{group.standings.map((row, index) => <tr key={row.country} className={index === 0 && row.played > 0 ? "is-group-leader" : ""}><td>{String(index + 1).padStart(2, "0")}</td><th scope="row">{row.country}</th><td>{row.played}</td><td>{row.wins}-{row.draws}-{row.losses}</td><td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td><td><strong>{row.points}</strong></td></tr>)}</tbody></table></div>
          </article>;
        })}
      </div>
      {!groupTables.length && <div className="international-empty"><Globe size={18} /><span>Group tables will appear when the current season’s Nations League fixtures are available.</span></div>}
    </section>
    <div className="international-content-grid">
      <section className="panel international-panel">
        <div className="international-panel-heading"><div><p className="eyebrow">YOUR CLUB · NATIONAL DUTY</p><h2>Call-up watch</h2><span>{nextDate ? `Selection is based on eligible players ahead of ${dateLabel}.` : "Players with recorded international appearances."}</span></div><span className="international-panel-count">{nextDate ? callups.reduce((sum, item) => sum + item.players.length, 0) : clubCaps.length} PLAYERS</span></div>
        {nextDate && callups.length ? <div className="international-callup-list">{callups.map((group) => <article className="international-callup-group" key={group.country}><div className="international-country-heading"><span>{group.country.slice(0, 3).toUpperCase()}</span><strong>{group.country}<small>{group.players.length} selected from your squad</small></strong><Globe size={14} /></div><div className="international-player-list">{group.players.map((player) => <button className="international-player-row" type="button" key={player.id} onClick={() => onPlayerProfile(player.id)}><span className="international-player-position">{player.position}</span><span className="international-player-copy"><strong>{player.name}</strong><small>Age {player.age} · {player.overall} OVR · {player.internationalCaps ?? 0} caps</small></span><ChevronRight size={14} /></button>)}</div></article>)}</div> : clubCaps.length ? <div className="international-player-list">{clubCaps.map((player) => <button className="international-player-row" type="button" key={player.id} onClick={() => onPlayerProfile(player.id)}><span className="international-player-position">{player.position}</span><span className="international-player-copy"><strong>{player.name}</strong><small>{player.nationality} · {player.internationalCaps} caps · {player.internationalGoals ?? 0} goals</small></span><ChevronRight size={14} /></button>)}</div> : <div className="international-empty"><Users size={19} /><span>No players from your club are in the next senior call-up group yet. Strong form and development can change that.</span></div>}
      </section>
      <section className="panel international-panel">
        <div className="international-panel-heading"><div><p className="eyebrow">{nextDate ? "NEXT INTERNATIONAL DATE" : "LATEST RESULTS"}</p><h2>{nextDate ? "Fixtures around the world" : "International record"}</h2><span>{focusDate ? `${dateLabel} · ${spotlightFixtures.length || focusFixtures.length} nations represented in this view` : "Results will appear when the calendar reaches a window."}</span></div><Flag size={18} /></div>
        {displayFixtures.length ? <div className="international-results">{displayFixtures.map((fixture) => {
          const homeScorers = scorerNames(fixture, "home");
          const awayScorers = scorerNames(fixture, "away");
          return <article className="international-result-row" key={fixture.id}><div className="international-result-meta"><span>{fixture.confederation}</span><small>{fixture.played ? "FULL TIME" : fixture.competition.toUpperCase()}</small></div><div className="international-scoreline"><strong>{fixture.homeCountry}</strong><b>{fixture.played ? `${fixture.homeGoals} – ${fixture.awayGoals}` : "v"}</b><strong>{fixture.awayCountry}</strong></div><div className="international-scorers">{homeScorers.length || awayScorers.length ? `${homeScorers.join(", ")}${homeScorers.length && awayScorers.length ? " · " : ""}${awayScorers.join(", ")}` : fixture.played ? "No career player recorded as a scorer" : "International friendly · senior teams"}</div></article>;
        })}</div> : <div className="international-empty"><Globe size={19} /><span>Fixtures will be generated for the next international window.</span></div>}
      </section>
    </div>
    <section className="international-club-record panel"><div><p className="eyebrow">THE CLUB'S INTERNATIONAL RECORD</p><h2>Players have a national career too</h2><p>Caps and goals stay on the player dossier across seasons. International appearances also add a small workload, which is reflected in player condition after the window.</p></div><div className="international-record-leaders">{clubCaps.length ? clubCaps.map((player) => <button type="button" key={player.id} onClick={() => onPlayerProfile(player.id)}><span>{player.name}</span><strong>{player.internationalCaps} <small>CAPS</small></strong><b>{player.internationalGoals ?? 0} <small>GOALS</small></b></button>) : <span className="muted">No senior caps recorded for this club yet.</span>}</div></section>
  </div>;
}

function CareerCalendar({ career, setCareer, onAdvance }: { career: Career; setCareer: (career: Career) => void; onAdvance: () => void }) {
  const today = getCalendarDate(career);
  const [selectedDate, setSelectedDate] = useState(today);
  const [visibleMonth, setVisibleMonth] = useState(`${today.slice(0, 7)}-01`);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    setSelectedDate(today);
    setVisibleMonth(`${today.slice(0, 7)}-01`);
  }, [today]);
  const year = Number(visibleMonth.slice(0, 4));
  const month = Number(visibleMonth.slice(5, 7)) - 1;
  const firstDay = new Date(Date.UTC(year, month, 1, 12));
  const offset = (firstDay.getUTCDay() + 6) % 7;
  const monthLength = new Date(Date.UTC(year, month + 1, 0, 12)).getUTCDate();
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(Date.UTC(year, month, index - offset + 1, 12));
    return date.toISOString().slice(0, 10);
  });
  const clubFixtures = career.fixtures.filter((fixture) => fixture.homeClubId === career.clubId || fixture.awayClubId === career.clubId);
  const fixtureDates = new Set(clubFixtures.map((fixture) => fixture.date));
  const internationalDates = new Set((career.internationalFixtures ?? []).map((fixture) => fixture.date));
  const selectedFixture = clubFixtures.find((fixture) => fixture.date === selectedDate);
  const selectedInternational = (career.internationalFixtures ?? []).filter((fixture) => fixture.date === selectedDate);
  const selectedOpponent = selectedFixture ? getClub(career, selectedFixture.homeClubId === career.clubId ? selectedFixture.awayClubId : selectedFixture.homeClubId) : null;
  const selectedLongDate = new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const monthLabel = new Date(`${visibleMonth}T12:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const leave = career.managerLeave;
  const leaveActive = leave?.status === "active";
  const leaveDaysLeft = leaveActive ? Math.max(0, Math.round((new Date(`${leave.endDate}T12:00:00Z`).getTime() - new Date(`${today}T12:00:00Z`).getTime()) / 86_400_000)) : 0;
  const moveMonth = (delta: number) => {
    const nextMonth = new Date(Date.UTC(year, month + delta, 1, 12)).toISOString().slice(0, 10);
    setVisibleMonth(nextMonth);
    setSelectedDate(nextMonth);
  };
  const askForLeave = (days: number) => {
    const result = requestManagerLeave(career, days);
    setCareer(result.career);
    setNotice(result.message);
  };
  return <>
    <SectionHeading kicker="THE CLUB SEASON · YEAR PLANNER" title="Calendar & leave" detail="Follow the football year, see every first-team date and ask the board for time away." action={<button type="button" className="button button-primary" disabled={career.unemployed || isSeasonComplete(career)} onClick={onAdvance}>{leaveActive ? "Continue holiday" : "Advance one day"}<Clock3 size={15} /></button>} />
    {notice && <div className={`inline-notice ${leaveActive ? "calendar-success-notice" : ""}`}><Shield size={15} />{notice}<button type="button" aria-label="Dismiss leave update" onClick={() => setNotice("")}><X size={13} /></button></div>}
    <div className="calendar-layout">
      <section className="panel season-calendar" aria-label="Season calendar">
        <div className="season-calendar-head"><div><p className="eyebrow">SEASON {2026 + career.season - 1}/{String(2027 + career.season - 1).slice(-2)}</p><h2>{monthLabel}</h2></div><div className="calendar-month-actions"><button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)}><ChevronLeft size={17} /></button><button type="button" onClick={() => { setVisibleMonth(`${today.slice(0, 7)}-01`); setSelectedDate(today); }}>Today</button><button type="button" aria-label="Next month" onClick={() => moveMonth(1)}><ChevronRight size={17} /></button></div></div>
        <div className="calendar-weekdays">{["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => <span key={day}>{day}</span>)}</div>
        <div className="calendar-grid">{calendarDays.map((date) => {
          const inMonth = Number(date.slice(8, 10)) <= monthLength && date.slice(0, 7) === visibleMonth.slice(0, 7);
          const fixture = fixtureDates.has(date);
          const international = internationalDates.has(date);
          const match = clubFixtures.find((item) => item.date === date);
          const opponent = match ? getClub(career, match.homeClubId === career.clubId ? match.awayClubId : match.homeClubId) : null;
          return <button type="button" key={date} className={`calendar-day ${inMonth ? "" : "calendar-day-muted"} ${selectedDate === date ? "calendar-day-selected" : ""} ${today === date ? "calendar-day-today" : ""} ${fixture ? "calendar-day-match" : ""}`} onClick={() => setSelectedDate(date)} aria-label={`${new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}${opponent ? `, ${match?.played ? "match result against" : "match against"} ${opponent.name}` : ""}${international ? ", international window" : ""}`} aria-pressed={selectedDate === date}><span>{Number(date.slice(8, 10))}</span>{fixture && <i title={opponent?.name} />}{leaveActive && date >= leave.startDate && date <= leave.endDate && <b title="Manager on approved leave" />}{international && <em title="International window" />}</button>;
        })}</div>
        <div className="calendar-legend"><span><i className="calendar-legend-match" />First-team match</span><span><i className="calendar-legend-international" />International window</span><span><i className="calendar-legend-leave" />Manager leave</span><span><i className="calendar-legend-today" />Today</span></div>
      </section>
      <aside className="calendar-side-panel">
        <section className="panel calendar-day-detail"><p className="eyebrow">SELECTED DATE</p><h2>{selectedLongDate}</h2>{selectedFixture && selectedOpponent ? <div className="calendar-fixture-card"><span>{selectedFixture.played ? "FULL TIME" : selectedFixture.round === career.round ? "UP NEXT" : "SCHEDULED"} · ROUND {selectedFixture.round}</span><strong>{selectedFixture.homeClubId === career.clubId ? getClub(career, career.clubId).shortName : selectedOpponent.shortName}<b>{selectedFixture.played ? `${selectedFixture.homeGoals}–${selectedFixture.awayGoals}` : "v"}</b>{selectedFixture.homeClubId === career.clubId ? selectedOpponent.shortName : getClub(career, career.clubId).shortName}</strong><small>{selectedFixture.homeClubId === career.clubId ? "HOME" : "AWAY"} · {selectedOpponent.name}</small></div> : selectedInternational.length ? <div className="calendar-fixture-card calendar-international-card"><span>{selectedInternational[0].window.toUpperCase()} INTERNATIONAL WINDOW · {selectedInternational.length} FIXTURES</span><strong>{selectedInternational[0].confederation}<b>{selectedInternational.every((fixture) => fixture.played) ? "RESULTS" : "NATIONS"}</b>National teams</strong><small>International results are recorded as the calendar reaches this date.</small></div> : <div className="calendar-no-event"><CalendarDays size={17} /><span>No first-team fixture is scheduled for this day.</span></div>}</section>
        <section className={`panel manager-leave-card ${leaveActive ? "manager-leave-active" : ""}`}><div className="manager-leave-heading"><div><p className="eyebrow">BOARD APPROVAL · MANAGER’S OFFICE</p><h2>{leaveActive ? "You are on leave" : "Request a holiday"}</h2></div><Shield size={18} /></div>{leaveActive ? <><p>The assistant manager is selecting the team and handling matches. A serious injury, major press crisis or board decision will call you back.</p><div className="leave-date-range"><span>RETURN BY</span><strong>{pageDate(leave.endDate)}</strong><small>{leaveDaysLeft} day{leaveDaysLeft === 1 ? "" : "s"} remaining</small></div><button type="button" className="button button-secondary button-wide" onClick={() => { setCareer(endManagerLeaveEarly(career)); setNotice("You have returned from leave and resumed matchday responsibilities."); }}>Return to the club early</button></> : <><p>The board weighs the club’s results, pressure and confidence before deciding. Your assistant takes over selection while you are away.</p><div className="leave-options">{[3, 7, 14].map((days) => <button type="button" key={days} disabled={career.unemployed || isSeasonComplete(career)} onClick={() => askForLeave(days)}><strong>{days}<small> DAYS</small></strong><span>{days === 3 ? "Short break" : days === 7 ? "One week" : "Two weeks"}</span><ChevronRight size={15} /></button>)}</div>{leave && leave.status !== "active" && <div className={`leave-outcome leave-${leave.status}`}><strong>{leave.status === "interrupted" ? "Leave interrupted" : "Previous leave"}</strong><span>{leave.message}</span></div>}</>}</section>
      </aside>
    </div>
  </>;
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
  const [transferPlayerId, setTransferPlayerId] = useState<string | null>(null);
  const [loanPlayerId, setLoanPlayerId] = useState<string | null>(null);
  const [filter, setFilter] = useState<WorldPlayerFilter | "Career clubs">("All players");
  const [positionFilter, setPositionFilter] = useState<Position | "Any">("Any");
  const [ageFilter, setAgeFilter] = useState("Any age");
  const [countryFilter, setCountryFilter] = useState("All countries");
  const [page, setPage] = useState(0);
  const club = getClub(career);
  const ageRange = ageFilter === "Under 18" ? { minAge: 5, maxAge: 17 } : ageFilter === "18–21" ? { minAge: 18, maxAge: 21 } : ageFilter === "22–26" ? { minAge: 22, maxAge: 26 } : ageFilter === "27+" ? { minAge: 27, maxAge: 99 } : {};
  const criteria = { position: positionFilter, country: countryFilter, ...ageRange };
  const localPlayers = career.players.filter((player) => {
    if (player.age < 16 || player.clubId === career.clubId) return false;
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
  const worldTransfers = (career.transferHistory ?? []).slice(-6).reverse();
  const makeOffer = (playerId: string) => setTransferPlayerId(playerId);
  const commissionReport = (playerId: string) => {
    const next = scoutPlayer(career, playerId);
    if (next === career) setNotice("The club needs more available funds, or this player already has a report.");
    else { setCareer(next); setNotice("Assessment commissioned. Your scout needs five game days before ratings and valuation are unlocked."); }
  };
  const signAcademyPlayer = (playerId: string) => {
    const next = signYouthPlayer(career, playerId);
    if (next === career) setNotice("The academy cannot complete this registration with the available balance.");
    else { setCareer(next); setNotice("The scouted prospect has joined the academy pathway."); }
  };
  return <>
    <SectionHeading kicker="RECRUITMENT" title="World player database" detail={`Search ${WORLD_PLAYER_COUNT.toLocaleString("en-GB")} players across ${WORLD_PLAYER_COUNTRIES.length} countries. Filter by position, age and nation, then commission a report before ability and potential are revealed.`} action={<div className="budget-pill"><Wallet size={15} /><span>TRANSFER BUDGET</span><strong>{MONEY(club.transferBudget)}</strong></div>} />
    <div className="world-database-intro"><div className="database-emblem"><Search size={20} /></div><div><p className="eyebrow">GLOBAL SCOUTING NETWORK</p><strong>{WORLD_PLAYER_COUNT.toLocaleString("en-GB")} players · {WORLD_PLAYER_COUNTRIES.length} countries · clubs, academies and free agents</strong><span>Identity is visible to every club. Ability, potential and market value are revealed only after a scout report.</span></div><div className="scout-file-count"><strong>{knownReports}</strong><span>reports in your manager file</span></div></div>
    <section className="panel transfer-window-panel"><div className="transfer-window-heading"><div><p className="eyebrow">AROUND THE WORLD · SEASON {career.season}</p><h2>Transfers & contract renewals</h2><span>Clubs recruit after the season, free agents find new homes and completed deals stay in the archive.</span></div><strong>{worldTransfers.length}<small>RECENT MOVES</small></strong></div>{worldTransfers.length ? <div className="transfer-window-list">{worldTransfers.map((transfer) => <article key={transfer.id}><span className="transfer-window-avatar">{transfer.playerName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span><div><small>{transfer.fromClubName} <i>→</i> {transfer.toClubName}</small><strong>{transfer.playerName}</strong><span>Season {transfer.season} · {transfer.fee ? MONEY(transfer.fee) : "Free transfer"}</span></div><RefreshCw size={15} /></article>)}</div> : <div className="transfer-window-empty"><RefreshCw size={16} />The first AI window opens at the end of this season. Every club has its own budget, squad needs and contract list.</div>}</section>
    <section className="panel market-panel world-market-panel">
      <div className="panel-toolbar world-market-toolbar"><div className="market-heading"><div><p className="eyebrow">PLAYER DIRECTORY</p><h2>{filter === "Career clubs" ? "Career clubs" : filter}</h2></div><span>{resultCount.toLocaleString("en-GB")} matching players</span></div><div className="market-search"><Search size={15} /><input aria-label="Search players" placeholder="Name, club, country or position" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} /></div></div>
      <div className="database-filters">{(["All players", "First team", "Academy", "Free agent", "Career clubs"] as const).map((option) => <button key={option} className={filter === option ? "selected" : ""} onClick={() => { setFilter(option); setPage(0); }}>{option}{option !== "Career clubs" && <small>{worldGroupCount(option).toLocaleString("en-GB")}</small>}</button>)}</div>
      <div className="player-directory-filters"><label>POSITION<select aria-label="Filter players by position" value={positionFilter} onChange={(event) => { setPositionFilter(event.target.value as Position | "Any"); setPage(0); }}><option value="Any">Any position</option>{(["GK", "DEF", "MID", "FWD"] as const).map((position) => <option key={position}>{position}</option>)}</select></label><label>AGE<select aria-label="Filter players by age" value={ageFilter} onChange={(event) => { setAgeFilter(event.target.value); setPage(0); }}><option>Any age</option><option>Under 18</option><option>18–21</option><option>22–26</option><option>27+</option></select></label><label>COUNTRY<select aria-label="Filter players by country" value={countryFilter} onChange={(event) => { setCountryFilter(event.target.value); setPage(0); }}><option>All countries</option>{WORLD_PLAYER_COUNTRIES.map((country) => <option key={country}>{country}</option>)}</select></label></div>
      {notice && <div className="inline-notice"><Check size={15} />{notice}<button onClick={() => setNotice("")}><X size={13} /></button></div>}
      <div className="database-results">{listings.map((listing) => {
        const report = getScoutingReport(career, listing.id);
        const assignment = getScoutingAssignment(career, listing.id);
        const scoutingDays = getScoutingDaysRemaining(career, listing.id);
        const inClub = career.players.some((player) => player.id === listing.id && player.clubId === club.id);
        const scoutingCost = getScoutingCost(career, listing.id);
        const registrationFee = 8_000 + listing.age * 3_500 + club.academyLevel * 4_000;
        const isFree = listing.group === "Free agent";
        const availablePlayer = career.players.find((player) => player.id === listing.id);
        const value = report?.marketValue ?? availablePlayer?.value ?? 0;
        const alreadyLoaned = (career.playerLoans ?? []).some((loan) => loan.playerId === listing.id && loan.status === "Active");
        const canLoan = Boolean(availablePlayer?.clubId && report && listing.age >= 16 && !alreadyLoaned);
        return <article className="database-player" key={listing.id}>
          <PlayerPortrait id={listing.id} name={listing.name} />
          <span className={`player-position position-${listing.position.toLowerCase()}`}>{listing.position.slice(0, 1)}</span>
          <div className="database-player-main"><div className="database-player-title"><button className="player-profile-link" onClick={() => onPlayerProfile(listing.id)}>{listing.name}</button><span>{listing.age} yrs · {listing.nationality}</span></div><div className="database-player-origin"><span>{listing.clubName}</span><i>·</i><span>{listing.country}</span><i>·</i><span>{listing.group}</span></div></div>
          <div className="database-player-report">{report ? <><strong>ABILITY {report.currentAbility}<b>·</b> POTENTIAL {report.potential}</strong><span>{formatPlayerValue(report.marketValue)} market value</span><small>{report.clubId === club.id ? "MANAGER + CLUB FILE" : "MANAGER FILE"} · S{report.season} MD{report.round}</small></> : assignment ? <><strong className="scouting-in-progress">ASSESSMENT IN PROGRESS</strong><span>Ability and potential remain hidden</span><small>{scoutingDays} GAME DAY{scoutingDays === 1 ? "" : "S"} LEFT · DUE {pageDate(assignment.availableDate)}</small></> : <><strong className="ratings-hidden">ABILITY ? <b>·</b> POTENTIAL ?</strong><span>Scout to reveal ratings</span><small>Not yet assessed</small></>}</div>
          <div className="database-player-action">
            {inClub && <span className="signed-player-label">YOUR SQUAD</span>}
            {!inClub && alreadyLoaned && <span className="signed-player-label">ON LOAN</span>}
            {!inClub && !alreadyLoaned && assignment && <button className="button button-small button-secondary" disabled>Assessing · {scoutingDays}d</button>}
            {!inClub && !alreadyLoaned && !assignment && !report && <button className="button button-small button-primary" onClick={() => commissionReport(listing.id)} disabled={club.balance < scoutingCost}>Scout · {MONEY(scoutingCost)}</button>}
            {!inClub && !alreadyLoaned && report && listing.age < 18 && <><button className="button button-small button-secondary" onClick={() => signAcademyPlayer(listing.id)} disabled={club.balance < registrationFee}>Invite · {MONEY(registrationFee)}</button>{canLoan && <button className="button button-small button-secondary" onClick={() => setLoanPlayerId(listing.id)}>Loan offer</button>}</>}
            {!inClub && !alreadyLoaned && report && listing.age >= 18 && <><label className="database-offer-label">{isFree ? "No fee" : "Your offer"}<input aria-label={`Offer for ${listing.name}`} className="offer-input" type="number" min="0" step="10000" disabled={isFree} value={isFree ? 0 : offers[listing.id] ?? value} onChange={(event) => setOffers({ ...offers, [listing.id]: event.target.value })} /></label><button className="button button-small button-secondary" disabled={Number(offers[listing.id] ?? (isFree ? 0 : value)) > club.transferBudget} onClick={() => makeOffer(listing.id)}>{isFree ? "Sign player" : "Make offer"}</button>{canLoan && <button className="button button-small button-secondary" onClick={() => setLoanPlayerId(listing.id)}>Loan offer</button>}</>}
          </div>
        </article>;
      })}{!listings.length && <div className="database-empty"><Search size={20} /><strong>No players match that search</strong><span>Try a name, position, club or country.</span></div>}</div>
      <div className="database-pagination"><span>Page {page + 1} · {filter === "Career clubs" ? "Players in this career world" : "Global player database"}</span><div><button className="button button-secondary button-small" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0}>Previous</button><button className="button button-secondary button-small" onClick={() => setPage((current) => current + 1)} disabled={!hasMore}>Next players</button></div></div>
      <div className="table-footer"><span>A scouting report is saved to your manager file and the club file that commissioned it.</span><span>Reports found · {knownReports}</span></div>
    </section>
    <ActiveLoans career={career} setCareer={setCareer} onMessage={(message) => setNotice(message)} />
    {transferPlayerId && <TransferNegotiation career={career} playerId={transferPlayerId} initialFee={listings.find((listing) => listing.id === transferPlayerId)?.clubId === null ? 0 : Number(offers[transferPlayerId] ?? getScoutingReport(career, transferPlayerId)?.marketValue ?? 0)} setCareer={setCareer} onClose={() => setTransferPlayerId(null)} onAccepted={(message) => { setTransferPlayerId(null); setNotice(message); }} />}
    {loanPlayerId && <PlayerLoanNegotiation career={career} playerId={loanPlayerId} direction="receive" setCareer={setCareer} onClose={() => setLoanPlayerId(null)} onAccepted={(message) => { setLoanPlayerId(null); setNotice(message); }} />}
  </>;
}

function Academy({ career, setCareer, onPlayerProfile, setView }: { career: Career; setCareer: (career: Career) => void; onPlayerProfile: (playerId: string) => void; setView: (view: View) => void }) {
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
  const signProspect = (player: Player) => {
    const result = signYouthPlayer(career, player.id);
    if (result === career) setNotice(`${player.name} is still available, but the club cannot cover the academy registration fee.`);
    else { setCareer(result); setNotice(`${player.name} signs a youth registration and joins ${club.name}.`); }
  };
  const scoutProspect = (player: Player) => {
    const result = scoutPlayer(career, player.id);
    if (result === career) setNotice(`The club needs ${MONEY(getScoutingCost(career, player.id))} available to complete the report.`);
    else { setCareer(result); setNotice(`${player.name} enters a five-day scouting assessment. Ratings unlock when the report is filed.`); }
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
    </section><aside className="panel academy-investment"><div className="card-heading"><div><p className="eyebrow">RECRUITMENT & FACILITIES</p><h2>Find the next prospect</h2></div><Search size={18} /></div><div className="academy-highlight"><strong>{candidates.length} unattached prospects</strong><p>Scout a prospect before their ability and potential are revealed. A young player begins on development registration; scholarship terms arrive at 16.</p></div>{candidates.length ? <div className="academy-candidate-list">{candidates.slice(0, 6).map((player) => { const fee = 8_000 + player.age * 3_500 + club.academyLevel * 4_000; const report = getScoutingReport(career, player.id); const assignment = getScoutingAssignment(career, player.id); const days = getScoutingDaysRemaining(career, player.id); const reportCost = getScoutingCost(career, player.id); return <article className="academy-candidate" key={player.id}><PlayerPortrait id={player.id} name={player.name} /><div><button className="player-profile-link" onClick={() => onPlayerProfile(player.id)}>{player.name}</button><small>{player.nationality ?? "English"} · Age {player.age} · {stageLabel(player)}</small><span>{report ? <>Potential <b>{report.potential}</b> · OVR {report.currentAbility}</> : assignment ? `Report due ${pageDate(assignment.availableDate)} · ${days} days remaining` : "Ability and potential unknown"}</span></div>{report ? <button className="button button-secondary button-small" onClick={() => signProspect(player)} disabled={club.balance < fee}>{MONEY(fee)} · Sign</button> : assignment ? <button className="button button-secondary button-small" disabled>Assessing · {days}d</button> : <button className="button button-primary button-small" onClick={() => scoutProspect(player)} disabled={club.balance < reportCost}>Scout · {MONEY(reportCost)}</button>}</article>; })}</div> : <div className="academy-empty academy-candidate-empty"><Check size={19} /><strong>Scout pool clear</strong><span>New youth prospects arrive each season.</span></div>}<div className="academy-invest-divider"><p className="eyebrow">ACADEMY STANDARD</p><div className="academy-invest-stat"><span>Next intake</span><strong>{2 + club.academyLevel} players</strong><small>Arrives at the end of each season · programme level {club.academyLevel}/20</small></div><button type="button" className="button button-secondary button-wide" onClick={() => setView("stadium")}><Building2 size={15} /> Manage academy investment in Club Facilities</button></div><p className="muted academy-footnote">Facility investment is managed in one place. Individual plans, age and match experience shape development.</p></aside></div>
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
  const brand = sponsor.trim().split(/\s+/).slice(0, 4).join(" ").toUpperCase().slice(0, 24) || club.shortName;
  const brandFontSize = brand.length > 18 ? 5.8 : brand.length > 13 ? 6.8 : 8.5;
  const brandWidth = Math.max(28, Math.min(100, brand.length * (brandFontSize * .57 + .45)));
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
    <text x="96" y="99" textAnchor="middle" fill="#fff" stroke="#101714" strokeOpacity=".24" strokeWidth=".55" fontSize={brandFontSize} textLength={brandWidth} lengthAdjust="spacingAndGlyphs" fontFamily="Arial,sans-serif" fontWeight="800" letterSpacing=".25">{brand}</text>
    <path d="M67 106h58" stroke={trim} strokeOpacity=".7" strokeWidth="1.2" />
    <text x="96" y="134" textAnchor="middle" fill="#fff" fontSize="7" fontFamily="Arial,sans-serif" fontWeight="700" letterSpacing="1.2">{club.shortName}</text>
    <text x="100" y="178" textAnchor="middle" fill="#c1cfc6" fontSize="7" fontFamily="monospace" letterSpacing="1.7">{edition.toUpperCase()} · {pattern.toUpperCase()}</text>
  </svg>;
}

function Clubhouse({ career, setCareer, setView }: { career: Career; setCareer: (career: Career) => void; setView: (view: View) => void }) {
  const club = getClub(career);
  const kitPatterns = career.kitPatterns ?? { home: "Engineered Grid" as const, away: "Clean Block" as const, third: "Pixel Fade" as const };
  const [notice, setNotice] = useState("");
  const [focusedKit, setFocusedKit] = useState<"home" | "away" | "third">("home");
  const designOpen = career.round > getSeasonWeekCount() && career.kitCollectionSeason !== career.season;
  const canEditKit = designOpen && !career.kitDesignReady;
  const shirtSponsor = (club.sponsorContracts ?? []).find((contract) => contract.slot === "shirt")?.company ?? club.sponsor;
  const [badgeDraft, setBadgeDraft] = useState<ClubBadge>(() => club.badge ? structuredClone(club.badge) : { shape: "shield", emblem: "star", colors: [...club.colors], foundingYear: club.foundedYear ?? 1900 });
  useEffect(() => { setBadgeDraft(club.badge ? structuredClone(club.badge) : { shape: "shield", emblem: "star", colors: [...club.colors], foundingYear: club.foundedYear ?? 1900 }); }, [club.id]);
  const badgeNeedsReview = JSON.stringify(badgeDraft) !== JSON.stringify(club.badge ?? { shape: "shield", emblem: "star", colors: club.colors, foundingYear: club.foundedYear ?? 1900 });
  const updateKit = (key: keyof Career["kit"], value: string) => { if (canEditKit) setCareer({ ...career, kit: { ...career.kit, [key]: value } }); };
  const updatePattern = (key: "home" | "away" | "third", value: NonNullable<Career["kitPatterns"]>["home"]) => { if (canEditKit) setCareer({ ...career, kitPatterns: { ...kitPatterns, [key]: value } }); };
  const submitKitDesigns = () => {
    if (!canEditKit) return;
    if (club.boardTrust < 30) { setNotice("The board has asked for stronger confidence before approving a new kit collection."); return; }
    setCareer({ ...career, kitDesignReady: true });
    setNotice("The board approved the home, away and third designs. Release the collection to the club superstore when ready.");
  };
  const updateBadge = (field: "shape" | "emblem" | "field" | "foundingYear", value: string | number) => {
    setBadgeDraft((current) => ({ ...current, [field]: field === "foundingYear" ? Number(value) : value } as ClubBadge));
  };
  const updateBadgeColor = (index: 0 | 1, value: string) => {
    setBadgeDraft((current) => { const colors: [string, string] = [...current.colors]; colors[index] = value; return { ...current, colors }; });
  };
  const submitBadgeForApproval = () => {
    if (!badgeNeedsReview) return;
    const next = structuredClone(career);
    const nextClub = getClub(next);
    if (nextClub.boardTrust < 40 || nextClub.supporterConfidence < 35) {
      setNotice("The board declined the badge proposal. It wants stronger confidence from the club and its supporters before changing the crest.");
      return;
    }
    const oldBadge = nextClub.badge;
    const majorChange = !oldBadge || oldBadge.shape !== badgeDraft.shape || oldBadge.emblem !== badgeDraft.emblem || oldBadge.field !== badgeDraft.field;
    nextClub.badge = structuredClone(badgeDraft);
    const supporterCost = majorChange ? 5 : 2;
    nextClub.supporterConfidence = Math.max(15, nextClub.supporterConfidence - supporterCost);
    nextClub.boardTrust = Math.max(15, nextClub.boardTrust - 1);
    setCareer(next);
    setNotice(`Board approved the new badge. Supporter confidence dipped by ${supporterCost} points while fans react to the identity change.`);
  };
  return <><SectionHeading kicker="CLUB DEVELOPMENT" title="Clubhouse" detail="Shape the club identity, grow young talent and strengthen your backroom." action={<span className="clubhouse-city"><MapPin size={15} /> {club.city}, {club.country}</span>} />
    <div className="clubhouse-grid"><section className="panel kit-panel"><div className="card-heading"><div><p className="eyebrow">CLUB IDENTITY</p><h2>Season kit designer</h2></div><Shirt size={18} /></div>{notice && <div className="inline-notice"><Check size={15} />{notice}<button type="button" aria-label="Dismiss message" onClick={() => setNotice("")}><X size={13} /></button></div>}<div className="kit-collection-board">{([['home', 'HOME'], ['away', 'AWAY'], ['third', 'THIRD']] as const).map(([key, label]) => <article className={`kit-card ${focusedKit === key ? "kit-card-focused" : ""}`} key={key}><button type="button" className="kit-art-button" onClick={() => setFocusedKit(key)} aria-label={`Focus ${label.toLowerCase()} shirt design`} aria-pressed={focusedKit === key}><KitShirt club={club} color={career.kit[key]} trim={career.kit.trim} pattern={kitPatterns[key]} sponsor={shirtSponsor} edition={label} /><span className="kit-edit-ribbon">{focusedKit === key ? "IN THE DESIGN ROOM" : "SELECT DESIGN"}</span></button><div className="kit-card-caption"><strong>{label} KIT</strong><small>{key === "home" ? "THE COLOURS OF HOME" : key === "away" ? "MADE FOR THE ROAD" : "A DIFFERENT SIDE"}</small></div><label className="field-label kit-pattern-label">Shirt identity<select className="field-select" value={kitPatterns[key]} disabled={!canEditKit} onChange={(event) => updatePattern(key, event.target.value as KitPattern)}>{KIT_PATTERNS.map((pattern) => <option key={pattern}>{pattern}</option>)}</select></label></article>)}</div>
      <div className="kit-room-status"><span className={designOpen ? "kit-room-open" : ""}><Shirt size={14} /> {designOpen ? "PRE-SEASON DESIGN WINDOW" : `SEASON ${career.season} COLLECTION`}</span><small>{designOpen ? career.kitDesignReady ? "Board approved. Release the new collection to the club superstore." : "Finish the home, away and third shirts, then submit designs to the board." : "Design opens after the final match. The current collection stays with the squad through this season."}</small></div><div className="kit-colors">{([['home', 'Home'], ['away', 'Away'], ['third', 'Third'], ['trim', 'Trim']] as const).map(([key, label]) => <label className="color-picker" key={key}><span className="color-swatch" style={{ background: career.kit[key] }} /><span>{label}</span><input aria-label={`${label} kit colour`} type="color" value={career.kit[key]} disabled={!canEditKit} onChange={(event) => updateKit(key, event.target.value)} /></label>)}</div><div className="kit-brand-note"><Lightbulb size={14} /><span>{designOpen ? `Choose the new ${club.name} shirts. ${shirtSponsor} is scaled to fit the chest.` : "The squad wears this season’s collection. The new design room opens after the final match."}</span></div>{designOpen && !career.kitDesignReady && <button type="button" className="button button-primary button-wide kit-launch" onClick={submitKitDesigns}>Submit designs to board <Building2 size={15} /></button>}{designOpen && career.kitDesignReady && <button type="button" className="button button-primary button-wide kit-launch" onClick={() => { const next = launchKitCollection(career); if (next !== career) { setCareer(next); setNotice("Collection released to the club superstore. " + MONEY(getClub(next).balance - club.balance) + " in sales revenue has been added."); } }}>Release to club superstore <Shirt size={15} /></button>}{career.kitCollectionSeason === career.season && <div className="kit-launched"><Check size={14} /> Collection launched. Kit sales have been added to club finances.</div>}<div className="badge-editor"><div><p className="eyebrow">CLUB BADGE</p><h3>Badge & colours</h3></div><div className="badge-editor-body"><ClubCrest club={{ ...club, badge: badgeDraft }} size="normal" /><label>Shape<select className="compact-select" value={badgeDraft.shape} onChange={(event) => updateBadge("shape", event.target.value)}>{CLUB_BADGE_SHAPES.map((shape) => <option key={shape}>{shape}</option>)}</select></label><label>Emblem<select className="compact-select" value={badgeDraft.emblem} onChange={(event) => updateBadge("emblem", event.target.value)}>{CLUB_BADGE_EMBLEMS.map((emblem) => <option key={emblem}>{emblem}</option>)}</select></label><label>Field<select className="compact-select" value={badgeDraft.field ?? "vertical"} onChange={(event) => updateBadge("field", event.target.value)}>{CLUB_BADGE_FIELDS.map((field) => <option key={field}>{field}</option>)}</select></label><label>Founded<input className="compact-input" type="number" min="1850" max="2026" value={badgeDraft.foundingYear} onChange={(event) => updateBadge("foundingYear", Number(event.target.value))} /></label><label className="badge-color-picker">Primary<input type="color" value={badgeDraft.colors[0]} onChange={(event) => updateBadgeColor(0, event.target.value)} /></label><label className="badge-color-picker">Secondary<input type="color" value={badgeDraft.colors[1]} onChange={(event) => updateBadgeColor(1, event.target.value)} /></label><label className="badge-color-picker">Accent<input aria-label="Badge accent colour" type="color" value={badgeDraft.accent ?? club.colors[1]} onChange={(event) => setBadgeDraft((current) => ({ ...current, accent: event.target.value }))} /></label></div><p className="badge-approval-note">Preview your crest here. The board reviews each identity change, and supporters may need time to accept it.</p><button type="button" className="button button-secondary button-small badge-submit" disabled={!badgeNeedsReview} onClick={submitBadgeForApproval}>{badgeNeedsReview ? "Present badge to board" : "No badge changes to submit"}</button><BadgeVariationPicker club={club} selected={badgeDraft} onSelect={setBadgeDraft} /></div></section><section className="panel facilities-panel facility-overview-panel"><div className="card-heading"><div><p className="eyebrow">CURRENT CLUB STANDARD</p><h2>Facilities overview</h2></div><Building2 size={18} /></div><p className="facility-overview-intro">Standards and investment progress at a glance. All facility spending and construction is managed from Club Facilities.</p><div className="facility-overview-list"><FacilityOverviewRow icon={Sparkles} name="Youth academy" detail={String(2 + club.academyLevel) + " players in the next annual intake"} level={club.academyLevel} /><FacilityOverviewRow icon={Dumbbell} name="Training & development" detail="First-team coaching and player growth" level={club.trainingLevel} /><FacilityOverviewRow icon={Search} name="Scouting network" detail="Recruitment coverage and report access" level={club.scoutLevel} /><FacilityOverviewRow icon={Building2} name="Stadium & campus" detail={club.stadium.capacity.toLocaleString("en-GB") + " seats · " + club.stadium.name} level={Math.max(club.stadium.carParkLevel ?? 0, club.stadium.superstoreLevel ?? 0, club.stadium.trainingCentreLevel ?? 0, 0)} maximum={3} /></div><div className="staff-note"><BriefcaseBusiness size={16} /><span><strong>Backroom staff</strong> · Head coach, assistant and club doctor are in place.</span><span className="staff-status">ACTIVE</span></div><button type="button" className="button button-primary button-wide" onClick={() => setView("stadium")}>Open Club Facilities <Building2 size={15} /></button></section></div></>;
}

function FacilityOverviewRow({ icon: Icon, name, detail, level, maximum = 20 }: { icon: LucideIcon; name: string; detail: string; level: number; maximum?: number }) {
  return <div className="facility-row"><span className="facility-icon"><Icon size={17} /></span><div className="facility-copy"><strong>{name}</strong><small>{detail}</small><span className="facility-level-track" role="progressbar" aria-label={`${name} level`} aria-valuemin={0} aria-valuemax={maximum} aria-valuenow={level}><i style={{ width: `${Math.min(100, level / maximum * 100)}%` }} /></span></div><div className="facility-level"><strong>{level}<small> / {maximum}</small></strong><small>LEVEL</small></div></div>;
}

function JobSearch({ career, setCareer }: { career: Career; setCareer: (career: Career) => void }) {
  const vacancies = career.clubs.filter((club) => club.id !== career.clubId && club.reputation <= career.managerReputation + 28).sort((a, b) => b.reputation - a.reputation).slice(0, 4);
  return <section className="job-search"><span className="job-icon"><BriefcaseBusiness size={23} /></span><div className="job-intro"><p className="eyebrow">A NEW CHAPTER</p><h1>Your next job starts here</h1><p>The board has made a decision. Your reputation still carries weight around the league.</p></div><div className="job-stats"><div><span>MANAGER REP</span><strong>{career.managerReputation}</strong></div><div><span>SEASONS MANAGED</span><strong>{career.history.length + 1}</strong></div></div><div className="vacancies-title"><p className="eyebrow">CURRENT VACANCIES</p><span>{vacancies.length} clubs interested</span></div><div className="vacancy-grid">{vacancies.map((club) => <article className="vacancy-card" key={club.id}><ClubCrest club={club} size="normal" /><div><strong>{club.name}</strong><small>{club.city} · Reputation {club.reputation}</small><span>Target · Top {club.targetPosition}</span></div><button className="button button-secondary button-small" onClick={() => setCareer(applyForJob(career, club.id))}>Apply for job</button></article>)}</div>{!vacancies.length && <p className="muted">There are no open positions at your reputation level right now. Improve your profile and try again later.</p>}</section>;
}

function managerSeasonLabel(season: number) {
  const start = 2026 + season - 1;
  return `${start}/${String(start + 1).slice(-2)}`;
}

function managerOrdinal(position: number) {
  const ending = position % 100;
  const suffix = ending >= 11 && ending <= 13 ? "th" : position % 10 === 1 ? "st" : position % 10 === 2 ? "nd" : position % 10 === 3 ? "rd" : "th";
  return `${position}${suffix}`;
}

function ManagerCareerPage({ career, setCareer, setView }: { career: Career; setCareer: (career: Career) => void; setView: (view: View) => void }) {
  const appointments = [...(career.managerCareerHistory ?? [])].reverse();
  const trackedAppointments = appointments.filter((appointment) => appointment.matches > 0);
  const matches = trackedAppointments.reduce((sum, appointment) => sum + appointment.matches, 0);
  const wins = trackedAppointments.reduce((sum, appointment) => sum + appointment.wins, 0);
  const titles = appointments.flatMap((appointment) => appointment.seasons).filter((season) => season.champion).length;
  const promotions = appointments.flatMap((appointment) => appointment.seasons).filter((season) => season.promoted).length;
  const vacancies = career.unemployed
    ? career.clubs.filter((club) => club.id !== career.clubId && club.reputation <= career.managerReputation + 28).sort((first, second) => second.reputation - first.reputation).slice(0, 4)
    : [];

  return <div className="manager-career-page">
    <SectionHeading kicker="THE MANAGER’S JOURNEY" title="Manager career" detail={career.unemployed ? "Choose your next appointment and carry your record into a new dressing room." : "Your appointments, results and league campaigns are saved with this career."} action={!career.unemployed ? <button className="button button-secondary" onClick={() => setView("overview")}><Home size={14} /> Return to club</button> : undefined} />
    <section className="manager-career-summary" aria-label="Manager career summary">
      <div><span>APPOINTMENTS</span><strong>{appointments.length}</strong><small>{appointments.filter((appointment) => appointment.endSeason === null).length ? "Current role included" : "Across this career"}</small></div>
      <div><span>MANAGED MATCHES</span><strong>{matches.toLocaleString("en-GB")}</strong><small>{wins.toLocaleString("en-GB")} wins recorded</small></div>
      <div><span>LEAGUE TITLES</span><strong>{titles}</strong><small>Season finishes saved</small></div>
      <div><span>PROMOTIONS</span><strong>{promotions}</strong><small>League movement earned</small></div>
    </section>
    {career.unemployed && <section className="job-search manager-vacancy-panel">
      <div className="manager-vacancy-heading"><div><p className="eyebrow">CURRENT VACANCIES</p><h2>Your next job starts here</h2><p>Clubs in this career world will consider your reputation and record.</p></div><div className="manager-reputation-chip"><span>MANAGER REP</span><strong>{career.managerReputation}</strong></div></div>
      <div className="vacancy-grid">{vacancies.map((club) => <article className="vacancy-card" key={club.id}><ClubCrest club={club} size="normal" /><div><strong>{club.name}</strong><small>{club.city} · {club.country}</small><span>Board target · Top {club.targetPosition}</span></div><button className="button button-secondary button-small" onClick={() => { setCareer(applyForJob(career, club.id)); setView("overview"); }}>Apply for job</button></article>)}</div>
      {!vacancies.length && <p className="muted">No clubs are considering an appointment at your current reputation. Your career record remains here.</p>}
    </section>}
    <section className="manager-appointments" aria-label="Career appointments">
      <div className="manager-appointments-heading"><div><p className="eyebrow">CAREER FILE</p><h2>Appointments & seasons</h2></div><span>{appointments.length} appointment{appointments.length === 1 ? "" : "s"}</span></div>
      {!appointments.length && <div className="manager-empty-state"><BriefcaseBusiness size={20} /><p>Your managerial record will appear here after your first season.</p></div>}
      {appointments.map((appointment: ManagerCareerAppointment) => {
        const club = career.clubs.find((item) => item.id === appointment.clubId);
        const active = appointment.endSeason === null;
        const displayLeagueId = active ? club?.leagueId ?? appointment.leagueId : appointment.leagueId;
        const displayLeagueName = [...ENGLISH_LEAGUES, ...WORLD_LEAGUES].find((league) => league.id === displayLeagueId)?.name ?? displayLeagueId;
        const tracked = appointment.matches > 0;
        const status = active ? "IN POST" : appointment.endReason === "Dismissed" ? "DISMISSED" : appointment.endReason === "Contract Expired" ? "CONTRACT ENDED" : appointment.endReason === "Moved" ? "MOVED ON" : "PAST ROLE";
        return <article className={`manager-appointment-card ${active ? "is-active" : ""}`} key={appointment.id}>
          <div className="manager-appointment-header">
            {club ? <ClubCrest club={club} size="normal" /> : <span className="manager-club-monogram">{appointment.clubName.slice(0, 2).toUpperCase()}</span>}
            <div className="manager-appointment-club"><p className="eyebrow">{appointment.country} · {displayLeagueName}</p><h3>{appointment.clubName}</h3><span>{appointment.city} · {managerSeasonLabel(appointment.startSeason)}{active ? "–Present" : `–${managerSeasonLabel(appointment.endSeason ?? appointment.startSeason)}`}</span></div>
            <span className={`manager-appointment-status ${active ? "current" : ""}`}>{status}</span>
          </div>
          {appointment.contract && <div className="manager-contract-detail"><span>MANAGER CONTRACT</span><strong>{MONEY(appointment.contract.weeklyWage)} / week <i>·</i> through {managerSeasonLabel(appointment.contract.endSeason)}</strong><small>Board objective · finish in the top {appointment.contract.targetPosition}</small></div>}
          <div className="manager-appointment-stats">
            <div><strong>{tracked ? appointment.matches : "—"}</strong><span>Matches</span></div>
            <div><strong>{tracked ? `${appointment.wins}–${appointment.draws}–${appointment.losses}` : "—"}</strong><span>W–D–L</span></div>
            <div><strong>{appointment.seasons.length}</strong><span>Seasons</span></div>
            <div><strong>{appointment.seasons.filter((season) => season.champion).length}</strong><span>Titles</span></div>
          </div>
          {appointment.seasons.length ? <div className="manager-season-records">{[...appointment.seasons].reverse().map((season) => <div className="manager-season-record" key={`${appointment.id}-${season.season}`}>
            <strong>{managerSeasonLabel(season.season)}</strong><span>{season.leagueName}</span><b>{managerOrdinal(season.position)} <small>/ {season.clubCount}</small></b><span>{season.recordTracked ? `${season.wins}W · ${season.draws}D · ${season.losses}L` : `${season.wins} wins recorded`} · {season.points} pts</span><span className="manager-season-honours">{season.champion ? "Champions" : season.promoted ? "Promoted" : season.relegated ? "Relegated" : ""}</span>
          </div>)}</div> : <p className="manager-appointment-note">Appointment begins in {managerSeasonLabel(appointment.startSeason)}. League record will be added when the season closes.</p>}
          {!active && appointment.endReason === "Dismissed" && <p className="manager-appointment-note manager-departure-note">Dismissed during {managerSeasonLabel(appointment.endSeason ?? appointment.startSeason)}{appointment.endRound ? ` · round ${appointment.endRound}` : ""}. The board pressure was driven by results, confidence and dressing-room conditions.</p>}
          {!active && appointment.endReason === "Contract Expired" && <p className="manager-appointment-note manager-departure-note">The board did not offer a new deal after its season review. The appointment ended in {managerSeasonLabel(appointment.endSeason ?? appointment.startSeason)}.</p>}
        </article>;
      })}
    </section>
  </div>;
}

function handleCareerNavigation(setView: (view: View) => void) {
  useEffect(() => {
    const listener = (event: Event) => {
      const target = (event as CustomEvent<string>).detail as View;
      if (NAV_ITEMS.some((item) => item.id === target)) setView(target);
    };
    document.addEventListener("the-club-view", listener);
    return () => document.removeEventListener("the-club-view", listener);
  }, [setView]);
}
