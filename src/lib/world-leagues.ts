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
  Asia: "Afghanistan|Bahrain|Bangladesh|Bhutan|Brunei|Cambodia|China|India|Indonesia|Iran|Iraq|Israel|Kazakhstan|Japan|Jordan|Kuwait|Kyrgyzstan|Laos|Lebanon|Malaysia|Maldives|Mongolia|Myanmar|Nepal|North Korea|Oman|Pakistan|Palestine|Philippines|Qatar|Saudi Arabia|Singapore|South Korea|Sri Lanka|Syria|Taiwan|Tajikistan|Thailand|Timor-Leste|Turkmenistan|United Arab Emirates|Uzbekistan|Vietnam|Yemen",
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

// Curated, country-specific lists of real cities and football towns seed the
// fictional clubs. Local naming patterns keep generated sides from reading as
// one British-style naming pool.
export const WORLD_CITY_NAMES_BY_COUNTRY: Record<string, string[]> = {
  Albania: ["Tirana", "Durrës", "Shkodër", "Vlorë", "Elbasan"], Andorra: ["Andorra la Vella", "Escaldes-Engordany", "Encamp", "La Massana"], Armenia: ["Yerevan", "Gyumri", "Vanadzor", "Vagharshapat"], Austria: ["Vienna", "Graz", "Linz", "Salzburg", "Innsbruck", "Klagenfurt"], Azerbaijan: ["Baku", "Ganja", "Sumqayit", "Lankaran"], Belarus: ["Minsk", "Gomel", "Brest", "Vitebsk", "Grodno"], Belgium: ["Brussels", "Antwerp", "Ghent", "Bruges", "Liège", "Charleroi"], "Bosnia and Herzegovina": ["Sarajevo", "Banja Luka", "Mostar", "Tuzla", "Zenica"], Bulgaria: ["Sofia", "Plovdiv", "Varna", "Burgas", "Ruse"], Croatia: ["Zagreb", "Split", "Rijeka", "Osijek", "Zadar"], Cyprus: ["Nicosia", "Limassol", "Larnaca", "Paphos", "Famagusta"], Czechia: ["Prague", "Brno", "Ostrava", "Plzeň", "Liberec"], Denmark: ["Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg"], Estonia: ["Tallinn", "Tartu", "Narva", "Pärnu"], Finland: ["Helsinki", "Tampere", "Turku", "Oulu", "Lahti"], France: ["Paris", "Marseille", "Lyon", "Lille", "Bordeaux", "Toulouse", "Nice", "Nantes", "Strasbourg"], Georgia: ["Tbilisi", "Batumi", "Kutaisi", "Rustavi"], Germany: ["Berlin", "Hamburg", "München", "Köln", "Frankfurt", "Stuttgart", "Dortmund", "Leipzig", "Dresden"], Greece: ["Athens", "Thessaloniki", "Patras", "Heraklion", "Larissa"], Hungary: ["Budapest", "Debrecen", "Szeged", "Pécs", "Győr"], Iceland: ["Reykjavík", "Akureyri", "Keflavík", "Hafnarfjörður"], Ireland: ["Dublin", "Cork", "Galway", "Limerick", "Waterford"], Italy: ["Roma", "Milano", "Naples", "Turin", "Bologna", "Firenze", "Palermo", "Genoa"], Kosovo: ["Pristina", "Prizren", "Peja", "Mitrovica", "Gjakova"], Latvia: ["Riga", "Daugavpils", "Liepāja", "Jelgava"], Liechtenstein: ["Vaduz", "Schaan", "Balzers", "Triesen"], Lithuania: ["Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys"], Luxembourg: ["Luxembourg City", "Esch-sur-Alzette", "Differdange", "Dudelange"], Malta: ["Valletta", "Birkirkara", "Mosta", "Qormi"], Moldova: ["Chișinău", "Bălți", "Tiraspol", "Cahul"], Monaco: ["Monaco", "Monte Carlo", "La Condamine"], Montenegro: ["Podgorica", "Nikšić", "Budva", "Bar"], Netherlands: ["Amsterdam", "Rotterdam", "Den Haag", "Eindhoven", "Utrecht", "Groningen", "Arnhem"], "North Macedonia": ["Skopje", "Bitola", "Tetovo", "Kumanovo"], "Northern Ireland": ["Belfast", "Derry", "Lisburn", "Newry"], Norway: ["Oslo", "Bergen", "Trondheim", "Stavanger", "Tromsø"], Poland: ["Warsaw", "Kraków", "Gdańsk", "Poznań", "Wrocław", "Łódź"], Portugal: ["Lisboa", "Porto", "Braga", "Coimbra", "Faro", "Setúbal"], Romania: ["Bucharest", "Cluj-Napoca", "Timișoara", "Iași", "Craiova"], Russia: ["Moscow", "Saint Petersburg", "Kazan", "Sochi", "Yekaterinburg", "Novosibirsk", "Rostov-on-Don"], "San Marino": ["Serravalle", "San Marino City", "Borgo Maggiore", "Fiorentino"], Scotland: ["Glasgow", "Edinburgh", "Aberdeen", "Dundee", "Inverness"], Serbia: ["Belgrade", "Novi Sad", "Niš", "Kragujevac", "Subotica"], Slovakia: ["Bratislava", "Košice", "Žilina", "Nitra"], Slovenia: ["Ljubljana", "Maribor", "Celje", "Koper"], Spain: ["Madrid", "Barcelona", "Sevilla", "Valencia", "Bilbao", "Málaga", "Zaragoza", "San Sebastián", "Valladolid", "A Coruña"], Sweden: ["Stockholm", "Gothenburg", "Malmö", "Uppsala", "Helsingborg"], Switzerland: ["Zurich", "Basel", "Bern", "Geneva", "Lausanne", "Lugano"], Türkiye: ["Istanbul", "Ankara", "Izmir", "Trabzon", "Bursa", "Antalya"], Ukraine: ["Kyiv", "Kharkiv", "Odesa", "Lviv", "Dnipro"], England: ["London", "Manchester", "Liverpool", "Birmingham", "Leeds", "Newcastle", "Bristol", "Sheffield"], Wales: ["Cardiff", "Swansea", "Newport", "Wrexham", "Bangor"], "Vatican City": ["Vatican City"],
  Afghanistan: ["Kabul", "Kandahar", "Herat", "Mazar-i-Sharif"], Bahrain: ["Manama", "Muharraq", "Riffa"], Bangladesh: ["Dhaka", "Chattogram", "Khulna", "Rajshahi", "Sylhet"], Bhutan: ["Thimphu", "Phuntsholing", "Paro"], Brunei: ["Bandar Seri Begawan", "Kuala Belait", "Seria"], Cambodia: ["Phnom Penh", "Siem Reap", "Battambang", "Kampong Cham"], China: ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu", "Wuhan", "Nanjing", "Hangzhou"], India: ["Mumbai", "Kolkata", "Delhi", "Bengaluru", "Chennai", "Hyderabad", "Pune", "Goa"], Indonesia: ["Jakarta", "Surabaya", "Bandung", "Medan", "Semarang", "Malang", "Makassar"], Iran: ["Tehran", "Isfahan", "Tabriz", "Shiraz", "Ahvaz", "Mashhad"], Iraq: ["Baghdad", "Basra", "Erbil", "Najaf", "Karbala"], Israel: ["Tel Aviv", "Jerusalem", "Haifa", "Be'er Sheva", "Netanya"], Japan: ["Tokyo", "Osaka", "Yokohama", "Nagoya", "Kobe", "Sapporo", "Hiroshima", "Fukuoka"], Kazakhstan: ["Almaty", "Astana", "Shymkent", "Aktobe", "Karaganda", "Taraz", "Pavlodar", "Atyrau"], Jordan: ["Amman", "Irbid", "Zarqa", "Aqaba"], Kuwait: ["Kuwait City", "Salmiya", "Hawalli", "Ahmadi"], Kyrgyzstan: ["Bishkek", "Osh", "Jalal-Abad", "Karakol"], Laos: ["Vientiane", "Luang Prabang", "Pakse", "Savannakhet"], Lebanon: ["Beirut", "Tripoli", "Sidon", "Tyre"], Malaysia: ["Kuala Lumpur", "Johor Bahru", "George Town", "Kuching", "Kota Kinabalu"], Maldives: ["Malé", "Addu City", "Fuvahmulah"], Mongolia: ["Ulaanbaatar", "Darkhan", "Erdenet"], Myanmar: ["Yangon", "Mandalay", "Naypyidaw", "Mawlamyine"], Nepal: ["Kathmandu", "Pokhara", "Lalitpur", "Biratnagar"], "North Korea": ["Pyongyang", "Hamhung", "Chongjin", "Nampo"], Oman: ["Muscat", "Salalah", "Sohar", "Nizwa"], Pakistan: ["Karachi", "Lahore", "Islamabad", "Peshawar", "Quetta", "Faisalabad"], Palestine: ["Ramallah", "Gaza", "Nablus", "Hebron"], Philippines: ["Manila", "Cebu", "Davao", "Quezon City", "Iloilo"], Qatar: ["Doha", "Al Rayyan", "Al Wakrah"], "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Abha"], Singapore: ["Singapore"], "South Korea": ["Seoul", "Busan", "Incheon", "Daegu", "Daejeon", "Ulsan"], "Sri Lanka": ["Colombo", "Kandy", "Galle", "Jaffna"], Syria: ["Damascus", "Aleppo", "Homs", "Latakia"], Taiwan: ["Taipei", "Kaohsiung", "Taichung", "Tainan"], Tajikistan: ["Dushanbe", "Khujand", "Kulob"], Thailand: ["Bangkok", "Chiang Mai", "Phuket", "Khon Kaen"], "Timor-Leste": ["Dili", "Baucau", "Maliana"], Turkmenistan: ["Ashgabat", "Turkmenabat", "Mary"], "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah", "Al Ain"], Uzbekistan: ["Tashkent", "Samarkand", "Bukhara", "Namangan"], Vietnam: ["Hanoi", "Ho Chi Minh City", "Da Nang", "Haiphong", "Can Tho"], Yemen: ["Sana'a", "Aden", "Taiz"],
  Algeria: ["Algiers", "Oran", "Constantine", "Annaba"], Angola: ["Luanda", "Benguela", "Huambo"], Benin: ["Cotonou", "Porto-Novo", "Parakou"], Botswana: ["Gaborone", "Francistown", "Maun"], "Burkina Faso": ["Ouagadougou", "Bobo-Dioulasso", "Koudougou"], Burundi: ["Gitega", "Bujumbura", "Ngozi"], "Cabo Verde": ["Praia", "Mindelo", "Assomada"], Cameroon: ["Douala", "Yaoundé", "Bafoussam", "Garoua"], "Central African Republic": ["Bangui", "Berbérati"], Chad: ["N'Djamena", "Moundou", "Sarh"], Comoros: ["Moroni", "Mutsamudu", "Fomboni"], "Republic of the Congo": ["Brazzaville", "Pointe-Noire", "Dolisie"], "Democratic Republic of the Congo": ["Kinshasa", "Lubumbashi", "Mbuji-Mayi", "Goma"], Djibouti: ["Djibouti City", "Ali Sabieh", "Tadjourah"], Egypt: ["Cairo", "Alexandria", "Giza", "Port Said", "Ismailia"], "Equatorial Guinea": ["Malabo", "Bata", "Oyala"], Eritrea: ["Asmara", "Keren", "Massawa"], Eswatini: ["Mbabane", "Manzini", "Siteki"], Ethiopia: ["Addis Ababa", "Dire Dawa", "Mekelle", "Bahir Dar"], Gabon: ["Libreville", "Port-Gentil", "Franceville"], Gambia: ["Banjul", "Serekunda", "Brikama"], Ghana: ["Accra", "Kumasi", "Tamale", "Sunyani"], Guinea: ["Conakry", "Kankan", "Labé"], "Guinea-Bissau": ["Bissau", "Bafatá", "Gabú"], "Ivory Coast": ["Abidjan", "Bouaké", "Yamoussoukro", "San-Pédro"], Kenya: ["Nairobi", "Mombasa", "Kisumu", "Eldoret"], Lesotho: ["Maseru", "Teyateyaneng", "Mafeteng"], Liberia: ["Monrovia", "Gbarnga", "Buchanan"], Libya: ["Tripoli", "Benghazi", "Misrata"], Madagascar: ["Antananarivo", "Toamasina", "Antsirabe"], Malawi: ["Lilongwe", "Blantyre", "Mzuzu"], Mali: ["Bamako", "Sikasso", "Ségou"], Mauritania: ["Nouakchott", "Nouadhibou", "Kiffa"], Mauritius: ["Port Louis", "Curepipe", "Beau Bassin-Rose Hill"], Morocco: ["Casablanca", "Rabat", "Fez", "Marrakesh", "Tangier"], Mozambique: ["Maputo", "Beira", "Nampula"], Namibia: ["Windhoek", "Walvis Bay", "Swakopmund"], Niger: ["Niamey", "Zinder", "Maradi"], Nigeria: ["Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt", "Enugu"], Rwanda: ["Kigali", "Butare", "Gisenyi"], "Sao Tome and Principe": ["São Tomé", "Neves", "Santo António"], Senegal: ["Dakar", "Thiès", "Saint-Louis"], Seychelles: ["Victoria", "Anse Royale"], "Sierra Leone": ["Freetown", "Bo", "Koidu"], Somalia: ["Mogadishu", "Hargeisa", "Kismayo"], "South Africa": ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Gqeberha", "Polokwane"], "South Sudan": ["Juba", "Malakal", "Wau"], Sudan: ["Khartoum", "Omdurman", "Port Sudan"], Tanzania: ["Dar es Salaam", "Dodoma", "Mwanza", "Arusha"], Togo: ["Lomé", "Sokodé", "Kara"], Tunisia: ["Tunis", "Sfax", "Sousse"], Uganda: ["Kampala", "Entebbe", "Gulu"], Zambia: ["Lusaka", "Ndola", "Kitwe"], Zimbabwe: ["Harare", "Bulawayo", "Gweru"],
  "Antigua and Barbuda": ["St John's", "All Saints"], Bahamas: ["Nassau", "Freeport"], Barbados: ["Bridgetown", "Speightstown"], Belize: ["Belize City", "Belmopan"], Canada: ["Toronto", "Montreal", "Vancouver", "Calgary", "Ottawa", "Winnipeg", "Edmonton"], "Costa Rica": ["San José", "Heredia", "Alajuela", "Cartago"], Cuba: ["Havana", "Santiago de Cuba", "Camagüey"], Dominica: ["Roseau", "Portsmouth"], "Dominican Republic": ["Santo Domingo", "Santiago de los Caballeros", "La Romana"], "El Salvador": ["San Salvador", "Santa Ana", "San Miguel"], Grenada: ["St George's", "Gouyave"], Guatemala: ["Guatemala City", "Quetzaltenango", "Escuintla"], Haiti: ["Port-au-Prince", "Cap-Haïtien", "Les Cayes"], Honduras: ["Tegucigalpa", "San Pedro Sula", "La Ceiba"], Jamaica: ["Kingston", "Montego Bay", "Spanish Town"], Mexico: ["Mexico City", "Guadalajara", "Monterrey", "Puebla", "Toluca", "León", "Tijuana"], Nicaragua: ["Managua", "León", "Granada"], Panama: ["Panama City", "Colón", "David"], "Saint Kitts and Nevis": ["Basseterre", "Charlestown"], "Saint Lucia": ["Castries", "Vieux Fort"], "Saint Vincent and the Grenadines": ["Kingstown", "Georgetown"], "Trinidad and Tobago": ["Port of Spain", "San Fernando", "Chaguanas"], "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Seattle", "Atlanta", "Miami", "Boston", "Philadelphia", "San Diego", "Dallas", "Austin"],
  Argentina: ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata", "Tucumán", "Mar del Plata"], Bolivia: ["La Paz", "Santa Cruz de la Sierra", "Cochabamba", "Sucre"], Brazil: ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Porto Alegre", "Salvador", "Recife", "Curitiba", "Brasília"], Chile: ["Santiago", "Valparaíso", "Concepción", "Antofagasta", "Viña del Mar"], Colombia: ["Bogotá", "Medellín", "Cali", "Barranquilla", "Bucaramanga"], Ecuador: ["Quito", "Guayaquil", "Cuenca", "Ambato", "Manta"], Guyana: ["Georgetown", "Linden", "New Amsterdam"], Paraguay: ["Asunción", "Ciudad del Este", "Encarnación"], Peru: ["Lima", "Arequipa", "Trujillo", "Cusco", "Chiclayo"], Suriname: ["Paramaribo", "Lelydorp", "Nieuw Nickerie"], Uruguay: ["Montevideo", "Salto", "Paysandú", "Colonia del Sacramento"], Venezuela: ["Caracas", "Maracaibo", "Valencia", "Barquisimeto", "Maracay"],
  Australia: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Canberra", "Newcastle"], Fiji: ["Suva", "Nadi", "Lautoka"], Kiribati: ["South Tarawa", "Betio"], "Marshall Islands": ["Majuro"], Micronesia: ["Palikir", "Weno"], Nauru: ["Yaren District", "Denigomodu", "Anabar"], "New Zealand": ["Auckland", "Wellington", "Christchurch", "Dunedin", "Hamilton"], Palau: ["Ngerulmud", "Koror"], "Papua New Guinea": ["Port Moresby", "Lae", "Mount Hagen", "Rabaul"], Samoa: ["Apia", "Salelologa"], "Solomon Islands": ["Honiara", "Auki", "Gizo"], Tonga: ["Nukuʻalofa", "Neiafu"], Tuvalu: ["Funafuti"], Vanuatu: ["Port Vila", "Luganville"],
};

