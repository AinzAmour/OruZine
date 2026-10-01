import type React from 'react';
import type { StickerObject, StickerType } from '../../stores/documentStore';

export interface StickerViewProps {
  sticker?: StickerObject;
  stickerType?: StickerType;
  color?: string;
  width?: string | number;
  height?: string | number;
}

export const StickerView: React.FC<StickerViewProps> = ({
  sticker,
  stickerType: propType,
  color: propColor,
}) => {
  const activeType = sticker ? sticker.stickerType : propType || 'tape-masking';
  const color = sticker ? sticker.color : propColor;

  switch (activeType) {
    case 'tape-masking':
      return (
        <div
          className="w-full h-full relative opacity-90 shadow-sm"
          style={{
            backgroundColor: color || '#ebdcb9',
            clipPath:
              'polygon(0% 10%, 3% 0%, 97% 0%, 100% 12%, 98% 88%, 100% 100%, 2% 100%, 0% 88%)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
          }}
        >
          {/* Subtle translucent tape texture */}
          <div className="absolute inset-0 bg-white/10 border-t border-b border-black/10" />
        </div>
      );

    case 'tape-duct':
      return (
        <div
          className="w-full h-full relative shadow-md"
          style={{
            backgroundColor: color || '#34383c',
            clipPath: 'polygon(0% 5%, 2% 0%, 98% 0%, 100% 8%, 98% 95%, 100% 100%, 2% 100%, 0% 92%)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {/* Diagonal duct tape cross-hatch texture lines */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 4px)',
            }}
          />
        </div>
      );

    case 'tape-clear':
      return (
        <div
          className="w-full h-full relative border-y border-white/40 shadow-xs"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.45)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(0.5px)',
          }}
        >
          {/* Specular gloss reflection line */}
          <div className="absolute top-1 left-0 right-0 h-0.5 bg-white/60" />
        </div>
      );

    case 'staple':
      return (
        <div className="w-full h-full flex items-center justify-center relative">
          <div
            className="w-full h-2 rounded-xs border border-neutral-700 shadow"
            style={{
              background: 'linear-gradient(180deg, #e6e6e6 0%, #a6a6a6 50%, #6e6e6e 100%)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
            }}
          />
        </div>
      );

    case 'pushpin':
      return (
        <div className="w-full h-full flex items-center justify-center relative">
          {/* Cast shadow */}
          <div className="absolute w-3 h-3 rounded-full bg-black/35 translate-x-1.5 translate-y-2 blur-[1px]" />
          {/* Pin head */}
          <div
            className="w-5 h-5 rounded-full border border-black/40 shadow-md relative z-10"
            style={{
              background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${color || '#ff2d6b'} 60%, #99002b 100%)`,
            }}
          />
        </div>
      );

    case 'arrow':
      return (
        <svg
          viewBox="0 0 100 60"
          className="w-full h-full drop-shadow-sm fill-current"
          style={{ color: color || '#121212' }}
        >
          <title>Arrow</title>
          <path d="M 0 20 L 60 20 L 60 0 L 100 30 L 60 60 L 60 40 L 0 40 Z" />
        </svg>
      );

    case 'star':
      return (
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-sm fill-current"
          style={{ color: color || '#121212' }}
        >
          <title>Star</title>
          <polygon points="50,5 64,36 98,36 70,57 81,91 50,70 19,91 30,57 2,36 36,36" />
        </svg>
      );

    case 'barcode':
      return (
        <div className="w-full h-full bg-white p-1 border border-black flex flex-col justify-between items-center shadow-xs">
          <div
            className="w-full flex-1"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, #000 0, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 7px, transparent 7px, transparent 9px)',
            }}
          />
          <span className="text-[7px] font-mono tracking-widest text-black">ORU-ZINE</span>
        </div>
      );

    case 'halftone-dot':
      return (
        <div
          className="w-full h-full rounded-full opacity-80"
          style={{
            backgroundImage: `radial-gradient(${color || '#ff2d6b'} 25%, transparent 26%)`,
            backgroundSize: '8px 8px',
          }}
        />
      );

    default:
      return null;
  }
};
