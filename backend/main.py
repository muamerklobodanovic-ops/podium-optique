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
        
        with engine.begin() as conn:
            # Table Catalogue (Verres) - Structure A-T Complète
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
                    sell_kalixia DECIMAL(10,2),    -- KALIXIA
                    sell_itelis DECIMAL(10,2),     -- ITELIS
                    sell_carteblanche DECIMAL(10,2), -- CARTE BLANCHE
                    sell_seveane DECIMAL(10,2),    -- SEVEANE
                    sell_santeclair DECIMAL(10,2)  -- SANTECLAIRE
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
            print("✅ Base de données prête (Structure Complète).")
            
    except Exception as e:
        print(f"❌ ERREUR CRITIQUE BDD: {e}")
        engine = None

# --- OUTILS ---
def encrypt_dict(data: dict) -> str:
    json_str = json.dumps(data)
    return cipher.encrypt(json_str.encode()).decode()

def decrypt_dict(token: str) -> dict:
    try:
        json_str = cipher.decrypt(token.encode()).decode()
        return json.loads(json_str)
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

def clean_text(value):
    return str(value).strip() if value else ""

def get_col_index(headers, candidates):
    for i, h in enumerate(headers):
        if h and any(c.upper() == str(h).upper().strip() for c in candidates):
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
    return {"status": "online", "version": "3.30", "message": "API Optique opérationnelle"}

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