const WORLD_LEAGUE_SIZE_DEFAULT: Record<WorldContinent, number> = {
  Europe: 14, Asia: 14, Africa: 14, "North America": 12, "South America": 16, Oceania: 10,
};

const REALISTIC_LEAGUE_SIZES: Record<string, number> = {
  Albania: 10, Andorra: 10, Armenia: 10, Austria: 12, Azerbaijan: 10, Belarus: 16, Belgium: 16, "Bosnia and Herzegovina": 12, Bulgaria: 16, Croatia: 10, Cyprus: 14, Czechia: 16, Denmark: 12, Estonia: 10, Finland: 12, France: 18, Georgia: 10, Germany: 18, Greece: 14, Hungary: 12, Iceland: 12, Ireland: 10, Italy: 20, Kosovo: 10, Latvia: 10, Liechtenstein: 10, Lithuania: 10, Luxembourg: 16, Malta: 14, Moldova: 10, Monaco: 10, Montenegro: 10, Netherlands: 18, "North Macedonia": 12, "Northern Ireland": 12, Norway: 16, Poland: 18, Portugal: 18, Romania: 16, Russia: 16, "San Marino": 16, Scotland: 12, Serbia: 16, Slovakia: 12, Slovenia: 10, Spain: 20, Sweden: 16, Switzerland: 12, Türkiye: 18, Ukraine: 16, Wales: 12, "Vatican City": 10,
  Afghanistan: 16, Bahrain: 10, Bangladesh: 12, Bhutan: 10, Brunei: 12, Cambodia: 10, China: 16, India: 14, Indonesia: 18, Iran: 16, Iraq: 20, Israel: 14, Japan: 20, Kazakhstan: 16, Jordan: 12, Kuwait: 10, Kyrgyzstan: 10, Laos: 10, Lebanon: 12, Malaysia: 14, Maldives: 10, Mongolia: 10, Myanmar: 12, Nepal: 14, "North Korea": 12, Oman: 14, Pakistan: 16, Palestine: 12, Philippines: 12, Qatar: 12, "Saudi Arabia": 18, Singapore: 10, "South Korea": 12, "Sri Lanka": 10, Syria: 12, Taiwan: 10, Tajikistan: 10, Thailand: 16, "Timor-Leste": 10, Turkmenistan: 10, "United Arab Emirates": 14, Uzbekistan: 16, Vietnam: 14, Yemen: 10,
  Algeria: 16, Angola: 16, Benin: 14, Botswana: 16, "Burkina Faso": 16, Burundi: 16, "Cabo Verde": 12, Cameroon: 18, "Central African Republic": 14, Chad: 14, Comoros: 12, "Republic of the Congo": 16, "Democratic Republic of the Congo": 20, Djibouti: 12, Egypt: 18, "Equatorial Guinea": 16, Eritrea: 14, Eswatini: 16, Ethiopia: 16, Gabon: 14, Gambia: 16, Ghana: 18, Guinea: 14, "Guinea-Bissau": 14, "Ivory Coast": 16, Kenya: 18, Lesotho: 16, Liberia: 16, Libya: 16, Madagascar: 16, Malawi: 16, Mali: 16, Mauritania: 14, Mauritius: 12, Morocco: 16, Mozambique: 16, Namibia: 16, Niger: 14, Nigeria: 20, Rwanda: 16, "Sao Tome and Principe": 12, Senegal: 18, Seychelles: 12, "Sierra Leone": 16, Somalia: 16, "South Africa": 16, "South Sudan": 14, Sudan: 16, Tanzania: 18, Togo: 16, Tunisia: 16, Uganda: 18, Zambia: 18, Zimbabwe: 18,
  "Antigua and Barbuda": 10, Bahamas: 10, Barbados: 12, Belize: 12, Canada: 14, "Costa Rica": 12, Cuba: 16, Dominica: 10, "Dominican Republic": 12, "El Salvador": 12, Grenada: 10, Guatemala: 12, Haiti: 16, Honduras: 10, Jamaica: 12, Mexico: 18, Nicaragua: 10, Panama: 12, "Saint Kitts and Nevis": 10, "Saint Lucia": 10, "Saint Vincent and the Grenadines": 10, "Trinidad and Tobago": 12, "United States": 30,
  Argentina: 30, Bolivia: 16, Brazil: 20, Chile: 16, Colombia: 20, Ecuador: 16, Guyana: 10, Paraguay: 12, Peru: 18, Suriname: 10, Uruguay: 16, Venezuela: 20,
  Australia: 12, Fiji: 10, Kiribati: 10, "Marshall Islands": 10, Micronesia: 10, Nauru: 10, "New Zealand": 10, Palau: 10, "Papua New Guinea": 10, Samoa: 10, "Solomon Islands": 10, Tonga: 10, Tuvalu: 10, Vanuatu: 10,
};

