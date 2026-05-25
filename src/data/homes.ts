export type EnergyLabel =
  | 'G' | 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'A+' | 'A++' | 'A+++' | 'A++++';

export type AptType = 'galerijflat' | 'portiekflat' | 'corridorflat' | 'maisonette' | 'penthouse';

export interface Home {
  id: string;
  address: string;
  city: string;
  neighborhood?: string;
  fundaUrl: string;
  askPrice: number;
  m2: number;
  bouwjaar: number;
  energyLabel: EnergyLabel;
  vveMonthly: number;
  ownParking: boolean;
  outdoorSpace?: string;        // e.g. "ZW-balkon", "tuin"
  bedrooms?: number;
  storageM2?: number;           // bergingsruimte
  hasLift?: boolean;
  aptType?: AptType;
  woz?: { '2023': number; '2024': number; '2025': number };
  huispedia?: { p40: number; p60: number; p80: number };
  popularity: {
    viewsTotal?: number;
    saves?: number;
    daysOnFunda?: number;
    listedOn?: string;        // ISO date
  };
  monthlyExtras?: {
    gas?: number;
    electricity?: number;
    water?: number;
    otherFixed?: number;
  };
  renovationEstimate?: number;  // EUR to bring up to standard (floor/kitchen/paint)
  notes?: string;
  pros?: string[];
  cons?: string[];
}

// ---------------------------------------------------------------------------
// Seed: three Funda apartments in Alphen aan den Rijn (May 2026)
// Source: vergelijking-final.xlsx + user-provided WOZ + huispedia
// ---------------------------------------------------------------------------

