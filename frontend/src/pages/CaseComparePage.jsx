import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { comparisonApi } from '../api/comparison';
import PrecedentSelector from '../components/comparator/PrecedentSelector';
import CaseInputForm from '../components/comparator/CaseInputForm';
import ScoreCard from '../components/comparator/ScoreCard';
import ComparisonMatrix from '../components/comparator/ComparisonMatrix';

/**
 * CaseComparePage Component
 * Precedent Comparator screen that evaluates structured user matter dimensions against
 * published landmark precedents.
 * Demonstrates explainable score, dimension-by-dimension matrix, and dynamic weight renormalization.
 */
export default function CaseComparePage() {
  const [selectedCase, setSelectedCase] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRunComparison = async (userData) => {
    if (!selectedCase) {
      setError('Please select a published precedent first.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await comparisonApi.compareCases({
        user_case: userData,
        precedent_id: selectedCase.id,
      });
      setComparisonResult(result);
    } catch (err) {
      console.error('Comparison error:', err);
      setError(
        err.response?.data?.detail ||
          'Failed to perform case comparison. Ensure backend server is reachable.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Precedent Alignment Comparator
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Indian Jurisprudence
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Compare statutory conditions, procedural posture, remedies, and factual matrix between your matter and published landmark rulings with explainable mathematical alignment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/verify"
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Verify Document Integrity
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-300 text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Input Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <CaseInputForm
          onSubmit={handleRunComparison}
          loading={loading}
        />
        <PrecedentSelector
          selectedCase={selectedCase}
          onSelectCase={(c) => {
            setSelectedCase(c);
            setComparisonResult(null); // Reset result on precedent switch
          }}
        />
      </div>

      {/* Comparison Results Section */}
      {comparisonResult && (
        <div className="mt-8 space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              Alignment Analysis Results
            </h2>
            <span className="text-xs text-slate-400">
              Evaluated against <strong className="text-slate-200">{comparisonResult.precedent_case?.title}</strong>
            </span>
          </div>

          {/* Alignment Score Summary Card */}
          <ScoreCard score={comparisonResult.alignment_score} />

          {/* Dimension by Dimension Comparison Matrix */}
          <ComparisonMatrix
            dimensions={comparisonResult.dimensions}
            score={comparisonResult.alignment_score}
          />
        </div>
      )}
    </div>
  );
}
