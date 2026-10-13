"""Run every query in analysis/queries.sql and print the results as tables.

Run from the repo root:  python3 analysis/run_queries.py
"""
import sqlite3, pathlib, subprocess, sys

here = pathlib.Path(__file__).resolve().parent
if not (here / "loam.db").exists():
    subprocess.run([sys.executable, str(here / "load_data.py")], check=True)
db = sqlite3.connect(here / "loam.db")

blocks = (here / "queries.sql").read_text().split(";")
for block in blocks:
    lines = [l for l in block.strip().splitlines()]
    sql = "\n".join(l for l in lines if not l.strip().startswith("--")).strip()
    if not sql:
        continue
    title = next((l.strip("- ").strip() for l in lines if l.strip().startswith("-- Q")), "")
    cur = db.execute(sql)
    cols = [d[0] for d in cur.description]
    rows = cur.fetchall()
    print(f"\n### {title}\n")
    print("| " + " | ".join(cols) + " |")
    print("|" + "---|" * len(cols))
    for r in rows:
        print("| " + " | ".join(str(v) for v in r) + " |")
