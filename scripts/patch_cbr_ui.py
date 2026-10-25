import re

# 1. Update case-compare.html in both repos
for html_path in [
    r"E:\SEM 5 PROJECT\Lexguard\lexguard-html\case-compare.html",
    r"E:\SEM 5 PROJECT\LexGuard-HTML\frontend\case-compare.html"
]:
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    old_desc_block = """                <p class="text-secondary small mb-0" id="best-match-desc">
                  Highest factual and statutory alignment across evaluated precedent authorities.
                </p>"""

    new_desc_block = """                <p class="text-secondary small mb-0" id="best-match-desc">
                  Highest factual and statutory alignment across evaluated precedent authorities.
                </p>
                <div class="mt-2 d-flex flex-wrap gap-2 align-items-center" id="cbr-objects-badge-container">
                  <span class="badge bg-success font-mono" id="cbr-distinguishability-badge"><i class="bi bi-shield-check me-1"></i>Binding Precedent</span>
                  <div class="small text-warning" id="cbr-matched-summary-terms"></div>
                </div>"""

    if old_desc_block in html:
        html = html.replace(old_desc_block, new_desc_block)
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"Updated HTML: {html_path}")
    else:
        print(f"Old desc block not found in {html_path}")

# 2. Update case-compare.js in both repos
for js_path in [
    r"E:\SEM 5 PROJECT\Lexguard\lexguard-html\js\pages\case-compare.js",
    r"E:\SEM 5 PROJECT\LexGuard-HTML\frontend\js\pages\case-compare.js"
]:
    with open(js_path, "r", encoding="utf-8") as f:
        js = f.read()

    old_render_block = """    // Find best precedent object
    const bestPrecedent = precedentsCache[res.best_match_id] || results[0].precedent || {};
    $bestTitle.text(bestPrecedent.title || 'Landmark Precedent');
    $bestDesc.text(`Highest dimensional score (${bestScore}%) based on statutory overlap, bench hierarchy, and remedy congruence.`);"""

    new_render_block = """    // Find best precedent object
    const bestPrecedent = precedentsCache[res.best_match_id] || results[0].precedent || {};
    $bestTitle.text(bestPrecedent.title || 'Landmark Precedent');
    $bestDesc.text(`Highest dimensional score (${bestScore}%) based on statutory concordance, scenario matching, and remedy congruence.`);

    // CBR Comparison Objects & Distinguishability
    const $distBadge = $('#cbr-distinguishability-badge');
    const $matchedTerms = $('#cbr-matched-summary-terms');
    const rating = res.results && res.results[0] ? res.results[0].distinguishability_rating : 'Analogous Precedent';
    $distBadge.text(rating);
    if (bestScore >= 90) {
      $distBadge.removeClass('bg-warning bg-secondary').addClass('bg-success');
    } else if (bestScore >= 65) {
      $distBadge.removeClass('bg-success bg-secondary').addClass('bg-warning text-dark');
    } else {
      $distBadge.removeClass('bg-success bg-warning text-dark').addClass('bg-secondary');
    }

    const matchedScen = (res.results && res.results[0] && res.results[0].matched_scenario_terms) || [];
    const matchedAct = (res.results && res.results[0] && res.results[0].matched_activity_terms) || [];
    const allMatched = matchedScen.concat(matchedAct);
    if (allMatched.length > 0) {
      $matchedTerms.html('<i class="bi bi-tags-fill me-1"></i>Matched Concept Sets: ' + allMatched.map(t => `<span class="badge bg-dark border border-secondary text-light font-mono me-1">${LG.utils.escapeHtml(t)}</span>`).join(''));
    } else {
      $matchedTerms.html('');
    }"""

    if old_render_block in js:
        js = js.replace(old_render_block, new_render_block)
        with open(js_path, "w", encoding="utf-8") as f:
            f.write(js)
        print(f"Updated JS: {js_path}")
    else:
        print(f"Old render block not found in {js_path}")
