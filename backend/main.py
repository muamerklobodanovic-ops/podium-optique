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
import openpyxl  # Indispensable pour lire les fichiers .xlsx

# 1. Configuration
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# Clé de chiffrement pour les données clients (GDPR)
# En prod, cette clé doit être fixée dans les variables d'environnement
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
        
        with engine.begin() as conn:
            # Table Catalogue (Verres)
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS lenses (
                    id SERIAL PRIMARY KEY,
                    brand VARCHAR(50),
                    commercial_code VARCHAR(50),
                    name VARCHAR(200),
                    geometry VARCHAR(100),
                    design VARCHAR(100),
                    index_mat VARCHAR(20),
                    material VARCHAR(100),
                    coating VARCHAR(100),
                    commercial_flow VARCHAR(50),
                    purchase_price DECIMAL(10,2),
                    selling_price DECIMAL(10,2),
                    sell_kalixia DECIMAL(10,2),
                    sell_itelis DECIMAL(10,2),
                    sell_carteblanche DECIMAL(10,2),
                    sell_seveane DECIMAL(10,2),
                    sell_santeclair DECIMAL(10,2)
                );
            """))
            
            # Table Dossiers Clients (Devis)
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS client_offers (
                    id SERIAL PRIMARY KEY,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    encrypted_identity TEXT,
                    lens_details JSONB,
                    financials JSONB
                );
            """))
            print("✅ Base de données prête.")
            
    except Exception as e:
        print(f"❌ ERREUR CRITIQUE BDD: {e}")
        engine = None

# --- OUTILS ---
def encrypt_dict(data: dict) -> str:
    return cipher.encrypt(json.dumps(data).encode()).decode()

def decrypt_dict(token: str) -> dict:
    try:
        return json.loads(cipher.decrypt(token.encode()).decode())
    except:
        return {"name": "Donnée", "firstname": "Illisible", "dob": "?"}

def clean_price(value):
    if not value or value == '' or value == '-': return 0.0
    try:
        return float(str(value).replace('€', '').replace('â‚¬', '').replace('%', '').replace(' ', '').replace(',', '.'))
    except ValueError: return 0.0

def clean_index(value):
    if not value: return "1.50"
    match = re.search(r"\d+\.?\d*", str(value).replace(',', '.'))
    return "{:.2f}".format(float(match.group(0))) if match else "1.50"

# Fonction pour trouver l'index d'une colonne par son nom
def get_col_idx(headers, candidates):
    for i, h in enumerate(headers):
        if h and any(c.upper() in str(h).upper() for c in candidates):
            return i
    return -1

# --- MODELES ---
class OfferRequest(BaseModel):
    client: dict
    lens: dict
    finance: dict

# --- ROUTES ---

@app.get("/")
def read_root():
    return {"status": "online", "version": "3.27", "message": "API Optique opérationnelle"}

# 1. Sauvegarde Dossier
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

# 2. Lecture Dossiers
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