# 3. UPLOAD CATALOGUE EXCEL (Mise à jour BDD)
@app.post("/upload-catalog")
async def upload_catalog(file: UploadFile = File(...)):
    if not engine: raise HTTPException(status_code=500, detail="Pas de connexion BDD")
    
    print(f"🚀 Réception du fichier : {file.filename}")
    temp_file = f"temp_{file.filename}"
    
    try:
        # Sauvegarde temporaire
        with open(temp_file, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Lecture Excel
        wb = openpyxl.load_workbook(temp_file, data_only=True)
        lenses_to_insert = []
        
        # Parcours des onglets (1 onglet = 1 marque potentielle)
        for sheet_name in wb.sheetnames:
            sheet = wb[sheet_name]
            sheet_brand = sheet_name.strip().upper()
            print(f"   🔹 Traitement onglet : {sheet_brand}")
            
            rows = list(sheet.iter_rows(values_only=True))
            if not rows: continue
            
            headers = rows[0]
            
            # Mapping des colonnes (Strict selon demande)
            c_marque = get_col_index(headers, ['MARQUE', 'FABRICANT'])
            c_edi = get_col_index(headers, ['CODE EDI'])
            c_code = get_col_index(headers, ['CODE COMMERCIAL'])
            c_name = get_col_index(headers, ['MODELE COMMERCIAL', 'MODELE', 'LIBELLE'])
            c_geo = get_col_index(headers, ['GÉOMETRIE', 'GEOMETRIE'])
            c_design = get_col_index(headers, ['DESIGN', 'GAMME', 'FAMILLE'])
            c_idx = get_col_index(headers, ['INDICE'])
            c_mat = get_col_index(headers, ['MATIERE'])
            c_coat = get_col_index(headers, ['TRAITEMENT'])
            c_flow = get_col_index(headers, ['FLUX COMMERCIAL', 'FLUX'])
            c_color = get_col_index(headers, ['COULEUR'])
            c_buy = get_col_index(headers, ['PRIX 2*NETS', '2*NETS', 'ACHAT'])
            
            # Prix Réseaux
            c_kal = get_col_index(headers, ['KALIXIA'])
            c_ite = get_col_index(headers, ['ITELIS'])
            c_cb = get_col_index(headers, ['CARTE BLANCHE'])
            c_sev = get_col_index(headers, ['SEVEANE'])
            c_sant = get_col_index(headers, ['SANTECLAIRE', 'SANTECLAIR'])
            
            if c_name == -1: continue # Ignorer si pas de colonne modèle

            for row in rows[1:]:
                if not row[c_name]: continue # Ignorer lignes sans nom
                
                # Logique Marque : Colonne A prioritaire, sinon Nom Onglet
                brand = clean_text(row[c_marque]) if c_marque != -1 else sheet_brand
                if not brand: brand = sheet_brand
                
                raw_name = clean_text(row[c_name])
                
                # Logique Type
                raw_geo = clean_text(row[c_geo]).upper() if c_geo != -1 else ""
                lens_type = 'UNIFOCAL'
                if 'PROG' in raw_geo: lens_type = 'PROGRESSIF'
                elif 'DEGRESSIF' in raw_geo or 'INTERIEUR' in raw_geo: lens_type = 'DEGRESSIF'
                elif 'MULTIFOCAL' in raw_geo: lens_type = 'MULTIFOCAL'

                # Autres champs
                design = clean_text(row[c_design]) if c_design != -1 else 'STANDARD'
                idx = clean_index(row[c_idx]) if c_idx != -1 else "1.50"
                coating = clean_text(row[c_coat]) if c_coat != -1 else 'DURCI'
                mat = clean_text(row[c_mat]) if c_mat != -1 else ''
                code = clean_text(row[c_code]) if c_code != -1 else ''
                edi = clean_text(row[c_edi]) if c_edi != -1 else ''
                flow = clean_text(row[c_flow]) if c_flow != -1 else 'FAB'
                color = clean_text(row[c_color]) if c_color != -1 else ''
                
                purchase = clean_price(row[c_buy]) if c_buy != -1 else 0
                
                # Gestion Photochromique dans le nom
                if any(x in mat.upper() for x in ['TRANS', 'GEN', 'SOLA', 'TGNS', 'SABR', 'SAGR', 'SUN']):
                    raw_name = f"{raw_name} {mat}"

                if purchase > 0:
                    lenses_to_insert.append({
                        "brand": brand, "edi": edi, "code": code, "name": raw_name,
                        "geo": lens_type, "design": design, "idx": idx, "mat": mat, 
                        "coat": coating, "flow": flow, "color": color,
                        "buy": purchase, 
                        # Prix réseaux (0 par défaut)
                        "p_kal": clean_price(row[c_kal]) if c_kal != -1 else 0,
                        "p_ite": clean_price(row[c_ite]) if c_ite != -1 else 0,
                        "p_cb": clean_price(row[c_cb]) if c_cb != -1 else 0,
                        "p_sev": clean_price(row[c_sev]) if c_sev != -1 else 0,
                        "p_sant": clean_price(row[c_sant]) if c_sant != -1 else 0,
                    })

        # Insertion en BDD
        if lenses_to_insert:
            with engine.begin() as conn:
                # On vide et recrée la table pour être propre
                conn.execute(text("DROP TABLE IF EXISTS lenses;"))
                conn.execute(text("""
                    CREATE TABLE lenses (
                        id SERIAL PRIMARY KEY,
                        brand VARCHAR(50), edi_code VARCHAR(50), commercial_code VARCHAR(50),
                        name VARCHAR(200), geometry VARCHAR(100), design VARCHAR(100),
                        index_mat VARCHAR(20), material VARCHAR(100), coating VARCHAR(100),
                        commercial_flow VARCHAR(50), color VARCHAR(100),
                        purchase_price DECIMAL(10,2), selling_price DECIMAL(10,2),
                        sell_kalixia DECIMAL(10,2), sell_itelis DECIMAL(10,2),
                        sell_carteblanche DECIMAL(10,2), sell_seveane DECIMAL(10,2),
                        sell_santeclair DECIMAL(10,2)
                    );
                """))
                
                stmt = text("""
                    INSERT INTO lenses (
                        brand, edi_code, commercial_code, name, geometry, design, index_mat, material, coating, 
                        commercial_flow, color, purchase_price, selling_price, 
                        sell_kalixia, sell_itelis, sell_carteblanche, sell_seveane, sell_santeclair
                    ) VALUES (
                        :brand, :edi, :code, :name, :geo, :design, :idx, :mat, :coat, 
                        :flow, :color, :buy, 0, 
                        :p_kal, :p_ite, :p_cb, :p_sev, :p_sant
                    )
                """)
                conn.execute(stmt, lenses_to_insert)
            
            os.remove(temp_file)
            return {"status": "success", "count": len(lenses_to_insert), "message": "Catalogue importé avec succès."}
        
        os.remove(temp_file)
        return {"status": "error", "message": "Aucune donnée valide trouvée."}

    except Exception as e:
        if os.path.exists(temp_file): os.remove(temp_file)
        print(f"❌ Erreur Upload : {e}")
        raise HTTPException(status_code=400, detail=f"Erreur traitement fichier : {str(e)}")

# 4. Lecture Catalogue
@app.get("/lenses")
def get_lenses(
    type_verre: str = Query(None, alias="type"),
    brand: str = Query(None),
    pocketLimit: float = Query(0.0)
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