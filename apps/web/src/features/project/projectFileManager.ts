import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import type { DocumentPage, ImageObject, ZineDocumentState } from '../../stores/documentStore';

export interface OruZineProjectManifest {
  version: number;
  format: 'oruzine-project';
  exportedAt: string;
  document: {
    version: number;
    title: string;
    formatId: string;
    paper: string;
    margins: { top: number; right: number; bottom: number; left: number };
    bleedMm: number;
    creepMm: number;
    rtl: boolean;
    activeLookId?: string | null;
    pages: DocumentPage[];
  };
}

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; extension: string } {
  const parts = dataUrl.split(',');
  const header = parts[0];
  const base64Data = parts[1];

  let extension = 'png';
  if (header.includes('image/jpeg') || header.includes('image/jpg')) {
    extension = 'jpg';
  } else if (header.includes('image/webp')) {
    extension = 'webp';
  } else if (header.includes('image/svg')) {
    extension = 'svg';
  }

  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return { bytes, extension };
}

function bytesToDataUrl(bytes: Uint8Array, extension: string): string {
  let mime = 'image/png';
  if (extension === 'jpg' || extension === 'jpeg') {
    mime = 'image/jpeg';
  } else if (extension === 'webp') {
    mime = 'image/webp';
  } else if (extension === 'svg') {
    mime = 'image/svg+xml';
  }

  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

/**
 * Packs the current zine project into a portable .oruzine ZIP archive containing
 * document.json and raw image blobs.
 */
export async function exportProjectToZip(state: ZineDocumentState): Promise<Blob> {
  const files: Record<string, Uint8Array> = {};

  // Deep clone pages to avoid mutating the active state while preparing manifest
  const clonedPages: DocumentPage[] = JSON.parse(JSON.stringify(state.pages));

  // Extract raw image data and isolate them into /images/ folder in the zip
  for (const page of clonedPages) {
    for (const obj of page.objects) {
      if (obj.type === 'image' && (obj as ImageObject).imageDataUrl) {
        const imgObj = obj as ImageObject;
        const dataUrl = imgObj.imageDataUrl;
        if (dataUrl?.startsWith('data:')) {
          try {
            const { bytes, extension } = dataUrlToBytes(dataUrl);
            const imageFileName = `images/${imgObj.id}.${extension}`;
            files[imageFileName] = bytes;
            // Record reference in manifest while retaining fallback
            imgObj.imageFile = imageFileName;
          } catch (err) {
            console.warn('Failed to extract raw image bytes for object', imgObj.id, err);
          }
        }
      }
    }
  }

  const manifest: OruZineProjectManifest = {
    version: 1,
    format: 'oruzine-project',
    exportedAt: new Date().toISOString(),
    document: {
      version: state.version,
      title: state.title,
      formatId: state.formatId,
      paper: state.paper,
      margins: state.margins,
      bleedMm: state.bleedMm,
      creepMm: state.creepMm,
      rtl: state.rtl,
      activeLookId: state.activeLookId,
      pages: clonedPages,
    },
  };

  const manifestJson = JSON.stringify(manifest, null, 2);
  files['document.json'] = strToU8(manifestJson);

  const zipped = zipSync(files, { level: 6 });
  // Explicitly slice into standard ArrayBuffer to satisfy BlobPart type in strict environments
  const arrayBuffer = zipped.buffer.slice(
    zipped.byteOffset,
    zipped.byteOffset + zipped.byteLength,
  ) as ArrayBuffer;
  return new Blob([arrayBuffer], { type: 'application/vnd.oruzine+zip' });
}

/**
 * Unpacks and restores an .oruzine ZIP archive or JSON file.
 */
export async function importProjectFromZip(file: File): Promise<Partial<ZineDocumentState>> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);

  let unzipped: Record<string, Uint8Array>;
  try {
    unzipped = unzipSync(uint8);
  } catch (_err) {
    // If not a zip, check if it's a raw document.json
    try {
      const text = new TextDecoder().decode(uint8);
      const json = JSON.parse(text);
      if (json.document?.pages || json.pages) {
        return json.document ?? json;
      }
    } catch {
      // Ignore
    }
    throw new Error('Invalid project file: not a recognized .oruzine archive or JSON.');
  }

  const documentBytes = unzipped['document.json'];
  if (!documentBytes) {
    throw new Error('Invalid .oruzine file: missing document.json.');
  }

  const manifestJsonStr = strFromU8(documentBytes);
  const manifest: OruZineProjectManifest = JSON.parse(manifestJsonStr);
  const doc = manifest.document;

  // Restore image data URLs from unzipped binary files
  if (doc?.pages) {
    for (const page of doc.pages) {
      for (const obj of page.objects) {
        if (obj.type === 'image') {
          const imgObj = obj as ImageObject;
          const imageFile = imgObj.imageFile;
          if (imageFile && unzipped[imageFile]) {
            const ext = imageFile.split('.').pop() || 'png';
            imgObj.imageDataUrl = bytesToDataUrl(unzipped[imageFile], ext);
          }
        }
      }
    }
  }

  return {
    title: doc.title,
    formatId: doc.formatId,
    paper: doc.paper as ZineDocumentState['paper'],
    margins: doc.margins,
    bleedMm: doc.bleedMm,
    creepMm: doc.creepMm,
    rtl: doc.rtl,
    pages: doc.pages,
    activeLookId: doc.activeLookId ?? null,
  };
}

/**
 * Triggers a client-side browser download for a .oruzine project file.
 */
export function downloadProjectFile(blob: Blob, title: string) {
  const sanitizedTitle = (title || 'untitled-zine').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const filename = `${sanitizedTitle}.oruzine`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
