import { describe, expect, it } from 'vitest';
import type { ZineDocumentState } from '../../stores/documentStore';
import { exportProjectToZip, importProjectFromZip } from './projectFileManager';

describe('Project File Manager (.oruzine archives)', () => {
  it('exports and restores a complete zine document archive', async () => {
    // 1x1 transparent PNG data URL
    const sampleDataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const mockState = {
      version: 2,
      title: 'Punk Fanzine No 4',
      formatId: 'mini-8',
      paper: 'letter' as const,
      margins: { top: 5, right: 5, bottom: 5, left: 5 },
      bleedMm: 3,
      creepMm: 0,
      rtl: false,
      activeLookId: 'xerox-punk',
      pages: [
        {
          pageNumber: 1,
          backgroundColor: '#ffffff',
          objects: [
            {
              id: 'img-1',
              type: 'image' as const,
              imageDataUrl: sampleDataUrl,
              imageFit: 'cover' as const,
              xPercent: 0.1,
              yPercent: 0.1,
              wPercent: 0.8,
              hPercent: 0.5,
              rotation: 0,
              opacity: 1,
              locked: false,
              hidden: false,
            },
            {
              id: 'text-1',
              type: 'text' as const,
              text: 'ANARCHY IN THE BROWSER',
              fontSizePt: 16,
              color: '#111111',
              bold: true,
              xPercent: 0.1,
              yPercent: 0.7,
              wPercent: 0.8,
              hPercent: 0.2,
              rotation: 0,
              opacity: 1,
              locked: false,
              hidden: false,
            },
          ],
        },
      ],
    } as unknown as ZineDocumentState;

    // Export to zip blob
    const zipBlob = await exportProjectToZip(mockState);
    expect(zipBlob).toBeInstanceOf(Blob);
    expect(zipBlob.size).toBeGreaterThan(50);

    // Convert Blob to File
    const file = new File([zipBlob], 'punk_zine.oruzine', {
      type: 'application/vnd.oruzine+zip',
    });

    // Import back from file
    const imported = await importProjectFromZip(file);

    expect(imported.title).toBe('Punk Fanzine No 4');
    expect(imported.formatId).toBe('mini-8');
    expect(imported.activeLookId).toBe('xerox-punk');
    expect(imported.pages).toHaveLength(1);

    const firstPage = imported.pages?.[0];
    expect(firstPage?.objects).toHaveLength(2);

    const imgObj = firstPage?.objects.find((o) => o.type === 'image');
    expect(imgObj).toBeDefined();
    // Restored image data URL should start with data:image/png;base64
    expect((imgObj as { imageDataUrl?: string })?.imageDataUrl).toContain('data:image/png;base64');
  });
});
