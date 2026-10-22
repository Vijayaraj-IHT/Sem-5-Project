/**
 * LexGuard — AI Draft Assistant Controller (draft-assistant.js)
 * Semester 5 Project · LexGuard Judicial Repository & Verification Platform
 */

$(document).ready(function () {
  'use strict';

  // Role validation: Requires Advocate, Scholar, or Court Staff
  if (!LG.session.isAuthenticated()) {
    LG.toast('Draft Assistant requires an Advocate or Legal Scholar account. Please sign in.', 'warning');
    setTimeout(function () {
      window.location.href = 'login.html?redirect=' + encodeURIComponent('draft-assistant.html');
    }, 1200);
    return;
  }

  const $editor = $('#petition-editor');
  const $wordCount = $('#word-count');
  const $charCount = $('#char-count');
  const $templateSelect = $('#template-select');
  const $analyzeBtn = $('#run-analyze-btn');
  const $loadSampleBtn = $('#load-sample-btn');

  const $emptyState = $('#analysis-empty-state');
  const $loading = $('#analysis-loading');
  const $results = $('#analysis-results');
  const $statusBadge = $('#analysis-status-badge');

  const $groundsList = $('#identified-grounds-list');
  const $missingList = $('#missing-arguments-list');
  const $sectionsBox = $('#suggested-sections-box');
  const $citationsList = $('#citations-list');
  const $disclaimer = $('#analysis-disclaimer');

  // Sample Templates
  const templates = {
    quash: `IN THE HIGH COURT OF JUDICATURE AT MADRAS
(CRIMINAL MISCELLANEOUS JURISDICTION)

CRL. O.P. NO. 4521 OF 2026

BETWEEN:
K. Senthil Kumar,
S/o. Late Ramanathan,
Residing at No. 42, Anna Nagar West, Chennai - 600040.
                                                    ... Petitioner / Accused No. 1
                                    AND
1. State represented by
   The Inspector of Police,
   Central Crime Branch, Chennai.
   (Crime No. 128/2025)

2. M/s. Global Tech Solutions Pvt. Ltd.,
   Rep. by its Director, V. Anand.
                                                    ... Respondents / Complainants

PETITION UNDER SECTION 482 OF THE CODE OF CRIMINAL PROCEDURE, 1973

The Petitioner above-named states as follows:

1. The Petitioner is arrayed as Accused No. 1 in Crime No. 128 of 2025 on the file of the 1st Respondent Police for alleged offences punishable under Sections 406 and 420 of the Indian Penal Code, 1860.

2. It is respectfully submitted that the dispute between the Petitioner and the 2nd Respondent arises out of a commercial software service agreement dated 15.01.2023. The dispute is purely civil and contractual in nature regarding reconciliation of project milestone payments.

3. The allegations in the FIR, even if taken on their face value and accepted in their entirety, do not prima facie constitute any offence of cheating or criminal breach of trust. There is no fraudulent or dishonest intention at the inception of the transaction.

4. The criminal proceedings initiated by the 2nd Respondent are an abuse of process of the Court intended solely to exert unlawful pressure for commercial recovery.

PRAYER:
Wherefore, it is prayed that this Hon'ble Court may be pleased to call for the records in Crime No. 128 of 2025 on the file of the 1st Respondent Police and quash the same as against the Petitioner.`,

    bail: `IN THE HIGH COURT OF JUDICATURE AT MADRAS
(CRIMINAL ORIGINAL JURISDICTION)

CRL. O.P. NO. 7890 OF 2026

PETITION FOR ANTICIPATORY BAIL UNDER SECTION 438 OF Cr.P.C.

BETWEEN:
R. Rajesh Kumar                                     ... Petitioner / Accused
                                    AND
The State, rep. by Inspector of Police,
Cyber Crime Division, Chennai.                       ... Respondent / Prosecution

1. The Petitioner apprehends arrest at the hands of the Respondent Police in connection with an alleged enquiry relating to financial transactions.
2. The Petitioner is an innocent citizen having deep roots in the community and is ready to cooperate fully with the investigation.
3. Personal liberty guaranteed under Article 21 of the Constitution of India must be protected against arbitrary and unwarranted arrest.`,

    writ: `IN THE HIGH COURT OF JUDICATURE AT MADRAS
(EXTRAORDINARY ORIGINAL WRIT JURISDICTION)

W.P. NO. 11200 OF 2026

WRIT OF MANDAMUS UNDER ARTICLE 226 OF THE CONSTITUTION OF INDIA

1. The Petitioner challenges the arbitrary inaction of the Respondent Authorities in disposing of the statutory representation dated 12.02.2025.
2. The principles of natural justice and audi alteram partem have been violated.`
  };

  /**
   * Update word and character counters.
   */
  function updateCounters() {
    const text = $editor.val();
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    $charCount.text(chars);
    $wordCount.text(words);
  }

  $editor.on('input propertychange', updateCounters);

  // Template Selection Change
  $templateSelect.on('change', function () {
    const key = $(this).val();
    if (key && templates[key]) {
      $editor.val(templates[key]);
      updateCounters();
      LG.toast('Sample petition template loaded into editor.', 'info');
    }
  });

  $loadSampleBtn.on('click', function () {
    $templateSelect.val('quash').trigger('change');
  });

  /**
   * Run AI Gap Analysis.
   */
  function runGapAnalysis() {
    const petitionText = $editor.val().trim();
    if (petitionText.length < 20) {
      LG.toast('Please write or paste a petition draft (at least 20 characters).', 'warning');
      return;
    }

    $emptyState.addClass('d-none');
    $results.addClass('d-none');
    $loading.removeClass('d-none');
    $statusBadge.attr('class', 'badge badge-gold').text('Analyzing Grounds...');
    $analyzeBtn.prop('disabled', true);

    LG.api.request({
      url: '/draft/analyze',
      method: 'POST',
      data: {
        petition_text: petitionText,
        title: 'Draft Petition Analysis'
      }
    })
      .done(function (res) {
        $statusBadge.attr('class', 'badge bg-success').text('Analysis Complete');

        // 1. Identified Grounds
        const grounds = res.identified_grounds || [];
        if (grounds.length > 0) {
          $groundsList.html(grounds.map(g => `<li class="mb-1">${LG.utils.escapeHtml(g)}</li>`).join(''));
        } else {
          $groundsList.html('<li class="text-secondary">No strong primary statutory grounds clearly parsed.</li>');
        }

        // 2. Missing Arguments
        const missing = res.missing_arguments || [];
        if (missing.length > 0) {
          $missingList.html(missing.map(m => `<li class="mb-1">${LG.utils.escapeHtml(m)}</li>`).join(''));
        } else {
          $missingList.html('<li class="text-success">No critical procedural arguments omitted.</li>');
        }

        // 3. Suggested Sections
        const sections = res.suggested_sections || [];
        if (sections.length > 0) {
          $sectionsBox.html(sections.map(s => `<span class="badge bg-dark text-info border border-info border-opacity-30 me-1 mb-1 p-2">${LG.utils.escapeHtml(s)}</span>`).join(''));
        } else {
          $sectionsBox.html('<span class="text-secondary small">General criminal and constitutional provisions applicable.</span>');
        }

        // 4. Grounded Precedent Citations
        const citations = res.citation_suggestions || [];
        if (citations.length > 0) {
          const citHtml = citations.map(function (c) {
            return `
              <div class="card card-judicial p-3 border-secondary border-opacity-25">
                <div class="d-flex align-items-start justify-content-between gap-2 mb-2">
                  <div>
                    <h5 class="h6 fw-bold text-light mb-0">${LG.utils.escapeHtml(c.case_title)}</h5>
                    <div class="small text-warning font-mono">${LG.utils.escapeHtml(c.citation)}</div>
                  </div>
                  <a href="case-viewer.html?id=${encodeURIComponent(c.case_id)}" class="btn btn-xs btn-judicial-outline" target="_blank">
                    <i class="bi bi-box-arrow-up-right me-1"></i>View Case
                  </a>
                </div>

                <p class="small text-secondary mb-2 fst-italic">"${LG.utils.escapeHtml(c.quote || c.reasoning || '')}"</p>

                <div class="d-flex align-items-center justify-content-between pt-2 border-top border-secondary border-opacity-15">
                  <span class="badge bg-secondary small">${LG.utils.escapeHtml(c.relevant_section || 'Sec. 482')}</span>
                  <button type="button" class="btn btn-xs btn-gold insert-citation-btn" data-citation="${LG.utils.escapeHtml(c.citation)}" data-title="${LG.utils.escapeHtml(c.case_title)}">
                    <i class="bi bi-plus-lg me-1"></i>Insert into Draft
                  </button>
                </div>
              </div>
            `;
          }).join('');
          $citationsList.html(citHtml);
        } else {
          $citationsList.html('<div class="text-secondary small">No specific precedent match found for this factual subset.</div>');
        }

        if (res.disclaimer) {
          $disclaimer.text(res.disclaimer);
        }

        $results.removeClass('d-none');
        LG.toast('AI Gap Analysis complete! Review suggestions on right pane.', 'success');

        // Attach Insert Citation Button Handlers
        $('.insert-citation-btn').on('click', function () {
          const title = $(this).data('title');
          const cit = $(this).data('citation');
          const insertText = `\n\nIn accordance with the law laid down by the Hon'ble Supreme Court in ${title} (${cit}), it is well settled that where the allegations in the FIR do not prima facie disclose the commission of any cognizable offence, continuation of the proceedings constitutes a clear abuse of process of the Court.`;

          const currentVal = $editor.val();
          $editor.val(currentVal + insertText);
          updateCounters();
          LG.toast(`Inserted citation for "${title}" into petition draft.`, 'success');
        });
      })
      .fail(function (xhr) {
        $statusBadge.attr('class', 'badge bg-danger').text('Analysis Failed');
        let msg = 'Failed to analyze draft petition.';
        if (xhr.responseJSON && xhr.responseJSON.detail) {
          msg = typeof xhr.responseJSON.detail === 'string'
            ? xhr.responseJSON.detail
            : JSON.stringify(xhr.responseJSON.detail);
        }
        LG.toast(msg, 'danger');
        $emptyState.removeClass('d-none');
      })
      .always(function () {
        $loading.addClass('d-none');
        $analyzeBtn.prop('disabled', false);
      });
  }

  $analyzeBtn.on('click', runGapAnalysis);

  // Auto-load template if editor is empty
  if (!$editor.val()) {
    $templateSelect.val('quash').trigger('change');
  }
});
