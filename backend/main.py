from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from pydantic import BaseModel
import os
import csv
import urllib.request
import io
import re
import json
from datetime import datetime
from dotenv import load_dotenv
from cryptography.fernet import Fernet

# 1. Configuration
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# Clé de chiffrement :
# En production, cette clé doit être fixe et stockée dans le fichier .env (ENCRYPTION_KEY=...)
# Ici, si elle n'existe pas, on en génère une temporaire (attention, les données seront illisibles au redémarrage si la clé change)
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", Fernet.generate_key().decode())
cipher = Fernet(ENCRYPTION_KEY.encode())

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
        
        # Initialisation des tables au démarrage
        with engine.begin() as conn:
            # Table Catalogue (lenses) - On s'assure qu'elle existe (la structure complète est gérée par la synchro)
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS lenses (
                    id SERIAL PRIMARY KEY,
                    brand VARCHAR(50),
                    name VARCHAR(200),
                    geometry VARCHAR(100),
                    design VARCHAR(100),
                    index_mat VARCHAR(20),
                    coating VARCHAR(100),
                    purchase_price DECIMAL(10,2),
                    selling_price DECIMAL(10,2),
                    commercial_code VARCHAR(50),
                    material VARCHAR(100),
                    commercial_flow VARCHAR(50),
                    sell_kalixia DECIMAL(10,2),
                    sell_itelis DECIMAL(10,2),
                    sell_carteblanche DECIMAL(10,2),
                    sell_seveane DECIMAL(10,2),
                    sell_santeclair DECIMAL(10,2)
                );
            """))
            
            # Table Dossiers Clients (client_offers)
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS client_offers (
                    id SERIAL PRIMARY KEY,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    encrypted_identity TEXT, -- Données chiffrées (Nom, Prénom, DDN)
                    lens_details JSONB,      -- Copie des infos du verre
                    financials JSONB         -- Détails prix (Remboursement, Total...)
                );
            """))
    else:
        engine = None
except Exception as e:
    print(f"❌ ERREUR CRITIQUE BDD: {e}")
    engine = None

# --- OUTILS CHIFFREMENT ---
def encrypt_dict(data: dict) -> str:
    """Transforme un dictionnaire en chaîne chiffrée"""
    json_str = json.dumps(data)
    return cipher.encrypt(json_str.encode()).decode()

def decrypt_dict(token: str) -> dict:
    """Récupère le dictionnaire depuis la chaîne chiffrée"""
    try:
        json_str = cipher.decrypt(token.encode()).decode()
        return json.loads(json_str)
    except Exception:
        return {"name": "Donnée", "firstname": "Illisible/Corrompue", "dob": "?"}

# --- OUTILS NETTOYAGE ---
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

# --- MODELES ---
class SyncRequest(BaseModel):
    url: str

class OfferRequest(BaseModel):
    client: dict
    lens: dict
    finance: dict

# --- ENDPOINTS DOSSIERS CLIENTS ---

@app.post("/offers")
def save_offer(offer: OfferRequest):
    if not engine: raise HTTPException(status_code=500, detail="DB Error")
    
    try:
        # On ne stocke que la version chiffrée de l'identité
        encrypted_id = encrypt_dict(offer.client)
        
        with engine.begin() as conn:
            stmt = text("""
                INSERT INTO client_offers (encrypted_identity, lens_details, financials)
                VALUES (:ident, :lens, :fin)
            """)
            conn.execute(stmt, {
                "ident": encrypted_id,
                "lens": json.dumps(offer.lens),
                "fin": json.dumps(offer.finance)
            })
        return {"status": "success", "message": "Offre sauvegardée et chiffrée."}
    except Exception as e:
        print(f"Save Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/offers")
def get_offers():
    if not engine: return []
    try:
        with engine.connect() as conn:
            # On récupère les 50 derniers
            result = conn.execute(text("SELECT * FROM client_offers ORDER BY created_at DESC LIMIT 50"))
            rows = result.fetchall()
            
            output = []
            for row in rows:
                r = row._mapping
                # On déchiffre pour l'affichage
                client_info = decrypt_dict(r['encrypted_identity'])
                
                output.append({
                    "id": r['id'],
                    "date": r['created_at'].strftime("%d/%m/%Y %H:%M"),
                    "client": client_info,
                    "lens": r['lens_details'],
                    "finance": r['financials']
                })
            return output
    except Exception as e:
        print(f"Get Error: {e}")
        return []

