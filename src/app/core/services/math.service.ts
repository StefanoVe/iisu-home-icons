import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MathService {
  clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  toRadians(value: number): number {
    return (value * Math.PI) / 180;
  }

  rgbToHex(r: number, g: number, b: number): string {
    return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
  }
}

