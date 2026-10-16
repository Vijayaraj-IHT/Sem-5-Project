import React from 'react';
import { Scale, Info, ShieldCheck, AlertCircle } from 'lucide-react';

export default function ScoreCard({ score, scoreMethod, dimensions = [], precedent, disclaimer }) {
  const activeCount = dimensions.filter((d) => d.is_included_in_score).length;
  const totalCount = dimensions.length;

  // Determine score color theme
  let scoreBadge = { label: 'Divergent', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
  let ringColor = 'stroke-rose-500';

  if (score >= 75) {
    scoreBadge = { label: 'High Alignment', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    ringColor = 'stroke-emerald-500';
  } else if (score >= 45) {
    scoreBadge = { label: 'Moderate Alignment', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    ringColor = 'stroke-amber-500';
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        {/* Left: Precedent Reference & Title */}
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5 mb-1">
            <Scale className="w-3.5 h-3.5" />
            Precedent Legal Benchmark
          </span>
          <h3 className="text-lg font-bold text-white font-serif">
            {precedent?.title || 'Selected Precedent'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {precedent?.court} &bull; Case No: <span className="font-mono text-slate-300">{precedent?.case_no}</span> ({precedent?.year})
          </p>
        </div>

        {/* Right: Circular Score Gauge */}
        <div className="flex items-center gap-4 bg-slate-950/70 px-5 py-3.5 rounded-xl border border-slate-800 shrink-0">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800 stroke-current"
                strokeWidth="3.2"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${ringColor} stroke-current transition-all duration-700 ease-out`}
                strokeDasharray={`${score}, 100`}
                strokeWidth="3.2"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-base font-bold font-mono text-white">
              {score}%
            </span>
          </div>

          <div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${scoreBadge.color}`}>
              {scoreBadge.label}
            </span>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Active: {activeCount} of {totalCount} dimensions
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              Method: {scoreMethod}
            </p>
          </div>
        </div>
      </div>

      {/* Research Disclaimer */}
      <div className="mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-400 leading-relaxed">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p>
          {disclaimer ||
            'This comparison score is a structured research aid. It does not predict outcomes, constitute legal advice, or establish binding effect.'}
        </p>
      </div>
    </div>
  );
}
