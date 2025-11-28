from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from pydantic import BaseModel
import os
import csv
import urllib.request
import io
import re
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

# 3. Connexion BDD
try:
    if DATABASE_URL:
        if DATABASE_URL.startswith("postgres://"):
            DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        engine = create_engine(DATABASE_URL)
    else:
        engine = None
except Exception as e:
    print(f"❌ ERREUR CRITIQUE BDD: {e}")
    engine = None

# --- OUTILS NETTOYAGE POUR LA SYNCHRO ---
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

def get_val(row, keys):
    row_keys = list(row.keys())
    for k in keys:
        k_clean = k.upper().strip()
        for rk in row_keys:
            rk_clean = rk.upper().strip().replace('Ã‰', 'E').replace('É', 'E')
            if k_clean == rk_clean or k_clean in rk_clean:
                return row[rk]
    return None

class SyncRequest(BaseModel):
    url: str

# --- ENDPOINT SYNCHRO (Compatible nouvelle structure) ---
@app.post("/sync")
def sync_catalog(request: SyncRequest):
    if not engine:
        raise HTTPException(status_code=500, detail="Pas de connexion BDD")
    
    print(f"🚀 Synchro depuis : {request.url}")
    
    try:
        response = urllib.request.urlopen(request.url)
        data = response.read().decode('utf-8')
        f = io.StringIO(data)
        
        try: dialect = csv.Sniffer().sniff(f.read(1024))
        except: dialect = csv.excel; dialect.delimiter = ','
        f.seek(0)
        
        reader = csv.DictReader(f, dialect=dialect)
        lenses_to_insert = []

        for row in reader:
            # Mapping identique à import_sheets.py
            brand = get_val(row, ['MARQUE']) or 'GENERIQUE'
            raw_name = get_val(row, ['MODELE COMMERCIAL', 'MODELE']) or 'Inconnu'
            
            raw_geo = str(get_val(row, ['GÉOMETRIE', 'GEOMETRIE']) or '').upper()
            lens_type = 'UNIFOCAL'
            if 'PROG' in raw_geo: lens_type = 'PROGRESSIF'
            elif 'DEGRESSIF' in raw_geo or 'INTERIEUR' in raw_geo: lens_type = 'DEGRESSIF'
            elif 'MULTIFOCAL' in raw_geo: lens_type = 'MULTIFOCAL'
            
            design = get_val(row, ['DESIGN', 'GAMME']) or 'STANDARD'
            idx = clean_index(get_val(row, ['INDICE']))
            coating = get_val(row, ['TRAITEMENT']) or 'DURCI'
            flow = get_val(row, ['FLUX', 'COMMERCIAL']) or ''
            code = get_val(row, ['CODE', 'EDI']) or ''
            mat = get_val(row, ['MATIERE']) or ''
            
            purchase = clean_price(get_val(row, ['PRIX 2*NETS', '2*NETS']))
            
            # Prix réseaux
            p_kalixia = clean_price(get_val(row, ['KALIXIA']))
            p_itelis = clean_price(get_val(row, ['ITELIS']))
            p_cb = clean_price(get_val(row, ['CARTE BLANCHE']))
            p_seveane = clean_price(get_val(row, ['SEVEANE']))
            p_santeclair = clean_price(get_val(row, ['SANTECLAIRE', 'SANTECLAIR']))

            # Gestion Photochromique dans le nom
            matiere_upper = str(mat).upper()
            if any(x in matiere_upper for x in ['TRANS', 'GEN', 'SOLA', 'TGNS', 'SABR', 'SAGR']):
                raw_name = f"{raw_name} {matiere_upper}"

            if raw_name != 'Inconnu' and purchase > 0:
                lenses_to_insert.append({
                    "brand": brand,
                    "code": code,
                    "name": raw_name,
                    "geo": lens_type, # On normalise ici
                    "design": design,
                    "idx": idx,
                    "mat": mat,
                    "coat": coating,
                    "flow": flow,
                    "buy": purchase,
                    "p_kalixia": p_kalixia,
                    "p_itelis": p_itelis,
                    "p_cb": p_cb,
                    "p_seveane": p_seveane,
                    "p_santeclair": p_santeclair
                })

        if lenses_to_insert:
            with engine.begin() as conn:
                conn.execute(text("TRUNCATE TABLE lenses RESTART IDENTITY;"))
                # Insertion avec toutes les colonnes
                stmt = text("""
                    INSERT INTO lenses (
                        brand, commercial_code, name, geometry, design, index_mat, material, coating, commercial_flow,
                        purchase_price, sell_kalixia, sell_itelis, sell_carteblanche, sell_seveane, sell_santeclair
                    ) VALUES (
                        :brand, :code, :name, :geo, :design, :idx, :mat, :coat, :flow,
                        :buy, :p_kalixia, :p_itelis, :p_cb, :p_seveane, :p_santeclair
                    )
                """)
                conn.execute(stmt, lenses_to_insert)
                
            return {"status": "success", "count": len(lenses_to_insert), "message": "Catalogue mis à jour."}
        else:
            return {"status": "error", "message": "Aucune donnée valide."}

    except Exception as e:
        print(f"❌ Erreur Synchro : {e}")
        raise HTTPException(status_code=400, detail=f"Erreur : {str(e)}")