const REALISTIC_SECOND_TIER_SIZES: Record<string, number> = {
  Austria: 16, Belgium: 16, Denmark: 12, France: 18, Germany: 18, Ireland: 10, Italy: 20, Japan: 20, Kazakhstan: 14,
  Mexico: 18, Netherlands: 20, Norway: 16, Portugal: 18, Scotland: 10, Spain: 22, Sweden: 16, Türkiye: 20,
  Argentina: 22, Brazil: 20, Chile: 16, Colombia: 16, Uruguay: 14,
  China: 16, India: 12, Indonesia: 20, Iran: 18, "Saudi Arabia": 18, "South Korea": 14, Thailand: 18,
  Egypt: 18, Morocco: 16, "South Africa": 16, Nigeria: 18, Senegal: 16,
  Canada: 14, "United States": 24, Australia: 16, "New Zealand": 10,
};

const REALISTIC_LEAGUE_NAMES: Record<string, string> = {
  Austria: "Bundesliga", Belgium: "Pro League", Croatia: "HNL", Czechia: "First League", Denmark: "Superliga", England: "Premier League", France: "Ligue 1", Germany: "Bundesliga", Greece: "Super League", Ireland: "Premier Division", Italy: "Serie A", Japan: "J1 League", Kazakhstan: "Kazakhstan Premier League", Mexico: "Liga MX", Netherlands: "Eredivisie", Norway: "Eliteserien", Poland: "Ekstraklasa", Portugal: "Primeira Liga", Scotland: "Premiership", "South Korea": "K League 1", Spain: "Primera División", Sweden: "Allsvenskan", Switzerland: "Super League", Türkiye: "Süper Lig", "United States": "Major League Soccer", Canada: "Premier League", Argentina: "Primera División", Brazil: "Série A", Chile: "Primera División", Colombia: "Primera A", Uruguay: "Primera División", "Saudi Arabia": "Pro League", China: "Super League", India: "Super League", Indonesia: "Liga 1", Egypt: "Premier League", "South Africa": "Premiership", Nigeria: "Premier Football League", Morocco: "Botola Pro", Australia: "A-League", "New Zealand": "National League",
};

