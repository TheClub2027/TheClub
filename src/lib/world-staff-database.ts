import { ENGLISH_CLUB_SEEDS } from "./league-pyramid";

export const WORLD_STAFF_COUNT = 25_000;
export const BASE_CLUB_STAFF_COUNT = ENGLISH_CLUB_SEEDS.length * 12;

export const STAFF_ROLES = [
  "Assistant Manager",
  "First-Team Coach",
  "Goalkeeping Coach",
  "Fitness Coach",
  "Head Physio",
  "Head Scout",
  "Academy Director",
  "Performance Analyst",
  "Chairperson",
  "Sporting Director",
  "Finance Director",
  "Supporter Director",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];
export type StaffMember = {
  id: string;
  name: string;
  role: StaffRole;
  age: number;
  nationality: string;
  region: string;
  experience: number;
  ability: number;
  wage: number;
  focus: string;
  clubId: string | null;
  clubName: string | null;
};

const FIRST_NAMES = [
  "Alex", "Amira", "Anya", "Arthur", "Ava", "Ben", "Beth", "Callum", "Cara", "Carys", "Chris", "Clara", "Connor", "Daniel", "Darius", "Eleanor", "Ellis", "Ethan", "Farah", "Freya", "Gabriel", "Hana", "Harriet", "Hassan", "Holly", "Imogen", "Isaac", "Isla", "Jamal", "Jamie", "Jasmine", "Joel", "Jordan", "Joseph", "Kai", "Kara", "Kieran", "Leah", "Lewis", "Lina", "Luca", "Mara", "Maya", "Megan", "Michael", "Morgan", "Nadia", "Nathan", "Niamh", "Noah", "Oliver", "Owen", "Priya", "Ravi", "Reece", "Rhiannon", "Rhys", "Rosa", "Sam", "Sara", "Sean", "Sophie", "Tariq", "Theo", "Toby", "Tom", "Yasmin", "Zara", "Zoe",
];
const LAST_NAMES = [
  "Abbott", "Adebayo", "Ali", "Armstrong", "Atkinson", "Bailey", "Baker", "Barker", "Barnes", "Bell", "Bennett", "Berry", "Booth", "Bowen", "Brooks", "Brown", "Burke", "Campbell", "Carter", "Chapman", "Clarke", "Cole", "Collins", "Cooper", "Cox", "Davies", "Davis", "Dawson", "Dean", "Dixon", "Edwards", "Ellis", "Evans", "Fisher", "Fletcher", "Foster", "Fox", "Fraser", "Gardner", "Gibson", "Graham", "Grant", "Green", "Griffiths", "Hall", "Hamilton", "Harris", "Harrison", "Hart", "Harvey", "Hill", "Hughes", "Hunt", "Jackson", "James", "Jenkins", "Johnson", "Jones", "Khan", "King", "Knight", "Lawrence", "Lee", "Lewis", "Lloyd", "Marshall", "Martin", "Mason", "Matthews", "McCarthy", "Miller", "Mitchell", "Moore", "Morgan", "Morris", "Murphy", "Murray", "Nash", "O'Connor", "O'Neill", "Parker", "Patel", "Pearson", "Perry", "Price", "Quinn", "Reed", "Richards", "Roberts", "Robinson", "Rogers", "Rose", "Russell", "Scott", "Shah", "Shaw", "Simpson", "Singh", "Smith", "Spencer", "Stevens", "Taylor", "Thomas", "Thompson", "Turner", "Walker", "Ward", "Watson", "Webb", "White", "Williams", "Wilson", "Wood", "Wright", "Young",
];
const NATIONALITIES = ["English", "Scottish", "Welsh", "Irish", "French", "German", "Spanish", "Italian", "Dutch", "Portuguese", "Danish", "Swedish", "Norwegian", "Nigerian", "Ghanaian", "South African", "American", "Japanese", "Australian", "Canadian", "Polish", "Croatian", "Brazilian", "Argentine"];
const REGIONS = ["North West", "Yorkshire", "North East", "East Midlands", "West Midlands", "East Anglia", "London", "South East", "South Coast", "South West", "Wales", "Scotland", "Ireland", "Western Europe", "West Africa", "North America", "East Asia"];
const FOCUSES: Record<StaffRole, string[]> = {
  "Assistant Manager": ["Man management", "Tactical preparation", "Match analysis"],
  "First-Team Coach": ["Technical development", "Possession play", "Attacking patterns"],
  "Goalkeeping Coach": ["Shot stopping", "Distribution", "Set-piece organisation"],
  "Fitness Coach": ["Conditioning", "Recovery", "Athletic development"],
  "Head Physio": ["Injury prevention", "Rehabilitation", "Player welfare"],
  "Head Scout": ["Domestic recruitment", "International scouting", "Data-led recruitment"],
  "Academy Director": ["Youth pathway", "Talent identification", "Scholar development"],
  "Performance Analyst": ["Opposition reports", "Set pieces", "Match data"],
  Chairperson: ["Club strategy", "Community ownership", "Investment"],
  "Sporting Director": ["Squad planning", "Football operations", "Recruitment"],
  "Finance Director": ["Budget control", "Commercial growth", "Infrastructure"],
  "Supporter Director": ["Fan engagement", "Community trust", "Matchday experience"],
};

