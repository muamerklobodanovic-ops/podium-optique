import csv
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
import re

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ Erreur : Impossible de trouver DATABASE_URL dans le fichier .env")
    exit()

def clean_price(value):
    if not value or value == '' or value == '-': return 0.0
    try:
        clean_str = str(value).replace('€', '').replace('â‚¬', '').replace('%', '').replace(' ', '').replace(',', '.')
        return float(clean_str)
    except ValueError: return 0.0

def clean_index(value):
    if not value: return "1.50"
    clean_val = str(value).replace(',', '.').replace('"', '').strip()
    match = re.search(r"\d+\.?\d*", clean_val)
    return "{:.2f}".format(float(match.group(0))) if match else "1.50"

def get_column_value(row, candidates):
    headers = list(row.keys())
    for candidate in candidates:
        for header in headers:
            h_clean = header.upper().encode('ascii', 'ignore').decode()
            c_clean = candidate.upper()
            if c_clean in header.upper() or c_clean in h_clean:
                return row[header]
    return None

def import_data_from_csv():
    print("🚀 Démarrage de l'importation...")
    csv_file = "catalogue.csv"
    if not os.path.exists(csv_file):
        print(f"❌ Erreur : '{csv_file}' introuvable.")
        return

    engine = create_engine(DATABASE_URL)

    try:
        with engine.connect() as conn:
            print("🧹 Recréation de la table avec colonne DESIGN...")
            conn.execute(text("DROP TABLE IF EXISTS lenses;"))
            conn.execute(text("""
                CREATE TABLE lenses (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(200),
                    brand VARCHAR(50),
                    type VARCHAR(50),
                    design VARCHAR(100),
                    index_mat VARCHAR(10),
                    coating VARCHAR(50),
                    purchase_price DECIMAL(10, 2),
                    selling_price DECIMAL(10, 2)
                );
            """))
            
            print("📥 Lecture du CSV...")
            count = 0
            
            stmt = text("""
                INSERT INTO lenses (name, brand, type, design, index_mat, coating, purchase_price, selling_price)
                VALUES (:name, :brand, :type, :design, :index, :coating, :purchase, :selling)
            """)

            encodings = ['utf-8-sig', 'latin-1', 'cp1252']
            file_content = None
            for enc in encodings:
                try:
                    with open(csv_file, mode='r', encoding=enc) as f:
                        file_content = f.readlines()
                    break
                except UnicodeDecodeError: continue
            
            if not file_content: return

            try: dialect = csv.Sniffer().sniff(file_content[0])
            except: dialect = csv.excel; dialect.delimiter = ','

            reader = csv.DictReader(file_content, dialect=dialect)

            for row in reader:
                raw_geo = str(get_column_value(row, ['GEOMETRIE', 'GÃ‰OMETRIE', 'GÉOMETRIE']) or '').upper()
                lens_type = 'UNIFOCAL'
                if 'PROG' in raw_geo: lens_type = 'PROGRESSIF'
                elif 'DEGRESSIF' in raw_geo or 'INTERIEUR' in raw_geo or 'PROX' in raw_geo: lens_type = 'DEGRESSIF'
                
                name = get_column_value(row, ['MODELE COMMERCIAL', 'LIBELLE']) or 'Inconnu'
                brand = get_column_value(row, ['MARQUE', 'FABRICANT']) or 'GENERIQUE'
                
                # --- NOUVEAU : Récupération du DESIGN ---
                design = get_column_value(row, ['DESIGN', 'GAMME', 'FAMILLE']) or 'STANDARD'
                
                idx = clean_index(get_column_value(row, ['INDICE']))
                coating = get_column_value(row, ['TRAITEMENT']) or 'DURCI'
                purchase = clean_price(get_column_value(row, ['PRIX 2*NETS', 'PRIX 2 NETS', '2*NETS']))
                selling = clean_price(get_column_value(row, ['KALIXIA']))

                if name != 'Inconnu':
                    params = {
                        "name": name, "brand": brand, "type": lens_type, "design": design,
                        "index": idx, "coating": coating, "purchase": purchase, "selling": selling
                    }
                    conn.execute(stmt, params)
                    count += 1
            
            conn.commit()
            print(f"🎉 Succès ! {count} verres importés avec DESIGN.")

    except Exception as e: print(f"❌ Erreur : {e}")

if __name__ == "__main__":
    import_data_from_csv()