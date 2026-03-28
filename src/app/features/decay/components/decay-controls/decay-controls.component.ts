import { Component, inject, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DecayStore } from '../../store/decay.store';
import { ISOTOPE_DATA, IsotopeType } from '../../../../core/models/decay.model';

const ISOTOPES: IsotopeType[] = ['Tc-99m', 'F-18', 'I-131', 'Ga-67', 'Tl-201'];

@Component({
  selector: 'app-decay-controls',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  template: `
    <aside class="flex flex-col gap-5 h-full">

      <!-- Header -->
      <div class="border border-violet-900/50 rounded-lg p-4 bg-slate-900/60">
        <p class="text-[10px] font-mono text-violet-600 tracking-widest uppercase mb-1">Módulo</p>
        <h2 class="text-violet-300 font-mono text-base font-semibold tracking-wide">Decaimiento Radioactivo</h2>
        <p class="text-slate-500 text-xs font-mono mt-1">Monte Carlo · A(t) = A₀ · e^(−λt)</p>
      </div>

      <!-- Isotope selector -->
      <div class="border border-violet-900/50 rounded-lg p-4 bg-slate-900/60 flex flex-col gap-2">
        <p class="text-[10px] font-mono text-violet-600 tracking-widest uppercase mb-1">Isótopo</p>
        @for (iso of isotopes; track iso) {
          <button
            (click)="setIsotope(iso)"
            [class]="'w-full flex items-center justify-between px-3 py-2 rounded border font-mono text-xs transition-all ' +
              (store.params().isotope === iso
                ? 'border-violet-500/70 bg-violet-950/40 text-violet-200'
                : 'border-slate-700/40 text-slate-500 hover:border-slate-600 hover:text-slate-400')"
          >
            <span>{{ iso }}</span>
            <span class="text-[10px] text-slate-600">
              t½={{ isotopeData[iso].halfLife }}h · {{ isotopeData[iso].energy }}keV
            </span>
          </button>
        }
      </div>

      <!-- Params -->
      <div class="border border-violet-900/50 rounded-lg p-4 bg-slate-900/60 flex flex-col gap-4" [formGroup]="form">
        <p class="text-[10px] font-mono text-violet-600 tracking-widest uppercase">Parámetros</p>

        <!-- Initial activity -->
        <div class="flex flex-col gap-1.5">
          <div class="flex justify-between">
            <label class="text-xs font-mono text-slate-400">Actividad inicial</label>
            <span class="text-xs font-mono text-violet-400 tabular-nums">
              {{ form.get('initial_activity_mbq')?.value }} <span class="text-slate-500 text-[10px]">MBq</span>
            </span>
          </div>
          <input type="range" formControlName="initial_activity_mbq" min="1" max="1000" step="1"
            (input)="onParam('initial_activity_mbq', $event)"
            class="w-full h-1 rounded-full appearance-none cursor-pointer bg-slate-700 accent-violet-500" />
        </div>

        <!-- Time -->
        <div class="flex flex-col gap-1.5">
          <div class="flex justify-between">
            <label class="text-xs font-mono text-slate-400">Tiempo</label>
            <span class="text-xs font-mono text-violet-400 tabular-nums">
              {{ form.get('time_hours')?.value }} <span class="text-slate-500 text-[10px]">h</span>
            </span>
          </div>
          <input type="range" formControlName="time_hours" min="0.1" max="500" step="0.5"
            (input)="onParam('time_hours', $event)"
            class="w-full h-1 rounded-full appearance-none cursor-pointer bg-slate-700 accent-violet-500" />
        </div>

        <!-- N simulations -->
        <div class="flex flex-col gap-1.5">
          <div class="flex justify-between">
            <label class="text-xs font-mono text-slate-400">Simulaciones</label>
            <span class="text-xs font-mono text-violet-400 tabular-nums">
              {{ form.get('n_simulations')?.value | number }}
            </span>
          </div>
          <input type="range" formControlName="n_simulations" min="1000" max="100000" step="1000"
            (input)="onParam('n_simulations', $event)"
            class="w-full h-1 rounded-full appearance-none cursor-pointer bg-slate-700 accent-violet-500" />
        </div>
      </div>

      <!-- Run button -->
      <button
        (click)="run()"
        [disabled]="store.loading()"
        class="rounded-lg border font-mono text-sm font-semibold tracking-widest uppercase
               py-3 px-4 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
               border-violet-500/60 text-violet-300 bg-violet-950/40
               hover:bg-violet-500/20 hover:border-violet-400 hover:text-violet-200 active:scale-95"
      >
        @if (store.loading()) {
          <span class="flex items-center justify-center gap-2">
            <span class="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin"></span>
            Procesando...
          </span>
        } @else {
          ▶ &nbsp; Simular Decay
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
        <div class="border border-violet-900/50 rounded-lg p-4 bg-slate-900/60 flex flex-col gap-2">
          <p class="text-[10px] font-mono text-violet-600 uppercase tracking-widest">Resultado</p>
          <div class="flex justify-between">
            <span class="text-xs font-mono text-slate-400">A final (teórico)</span>
            <span class="text-xs font-mono text-cyan-400">{{ store.result()?.final_activity_mbq | number: '1.2-2' }} MBq</span>
          </div>
          <div class="flex justify-between">
            <span class="text-xs font-mono text-slate-400">A final (MC)</span>
            <span class="text-xs font-mono text-emerald-400">{{ store.result()?.simulated_activity_mbq | number: '1.2-2' }} MBq</span>
          </div>
          <div class="flex justify-between">
            <span class="text-xs font-mono text-slate-400">Átomos restantes</span>
            <span class="text-xs font-mono text-violet-300">{{ store.remainingPct() }}%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-xs font-mono text-slate-400">λ (h⁻¹)</span>
            <span class="text-xs font-mono text-violet-300">{{ store.result()?.decay_constant | number: '1.5-5' }}</span>
          </div>
        </div>
      }

      <div class="mt-auto">
        <p class="text-[10px] font-mono text-slate-700 text-center">nuclear-api · /simular/decay</p>
      </div>
    </aside>
  `,
})
export class DecayControlsComponent implements OnInit {
  readonly store = inject(DecayStore);
  readonly isotopes = ISOTOPES;
  readonly isotopeData = ISOTOPE_DATA;

  form!: FormGroup;

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    const p = this.store.params();
    this.form = this.fb.group({
      initial_activity_mbq: [p.initial_activity_mbq],
      time_hours:           [p.time_hours],
      n_simulations:        [p.n_simulations],
    });
  }

  onParam(key: string, event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.store.updateParams({ [key]: value });
  }

  setIsotope(isotope: IsotopeType): void {
    this.store.setIsotope(isotope);
  }

  run(): void {
    this.store.loadSimulation();
  }
}
