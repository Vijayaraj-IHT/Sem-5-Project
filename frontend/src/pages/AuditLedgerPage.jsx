import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  Search,
  Filter,
  FileText,
  Clock,
  User,
  ExternalLink,
} from 'lucide-react';
import client from '../api/client';

/**
 * AuditLedgerPage Component
 * 
 * Cryptographic Ledger & Blockchain Integrity Explorer (/admin/audit).
 * Traverses the immutable SHA-256 chained audit logs, verifies zero tampering,
 * and displays chronological block records.
 */
const AuditLedgerPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [filterAction, setFilterAction] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterAction) params.action = filterAction;
      const res = await client.get('/admin/audit-logs', { params });
      setLogs(res.data || []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Failed to fetch cryptographic audit logs.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [filterAction]);

  // Run Cryptographic Audit Chain Verification
  const verifyChain = async () => {
    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await client.get('/admin/verify-audit-chain');
      setVerificationResult(res.data);
    } catch (err) {
      setVerificationResult({
        is_valid: false,
        message: err.response?.data?.detail || err.message || 'Chain verification request failed.',
      });
    } finally {
      setVerifying(false);
    }
  };

  // Filter logs by search term
  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (log.action && log.action.toLowerCase().includes(term)) ||
      (log.details && log.details.toLowerCase().includes(term)) ||
      (log.current_hash && log.current_hash.toLowerCase().includes(term)) ||
      (log.case_id && log.case_id.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" /> Cryptographic Ledger Authority
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-white">
            Audit Ledger & Chain Integrity
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Immutable SHA-256 chained audit blocks. Every publication, review decision, and
            case approval is cryptographically linked to prevent retroactive database tampering.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={verifyChain}
            disabled={verifying}
            className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs tracking-wide shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
            <span>{verifying ? 'Verifying Ledger Chain...' : 'Verify Cryptographic Chain'}</span>
          </button>
        </div>
      </div>

      {/* Verification Result Banner */}
      {verificationResult && (
        <div
          className={`p-5 rounded-2xl border flex items-start gap-4 transition-all ${
            verificationResult.is_valid
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/50 border-rose-500/60 text-rose-200'
          }`}
        >
          {verificationResult.is_valid ? (
            <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-8 h-8 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <h3 className="font-bold font-serif text-base text-white">
              {verificationResult.is_valid
                ? 'Cryptographic Ledger Verified 100% Intact'
                : 'Ledger Integrity Violation Detected'}
            </h3>
            <p className="text-xs leading-relaxed opacity-90">
              {verificationResult.message ||
                `Successfully validated ${verificationResult.total_records || 0} sequential audit blocks. Zero broken hashes or altered records.`}
            </p>
            {verificationResult.broken_at_id && (
              <div className="mt-2 text-xs font-mono font-semibold text-rose-300">
                Tampered Block ID: {verificationResult.broken_at_id}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ledger Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
          <span className="text-xs text-slate-400 font-mono block">Total Chained Blocks</span>
          <span className="text-2xl font-bold font-serif text-white mt-1 block">{logs.length}</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
          <span className="text-xs text-slate-400 font-mono block">Chaining Algorithm</span>
          <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">SHA-256</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
          <span className="text-xs text-slate-400 font-mono block">Genesis State</span>
          <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">Seeded & Fixed</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search blocks by Action, Details, or SHA-256 hash..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500 w-full sm:w-auto"
          >
            <option value="">All Actions</option>
            <option value="APPROVE">APPROVE</option>
            <option value="REJECT">REJECT</option>
            <option value="LOGIN">LOGIN</option>
            <option value="REGISTER">REGISTER</option>
            <option value="UPLOAD">UPLOAD</option>
            <option value="INTEGRITY_VIOLATION">INTEGRITY_VIOLATION</option>
          </select>
        </div>
      </div>

      {/* Chained Ledger Table */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800 border-b border-slate-700 text-slate-300 font-mono text-[11px] uppercase tracking-wider">
                <th className="p-3.5">Block / Action</th>
                <th className="p-3.5">Details</th>
                <th className="p-3.5">Case ID</th>
                <th className="p-3.5">Timestamp (UTC)</th>
                <th className="p-3.5 font-mono">Current Block Hash</th>
                <th className="p-3.5 font-mono">Previous Hash Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 font-mono text-[11px]">
              {filteredLogs.map((log, idx) => (
                <tr key={log.id || idx} className="hover:bg-slate-800/70 transition-colors">
                  <td className="p-3.5 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action === 'APPROVE'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          : log.action === 'REJECT'
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                          : log.action === 'INTEGRITY_VIOLATION'
                          ? 'bg-red-900 text-red-200 font-extrabold'
                          : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3.5 max-w-xs truncate text-slate-200 font-sans" title={log.details}>
                    {log.details || 'System event recorded'}
                  </td>
                  <td className="p-3.5 whitespace-nowrap text-amber-400">
                    {log.case_id ? (
                      <span className="truncate block max-w-[120px]">{log.case_id}</span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="p-3.5 whitespace-nowrap text-slate-400">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                  </td>
                  <td className="p-3.5 whitespace-nowrap text-slate-300 font-mono" title={log.current_hash}>
                    {log.current_hash ? `${log.current_hash.substring(0, 16)}...` : 'Genesis'}
                  </td>
                  <td className="p-3.5 whitespace-nowrap text-slate-500 font-mono" title={log.previous_log_hash || log.previous_hash || 'Genesis'}>
                    {(log.previous_log_hash || log.previous_hash)
                      ? `${(log.previous_log_hash || log.previous_hash).substring(0, 16)}...`
                      : '0000000000000000...'}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-sans text-xs">
                    No cryptographic audit entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLedgerPage;
