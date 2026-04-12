import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MIN_SHADOW_BLUR, MAX_SHADOW_BLUR } from '../../../shared/constants';

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

    <!-- Advanced Shadow Settings -->
    <button
      class="advanced-toggle"
      type="button"
      (click)="toggleAdvancedShadow()"
      [attr.aria-expanded]="shadowAdvancedOpen()"
      aria-label="Toggle advanced shadow settings"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M8 12h8M8 12l4-4m-4 4l4 4"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          [attr.transform]="shadowAdvancedOpen() ? 'rotate(90 12 12)' : 'rotate(0 12 12)'"
        />
      </svg>
      <span>Shadow Settings</span>
    </button>

    @if (shadowAdvancedOpen()) {
      <div class="advanced-shadow-panel">
        <label class="slider-field" for="shadow-blur-control">
          <span class="field-header">
            <span>Shadow Blur</span>
            <strong>{{ currentShadowBlur() }}px</strong>
          </span>
          <input
            id="shadow-blur-control"
            type="range"
            [min]="MIN_SHADOW_BLUR"
            [max]="MAX_SHADOW_BLUR"
            step="1"
            [value]="currentShadowBlur()"
            (input)="onShadowBlurChange($event)"
          />
        </label>

        <div class="shadow-color-section">
          <div class="shadow-color-toggle">
            <label class="toggle-label">
              <input
                type="checkbox"
                [checked]="shadowColorAuto()"
                (change)="onToggleShadowColorAuto()"
              />
              <span class="toggle-text">
                {{ shadowColorAuto() ? 'Auto (from image)' : 'Custom color' }}
              </span>
            </label>
          </div>

          @if (!shadowColorAuto()) {
            <label class="color-field" for="shadow-color-control">
              <span class="field-header">
                <span>Color</span>
              </span>
              <input
                id="shadow-color-control"
                type="color"
                [value]="currentShadowColor()"
                (input)="onShadowColorChange($event)"
              />
            </label>
          }
        </div>
      </div>
    }
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

    .slider-field,
    .color-field {
      display: grid;
      gap: 8px;
      color: var(--text-soft, #5a7798);
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
    }

    .color-field input[type='color'] {
      width: 100%;
      height: 2.8rem;
      border: 2px solid rgba(44, 167, 242, 0.3);
      border-radius: 8px;
      cursor: pointer;
    }

    .color-field input[type='color']:focus-visible {
      outline: 3px solid rgba(34, 139, 230, 0.32);
      outline-offset: 2px;
    }

    .color-field input[type='color']:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .color-field input[type='checkbox'] {
      width: 1.2rem;
      height: 1.2rem;
      cursor: pointer;
      accent-color: var(--accent-deep, #0f67bf);
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

    .advanced-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      margin-top: 14px;
      padding: 10px 12px;
      border: 1px solid rgba(44, 167, 242, 0.2);
      border-radius: 8px;
      background: rgba(229, 242, 255, 0.6);
      color: var(--accent-deep, #0f67bf);
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .advanced-toggle:hover {
      background: rgba(229, 242, 255, 0.95);
      border-color: rgba(44, 167, 242, 0.4);
    }

    .advanced-toggle:focus-visible {
      outline: 3px solid rgba(34, 139, 230, 0.32);
      outline-offset: 2px;
    }

    .advanced-toggle svg {
      width: 1rem;
      height: 1rem;
      transition: transform 0.2s ease;
    }

    .advanced-shadow-panel {
      display: grid;
      gap: 12px;
      margin-top: 12px;
      padding: 12px;
      border-radius: 8px;
      background: rgba(248, 252, 255, 0.6);
      border: 1px solid rgba(44, 167, 242, 0.15);
    }

    .shadow-color-section {
      display: grid;
      gap: 10px;
    }

    .shadow-color-toggle {
      display: flex;
      align-items: center;
    }

    .toggle-label {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-soft, #5a7798);
    }

    .toggle-label input[type='checkbox'] {
      appearance: none;
      width: 2rem;
      height: 1.1rem;
      border-radius: 999px;
      background: rgba(139, 189, 236, 0.3);
      border: 1px solid rgba(44, 167, 242, 0.3);
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }

    .toggle-label input[type='checkbox']:before {
      content: '';
      position: absolute;
      width: 0.8rem;
      height: 0.8rem;
      border-radius: 50%;
      background: #ffffff;
      top: 0.15rem;
      left: 0.15rem;
      transition: left 0.2s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .toggle-label input[type='checkbox']:checked {
      background: rgba(44, 167, 242, 0.8);
      border-color: var(--accent-deep, #0f67bf);
    }

    .toggle-label input[type='checkbox']:checked:before {
      left: 0.85rem;
    }

    .toggle-label input[type='checkbox']:focus-visible {
      outline: 3px solid rgba(34, 139, 230, 0.32);
      outline-offset: 2px;
    }

    .toggle-text {
      font-weight: 700;
      color: var(--accent-deep, #0f67bf);
    }

    .color-field {
      display: grid;
      gap: 8px;
      color: var(--text-soft, #5a7798);
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
    }

    .color-field input[type='color'] {
      width: 100%;
      height: 2.8rem;
      border: 2px solid rgba(44, 167, 242, 0.3);
      border-radius: 8px;
      cursor: pointer;
    }

    .color-field input[type='color']:focus-visible {
      outline: 3px solid rgba(34, 139, 230, 0.32);
      outline-offset: 2px;
    }

    @media (max-width: 640px) {
      .tool-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
  `,
})
export class EditorControlsComponent {
  protected readonly MIN_SHADOW_BLUR = MIN_SHADOW_BLUR;
  protected readonly MAX_SHADOW_BLUR = MAX_SHADOW_BLUR;
  protected readonly shadowAdvancedOpen = signal(false);

  minZoom = input(1);
  maxZoom = input(3);
  minRotation = input(-180);
  maxRotation = input(180);
  currentZoom = input(1.18);
  currentRotation = input(0);
  gridVisible = input(true);
  currentShadowBlur = input(40);
  currentShadowColor = input('#000000');
  shadowColorAuto = input(true);

  zoomChange = output<number>();
  rotationChange = output<number>();
  gridToggle = output<void>();
  rotateBy = output<number>();
  shadowBlurChange = output<number>();
  shadowColorChange = output<string>();
  shadowColorAutoToggle = output<void>();

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

  toggleAdvancedShadow(): void {
    this.shadowAdvancedOpen.update((value) => !value);
  }

  onShadowBlurChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const value = Number(input?.value ?? this.currentShadowBlur());
    this.shadowBlurChange.emit(value);
  }

  onShadowColorChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const value = input?.value ?? this.currentShadowColor();
    this.shadowColorChange.emit(value);
  }

  onToggleShadowColorAuto(): void {
    this.shadowColorAutoToggle.emit();
  }
}
