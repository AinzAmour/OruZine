// @oruzine/formats - Format definitions and schemas
export interface FormatDefinition {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'advanced';
  needs: ('scissors' | 'stapler' | 'ruler')[];
  paper: {
    sizes: ('letter' | 'a4' | 'a3' | 'tabloid')[];
    orientation: 'landscape' | 'portrait';
  };
  pageCount: {
    fixed?: number;
    min?: number;
    max?: number;
    multipleOf?: number;
  };
  sidedness: 'single' | 'duplex';
  duplexFlip?: 'long-edge' | 'short-edge';
  readingDirection: 'ltr' | 'rtl';
}
