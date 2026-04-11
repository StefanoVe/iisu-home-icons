import { Injectable } from '@angular/core';
import { LoadedImage, CropMetrics } from '../types';
import { CROP_VIEW_SIZE } from '../../shared/constants';
import { MathService } from './math.service';

@Injectable({ providedIn: 'root' })
export class ImageProcessingService {
  constructor(private math: MathService) {}

  calculateCropMetrics(
    image: LoadedImage | null,
    zoom: number,
    rotation: number,
  ): CropMetrics {
    if (!image) {
      return {
        displayHeight: 0,
        displayWidth: 0,
        maxOffsetX: 0,
        maxOffsetY: 0,
      };
    }

    const coverScale = Math.max(CROP_VIEW_SIZE / image.width, CROP_VIEW_SIZE / image.height);
    const scaledWidth = image.width * coverScale * zoom;
    const scaledHeight = image.height * coverScale * zoom;
    const rotationRadians = this.math.toRadians(rotation);
    const boundingWidth =
      Math.abs(scaledWidth * Math.cos(rotationRadians)) +
      Math.abs(scaledHeight * Math.sin(rotationRadians));
    const boundingHeight =
      Math.abs(scaledWidth * Math.sin(rotationRadians)) +
      Math.abs(scaledHeight * Math.cos(rotationRadians));

    return {
      displayHeight: scaledHeight,
      displayWidth: scaledWidth,
      maxOffsetX: Math.max(0, (boundingWidth - CROP_VIEW_SIZE) / 2),
      maxOffsetY: Math.max(0, (boundingHeight - CROP_VIEW_SIZE) / 2),
    };
  }

  getClampedOffsets(
    x: number,
    y: number,
    metrics: CropMetrics,
  ): { x: number; y: number } {
    return {
      x: this.math.clamp(x, -metrics.maxOffsetX, metrics.maxOffsetX),
      y: this.math.clamp(y, -metrics.maxOffsetY, metrics.maxOffsetY),
    };
  }
}
