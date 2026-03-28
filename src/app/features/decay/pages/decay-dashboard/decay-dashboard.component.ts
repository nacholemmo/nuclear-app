import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DecayStore } from '../../store/decay.store';
import { DecayChartComponent } from '../../components/decay-chart/decay-chart.component';
import { DecayControlsComponent } from '../../components/decay-controls/decay-controls.component';
import { ISOTOPE_DATA } from '../../../../core/models/decay.model';

@Component({
  selector: 'app-decay-dashboard',
  standalone: true,
  imports: [DecayChartComponent, DecayControlsComponent, DecimalPipe],
  template: `
    <div class="flex flex-col flex-1 overflow-hidden">

      <!-- Module header -->
      <header class="border-b border-violet-900/30 px-6 py-3 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-4">
          <span class="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.8)]"></span>
          <h1 class="text-violet-300 font-semibold tracking-widest uppercase text-sm">Decaimiento Radioactivo</h1>
          <span class="text-slate-600 text-xs">|</span>
          <span class="text-slate-500 text-xs">Monte Carlo · A(t) = A₀·e^(−λt)</span>
        </div>
        <div class="flex items-center gap-4 text-xs">
          <div class="flex items-center gap-1.5">
            <span class="text-slate-500">Isótopo:</span>
            <span class="text-violet-400">{{ store.params().isotope }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-slate-500">t½:</span>
            <span class="text-amber-400">{{ isotopeData[store.params().isotope].halfLife }}h</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-slate-500">Estado:</span>
            @if (store.loading()) {
              <span class="text-yellow-400 animate-pulse">Calculando</span>
            } @else if (store.error()) {
              <span class="text-red-400">Error</span>
            } @else if (store.hasResult()) {
              <span class="text-emerald-400">Completado</span>
            } @else {
              <span class="text-slate-400">En espera</span>
            }
          </div>
        </div>
      </header>

      <!-- Main layout -->
      <div class="flex flex-1 overflow-hidden">
        <nav class="w-72 shrink-0 border-r border-violet-900/20 p-4 overflow-y-auto">
          <app-decay-controls />
        </nav>
        <main class="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <div class="w-full max-w-[700px] flex items-center justify-between
                      text-[10px] text-slate-600 tracking-widest uppercase px-1">
            <span>Curva de Decaimiento</span>
            <span>{{ store.params().n_simulations | number }} simulaciones MC</span>
            <span>{{ isotopeData[store.params().isotope].energy }} keV</span>
          </div>
          <app-decay-chart class="w-full max-w-[700px]" />

          <!-- MC vs theoretical comparison -->
          @if (store.hasResult()) {
            <div class="w-full max-w-[700px] grid grid-cols-3 gap-3">
              <div class="border border-cyan-900/40 rounded-lg p-3 bg-slate-900/40 text-center">
                <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">A final teórico</p>
                <p class="text-lg font-mono text-cyan-400 tabular-nums">
                  {{ store.result()?.final_activity_mbq | number: '1.2-2' }}
                  <span class="text-xs text-slate-500">MBq</span>
                </p>
              </div>
              <div class="border border-emerald-900/40 rounded-lg p-3 bg-slate-900/40 text-center">
                <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">A final MC</p>
                <p class="text-lg font-mono text-emerald-400 tabular-nums">
                  {{ store.result()?.simulated_activity_mbq | number: '1.2-2' }}
                  <span class="text-xs text-slate-500">MBq</span>
                </p>
              </div>
              <div class="border border-violet-900/40 rounded-lg p-3 bg-slate-900/40 text-center">
                <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Átomos restantes</p>
                <p class="text-lg font-mono text-violet-400 tabular-nums">
                  {{ store.remainingPct() }}
                  <span class="text-xs text-slate-500">%</span>
                </p>
              </div>
            </div>
          }
        </main>
      </div>
    </div>
  `,
})
export class DecayDashboardComponent {
  readonly store = inject(DecayStore);
  readonly isotopeData = ISOTOPE_DATA;
}
