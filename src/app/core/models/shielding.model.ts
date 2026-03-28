export type MaterialType = 'Plomo' | 'Agua' | 'Hormigón';

export interface ShieldingSimulationRequest {
  material: MaterialType;
  thickness: number;
  energy_kev: number;
  n_photons: number;
  use_random_walk: boolean;
}

export interface ShieldingSimulationResponse {
  material: string;
  thickness: number;
  energy_kev: number;
  n_photons: number;
  transmitted: number;
  absorbed: number;
  scattered: number;
  transmission_fraction: number;
  attenuation_coefficient: number;
}