# 3. UPLOAD CATALOGUE EXCEL (NOUVEAU)
@app.post("/upload-catalog")
async def upload_catalog(file: UploadFile = File(...)):
    if not engine: raise HTTPException(status_code=500, detail="Pas de connexion BDD")
    
    print(f"🚀 Réception du fichier : {file.filename}")
    
    try:
        # Sauvegarde temporaire du fichier
        temp_filename = f"temp_{file.filename}"
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Lecture du fichier Excel
        wb = openpyxl.load_workbook(temp_filename, data_only=True)
        lenses_to_insert = []
        
        # Parcours des onglets (1 onglet = 1 marque)
        for sheet_name in wb.sheetnames:
            sheet = wb[sheet_name]
            current_brand = sheet_name.strip().upper() # Nom de l'onglet = Marque
            print(f"   🔹 Traitement onglet : {current_brand}")
            
            rows = list(sheet.iter_rows(values_only=True))
            if not rows: continue
            
            headers = rows[0] # Première ligne = En-têtes
            
            # Repérage des colonnes
            col_modele = get_col_idx(headers, ['MODELE COMMERCIAL', 'MODELE', 'LIBELLE']) # D
            col_code = get_col_idx(headers, ['CODE', 'EDI']) # C
            col_geo = get_col_idx(headers, ['GÉOMETRIE', 'GEOMETRIE', 'TYPE']) # F
            col_design = get_col_idx(headers, ['DESIGN', 'GAMME']) # G
            col_indice = get_col_idx(headers, ['INDICE']) # H
            col_mat = get_col_idx(headers, ['MATIERE']) # I
            col_coat = get_col_idx(headers, ['TRAITEMENT']) # J
            col_flow = get_col_idx(headers, ['FLUX', 'COMMERCIAL']) # K
            col_buy = get_col_idx(headers, ['PRIX 2*NETS', '2*NETS', 'ACHAT']) # M
            
            # Prix Réseaux
            col_kal = get_col_idx(headers, ['KALIXIA']) # P
            col_ite = get_col_idx(headers, ['ITELIS']) # Q
            col_cb = get_col_idx(headers, ['CARTE BLANCHE']) # R
            col_sev = get_col_idx(headers, ['SEVEANE']) # S
            col_sant = get_col_idx(headers, ['SANTECLAIRE', 'SANTECLAIR']) # T
            
            if col_modele == -1: continue # Pas de colonne modèle, on saute

            for row in rows[1:]:
                if not row[col_modele]: continue # Ligne vide
                
                raw_name = str(row[col_modele])
                
                # Logique Type
                raw_geo = str(row[col_geo]).upper() if col_geo != -1 and row[col_geo] else ""
                lens_type = 'UNIFOCAL'
                if 'PROG' in raw_geo: lens_type = 'PROGRESSIF'
                elif 'DEGRESSIF' in raw_geo or 'INTERIEUR' in raw_geo: lens_type = 'DEGRESSIF'
                elif 'MULTIFOCAL' in raw_geo: lens_type = 'MULTIFOCAL'

                # Extraction des valeurs
                design = str(row[col_design]) if col_design != -1 and row[col_design] else 'STANDARD'
                idx = clean_index(row[col_indice]) if col_indice != -1 else "1.50"
                coating = str(row[col_coat]) if col_coat != -1 and row[col_coat] else 'DURCI'
                mat = str(row[col_mat]) if col_mat != -1 and row[col_mat] else ''
                code = str(row[col_code]) if col_code != -1 and row[col_code] else ''
                flow = str(row[col_flow]) if col_flow != -1 and row[col_flow] else ''
                
                purchase = clean_price(row[col_buy]) if col_buy != -1 else 0
                
                # Prix par défaut (Kalixia souvent utilisé comme base)
                default_sell = clean_price(row[col_kal]) if col_kal != -1 else 0

                # Gestion Photochromique dans le nom
                if any(x in mat.upper() for x in ['TRANS', 'GEN', 'SOLA', 'TGNS', 'SABR', 'SAGR']):
                    raw_name = f"{raw_name} {mat.upper()}"

                if purchase > 0:
                    lenses_to_insert.append({
                        "brand": current_brand, 
                        "code": code, 
                        "name": raw_name,
                        "geo": lens_type, 
                        "design": design, 
                        "idx": idx, 
                        "mat": mat, 
                        "coat": coating, 
                        "flow": flow,
                        "buy": purchase, 
                        "selling": default_sell,
                        "p_kalixia": clean_price(row[col_kal]) if col_kal != -1 else 0,
                        "p_itelis": clean_price(row[col_ite]) if col_ite != -1 else 0,
                        "p_cb": clean_price(row[col_cb]) if col_cb != -1 else 0,
                        "p_seveane": clean_price(row[col_sev]) if col_sev != -1 else 0,
                        "p_santeclair": clean_price(row[col_sant]) if col_sant != -1 else 0
                    })

        # Insertion en base (Transaction atomique)
        if lenses_to_insert:
            with engine.begin() as conn:
                conn.execute(text("TRUNCATE TABLE lenses RESTART IDENTITY;"))
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
            
            os.remove(temp_filename) # Nettoyage fichier temp
            return {"status": "success", "count": len(lenses_to_insert), "message": "Catalogue importé avec succès."}
        
        os.remove(temp_filename)
        return {"status": "error", "message": "Aucune donnée valide trouvée."}

    except Exception as e:
        print(f"❌ Erreur Upload : {e}")
        raise HTTPException(status_code=400, detail=f"Erreur traitement fichier : {str(e)}")

# 4. Lecture Catalogue
@app.get("/lenses")
def get_lenses(
    type_verre: str = Query(None, alias="type"),
    brand: str = Query(None),
    pocketLimit: float = Query(0.0) # Gardé pour compatibilité frontend
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
            
            sql += " ORDER BY purchase_price ASC LIMIT 3000"
            
            result = conn.execute(text(sql), params)
            return [row._mapping for row in result.fetchall()]
            
    except Exception as e:
        print(f"❌ ERREUR SQL : {e}")
        return []