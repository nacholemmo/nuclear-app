export interface PhotonPair {
  origin_x: number;
  origin_y: number;
  direction1_x: number;
  direction1_y: number;
  direction2_x: number;
  direction2_y: number;
}

export interface PetSimulationParams {
  n_events: number;
  tumor_radius: number;
  tumor_center_x: number;
  tumor_center_y: number;
}

export interface PetSimulationRequest extends PetSimulationParams {}

export interface PetSimulationResponse {
  n_events: number;
  energy_kev: number;
  photon_pairs: PhotonPair[];
}
