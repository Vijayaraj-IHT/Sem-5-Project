import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Scale,
  ShieldCheck,
  Building,
  Calendar,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { uploadCase } from '../api/cases';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const COURTS = [
  'Supreme Court of India',
  'High Court of Delhi',
  'High Court of Bombay',
  'High Court of Calcutta',
  'High Court of Madras',
  'High Court of Karnataka',
  'National Company Law Tribunal (NCLT)',
  'National Green Tribunal (NGT)',
  'District Court',
  'Central Administrative Tribunal (CAT)',
];

export default function CaseUploadPage() {
  const { user, role, loading: authLoading } = useAuth();
  const currentRole = role || user?.role || 'public';

  // Form Fields
  const [title, setTitle] = useState('');
  const [caseNo, setCaseNo] = useState('');
  const [court, setCourt] = useState(COURTS[0]);
  const [year, setYear] = useState(() => new Date().getFullYear().toString());
  const [judge, setJudge] = useState('');
  const [parties, setParties] = useState('');
  const [description, setDescription] = useState('');

  // File Upload State
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Status & Feedback
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // File drag handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFile = e.dataTransfer.files[0];
      validateAndSetFile(selectedFile);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (f) => {
    const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
    const validExtensions = ['.pdf', '.txt', '.doc', '.docx'];

    if (!validExtensions.includes(ext)) {
      setError(`Unsupported file type '${ext}'. Please upload a valid .pdf, .docx, .doc, or .txt document.`);
      return;
    }

    if (f.size > 20 * 1024 * 1024) {
      setError('File size exceeds the 20MB maximum limit allowed.');
      return;
    }

    setError(null);
    setFile(f);
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopyHash = () => {
    if (!successData?.file_hash) return;
    navigator.clipboard.writeText(successData.file_hash).then(() => {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2500);
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Document title is required.');
      return;
    }

    if (!file) {
      setError('Please select or drop a legal document file to upload.');
      return;
    }

    const yearNum = parseInt(year, 10);
    if (!yearNum || yearNum < 1800 || yearNum > 2100) {
      setError('Please provide a valid 4-digit calendar year (e.g. 2024).');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(25);

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('case_no', (caseNo.trim() || `GEN-${Date.now().toString().slice(-6)}`));
      formData.append('court', court);
      formData.append('year', yearNum.toString());
      if (judge.trim()) formData.append('judge', judge.trim());
      if (parties.trim()) formData.append('parties', parties.trim());
      if (description.trim()) formData.append('summary', description.trim());
      formData.append('file', file);

      setUploadProgress(65);
      const res = await uploadCase(formData);
      setUploadProgress(100);

      setSuccessData(res);
      // Reset form
      setTitle('');
      setCaseNo('');
      setDescription('');
      setJudge('');
      setParties('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Case upload failed.';
      setError(msg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Auth Guard
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" message="Checking judicial upload privileges..." />
      </div>
    );
  }

  const isStaff = ['senior_staff', 'junior_staff', 'court_staff'].includes(currentRole);

  if (!isStaff) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-slate-900 border border-slate-700 rounded-xl text-center shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-4 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white font-serif mb-2">Ingestion Clearance Restricted</h2>
        <p className="text-slate-300 mb-6">
          Uploading official court judgments and initiating cryptographic hashing is restricted to authorized Registry Staff.
        </p>
        <Link
          to="/search"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg transition-colors shadow-sm"
        >
          Explore Published Repository
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-serif text-white tracking-tight">
              Upload Legal Document
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Ingest judicial rulings, compute SHA-256 integrity fingerprints, and register for staff approval.
            </p>
          </div>
        </div>

        <Link
          to="/approval-queue"
          className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
        >
          <span>Approval Queue</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Success Banner */}
      {successData && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 shadow-md animate-fade-in text-xs space-y-3">
          <div className="flex items-center gap-3 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Document Successfully Ingested & Hashed!</span>
          </div>

          <p className="text-slate-300">
            Case <strong className="text-white font-mono">{successData.case_no}</strong> has been enrolled into the Senior Staff Approval Queue with status <span className="text-amber-400 font-semibold uppercase">{successData.status}</span>.
          </p>

          {/* Cryptographic Hash */}
          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 space-y-1.5 font-mono">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" /> Cryptographic SHA-256 Fingerprint
              </span>
              <button
                type="button"
                onClick={handleCopyHash}
                className="text-slate-400 hover:text-white flex items-center gap-1 normal-case font-sans"
              >
                {copiedHash ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 text-[11px]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Copy Hash</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-amber-300 break-all select-all">{successData.file_hash}</p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSuccessData(null)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs"
            >
              Upload Another Case
            </button>
            <Link
              to="/approval-queue"
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 inline-flex items-center gap-1"
            >
              <span>View in Queue</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-xs text-rose-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-rose-200">Upload Issue</p>
            <p className="mt-0.5 leading-relaxed">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-200 text-base leading-none"
          >
            &times;
          </button>
        </div>
      )}

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-md space-y-6">
        {/* Title Input */}
        <div>
          <label htmlFor="case-title-input" className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-2">
            Judgment / Document Title <span className="text-amber-400">*</span>
          </label>
          <input
            id="case-title-input"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. State of Karnataka vs. Union of India & Ors."
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden transition-colors"
          />
        </div>

        {/* Case Number & Court Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Case Number */}
          <div>
            <label htmlFor="case-number-input" className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-2">
              Case Number / Citation Record
            </label>
            <input
              id="case-number-input"
              type="text"
              value={caseNo}
              onChange={(e) => setCaseNo(e.target.value)}
              placeholder="e.g. WP(C) 1042/2024 or 2024 INSC 582"
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden transition-colors font-mono"
            />
          </div>

          {/* Court Dropdown */}
          <div>
            <label htmlFor="court-select-input" className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-2">
              Jurisdiction / Court <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <select
                id="court-select-input"
                value={court}
                onChange={(e) => setCourt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-hidden transition-colors appearance-none"
              >
                {COURTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <Building className="w-4 h-4 text-slate-500 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Year, Judge, Parties Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Year */}
          <div>
            <label htmlFor="calendar-year-input" className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-2">
              Year of Judgment <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <input
                id="calendar-year-input"
                type="number"
                min="1850"
                max="2099"
                required
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-hidden transition-colors font-mono"
              />
              <Calendar className="w-4 h-4 text-slate-500 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Judge */}
          <div>
            <label htmlFor="bench-judges-input" className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-2">
              Bench / Presiding Judge(s)
            </label>
            <input
              id="bench-judges-input"
              type="text"
              value={judge}
              onChange={(e) => setJudge(e.target.value)}
              placeholder="e.g. Chandrachud, J."
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden transition-colors"
            />
          </div>

          {/* Parties */}
          <div>
            <label htmlFor="parties-involved-input" className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-2">
              Parties Involved
            </label>
            <input
              id="parties-involved-input"
              type="text"
              value={parties}
              onChange={(e) => setParties(e.target.value)}
              placeholder="e.g. Appellant v. Respondent"
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden transition-colors"
            />
          </div>
        </div>

        {/* Description / Summary */}
        <div>
          <label htmlFor="document-summary-input" className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-2">
            Description & Legal Ratio Summary
          </label>
          <textarea
            id="document-summary-input"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief judicial summary, held principles, statutory provisions referenced, or headnotes..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-4 text-sm text-white placeholder-slate-500 focus:outline-hidden transition-colors resize-y leading-relaxed"
          />
        </div>

        {/* File Drag-and-Drop Area */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-2">
            Legal Document File <span className="text-amber-400">*</span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload-input"
          />

          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                isDragging
                  ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-950/60'
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
                <UploadCloud className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-white">
                Drag & drop a document here, or <span className="text-amber-400 underline">click to browse</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Accepts PDF, DOCX, DOC, or TXT (Max size: 20MB)
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>SHA-256 hash computed on physical bytes upon upload</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{formatFileSize(file.size)}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                title="Remove selected document"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Upload Progress Bar */}
        {uploading && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>Computing SHA-256 fingerprint & ingesting...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={uploading || !file || !title.trim()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-sm rounded-lg shadow-md shadow-amber-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            {uploading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                Ingesting Document...
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                Upload Case
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
