import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Scale,
  ArrowRight,
  ShieldAlert,
  FileText,
  Gavel,
  Landmark,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * ActsExplorerPage Component
 * 
 * Statutory & Provision Explorer for Indian Court Cases.
 * Allows advocates, judicial staff, and citizens to browse judgments
 * organized by Indian Penal/Procedural Codes, Constitution, and Special Acts.
 */
const ACTS_CATALOG = [
  {
    id: 'crpc',
    name: 'Code of Criminal Procedure, 1973 (Cr.P.C.)',
    shortName: 'Cr.P.C.',
    newEquiv: 'Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)',
    category: 'Criminal Procedure',
    description: 'Governs criminal investigations, trials, bail powers, and High Court inherent quashing jurisdiction.',
    badgeColor: 'bg-rose-950/70 border-rose-500/40 text-rose-300',
    sections: [
      {
        section: 'Section 482',
        title: 'Saving of inherent powers of High Court',
        desc: 'Quashing of FIR, Charge Sheet, and criminal complaint proceedings to prevent abuse of process.',
        query: 'Section 482 CrPC',
        casesCount: '1,240+ Judgments',
      },
      {
        section: 'Section 438',
        title: 'Direction for grant of bail to person apprehending arrest',
        desc: 'Anticipatory bail applications before the High Court or Sessions Court.',
        query: 'Section 438 Anticipatory Bail',
        casesCount: '890+ Judgments',
      },
      {
        section: 'Section 439',
        title: 'Special powers of High Court or Court of Session regarding bail',
        desc: 'Regular bail and relaxation of onerous bail conditions.',
        query: 'Section 439 Regular Bail',
        casesCount: '950+ Judgments',
      },
      {
        section: 'Section 125',
        title: 'Order for maintenance of wives, children and parents',
        desc: 'Interim and permanent monthly maintenance awards in family and matrimonial disputes.',
        query: 'Section 125 Maintenance',
        casesCount: '410+ Judgments',
      },
      {
        section: 'Section 313',
        title: 'Power to examine the accused',
        desc: 'Evidentiary weight of answers given during accused examination at trial.',
        query: 'Section 313 Examination Accused',
        casesCount: '320+ Judgments',
      },
    ],
  },
  {
    id: 'ipc',
    name: 'Indian Penal Code, 1860 (IPC)',
    shortName: 'IPC',
    newEquiv: 'Bharatiya Nyaya Sanhita, 2023 (BNS)',
    category: 'Substantive Criminal Law',
    description: 'Substantive penal offences defined under general Indian criminal jurisprudence.',
    badgeColor: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
    sections: [
      {
        section: 'Section 420',
        title: 'Cheating and dishonestly inducing delivery of property',
        desc: 'Criminal breach of trust vs commercial breach of contract distinction.',
        query: 'Section 420 Cheating',
        casesCount: '1,120+ Judgments',
      },
      {
        section: 'Section 498-A',
        title: 'Husband or relative of husband subjecting woman to cruelty',
        desc: 'Matrimonial cruelty, dowry allegations, and quash petitions by distant in-laws.',
        query: 'Section 498A Cruelty',
        casesCount: '670+ Judgments',
      },
      {
        section: 'Section 302',
        title: 'Punishment for murder',
        desc: 'Circumstantial evidence, chain of custody, and conviction appeals.',
        query: 'Section 302 Murder Appeal',
        casesCount: '580+ Judgments',
      },
      {
        section: 'Section 304-A',
        title: 'Causing death by negligence',
        desc: 'Motor vehicle accident liability and rash & negligent act jurisprudence.',
        query: 'Section 304A Negligence',
        casesCount: '290+ Judgments',
      },
    ],
  },
  {
    id: 'ni-act',
    name: 'Negotiable Instruments Act, 1881',
    shortName: 'NI Act',
    newEquiv: 'Special Commercial Statute',
    category: 'Commercial & Financial Law',
    description: 'Quasi-criminal prosecution for dishonour of negotiable instruments and cheques.',
    badgeColor: 'bg-blue-950/70 border-blue-500/40 text-blue-300',
    sections: [
      {
        section: 'Section 138',
        title: 'Dishonour of cheque for insufficiency of funds',
        desc: 'Statutory legal notice compliance, limitation periods, and legally enforceable debt presumption.',
        query: 'Section 138 Cheque Bounce',
        casesCount: '1,560+ Judgments',
      },
      {
        section: 'Section 141',
        title: 'Offences by companies and vicarious liability',
        desc: 'Prosecution of Non-Executive and Independent Directors in corporate cheque bounce cases.',
        query: 'Section 141 Vicarious Liability Director',
        casesCount: '780+ Judgments',
      },
      {
        section: 'Section 139',
        title: 'Presumption in favour of holder',
        desc: 'Rebuttal of statutory presumption by preponderance of probabilities.',
        query: 'Section 139 Presumption Debt',
        casesCount: '490+ Judgments',
      },
    ],
  },
  {
    id: 'constitution',
    name: 'Constitution of India, 1950',
    shortName: 'Constitution',
    newEquiv: 'Supreme Law of the Land',
    category: 'Constitutional & Administrative Law',
    description: 'Fundamental rights, administrative discretion, and constitutional extraordinary writ jurisdiction.',
    badgeColor: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
    sections: [
      {
        section: 'Article 226',
        title: 'Power of High Courts to issue certain writs',
        desc: 'Writ of Mandamus, Certiorari, Habeas Corpus, and Quo Warranto against State action.',
        query: 'Article 226 Writ Petition',
        casesCount: '2,100+ Judgments',
      },
      {
        section: 'Article 227',
        title: 'Power of superintendence over all courts by the High Court',
        desc: 'Judicial supervision over subordinate civil courts, tribunals, and procedural arbitrariness.',
        query: 'Article 227 Superintendence',
        casesCount: '840+ Judgments',
      },
      {
        section: 'Article 21',
        title: 'Protection of life and personal liberty',
        desc: 'Speedy trial rights, procedural fairness, and fundamental liberty in detention matters.',
        query: 'Article 21 Personal Liberty',
        casesCount: '620+ Judgments',
      },
    ],
  },
];

const ActsExplorerPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedActId, setSelectedActId] = useState('crpc');
  const [searchTerm, setSearchTerm] = useState('');

  const currentAct = ACTS_CATALOG.find((a) => a.id === selectedActId) || ACTS_CATALOG[0];

  const handleSectionClick = (query) => {
    const targetUrl = isAuthenticated ? '/search' : '/search/public';
    navigate(`${targetUrl}?q=${encodeURIComponent(query)}`);
  };

  // Filter sections by search term
  const filteredSections = currentAct.sections.filter(
    (sec) =>
      sec.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sec.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8 pb-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" /> Statutory Jurisprudence Catalog
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-white">
            Acts & Provisions Explorer
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Browse Madras High Court judgments categorized by statutory enactments. 
            Click any section to inspect the repository's published rulings and ratios.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(isAuthenticated ? '/search' : '/search/public')}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <Search className="w-4 h-4 text-amber-500" />
            <span>Open Advanced Search</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Acts Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold px-1">
            Statutory Enactments
          </h2>
          <div className="space-y-2.5">
            {ACTS_CATALOG.map((act) => {
              const isSelected = act.id === selectedActId;
              return (
                <button
                  key={act.id}
                  onClick={() => {
                    setSelectedActId(act.id);
                    setSearchTerm('');
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800 border-amber-500/80 shadow-lg ring-1 ring-amber-500/20'
                      : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/70 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm text-white font-serif">{act.shortName}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${act.badgeColor}`}>
                      {act.category}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1.5 line-clamp-1">{act.name}</div>
                  <div className="mt-3 pt-2.5 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{act.sections.length} Key Provisions</span>
                    <span className={`flex items-center gap-1 ${isSelected ? 'text-amber-400 font-medium' : 'text-slate-500'}`}>
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* New Criminal Laws Notice Card */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 text-xs text-slate-400 space-y-2 mt-4">
            <div className="flex items-center gap-1.5 font-semibold text-amber-400 font-mono">
              <Landmark className="w-4 h-4" /> Dual-Statute Cross Indexing
            </div>
            <p className="leading-relaxed">
              LexGuard automatically indexes legacy acts (IPC, CrPC, Evidence Act) alongside their 
              new equivalents (BNS, BNSS, BSA) for seamless precedent discovery.
            </p>
          </div>
        </div>

        {/* Right Column: Provisions & Sections Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Act Banner */}
          <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className={`text-xs font-mono px-2.5 py-0.5 rounded border ${currentAct.badgeColor}`}>
                {currentAct.category}
              </span>
              <span className="text-xs font-mono text-slate-400">
                New Equivalent: <span className="text-slate-200">{currentAct.newEquiv}</span>
              </span>
            </div>
            <h2 className="text-xl font-bold font-serif text-white">{currentAct.name}</h2>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{currentAct.description}</p>

            {/* Filter Input inside Section */}
            <div className="mt-4 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Filter ${currentAct.shortName} provisions by section or legal subject...`}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Sections List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
              <span>PROVISIONS & RECORD COUNTS</span>
              <span>Showing {filteredSections.length} Sections</span>
            </div>

            {filteredSections.map((sec) => (
              <div
                key={sec.section}
                onClick={() => handleSectionClick(sec.query)}
                className="group p-5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/60 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold font-mono text-sm text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {sec.section}
                    </span>
                    <h3 className="font-semibold text-sm text-slate-100 group-hover:text-amber-300 transition-colors font-serif">
                      {sec.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed pr-4">
                    {sec.desc}
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-700/60">
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                    {sec.casesCount}
                  </span>
                  <span className="text-xs font-semibold text-amber-500 group-hover:text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Explore Cases</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}

            {filteredSections.length === 0 && (
              <div className="p-8 text-center rounded-xl bg-slate-800/40 border border-slate-700 text-slate-400 text-sm">
                No sections found matching "{searchTerm}". Try a different keyword or search query.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActsExplorerPage;
