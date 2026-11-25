import { worldLeagueById } from "./world-leagues";

export type LeagueId = string;

export type LeagueDefinition = {
  id: LeagueId;
  name: string;
  country: string;
  tier: number;
  clubs: number;
  rounds: number;
  region: string;
  promotionPlaces: number;
  relegationPlaces: number;
  automaticPromotion: number;
  playoffPlaces: number;
  playoffLabel: string;
};

export const ENGLISH_LEAGUES: LeagueDefinition[] = [
  { id: "premier", name: "Premier League", country: "England", tier: 1, clubs: 20, rounds: 38, region: "National", promotionPlaces: 0, relegationPlaces: 3, automaticPromotion: 0, playoffPlaces: 0, playoffLabel: "" },
  { id: "championship", name: "Championship", country: "England", tier: 2, clubs: 24, rounds: 46, region: "National", promotionPlaces: 3, relegationPlaces: 3, automaticPromotion: 2, playoffPlaces: 6, playoffLabel: "3rd–8th · six-team play-offs" },
  { id: "league-one", name: "League One", country: "England", tier: 3, clubs: 24, rounds: 46, region: "National", promotionPlaces: 3, relegationPlaces: 4, automaticPromotion: 2, playoffPlaces: 4, playoffLabel: "3rd–6th · play-off places" },
  { id: "league-two", name: "League Two", country: "England", tier: 4, clubs: 24, rounds: 46, region: "National", promotionPlaces: 4, relegationPlaces: 2, automaticPromotion: 3, playoffPlaces: 4, playoffLabel: "4th–7th · play-off places" },
  { id: "national", name: "National League", country: "England", tier: 5, clubs: 24, rounds: 46, region: "National", promotionPlaces: 2, relegationPlaces: 4, automaticPromotion: 1, playoffPlaces: 6, playoffLabel: "2nd–7th · play-off places" },
  { id: "national-north", name: "National League North", country: "England", tier: 6, clubs: 24, rounds: 46, region: "North", promotionPlaces: 2, relegationPlaces: 4, automaticPromotion: 1, playoffPlaces: 6, playoffLabel: "2nd–7th · play-off places" },
  { id: "national-south", name: "National League South", country: "England", tier: 6, clubs: 24, rounds: 46, region: "South", promotionPlaces: 2, relegationPlaces: 4, automaticPromotion: 1, playoffPlaces: 6, playoffLabel: "2nd–7th · play-off places" },
];

export type ClubSeed = {
  name: string;
  short: string;
  city: string;
  reputation: number;
  colors: [string, string];
  capacity: number;
  leagueId: string;
  region: string;
  country?: string;
};

const LEGACY_SEEDS: ClubSeed[] = [
  { name: "Sunderland Wear", short: "NPA", city: "Sunderland", reputation: 76, colors: ["#13a38a", "#f2f5f3"], capacity: 55_000, leagueId: "premier", region: "North Coast" },
  { name: "Royal Reading", short: "HLC", city: "Reading", reputation: 73, colors: ["#293b73", "#d3b564"], capacity: 47_500, leagueId: "premier", region: "South East" },
  { name: "Stoke-on-Trent Clayworks", short: "KHF", city: "Stoke-on-Trent", reputation: 70, colors: ["#c94b43", "#f4eee6"], capacity: 40_000, leagueId: "premier", region: "East Midlands" },
  { name: "York Guild", short: "EMT", city: "York", reputation: 68, colors: ["#176e9e", "#e9f0f4"], capacity: 34_000, leagueId: "premier", region: "East Anglia" },
  { name: "Northampton Lace", short: "BRK", city: "Northampton", reputation: 66, colors: ["#cf6c35", "#f6f1e8"], capacity: 29_000, leagueId: "championship", region: "West Midlands" },
  { name: "Blackpool Promenade", short: "ALR", city: "Blackpool", reputation: 64, colors: ["#514383", "#f0e7ad"], capacity: 25_000, leagueId: "championship", region: "North West" },
  { name: "Plymouth Sound", short: "WPR", city: "Plymouth", reputation: 62, colors: ["#12a389", "#eef5f2"], capacity: 19_000, leagueId: "league-one", region: "South West" },
  { name: "Huddersfield Loom", short: "CDV", city: "Huddersfield", reputation: 60, colors: ["#728e41", "#e8e7d5"], capacity: 16_000, leagueId: "league-one", region: "Yorkshire" },
  { name: "The Manchester Exchange", short: "MCA", city: "Manchester", reputation: 72, colors: ["#b33b43", "#d8b647"], capacity: 24_600, leagueId: "league-two", region: "North West" },
  { name: "Birmingham Engine Works", short: "RCB", city: "Birmingham", reputation: 68, colors: ["#762d3b", "#e9e3d9"], capacity: 20_000, leagueId: "league-two", region: "South East" },
  { name: "Wickford Vale", short: "WKV", city: "Wickford", reputation: 54, colors: ["#37636e", "#efe9dc"], capacity: 9_000, leagueId: "national", region: "South Coast" },
  { name: "London Docklands", short: "SBU", city: "London", reputation: 52, colors: ["#d79837", "#263a4d"], capacity: 8_000, leagueId: "national-south", region: "South East" },
];

