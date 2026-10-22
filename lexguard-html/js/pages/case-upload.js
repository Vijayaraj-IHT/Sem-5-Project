/**
 * LexGuard — Case Ingestion & Upload Controller (case-upload.js)
 * Semester 5 Project · LexGuard Judicial Repository & Verification Platform
 */

$(document).ready(function () {
  'use strict';

  // 1. RBAC Check: Court Staff only
  if (!LG.requireAuth(['staff', 'court_staff', 'senior_staff'])) {
    return;
  }

  const $autoDropzone = $('#auto-dropzone');
  const $autoFileInput = $('#auto-file-input');
  const $autoBrowseBtn = $('#auto-browse-btn');
  const $autoFileLabel = $('#auto-file-label');
  const $autoSubmitBtn = $('#auto-submit-btn');
  const $autoProgress = $('#auto-upload-progress');
  const $autoForm = $('#auto-upload-form');

  const $manualForm = $('#manual-upload-form');
  const $manSubmitBtn = $('#man-submit-btn');

  const $successModal = new bootstrap.Modal(document.getElementById('uploadSuccessModal'));
  const $successCaseId = $('#success-case-id');
  const $successFileHash = $('#success-file-hash');
  const $successViewBtn = $('#success-view-case-btn');

  let selectedAutoFile = null;

  // File selection for Auto Ingestion
  function setAutoFile(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      LG.toast('Automated CIS extraction requires a PDF document.', 'warning');
      return;
    }
    selectedAutoFile = file;
    $autoFileLabel.html(`<i class="bi bi-file-earmark-check text-success me-2"></i>${LG.utils.escapeHtml(file.name)} (${Math.round(file.size / 1024)} KB)`);
    $autoSubmitBtn.prop('disabled', false);
  }

  $autoBrowseBtn.on('click', function () {
    $autoFileInput.trigger('click');
  });

  $autoFileInput.on('change', function () {
    if (this.files.length > 0) {
      setAutoFile(this.files[0]);
    }
  });

  // Drag and drop for Auto Ingestion
  $autoDropzone.on('dragover dragenter', function (e) {
    e.preventDefault();
    e.stopPropagation();
    $autoDropzone.addClass('dragover');
  });

  $autoDropzone.on('dragleave dragend drop', function (e) {
    e.preventDefault();
    e.stopPropagation();
    $autoDropzone.removeClass('dragover');
  });

  $autoDropzone.on('drop', function (e) {
    const files = e.originalEvent.dataTransfer.files;
    if (files.length > 0) {
      setAutoFile(files[0]);
    }
  });

  // Auto Upload Form Submit
  $autoForm.on('submit', function (e) {
    e.preventDefault();
    if (!selectedAutoFile) {
      LG.toast('Please select a PDF document to ingest.', 'warning');
      return;
    }

    $autoProgress.removeClass('d-none');
    $autoSubmitBtn.prop('disabled', true);

    const formData = new FormData();
    formData.append('file', selectedAutoFile);

    LG.api.upload.uploadAuto(formData)
      .done(function (res) {
        $successCaseId.text(res.id || 'N/A');
        $successFileHash.text(res.file_hash || 'SHA-256 Registered');
        $successViewBtn.attr('href', 'case-viewer.html?id=' + encodeURIComponent(res.id));
        $successModal.show();
        $autoForm[0].reset();
        $autoFileLabel.text('Choose or Drop Judgment PDF');
        selectedAutoFile = null;
        LG.toast('Document ingested and parsed by CIS engine!', 'success');
      })
      .fail(function (xhr) {
        let msg = 'Failed to ingest document.';
        if (xhr.responseJSON && xhr.responseJSON.detail) {
          msg = typeof xhr.responseJSON.detail === 'string'
            ? xhr.responseJSON.detail
            : JSON.stringify(xhr.responseJSON.detail);
        }
        LG.toast(msg, 'danger');
      })
      .always(function () {
        $autoProgress.addClass('d-none');
        $autoSubmitBtn.prop('disabled', false);
      });
  });

  // Manual Upload Form Submit
  $manualForm.on('submit', function (e) {
    e.preventDefault();
    const fileInput = document.getElementById('man-file');
    if (!fileInput.files.length) {
      LG.toast('Please select a judgment file (PDF or DOCX).', 'warning');
      return;
    }

    const title = $('#man-title').val().trim();
    const caseNo = $('#man-caseno').val().trim();
    const court = $('#man-court').val();
    const year = parseInt($('#man-year').val(), 10);
    const outcome = $('#man-outcome').val();
    const judge = $('#man-judge').val().trim();
    const acts = $('#man-acts').val().trim();
    const summary = $('#man-summary').val().trim();

    $manSubmitBtn.prop('disabled', true).html(`
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      <span>Uploading &amp; Hashing...</span>
    `);

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('title', title);
    formData.append('case_no', caseNo);
    formData.append('court', court);
    formData.append('year', year);
    if (outcome) formData.append('outcome', outcome);
    if (judge) formData.append('judge', judge);
    if (summary) formData.append('summary', summary);
    if (acts) {
      const tagList = acts.split(',').map(s => s.trim()).filter(Boolean);
      formData.append('act_tags', JSON.stringify(tagList));
      formData.append('section_tags', JSON.stringify(tagList));
    }

    LG.api.upload.uploadCase(formData)
      .done(function (res) {
        $successCaseId.text(res.id || 'N/A');
        $successFileHash.text(res.file_hash || 'SHA-256 Registered');
        $successViewBtn.attr('href', 'case-viewer.html?id=' + encodeURIComponent(res.id));
        $successModal.show();
        $manualForm[0].reset();
        LG.toast('Case uploaded and submitted for review!', 'success');
      })
      .fail(function (xhr) {
        let msg = 'Failed to upload case.';
        if (xhr.responseJSON && xhr.responseJSON.detail) {
          msg = typeof xhr.responseJSON.detail === 'string'
            ? xhr.responseJSON.detail
            : JSON.stringify(xhr.responseJSON.detail);
        }
        LG.toast(msg, 'danger');
      })
      .always(function () {
        $manSubmitBtn.prop('disabled', false).html(`
          <i class="bi bi-cloud-arrow-up-fill me-1"></i>
          <span>Submit for Registrar Review</span>
        `);
      });
  });
});
