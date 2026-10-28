import sqlite3
from pathlib import Path

for db_path in [Path("datawise.db"), Path("../datawise.db")]:
    if db_path.exists():
        conn = sqlite3.connect(str(db_path))
        cur = conn.cursor()
        tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
        print(f"Tables in {db_path}: {tables}")
        for t in ["projects", "project_prompts", "user_decisions", "agent_events", "agent_runs", "datasets", "dataset_profiles", "dataset_columns", "artifacts", "models"]:
            if t in tables:
                cur.execute(f"DELETE FROM {t}")
                print(f"  Cleared {t}")
        conn.commit()
        conn.close()
        print(f"Database {db_path} cleaned successfully.")
