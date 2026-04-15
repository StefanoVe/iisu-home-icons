import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CanvasRenderService } from '../../core/services/canvas-render.service';
import { ImageProcessingService } from '../../core/services/image-processing.service';
import { ImageService } from '../../core/services/image.service';
import { MathService } from '../../core/services/math.service';
import { SearchService } from '../../core/services/search.service';
import { SteamGridDbSettingsService } from '../../core/services/steamgriddb-settings.service';
import {
  DragState,
  ImageSourceMode,
  LoadedImage,
  SearchAssetFilter,
  SearchResult,
  SteamGridDbGameSuggestion,
} from '../../core/types';
import {
  DEFAULT_ROTATION,
  DEFAULT_SHADOW_BLUR,
  DEFAULT_SHADOW_COLOR,
  DEFAULT_STYLE_VARIANT,
  DEFAULT_ZOOM,
  MAX_ROTATION,
  MAX_ZOOM,
  MIN_ROTATION,
  MIN_ZOOM,
  SEARCH_PAGE_SIZE,
} from '../../shared/constants';
import { CropStageComponent } from './components/crop-stage.component';
import { EditorControlsComponent } from './components/editor-controls.component';
import { OutputPanelComponent } from './components/output-panel.component';
import { SourcePanelComponent } from './components/source-panel.component';
import { SteamGridDbApiKeyModalComponent } from './components/steamgriddb-api-key-modal.component';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    CommonModule,
    SourcePanelComponent,
    CropStageComponent,
    EditorControlsComponent,
    OutputPanelComponent,
    SteamGridDbApiKeyModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:pointermove)': 'onPointerMove($event)',
    '(window:pointerup)': 'onPointerUp($event)',
    '(window:pointercancel)': 'onPointerUp($event)',
  },
  template: `
    <article class="panel panel-editor flex flex-col gap-10">
      <app-source-panel
        [currentMode]="imageSourceMode()"
        [currentImage]="image()"
        [currentQuery]="searchQuery()"
        [searchResults]="paginatedSearchResults()"
        [searchSuggestions]="searchSuggestions()"
        [searchSuggestionsLoading]="searchSuggestionsLoading()"
        [searchError]="searchError()"
        [searchFilter]="searchFilter()"
        [searchCollapsed]="searchCollapsed()"
        [searchPage]="searchPage()"
        [searchTotalPages]="searchTotalPages()"
        [searchTotalResults]="filteredSearchResults().length"
        [isSearching]="searchLoading()"
        [selectedResultId]="selectedSearchId()"
        [selectedSuggestionId]="selectedGameSuggestion()?.id ?? null"
        [steamGridDbApiKey]="steamGridDbApiKey()"
        (resetClick)="onResetCrop()"
        (modeChange)="onSetImageSourceMode($event)"
        (fileSelected)="onFileSelected($event)"
        (searchFilterChange)="onSearchFilterChange($event)"
        (searchCollapsedChange)="onSearchCollapsedChange($event)"
        (searchPageChange)="onSearchPageChange($event)"
        (searchQueryChange)="onSearchQueryInput($event)"
        (searchSuggestionSelected)="onSearchSuggestionSelected($event)"
        (apiKeySetupRequest)="openSteamGridDbSetup()"
        (searchSubmit)="submitSearch()"
        (resultSelected)="useSearchResult($event)"
      ></app-source-panel>

      @if (hasImage()) {
        <app-editor-controls
          [minZoom]="MIN_ZOOM"
          [maxZoom]="MAX_ZOOM"
          [minRotation]="MIN_ROTATION"
          [maxRotation]="MAX_ROTATION"
          [currentZoom]="zoom()"
          [currentRotation]="rotation()"
          [gridVisible]="showGrid()"
          [currentShadowBlur]="shadowBlur()"
          [currentShadowColor]="shadowDisplayColor()"
          [shadowColorAuto]="shadowColorAuto()"
          (zoomChange)="onZoomChange($event)"
          (rotationChange)="onRotationChange($event)"
          [styleVariant]="styleVariant()"
          (gridToggle)="toggleGrid()"
          (rotateBy)="rotateBy($event)"
          (shadowBlurChange)="onShadowBlurChange($event)"
          (shadowColorChange)="onShadowColorChange($event)"
          (shadowColorAutoToggle)="onShadowColorAutoToggle()"
          (styleVariantChange)="onStyleVariantChange($event)"
        ></app-editor-controls>

        <app-crop-stage
          [currentImage]="image()"
          [cropMetrics]="cropMetrics()"
          [offsetX]="offsetX()"
          [offsetY]="offsetY()"
          [rotation]="rotation()"
          [showGrid]="showGrid()"
          [isDragging]="isDragging()"
          (pointerDown)="onPointerDown($event)"
        ></app-crop-stage>
      } @else {
        <div class="empty-state" aria-live="polite">
          <p>No image.</p>
        </div>
      }
    </article>

    <article class="panel panel-output">
      <app-output-panel
        [outputUrl]="outputUrl()"
        [currentImage]="image()"
        (downloadClick)="downloadResult($event)"
      ></app-output-panel>
    </article>

    <app-steamgriddb-api-key-modal
      [isOpen]="isSteamGridDbSetupOpen()"
      [currentApiKey]="steamGridDbApiKey()"
      (close)="closeSteamGridDbSetup()"
      (save)="saveSteamGridDbApiKey($event)"
    ></app-steamgriddb-api-key-modal>
  `,
  styles: `
    :host {
      display: contents;
    }

    .panel {
      padding: 18px;
      border: 1px solid var(--panel-border, rgba(139, 189, 236, 0.32));
      border-radius: 26px;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(244, 250, 255, 0.84)),
        var(--panel-background, rgba(255, 255, 255, 0.88));
      box-shadow: var(--shadow-soft, 0 24px 60px rgba(67, 109, 166, 0.14));
      backdrop-filter: blur(14px);
    }

    .empty-state {
      display: grid;
      place-items: center;
      min-height: 220px;
      padding: 24px;
      border-radius: 20px;
      border: 1px dashed rgba(148, 198, 243, 0.4);
      background: rgba(248, 252, 255, 0.85);
      color: var(--text-soft, #5a7798);
      text-align: center;
    }

    .empty-state p {
      margin: 0;
    }

    @media (max-width: 920px) {
      :host {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class EditorComponent {
  private readonly imageService = inject(ImageService);
  private readonly searchService = inject(SearchService);
  private readonly steamGridDbSettingsService = inject(SteamGridDbSettingsService);
  private readonly imageProcessingService = inject(ImageProcessingService);
  private readonly canvasRenderService = inject(CanvasRenderService);
  private readonly mathService = inject(MathService);
  private autocompleteTimer: ReturnType<typeof window.setTimeout> | null = null;
  private autocompleteRequestId = 0;

  protected readonly MIN_ZOOM = MIN_ZOOM;
  protected readonly MAX_ZOOM = MAX_ZOOM;
  protected readonly MIN_ROTATION = MIN_ROTATION;
  protected readonly MAX_ROTATION = MAX_ROTATION;

  // State
  protected readonly dragState = signal<DragState | null>(null);
  protected readonly imageElement = signal<HTMLImageElement | null>(null);
  protected readonly image = signal<LoadedImage | null>(null);
  protected readonly imageSourceMode = signal<ImageSourceMode>('upload');
  protected readonly offsetX = signal(0);
  protected readonly offsetY = signal(0);
  protected readonly outputUrl = signal<string | null>(null);
  protected readonly searchError = signal<string | null>(null);
  protected readonly searchFilter = signal<SearchAssetFilter>('all');
  protected readonly searchCollapsed = signal(false);
  protected readonly searchLoading = signal(false);
  protected readonly searchPage = signal(1);
  protected readonly searchQuery = signal('');
  protected readonly searchSuggestions = signal<SteamGridDbGameSuggestion[]>([]);
  protected readonly searchSuggestionsLoading = signal(false);
  protected readonly searchResults = signal<SearchResult[]>([]);
  protected readonly selectedGameSuggestion = signal<SteamGridDbGameSuggestion | null>(null);
  protected readonly selectedSearchId = signal<string | null>(null);
  protected readonly isSteamGridDbSetupOpen = signal(false);
  protected readonly steamGridDbApiKey = signal(this.steamGridDbSettingsService.getApiKey());
  protected readonly zoom = signal(DEFAULT_ZOOM);
  protected readonly rotation = signal(DEFAULT_ROTATION);
  protected readonly showGrid = signal(true);
  protected readonly shadowBlur = signal(DEFAULT_SHADOW_BLUR);
  protected readonly shadowColor = signal(DEFAULT_SHADOW_COLOR);
  protected readonly shadowColorAuto = signal(true);
  protected readonly styleVariant = signal(DEFAULT_STYLE_VARIANT);

  // Computed
  protected readonly isDragging = computed(() => this.dragState() !== null);
  protected readonly hasImage = computed(() => this.image() !== null);

  protected readonly cropMetrics = computed(() =>
    this.imageProcessingService.calculateCropMetrics(this.image(), this.zoom(), this.rotation()),
  );
  protected readonly filteredSearchResults = computed(() => {
    const filter = this.searchFilter();
    const results = this.searchResults();
    if (filter === 'all') {
      return results;
    }

    return results.filter((result) => result.assetKind === filter);
  });
  protected readonly searchTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredSearchResults().length / SEARCH_PAGE_SIZE)),
  );
  protected readonly paginatedSearchResults = computed(() => {
    const currentPage = Math.min(this.searchPage(), this.searchTotalPages());
    const startIndex = (currentPage - 1) * SEARCH_PAGE_SIZE;
    return this.filteredSearchResults().slice(startIndex, startIndex + SEARCH_PAGE_SIZE);
  });

  protected readonly shadowDisplayColor = computed(() => {
    if (!this.shadowColorAuto()) {
      return this.shadowColor();
    }

    const image = this.image();
    const imageElement = this.imageElement();
    if (!image || !imageElement) {
      return '#000000';
    }

    const averageColor = this.canvasRenderService.getAverageColorForDisplay(
      imageElement,
      this.zoom(),
      this.rotation(),
      this.offsetX(),
      this.offsetY(),
      image,
    );

    return this.mathService.rgbToHex(averageColor.r, averageColor.g, averageColor.b);
  });

  // File handling
  protected async onFileSelected(file: File): Promise<void> {
    try {
      const { element, image, objectUrl } = await this.imageService.loadFileImage(file);
      this.revokeCurrentImageUrl();

      this.imageElement.set(element);
      this.image.set(image);
      this.zoom.set(DEFAULT_ZOOM);
      this.resetEditor();
    } catch {
      // Error already handled by imageService
    }
  }

  // Image source mode
  protected onSetImageSourceMode(mode: ImageSourceMode): void {
    this.imageSourceMode.set(mode);
    if (mode === 'search') {
      this.searchCollapsed.set(false);
    }
  }

  // Search
  protected onSearchQueryInput(query: string): void {
    this.searchQuery.set(query);
    this.searchResults.set([]);
    this.searchFilter.set('all');
    this.searchPage.set(1);
    this.selectedSearchId.set(null);

    const normalizedQuery = query.trim();
    const selectedSuggestion = this.selectedGameSuggestion();
    if (selectedSuggestion && selectedSuggestion.name !== normalizedQuery) {
      this.selectedGameSuggestion.set(null);
    }

    if (this.autocompleteTimer !== null) {
      window.clearTimeout(this.autocompleteTimer);
      this.autocompleteTimer = null;
    }

    if (!this.steamGridDbApiKey().trim() || normalizedQuery.length < 2) {
      this.searchSuggestions.set([]);
      this.searchSuggestionsLoading.set(false);
      return;
    }

    this.searchSuggestionsLoading.set(true);
    const requestId = ++this.autocompleteRequestId;
    this.autocompleteTimer = window.setTimeout(() => {
      void this.loadSearchSuggestions(normalizedQuery, requestId);
    }, 220);
  }

  protected onSearchFilterChange(value: SearchAssetFilter): void {
    this.searchFilter.set(value);
    this.searchPage.set(1);
  }

  protected onSearchCollapsedChange(value: boolean): void {
    this.searchCollapsed.set(value);
  }

  protected onSearchPageChange(value: number): void {
    const nextPage = this.mathService.clamp(value, 1, this.searchTotalPages());
    this.searchPage.set(nextPage);
  }

  protected onSearchSuggestionSelected(suggestion: SteamGridDbGameSuggestion): void {
    this.selectedGameSuggestion.set(suggestion);
    this.searchQuery.set(suggestion.name);
    this.searchSuggestions.set([]);
    this.searchSuggestionsLoading.set(false);
    this.searchError.set(null);
  }

  protected onSteamGridDbApiKeyChange(value: string): void {
    this.steamGridDbApiKey.set(value);
    this.steamGridDbSettingsService.saveApiKey(value);
  }

  protected openSteamGridDbSetup(): void {
    this.isSteamGridDbSetupOpen.set(true);
  }

  protected closeSteamGridDbSetup(): void {
    this.isSteamGridDbSetupOpen.set(false);
  }

  protected saveSteamGridDbApiKey(value: string): void {
    this.onSteamGridDbApiKeyChange(value);
    this.isSteamGridDbSetupOpen.set(false);
    this.imageSourceMode.set('search');
    this.searchError.set(null);
    this.searchCollapsed.set(false);
    this.searchFilter.set('all');
    this.searchPage.set(1);
    this.searchSuggestions.set([]);
    this.selectedGameSuggestion.set(null);
  }

  protected async submitSearch(): Promise<void> {
    const query = this.searchQuery().trim();
    if (!query) {
      this.searchResults.set([]);
      this.searchError.set('Type a search term.');
      return;
    }

    if (!this.steamGridDbApiKey().trim()) {
      this.searchResults.set([]);
      this.searchError.set('Add your SteamGridDB API key to search.');
      return;
    }

    this.searchLoading.set(true);
    this.searchError.set(null);
    this.searchPage.set(1);

    try {
      const selectedSuggestion =
        this.selectedGameSuggestion() ??
        this.searchSuggestions().find((item) => item.name.toLowerCase() === query.toLowerCase()) ??
        this.searchSuggestions()[0] ??
        null;

      if (!selectedSuggestion) {
        this.searchResults.set([]);
        this.searchError.set('Pick a game from the suggestions first.');
        return;
      }

      this.selectedGameSuggestion.set(selectedSuggestion);
      this.searchQuery.set(selectedSuggestion.name);
      this.searchSuggestions.set([]);

      const steamGridDbResults = await this.searchService.searchSteamGridDbAssetsForGame(
        selectedSuggestion,
        this.steamGridDbApiKey(),
      );
      const results = steamGridDbResults.sort((left, right) => {
        return (
          this.searchService.scoreSearchResult(right) - this.searchService.scoreSearchResult(left)
        );
      });

      this.searchResults.set(results);
      this.searchError.set(results.length ? null : 'No SteamGridDB results.');
      this.selectedSearchId.set(null);
    } catch (error) {
      this.searchResults.set([]);
      this.searchError.set(
        error instanceof Error ? error.message : 'SteamGridDB search unavailable.',
      );
    } finally {
      this.searchLoading.set(false);
    }
  }

  private async loadSearchSuggestions(query: string, requestId: number): Promise<void> {
    try {
      const suggestions = await this.searchService.searchSteamGridDbGameSuggestions(
        query,
        this.steamGridDbApiKey(),
      );

      if (requestId !== this.autocompleteRequestId) {
        return;
      }

      this.searchSuggestions.set(suggestions.slice(0, 8));
      if (!this.searchLoading()) {
        this.searchError.set(suggestions.length ? null : 'No matching SteamGridDB games.');
      }
    } catch (error) {
      if (requestId !== this.autocompleteRequestId) {
        return;
      }

      this.searchSuggestions.set([]);
      if (!this.searchLoading()) {
        this.searchError.set(
          error instanceof Error ? error.message : 'SteamGridDB suggestions unavailable.',
        );
      }
    } finally {
      if (requestId === this.autocompleteRequestId) {
        this.searchSuggestionsLoading.set(false);
      }
    }
  }

  protected async useSearchResult(result: SearchResult): Promise<void> {
    this.selectedSearchId.set(result.id);
    this.searchError.set(null);

    try {
      const { element, image } = await this.imageService.loadRemoteImage(
        result.imageUrl,
        result.title,
      );
      this.revokeCurrentImageUrl();

      this.imageElement.set(element);
      this.image.set(image);
      this.searchCollapsed.set(true);
      this.resetEditor();
    } catch {
      try {
        const { element, image } = await this.imageService.loadRemoteImage(
          result.thumbnailUrl,
          result.title,
        );
        this.revokeCurrentImageUrl();

        this.imageElement.set(element);
        this.image.set(image);
        this.searchCollapsed.set(true);
        this.resetEditor();
      } catch {
        this.searchError.set('Image could not be loaded.');
        this.selectedSearchId.set(null);
      }
    }
  }

  // Controls
  protected onZoomChange(value: number): void {
    this.zoom.set(value);
    this.clampOffsets();
    this.renderOutput();
  }

  protected onRotationChange(value: number): void {
    this.rotation.set(value);
    this.clampOffsets();
    this.renderOutput();
  }

  protected rotateBy(delta: number): void {
    const nextRotation = this.mathService.clamp(
      this.rotation() + delta,
      MIN_ROTATION,
      MAX_ROTATION,
    );
    this.rotation.set(nextRotation);
    this.clampOffsets();
    this.renderOutput();
  }

  protected toggleGrid(): void {
    this.showGrid.update((value) => !value);
  }

  protected onShadowColorAutoToggle(): void {
    this.shadowColorAuto.update((value) => !value);
    this.renderOutput();
  }

  protected onStyleVariantChange(value: string): void {
    this.styleVariant.set(value);
    this.renderOutput();
  }

  protected onShadowBlurChange(value: number): void {
    this.shadowBlur.set(value);
    this.renderOutput();
  }

  protected onShadowColorChange(value: string): void {
    this.shadowColor.set(value);
    this.renderOutput();
  }

  // Pointer handling
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
    const clamped = this.imageProcessingService.getClampedOffsets(nextX, nextY, this.cropMetrics());

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

  // Reset/Clear
  protected onResetCrop(): void {
    this.resetEditor();
  }

  protected async downloadResult(exportSize: number): Promise<void> {
    const url = this.outputUrl();
    if (!url) {
      return;
    }

    const link = document.createElement('a');
    const imageName = this.image()?.name ?? 'iisu-community-icon';

    // If exporting at non-standard size, re-render at that size
    if (exportSize !== 512) {
      const resizedUrl = await this.canvasRenderService.renderOutput({
        image: this.image(),
        imageElement: this.imageElement(),
        zoom: this.zoom(),
        rotation: this.rotation(),
        offsetX: this.offsetX(),
        offsetY: this.offsetY(),
        shadowBlur: this.shadowBlur(),
        shadowColor: this.shadowColorAuto() ? 'auto' : this.shadowColor(),
        outputSize: exportSize,
        styleVariant: this.styleVariant(),
      });
      if (!resizedUrl) return;
      link.href = resizedUrl;
    } else {
      link.href = url;
    }

    link.download = `${imageName}-masked-${exportSize}-${this.styleVariant()}.png`;
    link.click();
  }

  // Private helpers
  private resetEditor(): void {
    this.zoom.set(DEFAULT_ZOOM);
    this.rotation.set(DEFAULT_ROTATION);
    this.showGrid.set(true);
    this.offsetX.set(0);
    this.offsetY.set(0);
    this.renderOutput();
  }

  private clampOffsets(): void {
    const clamped = this.imageProcessingService.getClampedOffsets(
      this.offsetX(),
      this.offsetY(),
      this.cropMetrics(),
    );
    this.offsetX.set(clamped.x);
    this.offsetY.set(clamped.y);
  }

  private async renderOutput(): Promise<void> {
    const finalShadowColor = this.shadowColorAuto() ? 'auto' : this.shadowColor();
    const renderOptions = {
      image: this.image(),
      imageElement: this.imageElement(),
      zoom: this.zoom(),
      rotation: this.rotation(),
      offsetX: this.offsetX(),
      offsetY: this.offsetY(),
      shadowBlur: this.shadowBlur(),
      shadowColor: finalShadowColor,
      styleVariant: this.styleVariant(),
      outputSize: 512,
    };
    const url = await this.canvasRenderService.renderOutput(renderOptions);
    this.outputUrl.set(url);
  }

  private revokeCurrentImageUrl(): void {
    const currentImage = this.image();
    if (currentImage) {
      this.imageService.revokeObjectUrl(currentImage.sourceUrl);
    }
  }
}
