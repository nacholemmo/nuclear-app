import { Component, effect, ElementRef, inject, viewChild } from '@angular/core';
import { DecayStore } from '../../store/decay.store';
import { DecaySimulationResponse } from '../../../../core/models/decay.model';

const W = 680;
const H = 320;
const M = { top: 24, right: 30, bottom: 52, left: 76 };
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;

@Component({
  selector: 'app-decay-chart',
  standalone: true,
  template: `
    <div class="relative flex justify-center">
      <canvas
        #canvas
        [width]="W"
        [height]="H"
        class="rounded-lg border border-violet-900/30 shadow-[0_0_40px_rgba(139,92,246,0.06)] max-w-full"
      ></canvas>

      @if (store.loading()) {
        <div class="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-950/80">
          <div class="flex flex-col items-center gap-3">
            <div class="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-violet-400 text-sm font-mono tracking-widest">CALCULANDO...</span>
          </div>
        </div>
      }

      @if (!store.hasResult() && !store.loading()) {
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p class="text-slate-700 text-sm font-mono tracking-wide">
            Configura el isótopo y ejecuta la simulación
          </p>
        </div>
      }
    </div>
  `,
})
export class DecayChartComponent {
  readonly store = inject(DecayStore);
  readonly W = W;
  readonly H = H;

  private readonly canvasEl = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  constructor() {
    effect(() => {
      const canvas = this.canvasEl()?.nativeElement;
      if (!canvas) return;
      this.draw(canvas, this.store.result());
    });
  }

  private draw(canvas: HTMLCanvasElement, result: DecaySimulationResponse | null): void {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, W, H);

    if (!result) {
      this.drawEmptyAxes(ctx);
      return;
    }

    const { initial_activity_mbq, half_life_hours, time_hours, decay_constant,
            final_activity_mbq, simulated_activity_mbq } = result;

    // X domain: 0 → max(time_hours, 2.5 * half_life)
    const xMax = Math.max(time_hours, 2.5 * half_life_hours);
    const yMax = initial_activity_mbq;

    const toX = (t: number) => M.left + (t / xMax) * PLOT_W;
    const toY = (a: number) => M.top + PLOT_H - (a / yMax) * PLOT_H;

