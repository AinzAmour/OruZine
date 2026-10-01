import {
  AVAILABLE_FILTERS,
  FILTER_REGISTRY,
  type FilterInstance,
  type FilterType,
} from '@oruzine/filters';
import { Check, Eye, EyeOff, Plus, Sliders, Sparkles, Trash2, X } from 'lucide-react';
import type React from 'react';
import { useDocumentStore } from '../../stores/documentStore';

export interface FilterStackTarget {
  type: 'object' | 'page';
  pageIndex: number;
  objectId?: string;
  title: string;
}

interface FilterStackModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: FilterStackTarget | null;
}

export const FilterStackModal: React.FC<FilterStackModalProps> = ({ isOpen, onClose, target }) => {
  const { pages, addFilter, updateFilter, removeFilter, toggleFilter, applyFiltersToAllPages } =
    useDocumentStore();

  if (!isOpen || !target) return null;

  const page = pages[target.pageIndex];
  if (!page) return null;

  let activeFilters: FilterInstance[] = [];
  if (target.type === 'object' && target.objectId) {
    const obj = page.objects.find((o) => o.id === target.objectId);
    if (obj && obj.type === 'image') {
      activeFilters = obj.filters || [];
    }
  } else {
    activeFilters = page.pageFilters || [];
  }

  const handleAdd = (type: FilterType) => {
    addFilter(target.pageIndex, target.objectId ?? null, type);
  };

  const handleParamChange = (filterId: string, key: string, val: string | number) => {
    updateFilter(target.pageIndex, target.objectId ?? null, filterId, {
      [key]: val,
    });
  };

  const handleApplyToAll = () => {
    if (window.confirm('Apply this filter stack across all pages in the current zine?')) {
      applyFiltersToAllPages(activeFilters);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 select-none">
      <div className="bg-paper xerox-border w-full max-w-xl max-h-[85vh] flex flex-col font-mono text-ink animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-chrome-border p-4 bg-chrome">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-spot" />
            <div>
              <h2 className="text-sm font-bold tracking-tight">PRINT FILTERS & SHADER STACK</h2>
              <span className="text-[10px] text-ink/60">
                Target: {target.title} ({activeFilters.length} active)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-paper border border-chrome-border"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Active Filter Stack */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink/70">
                ACTIVE FILTER STACK (TOP TO BOTTOM)
              </span>
              {activeFilters.length > 0 && (
                <button
                  type="button"
                  onClick={handleApplyToAll}
                  className="text-[10px] text-spot hover:underline flex items-center gap-1 font-bold"
                >
                  <Sparkles size={11} />
                  <span>Apply Stack to All Pages</span>
                </button>
              )}
            </div>

            {activeFilters.length === 0 ? (
              <div className="p-6 border border-dashed border-chrome-border text-center text-xs text-ink/50">
                No print filters applied yet. Pick a filter below to add it to the non-destructive
                stack.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activeFilters.map((filt, idx) => {
                  const def = FILTER_REGISTRY[filt.type];
                  if (!def) return null;

                  return (
                    <div
                      key={filt.id}
                      className={`border p-3 flex flex-col gap-2.5 transition-all ${
                        filt.enabled
                          ? 'border-spot/60 bg-paper'
                          : 'border-chrome-border bg-chrome/30 opacity-60'
                      }`}
                    >
                      {/* Filter item top bar */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-chrome px-1.5 py-0.5 border border-chrome-border font-bold">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-bold">{def.name}</span>
                          <span className="text-[10px] text-ink/50 italic">({def.type})</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              toggleFilter(target.pageIndex, target.objectId ?? null, filt.id)
                            }
                            className={`p-1 border ${
                              filt.enabled
                                ? 'border-spot text-spot'
                                : 'border-chrome-border text-ink/40'
                            }`}
                            title={filt.enabled ? 'Disable' : 'Enable'}
                          >
                            {filt.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              removeFilter(target.pageIndex, target.objectId ?? null, filt.id)
                            }
                            className="p-1 border border-chrome-border text-red-500 hover:bg-red-500/10"
                            title="Remove Filter"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Filter parameters */}
                      {filt.enabled && (
                        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-chrome-border/60">
                          {def.params.map((param) => {
                            const rawVal = filt.params[param.key] ?? param.default;

                            if (param.type === 'number') {
                              const numVal =
                                typeof rawVal === 'number' ? rawVal : Number(rawVal ?? 0);
                              return (
                                <div key={param.key} className="flex flex-col gap-1">
                                  <div className="flex justify-between text-[10px] text-ink/70">
                                    <span>{param.label}</span>
                                    <span className="font-bold">{numVal}</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={param.min}
                                    max={param.max}
                                    step={param.step}
                                    value={numVal}
                                    onChange={(e) =>
                                      handleParamChange(filt.id, param.key, Number(e.target.value))
                                    }
                                    className="w-full accent-spot"
                                  />
                                </div>
                              );
                            }

                            if (param.type === 'color') {
                              const colorVal = String(rawVal ?? '#000000');
                              return (
                                <div
                                  key={param.key}
                                  className="flex items-center justify-between text-[10px]"
                                >
                                  <span>{param.label}</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-[9px] uppercase text-ink/60">
                                      {colorVal}
                                    </span>
                                    <input
                                      type="color"
                                      value={colorVal}
                                      onChange={(e) =>
                                        handleParamChange(filt.id, param.key, e.target.value)
                                      }
                                      className="w-7 h-5 p-0 border border-chrome-border cursor-pointer"
                                    />
                                  </div>
                                </div>
                              );
                            }

                            if (param.type === 'select') {
                              const selectVal = String(rawVal ?? '');
                              return (
                                <div key={param.key} className="flex flex-col gap-1 text-[10px]">
                                  <span>{param.label}</span>
                                  <select
                                    value={selectVal}
                                    onChange={(e) =>
                                      handleParamChange(filt.id, param.key, e.target.value)
                                    }
                                    className="p-1 border border-chrome-border bg-paper text-ink text-xs"
                                  >
                                    {param.options?.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              );
                            }

                            return null;
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Filter Section */}
          <div className="flex flex-col gap-2 pt-2 border-t border-chrome-border">
            <span className="text-xs font-bold text-ink/70">ADD PRINT CULTURE FILTER</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AVAILABLE_FILTERS.map((type) => {
                const def = FILTER_REGISTRY[type];
                return (
                  <button
                    type="button"
                    key={type}
                    onClick={() => handleAdd(type)}
                    className="p-2 border border-chrome-border bg-chrome/40 hover:bg-paper hover:border-spot text-left flex flex-col gap-1 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{def.name}</span>
                      <Plus size={12} className="text-spot" />
                    </div>
                    <span className="text-[9px] text-ink/60 line-clamp-2">{def.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-chrome-border p-3 bg-chrome flex items-center justify-between">
          <span className="text-[10px] text-ink/50">
            Filters are non-destructive and rendered at 300 DPI on export.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-spot text-spot-contrast font-bold text-xs hover:opacity-90 flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
