import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ShieldingStore } from '../../store/shielding.store';
import { ShieldingCanvasComponent } from '../../components/shielding-canvas/shielding-canvas.component';
import { ShieldingControlsComponent } from '../../components/shielding-controls/shielding-controls.component';

@Component({
  selector: 'app-shielding-dashboard',
  standalone: true,
  imports: [ShieldingCanvasComponent, ShieldingControlsComponent, DecimalPipe],
  template: `
    <div class="flex flex-col flex-1 overflow-hidden">

      <!-- Module header -->
      <header class="border-b border-amber-900/30 px-6 py-3 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-4">
          <span class="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,146,60,0.8)]"></span>
          <h1 class="text-amber-300 font-semibold tracking-widest uppercase text-sm">Blindaje de Radiación</h1>
          <span class="text-slate-600 text-xs">|</span>
          <span class="text-slate-500 text-xs">Beer-Lambert · Random Walk · Monte Carlo</span>
        </div>
        <div class="flex items-center gap-4 text-xs">
          <div class="flex items-center gap-1.5">
            <span class="text-slate-500">Material:</span>
            <span class="text-amber-400">{{ store.params().material }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-slate-500">Transmisión:</span>
            <span class="text-emerald-400">{{ store.transmissionPct() ?? '—' }}%</span>
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
        <nav class="w-72 shrink-0 border-r border-amber-900/20 p-4 overflow-y-auto">
          <app-shielding-controls />
        </nav>
        <main class="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <div class="w-full max-w-[700px] flex items-center justify-between
                      text-[10px] text-slate-600 tracking-widest uppercase px-1">
            <span>Fotones · Capa de atenuación</span>
            <span>{{ store.params().n_photons | number }} fotones incidentes</span>
            <span>{{ store.params().energy_kev }} keV</span>
          </div>
          <app-shielding-canvas class="w-full max-w-[700px]" />
        </main>
      </div>
    </div>
  `,
})
export class ShieldingDashboardComponent {
  readonly store = inject(ShieldingStore);
}
