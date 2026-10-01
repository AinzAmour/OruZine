import { FORMAT_REGISTRY, MINI_8_FORMAT } from '@oruzine/formats';
import { BookOpen, ChevronLeft, ChevronRight, Printer, Scissors, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useDocumentStore } from '../../stores/documentStore';

interface FoldGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FoldGuideModal: React.FC<FoldGuideModalProps> = ({ isOpen, onClose }) => {
  const { formatId } = useDocumentStore();
  const activeFormat = FORMAT_REGISTRY[formatId] || MINI_8_FORMAT;
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  if (!isOpen) return null;

  const steps = activeFormat.foldSteps;
  const currentStep = steps[Math.min(currentStepIndex, steps.length - 1)];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 select-none">
      <div className="bg-paper xerox-border w-full max-w-lg p-6 flex flex-col gap-6 text-ink font-mono animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-chrome-border pb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-spot inline-block" />
            <h2 className="text-base font-bold tracking-tight">
              HOW TO ASSEMBLE: {activeFormat.name.toUpperCase()}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-chrome border border-chrome-border"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between text-xs text-ink/70">
          <span className="font-bold text-spot">
            STEP {currentStep.step} OF {steps.length}
          </span>
          <span className="text-[11px] font-bold">{currentStep.title}</span>
        </div>

