import type { LeagueDefinition } from "./league-pyramid";

export type WorldContinent = "Europe" | "Asia" | "Africa" | "North America" | "South America" | "Oceania";
export type WorldCountry = { country: string; continent: WorldContinent };
export type WorldLeagueDefinition = LeagueDefinition & { continent: WorldContinent };
export type WorldClubSeed = {
  name: string;
  short: string;
  city: string;
  reputation: number;
  colors: [string, string];
  capacity: number;
  leagueId: string;
  region: string;
  country: string;
  continent: WorldContinent;
};

const COUNTRY_GROUPS: Record<WorldContinent, string> = {
  Europe: "Albania|Andorra|Armenia|Austria|Azerbaijan|Belarus|Belgium|Bosnia and Herzegovina|Bulgaria|Croatia|Cyprus|Czechia|Denmark|Estonia|Finland|France|Georgia|Germany|Greece|Hungary|Iceland|Ireland|Italy|Kosovo|Latvia|Liechtenstein|Lithuania|Luxembourg|Malta|Moldova|Monaco|Montenegro|Netherlands|North Macedonia|Northern Ireland|Norway|Poland|Portugal|Romania|Russia|San Marino|Scotland|Serbia|Slovakia|Slovenia|Spain|Sweden|Switzerland|Türkiye|Ukraine|England|Wales|Vatican City",
  Asia: "Afghanistan|Bahrain|Bangladesh|Bhutan|Brunei|Cambodia|China|India|Indonesia|Iran|Iraq|Israel|Japan|Jordan|Kuwait|Kyrgyzstan|Laos|Lebanon|Malaysia|Maldives|Mongolia|Myanmar|Nepal|North Korea|Oman|Pakistan|Palestine|Philippines|Qatar|Saudi Arabia|Singapore|South Korea|Sri Lanka|Syria|Taiwan|Tajikistan|Thailand|Timor-Leste|Turkmenistan|United Arab Emirates|Uzbekistan|Vietnam|Yemen",
  Africa: "Algeria|Angola|Benin|Botswana|Burkina Faso|Burundi|Cabo Verde|Cameroon|Central African Republic|Chad|Comoros|Republic of the Congo|Democratic Republic of the Congo|Djibouti|Egypt|Equatorial Guinea|Eritrea|Eswatini|Ethiopia|Gabon|Gambia|Ghana|Guinea|Guinea-Bissau|Ivory Coast|Kenya|Lesotho|Liberia|Libya|Madagascar|Malawi|Mali|Mauritania|Mauritius|Morocco|Mozambique|Namibia|Niger|Nigeria|Rwanda|Sao Tome and Principe|Senegal|Seychelles|Sierra Leone|Somalia|South Africa|South Sudan|Sudan|Tanzania|Togo|Tunisia|Uganda|Zambia|Zimbabwe",
  "North America": "Antigua and Barbuda|Bahamas|Barbados|Belize|Canada|Costa Rica|Cuba|Dominica|Dominican Republic|El Salvador|Grenada|Guatemala|Haiti|Honduras|Jamaica|Mexico|Nicaragua|Panama|Saint Kitts and Nevis|Saint Lucia|Saint Vincent and the Grenadines|Trinidad and Tobago|United States",
  "South America": "Argentina|Bolivia|Brazil|Chile|Colombia|Ecuador|Guyana|Paraguay|Peru|Suriname|Uruguay|Venezuela",
  Oceania: "Australia|Fiji|Kiribati|Marshall Islands|Micronesia|Nauru|New Zealand|Palau|Papua New Guinea|Samoa|Solomon Islands|Tonga|Tuvalu|Vanuatu",
};

export const WORLD_COUNTRIES: WorldCountry[] = (Object.entries(COUNTRY_GROUPS) as [WorldContinent, string][])
  .flatMap(([continent, names]) => names.split("|").map((country) => ({ country, continent })));

