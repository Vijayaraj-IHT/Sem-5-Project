/**
 * LexGuard — 4-Tab Case Viewer & PDF.js Engine (case-viewer.js)
 * Semester 5 Project · LexGuard Judicial Repository & Verification Platform
 */

$(document).ready(function () {
  'use strict';

  const caseId = LG.utils.getQueryParam('id');
  if (!caseId) {
    LG.toast('No case identifier provided. Redirecting to search...', 'warning');
    setTimeout(function () { window.location.href = 'search.html'; }, 1000);
    return;
  }

  // Setup PDF.js worker
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  let pdfDoc = null;
  let pageNum = 1;
  let pageRendering = false;
  let pageNumPending = null;
  let scale = 1.25;
  let rotation = 0;
  let currentCase = null;

  // DOM Elements
  const $headerTitle = $('#case-header-title');
  const $headerCourt = $('#case-header-court');
  const $headerCaseno = $('#case-header-caseno');
  const $headerDate = $('#case-header-date');
  const $headerBench = $('#case-header-bench');
  const $headerCnr = $('#case-header-cnr');
  const $headerOutcome = $('#case-header-outcome');
  const $sealHash = $('#case-seal-hash');
  const $verifyLink = $('#case-verify-link');
  const $downloadBtn = $('#action-download-btn');
  const $compareBtn = $('#action-compare-btn');
  const $bookmarkBtn = $('#action-bookmark-btn');

  // Overview Tab Elements
  const $ratio = $('#overview-ratio');
  const $summary = $('#overview-summary');
  const $issues = $('#overview-issues');
  const $metaCourt = $('#meta-court');
  const $metaCasetype = $('#meta-casetype');
  const $metaYear = $('#meta-year');
  const $metaOutcome = $('#meta-outcome');
  const $metaStatus = $('#meta-status');
  const $overviewTags = $('#overview-tags');
  const $citationBox = $('#overview-citation-box');
  const $copyCitationBtn = $('#overview-copy-citation-btn');

  // PDF Viewer Elements
  const $pdfLoading = $('#pdf-loading');
  const $pdfCanvas = $('#pdf-canvas');
  const $pdfFallbackText = $('#pdf-fallback-text');
  const $pdfCurrentPage = $('#pdf-current-page');
  const $pdfTotalPages = $('#pdf-total-pages');
  const $pdfZoomLevel = $('#pdf-zoom-level');

  /**
   * Fetch and render case details.
   */
  LG.api.cases.get(caseId)
    .done(function (c) {
      currentCase = c;
      renderCaseHeader(c);
      renderOverviewTab(c);
      renderCisTab(c);
      loadPrecedentNetwork(c.id);

      // Setup action buttons
      $downloadBtn.attr('href', LG.api.cases.getDownloadUrl(c.id));
      $compareBtn.attr('href', 'case-compare.html?case1=' + encodeURIComponent(c.id));
      $verifyLink.attr('href', 'verify.html?hash=' + encodeURIComponent(c.file_hash || ''));
    })
    .fail(function (xhr) {
      $headerTitle.text('Failed to load judgment');
      let msg = 'Could not load judgment metadata.';
      if (xhr.responseJSON && xhr.responseJSON.detail) {
        msg = typeof xhr.responseJSON.detail === 'string'
          ? xhr.responseJSON.detail
          : JSON.stringify(xhr.responseJSON.detail);
      }
      LG.toast(msg, 'danger');
    });

  /**
   * Render Case Header & Identification details.
   */
  function renderCaseHeader(c) {
    $headerTitle.text(c.title || 'Untitled Case');
    $headerCourt.attr('class', LG.utils.courtBadgeClass(c.court)).text(c.court || 'Court');
    $headerCaseno.html(`<i class="bi bi-file-earmark-text me-1"></i>Case No: <span class="text-light">${LG.utils.escapeHtml(c.case_no || '—')}</span>`);
    $headerDate.html(`<i class="bi bi-calendar3 me-1"></i>Date: <span class="text-light">${LG.utils.formatDate(c.decision_date || c.created_at)}</span>`);
    $headerBench.html(`<i class="bi bi-person-badge me-1"></i>Bench: <span class="text-light">${LG.utils.escapeHtml(c.judge || 'Hon\'ble Bench')}</span>`);
    $headerCnr.html(`<i class="bi bi-upc-scan me-1"></i>CNR: <span class="text-light font-mono">${LG.utils.escapeHtml(c.cnr || '—')}</span>`);

    if (c.outcome) {
      $headerOutcome.text(c.outcome).show();
    } else {
      $headerOutcome.hide();
    }

    if (c.file_hash) {
      $sealHash.text('SHA-256: ' + c.file_hash);
    } else {
      $sealHash.text('SHA-256 Digest Pending');
    }
  }

  /**
   * Render Tab 1: Structure & Overview.
   */
  function renderOverviewTab(c) {
    $ratio.text(c.ratio_decidendi || 'Legal principles and ratio decidendi affirmed under judicial consideration.');
    $summary.text(c.summary || 'Summary under extraction from official court records.');
    $issues.text(c.issues_framed || '1. Statutory compliance with procedural standards.\n2. Fundamental rights invocation and constitutional remedy validity.');

    $metaCourt.text(c.court || '—');
    $metaCasetype.text(c.cis_case_type || c.case_type || 'Civil / Criminal');
    $metaYear.text(c.year || '—');
    $metaOutcome.text(c.outcome || c.disposition || 'Disposed');
    $metaStatus.html(`<span class="${LG.utils.statusBadgeClass(c.verification_status || c.status)}">${c.verification_status || c.status || 'Verified'}</span>`);

    // Tags
    const acts = c.acts || c.act_tags || [];
    const sections = c.sections || c.section_tags || [];
    const all = acts.concat(sections);
    if (all.length > 0) {
      $overviewTags.html(all.map(t => `<span class="badge bg-dark text-secondary border border-secondary border-opacity-25">${LG.utils.escapeHtml(t)}</span>`).join(' '));
    }

    // Citation
    const citation = `${c.title || 'Case'}, (${c.year || ''}) ${c.court || ''}`;
    $citationBox.text(citation);

    $copyCitationBtn.on('click', function () {
      LG.utils.copyToClipboard(citation, 'Citation copied: ' + citation);
    });
  }

  /**
   * Render Tab 3: CIS Metadata fields and JSON viewer.
   */
  function renderCisTab(c) {
    $('#cis-cnr').text(c.cnr || '—');
    $('#cis-casetype').text(c.cis_case_type || c.case_type || 'Writ Petition / Appeal');
    $('#cis-regno').text(c.case_no || '—');
    $('#cis-filingdate').text(LG.utils.formatDate(c.filing_date || c.created_at));
    $('#cis-decisiondate').text(LG.utils.formatDate(c.decision_date || c.created_at));
    $('#cis-petitioner').text(c.petitioner || 'Petitioner Counsel');
    $('#cis-respondent').text(c.respondent || 'Respondent / State');
    $('#cis-coram').text(c.judge || 'Hon\'ble Judges of the Bench');
    $('#cis-fir').text(c.fir_number || 'N/A');
    $('#cis-lowercourt').text(c.lower_court || 'N/A');

    // JSON pretty print
    $('#cis-raw-json').text(JSON.stringify(c, null, 2));
  }

  /**
   * Render Tab 4: Precedents & Citator Graph.
   */
  function loadPrecedentNetwork(cid) {
    LG.api.comparison.getPrecedents(cid)
      .done(function (res) {
        const list = res.precedents || res.results || res;
        if (!Array.isArray(list) || list.length === 0) {
          $('#precedents-list').html(`
            <div class="text-secondary small p-3 text-center border border-secondary border-opacity-15 rounded">
              <i class="bi bi-info-circle me-1"></i>No upstream or downstream precedent citations indexed for this case yet.
            </div>
          `);
          return;
        }

        const itemsHtml = list.map(function (p) {
          return `
            <div class="card card-judicial p-3 mb-2">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <a href="case-viewer.html?id=${encodeURIComponent(p.id)}" class="fw-semibold text-light text-decoration-none">
                    ${LG.utils.escapeHtml(p.title || 'Precedent')}
                  </a>
                  <div class="small text-secondary mt-1">
                    <span class="${LG.utils.courtBadgeClass(p.court)} me-2">${LG.utils.escapeHtml(p.court || '')}</span>
                    <span>Year: ${p.year || '—'}</span>
                  </div>
                </div>
                <div>
                  <a href="case-compare.html?case1=${encodeURIComponent(cid)}&case2=${encodeURIComponent(p.id)}" class="btn btn-xs btn-judicial-outline">
                    <i class="bi bi-columns-gap me-1"></i>Compare
                  </a>
                </div>
              </div>
            </div>
          `;
        }).join('');

        $('#precedents-list').html(itemsHtml);
      })
      .fail(function () {
        $('#precedents-list').html(`
          <div class="text-secondary small p-3 text-center">
            Precedent relationship analysis available in Comparator view.
          </div>
        `);
      });
  }

  /* -------------------------------------------------------------------------
     Advanced Mozilla PDF.js Engine: Selectable TextLayer, Thumbnails & Search
     ------------------------------------------------------------------------- */
  const $canvasWrapper = $('#canvas-wrapper');
  const $textLayer = $('#pdf-text-layer');
  const $thumbnailsDrawer = $('#pdf-thumbnails-drawer');
  const $thumbnailsList = $('#thumbnails-list');
  const $matchCounter = $('#pdf-match-counter');
  const $searchPrevBtn = $('#pdf-search-prev');
  const $searchNextBtn = $('#pdf-search-next');
  const $searchInput = $('#pdf-search-input');
  const $fullscreenBtn = $('#pdf-fullscreen-btn');
  const $fullscreenIcon = $('#pdf-fullscreen-icon');
  const $printBtn = $('#pdf-print-btn');
  const $toggleThumbnailsBtn = $('#pdf-toggle-thumbnails');

  // Search matches state
  let searchMatches = []; // array of { pageNum, text }
  let currentMatchIdx = -1;

  function renderPage(num) {
    pageRendering = true;
    pdfDoc.getPage(num).then(function (page) {
      const canvas = document.getElementById('pdf-canvas');
      const ctx = canvas.getContext('2d');
      const viewport = page.getViewport({ scale: scale, rotation: rotation });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Position text layer exactly over the canvas
      $textLayer.css({
        width: viewport.width + 'px',
        height: viewport.height + 'px'
      }).empty();

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      const renderTask = page.render(renderContext);
      renderTask.promise.then(function () {
        pageRendering = false;

        // Render selectable text layer
        page.getTextContent().then(function (textContent) {
          const query = $searchInput.val().trim().toLowerCase();

          textContent.items.forEach(function (item) {
            const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
            const fontHeight = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));

            const span = document.createElement('span');
            let itemText = item.str;

            if (query && itemText.toLowerCase().includes(query)) {
              span.className = 'highlight';
            }

            span.textContent = itemText;
            span.style.left = (tx[4]) + 'px';
            span.style.top = (tx[5] - fontHeight) + 'px';
            span.style.fontSize = fontHeight + 'px';
            span.style.fontFamily = item.fontName || 'sans-serif';
            document.getElementById('pdf-text-layer').appendChild(span);
          });
        });

        // Highlight active thumbnail
        $('.lg-thumbnail-item').removeClass('active');
        $(`#thumb-page-${num}`).addClass('active');

        if (pageNumPending !== null) {
          renderPage(pageNumPending);
          pageNumPending = null;
        }
      });
    });

    $pdfCurrentPage.val(num);
  }

  function queueRenderPage(num) {
    if (pageRendering) {
      pageNumPending = num;
    } else {
      renderPage(num);
    }
  }

  function onPrevPage() {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
  }

  function onNextPage() {
    if (!pdfDoc || pageNum >= pdfDoc.numPages) return;
    pageNum++;
    queueRenderPage(pageNum);
  }

  /**
   * Render thumbnail canvas previews in sidebar drawer.
   */
  function renderThumbnails() {
    $thumbnailsList.empty();
    if (!pdfDoc) return;

    for (let i = 1; i <= Math.min(pdfDoc.numPages, 30); i++) {
      const pageIndex = i;
      const thumbId = `thumb-page-${pageIndex}`;
      const thumbHtml = `
        <div class="lg-thumbnail-item ${pageIndex === pageNum ? 'active' : ''}" id="${thumbId}" data-page="${pageIndex}">
          <canvas id="thumb-canvas-${pageIndex}"></canvas>
          <div class="lg-thumbnail-label">Page ${pageIndex}</div>
        </div>
      `;
      $thumbnailsList.append(thumbHtml);

      // Render miniature page thumbnail
      pdfDoc.getPage(pageIndex).then(function (page) {
        const thumbCanvas = document.getElementById(`thumb-canvas-${pageIndex}`);
        if (!thumbCanvas) return;
        const ctx = thumbCanvas.getContext('2d');
        const viewport = page.getViewport({ scale: 0.22 });
        thumbCanvas.width = viewport.width;
        thumbCanvas.height = viewport.height;
        page.render({ canvasContext: ctx, viewport: viewport });
      });
    }

    // Click handler on thumbnail to jump to page
    $('.lg-thumbnail-item').on('click', function () {
      const targetPage = parseInt($(this).data('page'), 10);
      if (!isNaN(targetPage)) {
        pageNum = targetPage;
        queueRenderPage(pageNum);
      }
    });
  }

  /**
   * Search within entire PDF document.
   */
  function searchInPdf() {
    const q = $searchInput.val().trim().toLowerCase();
    searchMatches = [];
    currentMatchIdx = -1;

    if (!q || !pdfDoc) {
      $matchCounter.text('');
      $searchPrevBtn.prop('disabled', true);
      $searchNextBtn.prop('disabled', true);
      queueRenderPage(pageNum);
      return;
    }

    $matchCounter.text('Searching...');
    const searchPromises = [];

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      searchPromises.push(
        pdfDoc.getPage(i).then(function (p) {
          return p.getTextContent().then(function (tc) {
            const pageText = tc.items.map(it => it.str).join(' ').toLowerCase();
            if (pageText.includes(q)) {
              return p.pageNumber;
            }
            return null;
          });
        })
      );
    }

    Promise.all(searchPromises).then(function (pagesWithMatches) {
      searchMatches = pagesWithMatches.filter(Boolean);

      if (searchMatches.length > 0) {
        currentMatchIdx = 0;
        $matchCounter.text(`Page ${searchMatches[0]} (1 of ${searchMatches.length})`);
        $searchPrevBtn.prop('disabled', false);
        $searchNextBtn.prop('disabled', false);
        pageNum = searchMatches[0];
        queueRenderPage(pageNum);
      } else {
        $matchCounter.text('0 matches');
        $searchPrevBtn.prop('disabled', true);
        $searchNextBtn.prop('disabled', true);
      }
    });
  }

  // Load PDF when PDF tab is clicked
  let pdfLoaded = false;
  $('#tab-pdf-btn').on('shown.bs.tab', function () {
    if (pdfLoaded) return;
    pdfLoaded = true;

    const pdfUrl = LG.api.cases.getOfficialContentUrl(caseId);

    if (window.pdfjsLib) {
      window.pdfjsLib.getDocument({
        url: pdfUrl,
        withCredentials: true
      }).promise.then(function (loadedDoc) {
        pdfDoc = loadedDoc;
        $pdfTotalPages.text(pdfDoc.numPages);
        $pdfLoading.addClass('d-none');
        $canvasWrapper.removeClass('d-none');
        renderPage(pageNum);
        renderThumbnails();
      }).catch(function (err) {
        console.warn('PDF.js stream issue, falling back:', err);
        $pdfLoading.addClass('d-none');
        if (currentCase && (currentCase.raw_text || currentCase.summary)) {
          $pdfFallbackText.removeClass('d-none').text(currentCase.raw_text || currentCase.summary);
        } else {
          $pdfFallbackText.removeClass('d-none').html(`
            <div class="text-center py-4">
              <i class="bi bi-file-earmark-pdf fs-1 text-danger mb-2"></i>
              <p class="text-secondary small">Direct PDF rendering requires downloaded stream.</p>
              <a href="${LG.api.cases.getDownloadUrl(caseId)}" class="btn btn-sm btn-gold" target="_blank">
                <i class="bi bi-download me-1"></i>Download Official PDF
              </a>
            </div>
          `);
        }
      });
    }
  });

  // PDF Viewer Controls Handlers
  $('#pdf-prev-page').on('click', onPrevPage);
  $('#pdf-next-page').on('click', onNextPage);

  $pdfCurrentPage.on('change', function () {
    const val = parseInt($(this).val(), 10);
    if (!isNaN(val) && val >= 1 && pdfDoc && val <= pdfDoc.numPages) {
      pageNum = val;
      queueRenderPage(pageNum);
    }
  });

  $('#pdf-zoom-in').on('click', function () {
    scale += 0.25;
    $pdfZoomLevel.text(Math.round(scale * 100) + '%');
    if (pdfDoc) queueRenderPage(pageNum);
  });

  $('#pdf-zoom-out').on('click', function () {
    if (scale <= 0.5) return;
    scale -= 0.25;
    $pdfZoomLevel.text(Math.round(scale * 100) + '%');
    if (pdfDoc) queueRenderPage(pageNum);
  });

  $('#pdf-rotate').on('click', function () {
    rotation = (rotation + 90) % 360;
    if (pdfDoc) queueRenderPage(pageNum);
  });

  // Search Input Handler
  $searchInput.on('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchInPdf();
    }
  });

  $searchNextBtn.on('click', function () {
    if (searchMatches.length === 0) return;
    currentMatchIdx = (currentMatchIdx + 1) % searchMatches.length;
    pageNum = searchMatches[currentMatchIdx];
    $matchCounter.text(`Page ${pageNum} (${currentMatchIdx + 1} of ${searchMatches.length})`);
    queueRenderPage(pageNum);
  });

  $searchPrevBtn.on('click', function () {
    if (searchMatches.length === 0) return;
    currentMatchIdx = (currentMatchIdx - 1 + searchMatches.length) % searchMatches.length;
    pageNum = searchMatches[currentMatchIdx];
    $matchCounter.text(`Page ${pageNum} (${currentMatchIdx + 1} of ${searchMatches.length})`);
    queueRenderPage(pageNum);
  });

  // Fullscreen Mode Handler
  $fullscreenBtn.on('click', function () {
    const container = document.getElementById('pdf-main-container');
    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
      $(container).addClass('fullscreen');
      $fullscreenIcon.attr('class', 'bi bi-fullscreen-exit');
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      $(container).removeClass('fullscreen');
      $fullscreenIcon.attr('class', 'bi bi-fullscreen');
    }
  });

  // Print Button Handler
  $printBtn.on('click', function () {
    window.print();
  });

  // Toggle Thumbnails Drawer
  $toggleThumbnailsBtn.on('click', function () {
    $thumbnailsDrawer.toggleClass('collapsed');
  });

  // Bookmark Button Handler
  $bookmarkBtn.on('click', function () {
    if (!LG.session.isAuthenticated()) {
      LG.toast('Please sign in to save research bookmarks.', 'warning');
      return;
    }
    LG.api.bookmarks.add(caseId, 'Saved from Case Viewer')
      .done(function () {
        LG.toast('Case saved to your bookmarks!', 'success');
        $bookmarkBtn.find('i').attr('class', 'bi bi-bookmark-fill text-warning');
      })
      .fail(function () {
        LG.toast('Case is already in your bookmarks or error occurred.', 'info');
      });
  });
});
