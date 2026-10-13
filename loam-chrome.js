/* ============================================================
   LOAM — shared chrome: Reset Demo button + confirm toast.
   Include AFTER loam-store.js on every screen.
   Injects a subtle "Reset Demo" button into .topbar-right.
   ============================================================ */
(function () {
  'use strict';

  var RESET_TARGET = 'screen-2-setup.html'; // demo restart point

  function injectStyles() {
    if (document.getElementById('loam-chrome-styles')) return;
    var css = '' +
      '.loam-reset-btn{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px;' +
        'border-radius:6px;background:transparent;border:1px solid transparent;color:#6B6964;' +
        'font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;transition:background .15s,color .15s,border-color .15s;}' +
      '.loam-reset-btn:hover{background:#F4F4F2;color:#2C2A26;border-color:#E7E5E0;}' +
      '.loam-reset-btn svg{width:13px;height:13px;}' +
      '.loam-crumb-link{cursor:pointer;transition:color .15s;}' +
      '.loam-crumb-link:hover{color:#1E7CE8;text-decoration:underline;text-underline-offset:2px;}' +
      '.loam-finish-btn{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px;' +
        'border-radius:6px;background:#FFF1E5;border:1px solid transparent;color:#b45309;' +
        'font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;transition:background .15s,color .15s,border-color .15s;}' +
      '.loam-finish-btn:hover{background:#F37920;color:#fff;}' +
      '.loam-finish-btn svg{width:13px;height:13px;}' +
      '.loam-toast-scrim{position:fixed;inset:0;background:rgba(15,14,12,0.28);z-index:1000;' +
        'display:flex;align-items:flex-start;justify-content:center;opacity:0;transition:opacity .18s;}' +
      '.loam-toast-scrim.show{opacity:1;}' +
      '.loam-toast{margin-top:64px;background:#fff;border-radius:10px;width:380px;max-width:calc(100vw - 40px);' +
        'box-shadow:0 20px 50px rgba(15,14,12,0.18);padding:20px;transform:translateY(-8px);transition:transform .18s;' +
        'font-family:"Plus Jakarta Sans",sans-serif;}' +
      '.loam-toast-scrim.show .loam-toast{transform:translateY(0);}' +
      '.loam-toast h3{margin:0 0 6px;font-size:15px;font-weight:600;color:#0F0E0C;letter-spacing:-0.01em;}' +
      '.loam-toast p{margin:0 0 16px;font-size:13px;color:#4A4844;line-height:1.5;}' +
      '.loam-toast-actions{display:flex;justify-content:flex-end;gap:8px;}' +
      '.loam-toast-btn{height:34px;padding:0 14px;border-radius:6px;font-family:inherit;font-size:13px;' +
        'font-weight:600;cursor:pointer;border:1px solid transparent;transition:background .15s,border-color .15s;}' +
      '.loam-toast-btn.ghost{background:transparent;color:#4A4844;}' +
      '.loam-toast-btn.ghost:hover{background:#F4F4F2;}' +
      '.loam-toast-btn.danger{background:#F37920;color:#fff;}' +
      '.loam-toast-btn.danger:hover{background:#db691a;}';
    var el = document.createElement('style');
    el.id = 'loam-chrome-styles';
    el.textContent = css;
    document.head.appendChild(el);
  }

  function showToast() {
    var scrim = document.createElement('div');
    scrim.className = 'loam-toast-scrim';
    scrim.innerHTML =
      '<div class="loam-toast" role="dialog" aria-modal="true" aria-labelledby="loam-toast-title">' +
        '<h3 id="loam-toast-title">Reset demo?</h3>' +
        '<p>This will clear all grading progress and return to the start of the walkthrough.</p>' +
        '<div class="loam-toast-actions">' +
          '<button class="loam-toast-btn ghost" data-act="cancel">Cancel</button>' +
          '<button class="loam-toast-btn danger" data-act="reset">Reset</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(scrim);
    requestAnimationFrame(function () { scrim.classList.add('show'); });

    function close() {
      scrim.classList.remove('show');
      setTimeout(function () { scrim.remove(); }, 200);
    }
    scrim.addEventListener('click', function (e) {
      var act = e.target.getAttribute && e.target.getAttribute('data-act');
      if (e.target === scrim || act === 'cancel') { close(); return; }
      if (act === 'reset') {
        if (window.LOAM) window.LOAM.resetDemo();
        window.location.href = RESET_TARGET;
      }
    });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });
  }

  function injectButton() {
    var host = document.querySelector('.topbar-right');
    if (!host || document.querySelector('.loam-reset-btn')) return;
    var resetBtn = document.createElement('button');
    resetBtn.className = 'loam-reset-btn';
    resetBtn.title = 'Reset demo';
    resetBtn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>' +
      'Reset Demo';
    resetBtn.addEventListener('click', showToast);
    host.insertBefore(resetBtn, host.firstChild);

    // Demo shortcut: auto-approve all students and jump to results (not on the results screen).
    if (!/screen-7-class-complete\.html/.test(window.location.pathname) && !document.querySelector('.loam-finish-btn')) {
      var finish = document.createElement('button');
      finish.className = 'loam-finish-btn';
      finish.title = 'Demo: approve all remaining students and skip to results';
      finish.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9z"></path></svg>' +
        'Auto-approve all';
      finish.addEventListener('click', function () {
        if (window.LOAM) {
          window.LOAM.ready.then(function () {
            window.LOAM.submitAllStudents();
            window.location.href = 'screen-7-class-complete.html';
          });
        }
      });
      host.insertBefore(finish, resetBtn);
    }
  }

  // Breadcrumb nodes are navigable: Class XII-A → class home, exam → Class Review.
  function linkifyBreadcrumb() {
    var bc = document.querySelector('.breadcrumb');
    if (!bc) return;
    var spans = Array.prototype.filter.call(bc.children, function (el) {
      return el.tagName === 'SPAN' && !el.classList.contains('sep');
    });
    var path = window.location.pathname;
    var onClass = /screen-class\.html/.test(path);
    var onDash = /screen-dashboard\.html/.test(path);

    function link(span, href, title) {
      if (!span || span.getAttribute('data-loam-linked')) return;
      span.setAttribute('data-loam-linked', '1');
      span.classList.add('loam-crumb-link');
      span.title = title;
      span.addEventListener('click', function () { window.location.href = href; });
    }
    // [0] = "Class XII-A" → class home (skip when we're already there)
    if (!onClass) link(spans[0], 'screen-class.html', 'Open class');
    // [1] = exam name → Class Review dashboard (skip when we're already there)
    if (!onDash) link(spans[1], 'screen-dashboard.html', 'Open Class Review');
  }

  function init() { injectStyles(); injectButton(); linkifyBreadcrumb(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }

  window.LOAMChrome = { showResetToast: showToast };
})();