const LEAGUE_STYLES: Record<WorldContinent, string[]> = {
  Europe: ["Premier League", "National Division", "Superliga", "Liga Nacional", "League One", "Division Royale", "Championship"],
  Asia: ["Premier League", "Super League", "National Pro League", "Championship", "Premier Division", "Liga Utama"],
  Africa: ["Premier League", "National League", "Ligue Nationale", "Championship", "Premier Division", "Super League"],
  "North America": ["Premier League", "Major League", "National Championship", "Liga Nacional", "Pro League"],
  "South America": ["Primera División", "Liga Nacional", "Campeonato Nacional", "Liga Superior", "Primera Liga"],
  Oceania: ["Premier League", "National League", "Championship", "Super League"],
};

const PLACE_STARTS: Record<WorldContinent, string[]> = {
  Europe: ["Alder", "Bram", "Cinder", "Dorn", "Ester", "Falk", "Glen", "Haver", "Iver", "Jor", "Keld", "Linden", "Maren", "Norr", "Orlen", "Pine", "Raven", "Soren", "Tarn", "Wester", "Yarrow"],
  Asia: ["Aki", "Ban", "Chanda", "Dara", "Eisho", "Faru", "Gyeon", "Hana", "Ibara", "Jaya", "Kota", "Luma", "Maka", "Nara", "Otara", "Paya", "Qara", "Ranta", "Sora", "Tala", "Vinh"],
  Africa: ["Abara", "Bela", "Chikala", "Damba", "Ekon", "Fara", "Goma", "Hara", "Ilara", "Jemba", "Kalo", "Lemba", "Makena", "Ndera", "Ogun", "Pemba", "Qonda", "Rufu", "Senga", "Temba", "Zola"],
  "North America": ["Alder", "Bay", "Cedar", "Dover", "Elk", "Fair", "Grand", "Haven", "Iron", "Juniper", "King", "Lake", "Mesa", "North", "Oak", "Pine", "Red", "Silver", "West", "York"],
  "South America": ["Alma", "Bel", "Cerro", "Dora", "Estre", "Forta", "Gran", "Huer", "Igua", "Jara", "Luna", "Mora", "Nova", "Oro", "Pala", "Quilla", "Roca", "Sola", "Tierra", "Vale"],
  Oceania: ["Aro", "Bora", "Cairn", "Daku", "Ena", "Fenua", "Goro", "Hanu", "Ika", "Koro", "Lani", "Motu", "Nuku", "Oru", "Puna", "Rai", "Sava", "Talo", "Viti", "Wai"],
};

const PLACE_ENDS: Record<WorldContinent, string[]> = {
  Europe: ["bridge", "brook", "combe", "dene", "field", "ford", "haven", "leigh", "mere", "stead", "wick", "worth", "holm", "mark", "fell", "gate", "bury", "ton", "vale", "well"],
  Asia: ["bara", "bashi", "dara", "ganj", "hama", "kawa", "mura", "naka", "pur", "raya", "sato", "shima", "tala", "thani", "wana", "yama", "zawa", "khet", "nagar", "wari"],
  Africa: ["bala", "bela", "dara", "emba", "gala", "goma", "hama", "jola", "kala", "loba", "mara", "nala", "ondo", "raba", "saba", "taba", "umba", "wena", "yala", "zene"],
  "North America": ["bay", "bluff", "brook", "crest", "dale", "falls", "field", "grove", "haven", "heights", "lake", "mesa", "ridge", "shore", "springs", "view", "vale", "wood", "point", "port"],
  "South America": ["alto", "brava", "campo", "dora", "faro", "grande", "lago", "luna", "mar", "monte", "nueva", "pampa", "plata", "rio", "sierra", "sur", "verde", "vila", "vista", "yara"],
  Oceania: ["aroa", "bora", "fale", "fenua", "hanu", "ika", "koro", "lani", "motu", "nuku", "puna", "rangi", "sava", "tala", "tane", "wai", "whenua", "viti", "zara", "marae"],
};

const CLUB_ENDINGS: Record<WorldContinent, string[]> = {
  Europe: ["Athletic", "City", "United", "Rovers", "Town", "Sporting", "Wanderers", "FC"],
  Asia: ["Athletic", "City", "United", "Phoenix", "Rovers", "Sporting", "Stars", "FC"],
  Africa: ["Athletic", "City", "United", "Stars", "Rovers", "Sporting", "Warriors", "FC"],
  "North America": ["Athletic", "City", "United", "Rovers", "Wanderers", "Sporting", "County", "FC"],
  "South America": ["Atlético", "Deportivo", "Unión", "Racing", "Estrella", "Sporting", "Club", "FC"],
  Oceania: ["Athletic", "City", "United", "Rovers", "Wanderers", "Sporting", "Harbour", "FC"],
};

