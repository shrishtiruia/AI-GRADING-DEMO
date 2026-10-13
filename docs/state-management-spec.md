# LOAM Prototype — State Management & Demo Wiring

The screens are built. Now wire them up so the prototype behaves like a real product walkthrough — not a series of disconnected mockups. This prompt covers three things: the global state architecture, the interactive editing inside screens, and the scripted loading sequences.

I'll also be uploading three data files: `students.json`, `questions.json`, `scores.json`. Read those first — every number on every screen should come from them, not from placeholder data.

---

## 1. The three data files

**students.json** — 30 student records with totals, roll numbers, ranks, section breakdowns.
**questions.json** — Full Midterm Math paper: 38 displayed questions, MCQ options/answers, subjective stepwise schemas.
**scores.json** — Per-(student, question) data: marks_awarded, max_marks, OR variant attempted. `stepwise_awarded` is null on every question — wire your UI to display `—/X` (where X is the max per step) until that field has values.

Read the accompanying `SCREEN_DATA_MAPPING.md` for which field powers which screen element.

Key facts:
- 30 students, all displayed as "Class XII-A"
- 38 questions per student (20 MCQ + 5 VSA + 6 SA + 4 LA + 3 case-based)
- Class average: 46.78/80
- Top scorer: Meera, 79/80
- Pick **Tanish Arora (67/80)** as the default "currently selected" student — he has a clean mix of full marks, partial credit, a few wrong MCQs

Every "35" or "38" in the existing screens should be 38. Every "Aarav Sharma" should be Tanish Arora. Every placeholder 67/80 stays correct but is now real data.

---

## 2. Global demo state — architecture

Use **Zustand** for global state. One store, exposed via a `useDemoStore` hook. Persist to localStorage so accidental refreshes don't kill a live demo.

### Store shape

```typescript
interface DemoState {
  // === Setup phase (Screen 2) ===
  materials: {
    rubric: 'loaded'                                  // pre-loaded
    answerKey: 'loaded'                                // pre-loaded
    narayanaGuidelines: 'empty' | 'parsing' | 'parsed' // starts empty, becomes parsed via demo trigger
  }
  
  // === Grading loader phase (Screen 3) ===
  gradingProgress: {
    status: 'not_started' | 'in_progress' | 'complete'
    studentsGraded: number              // 0 to 30, increments during loader
    currentStudentBeingGraded: string | null  // name of student with blue pulse
    tickerLineIndex: number             // which status message is showing
  }
  
  // === Review phase (Screens 4, 5, 6) ===
  // Per-student review state, keyed by student name
  reviewState: Record<string, {
    questionsReviewed: Set<string>      // codes of questions she's approved
    questionsEdited: Record<string, {   // per-question edits
      stepwiseEdits?: Record<number | string, number>  // step index -> awarded
      totalOverride?: number             // manual total override via "+ Adjustment"
      teacherNote?: string               // free-text note
      tagsApplied?: string[]             // applied error tags
    }>
    submitted: boolean                   // submitted via Screen 6
  }>
  
  // === Current navigation ===
  currentStudent: string                 // name of currently selected student
  currentQuestion: string                // 'Q1' to 'Q38' (or 'sectionA' for the MCQ block)
  
  // === Actions ===
  triggerNarayanaDrop: () => void
  startGrading: () => void
  approveQuestion: (student: string, qCode: string) => void
  unApproveQuestion: (student: string, qCode: string) => void  // for re-edit flow
  approveAllMCQs: (student: string) => void
  editStepScore: (student: string, qCode: string, stepIdx: number | string, value: number) => void
  setTotalOverride: (student: string, qCode: string, value: number) => void
  setTeacherNote: (student: string, qCode: string, note: string) => void
  toggleTag: (student: string, qCode: string, tag: string) => void
  submitStudent: (student: string) => void
  goToStudent: (student: string) => void
  goToQuestion: (qCode: string) => void
  resetDemo: () => void
}
```

### Initial state on first load (and after reset)

- `materials.narayanaGuidelines: 'empty'`
- `gradingProgress.status: 'not_started'`, `studentsGraded: 0`
- `reviewState: {}` (empty — no student has anything reviewed)
- `currentStudent: 'Tanish Arora'`
- `currentQuestion: 'sectionA'` (MCQ block as starting point on Screen 4)

### Reset Demo button

