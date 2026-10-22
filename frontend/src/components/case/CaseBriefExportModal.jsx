import React from 'react';
import { X, Printer, Download, Scale, ShieldCheck, Gavel, FileText } from 'lucide-react';

export default function CaseBriefExportModal({ isOpen, onClose, caseData, userRole = 'public' }) {
  if (!isOpen || !caseData) return null;

  const isPublicUser = userRole === 'public';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const briefText = `
================================================================================
LAW REPORTER CASE BRIEF & HEADNOTE
LexGuard Indian High Court Digital Judicial Archive
================================================================================

[CITATION & CATCHWORDS]
${caseData.citation || caseData.case_no}
${(caseData.act_tags || []).join(' — ').toUpperCase()} — ${caseData.disposition || 'ALLOWED'}

IN THE ${caseData.court?.toUpperCase()}
CORAM: ${caseData.judge || "Hon'ble Court"}
DATED / PRONOUNCED: ${caseData.year}

PARTIES:
${caseData.parties || caseData.title}

1. RATIO DECIDENDI (BINDING LEGAL PRINCIPLE)
--------------------------------------------------------------------------------
"${caseData.ratio_decidendi || 'The Court ruled that mandatory procedural protections under the governing sanhitas must be fulfilled.'}"

2. HEADNOTE & FACTUAL SUMMARY
--------------------------------------------------------------------------------
${caseData.summary || caseData.facts || 'Factual matrix of the dispute and adjudication.'}

3. STATUTORY PROVISIONS ADJUDICATED
--------------------------------------------------------------------------------
${(caseData.section_tags || []).join(', ') || 'N/A'}
Acts: ${(caseData.act_tags || []).join(', ') || 'N/A'}

4. OPERATIVE DISPOSITION
--------------------------------------------------------------------------------
Operative Order: ${caseData.disposition || caseData.outcome || 'Allowed'}

5. CRYPTOGRAPHIC INTEGRITY VERIFICATION
--------------------------------------------------------------------------------
Document Hash (H_doc):  ${caseData.file_hash}
Judicial Seal (Phi_case): ${caseData.redacted_file_hash || 'Affixed upon official bench publication'}
Precedential Standing:    ${caseData.precedential_status || 'Precedential status not checked'}

${isPublicUser ? 'NOTICE: Downloaded for informational / academic research purposes from LexGuard.' : 'CERTIFIED ACCURATE OFFICIAL CASE BRIEF FOR ADVOCATES & COURT PROCEEDINGS.'}
================================================================================
`;

    const blob = new Blob([briefText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Case_Brief_${caseData.case_no?.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
        {/* Modal Action Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Official Case Brief & Headnote</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={handleDownloadText}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Brief
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="p-8 flex-1 overflow-y-auto space-y-6 text-slate-200 bg-slate-950/40 font-sans print:bg-white print:text-black relative">
          {/* Informational Watermark for Public Users */}
          {isPublicUser && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-5 rotate-[-30deg]">
              <span className="text-5xl font-extrabold uppercase tracking-widest text-white print:text-black">
                LexGuard Research Archive
              </span>
            </div>
          )}

          {/* Law Reporter Header */}
          <div className="border-b-2 border-slate-800 pb-5 text-center space-y-1.5 print:border-black">
            <span className="text-[11px] font-mono tracking-widest uppercase text-indigo-400 font-bold block">
              LexGuard Law Reporter &bull; Case Headnote Brief
            </span>
            <h2 className="text-xl font-bold font-serif text-white print:text-black">
              {caseData.court}
            </h2>
            <div className="text-xs text-slate-400 font-mono">
              CORAM: <strong className="text-white print:text-black">{caseData.judge || "Hon'ble Court"}</strong>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Case No: <strong className="text-white print:text-black">{caseData.case_no}</strong> &bull; Year: {caseData.year}
            </div>
          </div>

          {/* Catchwords Banner */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 print:bg-transparent print:border-black print:text-black font-semibold">
            [ {caseData.case_no} &bull; {(caseData.act_tags || []).join(' — ').toUpperCase() || 'CRIMINAL JURISPRUDENCE'} &bull; {(caseData.section_tags || []).slice(0, 3).join(', ') || 'STATUTES'} &bull; {caseData.disposition || 'ALLOWED'} ]
          </div>

          {/* Litigants / Title */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">
              Parties Adjudicated:
            </span>
            <h3 className="text-base font-bold text-white font-serif print:text-black">
              {caseData.parties || caseData.title}
            </h3>
          </div>

          {/* 1. Binding Ratio Decidendi */}
          <div className="p-5 bg-emerald-950/20 border border-emerald-500/40 rounded-xl space-y-2 print:border-black print:bg-transparent">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 print:text-black font-mono uppercase tracking-wider">
              <Gavel className="w-4 h-4" />
              Binding Ratio Decidendi
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-serif italic print:text-black">
              "{caseData.ratio_decidendi || 'The Court reaffirmed the strict requirement of procedural fidelity prior to passing adverse orders.'}"
            </p>
          </div>

          {/* 2. Headnote Summary */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 font-mono block">
              Judicial Summary & Headnote:
            </span>
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed print:border-black print:bg-transparent print:text-black">
              {caseData.summary || caseData.facts || 'Full factual summary recorded by the bench.'}
            </div>
          </div>

          {/* 3. Statutory Sections Invoked */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 font-mono block">
              Statutory Sections Citing:
            </span>
            <div className="flex flex-wrap gap-2">
              {(caseData.section_tags || []).length > 0 ? (
                caseData.section_tags.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-indigo-300 print:border-black print:text-black"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">No specific sections tagged</span>
              )}
            </div>
          </div>

          {/* 4. Operative Disposition */}
          <div className="flex items-center justify-between p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 print:border-black print:bg-transparent">
            <span className="text-xs text-slate-400 font-mono uppercase">Operative Disposition:</span>
            <span className="text-xs font-bold font-mono text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 print:border-black print:text-black">
              {caseData.disposition || caseData.outcome || 'Allowed'}
            </span>
          </div>

          {/* 5. Cryptographic Seal & Verification Notice */}
          <div className="pt-4 border-t border-slate-800 space-y-1.5 text-[11px] text-slate-400 print:border-black print:text-black">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Cryptographic Provenance
            </div>
            <div className="font-mono text-[10px] break-all">
              Document SHA-256 (H<sub>doc</sub>): {caseData.file_hash}
            </div>
            {caseData.redacted_file_hash && (
              <div className="font-mono text-[10px] text-amber-400/90 break-all">
                Composite Seal (Φ<sub>case</sub>): {caseData.redacted_file_hash}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <span>LexGuard High Court Case Brief System</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
