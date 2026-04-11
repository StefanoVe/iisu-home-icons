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

  /**
   * Renders a PNG image with the configured crop, zoom, and rotation.
   * Returns a Data URL string that can be displayed or downloaded.
   *
   * @param image Image metadata with width/height
   * @param imageElement HTML image element to render
   * @param zoom Scale factor (1 = 100%)
   * @param rotation Rotation angle in degrees (0-360)
   * @param offsetX Horizontal offset in logical units (-320 to 320)
   * @param offsetY Vertical offset in logical units (-320 to 320)
   * @returns PNG Data URL or null if rendering failed
   */
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

    // Calculate frame and inner content areas
    const outerInset = FRAME_PADDING;
    const outerSize = OUTPUT_SIZE - outerInset * 2;
    const innerInset = outerInset + INNER_PADDING;
    const innerSize = OUTPUT_SIZE - innerInset * 2;

    // Scale image to fit the inner area, accounting for zoom
    const rotationRadians = this.math.toRadians(rotation);
    const coverScale = Math.max(innerSize / image.width, innerSize / image.height);
    const drawWidth = image.width * coverScale * zoom;
    const drawHeight = image.height * coverScale * zoom;

    // Convert offset from logical units to pixel coordinates
    const offsetScale = innerSize / 320;
    const centerX = innerInset + innerSize / 2 + offsetX * offsetScale;
    const centerY = innerInset + innerSize / 2 + offsetY * offsetScale;

    context.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    // Draw outer white frame
    this.drawRoundedRect(context, outerInset, outerInset, outerSize, outerSize, FRAME_RADIUS);
    context.fillStyle = '#ffffff';
    context.fill();

    // Draw inner white background with clipping to rounded corners
    context.save();
    this.drawRoundedRect(context, innerInset, innerInset, innerSize, innerSize, INNER_RADIUS);
    context.clip();
    context.fillStyle = '#ffffff';
    context.fillRect(innerInset, innerInset, innerSize, innerSize);

    // Draw rotated and scaled image centered in the inner area
    context.save();
    context.translate(centerX, centerY);
    context.rotate(rotationRadians);
    context.drawImage(imageElement, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    context.restore();

    context.restore();

    // Draw inner border (white stroke) to separate image from outer frame
    context.save();
    context.strokeStyle = 'rgba(255, 255, 255, 0.96)';
    context.lineWidth = 4;
    this.drawRoundedRect(context, innerInset, innerInset, innerSize, innerSize, INNER_RADIUS);
    context.stroke();
    context.restore();

    // Draw outer border (subtle blue stroke) for visual definition
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

  /**
   * Draws edge fade gradients on all four sides of a rectangle.
   * Used to create soft vignette effects around image edges.
   *
   * @param context Canvas rendering context
   * @param x Left edge coordinate
   * @param y Top edge coordinate
   * @param width Rectangle width
   * @param height Rectangle height
   * @param opacity Starting opacity for the fade (0-1)
   */
  private drawEdgeFade(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    opacity: number,
  ): void {
    const fadeSize = 32;

    // Define gradients for left, right, top, bottom edges
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

    // Apply each gradient from opaque to transparent
    for (const item of gradients) {
      item.gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
      item.gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      context.fillStyle = item.gradient;
      context.fillRect(item.rect[0], item.rect[1], item.rect[2], item.rect[3]);
    }
  }

  /**
   * Creates a rounded rectangle path on the canvas.
   * Must be followed by `context.fill()` or `context.stroke()` to render.
   *
   * @param context Canvas rendering context
   * @param x Left edge coordinate
   * @param y Top edge coordinate
   * @param width Rectangle width
   * @param height Rectangle height
   * @param radius Corner radius size
   */
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
