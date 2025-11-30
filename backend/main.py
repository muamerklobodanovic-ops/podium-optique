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
        engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=300)
        with engine.begin() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS client_offers (
                    id SERIAL PRIMARY KEY, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    encrypted_identity TEXT, lens_details JSONB, financials JSONB
                );
            """))
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
    try:
        # Suppression de tous les caractères non numériques sauf . et ,
        s = str(value).replace('€', '').replace(' ', '').replace('\xa0', '').strip()
        s = s.replace(',', '.')
        return float(s)
    except: return 0.0

def clean_index(value):
    if not value: return "1.50"
    match = re.search(r"\d+\.?\d*", str(value).replace(',', '.'))
    return "{:.2f}".format(float(match.group(0))) if match else "1.50"

def clean_text(value): return str(value).strip() if value else ""

def get_col_idx(headers, candidates):
    for i, h in enumerate(headers):
        if h:
            h_str = str(h).upper().strip()
            # Nettoyage des accents pour la comparaison
            h_clean = h_str.replace('É', 'E').replace('È', 'E').replace('Ê', 'E')
            
            for c in candidates:
                c_clean = c.upper().replace('É', 'E').replace('È', 'E')
                if c_clean in h_clean: 
                    return i
    return -1

class OfferRequest(BaseModel): client: dict; lens: dict; finance: dict

# --- ROUTES ---
@app.get("/")
def read_root(): return {"status": "online", "version": "3.58", "msg": "Backend Import Intelligent V3"}

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

# --- UPLOAD AVANCÉ ---
@app.post("/upload-catalog")
async def upload_catalog(file: UploadFile = File(...)):
    print("🚀 Début requête upload...", flush=True)
    if not engine: raise HTTPException(500, "Serveur BDD déconnecté")
    
    temp_file = f"/tmp/upload_{int(datetime.now().timestamp())}.xlsx"
    print(f"📥 Réception fichier : {file.filename}", flush=True)
    
    try:
        with open(temp_file, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print("📖 Lecture Excel...", flush=True)
        wb = openpyxl.load_workbook(temp_file, data_only=True) 
        
        with engine.begin() as conn:
            print("♻️  Recréation de la table 'lenses'...", flush=True)
            conn.execute(text("DROP TABLE IF EXISTS lenses CASCADE;"))
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
        
        with engine.connect() as conn:
            for sheet_name in wb.sheetnames:
                sheet = wb[sheet_name]
                sheet_brand = sheet_name.strip().upper()
                print(f"   🔹 Traitement {sheet_brand}...", flush=True)

                rows = list(sheet.iter_rows(values_only=True))
                if not rows: 
                    print("      ⚠️ Feuille vide.", flush=True)
                    continue

                header_idx = -1
                headers = []
                
                # Scan large pour trouver l'en-tête
                for i, row in enumerate(rows[:30]):
                    row_str = [str(c).upper() for c in row if c]
                    # On cherche large : MODELE, LIBELLE, ou même juste PRIX et MARQUE
                    if any(k in s for s in row_str for k in ["MODELE", "MODÈLE", "LIBELLE", "NAME", "PRIX 2*NETS", "ACHAT"]):
                        headers = row
                        header_idx = i
                        print(f"      ✅ En-têtes trouvés ligne {i+1}: {[str(h).strip() for h in row if h][:5]}...", flush=True)
                        break
                
                # --- MAPPING ---
                c_nom = -1
                
                if header_idx != -1:
                    # Mapping par Nom
                    c_marque = get_col_idx(headers, ['MARQUE', 'BRAND'])
                    c_edi = get_col_idx(headers, ['CODE EDI', 'EDI'])
                    c_code = get_col_idx(headers, ['CODE COMMERCIAL', 'COMMERCIAL_CODE'])
                    c_nom = get_col_idx(headers, ['MODELE COMMERCIAL', 'MODELE', 'LIBELLE', 'NAME'])
                    c_geo = get_col_idx(headers, ['GÉOMETRIE', 'GEOMETRIE', 'TYPE'])
                    c_design = get_col_idx(headers, ['DESIGN', 'GAMME'])
                    c_idx = get_col_idx(headers, ['INDICE', 'INDEX'])
                    c_mat = get_col_idx(headers, ['MATIERE', 'MATIÈRE'])
                    c_coat = get_col_idx(headers, ['TRAITEMENT', 'COATING'])
                    c_flow = get_col_idx(headers, ['FLUX'])
                    c_color = get_col_idx(headers, ['COULEUR'])
                    c_buy = get_col_idx(headers, ['PRIX 2*NETS', 'PRIX', 'ACHAT'])
                    
                    c_kal = get_col_idx(headers, ['KALIXIA'])
                    c_ite = get_col_idx(headers, ['ITELIS'])
                    c_cb = get_col_idx(headers, ['CARTE BLANCHE'])
                    c_sev = get_col_idx(headers, ['SEVEANE'])
                    c_sant = get_col_idx(headers, ['SANTECLAIRE'])
                else:
                    # Mapping par POSITION (Plan B) si en-tête introuvable
                    print("      ⚠️ En-tête introuvable, tentative par position standard...", flush=True)
                    header_idx = 0 # On suppose que les données commencent ligne 2
                    c_marque = 0   # A
                    c_edi = 1      # B
                    c_code = 2     # C
                    c_nom = 3      # D (Modèle)
                    c_geo = 5      # F
                    c_design = 6   # G
                    c_idx = 7      # H
                    c_mat = 8      # I
                    c_coat = 9     # J
                    c_flow = 10    # K
                    c_color = 11   # L
                    c_buy = 12     # M (Prix Achat)
                    
                    c_kal = 15; c_ite = 16; c_cb = 17; c_sev = 18; c_sant = 19

                if c_nom == -1:
                    print("      ❌ Impossible de localiser la colonne 'MODÈLE'. Passage.", flush=True)
                    continue

                batch = []
                BATCH_SIZE = 100 

                for row in rows[header_idx+1:]:
                    # Sécurité index
                    if len(row) <= c_nom or not row[c_nom]: continue
                    
                    # Sécurité prix achat
                    buy = 0
                    if c_buy != -1 and len(row) > c_buy:
                        buy = clean_price(row[c_buy])
                    if buy <= 0: continue # On ignore les verres sans prix

                    brand = clean_text(row[c_marque]) if c_marque != -1 and len(row) > c_marque else sheet_brand
                    if not brand or brand == "None": brand = sheet_brand
                    
                    name = clean_text(row[c_nom])
                    mat = clean_text(row[c_mat]) if c_mat != -1 and len(row) > c_mat else ""
                    
                    # Ajout matière au nom si photochromique pour différencier
                    if any(x in mat.upper() for x in ['TRANS', 'GEN', 'SOLA', 'SUN']): name += f" {mat}"
                    
                    geo_raw = clean_text(row[c_geo]).upper() if c_geo != -1 and len(row) > c_geo else ""
                    ltype = 'UNIFOCAL'
                    if 'PROG' in geo_raw: ltype = 'PROGRESSIF'
                    elif 'DEGRESSIF' in geo_raw: ltype = 'DEGRESSIF'
                    elif 'MULTIFOCAL' in geo_raw: ltype = 'MULTIFOCAL'

                    # Helper extraction sécurisée
                    def get_val(idx): return clean_text(row[idx]) if idx != -1 and len(row) > idx else ""
                    def get_prc(idx): return clean_price(row[idx]) if idx != -1 and len(row) > idx else 0

                    lens = {
                        "brand": brand[:100], 
                        "edi": get_val(c_edi), "code": get_val(c_code), "name": name,
                        "geo": ltype, "design": get_val(c_design), "idx": clean_index(row[c_idx]) if c_idx != -1 and len(row) > c_idx else "1.50",
                        "mat": mat, "coat": get_val(c_coat), "flow": get_val(c_flow), "color": get_val(c_color),
                        "buy": buy, "selling": get_prc(c_kal), # Prix par défaut
                        "kal": get_prc(c_kal), "ite": get_prc(c_ite), "cb": get_prc(c_cb), "sev": get_prc(c_sev), "sant": get_prc(c_sant),
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
                        gc.collect()
                
                if batch:
                    with conn.begin():
                        conn.execute(text("""
                            INSERT INTO lenses (brand, edi_code, commercial_code, name, geometry, design, index_mat, material, coating, commercial_flow, color, purchase_price, selling_price, sell_kalixia, sell_itelis, sell_carteblanche, sell_seveane, sell_santeclair)
                            VALUES (:brand, :edi, :code, :name, :geo, :design, :idx, :mat, :coat, :flow, :color, :buy, :selling, :kal, :ite, :cb, :sev, :sant)
                        """), batch)
                    total_inserted += len(batch)
                    batch = []
        
        wb.close()
        if os.path.exists(temp_file): os.remove(temp_file)
        gc.collect()
        
        print(f"✅ TERMINE : {total_inserted} verres insérés.", flush=True)
        return {"status": "success", "count": total_inserted}

    except Exception as e:
        print(f"❌ ERREUR UPLOAD: {traceback.format_exc()}", flush=True)
        if os.path.exists(temp_file): os.remove(temp_file)
        raise HTTPException(500, f"Erreur traitement: {str(e)}")