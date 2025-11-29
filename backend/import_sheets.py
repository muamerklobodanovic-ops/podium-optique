import os
import re
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import openpyxl

# Configuration
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ Erreur : DATABASE_URL manquant.")
    exit()

# Outils
def clean_price(value):
    if not value or value == '' or value == '-': return 0.0
    try:
        return float(str(value).replace('€', '').replace(',', '.'))
    except ValueError: return 0.0

def clean_index(value):
    if not value: return "1.50"
    match = re.search(r"\d+\.?\d*", str(value).replace(',', '.'))
    return "{:.2f}".format(float(match.group(0))) if match else "1.50"

def clean_text(value):
    return str(value).strip() if value else ""

def get_col_index(headers, candidates):
    for i, h in enumerate(headers):
        if h and any(c.upper() == str(h).upper().strip() for c in candidates):
            return i
    return -1

def import_data():
    print("🚀 Démarrage Importation (Structure 2025)...")
    excel_file = "catalogue.xlsx"
    
    if not os.path.exists(excel_file):
        print(f"❌ Fichier '{excel_file}' introuvable.")
        return

    engine = create_engine(DATABASE_URL)
    
    try:
        wb = openpyxl.load_workbook(excel_file, data_only=True)
        
        with engine.begin() as conn:
            print("🧹 Réinitialisation Table 'lenses'...")
            conn.execute(text("DROP TABLE IF EXISTS lenses;"))
            
            # Nouvelle structure exacte
            conn.execute(text("""
                CREATE TABLE lenses (
                    id SERIAL PRIMARY KEY,
                    brand VARCHAR(50),             -- MARQUE (Onglet ou Col A)
                    edi_code VARCHAR(50),          -- CODE EDI
                    commercial_code VARCHAR(50),   -- CODE COMMERCIAL
                    name VARCHAR(200),             -- MODELE COMMERCIAL
                    geometry VARCHAR(100),         -- GÉOMETRIE
                    design VARCHAR(100),           -- DESIGN
                    index_mat VARCHAR(20),         -- INDICE
                    material VARCHAR(100),         -- MATIERE
                    coating VARCHAR(100),          -- TRAITEMENT
                    commercial_flow VARCHAR(50),   -- FLUX COMMERCIAL
                    color VARCHAR(100),            -- COULEUR
                    purchase_price DECIMAL(10,2),  -- PRIX 2*NETS
                    sell_kalixia DECIMAL(10,2),    -- KALIXIA
                    sell_itelis DECIMAL(10,2),     -- ITELIS
                    sell_carteblanche DECIMAL(10,2), -- CARTE BLANCHE
                    sell_seveane DECIMAL(10,2),    -- SEVEANE
                    sell_santeclair DECIMAL(10,2)  -- SANTECLAIRE
                );
            """))
            
            stmt = text("""
                INSERT INTO lenses (
                    brand, edi_code, commercial_code, name, geometry, design, index_mat, material, coating, 
                    commercial_flow, color, purchase_price, sell_kalixia, sell_itelis, sell_carteblanche, 
                    sell_seveane, sell_santeclair
                ) VALUES (
                    :brand, :edi, :code, :name, :geo, :design, :idx, :mat, :coat, 
                    :flow, :color, :buy, :p_kal, :p_ite, :p_cb, :p_sev, :p_sant
                )
            """)

            total_count = 0
            
            for sheet_name in wb.sheetnames:
                sheet = wb[sheet_name]
                # Si l'onglet est une marque connue, on l'utilise, sinon on prend la colonne MARQUE
                sheet_brand = sheet_name.strip().upper()
                
                rows = list(sheet.iter_rows(values_only=True))
                if not rows: continue
                headers = rows[0]

                # Mapping strict des colonnes
                c_marque = get_col_index(headers, ['MARQUE'])
                c_edi = get_col_index(headers, ['CODE EDI'])
                c_code = get_col_index(headers, ['CODE COMMERCIAL'])
                c_name = get_col_index(headers, ['MODELE COMMERCIAL'])
                c_geo = get_col_index(headers, ['GÉOMETRIE', 'GEOMETRIE'])
                c_design = get_col_index(headers, ['DESIGN'])
                c_idx = get_col_index(headers, ['INDICE'])
                c_mat = get_col_index(headers, ['MATIERE'])
                c_coat = get_col_index(headers, ['TRAITEMENT'])
                c_flow = get_col_index(headers, ['FLUX COMMERCIAL'])
                c_color = get_col_index(headers, ['COULEUR'])
                c_buy = get_col_index(headers, ['PRIX 2*NETS'])
                
                c_kal = get_col_index(headers, ['KALIXIA'])
                c_ite = get_col_index(headers, ['ITELIS'])
                c_cb = get_col_index(headers, ['CARTE BLANCHE'])
                c_sev = get_col_index(headers, ['SEVEANE'])
                c_sant = get_col_index(headers, ['SANTECLAIRE', 'SANTECLAIR'])

                if c_name == -1: continue # Pas de nom de verre, on ignore la feuille

                for row in rows[1:]:
                    if not row[c_name]: continue
                    
                    # Logique Marque : Colonne A prioritaire, sinon Onglet
                    row_brand = clean_text(row[c_marque]) if c_marque != -1 else sheet_brand
                    if not row_brand: row_brand = sheet_brand

                    name = clean_text(row[c_name])
                    mat = clean_text(row[c_mat]) if c_mat != -1 else ""
                    
                    # Ajout matière au nom si photochromique (Transitions, etc)
                    if any(x in mat.upper() for x in ['TRANS', 'GEN', 'SOLA', 'SUN']):
                        name = f"{name} {mat}"

                    params = {
                        "brand": row_brand,
                        "edi": clean_text(row[c_edi]) if c_edi != -1 else "",
                        "code": clean_text(row[c_code]) if c_code != -1 else "",
                        "name": name,
                        "geo": clean_text(row[c_geo]).upper() if c_geo != -1 else "UNIFOCAL",
                        "design": clean_text(row[c_design]) if c_design != -1 else "STANDARD",
                        "idx": clean_index(row[c_idx]) if c_idx != -1 else "1.50",
                        "mat": mat,
                        "coat": clean_text(row[c_coat]) if c_coat != -1 else "DURCI",
                        "flow": clean_text(row[c_flow]) if c_flow != -1 else "FAB",
                        "color": clean_text(row[c_color]) if c_color != -1 else "",
                        "buy": clean_price(row[c_buy]) if c_buy != -1 else 0,
                        "p_kal": clean_price(row[c_kal]) if c_kal != -1 else 0,
                        "p_ite": clean_price(row[c_ite]) if c_ite != -1 else 0,
                        "p_cb": clean_price(row[c_cb]) if c_cb != -1 else 0,
                        "p_sev": clean_price(row[c_sev]) if c_sev != -1 else 0,
                        "p_sant": clean_price(row[c_sant]) if c_sant != -1 else 0,
                    }

                    if params["buy"] > 0:
                        conn.execute(stmt, params)
                        total_count += 1
            
            print(f"✅ Terminée : {total_count} verres importés.")

    except Exception as e:
        print(f"❌ Erreur : {e}")

if __name__ == "__main__":
    import_data()