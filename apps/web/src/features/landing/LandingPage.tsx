import { ArrowRight, Cpu, FileText, Layers, Printer, Scissors, ShieldCheck } from 'lucide-react';
import type React from 'react';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-16 flex flex-col gap-16 font-mono">
      {/* Hero Section */}
      <section className="flex flex-col items-start gap-6 border-b border-chrome-border pb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-spot/10 border border-spot/30 text-xs font-bold text-ink">
          <Scissors size={14} className="text-spot" />
          <span>OPEN-SOURCE BROWSER ZINE MAKER</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-ink leading-none">
          ONE SHEET.
          <br />
          <span className="text-spot underline decoration-2 underline-offset-8">ONE FOLD.</span>
          <br />
          ONE ZINE.
        </h1>

        <p className="text-sm md:text-base text-ink/80 max-w-2xl leading-relaxed">
          Create DIY zines with collaged images, typewriter text, and print-culture filters. Export
          a <strong>mathematically imposed 300 DPI PDF</strong> ready to print on standard Letter or
          A4 paper, fold, cut, and distribute.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            type="button"
            onClick={onStart}
            className="flex items-center gap-2 px-6 py-3.5 bg-spot text-spot-contrast font-bold text-sm tracking-wide xerox-border hover:translate-x-0.5 hover:translate-y-0.5 transition-transform"
          >
            <span>MAKE A ZINE NOW</span>
            <ArrowRight size={16} />
          </button>

          <a
            href="https://github.com/AinzAmour/OruZine"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3.5 border border-chrome-border text-sm hover:bg-chrome transition-colors text-ink"
          >
            View on GitHub
          </a>
        </div>

        {/* Privacy Promise Banner */}
        <div className="flex items-center gap-3 p-3 bg-chrome border border-chrome-border text-xs text-ink/80 w-full mt-4">
          <ShieldCheck size={18} className="text-spot shrink-0" />
          <span>
            <strong>100% Client-Side Privacy:</strong> Zero uploads, no account creation, no
            analytics tracking. All images and artwork stay securely on your device.
          </span>
        </div>
      </section>

      {/* Featured Formats */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink tracking-tight flex items-center gap-2">
            <Layers size={18} className="text-spot" />
            <span>SUPPORTED FORMATS</span>
          </h2>
          <span className="text-xs text-ink/60">Tier 1 & Tier 2</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Format 1: 8-Page Mini Zine */}
          <div className="p-5 bg-chrome border border-chrome-border flex flex-col justify-between gap-4 xerox-border-sm hover:border-spot transition-colors">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="bg-spot text-spot-contrast px-1.5 py-0.5 font-bold">
                  START HERE
                </span>
                <span className="text-ink/60">Easy • 1 Sheet</span>
              </div>
              <h3 className="text-base font-bold text-ink">8-Page Mini Zine</h3>
              <p className="text-xs text-ink/70">
                Single landscape sheet folded into an 8-panel pocket zine with one simple center
                slit.
              </p>
            </div>
            <div className="pt-3 border-t border-chrome-border flex items-center justify-between text-xs text-ink/60">
              <span>Letter / A4 / A3</span>
              <span>1 cut • 0 staples</span>
            </div>
          </div>

          {/* Format 2: Saddle-Stitch Booklet */}
          <div className="p-5 bg-chrome border border-chrome-border flex flex-col justify-between gap-4 xerox-border-sm hover:border-spot transition-colors">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="bg-ink/10 text-ink px-1.5 py-0.5">BOOKLET</span>
                <span className="text-ink/60">Medium • Duplex</span>
              </div>
              <h3 className="text-base font-bold text-ink">Saddle-Stitch Booklet</h3>
              <p className="text-xs text-ink/70">
                Multi-page staple-bound booklet with duplex imposition and automated page creep
                compensation.
              </p>
            </div>
            <div className="pt-3 border-t border-chrome-border flex items-center justify-between text-xs text-ink/60">
              <span>8, 12, 16.. 40 pages</span>
              <span>Staple bound</span>
            </div>
          </div>

          {/* Format 3: Accordion / Leporello */}
          <div className="p-5 bg-chrome border border-chrome-border flex flex-col justify-between gap-4 xerox-border-sm hover:border-spot transition-colors">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="bg-ink/10 text-ink px-1.5 py-0.5">FOLDED</span>
                <span className="text-ink/60">Easy • Continuous</span>
              </div>
              <h3 className="text-base font-bold text-ink">Accordion / Leporello</h3>
              <p className="text-xs text-ink/70">
                Continuous zig-zag fold format ideal for panoramas, photo series, and visual
                storytelling.
              </p>
            </div>
            <div className="pt-3 border-t border-chrome-border flex items-center justify-between text-xs text-ink/60">
              <span>6 or 8 panels</span>
              <span>0 cuts • 0 staples</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-chrome-border pt-12">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-spot font-bold text-sm">
            <Printer size={16} />
            <span>PRINT IMPOSITION</span>
          </div>
          <p className="text-xs text-ink/70 leading-relaxed">
            The imposition engine places and rotates panels mathematically so your home printout
            folds in exact 1→8 sequence.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-spot font-bold text-sm">
            <FileText size={16} />
            <span>300 DPI WYSIWYG</span>
          </div>
          <p className="text-xs text-ink/70 leading-relaxed">
            Preview what you print in real-time. Export vector-crisp text and high-res images at
            true press resolution.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-spot font-bold text-sm">
            <Cpu size={16} />
            <span>LOCAL BROWSER AI</span>
          </div>
          <p className="text-xs text-ink/70 leading-relaxed">
            Optional one-click cutout masks and background removal running completely in your
            browser via WebGPU/WASM.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-chrome-border pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-ink/60 gap-4">
        <span>OruZine is free & open-source software under the MIT license.</span>
        <span>"Oru" = fold (JP) / one (TA)</span>
      </footer>
    </div>
  );
};
