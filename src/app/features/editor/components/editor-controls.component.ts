import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MAX_SHADOW_BLUR, MIN_SHADOW_BLUR } from '../../../shared/constants';

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

    <div class="tool-grid flex items-center justify-stretch w-full">
      <label class="slider-field w-full" for="zoom-control">
        <span class="field-header">
          <span>Zoom</span>
          <strong>{{ formatZoom(currentZoom()) }}</strong>
        </span>
        <input
          id="zoom-control"
          class="w-full"
          type="range"
          [min]="minZoom()"
          [max]="maxZoom()"
          step="0.01"
          [value]="currentZoom()"
          (input)="onZoomChange($event)"
        />
      </label>
    </div>

    <!-- Rotation Settings -->
    <button
      class="advanced-toggle"
      type="button"
      (click)="toggleAdvancedRotation()"
      [attr.aria-expanded]="rotationAdvancedOpen()"
      aria-label="Toggle rotation settings"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 12h8M8 12l4-4m-4 4l4 4"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          [attr.transform]="rotationAdvancedOpen() ? 'rotate(90 12 12)' : 'rotate(0 12 12)'"
        />
      </svg>
      <span>Rotation</span>
    </button>

    @if (rotationAdvancedOpen()) {
      <div class="advanced-panel">
        <label class="slider-field" for="rotation-control">
          <span class="field-header">
            <span>Angle</span>
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

        <div class="rotation-quick-buttons">
          <button class="ghost-button" type="button" (click)="onRotateBy(-5)">-5°</button>
          <button class="ghost-button" type="button" (click)="onRotateBy(5)">+5°</button>
        </div>
      </div>
    }

    <!-- Advanced Shadow Settings -->
    <button
      class="advanced-toggle"
      type="button"
      (click)="toggleAdvancedShadow()"
      [attr.aria-expanded]="shadowAdvancedOpen()"
      aria-label="Toggle advanced shadow settings"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 12h8M8 12l4-4m-4 4l4 4"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          [attr.transform]="shadowAdvancedOpen() ? 'rotate(90 12 12)' : 'rotate(0 12 12)'"
        />
      </svg>
      <span>Drop Shadow</span>
    </button>

    @if (shadowAdvancedOpen()) {
      <div class="advanced-panel">
        <label class="slider-field" for="shadow-blur-control">
          <span class="field-header">
            <span>Size</span>
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
          <span class="color-field field-header">
            <span>Color</span>
          </span>
          <div class="shadow-color-toggle">
            <label class="toggle-label">
              <input
                type="checkbox"
                [checked]="shadowColorAuto()"
                (change)="onToggleShadowColorAuto()"
              />
              <span class="toggle-text">
                <span> Average </span>
              </span>
            </label>
          </div>

          @if (!shadowColorAuto()) {
            <label class="color-field" for="shadow-color-control">
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

    <!-- Style Settings -->
    <button
      class="advanced-toggle"
      type="button"
      (click)="toggleAdvancedStyle()"
      [attr.aria-expanded]="styleAdvancedOpen()"
      aria-label="Toggle advanced style settings"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 12h8M8 12l4-4m-4 4l4 4"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          [attr.transform]="styleAdvancedOpen() ? 'rotate(90 12 12)' : 'rotate(0 12 12)'"
        />
      </svg>
      <span>Style</span>
    </button>

    @if (styleAdvancedOpen()) {
      <div class="advanced-panel">
        <!-- Future style controls go here -->
        <select
          class="style-select"
          aria-label="Select icon style"
          (change)="onStyleChange($event)"
          [value]="styleVariant()"
        >
          <option value="concept">Concept-like</option>
          <option value="glassy">Glassy</option>
        </select>
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

    .advanced-panel {
      display: grid;
      gap: 12px;
      margin-top: 12px;
      padding: 12px;
      border-radius: 8px;
      background: rgba(248, 252, 255, 0.6);
      border: 1px solid rgba(44, 167, 242, 0.15);
    }

    .rotation-quick-buttons {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
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
      flex-shrink: 0;
      width: 2.4rem;
      height: 1.3rem;
      border-radius: 999px;
      background: linear-gradient(135deg, rgba(139, 189, 236, 0.25), rgba(189, 219, 255, 0.25));
      border: 1.5px solid rgba(44, 167, 242, 0.4);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
    }

    .toggle-label input[type='checkbox']:hover {
      background: linear-gradient(135deg, rgba(139, 189, 236, 0.35), rgba(189, 219, 255, 0.35));
      border-color: rgba(44, 167, 242, 0.6);
      box-shadow:
        inset 0 2px 4px rgba(0, 0, 0, 0.04),
        0 0 12px rgba(44, 167, 242, 0.15);
    }

    .toggle-label input[type='checkbox']:active {
      box-shadow:
        inset 0 2px 4px rgba(0, 0, 0, 0.06),
        0 0 8px rgba(44, 167, 242, 0.1);
    }

    .toggle-label input[type='checkbox']:before {
      content: '';
      position: absolute;
      display: block;
      width: 0.95rem;
      height: 0.95rem;
      border-radius: 50%;
      background: #ffffff;
      top: 50%;
      left: 0.175rem;
      transform: translateY(-50%);
      transition:
        left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.3s ease;
      box-shadow:
        0 2px 4px rgba(0, 0, 0, 0.12),
        0 1px 2px rgba(0, 0, 0, 0.06);
    }

    .toggle-label input[type='checkbox']:hover:before {
      box-shadow:
        0 3px 6px rgba(0, 0, 0, 0.14),
        0 2px 3px rgba(0, 0, 0, 0.08);
    }

    .toggle-label input[type='checkbox']:checked {
      background: linear-gradient(135deg, rgba(27, 148, 234, 0.9), rgba(15, 103, 191, 0.85));
      border-color: var(--accent-deep, #0f67bf);
      box-shadow:
        inset 0 2px 4px rgba(0, 0, 0, 0.08),
        0 4px 12px rgba(15, 103, 191, 0.25);
    }

    .toggle-label input[type='checkbox']:checked:hover {
      background: linear-gradient(135deg, rgba(27, 148, 234, 1), rgba(15, 103, 191, 0.95));
      box-shadow:
        inset 0 2px 4px rgba(0, 0, 0, 0.08),
        0 6px 16px rgba(15, 103, 191, 0.32);
    }

    .toggle-label input[type='checkbox']:checked:before {
      left: 1.25rem;
    }

    .toggle-label input[type='checkbox']:focus-visible {
      outline: 3px solid rgba(34, 139, 230, 0.4);
      outline-offset: 3px;
    }

    .toggle-label input[type='checkbox']:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: linear-gradient(135deg, rgba(139, 189, 236, 0.15), rgba(189, 219, 255, 0.15));
      border-color: rgba(44, 167, 242, 0.2);
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
  protected readonly rotationAdvancedOpen = signal(false);
  protected readonly shadowAdvancedOpen = signal(false);
  protected readonly styleAdvancedOpen = signal(false);

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
  styleVariant = input('concept');

  zoomChange = output<number>();
  rotationChange = output<number>();
  gridToggle = output<void>();
  rotateBy = output<number>();
  shadowBlurChange = output<number>();
  shadowColorChange = output<string>();
  shadowColorAutoToggle = output<void>();
  styleVariantChange = output<string>();

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

  onStyleChange(event: Event): void {
    const input = event.target as HTMLSelectElement | null;
    const value = input?.value ?? this.styleVariant();
    this.styleVariantChange.emit(value);
  }

  onRotationChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const value = Number(input?.value ?? this.currentRotation());
    this.rotationChange.emit(value);
  }

  onRotateBy(delta: number): void {
    this.rotateBy.emit(delta);
  }

  toggleAdvancedRotation(): void {
    this.rotationAdvancedOpen.update((value) => !value);
  }

  toggleAdvancedStyle(): void {
    this.styleAdvancedOpen.update((value) => !value);
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
