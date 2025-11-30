import os
import re
import json
import time
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import openpyxl
import sys

# 1. Configuration
# Assurez-vous d'avoir un fichier .env dans le dossier backend avec DATABASE_URL=...
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ Erreur : DATABASE_URL manquant dans le fichier .env")
    print("👉 Créez un fichier .env avec : DATABASE_URL=postgresql://postgres:MOTDEPASSE@db.supa...")
    sys.exit(1)

# Correction URL pour SQLAlchemy
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
if "sslmode" not in DATABASE_URL:
    separator = "&" if "?" in DATABASE_URL else "?"
    DATABASE_URL += f"{separator}sslmode=require"

# 2. Connexion BDD
try:
    engine = create_engine(DATABASE_URL, echo=False)
    print("✅ Connexion BDD établie.")
except Exception as e:
    print(f"❌ Erreur de connexion : {e}")
    sys.exit(1)

# --- OUTILS ---
def clean_price(value):
    if not value or value == '' or value == '-': return 0.0
    try:
        clean_str = str(value).replace('€', '').replace('â‚¬', '').replace('%', '').replace(' ', '').replace('\xa0', '').replace(',', '.')
        return float(clean_str)
    except: return 0.0

def clean_index(value):
    if not value: return "1.50"
    match = re.search(r"\d+\.?\d*", str(value).replace(',', '.'))
    return "{:.2f}".format(float(match.group(0))) if match else "1.50"

def clean_text(value): return str(value).strip() if value else ""

def get_col_idx(headers, candidates):
    for i, h in enumerate(headers):
        if h:
            h_str = str(h).upper().strip()
            if any(c.upper() in h_str for c in candidates): 
                return i
    return -1

