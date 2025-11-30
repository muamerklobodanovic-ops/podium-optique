from fastapi import FastAPI, Query, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from pydantic import BaseModel
import os
import shutil
import json
import re
import gc
import traceback
import time
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
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    if "sslmode" not in DATABASE_URL:
        separator = "&" if "?" in DATABASE_URL else "?"
        DATABASE_URL += f"{separator}sslmode=require"

    try:
        # pool_pre_ping=True garde la connexion vivante
        engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=300)
        with engine.begin() as conn:
            # On crée les tables si elles n'existent pas, mais on ne force pas la suppression ici pour ne pas perdre les dossiers
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS client_offers (
                    id SERIAL PRIMARY KEY, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    encrypted_identity TEXT, lens_details JSONB, financials JSONB
                );
            """))
            # Pour lenses, on s'assure juste qu'elle existe pour le démarrage, le refresh se fera à l'upload
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS lenses (
                    id SERIAL PRIMARY KEY, brand TEXT, name TEXT, purchase_price DECIMAL(10,2)
                );
            """))
    except Exception as e:
        print(f"❌ ERREUR BDD STARTUP: {e}")
        engine = None

# --- OUTILS ---
def encrypt_dict(data): return cipher.encrypt(json.dumps(data).encode()).decode()
def decrypt_dict(token): 
    try: return json.loads(cipher.decrypt(token.encode()).decode())
    except: return {"name": "Donnée", "firstname": "Illisible", "dob": "?"}

def clean_price(value):
    if not value or value == '' or value == '-': return 0.0
    try: return float(str(value).replace('€', '').replace('â‚¬', '').replace('%', '').replace(' ', '').replace(',', '.'))
    except: return 0.0

def clean_index(value):
    if not value: return "1.50"
    match = re.search(r"\d+\.?\d*", str(value).replace(',', '.'))
    return "{:.2f}".format(float(match.group(0))) if match else "1.50"

def clean_text(value): return str(value).strip() if value else ""

def get_col_idx(headers, candidates):
    for i, h in enumerate(headers):
        if h and any(c.upper() in str(h).upper().strip() for c in candidates): return i
    return -1

class OfferRequest(BaseModel): client: dict; lens: dict; finance: dict

# --- ROUTES ---
@app.get("/")
def read_root(): return {"status": "online", "version": "3.52"}

@app.post("/offers")
def save_offer(offer: OfferRequest):
    if not engine: raise HTTPException(500, "Pas de connexion BDD")
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

@app.get("/lenses")
def get_lenses(type: str = Query(None), brand: str = Query(None)):
    if not engine: return []
    try:
        with engine.connect() as conn:
            # Si la table n'a pas les bonnes colonnes (suite à un crash précédent), ça peut échouer ici
            # On fait un SELECT simple
            sql = "SELECT * FROM lenses WHERE 1=1"
            params = {}
            if brand: sql += " AND brand ILIKE :brand"; params["brand"] = brand
            if type: 
                if "INTERIEUR" in type.upper(): sql += " AND (geometry ILIKE '%INTERIEUR%' OR geometry ILIKE '%DEGRESSIF%')"
                else: sql += " AND geometry ILIKE :geo"; params["geo"] = f"%{type}%"
            sql += " ORDER BY purchase_price ASC LIMIT 3000"
            
            rows = conn.execute(text(sql), params).fetchall()
            return [row._mapping for row in rows]
    except Exception as e:
        print(f"❌ Erreur Lecture Verres: {e}")
        return []

