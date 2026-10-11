import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Copy, Check } from 'lucide-react';

/**
 * Cryptographic integrity verification badge for case files and records.
 *
 * @param {boolean} isVerified - Whether the hash matches verified cryptographic integrity
 * @param {string} hash - SHA-256 hash digest string
 * @param {boolean} showHash - Whether to render hash string below badge
 * @param {string} className - Optional container CSS classes
 */
const IntegrityBadge = React.memo(({
  isVerified = false,
  hash,
  showHash = false,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyHash = () => {
    if (!hash) return;
    navigator.clipboard.writeText(hash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`inline-flex flex-col gap-1.5 ${className}`}>
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border shadow-xs transition-colors duration-200 ${
          isVerified
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
            : 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse'
        }`}
      >
        {isVerified ? (
          <>
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>SHA-256 Verified ✅</span>
          </>
        ) : (
          <>
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
            <span>Integrity Compromised ❌</span>
          </>
        )}
      </div>

      {showHash && hash && (
        <div className="flex items-center gap-1 text-[11px] font-mono bg-slate-900/90 text-slate-200 px-2 py-1 rounded border border-slate-700 max-w-full">
          <span className="text-slate-400 select-none font-sans font-medium mr-1">HASH:</span>
          <span className="truncate select-all" title={hash}>
            {hash}
          </span>
          <button
            type="button"
            onClick={handleCopyHash}
            className="ml-auto text-slate-400 hover:text-white p-0.5 rounded transition-colors"
            title="Copy SHA-256 Hash"
            aria-label="Copy SHA-256 Hash"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
});

IntegrityBadge.displayName = 'IntegrityBadge';

export default IntegrityBadge;
