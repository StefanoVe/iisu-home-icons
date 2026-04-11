import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadedImage } from '../../../core/types';

@Component({
  selector: 'app-output-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel-header">
      <h2>3. Export</h2>
    </div>

    <div class="result-stage">
      @if (outputUrl(); as url) {
        <img
          class="result-image"
          [src]="url"
          alt="Preview of the final icon with the mask applied"
          width="512"
          height="512"
        />
      } @else {
        <div class="result-placeholder" aria-live="polite">
          <p>No preview.</p>
        </div>
      }
    </div>

    <div class="result-actions">
      <button
        class="primary-button"
        type="button"
        [disabled]="!outputUrl()"
        (click)="onDownloadClick()"
      >
        Download PNG
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
    }

    .result-image {
      width: min(100%, 360px);
      height: auto;
      display: block;
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
      margin-top: 14px;
    }

    .primary-button {
      width: 100%;
      min-height: 42px;
      padding: 0 12px;
      border-radius: 999px;
      border: none;
      background: linear-gradient(135deg, #1b94ea, #0a67c7);
      color: #ffffff;
      font-weight: 800;
      font-family: inherit;
      box-shadow: 0 16px 24px rgba(12, 104, 196, 0.2);
      cursor: pointer;
    }

    .primary-button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
      box-shadow: none;
    }

    .primary-button:focus-visible {
      outline: 3px solid rgba(34, 139, 230, 0.32);
      outline-offset: 4px;
    }
  `,
})
export class OutputPanelComponent {
  outputUrl = input<string | null>(null);
  currentImage = input<LoadedImage | null>(null);

  downloadClick = output<void>();

  onDownloadClick(): void {
    if (!this.outputUrl()) {
      return;
    }
    this.downloadClick.emit();
  }

  downloadFile(): void {
    const url = this.outputUrl();
    if (!url) return;

    const link = document.createElement('a');
    const imageName = this.currentImage()?.name ?? 'iisu-community-icon';
    link.href = url;
    link.download = `${imageName}-masked.png`;
    link.click();
  }
}
