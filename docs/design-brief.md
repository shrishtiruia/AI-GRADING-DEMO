# LOAM AI Grading Flow — Claude Design Brief

**Audience:** Sales demo prototype for Narayana Educational Institutions
**Persona:** Class 12 Maths teacher (primary on-screen user)
**Real audience watching the demo:** Narayana leadership / academic operations evaluating LOAM as a procurement decision
**Subject of demo:** Class 12 Maths — Pre-Board 1, 30 students, CBSE format (Section A: 20 MCQs × 1 mark + Sections B–E: ~15 subjective questions, total 80 marks)
**Scope:** Full clickable prototype, ~14 screens, end-to-end from OCR handoff through LMS publish

---

## 1. The product in one paragraph

LOAM (also called ClassLens) is an AI-assisted assessment platform for CBSE K-12 schools. This specific flow is the **AI grading workflow** — the middle act between OCR (scanning handwritten papers) and analytics (class-level diagnostics). The teacher's job here: review AI-graded papers efficiently, trust the AI's reasoning where it's confident, override where it isn't, and push final marks into the school's system (nLearn). The demo's job: convince Narayana that this is faster than manual grading AND more rigorous than what they have today.

---

## 2. Aesthetic direction — Notion density, nLearn surface

This is a **hybrid aesthetic**. Read this section carefully — it's the most important part of the brief.

### The principle

The teacher's grading workspace must feel like a **professional tool** — dense, efficient, trustworthy with high-stakes data. Pastels and pill buttons cannot carry that.

But Narayana's audience must feel **primed** — like LOAM belongs in their world. nLearn (their existing student platform) is the visual anchor.

**Resolution:** The *chrome* (loaders, success screens, transitions, login, navigation) leans nLearn-warm. The *substance* (grading workspace, data tables, decision surfaces) leans Notion-restrained. nLearn's blue and orange thread through both as accents and CTAs, so the language feels continuous.

### Colors

```
/* Primary palette — derived from nLearn */
--brand-blue: #1E7CE8        /* primary accent, links, focus states, info, nLearn-derived UI blue */
--brand-blue-soft: #E8F2FF   /* tinted background washes, hero gradients */
--brand-orange: #F37920      /* highest-stakes CTAs ONLY: Submit, Publish, Final Approve */
--brand-orange-soft: #FFF1E5 /* warning/attention washes, low-confidence flags */

/* Subject identity — Maths */
--subject-maths: #F4A04A     /* Maths-specific badge color from nLearn's protractor card */

/* Neutrals — Notion-warm */
--gray-50:  #FAFAF9
--gray-100: #F4F4F2
--gray-200: #E7E5E0
--gray-300: #D4D2CC
--gray-400: #A8A6A0
--gray-500: #6B6964
--gray-600: #4A4844
--gray-700: #2C2A26
--gray-900: #0F0E0C

/* Semantic */
--success: #16A34A           /* graded, approved, reviewed */
--success-soft: #DCFCE7
--warning: #F37920           /* low-confidence, needs review (reuses brand-orange) */
--warning-soft: #FFF1E5
--danger: #DC2626            /* not reviewed, errors */
--danger-soft: #FEE2E2
```

**Color use rules:**
- White or `--gray-50` is the default workspace background
- `--brand-blue-soft` tinted backgrounds for: loaders, hero panels, login, transition screens
- `--brand-orange` ONLY on: "Submit final marks", "Publish to nLearn", terminal CTAs. Maximum 1 orange button per screen.
- Inside the grading workspace, color signals state (graded, low-confidence, not-reviewed). It is not decoration.

### Typography

