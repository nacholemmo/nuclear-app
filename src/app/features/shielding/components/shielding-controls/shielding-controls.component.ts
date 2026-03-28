import { Component, inject, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ShieldingStore } from '../../store/shielding.store';
import { MaterialType } from '../../../../core/models/shielding.model';

const MATERIALS: { value: MaterialType; label: string; color: string }[] = [
  { value: 'Plomo',    label: 'Plomo (Pb)',     color: 'border-slate-500 text-slate-300' },
  { value: 'Agua',     label: 'Agua (H₂O)',     color: 'border-blue-600 text-blue-300' },
  { value: 'Hormigón', label: 'Hormigón',       color: 'border-stone-500 text-stone-300' },
];

@Component({
  selector: 'app-shielding-controls',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  template: `
    <aside class="flex flex-col gap-5 h-full">

      <!-- Header -->
      <div class="border border-amber-900/50 rounded-lg p-4 bg-slate-900/60">
        <p class="text-[10px] font-mono text-amber-600 tracking-widest uppercase mb-1">Módulo</p>
        <h2 class="text-amber-300 font-mono text-base font-semibold tracking-wide">Blindaje Radiación</h2>
        <p class="text-slate-500 text-xs font-mono mt-1">Ley de Beer-Lambert · Monte Carlo</p>
      </div>

      <!-- Material selector -->
      <div class="border border-amber-900/50 rounded-lg p-4 bg-slate-900/60 flex flex-col gap-3">
        <p class="text-[10px] font-mono text-amber-600 tracking-widest uppercase">Material</p>
        @for (mat of materials; track mat.value) {
          <button
            (click)="setMaterial(mat.value)"
            [class]="'w-full text-left px-3 py-2 rounded border font-mono text-xs transition-all duration-150 ' +
              (store.params().material === mat.value
                ? 'border-amber-500/70 bg-amber-950/40 text-amber-200'
                : 'border-slate-700/50 bg-slate-900/40 text-slate-500 hover:border-slate-600 hover:text-slate-400')"
          >
            @if (store.params().material === mat.value) { ▶ } @else { &nbsp;&nbsp; }
            {{ mat.label }}
          </button>
        }
      </div>

      <!-- Numeric params -->
      <div class="border border-amber-900/50 rounded-lg p-4 bg-slate-900/60 flex flex-col gap-4" [formGroup]="form">
        <p class="text-[10px] font-mono text-amber-600 tracking-widest uppercase">Parámetros</p>

        <!-- Thickness -->
        <div class="flex flex-col gap-1.5">
          <div class="flex justify-between">
            <label class="text-xs font-mono text-slate-400">Espesor</label>
            <span class="text-xs font-mono text-amber-400 tabular-nums">
              {{ form.get('thickness')?.value }} <span class="text-slate-500 text-[10px]">cm</span>
            </span>
          </div>
          <input type="range" formControlName="thickness" min="0.5" max="50" step="0.5"
            (input)="onParam('thickness', $event)"
            class="w-full h-1 rounded-full appearance-none cursor-pointer bg-slate-700 accent-amber-500" />
        </div>

        <!-- Energy -->
        <div class="flex flex-col gap-1.5">
          <div class="flex justify-between">
            <label class="text-xs font-mono text-slate-400">Energía</label>
            <span class="text-xs font-mono text-amber-400 tabular-nums">
              {{ form.get('energy_kev')?.value }} <span class="text-slate-500 text-[10px]">keV</span>
            </span>
          </div>
          <input type="range" formControlName="energy_kev" min="100" max="5000" step="50"
            (input)="onParam('energy_kev', $event)"
            class="w-full h-1 rounded-full appearance-none cursor-pointer bg-slate-700 accent-amber-500" />
        </div>

        <!-- N photons -->
        <div class="flex flex-col gap-1.5">
          <div class="flex justify-between">
            <label class="text-xs font-mono text-slate-400">Fotones</label>
            <span class="text-xs font-mono text-amber-400 tabular-nums">
              {{ form.get('n_photons')?.value | number }}
            </span>
          </div>
          <input type="range" formControlName="n_photons" min="1000" max="100000" step="1000"
            (input)="onParam('n_photons', $event)"
            class="w-full h-1 rounded-full appearance-none cursor-pointer bg-slate-700 accent-amber-500" />
        </div>

        <!-- Random walk toggle -->
        <div class="flex items-center justify-between">
          <label class="text-xs font-mono text-slate-400">Random Walk</label>
          <button
            (click)="toggleRandomWalk()"
            [class]="'relative w-10 h-5 rounded-full transition-colors duration-200 ' +
              (store.params().use_random_walk ? 'bg-amber-600' : 'bg-slate-700')"
          >
            <span [class]="'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ' +
              (store.params().use_random_walk ? 'translate-x-5' : 'translate-x-0.5')"></span>
          </button>
        </div>
      </div>

      <!-- Run button -->
      <button
        (click)="run()"
        [disabled]="store.loading()"
        class="rounded-lg border font-mono text-sm font-semibold tracking-widest uppercase
               py-3 px-4 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
               border-amber-500/60 text-amber-300 bg-amber-950/40
               hover:bg-amber-500/20 hover:border-amber-400 hover:text-amber-200 active:scale-95"
      >
        @if (store.loading()) {
          <span class="flex items-center justify-center gap-2">
            <span class="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin"></span>
            Procesando...
          </span>
        } @else {
          ▶ &nbsp; Simular Blindaje
        }
      </button>

      <!-- Error -->
      @if (store.error()) {
        <div class="rounded-lg border border-red-800/60 bg-red-950/40 p-3">
          <p class="text-[10px] font-mono text-red-400 uppercase mb-1">Error</p>
          <p class="text-xs font-mono text-red-300 leading-relaxed">{{ store.error() }}</p>
          <button (click)="store.clearError()" class="mt-2 text-[10px] font-mono text-red-500 hover:text-red-300 underline">Descartar</button>
        </div>
      }

      <!-- Results -->
      @if (store.hasResult()) {
        <div class="border border-amber-900/50 rounded-lg p-4 bg-slate-900/60 flex flex-col gap-2">
          <p class="text-[10px] font-mono text-amber-600 uppercase tracking-widest">Resultado</p>
          <div class="flex justify-between">
            <span class="text-xs font-mono text-slate-400">Transmitidos</span>
            <span class="text-xs font-mono text-cyan-400">{{ store.result()?.transmitted | number }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-xs font-mono text-slate-400">Absorbidos</span>
            <span class="text-xs font-mono text-amber-400">{{ store.result()?.absorbed | number }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-xs font-mono text-slate-400">Dispersados</span>
            <span class="text-xs font-mono text-violet-400">{{ store.result()?.scattered | number }}</span>
          </div>
          <div class="border-t border-slate-800 my-1"></div>
          <div class="flex justify-between">
            <span class="text-xs font-mono text-slate-400">Transmisión</span>
            <span class="text-xs font-mono text-emerald-400 font-bold">{{ store.transmissionPct() }}%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-xs font-mono text-slate-400">μ (cm⁻¹)</span>
            <span class="text-xs font-mono text-amber-300">{{ store.result()?.attenuation_coefficient | number: '1.4-4' }}</span>
          </div>
        </div>
      }

      <div class="mt-auto">
        <p class="text-[10px] font-mono text-slate-700 text-center">nuclear-api · /simular/blindaje</p>
      </div>
    </aside>
  `,
})
export class ShieldingControlsComponent implements OnInit {
  readonly store = inject(ShieldingStore);
  readonly materials = MATERIALS;

  form!: FormGroup;

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    const p = this.store.params();
    this.form = this.fb.group({
      thickness:    [p.thickness],
      energy_kev:   [p.energy_kev],
      n_photons:    [p.n_photons],
      use_random_walk: [p.use_random_walk],
    });
  }

  onParam(key: string, event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.store.updateParams({ [key]: value });
  }

  setMaterial(material: MaterialType): void {
    this.store.setMaterial(material);
  }

  toggleRandomWalk(): void {
    this.store.updateParams({ use_random_walk: !this.store.params().use_random_walk });
  }

  run(): void {
    this.store.loadSimulation();
  }
}
