import React from 'react';
import { SYMBOL_GLOSSARY, MathView } from './SymbolTooltip';
import { X, Sparkles } from 'lucide-react';

interface SymbolDecoderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SymbolDecoderDrawer({ isOpen, onClose }: SymbolDecoderDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Interactive Engineering Symbol Dictionary
              </h3>
              <p className="text-xs text-slate-400">
                Designed for technicians: learn how to read calculus & Laplace symbols from scratch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Decoded Symbols */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {Object.entries(SYMBOL_GLOSSARY).map(([key, item]) => (
            <div
              key={key}
              className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 hover:border-slate-700 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    <MathView math={item.latex} />
                  </span>
                  <span className="text-xs font-bold text-white">{item.name}</span>
                </div>
                <div className="text-[11px] font-mono text-cyan-400">
                  Say it: <span className="font-semibold text-white">{item.pronunciation}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-1">
                <strong className="text-emerald-400">Everyday Intuition: </strong>
                {item.plainEnglish}
              </p>

              <div className="text-[11px] text-slate-400">
                <strong className="text-indigo-300">Control System Role: </strong>
                {item.engineeringRole}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 text-center bg-slate-950">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer"
          >
            Close Dictionary
          </button>
        </div>
      </div>
    </div>
  );
}
