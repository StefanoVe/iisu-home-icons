import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadedImage, ImageSourceMode, SearchResult } from '../../../core/types';

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
      <label class="upload-card" for="image-upload">
        <input
          id="image-upload"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          (change)="onFileSelected($event)"
        />
        <span class="upload-title">Open image</span>
      </label>
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
    }

    .toggle-button[aria-pressed='true'] {
      background: linear-gradient(135deg, #1b94ea, #0a67c7);
      color: #fff;
      box-shadow: 0 12px 20px rgba(12, 104, 196, 0.14);
    }

    .upload-card {
      display: block;
      padding: 18px;
      border-radius: 20px;
      border: 1px dashed rgba(42, 167, 242, 0.42);
      background: linear-gradient(135deg, rgba(235, 249, 255, 0.94), rgba(247, 251, 255, 0.98));
      cursor: pointer;
    }

    .upload-card input {
      display: none;
    }

    .upload-card:focus-within {
      outline: 3px solid rgba(34, 139, 230, 0.32);
      outline-offset: 4px;
    }

    .upload-title {
      display: inline-block;
      margin-top: 10px;
      font-weight: 700;
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
    }

    .search-field input:focus-visible {
      outline: 3px solid rgba(34, 139, 230, 0.32);
      outline-offset: 2px;
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
    }

    .primary-button {
      width: 100%;
      background: linear-gradient(135deg, #1b94ea, #0a67c7);
      color: #ffffff;
      box-shadow: 0 16px 24px rgba(12, 104, 196, 0.2);
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

  protected readonly hasImage = computed(() => this.currentImage() !== null);

  onResetClick(): void {
    this.resetClick.emit();
  }

  onToggleMode(mode: ImageSourceMode): void {
    this.modeChange.emit(mode);
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