# --- ENDPOINT SYNCHRO (BULK) ---
@app.post("/sync")
def sync_catalog(request: SyncRequest):
    if not engine:
        raise HTTPException(status_code=500, detail="Pas de connexion BDD")
    
    print(f"🚀 Synchro BULK : {request.url}")
    
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
            brand = get_val(row, ['MARQUE']) or 'GENERIQUE'
            raw_name = get_val(row, ['MODELE COMMERCIAL', 'MODELE']) or 'Inconnu'
            code = get_val(row, ['CODE', 'EDI']) or ''
            
            raw_geo = str(get_val(row, ['GÉOMETRIE', 'GEOMETRIE']) or '').upper()
            lens_type = 'UNIFOCAL'
            if 'PROG' in raw_geo: lens_type = 'PROGRESSIF'
            elif 'DEGRESSIF' in raw_geo or 'INTERIEUR' in raw_geo: lens_type = 'DEGRESSIF'
            elif 'MULTIFOCAL' in raw_geo: lens_type = 'MULTIFOCAL'
            
            design = get_val(row, ['DESIGN', 'GAMME']) or 'STANDARD'
            idx = clean_index(get_val(row, ['INDICE']))
            coating = get_val(row, ['TRAITEMENT']) or 'DURCI'
            flow = get_val(row, ['FLUX', 'COMMERCIAL']) or ''
            mat = get_val(row, ['MATIERE']) or ''
            
            purchase = clean_price(get_val(row, ['PRIX 2*NETS', '2*NETS']))
            # Prix par défaut
            selling = clean_price(get_val(row, ['KALIXIA'])) 
            
            p_kalixia = clean_price(get_val(row, ['KALIXIA']))
            p_itelis = clean_price(get_val(row, ['ITELIS']))
            p_cb = clean_price(get_val(row, ['CARTE BLANCHE']))
            p_seveane = clean_price(get_val(row, ['SEVEANE']))
            p_santeclair = clean_price(get_val(row, ['SANTECLAIRE', 'SANTECLAIR']))

            matiere_upper = str(mat).upper()
            if any(x in matiere_upper for x in ['TRANS', 'GEN', 'SOLA', 'TGNS', 'SABR', 'SAGR']):
                raw_name = f"{raw_name} {matiere_upper}"

            if raw_name != 'Inconnu' and purchase > 0:
                lenses_to_insert.append({
                    "brand": brand, "code": code, "name": raw_name,
                    "geo": lens_type, "design": design, "idx": idx,
                    "mat": mat, "coat": coating, "flow": flow,
                    "buy": purchase, "selling": selling,
                    "p_kalixia": p_kalixia, "p_itelis": p_itelis,
                    "p_cb": p_cb, "p_seveane": p_seveane, "p_santeclair": p_santeclair
                })

        if lenses_to_insert:
            with engine.begin() as conn:
                # On recrée la table pour être sûr de la structure
                conn.execute(text("DROP TABLE IF EXISTS lenses;"))
                conn.execute(text("""
                    CREATE TABLE lenses (
                        id SERIAL PRIMARY KEY,
                        brand VARCHAR(50), commercial_code VARCHAR(50), name VARCHAR(200),
                        geometry VARCHAR(100), design VARCHAR(100), index_mat VARCHAR(20),
                        material VARCHAR(100), coating VARCHAR(100), commercial_flow VARCHAR(50),
                        purchase_price DECIMAL(10,2), selling_price DECIMAL(10,2),
                        sell_kalixia DECIMAL(10,2), sell_itelis DECIMAL(10,2),
                        sell_carteblanche DECIMAL(10,2), sell_seveane DECIMAL(10,2),
                        sell_santeclair DECIMAL(10,2)
                    );
                """))
                
                stmt = text("""
                    INSERT INTO lenses (
                        brand, commercial_code, name, geometry, design, index_mat, material, coating, commercial_flow,
                        purchase_price, selling_price, sell_kalixia, sell_itelis, sell_carteblanche, sell_seveane, sell_santeclair
                    ) VALUES (
                        :brand, :code, :name, :geo, :design, :idx, :mat, :coat, :flow,
                        :buy, :selling, :p_kalixia, :p_itelis, :p_cb, :p_seveane, :p_santeclair
                    )
                """)
                conn.execute(stmt, lenses_to_insert)
                
            return {"status": "success", "count": len(lenses_to_insert), "message": "Catalogue mis à jour."}
        else:
            return {"status": "error", "message": "Aucune donnée valide."}

    except Exception as e:
        print(f"❌ Erreur Synchro : {e}")
        raise HTTPException(status_code=400, detail=f"Erreur : {str(e)}")

# --- ENDPOINT LECTURE ---
@app.get("/lenses")
def get_lenses(
    type_verre: str = Query(None, alias="type"),
    brand: str = Query(None),
):
    if not engine: return []
    try:
        with engine.connect() as conn:
            sql = "SELECT * FROM lenses WHERE 1=1"
            params = {}
            if brand and brand != "":
                sql += " AND brand ILIKE :brand"
                params["brand"] = brand
            if type_verre:
                if "INTERIEUR" in type_verre.upper():
                    sql += " AND (geometry ILIKE '%INTERIEUR%' OR geometry ILIKE '%DEGRESSIF%')"
                else:
                    sql += " AND geometry ILIKE :geo"
                    params["geo"] = f"%{type_verre}%"
            
            # On renvoie tout (le front filtre)
            sql += " ORDER BY purchase_price ASC LIMIT 3000"
            
            result = conn.execute(text(sql), params)
            rows = result.fetchall()
            
            # Mapping des colonnes BDD -> JSON Frontend
            output = []
            for row in rows:
                r = row._mapping
                output.append({
                    "id": r['id'],
                    "brand": r['brand'],
                    "commercial_code": r['commercial_code'],
                    "name": r['name'],
                    "type": r['geometry'],
                    "design": r['design'],
                    "index_mat": r['index_mat'],
                    "material": r['material'],
                    "coating": r['coating'],
                    "commercial_flow": r['commercial_flow'],
                    "purchase_price": float(r['purchase_price'] or 0),
                    "sellingPrice": float(r['selling_price'] or 0), # Default selling price
                    "sell_kalixia": float(r['sell_kalixia'] or 0),
                    "sell_itelis": float(r['sell_itelis'] or 0),
                    "sell_carteblanche": float(r['sell_carteblanche'] or 0),
                    "sell_seveane": float(r['sell_seveane'] or 0),
                    "sell_santeclair": float(r['sell_santeclair'] or 0)
                })
            return output
            
    except Exception as e:
        print(f"❌ ERREUR SQL : {e}")
        return []