const REALISTIC_SECOND_LEAGUE_NAMES: Record<string, string> = {
  Austria: "2. Liga", Belgium: "Challenger Pro League", Denmark: "1st Division", France: "Ligue 2", Germany: "2. Bundesliga", Ireland: "First Division", Italy: "Serie B", Japan: "J2 League", Kazakhstan: "First League",
  Mexico: "Liga de Expansión MX", Netherlands: "Eerste Divisie", Norway: "1. divisjon", Portugal: "Liga Portugal 2", Scotland: "Championship", Spain: "Segunda División", Sweden: "Superettan", Türkiye: "1. Lig",
  Argentina: "Primera Nacional", Brazil: "Série B", Chile: "Primera B", Colombia: "Primera B", Uruguay: "Segunda División",
  China: "League One", India: "I-League", Indonesia: "Liga 2", Iran: "Azadegan League", "Saudi Arabia": "First Division League", "South Korea": "K League 2", Thailand: "Thai League 2",
  Egypt: "Second Division", Morocco: "Botola 2", "South Africa": "Motsepe Foundation Championship", Nigeria: "Nigeria National League", Senegal: "Ligue 2",
  Canada: "Canadian Championship Division", "United States": "USL Championship", Australia: "National Premier Leagues", "New Zealand": "Northern League",
};

const SPANISH_STYLE_COUNTRIES = new Set(["Spain", "Argentina", "Bolivia", "Chile", "Colombia", "Ecuador", "Paraguay", "Peru", "Uruguay", "Venezuela", "Mexico", "Costa Rica", "Cuba", "Dominican Republic", "El Salvador", "Guatemala", "Honduras", "Nicaragua", "Panama"]);
const PORTUGUESE_STYLE_COUNTRIES = new Set(["Portugal", "Brazil", "Angola", "Cabo Verde", "Mozambique", "Sao Tome and Principe", "Timor-Leste"]);
const FRENCH_STYLE_COUNTRIES = new Set(["France", "Belgium", "Luxembourg", "Algeria", "Benin", "Burkina Faso", "Burundi", "Cameroon", "Central African Republic", "Chad", "Comoros", "Republic of the Congo", "Democratic Republic of the Congo", "Djibouti", "Gabon", "Guinea", "Guinea-Bissau", "Ivory Coast", "Madagascar", "Mali", "Mauritania", "Mauritius", "Morocco", "Niger", "Rwanda", "Senegal", "Togo", "Tunisia", "Haiti"]);
const SLAVIC_STYLE_COUNTRIES = new Set(["Belarus", "Bosnia and Herzegovina", "Bulgaria", "Croatia", "Czechia", "Georgia", "Kosovo", "Montenegro", "North Macedonia", "Poland", "Russia", "Serbia", "Slovakia", "Slovenia", "Ukraine"]);
const ARABIC_STYLE_COUNTRIES = new Set(["Afghanistan", "Bahrain", "Egypt", "Iraq", "Jordan", "Kuwait", "Lebanon", "Libya", "Oman", "Palestine", "Qatar", "Saudi Arabia", "Syria", "United Arab Emirates", "Yemen"]);
const NORDIC_STYLE_COUNTRIES = new Set(["Denmark", "Finland", "Iceland", "Norway", "Sweden"]);
const SOUTH_ASIAN_STYLE_COUNTRIES = new Set(["Bangladesh", "Bhutan", "India", "Maldives", "Nepal", "Pakistan", "Sri Lanka"]);
const INDONESIAN_STYLE_COUNTRIES = new Set(["Indonesia"]);
const MALAY_STYLE_COUNTRIES = new Set(["Brunei", "Malaysia", "Singapore"]);
const FILIPINO_STYLE_COUNTRIES = new Set(["Philippines"]);
const VIETNAMESE_STYLE_COUNTRIES = new Set(["Vietnam"]);
const THAI_STYLE_COUNTRIES = new Set(["Thailand"]);
const KHMER_STYLE_COUNTRIES = new Set(["Cambodia"]);
const MEKONG_STYLE_COUNTRIES = new Set(["Laos", "Myanmar"]);
const CENTRAL_ASIAN_STYLE_COUNTRIES = new Set(["Kazakhstan", "Kyrgyzstan", "Mongolia", "Tajikistan", "Turkmenistan", "Uzbekistan"]);
const WEST_AFRICAN_STYLE_COUNTRIES = new Set(["Ghana", "Nigeria", "Gambia", "Sierra Leone", "Liberia", "Togo", "Benin", "Burkina Faso", "Ivory Coast", "Guinea", "Guinea-Bissau", "Senegal"]);
const EAST_AFRICAN_STYLE_COUNTRIES = new Set(["Burundi", "Ethiopia", "Kenya", "Rwanda", "Somalia", "South Sudan", "Sudan", "Tanzania", "Uganda"]);
const ALBANIAN_STYLE_COUNTRIES = new Set(["Albania", "Kosovo"]);
const HUNGARIAN_STYLE_COUNTRIES = new Set(["Hungary"]);
const IRISH_STYLE_COUNTRIES = new Set(["Ireland", "Northern Ireland"]);

