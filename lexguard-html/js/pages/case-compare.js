/**
 * LexGuard — Precedent Comparator Controller (case-compare.js)
 * Semester 5 Project · LexGuard Judicial Repository & Verification Platform
 */

$(document).ready(function () {
  'use strict';

  const $select1 = $('#select-case-1');
  const $select2 = $('#select-case-2');
  const $compareBtn = $('#run-compare-btn');
  const $loading = $('#compare-loading');
  const $resultsContainer = $('#compare-results-container');
  const $swapBtn = $('#swap-cases-btn');

  let casesCache = {};

  /**
   * Load precedents into both select dropdowns.
   */
  function loadPrecedents() {
    LG.api.comparison.getPrecedents()
      .done(function (precedents) {
        let opts1 = '<option value="">Choose Case 1...</option>';
        let opts2 = '<option value="">Choose Precedent to Compare...</option>';

        (precedents || []).forEach(function (p) {
          casesCache[p.id] = p;
          const label = `${p.title} (${p.court}, ${p.year})`;
          opts1 += `<option value="${p.id}">${LG.utils.escapeHtml(label)}</option>`;
          opts2 += `<option value="${p.id}">${LG.utils.escapeHtml(label)}</option>`;
        });

        $select1.html(opts1);
        $select2.html(opts2);

        // Check URL parameters ?case1=...&case2=...
        const param1 = LG.utils.getQueryParam('case1');
        const param2 = LG.utils.getQueryParam('case2');

        if (param1) {
          $select1.val(param1);
        }
        if (param2) {
          $select2.val(param2);
        } else if (precedents && precedents.length > 1 && param1 && precedents[0].id === param1) {
          $select2.val(precedents[1].id);
        } else if (precedents && precedents.length > 1 && !param1) {
          $select1.val(precedents[0].id);
          $select2.val(precedents[1].id);
        }

        if ($select1.val() && $select2.val()) {
          runComparison();
        }
      })
      .fail(function () {
        LG.toast('Failed to load published precedent database.', 'danger');
      });
  }

  /**
   * Run comparison between selected Case 1 and Case 2.
   */
  function runComparison() {
    const id1 = $select1.val();
    const id2 = $select2.val();

    if (!id1 || !id2) {
      LG.toast('Please select both cases for comparison.', 'warning');
      return;
    }

    if (id1 === id2) {
      LG.toast('Please select two distinct cases to analyze divergence.', 'warning');
      return;
    }

    $loading.removeClass('d-none');
    $resultsContainer.addClass('d-none');

    const c1 = casesCache[id1] || {};
    const c2 = casesCache[id2] || {};

    const payload = {
      precedent_case_id: id2,
      case_title: c1.title || 'Target Case',
      court_jurisdiction: c1.court || 'High Court of Judicature',
      facts_summary: c1.summary || c1.ratio_decidendi || 'Factual matrix of dispute and statutory challenge.',
      statutory_provisions: (c1.section_tags || c1.sections || []).length > 0 ? (c1.section_tags || c1.sections) : ['Section 482 CrPC'],
      legal_issues: [c1.ratio_decidendi || 'Substantive question of law and judicial precedent applicability']
    };

    LG.api.comparison.compare(payload.precedent_case_id, payload.precedent_case_id) // api wrapper will use options
    // Let's call the actual endpoint directly via LG.api.request
    LG.api.request({
      url: '/comparison/compare',
      method: 'POST',
      data: payload
    })
      .done(function (res) {
        renderComparisonResults(res, c1, c2);
      })
      .fail(function (xhr) {
        let msg = 'Failed to execute precedent comparison.';
        if (xhr.responseJSON && xhr.responseJSON.detail) {
          msg = typeof xhr.responseJSON.detail === 'string'
            ? xhr.responseJSON.detail
            : JSON.stringify(xhr.responseJSON.detail);
        }
        LG.toast(msg, 'danger');
      })
      .always(function () {
        $loading.addClass('d-none');
      });
  }

  /**
   * Render comparison result matrix and score ring.
   */
  function renderComparisonResults(res, c1, c2) {
    $resultsContainer.removeClass('d-none');

    const score = Math.round(res.overall_score || 0);

    // Update SVG Score Ring
    const circumference = 220;
    const offset = circumference - (score / 100) * circumference;
    $('#score-ring-circle').css('stroke-dashoffset', offset);
    $('#score-ring-text').text(score + '%');

    // Score Tier Badge & Title
    let tierText = 'Distinct Factual Matrix';
    let tierClass = 'badge bg-secondary';
    if (score >= 75) {
      tierText = 'High Precedential Alignment';
      tierClass = 'badge bg-success';
    } else if (score >= 50) {
      tierText = 'Moderate Statutory Overlap';
      tierClass = 'badge badge-gold';
    } else if (score >= 25) {
      tierText = 'Partial Dimension Alignment';
      tierClass = 'badge bg-info text-dark';
    }
    $('#score-tier-badge').attr('class', tierClass).text(tierText);

    // 5 Dimensions Matrix Table
    const dimensions = res.dimensions || [];
    const rowsHtml = dimensions.map(function (dim) {
      let stateBadge = 'badge bg-secondary';
      if (dim.match_state === 'exact') stateBadge = 'badge bg-success';
      else if (dim.match_state === 'partial') stateBadge = 'badge badge-gold';
      else if (dim.match_state === 'different') stateBadge = 'badge bg-danger';

      const dimScore = Math.round(dim.dimension_score || 0);

      return `
        <tr>
          <td>
            <div class="fw-semibold text-light">${LG.utils.escapeHtml(dim.dimension_name)}</div>
            <div class="text-secondary small mt-1" style="font-size: 0.78rem;">${LG.utils.escapeHtml(dim.explanation || '')}</div>
          </td>
          <td class="font-mono text-light small">${LG.utils.escapeHtml(dim.user_value || '—')}</td>
          <td class="font-mono text-secondary small">${LG.utils.escapeHtml(dim.precedent_value || '—')}</td>
          <td><span class="${stateBadge}">${LG.utils.escapeHtml(dim.match_state)}</span></td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div class="progress flex-grow-1" style="height: 6px; background-color: #0c1019;">
                <div class="progress-bar ${dimScore >= 70 ? 'bg-success' : dimScore >= 40 ? 'bg-warning' : 'bg-secondary'}" role="progressbar" style="width: ${dimScore}%;"></div>
              </div>
              <span class="small fw-bold text-light">${dimScore}%</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    $('#matrix-table-body').html(rowsHtml);

    // Render Case 1 Details Box
    $('#case1-details-box').html(`
      <h5 class="h6 fw-bold text-light mb-1">${LG.utils.escapeHtml(c1.title || 'Case 1')}</h5>
      <p class="mb-2 text-warning small">${LG.utils.escapeHtml(c1.court || '')} · ${c1.year || ''}</p>
      <div class="mb-2"><strong>Case No:</strong> ${LG.utils.escapeHtml(c1.case_no || '—')}</div>
      <div class="mb-2"><strong>Disposition:</strong> ${LG.utils.escapeHtml(c1.disposition || '—')}</div>
      <div><strong>Statutes:</strong> ${(c1.section_tags || []).join(', ') || 'General provisions'}</div>
    `);

    // Render Case 2 Details Box
    $('#case2-details-box').html(`
      <h5 class="h6 fw-bold text-light mb-1">${LG.utils.escapeHtml(c2.title || 'Precedent Case')}</h5>
      <p class="mb-2 text-warning small">${LG.utils.escapeHtml(c2.court || '')} · ${c2.year || ''}</p>
      <div class="mb-2"><strong>Case No:</strong> ${LG.utils.escapeHtml(c2.case_no || '—')}</div>
      <div class="mb-2"><strong>Precedential Status:</strong> <span class="badge bg-success">${LG.utils.escapeHtml(c2.precedential_status || 'Binding')}</span></div>
      <div><strong>Statutes:</strong> ${(c2.section_tags || []).join(', ') || 'General provisions'}</div>
    `);
  }

  // Event Handlers
  $compareBtn.on('click', runComparison);

  $swapBtn.on('click', function () {
    const val1 = $select1.val();
    const val2 = $select2.val();
    $select1.val(val2);
    $select2.val(val1);
    runComparison();
  });

  // Init
  loadPrecedents();
});
