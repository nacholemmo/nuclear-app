import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { DecayService } from '../../../core/services/decay.service';
import {
  DecaySimulationRequest,
  DecaySimulationResponse,
  IsotopeType,
} from '../../../core/models/decay.model';

export interface DecayState {
  result: DecaySimulationResponse | null;
  loading: boolean;
  error: string | null;
  params: DecaySimulationRequest;
}

const initialState: DecayState = {
  result: null,
  loading: false,
  error: null,
  params: {
    isotope: 'F-18',
    initial_activity_mbq: 100,
    time_hours: 6,
    n_simulations: 10000,
  },
};

export const DecayStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    hasResult: computed(() => store.result() !== null),
    remainingPct: computed(() => {
      const r = store.result();
      return r
        ? ((r.n_remaining_atoms / r.n_initial_atoms) * 100).toFixed(1)
        : null;
    }),
  })),
  withMethods((store, service = inject(DecayService)) => ({
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
    updateParams(params: Partial<DecaySimulationRequest>): void {
      patchState(store, (state) => ({
        params: { ...state.params, ...params },
      }));
    },
    setIsotope(isotope: IsotopeType): void {
      patchState(store, (state) => ({ params: { ...state.params, isotope } }));
    },
    clearError(): void {
      patchState(store, { error: null });
    },
  }))
);