const ROOTS: Record<LeagueId, string[]> = {
  premier: ["Rugby", "Lichfield", "Evesham", "Witney", "London", "Manchester", "Liverpool", "Birmingham", "Leeds", "Sheffield", "Bristol", "Newcastle upon Tyne", "Nottingham", "Leicester", "Southampton", "Portsmouth", "Coventry", "Derby", "Norwich", "Cambridge"],
  championship: ["Worksop", "Ilkeston", "Bradford", "Huddersfield", "Blackburn", "Bolton", "Preston", "Wigan", "Stockport", "Doncaster", "Barnsley", "Rotherham", "Wakefield", "Hull", "Peterborough", "Ipswich", "Colchester", "Chelmsford", "Luton", "Watford", "Milton Keynes", "Maidstone", "Cheltenham", "Gloucester"],
  "league-one": ["Brierfield", "Farnworth", "Blackpool", "Burnley", "Rochdale", "Oldham", "Bury", "Chester", "Crewe", "Macclesfield", "Carlisle", "Darlington", "Hartlepool", "Middlesbrough", "Scarborough", "Harrogate", "Halifax", "Dewsbury", "Keighley", "Grimsby", "Scunthorpe", "Lincoln", "Grantham", "Mansfield"],
  "league-two": ["Colne", "Frodsham", "St Helens", "Warrington", "Runcorn", "Widnes", "Birkenhead", "Southport", "Fleetwood", "Morecambe", "Lancaster", "Kendal", "Barrow-in-Furness", "Workington", "Whitehaven", "Gateshead", "Bishop Auckland", "Stockton-on-Tees", "Redcar", "Whitby", "Bridlington", "Beverley", "Skipton", "Ripon"],
  national: ["Eastleigh", "Folkestone", "Dover", "Canterbury", "Ashford", "Hastings", "Eastbourne", "Worthing", "Crawley", "Horsham", "Guildford", "Woking", "Farnborough", "Basingstoke", "Winchester", "Andover", "Newbury", "Swindon", "Bath", "Taunton", "Yeovil", "Bridgwater", "Exeter", "Torquay"],
  "national-north": ["Accrington", "Altrincham", "Ashton-under-Lyne", "Atherton", "Bamber Bridge", "Blackrod", "Bollington", "Chorley", "Clitheroe", "Congleton", "Ellesmere Port", "Failsworth", "Garstang", "Ilkley", "Knaresborough", "Knutsford", "Leigh", "Nelson", "Ossett", "Pontefract", "Prescot", "Rawtenstall", "Stalybridge", "Todmorden"],
  "national-south": ["Rayleigh", "Barking", "Braintree", "Bracknell", "Brentwood", "Brighton", "Bognor Regis", "Chatham", "Chichester", "Dartford", "Dunstable", "Epping", "Gillingham", "Gravesend", "Harlow", "Hertford", "Hemel Hempstead", "High Wycombe", "Maidenhead", "Marlow", "Romford", "Southend-on-Sea", "St Albans", "Stevenage"],
};

