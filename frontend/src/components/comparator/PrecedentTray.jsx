import React from 'react';
import { Scale, Plus, X, ExternalLink, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrecedentTray({
  selectedPrecedents = [],
  onOpenModal,
  onRemovePrecedent,
  maxPrecedents = 3,
}) {
  const slots = Array.from({ length: maxPrecedents }, (_, i) => selectedPrecedents[i] || null);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Precedent Selection Tray</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {selectedPrecedents.length} / {maxPrecedents} Selected
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare your matter against 1 to 3 published High Court or Supreme Court precedents simultaneously.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedPrecedents.length < maxPrecedents && (
            <button
              type="button"
              onClick={() => onOpenModal()}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Precedent
            </button>
          )}
          {selectedPrecedents.length > 0 && (
            <button
              type="button"
              onClick={() => {
                selectedPrecedents.forEach((p) => onRemovePrecedent(p.id));
              }}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Clear Tray
            </button>
          )}
        </div>
      </div>

      {/* 3 Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {slots.map((precedent, idx) => {
          if (precedent) {
            const isGoodLaw = precedent.precedential_status === 'good_law' || precedent.precedential_status === 'Good Law';
            return (
              <div
                key={precedent.id}
                className="relative bg-slate-950/80 border border-indigo-500/40 rounded-xl p-4 flex flex-col justify-between shadow-lg shadow-indigo-950/20 group hover:border-indigo-400/70 transition-all"
              >
                {/* Header: Slot Badge & Remove Button */}
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Precedent #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemovePrecedent(precedent.id)}
                    title="Remove from comparison tray"
                    className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Case Info */}
                <div className="mt-2.5 space-y-1">
                  <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                    {precedent.title}
                  </h4>
                  <div className="text-[11px] font-mono text-slate-400">
                    {precedent.citation || precedent.case_no}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                    <span>{precedent.court}</span>
                    <span>&bull;</span>
                    <span>{precedent.year}</span>
                  </div>
                </div>

                {/* Footer Status & Proof Link */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {isGoodLaw ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Good Law
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                        <AlertCircle className="w-2.5 h-2.5" />
                        Status unverified
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/cases/${precedent.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
                  >
                    View Proof
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>
              </div>
            );
          }

          // Empty Slot
          return (
            <div
              key={`empty-${idx}`}
              onClick={() => onOpenModal(idx)}
              className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-950/30 hover:bg-slate-900/40 transition-all min-h-[140px] group"
            >
              <div className="w-9 h-9 rounded-full bg-slate-800/80 group-hover:bg-indigo-600/20 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 transition-colors mb-2">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-300 group-hover:text-white">
                Slot #{idx + 1}: Select Precedent
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                Click to browse verified precedents
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