const CLUB_NAME_TEMPLATES: Record<string, string[]> = {
  Spanish: ["{city} de la Vega", "Club Sierra {city}", "Estrella {city} del Norte", "{city} Horizonte", "{city} Puerta Abierta", "Deportivo {city} de los Olivos", "{city} Marisma", "Unión de la Ribera {city}", "{city} Campos Altos", "Atlético {city} Costero", "{city} Monte Claro", "La Forja de {city}", "{city} Marea Alta", "Alameda {city}", "{city} del Viento", "Círculo Deportivo {city}"],
  Portuguese: ["{city} Farol", "Ribeira de {city}", "Brisa de {city}", "Clube do {city} Azul", "Navegantes de {city}", "Guerreiros da {city}", "{city} das Pontes", "Rota {city}", "Estrela da Serra {city}", "Maré de {city}", "{city} Horizonte", "Vale Verde {city}", "Alvorada de {city}", "União da Foz {city}"],
  French: ["{city} Confluence", "Les Forges de {city}", "{city} Horizon", "Union des Rives {city}", "{city} des Passages", "La Lanterne de {city}", "{city} Grand Large", "Les Remparts de {city}", "Métropole {city} Nouvelle", "{city} des Ateliers", "Aurore de {city}", "{city} la Clairière", "Les Veilleurs de {city}", "{city} Pont-Neuf", "Compagnons de {city}", "{city} Élan"],
  Slavic: ["Sokol {city}", "{city} Vihor", "Rudari {city}", "Bereg {city}", "{city} Javor", "Severna {city}", "{city} Mostar", "Zora {city}", "{city} Vektor", "Omladina {city}", "{city} Kamen", "Plavi {city}", "{city} Vatra", "Zeleni {city}"],
  Arabic: ["Al-Manara {city}", "Al-Marsa {city}", "Al-Nakhil {city}", "Al-Waha {city}", "Al-Sahil {city}", "Al-Rimal {city}", "Al-Fanar {city}", "Al-Jawf {city}", "Al-Bustan {city}", "Al-Madar {city}", "Al-Mizan {city}", "Al-Saqr {city}"],
  German: ["Hafen {city}", "{city} Werkbund", "Rheinstrom {city}", "Bergstadt {city}", "Lichtwerk {city}", "{city} Schanzen", "Elbe {city}", "Weserbogen {city}", "{city} Morgenrot", "Eisenring {city}", "{city} Höhenweg", "Maschinenwerk {city}", "{city} Grünfeld", "Kranich {city}"],
  Italian: ["Stella di {city}", "{city} Azzurra", "Aurora {city}", "Rocca {city}", "Ponte Verde {city}", "{city} del Sole", "Porta Nuova {city}", "{city} Vela", "Cavalli di {city}", "{city} Altopiano", "Luna {city}", "{city} Ferrovia", "Riva {city}", "{city} Venturo"],
  Nordic: ["{city} Nordlys", "Fjordglimt {city}", "{city} Havørn", "Isbjørn {city}", "{city} Fjellvind", "Skoglys {city}", "{city} Snøfall", "Havbris {city}", "{city} Varg", "Nordhavn {city}", "{city} Solglimt", "Fjellheim {city}"],
  Japanese: ["{city} Kuroshio", "{city} Akatsuki", "{city} Aozora", "{city} Kintsugi", "{city} Raiden", "{city} Yamabiko", "{city} Shinkai", "{city} Hinode", "{city} Kazanami", "{city} Tenku", "{city} Asahi", "{city} Sazanami"],
  Korean: ["{city} Haedong", "{city} Bada", "{city} Gureum", "{city} Baram", "{city} Saebyeok", "{city} Haneul", "{city} Bulkkot", "{city} Daeho", "{city} Solbit", "{city} Narae", "{city} Gwangya", "{city} Cheolma"],
  Chinese: ["{city} Yunlong", "{city} Haiyan", "{city} Qingshan", "{city} Jinhai", "{city} Fenghuang", "{city} Canglong", "{city} Tianhe", "{city} Yueliang", "{city} Changfeng", "{city} Hailang", "{city} Qingyun", "{city} Xingchen"],
  CentralAsian: ["{city} Qalqon", "{city} Alga", "{city} Zhas", "{city} Barys", "{city} Samal", "{city} Arlan", "{city} Qanat", "{city} Koktem", "{city} Dala", "{city} Orda", "{city} Tulpar", "{city} Zhetysu"],
  Turkish: ["{city} Yıldız", "Anadolu Ufuk {city}", "{city} Çınar", "Liman {city}", "{city} Kartal", "Gençlik Işığı {city}", "{city} Gökkuşağı", "Kale {city}", "{city} Mavişehir", "Bozkır {city}", "{city} Günebakan", "Yelken {city}"],
  Persian: ["{city} Mehrgan", "Arman {city}", "{city} Darya", "Kavir {city}", "{city} Setareh", "Sepidrud {city}", "{city} Alborz", "Simorgh {city}", "{city} Shafagh", "Aftab {city}", "{city} Baran", "Zagros {city}"],
  SouthAsian: ["{city} Deccan", "{city} Maidan", "{city} Padma", "Himalaya {city}", "{city} Dakshin", "{city} Mohana", "Chakra {city}", "{city} Banyan", "Indigo {city}", "{city} Nadi", "Monsoon {city}", "{city} Kaveri"],
  Indonesian: ["{city} Garuda", "{city} Bintang", "{city} Persada", "{city} Surya", "{city} Samudra", "{city} Merdeka", "{city} Pusaka", "{city} Nusantara", "Cakrawala {city}", "{city} Rajawali", "{city} Pesisir", "Bumi {city}"],
  Malay: ["{city} Harimau", "{city} Mutiara", "{city} Laksamana", "Kesatuan {city}", "{city} Sejati", "{city} Bintang", "{city} Merdeka", "Seri {city}", "{city} Permata", "Pesisir {city}", "{city} Wira", "Samudera {city}"],
  Filipino: ["{city} Agila", "{city} Maharlika", "{city} Sinulog", "{city} Sampaguita", "{city} Lakambini", "{city} Lakan", "{city} Katipunan", "{city} Bayani", "{city} Silangan", "{city} Mayon", "{city} Hiraya", "{city} Lakbay"],
  Vietnamese: ["{city} Sao Do", "{city} Song Han", "{city} Tien Phong", "{city} Hoa Phuong", "{city} Thanh Nien", "{city} Long Bien", "{city} Bien Xanh", "{city} Sao Mai", "{city} Dong Son", "{city} Thang Long", "{city} Ngu Hanh", "{city} Mat Troi"],
  Thai: ["{city} Chao Phraya", "{city} Lanna", "{city} Muang", "{city} Ratcha", "{city} Siam", "{city} Singha", "{city} Andaman", "{city} Nakhon", "{city} Saranrom", "{city} Kinnaree", "{city} Suphan", "{city} Phaya"],
  Khmer: ["{city} Angkor", "{city} Nokor", "{city} Kbach", "{city} Samaki", "Preah {city}", "{city} Tonle", "{city} Banteay", "{city} Sorya", "{city} Chan", "{city} Khmer Heritage"],
  Mekong: ["{city} Naga", "{city} Mekong", "{city} Golden Pagoda", "{city} Lotus", "{city} Elephant", "{city} Shan", "{city} Ayeyar", "{city} Highland", "{city} Riverstone", "{city} Silk Road", "{city} Dok Champa", "{city} Nam Ou"],
  NorthAmerican: ["Harbour {city}", "{city} Bayfront", "{city} Lakeshore", "Union de {city}", "Club {city} del Sol", "{city} Cascade", "{city} Copperline", "{city} Pioneer Coast", "{city} Crossroads", "{city} Evergreen", "{city} Northstar", "{city} Blue Mesa"],
  African: ["{city} Stars", "{city} Rangers", "Union de {city}", "{city} Lions", "{city} Eleven", "{city} Sunbirds", "{city} Baobab", "{city} Kingsmen", "{city} Mountain Fire", "{city} Unity", "{city} Copperbelt", "{city} Rising Tide"],
  WestAfrican: ["{city} Savannah", "Union de {city}", "Étoile {city}", "{city} Elephants", "{city} Golden Eagles", "{city} Académie", "{city} Lions", "{city} Baobab", "{city} Coastline", "{city} Harmattan", "{city} Kente", "{city} Ananse"],
  EastAfrican: ["{city} Leopards", "{city} Kifaru", "{city} Twiga", "{city} Jangwani", "{city} Gorillas", "{city} Taifa", "{city} Milima", "{city} Pwani", "{city} Kaskazi", "{city} Ziwa", "{city} Bahari", "{city} Mwangaza"],
  SouthAfrican: ["{city} Amabutho", "{city} Ubuntu", "{city} Mambas", "{city} Blue Crane", "{city} Maroons", "{city} Inkanyezi", "{city} Highveld", "{city} Lowveld", "{city} Imbali", "{city} Thabeng", "{city} Coastline", "{city} Baobab"],
  NorthAfrican: ["{city} des Oliviers", "Union de la Médina {city}", "Racing des Dunes {city}", "{city} Chabab", "{city} des Remparts", "Atlas {city}", "{city} de la Kasbah", "Caravane {city}", "{city} des Jasmins", "{city} du Sahel", "Aurore {city}", "{city} du Levant"],
  Romanian: ["{city} Sportul", "{city} Viitorul", "{city} Gloria", "{city} CFR", "{city} Dunărea", "{city} Ardeal", "{city} Codru", "{city} Șoimii", "{city} Constructorul", "{city} Mureș", "{city} Metalul", "{city} Orizont"],
  Greek: ["Asteras {city}", "Ethnikos {city}", "{city} Aetos", "{city} Akropolis", "{city} Aegean", "{city} Olympus", "{city} Pelagos", "{city} Pindus", "{city} Nereids", "{city} Helios", "{city} Agora", "{city} Thalassa"],
  Dutch: ["{city} Sportkring", "{city} Voetbalclub", "Racing {city} Delta", "{city} Vooruit", "{city} Oranje", "{city} Dijk", "{city} Waterlinie", "{city} IJssel", "{city} Polder", "{city} Windmolen", "{city} Havenlicht", "{city} Rivierland"],
  Albanian: ["{city} Besëlidhja", "Flamurtari {city}", "{city} Besa", "{city} Shqiponja", "{city} Iliria", "{city} Kastrioti", "{city} Drini", "{city} Tomori", "{city} Arbëria", "{city} Dardania"],
  Hungarian: ["{city} VSC", "{city} Vasutas", "{city} Dózsa", "{city} Duna", "{city} Tisza", "{city} Bányász", "{city} Hajnal", "{city} Híd", "{city} Puszta", "{city} Arany", "{city} Sólyom"],
  Irish: ["{city} Shamrocks", "{city} Bohemians", "{city} Harbourlights", "{city} Bracken", "{city} Seanchas", "{city} Gallóglaigh", "{city} Tír", "{city} Slateworks", "{city} Morrow", "{city} Coastguard"],
  Israeli: ["{city} Ironi", "{city} Bnei", "{city} Galil", "{city} Negev", "{city} HaSharon", "{city} Carmel", "{city} Shephelah", "{city} Keshet", "{city} Oranim", "{city} Tavor"],
  Caribbean: ["{city} Islanders", "{city} Harbour", "{city} Mariners", "{city} Sugar Works", "{city} Calypso", "{city} Coral Coast", "{city} Cocoa Grove", "{city} Blue Mountain", "{city} Port Lights", "{city} Trade Winds", "{city} Carib", "{city} Tidewater"],
  European: ["{city} Ironworks", "Racing {city} Meridian", "{city} Starline", "{city} Rivergate", "{city} Stonebridge", "{city} Northstar", "{city} Foundry", "{city} Torchbearers", "{city} Crossroads", "{city} Old Quarter"],
  Oceania: ["{city} Pacific", "{city} Mariners", "{city} Southern Cross", "{city} Outrigger", "{city} Harbourlights", "{city} Kauri", "{city} Rata", "{city} Tasman", "{city} Coral", "{city} Seabreeze", "{city} Blackfern", "{city} Tidal"],
  English: ["{city} Foundry", "{city} Mariners", "{city} Beacon", "{city} Harbourlights", "{city} Works", "{city} Signal", "{city} Pioneers", "{city} Ranges", "{city} Quays", "{city} Ironworks", "{city} Mettle", "{city} Crossings"],
};

