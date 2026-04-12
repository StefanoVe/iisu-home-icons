// Layout
export const CROP_VIEW_SIZE = 320;
export const OUTPUT_SIZE = 512;
export const FRAME_PADDING = 0;
export const INNER_PADDING = 28;
export const FRAME_RADIUS = 50;
export const INNER_RADIUS = 33.333;

// Zoom
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;
export const DEFAULT_ZOOM = 1;

// Rotation
export const MIN_ROTATION = -180;
export const MAX_ROTATION = 180;
export const DEFAULT_ROTATION = 0;

// Canvas effects
export const DEFAULT_FADE_STRENGTH = 0.28;
export const DEFAULT_GLOW_STRENGTH = 0.22;
export const DEFAULT_SHADOW_BLUR = 48;
export const DEFAULT_SHADOW_COLOR = 'auto';
export const MIN_SHADOW_BLUR = 10;
export const MAX_SHADOW_BLUR = 80;

// API Endpoints
export const OPENVERSE_SEARCH_ENDPOINT = 'https://api.openverse.org/v1/images/';
export const WIKIMEDIA_SEARCH_ENDPOINT =
  'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url&iiurlwidth=320&format=json&origin=*';

// Search
export const SEARCH_PAGE_SIZE = 8;
