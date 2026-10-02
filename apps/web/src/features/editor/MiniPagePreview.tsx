import type React from 'react';
import type { DocumentPage } from '../../stores/documentStore';
import { StickerView } from '../collage/StickerView';

interface MiniPagePreviewProps {
  page: DocumentPage;
  className?: string;
  style?: React.CSSProperties;
  showBadge?: boolean;
  badgeLabel?: string;
  fontScale?: number; // Scaling factor for text font sizes (e.g. 0.25 for thumbnails, 0.55 for imposition)
}

export const MiniPagePreview: React.FC<MiniPagePreviewProps> = ({
  page,
  className = '',
  style,
  showBadge = false,
  badgeLabel,
  fontScale = 0.35,
}) => {
  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
      style={{
        backgroundColor: page.backgroundColor || '#ffffff',
        ...style,
      }}
    >
      {/* Texture Overlays */}
      {page.pageOverlays?.map((ovl) => (
        <div
          key={ovl.id}
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            opacity: ovl.opacity,
            mixBlendMode: ovl.blendMode,
            backgroundImage:
              ovl.type === 'toner-dust'
                ? 'radial-gradient(circle, #000 1px, transparent 1px)'
                : ovl.type === 'copier-streaks'
                  ? 'repeating-linear-gradient(90deg, transparent 0, transparent 20px, rgba(0,0,0,0.15) 21px, transparent 22px)'
                  : ovl.type === 'fold-creases'
                    ? 'linear-gradient(to bottom, transparent 49%, rgba(0,0,0,0.3) 50%, transparent 51%)'
                    : undefined,
            backgroundSize: ovl.type === 'toner-dust' ? '8px 8px' : undefined,
          }}
        />
      ))}

      {/* Page Objects */}
      {page.objects.map((obj) => {
        if (obj.hidden) return null;

        return (
          <div
            key={obj.id}
            className="absolute pointer-events-none"
            style={{
              left: `${obj.xPercent * 100}%`,
              top: `${obj.yPercent * 100}%`,
              width: `${obj.wPercent * 100}%`,
              height: `${obj.hPercent * 100}%`,
              transform: `rotate(${obj.rotation}deg)`,
              transformOrigin: 'center center',
              opacity: obj.opacity,
            }}
          >
            {/* Shape */}
            {obj.type === 'shape' && (
              <div
                className="w-full h-full"
                style={{
                  backgroundColor: obj.fillColor || 'transparent',
                  borderColor: obj.strokeColor || '#121212',
                  borderWidth: `${Math.max(1, (obj.strokeWidth || 2) * fontScale)}px`,
                  borderStyle: 'solid',
                  borderRadius: obj.shapeType === 'circle' ? '9999px' : '0px',
                }}
              />
            )}

            {/* Sticker */}
            {obj.type === 'sticker' && <StickerView sticker={obj} />}

            {/* Image */}
            {obj.type === 'image' && obj.imageDataUrl && (
              <div
                className="w-full h-full relative"
                style={{
                  filter: obj.paperShadow
                    ? 'drop-shadow(1px 2px 3px rgba(0, 0, 0, 0.35))'
                    : undefined,
                }}
              >
                <img
                  src={obj.imageDataUrl}
                  alt="Page content"
                  className={`w-full h-full pointer-events-none ${
                    obj.imageFit === 'contain' ? 'object-contain' : 'object-cover'
                  }`}
                  style={{
                    transform: `${obj.flipX ? 'scaleX(-1)' : ''} ${obj.flipY ? 'scaleY(-1)' : ''}`,
                    clipPath:
                      obj.mask === 'circle'
                        ? 'circle(50% at 50% 50%)'
                        : obj.mask === 'star'
                          ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                          : obj.mask === 'stamp'
                            ? 'polygon(0% 5%, 5% 0%, 10% 5%, 15% 0%, 20% 5%, 25% 0%, 30% 5%, 35% 0%, 40% 5%, 45% 0%, 50% 5%, 55% 0%, 60% 5%, 65% 0%, 70% 5%, 75% 0%, 80% 5%, 85% 0%, 90% 5%, 95% 0%, 100% 5%, 95% 10%, 100% 15%, 95% 20%, 100% 25%, 95% 30%, 100% 35%, 95% 40%, 100% 45%, 95% 50%, 100% 55%, 95% 60%, 100% 65%, 95% 70%, 100% 75%, 95% 80%, 100% 85%, 95% 90%, 100% 95%, 95% 100%, 90% 95%, 85% 100%, 80% 95%, 75% 100%, 70% 95%, 65% 100%, 60% 95%, 55% 100%, 50% 95%, 45% 100%, 40% 95%, 35% 100%, 30% 95%, 25% 100%, 20% 95%, 15% 100%, 10% 95%, 5% 100%, 0% 95%, 5% 90%, 0% 85%, 5% 80%, 0% 75%, 5% 70%, 0% 65%, 5% 60%, 0% 55%, 5% 50%, 0% 45%, 5% 40%, 0% 35%, 5% 30%, 0% 25%, 5% 20%, 0% 15%, 5% 10%, 0% 5%)'
                            : obj.mask === 'torn-edge'
                              ? 'polygon(2% 2%, 98% 3%, 97% 97%, 3% 98%)'
                              : undefined,
                  }}
                />
              </div>
            )}

            {/* Text */}
            {obj.type === 'text' && (
              <div
                className="w-full h-full whitespace-pre-wrap overflow-hidden"
                style={{
                  color: obj.color,
                  fontWeight: obj.bold ? 'bold' : 'normal',
                  fontStyle: obj.italic ? 'italic' : 'normal',
                  textDecoration: obj.underline ? 'underline' : 'none',
                  textAlign: obj.align || 'left',
                  fontFamily: obj.fontFamily || 'monospace',
                  backgroundColor: obj.backgroundColor || 'transparent',
                  lineHeight: obj.lineHeight ? `${obj.lineHeight}` : '1.2',
                  letterSpacing: obj.letterSpacing
                    ? `${obj.letterSpacing * fontScale}px`
                    : 'normal',
                  fontSize: `${Math.max(4, obj.fontSizePt * fontScale)}px`,
                }}
              >
                {obj.text}
              </div>
            )}
          </div>
        );
      })}

      {/* Optional Page Badge */}
      {showBadge && (
        <div className="absolute bottom-1 right-1 z-20 bg-black/75 text-white font-mono text-[7px] px-1 py-0.2 rounded font-bold pointer-events-none shadow">
          {badgeLabel || `p.${page.pageNumber}`}
        </div>
      )}
    </div>
  );
};