const CITY_CLUB_NAME_VARIANTS: Record<string, Record<string, string[]>> = {
  France: {
    Paris: ["Paris Union", "La Rive de Paris", "Paris des Passages", "Métropole de Paris", "Paris du Canal", "Paris Grand Ouest"],
    Marseille: ["Marseille des Calanques", "Les Docks de Marseille", "Mistral de Marseille", "Marseille Phocéen", "Marseille du Levant", "Union Maritime de Marseille"],
    Lyon: ["Lyon Confluence", "Les Canuts de Lyon", "Rhône et Lyon", "Cercle des Lumières de Lyon", "Lyon Croix-Rousse", "Les Traboules de Lyon", "Union des Rives de Lyon", "Lyon des Soieries", "Racing Club de Lyon"],
    Lille: ["Lille des Flandres", "Les Beffrois de Lille", "Métropole de Lille", "Union de Lille", "Lille Grand-Place", "Cercle Flandrien de Lille", "Les Drapiers de Lille", "Lille Saint-Sauveur", "Porte des Flandres de Lille"],
    Bordeaux: ["Bordeaux des Quais", "La Bastide de Bordeaux", "Garonne et Bordeaux", "Cercle de Bordeaux", "Bordeaux Vignoble", "Union de Bordeaux-Garonne"],
    Toulouse: ["Toulouse Occitanie", "Les Carmes de Toulouse", "Garonne et Toulouse", "Cercle de Toulouse-Minimes", "Toulouse Cité Rose", "Union Aéro de Toulouse"],
    Nice: ["Nice Riviera", "La Promenade de Nice", "Azur et Nice", "Cercle de Nice et des Baous", "Nice Paillon", "Union de Nice-Riviera"],
    Nantes: ["Nantes Estuaire", "Les Chantiers de Nantes", "Loire et Nantes", "Union des Rives de Nantes", "Nantes Île de Nantes", "Cercle de Nantes-Atlantique", "Les Grues de Nantes", "Nantes Hauts-Pavés", "Nantes Porte de Bretagne"],
    Strasbourg: ["Strasbourg du Rhin", "Les Ponts de Strasbourg", "Union Alsacienne de Strasbourg", "Cercle de Strasbourg-Neustadt", "Strasbourg Orangerie", "Rive du Rhin Strasbourg"],
  },
  Spain: { Sevilla: ["Sevilla Puerta del Sur", "Sevilla de la Vega", "Sevilla Guadalquivir", "Sevilla Torre del Oro"] },
};