// Keep generated club IDs stable for existing saves while replacing the old
// invented English place names with real towns and cities.
const STABLE_ID_ROOTS: Record<LeagueId, string[]> = {
  premier: ["Arden", "Beacon Cross", "Bellmere", "Calder", "Crown Fell", "Dunley", "Eastmere", "Fallow", "Glenhaven", "High Barrow", "Inverleigh", "Kings", "Longridge", "Merefield", "Northgate", "Oakbridge", "Raven Mills", "Silverton", "Tern Bay", "Wold End"],
  championship: ["Alder Downs", "Amber Quay", "Bramble", "Charnwood", "Clayburn", "Crowley", "Dale End", "Deepwater", "Elder", "Fenwick", "Fox Hollow", "Hartley", "Hawthorn", "Iron Moor", "Juniper Gate", "Larkston", "Marshfield", "Old Quay", "Rookhaven", "Stoneleigh", "Thornby", "Valeham", "Willowbank", "Yardley Green"],
  "league-one": ["Ashbarrow", "Brierley", "Calderby", "Cinderford", "Cleeham", "Crossfell", "Dunbarrow", "East Bridge", "Elmstead", "Farring", "Firtham", "Gallowmere", "Greyhaven", "Harebridge", "Ironwell", "Kirkstead", "Little Marlow", "Moorleigh", "Northwick", "Old Harth", "Pinehurst", "Redmarsh", "Rillford", "Sableton"],
  "league-two": ["Appleby", "Ashdown", "Belltower", "Brackenby", "Cedarfield", "Charnley", "Coal Harbour", "Crowcombe", "Deepwell", "Eastwell", "Frostley", "Glenmoor", "Harbour End", "Havenby", "Kingsmere", "Long Quarry", "Mallowick", "Northleigh", "Oldenham", "Ravenby", "Riverstead", "Stonehaven", "Wickmere", "Woodley"],
  national: ["Aldermere", "Bramblewick", "Cairnford", "Cloverham", "Dalehurst", "Dunhaven", "Eastcombe", "Fellbridge", "Ferrywell", "Gorseby", "Hartswell", "Hazelwick", "Longmere", "Millfield", "Moorcombe", "Ridgehaven", "Rookfield", "Sandhurst", "Southmere", "Thistledown", "Westcombe", "Wicklow", "Willowmere", "Yewford"],
  "national-north": ["Aldershaw", "Ashbank", "Blackthorn", "Brackenfell", "Caldershaw", "Chapelwick", "Cragmere", "Duncombe", "Fellside", "Frostwick", "Glenridding", "Greyfell", "Kirkbridge", "Moorhead", "Northfell", "Oakworth", "Redwick", "Ribbleton", "Rookshaw", "Stonebeck", "Thornwick", "Westfell", "Whitby Vale", "Wrenmoor"],
  "national-south": ["Amberwick", "Applecombe", "Ashleigh", "Bellport", "Brambleton", "Broadwick", "Chilford", "Cranmere", "Elmbridge", "Fairwick", "Fernhurst", "Gorsefield", "Havenleigh", "Kingscombe", "Larkspur", "Maplehurst", "Oakleigh", "Pinewick", "Redhaven", "Sandcombe", "Southwick", "Tideford", "Westleigh", "Wychmere"],
};

