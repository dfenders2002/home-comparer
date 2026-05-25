export type EnergyLabel =
  | 'G' | 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'A+' | 'A++' | 'A+++' | 'A++++';

export interface Home {
  id: string;
  address: string;
  city: string;
  fundaUrl: string;
  askPrice: number;
  m2: number;
  bouwjaar: number;
  energyLabel: EnergyLabel;
  vveMonthly: number;
  ownParking: boolean;
  outdoorSpace?: string;        // e.g. "ZW-balkon", "tuin"
  woz: { '2023': number; '2024': number; '2025': number };
  huispedia: { p40: number; p60: number; p80: number };
  popularity: {
    viewsPerDay?: number;
    saves?: number;
    daysOnFunda?: number;
  };
  monthlyExtras?: {
    gas?: number;
    electricity?: number;
    water?: number;
    otherFixed?: number;
  };
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
    fundaUrl: 'https://www.funda.nl/detail/koop/alphen-aan-den-rijn/appartement-gravenstraat-93/80814978/',
    askPrice: 365_000,
    m2: 69,
    bouwjaar: 1989,
    energyLabel: 'A',
    vveMonthly: 160,
    ownParking: false,
    outdoorSpace: 'balkon',
    woz: { '2023': 270_000, '2024': 275_000, '2025': 316_000 },
    huispedia: { p40: 388_000, p60: 399_000, p80: 412_000 },
    popularity: { daysOnFunda: 7 },
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
    fundaUrl: 'https://www.funda.nl/detail/koop/alphen-aan-den-rijn/appartement-azielaan-57/43332025/',
    askPrice: 440_000,
    m2: 87,
    bouwjaar: 2016,
    energyLabel: 'A+',
    vveMonthly: 256,
    ownParking: true,
    outdoorSpace: 'ZW-balkon',
    woz: { '2023': 347_000, '2024': 369_000, '2025': 449_000 },
    huispedia: { p40: 464_000, p60: 478_000, p80: 494_000 },
    popularity: { daysOnFunda: 20 },
    pros: [
      'Grootst (87m²)',
      'Beste prijs/m² (€5.057)',
      'Naast NS-station Alphen',
      'Eigen parkeerplek in garage',
      'ZW-balkon',
      '20 dagen op Funda → ruimte om onder te bieden'
    ],
    cons: [
      'Drukke weg in omschrijving',
      'Hoogste VvE (€256)',
      'Vraagprijs boven max hypotheek → extra eigen geld'
    ]
  },
  {
    id: 'abel-tasmanstraat-128',
    address: 'Abel Tasmanstraat 128',
    city: 'Alphen aan den Rijn',
    fundaUrl: 'https://www.funda.nl/detail/koop/alphen-aan-den-rijn/appartement-abel-tasmanstraat-128/80813340/',
    askPrice: 479_000,
    m2: 85,
    bouwjaar: 2022,
    energyLabel: 'A++',
    vveMonthly: 180,
    ownParking: true,
    outdoorSpace: 'balkon',
    woz: { '2023': 368_000, '2024': 401_000, '2025': 459_000 },
    huispedia: { p40: 502_000, p60: 517_000, p80: 534_000 },
    popularity: { daysOnFunda: 4 },
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
  }
];
