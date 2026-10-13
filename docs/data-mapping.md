# LOAM Demo Data — Screen-to-Field Mapping

This document maps every visible data element across the prototype to its source in students.json, questions.json, or scores.json.

## The three files

- **students.json** — 30 student records with totals, roll numbers, ranks, section breakdowns
- **questions.json** — full Midterm paper: 38 displayed questions, MCQ options/answers, subjective stepwise schemas
- **scores.json** — per (student, question) score data: marks_awarded, max_marks, OR variant attempted, stepwise_awarded (null until OCR data lands)

All three reference the same 30 students by name.

---

## Screen-by-screen field mapping

### Persistent left panel (Screens 3, 4, 5, 6)
- Header "Class XII-A · Maths Pre-Board 1" → hard-coded label (display only)
- Header "Maths Midterm" → questions.json `exam.name`
- Progress "X of 30 reviewed" → derived from demo state, denominator = students.json length
- Each student row name → students.json `[i].name`
- Each student row roll → students.json `[i].roll_number`
- Each student row score X/80 → students.json `[i].total_marks` / `[i].max_marks`
- Each student row status dot → driven by demo state (not from data)
- Highlighted student → derived from current route/selection

### Screen 4 — MCQ workspace
- "Section A · MCQs" dropdown label → questions.json `sections.section_a.label`
- "20 questions · 1 mark each · 20 marks total" → questions.json `sections.section_a` totals
- Section total X/20 in right panel → sum of scores.json `[student].questions` where `type=='mcq'`
- Each MCQ table row:
  - Q# → questions.json `[Q1..Q20].code`
  - Student's answer → currently no field; would need OCR data later (display placeholder for now)
  - Correct answer → questions.json `[Q1..Q20].correct_answer`
  - Marks → scores.json `[student].questions[Q].marks_awarded`
  - Status (correct/incorrect) → scores.json `[student].questions[Q].is_correct`
- Red-tinted rows → scores.json `[student].questions[Q].is_correct == false`

### Screen 5 — Subjective workspace
- Question dropdown "Q24 ▾" → questions.json `[Q24].code`
- "22 of 38 graded" → derived from demo state
- Question text rendered with KaTeX → questions.json `[Q].question_text` (or `[Q].variants[v].question_text` for OR)
- Max marks "5 marks" → questions.json `[Q].max_marks`
- QUESTION TOTAL X/5 → scores.json `[student].questions[Q].marks_awarded` / `.max_marks`
- AI stepwise grading rows:
  - Step number → questions.json `[Q].stepwise_schema[i].step`
  - Step label → questions.json `[Q].stepwise_schema[i].label`
  - Max marks per step → questions.json `[Q].stepwise_schema[i].max_marks`
  - Awarded per step → scores.json `[student].questions[Q].stepwise_awarded[i]` (NULL until OCR data — display "—/X" placeholder for now)
- Error tag chip on incorrect step → NULL until OCR data
- Reasoning block under incorrect step → NULL until OCR data

For OR questions, the variant the student attempted is in scores.json `[student].questions[Q].variant_attempted`. The matching schema is in `questions.json [Q].variants[v].stepwise_schema`.

### Screen 6 — Final review
- Title "Aarav Sharma · Final Review" → students.json `[i].name`
- "Maths Midterm · 36 of 38 questions reviewed" → derived from demo state
- "Total: X / 80" → students.json `[i].total_marks`
- Peer comparison line → students.json `[i].peer_label` (e.g. "Top 10% of class")
- Section breakdown cards → students.json `[i].section_breakdown`
  - Section A: `section_a_mcq.score` / `.max`
  - Sections B–E: aggregate the subjective + case sections
- "Class rank so far" → students.json `[i].rank_in_class` of `[i].class_size`
- Question grid (38 cells):
  - Q# → scores.json `[student].questions[i].code`
  - Score X/Y → scores.json `[student].questions[i].marks_awarded` / `.max_marks`
  - Color border state:
    - Green: marks_awarded == max_marks
    - Orange: 0 < marks_awarded < max_marks
    - Red: marks_awarded == 0 and attempted == true
    - Gray (pending): demo state only

### Screen 7 — Class complete
- "All 30 papers graded" → students.json length
- "Time saved" hero number → demo-pinned value (still to decide)
- Class average → mean of students.json `[i].total_marks` = **46.78 / 80**
- Highest scorer → students.json max of `.total_marks` = Meera, 79/80
- Distribution stats → derived from students.json

---

## What's deferred (null fields)

- **scores.json `[student].questions[q].stepwise_awarded`** — null for every question. Populates when OCR + AI grading data lands. Display as "—/X" placeholder for max per-step marks.
- **MCQ student answers** — currently no `student_answer` field on MCQ score entries. Either we synthesize plausible wrong-answer letters for incorrect MCQs (for the demo table), or we add the field later when OCR data lands.
- **Teacher notes** — empty in initial demo state.
- **AI confidence / error tags** — null until OCR data.

---

## Demo-state assignments (not in JSON)

These are presentation-only states the implementer assigns:

- Which students are in `graded`, `currently_grading`, `pending`, `not_started` states (for Screens 3, 4 left panel)
- Which student is currently selected (Aarav was the placeholder; replace with a real name — e.g. **Tanish Arora**, who scored 67/80 with good mix of full and partial marks, would work well)
- Which 2 questions are "pending" on Screen 6 (was Q33, Q35 in the mockup — pick any 2 unreviewed-looking questions)

---

## Quick stats for the demo

- 30 students, all displayed as Section XII-A
- 38 questions per student (20 MCQ + 5 VSA + 6 SA + 4 LA + 3 case-based)
- Class average: **46.78 / 80**
- Top scorer: **Meera (79/80)**
- Lowest: **Ananya Iyer (12/80)** and **Mihir Ghosh (12/80)**
- 6 questions have OR variants — students naturally split across both variants
