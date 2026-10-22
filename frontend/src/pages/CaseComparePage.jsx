import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Scale, FileText, Printer, CheckCircle2 } from 'lucide-react';
import { comparisonApi } from '../api/comparison';
import PrecedentTray from '../components/comparator/PrecedentTray';
import PrecedentModal from '../components/comparator/PrecedentModal';
import CaseInputForm from '../components/comparator/CaseInputForm';
import MultiComparisonMatrix from '../components/comparator/MultiComparisonMatrix';
import CrossStatutoryMatrix from '../components/comparator/CrossStatutoryMatrix';
import ComparisonExportModal from '../components/comparator/ComparisonExportModal';

/**
 * CaseComparePage Component
 * Precedent Alignment Comparator supporting simultaneous multi-precedent comparison (1 to 3 cases)
 * with top selection tray, explainable dimensional matrix, and CrPC/BNSS cross-statutory divergence.
 */
export default function CaseComparePage() {
  const [selectedPrecedents, setSelectedPrecedents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState(null);
  const [multiComparisonResult, setMultiComparisonResult] = useState(null);
  const [activeUserCase, setActiveUserCase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Automatically pre-load initial published precedents to populate tray
  useEffect(() => {
    async function loadInitialPrecedents() {
      try {
        const data = await comparisonApi.getPublishedPrecedents();
        if (data && data.length > 0) {
          // Pre-populate with first 2 precedents
          setSelectedPrecedents(data.slice(0, Math.min(2, data.length)));
        }
      } catch (err) {
        console.error('Failed to pre-load published precedents:', err);
      }
    }
    loadInitialPrecedents();
  }, []);

  const handleOpenModal = (slotIndex = null) => {
    setActiveSlotIndex(slotIndex);
    setIsModalOpen(true);
  };

  const handleSelectPrecedent = (precedent, slotIndex) => {
    setSelectedPrecedents((prev) => {
      const next = [...prev];
      if (slotIndex !== null && slotIndex !== undefined && slotIndex < 3) {
        next[slotIndex] = precedent;
      } else {
        if (!next.some((p) => p.id === precedent.id) && next.length < 3) {
          next.push(precedent);
        }
      }
      return next.filter(Boolean);
    });
    setMultiComparisonResult(null); // Reset result on precedent changes
  };

  const handleRemovePrecedent = (precedentId) => {
    setSelectedPrecedents((prev) => prev.filter((p) => p.id !== precedentId));
    setMultiComparisonResult(null);
  };

  const handleRunComparison = async (userData) => {
    if (selectedPrecedents.length === 0) {
      setError('Please select at least 1 published precedent in the tray above.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        precedent_case_ids: selectedPrecedents.map((p) => p.id),
        case_title: userData.title,
        court_jurisdiction: userData.court_jurisdiction,
        practice_area: userData.practice_area,
        procedural_status: userData.procedural_status,
        remedy_sought: userData.remedy_sought,
        statutory_provisions: userData.statutory_provisions,
        legal_issues: userData.legal_issues,
        facts_summary: userData.facts_summary,
        outcome: userData.outcome,
      };

      const result = await comparisonApi.compareMultiCases(payload);
      setMultiComparisonResult(result);
      setActiveUserCase(userData);
    } catch (err) {
      console.error('Multi comparison error:', err);
      setError(
        err.response?.data?.detail ||
          'Failed to perform multi-precedent comparison. Ensure backend server is reachable.'
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
            <h1 className="text-2xl font-bold tracking-tight text-white font-serif">
              Precedent Alignment Comparator
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              Madras High Court & Apex Jurisprudence
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Evaluate your client matter against up to 3 landmark rulings simultaneously. Analyze statutory divergence across CrPC/BNSS and IPC/BNS with deterministic mathematical alignment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/verify"
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Verify Document Integrity
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-300 text-xs font-medium cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Top Precedent Selection Tray (Up to 3 Slots) */}
      <PrecedentTray
        selectedPrecedents={selectedPrecedents}
        onOpenModal={handleOpenModal}
        onRemovePrecedent={handleRemovePrecedent}
        maxPrecedents={3}
      />

      {/* 2. Matter Input Form */}
      <div className="grid grid-cols-1 gap-6 items-start">
        <CaseInputForm onSubmit={handleRunComparison} loading={loading} />
      </div>

      {/* 3. Multi-Comparison Results Section */}
      {multiComparisonResult && (
        <div className="mt-8 space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
              <h2 className="text-lg font-bold text-white font-serif">
                Multi-Precedent Comparative Matrix
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                {multiComparisonResult.results?.length} Precedents Evaluated
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Export Comparison Memorandum
              </button>
            </div>
          </div>

          {/* Dimension by Dimension Comparison Matrix */}
          <MultiComparisonMatrix
            multiResult={multiComparisonResult}
            userCase={activeUserCase}
          />

          {/* Cross-Statutory Divergence & Sanhita Transition Analysis */}
          <CrossStatutoryMatrix
            crossMatrix={multiComparisonResult.cross_statutory_matrix}
          />
        </div>
      )}

      {/* Precedent Selector Modal */}
      <PrecedentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectPrecedent={handleSelectPrecedent}
        selectedIds={selectedPrecedents.map((p) => p.id)}
        targetSlotIndex={activeSlotIndex}
      />

      {/* Export / Printable Memorandum Modal */}
      <ComparisonExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        multiResult={multiComparisonResult}
        userCase={activeUserCase}
      />
    </div>
  );
}
