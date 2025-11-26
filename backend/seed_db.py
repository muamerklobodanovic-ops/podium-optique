from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
import random

# Chargement de la configuration
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ Erreur : Impossible de trouver DATABASE_URL. Vérifiez votre fichier .env")
    exit()

engine = create_engine(DATABASE_URL)

def seed_database():
    print("🚀 Démarrage de l'initialisation de la base de données...")

    with engine.connect() as conn:
        # 1. NETTOYAGE ET CRÉATION DE LA TABLE
        # On ajoute la colonne 'coating' qui manquait pour les filtres
        conn.execute(text("DROP TABLE IF EXISTS lenses;"))
        conn.execute(text("""
            CREATE TABLE lenses (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200),
                brand VARCHAR(50),
                type VARCHAR(50),
                index_mat VARCHAR(10),
                coating VARCHAR(50),
                purchase_price DECIMAL(10, 2),
                selling_price DECIMAL(10, 2)
            );
        """))
        print("✅ Table 'lenses' recréée avec succès (avec colonne coating).")

        # 2. DONNÉES DE TEST (CATALOGUE SIMULÉ)
        lenses_to_insert = []

        # --- MARQUE : CODIR & ORUS (Mêmes produits) ---
        # On crée des doublons pour ORUS car ce sont les mêmes verres
        for marque in ['CODIR', 'ORUS']:
            # Unifocaux
            lenses_to_insert.append({'name': f'{marque} Eco 1.50 Mistral', 'brand': marque, 'type': 'UNIFOCAL', 'index_mat': '1.50', 'coating': 'MISTRAL', 'purchase': 10, 'selling': 45})
            lenses_to_insert.append({'name': f'{marque} Confort 1.60 Quattro UV', 'brand': marque, 'type': 'UNIFOCAL', 'index_mat': '1.60', 'coating': 'QUATTRO_UV', 'purchase': 25, 'selling': 90})
            lenses_to_insert.append({'name': f'{marque} Thin 1.67 Quattro Clean', 'brand': marque, 'type': 'UNIFOCAL', 'index_mat': '1.67', 'coating': 'QUATTRO_UV_CLEAN', 'purchase': 40, 'selling': 130})
            lenses_to_insert.append({'name': f'{marque} Blue 1.60 B-Protect', 'brand': marque, 'type': 'UNIFOCAL', 'index_mat': '1.60', 'coating': 'B_PROTECT', 'purchase': 35, 'selling': 110})
            
            # Progressifs
            lenses_to_insert.append({'name': f'{marque} Prog First 1.50 Mistral', 'brand': marque, 'type': 'PROGRESSIF', 'index_mat': '1.50', 'coating': 'MISTRAL', 'purchase': 40, 'selling': 140})
            lenses_to_insert.append({'name': f'{marque} Prog HD 1.60 Quattro UV', 'brand': marque, 'type': 'PROGRESSIF', 'index_mat': '1.60', 'coating': 'QUATTRO_UV', 'purchase': 80, 'selling': 240})
            lenses_to_insert.append({'name': f'{marque} Prog Ultra 1.74 Quattro Clean', 'brand': marque, 'type': 'PROGRESSIF', 'index_mat': '1.74', 'coating': 'QUATTRO_UV_CLEAN', 'purchase': 150, 'selling': 380})
            lenses_to_insert.append({'name': f'{marque} Prog Office 1.60 E-Protect', 'brand': marque, 'type': 'DEGRESSIF', 'index_mat': '1.60', 'coating': 'E_PROTECT', 'purchase': 60, 'selling': 180})

        # --- MARQUE : HOYA ---
        # Unifocaux & Myopie
        lenses_to_insert.append({'name': 'Hilux 1.50 HA', 'brand': 'HOYA', 'type': 'UNIFOCAL', 'index_mat': '1.50', 'coating': 'HA', 'purchase': 15, 'selling': 60})
        lenses_to_insert.append({'name': 'Nulux 1.60 HVLL', 'brand': 'HOYA', 'type': 'UNIFOCAL', 'index_mat': '1.60', 'coating': 'HVLL', 'purchase': 45, 'selling': 120})
        lenses_to_insert.append({'name': 'MiYOSMART 1.58 HVLL', 'brand': 'HOYA', 'type': 'UNIFOCAL', 'index_mat': '1.58', 'coating': 'HVLL', 'purchase': 95, 'selling': 190}) # Freination
        
        # Progressifs
        lenses_to_insert.append({'name': 'Hoyalux Balansis 1.60 HVLL', 'brand': 'HOYA', 'type': 'PROGRESSIF', 'index_mat': '1.60', 'coating': 'HVLL', 'purchase': 110, 'selling': 290})
        lenses_to_insert.append({'name': 'Hoyalux ID MySelf 1.67 HVLL BC', 'brand': 'HOYA', 'type': 'PROGRESSIF', 'index_mat': '1.67', 'coating': 'HVLL_BC', 'purchase': 180, 'selling': 450})
        lenses_to_insert.append({'name': 'WorkStyle 1.60 HVLL', 'brand': 'HOYA', 'type': 'INTERIEUR', 'index_mat': '1.60', 'coating': 'HVLL', 'purchase': 85, 'selling': 220})

        # --- MARQUE : SEIKO ---
        # Unifocaux
        lenses_to_insert.append({'name': 'Seiko AZ 1.60 SRC-One', 'brand': 'SEIKO', 'type': 'UNIFOCAL', 'index_mat': '1.60', 'coating': 'SRC_ONE', 'purchase': 40, 'selling': 115})
        lenses_to_insert.append({'name': 'Seiko AZ 1.67 SRC-Ultra', 'brand': 'SEIKO', 'type': 'UNIFOCAL', 'index_mat': '1.67', 'coating': 'SRC_ULTRA', 'purchase': 65, 'selling': 160})
        lenses_to_insert.append({'name': 'Seiko SmartZoom 1.60 SRC-Screen', 'brand': 'SEIKO', 'type': 'UNIFOCAL', 'index_mat': '1.60', 'coating': 'SRC_SCREEN', 'purchase': 55, 'selling': 140})
        
        # Progressifs
        lenses_to_insert.append({'name': 'Seiko Prime X 1.60 SRC-Road', 'brand': 'SEIKO', 'type': 'PROGRESSIF', 'index_mat': '1.60', 'coating': 'SRC_ROAD', 'purchase': 130, 'selling': 320})
        lenses_to_insert.append({'name': 'Seiko Brilliance 1.74 SRC-Sun', 'brand': 'SEIKO', 'type': 'PROGRESSIF', 'index_mat': '1.74', 'coating': 'SRC_SUN', 'purchase': 200, 'selling': 550})

        # --- MARQUE : ZEISS ---
        lenses_to_insert.append({'name': 'Zeiss ClearView 1.60 DV Platinum', 'brand': 'ZEISS', 'type': 'UNIFOCAL', 'index_mat': '1.60', 'coating': 'DV_PLATINUM', 'purchase': 50, 'selling': 130})
        lenses_to_insert.append({'name': 'Zeiss SmartLife Prog 1.67 DV BP', 'brand': 'ZEISS', 'type': 'PROGRESSIF', 'index_mat': '1.67', 'coating': 'DV_BP', 'purchase': 160, 'selling': 420})

        # 3. INSERTION EN MASSE
        count = 0
        for lens in lenses_to_insert:
            stmt = text("""
                INSERT INTO lenses (name, brand, type, index_mat, coating, purchase_price, selling_price)
                VALUES (:name, :brand, :type, :index_mat, :coating, :purchase, :selling)
            """)
            conn.execute(stmt, {
                "name": lens['name'],
                "brand": lens['brand'],
                "type": lens['type'],
                "index_mat": lens['index_mat'],
                "coating": lens['coating'],
                "purchase": lens['purchase'],
                "selling": lens['selling']
            })
            count += 1
        
        conn.commit()
        print(f"🎉 Terminé ! {count} verres ont été insérés dans la base.")

if __name__ == "__main__":
    seed_database()