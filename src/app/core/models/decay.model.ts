export type IsotopeType = 'Tc-99m' | 'F-18' | 'I-131' | 'Ga-67' | 'Tl-201';

export interface IsotopeInfo {
  halfLife: number;
  energy: number;
  description: string;
}

export const ISOTOPE_DATA: Record<IsotopeType, IsotopeInfo> = {
  'Tc-99m': { halfLife: 6.01,  energy: 140.5, description: 'Metaestable' },
  'F-18':   { halfLife: 1.83,  energy: 511.0, description: 'Emisor β+' },
  'I-131':  { halfLife: 192.5, energy: 364.0, description: 'Terapéutico' },
  'Ga-67':  { halfLife: 78.3,  energy: 93.3,  description: 'Diagnóstico' },
  'Tl-201': { halfLife: 73.1,  energy: 167.0, description: 'Cardíaco' },
};

export interface DecaySimulationRequest {
  isotope: IsotopeType;
  initial_activity_mbq: number;
  time_hours: number;
  n_simulations: number;
}

export interface DecaySimulationResponse {
  isotope: string;
  half_life_hours: number;
  initial_activity_mbq: number;
  time_hours: number;
  final_activity_mbq: number;
  simulated_activity_mbq: number;
  n_initial_atoms: number;
  n_remaining_atoms: number;
  decay_constant: number;
}