const CLUB_NAME_QUALIFIERS: Record<string, string[]> = {
  Spanish: ["Norte", "Sur", "del Puerto", "del Valle", "de la Sierra", "del Río", "del Centro", "del Este", "del Oeste", "Universitario", "Ferroviario", "Industrial"],
  Portuguese: ["do Norte", "do Sul", "do Porto", "da Serra", "do Vale", "do Centro", "da Costa", "Ferroviário", "Universitário", "Atlântico"],
  French: ["du Nord", "du Sud", "du Port", "Métropole", "des Mines", "de la Côte", "de la Plaine", "Universitaire", "du Centre", "du Rhône"],
  German: ["Nord", "Süd", "West", "Ost", "Hafen", "Werk", "Vorstadt", "Universität", "Eisenbahn", "Am Rhein", "Am Main", "Am See"],
  Italian: ["Nord", "Sud", "del Porto", "della Valle", "della Costa", "Metropolitano", "Universitario", "Ferroviario", "del Mare", "della Collina"],
  Nordic: ["Norr", "Syd", "Öst", "Väst", "Hamn", "Stad", "Norra", "Södra", "Östra", "Västra"],
  Slavic: ["Sever", "Jug", "Centar", "Metalurg", "Železničar", "Akademik", "Mladost", "Sloga", "Radnik", "Rudar", "Proleter"],
  Arabic: ["Al-Bahr", "Al-Jabal", "Al-Wadi", "Al-Sahil", "Al-Nour", "Al-Fajr", "Al-Hilal", "Al-Madina", "Al-Balad", "Al-Rimal"],
  NorthAfrican: ["du Nord", "du Sud", "du Port", "de la Médina", "de la Côte", "des Oliviers", "de la Kasbah", "du Sahel", "de l'Atlas", "du Centre"],
  Japanese: ["Higashi", "Nishi", "Minami", "Kita", "Chuo", "Bay", "Hills", "Harbour", "Seaside", "Greenfield"],
  Korean: ["East", "West", "South", "North", "Central", "Harbour", "Mountain", "River", "Coast", "Capital"],
  Chinese: ["East", "West", "South", "North", "Central", "Harbour", "Riverside", "Mountain", "Coastal", "Capital"],
  CentralAsian: ["Sever", "Orda", "Turan", "Samal", "Barys", "Arlan", "Zhetysu", "Qanat", "Koktem", "Dala"],
  Turkish: ["Kuzey", "Güney", "Doğu", "Batı", "Merkez", "Liman", "Yıldız", "Ufuk", "Çınar", "Kale"],
  Persian: ["Shomal", "Jonub", "Sharq", "Gharb", "Mehr", "Azadi", "Darya", "Kavir", "Alborz", "Setareh"],
  SouthAsian: ["North", "South", "East", "West", "Central", "Maidan", "Harbour", "Railway", "University", "Deccan"],
  Indonesian: ["Utara", "Selatan", "Timur", "Barat", "Tengah", "Pesisir", "Pelabuhan", "Nusantara", "Nusakambangan", "Merdeka"],
  Malay: ["Utara", "Selatan", "Timur", "Barat", "Tengah", "Pesisir", "Pelabuhan", "Seri", "Diraja", "Mutiara"],
  Filipino: ["Hilaga", "Timog", "Silangan", "Kanluran", "Gitna", "Baybay", "Kapuluan", "Maharlika", "Mabuhay", "Palaro"],
  Vietnamese: ["Bắc", "Nam", "Đông", "Tây", "Trung Tâm", "Sông Hàn", "Hồng Hà", "Biển Đông", "Hoa Phượng", "Sao Vàng"],
  Thai: ["เหนือ", "ใต้", "ตะวันออก", "ตะวันตก", "กลาง", "เจ้าพระยา", "ล้านนา", "อันดามัน", "สยาม", "นคร"],
  Khmer: ["North", "South", "East", "West", "Central", "Angkor", "Mekong", "Nokor", "Samaki", "Kbach"],
  Mekong: ["North", "South", "East", "West", "Central", "Mekong", "Golden Pagoda", "Lotus", "Highland", "River"],
  Israeli: ["Haifa", "Tel Aviv", "Jerusalem", "HaSharon", "Negev", "Galil", "HaEmek", "HaDarom", "Maccabi", "Hapoel"],
  Romanian: ["Nord", "Sud", "Est", "Vest", "Central", "Universitar", "Fierar", "Minerul", "Gloria", "Dunărea"],
  Greek: ["North", "South", "East", "West", "Central", "Aegean", "Olympus", "Peloponnese", "Thessaly", "Attica"],
  Dutch: ["Noord", "Zuid", "Oost", "West", "Haven", "Rivier", "Centrum", "Universiteit", "IJssel", "Delta"],
  Albanian: ["Veriu", "Jugu", "Lindja", "Perëndimi", "Qendra", "Porti", "Flamuri", "Bashkimi", "Kastrioti", "Drita"],
  Hungarian: ["Észak", "Dél", "Kelet", "Nyugat", "Városi", "Vasutas", "Bányász", "Egyetemi", "Duna", "Tisza"],
  Irish: ["Northside", "Southside", "Harbour", "Railway", "University", "Riverside", "Old Town", "City End", "Shamrock", "Gaelic"],
  WestAfrican: ["North", "South", "East", "West", "Central", "Harbour", "Railway", "Royal", "Savannah", "Coastal"],
  EastAfrican: ["Kaskazini", "Kusini", "Mashariki", "Magharibi", "Kati", "Pwani", "Milima", "Mji", "Ziwa", "Umoja"],
  SouthAfrican: ["North", "South", "East", "West", "Central", "Township", "Harbour", "Highveld", "Lowveld", "Coastal"],
  African: ["North", "South", "East", "West", "Central", "Harbour", "Railway", "Coastal", "Highland", "Riverside"],
  NorthAmerican: ["Northside", "Southside", "East End", "West End", "Harbour", "Riverside", "Metropolitan", "University", "Lakeshore", "Old Town"],
  Caribbean: ["Northside", "Southside", "Harbour", "Bayfront", "Sugar Coast", "Island", "Port", "Old Town", "Lighthouse", "Seaside"],
  Oceania: ["Northside", "Southside", "Harbour", "Riverside", "Coastal", "Pacific", "University", "Railway", "Island", "Central"],
  European: ["North", "South", "East", "West", "Central", "Harbour", "Riverside", "Railway", "University", "Old Town"],
  English: ["Northside", "Southside", "East End", "West End", "Harbour", "Riverside", "University", "Old Town", "Metropolitan", "Railway"],
};

function clubNameStyle(country: string, continent: WorldContinent) {
  if (country === "Spain" || SPANISH_STYLE_COUNTRIES.has(country)) return "Spanish";
  if (PORTUGUESE_STYLE_COUNTRIES.has(country)) return "Portuguese";
  if (country === "Iran" || country === "Afghanistan") return "Persian";
  if (ARABIC_STYLE_COUNTRIES.has(country)) return "Arabic";
  if (["Algeria", "Morocco", "Tunisia"].includes(country)) return "NorthAfrican";
  if (SOUTH_ASIAN_STYLE_COUNTRIES.has(country)) return "SouthAsian";
  if (INDONESIAN_STYLE_COUNTRIES.has(country)) return "Indonesian";
  if (MALAY_STYLE_COUNTRIES.has(country)) return "Malay";
  if (FILIPINO_STYLE_COUNTRIES.has(country)) return "Filipino";
  if (VIETNAMESE_STYLE_COUNTRIES.has(country)) return "Vietnamese";
  if (THAI_STYLE_COUNTRIES.has(country)) return "Thai";
  if (KHMER_STYLE_COUNTRIES.has(country)) return "Khmer";
  if (MEKONG_STYLE_COUNTRIES.has(country)) return "Mekong";
  if (CENTRAL_ASIAN_STYLE_COUNTRIES.has(country)) return "CentralAsian";
  if (country === "South Africa") return "SouthAfrican";
  if (country === "Romania" || country === "Moldova") return "Romanian";
  if (ALBANIAN_STYLE_COUNTRIES.has(country)) return "Albanian";
  if (HUNGARIAN_STYLE_COUNTRIES.has(country)) return "Hungarian";
  if (IRISH_STYLE_COUNTRIES.has(country)) return "Irish";
  if (country === "Israel") return "Israeli";
  if (country === "Suriname") return "Dutch";
  if (EAST_AFRICAN_STYLE_COUNTRIES.has(country)) return "EastAfrican";
  if (["Greece", "Cyprus"].includes(country)) return "Greek";
  if (country === "Netherlands") return "Dutch";
  if (NORDIC_STYLE_COUNTRIES.has(country)) return "Nordic";
  if (["United States", "Canada"].includes(country)) return "NorthAmerican";
  if (WEST_AFRICAN_STYLE_COUNTRIES.has(country)) return "WestAfrican";
  if (FRENCH_STYLE_COUNTRIES.has(country)) return "French";
  if (SLAVIC_STYLE_COUNTRIES.has(country)) return "Slavic";
  if (["Germany", "Austria", "Switzerland"].includes(country)) return "German";
  if (["Italy", "San Marino"].includes(country)) return "Italian";
  if (country === "Japan") return "Japanese";
  if (["North Korea", "South Korea"].includes(country)) return "Korean";
  if (["China", "Taiwan"].includes(country)) return "Chinese";
  if (country === "Türkiye") return "Turkish";
  if (continent === "Africa") return "African";
  if (continent === "Europe") return "European";
  if (continent === "Oceania") return "Oceania";
  if (continent === "North America" || country === "Guyana") return "Caribbean";
  if (continent === "South America") return "Spanish";
  return "English";
}

