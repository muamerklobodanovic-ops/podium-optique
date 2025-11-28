import os
import re
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# On essaie d'importer openpyxl
try:
    import openpyxl
except ImportError:
    print("❌ ERREUR : 'openpyxl' manquant. pip install openpyxl")
    exit()

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ Erreur : DATABASE_URL manquant.")
    exit()

def clean_price(value):
    if not value or value == '' or value == '-': return 0.0
    try:
        clean_str = str(value).replace('€', '').replace('â‚¬', '').replace('%', '').replace(' ', '').replace(',', '.')
        return float(clean_str)
    except ValueError: return 0.0

def clean_text(value):
    return str(value).strip() if value else ""

def import_data_from_excel():
    print("🚀 Démarrage Importation STRICTE (Structure A-T)...")
    
    excel_file = "catalogue.xlsx"
    if not os.path.exists(excel_file):
        print(f"❌ Erreur : '{excel_file}' introuvable.")
        return

    engine = create_engine(DATABASE_URL)
    
    try:
        wb = openpyxl.load_workbook(excel_file, data_only=True)
        
        with engine.begin() as conn:
            print("🧹 Réinitialisation de la table 'lenses'...")
            conn.execute(text("DROP TABLE IF EXISTS lenses;"))
            
            # Création de la table avec TOUTES les colonnes demandées
            conn.execute(text("""
                CREATE TABLE lenses (
                    id SERIAL PRIMARY KEY,
                    brand VARCHAR(50),           -- Onglet / Col A
                    commercial_code VARCHAR(50), -- Col C
                    name VARCHAR(200),           -- Col D (Modele)
                    geometry VARCHAR(100),       -- Col F
                    design VARCHAR(100),         -- Col G
                    index_mat VARCHAR(20),       -- Col H
                    material VARCHAR(100),       -- Col I
                    coating VARCHAR(100),        -- Col J
                    commercial_flow VARCHAR(50), -- Col K (Stock/Fab)
                    purchase_price DECIMAL(10,2),-- Col M
                    sell_kalixia DECIMAL(10,2),  -- Col P
                    sell_itelis DECIMAL(10,2),   -- Col Q
                    sell_carteblanche DECIMAL(10,2), -- Col R
                    sell_seveane DECIMAL(10,2),  -- Col S
                    sell_santeclair DECIMAL(10,2) -- Col T
                );
            """))
            
            total_count = 0
            
            stmt = text("""
                INSERT INTO lenses (
                    brand, commercial_code, name, geometry, design, index_mat, material, coating, commercial_flow,
                    purchase_price, sell_kalixia, sell_itelis, sell_carteblanche, sell_seveane, sell_santeclair
                ) VALUES (
                    :brand, :code, :name, :geo, :design, :idx, :mat, :coat, :flow,
                    :buy, :p_kalixia, :p_itelis, :p_cb, :p_seveane, :p_santeclair
                )
            """)

            for sheet_name in wb.sheetnames:
                sheet = wb[sheet_name]
                brand_name = sheet_name.strip().upper()
                print(f"   🔹 Traitement Marque : {brand_name}")
                
                # On suppose que la ligne 1 est le header, on commence ligne 2
                # Mapping basé sur les lettres de colonnes (A=0, B=1, C=2...)
                # A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10, L=11, M=12, N=13, O=14, P=15, Q=16, R=17, S=18, T=19
                
                sheet_count = 0
                for row in sheet.iter_rows(min_row=2, values_only=True):
                    # On vérifie qu'on a au moins un modèle (Col D / Index 3)
                    if len(row) < 4 or not row[3]: continue 

                    # Extraction sécurisée par index de colonne
                    def get_col(idx):
                        return row[idx] if len(row) > idx else None

                    raw_name = clean_text(get_col(3)) # Col D
                    
                    # Importation
                    params = {
                        "brand": brand_name,
                        "code": clean_text(get_col(2)),       # Col C
                        "name": raw_name,                     # Col D
                        "geo": clean_text(get_col(5)).upper(),# Col F
                        "design": clean_text(get_col(6)),     # Col G
                        "idx": str(get_col(7)).replace(',', '.'), # Col H
                        "mat": clean_text(get_col(8)),        # Col I
                        "coat": clean_text(get_col(9)),       # Col J
                        "flow": clean_text(get_col(10)),      # Col K
                        "buy": clean_price(get_col(12)),      # Col M
                        
                        # Tarifs Réseaux
                        "p_kalixia": clean_price(get_col(15)),    # Col P
                        "p_itelis": clean_price(get_col(16)),     # Col Q
                        "p_cb": clean_price(get_col(17)),         # Col R
                        "p_seveane": clean_price(get_col(18)),    # Col S
                        "p_santeclair": clean_price(get_col(19))  # Col T
                    }

                    if params["buy"] > 0: # On garde si prix achat existe
                        conn.execute(stmt, params)
                        sheet_count += 1
                        total_count += 1

                print(f"      -> {sheet_count} verres importés.")

            print(f"\n🎉 BASE DE DONNÉES RECONSTRUITE : {total_count} verres.")

    except Exception as e:
        print(f"❌ Erreur technique : {e}")

if __name__ == "__main__":
    import_data_from_excel()