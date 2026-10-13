/* ============================================================
   LOAM — shared left QUESTION panel renderer.
   Replaces the old student list: shows the question list +
   reviewed status for the CURRENT student (student selection
   now lives on the Class Review dashboard).
   Include AFTER loam-store.js, at the END of <body>.
   Renders into #lp-list and adapts the lp-header / lp-footer.
   ============================================================ */
(function () {
  'use strict';

  var CHECK = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>';

  function injectStyles() {
    if (document.getElementById('loam-qpanel-styles')) return;
    var css = '' +
      '.lp-title .lp-student-name{font-weight:600;color:#0F0E0C;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
      '.lp-title .lp-student-roll{font-family:"JetBrains Mono",monospace;font-size:11px;color:#6B6964;font-weight:500;flex-shrink:0;}' +
      '.lp-section-label{padding:11px 16px 4px;font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#6B6964;}' +
      '.q-item{display:grid;grid-template-columns:16px 1fr auto;gap:10px;align-items:center;padding:7px 14px 7px 13px;border-left:3px solid transparent;cursor:pointer;transition:background .12s;}' +
      '.q-item:hover{background:#FAFAF9;}' +
      '.q-item.current{background:#E8F2FF;border-left-color:#1E7CE8;}' +
      '.qi-status{width:16px;height:16px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;}' +
      '.qi-status.reviewed{background:#16A34A;color:#fff;}' +
      '.qi-status.current{background:transparent;border:2px solid #1E7CE8;}' +
      '.qi-status.notrev{background:transparent;border:1.5px solid #D4D2CC;}' +
      '.qi-main{min-width:0;}' +
      '.qi-code{font-family:"JetBrains Mono",monospace;font-size:12px;font-weight:600;color:#2C2A26;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
      '.q-item.current .qi-code{color:#0F0E0C;}' +
      '.qi-topic{font-size:11px;color:#6B6964;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px;}' +
      '.qi-score{font-family:"JetBrains Mono",monospace;font-size:11px;font-weight:500;color:#4A4844;}' +
      '.qi-score.dim{color:#6B6964;}' +
      '.lp-empty{padding:24px 16px;text-align:center;color:#6B6964;font-size:12px;}' +
      /* collapsed: status indicators only */
      '.leftpanel.collapsed .lp-section-label{display:none;}' +
      '.leftpanel.collapsed .q-item{grid-template-columns:1fr;justify-items:center;padding:6px 4px;border-left:none;background:transparent!important;}' +
      '.leftpanel.collapsed .q-item .qi-main,.leftpanel.collapsed .q-item .qi-score{display:none;}' +
      '';
    var el = document.createElement('style');
    el.id = 'loam-qpanel-styles';
    el.textContent = css;
    document.head.appendChild(el);
  }

  function fmt(n) { return n == null ? '—' : (Number.isInteger(n) ? String(n) : (Math.round(n * 10) / 10).toString()); }

  var state = { q: '' };
  var searchWired = false, footerWired = false;

  function matches(text, q) { return !q || text.toLowerCase().indexOf(q.toLowerCase()) !== -1; }

  function itemHTML(code, label, topic, status, scoreText) {
    var rowCls = status === 'current' ? 'current' : status;
    var inner = status === 'reviewed' ? CHECK : '';
    return '<div class="q-item ' + rowCls + '" data-code="' + code + '" title="' + label + ' · ' + topic + '">' +
             '<span class="qi-status ' + status + '">' + inner + '</span>' +
             '<div class="qi-main"><div class="qi-code">' + label + '</div><div class="qi-topic">' + topic + '</div></div>' +
             '<span class="qi-score' + (status === 'notrev' ? ' dim' : '') + '">' + scoreText + '</span>' +
           '</div>';
  }

  function render() {
    var S = window.LOAM;
    var list = document.getElementById('lp-list');
    if (!list || !S.data.questions) return;
    var name = S.state.currentStudent;
    var cur = S.state.currentQuestion;
    var rec = S.studentRecord(name);
    var q = state.q.trim();

    // ---- header: show the current student + their review progress ----
    var titleEl = document.querySelector('.lp-title');
    if (titleEl && rec) {
      titleEl.innerHTML = '<span class="subject-dot"></span>' +
        '<span class="lp-student-name">' + rec.name + '</span>' +
        '<span class="lp-student-roll">#' + rec.roll_number + '</span>';
    }
    var codes = S.questionCodes();
    var reviewed = codes.filter(function (c){ return S.isReviewed(name, c); }).length;
    var ptext = document.querySelector('.lp-progress-text'); if (ptext) ptext.textContent = 'Reviewed';
    var pcount = document.querySelector('.lp-progress-count'); if (pcount) pcount.textContent = reviewed + ' of ' + codes.length;
    var fill = document.querySelector('.lp-progressbar .fill'); if (fill) fill.style.width = (reviewed / codes.length * 100) + '%';

    // ---- search input (placeholder + wiring once) ----
    var input = document.querySelector('.lp-search');
    if (input) {
      input.placeholder = 'Search questions…';
      if (!searchWired) {
        searchWired = true;
        input.addEventListener('input', function () { state.q = this.value; render(); });
      }
    }

    // ---- build the question list ----
    var html = '';

    // Section A — MCQ block as a single item
    var mcqAll = S.mcqCodes().every(function (c){ return S.isReviewed(name, c); });
    var aStatus = mcqAll ? 'reviewed' : (cur === 'sectionA' ? 'current' : 'notrev');
    var aScore = 0; S.mcqCodes().forEach(function (c){ aScore += S.questionTotal(name, c); });
    if (matches('section a mcq q1-q20', q)) {
      if (!q) html += '<div class="lp-section-label">Section A — MCQs</div>';
      html += itemHTML('sectionA', 'Section A', 'MCQs · Q1–Q20', aStatus, fmt(aScore) + '/20');
    }

    // Subjective questions, grouped by section
    var lastSection = null;
    S.subjectiveCodes().forEach(function (c) {
      var qq = S.data.questionsByCode[c];
      var topic = qq.concept || qq.chapter || c;
      if (q && !matches(c + ' ' + topic, q)) return;
      if (!q && qq.section_label !== lastSection) {
        html += '<div class="lp-section-label">' + qq.section_label + '</div>';
        lastSection = qq.section_label;
      }
      var status = S.isReviewed(name, c) ? 'reviewed' : (c === cur ? 'current' : 'notrev');
      html += itemHTML(c, c, topic, status, fmt(S.questionTotal(name, c)) + '/' + qq.max_marks);
    });

    list.innerHTML = html || '<div class="lp-empty">No questions match “' + q + '”.</div>';

    // ---- mark low-confidence questions ----
    list.querySelectorAll('.q-item').forEach(function (it) {
      if (S.isLowConfidence && S.isLowConfidence(name, it.dataset.code) && !S.isReviewed(name, it.dataset.code)) {
        it.classList.add('is-lowconf');
        var tag = document.createElement('span');
        tag.className = 'lowconf-tag'; tag.textContent = 'Low confidence';
        tag.title = 'AI is unsure about this answer. Please review.';
        (it.querySelector('.qi-code') || it).appendChild(tag);
      }
    });

    // ---- wire item clicks ----
    list.querySelectorAll('.q-item').forEach(function (it) {
      it.addEventListener('click', function () {
        var code = it.dataset.code;
        if (code === 'sectionA') {
          if (!/screen-4-mcq\.html/.test(location.pathname)) location.href = 'screen-4-mcq.html';
          return;
        }
        S.goToQuestion(code);
        if (!/screen-5-grading\.html/.test(location.pathname)) location.href = 'screen-5-grading.html';
      });
    });

    // ---- footer: per-student "Final review" entry ----
    var foot = document.querySelector('.lp-footer .btn');
    if (foot) {
      var lab = foot.querySelector('.btn-label');
      if (lab) lab.textContent = 'Final review';
      foot.title = reviewed < codes.length ? 'Review all questions to finish' : 'Open final review';
      foot.disabled = reviewed < codes.length;
      if (!footerWired) {
        footerWired = true;
        foot.addEventListener('click', function () {
          if (!foot.disabled) location.href = 'screen-6-final-review.html';
        });
      }
    }
  }

  function mount() {
    window.LOAM.ready.then(function () {
      injectStyles();
      render();
      window.LOAM.subscribe(render);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else { mount(); }

  // styles for the low-confidence tag (panel is shared by screens 4, 5 and 6)
  (function () {
    var st = document.createElement('style');
    st.textContent = '.lowconf-tag{display:inline-block;margin-left:6px;padding:0 6px;border-radius:999px;font:600 10px/16px "Plus Jakarta Sans",system-ui,sans-serif;' +
      'background:#FFF1E5;color:#B4560F;vertical-align:1px;letter-spacing:0}';
    document.head.appendChild(st);
  })();

  window.LOAMPanel = { render: render };
})();
