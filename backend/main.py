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
        clean_str = str(value).replace('€', '').replace('â‚¬', '').replace('%', '').replace(' ', '').replace('\xa0', '').replace(',', '.')
        return float(clean_str)
    except: return 0.0

def clean_index(value):
    if not value: return "1.50"
    match = re.search(r"\d+\.?\d*", str(value).replace(',', '.'))
    return "{:.2f}".format(float(match.group(0))) if match else "1.50"

def clean_text(value): return str(value).strip() if value else ""

# NOUVEAU : FONCTION DE NORMALISATION PUISSANTE
def normalize_string(text):
    if not text: return ""
    # 1. Majuscules
    text = str(text).upper().strip()
    # 2. Suppression des accents courants
    replacements = {
        'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
        'À': 'A', 'Â': 'A', 'Ä': 'A',
        'Î': 'I', 'Ï': 'I',
        'Ô': 'O', 'Ö': 'O',
        'Ù': 'U', 'Û': 'U', 'Ü': 'U',
        'Ç': 'C', "’": "'", "‘": "'"
    }
    for acc, char in replacements.items():
        text = text.replace(acc, char)
    return text

def get_col_idx(headers, candidates):
    for i, h in enumerate(headers):
        if h:
            h_str = normalize_string(h) # On normalise aussi les en-têtes pour la recherche
            for c in candidates:
                if normalize_string(c) in h_str: 
                    return i
    return -1

class OfferRequest(BaseModel): client: dict; lens: dict; finance: dict

# --- ROUTES ---

@app.get("/")
def read_root(): return {"status": "online", "version": "3.74", "msg": "Backend Limit RAM Fix"}

@app.head("/")
def read_root_head():
    return read_root()

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
def get_lenses(
    type: str = Query(None), 
    brand: str = Query(None),
    limit: int = Query(300) # RÉDUCTION IMPORTANTE (2000 -> 300) pour éviter le crash RAM
):
    if not engine: return []
    try:
        with engine.connect() as conn:
            sql = "SELECT * FROM lenses WHERE 1=1"
            params = {}
            
            if brand: 
                sql += " AND brand ILIKE :brand"
                params["brand"] = brand
            
            if type: 
                # Mapping Frontend -> Backend (Le frontend demande 'INTERIEUR', la BDD a 'INTERIEUR')
                # On normalise aussi la requête au cas où
                type_norm = normalize_string(type)
                
                if "INTERIEUR" in type_norm or "DEGRESSIF" in type_norm: 
                    # On cherche tout ce qui ressemble à Interieur ou Degressif
                    sql += " AND (geometry = 'INTERIEUR' OR geometry = 'DEGRESSIF')"
                elif "PROGRESSIF" in type_norm:
                    # On exclut explicitement INTERIEUR pour ne pas avoir de doublons si "Progressif d'intérieur"
                    sql += " AND geometry = 'PROGRESSIF'"
                elif "UNIFOCAL" in type_norm:
                    sql += " AND geometry = 'UNIFOCAL'"
                elif "MULTIFOCAL" in type_norm:
                    sql += " AND geometry = 'MULTIFOCAL'"
                else:
                    # Fallback générique
                    sql += " AND geometry ILIKE :geo"
                    params["geo"] = f"%{type}%"
            
            # Limite stricte pour protéger la RAM
            safe_limit = min(limit, 500) # Plafond absolu à 500
            sql += f" ORDER BY purchase_price ASC LIMIT {safe_limit}"
            
            rows = conn.execute(text(sql), params).fetchall()
            
            result = [{
                "id": r.id,
                "brand": r.brand,
                "name": r.name,
                "commercial_code": r.commercial_code,
                "type": r.geometry,
                "geometry": r.geometry,
                "design": r.design,
                "index_mat": r.index_mat,
                "material": r.material,
                "coating": r.coating,
                "commercial_flow": r.commercial_flow,
                "color": r.color,
                "purchase_price": float(r.purchase_price or 0),
                "sellingPrice": float(r.selling_price or 0),
                "sell_kalixia": float(r.sell_kalixia or 0),
                "sell_itelis": float(r.sell_itelis or 0),
                "sell_carteblanche": float(r.sell_carteblanche or 0),
                "sell_seveane": float(r.sell_seveane or 0),
                "sell_santeclair": float(r.sell_santeclair or 0),
            } for r in rows]
            
            # Nettoyage explicite
            del rows
            gc.collect()
            
            return result

    except Exception as e:
        print(f"❌ Erreur Lecture Verres: {e}")
        return []

