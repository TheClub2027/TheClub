# The Club — Unified 50-area roadmap

This is the working implementation tracker for the 30-section Master Game Development Specification plus the 20 additional systems requested on 24 November 2026. Each numbered area stays separate so none of the requested scope disappears into a broad “done” label.

**Status meanings:** `Built` means the main system exists and has relevant automated coverage; `Partial` means useful foundations exist but important behavior or verification remains; `Planned` means the specific system is not implemented yet; `In progress` means the current branch is actively implementing it. A page or generated record alone does not count as a finished simulation feature.

**Current count (25 November 2026):** 0 Built · 44 Partial · 2 In progress · 4 Planned. This counts area statuses, not an overall completion percentage: most areas contain several large systems and remain incomplete.

## Master specification — areas 1–30

| # | Area | Status | Remaining work / verification |
|---:|---|---|---|
| 1 | Project objective and playable career | **Partial** | First-season career loop is playable; long-career balance and complete acceptance coverage remain. |
| 2 | Living football universe | **Partial** | Simulated clubs now change managers when club pressure crosses private board limits; add richer world events and inactive-league simulation. |
| 3 | Worldwide clubs and leagues | **Partial** | 200 country entries seed 199 foreign top flights and second divisions (398 divisions total). Club naming now varies deterministically by club and city, so a country does not reuse one form across every town; Lille, Lyon and Nantes each have a bank of nine distinct local identities. The English seven-tier pyramid keeps its real town/city anchors and varied naming forms. Deeper pyramids, regulations and independent world simulation remain. |
| 4 | Worldwide player database | **Partial** | 200,000 deterministic players (115,000 first-team, 70,000 academy and 15,000 free agents) and scouting visibility exist. Career rosters now use a tier/reputation-aware domestic and regional nationality mix; academy intake is strongly local and unattached players remain globally sourced. Improve long-term careers, contracts and verification at scale. |
| 5 | Youth academies | **Partial** | Ages 5–20, intake, training focus and promotion exist. Focused skill gains now accrue across matchweeks and survive saves; add education, safeguarding, recruitment and competitions. |
| 6 | Training centre | **Partial** | Training focus now develops matching attributes over time, with age, coaching and upgraded facilities affecting progress. Player dossiers show progress to the next skill rating and permanent gains; add schedules, exercises and coach feedback. |
| 7 | Tactics studio | **Partial** | Formation, player positions, roles, sliders and a counter-specific rehearsal lab exist. Role choice is attribute-aware, positional mismatches are blocked, and role fluency improves through match minutes and tactical coaching; add deeper role instructions and player-level coaching feedback. |
| 8 | 2D match engine | **Partial** | Added selectable Instant Result, Highlights and Full Management flows. Full Management advances a saved match in six 15-minute segments, with a live score, pitch events, stats and timeline; managers set the halftime instruction, queue valid substitutions and confirm full-time. Half-time plans now change attacking and defensive strength separately in the shared match model, with the selected trade-off previewed before kickoff and at half-time. Live second-yellow dismissals remove a player from ratings and substitution choices, reduce the side's strength, appear in the report and create a match ban. Season booking thresholds also suspend players, and bans clear only after the club plays its next fixture. Replay, stoppage time and richer tactical cause-and-effect remain. |
| 9 | Player personalities and relationships | **Partial** | Stable personalities and mentor/friend/rival links now affect the selected XI; add evolving friendships, disputes and off-field events. |
| 10 | Club governance and boardroom politics | **Partial** | Board members now vote on measurable club projects according to role, ability and trust; plans are reviewed at season end with trust/pressure consequences. Add member agendas, meeting choices and ownership decisions. |
| 11 | Responsibilities page | **Partial** | Six operational responsibilities can be delegated to eligible staff or kept manager-led; ability and overlapping workloads alter the related match, development, scouting, sponsor and supporter systems. Add staff reviews, outcome history and board accountability. |
| 12 | Manager career system | **Partial** | A saved Career File tracks appointments, managed W/D/L, season finishes, titles and promotions. Dismissal closes the appointment and pauses progression until the manager accepts a vacancy; taking a new role starts a fresh record. Manager employment contracts now include weekly pay, term and a league-position target; payroll includes the manager wage and renewals depend on results, board trust and pressure. Legacy saves are migrated. Interviews and movement beyond simulated leagues remain. |
| 13 | Global manager job security | **Partial** | Pressure combines form, expectations, trust, supporters, dressing-room strain and player rapport for AI boards; refine long-run thresholds and inactive-league job changes. |
| 14 | Transfers and recruitment | **Partial** | Search, scouting, AI seasonal recruitment, manager negotiations and actionable incoming club bids now work. Formal bids arrive during active windows, can be accepted/rejected from the manager inbox, and accepted sales update squad cover, finances, player history and transfer records. Loans register players with a borrowing club, split matchday wages and fees, support recall/early return, and auto-return at expiry. Add agents, clauses, registration rules, broader transfer policies and long-season market validation. |
| 15 | Realistic football rules | **Partial** | League fixtures and promotion/relegation work across England's pyramid and the two seeded divisions in other countries; add country-specific registrations, cups and competition regulations. |
| 16 | International football | **Planned** | Career player nationality and birthplace now use the represented world-country model, which prepares reliable player pools. National-team selection, caps, international windows and tournaments are not implemented yet. |
| 17 | Football media and news | **Partial** | Sourced stories now show outlet confidence; unconfirmed contract-based transfer rumours and saved season-award coverage appear in the newsroom. Pre-match press questions are answered from the manager inbox and change press pressure, player rapport, morale and the team talk. Add world news, fact-check outcomes, journalist relationships and pundit features. |
| 18 | Manager's office and AI assistant | **Partial** | The manager's desk prioritizes data-backed advice for injuries, board pressure, opposition preparation, expiring contracts, cash flow and academy opportunities. A persistent, filterable inbox brings club news, match analysis, pre-match press decisions, transfer bids, contract alerts, completed scouting reports and sponsor proposals together with direct navigation and read/unread state. Add weekly conversations, assistant memory and broader staff briefings. |
| 19 | Stadium Architect | **Partial** | 360° stadium, clickable stands, live previews, varied visible seat rows, braced scoreboard, club-specific neighborhoods, and campus placement exist. Site-priced north/east/south/west plots can now be previewed, staged for a board-funded acquisition, visibly cleared/fenced during construction, and used for facility placement after title transfers. A Campus camera frames the expanded ground. Add unrestricted demolition, more granular street/road design and end-to-end visual acceptance. |
| 20 | Club finances and sponsorships | **Partial** | Budgets, wages, sponsors and stadium income exist; add cash-flow forecasts, negotiations, debt risks and long-term economics. |
| 21 | Kit designer | **Partial** | Editable shirt styles, colours, sponsor fit and season launch exist; expand design control and confirm mobile usability. |
| 22 | Staff and club operations | **Partial** | 75,000 staff records, hiring, release, role eligibility and six live delegation assignments exist; staff ability affects club outcomes. Add staff progression, careers, contracts and operational decisions. |
| 23 | Permanent football history | **Partial** | Club Archive aggregates player appearance, goal, assist and clean-sheet records, club-specific league finishes, honours, transfer records and milestones; new season records retain league and full table details. Add worldwide historical tables and searchable archives across the simulated clubs. |
| 24 | Daily calendar and game progression | **Partial** | Careers store a current weekday date; the monthly calendar shows first-team fixtures and manager leave. Advancement moves to the next scheduled world matchday or an earlier return date. The board approves/refuses 3/7/14-day leave from trust and pressure, the assistant selects the team during leave, and severe injury, high-pressure press or dismissal interrupts it. Incoming formal bids are urgent saved alerts; normal advancement and match launch pause until the manager accepts or rejects the offer. If a bid arrives while on leave, its urgent news interrupts leave. Transfer windows, international breaks, daily training and long-save soak coverage remain. |
| 25 | Online game and subscriptions | **Partial** | Account-scoped Supabase career library exists; verify live sync and decide subscription scope before implementing billing. |
| 26 | Game interface and user experience | **Partial** | Responsive charcoal/teal interface exists; continue visual refinement and desktop/tablet/mobile acceptance. |
| 27 | Technical architecture | **Partial** | Next.js, TypeScript, Supabase and local save architecture exist; improve service boundaries and production observability. |
| 28 | Development priorities | **In progress** | This roadmap sequences the requested systems into testable increments. |
| 29 | Quality assurance and acceptance tests | **Partial** | Typecheck, unit tests and production build exist; add multi-season, cloud and browser acceptance coverage. |
| 30 | Instructions to Codex | **In progress** | Implement requirements in small, tested increments and keep this status record evidence-based. |

