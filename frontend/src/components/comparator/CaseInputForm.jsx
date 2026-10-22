import React, { useState } from 'react';
import { FileText, Sparkles, RotateCcw, ShieldCheck, HelpCircle } from 'lucide-react';

const PREFILL_TEMPLATES = [
  {
    id: 'bail_madras',
    name: 'Madras HC Anticipatory Bail (Sec 438 CrPC / Sec 482 BNSS)',
    data: {
      title: 'Ramanathan v. State (Inspector of Police, Crime Branch)',
      court: 'High Court of Judicature at Madras - Madurai Bench',
      practice_area: 'Criminal Law',
      procedural_posture: 'Crl.O.P. (MD) / Anticipatory Bail under Section 438 CrPC',
      remedy_sought: 'Anticipatory Bail',
      legal_provisions_raw: 'Section 438 CrPC, Section 41A CrPC, Section 482 BNSS',
      issues_raw:
        'Whether compliance with Section 41A CrPC guidelines is mandatory prior to custodial arrest?\nWhether petitioner with clean antecedents is entitled to pre-arrest bail in commercial dispute?',
      factual_summary:
        'Petitioner apprehends imminent arrest in a matter arising out of civil contractual disagreement. No antecedent criminal history. Fully willing to cooperate with interrogation.',
      outcome: 'Pending (Sub Judice)',
    },
  },
  {
    id: 'quash_fir',
    name: 'Quashing under Section 482 CrPC (S.498A IPC / S.85 BNS)',
    data: {
      title: 'K. Sundaram & Ors. v. State & Anr.',
      court: 'High Court of Judicature at Madras - Principal Seat at Chennai',
      practice_area: 'Criminal Law',
      procedural_posture: 'Criminal Original Petition under Section 482 CrPC',
      remedy_sought: 'Quashing of FIR and Final Report',
      legal_provisions_raw: 'Section 482 CrPC, Section 498A IPC, Section 406 IPC, Section 528 BNSS',
      issues_raw:
        'Whether continuation of criminal trial constitutes abuse of judicial process where allegations are omnibus?\nWhether private matrimonial settlement between parties justifies quashing under inherent jurisdiction?',
      factual_summary:
        'Allegations in the FIR are vague, omnibus, and devoid of specific overt acts against extended in-laws. The primary parties have arrived at an amicable settlement.',
      outcome: 'Pending (Sub Judice)',
    },
  },
  {
    id: 'ni_act',
    name: 'Cheque Dishonour under Section 138 NI Act',
    data: {
      title: 'M/s Precision Tech v. G. Swaminathan',
      court: 'High Court of Judicature at Madras - Principal Seat at Chennai',
      practice_area: 'Commercial / Negotiable Instruments',
      procedural_posture: 'Criminal Revision Case under Section 397/401 CrPC',
      remedy_sought: 'Setting aside of conviction under Section 138 NI Act',
      legal_provisions_raw: 'Section 138 Negotiable Instruments Act, Section 139 NI Act',
      issues_raw:
        'Whether statutory demand notice was dispatched to proper address within statutory period?\nWhether the statutory presumption under Section 139 NI Act stood rebutted by preponderance of probabilities?',
      factual_summary:
        'Cheque was issued merely as security deposit for future transactions that did not materialize. Complainant failed to prove existence of legally enforceable debt on date of drawal.',
      outcome: 'Pending (Sub Judice)',
    },
  },
];

