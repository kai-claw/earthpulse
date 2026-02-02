/**
 * Earthquake energy calculations and human-scale comparisons.
 * Uses the Gutenberg-Richter energy-magnitude relation:
 *   log₁₀(E) = 1.5M + 4.8  (E in joules)
 */

/** Energy in joules for common references */
const REFERENCE_ENERGIES = {
  lightning:       1e9,           // ~1 GJ per bolt
  dynamiteStick:   4.184e6,      // 1 kg TNT = 4.184 MJ
  tntTon:          4.184e9,      // 1 ton TNT
  hiroshima:       6.3e13,       // ~15 kT TNT
  krakatoa:        8.4e17,       // 1883 eruption
  annualUS:        1.08e20,      // Annual US electricity consumption
} as const;

export interface EnergyComparison {
  joules: number;
  tntTons: number;
  comparisons: { icon: string; label: string; detail: string }[];
}

/**
 * Calculate seismic energy from moment magnitude using Gutenberg-Richter.
 * Returns a safe positive value even for NaN/Infinity inputs.
 */
export function magnitudeToJoules(magnitude: number): number {
  const m = Number.isFinite(magnitude) ? magnitude : 0;
  return Math.pow(10, 1.5 * m + 4.8);
}

/**
 * Format large numbers with appropriate SI prefix.
 */
function formatEnergy(value: number): string {
  if (value >= 1e18) return `${(value / 1e18).toFixed(1)} EJ`;
  if (value >= 1e15) return `${(value / 1e15).toFixed(1)} PJ`;
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)} TJ`;
  if (value >= 1e9)  return `${(value / 1e9).toFixed(1)} GJ`;
  if (value >= 1e6)  return `${(value / 1e6).toFixed(1)} MJ`;
  if (value >= 1e3)  return `${(value / 1e3).toFixed(1)} kJ`;
  return `${value.toFixed(0)} J`;
}

/**
 * Format a count for display (with k/M suffix for large numbers).
 */
function formatCount(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} billion`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} million`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}k`;
  if (n >= 100) return Math.round(n).toString();
  if (n >= 10)  return n.toFixed(0);
  return n.toFixed(1);
}

/**
 * Get energy comparison data for a given magnitude.
 * Returns joules, TNT equivalent, and human-scale comparisons.
 */
export function getEnergyComparison(magnitude: number): EnergyComparison {
  const joules = magnitudeToJoules(magnitude);
  const tntTons = joules / REFERENCE_ENERGIES.tntTon;
  const comparisons: EnergyComparison['comparisons'] = [];

  // Lightning bolts
  const lightningCount = joules / REFERENCE_ENERGIES.lightning;
  if (lightningCount >= 1) {
    comparisons.push({
      icon: '⚡',
      label: `${formatCount(lightningCount)} lightning bolts`,
      detail: `${formatEnergy(joules)} of seismic energy`,
    });
  }

  // Dynamite sticks (for smaller quakes)
  const dynamiteCount = joules / REFERENCE_ENERGIES.dynamiteStick;
  if (magnitude < 5 && dynamiteCount >= 1) {
    comparisons.push({
      icon: '🧨',
      label: `${formatCount(dynamiteCount)} sticks of dynamite`,
      detail: `${tntTons < 1 ? `${(tntTons * 1000).toFixed(0)} kg` : `${tntTons.toFixed(1)} tons`} of TNT`,
    });
  }

  // TNT tons (for mid-range)
  if (magnitude >= 3 && magnitude < 7) {
    if (tntTons >= 1000) {
      comparisons.push({
        icon: '💥',
        label: `${formatCount(tntTons)} tons of TNT`,
        detail: `${(tntTons / 1000).toFixed(1)} kilotons`,
      });
    } else if (tntTons >= 1) {
      comparisons.push({
        icon: '💥',
        label: `${formatCount(tntTons)} tons of TNT`,
        detail: 'Pure explosive energy',
      });
    }
  }

  // Hiroshima bombs (for significant quakes)
  const hiroshimaCount = joules / REFERENCE_ENERGIES.hiroshima;
  if (hiroshimaCount >= 0.01) {
    if (hiroshimaCount < 1) {
      comparisons.push({
        icon: '☢️',
        label: `${(hiroshimaCount * 100).toFixed(0)}% of Hiroshima bomb`,
        detail: `${(tntTons / 1000).toFixed(2)} kilotons equivalent`,
      });
    } else {
      comparisons.push({
        icon: '☢️',
        label: `${formatCount(hiroshimaCount)} Hiroshima bombs`,
        detail: `${formatCount(tntTons / 1000)} kilotons TNT`,
      });
    }
  }

  // Krakatoa comparison (for very large quakes)
  const krakatoaFraction = joules / REFERENCE_ENERGIES.krakatoa;
  if (krakatoaFraction >= 0.01) {
    if (krakatoaFraction < 1) {
      comparisons.push({
        icon: '🌋',
        label: `${(krakatoaFraction * 100).toFixed(0)}% of Krakatoa eruption`,
        detail: '1883 volcanic explosion equivalent',
      });
    } else {
      comparisons.push({
        icon: '🌋',
        label: `${formatCount(krakatoaFraction)}× Krakatoa eruption`,
        detail: 'Extraordinary planetary energy release',
      });
    }
  }

  // US annual energy (for monster quakes)
  const usEnergyFraction = joules / REFERENCE_ENERGIES.annualUS;
  if (usEnergyFraction >= 0.001) {
    comparisons.push({
      icon: '🏭',
      label: `${(usEnergyFraction * 100).toFixed(usEnergyFraction >= 0.1 ? 0 : 1)}% of US annual energy`,
      detail: 'Total US electricity for a year',
    });
  }

  // Magnitude step-up context — every 1.0 increase = 31.6× more energy
  if (magnitude >= 2) {
    comparisons.push({
      icon: '📐',
      label: `31.6× more energy than M${(magnitude - 1).toFixed(1)}`,
      detail: 'Each magnitude unit = 31.6× energy increase',
    });
  }

  return { joules, tntTons, comparisons };
}