Place a small **"Reset Demo"** ghost button in the top-right corner of the top bar, next to the avatar. Style: tiny, subtle, gray-500 text, only visible because demo runners need to find it. Clicking it:
1. Shows a confirmation toast: "Reset demo? This will clear all grading progress."
2. Two buttons: "Reset" (brand-orange) and "Cancel" (ghost)
3. On confirm: clear localStorage, reset Zustand store to initial state, navigate to Screen 1 (OCR transition loader)

---

## 3. State derived for each screen

The screens should never need to compute primary state — only *derive* views of it.

### Persistent left student panel (Screens 3, 4, 5, 6)

For each student, determine their status indicator dot:
- **Submitted** (green check icon): `reviewState[student].submitted === true`
- **In progress** (blue dot): student has at least one `questionsReviewed` entry but not submitted
- **Currently grading** (blue pulse): only during Screen 3 — `gradingProgress.currentStudentBeingGraded === student`
- **Graded, not yet reviewed** (gray dot): grading complete, no review activity
- **Queued** (faint dot, dimmed name): only during Screen 3 — student not yet graded

Score displayed in left panel: `students.json[i].total_marks` — this is the AI's grading total, shown for all students once grading is complete.

The "highlighted/selected" student is whoever equals `currentStudent`.

### Screen 4 — MCQ workspace

- Section total displayed: sum of `marks_awarded` for Q1-Q20 from `scores.json[currentStudent]`
- Each MCQ row reads from `scores.json[currentStudent].questions[Qi]`
- For each row, show student's chosen answer (their letter pick) — *if MCQ has no `student_answer` field, synthesize it: for correct answers use the correct letter; for incorrect, pick any wrong option deterministically (e.g. shift to next letter)*
- Hover state shows "Override" link on each row → clicking opens a small dropdown to change AI's verdict

When teacher clicks "Approve all 20 & Continue":
- Call `approveAllMCQs(currentStudent)` — adds Q1 through Q20 to `questionsReviewed`
- `currentQuestion` advances to "Q21"
- Navigate to Screen 5

### Screen 5 — Subjective workspace

This is where most of the interactivity lives. Wire these:

**a) Question dropdown ("Q24 ▾")**

- Shows all 38 questions (Section A as collapsed pill "Section A · MCQs", then Q21-Q38 individually)
- Each question shows status:
  - Green check + green text: in `questionsReviewed`
  - Blue underline + bold: equals `currentQuestion`
  - Gray: not yet viewed
- Click any question → `goToQuestion(qCode)` updates `currentQuestion` and re-renders panel

**b) Stepwise grading rows — editable**

For each step in the question's stepwise schema:
- Read max from `questions.json[currentQuestion].stepwise_schema[i].max_marks`
- Read awarded from `reviewState[currentStudent].questionsEdited[currentQuestion].stepwiseEdits[i]` if set, else from `scores.json[currentStudent].questions[currentQuestion].stepwise_awarded[i]` if set, else display `—/X`
- Hover state: subtle background tint + small pencil icon appears on the right
- Click the score → it becomes an inline editable number input, focused, with the max visible (e.g. `[ 0.5 ]/1`)
- On blur or Enter → call `editStepScore(currentStudent, currentQuestion, stepIdx, newValue)`
- Validation: must be ≤ max_marks for that step, ≥ 0, supports half-marks (0.5 increments)

**c) Question total — live derived**

The "QUESTION TOTAL X/5" number derives from:
- If `totalOverride` is set for this question: show that value
- Else if all stepwise marks are set (either via edits or via scores.json): sum them
- Else: show the original `marks_awarded` from `scores.json[currentStudent].questions[currentQuestion]`

The number should animate (count up/down over 200ms) when it changes due to an edit.

**d) "+ Adjustment" link**

Click → opens a small popover with a number input. Teacher types a manual total. Calling `setTotalOverride(currentStudent, currentQuestion, value)`. The popover has a "Clear adjustment" link to undo.

**e) Tag chips**

For incorrect/partial steps, the AI-inferred tag chip "Conceptual error · Optimization ▾" should be clickable. Opens a small dropdown of all tag options (Calculation error, Conceptual error, Skill gap, Procedural error, Alt method used, Not attempted). Selecting one calls `toggleTag(currentStudent, currentQuestion, tag)`. The chip updates immediately.

**f) Teacher notes textarea**

Typing in the textarea calls `setTeacherNote(currentStudent, currentQuestion, text)` on every change (debounced ~300ms). The text persists across navigation.

**g) Approve & Next button**

- Calls `approveQuestion(currentStudent, currentQuestion)` — adds question to `questionsReviewed`
- Advances `currentQuestion` to next unreviewed question (or next sequentially if all are reviewed)
- If this was the last question (all 38 reviewed), navigate to Screen 6

