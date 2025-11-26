from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

@app.get("/")
def read_root():
    return {"message": "API Podium Optique Active"}

@app.get("/lenses")
def get_lenses(
    # Paramètres reçus du Frontend
    type_verre: str = Query("PROGRESSIF", alias="type"),
    network: str = "HORS_RESEAU",
    brand: str = None,
    sphere: float = 0.0,
    index_mat: str = Query(None, alias="index"),
    coating: str = None,
    clean: bool = False,
    myopia: bool = False,
    pocket_limit: float = Query(0.0, alias="pocketLimit") # La limite RAC définie par l'opticien
):
    print(f"🔍 RECHERCHE : Type={type_verre} | Marque={brand} | Indice={index_mat} | RAC_Max={pocket_limit}€")

    try:
        with engine.connect() as conn:
            # 1. Construction dynamique de la requête SQL
            # On commence par filtrer par TYPE (obligatoire)
            sql_query = "SELECT * FROM lenses WHERE type = :type_verre"
            params = {"type_verre": type_verre}

            # Filtre Marque (Si spécifiée et pas "Toutes")
            if brand and brand != "TOUTES":
                # Note: Assurez-vous que vos marques dans la BDD correspondent (HOYA, ESSILOR...)
                # Ici on fait un filtre insensible à la casse
                sql_query += " AND brand ILIKE :brand"
                params["brand"] = f"%{brand}%"

            # Filtre Indice (Si spécifié)
            if index_mat:
                sql_query += " AND index_mat = :index_mat"
                params["index_mat"] = index_mat

            # Filtre Myopie Control (Si activé, on cherche des mots clés comme 'MiYOSMART')
            if myopia:
                sql_query += " AND name ILIKE '%MiYOSMART%'"
            
            # Exécution de la requête
            result = conn.execute(text(sql_query), params)
            
            lenses = []
            
            # 2. Simulation des Données Manquantes (Remboursement)
            # Idéalement, ces chiffres viendront de votre base de données (colonnes 'refund_base')
            refund_table = {
                "UNIFOCAL": 0.05,   # Base sécu ridicule + Mutuelle (simulé à 50€ dans la logique)
                "PROGRESSIF": 0.05,
                "DEGRESSIF": 0.05,
                "INTERIEUR": 0.05
            }
            
            # On définit un remboursement mutuelle moyen SIMULÉ pour l'instant
            # (A remplacer par une vraie colonne dans la BDD plus tard)
            simulated_mutual_refund = {
                "UNIFOCAL": 60.00,
                "PROGRESSIF": 200.00,
                "DEGRESSIF": 120.00,
                "INTERIEUR": 120.00
            }

            for row in result:
                lens = row._mapping
                
                # Récupération des prix de base
                purchase_price = float(lens['purchase_price'])
                selling_price_ceiling = float(lens['selling_price']) # Prix Plafond Réseau (Cap)
                
                # Calcul du Remboursement (Simulé pour l'instant)
                refund_amount = simulated_mutual_refund.get(type_verre, 0.0)
                
                # --- LOGIQUE CŒUR : CALCUL DU PRIX OPTIMISÉ ---
                # Prix Optimisé = Ce que la mutuelle donne + Ce que le client veut bien payer max
                target_price = refund_amount + pocket_limit
                
                # Le prix de vente final ne peut pas dépasser le Plafond Réseau
                final_selling_price = min(target_price, selling_price_ceiling)
                
                # Sécurité : On ne vend jamais à perte ! (Coef min 2.0 par exemple)
                if final_selling_price < (purchase_price * 1.5):
                    final_selling_price = selling_price_ceiling # On revient au prix plafond si l'optimisé est trop bas
                
                # Calcul de la marge
                margin = final_selling_price - purchase_price
                
                lenses.append({
                    "id": lens['id'],
                    "name": lens['name'],
                    "brand": lens['brand'],
                    "index_mat": lens['index_mat'],
                    "purchasePrice": purchase_price,
                    "sellingPrice": round(final_selling_price, 2), # On envoie le prix optimisé
                    "margin": round(margin, 2),
                    "refundAmount": refund_amount # On renvoie l'info au front
                })
            
            # Tri par marge décroissante (Le Podium)
            lenses.sort(key=lambda x: x['margin'], reverse=True)
            
            # On ne garde que le Top 3
            return lenses[:3]

    except Exception as e:
        print(f"❌ ERREUR SQL : {e}")
        return {"error": str(e)}