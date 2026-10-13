"""Load the demo's JSON data into a SQLite database so it can be queried with SQL.

Run from the repo root:  python3 analysis/load_data.py
Creates analysis/loam.db with three tables: students, questions, answers.
"""
import json, sqlite3, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
db = sqlite3.connect(root / "analysis" / "loam.db")
db.executescript("""
DROP TABLE IF EXISTS students; DROP TABLE IF EXISTS questions; DROP TABLE IF EXISTS answers;
CREATE TABLE students  (roll TEXT PRIMARY KEY, name TEXT, total_marks REAL, attended INTEGER);
CREATE TABLE questions (code TEXT PRIMARY KEY, q_no INTEGER, section TEXT, type TEXT,
                        max_marks REAL, chapter TEXT, concept TEXT, steps INTEGER);
CREATE TABLE answers   (roll TEXT, code TEXT, marks_awarded REAL, max_marks REAL, attempted INTEGER);
""")
for s in json.load(open(root / "data/students.json")):
    db.execute("INSERT INTO students VALUES (?,?,?,?)",
               (s["roll_number"], s["name"], s["total_marks"], int(s["attended"])))
for q in json.load(open(root / "data/questions.json"))["questions"]:
    # "OR" questions (internal choice) keep chapter and steps on each variant; both variants share a chapter.
    src = q["variants"][0] if q.get("has_or_variant") else q
    db.execute("INSERT INTO questions VALUES (?,?,?,?,?,?,?,?)",
               (q["code"], int(q["code"][1:]), q["section"], q["type"], q["max_marks"],
                src.get("chapter"), src.get("concept"), len(src.get("stepwise_schema") or [])))
for s in json.load(open(root / "data/scores.json")):
    for a in s["questions"]:
        db.execute("INSERT INTO answers VALUES (?,?,?,?,?)",
                   (s["roll_number"], a["code"], a["marks_awarded"], a["max_marks"], int(a["attempted"])))
db.commit()
print("Loaded:", {t: db.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0] for t in ("students", "questions", "answers")})
