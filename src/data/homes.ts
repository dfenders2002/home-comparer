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
    id: 'sacharovlaan-41',
    address: 'Dr. A.D. Sacharovlaan 41',
    city: 'Alphen aan den Rijn',
    neighborhood: 'Paradijslaan',
    fundaUrl: 'https://www.funda.nl/detail/koop/alphen-aan-den-rijn/appartement-dr-ad-sacharovlaan-41/89784186/',
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
      viewsTotal: 3258,
      saves: 25,
      daysOnFunda: 33,
      listedOn: '2026-04-23'
    },
    renovationEstimate: 20_000,      // vloer + keuken + stuc + schilderen (zonder badkamer)
    pros: [
      'Goedkoopst per m² (€4.762)',
      '84m² ruime indeling',
      'Lage energiekosten (€60/mnd gas+elektra)',
      'Lift in complex, inpandige berging',
      'Centraal — loopafstand centrum + NS-station',
      'Koude markt → biedmarge'
    ],
    cons: [
      'Hoogste VvE (€268)',
      'Geen eigen parkeerplek',
      'Renovatie nodig: vloer, keuken, stuc, schilderen (~€20K, ~4-6 weken werk)',
      'Badkamer (ligbad) gedateerd maar functioneel — later op te knappen',
      'Bouwjaar 1994'
    ]
  }
];
