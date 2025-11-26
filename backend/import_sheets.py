import csv
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# 1. Chargement de la configuration
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ Erreur : Impossible de trouver DATABASE_URL dans le fichier .env")
    exit()

def clean_price(value):
    """Nettoie les prix (vire le €, remplace virgule par point)"""
    if not value:
        return 0.0
    try:
        # On garde chiffres, points et virgules
        clean_str = str(value).replace('€', '').replace(' ', '').replace(',', '.')
        return float(clean_str)
    except ValueError:
        return 0.0

def clean_index(value):
    """Nettoie l'indice (1,60 -> 1.60)"""
    if not value:
        return "1.50"
    return str(value).replace(',', '.')

def import_data_from_csv():
    print("🚀 Démarrage de l'importation depuis le fichier CSV...")
    
    # Nom du fichier que vous devez déposer dans le dossier backend
    csv_file = "catalogue.csv"
    
    if not os.path.exists(csv_file):
        print(f"❌ Erreur : Le fichier '{csv_file}' est introuvable dans le dossier backend.")
        print("👉 Exportez votre Sheet en CSV, renommez-le 'catalogue.csv' et placez-le dans ce dossier.")
        return

    # --- B. CONNEXION À LA BASE DE DONNÉES (NEON) ---
    engine = create_engine(DATABASE_URL)

    try:
        with engine.connect() as conn:
            print("🧹 Nettoyage de l'ancien catalogue...")
            conn.execute(text("TRUNCATE TABLE lenses RESTART IDENTITY;"))
            
            print("📥 Lecture du fichier CSV...")
            count = 0
            
            stmt = text("""
                INSERT INTO lenses (name, brand, type, index_mat, coating, purchase_price, selling_price)
                VALUES (:name, :brand, :type, :index, :coating, :purchase, :selling)
            """)

            # On ouvre le fichier pour détecter son format (virgule ou point-virgule)
            with open(csv_file, mode='r', encoding='utf-8') as f:
                # Détection automatique du séparateur (Excel utilise souvent ; et Google ,)
                sample = f.read(1024)
                f.seek(0)
                dialect = csv.Sniffer().sniff(sample)
                reader = csv.DictReader(f, dialect=dialect)

                for row in reader:
                    # --- MAPPING DES COLONNES (Nouvelle Structure) ---
                    
                    # 1. GESTION DU TYPE DE VERRE (GÉOMETRIE)
                    # On essaye de normaliser un peu les entrées du fichier
                    raw_geo = str(row.get('GÉOMETRIE', '')).upper()
                    lens_type = 'UNIFOCAL' # Par défaut
                    if 'PROG' in raw_geo: lens_type = 'PROGRESSIF'
                    elif 'DEGRESSIF' in raw_geo or 'INTERIEUR' in raw_geo: lens_type = 'DEGRESSIF'
                    elif 'UNI' in raw_geo or 'MONO' in raw_geo: lens_type = 'UNIFOCAL'
                    else: lens_type = raw_geo # On garde tel quel si on ne reconnait pas

                    # 2. CONSTRUCTION DES DONNÉES
                    params = {
                        "name": row.get('MODELE COMMERCIAL', 'Inconnu'),      
                        "brand": row.get('MARQUE', 'GENERIQUE'),          
                        "type": lens_type,
                        "index": clean_index(row.get('INDICE')),
                        "coating": row.get('TRAITEMENT', ''),
                        "purchase": clean_price(row.get('PRIX 2*NETS')),  # Colonne M
                        "selling": clean_price(row.get('KALIXIA'))        # Colonne P (Sert de référence Plafond)
                    }
                    
                    # Sécurité : on n'importe pas les lignes sans prix ou sans nom
                    if params["name"] and params["selling"] > 0:
                        conn.execute(stmt, params)
                        count += 1
            
            conn.commit()
            print(f"🎉 Succès ! {count} verres ont été importés dans la base Neon.")

    except Exception as e:
        print(f"❌ Erreur lors de l'importation : {e}")
        print("Conseil : Vérifiez que votre CSV a bien les entêtes exacts (MARQUE, MODELE COMMERCIAL, etc.) sur la première ligne.")

if __name__ == "__main__":
    import_data_from_csv()