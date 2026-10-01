import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  Lock,
  Square,
  Trash2,
  Type,
  Unlock,
} from 'lucide-react';
import type React from 'react';
import { useDocumentStore, type ZineObject } from '../../stores/documentStore';

export const LayersPanel: React.FC = () => {
  const {
    pages,
    activePageIndex,
    selectedObjectId,
    setSelectedObjectId,
    bringForward,
    sendBackward,
    toggleObjectLock,
    toggleObjectVisibility,
    duplicateObject,
    removeObject,
  } = useDocumentStore();

  const activePage = pages[activePageIndex];
  if (!activePage) return null;

  // Visual layers: display top-layer first (reversed array)
  const reversedObjects = [...activePage.objects].reverse();

  const getObjectIcon = (obj: ZineObject) => {
    switch (obj.type) {
      case 'image':
        return <ImageIcon size={13} className="text-spot" />;
      case 'text':
        return <Type size={13} className="text-spot" />;
      case 'shape':
        return <Square size={13} className="text-spot" />;
    }
  };

  const getObjectLabel = (obj: ZineObject) => {
    if (obj.type === 'text') {
      return obj.text.slice(0, 16) || 'Text Box';
    }
    if (obj.type === 'image') {
      return 'Image Layer';
    }
    return `Shape (${obj.shapeType})`;
  };

  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="flex items-center justify-between pb-1 border-b border-chrome-border text-ink/70">
        <span className="font-bold uppercase text-[10px]">
          Layers ({activePage.objects.length})
        </span>
        <Layers size={13} />
      </div>

      {activePage.objects.length === 0 ? (
        <div className="text-center py-6 text-[11px] text-ink/50 border border-dashed border-chrome-border">
          No layers on this page yet.
        </div>
      ) : (
        <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
          {reversedObjects.map((obj) => {
            const isSelected = selectedObjectId === obj.id;

            return (
              <div
                key={obj.id}
                className={`p-1.5 border flex items-center justify-between text-xs select-none transition-colors ${
                  isSelected
                    ? 'border-spot bg-spot/10 font-bold'
                    : 'border-chrome-border hover:bg-paper'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedObjectId(obj.id)}
                  className="flex items-center gap-2 truncate max-w-[120px] text-left cursor-pointer"
                >
                  {getObjectIcon(obj)}
                  <span className="truncate text-[11px]">{getObjectLabel(obj)}</span>
                </button>

                <div className="flex items-center gap-1">
                  {/* Reorder */}
                  <button
                    type="button"
                    onClick={() => bringForward(activePageIndex, obj.id)}
                    className="p-1 hover:bg-chrome rounded text-ink/70 hover:text-ink"
                    title="Bring forward"
                  >
                    <ArrowUp size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => sendBackward(activePageIndex, obj.id)}
                    className="p-1 hover:bg-chrome rounded text-ink/70 hover:text-ink"
                    title="Send backward"
                  >
                    <ArrowDown size={11} />
                  </button>

                  {/* Lock */}
                  <button
                    type="button"
                    onClick={() => toggleObjectLock(activePageIndex, obj.id)}
                    className="p-1 hover:bg-chrome rounded text-ink/70 hover:text-ink"
                    title={obj.locked ? 'Unlock layer' : 'Lock layer'}
                  >
                    {obj.locked ? <Lock size={11} className="text-spot" /> : <Unlock size={11} />}
                  </button>

                  {/* Visibility */}
                  <button
                    type="button"
                    onClick={() => toggleObjectVisibility(activePageIndex, obj.id)}
                    className="p-1 hover:bg-chrome rounded text-ink/70 hover:text-ink"
                    title={obj.hidden ? 'Show layer' : 'Hide layer'}
                  >
                    {obj.hidden ? <EyeOff size={11} className="text-ink/40" /> : <Eye size={11} />}
                  </button>

                  {/* Duplicate */}
                  <button
                    type="button"
                    onClick={() => duplicateObject(activePageIndex, obj.id)}
                    className="p-1 hover:bg-chrome rounded text-ink/70 hover:text-ink"
                    title="Duplicate layer"
                  >
                    <Copy size={11} />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => removeObject(activePageIndex, obj.id)}
                    className="p-1 hover:bg-red-500/10 rounded text-red-500"
                    title="Delete layer"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
