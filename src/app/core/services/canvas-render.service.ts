import { Injectable } from '@angular/core';
import { LoadedImage } from '../types';
import {
  OUTPUT_SIZE,
  FRAME_PADDING,
  FRAME_RADIUS,
  INNER_PADDING,
  INNER_RADIUS,
  DEFAULT_FADE_STRENGTH,
} from '../../shared/constants';
import { MathService } from './math.service';

@Injectable({ providedIn: 'root' })
export class CanvasRenderService {
  constructor(private math: MathService) {}

  renderOutput(
    image: LoadedImage | null,
    imageElement: HTMLImageElement | null,
    zoom: number,
    rotation: number,
    offsetX: number,
    offsetY: number,
  ): string | null {
    if (!image || !imageElement) {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    const context = canvas.getContext('2d');
    if (!context) {
      return null;
    }

    const outerInset = FRAME_PADDING;
    const outerSize = OUTPUT_SIZE - outerInset * 2;
    const innerInset = outerInset + INNER_PADDING;
    const innerSize = OUTPUT_SIZE - innerInset * 2;
    const rotationRadians = this.math.toRadians(rotation);
    const coverScale = Math.max(innerSize / image.width, innerSize / image.height);
    const drawWidth = image.width * coverScale * zoom;
    const drawHeight = image.height * coverScale * zoom;
    const offsetScale = innerSize / 320;
    const centerX = innerInset + innerSize / 2 + offsetX * offsetScale;
    const centerY = innerInset + innerSize / 2 + offsetY * offsetScale;

    context.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    // Outer rounded rect
    this.drawRoundedRect(context, outerInset, outerInset, outerSize, outerSize, FRAME_RADIUS);
    context.fillStyle = '#ffffff';
    context.fill();

    // Clipped inner content
    context.save();
    this.drawRoundedRect(context, innerInset, innerInset, innerSize, innerSize, INNER_RADIUS);
    context.clip();
    context.fillStyle = '#ffffff';
    context.fillRect(innerInset, innerInset, innerSize, innerSize);

    // Draw image with rotation
    context.save();
    context.translate(centerX, centerY);
    context.rotate(rotationRadians);
    context.drawImage(imageElement, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    context.restore();

    // Edge fade
    this.drawEdgeFade(context, innerInset, innerInset, innerSize, innerSize, DEFAULT_FADE_STRENGTH);
    context.restore();

    // Inner border (white)
    context.save();
    context.strokeStyle = 'rgba(255, 255, 255, 0.96)';
    context.lineWidth = 4;
    this.drawRoundedRect(context, innerInset, innerInset, innerSize, innerSize, INNER_RADIUS);
    context.stroke();
    context.restore();

    // Outer border (blue)
    context.save();
    context.strokeStyle = 'rgba(189, 219, 255, 0.55)';
    context.lineWidth = 2;
    this.drawRoundedRect(
      context,
      outerInset + 2,
      outerInset + 2,
      outerSize - 4,
      outerSize - 4,
      FRAME_RADIUS - 2,
    );
    context.stroke();
    context.restore();

    return canvas.toDataURL('image/png');
  }

  private drawEdgeFade(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    opacity: number,
  ): void {
    const fadeSize = 32;

    const gradients = [
      {
        gradient: context.createLinearGradient(x, y, x + fadeSize, y),
        rect: [x, y, fadeSize, height] as const,
      },
      {
        gradient: context.createLinearGradient(x + width, y, x + width - fadeSize, y),
        rect: [x + width - fadeSize, y, fadeSize, height] as const,
      },
      {
        gradient: context.createLinearGradient(x, y, x, y + fadeSize),
        rect: [x, y, width, fadeSize] as const,
      },
      {
        gradient: context.createLinearGradient(x, y + height, x, y + height - fadeSize),
        rect: [x, y + height - fadeSize, width, fadeSize] as const,
      },
    ];

    for (const item of gradients) {
      item.gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
      item.gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      context.fillStyle = item.gradient;
      context.fillRect(item.rect[0], item.rect[1], item.rect[2], item.rect[3]);
    }
  }

  private drawRoundedRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
  }
}
