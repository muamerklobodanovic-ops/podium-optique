import os
import sys
import time
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import openpyxl

# 1. Chargement Configuration
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ Erreur : DATABASE_URL manquant dans le fichier .env")
    sys.exit(1)

# Correction URL pour SQLAlchemy
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
if "sslmode" not in DATABASE_URL:
    separator = "&" if "?" in DATABASE_URL else "?"
    DATABASE_URL += f"{separator}sslmode=require"

# 2. Connexion BDD
try:
    print("🔌 Connexion à la base de données Supabase...")
    engine = create_engine(DATABASE_URL, echo=False)
    with engine.connect() as conn:
        print("✅ Connexion réussie.")
except Exception as e:
    print(f"❌ Échec connexion : {e}")
    sys.exit(1)

def import_users():
    excel_file = "users.xlsx"
    if not os.path.exists(excel_file):
        print(f"❌ Le fichier '{excel_file}' est introuvable dans le dossier backend.")
        return

    print(f"🚀 Démarrage import UTILISATEURS depuis '{excel_file}'...")
    
    try:
        wb = openpyxl.load_workbook(excel_file, data_only=True)
        sheet = wb.active
        
        # Récupération des données (On saute la ligne 1 d'en-tête)
        users_to_insert = []
        seen_ids = set() # Pour traquer les doublons
        row_count = 0
        duplicates_count = 0
        
        print("📖 Lecture du fichier Excel...")
        
        for row in sheet.iter_rows(min_row=2, values_only=True):
            # Colonne A (Index 0) : Identifiant (Obligatoire)
            if not row[0]: 
                continue
            
            u_id = str(row[0]).strip()

            # VÉRIFICATION DOUBLONS
            if u_id in seen_ids:
                # print(f"   ⚠️ Doublon ignoré : {u_id}") # Décommentez pour voir le détail
                duplicates_count += 1
                continue
            
            seen_ids.add(u_id)
            
            # Colonne B (Index 1) : Magasin / Raison Sociale
            u_shop = str(row[1]).strip() if len(row) > 1 and row[1] else "Opticien"
            
            # Colonne C (Index 2) : Mot de passe
            u_pass = str(row[2]).strip() if len(row) > 2 and row[2] else "1234"
            
            # Colonne D (Index 3) : Email
            u_mail = str(row[3]).strip() if len(row) > 3 and row[3] else ""
            
            # Colonne E (Index 4) : Rôle (admin/user)
            u_role = "user"
            if len(row) > 4 and row[4]:
                val = str(row[4]).lower().strip()
                if "admin" in val:
                    u_role = "admin"

            users_to_insert.append({
                "u": u_id,
                "s": u_shop,
                "p": u_pass,
                "e": u_mail,
                "r": u_role
            })
            row_count += 1

        print(f"✅ {len(users_to_insert)} utilisateurs uniques lus ({duplicates_count} doublons ignorés).")

        if not users_to_insert:
            print("⚠️ Aucun utilisateur trouvé à insérer.")
            return

        # Insertion en base
        with engine.begin() as conn:
            print("♻️  Recréation de la table 'users' (Mise à jour structure)...")
            conn.execute(text("DROP TABLE IF EXISTS users CASCADE;"))
            
            conn.execute(text("""
                CREATE TABLE users (
                    username VARCHAR(100) PRIMARY KEY,
                    shop_name TEXT,
                    password TEXT,
                    email TEXT,
                    role VARCHAR(50) DEFAULT 'user',
                    is_first_login BOOLEAN DEFAULT TRUE
                );
            """))
            
            print(f"💾 Insertion de {len(users_to_insert)} comptes...")
            conn.execute(text("""
                INSERT INTO users (username, shop_name, password, email, role, is_first_login)
                VALUES (:u, :s, :p, :e, :r, TRUE)
            """), users_to_insert)
            
        print("\n🎉 SUCCÈS ! Base utilisateurs mise à jour.")
        print(f"   -> {len(users_to_insert)} comptes créés.")
        print("   -> Mot de passe par défaut: '1234' (ou celui de la colonne C)")
        print("   -> Rôle Admin appliqué si colonne E contient 'admin'")

    except Exception as e:
        print(f"\n❌ ERREUR CRITIQUE : {e}")

if __name__ == "__main__":
    import_users()