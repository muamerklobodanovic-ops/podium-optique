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
# Clé de chiffrement (Générée si absente, à fixer dans les variables d'env Render pour la prod)
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

# 3. Connexion BDD & Initialisation Tables
engine = None
if DATABASE_URL:
    try:
        if DATABASE_URL.startswith("postgres://"):
            DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        engine = create_engine(DATABASE_URL)
        
        # Initialisation des tables au démarrage
        with engine.begin() as conn:
            # Table Catalogue
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS lenses (
                    id SERIAL PRIMARY KEY,
                    brand VARCHAR(50), name VARCHAR(200), geometry VARCHAR(100), design VARCHAR(100),
                    index_mat VARCHAR(20), coating VARCHAR(100), material VARCHAR(100),
                    commercial_code VARCHAR(50), commercial_flow VARCHAR(50),
                    purchase_price DECIMAL(10,2), selling_price DECIMAL(10,2),
                    sell_kalixia DECIMAL(10,2), sell_itelis DECIMAL(10,2),
                    sell_carteblanche DECIMAL(10,2), sell_seveane DECIMAL(10,2),
                    sell_santeclair DECIMAL(10,2)
                );
            """))
            
            # Table Dossiers Clients (Celle qui manquait peut-être)
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS client_offers (
                    id SERIAL PRIMARY KEY,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    encrypted_identity TEXT, -- Données chiffrées (Nom, Prénom...)
                    lens_details JSONB,      -- Détails du verre
                    financials JSONB         -- Détails prix
                );
            """))
            print("✅ Tables BDD vérifiées/créées.")
            
    except Exception as e:
        print(f"❌ ERREUR CRITIQUE BDD: {e}")
        engine = None

# --- OUTILS ---
def encrypt_dict(data: dict) -> str:
    """Chiffre un dictionnaire"""
    json_str = json.dumps(data)
    return cipher.encrypt(json_str.encode()).decode()

def decrypt_dict(token: str) -> dict:
    """Déchiffre un dictionnaire"""
    try:
        json_str = cipher.decrypt(token.encode()).decode()
        return json.loads(json_str)
    except Exception:
        return {"name": "Donnée", "firstname": "Illisible", "dob": "?"}

def clean_price(value):
    if not value or value == '' or value == '-': return 0.0
    try:
        return float(str(value).replace('€', '').replace(',', '.'))
    except ValueError: return 0.0

def clean_index(value):
    if not value: return "1.50"
    match = re.search(r"\d+\.?\d*", str(value).replace(',', '.'))
    return "{:.2f}".format(float(match.group(0))) if match else "1.50"

def get_val(row, keys):
    row_keys = list(row.keys())
    for k in keys:
        k_clean = k.upper().strip()
        for rk in row_keys:
            if k_clean in rk.upper(): return row[rk]
    return None

# --- MODELES ---
class SyncRequest(BaseModel):
    url: str

class OfferRequest(BaseModel):
    client: dict
    lens: dict
    finance: dict

# --- ENDPOINTS DOSSIERS CLIENTS (/offers) ---

@app.post("/offers")
def save_offer(offer: OfferRequest):
    if not engine: raise HTTPException(status_code=500, detail="DB Error")
    try:
        encrypted_id = encrypt_dict(offer.client)
        with engine.begin() as conn:
            stmt = text("INSERT INTO client_offers (encrypted_identity, lens_details, financials) VALUES (:ident, :lens, :fin)")
            conn.execute(stmt, {"ident": encrypted_id, "lens": json.dumps(offer.lens), "fin": json.dumps(offer.finance)})
        return {"status": "success", "message": "Dossier sauvegardé."}
    except Exception as e:
        print(f"Save Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/offers")
def get_offers():
    if not engine: return []
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT * FROM client_offers ORDER BY created_at DESC LIMIT 50"))
            return [{
                "id": r.id,
                "date": r.created_at.strftime("%d/%m/%Y %H:%M"),
                "client": decrypt_dict(r.encrypted_identity),
                "lens": r.lens_details,
                "finance": r.financials
            } for r in result.fetchall()]
    except Exception as e:
        print(f"Get Error: {e}")
        return []

# --- ENDPOINT SYNCHRO ---
@app.post("/sync")
def sync_catalog(request: SyncRequest):
    if not engine: raise HTTPException(status_code=500, detail="Pas de BDD")
    try:
        response = urllib.request.urlopen(request.url)
        f = io.StringIO(response.read().decode('utf-8'))
        reader = csv.DictReader(f, dialect=csv.Sniffer().sniff(f.read(1024))); f.seek(0)
        
        lenses_to_insert = []
        for row in reader:
            # ... (Logique de mapping identique v3.21) ...
            # Simplifiée pour la concision ici, mais identique fonctionnellement
            brand = get_val(row, ['MARQUE']) or 'GENERIQUE'
            raw_name = get_val(row, ['MODELE']) or 'Inconnu'
            if raw_name == 'Inconnu': continue
            
            lenses_to_insert.append({
                "brand": brand, "code": get_val(row, ['CODE']) or '', "name": raw_name,
                "geo": str(get_val(row, ['GEOMETRIE']) or '').upper(),
                "design": get_val(row, ['DESIGN']) or 'STANDARD',
                "idx": clean_index(get_val(row, ['INDICE'])),
                "mat": get_val(row, ['MATIERE']) or '', "coat": get_val(row, ['TRAITEMENT']) or 'DURCI',
                "flow": get_val(row, ['FLUX']) or '',
                "buy": clean_price(get_val(row, ['2*NETS'])),
                "selling": clean_price(get_val(row, ['KALIXIA'])),
                "p_kalixia": clean_price(get_val(row, ['KALIXIA'])),
                "p_itelis": clean_price(get_val(row, ['ITELIS'])),
                "p_cb": clean_price(get_val(row, ['CARTE BLANCHE'])),
                "p_seveane": clean_price(get_val(row, ['SEVEANE'])),
                "p_santeclair": clean_price(get_val(row, ['SANTECLAIR']))
            })

        if lenses_to_insert:
            with engine.begin() as conn:
                conn.execute(text("TRUNCATE TABLE lenses RESTART IDENTITY;"))
                conn.execute(text("""
                    INSERT INTO lenses (brand, commercial_code, name, geometry, design, index_mat, material, coating, commercial_flow, purchase_price, selling_price, sell_kalixia, sell_itelis, sell_carteblanche, sell_seveane, sell_santeclair)
                    VALUES (:brand, :code, :name, :geo, :design, :idx, :mat, :coat, :flow, :buy, :selling, :p_kalixia, :p_itelis, :p_cb, :p_seveane, :p_santeclair)
                """), lenses_to_insert)
            return {"status": "success", "count": len(lenses_to_insert)}
            
    except Exception as e: raise HTTPException(status_code=400, detail=str(e))

@app.get("/lenses")
def get_lenses(type_verre: str = Query(None, alias="type"), brand: str = Query(None)):
    if not engine: return []
    try:
        with engine.connect() as conn:
            sql = "SELECT * FROM lenses WHERE 1=1"
            params = {}
            if brand: sql += " AND brand ILIKE :brand"; params["brand"] = brand
            if type_verre: sql += " AND geometry ILIKE :geo"; params["geo"] = f"%{type_verre}%"
            sql += " ORDER BY purchase_price ASC LIMIT 3000"
            return [row._mapping for row in conn.execute(text(sql), params).fetchall()]
    except Exception: return []