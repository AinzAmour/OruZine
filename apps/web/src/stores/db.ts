import Dexie, { type Table } from 'dexie';

export interface StoredDocument {
  id: string;
  updatedAt: string;
  data: string; // JSON stringified ZineDocument
}

export interface StoredImageBlob {
  id: string;
  blob: Blob;
  mimeType: string;
  createdAt: string;
}

export class OruZineDatabase extends Dexie {
  documents!: Table<StoredDocument, string>;
  images!: Table<StoredImageBlob, string>;

  constructor() {
    super('OruZineDB');
    this.version(1).stores({
      documents: 'id, updatedAt',
      images: 'id, createdAt',
    });
  }
}

export const db = new OruZineDatabase();
