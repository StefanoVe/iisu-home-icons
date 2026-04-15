import { Injectable } from '@angular/core';
import { LOCAL_STORAGE_STEAM_GRID_DB_API_KEY } from '../../shared/constants';

@Injectable({ providedIn: 'root' })
export class SteamGridDbSettingsService {
  getApiKey(): string {
    if (!this.hasLocalStorage()) {
      return '';
    }

    return window.localStorage.getItem(LOCAL_STORAGE_STEAM_GRID_DB_API_KEY)?.trim() ?? '';
  }

  saveApiKey(value: string): void {
    if (!this.hasLocalStorage()) {
      return;
    }

    const normalizedValue = value.trim();
    if (!normalizedValue) {
      window.localStorage.removeItem(LOCAL_STORAGE_STEAM_GRID_DB_API_KEY);
      return;
    }

    window.localStorage.setItem(LOCAL_STORAGE_STEAM_GRID_DB_API_KEY, normalizedValue);
  }

  private hasLocalStorage(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }
}