## Additional systems — areas 31–50

| # | Area | Status | Intended simulation behavior |
|---:|---|---|---|
| 31 | Football DNA and club identity | **Partial** | Distinct saved club profiles now affect tactical strength, scouting costs, youth potential, transfer allocations and supporter frustration; add preferred-manager fit and browser acceptance. |
| 32 | Intelligent player brains | **Partial** | Match minutes, stamina and high-press intensity now drive persistent player condition; fatigue changes match strength and AI/assistant selection, low condition raises injury risk, and Rest focus improves recovery. Add broader player decisions driven by role, tactical context and opportunities. |
| 33 | Tactical laboratory | **Partial** | The manager can rehearse one of three counters with assistant feedback and a one-match effect; half-time instructions now expose different attack/defence trade-offs and reward tactical preparation for pressing, width, shape or possession. Add player learning, scenario drills and broader situations. |
| 34 | Intelligent opposition preparation | **Partial** | The next opponent's saved tactical identity now informs a suggested rehearsal; add observed match patterns, exploitable weaknesses and adaptive managers. |
| 35 | Player leadership and dressing-room politics | **Partial** | Saved captain/vice-captain groups, appointments, tension, social links, match cohesion and captain-departure consequences now work; add wider factions, player-led incidents and richer responses to promises/playing time. |
| 36 | Managerial promises and accountability | **Partial** | Board finish, player-start and supporter win-run promises now have deadlines, tracked progress, outcomes, news and trust/pressure effects; add broader promises, renegotiation and meeting conversations. |
| 37 | Five-year club project planner | **Partial** | Four 3–5 season plans track league finishes, academy levels, stadium capacity or cash balance; board votes are stored and annual reviews change club trust and managerial pressure. Add funding decisions, mid-plan revisions and richer project portfolios. |
| 38 | Football family generations | **Planned** | Carry football families across seasons, including former players entering staff and management. |
| 39 | Coaching family trees | **Planned** | Track assistant-manager mentorship and the spread of a manager's tactical ideas. |
| 40 | Intelligent player contracts | **Partial** | Saved player role promises and negotiations now price salary, term, role, signing bonus, rapport and personality; declined offers affect morale/rapport and trigger a three-matchday cooldown. Role promises influence selection morale. Add loyalty/location priorities, agents and clauses. |
| 41 | Dynamic football economies | **Partial** | Budgets and transfers exist; model league income shifts, investment and financial trends over decades. |
| 42 | Supporter generations | **Partial** | Confidence and attendance exist; add supporter groups, generation changes, ticket sensitivity and community growth. |
| 43 | Football ownership simulator career path | **Planned** | Add a separate ownership career with acquisition, investment, governance and club outcomes. |
| 44 | Interactive set-piece designer | **Partial** | Saved corner delivery/target, free-kick and penalty takers, and defensive corner shape now influence modelled xG in Instant Result and Live Match. Add player runs, blockers, routine training and tactical adaptation. |
| 45 | Intelligent commentary and match storytelling | **Partial** | Reports now recognise rivalries, first-team debuts, former-club goals and appearance milestones; add broader match narrative and world-media coverage. |
| 46 | Player adaptability and tactical creativity | **Partial** | Individual tactical-role fluency responds to attribute fit, match minutes and tactical role work; model player-specific creative decisions and wider tactical learning. |
| 47 | Club culture and professional standards | **Partial** | Football DNA now connects tactics, recruitment, academy intake, spending and supporter response; professional standards and staff-led culture remain. |
| 48 | Football infrastructure and local development | **Partial** | Stadium campus, academy and training assets exist; add regional schools, affiliates and grassroots pathways. |
| 49 | Historical football documentary | **Partial** | Match archive, player records, awards, transfers, club milestones and season results feed the Club Archive; generate evidence-based season documentaries and archived features. |
| 50 | Alternative career timelines | **Partial** | Multiple save slots exist; add explicit branch-from-save timelines with clear lineage and isolated worlds. |

