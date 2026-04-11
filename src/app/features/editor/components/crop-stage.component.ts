import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CropMetrics, LoadedImage } from '../../../core/types';
import { CROP_VIEW_SIZE } from '../../../shared/constants';

@Component({
  selector: 'app-crop-stage',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="crop-stage"
      [class.is-dragging]="isDragging()"
      (pointerdown)="onPointerDown($event)"
      role="application"
      aria-label="Square crop area"
    >
      <div class="crop-grid" [class.crop-grid-hidden]="!showGrid()" aria-hidden="true"></div>
      <img
        [src]="currentImage()?.sourceUrl"
        alt="Preview of the image being cropped"
        draggable="false"
        [style.width.px]="cropMetrics().displayWidth"
        [style.height.px]="cropMetrics().displayHeight"
        [style.left.px]="cropSize / 2 + offsetX()"
        [style.top.px]="cropSize / 2 + offsetY()"
        [style.transform]="'translate(-50%, -50%) rotate(' + rotation() + 'deg)'"
      />
      <div class="crop-frame" aria-hidden="true"></div>
    </div>
  `,
  styles: `
    :host {
      display: grid;
      place-items: center;
    }

    .crop-stage {
      position: relative;
      inline-size: min(100%, 320px);
      block-size: min(100vw - 84px, 320px);
      overflow: hidden;
      border-radius: 32px;
      border: 1px solid rgba(148, 198, 243, 0.4);
      background:
        linear-gradient(180deg, rgba(107, 210, 255, 0.28), rgba(29, 95, 190, 0.18)),
        linear-gradient(135deg, #f7fbff, #edf5ff);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
      touch-action: none;
      user-select: none;
      cursor: grab;
    }

    .crop-stage.is-dragging {
      cursor: grabbing;
    }

    .crop-grid,
    .crop-frame {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .crop-grid {
      z-index: 2;
      background-image:
        linear-gradient(rgba(255, 255, 255, 0.34) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.34) 1px, transparent 1px);
      background-size: calc(100% / 3) calc(100% / 3);
    }

    .crop-grid-hidden {
      opacity: 0;
    }

    .crop-stage img {
      position: absolute;
      z-index: 1;
      max-width: none;
    }

    .crop-frame {
      z-index: 3;
      border-radius: 32px;
      border: 2px solid rgba(255, 255, 255, 0.92);
      box-shadow:
        inset 0 0 24px rgba(255, 255, 255, 0.3),
        inset 0 0 0 1px rgba(255, 255, 255, 0.92),
        0 4px 16px rgba(27, 148, 234, 0.1);
      background: none;
    }
  `,
})
export class CropStageComponent {
  currentImage = input<LoadedImage | null>(null);
  cropMetrics = input<CropMetrics>({
    displayHeight: 0,
    displayWidth: 0,
    maxOffsetX: 0,
    maxOffsetY: 0,
  });
  offsetX = input(0);
  offsetY = input(0);
  rotation = input(0);
  showGrid = input(true);
  isDragging = input(false);

  pointerDown = output<PointerEvent>();

  protected readonly cropSize = CROP_VIEW_SIZE;

  onPointerDown(event: PointerEvent): void {
    this.pointerDown.emit(event);
  }
}
