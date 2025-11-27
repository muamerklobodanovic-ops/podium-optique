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
    pocket_limit: float = Query(0.0, alias="pocketLimit"),
    
    # Paramètres reçus mais filtrés via la logique SQL ci-dessous
    network: str = None,
    sphere: float = 0.0,
    myopia: bool = False,
    uvOption: bool = False,
    clean: bool = False
):
    print(f"🔍 FILTRE STRICT : Type={type_verre} | Marque={brand} | Indice={index_mat} | Trait={coating}")

    if not engine:
        return []

    try:
        with engine.connect() as conn:
            # On commence la requête
            sql = "SELECT * FROM lenses WHERE 1=1"
            params = {}

            # --- 1. FILTRE TYPE (STRICT) ---
            # Doit correspondre exactement à 'UNIFOCAL', 'PROGRESSIF', 'DEGRESSIF'
            if type_verre:
                # Petite exception pour INTERIEUR qui est souvent noté DEGRESSIF dans les catalogues
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
                    # ILIKE permet d'ignorer la casse (Hoya = HOYA) mais reste strict sur le mot
                    sql += " AND brand ILIKE :brand"
                    params["brand"] = brand

            # --- 3. FILTRE INDICE (STRICT) ---
            if index_mat:
                # On gère le cas 1.60 vs 1,6 vs 1.6
                clean_idx = index_mat.replace('.', ',') 
                short_idx = index_mat.rstrip('0') # 1.60 -> 1.6
                
                sql += " AND (index_mat = :idx1 OR index_mat = :idx2 OR index_mat = :idx3)"
                params["idx1"] = index_mat
                params["idx2"] = clean_idx
                params["idx3"] = short_idx

            # --- 4. FILTRE TRAITEMENT (TRÈS STRICT) ---
            if coating:
                # Le frontend envoie des codes avec underscores (ex: QUATTRO_UV_CLEAN)
                # Le CSV contient des noms avec espaces ou tirets (ex: Quattro UV Clean)
                
                # On génère les variantes probables d'écriture
                c_space = coating.replace('_', ' ')   # QUATTRO UV CLEAN
                c_hyphen = coating.replace('_', '-')  # B-PROTECT
                
                # Recherche EXACTE (Insensible à la casse grace à ILIKE)
                # Si on cherche "Mistral", ça NE trouvera PAS "Mistral Clean"
                sql += " AND (coating ILIKE :c1 OR coating ILIKE :c2)"
                params["c1"] = c_space
                params["c2"] = c_hyphen

            # --- 5. FILTRE MYOPIE (Recherche par mot clé spécifique) ---
            if myopia:
                sql += " AND name ILIKE '%MIYO%'"

            # Tri par marge (ou prix de vente si marge non calculable ici)
            sql += " ORDER BY selling_price DESC LIMIT 50"
            
            result = conn.execute(text(sql), params)
            rows = result.fetchall()
            
            # --- POST-TRAITEMENT & CALCULS ---
            lenses_list = []
            
            # Base de remboursement sécu/mutuelle estimée pour le calcul
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
                s_price_catalog = float(lens['selling_price']) # Prix Plafond
                
                # Calcul du Prix Optimisé (Reste à Charge)
                final_selling_price = s_price_catalog
                
                if pocket_limit > 0:
                    # On vise : Remboursement + Poche du client
                    target_price = base_refund + pocket_limit
                    # On prend le plus bas entre le Prix Plafond et le Prix Cible
                    final_selling_price = min(target_price, s_price_catalog)
                    
                    # Sécurité Marge : On ne descend pas en dessous d'un coeff 2.0
                    if final_selling_price < (p_price * 2.0):
                        final_selling_price = max(p_price * 2.0, s_price_catalog)

                margin = final_selling_price - p_price

                lenses_list.append({
                    "id": lens['id'],
                    "name": lens['name'],
                    "brand": brand if brand == "ORUS" else lens['brand'],
                    "index_mat": lens['index_mat'],
                    "coating": lens['coating'],
                    "purchasePrice": round(p_price, 2),
                    "sellingPrice": round(final_selling_price, 2),
                    "margin": round(margin, 2)
                })
            
            # Tri final pour le podium
            lenses_list.sort(key=lambda x: x['margin'], reverse=True)
            
            return lenses_list[:3]

    except Exception as e:
        print(f"❌ ERREUR SQL : {e}")
        return []