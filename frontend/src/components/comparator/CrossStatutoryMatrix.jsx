import React from 'react';
import { BookOpen, GitCompare, ArrowRightLeft, Quote } from 'lucide-react';

const STATUTE_CROSS_REFERENCE_MAP = [
  {
    topic: 'Anticipatory Bail',
    crpc_ipc: 'Section 438 CrPC',
    bnss_bns: 'Section 482 BNSS',
    note: 'Direction for grant of bail to person apprehending arrest',
  },
  {
    topic: 'Inherent Powers of High Court (Quashing)',
    crpc_ipc: 'Section 482 CrPC',
    bnss_bns: 'Section 528 BNSS',
    note: 'Saving of inherent power of High Court to prevent abuse of process',
  },
  {
    topic: 'Notice of Appearance (Pre-arrest Safeguard)',
    crpc_ipc: 'Section 41A CrPC',
    bnss_bns: 'Section 35(3) BNSS',
    note: 'Mandatory notice before arrest in offences punishable with imprisonment <= 7 years',
  },
  {
    topic: 'Regular Bail / High Court Powers',
    crpc_ipc: 'Section 439 CrPC',
    bnss_bns: 'Section 483 BNSS',
    note: 'Special powers of High Court or Court of Session regarding bail',
  },
  {
    topic: 'Cruelty to Woman',
    crpc_ipc: 'Section 498A IPC',
    bnss_bns: 'Section 85 BNS',
    note: 'Husband or relative of husband of a woman subjecting her to cruelty',
  },
  {
    topic: 'Cheating and Dishonestly Inducing Delivery',
    crpc_ipc: 'Section 420 IPC',
    bnss_bns: 'Section 318(4) BNS',
    note: 'Cheating with inducement to deliver property or make/alter security',
  },
  {
    topic: 'Criminal Breach of Trust',
    crpc_ipc: 'Section 406 IPC',
    bnss_bns: 'Section 316(2) BNS',
    note: 'Punishment for criminal breach of trust',
  },
];

export default function CrossStatutoryMatrix({ crossMatrix = {} }) {
  const { user_provisions = [], precedents = [] } = crossMatrix;

  if (!precedents || precedents.length === 0) {
    return null;
  }

  // Find relevant transition rows based on user provisions or precedent sections
  const allMentionedText = [
    ...user_provisions,
    ...precedents.flatMap((p) => [...(p.section_tags || []), ...(p.act_tags || [])]),
  ].join(' ');

  const activeTransitions = STATUTE_CROSS_REFERENCE_MAP.filter(
    (m) =>
      allMentionedText.toLowerCase().includes(m.crpc_ipc.toLowerCase()) ||
      allMentionedText.toLowerCase().includes(m.bnss_bns.toLowerCase()) ||
      allMentionedText.toLowerCase().includes(m.topic.toLowerCase())
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-serif">
              Cross-Statutory Divergence & Transition Analysis
            </h3>
            <p className="text-xs text-slate-400">
              Comparative analysis of cited provisions, dual CrPC/BNSS mapping, and judicial ratio decidendi.
            </p>
          </div>
        </div>
      </div>

      {/* Statutory Cross-Reference Mapping (CrPC <-> BNSS / IPC <-> BNS) */}
      {activeTransitions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
            Relevant Statutory Transitions (Old Code &bull; New Sanhita)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeTransitions.map((t, idx) => (
              <div
                key={idx}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="text-xs font-bold text-white line-clamp-1">{t.topic}</div>
                <div className="flex items-center justify-between text-xs font-mono bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-amber-400">{t.crpc_ipc}</span>
                  <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500 shrink-0 mx-1" />
                  <span className="text-emerald-400">{t.bnss_bns}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{t.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Side-by-Side Sections Citing Comparison */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          Provisions Invoked Across Compared Matters
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* User Matter */}
          <div className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-4 space-y-2">
            <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
              Your Matter
            </span>
            <div className="text-xs font-bold text-white">Invoked Provisions</div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {user_provisions.length > 0 ? (
                user_provisions.map((p, pidx) => (
                  <span
                    key={pidx}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono"
                  >
                    {p}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">None specified</span>
              )}
            </div>
          </div>

          {/* Precedents */}
          {precedents.map((p, pidx) => (
            <div
              key={p.case_id}
              className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Precedent #{pidx + 1}
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  {p.disposition}
                </span>
              </div>
              <div className="text-xs font-bold text-white line-clamp-1">{p.title}</div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(p.section_tags || []).length > 0 ? (
                  p.section_tags.map((s, sidx) => (
                    <span
                      key={sidx}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">General principles</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ratio Decidendi & Core Legal Holding */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Quote className="w-3.5 h-3.5 text-indigo-400" />
          Precedent Binding Ratio & Judicial Holdings
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {precedents.map((p, pidx) => (
            <div
              key={p.case_id}
              className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span className="font-mono text-slate-300 font-semibold">{p.case_no}</span>
                  <span>{p.year}</span>
                </div>
                <div className="text-xs font-bold text-white mb-2">{p.title}</div>
                <p className="text-xs text-slate-300 leading-relaxed font-serif italic border-l-2 border-indigo-500 pl-3 py-0.5">
                  "{p.ratio_decidendi || 'The Court established that statutory procedural safeguards must be strictly adhered to before adverse judicial orders are passed.'}"
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span>{p.court}</span>
                <span className="font-mono text-indigo-400">{p.precedential_status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