## Current implementation slice

**Campus land acquisition and expansion** adds four priced neighboring plots around each stadium. Cost varies with neighborhood and club scale. Staging a parcel immediately shows the cleared, fenced plot in the 3D preview; board approval starts construction, while owned land transfers only when the project finishes. Facility placement checks that a building footprint stays inside club-owned campus or an acquired parcel. The parcel geometry is shared between scene rendering and placement validation, ownership survives save normalization, and legacy careers default to no acquired land. A Campus camera view helps frame the enlarged ground. Verification: **93 automated tests passed**, focused acquisition/save tests passed, typecheck passed, production build passed, and both local preview endpoints returned HTTP 200. Browser pointer and visual acceptance remains unverified.

**Manager communication and incoming approaches** adds a dedicated inbox to the career navigation. It combines persistent club news with time-sensitive opposition analysis, press invitations, expiring contracts, scouting results and sponsor proposals. Managers can answer a pre-match question once or resolve an incoming transfer bid; an accepted bid updates player registration/history, lineup cover, budgets, finances and the permanent transfer log. Bids are generated during transfer windows, create a single urgent alert, and pause calendar or matchday actions until resolved. The full **88-test** suite, typecheck, production build and local HTTP preview pass; automated browser interaction remains unverified, and this partial release does not complete the 50-area roadmap. The prior **set-piece design** slice is implemented: the selected XI's corner, free-kick, penalty and defensive assignments influence Quick Result and Live Match.

