import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { PetStore } from '../../store/pet.store';
import { PetCanvasComponent } from '../../components/pet-canvas/pet-canvas.component';
import { PetControlsComponent } from '../../components/pet-controls/pet-controls.component';

@Component({
  selector: 'app-pet-dashboard',
  standalone: true,
  imports: [PetCanvasComponent, PetControlsComponent, DecimalPipe],
  template: `
    <div class="flex flex-col flex-1 overflow-hidden text-slate-100">

      <!-- Module header -->
      <header class="border-b border-cyan-900/40 px-6 py-3
                     flex items-center justify-between shrink-0">
        <div class="flex items-center gap-4">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]"></span>
          <h1 class="text-cyan-300 font-semibold tracking-widest uppercase text-sm">
            PET Photon Simulator
          </h1>
          <span class="text-slate-600 text-xs">|</span>
          <span class="text-slate-500 text-xs tracking-wide">Aniquilación e⁺e⁻ · F-18 · LOR</span>
        </div>

        <!-- Status chips -->
        <div class="flex items-center gap-4 text-xs">
          <div class="flex items-center gap-1.5">
            <span class="text-slate-500">Fotones:</span>
            <span class="text-cyan-400 tabular-nums">{{ store.totalPhotons() | number }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-slate-500">Energía:</span>
            <span class="text-emerald-400">511 keV</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-slate-500">Estado:</span>
            @if (store.loading()) {
              <span class="text-yellow-400 animate-pulse">Simulando</span>
            } @else if (store.error()) {
              <span class="text-red-400">Error</span>
            } @else if (store.totalPhotons() > 0) {
              <span class="text-emerald-400">Completado</span>
            } @else {
              <span class="text-slate-400">En espera</span>
            }
          </div>
        </div>
      </header>

      <!-- Main layout -->
      <div class="flex flex-1 min-h-0">

        <!-- Sidebar controls -->
        <nav class="w-72 shrink-0 border-r border-cyan-900/30 p-4 overflow-y-auto">
          <app-pet-controls />
        </nav>

        <!-- Canvas area -->
        <main class="flex-1 flex flex-col items-center justify-center p-6 gap-4">

          <!-- Scan info bar -->
          <div class="w-full max-w-[620px] flex items-center justify-between
                      text-[10px] text-slate-600 tracking-widest uppercase px-1">
            <span>LOR · Lines of Response</span>
            <span>Detector ∅ 60 cm</span>
            <span>F-18 Positron Emitter</span>
          </div>

          <app-pet-canvas class="w-full max-w-[620px]" />

          <!-- Bottom hint -->
          @if (store.totalPhotons() === 0 && !store.loading()) {
            <p class="text-slate-700 text-xs tracking-wide text-center">
              Configura los parámetros y ejecuta la simulación para visualizar las LORs
            </p>
          }
        </main>
      </div>
    </div>
  `,
})
export class PetDashboardComponent {
  readonly store = inject(PetStore);
}
