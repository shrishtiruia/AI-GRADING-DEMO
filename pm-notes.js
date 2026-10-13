/* ============================================================
   PM notes — a guided-tour drawer added to every demo screen.
   Explains, for a reviewer clicking through without a presenter:
   the job of this screen, the product decision behind it, the
   evidence for it, and the metric that would prove it works.
   ============================================================ */
(function () {
  'use strict';
  if (window.top !== window.self) return; // skip inside the scroll-through iframes

  var TOUR = [
    { file: 'screen-class.html', step: 'Start', title: 'Class home',
      job: 'Get the teacher straight to the paper that needs her.',
      decision: 'The teacher starts from her class and a paper whose status says "Graded · ready to review". LOAM has already done the first pass, so her job is to check, not to correct from scratch.',
      next: 'Click <b>Next</b> to see what LOAM reads before grading.' },

    { file: 'screen-2-setup.html', step: '1 / 7', title: 'Load the school’s rules first',
      job: 'Answer the buyer’s first question before a single paper is graded: <i>will it mark the way we mark?</i>',
      decision: 'LOAM reads three things: the CBSE marking scheme, the teacher’s step-wise answer key, and the school’s own grading guidelines. In the pitch, the presenter drops Narayana’s guidelines in live and LOAM picks up their partial-credit rules.',
      evidence: 'In the brief, this screen is the "trust foundation for everything that follows".',
      metric: 'Share of AI marks the teacher accepts without changes (target set in pilot).',
      next: 'Click <b>Play demo</b> on the page, or <b>Next</b> here.' },

    { file: 'screen-3-grading.html', step: '2 / 7', title: 'AI grades all 30 papers',
      job: 'Make the AI’s work visible, so the time saving feels real and not like magic.',
      decision: 'A live ticker shows what LOAM is doing ("Applying partial-credit rule…", "Recognising alternative method on Q31…"). It also flags answers it is unsure about. In the brief: <i>"We don’t ask you to verify what AI is sure about. We ask you to verify what it isn’t."</i>',
      next: 'Next: the class overview the teacher lands on.' },

    { file: 'screen-dashboard.html', step: '3 / 7', title: 'Class review',
      job: 'Show the teacher where she stands and who to review next.',
      decision: 'Class average, top scorer and review progress are at the top. Every student is one click away, with their AI total already filled in.',
      evidence: 'In this real pre-board, 4 of 30 students are below the 33% pass mark. A teacher should see that on day one, not after the results go out.',
      next: 'Next: reviewing one student, starting with MCQs.' },

    { file: 'screen-4-mcq.html', step: '4 / 7', title: 'MCQs: approve in one click',
      job: 'Take the mechanical half of the job off the teacher’s plate.',
      decision: 'All 20 MCQs show up in one table, with the student\u2019s answer marked against the key. The teacher scans for red rows and approves the whole section with one click.',
      evidence: 'From the real marks data: MCQs are <b>53% of the answers a teacher checks but only 25% of the marks</b>. Bulk approval removes over half the decisions while touching only a quarter of the marks. <a href="analysis/results.md">See the query →</a>',
      metric: 'Time per paper, MCQ section vs. manual.',
      next: 'Next: the subjective answers, where the teacher’s judgement matters.' },

    { file: 'screen-5-grading.html', step: '5 / 7', title: 'Subjective answers: every mark has a reason',
      job: 'The screen where the buyer decides whether to trust LOAM.',
      decision: 'The scanned answer sits next to the AI’s step-by-step marks, with a reason for each deduction. The teacher can edit any step, tag the error type and add a note. Long answers with part marks get an orange <b>Low confidence</b> flag, so the AI never fakes certainty and the teacher knows where to look first.',
      evidence: 'From the real marks data: <b>41% of written answers got part marks</b>, and about half in the 3-, 4- and 5-mark sections. A right/wrong AI wouldn’t work here. It has to mark step by step, the way CBSE does. <a href="analysis/results.md">See the query →</a>',
      metric: 'Teacher override rate per question type. If it’s high, the AI or the rubric needs work.',
      next: 'Next: checking the whole paper before submitting.' },

    { file: 'screen-6-final-review.html', step: '6 / 7', title: 'Final review',
      job: 'A last check of the whole paper before the marks are locked.',
      decision: 'All 38 questions on one page, colour-coded by status, so anything skipped or flagged stands out. Then submit and go to the next student.',
      next: 'Next: the end of the class.' },

    { file: 'screen-7-class-complete.html', step: '7 / 7', title: 'Class complete',
      job: 'Turn finishing into the value story the buyer takes away.',
      decision: 'The screen leads with time saved, then the class summary. Orange is used only for the final action, at most once per screen (a design-system rule).',
      evidence: '⚠️ The time-saved figure is an illustrative estimate for the pitch, not a measurement. The class average and absent count are calculated from the data.',
      metric: 'Real time saved per exam cycle, measured in a pilot.',
      next: 'End of the flow. <a href="index.html">Back to the overview →</a>' }
  ];

  var here = location.pathname.split('/').pop() || 'index.html';
  var idx = -1;
  for (var i = 0; i < TOUR.length; i++) if (TOUR[i].file === here) idx = i;
  if (idx === -1) return;
  var t = TOUR[idx], prev = TOUR[idx - 1], next = TOUR[idx + 1];

  var KEY = 'loam_pm_notes_open';
  var open = true;
  try { open = localStorage.getItem(KEY) !== '0'; } catch (e) {}

  var css = '' +
    '.pmn-tab{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:9998;writing-mode:vertical-rl;' +
      'background:#0F0E0C;color:#fff;border:0;border-radius:8px 0 0 8px;padding:14px 8px;font:600 12px "Plus Jakarta Sans",system-ui,sans-serif;' +
      'letter-spacing:.06em;cursor:pointer;box-shadow:0 4px 12px rgba(15,14,12,.2)}' +
    '.pmn-tab span{color:#F37920}' +
    '.pmn{position:fixed;right:16px;top:68px;bottom:16px;width:316px;max-width:calc(100vw - 32px);z-index:9999;' +
      'background:#0F0E0C;color:#E7E5E0;border-radius:12px;box-shadow:0 20px 50px rgba(15,14,12,.35);' +
      'font:400 13.5px/1.55 "Plus Jakarta Sans",system-ui,sans-serif;display:flex;flex-direction:column;overflow:hidden}' +
    '.pmn[hidden],.pmn-tab[hidden]{display:none}' +
    '.pmn-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px 10px;border-bottom:1px solid #2C2A26}' +
    '.pmn-kicker{font:600 10.5px "JetBrains Mono",ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;color:#F37920}' +
    '.pmn-x{background:none;border:0;color:#A8A6A0;font-size:20px;line-height:1;cursor:pointer;padding:2px 6px;border-radius:6px}' +
    '.pmn-x:hover{color:#fff;background:#2C2A26}' +
    '.pmn-body{padding:14px 16px;overflow:auto;flex:1}' +
    '.pmn h2{font-size:17px;line-height:1.3;color:#fff;margin:0 0 12px;font-weight:600;letter-spacing:-.01em}' +
    '.pmn h3{font:600 10.5px "JetBrains Mono",ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;color:#A8A6A0;margin:14px 0 4px}' +
    '.pmn p{margin:0}' +
    '.pmn b{color:#fff}.pmn i{color:#E8F2FF}' +
    '.pmn a{color:#7DB6F5}' +
    '.pmn .pmn-ev{background:#1B1A17;border-left:3px solid #1E7CE8;padding:8px 10px;border-radius:0 6px 6px 0}' +
    '.pmn .pmn-next{color:#A8A6A0;margin-top:14px;font-size:12.5px}' +
    '.pmn-foot{display:flex;gap:8px;padding:10px 14px;border-top:1px solid #2C2A26}' +
    '.pmn-btn{flex:1;text-align:center;text-decoration:none;font:600 13px "Plus Jakarta Sans",system-ui,sans-serif;padding:9px 10px;border-radius:6px}' +
    '.pmn-btn.ghost{color:#E7E5E0;border:1px solid #2C2A26}.pmn-btn.ghost:hover{border-color:#4A4844}' +
    '.pmn-btn.go{background:#1E7CE8;color:#fff}.pmn-btn.go:hover{background:#1669c7}' +
    '.pmn-btn.off{visibility:hidden}';
  var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  function sec(label, html, cls) {
    return html ? '<h3>' + label + '</h3><p' + (cls ? ' class="' + cls + '"' : '') + '>' + html + '</p>' : '';
  }

  var panel = document.createElement('aside');
  panel.className = 'pmn';
  panel.setAttribute('aria-label', 'PM notes for this screen');
  panel.innerHTML =
    '<div class="pmn-head"><span class="pmn-kicker">PM notes · ' + t.step + '</span>' +
      '<button class="pmn-x" type="button" aria-label="Hide PM notes">×</button></div>' +
    '<div class="pmn-body"><h2>' + t.title + '</h2>' +
      sec('Job of this screen', t.job) +
      sec('Decision', t.decision) +
      sec('Evidence', t.evidence, 'pmn-ev') +
      sec('Metric I’d track', t.metric) +
      '<p class="pmn-next">' + t.next + '</p></div>' +
    '<div class="pmn-foot">' +
      '<a class="pmn-btn ghost' + (prev ? '' : ' off') + '" href="' + (prev ? prev.file : '#') + '">← Back</a>' +
      (next ? '<a class="pmn-btn go" href="' + next.file + '">Next →</a>'
            : '<a class="pmn-btn go" href="index.html">Overview</a>') +
    '</div>';

  var tab = document.createElement('button');
  tab.className = 'pmn-tab'; tab.type = 'button';
  tab.innerHTML = '<span>●</span> PM NOTES';

  function set(o) {
    open = o; panel.hidden = !o; tab.hidden = o;
    try { localStorage.setItem(KEY, o ? '1' : '0'); } catch (e) {}
  }
  panel.querySelector('.pmn-x').addEventListener('click', function () { set(false); });
  tab.addEventListener('click', function () { set(true); });

  function mount() { document.body.appendChild(panel); document.body.appendChild(tab); set(open); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