# --- UPLOAD ROBUSTE (RECRÉATION TABLE) ---
@app.post("/upload-catalog")
async def upload_catalog(file: UploadFile = File(...)):
    if not engine: raise HTTPException(500, "Serveur BDD déconnecté")
    
    # Fichier temporaire
    temp_file = f"/tmp/upload_{int(datetime.now().timestamp())}.xlsx"
    print(f"📥 Réception fichier : {file.filename}")
    
    try:
        with open(temp_file, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print("📖 Lecture Excel...")
        wb = openpyxl.load_workbook(temp_file, read_only=True, data_only=True)
        
        # 1. On prépare la connexion et on vide la table AVANT de lire (pour être sûr de la structure)
        with engine.begin() as conn:
            print("♻️  Recréation de la table 'lenses'...")
            conn.execute(text("DROP TABLE IF EXISTS lenses CASCADE;"))
            # Utilisation de TEXT partout pour éviter les limites de taille
            conn.execute(text("""
                CREATE TABLE lenses (
                    id SERIAL PRIMARY KEY,
                    brand TEXT, edi_code TEXT, commercial_code TEXT, name TEXT,
                    geometry TEXT, design TEXT, index_mat TEXT,
                    material TEXT, coating TEXT, commercial_flow TEXT, color TEXT,
                    purchase_price DECIMAL(10,2), selling_price DECIMAL(10,2),
                    sell_kalixia DECIMAL(10,2), sell_itelis DECIMAL(10,2),
                    sell_carteblanche DECIMAL(10,2), sell_seveane DECIMAL(10,2),
                    sell_santeclair DECIMAL(10,2)
                );
            """))
        
        total_inserted = 0
        
        # 2. Lecture et Insertion par petits paquets
        with engine.connect() as conn:
            for sheet_name in wb.sheetnames:
                sheet = wb[sheet_name]
                sheet_brand = sheet_name.strip().upper()
                
                row_iterator = sheet.iter_rows(values_only=True)
                try: headers = next(row_iterator)
                except: continue

                # Mapping
                c_nom = get_col_idx(headers, ['MODELE COMMERCIAL', 'MODELE'])
                if c_nom == -1: continue
                
                c_marque = get_col_idx(headers, ['MARQUE'])
                c_edi = get_col_idx(headers, ['CODE EDI'])
                c_code = get_col_idx(headers, ['CODE COMMERCIAL'])
                c_geo = get_col_idx(headers, ['GÉOMETRIE', 'GEOMETRIE'])
                c_design = get_col_idx(headers, ['DESIGN'])
                c_idx = get_col_idx(headers, ['INDICE'])
                c_mat = get_col_idx(headers, ['MATIERE'])
                c_coat = get_col_idx(headers, ['TRAITEMENT'])
                c_flow = get_col_idx(headers, ['FLUX'])
                c_color = get_col_idx(headers, ['COULEUR'])
                c_buy = get_col_idx(headers, ['PRIX 2*NETS'])
                c_kal = get_col_idx(headers, ['KALIXIA'])
                c_ite = get_col_idx(headers, ['ITELIS'])
                c_cb = get_col_idx(headers, ['CARTE BLANCHE'])
                c_sev = get_col_idx(headers, ['SEVEANE'])
                c_sant = get_col_idx(headers, ['SANTECLAIRE'])

                batch = []
                # Petit batch pour économiser la RAM du serveur gratuit
                BATCH_SIZE = 200 

                for row in row_iterator:
                    if not row[c_nom]: continue
                    
                    buy = clean_price(row[c_buy]) if c_buy != -1 else 0
                    if buy <= 0: continue

                    brand = clean_text(row[c_marque]) if c_marque != -1 else sheet_brand
                    if not brand: brand = sheet_brand
                    
                    name = clean_text(row[c_nom])
                    mat = clean_text(row[c_mat]) if c_mat != -1 else ""
                    if any(x in mat.upper() for x in ['TRANS', 'GEN', 'SOLA']): name += f" {mat}"
                    
                    geo_raw = clean_text(row[c_geo]).upper() if c_geo != -1 else ""
                    ltype = 'UNIFOCAL'
                    if 'PROG' in geo_raw: ltype = 'PROGRESSIF'
                    elif 'DEGRESSIF' in geo_raw: ltype = 'DEGRESSIF'
                    elif 'MULTIFOCAL' in geo_raw: ltype = 'MULTIFOCAL'

                    lens = {
                        "brand": brand, 
                        "edi": clean_text(row[c_edi]) if c_edi != -1 else "",
                        "code": clean_text(row[c_code]) if c_code != -1 else "",
                        "name": name,
                        "geo": ltype,
                        "design": clean_text(row[c_design]) if c_design != -1 else "STANDARD",
                        "idx": clean_index(row[c_idx]) if c_idx != -1 else "1.50",
                        "mat": mat,
                        "coat": clean_text(row[c_coat]) if c_coat != -1 else "DURCI",
                        "flow": clean_text(row[c_flow]) if c_flow != -1 else "FAB",
                        "color": clean_text(row[c_color]) if c_color != -1 else "",
                        "buy": buy,
                        "selling": clean_price(row[c_kal]) if c_kal != -1 else 0,
                        "kal": clean_price(row[c_kal]) if c_kal != -1 else 0,
                        "ite": clean_price(row[c_ite]) if c_ite != -1 else 0,
                        "cb": clean_price(row[c_cb]) if c_cb != -1 else 0,
                        "sev": clean_price(row[c_sev]) if c_sev != -1 else 0,
                        "sant": clean_price(row[c_sant]) if c_sant != -1 else 0,
                    }
                    batch.append(lens)

                    if len(batch) >= BATCH_SIZE:
                        with conn.begin():
                            conn.execute(text("""
                                INSERT INTO lenses (brand, edi_code, commercial_code, name, geometry, design, index_mat, material, coating, commercial_flow, color, purchase_price, selling_price, sell_kalixia, sell_itelis, sell_carteblanche, sell_seveane, sell_santeclair)
                                VALUES (:brand, :edi, :code, :name, :geo, :design, :idx, :mat, :coat, :flow, :color, :buy, :selling, :kal, :ite, :cb, :sev, :sant)
                            """), batch)
                        total_inserted += len(batch)
                        batch = []
                
                # Dernier lot
                if batch:
                    with conn.begin():
                        conn.execute(text("""
                            INSERT INTO lenses (brand, edi_code, commercial_code, name, geometry, design, index_mat, material, coating, commercial_flow, color, purchase_price, selling_price, sell_kalixia, sell_itelis, sell_carteblanche, sell_seveane, sell_santeclair)
                            VALUES (:brand, :edi, :code, :name, :geo, :design, :idx, :mat, :coat, :flow, :color, :buy, :selling, :kal, :ite, :cb, :sev, :sant)
                        """), batch)
                    total_inserted += len(batch)
        
        wb.close()
        if os.path.exists(temp_file): os.remove(temp_file)
        gc.collect()
        
        print(f"✅ TERMINE : {total_inserted} verres insérés.")
        return {"status": "success", "count": total_inserted}

    except Exception as e:
        print(f"❌ ERREUR UPLOAD: {traceback.format_exc()}")
        if os.path.exists(temp_file): os.remove(temp_file)
        raise HTTPException(500, f"Erreur traitement: {str(e)}")