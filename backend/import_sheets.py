import csv
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
import re

# 1. Chargement de la configuration
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ Erreur : Impossible de trouver DATABASE_URL dans le fichier .env")
    exit()

def clean_price(value):
    """Nettoie les prix (vire le €, remplace virgule par point, gère les vides)"""
    if not value or value == '' or value == '-':
        return 0.0
    try:
        # Nettoyage agressif des symboles monétaires et pourcentages (y compris mal encodés)
        clean_str = str(value)
        clean_str = clean_str.replace('€', '').replace('â‚¬', '') # Euro et Euro mal encodé
        clean_str = clean_str.replace('%', '').replace(' ', '')
        clean_str = clean_str.replace(',', '.') # Virgule décimale
        
        # On ne garde que les chiffres et le point
        # clean_str = re.sub(r'[^\d.]', '', clean_str) 
        
        return float(clean_str)
    except ValueError:
        return 0.0

def clean_index(value):
    """Nettoie l'indice (1,60 -> 1.60)"""
    if not value:
        return "1.50" # Valeur par défaut si vide
    
    # Nettoyage (1,5 -> 1.5)
    clean_val = str(value).replace(',', '.').replace('"', '').strip()
    
    # Extraction du premier nombre trouvé (ex: "1.6 Stylis" -> "1.6")
    match = re.search(r"\d+\.?\d*", clean_val)
    if match:
        found = match.group(0)
        # Normalisation (1.5 -> 1.50 pour faire joli, optionnel)
        try:
            return "{:.2f}".format(float(found))
        except:
            return found
            
    return "1.50"

def get_column_value(row, candidates):
    """Cherche une valeur dans la ligne en essayant plusieurs noms de colonnes possibles"""
    headers = list(row.keys())
    
    for candidate in candidates:
        for header in headers:
            # Recherche insensible à la casse et aux accents cassés
            # ex: "GÃ‰OMETRIE" matchera "GEOMETRIE"
            h_clean = header.upper().encode('ascii', 'ignore').decode() # Retire les accents pour comparer
            c_clean = candidate.upper()
            
            if c_clean in header.upper() or c_clean in h_clean:
                return row[header]
    return None

def import_data_from_csv():
    print("🚀 Démarrage de l'importation SPÉCIFIQUE...")
    
    csv_file = "catalogue.csv"
    
    if not os.path.exists(csv_file):
        print(f"❌ Erreur : Le fichier '{csv_file}' est introuvable dans backend.")
        return

    engine = create_engine(DATABASE_URL)

    try:
        with engine.connect() as conn:
            print("🧹 Nettoyage de l'ancien catalogue...")
            conn.execute(text("TRUNCATE TABLE lenses RESTART IDENTITY;"))
            
            print("📥 Analyse du fichier CSV...")
            count = 0
            skipped = 0
            
            stmt = text("""
                INSERT INTO lenses (name, brand, type, index_mat, coating, purchase_price, selling_price)
                VALUES (:name, :brand, :type, :index, :coating, :purchase, :selling)
            """)

            # On essaie plusieurs encodages courants
            encodings = ['utf-8', 'latin-1', 'cp1252']
            file_content = None
            used_encoding = None
            
            for enc in encodings:
                try:
                    with open(csv_file, mode='r', encoding=enc) as f:
                        file_content = f.readlines()
                    used_encoding = enc
                    print(f"✅ Fichier lu avec l'encodage : {enc}")
                    break
                except UnicodeDecodeError:
                    continue
            
            if not file_content:
                print("❌ Impossible de lire le fichier avec les encodages standards.")
                return

            # Analyse du dialecte (séparateur) sur la première ligne
            try:
                dialect = csv.Sniffer().sniff(file_content[0])
            except:
                dialect = csv.excel
                dialect.delimiter = ',' # Valeur par défaut si échec

            reader = csv.DictReader(file_content, dialect=dialect)

            # Affichage des colonnes trouvées pour debug
            print(f"📋 Colonnes détectées : {reader.fieldnames}")

            for row in reader:
                # --- MAPPING INTELLIGENT ---
                
                # 1. TYPE / GÉOMETRIE
                raw_geo = str(get_column_value(row, ['GEOMETRIE', 'GÃ‰OMETRIE', 'GÉOMETRIE']) or '').upper()
                
                lens_type = 'UNIFOCAL' # Par défaut
                if 'PROG' in raw_geo: lens_type = 'PROGRESSIF'
                elif 'DEGRESSIF' in raw_geo or 'INTERIEUR' in raw_geo or 'PROX' in raw_geo: lens_type = 'DEGRESSIF'
                
                # 2. RECUPERATION
                name = get_column_value(row, ['MODELE COMMERCIAL', 'LIBELLE']) or 'Inconnu'
                brand = get_column_value(row, ['MARQUE', 'FABRICANT']) or 'GENERIQUE'
                idx = clean_index(get_column_value(row, ['INDICE']))
                coating = get_column_value(row, ['TRAITEMENT']) or 'DURCI' # Défaut si vide
                
                # Prix
                raw_purchase = get_column_value(row, ['PRIX 2*NETS', 'PRIX 2 NETS', '2*NETS'])
                purchase = clean_price(raw_purchase)
                
                # Prix Vente : On cherche Kalixia, sinon Santeclair, sinon on met un markup sur l'achat
                raw_selling = get_column_value(row, ['KALIXIA'])
                selling = clean_price(raw_selling)
                
                # Fallback Prix Vente si vide (ex: Coeff 2.5 sur l'achat)
                if selling == 0 and purchase > 0:
                     selling = purchase * 2.5
                
                # Fallback Santeclair si Kalixia vide
                if selling == 0:
                    raw_selling_alt = get_column_value(row, ['SANTECLAIRE', 'SANTECLAIR'])
                    selling = clean_price(raw_selling_alt)

                # 3. INSERTION
                # On importe si on a au moins un nom
                if name != 'Inconnu':
                    params = {
                        "name": name,      
                        "brand": brand,          
                        "type": lens_type,
                        "index": idx,
                        "coating": coating,
                        "purchase": purchase,
                        "selling": selling
                    }
                    conn.execute(stmt, params)
                    count += 1
                else:
                    skipped += 1
            
            conn.commit()
            print(f"🎉 Succès ! {count} verres importés.")
            if skipped > 0:
                print(f"⚠️ {skipped} lignes ignorées (données incomplètes).")

    except Exception as e:
        print(f"❌ Erreur technique : {e}")

if __name__ == "__main__":
    import_data_from_csv()