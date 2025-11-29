from fastapi import FastAPI, Query, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from pydantic import BaseModel
import os
import shutil
import json
import re
from datetime import datetime
from dotenv import load_dotenv
from cryptography.fernet import Fernet
import openpyxl

# 1. Configuration
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", Fernet.generate_key().decode())
cipher = Fernet(ENCRYPTION_KEY.encode())

app = FastAPI()

# 2. Sécurité
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Connexion BDD
engine = None
if DATABASE_URL:
    try:
        if DATABASE_URL.startswith("postgres://"):
            DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        engine = create_engine(DATABASE_URL)
        
        # Initialisation des tables
        with engine.begin() as conn:
            # Table Catalogue (Adaptée à votre fichier Excel)
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS lenses (
                    id SERIAL PRIMARY KEY,
                    brand VARCHAR(50),             -- MARQUE
                    edi_code VARCHAR(50),          -- CODE EDI
                    commercial_code VARCHAR(50),   -- CODE COMMERCIAL
                    name VARCHAR(200),             -- MODELE COMMERCIAL
                    geometry VARCHAR(100),         -- GÉOMETRIE
                    design VARCHAR(100),           -- DESIGN
                    index_mat VARCHAR(20),         -- INDICE
                    material VARCHAR(100),         -- MATIERE
                    coating VARCHAR(100),          -- TRAITEMENT
                    commercial_flow VARCHAR(50),   -- FLUX COMMERCIAL
                    color VARCHAR(100),            -- COULEUR
                    purchase_price DECIMAL(10,2),  -- PRIX 2*NETS
                    selling_price DECIMAL(10,2),   -- PRIX CALCULE (Optionnel)
                    sell_kalixia DECIMAL(10,2),    -- KALIXIA
                    sell_itelis DECIMAL(10,2),     -- ITELIS
                    sell_carteblanche DECIMAL(10,2), -- CARTE BLANCHE
                    sell_seveane DECIMAL(10,2),    -- SEVEANE
                    sell_santeclair DECIMAL(10,2)  -- SANTECLAIRE
                );
            """))
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS client_offers (
                    id SERIAL PRIMARY KEY,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    encrypted_identity TEXT,
                    lens_details JSONB,
                    financials JSONB
                );
            """))
    except Exception as e:
        print(f"❌ ERREUR BDD: {e}")
        engine = None

# --- OUTILS ---
def encrypt_dict(data): return cipher.encrypt(json.dumps(data).encode()).decode()
def decrypt_dict(token): 
    try: return json.loads(cipher.decrypt(token.encode()).decode())
    except: return {"name": "Donnée", "firstname": "Illisible", "dob": "?"}

def clean_price(value):
    if not value or value == '' or value == '-': return 0.0
    try: return float(str(value).replace('€', '').replace('â‚¬', '').replace('%', '').replace(' ', '').replace(',', '.'))
    except ValueError: return 0.0

def clean_index(value):
    if not value: return "1.50"
    match = re.search(r"\d+\.?\d*", str(value).replace(',', '.'))
    return "{:.2f}".format(float(match.group(0))) if match else "1.50"

def clean_text(value):
    return str(value).strip() if value else ""

def get_col_idx(headers, candidates):
    for i, h in enumerate(headers):
        if h and any(c.upper() == str(h).upper().strip() for c in candidates): return i
    return -1

class OfferRequest(BaseModel): client: dict; lens: dict; finance: dict

# --- ROUTES ---
@app.get("/")
def read_root(): return {"status": "online", "version": "3.40", "msg": "Backend à jour"}

@app.post("/offers")
def save_offer(offer: OfferRequest):
    if not engine: raise HTTPException(500, "DB Error")
    try:
        with engine.begin() as conn:
            conn.execute(text("INSERT INTO client_offers (encrypted_identity, lens_details, financials) VALUES (:ident, :lens, :fin)"), 
                {"ident": encrypt_dict(offer.client), "lens": json.dumps(offer.lens), "fin": json.dumps(offer.finance)})
        return {"status": "success"}
    except Exception as e: raise HTTPException(500, str(e))

