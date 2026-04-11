import { Injectable } from '@angular/core';
import { SearchResult } from '../types';
import { OPENVERSE_SEARCH_ENDPOINT, SEARCH_PAGE_SIZE, WIKIMEDIA_SEARCH_ENDPOINT } from '../../shared/constants';

@Injectable({ providedIn: 'root' })
export class SearchService {
  async searchOpenverse(query: string): Promise<SearchResult[]> {
    const url = new URL(OPENVERSE_SEARCH_ENDPOINT);
    url.searchParams.set('q', query);
    url.searchParams.set('page_size', SEARCH_PAGE_SIZE.toString());

    const response = await fetch(url.toString());
    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as {
      results?: Array<{
        height?: number;
        id?: string;
        title?: string;
        thumbnail?: string;
        url?: string;
        width?: number;
      }>;
    };

    return (payload.results ?? [])
      .filter((item) => item.thumbnail && item.url)
      .map((item, index) => ({
        height: item.height,
        id: item.id ?? `openverse-${index}`,
        imageUrl: item.url ?? '',
        source: 'openverse' as const,
        thumbnailUrl: item.thumbnail ?? '',
        title: item.title?.trim() || `Openverse ${index + 1}`,
        width: item.width,
      }));
  }

  async searchWikimedia(query: string): Promise<SearchResult[]> {
    const url = new URL(WIKIMEDIA_SEARCH_ENDPOINT);
    url.searchParams.set('gsrsearch', query);

    const response = await fetch(url.toString());
    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as {
      query?: {
        pages?: Record<
          string,
          {
            imageinfo?: Array<{
              height?: number;
              thumburl?: string;
              url?: string;
              width?: number;
            }>;
            pageid?: number;
            title?: string;
          }
        >;
      };
    };

    return Object.values(payload.query?.pages ?? {})
      .filter((item) => item.imageinfo?.[0]?.thumburl && item.imageinfo?.[0]?.url)
      .map((item, index) => ({
        height: item.imageinfo?.[0]?.height,
        id: `wikimedia-${item.pageid ?? index}`,
        imageUrl: item.imageinfo?.[0]?.url ?? '',
        source: 'wikimedia' as const,
        thumbnailUrl: item.imageinfo?.[0]?.thumburl ?? '',
        title: item.title?.replace(/^File:/, '').trim() || `Wikimedia ${index + 1}`,
        width: item.imageinfo?.[0]?.width,
      }));
  }

  scoreSearchResult(result: SearchResult): number {
    const width = result.width ?? 0;
    const height = result.height ?? 0;
    const areaScore = width * height;
    const landscapeBonus = width > height ? 250000 : 0;
    const sourceBonus = result.source === 'wikimedia' ? 50000 : 0;

    return areaScore + landscapeBonus + sourceBonus;
  }

  buildSearchQuery(query: string): string {
    return `${query} wallpaper background`;
  }
}
