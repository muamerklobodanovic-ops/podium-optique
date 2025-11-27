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

# 2. Sécurité
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

# --- OUTILS DE NETTOYAGE (Identiques au script d'import précédent) ---
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

def get_column_value(row, candidates):
    headers = list(row.keys())
    for candidate in candidates:
        for header in headers:
            h_clean = header.upper().encode('ascii', 'ignore').decode()
            c_clean = candidate.upper()
            if c_clean in header.upper() or c_clean in h_clean:
                return row[header]
    return None

# --- NOUVEAU : Modèle de données pour la demande de synchro ---
class SyncRequest(BaseModel):
    url: str

# --- NOUVEAU : Endpoint de Synchronisation ---
@app.post("/sync")
def sync_catalog(request: SyncRequest):
    if not engine:
        raise HTTPException(status_code=500, detail="Pas de connexion base de données")
    
    print(f"🚀 Démarrage synchro depuis : {request.url}")
    
    try:
        # 1. Téléchargement du CSV Google
        response = urllib.request.urlopen(request.url)
        data = response.read().decode('utf-8')
        
        # 2. Analyse du CSV
        # On gère le cas où Google envoie du CSV avec des virgules
        f = io.StringIO(data)
        try:
            dialect = csv.Sniffer().sniff(f.read(1024))
        except:
            dialect = csv.excel
            dialect.delimiter = ','
        
        f.seek(0)
        reader = csv.DictReader(f, dialect=dialect)
        
        # 3. Mise à jour Base de données
        with engine.connect() as conn:
            # On vide la table
            conn.execute(text("TRUNCATE TABLE lenses RESTART IDENTITY;"))
            
            count = 0
            stmt = text("""
                INSERT INTO lenses (name, brand, type, design, index_mat, coating, purchase_price, selling_price)
                VALUES (:name, :brand, :type, :design, :index, :coating, :purchase, :selling)
            """)

            for row in reader:
                # Logique de mapping (identique à votre CSV spécifique)
                raw_geo = str(get_column_value(row, ['GEOMETRIE', 'GÃ‰OMETRIE', 'GÉOMETRIE']) or '').upper()
                lens_type = 'UNIFOCAL'
                if 'PROG' in raw_geo: lens_type = 'PROGRESSIF'
                elif 'DEGRESSIF' in raw_geo or 'INTERIEUR' in raw_geo or 'PROX' in raw_geo: lens_type = 'DEGRESSIF'
                
                name = get_column_value(row, ['MODELE COMMERCIAL', 'LIBELLE']) or 'Inconnu'
                brand = get_column_value(row, ['MARQUE', 'FABRICANT']) or 'GENERIQUE'
                design = get_column_value(row, ['DESIGN', 'GAMME', 'FAMILLE']) or 'STANDARD'
                idx = clean_index(get_column_value(row, ['INDICE']))
                coating = get_column_value(row, ['TRAITEMENT']) or 'DURCI'
                purchase = clean_price(get_column_value(row, ['PRIX 2*NETS', 'PRIX 2 NETS', '2*NETS']))
                selling = clean_price(get_column_value(row, ['KALIXIA'])) # Prix de ref

                if name != 'Inconnu':
                    params = {
                        "name": name, "brand": brand, "type": lens_type, "design": design,
                        "index": idx, "coating": coating, "purchase": purchase, "selling": selling
                    }
                    conn.execute(stmt, params)
                    count += 1
            
            conn.commit()
            print(f"✅ Synchro terminée : {count} produits.")
            return {"status": "success", "count": count, "message": f"Catalogue mis à jour : {count} références importées."}

    except Exception as e:
        print(f"❌ Erreur Synchro : {e}")
        raise HTTPException(status_code=400, detail=f"Erreur lors de la lecture du Google Sheet : {str(e)}")

# --- Endpoint Lecture (Inchangé mais avec limite infinie) ---
@app.get("/lenses")
def get_lenses(
    type_verre: str = Query("PROGRESSIF", alias="type"),
    brand: str = None,
    index_mat: str = Query(None, alias="index"),
    coating: str = None,
    design: str = None, 
    pocket_limit: float = Query(0.0, alias="pocketLimit"),
    network: str = None,
    sphere: float = 0.0,
    myopia: bool = False,
    uvOption: bool = False,
    clean: bool = False
):
    if not engine: return []
    try:
        with engine.connect() as conn:
            sql = "SELECT * FROM lenses WHERE 1=1"
            params = {}

            if type_verre:
                if type_verre == "INTERIEUR": sql += " AND (type = 'DEGRESSIF' OR type = 'INTERIEUR')"
                else: 
                    sql += " AND type = :type"
                    params["type"] = type_verre

            if brand and brand != "TOUTES":
                if brand == "ORUS": sql += " AND brand ILIKE 'CODIR'"
                else: 
                    sql += " AND brand ILIKE :brand"
                    params["brand"] = brand

            if index_mat:
                clean_idx = index_mat.replace('.', ',') 
                short_idx = index_mat.rstrip('0') 
                sql += " AND (index_mat = :idx1 OR index_mat = :idx2 OR index_mat = :idx3)"
                params["idx1"] = index_mat
                params["idx2"] = clean_idx
                params["idx3"] = short_idx

            if coating:
                c_clean = coating.split('_')[0]
                sql += " AND coating ILIKE :coating_kw"
                params["coating_kw"] = f"%{c_clean}%"

            if design and design != "TOUS" and design != "":
                sql += " AND design ILIKE :design"
                params["design"] = f"%{design}%"

            if myopia: sql += " AND name ILIKE '%MIYO%'"

            sql += " ORDER BY selling_price DESC LIMIT 1000"
            
            result = conn.execute(text(sql), params)
            rows = result.fetchall()
            
            lenses_list = []
            base_refund = 60.0 if type_verre == "UNIFOCAL" else 200.0

            for row in rows:
                lens = row._mapping
                p_price = float(lens['purchase_price'])
                s_price = float(lens['selling_price'])
                
                final_price = s_price
                if pocket_limit > 0:
                    target = base_refund + pocket_limit
                    final_price = min(target, s_price)
                    if final_price < (p_price * 2.0): final_price = max(p_price * 2.0, s_price)

                lenses_list.append({
                    "id": lens['id'],
                    "name": lens['name'],
                    "brand": brand if brand == "ORUS" else lens['brand'],
                    "design": lens.get('design', 'STANDARD'), 
                    "index_mat": lens['index_mat'],
                    "coating": lens['coating'],
                    "purchasePrice": round(p_price, 2),
                    "sellingPrice": round(final_price, 2),
                    "margin": round(final_price - p_price, 2)
                })
            
            lenses_list.sort(key=lambda x: x['margin'], reverse=True)
            return lenses_list

    except Exception as e:
        print(f"❌ ERREUR: {e}")
        return []