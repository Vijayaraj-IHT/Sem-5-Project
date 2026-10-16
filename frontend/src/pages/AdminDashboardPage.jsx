import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardCheck,
  Shield,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Copy,
  Check,
  FileText,
  Users,
  Eye,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getApprovalQueue,
  approveCase,
  getAuditLogs,
  verifyAuditChain,
  getAnalytics,
} from '../api/admin';
import RoleBadge from '../components/common/RoleBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'queue', label: 'Approval Queue', icon: ClipboardCheck },
  { id: 'audit', label: 'Audit Logs', icon: Shield },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export default function AdminDashboardPage() {
  const { user, role, loading: authLoading } = useAuth();
  const currentRole = role || user?.role || 'public';

  const [activeTab, setActiveTab] = useState('overview');

  // Overview / Analytics state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Queue state
  const [queueItems, setQueueItems] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [selectedReviewCase, setSelectedReviewCase] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewActionFeedback, setReviewActionFeedback] = useState(null);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditPage, setAuditPage] = useState(0);
  const [auditFilterAction, setAuditFilterAction] = useState('');
  const auditLimit = 15;

  // Chain Verification state
  const [verifyingChain, setVerifyingChain] = useState(false);
  const [chainResult, setChainResult] = useState(null);

  // Copied hash state
  const [copiedHash, setCopiedHash] = useState(null);

  const handleCopyHash = (hash) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash).then(() => {
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
    });
  };

  // Fetch queue
  const fetchQueue = useCallback(async () => {
    try {
      setLoadingQueue(true);
      const data = await getApprovalQueue();
      if (Array.isArray(data)) {
        setQueueItems(data);
      }
    } catch (err) {
      console.error('Failed to fetch approval queue:', err);
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoadingAnalytics(true);
      const data = await getAnalytics();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoadingAudit(true);
      const params = {
        skip: auditPage * auditLimit,
        limit: auditLimit,
      };
      if (auditFilterAction) {
        params.action = auditFilterAction;
      }
      const data = await getAuditLogs(params);
      if (Array.isArray(data)) {
        setAuditLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoadingAudit(false);
    }
  }, [auditPage, auditLimit, auditFilterAction]);

  // Load initial tab data
  useEffect(() => {
    if (['staff', 'senior_staff', 'junior_staff', 'court_staff'].includes(currentRole)) {
      fetchAnalytics();
      fetchQueue();
    }
  }, [currentRole, fetchAnalytics, fetchQueue]);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    } else if (activeTab === 'analytics') {
      fetchAnalytics();
    } else if (activeTab === 'queue') {
      fetchQueue();
    }
  }, [activeTab, fetchAuditLogs, fetchAnalytics, fetchQueue]);

  // Handle Verify Chain Integrity
  const handleVerifyChain = async () => {
    try {
      setVerifyingChain(true);
      const result = await verifyAuditChain();
      setChainResult(result);
    } catch (err) {
      setChainResult({
        is_valid: false,
        message: err.response?.data?.detail || 'Audit ledger verification failed to execute.',
      });
    } finally {
      setVerifyingChain(false);
    }
  };

  // Handle Approve / Reject Case
  const handleReviewDecision = async (status) => {
    if (!selectedReviewCase) return;
    if (status === 'rejected' && !reviewNote.trim()) {
      setReviewActionFeedback({
        type: 'error',
        message: 'A rejection rationale / review note is required when rejecting a case.',
      });
      return;
    }

    try {
      setSubmittingReview(true);
      await approveCase(selectedReviewCase.case_id, {
        status,
        review_note: reviewNote.trim(),
      });

      setReviewActionFeedback({
        type: 'success',
        message: `Case ${selectedReviewCase.case_no || ''} successfully marked as ${status.toUpperCase()}!`,
      });

      // Refresh data
      fetchQueue();
      fetchAnalytics();

      setTimeout(() => {
        setSelectedReviewCase(null);
        setReviewNote('');
        setReviewActionFeedback(null);
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to submit case review status.';
      setReviewActionFeedback({ type: 'error', message: msg });
    } finally {
      setSubmittingReview(false);
    }
  };

  // Role Protection
  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner size="lg" message="Verifying administrative authority..." />
      </div>
    );
  }

  const isStaff = ['staff', 'senior_staff', 'junior_staff', 'court_staff'].includes(currentRole);

  if (!isStaff) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-slate-900 border border-slate-700 rounded-xl text-center shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-4 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white font-serif mb-2">Court Staff Clearance Required</h2>
        <p className="text-slate-300 mb-6">
          Access to judicial administrative controls, case approval queues, and immutable cryptographic audit ledgers is strictly restricted to authorized court personnel.
        </p>
        <Link
          to="/search"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg transition-colors shadow-sm"
        >
          Return to Public Case Search
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold font-serif text-white tracking-tight">
              Judicial Administration Portal
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Staff Portal
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Supervise case ingestion, verify cryptographic integrity, and maintain immutable audit chains.
          </p>
        </div>

        {/* Action Controls / Refresh */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'overview') fetchAnalytics();
              if (activeTab === 'queue') fetchQueue();
              if (activeTab === 'audit') fetchAuditLogs();
              if (activeTab === 'analytics') fetchAnalytics();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors shadow-xs"
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-400" />
            Refresh
          </button>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-all shadow-md shadow-amber-500/20"
          >
            <FileText className="w-3.5 h-3.5" />
            Upload New Document
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-800">
        <nav className="flex space-x-2" aria-label="Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = tab.id === 'queue' ? queueItems.length : null;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                  isActive
                    ? 'border-amber-400 text-amber-400 bg-slate-900/60'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {count !== null && count > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-300 font-mono">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Cases */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider font-mono">Total Cases</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold font-serif text-white">
                {analyticsData?.cases?.total ?? '—'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {analyticsData?.cases?.published ?? 0} published records
              </p>
            </div>

            {/* Pending Approvals */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider font-mono">Pending Approvals</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold font-serif text-amber-400">
                {queueItems.length || analyticsData?.cases?.pending_approval || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Awaiting administrative staff review
              </p>
            </div>

            {/* Total Users */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider font-mono">Total Users</span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold font-serif text-white">
                {analyticsData?.users?.total ?? '—'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Across advocates, staff & scholars
              </p>
            </div>

            {/* Audit Events */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider font-mono">Audit Events</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold font-serif text-white">
                {analyticsData?.audit?.total_events ?? '—'}
              </div>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Hash chained & verified
              </p>
            </div>
          </div>

          {/* Activity & Quick Queue Glance */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pending Queue Glance */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white font-serif">
                    Pending Case Queue
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('queue')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                >
                  View All ({queueItems.length}) &rarr;
                </button>
              </div>

              {loadingQueue ? (
                <div className="py-8 text-center">
                  <LoadingSpinner size="md" message="Loading approval queue..." />
                </div>
              ) : queueItems.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                  <p>All submitted documents have been reviewed.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {queueItems.slice(0, 4).map((item) => (
                    <div
                      key={item.queue_id}
                      className="p-3 bg-slate-800/60 border border-slate-800 hover:border-slate-700 rounded-lg flex items-center justify-between gap-4 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span className="font-mono text-amber-400/90">{item.court}</span>
                          <span>•</span>
                          <span>By {item.submitted_by}</span>
                          <span>•</span>
                          <span>{new Date(item.submitted_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedReviewCase(item);
                          setActiveTab('queue');
                        }}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-md shrink-0"
                      >
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Repository Integrity Overview */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white font-serif">
                    Repository Integrity
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Lexguard uses cryptographic SHA-256 Merkle linking across all court records and tamper-evident audit logs.
                </p>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded bg-slate-800/80 border border-slate-700/60">
                    <span className="text-slate-300">Quarantined Tamper Cases</span>
                    <span className="font-mono font-bold text-rose-400">
                      {analyticsData?.cases?.quarantined ?? 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded bg-slate-800/80 border border-slate-700/60">
                    <span className="text-slate-300">Integrity Violations Logged</span>
                    <span className="font-mono font-bold text-amber-400">
                      {analyticsData?.audit?.integrity_violations_detected ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('audit');
                    handleVerifyChain();
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-lg transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Verify Hash Chain Integrity
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APPROVAL QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-bold font-serif text-white">
                  Pending Judgment Approval Queue
                </h2>
                <p className="text-xs text-slate-400">
                  Judgments awaiting verification of metadata, citation integrity, and administrative publication.
                </p>
              </div>
              <div className="text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700">
                Total Pending: <strong className="text-amber-400">{queueItems.length}</strong>
              </div>
            </div>

            {loadingQueue ? (
              <div className="py-12 text-center">
                <LoadingSpinner size="lg" message="Loading pending approval queue..." />
              </div>
            ) : queueItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
                <h3 className="text-base font-semibold text-white">Queue is Clear</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  There are no cases awaiting approval. New document uploads by junior court staff will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-slate-400 font-mono uppercase tracking-wider text-[11px] border-b border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Case Title & Record</th>
                      <th className="py-3 px-4">Court</th>
                      <th className="py-3 px-4">Uploaded By</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">SHA-256 Fingerprint</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {queueItems.map((item) => (
                      <tr key={item.queue_id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-white max-w-md truncate">{item.title}</p>
                          <span className="text-[11px] font-mono text-amber-400/90">
                            No: {item.case_no || 'Pending Assignment'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-200">{item.court}</td>
                        <td className="py-3.5 px-4 text-slate-300">{item.submitted_by}</td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                          {new Date(item.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className="font-mono text-[10px] bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-400 truncate inline-block max-w-[120px]"
                            title={item.file_hash}
                          >
                            {item.file_hash ? `${item.file_hash.substring(0, 10)}...` : 'N/A'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReviewCase(item);
                              setReviewNote('');
                              setReviewActionFeedback(null);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-md shadow-xs transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* REVIEW MODAL / DRAWER */}
          {selectedReviewCase && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-bold text-white font-serif">
                      Review Case: {selectedReviewCase.case_no || 'Document Ingestion'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedReviewCase(null)}
                    className="text-slate-400 hover:text-white text-xl p-1"
                  >
                    &times;
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto space-y-4 text-xs">
                  {/* Feedback Message */}
                  {reviewActionFeedback && (
                    <div
                      className={`p-3 rounded-lg border flex items-center gap-2 ${
                        reviewActionFeedback.type === 'success'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {reviewActionFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                      )}
                      <span>{reviewActionFeedback.message}</span>
                    </div>
                  )}

                  {/* Metadata Card */}
                  <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                    <h4 className="text-sm font-semibold text-white font-serif">{selectedReviewCase.title}</h4>
                    <div className="grid grid-cols-2 gap-3 text-slate-300 pt-1">
                      <div>
                        <span className="text-slate-500 font-mono">Court:</span>{' '}
                        <strong>{selectedReviewCase.court}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 font-mono">Year:</span>{' '}
                        <strong>{selectedReviewCase.year || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 font-mono">Uploaded By:</span>{' '}
                        {selectedReviewCase.submitted_by}
                      </div>
                      <div>
                        <span className="text-slate-500 font-mono">Submitted:</span>{' '}
                        {new Date(selectedReviewCase.submitted_at).toLocaleString()}
                      </div>
                    </div>

                    {/* SHA-256 Hash Display */}
                    {selectedReviewCase.file_hash && (
                      <div className="pt-2">
                        <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                          Cryptographic SHA-256 Fingerprint:
                        </span>
                        <div className="flex items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-amber-400 select-all">
                          <span className="truncate flex-1">{selectedReviewCase.file_hash}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyHash(selectedReviewCase.file_hash)}
                            className="p-1 text-slate-400 hover:text-white"
                            title="Copy Hash"
                          >
                            {copiedHash === selectedReviewCase.file_hash ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Review Note Textarea */}
                  <div>
                    <label htmlFor="review-note-input" className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
                      Administrative Review Note / Rationale:
                    </label>
                    <textarea
                      id="review-note-input"
                      rows={3}
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Add mandatory rejection remarks or administrative approval notes for the permanent audit trail..."
                      className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Modal Footer with Actions */}
                <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedReviewCase(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={submittingReview}
                      onClick={() => handleReviewDecision('rejected')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Document
                    </button>

                    <button
                      type="button"
                      disabled={submittingReview}
                      onClick={() => handleReviewDecision('published')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Publish
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Header & Verification Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold font-serif text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  Immutable Audit Ledger
                </h2>
                <p className="text-xs text-slate-400">
                  Chronological SHA-256 hash-chained judicial actions with tamper-detection verification.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Action Filter */}
                <select
                  value={auditFilterAction}
                  onChange={(e) => {
                    setAuditFilterAction(e.target.value);
                    setAuditPage(0);
                  }}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-hidden"
                >
                  <option value="">All Actions</option>
                  <option value="UPLOAD">UPLOAD</option>
                  <option value="APPROVE">APPROVE</option>
                  <option value="REJECT">REJECT</option>
                  <option value="VERIFY_INTEGRITY">VERIFY_INTEGRITY</option>
                  <option value="VIEW_DOCUMENT">VIEW_DOCUMENT</option>
                  <option value="DRAFT_ANALYZE">DRAFT_ANALYZE</option>
                  <option value="INTEGRITY_VIOLATION">INTEGRITY_VIOLATION</option>
                </select>

                <button
                  type="button"
                  onClick={handleVerifyChain}
                  disabled={verifyingChain}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-md transition-colors"
                >
                  {verifyingChain ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  Verify Chain Integrity
                </button>
              </div>
            </div>

            {/* Chain Verification Result Alert */}
            {chainResult && (
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                  chainResult.is_valid
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {chainResult.is_valid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-semibold text-sm">
                    {chainResult.is_valid
                      ? 'Audit Ledger Integrity Verified (Zero Tampering)'
                      : 'Cryptographic Hash Chain Broken / Tamper Detected!'}
                  </h4>
                  <p className="text-xs mt-0.5 text-slate-300">{chainResult.message}</p>
                  {chainResult.total_records !== undefined && (
                    <p className="text-[11px] font-mono mt-1 text-slate-400">
                      Total Verified Blocks: <strong>{chainResult.total_records}</strong>
                      {chainResult.broken_at_id && (
                        <span className="text-rose-400 ml-3">
                          Broken at Record ID: {chainResult.broken_at_id}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Audit Logs Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            {loadingAudit ? (
              <div className="py-12 text-center">
                <LoadingSpinner size="lg" message="Loading immutable audit logs..." />
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <Shield className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p>No audit log events found matching the criteria.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800/80 text-slate-400 font-mono uppercase tracking-wider text-[11px] border-b border-slate-700">
                      <tr>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Actor</th>
                        <th className="py-3 px-4">Details</th>
                        <th className="py-3 px-4">Chain Hash (SHA-256)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-sans">
                      {auditLogs.map((log) => {
                        const isViolation = log.action === 'INTEGRITY_VIOLATION';
                        return (
                          <tr
                            key={log.id}
                            className={`hover:bg-slate-800/40 transition-colors ${
                              isViolation ? 'bg-rose-500/10' : ''
                            }`}
                          >
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                  log.action === 'APPROVE'
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    : log.action === 'REJECT'
                                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                    : log.action === 'INTEGRITY_VIOLATION'
                                    ? 'bg-red-600 text-white font-bold animate-pulse'
                                    : 'bg-slate-800 text-slate-200 border border-slate-700'
                                }`}
                              >
                                {log.action}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                              {log.user_id ? log.user_id.substring(0, 8) : 'System'}
                            </td>
                            <td className="py-3 px-4 max-w-sm">
                              <p className="text-slate-200 truncate" title={log.details}>
                                {log.details}
                              </p>
                              {log.case_id && (
                                <span className="text-[10px] text-amber-400/80 font-mono">
                                  Case: {log.case_id.substring(0, 8)}...
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono text-[10px]">
                              {log.current_hash ? (
                                <button
                                  type="button"
                                  onClick={() => handleCopyHash(log.current_hash)}
                                  className="text-slate-400 hover:text-amber-400 flex items-center gap-1"
                                  title="Copy Block Hash"
                                >
                                  <span>{log.current_hash.substring(0, 12)}...</span>
                                  <Copy className="w-3 h-3 shrink-0" />
                                </button>
                              ) : (
                                <span className="text-slate-400">Initial Block</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Page {auditPage + 1}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={auditPage === 0}
                      onClick={() => setAuditPage((p) => Math.max(0, p - 1))}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Previous
                    </button>
                    <button
                      type="button"
                      disabled={auditLogs.length < auditLimit}
                      onClick={() => setAuditPage((p) => p + 1)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {loadingAnalytics ? (
            <div className="py-12 text-center">
              <LoadingSpinner size="lg" message="Compiling repository analytics..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Repository Distribution */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white font-serif mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  Judicial Repository Status
                </h3>

                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Published Judgments</span>
                      <strong className="text-white font-mono">{analyticsData?.cases?.published ?? 0}</strong>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${
                            analyticsData?.cases?.total
                              ? ((analyticsData.cases.published / analyticsData.cases.total) * 100).toFixed(0)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Pending Staff Review</span>
                      <strong className="text-amber-400 font-mono">
                        {analyticsData?.cases?.pending_approval ?? 0}
                      </strong>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{
                          width: `${
                            analyticsData?.cases?.total
                              ? ((analyticsData.cases.pending_approval / analyticsData.cases.total) * 100).toFixed(0)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Quarantined / Tampered</span>
                      <strong className="text-rose-400 font-mono">
                        {analyticsData?.cases?.quarantined ?? 0}
                      </strong>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{
                          width: `${
                            analyticsData?.cases?.total
                              ? ((analyticsData.cases.quarantined / analyticsData.cases.total) * 100).toFixed(0)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Users Distribution By Role */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white font-serif mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  User Role Distribution
                </h3>

                {analyticsData?.users?.by_role ? (
                  <div className="space-y-3">
                    {Object.entries(analyticsData.users.by_role).map(([roleKey, count]) => (
                      <div
                        key={roleKey}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <RoleBadge role={roleKey} showDot={true} />
                          <span className="text-slate-300 capitalize">{roleKey.replace(/_/g, ' ')}</span>
                        </div>
                        <span className="font-mono font-bold text-white text-sm">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No user metrics available.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
