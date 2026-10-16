import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { verificationApi } from '../api/verification';

/**
 * VerifyDocumentPage Component
 * Client-side cryptographic document integrity verifier.
 * Strictly calculates SHA-256 locally in the browser using Web Crypto API.
 * Never uploads local documents merely to hash them.
 * Employs precise labels: "SHA-256 matched", "Audit chain verified", and
 * "Precedential status not checked" (unless verified).
 */
export default function VerifyDocumentPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [computedHash, setComputedHash] = useState('');
  const [inputHash, setInputHash] = useState('');
  const [isHashing, setIsHashing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Compute SHA-256 strictly in the browser using Web Crypto API
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 30MB)
    if (file.size > 30 * 1024 * 1024) {
      setError('File exceeds 30MB limit. Please select a smaller PDF or DOCX file.');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setVerificationResult(null);
    setIsHashing(true);

    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      setComputedHash(hashHex);
      setInputHash(hashHex);

      // Auto-trigger lookup on client hash completion
      await performHashLookup(hashHex);
    } catch (err) {
      console.error('Client cryptographic hashing error:', err);
      setError('Failed to compute document hash in browser. Please try again.');
    } finally {
      setIsHashing(false);
    }
  };

  const performHashLookup = async (hashToVerify) => {
    const cleanHash = hashToVerify.trim().toLowerCase();
    if (!cleanHash || cleanHash.length !== 64 || !/^[a-f0-9]{64}$/.test(cleanHash)) {
      setError('Please provide a valid 64-character hexadecimal SHA-256 hash.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const result = await verificationApi.lookupHash(cleanHash);
      setVerificationResult(result);
    } catch (err) {
      console.error('Hash verification failed:', err);
      setError(
        err.response?.data?.detail ||
          'Verification lookup failed. Please check backend connectivity.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    performHashLookup(inputHash);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setComputedHash('');
    setInputHash('');
    setVerificationResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Document Integrity Verifier
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Web Crypto Client Verification
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Verify whether a legal document matches a published Indian court judgment. Hashing is performed strictly within your browser—your file is never uploaded to compute its digest.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/compare"
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Precedent Comparator
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

      {/* Main Verification Input Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Method 1: Local File Web Crypto Dropzone */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Select Local Document (PDF / DOCX)
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                100% Client-Side
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Select a judgment file to compute its SHA-256 fingerprint in-memory. The raw file will not leave your device.
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/60 hover:bg-slate-950 rounded-xl p-8 text-center cursor-pointer transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-emerald-500/20 text-slate-400 group-hover:text-emerald-400 flex items-center justify-center mx-auto transition-colors">
                {isHashing ? (
                  <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </div>
              <p className="mt-3 text-xs font-medium text-slate-200">
                {selectedFile ? selectedFile.name : 'Click to select PDF or DOCX file'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB • Click to choose a different file`
                  : 'Files are processed in-browser via Web Crypto'}
              </p>
            </div>
          </div>

          {computedHash && (
            <div className="mt-4 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono break-all text-slate-300">
              <span className="text-slate-500 block text-[10px] uppercase font-sans mb-1 font-semibold">
                Computed SHA-256 Digest (Client-Side)
              </span>
              {computedHash}
            </div>
          )}
        </div>

        {/* Method 2: Paste SHA-256 Hash Directly */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Direct SHA-256 Hash Lookup
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Exact Digest Match
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              If you have already computed the cryptographic digest or obtained it from court records, paste the 64-hex SHA-256 hash below.
            </p>

            <form onSubmit={handleManualSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  SHA-256 Checksum (64 hexadecimal characters)
                </label>
                <textarea
                  rows={3}
                  value={inputHash}
                  onChange={(e) => setInputHash(e.target.value)}
                  placeholder="e.g. b8f579b90c29cf46cf988df9f8be7e85c829e160e184f4693b169550e5ee0d9f"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isVerifying || !inputHash}
                  className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/40 text-white rounded-lg font-medium text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Verifying Hash Registry...
                    </>
                  ) : (
                    'Verify Hash Match'
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>

          <div className="mt-4 p-3 bg-slate-950/70 rounded-lg border border-slate-800/80 text-[11px] text-slate-500 leading-relaxed">
            <strong className="text-slate-400">Cryptographic Standard:</strong> Standard SHA-256 matches verify exact byte-level integrity against published judgments recorded in the repository.
          </div>
        </div>
      </div>

      {/* Verification Result Display */}
      {verificationResult && (
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl animate-fadeIn">
          {verificationResult.matched ? (
            <div>
              {/* Top Banner: Exact Hash Match */}
              <div className="bg-emerald-950/30 border-b border-emerald-500/20 p-5 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>SHA-256 matched</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                        Audit chain verified
                      </span>
                    </h3>
                    <p className="text-xs text-emerald-400/90 mt-0.5">
                      This document's cryptographic checksum exactly matches an authentic published judgment registered in Lexguard.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/cases/${verificationResult.case?.id}`}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    View in Case Viewer
                  </Link>
                  <Link
                    to="/compare"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-md shadow-indigo-600/20"
                  >
                    Compare with Your Matter
                  </Link>
                </div>
              </div>

              {/* Matched Case Details */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">Case Title</span>
                    <span className="text-sm font-semibold text-white mt-1 block truncate">
                      {verificationResult.case?.title}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">Citation & Court</span>
                    <span className="text-sm font-medium text-slate-200 mt-1 block">
                      {verificationResult.case?.citation || 'Unreported'} • {verificationResult.case?.court}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">Precedential Status</span>
                    <div className="mt-1">
                      {verificationResult.case?.precedential_status === 'good_law' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Good Law (Verified)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          Precedential status not checked
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">Source State</span>
                    <span className="text-xs font-medium text-blue-400 mt-1 block capitalize">
                      {verificationResult.case?.source_verification_state?.replace('_', ' ') || 'Registered Judgment'}
                    </span>
                  </div>
                </div>

                {/* Audit Ledger Chain Card */}
                {verificationResult.audit_event && (
                  <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Tamper-Evident Ledger Entry
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        Block ID: {verificationResult.audit_event.id}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                      <div>
                        <span className="text-slate-500 block text-[10px] font-sans">Current Block Hash</span>
                        <span className="text-slate-300 break-all">{verificationResult.audit_event.current_hash}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-sans">Previous Block Hash</span>
                        <span className="text-slate-400 break-all">{verificationResult.audit_event.previous_hash || 'Genesis Block'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Secure Document Stream Button */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 flex-wrap gap-3">
                  <div className="text-xs text-slate-400">
                    <span>Authentic copy registered: </span>
                    <strong className="text-slate-200">{verificationResult.case?.judgment_file_name || 'judgment.pdf'}</strong>
                  </div>

                  <a
                    href={verificationApi.streamJudgmentDocument(verificationResult.case.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Registered Document Stream
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* No Match State */
            <div className="p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto border border-slate-700">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">No Registered Judgment Match</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  The SHA-256 hash <span className="font-mono text-slate-300 break-all">{verificationResult.queried_hash}</span> does not match any published judgments in the Lexguard repository.
                </p>
              </div>

              <div className="p-3 bg-slate-950 max-w-md mx-auto rounded-lg border border-slate-800 text-left text-xs text-slate-400 space-y-1">
                <p>• The document may not be ingested or published yet.</p>
                <p>• The file may have been edited or re-exported, altering its byte sequence.</p>
                <p>• Only published cases with immutable registered checksums match this verification index.</p>
              </div>
            </div>
          )}

          {/* Legal Disclaimer Footer */}
          <div className="px-6 py-3 bg-slate-950 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between flex-wrap gap-2">
            <span>
              <strong>Notice:</strong> A cryptographic hash match proves byte-level integrity against the registered record; it does not constitute legal counsel, certify official gazette standing, or guarantee current precedential validity without independent check.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
