export type LoadedImage = {
  height: number;
  name: string;
  sourceUrl: string;
  width: number;
};

export type ImageSourceMode = 'upload' | 'search';

export type SearchResult = {
  id: string;
  height?: number;
  source: 'openverse' | 'wikimedia';
  thumbnailUrl: string;
  title: string;
  imageUrl: string;
  width?: number;
};

export type DragState = {
  originPointerX: number;
  originPointerY: number;
  originX: number;
  originY: number;
  pointerId: number;
};

export type CropMetrics = {
  displayHeight: number;
  displayWidth: number;
  maxOffsetX: number;
  maxOffsetY: number;
};
