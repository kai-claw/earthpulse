/**
 * Curated gallery of historically significant earthquakes.
 * Used for the "Historical" exploration mode.
 */

export interface HistoricalEarthquake {
  id: string;
  name: string;
  year: number;
  date: string;
  magnitude: number;
  lat: number;
  lng: number;
  depth: number;
  deaths: string;
  description: string;
  category: 'deadliest' | 'strongest' | 'notable';
}

export const HISTORICAL_EARTHQUAKES: HistoricalEarthquake[] = [
  // ─── Deadliest ───
  {
    id: 'hist-1556-shaanxi',
    name: '1556 Shaanxi',
    year: 1556,
    date: 'Jan 23, 1556',
    magnitude: 8.0,
    lat: 34.5,
    lng: 109.7,
    depth: 30,
    deaths: '~830,000',
    description: 'Deadliest earthquake in recorded history. Collapsed loess cave dwellings across the Wei River valley in Ming dynasty China. Affected an area of 840 km.',
    category: 'deadliest',
  },
  {
    id: 'hist-2010-haiti',
    name: '2010 Haiti',
    year: 2010,
    date: 'Jan 12, 2010',
    magnitude: 7.0,
    lat: 18.457,
    lng: -72.533,
    depth: 13,
    deaths: '~220,000',
    description: 'Struck near Port-au-Prince with devastating shallow depth. Destroyed 250,000 homes and 30,000 commercial buildings. Haiti\'s infrastructure was near-totally collapsed.',
    category: 'deadliest',
  },
  {
    id: 'hist-2004-sumatra',
    name: '2004 Indian Ocean',
    year: 2004,
    date: 'Dec 26, 2004',
    magnitude: 9.1,
    lat: 3.316,
    lng: 95.854,
    depth: 30,
    deaths: '~228,000',
    description: 'Generated the deadliest tsunami in history. Waves up to 30m struck 14 countries across the Indian Ocean. Third-largest earthquake ever recorded. Shifted Earth\'s axis by 2.3 cm.',
    category: 'deadliest',
  },
  {
    id: 'hist-1976-tangshan',
    name: '1976 Tangshan',
    year: 1976,
    date: 'Jul 28, 1976',
    magnitude: 7.5,
    lat: 39.6,
    lng: 118.2,
    depth: 15,
    deaths: '~242,000',
    description: 'Struck at 3:42 AM while residents slept. Leveled an industrial city of 1 million. Official death toll was 242,000 but some estimates reach 700,000.',
    category: 'deadliest',
  },

  // ─── Strongest ───
  {
    id: 'hist-1960-chile',
    name: '1960 Great Chilean',
    year: 1960,
    date: 'May 22, 1960',
    magnitude: 9.5,
    lat: -38.143,
    lng: -73.407,
    depth: 25,
    deaths: '~1,655',
    description: 'Most powerful earthquake ever recorded. Ruptured over 1,000 km of fault. Triggered tsunamis that crossed the Pacific, reaching Japan and the Philippines 22 hours later.',
    category: 'strongest',
  },
  {
    id: 'hist-1964-alaska',
    name: '1964 Alaska',
    year: 1964,
    date: 'Mar 27, 1964',
    magnitude: 9.2,
    lat: 61.04,
    lng: -147.73,
    depth: 25,
    deaths: '131',
    description: 'Second-largest earthquake ever recorded. Lasted nearly 4.5 minutes. Caused massive landslides and a tsunami that devastated Alaskan coastal towns.',
    category: 'strongest',
  },
  {
    id: 'hist-2011-tohoku',
    name: '2011 Tōhoku',
    year: 2011,
    date: 'Mar 11, 2011',
    magnitude: 9.1,
    lat: 38.322,
    lng: 142.369,
    depth: 29,
    deaths: '~19,759',
    description: 'Triggered a massive tsunami with waves up to 40.5m. Caused the Fukushima nuclear disaster. Moved Honshu 2.4m eastward. Shifted Earth\'s axis by 10-25 cm.',
    category: 'strongest',
  },
  {
    id: 'hist-1952-kamchatka',
    name: '1952 Kamchatka',
    year: 1952,
    date: 'Nov 4, 1952',
    magnitude: 9.0,
    lat: 52.76,
    lng: 160.06,
    depth: 30,
    deaths: '~2,336',
    description: 'Generated a destructive Pacific-wide tsunami. Waves reached Hawaii, Japan, Alaska, Chile, and New Zealand. Damaged Severo-Kurilsk beyond recognition.',
    category: 'strongest',
  },

  // ─── Notable / Iconic ───
  {
    id: 'hist-1906-sf',
    name: '1906 San Francisco',
    year: 1906,
    date: 'Apr 18, 1906',
    magnitude: 7.9,
    lat: 37.75,
    lng: -122.55,
    depth: 8,
    deaths: '~3,000',
    description: 'Ruptured 477 km of the San Andreas Fault. The subsequent fires burned for 3 days, destroying 80% of San Francisco. Led to modern earthquake engineering.',
    category: 'notable',
  },
  {
    id: 'hist-2015-nepal',
    name: '2015 Nepal (Gorkha)',
    year: 2015,
    date: 'Apr 25, 2015',
    magnitude: 7.8,
    lat: 28.23,
    lng: 84.731,
    depth: 8.2,
    deaths: '~8,964',
    description: 'Triggered avalanches on Everest killing 22 climbers. Destroyed centuries-old temples in Kathmandu\'s Durbar Square. Over 600,000 structures damaged.',
    category: 'notable',
  },
  {
    id: 'hist-1755-lisbon',
    name: '1755 Lisbon',
    year: 1755,
    date: 'Nov 1, 1755',
    magnitude: 8.5,
    lat: 36.0,
    lng: -11.0,
    depth: 30,
    deaths: '~60,000',
    description: 'Struck on All Saints\' Day while churches were full. Followed by a tsunami and massive fires. Profoundly influenced Enlightenment philosophy (Voltaire\'s Candide).',
    category: 'notable',
  },
  {
    id: 'hist-2023-turkey',
    name: '2023 Turkey–Syria',
    year: 2023,
    date: 'Feb 6, 2023',
    magnitude: 7.8,
    lat: 37.174,
    lng: 37.032,
    depth: 10,
    deaths: '~59,259',
    description: 'Double earthquake (M7.8 + M7.7) nine hours apart. Flattened entire neighborhoods across southeastern Turkey and northern Syria. Over 164,000 buildings collapsed.',
    category: 'notable',
  },
];

/**
 * Get historical earthquakes by category.
 */
export function getHistoricalByCategory(category: HistoricalEarthquake['category']): HistoricalEarthquake[] {
  return HISTORICAL_EARTHQUAKES.filter(eq => eq.category === category);
}
