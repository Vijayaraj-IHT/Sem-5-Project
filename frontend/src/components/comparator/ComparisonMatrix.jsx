import React from 'react';

/**
 * Dimension Comparison Matrix Component
 * Displays dimension-by-dimension alignment between user case & precedent case.
 * Strictly respects missing dimensions and pending outcomes.
 */
export default function ComparisonMatrix({ dimensions = [], score = null }) {
  if (!dimensions || dimensions.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-400">
        No dimension comparison data available. Select a precedent and enter case facts to compare.
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'exact':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Exact Match
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Partial / Distinguishable
          </span>
        );
      case 'different':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Distinct
          </span>
        );
      case 'not_comparable':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            Not Comparable (Excluded from score)
          </span>
        );
    }
  };

  const formatValue = (val) => {
    if (val === null || val === undefined || val === '') {
      return <span className="text-slate-500 italic">Not specified</span>;
    }
    if (Array.isArray(val)) {
      if (val.length === 0) return <span className="text-slate-500 italic">None specified</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {val.map((item, idx) => (
            <span key={idx} className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded border border-slate-700 font-mono">
              {item}
            </span>
          ))}
        </div>
      );
    }
    return <span className="text-slate-300 text-sm">{val}</span>;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-4 bg-slate-950/40">
        <div>
          <h3 className="text-base font-semibold text-white">Dimension-by-Dimension Matrix</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Objective alignment analysis across 7 statutory and factual dimensions.
          </p>
        </div>
        {score && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">
              Active Dimensions: <strong className="text-white">{score.active_dimensions_count}</strong> of {score.active_dimensions_count + score.excluded_dimensions_count}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">
              Renormalized Total Weight: <strong className="text-emerald-400">{Math.round(score.total_effective_weight)}%</strong>
            </span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4 w-44">Dimension</th>
              <th className="py-3 px-4 w-60">Your Case</th>
              <th className="py-3 px-4 w-60">Precedent Holding</th>
              <th className="py-3 px-4 w-48">Alignment Verdict</th>
              <th className="py-3 px-4 w-28 text-right">Effective Weight</th>
              <th className="py-3 px-4 min-w-[220px]">Legal Explanation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {dimensions.map((dim, idx) => {
              const isExcluded = !dim.is_included_in_score;
              return (
                <tr 
                  key={dim.dimension_key || idx} 
                  className={`hover:bg-slate-800/40 transition-colors ${
                    isExcluded ? 'opacity-70 bg-slate-950/20' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-medium text-slate-200">
                    <div className="flex flex-col">
                      <span>{dim.dimension_name}</span>
                      {isExcluded && (
                        <span className="text-[10px] text-slate-500 italic mt-0.5">
                          Excluded from denominator
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs break-words">
                    {formatValue(dim.user_value)}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs break-words">
                    {formatValue(dim.precedent_value)}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getStatusBadge(dim.status)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-xs">
                    {isExcluded ? (
                      <span className="text-slate-500 line-through">
                        {dim.base_weight}%
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">
                        {dim.effective_weight_percentage?.toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-400 leading-relaxed">
                    {dim.explanation}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800/60 text-xs text-slate-500 flex items-center justify-between flex-wrap gap-2">
        <span>* Dimensions with missing data or pending outcomes are excluded from denominator to prevent mathematical distortion.</span>
        <span>Weights normalized dynamically to sum to 100%.</span>
      </div>
    </div>
  );
}