const SUFFIXES: Record<string, string[]> = {
  north: ["Foundry", "Marliners", "Steelworks", "Colliery", "Railworks", "Vale Forge", "Beacon", "Tide", "Crows", "Mills", "Quays", "Crag", "Pioneers", "Mettle", "Signal", "Miners"],
  south: ["Harbourlights", "Downs", "Chalk", "Seafarers", "Greenway", "Spitfire", "Marsh", "Tide", "Phoenix", "Compass", "Harriers", "Lancers", "Beacon", "Pilot", "Dockers", "Spires"],
  midlands: ["Foundry", "Forges", "Engine Works", "Canal Works", "Kiln", "Mettle", "Railworks", "Mills", "Ravens", "Ironworks", "Quarry", "Copperworks", "Weavers", "Founders", "Crown Works", "Pottery"],
  london: ["Metropolitan", "Thameside", "Docklands", "Signal", "Aviators", "Crossways", "Railworks", "Lancers", "Marshlight", "Foundry", "Pioneers", "Harbour", "Vanguard", "Canal Works", "Civic", "Comets"],
  east: ["Sailmakers", "Estuary", "Mariners", "Beacon", "Windmill", "Lowlands", "Harbourlight", "Mills", "Saltworks", "Shipwrights", "Tide", "Seafarers", "Fenland", "Compass", "Weavers", "Coastguard"],
  west: ["Seafarers", "Railworks", "Harbourlight", "Quarry", "Marliners", "Marsh", "Foundry", "Copperworks", "Beacon", "Shipwrights", "Tide", "Mills", "Weavers", "Forges", "Dockers", "Lighthouse"],
};

const ENGLISH_NAME_FORMS = [
  "{city} {suffix}",
  "The {suffix} of {city}",
  "{city} & District {suffix}",
  "Sporting Club {city} {suffix}",
  "{city} {suffix} Association",
  "{suffix} of {city}",
  "The {city} {suffix}",
  "{city} Sporting {suffix}",
  "Association of {city} {suffix}",
  "{city} {suffix} Athletic Club",
];

function englishClubName(city: string, suffix: string, index: number, leagueIndex: number) {
  const form = ENGLISH_NAME_FORMS[(index + leagueIndex * 3) % ENGLISH_NAME_FORMS.length];
  return form.replace("{city}", city).replace("{suffix}", suffix);
}

const PALETTES: [string, string][] = [
  ["#178b79", "#e8e5ce"], ["#7b3347", "#ebc96f"], ["#2b4d78", "#f1f0e9"], ["#b45f34", "#e7d9b9"],
  ["#426e48", "#eee5c9"], ["#6a4d8e", "#decf83"], ["#557886", "#f1e9de"], ["#8f3d39", "#e3ba60"],
  ["#3d5262", "#d4bd7a"], ["#bb8d32", "#27394c"], ["#547752", "#e1eee0"], ["#514b78", "#e2d9b3"],
];

function styleFor(region: string) {
  const value = region.toLowerCase();
  if (value.includes("midland") || value.includes("foundry")) return "midlands";
  if (value.includes("anglia") || value.includes("east") || value.includes("yorkshire")) return "east";
  if (value.includes("west") && (value.includes("midland") || value.includes("country"))) return "west";
  if (value.includes("london") || value.includes("south east")) return "london";
  if (value.includes("south") || value.includes("coast")) return "south";
  if (value.includes("west") || value.includes("wales")) return "west";
  return "north";
}

function regionFor(leagueId: LeagueId, index: number) {
  if (leagueId === "national-north") return ["North West", "Yorkshire", "North East", "North Midlands"][index % 4];
  if (leagueId === "national-south") return ["South East", "South Coast", "London", "South West"][index % 4];
  const pools: Record<Exclude<LeagueId, "national-north" | "national-south">, string[]> = {
    premier: ["North West", "London", "East Midlands", "East Anglia", "North East", "South Coast", "West Midlands", "South West"],
    championship: ["Yorkshire", "North West", "West Midlands", "South East", "East Anglia", "South Coast", "North East", "South West"],
    "league-one": ["North West", "Yorkshire", "East Midlands", "South West", "South East", "West Midlands", "North East", "East Anglia"],
    "league-two": ["North East", "South West", "East Anglia", "Yorkshire", "South East", "North West", "West Midlands", "South Coast"],
    national: ["North West", "South East", "Yorkshire", "South Coast", "East Midlands", "South West", "North East", "London"],
  };
  return pools[leagueId][index % pools[leagueId].length];
}

function colorFor(index: number, leagueIndex: number): [string, string] {
  return PALETTES[(index * 7 + leagueIndex * 3) % PALETTES.length];
}