**Manager career file and new appointments** stores a record for every club appointment, with managed matches and results, season league/position/points, titles, promotions and dismissal or departure reason. Dismissed managers cannot advance the calendar or begin a season until they accept an available job; taking a role starts a separate appointment and resets club-specific preparation, promises and rapport. Older saves reconstruct a career file from their recorded history. Verification: **96 automated tests passed**, typecheck passed, isolated production build passed with one worker to avoid a Windows/Dropbox worker lock, and the local development page returned HTTP 200. Browser click-through of the new career page remains unverified.

**Country-aware career squads** assigns senior players a domestic or regional nationality based on their club country, league tier and reputation. Youth teams and annual intakes are predominantly local; unattached players remain drawn from all countries. The focused Japan career regression verifies the senior import mix, local academy origin and valid world-country nationality IDs. National teams and international competition simulation remain planned.

Previous linked slice — **Weekday calendar and manager leave**:

- Career saves keep the current weekday date; the monthly planner shows matchdays, selected-day details and holiday ranges. Advance moves to the next world matchday or an earlier holiday return date.
- The board can approve or refuse 3/7/14-day leave based on trust and pressure. The assistant handles team selection; urgent injury, press or dismissal news interrupts leave.
- The full 80-test suite, typecheck and production build passed for that increment. Browser visual acceptance remains pending.

Previous linked slice — **Board governance and delegated operations**:

- The Staff & Board workspace supports 3–5 season plans for league performance, academy growth, stadium expansion or financial resilience, with director votes and annual reviews using actual career data.
- Condition-based agendas respond to financial strain, poor form/press pressure, supporter frustration, dressing-room unrest and periodic academy needs. The manager chooses between two options with recorded director votes; decisions alter finances, budgets, facilities, pressure, morale or player rapport.
- Six operational responsibilities remain selectable; staff ability influences match preparation, development, scouting, sponsorship and supporter confidence. Legacy saves receive defaults.
- The full 55-test suite, TypeScript check, production build and local HTTP 200 smoke check passed for that increment.

Previous linked slice — **Dressing-room leadership and squad chemistry**:

- Each generated player has a stable personality and age-adjusted leadership score; each club starts with a captain and vice-captain.
- Mentor, friendship and rivalry links are saved to the career, created for new squads, and refreshed after transfers and season intakes.
- The Squad workspace supports captain and vice-captain appointments and shows unity, tension, active XI connections and match influence.
- Leadership, selected player connections and dressing-room tension affect match strength. Results change tension, which also feeds board pressure.
- If a captain leaves, the former club promotes a replacement, raises tension and publishes a club news item; legacy saves reconstruct missing records.
- On the Overview, the manager can promise the board a league finish, a player eight starts, or supporters two consecutive wins. Progress and deadlines are tracked; delivery affects trust/rapport, pressure and news, and board promises resolve at season review.
- Automated coverage, typecheck and production build pass. Browser visual acceptance remains outstanding.

Previous linked slice — **Football DNA and match preparation**:

- New clubs receive stable, varied identity profiles; old career saves receive a compatible default profile.
- The active tactical style's fit influences the managed club's match strength.
- Winning or drawing while changing style improves acceptance; poor results while badly misaligned add supporter frustration.
- Recruitment philosophy changes scouting report costs, academy tradition changes new intake potential, and spending policy changes the seasonal transfer allocation.
- The overview explains the club's profile and current tactical acceptance without exposing hidden board dismissal thresholds.
- The tactics screen reads the upcoming opponent's tactical identity, offers three counter plans with assistant insight, and applies the selected rehearsal to that fixture only.
- Match reports add verified context for rivalries, senior debuts, a scorer facing a former club and first-team appearance milestones.
- Automated coverage, typecheck and production build pass; browser visual acceptance and preferred-manager fit remain open before this area can be marked built.

The full current implementation and verification baseline is recorded in [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md). No roadmap area is marked complete based only on a mockup.
