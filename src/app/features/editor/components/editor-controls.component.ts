import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-editor-controls',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel-header panel-header-compact">
      <h2>2. Edit</h2>
      <button
        class="icon-button"
        type="button"
        [attr.aria-label]="gridVisible() ? 'Hide grid' : 'Show grid'"
        [attr.aria-pressed]="gridVisible()"
        (click)="onToggleGrid()"
      >
        <svg
          width="64"
          height="64"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 10V8h-4V4h-2v4h-4V4H8v4H4v2h4v4H4v2h4v4h2v-4h4v4h2v-4h4v-2h-4v-4h4Zm-6 4h-4v-4h4v4Z"
          ></path>
        </svg>
      </button>
    </div>

    <div class="tool-grid">
      <label class="slider-field" for="zoom-control">
        <span class="field-header">
          <span>Zoom</span>
          <strong>{{ formatZoom(currentZoom()) }}</strong>
        </span>
        <input
          id="zoom-control"
          type="range"
          [min]="minZoom()"
          [max]="maxZoom()"
          step="0.01"
          [value]="currentZoom()"
          (input)="onZoomChange($event)"
        />
      </label>

      <label class="slider-field" for="rotation-control">
        <span class="field-header">
          <span>Rotate</span>
          <strong>{{ formatRotation(currentRotation()) }}</strong>
        </span>
        <input
          id="rotation-control"
          type="range"
          [min]="minRotation()"
          [max]="maxRotation()"
          step="0.1"
          [value]="currentRotation()"
          (input)="onRotationChange($event)"
        />
      </label>
    </div>

    <div class="flex flex-row justify-end w-full gap-2" aria-label="Rotation controls">
      <button class="ghost-button" type="button" (click)="onRotateBy(-5)">-5°</button>
      <button class="ghost-button" type="button" (click)="onRotateBy(5)">+5°</button>
    </div>
  `,
  styles: `
    :host {
      display: block;
      margin-top: 10px;
    }

    .panel-header-compact {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-top: 18px;
      margin-bottom: 14px;
    }

    .panel-header-compact h2 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 800;
      letter-spacing: -0.03em;
    }

    .icon-button {
      display: inline-grid;
      place-items: center;
      min-width: 42px;
      min-height: 42px;
      padding: 0;
      border-radius: 999px;
      border: none;
      background: rgba(229, 242, 255, 0.95);
      color: var(--accent-deep, #0f67bf);
      font-family: inherit;
      cursor: pointer;
    }

    .icon-button svg {
      width: 1.1rem;
      height: 1.1rem;
    }

    .icon-button[aria-pressed='true'] {
      background: linear-gradient(135deg, #1b94ea, #0a67c7);
      color: #ffffff;
      box-shadow: 0 12px 20px rgba(12, 104, 196, 0.18);
    }

    .icon-button:focus-visible {
      outline: 3px solid rgba(34, 139, 230, 0.32);
      outline-offset: 4px;
    }

    .tool-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-top: 14px;
    }

    .slider-field {
      display: grid;
      gap: 8px;
      color: var(--text-soft, #5a7798);
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
    }

    .field-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .field-header strong {
      min-width: 4.5rem;
      padding: 0.3rem 0.55rem;
      border-radius: 999px;
      background: rgba(232, 244, 255, 0.95);
      color: var(--accent-deep, #0f67bf);
      font-size: 0.82rem;
      text-align: center;
    }

    .slider-field input[type='range'] {
      appearance: none;
      width: 100%;
      height: 2.8rem;
      border-radius: 999px;
      background: transparent;
    }

    .slider-field input[type='range']:focus {
      outline: none;
    }

    .slider-field input[type='range']::-webkit-slider-runnable-track {
      height: 0.55rem;
      border-radius: 999px;
      background: linear-gradient(90deg, rgba(44, 167, 242, 0.95), rgba(15, 103, 191, 0.9));
      box-shadow:
        inset 0 0 0 1px rgba(255, 255, 255, 0.75),
        0 6px 16px rgba(18, 112, 197, 0.12);
    }

    .slider-field input[type='range']::-webkit-slider-thumb {
      appearance: none;
      width: 1.15rem;
      height: 1.15rem;
      margin-top: -0.3rem;
      border: 3px solid #ffffff;
      border-radius: 50%;
      background: #0f67bf;
      box-shadow: 0 8px 18px rgba(15, 103, 191, 0.24);
      cursor: grab;
    }

    .slider-field input[type='range']::-moz-range-track {
      height: 0.55rem;
      border: none;
      border-radius: 999px;
      background: linear-gradient(90deg, rgba(44, 167, 242, 0.95), rgba(15, 103, 191, 0.9));
      box-shadow:
        inset 0 0 0 1px rgba(255, 255, 255, 0.75),
        0 6px 16px rgba(18, 112, 197, 0.12);
    }

    .slider-field input[type='range']::-moz-range-thumb {
      width: 1.15rem;
      height: 1.15rem;
      border: 3px solid #ffffff;
      border-radius: 50%;
      background: #0f67bf;
      box-shadow: 0 8px 18px rgba(15, 103, 191, 0.24);
      cursor: grab;
    }

    .flex {
      display: flex;
    }

    .flex-row {
      flex-direction: row;
    }

    .justify-end {
      justify-content: flex-end;
    }

    .w-full {
      width: 100%;
    }

    .gap-2 {
      gap: 8px;
    }

    .ghost-button {
      min-height: 42px;
      padding: 0 12px;
      border-radius: 999px;
      border: none;
      background: rgba(229, 242, 255, 0.95);
      color: var(--accent-deep, #0f67bf);
      font-weight: 800;
      font-family: inherit;
      cursor: pointer;
    }

    .ghost-button:focus-visible {
      outline: 3px solid rgba(34, 139, 230, 0.32);
      outline-offset: 4px;
    }

    @media (max-width: 640px) {
      .tool-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
  `,
})
export class EditorControlsComponent {
  minZoom = input(1);
  maxZoom = input(3);
  minRotation = input(-180);
  maxRotation = input(180);
  currentZoom = input(1.18);
  currentRotation = input(0);
  gridVisible = input(true);

  zoomChange = output<number>();
  rotationChange = output<number>();
  gridToggle = output<void>();
  rotateBy = output<number>();

  formatZoom(value: number): string {
    return `${value.toFixed(2)}x`;
  }

  formatRotation(value: number): string {
    return `${Math.round(value)}deg`;
  }

  onToggleGrid(): void {
    this.gridToggle.emit();
  }

  onZoomChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const value = Number(input?.value ?? this.currentZoom());
    this.zoomChange.emit(value);
  }

  onRotationChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const value = Number(input?.value ?? this.currentRotation());
    this.rotationChange.emit(value);
  }

  onRotateBy(delta: number): void {
    this.rotateBy.emit(delta);
  }
}
