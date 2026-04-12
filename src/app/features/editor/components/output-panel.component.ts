import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoadedImage } from '../../../core/types';

const EXPORT_SIZES = [64, 128, 256, 512, 1024] as const;

@Component({
  selector: 'app-output-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel-header">
      <h2>3. Export</h2>
      @if (outputUrl(); as url) {
        <div class="file-info">
          <select
            class="size-select"
            [(ngModel)]="selectedSize"
            [attr.aria-label]="'Select export size'"
          >
            @for (size of exportSizes; track size) {
              <option [value]="size">{{ size }}×{{ size }}px</option>
            }
          </select>
        </div>
      }
    </div>

    <div class="result-stage">
      @if (outputUrl(); as url) {
        <img
          class="result-image"
          [class.copied]="copied()"
          [src]="url"
          alt="Preview of the final icon with the mask applied"
          [width]="selectedSize()"
          [height]="selectedSize()"
        />
      } @else {
        <div class="result-placeholder" aria-live="polite">
          <p>No preview.</p>
        </div>
      }
    </div>

    <div class="result-actions">
      <button
        class="secondary-button"
        type="button"
        [disabled]="!outputUrl()"
        (click)="onCopyClick()"
        [attr.aria-label]="copied() ? 'Copied!' : 'Copy image to clipboard'"
      >
        {{ copied() ? '✓ Copied' : 'Copy' }}
      </button>
      <button
        class="primary-button"
        type="button"
        [disabled]="!outputUrl()"
        (click)="onDownloadClick()"
        [attr.aria-label]="'Download icon at ' + selectedSize() + 'x' + selectedSize() + ' pixels'"
      >
        Download
      </button>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
    }

    .panel-header h2 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 800;
      letter-spacing: -0.03em;
    }

    .file-info {
      display: flex;
      gap: 8px;
    }

    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(27, 148, 234, 0.1);
      color: #0a67c7;
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid rgba(27, 148, 234, 0.3);
    }

    .result-stage {
      display: grid;
      place-items: center;
      min-height: 360px;
      padding: 16px;
      border-radius: 24px;
      background:
        radial-gradient(circle at top, rgba(255, 255, 255, 0.9), rgba(226, 241, 255, 0.78)),
        rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(148, 198, 243, 0.35);
      transition: all 0.3s ease;
    }

    .result-image {
      width: min(100%, 360px);
      height: auto;
      display: block;
      transition:
        transform 0.2s ease,
        filter 0.2s ease;
    }

    .result-image.copied {
      animation: copyPulse 0.4s ease-out;
    }

    @keyframes copyPulse {
      0% {
        transform: scale(1);
        filter: brightness(1);
      }
      50% {
        transform: scale(1.05);
        filter: brightness(1.1);
      }
      100% {
        transform: scale(1);
        filter: brightness(1);
      }
    }

    .result-placeholder {
      display: grid;
      place-items: center;
      padding: 24px;
      color: var(--text-soft, #5a7798);
      text-align: center;
    }

    .result-placeholder p {
      margin: 0;
    }

    .result-actions {
      display: flex;
      gap: 10px;
      margin-top: 14px;
    }

    .size-select {
      background: rgba(148, 198, 243, 0.15);
      color: #0a67c7;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.85rem;
      padding: 4px;
      border-radius: 8px;
    }

    .size-select:hover {
      background: rgba(148, 198, 243, 0.25);
      border-color: rgba(27, 148, 234, 0.5);
    }

    .primary-button,
    .secondary-button {
      flex: 1;
      min-height: 42px;
      padding: 0 12px;
      border-radius: 999px;
      border: none;
      font-weight: 800;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.95rem;
    }

    .primary-button {
      background: linear-gradient(135deg, #1b94ea, #0a67c7);
      color: #ffffff;
      box-shadow: 0 16px 24px rgba(12, 104, 196, 0.2);
    }

    .primary-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 20px 32px rgba(12, 104, 196, 0.28);
    }

    .primary-button:active:not(:disabled) {
      transform: translateY(0);
    }

    .secondary-button {
      background: rgba(148, 198, 243, 0.15);
      color: #0a67c7;
      border: 1.5px solid rgba(27, 148, 234, 0.3);
    }

    .secondary-button:hover:not(:disabled) {
      background: rgba(148, 198, 243, 0.25);
      border-color: rgba(27, 148, 234, 0.5);
    }

    .secondary-button:active:not(:disabled) {
      transform: scale(0.98);
    }

    .primary-button:disabled,
    .secondary-button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    .primary-button:focus-visible,
    .secondary-button:focus-visible {
      outline: 3px solid rgba(34, 139, 230, 0.32);
      outline-offset: 4px;
    }
  `,
})
export class OutputPanelComponent {
  outputUrl = input<string | null>(null);
  currentImage = input<LoadedImage | null>(null);

  downloadClick = output<number>();

  protected readonly copied = signal(false);
  protected readonly selectedSize = signal(512);
  protected readonly exportSizes = EXPORT_SIZES;

  onDownloadClick(): void {
    if (!this.outputUrl()) {
      return;
    }
    this.downloadClick.emit(this.selectedSize());
  }

  protected async onCopyClick(): Promise<void> {
    const url = this.outputUrl();
    if (!url) return;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);

      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // Fallback: copy to clipboard text
      try {
        await navigator.clipboard.writeText(url);
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      } catch {
        // Silent fail
      }
    }
  }
}
