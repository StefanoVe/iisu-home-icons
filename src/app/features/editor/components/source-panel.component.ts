import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import {
  ImageSourceMode,
  LoadedImage,
  SearchAssetFilter,
  SearchResult,
  SteamGridDbGameSuggestion,
} from '../../../core/types';

@Component({
  selector: 'app-source-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel-header">
      <h2>1. Source</h2>
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
        class="toggle-button"
        type="button"
        [attr.aria-pressed]="currentMode() === 'search'"
        (click)="onSearchClick()"
      >
        Search
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
        <svg
          class="dropzone-icon"
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            d="M12 2v12m0 0l-4-4m4 4l4-4M19 19H5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
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
      @if (searchCollapsed() && currentImage(); as image) {
        <div class="search-collapsed">
          <div class="search-collapsed-copy">
            <p class="search-collapsed-label">Search selection ready</p>
            <strong>{{ image.name }}</strong>
            <small>Your chosen SteamGridDB image is loaded in the editor.</small>
          </div>
          <button class="ghost-button" type="button" (click)="onSearchCollapsedChange(false)">
            Browse again
          </button>
        </div>
      } @else {
        <form class="search-box" (submit)="onSubmitSearch($event)">
          <label class="search-field" for="image-search">
            <span class="field-label">Search SteamGridDB</span>
            <input
              id="image-search"
              type="search"
              placeholder="Start typing a game title"
              [value]="currentQuery()"
              (input)="onSearchInput($event)"
              autocomplete="off"
            />

            @if (searchSuggestionsLoading()) {
              <div class="search-suggestions search-suggestions-status" aria-live="polite">
                Looking for matching games...
              </div>
            } @else if (searchSuggestions().length) {
              <div class="search-suggestions" role="listbox" aria-label="Matching games">
                @for (suggestion of searchSuggestions(); track suggestion.id) {
                  <button
                    class="search-suggestion"
                    type="button"
                    role="option"
                    [attr.aria-selected]="selectedSuggestionId() === suggestion.id"
                    [class.search-suggestion-active]="selectedSuggestionId() === suggestion.id"
                    (click)="onSearchSuggestionSelected(suggestion)"
                  >
                    <span>{{ suggestion.name }}</span>
                    <small>Game</small>
                  </button>
                }
              </div>
            }
          </label>
          <button class="primary-button search-button" type="submit" [disabled]="isSearching()">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </button>
        </form>
        <p class="search-feedback">
          Pick a suggested game, then load its SteamGridDB heroes, grids, and icons.
        </p>

        @if (searchError(); as error) {
          <p class="search-feedback" aria-live="polite">{{ error }}</p>
        }

        @if (searchTotalResults()) {
          <div class="search-toolbar" aria-label="Search filters and pagination">
            <div class="filter-group" role="tablist" aria-label="Asset type filters">
              @for (filter of filters; track filter.value) {
                <button
                  class="filter-button"
                  type="button"
                  role="tab"
                  [attr.aria-selected]="searchFilter() === filter.value"
                  [class.filter-button-active]="searchFilter() === filter.value"
                  (click)="onSearchFilterChange(filter.value)"
                >
                  {{ filter.label }}
                </button>
              }
            </div>

            <div class="search-pagination">
              <button
                class="ghost-button pagination-button"
                type="button"
                [disabled]="searchPage() <= 1"
                (click)="onSearchPageChange(searchPage() - 1)"
              >
                Previous
              </button>
              <span class="pagination-label"
                >Page {{ searchPage() }} / {{ searchTotalPages() }}</span
              >
              <button
                class="ghost-button pagination-button"
                type="button"
                [disabled]="searchPage() >= searchTotalPages()"
                (click)="onSearchPageChange(searchPage() + 1)"
              >
                Next
              </button>
            </div>
          </div>
        }

        @if (searchResults().length) {
          <div class="search-results" aria-label="Search results">
            @for (result of searchResults(); track result.id) {
              <button
                class="search-result"
                [class.search-result-hero]="result.assetKind === 'hero'"
                [class.search-result-grid]="result.assetKind === 'grid'"
                [class.search-result-icon]="result.assetKind === 'icon'"
                type="button"
                [attr.aria-pressed]="selectedResultId() === result.id"
                (click)="onSelectResult(result)"
              >
                <div class="search-result-media">
                  <img [src]="result.thumbnailUrl" [alt]="result.title" />
                </div>
                <div class="search-result-body">
                  <span class="search-result-title">{{ result.title }}</span>
                  <div class="search-result-meta">
                    <small>{{ formatResultDimensions(result) }}</small>
                    @if (selectedResultId() === result.id) {
                      <small class="search-result-state">Selected</small>
                    } @else {
                      <small class="search-result-state">Use image</small>
                    }
                  </div>
                </div>
              </button>
            }
          </div>
        }
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
      gap: 6px;
      position: relative;
    }

    .field-label {
      font-size: 0.8rem;
      font-weight: 800;
      letter-spacing: 0.01em;
      color: var(--text-strong, #173154);
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
      aspect-ratio: 1/1;
      min-height: 46px;
      align-self: end;
    }

    .search-feedback {
      margin: 10px 0 0;
      color: var(--text-soft, #5a7798);
      font-size: 0.9rem;
    }

    .search-collapsed {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 14px 16px;
      border: 1px solid rgba(42, 167, 242, 0.16);
      border-radius: 20px;
      background: linear-gradient(135deg, rgba(242, 249, 255, 0.92), rgba(255, 255, 255, 0.94));
    }

    .search-collapsed-copy {
      display: grid;
      gap: 4px;
    }

    .search-collapsed-copy strong {
      color: var(--text-strong, #173154);
      font-size: 0.96rem;
    }

    .search-collapsed-copy small,
    .search-collapsed-label {
      margin: 0;
      color: var(--text-soft, #5a7798);
    }

    .search-collapsed-label {
      font-size: 0.74rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .search-results {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      margin-top: 14px;
    }

    .search-suggestions {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      z-index: 5;
      display: grid;
      gap: 6px;
      padding: 8px;
      border: 1px solid rgba(42, 167, 242, 0.14);
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.98);
      box-shadow: 0 18px 34px rgba(28, 80, 136, 0.14);
    }

    .search-suggestions-status {
      color: var(--text-soft, #5a7798);
      font-size: 0.84rem;
      line-height: 1.4;
    }

    .search-suggestion {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      min-height: 42px;
      padding: 0 12px;
      border: 1px solid transparent;
      border-radius: 14px;
      background: rgba(244, 250, 255, 0.88);
      color: var(--text-strong, #173154);
      font-family: inherit;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .search-suggestion:hover {
      border-color: rgba(42, 167, 242, 0.18);
      background: rgba(235, 246, 255, 0.96);
    }

    .search-suggestion-active {
      border-color: rgba(15, 103, 191, 0.28);
      background: linear-gradient(135deg, rgba(27, 148, 234, 0.12), rgba(10, 103, 199, 0.08));
    }

    .search-suggestion span {
      font-size: 0.9rem;
      font-weight: 700;
    }

    .search-suggestion small {
      color: var(--text-soft, #5a7798);
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .search-toolbar {
      display: grid;
      gap: 12px;
      margin-top: 14px;
    }

    .filter-group {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .filter-button {
      min-height: 36px;
      padding: 0 12px;
      border: 1px solid rgba(42, 167, 242, 0.16);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.78);
      color: var(--text-soft, #5a7798);
      font-family: inherit;
      font-size: 0.82rem;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .filter-button:hover {
      border-color: rgba(42, 167, 242, 0.28);
      color: var(--text-strong, #173154);
    }

    .filter-button-active {
      border-color: rgba(15, 103, 191, 0.3);
      background: linear-gradient(135deg, rgba(27, 148, 234, 0.12), rgba(10, 103, 199, 0.08));
      color: var(--accent-deep, #0f67bf);
      box-shadow: inset 0 0 0 1px rgba(27, 148, 234, 0.08);
    }

    .search-pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .pagination-button {
      min-width: 96px;
    }

    .pagination-label {
      color: var(--text-soft, #5a7798);
      font-size: 0.82rem;
      font-weight: 700;
      text-align: center;
    }

    .search-result {
      display: grid;
      gap: 12px;
      padding: 12px;
      border: 1px solid rgba(42, 167, 242, 0.14);
      border-radius: 14px;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(243, 249, 255, 0.88)),
        rgba(255, 255, 255, 0.88);
      color: var(--text-strong, #173154);
      text-align: left;
      font-family: inherit;
      cursor: pointer;
      overflow: hidden;
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        border-color 0.2s ease,
        background 0.2s ease;
    }

    .search-result:hover {
      transform: translateY(-2px);
      border-color: rgba(42, 167, 242, 0.3);
      box-shadow: 0 18px 30px rgba(12, 104, 196, 0.1);
    }

    .search-result[aria-pressed='true'] {
      border-color: rgba(15, 103, 191, 0.45);
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 1), rgba(231, 243, 255, 0.98)),
        rgba(255, 255, 255, 0.96);
      box-shadow: 0 22px 34px rgba(12, 104, 196, 0.14);
    }

    .search-result-media {
      position: relative;
      border-radius: 8px;
      overflow: hidden;
      background:
        radial-gradient(circle at top left, rgba(255, 255, 255, 0.32), transparent 55%),
        linear-gradient(135deg, rgba(25, 137, 226, 0.18), rgba(10, 103, 199, 0.08));
    }

    .search-result img {
      width: 100%;
      aspect-ratio: 16 / 10;
      object-fit: cover;
      display: block;
    }

    .search-result-icon img {
      aspect-ratio: 1;
      object-fit: contain;
      padding: 18px;
      background: radial-gradient(
        circle at center,
        rgba(255, 255, 255, 0.9),
        rgba(233, 244, 255, 0.72)
      );
    }

    .search-result-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      display: inline-flex;
      width: fit-content;
      padding: 0.26rem 0.55rem;
      border-radius: 999px;
      background: rgba(12, 36, 66, 0.74);
      color: #ffffff;
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      backdrop-filter: blur(10px);
    }

    .search-result-body {
      display: grid;
      gap: 8px;
    }

    .search-result-title {
      display: -webkit-box;
      overflow: hidden;
      font-size: 0.9rem;
      font-weight: 700;
      line-height: 1.25;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    .search-result-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      color: var(--text-soft, #5a7798);
      font-size: 0.74rem;
      line-height: 1.2;
    }

    .search-result-state {
      color: var(--accent-deep, #0f67bf);
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .search-result[aria-pressed='true'] .search-result-state {
      color: #0a67c7;
    }

    .search-result-hero .search-result-badge {
      background: rgba(5, 93, 153, 0.82);
    }

    .search-result-grid .search-result-badge {
      background: rgba(14, 120, 94, 0.82);
    }

    .search-result-icon .search-result-badge {
      background: rgba(134, 76, 10, 0.84);
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
        grid-template-columns: repeat(2, minmax(0, 1fr));
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

      .search-collapsed {
        display: grid;
      }

      .search-pagination {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .pagination-label {
        grid-column: 1 / -1;
        order: -1;
      }

      .search-button {
        width: 100%;
      }
    }
  `,
})
export class SourcePanelComponent {
  currentMode = input<ImageSourceMode>('upload');
  currentImage = input<LoadedImage | null>(null);
  currentQuery = input('');
  searchResults = input<SearchResult[]>([]);
  searchSuggestions = input<SteamGridDbGameSuggestion[]>([]);
  searchSuggestionsLoading = input(false);
  searchError = input<string | null>(null);
  searchFilter = input<SearchAssetFilter>('all');
  searchCollapsed = input(false);
  isSearching = input(false);
  searchPage = input(1);
  searchTotalPages = input(1);
  searchTotalResults = input(0);
  selectedResultId = input<string | null>(null);
  selectedSuggestionId = input<number | null>(null);
  steamGridDbApiKey = input('');

  resetClick = output<void>();
  modeChange = output<ImageSourceMode>();
  fileSelected = output<File>();
  searchFilterChange = output<SearchAssetFilter>();
  searchCollapsedChange = output<boolean>();
  searchPageChange = output<number>();
  searchQueryChange = output<string>();
  searchSuggestionSelected = output<SteamGridDbGameSuggestion>();
  apiKeySetupRequest = output<void>();
  searchSubmit = output<void>();
  resultSelected = output<SearchResult>();

  protected readonly isDragOver = signal(false);
  protected readonly hasImage = computed(() => this.currentImage() !== null);
  protected readonly filters = [
    { label: 'All', value: 'all' as const },
    { label: 'Heroes', value: 'hero' as const },
    { label: 'Grids', value: 'grid' as const },
    { label: 'Icons', value: 'icon' as const },
  ];

  onResetClick(): void {
    this.resetClick.emit();
  }

  onToggleMode(mode: ImageSourceMode): void {
    this.modeChange.emit(mode);
  }

  onSearchClick(): void {
    if (!this.steamGridDbApiKey().trim()) {
      this.apiKeySetupRequest.emit();
      return;
    }

    this.modeChange.emit('search');
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

  onSearchFilterChange(value: SearchAssetFilter): void {
    this.searchFilterChange.emit(value);
  }

  onSearchCollapsedChange(value: boolean): void {
    this.searchCollapsedChange.emit(value);
  }

  onSearchPageChange(value: number): void {
    this.searchPageChange.emit(value);
  }

  onSearchSuggestionSelected(suggestion: SteamGridDbGameSuggestion): void {
    this.searchSuggestionSelected.emit(suggestion);
  }

  onSubmitSearch(event: Event): void {
    event.preventDefault();
    this.searchSubmit.emit();
  }

  onSelectResult(result: SearchResult): void {
    this.resultSelected.emit(result);
  }

  protected formatResultLabel(result: SearchResult): string {
    if (result.source !== 'steamgriddb') {
      return result.source;
    }

    return result.assetKind ? `steamgriddb ${result.assetKind}` : result.source;
  }

  protected formatResultDimensions(result: SearchResult): string {
    const width = result.width;
    const height = result.height;

    if (!width || !height) {
      return result.assetKind ? `${result.assetKind} asset` : 'Asset';
    }

    return `${width} x ${height}`;
  }
}
