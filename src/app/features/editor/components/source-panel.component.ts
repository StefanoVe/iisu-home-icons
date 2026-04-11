import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { ImageSourceMode, LoadedImage, SearchResult } from '../../../core/types';

@Component({
  selector: 'app-source-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel-header">
      <h2>1. Source</h2>
      @if (hasImage()) {
        <button class="ghost-button" type="button" (click)="onResetClick()">Reset</button>
      }
    </div>

    <div class="source-toggle" aria-label="Image source">
      <button
        class="toggle-button"
        type="button"
        [attr.aria-pressed]="currentMode() === 'upload'"
        (click)="onToggleMode('upload')"
      >
        Upload
      </button>
      <button
        class="toggle-button disabled:opacity-50"
        type="button"
        disabled
        [attr.aria-pressed]="currentMode() === 'search'"
        (click)="onToggleMode('search')"
      >
        Search <small>(coming soon)</small>
      </button>
    </div>

    @if (currentMode() === 'upload') {
      <div
        class="dropzone"
        [class.dropzone-active]="isDragOver()"
        (click)="fileInput.click()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
      >
        <svg class="dropzone-icon" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 2v12m0 0l-4-4m4 4l4-4M19 19H5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="dropzone-title">
          @if (isDragOver()) {
            Drop your image here
          } @else {
            Drag & drop or click to upload
          }
        </span>
        <p class="dropzone-hint">PNG, JPEG, WebP, GIF or ICO (max 50MB)</p>
        <input
          #fileInput
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/x-icon,.ico"
          (change)="onFileSelected($event)"
          style="display: none"
        />
      </div>
    } @else {
      <form class="search-box" (submit)="onSubmitSearch($event)">
        <label class="search-field" for="image-search">
          <span class="sr-only">Search images</span>
          <input
            id="image-search"
            type="search"
            placeholder="Search game background"
            [value]="currentQuery()"
            (input)="onSearchInput($event)"
          />
        </label>
        <button class="primary-button search-button" type="submit" [disabled]="isSearching()">
          {{ isSearching() ? 'Searching...' : 'Search' }}
        </button>
      </form>
      <p class="search-feedback">Search prefers wallpapers and backgrounds.</p>

      @if (searchError(); as error) {
        <p class="search-feedback" aria-live="polite">{{ error }}</p>
      }

      @if (searchResults().length) {
        <div class="search-results" aria-label="Search results">
          @for (result of searchResults(); track result.id) {
            <button
              class="search-result"
              type="button"
              [attr.aria-pressed]="selectedResultId() === result.id"
              (click)="onSelectResult(result)"
            >
              <img [src]="result.thumbnailUrl" [alt]="result.title" />
              <span>{{ result.title }}</span>
              <small>{{ result.source }}</small>
            </button>
          }
        </div>
      }
    }
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

    .source-toggle {
      display: inline-grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      width: 100%;
      margin-bottom: 12px;
    }

    .toggle-button {
      min-height: 40px;
      border: 1px solid rgba(42, 167, 242, 0.2);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.72);
      color: var(--accent-deep, #0f67bf);
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .toggle-button:hover:not(:disabled) {
      border-color: rgba(42, 167, 242, 0.4);
      background: rgba(255, 255, 255, 0.85);
    }

    .toggle-button[aria-pressed='true'] {
      background: linear-gradient(135deg, #1b94ea, #0a67c7);
      color: #fff;
      box-shadow: 0 12px 20px rgba(12, 104, 196, 0.14);
    }

    /* Dropzone Styles */
    .dropzone {
      display: grid;
      place-items: center;
      gap: 12px;
      padding: 32px 24px;
      border-radius: 20px;
      border: 2px dashed rgba(42, 167, 242, 0.4);
      background: linear-gradient(135deg, rgba(235, 249, 255, 0.5), rgba(247, 251, 255, 0.7));
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
    }

    .dropzone:hover {
      border-color: rgba(42, 167, 242, 0.6);
      background: linear-gradient(135deg, rgba(235, 249, 255, 0.7), rgba(247, 251, 255, 0.9));
    }

    .dropzone.dropzone-active {
      border-color: #1b94ea;
      border-width: 2px;
      background: linear-gradient(135deg, rgba(27, 148, 234, 0.1), rgba(10, 103, 199, 0.08));
      box-shadow: inset 0 0 0 1px rgba(27, 148, 234, 0.2);
    }

    .dropzone-icon {
      width: 56px;
      height: 56px;
      color: var(--accent-deep, #0f67bf);
      opacity: 0.8;
      transition: all 0.2s ease;
    }

    .dropzone.dropzone-active .dropzone-icon {
      color: #1b94ea;
      opacity: 1;
      transform: scale(1.1);
    }

    .dropzone-title {
      display: block;
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-strong, #173154);
      text-align: center;
      letter-spacing: -0.01em;
    }

    .dropzone-hint {
      margin: 0;
      font-size: 0.85rem;
      color: var(--text-soft, #5a7798);
      text-align: center;
    }

    .search-box {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
    }

    .search-field {
      display: grid;
    }

    .search-field input {
      width: 100%;
      min-height: 46px;
      padding: 0 14px;
      border: 1px solid rgba(42, 167, 242, 0.28);
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.92);
      color: var(--text-strong, #173154);
      font-family: inherit;
      font-size: inherit;
      transition: all 0.2s ease;
    }

    .search-field input:focus-visible {
      outline: none;
      border-color: rgba(42, 167, 242, 0.6);
      box-shadow: 0 0 0 3px rgba(34, 139, 230, 0.1);
    }

    .search-button {
      width: auto;
      min-width: 110px;
    }

    .search-feedback {
      margin: 10px 0 0;
      color: var(--text-soft, #5a7798);
      font-size: 0.9rem;
    }

    .search-results {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      margin-top: 12px;
    }

    .search-result {
      display: grid;
      gap: 8px;
      padding: 10px;
      border: 1px solid rgba(42, 167, 242, 0.18);
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.8);
      color: var(--text-strong, #173154);
      text-align: left;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .search-result:hover {
      border-color: rgba(42, 167, 242, 0.35);
      box-shadow: 0 4px 12px rgba(12, 104, 196, 0.08);
    }

    .search-result[aria-pressed='true'] {
      border-color: rgba(15, 103, 191, 0.45);
      box-shadow: 0 12px 20px rgba(12, 104, 196, 0.1);
    }

    .search-result img {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      border-radius: 12px;
      display: block;
    }

    .search-result span {
      display: -webkit-box;
      overflow: hidden;
      font-size: 0.8rem;
      font-weight: 700;
      line-height: 1.25;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    .search-result small {
      display: inline-flex;
      width: fit-content;
      padding: 0.18rem 0.45rem;
      border-radius: 999px;
      background: rgba(232, 244, 255, 0.95);
      color: var(--accent-deep, #0f67bf);
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .ghost-button,
    .primary-button {
      min-height: 42px;
      padding: 0 12px;
      border-radius: 999px;
      border: none;
      font-weight: 800;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .primary-button {
      width: 100%;
      background: linear-gradient(135deg, #1b94ea, #0a67c7);
      color: #ffffff;
      box-shadow: 0 16px 24px rgba(12, 104, 196, 0.2);
    }

    .primary-button:hover:not(:disabled) {
      box-shadow: 0 20px 32px rgba(12, 104, 196, 0.3);
      transform: translateY(-1px);
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

    .ghost-button {
      background: rgba(229, 242, 255, 0.95);
      color: var(--accent-deep, #0f67bf);
    }

    .ghost-button:hover {
      background: rgba(229, 242, 255, 1);
      box-shadow: 0 4px 12px rgba(34, 139, 230, 0.15);
    }

    .ghost-button:focus-visible {
      outline: 3px solid rgba(34, 139, 230, 0.32);
      outline-offset: 4px;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    @media (max-width: 920px) {
      .search-results {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    @media (max-width: 640px) {
      .dropzone {
        padding: 24px 16px;
      }

      .dropzone-icon {
        width: 48px;
        height: 48px;
      }

      .search-box,
      .search-results {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class SourcePanelComponent {
  currentMode = input<ImageSourceMode>('upload');
  currentImage = input<LoadedImage | null>(null);
  currentQuery = input('');
  searchResults = input<SearchResult[]>([]);
  searchError = input<string | null>(null);
  isSearching = input(false);
  selectedResultId = input<string | null>(null);

  resetClick = output<void>();
  modeChange = output<ImageSourceMode>();
  fileSelected = output<File>();
  searchQueryChange = output<string>();
  searchSubmit = output<void>();
  resultSelected = output<SearchResult>();

  protected readonly isDragOver = signal(false);
  protected readonly hasImage = computed(() => this.currentImage() !== null);

  onResetClick(): void {
    this.resetClick.emit();
  }

  onToggleMode(mode: ImageSourceMode): void {
    this.modeChange.emit(mode);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    const file = files?.[0];
    if (file && file.type.startsWith('image/')) {
      this.fileSelected.emit(file);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (file) {
      this.fileSelected.emit(file);
      if (input) {
        input.value = '';
      }
    }
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.searchQueryChange.emit(input?.value ?? '');
  }

  onSubmitSearch(event: Event): void {
    event.preventDefault();
    this.searchSubmit.emit();
  }

  onSelectResult(result: SearchResult): void {
    this.resultSelected.emit(result);
  }
}
