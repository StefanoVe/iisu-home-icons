import { Injectable } from '@angular/core';
import {
  FRAME_PADDING,
  FRAME_RADIUS,
  INNER_PADDING,
  INNER_RADIUS,
  OUTPUT_SIZE,
} from '../../shared/constants';
import { LoadedImage } from '../types';
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
   * @param shadowBlur Shadow blur radius in pixels
   * @param shadowColor Shadow color as hex string or 'auto' for average color
   * @returns PNG Data URL or null if rendering failed
   */
  renderOutput(
    image: LoadedImage | null,
    imageElement: HTMLImageElement | null,
    zoom: number,
    rotation: number,
    offsetX: number,
    offsetY: number,
    shadowBlur: number,
    shadowColor: string,
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

    //draw inner shadow around image to add depth and separation from frame
    const shadowSize = innerSize - 24;
    const horizontalInset = innerInset + 12;
    const verticalInset = innerInset + 12;
    context.save();
    this.drawRoundedRect(
      context,
      horizontalInset,
      verticalInset,
      shadowSize,
      shadowSize,
      INNER_RADIUS,
    );
    context.shadowBlur = shadowBlur;

    // Determine shadow color: use provided color or calculate from image
    if (shadowColor === 'auto') {
      const averageColor = this.getAverageColorFromImageBottom(
        imageElement,
        zoom,
        rotation,
        offsetX,
        offsetY,
        image,
        innerSize,
      );
      context.shadowColor = `rgba(${averageColor.r}, ${averageColor.g}, ${averageColor.b}, 1)`;
    } else {
      context.shadowColor = shadowColor;
    }

    context.fillStyle = 'white';
    context.fillRect(horizontalInset, verticalInset, shadowSize, shadowSize);
    context.restore();

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

    // Draw outer border (subtle blue stroke) for visual definition
    context.save();
    context.strokeStyle = 'rgba(189, 219, 255, 0.25)';
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
   * Calculates the average color from the bottom of the cropped image.
   * Takes into account zoom, rotation, and offset to sample from the visible portion.
   *
   * @param imageElement HTML image element to sample
   * @param zoom Scale factor
   * @param rotation Rotation angle in degrees
   * @param offsetX Horizontal offset in logical units
   * @param offsetY Vertical offset in logical units
   * @param image Image metadata
   * @param innerSize Size of the inner rendering area
   * @returns Object with average RGB values
   */
  private getAverageColorFromImageBottom(
    imageElement: HTMLImageElement,
    zoom: number,
    rotation: number,
    offsetX: number,
    offsetY: number,
    image: LoadedImage,
    innerSize: number,
  ): { r: number; g: number; b: number } {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) {
      return { r: 0, g: 0, b: 0 };
    }

    // Render at a small scale for performance
    tempCanvas.width = 100;
    tempCanvas.height = 100;

    try {
      // Replicate the same rendering as the main output
      const rotationRadians = this.math.toRadians(rotation);
      const coverScale = Math.max(100 / image.width, 100 / image.height);
      const drawWidth = image.width * coverScale * zoom;
      const drawHeight = image.height * coverScale * zoom;

      // Apply the same offset calculation
      const offsetScale = 100 / 320;
      const centerX = 50 + offsetX * offsetScale;
      const centerY = 50 + offsetY * offsetScale;

      // Draw the transformed image
      tempCtx.save();
      tempCtx.translate(centerX, centerY);
      tempCtx.rotate(rotationRadians);
      tempCtx.drawImage(imageElement, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      tempCtx.restore();

      // Sample only the bottom 20% of the canvas
      const bottomStart = Math.floor(100 * 0.8);
      const imageData = tempCtx.getImageData(0, bottomStart, 100, 20);
      const data = imageData.data;

      let r = 0,
        g = 0,
        b = 0;
      let count = 0;

      // Sample every 4th pixel from bottom area
      for (let i = 0; i < data.length; i += 16) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }

      return {
        r: Math.round(r / count) || 0,
        g: Math.round(g / count) || 0,
        b: Math.round(b / count) || 0,
      };
    } catch {
      // Fallback if image is CORS-protected or unavailable
      return { r: 0, g: 0, b: 0 };
    }
  }

  /**
   * Public wrapper for getting average color from image bottom.
   * Used by components to calculate display colors.
   */
  getAverageColorForDisplay(
    imageElement: HTMLImageElement,
    zoom: number,
    rotation: number,
    offsetX: number,
    offsetY: number,
    image: LoadedImage,
  ): { r: number; g: number; b: number } {
    return this.getAverageColorFromImageBottom(
      imageElement,
      zoom,
      rotation,
      offsetX,
      offsetY,
      image,
      320, // innerSize default
    );
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
