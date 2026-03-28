import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { ShieldingService } from '../../../core/services/shielding.service';
import {
  MaterialType,
  ShieldingSimulationRequest,
  ShieldingSimulationResponse,
} from '../../../core/models/shielding.model';

export interface ShieldingState {
  result: ShieldingSimulationResponse | null;
  loading: boolean;
  error: string | null;
  params: ShieldingSimulationRequest;
}

const initialState: ShieldingState = {
  result: null,
  loading: false,
  error: null,
  params: {
    material: 'Plomo',
    thickness: 5,
    energy_kev: 511,
    n_photons: 10000,
    use_random_walk: true,
  },
};

export const ShieldingStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    transmissionPct: computed(() => {
      const r = store.result();
      return r ? (r.transmission_fraction * 100).toFixed(2) : null;
    }),
    hasResult: computed(() => store.result() !== null),
  })),
  withMethods((store, service = inject(ShieldingService)) => ({
    async loadSimulation(): Promise<void> {
      patchState(store, { loading: true, error: null, result: null });
      try {
        const result = await firstValueFrom(service.simulate(store.params()));
        patchState(store, { result, loading: false });
      } catch (err: unknown) {
        const message =
          err instanceof Error && err.message.includes('Http failure')
            ? 'No se puede conectar al backend (http://localhost:8000).'
            : err instanceof Error
              ? err.message
              : 'Error desconocido';
        patchState(store, { loading: false, error: message });
      }
    },
    updateParams(params: Partial<ShieldingSimulationRequest>): void {
      patchState(store, (state) => ({
        params: { ...state.params, ...params },
      }));
    },
    setMaterial(material: MaterialType): void {
      patchState(store, (state) => ({ params: { ...state.params, material } }));
    },
    clearError(): void {
      patchState(store, { error: null });
    },
  }))
);
