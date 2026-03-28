import { Component, effect, ElementRef, inject, viewChild } from '@angular/core';
import { ShieldingStore } from '../../store/shielding.store';
import { ShieldingSimulationResponse } from '../../../../core/models/shielding.model';

const W = 680;
const H = 340;
const SOURCE_X = 0;
const SOURCE_W = 140;
const DETECTOR_X = W - 150;
const DETECTOR_W = 150;
const MAT_Y = 60;
const MAT_H = H - 120;
const N_PARTICLES = 72;

const MATERIAL_COLORS: Record<string, string> = {
  Plomo:    '#475569',
  Agua:     '#1d4ed8',
  Hormigón: '#78716c',
};

/** Deterministic pseudo-random in [0,1) from integer seed. */
function pr(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

@Component({
  selector: 'app-shielding-canvas',
  standalone: true,
  template: `
    <div class="relative flex justify-center">
      <canvas
        #canvas
        [width]="W"
        [height]="H"
        class="rounded-lg border border-amber-900/30 shadow-[0_0_40px_rgba(251,146,60,0.06)] max-w-full"
      ></canvas>

      @if (store.loading()) {
        <div class="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-950/80">
          <div class="flex flex-col items-center gap-3">
            <div class="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-amber-400 text-sm font-mono tracking-widest">CALCULANDO...</span>
          </div>
        </div>
      }

      @if (!store.hasResult() && !store.loading()) {
        <div class="absolute inset-0 flex items-center justify-center rounded-lg pointer-events-none">
          <p class="text-slate-700 text-sm font-mono tracking-wide">
            Configura los parámetros y ejecuta la simulación
          </p>
        </div>
      }
    </div>
  `,
})
export class ShieldingCanvasComponent {
  readonly store = inject(ShieldingStore);
  readonly W = W;
  readonly H = H;

  private readonly canvasEl = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  constructor() {
    effect(() => {
      const canvas = this.canvasEl()?.nativeElement;
      if (!canvas) return;
      const result = this.store.result();
      const params = this.store.params();
      this.draw(canvas, result, params.thickness);
    });
  }

  private draw(
    canvas: HTMLCanvasElement,
    result: ShieldingSimulationResponse | null,
    thickness: number
  ): void {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, W, H);

    this.drawGrid(ctx);

    // Material width: proportional to thickness (5cm=40px baseline, 100cm=200px max)
    const matWidth = Math.max(40, Math.min(200, (thickness / 100) * 200 + 20));
    const matX = W / 2 - matWidth / 2;

    this.drawMaterial(ctx, matX, matWidth, result?.material ?? 'Plomo', thickness);

    if (result) {
      this.drawParticles(ctx, result, matX, matWidth);
      this.drawStatsOverlay(ctx, result);
    }

    this.drawZoneLabels(ctx, matX, matWidth);
  }

  private drawGrid(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(251,146,60,0.05)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  private drawMaterial(
    ctx: CanvasRenderingContext2D,
    matX: number,
    matWidth: number,
    material: string,
    thickness: number
  ): void {
    const color = MATERIAL_COLORS[material] ?? '#475569';

    // Material block
    ctx.fillStyle = color + '55';
    ctx.fillRect(matX, MAT_Y, matWidth, MAT_H);
    ctx.strokeStyle = color + 'aa';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(matX, MAT_Y, matWidth, MAT_H);

    // Material label
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(material, matX + matWidth / 2, MAT_Y + MAT_H / 2 - 8);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(`${thickness} cm`, matX + matWidth / 2, MAT_Y + MAT_H / 2 + 10);
    ctx.textAlign = 'left';
  }

  private drawParticles(
    ctx: CanvasRenderingContext2D,
    result: ShieldingSimulationResponse,
    matX: number,
    matWidth: number
  ): void {
    const { transmission_fraction, absorbed, scattered, n_photons } = result;
    const absorbed_frac = absorbed / n_photons;
    const scattered_frac = scattered / n_photons;
    const matRight = matX + matWidth;

    for (let i = 0; i < N_PARTICLES; i++) {
      const yFrac = (i + 0.5) / N_PARTICLES;
      const y = MAT_Y + yFrac * MAT_H;
      const rand = pr(i);
      const jitter = (pr(i + 1000) - 0.5) * 4;

      if (rand < transmission_fraction) {
        // Transmitted: full line from source to detector
        ctx.strokeStyle = 'rgba(6,182,212,0.65)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(SOURCE_X, y + jitter);
        ctx.lineTo(W, y + jitter);
        ctx.stroke();
      } else if (rand < transmission_fraction + absorbed_frac) {
        // Absorbed: stops inside material
        const stopX = matX + pr(i + 500) * matWidth;
        ctx.strokeStyle = 'rgba(6,182,212,0.4)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(SOURCE_X, y);
        ctx.lineTo(stopX, y);
        ctx.stroke();
        // Absorption marker
        ctx.fillStyle = 'rgba(251,146,60,0.9)';
        ctx.beginPath();
        ctx.arc(stopX, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Scattered: deflects at some point in material
        const scatterX = matX + pr(i + 200) * matWidth;
        const angle = (pr(i + 300) - 0.5) * Math.PI * 0.5;
        const exitX = matRight + Math.cos(angle) * 80;
        const exitY = y + Math.sin(angle) * 80;

        ctx.strokeStyle = 'rgba(6,182,212,0.35)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(SOURCE_X, y);
        ctx.lineTo(scatterX, y);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(167,139,250,0.6)';
        ctx.beginPath();
        ctx.moveTo(scatterX, y);
        ctx.lineTo(exitX, exitY);
        ctx.stroke();
      }
    }
  }

  private drawStatsOverlay(
    ctx: CanvasRenderingContext2D,
    result: ShieldingSimulationResponse
  ): void {
    const { n_photons, transmitted, absorbed, scattered, transmission_fraction, attenuation_coefficient } = result;
    const barY = H - 42;
    const barH = 8;
    const barX = 20;
    const barW = W - 40;

    // Stacked bar background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(barX, barY, barW, barH);

    // Transmitted
    const tw = barW * transmission_fraction;
    ctx.fillStyle = 'rgba(6,182,212,0.8)';
    ctx.fillRect(barX, barY, tw, barH);

    // Scattered
    const sw = barW * (scattered / n_photons);
    ctx.fillStyle = 'rgba(167,139,250,0.8)';
    ctx.fillRect(barX + tw, barY, sw, barH);

    // Absorbed
    ctx.fillStyle = 'rgba(251,146,60,0.8)';
    ctx.fillRect(barX + tw + sw, barY, barW - tw - sw, barH);

    // Legend text
    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(6,182,212,0.9)';
    ctx.fillText(`T ${(transmission_fraction * 100).toFixed(1)}%`, barX, barY - 6);

    ctx.fillStyle = 'rgba(167,139,250,0.9)';
    ctx.fillText(`S ${((scattered / n_photons) * 100).toFixed(1)}%`, barX + 80, barY - 6);

    ctx.fillStyle = 'rgba(251,146,60,0.9)';
    ctx.fillText(`A ${((absorbed / n_photons) * 100).toFixed(1)}%`, barX + 160, barY - 6);

    ctx.fillStyle = 'rgba(148,163,184,0.7)';
    ctx.textAlign = 'right';
    ctx.fillText(`μ = ${attenuation_coefficient.toFixed(4)} cm⁻¹`, W - 20, barY - 6);
    ctx.textAlign = 'left';
  }

  private drawZoneLabels(ctx: CanvasRenderingContext2D, matX: number, matWidth: number): void {
    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(251,146,60,0.4)';
    ctx.textAlign = 'center';
    ctx.fillText('FUENTE', SOURCE_W / 2, MAT_Y - 8);
    ctx.fillText('MATERIAL', matX + matWidth / 2, MAT_Y - 8);
    ctx.fillText('DETECTOR', DETECTOR_X + DETECTOR_W / 2, MAT_Y - 8);
    ctx.textAlign = 'left';

    // Dashed zone separators
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(251,146,60,0.15)';
    ctx.lineWidth = 1;
    [matX, matX + matWidth].forEach((x) => {
      ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, H - 55); ctx.stroke();
    });
    ctx.setLineDash([]);
  }
}