function slug(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function palette(index: number): [string, string] {
  const colors: [string, string][] = [["#126c58", "#e8eee1"], ["#193d78", "#edc969"], ["#ad3b43", "#f3eadd"], ["#6f4d9d", "#f0dc9b"], ["#d06c31", "#173c44"], ["#28778a", "#f0f2e5"], ["#823b67", "#d7d5ef"], ["#4d662e", "#ede3c8"], ["#303943", "#d0a653"], ["#d5a624", "#202f4a"]];
  return colors[index % colors.length];
}

export const WORLD_LEAGUES: WorldLeagueDefinition[] = WORLD_COUNTRIES
  .filter(({ country }) => country !== "England")
  .map(({ country, continent }, index) => {
    const style = LEAGUE_STYLES[continent][index % LEAGUE_STYLES[continent].length];
    const id = `world-${slug(country)}-first`;
    return { id, name: `${country} ${style}`, country, continent, tier: 1, clubs: 8, rounds: 14, region: continent, promotionPlaces: 0, relegationPlaces: 0, automaticPromotion: 0, playoffPlaces: 0, playoffLabel: "" };
  });

const leagueByCountry = new Map(WORLD_LEAGUES.map((league) => [league.country, league]));

export function worldLeagueForCountry(country: string) {
  return leagueByCountry.get(country);
}

export function worldLeagueById(id: string) {
  return WORLD_LEAGUES.find((league) => league.id === id);
}

function makeWorldClub(country: WorldCountry, league: WorldLeagueDefinition, countryIndex: number, clubIndex: number): WorldClubSeed {
  const starts = PLACE_STARTS[country.continent];
  const ends = PLACE_ENDS[country.continent];
  const city = `${starts[(countryIndex * 3 + clubIndex * 5) % starts.length]}${ends[(countryIndex * 7 + clubIndex * 3) % ends.length]}`;
  const ending = CLUB_ENDINGS[country.continent][(clubIndex + countryIndex) % CLUB_ENDINGS[country.continent].length];
  const name = `${city} ${ending}`;
  const short = `${String(countryIndex + 1).padStart(3, "0")}${String(clubIndex + 1).padStart(2, "0")}`;
  const reputation = Math.max(24, Math.min(84, 66 - clubIndex * 4 + ((countryIndex * 11) % 14)));
  return {
    name,
    short: `W${short}`,
    city,
    reputation,
    colors: palette(countryIndex * 5 + clubIndex),
    capacity: clubIndex === 0 ? 32_000 + countryIndex % 5 * 2_500 : clubIndex < 3 ? 19_000 + countryIndex % 4 * 1_000 : clubIndex < 6 ? 8_000 + countryIndex % 3 * 1_000 : 4_000 + countryIndex % 3 * 500,
    leagueId: league.id,
    region: country.continent,
    country: country.country,
    continent: country.continent,
  };
}

const GENERATED_WORLD_CLUB_SEEDS = WORLD_LEAGUES.flatMap((league) => {
  const country = WORLD_COUNTRIES.find((entry) => entry.country === league.country)!;
  const countryIndex = WORLD_COUNTRIES.indexOf(country);
  return Array.from({ length: league.clubs }, (_, clubIndex) => makeWorldClub(country, league, countryIndex, clubIndex));
});

const usedClubNames = new Set<string>();
export const WORLD_CLUB_SEEDS = GENERATED_WORLD_CLUB_SEEDS.map((club, index) => {
  let name = club.name;
  if (usedClubNames.has(name)) name = `${name} ${club.country}`;
  while (usedClubNames.has(name)) name = `${club.name} ${club.country} ${index + 1}`;
  usedClubNames.add(name);
  return { ...club, name };
});

export const WORLD_LEAGUE_COUNTRY_COUNT = WORLD_COUNTRIES.length;
export const WORLD_CLUB_COUNT = WORLD_CLUB_SEEDS.length;
