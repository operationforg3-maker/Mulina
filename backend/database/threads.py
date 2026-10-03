"""
Database access layer for threads
"""
import sqlite3
from typing import List, Optional, Dict
from pathlib import Path

import os

# Path to database - check env var first, then container path, then local repo path
def _resolve_db_path() -> Path:
    env_path = os.getenv("DATABASE_PATH")
    if env_path and Path(env_path).exists():
        return Path(env_path)
    
    candidates = [
        Path(__file__).parent.parent / "data" / "threads.db",       # /app/data/threads.db
        Path(__file__).parent.parent.parent / "data" / "threads.db",# ../data/threads.db
        Path("data/threads.db"),
        Path("/app/data/threads.db"),
    ]
    for c in candidates:
        if c.exists():
            return c
    return candidates[0]

DB_PATH = _resolve_db_path()

def get_db_connection():
    """Get SQLite database connection"""
    conn = sqlite3.connect(str(_resolve_db_path()))
    conn.row_factory = sqlite3.Row  # Access columns by name
    return conn

def get_all_threads(brand: Optional[str] = None) -> List[Dict]:
    """
    Pobiera wszystkie nici z bazy danych
    
    Args:
        brand: Opcjonalny filtr marki (DMC, Anchor, Ariadna)
    
    Returns:
        Lista słowników z danymi nici
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if brand:
        cursor.execute("""
            SELECT thread_id, brand, color_code, color_name, 
                   r, g, b, l_star, a_star, b_star, hex_color
            FROM threads
            WHERE brand = ?
            ORDER BY color_code
        """, (brand,))
    else:
        cursor.execute("""
            SELECT thread_id, brand, color_code, color_name,
                   r, g, b, l_star, a_star, b_star, hex_color
            FROM threads
            ORDER BY brand, color_code
        """)
    
    rows = cursor.fetchall()
    conn.close()
    
    # Convert to list of dicts
    threads = []
    for row in rows:
        threads.append({
            "thread_id": row["thread_id"],
            "brand": row["brand"],
            "color_code": row["color_code"],
            "color_name": row["color_name"],
            "rgb": (row["r"], row["g"], row["b"]),
            "lab": (row["l_star"], row["a_star"], row["b_star"]),
            "hex_color": row["hex_color"]
        })
    
    return threads

def get_thread_by_id(thread_id: str) -> Optional[Dict]:
    """Pobiera nić po ID"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT thread_id, brand, color_code, color_name,
               r, g, b, l_star, a_star, b_star, hex_color
        FROM threads
        WHERE thread_id = ?
    """, (thread_id,))
    
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
    
    return {
        "thread_id": row["thread_id"],
        "brand": row["brand"],
        "color_code": row["color_code"],
        "color_name": row["color_name"],
        "rgb": (row["r"], row["g"], row["b"]),
        "lab": (row["l_star"], row["a_star"], row["b_star"]),
        "hex_color": row["hex_color"]
    }

def get_thread_count() -> int:
    """Zwraca liczbę nici w bazie"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM threads")
    count = cursor.fetchone()[0]
    conn.close()
    return count

# Test module
if __name__ == "__main__":
    print(f"Database path: {DB_PATH}")
    print(f"Exists: {DB_PATH.exists()}")
    
    count = get_thread_count()
    print(f"\nTotal threads in database: {count}")
    
    if count > 0:
        threads = get_all_threads(brand="DMC")
        print(f"\nDMC threads: {len(threads)}")
        if threads:
            print(f"\nFirst thread: {threads[0]}")
