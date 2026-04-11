import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MathService {
  clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  toRadians(value: number): number {
    return (value * Math.PI) / 180;
  }
}