        {/* Diagram Area */}
        <div className="aspect-[16/10] bg-chrome border border-chrome-border flex flex-col items-center justify-center p-6 relative overflow-hidden">
          {/* Mini-8 Diagrams */}
          {activeFormat.id === 'mini-8' && (
            <>
              {currentStep.step === 1 && (
                <div className="w-48 h-32 border-2 border-ink bg-paper relative flex flex-col justify-center items-center">
                  <div className="w-full border-b-2 border-dashed border-spot" />
                  <span className="absolute text-[10px] text-spot font-bold bg-paper px-1">
                    Fold in half horizontally
                  </span>
                </div>
              )}

              {currentStep.step === 2 && (
                <div className="w-48 h-32 border-2 border-ink bg-paper relative grid grid-cols-4 grid-rows-2">
                  <div className="border-r border-b border-dashed border-ink/40" />
                  <div className="border-r border-b border-dashed border-ink/40" />
                  <div className="border-r border-b border-dashed border-ink/40" />
                  <div className="border-b border-dashed border-ink/40" />
                  <div className="border-r border-dashed border-ink/40" />
                  <div className="border-r border-dashed border-ink/40" />
                  <div className="border-r border-dashed border-ink/40" />
                  <div />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] text-ink font-bold bg-paper/80">
                    8 Equal Panels Creased
                  </span>
                </div>
              )}

              {currentStep.step === 3 && (
                <div className="w-48 h-32 border-2 border-ink bg-paper relative grid grid-cols-4 grid-rows-2">
                  <div className="border-r border-b border-dashed border-ink/40" />
                  <div className="border-r border-b-2 border-dashed border-spot" />
                  <div className="border-r border-b-2 border-dashed border-spot" />
                  <div className="border-b border-dashed border-ink/40" />
                  <div className="border-r border-dashed border-ink/40" />
                  <div className="border-r border-dashed border-ink/40" />
                  <div className="border-r border-dashed border-ink/40" />
                  <div />
                  <div className="absolute top-1/2 left-1/4 w-1/2 -translate-y-1/2 flex items-center justify-center">
                    <div className="bg-spot text-spot-contrast px-2 py-0.5 text-[9px] font-bold flex items-center gap-1 shadow">
                      <Scissors size={10} />
                      <span>CUT THIS LINE ONLY</span>
                    </div>
                  </div>
                </div>
              )}

              {currentStep.step === 4 && (
                <div className="flex items-center justify-center">
                  <div className="w-24 h-24 relative flex items-center justify-center">
                    <div className="w-16 h-1 bg-ink absolute" />
                    <div className="w-1 h-16 bg-ink absolute" />
                    <div className="w-6 h-6 border-2 border-spot absolute rotate-45" />
                    <span className="text-[10px] text-spot font-bold absolute -bottom-6 whitespace-nowrap">
                      Collapse into 4-pane cross (+)
                    </span>
                  </div>
                </div>
              )}

              {currentStep.step === 5 && (
                <div className="w-28 h-36 border-2 border-ink bg-paper shadow-md p-3 flex flex-col justify-between">
                  <div className="text-[10px] font-bold text-spot">PAGE 1</div>
                  <div className="text-center text-xs font-bold">READY TO READ!</div>
                  <div className="text-[9px] text-ink/60 text-right">Back is p.8</div>
                </div>
              )}
            </>
          )}

          {/* Saddle-Stitch Booklet Diagrams */}
          {activeFormat.id === 'saddle-stitch' && (
            <>
              {currentStep.step === 1 && (
                <div className="w-52 h-32 border-2 border-ink bg-paper relative flex flex-col items-center justify-center gap-2 p-2">
                  <Printer size={24} className="text-spot" />
                  <span className="text-center text-[10px] font-bold">
                    Duplex Print (Flip on short edge)
                  </span>
                  <div className="text-[9px] text-ink/60 bg-chrome px-2 py-0.5 border border-chrome-border">
                    Front & Back side aligned
                  </div>
                </div>
              )}

              {currentStep.step === 2 && (
                <div className="relative w-48 h-32 flex items-center justify-center">
                  <div className="absolute w-40 h-28 border border-ink/40 bg-paper/60 translate-x-3 translate-y-3" />
                  <div className="absolute w-40 h-28 border border-ink/70 bg-paper/80 translate-x-1.5 translate-y-1.5" />
                  <div className="absolute w-40 h-28 border-2 border-ink bg-paper flex items-center justify-center font-bold text-[10px]">
                    Cover Sheet on Bottom ➔ Innermost on Top
                  </div>
                </div>
              )}

              {currentStep.step === 3 && (
                <div className="w-48 h-32 border-2 border-ink bg-paper relative flex items-center justify-center">
                  <div className="h-full border-r-2 border-dashed border-spot" />
                  <span className="absolute text-[10px] text-spot font-bold bg-paper px-1">
                    Fold down center spine
                  </span>
                </div>
              )}

              {currentStep.step === 4 && (
                <div className="w-44 h-32 border-2 border-ink bg-paper shadow relative flex flex-col justify-between p-3">
                  <div className="h-full border-l-2 border-spot absolute left-2 top-0 flex flex-col justify-around py-3">
                    <div className="w-2 h-0.5 bg-ink" />
                    <div className="w-2 h-0.5 bg-ink" />
                  </div>
                  <div className="pl-4 flex flex-col justify-center h-full">
                    <BookOpen size={20} className="text-spot mb-1" />
                    <div className="text-[11px] font-bold">Staple 2x along spine</div>
                    <div className="text-[9px] text-ink/60">Your booklet is finished!</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Text Instruction */}
        <p className="text-xs text-ink/80 leading-relaxed border-l-2 border-spot pl-3">
          {currentStep.instruction}
        </p>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-chrome-border">
          <button
            type="button"
            disabled={currentStepIndex === 0}
            onClick={() => setCurrentStepIndex((i) => Math.max(0, i - 1))}
            className="flex items-center gap-1 px-3 py-1.5 border border-chrome-border hover:bg-chrome disabled:opacity-30 text-xs"
          >
            <ChevronLeft size={14} />
            <span>Previous</span>
          </button>

          <div className="flex gap-1">
            {steps.map((s, idx) => (
              <span
                key={s.step}
                className={`w-2 h-2 rounded-full ${
                  idx === currentStepIndex ? 'bg-spot' : 'bg-chrome-border'
                }`}
              />
            ))}
          </div>

          {currentStepIndex < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStepIndex((i) => Math.min(steps.length - 1, i + 1))}
              className="flex items-center gap-1 px-4 py-1.5 bg-spot text-spot-contrast font-bold text-xs hover:opacity-90"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-ink text-paper font-bold text-xs hover:opacity-90"
            >
              Got it!
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
