#!/usr/bin/env python3
"""
Skrypt inicjalizacji bazy danych nici
Wczytuje CSV files i tworzy lokalną bazę SQLite + wypełnia Firestore
"""
import csv
import sqlite3
import argparse
from pathlib import Path
import sys

# Dodaj backend do path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from color_engine.delta_e import rgb_to_lab

def create_local_database(db_path: str = "data/threads.db"):
    """Tworzy lokalną bazę SQLite z nićmi"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Tabela threads
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS threads (
            thread_id TEXT PRIMARY KEY,
            brand TEXT NOT NULL,
            color_code TEXT NOT NULL,
            color_name TEXT NOT NULL,
            r INTEGER NOT NULL,
            g INTEGER NOT NULL,
            b INTEGER NOT NULL,
            l_star REAL NOT NULL,
            a_star REAL NOT NULL,
            b_star REAL NOT NULL,
            hex_color TEXT NOT NULL,
            UNIQUE(brand, color_code)
        )
    """)
    
    # Indeksy dla szybszego wyszukiwania
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_brand ON threads(brand)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_color_code ON threads(color_code)")
    
    conn.commit()
    return conn

def import_threads_from_csv(conn, csv_path: str, brand: str):
    """Importuje nici z pliku CSV"""
    cursor = conn.cursor()
    imported = 0
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            thread_id = row['thread_id']
            color_code = row['color_code']
            color_name = row['color_name']
            r, g, b = int(row['r']), int(row['g']), int(row['b'])
            
            # Konwersja do LAB
            l_star, a_star, b_star = rgb_to_lab((r, g, b))
            
            # Hex color
            hex_color = f"#{r:02x}{g:02x}{b:02x}"
            
            try:
                cursor.execute("""
                    INSERT OR REPLACE INTO threads 
                    (thread_id, brand, color_code, color_name, r, g, b, 
                     l_star, a_star, b_star, hex_color)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (thread_id, brand, color_code, color_name, r, g, b,
                      l_star, a_star, b_star, hex_color))
                imported += 1
            except sqlite3.IntegrityError as e:
                print(f"Warning: Duplicate thread {thread_id}: {e}")
    
    conn.commit()
    print(f"✅ Imported {imported} threads from {csv_path} ({brand})")
    return imported

def export_to_firestore(conn):
    """
    Eksportuje dane do Firestore (wymaga firebase-admin)
    """
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
        
        # TODO: Konfiguracja Firebase
        # cred = credentials.Certificate("path/to/serviceAccountKey.json")
        # firebase_admin.initialize_app(cred)
        # db = firestore.client()
        
        print("⚠️  Firestore export not implemented yet")
        print("   Configure Firebase Admin SDK first")
        
    except ImportError:
        print("⚠️  firebase-admin not installed, skipping Firestore export")

def main():
    parser = argparse.ArgumentParser(
        description="Initialize thread database from CSV files"
    )
    parser.add_argument(
        "--brands",
        default="DMC",
        help="Comma-separated list of brands (DMC,Anchor,Ariadna)"
    )
    parser.add_argument(
        "--db-path",
        default="data/threads.db",
        help="Path to SQLite database"
    )
    parser.add_argument(
        "--export-firestore",
        action="store_true",
        help="Export to Firestore after import"
    )
    
    args = parser.parse_args()
    
    # Utwórz katalog data jeśli nie istnieje
    Path("data").mkdir(exist_ok=True)
    
    # Utwórz bazę danych
    print(f"📦 Creating database: {args.db_path}")
    conn = create_local_database(args.db_path)
    
    # Importuj nici dla każdej marki
    brands = [b.strip() for b in args.brands.split(",")]
    total_imported = 0
    
    for brand in brands:
        csv_path = f"data/threads/{brand.lower()}_colors.csv"
        
        if not Path(csv_path).exists():
            print(f"⚠️  Warning: {csv_path} not found, skipping {brand}")
            continue
        
        imported = import_threads_from_csv(conn, csv_path, brand)
        total_imported += imported
    
    # Statystyki
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM threads")
    total_threads = cursor.fetchone()[0]
    
    print(f"\n✨ Database initialized successfully!")
    print(f"   Total threads in database: {total_threads}")
    
    # Opcjonalny eksport do Firestore
    if args.export_firestore:
        export_to_firestore(conn)
    
    conn.close()

if __name__ == "__main__":
    main()
