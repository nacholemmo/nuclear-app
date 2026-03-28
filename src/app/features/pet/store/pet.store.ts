import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { PetService } from '../../../core/services/pet.service';
import { PhotonPair, PetSimulationParams } from '../../../core/models/pet.model';

export interface PetState {
  events: PhotonPair[];
  loading: boolean;
  error: string | null;
  params: PetSimulationParams;
}

const initialState: PetState = {
  events: [],
  loading: false,
  error: null,
  params: {
    n_events: 1000,
    tumor_radius: 2.5,
    tumor_center_x: 0.0,
    tumor_center_y: 0.0,
  },
};

export const PetStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    totalPhotons: computed(() => store.events().length),
    isReady: computed(() => !store.loading() && store.error() === null),
  })),
  withMethods((store, petService = inject(PetService)) => ({
    async loadSimulation(): Promise<void> {
      patchState(store, { loading: true, error: null, events: [] });
      try {
        const response = await firstValueFrom(petService.simulate(store.params()));
        patchState(store, { events: response.photon_pairs, loading: false });
      } catch (err: unknown) {
        let message = 'Backend no disponible.';
        if (err instanceof Error) {
          message = err.message.includes('Http failure')
            ? 'No se puede conectar al backend (http://localhost:8000). Verificar CORS y que el servidor esté activo.'
            : err.message;
        }
        patchState(store, { loading: false, error: message });
      }
    },
    updateParams(params: Partial<PetSimulationParams>): void {
      patchState(store, (state) => ({
        params: { ...state.params, ...params },
      }));
    },
    clearError(): void {
      patchState(store, { error: null });
    },
  }))
);
