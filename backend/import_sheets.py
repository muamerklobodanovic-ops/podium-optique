import os
import re
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import openpyxl 

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

def get_col_index(headers, candidates):
    """Trouve l'index d'une colonne par son nom dans la ligne d'en-tête"""
    for i, h in enumerate(headers):
        if h:
            h_str = str(h).upper().strip()
            for c in candidates:
                if c.upper() in h_str:
                    return i
    return -1

def import_data_from_excel():
    print("🚀 Démarrage de l'importation EXCEL par Onglets...")
    
    excel_file = "catalogue.xlsx"
    
    if not os.path.exists(excel_file):
        print(f"❌ Erreur : Le fichier '{excel_file}' est introuvable dans le dossier backend.")
        print("👉 Veuillez enregistrer votre fichier au format .xlsx")
        return

    engine = create_engine(DATABASE_URL)

    try:
        # Chargement du fichier Excel
        print(f"📂 Lecture de {excel_file}...")
        wb = openpyxl.load_workbook(excel_file, data_only=True)
        
        with engine.begin() as conn:
            print("🧹 Nettoyage complet de la base de données...")
            conn.execute(text("TRUNCATE TABLE lenses RESTART IDENTITY;"))
            
            total_count = 0
            
            stmt = text("""
                INSERT INTO lenses (name, brand, type, design, index_mat, coating, purchase_price, selling_price)
                VALUES (:name, :brand, :type, :design, :index, :coating, :purchase, :selling)
            """)

            # --- BOUCLE SUR CHAQUE ONGLET ---
            for sheet_name in wb.sheetnames:
                sheet = wb[sheet_name]
                
                # La marque est DÉFINIE par le nom de l'onglet (ex: HOYA)
                # On nettoie le nom (ex: "HOYA " -> "HOYA")
                current_brand = sheet_name.strip().upper()
                
                print(f"   🔹 Traitement de l'onglet : {current_brand}")
                
                # Lecture des données
                rows = list(sheet.iter_rows(values_only=True))
                if not rows: continue
                
                # Ligne 1 = En-têtes
                headers = rows[0]
                
                # On repère les colonnes importantes
                col_modele = get_col_index(headers, ['MODELE COMMERCIAL', 'MODELE', 'LIBELLE'])
                col_geo = get_col_index(headers, ['GÉOMETRIE', 'GEOMETRIE', 'TYPE'])
                col_design = get_col_index(headers, ['DESIGN', 'GAMME', 'FAMILLE'])
                col_indice = get_col_index(headers, ['INDICE'])
                col_matiere = get_col_index(headers, ['MATIERE'])
                col_traitement = get_col_index(headers, ['TRAITEMENT'])
                col_achat = get_col_index(headers, ['PRIX 2*NETS', '2*NETS'])
                col_vente = get_col_index(headers, ['KALIXIA'])

                if col_modele == -1:
                    print(f"      ⚠️ Colonne 'MODELE' introuvable, onglet ignoré.")
                    continue

                sheet_count = 0
                
                # Parcours des verres (Ligne 2 à la fin)
                for row in rows[1:]:
                    if not row[col_modele]: continue # Ligne vide
                    
                    raw_name = str(row[col_modele])
                    
                    # Géométrie
                    raw_geo = str(row[col_geo]).upper() if col_geo != -1 and row[col_geo] else ""
                    lens_type = 'UNIFOCAL'
                    if 'PROG' in raw_geo: lens_type = 'PROGRESSIF'
                    elif 'DEGRESSIF' in raw_geo or 'INTERIEUR' in raw_geo: lens_type = 'DEGRESSIF'
                    elif 'MULTIFOCAL' in raw_geo: lens_type = 'MULTIFOCAL'
                    
                    # Autres infos
                    design = str(row[col_design]) if col_design != -1 and row[col_design] else 'STANDARD'
                    idx = clean_index(row[col_indice]) if col_indice != -1 else "1.50"
                    coating = str(row[col_traitement]) if col_traitement != -1 and row[col_traitement] else 'DURCI'
                    
                    purchase = clean_price(row[col_achat]) if col_achat != -1 else 0
                    selling = clean_price(row[col_vente]) if col_vente != -1 else 0

                    # Gestion Photochromique (Ajout au nom pour le filtre)
                    if col_matiere != -1 and row[col_matiere]:
                        matiere = str(row[col_matiere]).upper()
                        if any(x in matiere for x in ['TRANS', 'GEN', 'SOLA', 'TGNS', 'SABR', 'SAGR']):
                            raw_name = f"{raw_name} {matiere}"

                    # On importe si on a un prix d'achat
                    if purchase > 0:
                        params = {
                            "name": raw_name,
                            "brand": current_brand, # ICI : On force la marque de l'onglet
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
                
                print(f"      -> {sheet_count} verres importés pour {current_brand}")

            print(f"\n🎉 IMPORTATION TERMINÉE : {total_count} verres au total.")

    except Exception as e:
        print(f"❌ Erreur technique : {e}")

if __name__ == "__main__":
    import_data_from_excel()