@app.get("/offers")
def get_offers():
    if not engine: return []
    try:
        with engine.connect() as conn:
            res = conn.execute(text("SELECT * FROM client_offers ORDER BY created_at DESC LIMIT 50"))
            return [{"id":r.id, "date":r.created_at.strftime("%d/%m/%Y %H:%M"), "client":decrypt_dict(r.encrypted_identity), "lens":r.lens_details, "finance":r.financials} for r in res.fetchall()]
    except: return []

# --- LECTURE CATALOGUE ---
@app.get("/lenses")
def get_lenses(type: str = Query(None), brand: str = Query(None)):
    if not engine: return []
    try:
        with engine.connect() as conn:
            sql = "SELECT * FROM lenses WHERE 1=1"
            params = {}
            
            if brand: 
                sql += " AND brand ILIKE :brand"
                params["brand"] = brand
            
            if type: 
                if "INTERIEUR" in type.upper(): 
                    sql += " AND (geometry ILIKE '%INTERIEUR%' OR geometry ILIKE '%DEGRESSIF%')"
                else: 
                    sql += " AND geometry ILIKE :geo"
                    params["geo"] = f"%{type}%"
            
            sql += " ORDER BY purchase_price ASC LIMIT 3000"
            
            rows = conn.execute(text(sql), params).fetchall()
            
            # Mapping pour le Frontend (Adapter les noms de colonnes)
            return [{
                "id": r.id,
                "brand": r.brand,
                "name": r.name,
                "commercial_code": r.commercial_code,
                "type": r.geometry, # Le frontend attend "type"
                "design": r.design,
                "index_mat": r.index_mat,
                "material": r.material,
                "coating": r.coating,
                "commercial_flow": r.commercial_flow,
                "purchase_price": float(r.purchase_price or 0),
                "sellingPrice": float(r.selling_price or 0), # Prix par défaut
                "sell_kalixia": float(r.sell_kalixia or 0),
                "sell_itelis": float(r.sell_itelis or 0),
                "sell_carteblanche": float(r.sell_carteblanche or 0),
                "sell_seveane": float(r.sell_seveane or 0),
                "sell_santeclair": float(r.sell_santeclair or 0),
            } for r in rows]

    except Exception as e:
        print(f"❌ ERREUR SQL: {e}")
        return []

