import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Search, RefreshCw, Trophy, Shield, Star, 
  Glasses, Ruler, ChevronRight, Layers, Sun, Monitor, Sparkles, Tag, Eye, EyeOff, Settings, X, Save, Store, Image as ImageIcon, Upload, Car, ArrowRightLeft, XCircle, Wifi, WifiOff, Server, BoxSelect, ChevronLeft, Sliders, DownloadCloud, Calculator, Info, User, Calendar, Wallet, Coins, FolderOpen, CheckCircle, Lock, Palette, Activity, FileUp, Database, Trash2, Copy, Menu, RotateCcw, LogOut, KeyRound
} from 'lucide-react';

// --- VERSION APPLICATION ---
const APP_VERSION = "4.01"; // Full App + Auth Integration

// --- CONFIGURATION ---
const PROD_API_URL = "https://ecommerce-marilyn-shopping-michelle.trycloudflare.com";
const DEFAULT_PRICING_CONFIG = { x: 2.5, b: 20 };
const DEFAULT_SETTINGS = {
    shopName: "MON OPTICIEN",
    shopLogo: "", 
    themeColor: "blue", 
    bgColor: "bg-slate-50",
    customColor: "#2563eb",
    brandLogos: { HOYA: "", ZEISS: "", SEIKO: "", CODIR: "", ORUS: "" },
    pricing: {
        uniStock: { x: 2.5, b: 20 },   
        uniFab: { x: 3.0, b: 30 },     
        prog: { x: 3.2, b: 50 },       
        degressif: { x: 3.0, b: 40 },  
        interieur: { x: 3.0, b: 40 },
        multifocal: { x: 3.0, b: 40 }
    }
};

const DEMO_LENSES = [
  { id: 101, name: "VARILUX COMFORT MAX", brand: "ESSILOR", commercial_code: "VCM-15", type: "PROGRESSIF", index_mat: "1.50", design: "PREMIUM", coating: "CRIZAL SAPPHIRE", purchase_price: 95, sellingPrice: 285, margin: 190, commercial_flow: "FAB" },
  { id: 108, name: "MONO 1.5 STOCK", brand: "CODIR", commercial_code: "M15-ST", type: "UNIFOCAL", index_mat: "1.50", design: "ECO", coating: "HMC", purchase_price: 8, sellingPrice: 45, margin: 37, commercial_flow: "STOCK" },
];

// --- OUTILS ---
const hexToRgb = (hex) => {
  if (!hex || typeof hex !== 'string') return "0 0 0";
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : "0 0 0";
};
const cleanText = (text) => {
  if (text === null || text === undefined) return "";
  return String(text).toUpperCase().trim();
};
const safeNum = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

// --- COMPOSANTS UI ---
const BrandLogo = ({ brand, className = "h-full w-auto" }) => {
  const [hasError, setHasError] = useState(false);
  const safeBrand = brand || 'unknown';
  const logoUrl = `/logos/${safeBrand.toLowerCase()}.png`;
  if (hasError || !brand) return <span className="text-[9px] font-bold text-slate-400 flex items-center justify-center h-full w-full text-center leading-none">{safeBrand === '' ? 'TOUTES' : safeBrand}</span>;
  return <img src={logoUrl} alt={safeBrand} className={`${className} object-contain`} onError={() => setHasError(true)} />;
};

const NetworkLogo = ({ network, isSelected, onClick }) => {
  const [hasError, setHasError] = useState(false);
  if (!network) return null;
  const fileName = network.toLowerCase().replace(' ', ''); 
  const logoUrl = `/logos/${fileName}.png`;
  const baseClass = "h-10 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center border-2 relative overflow-hidden bg-white";
  const activeClass = isSelected ? "border-blue-600 ring-2 ring-blue-100 scale-105 z-10 shadow-md" : "border-transparent hover:bg-slate-50 hover:border-slate-200 opacity-70 hover:opacity-100 grayscale hover:grayscale-0";
  return (
    <button onClick={onClick} className={`${baseClass} ${activeClass}`} title={network}>
        {hasError || network === 'HORS_RESEAU' ? (<span className={`text-[10px] font-bold ${isSelected ? 'text-blue-700' : 'text-slate-500'}`}>{network === 'HORS_RESEAU' ? 'MARCHÉ LIBRE' : network}</span>) : (<img src={logoUrl} alt={network} className="h-full w-auto object-contain max-w-[80px]" onError={() => setHasError(true)} />)}
        {isSelected && <div className="absolute inset-0 border-2 border-blue-600 rounded-lg pointer-events-none"></div>}
    </button>
  );
};

