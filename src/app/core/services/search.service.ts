import { Injectable } from '@angular/core';
import {
  OPENVERSE_SEARCH_ENDPOINT,
  SEARCH_PAGE_SIZE,
  STEAM_GRID_DB_API_ENDPOINT,
  STEAM_GRID_DB_CDN_PROXY_ENDPOINT,
  WIKIMEDIA_SEARCH_ENDPOINT,
} from '../../shared/constants';
import { SearchResult, SteamGridDbAssetKind, SteamGridDbGameSuggestion } from '../types';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly steamGridDbFetchBatchSize = 32;

  async searchSteamGridDbGameSuggestions(
    query: string,
    apiKey: string,
  ): Promise<SteamGridDbGameSuggestion[]> {
    const normalizedApiKey = apiKey.trim();
    if (!normalizedApiKey) {
      return [];
    }

    const gamesResponse = await fetch(
      `${STEAM_GRID_DB_API_ENDPOINT}/search/autocomplete/${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${normalizedApiKey}`,
        },
      },
    );

    if (gamesResponse.status === 401 || gamesResponse.status === 403) {
      throw new Error('SteamGridDB API key rejected.');
    }

    if (!gamesResponse.ok) {
      throw new Error('SteamGridDB search unavailable.');
    }

    const gamesPayload = (await gamesResponse.json()) as {
      data?: Array<{
        id?: number;
        name?: string;
      }>;
    };

    return (gamesPayload.data ?? [])
      .filter((item): item is { id: number; name?: string } => typeof item.id === 'number')
      .map((item) => ({
        id: item.id,
        name: item.name?.trim() || `SteamGridDB ${item.id}`,
      }));
  }

  async searchSteamGridDbAssetsForGame(
    game: SteamGridDbGameSuggestion,
    apiKey: string,
  ): Promise<SearchResult[]> {
    const normalizedApiKey = apiKey.trim();
    if (!normalizedApiKey) {
      return [];
    }

    const assetRequests = [game].map(async (gameSuggestion, index) => {
      const [heroes, grids, icons] = await Promise.all([
        this.fetchSteamGridDbAssets({
          apiKey: normalizedApiKey,
          assetKind: 'hero',
          endpoint: `${STEAM_GRID_DB_API_ENDPOINT}/heroes/game/${gameSuggestion.id}?limit=${this.steamGridDbFetchBatchSize}`,
          gameId: gameSuggestion.id,
          index,
          title: gameSuggestion.name,
        }),
        this.fetchSteamGridDbAssets({
          apiKey: normalizedApiKey,
          assetKind: 'grid',
          endpoint: `${STEAM_GRID_DB_API_ENDPOINT}/grids/game/${gameSuggestion.id}?limit=${this.steamGridDbFetchBatchSize}`,
          gameId: gameSuggestion.id,
          index,
          title: gameSuggestion.name,
        }),
        this.fetchSteamGridDbAssets({
          apiKey: normalizedApiKey,
          assetKind: 'icon',
          endpoint: `${STEAM_GRID_DB_API_ENDPOINT}/icons/game/${gameSuggestion.id}?limit=${this.steamGridDbFetchBatchSize}`,
          gameId: gameSuggestion.id,
          index,
          title: gameSuggestion.name,
        }),
      ]);

      return [...heroes, ...grids, ...icons];
    });

    const assets = (await Promise.all(assetRequests)).flat();

    return assets;
  }

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
    const assetKindBonus =
      result.assetKind === 'hero' ? 150000 : result.assetKind === 'grid' ? 75000 : 25000;
    const sourceBonus =
      result.source === 'steamgriddb' ? 125000 : result.source === 'wikimedia' ? 50000 : 0;

    return areaScore + landscapeBonus + assetKindBonus + sourceBonus;
  }

  buildSearchQuery(query: string): string {
    return `${query} wallpaper background`;
  }

  private proxySteamGridDbAssetUrl(url: string): string {
    if (!url) {
      return url;
    }

    try {
      const parsedUrl = new URL(url);
      const isSteamGridDbAssetHost = [
        'cdn.steamgriddb.com',
        'cdn2.steamgriddb.com',
        'www.steamgriddb.com',
        'steamgriddb.com',
      ].includes(parsedUrl.hostname);

      if (!isSteamGridDbAssetHost) {
        return url;
      }

      const normalizedPath = `${parsedUrl.pathname}${parsedUrl.search}`;
      return `${STEAM_GRID_DB_CDN_PROXY_ENDPOINT}${normalizedPath}`;
    } catch {
      return url;
    }
  }

  private async fetchSteamGridDbAssets(options: {
    apiKey: string;
    assetKind: SteamGridDbAssetKind;
    endpoint: string;
    gameId: number;
    index: number;
    title: string;
  }): Promise<SearchResult[]> {
    const response = await fetch(options.endpoint, {
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
      },
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as {
      data?: Array<{
        height?: number;
        id?: number;
        thumb?: string;
        thumbnail?: string;
        url?: string;
        width?: number;
      }>;
    };

    return (payload.data ?? []).reduce<SearchResult[]>((results, item, assetIndex) => {
      const thumbnailUrl = item.thumb ?? item.thumbnail ?? item.url ?? '';
      const imageUrl = item.url ?? thumbnailUrl;
      if (!thumbnailUrl || !imageUrl) {
        return results;
      }

      results.push({
        assetKind: options.assetKind,
        height: item.height,
        id: `steamgriddb-${options.assetKind}-${options.gameId}-${item.id ?? `${options.index}-${assetIndex}`}`,
        imageUrl: this.proxySteamGridDbAssetUrl(imageUrl),
        source: 'steamgriddb' as const,
        thumbnailUrl: this.proxySteamGridDbAssetUrl(thumbnailUrl),
        title: options.title,
        width: item.width,
      });

      return results;
    }, []);
  }
}