# --- UPLOAD ROBUSTE (NORMALISATION) ---
@app.post("/upload-catalog")
def upload_catalog(file: UploadFile = File(...)):
    print("🚀 Début requête upload (Threaded)...", flush=True)
    if not engine: raise HTTPException(500, "Serveur BDD déconnecté")
    
    temp_file = f"/tmp/upload_{int(datetime.now().timestamp())}.xlsx"
    print(f"📥 Réception fichier : {file.filename}", flush=True)
    
    try:
        with open(temp_file, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print("📖 Lecture Excel...", flush=True)
        wb = openpyxl.load_workbook(temp_file, data_only=True, read_only=True)
        
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

                row_iterator = sheet.iter_rows(values_only=True)
                header_idx = -1
                headers = []
                
                current_row_idx = 0
                for row in row_iterator:
                    current_row_idx += 1
                    if current_row_idx > 30: break
                    row_str = [str(c).upper() for c in row if c]
                    if any(k in s for s in row_str for k in ["MODELE", "MODÈLE", "LIBELLE", "NAME", "PRIX", "PURCHASE_PRICE"]):
                        headers = row
                        header_idx = current_row_idx
                        print(f"      ✅ En-têtes trouvés ligne {current_row_idx}", flush=True)
                        break
                
                if not headers: continue

                # Mapping
                c_nom = get_col_idx(headers, ['MODELE COMMERCIAL', 'MODELE', 'LIBELLE', 'NAME'])
                c_marque = get_col_idx(headers, ['MARQUE', 'BRAND'])
                c_edi = get_col_idx(headers, ['CODE EDI', 'EDI'])
                c_code = get_col_idx(headers, ['CODE COMMERCIAL', 'COMMERCIAL_CODE'])
                c_geo = get_col_idx(headers, ['GÉOMETRIE', 'GEOMETRIE', 'TYPE', 'GEOMETRY'])
                c_design = get_col_idx(headers, ['DESIGN', 'GAMME'])
                c_idx = get_col_idx(headers, ['INDICE', 'INDEX', 'INDEX_MAT'])
                c_mat = get_col_idx(headers, ['MATIERE', 'MATIÈRE', 'MATERIAL'])
                c_coat = get_col_idx(headers, ['TRAITEMENT', 'COATING'])
                c_flow = get_col_idx(headers, ['FLUX', 'COMMERCIAL_FLOW'])
                c_color = get_col_idx(headers, ['COULEUR', 'COLOR'])
                c_buy = get_col_idx(headers, ['PRIX 2*NETS', 'PRIX', 'ACHAT', 'PURCHASE_PRICE'])
                
                c_kal = get_col_idx(headers, ['KALIXIA', 'SELL_KALIXIA'])
                c_ite = get_col_idx(headers, ['ITELIS', 'SELL_ITELIS'])
                c_cb = get_col_idx(headers, ['CARTE BLANCHE', 'SELL_CARTEBLANCHE'])
                c_sev = get_col_idx(headers, ['SEVEANE', 'SELL_SEVEANE'])
                c_sant = get_col_idx(headers, ['SANTECLAIRE', 'SANTECLAIR', 'SELL_SANTECLAIR'])

                if c_nom == -1: continue

                batch = []
                BATCH_SIZE = 100 

                for row in row_iterator:
                    if not row[c_nom]: continue
                    
                    buy = clean_price(row[c_buy]) if c_buy != -1 else 0
                    
                    brand = clean_text(row[c_marque]) if c_marque != -1 else sheet_brand
                    if not brand or brand == "None": brand = sheet_brand
                    
                    name = clean_text(row[c_nom])
                    # Utilisation de la fonction de normalisation (SANS ACCENTS)
                    name_norm = normalize_string(name)
                    
                    mat = clean_text(row[c_mat]) if c_mat != -1 else ""
                    if any(x in mat.upper() for x in ['TRANS', 'GEN', 'SOLA', 'SUN']): name += f" {mat}"
                    
                    # Normalisation de la Géométrie
                    geo_raw = clean_text(row[c_geo]) if c_geo != -1 else ""
                    geo_norm = normalize_string(geo_raw) # ex: "DÉGRESSIF" -> "DEGRESSIF"

                    design_val = clean_text(row[c_design]) if c_design != -1 else "STANDARD"
                    design_norm = normalize_string(design_val)
                    
                    code = clean_text(row[c_code]) if c_code != -1 else ""
                    code_norm = normalize_string(code)

                    # --- LOGIQUE DE CLASSIFICATION ROBUSTE ---
                    ltype = 'UNIFOCAL' # Par défaut
                    
                    # 1. Check explicite sur la colonne géométrie (prioritaire si "INTÉRIEUR" ou "DÉGRESSIF")
                    if 'INTERIEUR' in geo_norm or 'DEGRESSIF' in geo_norm:
                        ltype = 'INTERIEUR'
                    elif 'PROG' in geo_norm:
                        ltype = 'PROGRESSIF'
                    elif 'MULTIFOCAL' in geo_norm:
                        ltype = 'MULTIFOCAL'
                    
                    # 2. Correction Spécifique (Proxeo / MyProxi)
                    # On cherche "PROXEO" ou "MYPROXI" partout (Nom, Design, Code)
                    # On retire les espaces pour matcher "MY PROXI" avec "MYPROXI"
                    full_search = (name_norm + design_norm + code_norm).replace(' ', '')
                    
                    if 'PROXEO' in full_search:
                        ltype = 'INTERIEUR' # Force INTERIEUR pour Proxeo
                    elif 'MYPROXI' in full_search:
                        ltype = 'INTERIEUR' # Force INTERIEUR pour MyProxi

                    if buy <= 0:
                         buy = clean_price(row[c_kal]) if c_kal != -1 else 0

                    lens = {
                        "brand": brand[:100], 
                        "edi": clean_text(row[c_edi]) if c_edi != -1 else "",
                        "code": code,
                        "name": name,
                        "geo": ltype, # Type final normalisé
                        "design": design_val,
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
                        gc.collect()
                        time.sleep(0.01) 
                
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
        
        print(f"✅ TERMINE : {total_inserted} verres insérés.", flush=True)
        return {"status": "success", "count": total_inserted, "message": f"Import réussi : {total_inserted} verres."}

    except Exception as e:
        print(f"❌ ERREUR UPLOAD: {traceback.format_exc()}", flush=True)
        if os.path.exists(temp_file): os.remove(temp_file)
        raise HTTPException(500, f"Erreur traitement: {str(e)}")