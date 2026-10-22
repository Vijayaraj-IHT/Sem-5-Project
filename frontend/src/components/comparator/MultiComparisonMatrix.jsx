import React from 'react';
import { Award, CheckCircle2, AlertTriangle, XCircle, MinusCircle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MultiComparisonMatrix({ multiResult, userCase }) {
  if (!multiResult || !multiResult.results || multiResult.results.length === 0) {
    return null;
  }

  const { results, best_match_id, best_match_score } = multiResult;

  const getMatchBadge = (state) => {
    switch (state) {
      case 'exact':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Exact Match
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" />
            Partial Alignment
          </span>
        );
      case 'different':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            Distinct / Divergent
          </span>
        );
      case 'not_comparable':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <MinusCircle className="w-3 h-3" />
            Excluded (Sub Judice)
          </span>
        );
    }
  };

  const dimensionNames = [
    'Legal Issues & Statutory Provisions',
    'Facts / Factual Matrix',
    'Court & Jurisdiction',
    'Remedy & Procedural Posture',
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Table Header / Summary */}
      <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <h3 className="text-lg font-bold text-white font-serif">
              Comparative Alignment Matrix
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simultaneous multi-precedent evaluation across 4 deterministic Indian-law dimensions.
          </p>
        </div>

        {best_match_id && (
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
            <Award className="w-4 h-4 text-amber-400" />
            <span>
              Highest Precedent Alignment:{' '}
              <strong className="text-white font-bold">{best_match_score}%</strong>
            </span>
          </div>
        )}
      </div>

      {/* Comparison Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80">
              <th className="py-4 px-4 font-semibold text-slate-400 uppercase tracking-wider w-48 shrink-0">
                Dimension
              </th>
              <th className="py-4 px-4 font-semibold text-indigo-300 uppercase tracking-wider min-w-[220px]">
                Your Matter
              </th>
              {results.map((res, idx) => {
                const isBest = res.precedent.case_id === best_match_id && results.length > 1;
                return (
                  <th
                    key={res.precedent.case_id}
                    className={`py-4 px-4 font-semibold uppercase tracking-wider min-w-[260px] ${
                      isBest ? 'bg-indigo-950/40 border-l border-r border-indigo-500/30' : ''
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 font-mono text-[11px]">
                          Precedent #{idx + 1}
                        </span>
                        {isBest && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Award className="w-3 h-3 text-amber-400" />
                            BEST MATCH
                          </span>
                        )}
                      </div>
                      <div className="text-white font-serif normal-case text-xs line-clamp-1">
                        {res.precedent.title}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono normal-case">
                        <span className="text-emerald-400 font-bold text-sm">
                          {res.overall_score}%
                        </span>
                        <span className="text-slate-400">&bull;</span>
                        <span className="text-slate-400">{res.precedent.case_no}</span>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/80">
            {dimensionNames.map((dimName) => {
              // Extract user value from first result dimension
              const firstDim = results[0]?.dimensions.find((d) => d.dimension_name === dimName);
              const userVal = firstDim?.user_value || 'Not specified';

              return (
                <tr key={dimName} className="hover:bg-slate-900/40 transition-colors">
                  {/* Dimension Name Column */}
                  <td className="py-4 px-4 align-top">
                    <span className="font-semibold text-slate-200 block">{dimName}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Weight: {Math.round((firstDim?.weight_assigned || 0.25) * 100)}%
                    </span>
                  </td>

                  {/* User Matter Column */}
                  <td className="py-4 px-4 align-top text-slate-300 bg-slate-950/30">
                    <div className="font-sans leading-relaxed whitespace-pre-line text-[11px]">
                      {userVal}
                    </div>
                  </td>

                  {/* Precedent Columns */}
                  {results.map((res) => {
                    const dim = res.dimensions.find((d) => d.dimension_name === dimName);
                    const isBest = res.precedent.case_id === best_match_id && results.length > 1;

                    return (
                      <td
                        key={res.precedent.case_id}
                        className={`py-4 px-4 align-top space-y-2 ${
                          isBest ? 'bg-indigo-950/20 border-l border-r border-indigo-500/20' : ''
                        }`}
                      >
                        {dim ? (
                          <>
                            <div className="flex items-center justify-between gap-2">
                              {getMatchBadge(dim.match_state)}
                              <span className="font-mono text-[11px] font-semibold text-slate-300">
                                {dim.dimension_score}%
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-300 font-serif">
                              {dim.precedent_value}
                            </div>

                            <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60">
                              {dim.explanation}
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-500 italic">No dimension data</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Non-binding Legal Aid Disclaimer */}
      <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-400 leading-relaxed">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p>
          {results[0]?.disclaimer ||
            'This comparison score is generated as a structured legal research aid based on transparent factual and statutory dimension matching. It does not predict judicial outcomes, constitute legal advice, or establish binding precedential effect.'}
        </p>
      </div>
    </div>
  );
}