export const HOMES: Home[] = [
  {
    id: 'gravenstraat-93',
    address: 'Gravenstraat 93',
    city: 'Alphen aan den Rijn',
    neighborhood: 'Gouwsluis',
    fundaUrl: 'https://www.funda.nl/detail/koop/alphen-aan-den-rijn/appartement-gravenstraat-93/80814978/',
    askPrice: 365_000,
    m2: 69,
    bouwjaar: 1989,
    energyLabel: 'A',
    vveMonthly: 160,
    ownParking: false,
    outdoorSpace: 'balkon-oost',
    bedrooms: 2,
    storageM2: 6,
    hasLift: false,
    aptType: 'portiekflat',
    woz: { '2023': 270_000, '2024': 275_000, '2025': 316_000 },
    huispedia: { p40: 388_000, p60: 399_000, p80: 412_000 },
    popularity: {
      viewsTotal: 1055,
      saves: 26,
      daysOnFunda: 5,
      listedOn: '2026-05-20'
    },
    pros: [
      'Goedkoopst van de drie',
      'Past makkelijk binnen hypotheek',
      'Recent vernieuwd (2022)',
      'Lage VvE (€160)'
    ],
    cons: [
      'Oudst (1989)',
      'Kleinst (69m²)',
      'Geen eigen parkeerplek',
      'Label A — laagst van de drie',
      'Verwacht concurrentie — weinig ruimte om laag te bieden'
    ]
  },
  {
    id: 'azielaan-57',
    address: 'Aziëlaan 57',
    city: 'Alphen aan den Rijn',
    neighborhood: 'Kerk en Zanen',
    fundaUrl: 'https://www.funda.nl/detail/koop/alphen-aan-den-rijn/appartement-azielaan-57/43332025/',
    askPrice: 440_000,
    m2: 87,
    bouwjaar: 2016,
    energyLabel: 'A+',
    vveMonthly: 216,                 // €176 appartement + €40,30 parkeerplaats
    ownParking: true,
    outdoorSpace: 'ZW-balkon (9m²)',
    bedrooms: 2,
    storageM2: 16,
    hasLift: true,
    aptType: 'galerijflat',
    woz: { '2023': 347_000, '2024': 369_000, '2025': 449_000 },
    huispedia: { p40: 464_000, p60: 478_000, p80: 494_000 },
    popularity: {
      viewsTotal: 2330,
      saves: 17,
      daysOnFunda: 20,
      listedOn: '2026-05-05'
    },
    renovationEstimate: 18_000,      // vloer + keuken + muren verven
    pros: [
      'Grootst (87m²)',
      'Beste prijs/m² (€5.057)',
      'Naast NS-station Alphen',
      'Eigen parkeerplek in garage',
      'ZW-balkon met vrij uitzicht',
      'Volledig geïsoleerd, label A+',
      'Koudste markt (20 dagen, lage views/dag) → biedmarge'
    ],
    cons: [
      'Aan drukke weg',
      'Renovatie nodig: vloer, keuken, muren (~€18K)',
      'Vraagprijs boven max hypotheek bij label B-cap (maar past wel binnen A+ cap)'
    ]
  },
  {
    id: 'abel-tasmanstraat-128',
    address: 'Abel Tasmanstraat 128',
    city: 'Alphen aan den Rijn',
    neighborhood: 'Bedrijventerrein Rijnhaven-Oost',
    fundaUrl: 'https://www.funda.nl/detail/koop/alphen-aan-den-rijn/appartement-abel-tasmanstraat-128/80813340/',
    askPrice: 479_000,
    m2: 85,
    bouwjaar: 2022,
    energyLabel: 'A++',
    vveMonthly: 206,                 // €206,37 — pure VvE bijdrage
    monthlyExtras: { gas: 134 },     // stookkosten inbegrepen via VvE-totaal €340
    ownParking: true,
    outdoorSpace: 'balkon-west',
    bedrooms: 2,
    storageM2: 6,
    hasLift: true,
    aptType: 'corridorflat',
    woz: { '2023': 368_000, '2024': 401_000, '2025': 459_000 },
    huispedia: { p40: 502_000, p60: 517_000, p80: 534_000 },
    popularity: {
      viewsTotal: 1435,
      saves: 17,
      daysOnFunda: 6,
      listedOn: '2026-05-19'
    },
    pros: [
      'Nieuwste (2022)',
      'Beste label (A++)',
      'Laagste energiekosten',
      'Eigen parkeerplek',
      'WTW-installatie'
    ],
    cons: [
      'Duurst (€479K)',
      'Hoogste prijs/m² (€5.635)',
      'Wijk is bedrijventerrein-achtig',
      'Hoge concurrentie verwacht'
    ]
  },
  {
    id: 'sacharovlaan-41',
    address: 'Dr. A.D. Sacharovlaan 41',
    city: 'Alphen aan den Rijn',
    neighborhood: 'Paradijslaan',
    fundaUrl: 'https://www.funda.nl/detail/koop/alphen-aan-den-rijn/appartement-dr-a-d-sacharovlaan-41/',
    askPrice: 400_000,
    m2: 84,
    bouwjaar: 1994,
    energyLabel: 'A',
    vveMonthly: 268,
    monthlyExtras: { gas: 60 },      // "gas/elektra slechts €60/mnd"
    ownParking: false,
    outdoorSpace: 'zonnig balkon',
    bedrooms: 2,
    storageM2: 5,
    hasLift: true,
    aptType: 'portiekflat',
    woz: { '2023': 308_000, '2024': 314_000, '2025': 340_000 },
    huispedia: undefined,        // niet op Huispedia te vinden
    popularity: {
      viewsTotal: 3248,
      saves: 25,
      daysOnFunda: 32,
      listedOn: '2026-04-23'
    },
    renovationEstimate: 30_000,      // vloer + keuken + muren + badkamer
    pros: [
      'Goedkoopst per m² (€4.762)',
      '84m² ruime indeling',
      'Lage energiekosten (€60/mnd gas+elektra)',
      'Lift in complex, inpandige berging',
      'Centraal — loopafstand centrum + NS-station',
      '32 dagen op Funda → koudste van de 4 → biedmarge'
    ],
    cons: [
      'Hoogste VvE (€268)',
      'Geen eigen parkeerplek',
      'Veel renovatie nodig: vloer, keuken, muren, badkamer (~€30K)',
      'Badkamer met ligbad is gedateerd',
      'Bouwjaar 1994 (op één na oudste)'
    ]
  }
];