export default function CaseInputForm({ onSubmit, loading, initialValues = {} }) {
  const [formData, setFormData] = useState({
    title: initialValues.title || '',
    court: initialValues.court || 'High Court of Judicature at Madras',
    practice_area: initialValues.practice_area || 'Criminal Law',
    procedural_posture: initialValues.procedural_posture || 'Crl.O.P. / Section 438 CrPC (Anticipatory Bail)',
    remedy_sought: initialValues.remedy_sought || 'Anticipatory Bail',
    legal_provisions_raw:
      (initialValues.legal_provisions || []).join(', ') || 'Section 438 CrPC, Section 41A CrPC, Section 528 BNSS',
    issues_raw:
      (initialValues.issues || []).join('\n') ||
      'Whether mandatory notice under Section 41A CrPC was served prior to arrest?\nWhether petitioner with clean antecedents is entitled to anticipatory bail?',
    factual_summary:
      initialValues.factual_summary ||
      'Petitioner apprehends custodial arrest in FIR arising out of contractual dispute. Clean antecedents and ready to cooperate.',
    outcome: initialValues.outcome || 'Pending (Sub Judice)',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyTemplate = (template) => {
    setFormData({
      ...template.data,
    });
  };

  const handleReset = () => {
    setFormData({
      title: '',
      court: 'High Court of Judicature at Madras',
      practice_area: 'Criminal Law',
      procedural_posture: '',
      remedy_sought: '',
      legal_provisions_raw: '',
      issues_raw: '',
      factual_summary: '',
      outcome: 'Pending (Sub Judice)',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const legal_provisions = formData.legal_provisions_raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const issues = formData.issues_raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      title: formData.title || 'Client Matter (Unregistered)',
      case_title: formData.title || 'Client Matter (Unregistered)',
      court_jurisdiction: formData.court,
      practice_area: formData.practice_area,
      procedural_status: formData.procedural_posture,
      remedy_sought: formData.remedy_sought,
      statutory_provisions: legal_provisions,
      legal_issues: issues,
      facts_summary: formData.factual_summary,
      outcome: formData.outcome,
    };

    onSubmit(payload);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-white">Your Matter Dimensions</h2>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Form
        </button>
      </div>

      {/* Quick Pre-fill Templates */}
      <div className="mt-3.5 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Quick Pre-fill Templates (Madras High Court Jurisprudence):
        </div>
        <div className="flex flex-wrap gap-2">
          {PREFILL_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => handleApplyTemplate(tmpl)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              {tmpl.name}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Matter Reference / Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Matter Heading / Case Reference
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Ramanathan v. State (Anticipatory Bail Petition)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Court / Forum */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Court / Forum Jurisdiction
              </label>
              <select
                name="court"
                value={formData.court}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="High Court of Judicature at Madras">High Court of Judicature at Madras (Principal Seat)</option>
                <option value="High Court of Judicature at Madras - Madurai Bench">High Court of Judicature at Madras (Madurai Bench)</option>
                <option value="Supreme Court of India">Supreme Court of India</option>
                <option value="High Court of Delhi">High Court of Delhi</option>
                <option value="High Court of Bombay">High Court of Bombay</option>
                <option value="Principal Sessions Court">Principal Sessions Court</option>
                <option value="Judicial Magistrate Court">Judicial Magistrate Court</option>
              </select>
            </div>

            {/* Practice Area */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Practice Area
              </label>
              <select
                name="practice_area"
                value={formData.practice_area}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="Criminal Law">Criminal Law</option>
                <option value="Constitutional Law">Constitutional Law</option>
                <option value="Commercial / Negotiable Instruments">Commercial / Negotiable Instruments</option>
                <option value="Civil & Property">Civil & Property</option>
                <option value="Cyber / Data Privacy">Cyber / Data Privacy</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Remedy Sought */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Remedy Sought / Prayer
              </label>
              <input
                type="text"
                name="remedy_sought"
                value={formData.remedy_sought}
                onChange={handleChange}
                placeholder="e.g. Anticipatory Bail, Quashing of FIR, Regular Bail"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Current Matter Outcome */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Matter Status
              </label>
              <select
                name="outcome"
                value={formData.outcome}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="Pending (Sub Judice)">Pending (Sub Judice - Excluded from score)</option>
                <option value="Allowed / Relief Granted">Allowed / Relief Granted</option>
                <option value="Dismissed / Rejected">Dismissed / Rejected</option>
                <option value="Disposed of with Directions">Disposed of with Directions</option>
              </select>
            </div>
          </div>

          {/* Legal Provisions */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Statutory Provisions & Acts (Comma-separated)
            </label>
            <input
              type="text"
              name="legal_provisions_raw"
              value={formData.legal_provisions_raw}
              onChange={handleChange}
              placeholder="e.g. Section 438 CrPC, Section 41A CrPC, Section 482 BNSS"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Issues Framed */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Issues Framed / Legal Questions (One per line)
            </label>
            <textarea
              name="issues_raw"
              rows={2}
              value={formData.issues_raw}
              onChange={handleChange}
              placeholder="Enter framed legal questions..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Factual Matrix */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Factual Matrix / Essential Material Facts
            </label>
            <textarea
              name="factual_summary"
              rows={3}
              value={formData.factual_summary}
              onChange={handleChange}
              placeholder="Summarize key facts relevant to statutory grounds..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Action Button & Ephemeral Privacy Notice */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Evaluating Precedent Dimensions & Statutes...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Run Precedent Alignment Analysis
              </>
            )}
          </button>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              <strong>Zero Storage Retention</strong>: User matter dimensions are evaluated ephemerally in RAM and never written to disk or audit logs.
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}