def import_data():
    excel_file = "catalogue.xlsx" # Le fichier doit être dans le dossier backend
    if not os.path.exists(excel_file):
        print(f"❌ Fichier '{excel_file}' introuvable.")
        print("👉 Placez votre fichier Excel dans le dossier 'backend' et nommez-le 'catalogue.xlsx'")
        return

    print(f"🚀 Démarrage de l'importation locale de '{excel_file}'...")
    start_time = time.time()

    try:
        # Lecture Excel
        print("📖 Lecture du fichier Excel (cela peut prendre quelques secondes)...")
        # En local, on peut se permettre de tout charger en mémoire pour aller plus vite
        wb = openpyxl.load_workbook(excel_file, data_only=True, read_only=True)
        
        # Préparation BDD
        with engine.begin() as conn:
            print("♻️  Réinitialisation de la table 'lenses'...")
            conn.execute(text("DROP TABLE IF EXISTS lenses CASCADE;"))
            conn.execute(text("""
                CREATE TABLE lenses (
                    id SERIAL PRIMARY KEY,
                    brand TEXT, edi_code TEXT, commercial_code TEXT, name TEXT,
                    geometry TEXT, design TEXT, index_mat TEXT,
                    material TEXT, coating TEXT, commercial_flow TEXT, color TEXT,
                    purchase_price DECIMAL(10,2), selling_price DECIMAL(10,2),
                    sell_kalixia DECIMAL(10,2), sell_itelis DECIMAL(10,2),
                    sell_carteblanche DECIMAL(10,2), sell_seveane DECIMAL(10,2),
                    sell_santeclair DECIMAL(10,2)
                );
            """))

        total_inserted = 0

        with engine.connect() as conn:
            for sheet_name in wb.sheetnames:
                sheet = wb[sheet_name]
                sheet_brand = sheet_name.strip().upper()
                print(f"\n🔹 Traitement de la marque : {sheet_brand}")

                row_iterator = sheet.iter_rows(values_only=True)
                
                # Recherche En-tête
                header_idx = -1
                headers = []
                current_idx = 0
                
                for row in row_iterator:
                    current_idx += 1
                    if current_idx > 30: break
                    row_str = [str(c).upper() for c in row if c]
                    if any(k in s for s in row_str for k in ["MODELE", "MODÈLE", "LIBELLE", "NAME", "PRIX", "PURCHASE_PRICE"]):
                        headers = row
                        header_idx = current_idx
                        print(f"   ✅ En-têtes trouvés ligne {current_idx}")
                        break
                
                if not headers:
                    print(f"   ⚠️ Pas d'en-tête trouvé, feuille ignorée.")
                    continue

                # Mapping
                c_nom = get_col_idx(headers, ['MODELE COMMERCIAL', 'MODELE', 'LIBELLE', 'NAME'])
                c_marque = get_col_idx(headers, ['MARQUE', 'BRAND'])
                c_edi = get_col_idx(headers, ['CODE EDI', 'EDI'])
                c_code = get_col_idx(headers, ['CODE COMMERCIAL', 'COMMERCIAL_CODE'])
                c_geo = get_col_idx(headers, ['GÉOMETRIE', 'GEOMETRIE', 'TYPE'])
                c_design = get_col_idx(headers, ['DESIGN', 'GAMME'])
                c_idx = get_col_idx(headers, ['INDICE', 'INDEX'])
                c_mat = get_col_idx(headers, ['MATIERE', 'MATIÈRE'])
                c_coat = get_col_idx(headers, ['TRAITEMENT', 'COATING'])
                c_flow = get_col_idx(headers, ['FLUX'])
                c_color = get_col_idx(headers, ['COULEUR'])
                c_buy = get_col_idx(headers, ['PRIX 2*NETS', 'PRIX', 'ACHAT'])
                
                c_kal = get_col_idx(headers, ['KALIXIA'])
                c_ite = get_col_idx(headers, ['ITELIS'])
                c_cb = get_col_idx(headers, ['CARTE BLANCHE'])
                c_sev = get_col_idx(headers, ['SEVEANE'])
                c_sant = get_col_idx(headers, ['SANTECLAIRE'])

                if c_nom == -1: 
                    print("   ❌ Colonne 'MODÈLE' manquante.")
                    continue

                batch = []
                BATCH_SIZE = 1000 # On peut augmenter le batch en local

                for row in row_iterator:
                    if not row[c_nom]: continue
                    
                    buy = clean_price(row[c_buy]) if c_buy != -1 else 0
                    if buy <= 0: continue

                    brand = clean_text(row[c_marque]) if c_marque != -1 else sheet_brand
                    if not brand or brand == "None": brand = sheet_brand
                    
                    name = clean_text(row[c_nom])
                    mat = clean_text(row[c_mat]) if c_mat != -1 else ""
                    if any(x in mat.upper() for x in ['TRANS', 'GEN', 'SOLA']): name += f" {mat}"
                    
                    geo_raw = clean_text(row[c_geo]).upper() if c_geo != -1 else ""
                    ltype = 'UNIFOCAL'
                    if 'PROG' in geo_raw: ltype = 'PROGRESSIF'
                    elif 'DEGRESSIF' in geo_raw: ltype = 'DEGRESSIF'
                    elif 'MULTIFOCAL' in geo_raw: ltype = 'MULTIFOCAL'

                    lens = {
                        "brand": brand[:100], 
                        "edi": clean_text(row[c_edi]) if c_edi != -1 else "",
                        "code": clean_text(row[c_code]) if c_code != -1 else "",
                        "name": name,
                        "geo": ltype,
                        "design": clean_text(row[c_design]) if c_design != -1 else "STANDARD",
                        "idx": clean_index(row[c_idx]) if c_idx != -1 else "1.50",
                        "mat": mat,
                        "coat": clean_text(row[c_coat]) if c_coat != -1 else "DURCI",
                        "flow": clean_text(row[c_flow]) if c_flow != -1 else "FAB",
                        "color": clean_text(row[c_color]) if c_color != -1 else "",
                        "buy": buy,
                        "selling": clean_price(row[c_kal]) if c_kal != -1 else 0,
                        "kal": clean_price(row[c_kal]) if c_kal != -1 else 0,
                        "ite": clean_price(row[c_ite]) if c_ite != -1 else 0,
                        "cb": clean_price(row[c_cb]) if c_cb != -1 else 0,
                        "sev": clean_price(row[c_sev]) if c_sev != -1 else 0,
                        "sant": clean_price(row[c_sant]) if c_sant != -1 else 0,
                    }
                    batch.append(lens)

                    if len(batch) >= BATCH_SIZE:
                        with conn.begin():
                            conn.execute(text("""
                                INSERT INTO lenses (brand, edi_code, commercial_code, name, geometry, design, index_mat, material, coating, commercial_flow, color, purchase_price, selling_price, sell_kalixia, sell_itelis, sell_carteblanche, sell_seveane, sell_santeclair)
                                VALUES (:brand, :edi, :code, :name, :geo, :design, :idx, :mat, :coat, :flow, :color, :buy, :selling, :kal, :ite, :cb, :sev, :sant)
                            """), batch)
                        total_inserted += len(batch)
                        print(f"   ... {total_inserted} verres insérés", end="\r")
                        batch = []
                
                # Dernier lot
                if batch:
                    with conn.begin():
                        conn.execute(text("""
                            INSERT INTO lenses (brand, edi_code, commercial_code, name, geometry, design, index_mat, material, coating, commercial_flow, color, purchase_price, selling_price, sell_kalixia, sell_itelis, sell_carteblanche, sell_seveane, sell_santeclair)
                            VALUES (:brand, :edi, :code, :name, :geo, :design, :idx, :mat, :coat, :flow, :color, :buy, :selling, :kal, :ite, :cb, :sev, :sant)
                        """), batch)
                    total_inserted += len(batch)
        
        end_time = time.time()
        print(f"\n\n✅ SUCCÈS ! {total_inserted} verres importés en {round(end_time - start_time, 2)} secondes.")

    except Exception as e:
        print(f"\n❌ ERREUR CRITIQUE : {e}")

if __name__ == "__main__":
    import_data()