# --- UPLOAD EXCEL (NOUVELLE STRUCTURE) ---
@app.post("/upload-catalog")
async def upload_catalog(file: UploadFile = File(...)):
    if not engine: raise HTTPException(500, "Pas de BDD")
    
    temp_file = f"temp_{file.filename}"
    try:
        with open(temp_file, "wb") as buffer: shutil.copyfileobj(file.file, buffer)
        wb = openpyxl.load_workbook(temp_file, data_only=True)
        
        lenses_to_insert = []
        
        for sheet_name in wb.sheetnames:
            sheet = wb[sheet_name]
            current_brand = sheet_name.strip().upper()
            
            rows = list(sheet.iter_rows(values_only=True))
            if not rows: continue
            
            headers = rows[0]
            
            # Mapping exact selon votre demande
            c_marque = get_col_idx(headers, ['MARQUE'])
            c_edi = get_col_idx(headers, ['CODE EDI'])
            c_code = get_col_idx(headers, ['CODE COMMERCIAL'])
            c_name = get_col_idx(headers, ['MODELE COMMERCIAL', 'MODELE'])
            c_geo = get_col_idx(headers, ['GÉOMETRIE', 'GEOMETRIE'])
            c_design = get_col_idx(headers, ['DESIGN'])
            c_idx = get_col_idx(headers, ['INDICE'])
            c_mat = get_col_idx(headers, ['MATIERE'])
            c_coat = get_col_idx(headers, ['TRAITEMENT'])
            c_flow = get_col_idx(headers, ['FLUX COMMERCIAL', 'FLUX'])
            c_color = get_col_idx(headers, ['COULEUR'])
            c_buy = get_col_idx(headers, ['PRIX 2*NETS', '2*NETS'])
            
            # Prix Réseaux
            c_kal = get_col_idx(headers, ['KALIXIA'])
            c_ite = get_col_idx(headers, ['ITELIS'])
            c_cb = get_col_idx(headers, ['CARTE BLANCHE'])
            c_sev = get_col_idx(headers, ['SEVEANE'])
            c_sant = get_col_idx(headers, ['SANTECLAIRE', 'SANTECLAIR'])
            
            if c_name == -1: continue

            for row in rows[1:]:
                if not row[c_name]: continue
                
                # Logique : Colonne A prioritaire, sinon nom onglet
                brand = clean_text(row[c_marque]) if c_marque != -1 else current_brand
                if not brand: brand = current_brand
                
                raw_geo = clean_text(row[c_geo]).upper() if c_geo != -1 else "UNIFOCAL"
                
                mat = clean_text(row[c_mat]) if c_mat != -1 else ""
                name = clean_text(row[c_name])
                
                # Ajout matière au nom si photochromique
                if any(x in mat.upper() for x in ['TRANS', 'GEN', 'SOLA', 'SUN']):
                    name = f"{name} {mat}"

                purchase = clean_price(row[c_buy]) if c_buy != -1 else 0
                
                # On utilise le prix Kalixia comme "Prix Public" par défaut s'il n'y en a pas d'autre
                selling = clean_price(row[c_kal]) if c_kal != -1 else 0

                if purchase > 0:
                    lenses_to_insert.append({
                        "brand": brand,
                        "edi": clean_text(row[c_edi]) if c_edi != -1 else "",
                        "code": clean_text(row[c_code]) if c_code != -1 else "",
                        "name": name,
                        "geo": raw_geo,
                        "design": clean_text(row[c_design]) if c_design != -1 else "STANDARD",
                        "idx": clean_index(row[c_idx]) if c_idx != -1 else "1.50",
                        "mat": mat,
                        "coat": clean_text(row[c_coat]) if c_coat != -1 else "DURCI",
                        "flow": clean_text(row[c_flow]) if c_flow != -1 else "FAB",
                        "color": clean_text(row[c_color]) if c_color != -1 else "",
                        "buy": purchase,
                        "selling": selling,
                        "p_kal": clean_price(row[c_kal]) if c_kal != -1 else 0,
                        "p_ite": clean_price(row[c_ite]) if c_ite != -1 else 0,
                        "p_cb": clean_price(row[c_cb]) if c_cb != -1 else 0,
                        "p_sev": clean_price(row[c_sev]) if c_sev != -1 else 0,
                        "p_sant": clean_price(row[c_sant]) if c_sant != -1 else 0,
                    })

        if lenses_to_insert:
            with engine.begin() as conn:
                conn.execute(text("DROP TABLE IF EXISTS lenses CASCADE;"))
                conn.execute(text("""
                    CREATE TABLE lenses (
                        id SERIAL PRIMARY KEY, brand VARCHAR(50), edi_code VARCHAR(50), commercial_code VARCHAR(50),
                        name VARCHAR(200), geometry VARCHAR(100), design VARCHAR(100), index_mat VARCHAR(20),
                        material VARCHAR(100), coating VARCHAR(100), commercial_flow VARCHAR(50), color VARCHAR(100),
                        purchase_price DECIMAL(10,2), selling_price DECIMAL(10,2),
                        sell_kalixia DECIMAL(10,2), sell_itelis DECIMAL(10,2),
                        sell_carteblanche DECIMAL(10,2), sell_seveane DECIMAL(10,2), sell_santeclair DECIMAL(10,2)
                    );
                """))
                stmt = text("""
                    INSERT INTO lenses (
                        brand, edi_code, commercial_code, name, geometry, design, index_mat, material, coating, 
                        commercial_flow, color, purchase_price, selling_price, 
                        sell_kalixia, sell_itelis, sell_carteblanche, sell_seveane, sell_santeclair
                    ) VALUES (
                        :brand, :edi, :code, :name, :geo, :design, :idx, :mat, :coat, 
                        :flow, :color, :buy, :selling, 
                        :p_kal, :p_ite, :p_cb, :p_sev, :p_sant
                    )
                """)
                conn.execute(stmt, lenses_to_insert)
            
            os.remove(temp_file)
            return {"status": "success", "count": len(lenses_to_insert)}
        
        os.remove(temp_file)
        return {"status": "error", "message": "Aucune donnée trouvée."}

    except Exception as e:
        if os.path.exists(temp_file): os.remove(temp_file)
        raise HTTPException(400, str(e))