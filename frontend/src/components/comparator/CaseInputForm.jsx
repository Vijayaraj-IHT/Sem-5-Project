import React, { useState } from 'react';

/**
 * CaseInputForm Component
 * Allows user to input their active matter's structured legal and factual dimensions.
 * Strictly adheres to privacy constraint:
 * "Comparing a user's case must not silently upload or retain their document.
 * Let the user enter structured facts/issues and optionally a short summary;
 * do not upload the original file."
 */
export default function CaseInputForm({ onSubmit, loading, initialValues = {} }) {
  const [formData, setFormData] = useState({
    title: initialValues.title || '',
    court: initialValues.court || 'High Court of Delhi',
    procedural_posture: initialValues.procedural_posture || 'Bail Application (CrPC 439)',
    remedy_sought: initialValues.remedy_sought || 'Regular Bail',
    legal_provisions_raw: (initialValues.legal_provisions || []).join(', ') || 'Section 41A CrPC, Section 37 NDPS Act',
    issues_raw: (initialValues.issues || []).join('\n') || 'Whether mandatory notice under Section 41A CrPC was served prior to arrest?\nWhether contraband quantity falls under commercial threshold?',
    factual_summary: initialValues.factual_summary || 'Accused was detained without prior compliance of statutory guidelines. Recovered intermediate quantity.',
    outcome: initialValues.outcome || 'Pending (Sub Judice)',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Parse provisions and issues arrays
    const legal_provisions = formData.legal_provisions_raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const issues = formData.issues_raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      title: formData.title,
      court: formData.court,
      procedural_posture: formData.procedural_posture,
      remedy_sought: formData.remedy_sought,
      legal_provisions,
      issues,
      factual_summary: formData.factual_summary,
      outcome: formData.outcome,
    };

    onSubmit(payload);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col h-full">
      <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Your Matter Dimensions
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Enter structured facts and legal issues. Documents are never stored or retained.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Matter Title / Case Reference */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Matter Title / Reference (Client or Petition Heading)
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. State v. Rajesh Kumar (Bail Petition)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Court / Forum */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Court / Forum
              </label>
              <select
                name="court"
                value={formData.court}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="Supreme Court of India">Supreme Court of India</option>
                <option value="High Court of Delhi">High Court of Delhi</option>
                <option value="High Court of Bombay">High Court of Bombay</option>
                <option value="High Court of Madras">High Court of Madras</option>
                <option value="High Court of Allahabad">High Court of Allahabad</option>
                <option value="Sessions Court">Sessions Court / Special Court</option>
                <option value="Magistrate Court">Magistrate Court</option>
                <option value="Tribunal / Appellate Authority">Tribunal / Appellate Authority</option>
              </select>
            </div>

            {/* Procedural Posture */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Procedural Posture
              </label>
              <input
                type="text"
                name="procedural_posture"
                value={formData.procedural_posture}
                onChange={handleChange}
                placeholder="e.g. Bail Application (CrPC 439), Sec 482 Quashing"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                placeholder="e.g. Regular Bail, Quashing of FIR, Stay"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Current Matter Outcome */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Current Status / Disposition
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
              Legal Provisions / Statutory Sections (Comma-separated)
            </label>
            <input
              type="text"
              name="legal_provisions_raw"
              value={formData.legal_provisions_raw}
              onChange={handleChange}
              placeholder="e.g. Section 41A CrPC, Section 302 IPC, Section 37 NDPS Act"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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
              placeholder="Enter legal questions or points for determination..."
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
              placeholder="Summarize key facts relevant to the statutory conditions..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Action Button & Privacy Note */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-white rounded-lg font-medium text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Analyzing Precedent Alignment...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Compare with Selected Precedent
              </>
            )}
          </button>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 justify-center">
            <svg className="w-3.5 h-3.5 text-emerald-500/80 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>In-memory comparison only. Facts are not saved to database or public audit logs.</span>
          </div>
        </div>
      </form>
    </div>
  );
}
