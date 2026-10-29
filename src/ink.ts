import type { Point, Stroke } from "./core/types";
import { distance, length } from "./core/geometry";
export class InkCanvas {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly observer: ResizeObserver;
  private paths: Point[][] = [];
  private active: Point[] | null = null;
  private pointer: number | null = null;
  private frame = 0;
  private size = 400;
  private ratio = 1;
  public width = 2.6;
  public color = "#293b35";
  public onChange: (strokes: readonly Stroke[]) => void = () => {};
  public onStart: () => void = () => {};
  constructor(readonly element: HTMLCanvasElement) {
    const ctx = element.getContext("2d");
    if (!ctx) throw new Error("Este navegador no puede iniciar el lienzo.");
    this.ctx = ctx;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(element);
    element.addEventListener("pointerdown", this.down);
    element.addEventListener("pointermove", this.move);
    element.addEventListener("pointerup", this.up);
    element.addEventListener("pointercancel", this.cancel);
    element.addEventListener("lostpointercapture", this.cancel);
    this.resize();
  }
  get strokes(): readonly Stroke[] {
    return this.paths;
  }
  private point = (e: PointerEvent): Point => {
    const r = this.element.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
      pressure: e.pointerType === "pen" && e.pressure > 0 ? e.pressure : 0.5,
    };
  };
  private down = (e: PointerEvent): void => {
    if (this.pointer !== null || e.button !== 0) return;
    e.preventDefault();
    this.pointer = e.pointerId;
    this.element.setPointerCapture(e.pointerId);
    this.active = [this.point(e)];
    this.paths.push(this.active);
    this.onStart();
    this.requestRender();
  };
  private move = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointer || !this.active) return;
    e.preventDefault();
    const events =
      typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [e];
    for (const sample of events.length ? events : [e]) {
      const p = this.point(sample);
      if (distance(this.active[this.active.length - 1]!, p) > 0.0007)
        this.active.push(p);
    }
    this.requestRender();
  };
  private up = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointer || !this.active) return;
    const p = this.point(e);
    if (distance(this.active[this.active.length - 1]!, p) > 0.0007)
      this.active.push(p);
    this.finish();
  };
  private cancel = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointer) return;
    this.paths.pop();
    this.active = null;
    this.pointer = null;
    this.requestRender();
    this.onChange(this.paths);
  };
  private finish(): void {
    if (this.active && length(this.active) < 0.007) this.paths.pop();
    const id = this.pointer;
    this.pointer = null;
    this.active = null;
    if (id !== null && this.element.hasPointerCapture(id))
      this.element.releasePointerCapture(id);
    this.requestRender();
    this.onChange(this.paths);
  }
  private resize(): void {
    const r = this.element.getBoundingClientRect();
    if (!r.width) return;
    this.size = r.width;
    this.ratio = Math.min(devicePixelRatio || 1, 3);
    this.element.width = Math.round(r.width * this.ratio);
    this.element.height = Math.round(r.height * this.ratio);
    this.requestRender();
  }
  private requestRender(): void {
    if (!this.frame)
      this.frame = requestAnimationFrame(() => {
        this.frame = 0;
        this.render();
      });
  }
  private render(): void {
    const c = this.ctx;
    c.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    c.clearRect(
      0,
      0,
      this.element.width / this.ratio,
      this.element.height / this.ratio,
    );
    c.strokeStyle = this.color;
    c.fillStyle = this.color;
    c.lineCap = "round";
    c.lineJoin = "round";
    for (const stroke of this.paths) {
      if (!stroke.length) continue;
      const average =
        stroke.reduce((v, p) => v + (p.pressure ?? 0.5), 0) / stroke.length;
      c.lineWidth = this.width * (0.8 + average * 0.4);
      const first = stroke[0]!;
      if (stroke.length < 3) {
        c.beginPath();
        c.moveTo(first.x * this.size, first.y * this.size);
        for (const p of stroke) c.lineTo(p.x * this.size, p.y * this.size);
        c.stroke();
        continue;
      }
      c.beginPath();
      c.moveTo(first.x * this.size, first.y * this.size);
      for (let i = 1; i < stroke.length - 1; i++) {
        const p = stroke[i]!,
          next = stroke[i + 1]!;
        c.quadraticCurveTo(
          p.x * this.size,
          p.y * this.size,
          ((p.x + next.x) * this.size) / 2,
          ((p.y + next.y) * this.size) / 2,
        );
      }
      const last = stroke[stroke.length - 1]!;
      c.lineTo(last.x * this.size, last.y * this.size);
      c.stroke();
    }
  }
  clear(): void {
    this.active = null;
    this.pointer = null;
    this.paths = [];
    this.requestRender();
    this.onChange(this.paths);
  }
  undo(): void {
    if (this.pointer !== null) return;
    this.paths.pop();
    this.requestRender();
    this.onChange(this.paths);
  }
  redraw(): void {
    this.requestRender();
  }
  destroy(): void {
    this.observer.disconnect();
    cancelAnimationFrame(this.frame);
    this.element.removeEventListener("pointerdown", this.down);
    this.element.removeEventListener("pointermove", this.move);
    this.element.removeEventListener("pointerup", this.up);
    this.element.removeEventListener("pointercancel", this.cancel);
    this.element.removeEventListener("lostpointercapture", this.cancel);
  }
}
