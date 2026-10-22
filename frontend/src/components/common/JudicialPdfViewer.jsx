import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Search,
  Maximize2,
  Minimize2,
  Download,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  Sidebar,
  FileText,
  AlertTriangle,
  RefreshCw,
  Layers,
  Sparkles,
} from 'lucide-react';
import client from '../../api/client';

// Configure Mozilla PDF.js web worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * JudicialPdfViewer Component
 *
 * Professional in-app court document PDF viewer powered by Mozilla PDF.js.
 * Renders authentic court judgments with crisp canvas graphics, selectable text layer,
 * visual thumbnail navigation, in-document search, rotation, and cryptographic verification.
 *
 * Replaces plain iframes with full programmatic control and authenticated streaming.
 */
export default function JudicialPdfViewer({
  caseId,
  documentUrl,
  caseNo = '',
  court = '',
  fileHash = '',
  phiCase = '',
  initialPage = 1,
  initialSearchQuery = '',
  compact = false,
  height = '750px',
  onPageChange,
}) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageInput, setPageInput] = useState(String(initialPage));
  const [scale, setScale] = useState(compact ? 1.0 : 1.25);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [renderLoading, setRenderLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search & Navigation
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [searchResults, setSearchResults] = useState([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // Sidebar & Layout
  const [showThumbnails, setShowThumbnails] = useState(!compact);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // DOM Refs
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const currentRenderTask = useRef(null);
  const thumbnailsRef = useRef({});

  // Stream URL calculation
  const streamUrl = documentUrl || (caseId ? `/verification/documents/${caseId}/stream` : null);

  // 1. Fetch document binary with authentication
  const loadDocument = useCallback(async () => {
    if (!streamUrl) {
      setError('Document URL or Case ID is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use authenticated axios client to get PDF arrayBuffer
      const response = await client.get(streamUrl, {
        responseType: 'arraybuffer',
      });

      const loadingTask = pdfjsLib.getDocument({
        data: response.data,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
        cMapPacked: true,
      });

      const doc = await loadingTask.promise;
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setCurrentPage(1);
      setPageInput('1');
      setLoading(false);
    } catch (err) {
      console.error('Judicial PDF loading error:', err);
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Failed to stream authentic court judgment PDF. Please verify backend connectivity.'
      );
      setLoading(false);
    }
  }, [streamUrl]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  // 2. Render active page on canvas + text selection layer
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    // Cancel in-flight render task if user flipped page rapidly
    if (currentRenderTask.current) {
      currentRenderTask.current.cancel();
      currentRenderTask.current = null;
    }

    setRenderLoading(true);

    try {
      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      const viewport = page.getViewport({ scale, rotation });
      const pixelRatio = window.devicePixelRatio || 1;

      // Adjust canvas resolution for high-DPI displays
      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      const renderTask = page.render(renderContext);
      currentRenderTask.current = renderTask;
      await renderTask.promise;
      currentRenderTask.current = null;

      // Render Text Layer for legal text selection & highlighting
      if (textLayerRef.current) {
        textLayerRef.current.innerHTML = '';
        textLayerRef.current.style.width = `${Math.floor(viewport.width)}px`;
        textLayerRef.current.style.height = `${Math.floor(viewport.height)}px`;

        const textContent = await page.getTextContent();
        textContent.items.forEach((item) => {
          if (!item.str || item.str.trim() === '') return;

          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
          const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);

          const span = document.createElement('span');
          span.textContent = item.str;
          span.style.left = `${tx[4]}px`;
          span.style.top = `${tx[5] - fontHeight}px`;
          span.style.fontSize = `${fontHeight}px`;
          span.style.fontFamily = item.fontName || 'serif';
          span.className =
            'absolute text-transparent select-text whitespace-pre pointer-events-auto leading-none hover:bg-amber-300/20';

          // Search term highlight
          if (searchQuery && item.str.toLowerCase().includes(searchQuery.toLowerCase())) {
            span.className += ' bg-amber-400/40 text-slate-900 font-bold px-0.5 rounded-xs ring-1 ring-amber-500';
          }

          textLayerRef.current.appendChild(span);
        });
      }

      setRenderLoading(false);
      if (onPageChange) {
        onPageChange(currentPage, pdfDoc.numPages);
      }
    } catch (err) {
      if (err.name !== 'RenderingCancelledException') {
        console.error('Page render error:', err);
      }
      setRenderLoading(false);
    }
  }, [pdfDoc, currentPage, scale, rotation, searchQuery, onPageChange]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // 3. Render thumbnail in left drawer
  const renderThumbnail = useCallback(
    async (pageIndex, canvasElem) => {
      if (!pdfDoc || !canvasElem) return;
      try {
        const page = await pdfDoc.getPage(pageIndex);
        const thumbViewport = page.getViewport({ scale: 0.2, rotation });
        canvasElem.width = thumbViewport.width;
        canvasElem.height = thumbViewport.height;
        const ctx = canvasElem.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: thumbViewport }).promise;
      } catch (err) {
        // Thumbnail errors are non-critical
      }
    },
    [pdfDoc, rotation]
  );

  // 4. Page navigation handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      const p = currentPage - 1;
      setCurrentPage(p);
      setPageInput(String(p));
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      const p = currentPage + 1;
      setCurrentPage(p);
      setPageInput(String(p));
    }
  };

  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = (e) => {
    if (e.key === 'Enter') {
      const num = parseInt(pageInput, 10);
      if (!isNaN(num) && num >= 1 && num <= numPages) {
        setCurrentPage(num);
      } else {
        setPageInput(String(currentPage));
      }
    }
  };

  // 5. Zoom controls
  const handleZoomIn = () => setScale((s) => Math.min(3.0, Math.round((s + 0.2) * 10) / 10));
  const handleZoomOut = () => setScale((s) => Math.max(0.6, Math.round((s - 0.2) * 10) / 10));
  const handleFitWidth = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - (showThumbnails ? 200 : 60);
      setScale(Math.max(0.7, Math.min(2.0, (containerWidth / 620))));
    }
  };
  const handleFitPage = () => setScale(compact ? 0.9 : 1.15);

  // 6. In-document search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || !pdfDoc) return;

    setIsSearching(true);
    const matches = [];

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((it) => it.str).join(' ');
      if (pageText.toLowerCase().includes(searchQuery.toLowerCase())) {
        matches.push(i);
      }
    }

    setSearchResults(matches);
    setIsSearching(false);
    if (matches.length > 0) {
      setCurrentMatchIdx(0);
      setCurrentPage(matches[0]);
      setPageInput(String(matches[0]));
    }
  };

  const handleNextSearchMatch = () => {
    if (searchResults.length > 0) {
      const nextIdx = (currentMatchIdx + 1) % searchResults.length;
      setCurrentMatchIdx(nextIdx);
      const targetPage = searchResults[nextIdx];
      setCurrentPage(targetPage);
      setPageInput(String(targetPage));
    }
  };

  const handlePrevSearchMatch = () => {
    if (searchResults.length > 0) {
      const prevIdx = (currentMatchIdx - 1 + searchResults.length) % searchResults.length;
      setCurrentMatchIdx(prevIdx);
      const targetPage = searchResults[prevIdx];
      setCurrentPage(targetPage);
      setPageInput(String(targetPage));
    }
  };

  // 7. Download & Print
  const handleDownload = async () => {
    if (!streamUrl) return;
    try {
      const res = await client.get(streamUrl, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${caseNo ? caseNo.replace(/[\/\s]/g, '_') : 'court_judgment'}_official.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyHash = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div
      ref={containerRef}
      className={`w-full flex flex-col bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden font-sans ${
        isFullScreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
      style={{ height: isFullScreen ? '100vh' : height }}
    >
      {/* ─── Top Judicial Control Ribbon ─── */}
      <div className="bg-slate-900/95 border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 z-10 text-xs">
        {/* Left: Thumbnails Toggle & Document Info */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowThumbnails((v) => !v)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              showThumbnails
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Toggle Page Thumbnail Strip"
          >
            <Sidebar className="w-4 h-4" />
          </button>

          <div className="hidden sm:flex items-center gap-2 pl-1 border-l border-slate-800">
            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="max-w-[200px] truncate">
              <span className="font-semibold text-white block truncate">{caseNo || 'Court Ruling PDF'}</span>
              <span className="text-[10px] text-slate-400 block truncate">{court || 'High Court of Judicature'}</span>
            </div>
          </div>
        </div>

        {/* Center: Page Controls & Zoom */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Page Navigator */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage <= 1 || loading}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Previous Page (Left Arrow)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 px-1.5 font-mono text-xs">
              <input
                type="text"
                value={pageInput}
                onChange={handlePageInputChange}
                onKeyDown={handlePageInputSubmit}
                onBlur={() => setPageInput(String(currentPage))}
                className="w-8 text-center bg-slate-950 border border-slate-700 rounded text-slate-100 py-0.5 focus:border-amber-400 focus:outline-hidden"
              />
              <span className="text-slate-400">/ {numPages || 1}</span>
            </div>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage >= numPages || loading}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Next Page (Right Arrow)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom Matrix */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= 0.6 || loading}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleFitPage}
              className="px-2 py-0.5 text-[11px] font-mono text-amber-400 hover:text-amber-300 cursor-pointer"
              title="Reset Zoom to 100%"
            >
              {Math.round(scale * 100)}%
            </button>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= 3.0 || loading}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fit Width */}
          <button
            type="button"
            onClick={handleFitWidth}
            className="hidden md:inline-flex px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 cursor-pointer"
            title="Fit to Width"
          >
            Fit Width
          </button>

          {/* Rotate 90 deg */}
          <button
            type="button"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            title="Rotate 90° Clockwise"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: In-Document Search & Actions */}
        <div className="flex items-center gap-1.5">
          {/* Quick Search */}
          <form onSubmit={handleSearch} className="relative hidden lg:flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in PDF..."
              className="w-36 pl-7 pr-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 text-[11px] focus:border-amber-400 focus:outline-hidden"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
          </form>

          {searchResults.length > 0 && (
            <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800">
              <span>
                {currentMatchIdx + 1}/{searchResults.length}
              </span>
              <button
                type="button"
                onClick={handlePrevSearchMatch}
                className="hover:text-white p-0.5"
                title="Previous Match"
              >
                &uarr;
              </button>
              <button
                type="button"
                onClick={handleNextSearchMatch}
                className="hover:text-white p-0.5"
                title="Next Match"
              >
                &darr;
              </button>
            </div>
          )}

          {/* Print */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            title="Print Document"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          {/* Download */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border border-amber-400 shadow-xs cursor-pointer"
            title="Download Authentic Court PDF"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullScreen((v) => !v)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            title={isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ─── Cryptographic Security Ribbon ─── */}
      {(fileHash || phiCase) && (
        <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-1.5 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80 text-[10px]">
              <ShieldCheck className="w-3 h-3" />
              Verified Authentic Court PDF
            </span>
            {fileHash && (
              <span className="hidden sm:inline">
                H_doc: <strong className="text-slate-200 select-all">{fileHash.substring(0, 16)}...</strong>
              </span>
            )}
            {phiCase && (
              <span className="hidden md:inline">
                &Phi;_case: <strong className="text-amber-400 select-all">{phiCase.substring(0, 16)}...</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopyHash(fileHash || phiCase)}
              className="text-slate-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
              title="Copy Complete SHA-256 Digest"
            >
              {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── Main Viewport Area ─── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Collapsible Left Thumbnail Sidebar */}
        {showThumbnails && (
          <div className="w-44 bg-slate-900/90 border-r border-slate-800 overflow-y-auto p-3 space-y-3 shrink-0">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center justify-between">
              <span>Thumbnails ({numPages})</span>
              <Layers className="w-3 h-3 text-amber-400" />
            </div>

            {Array.from({ length: numPages }, (_, i) => i + 1).map((pNum) => (
              <div
                key={`thumb-${pNum}`}
                onClick={() => {
                  setCurrentPage(pNum);
                  setPageInput(String(pNum));
                }}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col items-center ${
                  currentPage === pNum
                    ? 'border-amber-500 bg-amber-500/10 shadow-md ring-1 ring-amber-500/50'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'
                }`}
              >
                <canvas
                  ref={(el) => {
                    if (el && !thumbnailsRef.current[pNum]) {
                      thumbnailsRef.current[pNum] = true;
                      renderThumbnail(pNum, el);
                    }
                  }}
                  className="rounded-xs shadow-xs max-w-full"
                />
                <span
                  className={`text-[10px] font-mono mt-1 ${
                    currentPage === pNum ? 'text-amber-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  Page {pNum}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Central Document Canvas Viewport */}
        <div className="flex-1 overflow-auto bg-slate-950 flex flex-col items-center p-4 sm:p-8">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 text-slate-400 py-20">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-xs font-mono">Streaming authentic court judgment binary...</p>
              <span className="text-[10px] text-slate-500">Checking SHA-256 cryptographic seal</span>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto py-20">
              <AlertTriangle className="w-10 h-10 text-rose-500 mb-3" />
              <h4 className="text-sm font-bold text-white mb-1">Unable to Render PDF</h4>
              <p className="text-xs text-rose-300 mb-4">{error}</p>
              <button
                type="button"
                onClick={loadDocument}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Stream</span>
              </button>
            </div>
          ) : (
            <div className="relative shadow-2xl rounded-sm overflow-hidden bg-white border border-slate-300">
              {/* Raster PDF Canvas */}
              <canvas ref={canvasRef} className="block select-none" />

              {/* Text Selection Layer Overlay */}
              <div
                ref={textLayerRef}
                className="absolute inset-0 pointer-events-none select-text overflow-hidden"
              />

              {/* Subtle Loading Overlay for Page Switching */}
              {renderLoading && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-slate-950/80 backdrop-blur-xs text-amber-400 text-[10px] font-mono rounded border border-slate-800 flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Rendering...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