function makeWorldStaff(index: number): StaffMember {
  const roleIndex = index % STAFF_ROLES.length;
  const role = STAFF_ROLES[roleIndex];
  const clubIndex = Math.floor(index / 12);
  const seed = ENGLISH_CLUB_SEEDS[clubIndex];
  const employed = index < BASE_CLUB_STAFF_COUNT && Boolean(seed);
  const age = 25 + ((index * 17 + Math.floor(index / 8)) % 43);
  const ability = 39 + ((index * 29 + Math.floor(index / 17) * 7) % 58);
  const seniorityPay = role === "Chairperson" ? 1_150 : role === "Sporting Director" || role === "Finance Director" ? 690 : role === "Head Scout" || role === "Academy Director" ? 340 : 210;
  const reputation = employed ? seed!.reputation : 24 + ((index * 23 + 11) % 68);
  const wage = Math.round((180 + ability * 6.2 + reputation * 4.8 + seniorityPay) / 50) * 50;
  return {
    id: `staff-${String(index).padStart(5, "0")}`,
    name: `${FIRST_NAMES[(index * 13 + 7) % FIRST_NAMES.length]} ${LAST_NAMES[(index * 31 + Math.floor(index / FIRST_NAMES.length) * 7) % LAST_NAMES.length]}`,
    role,
    age,
    nationality: employed ? "English" : NATIONALITIES[(index * 19 + Math.floor(index / 7)) % NATIONALITIES.length],
    region: employed ? seed!.region : REGIONS[(index * 17 + Math.floor(index / 12)) % REGIONS.length],
    experience: Math.max(1, age - 22),
    ability,
    wage,
    focus: FOCUSES[role][(index * 7 + roleIndex) % FOCUSES[role].length],
    clubId: employed ? seed!.short : null,
    clubName: employed ? seed!.name : null,
  };
}

const WORLD_STAFF: StaffMember[] = Array.from({ length: WORLD_STAFF_COUNT }, (_, index) => makeWorldStaff(index));

export function getWorldStaffById(id: string) {
  const index = Number(id.slice(6));
  const person = Number.isInteger(index) && index >= 0 ? WORLD_STAFF[index] : undefined;
  return person?.id === id ? person : null;
}

export function createClubPersonnel(clubId: string, clubName: string, startIndex: number) {
  const people = Array.from({ length: 12 }, (_, offset) => {
    const index = (startIndex + offset) % WORLD_STAFF_COUNT;
    return { ...WORLD_STAFF[index], clubId, clubName };
  });
  return { staff: people.slice(0, 8), board: people.slice(8) };
}

export type StaffSearchRole = StaffRole | "All roles";
export type StaffSearchStatus = "Available" | "At a club" | "All";
export function searchWorldStaff(query: string, role: StaffSearchRole, status: StaffSearchStatus, offset: number, limit: number, careerOverrides: Record<string, string | null> = {}) {
  const term = query.trim().toLowerCase();
  const filtered = WORLD_STAFF.filter((person) => {
    const clubId = Object.prototype.hasOwnProperty.call(careerOverrides, person.id) ? careerOverrides[person.id] : person.clubId;
    if (role !== "All roles" && person.role !== role) return false;
    if (status === "Available" && clubId !== null) return false;
    if (status === "At a club" && clubId === null) return false;
    if (!term) return true;
    return `${person.name} ${person.role} ${person.nationality} ${person.region} ${person.clubName ?? ""}`.toLowerCase().includes(term);
  });
  return { total: filtered.length, people: filtered.slice(offset, offset + limit).map((person) => ({
    ...person,
    clubId: Object.prototype.hasOwnProperty.call(careerOverrides, person.id) ? careerOverrides[person.id] : person.clubId,
  })) };
}

export function countWorldStaff(careerOverrides: Record<string, string | null> = {}) {
  let atClub = 0;
  for (const person of WORLD_STAFF) {
    const clubId = Object.prototype.hasOwnProperty.call(careerOverrides, person.id) ? careerOverrides[person.id] : person.clubId;
    if (clubId !== null) atClub += 1;
  }
  return { total: WORLD_STAFF_COUNT, atClub, available: WORLD_STAFF_COUNT - atClub };
}
