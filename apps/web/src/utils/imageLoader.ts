import heic2any from 'heic2any';

export interface LoadedImageResult {
  dataUrl: string;
  name: string;
  originalFormat: string;
  wasHeicConverted: boolean;
}

/**
 * Checks whether a given file is a HEIC or HEIF image based on extension or MIME type.
 */
export function isHeicFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return (
    lowerName.endsWith('.heic') ||
    lowerName.endsWith('.heif') ||
    file.type === 'image/heic' ||
    file.type === 'image/heif'
  );
}

/**
 * Processes an image file from file input or drag-and-drop.
 * Automatically decodes and converts Apple HEIC/HEIF files into standard JPEG/PNG
 * so they render natively in WebGL, Canvas, and PDF export pipelines.
 */
export async function processImageFile(file: File): Promise<LoadedImageResult> {
  const isHeic = isHeicFile(file);
  let targetBlob: Blob = file;

  if (isHeic) {
    try {
      const converted = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.92,
      });

      targetBlob = Array.isArray(converted) ? converted[0] : converted;
    } catch (err) {
      console.warn('heic2any conversion fallback:', err);
      throw new Error(
        'Failed to decode HEIC image. Please ensure the file is a valid HEIC/HEIF photo.',
      );
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        resolve({
          dataUrl,
          name: file.name,
          originalFormat: isHeic ? 'heic' : file.type.split('/')[1] || 'image',
          wasHeicConverted: isHeic,
        });
      } else {
        reject(new Error('Failed to generate image data URL.'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading image data.'));
    reader.readAsDataURL(targetBlob);
  });
}