# --- ENDPOINT LECTURE (API pour le Frontend) ---
@app.get("/lenses")
def get_lenses(
    # Filtres reçus du Frontend
    type_verre: str = Query(None, alias="type"),
    brand: str = Query(None),
    # Les autres filtres (indice, design...) sont gérés par le frontend maintenant
    # on les reçoit juste pour ne pas faire planter l'appel, mais on ne les utilise pas dans le SQL
    index: str = Query(None),
    coating: str = Query(None),
    design: str = Query(None),
    pocketLimit: float = Query(0.0)
):
    if not engine: return []

    try:
        with engine.connect() as conn:
            sql = "SELECT * FROM lenses WHERE 1=1"
            params = {}

            # Filtre 1 : Géométrie (Type)
            # Le frontend envoie "PROGRESSIF", "UNIFOCAL", etc.
            # On utilise ILIKE pour être souple sur les variantes
            if type_verre:
                if "INTERIEUR" in type_verre.upper():
                    sql += " AND (geometry ILIKE '%INTERIEUR%' OR geometry ILIKE '%DEGRESSIF%')"
                else:
                    sql += " AND geometry ILIKE :geo"
                    params["geo"] = f"%{type_verre}%"

            # Filtre 2 : Marque (Si spécifiée par le Frontend)
            if brand and brand != "":
                # On utilise ILIKE pour éviter les problèmes de majuscules/minuscules
                sql += " AND brand ILIKE :brand"
                params["brand"] = brand

            # On renvoie BEAUCOUP de données (tout le catalogue de cette marque/type)
            # Le frontend fera le tri fin (Indice, Design, Traitement...)
            sql += " ORDER BY purchase_price ASC LIMIT 3000"
            
            result = conn.execute(text(sql), params)
            rows = result.fetchall()
            
            # Conversion en liste de dictionnaires pour le JSON
            lenses_list = []
            for row in rows:
                r = row._mapping
                lenses_list.append({
                    "id": r['id'],
                    "brand": r['brand'],
                    "commercial_code": r['commercial_code'],
                    "name": r['name'],
                    "type": r['geometry'], # On map geometry vers 'type' pour le front
                    "design": r['design'],
                    "index_mat": r['index_mat'],
                    "material": r['material'],
                    "coating": r['coating'],
                    "commercial_flow": r['commercial_flow'],
                    "purchase_price": float(r['purchase_price'] or 0),
                    "sell_kalixia": float(r['sell_kalixia'] or 0),
                    "sell_itelis": float(r['sell_itelis'] or 0),
                    "sell_carteblanche": float(r['sell_carteblanche'] or 0),
                    "sell_seveane": float(r['sell_seveane'] or 0),
                    "sell_santeclair": float(r['sell_santeclair'] or 0)
                })

            return lenses_list

    except Exception as e:
        print(f"❌ ERREUR SQL : {e}")
        return []