    this.drawGrid(ctx, xMax, yMax, half_life_hours, toX, toY);
    this.drawAxes(ctx, xMax, yMax, half_life_hours, toX, toY);
    this.drawCurve(ctx, xMax, decay_constant, initial_activity_mbq, toX, toY);
    this.drawHalfLifeMarkers(ctx, half_life_hours, xMax, initial_activity_mbq, decay_constant, toX, toY);
    this.drawResultPoints(ctx, time_hours, final_activity_mbq, simulated_activity_mbq, toX, toY);
    this.drawLegend(ctx);
  }

  private drawEmptyAxes(ctx: CanvasRenderingContext2D): void {
    this.drawAxes(ctx, 10, 100, 5, (t) => M.left + (t / 10) * PLOT_W, (a) => M.top + PLOT_H - (a / 100) * PLOT_H);
  }

  private drawGrid(
    ctx: CanvasRenderingContext2D,
    xMax: number,
    yMax: number,
    halfLife: number,
    toX: (t: number) => number,
    toY: (a: number) => number
  ): void {
    ctx.strokeStyle = 'rgba(139,92,246,0.07)';
    ctx.lineWidth = 0.5;
    // Horizontal grid
    for (let i = 0; i <= 4; i++) {
      const y = toY((yMax * i) / 4);
      ctx.beginPath(); ctx.moveTo(M.left, y); ctx.lineTo(M.left + PLOT_W, y); ctx.stroke();
    }
    // Vertical grid
    const steps = Math.min(6, Math.ceil(xMax / halfLife) + 1);
    for (let i = 0; i <= steps; i++) {
      const x = toX((xMax * i) / steps);
      ctx.beginPath(); ctx.moveTo(x, M.top); ctx.lineTo(x, M.top + PLOT_H); ctx.stroke();
    }
  }

  private drawAxes(
    ctx: CanvasRenderingContext2D,
    xMax: number,
    yMax: number,
    halfLife: number,
    toX: (t: number) => number,
    toY: (a: number) => number
  ): void {
    ctx.strokeStyle = 'rgba(139,92,246,0.4)';
    ctx.lineWidth = 1.5;

    // X axis
    ctx.beginPath();
    ctx.moveTo(M.left, M.top + PLOT_H);
    ctx.lineTo(M.left + PLOT_W, M.top + PLOT_H);
    ctx.stroke();

    // Y axis
    ctx.beginPath();
    ctx.moveTo(M.left, M.top);
    ctx.lineTo(M.left, M.top + PLOT_H);
    ctx.stroke();

    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(139,92,246,0.6)';
    ctx.textAlign = 'center';

    // X ticks
    const xSteps = Math.min(6, Math.ceil(xMax / halfLife) + 1);
    for (let i = 0; i <= xSteps; i++) {
      const t = (xMax * i) / xSteps;
      const x = toX(t);
      ctx.fillText(t.toFixed(1) + 'h', x, M.top + PLOT_H + 16);
    }

    // X label
    ctx.fillStyle = 'rgba(139,92,246,0.5)';
    ctx.fillText('Tiempo (horas)', M.left + PLOT_W / 2, H - 6);

    // Y ticks
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const a = (yMax * i) / 4;
      const y = toY(a);
      ctx.fillText(a.toFixed(0), M.left - 8, y + 4);
    }

    // Y label
    ctx.save();
    ctx.translate(14, M.top + PLOT_H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Actividad (MBq)', 0, 0);
    ctx.restore();

    ctx.textAlign = 'left';
  }

  private drawCurve(
    ctx: CanvasRenderingContext2D,
    xMax: number,
    lambda: number,
    a0: number,
    toX: (t: number) => number,
    toY: (a: number) => number
  ): void {
    const steps = 400;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = (xMax * i) / steps;
      const a = a0 * Math.exp(-lambda * t);
      const x = toX(t);
      const y = toY(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(139,92,246,0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Glow
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
  }

  private drawHalfLifeMarkers(
    ctx: CanvasRenderingContext2D,
    halfLife: number,
    xMax: number,
    a0: number,
    lambda: number,
    toX: (t: number) => number,
    toY: (a: number) => number
  ): void {
    let n = 1;
    while (n * halfLife <= xMax) {
      const t = n * halfLife;
      const x = toX(t);
      const a = a0 * Math.exp(-lambda * t);
      const y = toY(a);

      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(251,191,36,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, M.top);
      ctx.lineTo(x, M.top + PLOT_H);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(251,191,36,0.7)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`t½×${n}`, x, M.top + 12);
      ctx.textAlign = 'left';

      // Dot on curve
      ctx.fillStyle = 'rgba(251,191,36,0.6)';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();

      n++;
    }
  }

  private drawResultPoints(
    ctx: CanvasRenderingContext2D,
    time: number,
    theoretical: number,
    simulated: number,
    toX: (t: number) => number,
    toY: (a: number) => number
  ): void {
    const x = toX(time);

    // Theoretical (cyan dot)
    ctx.fillStyle = 'rgba(6,182,212,1)';
    ctx.beginPath();
    ctx.arc(x, toY(theoretical), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(6,182,212,0.4)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x, toY(theoretical), 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;

    // Simulated (emerald dot)
    ctx.fillStyle = 'rgba(52,211,153,1)';
    ctx.beginPath();
    ctx.arc(x, toY(simulated), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(52,211,153,0.4)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x, toY(simulated), 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;

    // Vertical dashed line to t=time
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(248,250,252,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, M.top);
    ctx.lineTo(x, M.top + PLOT_H);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawLegend(ctx: CanvasRenderingContext2D): void {
    const lx = M.left + PLOT_W - 180;
    const ly = M.top + 10;

    ctx.fillStyle = 'rgba(15,23,42,0.8)';
    ctx.fillRect(lx - 6, ly - 6, 186, 58);
    ctx.strokeStyle = 'rgba(139,92,246,0.2)';
    ctx.strokeRect(lx - 6, ly - 6, 186, 58);

    ctx.font = '9px monospace';

    ctx.fillStyle = 'rgba(139,92,246,0.9)';
    ctx.fillRect(lx, ly + 4, 16, 2);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('Curva A(t) = A₀·e^(−λt)', lx + 22, ly + 8);

    ctx.fillStyle = 'rgba(251,191,36,0.7)';
    ctx.beginPath(); ctx.arc(lx + 8, ly + 22, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('Semivida t½', lx + 22, ly + 26);

    ctx.fillStyle = 'rgba(6,182,212,1)';
    ctx.beginPath(); ctx.arc(lx + 8, ly + 38, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(52,211,153,1)';
    ctx.beginPath(); ctx.arc(lx + 100, ly + 38, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('Teórico', lx + 22, ly + 42);
    ctx.fillText('MC', lx + 114, ly + 42);
  }
}
