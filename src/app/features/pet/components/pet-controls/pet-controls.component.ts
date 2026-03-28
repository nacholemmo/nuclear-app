import { Component, inject, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PetStore } from '../../store/pet.store';

interface ControlParam {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}

const PARAMS: ControlParam[] = [
  { key: 'n_events', label: 'Eventos', unit: 'eventos', min: 100, max: 10000, step: 100 },
  { key: 'tumor_radius', label: 'Radio Tumor', unit: 'cm', min: 0.5, max: 15, step: 0.5 },
  { key: 'tumor_center_x', label: 'Centro X', unit: 'cm', min: -15, max: 15, step: 0.5 },
  { key: 'tumor_center_y', label: 'Centro Y', unit: 'cm', min: -15, max: 15, step: 0.5 },
];

@Component({
  selector: 'app-pet-controls',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  template: `
    <aside class="flex flex-col gap-5 h-full">
      <!-- Header panel -->
      <div class="border border-cyan-900/50 rounded-lg p-4 bg-slate-900/60">
        <p class="text-[10px] font-mono text-cyan-600 tracking-widest uppercase mb-1">
          Sistema de Control
        </p>
        <h2 class="text-cyan-300 font-mono text-base font-semibold tracking-wide">
          PET Simulator v1.0
        </h2>
        <p class="text-slate-500 text-xs font-mono mt-1">F-18 · 511 keV</p>
      </div>

      <!-- Parameters form -->
      <div class="border border-cyan-900/50 rounded-lg p-4 bg-slate-900/60 flex flex-col gap-4">
        <p class="text-[10px] font-mono text-cyan-600 tracking-widest uppercase">
          Parámetros Monte Carlo
        </p>

        <form [formGroup]="form" class="flex flex-col gap-4">
          @for (param of params; track param.key) {
            <div class="flex flex-col gap-1.5">
              <div class="flex justify-between items-center">
                <label class="text-xs font-mono text-slate-400">{{ param.label }}</label>
                <span class="text-xs font-mono text-cyan-400 tabular-nums">
                  {{ form.get(param.key)?.value }}
                  <span class="text-slate-500 text-[10px]">{{ param.unit }}</span>
                </span>
              </div>
              <input
                type="range"
                [formControlName]="param.key"
                [min]="param.min"
                [max]="param.max"
                [step]="param.step"
                (input)="onParamChange(param.key, $event)"
                class="w-full h-1 rounded-full appearance-none cursor-pointer
                       bg-slate-700 accent-cyan-500"
              />
              <div class="flex justify-between text-[10px] font-mono text-slate-600">
                <span>{{ param.min }}</span>
                <span>{{ param.max }}</span>
              </div>
            </div>
          }
        </form>
      </div>

      <!-- Run button -->
      <button
        (click)="runSimulation()"
        [disabled]="store.loading()"
        class="relative overflow-hidden rounded-lg border font-mono text-sm font-semibold
               tracking-widest uppercase py-3 px-4 transition-all duration-200
               disabled:opacity-40 disabled:cursor-not-allowed
               border-cyan-500/60 text-cyan-300 bg-cyan-950/40
               hover:bg-cyan-500/20 hover:border-cyan-400 hover:text-cyan-200
               active:scale-95"
      >
        @if (store.loading()) {
          <span class="flex items-center justify-center gap-2">
            <span class="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
            Procesando...
          </span>
        } @else {
          ▶ &nbsp; Ejecutar Simulación
        }
      </button>

      <!-- Error alert -->
      @if (store.error()) {
        <div class="rounded-lg border border-red-800/60 bg-red-950/40 p-3">
          <p class="text-[10px] font-mono text-red-400 tracking-widest uppercase mb-1">Error</p>
          <p class="text-xs font-mono text-red-300 leading-relaxed">{{ store.error() }}</p>
          <button
            (click)="store.clearError()"
            class="mt-2 text-[10px] font-mono text-red-500 hover:text-red-300 underline"
          >
            Descartar
          </button>
        </div>
      }

      <!-- Stats panel -->
      @if (store.totalPhotons() > 0) {
        <div class="border border-emerald-900/50 rounded-lg p-4 bg-slate-900/60 flex flex-col gap-2">
          <p class="text-[10px] font-mono text-emerald-600 tracking-widest uppercase">
            Resultado
          </p>
          <div class="flex justify-between">
            <span class="text-xs font-mono text-slate-400">Pares de fotones</span>
            <span class="text-xs font-mono text-emerald-400 tabular-nums">
              {{ store.totalPhotons() | number }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-xs font-mono text-slate-400">Energía</span>
            <span class="text-xs font-mono text-emerald-400">511 keV</span>
          </div>
          <div class="flex justify-between">
            <span class="text-xs font-mono text-slate-400">Isótopo</span>
            <span class="text-xs font-mono text-emerald-400">F-18</span>
          </div>
        </div>
      }

      <!-- Footer -->
      <div class="mt-auto">
        <p class="text-[10px] font-mono text-slate-700 text-center">
          nuclear-api · localhost:8000
        </p>
      </div>
    </aside>
  `,
})
export class PetControlsComponent implements OnInit {
  readonly store = inject(PetStore);
  readonly params = PARAMS;

  form!: FormGroup;

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    const p = this.store.params();
    this.form = this.fb.group({
      n_events: [p.n_events, [Validators.required, Validators.min(100), Validators.max(10000)]],
      tumor_radius: [p.tumor_radius, [Validators.required]],
      tumor_center_x: [p.tumor_center_x, [Validators.required]],
      tumor_center_y: [p.tumor_center_y, [Validators.required]],
    });
  }

  onParamChange(key: string, event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.store.updateParams({ [key]: value });
  }

  runSimulation(): void {
    if (this.form.valid) {
      this.store.loadSimulation();
    }
  }
}
