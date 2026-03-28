import { Component, effect, ElementRef, inject, viewChild } from '@angular/core';
import { PetStore } from '../../store/pet.store';
import { PhotonPair } from '../../../../core/models/pet.model';

const DETECTOR_RADIUS_CM = 30;
const CANVAS_SIZE = 600;
const SCALE = CANVAS_SIZE / (2 * DETECTOR_RADIUS_CM); // px per cm

function cmToCanvas(cm: number): number {
  return CANVAS_SIZE / 2 + cm * SCALE;
}

function cmToCanvasY(cm: number): number {
  return CANVAS_SIZE / 2 - cm * SCALE; // Y axis flipped
}

/** Returns the two intersection points of the LOR with the detector ring. */
function lorEndpoints(
  ox: number,
  oy: number,
  dx: number,
  dy: number,
  R: number
): [number, number, number, number] {
  const dot = ox * dx + oy * dy;
  const discriminant = dot * dot - (ox * ox + oy * oy - R * R);
  if (discriminant < 0) return [ox, oy, ox, oy]; // degenerate — origin outside ring
  const sqrtD = Math.sqrt(discriminant);
  const t1 = -dot + sqrtD;
  const t2 = -dot - sqrtD;
  return [ox + t1 * dx, oy + t1 * dy, ox + t2 * dx, oy + t2 * dy];
}

@Component({
  selector: 'app-pet-canvas',
  standalone: true,
  template: `
    <div class="relative w-full flex justify-center items-center">
      <canvas
        #canvas
        [width]="canvasSize"
        [height]="canvasSize"
        class="rounded-lg border border-cyan-900/40 shadow-[0_0_40px_rgba(6,182,212,0.08)]"
      ></canvas>

      @if (store.loading()) {
        <div class="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-950/80">
          <div class="flex flex-col items-center gap-3">
            <div class="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-cyan-400 text-sm font-mono tracking-widest">SIMULANDO...</span>
          </div>
        </div>
      }
    </div>
  `,
})
export class PetCanvasComponent {
  readonly store = inject(PetStore);
  readonly canvasSize = CANVAS_SIZE;

  private readonly canvasEl = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  constructor() {
    effect(() => {
      // Read ALL signals first so Angular tracks them as dependencies,
      // regardless of whether the canvas is available yet.
      const events = this.store.events();
      const params = this.store.params();
      const canvas = this.canvasEl()?.nativeElement;
      if (!canvas) return;
      this.drawScene(canvas, events, params.tumor_center_x, params.tumor_center_y, params.tumor_radius);
    });
  }

  private drawScene(
    canvas: HTMLCanvasElement,
    events: PhotonPair[],
    tumorX: number,
    tumorY: number,
    tumorRadius: number
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    this.drawGrid(ctx);
    this.drawDetectorRing(ctx);
    this.drawTumorIndicator(ctx, tumorX, tumorY, tumorRadius);

    if (events.length > 0) {
      this.drawLORs(ctx, events);
    }

    this.drawLabels(ctx);
  }

  private drawGrid(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(6,182,212,0.06)';
    ctx.lineWidth = 0.5;
    const step = 5 * SCALE; // grid every 5cm
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;

    for (let x = cx % step; x < CANVAS_SIZE; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_SIZE);
      ctx.stroke();
    }
    for (let y = cy % step; y < CANVAS_SIZE; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_SIZE, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(6,182,212,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, CANVAS_SIZE);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(CANVAS_SIZE, cy);
    ctx.stroke();
  }

  private drawDetectorRing(ctx: CanvasRenderingContext2D): void {
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;
    const r = DETECTOR_RADIUS_CM * SCALE;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(6,182,212,0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Detector label
    ctx.fillStyle = 'rgba(6,182,212,0.4)';
    ctx.font = '10px monospace';
    ctx.fillText(`∅ ${DETECTOR_RADIUS_CM * 2} cm`, cx + r - 48, cy - 6);
  }

  private drawTumorIndicator(
    ctx: CanvasRenderingContext2D,
    tumorX: number,
    tumorY: number,
    tumorRadius: number
  ): void {
    const cx = cmToCanvas(tumorX);
    const cy = cmToCanvasY(tumorY);
    const r = tumorRadius * SCALE;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(251,146,60,0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(251,146,60,0.06)';
    ctx.fill();

    ctx.fillStyle = 'rgba(251,146,60,0.6)';
    ctx.font = '10px monospace';
    ctx.fillText(`tumor r=${tumorRadius}cm`, cx + r + 4, cy);
  }

  private drawLORs(ctx: CanvasRenderingContext2D, events: PhotonPair[]): void {
    // Min 0.08 so individual lines are always perceptible;
    // scales down for large event counts to avoid saturating the center.
    const alpha = Math.max(0.08, Math.min(0.7, 80 / events.length));

    ctx.strokeStyle = `rgba(6,182,212,1)`;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 0.8;

    for (const pair of events) {
      const [x1, y1, x2, y2] = lorEndpoints(
        pair.origin_x,
        pair.origin_y,
        pair.direction1_x,
        pair.direction1_y,
        DETECTOR_RADIUS_CM
      );

      ctx.beginPath();
      ctx.moveTo(cmToCanvas(x1), cmToCanvasY(y1));
      ctx.lineTo(cmToCanvas(x2), cmToCanvasY(y2));
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  private drawLabels(ctx: CanvasRenderingContext2D): void {
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;

    ctx.fillStyle = 'rgba(6,182,212,0.35)';
    ctx.font = '11px monospace';
    ctx.fillText('+X', CANVAS_SIZE - 24, cy - 5);
    ctx.fillText('+Y', cx + 5, 14);
    ctx.fillText('−X', 4, cy - 5);
    ctx.fillText('−Y', cx + 5, CANVAS_SIZE - 4);
  }
}
