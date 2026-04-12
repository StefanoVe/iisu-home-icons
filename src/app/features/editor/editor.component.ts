import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CanvasRenderService } from '../../core/services/canvas-render.service';
import { ImageProcessingService } from '../../core/services/image-processing.service';
import { ImageService } from '../../core/services/image.service';
import { MathService } from '../../core/services/math.service';
import { SearchService } from '../../core/services/search.service';
import { DragState, ImageSourceMode, LoadedImage, SearchResult } from '../../core/types';
import {
  DEFAULT_ROTATION,
  DEFAULT_ZOOM,
  MAX_ROTATION,
  MAX_ZOOM,
  MIN_ROTATION,
  MIN_ZOOM,
} from '../../shared/constants';
import { CropStageComponent } from './components/crop-stage.component';
import { EditorControlsComponent } from './components/editor-controls.component';
import { OutputPanelComponent } from './components/output-panel.component';
import { SourcePanelComponent } from './components/source-panel.component';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    CommonModule,
    SourcePanelComponent,
    CropStageComponent,
    EditorControlsComponent,
    OutputPanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:pointermove)': 'onPointerMove($event)',
    '(window:pointerup)': 'onPointerUp($event)',
    '(window:pointercancel)': 'onPointerUp($event)',
  },
  template: `
    <article class="panel panel-editor">
      <app-source-panel
        [currentMode]="imageSourceMode()"
        [currentImage]="image()"
        [currentQuery]="searchQuery()"
        [searchResults]="searchResults()"
        [searchError]="searchError()"
        [isSearching]="searchLoading()"
        [selectedResultId]="selectedSearchId()"
        (resetClick)="onResetCrop()"
        (modeChange)="onSetImageSourceMode($event)"
        (fileSelected)="onFileSelected($event)"
        (searchQueryChange)="onSearchQueryInput($event)"
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
          (zoomChange)="onZoomChange($event)"
          (rotationChange)="onRotationChange($event)"
          (gridToggle)="toggleGrid()"
          (rotateBy)="rotateBy($event)"
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
        (downloadClick)="downloadResult()"
      ></app-output-panel>
    </article>
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
  private readonly imageProcessingService = inject(ImageProcessingService);
  private readonly canvasRenderService = inject(CanvasRenderService);
  private readonly mathService = inject(MathService);

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
  protected readonly searchLoading = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly searchResults = signal<SearchResult[]>([]);
  protected readonly selectedSearchId = signal<string | null>(null);
  protected readonly zoom = signal(DEFAULT_ZOOM);
  protected readonly rotation = signal(DEFAULT_ROTATION);
  protected readonly showGrid = signal(true);

  // Computed
  protected readonly isDragging = computed(() => this.dragState() !== null);
  protected readonly hasImage = computed(() => this.image() !== null);

  protected readonly cropMetrics = computed(() =>
    this.imageProcessingService.calculateCropMetrics(this.image(), this.zoom(), this.rotation()),
  );

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
  }

  // Search
  protected onSearchQueryInput(query: string): void {
    this.searchQuery.set(query);
  }

  protected async submitSearch(): Promise<void> {
    const query = this.searchQuery().trim();
    if (!query) {
      this.searchResults.set([]);
      this.searchError.set('Type a search term.');
      return;
    }

    this.searchLoading.set(true);
    this.searchError.set(null);

    try {
      const searchTerm = this.searchService.buildSearchQuery(query);
      const [openverseResults, wikimediaResults] = await Promise.all([
        this.searchService.searchOpenverse(searchTerm),
        this.searchService.searchWikimedia(searchTerm),
      ]);
      const results = [...openverseResults, ...wikimediaResults].sort((left, right) => {
        return (
          this.searchService.scoreSearchResult(right) - this.searchService.scoreSearchResult(left)
        );
      });

      this.searchResults.set(results);
      this.searchError.set(results.length ? null : 'No results.');
    } catch {
      this.searchResults.set([]);
      this.searchError.set('Search unavailable.');
    } finally {
      this.searchLoading.set(false);
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

  protected downloadResult(): void {
    const url = this.outputUrl();
    if (!url) {
      return;
    }

    const link = document.createElement('a');
    const imageName = this.image()?.name ?? 'iisu-community-icon';
    link.href = url;
    link.download = `${imageName}-masked.png`;
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

  private renderOutput(): void {
    const url = this.canvasRenderService.renderOutput(
      this.image(),
      this.imageElement(),
      this.zoom(),
      this.rotation(),
      this.offsetX(),
      this.offsetY(),
    );
    this.outputUrl.set(url);
  }

  private revokeCurrentImageUrl(): void {
    const currentImage = this.image();
    if (currentImage) {
      this.imageService.revokeObjectUrl(currentImage.sourceUrl);
    }
  }
}