- **Primary typeface:** Plus Jakarta Sans (geometric humanist sans, slightly rounded, mirrors nLearn's feel)
- **Monospace:** JetBrains Mono — for marks (X/80), scores, question numbers in dense views
- **No serif anywhere** — keep the K-12 EdTech feel consistent

Type scale:
```
Display:    32px / 600 weight / -0.02em tracking  (success screen hero numbers, page titles)
H1:         24px / 600 / -0.01em                  (screen titles)
H2:         18px / 600 / 0                        (section headers)
Body large: 16px / 500 / 0                        (primary content)
Body:       14px / 400 / 0                        (default UI text)
Small:      13px / 500 / 0                        (labels, captions)
Micro:      11px / 600 / 0.06em / UPPERCASE       (status pills, category labels — nLearn pattern)
```

### Shape language

- Cards: **10px** border radius (Notion territory, not nLearn's 16–20px)
- Buttons: **6px** radius, *not* pill-shaped (we meet nLearn halfway here)
- Inputs: 6px radius
- Pills/badges: fully rounded (pill) — only for status tags
- Profile/avatar: circular

### Elevation

- Default: no border, no shadow (flat, Notion-style)
- Resting cards: `box-shadow: 0 1px 2px rgba(15,14,12,0.04), 0 0 0 1px rgba(15,14,12,0.06)`
- Hover/focus: `0 4px 12px rgba(15,14,12,0.08), 0 0 0 1px rgba(30,124,232,0.2)`
- Hero/modal: `0 20px 50px rgba(15,14,12,0.12)`

### Density

- Base spacing unit: 4px
- Comfortable but not generous. Padding inside cards: 16px. Section gutters: 24px. Page padding: 32px.
- The grading workspace should fit 30 students in the left panel without scroll on a 1440px screen.

### Motion

Subtle. Demo-grade.
- Page transitions: 200ms ease-out fade + 4px translate
- State changes (graded → reviewed): 150ms color transition with 1.05 scale pulse
- Loaders: gentle, never frantic. The "AI is grading" loader gets a slow shimmer, not a spinner race
- The success screen ("9.5 hours saved") gets the only flourish — a number count-up over ~1.2 seconds

---

## 3. Tech stack

- **Framework:** React (functional components, hooks)
- **Component library:** shadcn/ui — extend with custom Plus Jakarta Sans config and the color tokens above
- **Routing:** React Router (each screen is a route)
- **State:** Local component state + a single context for the "current student" and "grading session" objects. No backend. All data is mocked.
- **Icons:** Lucide
- **Typography:** Plus Jakarta Sans via Google Fonts CDN, JetBrains Mono for numerics

---

## 4. Information architecture & routing

```
/                                  → Login (minimal, just for the demo to start somewhere)
/grading/loading                   → OCR → Grading transition loader [SCREEN 1]
/grading/setup                     → Materials & rubric screen [SCREEN 2]
/grading/ingesting                 → Grading-in-progress loader [SCREEN 3]
/grading/student/:id               → Per-student workspace [SCREEN 4 — MCQ mode]
                                     (same route, mode switches on question selected)
                                     [SCREEN 5 — Subjective mode]
/grading/student/:id/review        → Per-student final review [SCREEN 6]
/grading/complete                  → Class-complete success screen [SCREEN 7]
/communicate                       → Communication screen (software + print) [SCREEN 8]
/student/report/:id                → Student-side report view [SCREEN 9]
/student/regrade-request/:id       → Student raises regrade [SCREEN 10]
/teacher/regrade-queue             → Teacher's regrade queue [SCREEN 11]
/teacher/regrade/:id               → Teacher reviews specific regrade [SCREEN 12]
/publish                           → Final publish to LMS (placeholder, pinned) [SCREEN 13]
```

That's 13 distinct screens (the workspace counts as 2 modes on 1 route). Screen 14 if we add an analytics-teaser screen between 7 and 8 — we may or may not need it; can be a button on screen 7.

---

## 5. Persistent chrome

### Top bar (all teacher screens)
- Left: Narayana wordmark (Plus Jakarta 600, brand orange, small) + breadcrumb in `--gray-500`
- Center: empty
- Right: search (kbd shortcut visible "⌘K"), notifications, teacher avatar

### Left panel — student list (Screens 3, 4, 5, 6)
Persistent on all per-student screens. ~280px wide.

For each student row:
- Student name (primary)
- Roll number (secondary, gray-500)
- Progress dot: gray (not started) → blue (in progress) → green (reviewed) → orange (low-confidence pending)
- Mini score X/80 when graded
- Current student row highlighted with `--brand-blue-soft` background + 3px left border in `--brand-blue`

Header of left panel:
- "Class XII-A • Maths Pre-Board 1"
- Progress: "12 of 30 reviewed"
- A search field

Footer of left panel:
- "Submit all & continue →" button (disabled until all 30 are reviewed)

### Question strip (Screens 4, 5, 6)
Horizontal strip across the top of the workspace, BELOW the top bar. Shows all 35 questions for the current student:
- Q1–Q20 collapsed into a single block labeled "Section A · MCQs (20)" — clickable as a unit
- Q21–Q35 individually clickable
- Each question shows status color: gray (not viewed) → blue (current) → green (reviewed) → orange (flagged) → red (overridden)
- Current selection has a 2px brand-blue underline

---

## 6. Screen-by-screen specs

### SCREEN 1 — OCR → Grading transition loader

**Purpose:** Bridge from the OCR demo (out of scope) into the grading flow. Reassures the audience that scanned papers are now ready for AI grading.

**Layout:** Full-bleed `--brand-blue-soft` background. Centered.

**Content:**
- nLearn-style soft illustration (paper → arrow → checkmark)
- Headline: "Papers scanned. Preparing AI grading."
- Sub: "30 papers ingested from your scanner • Class XII-A Maths Pre-Board 1"
- Progress bar (determinate, 80% filled, slowly creeping to 100% over 2 seconds)
- After 2s, auto-advances to Screen 2 (or button: "Continue →")

**Demo beat:** "We've handed off from OCR. Now LOAM is configuring the grading run."

---

### SCREEN 2 — Materials & rubric (drag-and-drop trust screen)

**Purpose:** Show the audience exactly what LOAM uses to grade. Make Narayana feel their specificity is respected. This is the trust foundation for everything that follows.

**Layout:** Split. Left 60%: drop zone area with three pre-filled material slots. Right 40%: live preview of what LOAM has parsed.

**Three material slots (left, vertical stack):**

Each slot is a card showing a parsed material:

1. **Marking rubric** — pre-filled. Card shows: "CBSE Class XII Mathematics Marking Scheme 2025-26 • 12 pages • parsed". Small file icon. Status pill: "✓ Loaded"

2. **Teacher's stepwise answer key** — pre-filled. Card shows: "Maths Pre-Board 1 Answer Key.pdf • 8 pages • stepwise marks extracted". A small expandable section reveals 2–3 sample steps with mark allocations rendered as LaTeX.

3. **Narayana-specific grading guidelines** — *this is the live-drop slot*. Initially shown as an empty dashed-border zone with text "Drop Narayana grading guidelines here" + small icon. **During the demo, the presenter drops a file onto this zone.** Animate: file appears, parsing spinner, then "Narayana_Grading_Guidelines_2025.pdf • 6 pages • parsed. Recognised: I-Spark methodology, dual CBSE+JEE rubric, step-credit policy". Card transitions to filled state with `--brand-orange-soft` highlight to draw the eye to the Narayana-specific moment.

**Right panel — live preview:**
- Header: "LOAM has understood:"
- Bullet list (animated in as files are processed):
  - "✓ CBSE marking scheme for 80-mark Maths paper"
  - "✓ 35 questions with step-wise mark distribution"
  - "✓ Narayana's I-Spark methodology — partial credit rules applied"
  - "✓ Permitted alternative methods per Narayana guidelines"
- Sample question preview: shows Q23 with its mark scheme broken into steps, rendered in monospace + LaTeX

**Footer CTA:** `[Start Grading 30 Papers →]` (brand-blue, full width of left column)

**Demo beat:** "Before LOAM grades a single answer, we ingest your rubric, your answer key, and your school's specific grading guidelines. I'm dropping in Narayana's I-Spark methodology right now — watch LOAM parse it." [drops file] "Notice it picked up the dual CBSE-JEE rubric and your step-credit policy. Nothing is graded against generic CBSE; everything is graded the way Narayana grades."

---

### SCREEN 3 — Grading-in-progress loader

**Purpose:** Show the AI doing the work. Build anticipation. This screen earns its place by making the AI feel real and the work feel substantial.

**Layout:** Full workspace with the persistent left panel already present (students appearing one by one as graded).

**Center content:**
- Large headline: "Grading 30 papers"
- Live ticker: "23 of 30 complete" — counts up
- Beneath: a thin progress bar with sub-segments showing question-by-question progress on the current student
- Animated status text that cycles:
  - "Reading Aarav Sharma's answer to Q24…"
  - "Cross-checking step 2 against marking scheme…"
  - "Recognising alternative method on Q31…"
  - "Confidence check passed for Q15…"
- Below: small grid of student avatars/initials. Already-graded ones light up green. Currently-grading one has a pulsing blue dot.

**Edge case:** One student card shows "Absent" (gray, "—" instead of progress dot). Tooltip: "Student did not attend exam — no paper to grade."

**After ~4 seconds:** all 30 graded, button appears: `[Begin Review →]`. Click → Screen 4.

**Demo beat:** "While we talk, LOAM is grading all 30 papers. You'll notice it flags low-confidence answers — those are the ones it wants you to double-check. We don't ask you to verify what AI is sure about. We ask you to verify what it isn't."

---

### SCREEN 4 — Per-student workspace (MCQ mode, Q1–Q20)

**Purpose:** First impression of the grading workspace. Shows that AI handles the easy stuff in bulk so the teacher doesn't waste time.

**Layout:**
- Left panel (persistent student list) — Aarav Sharma is selected (top of list, top scorer profile)
- Top bar — breadcrumb: "Maths Pre-Board 1 / Aarav Sharma (Roll 12)"
- Question strip below top bar — Section A block selected (Q1–Q20)
- Main workspace: split
  - **Left 55%** — student's actual answer sheet for Section A (a scanned page showing 20 MCQ answers written in a column, slight rotation for authenticity)
  - **Right 45%** — MCQ review panel

**MCQ review panel design:**
- Header: "Section A — MCQs • 20 questions • 1 mark each"
- Subheader: "AI confidence: HIGH on all 20" + small confidence chip
- A scrollable list, one row per question:
  - `Q1` | Student: `(b)` | Correct: `(b)` | `✓ Correct • 1/1` | hover → "Override" link
  - `Q2` | Student: `(a)` | Correct: `(c)` | `✗ Incorrect • 0/1` | hover → "Override"
  - etc. for all 20
- Section A subtotal at the bottom: "Aarav scored **17/20** on Section A"
- Two CTAs:
  - `[Approve all 20 →]` (primary, brand-blue)
  - `[Review one by one]` (secondary, ghost button)

**The demo beat:** "Section A is 20 MCQs. AI is confident on all of them — see the green chip? Aarav got 17 out of 20. I can approve all 20 with one click and move on to where the teacher's judgement actually matters — the subjective questions."

**Click "Approve all 20":** the question strip lights up Q1–Q20 in green. Auto-advances to Q21. Transition to subjective mode (Screen 5).

---

### SCREEN 5 — Per-student workspace (Subjective mode, Q21+)

**Purpose:** The single most important screen in the demo. Where AI reasoning, trust, and the "notes-as-chip" beat all live. Where Narayana decides if they believe LOAM.

**Layout:**
- Persistent left panel (student list) — Aarav still selected
- Top bar, breadcrumb
- Question strip — Section A block all green, Q21 currently selected (blue underline), Q22–Q35 gray
- Main workspace: 3-column split
  - **Left 40%** — student's answer paper for Q21, with AI overlays
  - **Center 30%** — AI's stepwise reasoning + editable scoring
  - **Right 30%** — teacher notes + tags

**Left column (student's answer):**
- Question text at the top: "Q21. Evaluate ∫ x²e^x dx using integration by parts." (rendered in LaTeX/MathJax)
- Below: the scanned answer image (handwritten work)
- **AI overlays on the scan:**
  - Each step the student wrote is bracketed with a subtle blue outline
  - A small numbered badge ① ② ③ next to each step
  - Hovering a step highlights it in both columns

**Center column (AI reasoning + scoring):**
- Header: "AI Grading • Q21 • 5 marks"
- Step-by-step breakdown:
  - **Step 1: Identifies u and dv correctly** — `1/1 ✓` (green check, editable)
  - **Step 2: Applies integration by parts formula** — `1/1 ✓`
  - **Step 3: Computes ∫e^x dx for the v term** — `1/1 ✓`
  - **Step 4: Substitutes back correctly** — `1/1 ✓`
  - **Step 5: Final answer x²e^x − 2xe^x + 2e^x + C** — `0/1 ✗`
    - Below: AI's reasoning: "Student wrote final answer as x²e^x − 2xe^x + 2e^x but did not include constant of integration +C."
- Total at bottom: `4/5` in large monospace
- Inline editable: click any score to edit. Changing a step score auto-updates the total.

**Right column (teacher tools):**
- Section: "Tags" — chips for: `Alt method used`, `Not attempted`, `Low-confidence flag`, `Calculation error`, `Conceptual error`, `Skill gap`. Click to apply.
- Section: "Teacher notes"
  - Textarea: "Add a note about this answer…"
  - Below the textarea, **a chips area: "Reuse notes from similar mistakes:"**
    - First time on this question for this paper: empty
    - **The demo beat:** after the teacher types "Forgot +C — remind class about constants of integration" on Aarav's paper and saves, when she navigates to Priya Patel's paper (3rd student in the list) for the same Q21 with the same mistake, this chip appears here pre-populated: `[+] "Forgot +C — remind class about constants of integration"`. One click applies it.
- Bottom CTA strip:
  - `[← Previous Question]` `[Approve & Next →]` (brand-blue)
  - Keyboard hint: `↵ to approve · ↓ next question · ⌘E to edit score`

**Low-confidence variant:** For one specific question on one student (let's say Q28 on student #7, Rohan Mehta), the center column has an orange banner at the top:
> ⚠️ **AI confidence: LOW**
> "Student's working uses a substitution method not explicitly covered in the answer key. We've awarded provisional marks but recommend teacher review."
The question strip shows Q28 with an orange ring. The left-panel student row shows an orange dot.

**Did-not-attend variant:** For student "Kavya Reddy" (specifically marked absent), the workspace shows: large center card, gray. "Kavya Reddy was absent for this exam." Button: `[Mark as absent — 0/80] [Skip to next student]`.

---

### SCREEN 6 — Per-student final review

**Purpose:** Quick sanity check before moving to next student. All questions visible at a glance.

**Layout:** Same chrome (left panel, top bar, question strip). Main area replaced with:
- Header: "Aarav Sharma • Roll 12 • Final Review"
- Grid: 35 question cards (5 columns × 7 rows). Each card: Q number, score X/Y, status color border.
- Sidebar: total marks, breakdown by section, time taken to grade vs class average
- Bottom: `[Submit & Continue to Priya →]` (brand-blue)

**Demo beat:** "All questions reviewed for Aarav. Final score 67 out of 80. Submit, on to the next student." Click → loads next student via left panel → loops back to Screen 5.

---

### SCREEN 7 — Class-complete success screen

**Purpose:** The emotional payoff. The hero moment.

**Layout:** Full-bleed `--brand-blue-soft` gradient background. Centered, generous breathing room.

**Content:**
- nLearn-style illustration (celebration / confetti, restrained)
- Display headline: "30 papers graded."
- Below, hero metric in display weight with count-up animation:
  - **"9 hours 32 minutes saved"** (placeholder number — PINNED)
- Subtext: "Manual grading time for 30 papers ≈ 11 hours. With LOAM: 1 hour 28 minutes including your review."
- Three stat cards in a row:
  - "30 papers · 100% reviewed"
  - "Average score: 58/80"
  - "Highest: 76/80 (Aarav Sharma) · Lowest: 22/80 (3 students under 30)"
- Two CTAs:
  - `[Communicate to students →]` (brand-orange, primary CTA)
  - `[View class analysis →]` (ghost, with small "next" arrow — links to /communicate but visually gestures at the analytics layer with a sub-label "see error patterns across the class")

**Demo beat:** "You just graded 30 papers in 88 minutes. That's a 9.5-hour saving. And LOAM has already started clustering error patterns across the class — but that's the analytics product. Let's see how grades go to students."

---

### SCREEN 8 — Communication screen (software + print)

**Purpose:** Show both delivery paths in one screen. Demonstrates that LOAM slots into Narayana's existing world (nLearn) AND respects offline/parent communication.

**Layout:** Two-column split.

**Left column — Software delivery (nLearn integration):**
- Header: "Publish to nLearn"
- Card preview: mock of a student's nLearn-styled report card (this is the most nLearn-styled element in the whole demo — pastel background, rounded cards, soft shadows, matches their language)
- Shows: student name, total marks, question-wise breakdown, step-wise comments visible on expand
- Toggle: "Include AI step-wise comments" (on by default)
- Toggle: "Notify parents via SMS" (on by default, small sub-text: "247 parents will receive SMS within 5 minutes of publish")
- CTA: `[Publish to nLearn for all 30 students]` (brand-orange — terminal action)

**Right column — Print delivery:**
- Header: "Generate print reports"
- Preview of a print-ready PDF (mocked as an image of a clean printable A4 report — Narayana letterhead at top, student details, question-wise marks, teacher notes, footer with school info)
- Options:
  - Per-student PDFs (one per student) — `[Generate 30 PDFs]`
  - Class summary PDF — `[Generate summary]`
- Subtext: "Useful for parent-teacher meetings and offline distribution"

**Demo beat:** "Reports go two ways. Digitally into nLearn, where students and parents already log in — they don't need to learn a new system. And as print-ready PDFs for parent-teacher meetings. Notice this report is in your nLearn visual language — it doesn't look like a third-party tool dropped marks into your system."

---

### SCREEN 9 — Student-side report view (minimal)

**Purpose:** Show Narayana what the student experience looks like — and set up the regrade request.

**Layout:** This screen breaks from the teacher chrome. It mimics nLearn's student-facing aesthetic more heavily (rounded cards, pastel tints, friendlier feel — but still LOAM-branded).

**Top bar:** Switches to student-mode. "Logged in as Aarav Sharma" indicator (for the demo, breadcrumb shows "Demo: viewing as student")

**Content:**
- Hero card: "Maths Pre-Board 1 • Your Result"
- Big display: **67 / 80** with class average comparison: "Class average: 58 • You: 67 (Top 15%)"
- Below: question-by-question breakdown as expandable cards
  - Each card: Q number, marks earned, click to expand
  - Expanded: shows student's answer, AI's notes, teacher's notes if any, mark allocation
- For Q5 (an MCQ where Aarav got it wrong), card has a `[Request regrade]` button
- For Q24 (a subjective question), same option

**Demo beat:** "From the student's side — Aarav sees his marks, sees exactly where he lost marks step by step, and if he disagrees, he can request a regrade. Let's say he's confident about Q24."

Click `[Request regrade]` on Q24 → Screen 10.

---

### SCREEN 10 — Student raises regrade request

**Purpose:** Demonstrate the regrade mechanism from the student's initiating side. Brief — this is plumbing, not the showcase.

**Layout:** Modal-style overlay or dedicated screen with student chrome.

**Content:**
- Header: "Request regrade — Q24"
- Shows the question and the AI/teacher comments that took marks off
- Required field: "Why do you think this should be regraded?" (textarea)
- Optional: attach reference (link to NCERT, photo of work, etc. — visual only, non-functional)
- CTA: `[Submit regrade request]`
- After submit: confirmation toast + screen state changes to "Regrade request submitted. Your teacher will review within 48 hours."

**Demo beat:** "Aarav explains why — he believes his alternative method is valid. The request goes to his teacher."

---

### SCREEN 11 — Teacher's regrade queue

**Purpose:** Show the teacher the operational reality — how regrade requests are managed at scale.

**Layout:** Returns to teacher chrome (top bar, left nav). Main area: table/list view.

**Content:**
- Header: "Regrade requests • 4 pending"
- Filters: by subject, by exam, by student, by date
- Table rows:
  - Aarav Sharma · Q24 · Maths Pre-Board 1 · "I used a different method…" · 2 hours ago · `[Review]`
  - Priya Patel · Q31 · Maths Pre-Board 1 · "My step 3 was correct…" · 5 hours ago · `[Review]`
  - 2 more rows
- Each row clickable → Screen 12

**Demo beat:** "Teacher sees all requests in one queue, sorted, filterable. No emails, no WhatsApp. Pick one."

---

### SCREEN 12 — Teacher reviews specific regrade

**Purpose:** Show the teacher's regrade workflow — the AI's original judgement, the student's reasoning, the teacher's decision tools.

**Layout:** Returns to the per-student workspace layout (familiar from Screen 5) but with regrade context overlaid.

**Content:**
- Top banner: "Regrade Request • Aarav Sharma • Q24 • Submitted 2 hours ago"
- Workspace shows Q24 in the same 3-column layout as Screen 5
- New right-column section above teacher notes: **"Student's regrade reason"** in a callout card with student's text and any attachment
- Center column shows the original AI marks + the original teacher review
- Action buttons:
  - `[Update marks]` (opens editor)
  - `[Reject request — keep original marks]` (with required reason field)
- Whatever the teacher chooses, a notification queues to the student

**Demo beat:** "Teacher sees Aarav's reasoning side by side with the original grading. She can update or reject — either way, Aarav gets a clear response."

---

### SCREEN 13 — Final publish to LMS (PLACEHOLDER)

**Status:** Pinned. Design is provisional until you decide on publish-screen approach (clean confirmation vs. mock nLearn).

**Default (clean confirmation):**
- Centered, `--brand-blue-soft` background
- Headline: "Final marks published"
- Sub: "Maths Pre-Board 1 results have been added to nLearn and notified to students and parents."
- Three rows of confirmation:
  - "✓ 30 students notified via nLearn"
  - "✓ 247 parents notified via SMS"
  - "✓ Marks added to school database"
- Small link: `[View in nLearn →]` (out of scope, links nowhere)
- CTA: `[Back to dashboard]`

---

## 7. Demo script anchors

For the salesperson, the key moments to land verbally:

1. **Screen 2 — drag-and-drop:** "Notice it picked up your I-Spark methodology and step-credit policy."
2. **Screen 4 — MCQ bulk:** "We don't waste your time on what AI is sure about."
3. **Screen 5 — stepwise reasoning:** "Every mark on every step is justified. You can see exactly why LOAM gave or didn't give credit."
4. **Screen 5 — notes chip:** "Watch — teacher's note from Aarav's paper auto-suggests on Priya's identical mistake."
5. **Screen 5 — low confidence:** "When LOAM is unsure, it tells you. It doesn't fake confidence."
6. **Screen 7 — time saved:** "9.5 hours back to your teacher, every exam cycle."
7. **Screen 8 — nLearn integration:** "Reports look like your reports. Students don't learn a new system."
8. **Screen 12 — regrade:** "Disputes don't live in WhatsApp anymore."

---

## 8. Demo data — placeholder structure (real data to be swapped in later)

**Class:** XII-A, Maths, 30 students
**Exam:** Pre-Board 1, 80 marks, ~90 minutes

**Student archetypes (designed for narrative variety in the left panel):**
- 1× top scorer (76/80) — Aarav Sharma — used for the happy-path walkthrough
- 1× strong with one alt-method (used for the alt-method tag demo) — Rohan Mehta
- 1× same-mistake-as-Aarav (used for notes-chip demo) — Priya Patel
- 1× low-confidence flag (Q28) — also Rohan Mehta
- 1× absent — Kavya Reddy
- 3× failing (under 30) — to populate the lowest-scorer stat
- ~22 others — distributed normally around 58 mean

**Questions:** 35 total (20 MCQ + 15 subjective). Subject area: Calculus (Integrals, Differentiation, Application of Derivatives) — matches Class 12 Pre-Board 1 syllabus and the earlier-recommended Narayana demo topic.

---

## 9. Out of scope (explicit)

- Analytics screens (error categorisation, class average comparison, teacher error classification view) — gestured at via CTA on Screen 7
- Full student portal (only the 2 screens needed for regrade flow)
- Parent-side UI (parents get SMS — not in prototype)
- Real nLearn integration (placeholder visual on Screen 13)
- Real OCR (handed off at Screen 1)
- Multi-subject, multi-exam, multi-class navigation (single class, single exam)
- Login/auth (hardcoded teacher identity)
- Admin/principal/leadership views

---

## 10. States and edge cases to design

- **Empty state** for regrade queue: "No regrade requests. Your students agree with their marks 🎉"
- **Loading skeletons** for the per-student workspace (when navigating between students)
- **Error state** (single screen, just in case): "Couldn't load this student's paper. [Retry]"
- **Confirmation modals** before destructive/terminal actions (Publish, Reject regrade)

---

## 11. Build order recommendation

Don't build screen-by-screen. Build in this order so each stage de-risks the next:

1. **Design system first** — set up Plus Jakarta Sans, color tokens, shadcn theme, base layouts. One demo component (a button, a card, a status pill) per token category.
2. **Persistent chrome** — top bar, left student panel, question strip. These appear on 6+ screens; getting them right early saves rework.
3. **Screen 5 (subjective workspace)** — the most complex screen. If it works, the rest is downhill. This is where the demo lives or dies.
4. **Screen 4 (MCQ mode)** — small variant of Screen 5's chrome.
5. **Screen 6 (review) + Screen 7 (success)** — simpler, polish-heavy.
6. **Screens 2 and 3 (setup, ingesting)** — animations and motion-heavy, save for when foundation is solid.
7. **Screen 1 (loader)** — simplest, trivial.
8. **Screens 8–12 (communication, student side, regrade)** — second act, build after Act 1 is solid.
9. **Screen 13 (publish)** — placeholder until publish-screen approach is decided.

---

## Pinned decisions (resolve before final polish)

1. **Time-saved framing on Screen 7** — exact number and phrasing
2. **Publish screen design** — clean confirmation vs. mock nLearn screen
3. **Real demo data** — Shrishti has clean OCR data from DPS East Maths Pre-Board 1 to swap in once design is stable