function slug(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function palette(index: number): [string, string] {
  const colors: [string, string][] = [["#126c58", "#e8eee1"], ["#193d78", "#edc969"], ["#ad3b43", "#f3eadd"], ["#6f4d9d", "#f0dc9b"], ["#d06c31", "#173c44"], ["#28778a", "#f0f2e5"], ["#823b67", "#d7d5ef"], ["#4d662e", "#ede3c8"], ["#303943", "#d0a653"], ["#d5a624", "#202f4a"]];
  return colors[index % colors.length];
}

const WORLD_TOP_FLIGHTS: WorldLeagueDefinition[] = WORLD_COUNTRIES
  .filter(({ country }) => country !== "England")
  .map(({ country, continent }, index) => {
    const style = LEAGUE_STYLES[continent][index % LEAGUE_STYLES[continent].length];
    const id = `world-${slug(country)}-first`;
    const clubs = REALISTIC_LEAGUE_SIZES[country] ?? WORLD_LEAGUE_SIZE_DEFAULT[continent];
    const rounds = country === "United States" ? 34 : country === "Argentina" ? 30 : clubs * 2 - 2;
    return { id, name: REALISTIC_LEAGUE_NAMES[country] ?? `${country} ${style}`, country, continent, tier: 1, clubs, rounds, region: continent, promotionPlaces: 0, relegationPlaces: 2, automaticPromotion: 0, playoffPlaces: 0, playoffLabel: "" };
  });

const WORLD_SECOND_TIERS: WorldLeagueDefinition[] = WORLD_TOP_FLIGHTS.map((top) => {
  const clubs = REALISTIC_SECOND_TIER_SIZES[top.country] ?? Math.max(10, Math.min(24, top.clubs));
  return {
    id: `world-${slug(top.country)}-second`,
    name: REALISTIC_SECOND_LEAGUE_NAMES[top.country] ?? `${top.country} Second Division`,
    country: top.country,
    continent: top.continent,
    tier: 2,
    clubs,
    rounds: clubs * 2 - 2,
    region: top.region,
    promotionPlaces: 2,
    relegationPlaces: 0,
    automaticPromotion: 2,
    playoffPlaces: 0,
    playoffLabel: "Top two promoted",
  };
});

export const WORLD_LEAGUES: WorldLeagueDefinition[] = WORLD_TOP_FLIGHTS.flatMap((top) => {
  const second = WORLD_SECOND_TIERS.find((league) => league.country === top.country)!;
  return [top, second];
});

const leagueByCountry = new Map(WORLD_LEAGUES.map((league) => [league.country, league]));

export function worldLeagueForCountry(country: string, tier = 1) {
  return WORLD_LEAGUES.find((league) => league.country === country && league.tier === tier) ?? leagueByCountry.get(country);
}

export function worldLeagueById(id: string) {
  return WORLD_LEAGUES.find((league) => league.id === id);
}

function cityIndexForClub(cityCount: number, countryIndex: number, clubIndex: number, tierOffset: number) {
  if (cityCount === 1 || (clubIndex === 0 && tierOffset === 0)) return 0;
  return 1 + ((clubIndex - 1 + countryIndex + tierOffset * 3) % (cityCount - 1));
}

function cityNameOrdinal(country: WorldCountry, countryIndex: number, cityIndex: number, tierOffset: number, clubIndex: number) {
  const topSize = REALISTIC_LEAGUE_SIZES[country.country] ?? WORLD_LEAGUE_SIZE_DEFAULT[country.continent];
  const secondSize = REALISTIC_SECOND_TIER_SIZES[country.country] ?? Math.max(10, Math.min(24, topSize));
  const tierSizes = [topSize, secondSize];
  let ordinal = 0;
  for (let tier = 0; tier <= tierOffset; tier += 1) {
    const priorCount = tier < tierOffset ? tierSizes[tier] : clubIndex;
    for (let index = 0; index < priorCount; index += 1) {
      if (cityIndexForClub(WORLD_CITY_NAMES_BY_COUNTRY[country.country].length, countryIndex, index, tier) === cityIndex) ordinal += 1;
    }
  }
  return ordinal;
}

function clubNameVariantIndex(country: string, city: string, tierOffset: number, clubIndex: number, cityOrdinal: number, templateCount: number) {
  // A stable hash spreads naming forms through each league without making the
  // same first, second or third template recur in every city.
  const key = `${country}|${city}|${tierOffset}|${clubIndex}|${cityOrdinal}`;
  let hash = 2_166_136_261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0) % templateCount;
}

function makeWorldClub(country: WorldCountry, league: WorldLeagueDefinition, countryIndex: number, clubIndex: number): WorldClubSeed {
  const cities = WORLD_CITY_NAMES_BY_COUNTRY[country.country];
  const tierOffset = league.tier - 1;
  const cityIndex = cityIndexForClub(cities.length, countryIndex, clubIndex, tierOffset);
  const city = cities[cityIndex];
  const style = clubNameStyle(country.country, country.continent);
  const templates = CLUB_NAME_TEMPLATES[style];
  const cityOrdinal = cityNameOrdinal(country, countryIndex, cityIndex, tierOffset, clubIndex);
  // Choose a local naming form per club, not only per city's ordinal. The old
  // ordinal-only index made the first club in every town share one template,
  // so whole leagues repeatedly read like "X Horizon" or "Union de Y".
  const templateIndex = clubNameVariantIndex(country.country, city, tierOffset, clubIndex, cityOrdinal, templates.length);
  const generatedName = templates[templateIndex].replace("{city}", city);
  const cityVariants = CITY_CLUB_NAME_VARIANTS[country.country]?.[city];
  const name = cityVariants?.[cityOrdinal] ?? generatedName;
  const short = `${String(countryIndex + 1).padStart(3, "0")}${String(clubIndex + 1).padStart(2, "0")}`;
  const globalFootballMarket = ["Argentina", "Australia", "Brazil", "China", "France", "Germany", "India", "Italy", "Japan", "Mexico", "Netherlands", "Portugal", "Saudi Arabia", "South Africa", "South Korea", "Spain", "Türkiye", "United States"].includes(country.country) ? 9 : 0;
  const continentalMarket = country.continent === "Europe" || country.continent === "South America" ? 4 : 0;
  const positionFactor = league.clubs <= 1 ? 1 : clubIndex / (league.clubs - 1);
  const reputation = Math.max(24, Math.min(92, Math.round(78 + globalFootballMarket + continentalMarket - positionFactor * 51 + (countryIndex * 11) % 8 - 3 - tierOffset * 12)));
  const marketScale = (["Germany", "France", "Italy", "Spain", "United Kingdom", "Japan", "South Korea", "United States", "Canada", "Australia"].includes(country.country) ? 1.12 : country.continent === "Africa" || country.continent === "Oceania" ? 0.76 : 0.92) * (tierOffset === 0 ? 1 : 0.82);
  const capacity = Math.max(3_000, Math.round((3_500 + reputation * 360) * marketScale / 500) * 500);
  return {
    name,
    short: `W${tierOffset ? `2${short}` : short}`,
    city,
    reputation,
    colors: palette(countryIndex * 5 + clubIndex),
    capacity,
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

const DUPLICATE_NAME_ORDINALS = ["II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];
const usedClubNames = new Set<string>();
export const WORLD_CLUB_SEEDS = GENERATED_WORLD_CLUB_SEEDS.map((club, index) => {
  let name = club.name;
  if (usedClubNames.has(name)) {
    const style = clubNameStyle(club.country, club.continent);
    const qualifiers = CLUB_NAME_QUALIFIERS[style] ?? CLUB_NAME_QUALIFIERS.European;
    for (let attempt = 0; attempt < qualifiers.length; attempt += 1) {
      const qualifier = qualifiers[(index + attempt) % qualifiers.length];
      const candidate = `${club.name} ${qualifier}`;
      if (!usedClubNames.has(candidate)) {
        name = candidate;
        break;
      }
    }
    let collision = 0;
    while (usedClubNames.has(name)) {
      const suffix = DUPLICATE_NAME_ORDINALS[collision] ?? String(collision + 2);
      name = `${club.name} ${suffix}`;
      collision += 1;
    }
  }
  usedClubNames.add(name);
  return { ...club, name };
});

export const WORLD_LEAGUE_COUNTRY_COUNT = WORLD_COUNTRIES.length;
export const WORLD_CLUB_COUNT = WORLD_CLUB_SEEDS.length;
