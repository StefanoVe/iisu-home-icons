import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

type LoadedImage = {
  height: number;
  name: string;
  sourceUrl: string;
  width: number;
};

type DragState = {
  originPointerX: number;
  originPointerY: number;
  originX: number;
  originY: number;
  pointerId: number;
};

const CROP_VIEW_SIZE = 320;
const OUTPUT_SIZE = 512;
const FRAME_PADDING = 24;
const FRAME_RADIUS = 50;
const INNER_PADDING = 18;
const INNER_RADIUS = 38;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const DEFAULT_ZOOM = 1.18;
const DEFAULT_FADE_STRENGTH = 0.28;
const DEFAULT_GLOW_STRENGTH = 0.22;
const MIN_ROTATION = -180;
const MAX_ROTATION = 180;
const DEFAULT_ROTATION = 0;

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: {
    '(window:pointermove)': 'onPointerMove($event)',
    '(window:pointerup)': 'onPointerUp($event)',
    '(window:pointercancel)': 'onPointerUp($event)',
  },
})
export class App {
  protected readonly cropSize = CROP_VIEW_SIZE;
  protected readonly maxZoom = MAX_ZOOM;
  protected readonly minZoom = MIN_ZOOM;
  protected readonly projectName = 'iiSU Home Icon Mask Tool';
  protected readonly minRotation = MIN_ROTATION;
  protected readonly maxRotation = MAX_ROTATION;

  private readonly dragState = signal<DragState | null>(null);
  private readonly imageElement = signal<HTMLImageElement | null>(null);
  private readonly image = signal<LoadedImage | null>(null);
  private readonly offsetX = signal(0);
  private readonly offsetY = signal(0);
  private readonly outputUrl = signal<string | null>(null);
  private readonly zoom = signal(DEFAULT_ZOOM);
  private readonly rotation = signal(DEFAULT_ROTATION);
  private readonly showGrid = signal(true);

  protected readonly isDragging = computed(() => this.dragState() !== null);
  protected readonly hasImage = computed(() => this.image() !== null);
  protected readonly currentImage = this.image.asReadonly();
  protected readonly currentOffsetX = this.offsetX.asReadonly();
  protected readonly currentOffsetY = this.offsetY.asReadonly();
  protected readonly currentOutputUrl = this.outputUrl.asReadonly();
  protected readonly currentZoom = this.zoom.asReadonly();
  protected readonly currentRotation = this.rotation.asReadonly();
  protected readonly isGridVisible = this.showGrid.asReadonly();

  protected readonly cropMetrics = computed(() => {
    const image = this.image();
    if (!image) {
      return {
        displayHeight: 0,
        displayWidth: 0,
        maxOffsetX: 0,
        maxOffsetY: 0,
      };
    }

    const coverScale = Math.max(CROP_VIEW_SIZE / image.width, CROP_VIEW_SIZE / image.height);
    const scaledWidth = image.width * coverScale * this.zoom();
    const scaledHeight = image.height * coverScale * this.zoom();
    const rotationRadians = this.toRadians(this.rotation());
    const boundingWidth =
      Math.abs(scaledWidth * Math.cos(rotationRadians)) +
      Math.abs(scaledHeight * Math.sin(rotationRadians));
    const boundingHeight =
      Math.abs(scaledWidth * Math.sin(rotationRadians)) +
      Math.abs(scaledHeight * Math.cos(rotationRadians));

    return {
      displayHeight: scaledHeight,
      displayWidth: scaledWidth,
      maxOffsetX: Math.max(0, (boundingWidth - CROP_VIEW_SIZE) / 2),
      maxOffsetY: Math.max(0, (boundingHeight - CROP_VIEW_SIZE) / 2),
    };
  });

