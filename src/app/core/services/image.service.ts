import { Injectable } from '@angular/core';
import { LoadedImage } from '../types';

@Injectable({ providedIn: 'root' })
export class ImageService {
  async loadImageElement(sourceUrl: string): Promise<HTMLImageElement> {
    const imageElement = new window.Image();
    imageElement.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      imageElement.addEventListener('load', () => resolve(), { once: true });
      imageElement.addEventListener('error', () => reject(new Error('Image loading failed')), {
        once: true,
      });
      imageElement.src = sourceUrl;
    });

    return imageElement;
  }

  async loadRemoteImage(sourceUrl: string, imageName: string): Promise<{ element: HTMLImageElement; image: LoadedImage }> {
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error('Remote image failed to load');
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    try {
      const imageElement = await this.loadImageElement(objectUrl);

      return {
        element: imageElement,
        image: {
          height: imageElement.naturalHeight,
          name: this.slugifyImageName(imageName),
          sourceUrl: objectUrl,
          width: imageElement.naturalWidth,
        },
      };
    } catch (error) {
      URL.revokeObjectURL(objectUrl);
      throw error;
    }
  }

  loadFileImage(file: File): Promise<{ element: HTMLImageElement; image: LoadedImage; objectUrl: string }> {
    const objectUrl = URL.createObjectURL(file);

    return this.loadImageElement(objectUrl)
      .then((imageElement) => ({
        element: imageElement,
        image: {
          height: imageElement.naturalHeight,
          name: file.name.replace(/\.[^.]+$/, ''),
          sourceUrl: objectUrl,
          width: imageElement.naturalWidth,
        },
        objectUrl,
      }))
      .catch((error) => {
        URL.revokeObjectURL(objectUrl);
        throw error;
      });
  }

  revokeObjectUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  private slugifyImageName(value: string): string {
    const normalized = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return normalized || 'iisu-community-icon';
  }
}
