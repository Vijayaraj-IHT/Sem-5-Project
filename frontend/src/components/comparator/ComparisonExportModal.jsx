import React from 'react';
import { X, Printer, Download, Scale, ShieldCheck } from 'lucide-react';

export default function ComparisonExportModal({
  isOpen,
  onClose,
  multiResult,
  userCase,
}) {
  if (!isOpen || !multiResult) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReport = () => {
    const reportText = `
================================================================================
LEXGUARD JUDICIAL REPOSITORY - PRECEDENT ALIGNMENT MEMORANDUM
Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
System: LexGuard Deterministic Indian-Law Alignment Engine v1.0
================================================================================

1. USER MATTER SUMMARY
--------------------------------------------------------------------------------
Matter Heading:       ${userCase?.title || 'Client Matter (Unregistered)'}
Court / Jurisdiction: ${userCase?.court_jurisdiction || 'High Court of Judicature at Madras'}
Practice Area:        ${userCase?.practice_area || 'Criminal Law'}
Remedy Sought:        ${userCase?.remedy_sought || 'Not specified'}
Procedural Posture:   ${userCase?.procedural_status || 'Pending'}
Statutory Provisions: ${(userCase?.statutory_provisions || []).join(', ') || 'None specified'}
Issues Framed:        ${(userCase?.legal_issues || []).join('; ') || 'None specified'}
Factual Summary:      ${userCase?.facts_summary || 'None specified'}

2. COMPARATIVE PRECEDENT BENCHMARKS
--------------------------------------------------------------------------------
${multiResult.results
  .map(
    (res, i) => `
[Precedent #${i + 1}]
Title:            ${res.precedent.title}
Citation/Case No: ${res.precedent.case_no}
Court / Year:     ${res.precedent.court} (${res.precedent.year})
Overall Score:    ${res.overall_score}% ${res.precedent.case_id === multiResult.best_match_id ? '[BEST MATCH]' : ''}
Precedential:     ${res.precedent.precedential_status}
Dimensions:
${res.dimensions
  .map(
    (d) =>
      `  - ${d.dimension_name}: ${d.dimension_score}% (${d.match_state.toUpperCase()}) -> ${d.explanation}`
  )
  .join('\n')}
`
  )
  .join('\n--------------------------------------------------------------------------------\n')}

3. STATUTORY TRANSITIONS (CrPC <-> BNSS / IPC <-> BNS)
--------------------------------------------------------------------------------
Provisions invoked in User Matter: ${(userCase?.statutory_provisions || []).join(', ')}

4. NON-BINDING RESEARCH DISCLAIMER
--------------------------------------------------------------------------------
${multiResult.disclaimer ||
  'This comparison memorandum is generated as a structured legal research aid based on transparent factual and statutory dimension matching. It does not predict judicial outcomes, constitute legal advice, or establish binding precedential effect.'}
================================================================================
`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LexGuard_Precedent_Comparison_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
        {/* Modal Actions Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Precedent Alignment Memorandum</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={handleDownloadReport}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Report
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 flex-1 overflow-y-auto space-y-6 text-slate-200 bg-slate-950/40 font-sans print:bg-white print:text-black">
          {/* Memorandum Title Banner */}
          <div className="border-b-2 border-slate-800 pb-5 text-center space-y-1">
            <span className="text-[11px] font-mono tracking-widest uppercase text-indigo-400 font-bold">
              LexGuard Judicial Repository & Jurisprudence Comparator
            </span>
            <h2 className="text-xl font-bold font-serif text-white">
              LEGAL PRECEDENT ALIGNMENT MEMORANDUM
            </h2>
            <p className="text-xs text-slate-400">
              Evaluated for High Court Practice &bull; Generated:{' '}
              {new Date().toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* User Matter Summary */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 font-mono">
              1. Matter Reference & Submissions
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Heading: </span>
                <span className="text-white font-medium">{userCase?.title || 'Client Matter'}</span>
              </div>
              <div>
                <span className="text-slate-400">Forum: </span>
                <span className="text-white font-medium">{userCase?.court_jurisdiction}</span>
              </div>
              <div>
                <span className="text-slate-400">Prayer: </span>
                <span className="text-white font-medium">{userCase?.remedy_sought}</span>
              </div>
              <div>
                <span className="text-slate-400">Statutory Sections: </span>
                <span className="text-white font-mono font-medium">
                  {(userCase?.statutory_provisions || []).join(', ') || 'N/A'}
                </span>
              </div>
            </div>
            {userCase?.facts_summary && (
              <div className="text-xs pt-1 border-t border-slate-800/60 text-slate-300">
                <span className="text-slate-400 font-medium">Factual Matrix: </span>
                {userCase.facts_summary}
              </div>
            )}
          </div>

          {/* Comparative Precedents Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 font-mono">
              2. Precedent Comparative Alignment
            </h4>
            <div className="space-y-4">
              {multiResult.results.map((res, i) => {
                const isBest = res.precedent.case_id === multiResult.best_match_id;
                return (
                  <div
                    key={res.precedent.case_id}
                    className={`p-4 rounded-xl border ${
                      isBest
                        ? 'border-indigo-500/50 bg-indigo-950/20'
                        : 'border-slate-800 bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400">
                          Precedent #{i + 1} {isBest ? ' &bull; HIGHEST ALIGNMENT' : ''}
                        </span>
                        <h5 className="text-sm font-bold text-white font-serif">
                          {res.precedent.title}
                        </h5>
                        <div className="text-xs text-slate-400 font-mono">
                          {res.precedent.case_no} &bull; {res.precedent.court} ({res.precedent.year})
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-emerald-400 font-mono">
                          {res.overall_score}%
                        </div>
                        <span className="text-[10px] text-slate-400">Overall Alignment</span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {res.dimensions.map((d, didx) => (
                        <div
                          key={didx}
                          className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-300">{d.dimension_name}</span>
                            <span className="font-mono text-emerald-400 font-bold">
                              {d.dimension_score}%
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">{d.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statutory Certification & Disclaimer */}
          <div className="pt-4 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Statutory Research Notice
            </div>
            <p className="leading-relaxed">{multiResult.disclaimer}</p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <span>LexGuard Indian Jurisprudence Research Suite</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