  protected async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (!file) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    try {
      const imageElement = await this.loadImageElement(objectUrl);
      this.revokeCurrentImageUrl();

      this.imageElement.set(imageElement);
      this.image.set({
        height: imageElement.naturalHeight,
        name: file.name.replace(/\.[^.]+$/, ''),
        sourceUrl: objectUrl,
        width: imageElement.naturalWidth,
      });
      this.zoom.set(DEFAULT_ZOOM);
      this.resetEditor();
    } catch {
      URL.revokeObjectURL(objectUrl);
    } finally {
      if (input) {
        input.value = '';
      }
    }
  }

  protected onZoomChange(event: Event): void {
    this.updateRangeValue(event, this.zoom, DEFAULT_ZOOM);
    this.clampOffsets();
    this.renderOutput();
  }

  protected onRotationChange(event: Event): void {
    this.updateRangeValue(event, this.rotation, DEFAULT_ROTATION);
    this.clampOffsets();
    this.renderOutput();
  }

  protected rotateBy(delta: number): void {
    const nextRotation = this.clamp(this.rotation() + delta, MIN_ROTATION, MAX_ROTATION);
    this.rotation.set(nextRotation);
    this.clampOffsets();
    this.renderOutput();
  }

  protected toggleGrid(): void {
    this.showGrid.update((value) => !value);
  }

  protected onPointerDown(event: PointerEvent): void {
    if (!this.hasImage()) {
      return;
    }

    event.preventDefault();
    this.dragState.set({
      originPointerX: event.clientX,
      originPointerY: event.clientY,
      originX: this.offsetX(),
      originY: this.offsetY(),
      pointerId: event.pointerId,
    });
  }

  protected onPointerMove(event: PointerEvent): void {
    const dragState = this.dragState();
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const nextX = dragState.originX + (event.clientX - dragState.originPointerX);
    const nextY = dragState.originY + (event.clientY - dragState.originPointerY);
    const clamped = this.getClampedOffsets(nextX, nextY);

    this.offsetX.set(clamped.x);
    this.offsetY.set(clamped.y);
    this.renderOutput();
  }

  protected onPointerUp(event: PointerEvent): void {
    const dragState = this.dragState();
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    this.dragState.set(null);
  }

  protected resetCrop(): void {
    this.resetEditor();
  }

  protected formatZoomValue(value: number): string {
    return `${value.toFixed(2)}x`;
  }

  protected formatRotationValue(value: number): string {
    return `${Math.round(value)}deg`;
  }

  private resetEditor(): void {
    this.zoom.set(DEFAULT_ZOOM);
    this.rotation.set(DEFAULT_ROTATION);
    this.showGrid.set(true);
    this.offsetX.set(0);
    this.offsetY.set(0);
    this.renderOutput();
  }

  protected downloadResult(): void {
    const outputUrl = this.outputUrl();
    if (!outputUrl) {
      return;
    }

    const link = document.createElement('a');
    const imageName = this.image()?.name ?? 'iisu-community-icon';
    link.href = outputUrl;
    link.download = `${imageName}-masked.png`;
    link.click();
  }

  private clampOffsets(): void {
    const clamped = this.getClampedOffsets(this.offsetX(), this.offsetY());
    this.offsetX.set(clamped.x);
    this.offsetY.set(clamped.y);
  }

  private getClampedOffsets(x: number, y: number): { x: number; y: number } {
    const metrics = this.cropMetrics();

    return {
      x: this.clamp(x, -metrics.maxOffsetX, metrics.maxOffsetX),
      y: this.clamp(y, -metrics.maxOffsetY, metrics.maxOffsetY),
    };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private toRadians(value: number): number {
    return (value * Math.PI) / 180;
  }

  private updateRangeValue(
    event: Event,
    target: { set(value: number): void },
    fallback: number,
  ): void {
    const input = event.target as HTMLInputElement | null;
    target.set(Number(input?.value ?? fallback));
  }

  private async loadImageElement(sourceUrl: string): Promise<HTMLImageElement> {
    const imageElement = new window.Image();

    await new Promise<void>((resolve, reject) => {
      imageElement.addEventListener('load', () => resolve(), { once: true });
      imageElement.addEventListener('error', () => reject(new Error('Image loading failed')), {
        once: true,
      });
      imageElement.src = sourceUrl;
    });

    return imageElement;
  }

  private revokeCurrentImageUrl(): void {
    const currentImage = this.image();
    if (currentImage) {
      URL.revokeObjectURL(currentImage.sourceUrl);
    }
  }

  private renderOutput(): void {
    const image = this.image();
    const imageElement = this.imageElement();

    if (!image || !imageElement) {
      this.outputUrl.set(null);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    const context = canvas.getContext('2d');
    if (!context) {
      this.outputUrl.set(null);
      return;
    }

    const outerInset = FRAME_PADDING;
    const outerSize = OUTPUT_SIZE - outerInset * 2;
    const innerInset = outerInset + INNER_PADDING;
    const innerSize = OUTPUT_SIZE - innerInset * 2;
    const rotationRadians = this.toRadians(this.rotation());
    const coverScale = Math.max(innerSize / image.width, innerSize / image.height);
    const drawWidth = image.width * coverScale * this.zoom();
    const drawHeight = image.height * coverScale * this.zoom();
    const offsetScale = innerSize / CROP_VIEW_SIZE;
    const centerX = innerInset + innerSize / 2 + this.offsetX() * offsetScale;
    const centerY = innerInset + innerSize / 2 + this.offsetY() * offsetScale;

    context.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    this.drawRoundedRect(context, outerInset, outerInset, outerSize, outerSize, FRAME_RADIUS);
    context.save();
    context.shadowColor = `rgba(28, 73, 136, ${DEFAULT_GLOW_STRENGTH})`;
    context.shadowBlur = 30;
    context.shadowOffsetY = 12;
    context.fillStyle = '#ffffff';
    context.fill();
    context.restore();

    context.save();
    this.drawRoundedRect(context, innerInset, innerInset, innerSize, innerSize, INNER_RADIUS);
    context.clip();
    context.fillStyle = '#ffffff';
    context.fillRect(innerInset, innerInset, innerSize, innerSize);
    context.save();
    context.translate(centerX, centerY);
    context.rotate(rotationRadians);
    context.drawImage(imageElement, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    context.restore();
    this.drawEdgeFade(context, innerInset, innerInset, innerSize, innerSize, DEFAULT_FADE_STRENGTH);
    context.restore();

    context.save();
    context.strokeStyle = 'rgba(255, 255, 255, 0.96)';
    context.lineWidth = 4;
    this.drawRoundedRect(context, innerInset, innerInset, innerSize, innerSize, INNER_RADIUS);
    context.stroke();
    context.restore();

    context.save();
    context.strokeStyle = 'rgba(189, 219, 255, 0.55)';
    context.lineWidth = 2;
    this.drawRoundedRect(
      context,
      outerInset + 2,
      outerInset + 2,
      outerSize - 4,
      outerSize - 4,
      FRAME_RADIUS - 2,
    );
    context.stroke();
    context.restore();

    this.outputUrl.set(canvas.toDataURL('image/png'));
  }

  private drawEdgeFade(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    opacity: number,
  ): void {
    const fadeSize = 32;

    const gradients = [
      {
        gradient: context.createLinearGradient(x, y, x + fadeSize, y),
        rect: [x, y, fadeSize, height] as const,
      },
      {
        gradient: context.createLinearGradient(x + width, y, x + width - fadeSize, y),
        rect: [x + width - fadeSize, y, fadeSize, height] as const,
      },
      {
        gradient: context.createLinearGradient(x, y, x, y + fadeSize),
        rect: [x, y, width, fadeSize] as const,
      },
      {
        gradient: context.createLinearGradient(x, y + height, x, y + height - fadeSize),
        rect: [x, y + height - fadeSize, width, fadeSize] as const,
      },
    ];

    for (const item of gradients) {
      item.gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
      item.gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      context.fillStyle = item.gradient;
      context.fillRect(item.rect[0], item.rect[1], item.rect[2], item.rect[3]);
    }
  }

  private drawRoundedRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
  }
}