function makeClubSeeds(): ClubSeed[] {
  const byLeague = new Map(ENGLISH_LEAGUES.map((league) => [league.id, [] as ClubSeed[]]));
  for (const seed of LEGACY_SEEDS) byLeague.get(seed.leagueId)!.push(seed);
  const usedCities = new Set(LEGACY_SEEDS.map((seed) => seed.city.toLowerCase()));
  const usedNames = new Set(LEGACY_SEEDS.map((seed) => seed.name.toLowerCase()));
  const clubs: ClubSeed[] = [];
  for (const [leagueIndex, league] of ENGLISH_LEAGUES.entries()) {
    const roots = ROOTS[league.id];
    const tierSeeds = byLeague.get(league.id)!;
    const styles = new Set<string>();
    for (let index = tierSeeds.length; index < league.clubs; index += 1) {
      const globalIndex = clubs.length + tierSeeds.length;
      let city = "";
      for (let attempt = 0; attempt < roots.length * 3; attempt += 1) {
        const root = roots[(index + attempt) % roots.length];
        const proposed = root;
        if (!usedCities.has(proposed.toLowerCase())) { city = proposed; break; }
      }
      if (!city) city = `${roots[index % roots.length]} ${index + 1}`;
      usedCities.add(city.toLowerCase());
      const region = regionFor(league.id, index - tierSeeds.length);
      const styleKey = styleFor(region);
      const suffixes = SUFFIXES[styleKey];
      let suffix = "Town";
      let name = "";
      for (let offset = 0; offset < suffixes.length; offset += 1) {
        const candidate = suffixes[(index + offset + leagueIndex) % suffixes.length];
        const candidateName = englishClubName(city, candidate, index, leagueIndex);
        if (!usedNames.has(candidateName.toLowerCase()) && !styles.has(candidateName.toLowerCase())) { suffix = candidate; name = candidateName; break; }
      }
      if (!name) name = englishClubName(city, suffix, index, leagueIndex);
      usedNames.add(name.toLowerCase());
      styles.add(name.toLowerCase());
      const areaRep = [79, 63, 51, 41, 33, 28, 28][leagueIndex];
      const generatedIndex = index - tierSeeds.length;
      const reputation = Math.max(20, Math.min(90, areaRep + Math.round((league.clubs - 1 - generatedIndex) * (leagueIndex === 0 ? 0.55 : 0.35)) - Math.round((index % 5) * 0.9)));
      const stableRoot = STABLE_ID_ROOTS[league.id]?.[index] ?? city;
      const base = [...stableRoot.toUpperCase().replace(/[^A-Z]/g, "")].slice(0, 3).join("");
      const short = `${base || "ENG"}${String(globalIndex + 1).padStart(3, "0")}`;
      // Smaller clubs tend to play at compact grounds; reputation creates a
      // realistic spread, while two long-established lower-league giants are
      // kept as explicit legacy exceptions above.
      const capacityBase = [8_000, 5_200, 4_000, 3_400, 2_900, 2_500, 2_500][leagueIndex];
      const capacityPerReputation = [400, 270, 150, 82, 48, 34, 34][leagueIndex];
      const localVariation = ((globalIndex % 9) - 4) * 350;
      const capacity = Math.max(3_000, Math.round((capacityBase + reputation * capacityPerReputation + localVariation) / 100) * 100);
      tierSeeds.push({ name, short, city, reputation, colors: colorFor(globalIndex, leagueIndex), capacity, leagueId: league.id, region });
    }
    for (const [index, seed] of tierSeeds.entries()) {
      if (!seed.region) seed.region = regionFor(league.id, index);
      clubs.push(seed);
    }
  }
  return clubs;
}

export const ENGLISH_CLUB_SEEDS = makeClubSeeds();

export function leagueDefinition(id: string | undefined) {
  return ENGLISH_LEAGUES.find((league) => league.id === id) ?? worldLeagueById(id ?? "") ?? ENGLISH_LEAGUES[0];
}
