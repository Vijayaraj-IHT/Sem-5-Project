import re

# 1. Update case-compare.html in both repos
for html_path in [
    r"E:\SEM 5 PROJECT\Lexguard\lexguard-html\case-compare.html",
    r"E:\SEM 5 PROJECT\LexGuard-HTML\frontend\case-compare.html"
]:
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    old_target_col = """          <!-- Target Case -->
          <div class="col-md-6 col-lg-3">
            <label for="select-target-case" class="form-label text-warning small fw-semibold">
              <i class="bi bi-file-earmark-person me-1"></i>Target Case / Petition
            </label>
            <select class="form-select form-select-sm" id="select-target-case">
              <option value="">Choose Target Case...</option>
            </select>
          </div>"""

    new_target_col = """          <!-- Target Case -->
          <div class="col-md-6 col-lg-3">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <label for="select-target-case" class="form-label text-warning small fw-semibold mb-0">
                <i class="bi bi-file-earmark-person me-1"></i>Target Case / Petition
              </label>
              <button type="button" class="btn btn-link p-0 text-info text-decoration-none" id="toggle-pdf-target" style="font-size: 0.74rem;">
                <i class="bi bi-file-earmark-arrow-up me-1"></i><span id="toggle-pdf-label">Upload PDF</span>
              </button>
            </div>
            <select class="form-select form-select-sm" id="select-target-case">
              <option value="">Choose Target Case...</option>
            </select>
            <div id="target-pdf-box" class="d-none mt-2 p-2 text-center rounded border border-info border-opacity-50 bg-dark">
              <input type="file" id="target-pdf-input" accept=".pdf" class="d-none">
              <button type="button" class="btn btn-sm btn-outline-info w-100 py-1" id="btn-pick-pdf" style="font-size: 0.78rem;">
                <i class="bi bi-cloud-arrow-up me-1"></i>Choose Target PDF
              </button>
              <div id="target-pdf-info" class="text-truncate text-secondary mt-1 font-mono" style="font-size: 0.72rem;"></div>
            </div>
          </div>"""

    if old_target_col in html:
        html = html.replace(old_target_col, new_target_col)
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"Updated HTML: {html_path}")
    else:
        print(f"Old target col not found in {html_path}")

# 2. Update case-compare.js in both repos
for js_path in [
    r"E:\SEM 5 PROJECT\Lexguard\lexguard-html\js\pages\case-compare.js",
    r"E:\SEM 5 PROJECT\LexGuard-HTML\frontend\js\pages\case-compare.js"
]:
    with open(js_path, "r", encoding="utf-8") as f:
        js = f.read()

    # Add PDF handler logic into case-compare.js
    pdf_logic = """
  // ---------------------------------------------------------------------------
  // Target PDF Direct Upload & SHA-256 Extraction
  // ---------------------------------------------------------------------------
  let uploadedPdfTarget = null;
  const $togglePdfBtn = $('#toggle-pdf-target');
  const $togglePdfLabel = $('#toggle-pdf-label');
  const $pdfBox = $('#target-pdf-box');
  const $pdfInput = $('#target-pdf-input');
  const $pickPdfBtn = $('#btn-pick-pdf');
  const $pdfInfo = $('#target-pdf-info');

  $togglePdfBtn.on('click', function (e) {
    e.preventDefault();
    if ($pdfBox.hasClass('d-none')) {
      $pdfBox.removeClass('d-none');
      $targetSelect.addClass('d-none');
      $togglePdfLabel.text('Select from List');
    } else {
      $pdfBox.addClass('d-none');
      $targetSelect.removeClass('d-none');
      $togglePdfLabel.text('Upload PDF');
      uploadedPdfTarget = null;
      $pdfInfo.text('');
    }
  });

  $pickPdfBtn.on('click', function () {
    $pdfInput.trigger('click');
  });

  $pdfInput.on('change', async function () {
    const file = this.files[0];
    if (!file) return;

    $pdfInfo.html('<span class="spinner-border spinner-border-sm text-info"></span> Hashing PDF...');
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Check if hash matches an existing case
      let matchedCase = null;
      Object.values(precedentsCache).forEach(p => {
        if (p.file_hash && p.file_hash.toLowerCase() === hashHex.toLowerCase()) {
          matchedCase = p;
        }
      });

      if (matchedCase) {
        uploadedPdfTarget = {
          id: matchedCase.id,
          title: matchedCase.title,
          court: matchedCase.court,
          case_no: matchedCase.case_no,
          file_hash: hashHex,
          facts: matchedCase.facts || matchedCase.summary,
          summary: matchedCase.summary,
          section_tags: matchedCase.section_tags,
          outcome: matchedCase.outcome
        };
        $pdfInfo.html(`<span class="text-success"><i class="bi bi-shield-check me-1"></i>${LG.utils.escapeHtml(matchedCase.title)}</span>`);
        LG.toast(`Matched verified repository case: ${matchedCase.case_no}`, 'success');
      } else {
        uploadedPdfTarget = {
          id: null,
          title: file.name.replace(/\\.pdf$/i, ''),
          court: 'High Court of Judicature',
          case_no: file.name.replace(/\\.pdf$/i, ''),
          file_hash: hashHex,
          facts: 'Uploaded petition: ' + file.name,
          summary: 'Uploaded petition: ' + file.name,
          section_tags: [],
          outcome: 'Allowed'
        };
        $pdfInfo.html(`<span class="text-warning"><i class="bi bi-file-earmark-pdf me-1"></i>${LG.utils.escapeHtml(file.name)}</span> (SHA: ${hashHex.substring(0, 8)}...)`);
      }
    } catch (err) {
      $pdfInfo.html('<span class="text-danger">Failed to process PDF</span>');
      LG.toast('Error reading PDF file.', 'danger');
    }
  });
"""

    if "target_file_hash: target.file_hash || null" in js and "uploadedPdfTarget" not in js:
        # Update target resolution in runMultiComparison
        target_resolution_old = "    const selectedPrecedentIds = [p1Id, p2Id, p3Id].filter(Boolean);\n    const target = precedentsCache[targetId] || {};"
        target_resolution_new = """    const selectedPrecedentIds = [p1Id, p2Id, p3Id].filter(Boolean);
    const target = uploadedPdfTarget || precedentsCache[targetId] || {};"""

        js = js.replace(target_resolution_old, target_resolution_new)
        # Inject pdf logic right before the end of $(document).ready
        js = re.sub(r"\}\);\s*$", pdf_logic + "\n});\n", js)
        with open(js_path, "w", encoding="utf-8") as f:
            f.write(js)
        print(f"Updated JS: {js_path}")
    else:
        print(f"JS already updated or pattern not found in {js_path}")
