import os
import re
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# On essaie d'importer openpyxl pour lire l'Excel
try:
    import openpyxl
except ImportError:
    print("❌ ERREUR : La librairie 'openpyxl' est manquante.")
    print("👉 Installez-la avec la commande : pip install openpyxl")
    exit()

# 1. Chargement de la configuration
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ Erreur : Impossible de trouver DATABASE_URL dans le fichier .env")
    exit()

# --- OUTILS DE NETTOYAGE ---
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

# Fonction pour trouver la colonne par nom (insensible à la casse)
def find_col_index(headers, candidates):
    for i, h in enumerate(headers):
        if h is None: continue
        h_str = str(h).upper().strip()
        for c in candidates:
            # Nettoyage basique des accents pour comparaison
            c_clean = c.upper()
            if c_clean in h_str:
                return i
    return -1

def import_data_from_excel():
    print("🚀 Démarrage de l'importation EXCEL MULTI-ONGLETS...")
    
    excel_file = "catalogue.xlsx"
    
    if not os.path.exists(excel_file):
        print(f"❌ Erreur : Le fichier '{excel_file}' est introuvable dans le dossier backend.")
        print("👉 Veuillez enregistrer votre fichier au format .xlsx")
        return

    engine = create_engine(DATABASE_URL)
    
    try:
        # Chargement du fichier Excel
        print(f"📂 Ouverture de {excel_file}...")
        workbook = openpyxl.load_workbook(excel_file, data_only=True)
        
        with engine.begin() as conn:
            print("🧹 Réinitialisation de la base de données...")
            conn.execute(text("TRUNCATE TABLE lenses RESTART IDENTITY;"))
            
            total_count = 0
            
            stmt = text("""
                INSERT INTO lenses (name, brand, type, design, index_mat, coating, purchase_price, selling_price)
                VALUES (:name, :brand, :type, :design, :index, :coating, :purchase, :selling)
            """)

            # --- BOUCLE SUR CHAQUE FEUILLE (MARQUE) ---
            for sheet_name in workbook.sheetnames:
                sheet = workbook[sheet_name]
                print(f"   🔹 Traitement de la feuille : {sheet_name}")
                
                # Lecture des en-têtes (Ligne 1)
                headers = [cell.value for cell in sheet[1]]
                
                # Identification des colonnes
                col_marque = find_col_index(headers, ['MARQUE', 'FABRICANT'])
                col_modele = find_col_index(headers, ['MODELE COMMERCIAL', 'MODELE', 'LIBELLE'])
                col_geo = find_col_index(headers, ['GÉOMETRIE', 'GEOMETRIE', 'TYPE'])
                col_design = find_col_index(headers, ['DESIGN', 'GAMME', 'FAMILLE'])
                col_indice = find_col_index(headers, ['INDICE'])
                col_traitement = find_col_index(headers, ['TRAITEMENT'])
                col_matiere = find_col_index(headers, ['MATIERE'])
                col_achat = find_col_index(headers, ['PRIX 2*NETS', '2*NETS', 'ACHAT'])
                col_vente = find_col_index(headers, ['KALIXIA', 'VENTE', 'PRIX PUBLIC'])

                # Vérification minimale
                if col_modele == -1:
                    print(f"      ⚠️ Colonne Modèle introuvable, feuille ignorée.")
                    continue

                sheet_count = 0
                
                # Parcours des lignes (à partir de la ligne 2)
                for row in sheet.iter_rows(min_row=2, values_only=True):
                    if not row[col_modele]: continue # Ignorer lignes vides
                    
                    # Récupération des valeurs
                    raw_name = str(row[col_modele])
                    
                    # Marque : Soit colonne A, soit nom de la feuille
                    brand = str(row[col_marque]) if col_marque != -1 and row[col_marque] else sheet_name
                    
                    # Type / Géométrie
                    raw_geo = str(row[col_geo] if col_geo != -1 else "").upper()
                    lens_type = 'UNIFOCAL'
                    if 'PROG' in raw_geo: lens_type = 'PROGRESSIF'
                    elif 'DEGRESSIF' in raw_geo or 'INTERIEUR' in raw_geo: lens_type = 'DEGRESSIF'
                    elif 'MULTIFOCAL' in raw_geo: lens_type = 'MULTIFOCAL'
                    
                    design = str(row[col_design]) if col_design != -1 and row[col_design] else 'STANDARD'
                    idx = clean_index(row[col_indice] if col_indice != -1 else "1.50")
                    coating = str(row[col_traitement]) if col_traitement != -1 and row[col_traitement] else 'DURCI'
                    
                    purchase = clean_price(row[col_achat] if col_achat != -1 else 0)
                    selling = clean_price(row[col_vente] if col_vente != -1 else 0)

                    # Gestion Photochromique (Ajout au nom)
                    if col_matiere != -1 and row[col_matiere]:
                        matiere = str(row[col_matiere]).upper()
                        if any(x in matiere for x in ['TRANS', 'GEN', 'SOLA', 'TGNS', 'SABR', 'SAGR']):
                            raw_name = f"{raw_name} {matiere}"

                    # Insertion
                    if purchase > 0: # On garde si on a un prix d'achat
                        params = {
                            "name": raw_name,
                            "brand": brand,
                            "type": lens_type,
                            "design": design,
                            "index": idx,
                            "coating": coating,
                            "purchase": purchase,
                            "selling": selling
                        }
                        conn.execute(stmt, params)
                        sheet_count += 1
                        total_count += 1

                print(f"      ✅ {sheet_count} verres ajoutés.")

            print(f"\n🎉 TERMINÉ : {total_count} verres importés au total dans la base Neon.")

    except Exception as e:
        print(f"❌ Erreur technique : {e}")

if __name__ == "__main__":
    import_data_from_excel()