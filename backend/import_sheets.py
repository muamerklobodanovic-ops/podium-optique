import gspread
from oauth2client.service_account import ServiceAccountCredentials
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Chargement des variables d'environnement (pour l'URL Neon)
load_dotenv()

def import_data_from_sheets():
    print("🚀 Démarrage de l'importation...")

    # --- 1. CONNEXION À GOOGLE SHEETS ---
    # Assurez-vous d'avoir le fichier 'google_credentials.json' dans le même dossier
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    
    try:
        creds = ServiceAccountCredentials.from_json_keyfile_name("google_credentials.json", scope)
        client = gspread.authorize(creds)
        
        # Ouvrir le fichier Sheet par son nom exact
        sheet = client.open("Catalogue Verres Optique").sheet1 
        
        # Récupérer toutes les données
        data = sheet.get_all_records()
        print(f"✅ {len(data)} lignes récupérées depuis Google Sheets.")
        
    except Exception as e:
        print(f"❌ Erreur Google Sheets : {e}")
        return

    # --- 2. CONNEXION À NEON (Base de données) ---
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ Erreur : DATABASE_URL introuvable dans le fichier .env")
        return

    engine = create_engine(db_url)

    # --- 3. INSERTION DES DONNÉES ---
    try:
        with engine.connect() as conn:
            # Optionnel : Vider la table avant d'importer (Remise à zéro)
            # conn.execute(text("TRUNCATE TABLE lenses RESTART IDENTITY;"))
            # conn.commit()
            # print("🗑️  Table 'lenses' vidée.")

            count = 0
            for row in data:
                # On prépare la requête d'insertion
                # Assurez-vous que les colonnes de votre Sheet correspondent aux clés ici (Nom, Marque, etc.)
                stmt = text("""
                    INSERT INTO lenses (name, brand, type, index_mat, purchase_price, selling_price)
                    VALUES (:name, :brand, :type, :index, :purchase, :selling)
                """)
                
                # Mapping des colonnes du Sheet -> Colonnes de la BDD
                params = {
                    "name": row['Nom Produit'],      # Colonne A dans le Sheet
                    "brand": row['Marque'],          # Colonne B
                    "type": row['Type'],             # Colonne C (UNIFOCAL, PROGRESSIF...)
                    "index": str(row['Indice']),     # Colonne D (1.5, 1.6...)
                    "purchase": float(row['Prix Achat'] or 0), # Colonne E
                    "selling": float(row['Prix Vente'] or 0)   # Colonne F (Plafond)
                }
                
                conn.execute(stmt, params)
                count += 1
            
            conn.commit()
            print(f"🎉 Succès ! {count} verres ont été importés dans la base Neon.")

    except Exception as e:
        print(f"❌ Erreur SQL : {e}")

if __name__ == "__main__":
    import_data_from_sheets()