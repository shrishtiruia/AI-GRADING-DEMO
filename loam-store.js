/* ============================================================
   LOAM — global demo store
   Vanilla pub/sub store mirroring the Zustand shape in the spec.
   Persists to localStorage so a refresh never kills a live demo.
   Every screen includes this file and reads from window.LOAM.
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'loam_demo_v1';
  var DEFAULT_STUDENT = 'Tanish Arora';

  // ---- Initial (first-load / post-reset) state ----
  function initialState() {
    return {
      materials: {
        rubric: 'loaded',
        answerKey: 'loaded',
        narayanaGuidelines: 'empty'      // 'empty' | 'parsing' | 'parsed'
      },
      gradingProgress: {
        status: 'not_started',           // 'not_started' | 'in_progress' | 'complete'
        studentsGraded: 0,
        currentStudentBeingGraded: null,
        tickerLineIndex: 0
      },
      // reviewState keyed by student name. questionsReviewed stored as ARRAY
      // (JSON-serializable); helpers treat it as a set.
      reviewState: {},
      currentStudent: DEFAULT_STUDENT,
      currentQuestion: 'sectionA'        // 'sectionA' | 'Q21'..'Q38'
    };
  }

  // ---- Persistence ----
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return initialState();
      var parsed = JSON.parse(raw);
      // shallow-merge onto defaults so new fields survive old saves
      var base = initialState();
      return Object.assign(base, parsed, {
        materials: Object.assign(base.materials, parsed.materials || {}),
        gradingProgress: Object.assign(base.gradingProgress, parsed.gradingProgress || {})
      });
    } catch (e) {
      return initialState();
    }
  }

  var state = load();
  var listeners = [];

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function emit() {
    persist();
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](state); } catch (e) { console.error(e); }
    }
  }

  // ---- reviewState helpers ----
  function ensureStudent(name) {
    if (!state.reviewState[name]) {
      state.reviewState[name] = {
        questionsReviewed: [],
        questionsEdited: {},
        submitted: false
      };
    }
    return state.reviewState[name];
  }
  function ensureQuestion(name, qCode) {
    var s = ensureStudent(name);
    if (!s.questionsEdited[qCode]) {
      s.questionsEdited[qCode] = {};
    }
    return s.questionsEdited[qCode];
  }
  function isReviewed(name, qCode) {
    var s = state.reviewState[name];
    return !!(s && s.questionsReviewed.indexOf(qCode) !== -1);
  }

  // ---- Data loading (async, cached on the store) ----
  var data = { students: null, questions: null, scores: null, scoresByName: null, questionsByCode: null };

  function indexData() {
    // index scores by student name
    data.scoresByName = {};
    (data.scores || []).forEach(function (rec) {
      var byCode = {};
      (rec.questions || []).forEach(function (q) { byCode[q.code] = q; });
      data.scoresByName[rec.name] = { record: rec, byCode: byCode };
    });
    // index questions by code
    data.questionsByCode = {};
    ((data.questions && data.questions.questions) || []).forEach(function (q) {
      data.questionsByCode[q.code] = q;
    });
  }

  var ready = Promise.all([
    fetch('data/students.json').then(function (r) { return r.json(); }),
    fetch('data/questions.json').then(function (r) { return r.json(); }),
    fetch('data/scores.json').then(function (r) { return r.json(); })
  ]).then(function (res) {
    data.students = res[0];
    data.questions = res[1];
    data.scores = res[2];
    indexData();
    return data;
  }).catch(function (e) {
    console.error('LOAM data load failed', e);
    throw e;
  });

  // ---- Derived helpers ----------------------------------------------------

  // All question codes in display order: Q1..Q38
  function questionCodes() {
    return ((data.questions && data.questions.questions) || []).map(function (q) { return q.code; });
  }
  function subjectiveCodes() {            // Q21..Q38 (everything after Section A)
    return questionCodes().filter(function (c) {
      var q = data.questionsByCode[c];
      return q && q.section !== 'A';
    });
  }
  function mcqCodes() {                   // Q1..Q20
    return questionCodes().filter(function (c) {
      var q = data.questionsByCode[c];
      return q && q.section === 'A';
    });
  }

  // The active stepwise schema for a question, honoring OR variant choice.
  function schemaFor(qCode, studentName) {
    var q = data.questionsByCode[qCode];
    if (!q) return [];
    if (q.has_or_variant && q.variants) {
      var sc = scoreFor(studentName, qCode);
      var v = (sc && sc.variant_attempted) || 'A';
      var variant = q.variants.filter(function (x) { return x.variant === v; })[0] || q.variants[0];
      return variant.stepwise_schema || [];
    }
    return q.stepwise_schema || [];
  }

  function scoreFor(studentName, qCode) {
    var s = data.scoresByName && data.scoresByName[studentName];
    return s ? s.byCode[qCode] : null;
  }
  function studentRecord(name) {
    return (data.students || []).filter(function (s) { return s.name === name; })[0] || null;
  }

  // Question total: override > summed edited/stepwise > original marks_awarded
  function questionTotal(studentName, qCode) {
    var edited = state.reviewState[studentName] &&
                 state.reviewState[studentName].questionsEdited[qCode];
    if (edited && typeof edited.totalOverride === 'number') return edited.totalOverride;

    var schema = schemaFor(qCode, studentName);
    var sc = scoreFor(studentName, qCode);
    if (schema.length) {
      var allSet = true, sum = 0;
      for (var i = 0; i < schema.length; i++) {
        var v = stepValue(studentName, qCode, i);
        if (v == null) { allSet = false; break; }
        sum += v;
      }
      if (allSet) return sum;
    }
    return sc ? sc.marks_awarded : 0;
  }

  // Awarded value for one step: edit > scores.json stepwise > null (unknown)
  function stepValue(studentName, qCode, stepIdx) {
    var edited = state.reviewState[studentName] &&
                 state.reviewState[studentName].questionsEdited[qCode];
    if (edited && edited.stepwiseEdits && edited.stepwiseEdits[stepIdx] != null) {
      return edited.stepwiseEdits[stepIdx];
    }
    var sc = scoreFor(studentName, qCode);
    if (sc && sc.stepwise_awarded && sc.stepwise_awarded[stepIdx] != null) {
      return sc.stepwise_awarded[stepIdx];
    }
    return null; // unknown -> UI shows —/X
  }

  function studentStatus(name) {
    var rs = state.reviewState[name];
    var gp = state.gradingProgress;
    if (rs && rs.submitted) return 'submitted';
    if (gp.status === 'in_progress') {
      if (gp.currentStudentBeingGraded === name) return 'currently_grading';
      var idx = rosterIndex(name);
      return (idx > -1 && idx < gp.studentsGraded) ? 'graded' : 'queued';
    }
    if (rs && rs.questionsReviewed.length > 0) return 'in_progress';
    return 'graded'; // grading complete, nothing reviewed yet
  }

  function rosterIndex(name) {
    return (data.students || []).map(function (s) { return s.name; }).indexOf(name);
  }

  function reviewedCount(name) {
    var rs = state.reviewState[name];
    return rs ? rs.questionsReviewed.length : 0;
  }

  // ---- Actions ------------------------------------------------------------
  var actions = {
    triggerNarayanaDrop: function () {
      state.materials.narayanaGuidelines = 'parsing';
      emit();
      setTimeout(function () {
        state.materials.narayanaGuidelines = 'parsed';
        emit();
      }, 2000);
    },

    setNarayana: function (v) { state.materials.narayanaGuidelines = v; emit(); },

    startGrading: function () {
      state.gradingProgress.status = 'in_progress';
      state.gradingProgress.studentsGraded = 0;
      state.gradingProgress.currentStudentBeingGraded = null;
      emit();
    },
    setGradingProgress: function (patch) {
      Object.assign(state.gradingProgress, patch);
      emit();
    },
    completeGrading: function () {
      state.gradingProgress.status = 'complete';
      state.gradingProgress.studentsGraded = (data.students || []).length;
      state.gradingProgress.currentStudentBeingGraded = null;
      emit();
    },

    approveQuestion: function (student, qCode) {
      var s = ensureStudent(student);
      if (s.questionsReviewed.indexOf(qCode) === -1) s.questionsReviewed.push(qCode);
      emit();
    },
    unApproveQuestion: function (student, qCode) {
      var s = ensureStudent(student);
      var i = s.questionsReviewed.indexOf(qCode);
      if (i !== -1) s.questionsReviewed.splice(i, 1);
      emit();
    },
    approveAllMCQs: function (student) {
      var s = ensureStudent(student);
      mcqCodes().forEach(function (c) {
        if (s.questionsReviewed.indexOf(c) === -1) s.questionsReviewed.push(c);
      });
      emit();
    },
    editStepScore: function (student, qCode, stepIdx, value) {
      var q = ensureQuestion(student, qCode);
      if (!q.stepwiseEdits) q.stepwiseEdits = {};
      q.stepwiseEdits[stepIdx] = value;
      emit();
    },
    setTotalOverride: function (student, qCode, value) {
      var q = ensureQuestion(student, qCode);
      if (value == null) delete q.totalOverride; else q.totalOverride = value;
      emit();
    },
    setTeacherNote: function (student, qCode, note) {
      var q = ensureQuestion(student, qCode);
      q.teacherNote = note;
      emit();
    },
    toggleTag: function (student, qCode, tag) {
      var q = ensureQuestion(student, qCode);
      if (!q.tagsApplied) q.tagsApplied = [];
      var i = q.tagsApplied.indexOf(tag);
      if (i === -1) q.tagsApplied.push(tag); else q.tagsApplied.splice(i, 1);
      emit();
    },
    setTag: function (student, qCode, tag) {
      var q = ensureQuestion(student, qCode);
      q.tagsApplied = [tag];
      emit();
    },
    submitStudent: function (student) {
      var s = ensureStudent(student);
      s.submitted = true;
      emit();
    },
    // Demo shortcut: approve every question for every attended student and submit them all.
    submitAllStudents: function () {
      var codes = questionCodes();
      (data.students || []).forEach(function (st) {
        if (st.attended === false) return;
        var rs = ensureStudent(st.name);
        codes.forEach(function (c) {
          if (rs.questionsReviewed.indexOf(c) === -1) rs.questionsReviewed.push(c);
        });
        rs.submitted = true;
      });
      emit();
    },
    goToStudent: function (student) {
      state.currentStudent = student;
      state.currentQuestion = 'sectionA';
      emit();
    },
    goToQuestion: function (qCode) {
      state.currentQuestion = qCode;
      emit();
    },
    resetDemo: function () {
      state = initialState();
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      emit();
    }
  };

  // ---- Public API ----
  window.LOAM = {
    ready: ready,
    data: data,
    get state() { return state; },
    subscribe: function (fn) { listeners.push(fn); return function () {
      var i = listeners.indexOf(fn); if (i !== -1) listeners.splice(i, 1);
    }; },
    persist: persist,

    // derived helpers
    isReviewed: isReviewed,
    questionCodes: questionCodes,
    subjectiveCodes: subjectiveCodes,
    mcqCodes: mcqCodes,
    schemaFor: schemaFor,
    scoreFor: scoreFor,
    studentRecord: studentRecord,
    questionTotal: questionTotal,
    stepValue: stepValue,
    studentStatus: studentStatus,
    rosterIndex: rosterIndex,
    reviewedCount: reviewedCount,
    DEFAULT_STUDENT: DEFAULT_STUDENT
  };
  // attach actions
  Object.keys(actions).forEach(function (k) { window.LOAM[k] = actions[k]; });
})();