**h) Going back to an already-approved question — REOPEN FLOW**

This is the important nuance:

- When `currentQuestion` is in `questionsReviewed` (i.e. already approved), the right panel shows a state indicator at the top: **"✓ Approved · Edit to reopen"**
- The stepwise scores, tags, and notes are *displayed but read-only* in this state
- A button "Edit this question" appears prominently at the top of the right panel (brand-blue, secondary)
- Clicking it:
  - Calls `unApproveQuestion(currentStudent, currentQuestion)` — removes from `questionsReviewed`
  - The question's pill in the dropdown changes from green check to blue underline
  - The "Approve & Next" button at the bottom reappears
  - Teacher can now edit
- On re-approving via "Approve & Next", question goes back to `questionsReviewed`

### Screen 6 — Final review grid

- Reads from `reviewState[currentStudent]`
- For each of the 38 cells:
  - Get marks from `scores.json[currentStudent].questions[i].marks_awarded` overridden by any edits in `reviewState[currentStudent].questionsEdited`
  - Determine status:
    - **In `questionsReviewed`**: color border by score (green/orange/red as designed)
    - **Not in `questionsReviewed`**: gray with hatched pattern, label "pending"
  - Click cell → `goToQuestion(qCode)`, navigate back to Screen 5
- The 38-cell grid status counts feed the "X of 38 reviewed" line and the submit-button-disabled logic
- Submit button:
  - Disabled if `questionsReviewed.size < 38`
  - Hint text below: "X questions still pending — review to enable submit"
  - When enabled, brand-blue, clicking calls `submitStudent(currentStudent)`

### Submit success micro-screen (between Screen 6 and next student)

After `submitStudent` is called:
- Brief full-screen overlay (~1.5 seconds)
- nLearn-style soft gradient background
- Centered: large green checkmark animation (scale-in from 0 to 1 over 300ms with a slight bounce), then:
- Headline: **"Submitted"** (display weight, gray-900)
- Sub: "Tanish Arora · 67/80 · Marks committed" (smaller, gray-600)
- After 1.5 seconds, auto-advance: load next un-submitted student into `currentStudent`, set `currentQuestion` to "sectionA", navigate to Screen 4

If there are no more un-submitted students, navigate to Screen 7 (class complete) instead.

### Submitted-student lock

Once a student is in `reviewState[student].submitted === true`:
- Their row in the left panel shows green check + monospace score, no longer clickable for editing
- If someone navigates to them (via deep link or back button), the workspace shows a read-only state with banner: **"This student's marks have been submitted. To make changes, use the regrade flow."** with a link to Screen 11 (regrade queue).
- All edit affordances are disabled (no editable scores, no notes, no tags)

---

## 4. Scripted loading sequences

Two screens are "scripted" — they run automated sequences when entered.

### Screen 2 — Narayana drop sequence

The screen loads with `materials.narayanaGuidelines: 'empty'`. The right preview panel shows only the first 3 bullets (CBSE rubric content).

**Trigger:** a button at the top-right of Slot 3 reading "Drop demo file" (small, ghost, only visible because this is a demo). Clicking it calls `triggerNarayanaDrop()`, which:

1. Immediately sets state to `'parsing'` — slot transforms: solid brand-blue border, file icon flies in from above with a 400ms animation, parsing spinner appears, text reads "Reading Narayana guidelines..."
2. After 2 seconds, state flips to `'parsed'` — slot transforms again: brand-orange-soft background tint, "✓ Parsed" status pill, file label + metadata appear, three Narayana-specific badges fade in with 150ms staggered delays ("I-Spark methodology" → "Dual CBSE+JEE rubric" → "Step-credit policy")
3. Simultaneously, three new bullets appear in the right preview panel with 150ms staggered delays, each with the brand-orange-soft highlight
4. The "Start Grading 30 Papers →" button at the bottom transitions from disabled (gray) to enabled (brand-blue)

After 1 second pause from "Start Grading" click:
- Navigate to Screen 3
- Call `startGrading()`

### Screen 3 — Grading loader sequence

When `startGrading()` is called:

