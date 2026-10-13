-- Product questions answered from one real Class XII Maths pre-board (30 students, 38 questions).
-- Run: python3 analysis/run_queries.py

-- Q1. Where does the teacher's checking effort go?
--     Every answer is one decision for the teacher. Compare share of decisions vs share of marks.
SELECT
  CASE WHEN q.type = 'mcq' THEN 'MCQ' ELSE 'Subjective' END            AS kind,
  COUNT(*)                                                             AS answers_to_check,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM answers), 1)          AS pct_of_decisions,
  ROUND(100.0 * SUM(a.max_marks) / (SELECT SUM(max_marks) FROM answers), 1) AS pct_of_marks
FROM answers a JOIN questions q USING (code)
GROUP BY kind;

-- Q2. Do subjective answers really need step-wise marking?
--     Count answers that got partial marks (not full, not zero).
SELECT
  q.section,
  COUNT(*)                                                                         AS answers,
  SUM(a.marks_awarded = a.max_marks)                                               AS full_marks,
  SUM(a.marks_awarded > 0 AND a.marks_awarded < a.max_marks)                       AS partial_marks,
  SUM(a.marks_awarded = 0)                                                         AS zero,
  ROUND(100.0 * SUM(a.marks_awarded > 0 AND a.marks_awarded < a.max_marks) / COUNT(*), 1) AS pct_partial
FROM answers a JOIN questions q USING (code)
WHERE q.type <> 'mcq'
GROUP BY q.section ORDER BY q.section;

-- Q3. Which chapters lose the class the most marks? (input for the analytics product)
SELECT
  q.chapter,
  COUNT(DISTINCT q.code)                              AS questions,
  ROUND(SUM(a.max_marks - a.marks_awarded), 1)        AS marks_lost,
  ROUND(100.0 * SUM(a.marks_awarded) / SUM(a.max_marks), 1) AS class_score_pct
FROM answers a JOIN questions q USING (code)
GROUP BY q.chapter
ORDER BY marks_lost DESC
LIMIT 6;

-- Q4. Which single questions did the class find hardest?
SELECT
  q.code, q.type, q.max_marks, q.chapter,
  ROUND(100.0 * SUM(a.marks_awarded) / SUM(a.max_marks), 1) AS class_score_pct,
  SUM(a.attempted = 0)                                     AS not_attempted
FROM answers a JOIN questions q USING (code)
GROUP BY q.code
ORDER BY class_score_pct ASC
LIMIT 5;

-- Q5. How spread out is the class? Who needs help before the board exam?
--     CBSE pass mark is 33% (26.4 / 80).
SELECT
  COUNT(*)                                        AS students,
  ROUND(AVG(total_marks), 1)                      AS class_average,
  MIN(total_marks)                                AS lowest,
  MAX(total_marks)                                AS highest,
  SUM(total_marks < 26.4)                         AS below_pass_mark,
  SUM(total_marks >= 64)                          AS above_80_pct
FROM students;