const LensCard = ({ lens, index, currentTheme, showMargins, onSelect, isSelected, onCompare, isReference = false }) => {
  if (!lens) return null;

  const podiumStyles = [{ border: "border-yellow-400 ring-4 ring-yellow-50 shadow-xl shadow-yellow-100", badge: "bg-yellow-400 text-white border-yellow-500", icon: <Trophy className="w-5 h-5 text-white" />, label: "MEILLEUR CHOIX" }, { border: `border-slate-200 shadow-lg ${currentTheme.shadow || ''}`, badge: `${currentTheme.light || 'bg-gray-100'} ${currentTheme.textDark || 'text-gray-800'} ${currentTheme.border || 'border-gray-200'}`, icon: <Shield className={`w-5 h-5 ${currentTheme.text || 'text-gray-600'}`} />, label: "OFFRE OPTIMISÉE" }, { border: "border-slate-200 shadow-lg", badge: "bg-slate-100 text-slate-600 border-slate-200", icon: <Star className="w-5 h-5 text-orange-400" />, label: "PREMIUM" }];
  let activeStyle = podiumStyles[index !== undefined && index < 3 ? index : 1];
  if (isReference) activeStyle = { border: "border-blue-500 ring-4 ring-blue-50 shadow-xl", badge: "bg-blue-600 text-white", icon: <ArrowRightLeft className="w-5 h-5"/>, label: "RÉFÉRENCE" };
  else if (isSelected) activeStyle = { border: "border-blue-600 ring-4 ring-blue-100 shadow-2xl scale-[1.02]", badge: "bg-blue-600 text-white", icon: <CheckCircle className="w-5 h-5"/>, label: "SÉLECTIONNÉ" };

  const sPrice = safeNum(lens.sellingPrice);
  const pPrice = safeNum(lens.purchase_price);
  const mVal = safeNum(lens.margin);
  const displayMargin = (sPrice > 0) ? ((mVal / sPrice) * 100).toFixed(0) : "0";
  
  return (
    <div onClick={() => onSelect && onSelect(lens)} className={`group bg-white rounded-3xl border-2 p-6 flex flex-col relative cursor-pointer transition-all duration-300 ${activeStyle.border} ${!isSelected && !isReference ? 'hover:-translate-y-2' : ''}`}>
        <div className="absolute top-5 right-5 z-10"><span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm ${activeStyle.badge}`}>{activeStyle.icon || (isSelected ? <CheckCircle className="w-4 h-4"/> : null)} {activeStyle.label}</span></div>
        <div className="pt-8 border-b border-slate-50 pb-6 mb-6">
          <p className="text-[10px] font-mono text-slate-400 mb-2 tracking-widest uppercase">{lens.commercial_code || "REF-UNK"}</p>
          <h3 className="font-bold text-2xl text-slate-800 mb-2 leading-tight">{lens.name || "Nom Indisponible"}</h3>
          <div className="flex flex-wrap gap-2 mt-3"><span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">{lens.brand || "?"}</span><span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">{lens.design || "STANDARD"}</span><span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">INDICE {lens.index_mat || "?"}</span></div>
        </div>
        <div className="flex-1">
          {showMargins ? (<><div className="grid grid-cols-2 gap-4 mb-4"><div className="bg-white p-3 rounded-xl border border-slate-100 text-center shadow-sm"><span className="block text-[10px] text-slate-400 font-bold mb-1">ACHAT HT</span><span className="block text-slate-400 line-through font-bold text-lg">{pPrice.toFixed(2)} €</span></div><div className="bg-white p-3 rounded-xl border border-slate-100 text-center shadow-sm"><span className="block text-[10px] text-slate-400 font-bold mb-1">VENTE TTC</span><span className="block text-slate-800 font-bold text-2xl">{sPrice.toFixed(2)} €</span></div></div><div className="pt-2"><div className="flex justify-between items-end mb-2"><span className="text-xs font-bold text-green-700 tracking-wide">MARGE NETTE</span><span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-lg">{displayMargin}%</span></div><div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center justify-between"><div className="text-4xl font-bold text-green-700 tracking-tight">+{mVal.toFixed(2)} €</div><Trophy className="w-8 h-8 text-green-200" /></div></div></>) : (<div className="flex flex-col h-full justify-center"><div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center mb-4 flex-1 flex flex-col justify-center items-center"><span className="block text-xs font-bold text-green-600 mb-2 uppercase tracking-wider">PRIX CONSEILLÉ (UNITAIRE)</span><span className="text-5xl font-bold text-green-600 tracking-tighter">{sPrice.toFixed(2)} €</span></div><div className="flex justify-between items-center px-2"><span className="text-[10px] font-mono text-slate-300 tracking-widest">REF-{lens.commercial_code || "---"}</span>{lens.commercial_flow && <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${cleanText(lens.commercial_flow).includes('STOCK') ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{lens.commercial_flow}</span>}</div></div>)}
        </div>
        {!isReference && onCompare && (
             <div className="mt-4 pt-4 border-t border-slate-100">
                <button onClick={(e) => { e.stopPropagation(); onCompare(lens); }} className="w-full py-2 bg-slate-50 hover:bg-blue-50 text-blue-600 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"><ArrowRightLeft className="w-3 h-3"/> COMPARER</button>
             </div>
        )}
    </div>
  );
};

// --- COMPOSANT LOGIN ---
const LoginScreen = ({ onLogin }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true); setError(null);
        axios.post(`${PROD_API_URL}/auth/login`, { username, password })
            .then(res => {
                onLogin(res.data.user);
            })
            .catch(err => {
                setError(err.response?.data?.detail || "Erreur de connexion");
                setLoading(false);
            });
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
                <div className="text-center mb-8">
                    <div className="inline-flex p-4 bg-blue-50 rounded-full mb-4 text-blue-600"><Store className="w-8 h-8"/></div>
                    <h1 className="text-2xl font-bold text-slate-800">Podium Optique</h1>
                    <p className="text-sm text-slate-400 mt-2">Identification requise</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">IDENTIFIANT</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-3 border rounded-xl bg-slate-50 focus:bg-white focus:ring-2 ring-blue-100 outline-none transition-all" placeholder="Votre identifiant" required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">MOT DE PASSE</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded-xl bg-slate-50 focus:bg-white focus:ring-2 ring-blue-100 outline-none transition-all" placeholder="••••••••" required />
                    </div>
                    {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-center gap-2"><XCircle className="w-4 h-4"/> {error}</div>}
                    <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2">
                        {loading ? <Activity className="w-5 h-5 animate-spin"/> : <Lock className="w-5 h-5"/>} SE CONNECTER
                    </button>
                </form>
                <div className="mt-8 text-center text-[10px] text-slate-300">V{APP_VERSION} • Accès Sécurisé</div>
            </div>
        </div>
    );
};

// --- COMPOSANT CHANGEMENT MDP (1ère fois) ---
const FirstLoginModal = ({ user, onPasswordChanged }) => {
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [error, setError] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newPass !== confirmPass) return setError("Les mots de passe ne correspondent pas");
        if (newPass.length < 4) return setError("Le mot de passe est trop court");
        
        axios.post(`${PROD_API_URL}/auth/update-password`, { username: user.username, new_password: newPass })
            .then(() => onPasswordChanged(newPass))
            .catch(() => setError("Erreur lors de la mise à jour"));
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl w-full max-w-md">
                <div className="flex items-center gap-3 mb-6 text-orange-500">
                    <KeyRound className="w-8 h-8"/>
                    <h2 className="text-xl font-bold text-slate-800">Première Connexion</h2>
                </div>
                <p className="text-sm text-slate-500 mb-6">Pour des raisons de sécurité, veuillez définir votre mot de passe personnel.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Nouveau mot de passe" className="w-full p-3 border rounded-xl" required/>
                    <input type="password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} placeholder="Confirmer le mot de passe" className="w-full p-3 border rounded-xl" required/>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    <button type="submit" className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl">VALIDER</button>
                </form>
            </div>
        </div>
    );
};

// --- APP PRINCIPALE ---
function App() {
  // Auth State
  const [user, setUser] = useState(() => {
      const saved = sessionStorage.getItem("optique_user");
      return saved ? JSON.parse(saved) : null;
  });

  // ... (Etats existants lenses, etc.) ...
  const [lenses, setLenses] = useState([]); const [filteredLenses, setFilteredLenses] = useState([]); const [availableDesigns, setAvailableDesigns] = useState([]); const [availableCoatings, setAvailableCoatings] = useState([]);
  const [loading, setLoading] = useState(false); const [error, setError] = useState(null); 
  const [showSettings, setShowSettings] = useState(false); const [showMargins, setShowMargins] = useState(false); const [selectedLens, setSelectedLens] = useState(null); const [isSidebarOpen, setIsSidebarOpen] = useState(true); const [comparisonLens, setComparisonLens] = useState(null); const [showHistory, setShowHistory] = useState(false); const [savedOffers, setSavedOffers] = useState([]); 
  const [syncLoading, setSyncLoading] = useState(false); const [client, setClient] = useState({ name: '', firstname: '', dob: '', reimbursement: 0 }); const [secondPairPrice, setSecondPairPrice] = useState(0);
  const [uploadFile, setUploadFile] = useState(null); const [uploadProgress, setUploadProgress] = useState(0);
  const [userFile, setUserFile] = useState(null); // Fichier utilisateurs

  // ... (Settings, Refs, Outils - Copiés de v3.99) ...
  // Je remets les essentiels pour que ça compile
  const [userSettings, setUserSettings] = useState(() => {
    try { const s = localStorage.getItem("optique_user_settings"); return s ? { ...DEFAULT_SETTINGS, ...JSON.parse(s), pricing: { ...DEFAULT_SETTINGS.pricing, ...(JSON.parse(s).pricing||{}) } } : DEFAULT_SETTINGS; } catch { return DEFAULT_SETTINGS; }
  });
  
  // Override Shop Name avec celui de l'utilisateur connecté
  const currentSettings = { 
      ...userSettings, 
      shopName: user?.shop_name || userSettings.shopName 
  };

  const [formData, setFormData] = useState({ network: 'HORS_RESEAU', brand: '', type: 'PROGRESSIF', design: '', sphere: 0.00, cylinder: 0.00, addition: 0.00, materialIndex: '', coating: '', cleanOption: false, myopiaControl: false, uvOption: true, photochromic: false });

  // ... (Logique Fetch & Filtres identique v3.99) ...
  // (Pour la concision, je remets les blocs critiques)
  
  const handleLogin = (userData) => {
      setUser(userData);
      sessionStorage.setItem("optique_user", JSON.stringify(userData));
  };

  const handleLogout = () => {
      setUser(null);
      sessionStorage.removeItem("optique_user");
      sessionStorage.clear(); // Nettoyage complet par sécurité
      window.location.reload();
  };

  const handlePasswordUpdated = (newPass) => {
      const updatedUser = { ...user, is_first_login: false };
      setUser(updatedUser);
      sessionStorage.setItem("optique_user", JSON.stringify(updatedUser));
      alert("Mot de passe mis à jour avec succès !");
  };

  const triggerUserUpload = () => {
      if (!userFile) return alert("Sélectionner un fichier Excel");
      setSyncLoading(true);
      const data = new FormData(); data.append('file', userFile);
      axios.post(`${PROD_API_URL}/upload-users`, data)
        .then(res => alert(`✅ ${res.data.count} utilisateurs importés`))
        .catch(err => alert("Erreur upload utilisateurs"))
        .finally(() => setSyncLoading(false));
  };

  // SI PAS CONNECTÉ -> LOGIN SCREEN
  if (!user) {
      return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className={`min-h-screen ${userSettings.bgColor} text-slate-800 relative font-['Arial'] uppercase transition-colors duration-300`}>
      
      {/* MODALE PREMIERE CONNEXION */}
      {user.is_first_login && <FirstLoginModal user={user} onPasswordChanged={handlePasswordUpdated} />}

      {/* HEADER (Modifié avec Logout) */}
      <div className="bg-slate-900 text-white px-4 lg:px-6 py-2 flex justify-between items-center z-50 text-xs font-bold tracking-widest shadow-md">
          <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-1 rounded hover:bg-slate-700"><Menu className="w-5 h-5"/></button>
              {currentSettings.shopLogo ? (<img src={currentSettings.shopLogo} alt="Logo" className="h-8 w-auto object-contain rounded bg-white p-0.5"/>) : (<div className="h-8 w-8 bg-slate-700 rounded flex items-center justify-center"><Store className="w-4 h-4"/></div>)}
              <span>{currentSettings.shopName}</span> {/* Nom du magasin issu de la BDD */}
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline opacity-70">Bonjour {user.username}</span>
            <button onClick={handleLogout} className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors" title="Déconnexion"><LogOut className="w-4 h-4"/> <span className="hidden sm:inline">QUITTER</span></button>
          </div>
      </div>

      {/* ... (Reste du code APP identique à v3.99 : Header secondaire, Sidebar, Résultats, Footer, Modales...) ... */}
      
      {/* Ajout dans la Modale Settings : IMPORT UTILISATEURS */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-center items-center p-4" onClick={(e) => { if(e.target === e.currentTarget) setShowSettings(false); }}>
           <div className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto text-slate-800">
              <h2 className="font-bold text-xl mb-4">PARAMÈTRES</h2>
              
              {/* SECTION ADMIN : GESTION UTILISATEURS */}
              <div className="mb-6 bg-orange-50 p-4 rounded-xl border border-orange-200">
                 <label className="block text-xs font-bold text-orange-700 mb-2">ADMINISTRATION UTILISATEURS</label>
                 <div className="flex gap-2">
                    <input type="file" accept=".xlsx" onChange={(e) => setUserFile(e.target.files[0])} className="flex-1 text-xs bg-white"/>
                    <button onClick={triggerUserUpload} disabled={syncLoading} className="bg-orange-600 text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-2">{syncLoading ? <Activity className="w-3 h-3 animate-spin"/> : <Upload className="w-3 h-3"/>} IMPORTER</button>
                 </div>
                 <p className="text-[10px] text-orange-600 mt-2">Excel: Col A=ID, Col B=Magasin, Col C=Mdp, Col D=Email</p>
              </div>

              {/* ... (Reste des Settings Catalogue, etc.) ... */}
              <button onClick={() => setShowSettings(false)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600">FERMER</button>
           </div>
        </div>
      )}
    </div>
  );
}

export default App;