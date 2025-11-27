from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# 1. Configuration
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

app = FastAPI()

# 2. Sécurité (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Connexion Base de Données
try:
    if DATABASE_URL:
        # Correction pour certains formats d'URL postgres
        if DATABASE_URL.startswith("postgres://"):
            DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        engine = create_engine(DATABASE_URL)
    else:
        engine = None
except Exception as e:
    print(f"❌ ERREUR CRITIQUE CONNEXION BDD: {e}")
    engine = None

@app.get("/")
def read_root():
    return {"status": "online", "message": "API Podium Optique Active"}

@app.get("/lenses")
def get_lenses(
    type_verre: str = Query("PROGRESSIF", alias="type"),
    brand: str = None,
    index_mat: str = Query(None, alias="index"),
    coating: str = None,
    design: str = None, 
    pocket_limit: float = Query(0.0, alias="pocketLimit"),
    
    # Paramètres optionnels
    network: str = None,
    sphere: float = 0.0,
    myopia: bool = False,
    uvOption: bool = False,
    clean: bool = False
):
    # Log pour le débogage
    print(f"🔍 RECHERCHE INFINIE : Type={type_verre} | Marque={brand} | Design={design}")

    if not engine:
        return []

    try:
        with engine.connect() as conn:
            # On commence la requête
            sql = "SELECT * FROM lenses WHERE 1=1"
            params = {}

            # --- 1. FILTRE TYPE (STRICT) ---
            if type_verre:
                if type_verre == "INTERIEUR":
                     sql += " AND (type = 'DEGRESSIF' OR type = 'INTERIEUR')"
                else:
                     sql += " AND type = :type"
                     params["type"] = type_verre

            # --- 2. FILTRE MARQUE (STRICT) ---
            if brand and brand != "TOUTES":
                if brand == "ORUS":
                    # ORUS est une marque commerciale qui puise dans le stock CODIR
                    sql += " AND brand ILIKE 'CODIR'"
                else:
                    sql += " AND brand ILIKE :brand"
                    params["brand"] = brand

            # --- 3. FILTRE DESIGN / GAMME ---
            if design and design != "TOUS" and design != "":
                sql += " AND design ILIKE :design"
                params["design"] = f"%{design}%"

            # --- 4. FILTRE INDICE (STRICT) ---
            if index_mat:
                clean_idx = index_mat.replace('.', ',') 
                short_idx = index_mat.rstrip('0') 
                
                sql += " AND (index_mat = :idx1 OR index_mat = :idx2 OR index_mat = :idx3)"
                params["idx1"] = index_mat
                params["idx2"] = clean_idx
                params["idx3"] = short_idx

            # --- 5. FILTRE TRAITEMENT ---
            if coating:
                c_clean = coating.split('_')[0]
                sql += " AND coating ILIKE :coating_kw"
                params["coating_kw"] = f"%{c_clean}%"

            # --- 6. FILTRE MYOPIE ---
            if myopia:
                sql += " AND name ILIKE '%MIYO%'"

            # --- PAS DE LIMITE ---
            # On retire le LIMIT pour récupérer absolument toutes les références
            # Cela permet au frontend de scanner tous les designs disponibles
            sql += " ORDER BY selling_price DESC"
            
            result = conn.execute(text(sql), params)
            rows = result.fetchall()
            
            # --- POST-TRAITEMENT ---
            lenses_list = []
            
            # Base de remboursement sécu/mutuelle estimée
            refund_bases = {
                "UNIFOCAL": 60.00,
                "PROGRESSIF": 200.00,
                "DEGRESSIF": 120.00,
                "INTERIEUR": 120.00
            }
            base_refund = refund_bases.get(type_verre, 0.0)

            for row in rows:
                lens = row._mapping
                
                p_price = float(lens['purchase_price'])
                s_price_catalog = float(lens['selling_price']) 
                
                # Calcul du Prix Optimisé
                final_selling_price = s_price_catalog
                
                if pocket_limit > 0:
                    target_price = base_refund + pocket_limit
                    final_selling_price = min(target_price, s_price_catalog)
                    
                    if final_selling_price < (p_price * 2.0):
                        final_selling_price = max(p_price * 2.0, s_price_catalog)

                margin = final_selling_price - p_price

                lenses_list.append({
                    "id": lens['id'],
                    "name": lens['name'],
                    "brand": brand if brand == "ORUS" else lens['brand'],
                    "design": lens.get('design', 'STANDARD'), 
                    "index_mat": lens['index_mat'],
                    "coating": lens['coating'],
                    "purchasePrice": round(p_price, 2),
                    "sellingPrice": round(final_selling_price, 2),
                    "margin": round(margin, 2)
                })
            
            # Tri final
            lenses_list.sort(key=lambda x: x['margin'], reverse=True)
            
            # On renvoie TOUTE la liste (pas de slice [:3])
            return lenses_list

    except Exception as e:
        print(f"❌ ERREUR SQL : {e}")
        return []