1. `gradingProgress.status: 'in_progress'`, `studentsGraded: 0`
2. Run a 12-second scripted sequence:
   - Every ~400ms: `studentsGraded` increments by 1, `currentStudentBeingGraded` cycles through the student roster in order
   - Progress bar smoothly fills proportionally
   - The status ticker cycles through pre-written lines (loop these every 1.8 seconds):
     - "Reading Meera's answer to Q24…"
     - "Cross-checking step 2 against marking scheme…"
     - "Recognising alternative method on Q31 by Tanvi Krishnan…"
     - "Applying Narayana's I-Spark partial credit rule…"
     - "Confidence check passed for Q15 across 18 students…"
     - "Detected handwriting in margin of Q28 — re-parsing…"
     - "Comparing solution structure to teacher's stepwise answer key…"
     - "Question 24 graded — 4 of 5 marks awarded…"
     - "Aggregating marks for Diya Reddy…"
     - "Final sweep — flagging anomalies…"
   - The thumbnail grid: each student's thumbnail lights up (gray pulse → blue ring → green check) as their `studentsGraded` index passes
3. When `studentsGraded === 30`:
   - `gradingProgress.status: 'complete'`, `currentStudentBeingGraded: null`
   - Status ticker stops on: "All papers graded. Ready for your review."
   - "Begin Review →" button fades in (300ms), auto-focused

Click "Begin Review →" → navigate to Screen 4, `currentStudent = 'Tanish Arora'`, `currentQuestion = 'sectionA'`.

---

## 5. Behavior consistency rules

These apply across all screens — the prototype's "physics":

**a) Instant navigation between questions.** No transitions, no fades, just immediate state swap. The teacher should feel snappy progress.

**b) Live updates only on score edits.** Step total, question total, MCQ section total — animate count over 200ms when they change due to user input.

**c) Edits persist across navigation.** Teacher edits Q24's step 5, navigates to Q30, comes back to Q24 — her edit is still there.

**d) Approved status visible at-a-glance.** The question dropdown should make it obvious which questions are reviewed vs not, both before and after editing.

**e) Currently-viewing student in the left panel is always highlighted.** Selection is `currentStudent`. Clicking a different student's row updates `currentStudent` and resets `currentQuestion` to "sectionA".

**f) Bottom-bar buttons reflect state.** "Approve & Next →" is brand-blue when something is editable. When the question is already approved, that button is replaced by "Edit this question" at the top of the panel; the bottom bar shows just "← Previous" and "Next →" arrows for navigation.

**g) The Reset Demo button is always accessible** from the top bar across all screens, including loaders and success screens.

---

## 6. What's NOT interactive yet

For now, keep these as click-through-only without real state:

- **Screen 1** (OCR transition loader) — auto-advances after 2 seconds, no logic
- **Screens 7, 8** (class complete, communication) — informational screens with click-through CTAs only
- **Screens 9, 10** (student-side report + regrade request) — display-only, the regrade request submits to a fake queue
- **Screens 11, 12** (teacher regrade queue + review) — show a mock pending regrade for one of Tanish's classmates, allow updating but don't propagate changes
- **Screen 13** (final publish) — terminal state, button cycles back to Reset

---

## 7. Implementation order

Build this state management in passes:

1. **Set up Zustand store** with the shape above. Wire localStorage persistence. Add the Reset Demo button. Verify state survives refresh.
2. **Wire the left panel** to derive student statuses from state. Verify clicking a student updates `currentStudent`.
3. **Wire Screen 5 editing** — the heart of the interactive demo. Step score editing, total recompute, teacher notes, tags. Verify edits persist on navigation away and back.
4. **Wire the approve/reopen flow** — clicking approve adds to `questionsReviewed`, viewing approved question shows the Edit button.
5. **Wire Screen 4 → 5 navigation** (Approve all 20 MCQs) and Screen 5 → 6 navigation (all 38 reviewed).
6. **Wire Screen 6 submit flow** with the micro success screen.
7. **Build the scripted sequences** for Screens 2 and 3.
8. **Wire the submitted-student lock** and verify locked students can't be edited.

Test the full demo path: Screen 2 → drop → Screen 3 → loader → Screen 4 → approve MCQs → Screen 5 → grade through subjective questions, edit a step → Screen 6 → submit → success → next student loaded.

---

## 8. Key behaviors to verify

- Editing a step on Screen 5 updates the question total live
- Editing a step persists when navigating away and back
- Approved questions show green check in the dropdown
- Clicking an approved question shows it read-only with an "Edit" button
- Editing an approved question reopens it as "in review"
- Submit on Screen 6 is disabled when any question is pending
- Submitted students lock; their workspace becomes read-only
- Reset Demo returns everything to first-load state from any screen
- The grading loader and Narayana drop sequences play smoothly without race conditions
- localStorage persistence means an accidental refresh doesn't kill the demo

If any of these don't work, the demo will feel broken in front of Narayana. Verify each before considering the prototype done.
