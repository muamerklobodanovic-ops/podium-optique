import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Search, RefreshCw, Trophy, Shield, Star, 
  Glasses, Ruler, ChevronRight, Layers, Sun, Monitor, Sparkles, Tag, Eye, EyeOff, Settings, X, Save, Store, Image as ImageIcon, Upload, Car, ArrowRightLeft, XCircle, Wifi, WifiOff, Server, BoxSelect, ChevronLeft, Sliders, DownloadCloud, Calculator, Info, User, Calendar, Wallet, Coins, FolderOpen, CheckCircle, Lock, Palette, Activity, FileUp
} from 'lucide-react';

// --- VERSION APPLICATION ---
const APP_VERSION = "3.38"; // Fix Import (Read Mode)

// --- CONFIGURATION STATIQUE ---
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

// ... (Le reste du frontend est strictement identique à la version 3.37 fonctionnelle)
// Je ré-inclus pour la complétude de la mise à jour

const DEMO_LENSES = [
  { id: 101, name: "VARILUX COMFORT MAX", brand: "ESSILOR", commercial_code: "VCM-15", type: "PROGRESSIF", index_mat: "1.50", design: "PREMIUM", coating: "CRIZAL SAPPHIRE", purchase_price: 95, sellingPrice: 285, margin: 190, commercial_flow: "FAB" },
  { id: 108, name: "MONO 1.5 STOCK", brand: "CODIR", commercial_code: "M15-ST", type: "UNIFOCAL", index_mat: "1.50", design: "ECO", coating: "HMC", purchase_price: 8, sellingPrice: 45, margin: 37, commercial_flow: "STOCK" },
];

const hexToRgb = (hex) => { if (!hex || typeof hex !== 'string') return "0 0 0"; const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : "0 0 0"; };
const cleanText = (text) => { if (text === null || text === undefined) return ""; return String(text).toUpperCase().trim(); };
const safeNum = (val) => { const num = parseFloat(val); return isNaN(num) ? 0 : num; };

const BrandLogo = ({ brand, className = "h-full w-auto" }) => {
  const [hasError, setHasError] = useState(false); const safeBrand = brand || 'unknown'; const logoUrl = `/logos/${safeBrand.toLowerCase()}.png`;
  if (hasError || !brand) return <span className="text-[9px] font-bold text-slate-400 flex items-center justify-center h-full w-full text-center leading-none">{safeBrand === '' ? 'TOUTES' : safeBrand}</span>;
  return <img src={logoUrl} alt={safeBrand} className={`${className} object-contain`} onError={() => setHasError(true)} />;
};

const NetworkLogo = ({ network, isSelected, onClick }) => {
  const [hasError, setHasError] = useState(false); if (!network) return null; const fileName = network.toLowerCase().replace(' ', ''); const logoUrl = `/logos/${fileName}.png`; const baseClass = "h-10 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center border-2 relative overflow-hidden bg-white"; const activeClass = isSelected ? "border-blue-600 ring-2 ring-blue-100 scale-105 z-10 shadow-md" : "border-transparent hover:bg-slate-50 hover:border-slate-200 opacity-70 hover:opacity-100 grayscale hover:grayscale-0";
  return ( <button onClick={onClick} className={`${baseClass} ${activeClass}`} title={network}>{hasError || network === 'HORS_RESEAU' ? (<span className={`text-[10px] font-bold ${isSelected ? 'text-blue-700' : 'text-slate-500'}`}>{network === 'HORS_RESEAU' ? 'MARCHÉ LIBRE' : network}</span>) : (<img src={logoUrl} alt={network} className="h-full w-auto object-contain max-w-[80px]" onError={() => setHasError(true)} />)}{isSelected && <div className="absolute inset-0 border-2 border-blue-600 rounded-lg pointer-events-none"></div>}</button> );
};

const LensCard = ({ lens, index, currentTheme, showMargins, onSelect, isSelected }) => {
  if (!lens) return null;
  const podiumStyles = [{ border: "border-yellow-400 ring-4 ring-yellow-50 shadow-xl shadow-yellow-100", badge: "bg-yellow-400 text-white border-yellow-500", icon: <Trophy className="w-5 h-5 text-white" />, label: "MEILLEUR CHOIX" }, { border: `border-slate-200 shadow-lg ${currentTheme.shadow || ''}`, badge: `${currentTheme.light || 'bg-gray-100'} ${currentTheme.textDark || 'text-gray-800'} ${currentTheme.border || 'border-gray-200'}`, icon: <Shield className={`w-5 h-5 ${currentTheme.text || 'text-gray-600'}`} />, label: "OFFRE OPTIMISÉE" }, { border: "border-slate-200 shadow-lg", badge: "bg-slate-100 text-slate-600 border-slate-200", icon: <Star className="w-5 h-5 text-orange-400" />, label: "PREMIUM" }];
  const activeStyle = isSelected ? { border: "border-blue-600 ring-4 ring-blue-100 shadow-2xl scale-[1.02]", badge: "bg-blue-600 text-white", icon: <ArrowRightLeft className="w-5 h-5"/>, label: "SÉLECTIONNÉ" } : (podiumStyles[index !== undefined && index < 3 ? index : 1]);
  const sPrice = safeNum(lens.sellingPrice); const pPrice = safeNum(lens.purchase_price); const mVal = safeNum(lens.margin); const displayMargin = (sPrice > 0) ? ((mVal / sPrice) * 100).toFixed(0) : "0";
  return ( <div onClick={() => onSelect && onSelect(lens)} className={`group bg-white rounded-3xl border-2 p-6 flex flex-col relative cursor-pointer transition-all duration-300 ${activeStyle.border} ${!isSelected ? 'hover:-translate-y-2' : ''}`}><div className="absolute top-5 right-5 z-10"><span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm ${activeStyle.badge}`}>{isSelected ? "CHOISI" : activeStyle.label}</span></div><div className="pt-8 border-b border-slate-50 pb-6 mb-6"><p className="text-[10px] font-mono text-slate-400 mb-2 tracking-widest uppercase">{lens.commercial_code || "REF-UNK"}</p><h3 className="font-bold text-2xl text-slate-800 mb-2 leading-tight">{lens.name || "Nom Indisponible"}</h3><div className="flex flex-wrap gap-2 mt-3"><span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">{lens.brand || "?"}</span><span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">{lens.design || "STANDARD"}</span><span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">INDICE {lens.index_mat || "?"}</span></div></div><div className="flex-1">{showMargins ? (<><div className="grid grid-cols-2 gap-4 mb-4"><div className="bg-white p-3 rounded-xl border border-slate-100 text-center shadow-sm"><span className="block text-[10px] text-slate-400 font-bold mb-1">ACHAT HT</span><span className="block text-slate-400 line-through font-bold text-lg">{pPrice.toFixed(2)} €</span></div><div className="bg-white p-3 rounded-xl border border-slate-100 text-center shadow-sm"><span className="block text-[10px] text-slate-400 font-bold mb-1">VENTE TTC</span><span className="block text-slate-800 font-bold text-2xl">{sPrice.toFixed(2)} €</span></div></div><div className="pt-2"><div className="flex justify-between items-end mb-2"><span className="text-xs font-bold text-green-700 tracking-wide">MARGE NETTE</span><span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-lg">{displayMargin}%</span></div><div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center justify-between"><div className="text-4xl font-bold text-green-700 tracking-tight">+{mVal.toFixed(2)} €</div><Trophy className="w-8 h-8 text-green-200" /></div></div></>) : (<div className="flex flex-col h-full justify-center"><div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center mb-4 flex-1 flex flex-col justify-center items-center"><span className="block text-xs font-bold text-green-600 mb-2 uppercase tracking-wider">PRIX CONSEILLÉ (UNITAIRE)</span><span className="text-5xl font-bold text-green-600 tracking-tighter">{sPrice.toFixed(2)} €</span></div><div className="flex justify-between items-center px-2"><span className="text-[10px] font-mono text-slate-300 tracking-widest">REF-{lens.commercial_code || "---"}</span>{lens.commercial_flow && <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${cleanText(lens.commercial_flow).includes('STOCK') ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{lens.commercial_flow}</span>}</div></div>)}</div></div> );
};

function App() {
  const [lenses, setLenses] = useState([]); const [filteredLenses, setFilteredLenses] = useState([]); const [availableDesigns, setAvailableDesigns] = useState([]); const [availableCoatings, setAvailableCoatings] = useState([]);
  const [loading, setLoading] = useState(false); const [error, setError] = useState(null); const [isOnline, setIsOnline] = useState(true); 
  const [showSettings, setShowSettings] = useState(false); const [showMargins, setShowMargins] = useState(false); const [selectedLens, setSelectedLens] = useState(null); const [isSidebarOpen, setIsSidebarOpen] = useState(true); const [comparisonLens, setComparisonLens] = useState(null); const [showHistory, setShowHistory] = useState(false); const [savedOffers, setSavedOffers] = useState([]); 
  const [syncLoading, setSyncLoading] = useState(false); const [syncStatus, setSyncStatus] = useState(null); const [sheetsUrl, setSheetsUrl] = useState(localStorage.getItem("optique_sheets_url") || "");
  const [stats, setStats] = useState({ total: 0, filtered: 0 });
  const [client, setClient] = useState({ name: '', firstname: '', dob: '', reimbursement: 0 }); const [secondPairPrice, setSecondPairPrice] = useState(0);
  const [uploadFile, setUploadFile] = useState(null); const [uploadProgress, setUploadProgress] = useState(0);

  const [userSettings, setUserSettings] = useState(() => {
    try { const saved = localStorage.getItem("optique_user_settings"); if (saved) { const parsed = JSON.parse(saved); return { ...DEFAULT_SETTINGS, ...parsed, pricing: { ...DEFAULT_SETTINGS.pricing, ...(parsed.pricing || {}) } }; } return DEFAULT_SETTINGS; } catch (e) { return DEFAULT_SETTINGS; }
  });
  useEffect(() => { localStorage.setItem("optique_user_settings", JSON.stringify(userSettings)); }, [userSettings]);

  const [formData, setFormData] = useState({ network: 'HORS_RESEAU', brand: '', type: 'PROGRESSIF', design: '', sphere: 0.00, cylinder: 0.00, addition: 0.00, materialIndex: '1.60', coating: '', cleanOption: false, myopiaControl: false, uvOption: true, photochromic: false });

  const [serverUrl, setServerUrl] = useState(localStorage.getItem("optique_server_url") || "https://api-podium-optique.onrender.com");
  const isLocal = window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1");
  const cleanBaseUrl = (url) => url.replace(/\/lenses\/?$/, '').replace(/\/sync\/?$/, '').replace(/\/offers\/?$/, '').replace(/\/upload-catalog\/?$/, '').replace(/\/$/, '');
  const baseBackendUrl = cleanBaseUrl(isLocal ? "http://127.0.0.1:8000" : serverUrl);
  const API_URL = `${baseBackendUrl}/lenses`;
  const SYNC_URL = `${baseBackendUrl}/sync`;
  const UPLOAD_URL = `${baseBackendUrl}/upload-catalog`; 
  const SAVE_URL = `${baseBackendUrl}/offers`;

  useEffect(() => { if (isLocal) return; const pingInterval = setInterval(() => { axios.get(API_URL, { params: { pocketLimit: -1 } }).catch(() => {}); }, 14 * 60 * 1000); return () => clearInterval(pingInterval); }, [API_URL, isLocal]);
  useEffect(() => { const root = document.documentElement; if (userSettings.themeColor === 'custom') { const rgb = hexToRgb(userSettings.customColor); root.style.setProperty('--theme-primary', userSettings.customColor); } else { root.style.removeProperty('--theme-primary'); } }, [userSettings.themeColor, userSettings.customColor]);

  const bgClass = userSettings.bgColor || "bg-slate-50"; const isDarkTheme = bgClass.includes("900") || bgClass.includes("black"); const textClass = isDarkTheme ? "text-white" : "text-slate-800"; const currentTheme = { primary: userSettings.themeColor === 'custom' ? 'bg-[var(--theme-primary)]' : 'bg-blue-700' };
  const brands = [ { id: '', label: 'TOUTES' }, { id: 'HOYA', label: 'HOYA' }, { id: 'ZEISS', label: 'ZEISS' }, { id: 'SEIKO', label: 'SEIKO' }, { id: 'CODIR', label: 'CODIR' }, { id: 'ORUS', label: 'ORUS' } ];
  const networks = ['HORS_RESEAU', 'KALIXIA', 'SANTECLAIR', 'CARTEBLANCHE', 'ITELIS', 'SEVEANE'];
  const lensTypes = [ { id: 'UNIFOCAL', label: 'UNIFOCAL' }, { id: 'PROGRESSIF', label: 'PROGRESSIF' }, { id: 'DEGRESSIF', label: 'DÉGRESSIF' }, { id: 'MULTIFOCAL', label: 'MULTIFOCAL' }, { id: "PROGRESSIF D'INTÉRIEUR", label: "PROG. INTÉRIEUR" } ];
  const indices = ['1.50', '1.58', '1.60', '1.67', '1.74'];
  const currentCoatings = [ { id: 'MISTRAL', label: 'MISTRAL' }, { id: 'E_PROTECT', label: 'E-PROTECT' }, { id: 'QUATTRO_UV', label: 'QUATTRO UV' }, { id: 'B_PROTECT', label: 'B-PROTECT' }, { id: 'QUATTRO_UV_CLEAN', label: 'QUATTRO UV CLEAN' }, { id: 'B_PROTECT_CLEAN', label: 'B-PROTECT CLEAN' } ];

  useEffect(() => { setFormData(prev => ({ ...prev, coating: '' })); fetchData(); }, [formData.brand, formData.network, formData.type]); 

  const getFilteredBrandsList = () => {
      const net = formData.network;
      if (net === 'HORS_RESEAU') return brands; 
      if (net === 'SANTECLAIR') return brands.filter(b => b.id === '' || b.id === 'SEIKO' || b.id === 'ZEISS');
      return brands.filter(b => b.id !== 'ORUS' && b.id !== 'ZEISS');
  };
  const activeBrands = getFilteredBrandsList();

  useEffect(() => {
    const safeLenses = lenses || [];
    if (safeLenses.length > 0) {
       let workingList = safeLenses.map(l => ({...l}));
       if (formData.brand && formData.brand !== '') { workingList = workingList.filter(l => cleanText(l.brand) === cleanText(formData.brand)); }
       if (formData.type) { const targetType = cleanText(formData.type); if (targetType.includes("INTERIEUR")) { workingList = workingList.filter(l => cleanText(l.type).includes("INTERIEUR")); } else { workingList = workingList.filter(l => cleanText(l.type).includes(targetType)); } }

       if (formData.network === 'HORS_RESEAU') {
          const pRules = { ...DEFAULT_SETTINGS.pricing, ...(userSettings.pricing || {}) };
          workingList = workingList.map(lens => {
             let rule = pRules.prog || DEFAULT_PRICING_CONFIG; 
             const lensType = cleanText(lens.type); const lensName = cleanText(lens.name); const flow = cleanText(lens.commercial_flow);
             if (lensType.includes('UNIFOCAL')) { const isStock = flow.includes('STOCK') || lensName.includes(' ST') || lensName.includes('_ST'); rule = isStock ? (pRules.uniStock || DEFAULT_PRICING_CONFIG) : (pRules.uniFab || DEFAULT_PRICING_CONFIG); } 
             else if (lensType.includes('DEGRESSIF')) { rule = pRules.degressif || DEFAULT_PRICING_CONFIG; } 
             else if (lensType.includes('INTERIEUR')) { rule = pRules.interieur || DEFAULT_PRICING_CONFIG; }
             else if (lensType.includes('MULTIFOCAL')) { rule = pRules.multifocal || DEFAULT_PRICING_CONFIG; }
             const pPrice = parseFloat(lens.purchase_price || 0);
             const newSelling = (pPrice * rule.x) + rule.b;
             const newMargin = newSelling - pPrice;
             return { ...lens, sellingPrice: Math.round(newSelling), margin: Math.round(newMargin) };
          });
          workingList.sort((a, b) => b.margin - a.margin);
       } else {
           const priceMap = { 'KALIXIA': 'sell_kalixia', 'ITELIS': 'sell_itelis', 'CARTEBLANCHE': 'sell_carteblanche', 'SEVEANE': 'sell_seveane', 'SANTECLAIR': 'sell_santeclair' };
           const key = priceMap[formData.network];
           workingList = workingList.map(l => { const sPrice = l[key] ? parseFloat(l[key]) : 0; return { ...l, sellingPrice: sPrice, margin: sPrice - (parseFloat(l.purchase_price)||0) }; });
           workingList = workingList.filter(l => l.sellingPrice > 0);
       }

       workingList = workingList.filter(l => { if(!l.index_mat) return false; const lIdx = String(l.index_mat).replace(',', '.'); const fIdx = String(formData.materialIndex).replace(',', '.'); return Math.abs(parseFloat(lIdx) - parseFloat(fIdx)) < 0.01; });
       const isPhotoC = (item) => { const text = cleanText(item.name + " " + item.material + " " + item.coating); return text.includes("TRANS") || text.includes("GEN S") || text.includes("SOLACTIVE") || text.includes("TGNS") || text.includes("SABR") || text.includes("SAGR") || text.includes("SUN"); };
       if (formData.photochromic) { workingList = workingList.filter(l => isPhotoC(l)); } else { workingList = workingList.filter(l => !isPhotoC(l)); }
       const coatings = [...new Set(workingList.map(l => l.coating).filter(Boolean))].sort();
       setAvailableCoatings(coatings);
       if (formData.coating && formData.coating !== '') { workingList = workingList.filter(l => cleanText(l.coating) === cleanText(formData.coating)); }
       if (formData.myopiaControl) { workingList = workingList.filter(l => cleanText(l.name).includes("MIYO")); }
       const designs = [...new Set(workingList.map(l => l.design).filter(Boolean))].sort();
       setAvailableDesigns(designs);
       if (formData.design && formData.design !== '') { setFilteredLenses(workingList.filter(l => cleanText(l.design) === cleanText(formData.design))); } else { setFilteredLenses(workingList); }
       setStats({ total: lenses.length, filtered: workingList.length });
    } else { setAvailableDesigns([]); setAvailableCoatings([]); setFilteredLenses([]); setStats({ total: 0, filtered: 0 }); }
  }, [lenses, formData, userSettings.pricing]);

  const fetchData = () => {
    setLoading(true); setError(null); 
    if (!isLocal && API_URL.includes("VOTRE-URL")) { setLenses(DEMO_LENSES); setLoading(false); return; }
    axios.get(API_URL, { params: { type: formData.type, brand: formData.brand === '' ? undefined : formData.brand, pocketLimit: 0 } })
      .then(res => { setIsOnline(true); setLenses(Array.isArray(res.data) ? res.data : []); setLoading(false); })
      .catch(err => { console.warn("Mode Hors Ligne", err); setIsOnline(false); setLenses(DEMO_LENSES); setLoading(false); });
  };

  const fetchHistory = () => { axios.get(SAVE_URL).then(res => setSavedOffers(res.data)).catch(err => console.error("Erreur historique", err)); };
  const saveOffer = () => {
      if (!selectedLens || !client.name) return alert("Nom client obligatoire !");
      const totalPair = selectedLens.sellingPrice * 2;
      const remainder = (totalPair + secondPairPrice) - client.reimbursement;
      const payload = { client: client, lens: selectedLens, finance: { reimbursement: client.reimbursement, total: totalPair + secondPairPrice, remainder: remainder } };
      axios.post(SAVE_URL, payload, { headers: { 'Content-Type': 'application/json' } }).then(res => alert("Dossier sauvegardé !")).catch(err => alert("Erreur"));
  };

  const triggerFileUpload = () => {
      if (!uploadFile) return alert("Sélectionnez un fichier Excel (.xlsx)");
      setSyncLoading(true);
      setUploadProgress(0);
      const data = new FormData();
      data.append('file', uploadFile);
      axios.post(UPLOAD_URL, data, {
          onUploadProgress: (progressEvent) => {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percent);
          }
      })
      .then(res => { alert(`✅ Succès ! ${res.data.count} verres importés.`); fetchData(); })
      .catch(err => { console.error("Upload Error:", err); alert(`❌ Erreur upload : ${err.response?.data?.detail || err.message}`); })
      .finally(() => { setSyncLoading(false); setUploadProgress(0); });
  };

  const triggerSync = () => { if (!sheetsUrl) return alert("URL?"); setSyncLoading(true); axios.post(SYNC_URL, { url: sheetsUrl }).then(res => { fetchData(); }).finally(() => setSyncLoading(false)); };
  const handleChange = (e) => { const { name, value, type, checked } = e.target; setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value })); };
  const handleClientChange = (e) => { const { name, value } = e.target; if (name === 'reimbursement' && parseFloat(value) < 0) return; setClient(prev => ({ ...prev, [name]: value })); };
  const handleLogoUpload = (e, target = 'shop') => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { if (target === 'shop') { setUserSettings(prev => ({ ...prev, shopLogo: reader.result })); } }; reader.readAsDataURL(file); } };
  const handleSettingChange = (section, field, value) => { if (section === 'branding') { setUserSettings(prev => ({ ...prev, [field]: value })); } else { setUserSettings(prev => ({ ...prev, [section]: { ...prev[section], [field]: parseFloat(value) || 0 } })); } };
  const handlePriceRuleChange = (category, field, value) => { 
      setUserSettings(prev => ({
          ...prev,
          pricing: {
              ...prev.pricing,
              [category]: {
                  ...(prev.pricing && prev.pricing[category] ? prev.pricing[category] : DEFAULT_SETTINGS.pricing[category]),
                  [field]: parseFloat(value) || 0
              }
          }
      }));
  };
  const handleUrlChange = (value) => { setServerUrl(value); localStorage.setItem("optique_server_url", value); };
  const handleSheetsUrlChange = (value) => { setSheetsUrl(value); localStorage.setItem("optique_sheets_url", value); };
  const handleTypeChange = (newType) => { setFormData(prev => ({ ...prev, type: newType, design: '', coating: '' })); };
  const handleDesignChange = (newDesign) => { setFormData(prev => ({ ...prev, design: newDesign })); };
  const handleCoatingChange = (newCoating) => { setFormData(prev => ({ ...prev, coating: newCoating })); };
  const handleCompare = (lens) => { setComparisonLens(lens); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const clearComparison = () => { setComparisonLens(null); };
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const isAdditionDisabled = formData.type === 'UNIFOCAL' || formData.type === 'DEGRESSIF';
  
  const safePricing = { ...DEFAULT_SETTINGS.pricing, ...(userSettings.pricing || {}) };
  const lensPrice = selectedLens ? parseFloat(selectedLens.sellingPrice) : 0;
  const totalPair = lensPrice * 2;
  const totalRefund = parseFloat(client.reimbursement || 0);
  const remainder = (totalPair + secondPairPrice) - totalRefund;

  const checkDatabase = () => {
      setSyncLoading(true);
      axios.get(API_URL) 
        .then(res => { 
            const data = Array.isArray(res.data) ? res.data : [];
            if (data.length === 0) { alert("⚠️ Base vide."); } else { alert(`✅ OK : ${data.length} verres.`); }
        })
        .catch(err => { alert(`❌ ERREUR: ${err.message}`); })
        .finally(() => setSyncLoading(false));
  };

  const testConnection = () => {
      setSyncLoading(true);
      axios.get(API_URL, { params: { limit: 1 } })
        .then(res => { alert(`✅ CONNEXION RÉUSSIE !`); })
        .catch(err => { alert(`❌ ÉCHEC DE CONNEXION`); })
        .finally(() => setSyncLoading(false));
  };

  return (
    <div className={`min-h-screen flex flex-col ${bgClass} ${textClass} relative font-['Arial'] uppercase transition-colors duration-300`}>
      {/* HEADER ... (Identique) */}
      <header className={`${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border-b px-6 py-4 shadow-sm z-40`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4 flex-1 w-full lg:w-auto">
                <button onClick={() => { setShowHistory(true); fetchHistory(); }} className="p-3 rounded-xl shadow-lg text-white hover:opacity-90 transition-colors" style={{backgroundColor: userSettings.customColor}}><FolderOpen className="w-6 h-6"/></button>
                <div className="flex flex-wrap gap-2 items-center w-full">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200'}`}><User className="w-4 h-4 opacity-50"/><input type="text" name="name" placeholder="NOM" value={client.name} onChange={handleClientChange} className="bg-transparent w-40 font-bold text-sm outline-none"/><input type="text" name="firstname" placeholder="PRÉNOM" value={client.firstname} onChange={handleClientChange} className={`bg-transparent w-40 font-bold text-sm outline-none border-l pl-2 ${isDarkTheme ? 'border-slate-600' : 'border-slate-200'}`}/></div>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200'}`}><input type="date" name="dob" value={client.dob} onChange={handleClientChange} className={`bg-transparent font-bold text-sm outline-none ${isDarkTheme ? 'text-white' : 'text-slate-600'}`}/></div>
                    <div className="flex items-center gap-2 ml-4 overflow-x-auto pb-1">{networks.map(net => (<NetworkLogo key={net} network={net} isSelected={formData.network === net} onClick={() => setFormData(prev => ({...prev, network: net}))}/>))}</div>
                    <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-100 ml-auto"><Wallet className="w-4 h-4 text-green-600"/><input type="number" name="reimbursement" placeholder="0" value={client.reimbursement} onChange={handleClientChange} className="bg-transparent w-16 font-bold text-sm text-green-700 text-right outline-none" min="0"/><span className="text-xs font-bold text-green-700">€</span></div>
                </div>
            </div>
            <div className="flex items-center gap-2"><button onClick={() => setShowMargins(!showMargins)} className={`p-2 rounded-lg opacity-70 hover:opacity-100 ${isDarkTheme ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}><EyeOff className="w-5 h-5"/></button><button onClick={() => setShowSettings(true)} className={`p-2 rounded-lg opacity-70 hover:opacity-100 ${isDarkTheme ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}><Settings className="w-5 h-5"/></button></div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-0">
        {/* SIDEBAR ... (Identique) */}
        <aside className={`${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border-r flex flex-col overflow-y-auto z-20 transition-all duration-300 w-80 ${isSidebarOpen ? '' : 'hidden'}`}>
            <div className="p-6 space-y-6 pb-32">
                <div><label className="text-[10px] font-bold opacity-50 mb-2 block">MARQUE</label><div className="grid grid-cols-3 gap-1.5">{activeBrands.map(b => (<button key={b.id} onClick={() => setFormData({...formData, brand: b.id})} className={`flex flex-col items-center justify-center p-1 border rounded-lg transition-all h-20 ${formData.brand === b.id ? 'border-transparent' : `hover:opacity-80 ${isDarkTheme ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-50'}`}`} style={formData.brand === b.id ? {backgroundColor: userSettings.customColor} : {}}><div className="w-full h-full flex items-center justify-center p-2 bg-white rounded">{b.id === '' ? <span className="font-bold text-xs text-slate-800">TOUS</span> : <BrandLogo brand={b.id} className="max-h-full max-w-full object-contain"/>}</div></button>))}</div></div>
                {/* ... Autres filtres ... */}
                <div><label className="text-[10px] font-bold opacity-50 mb-2 block">CORRECTION</label><div className="grid grid-cols-2 gap-3 mb-2"><div className="relative"><input type="number" step="0.25" name="sphere" value={formData.sphere} onChange={handleChange} className={`w-full p-2 pl-3 border rounded-lg font-bold text-sm bg-transparent outline-none ${isDarkTheme ? 'border-slate-600 text-white' : 'border-slate-200 text-slate-800'}`} placeholder="SPH"/><span className="absolute right-2 top-2 text-[10px] opacity-50">D</span></div><div className="relative"><input type="number" step="0.25" name="cylinder" value={formData.cylinder} onChange={handleChange} className={`w-full p-2 pl-3 border rounded-lg font-bold text-sm bg-transparent outline-none ${isDarkTheme ? 'border-slate-600 text-white' : 'border-slate-200 text-slate-800'}`} placeholder="CYL"/><span className="absolute right-2 top-2 text-[10px] opacity-50">D</span></div></div><div className={`relative transition-opacity ${isAdditionDisabled ? 'opacity-50' : ''}`}><input type="number" step="0.25" name="addition" value={formData.addition} onChange={handleChange} disabled={isAdditionDisabled} className={`w-full p-2 pl-3 border rounded-lg font-bold text-sm bg-transparent outline-none ${isDarkTheme ? 'border-slate-600 text-white' : 'border-slate-200 text-slate-800'}`} placeholder="ADD"/><span className="absolute right-2 top-2 text-[10px] opacity-50">D</span></div></div>
                <div><label className="text-[10px] font-bold opacity-50 mb-2 block">GÉOMÉTRIE</label><div className="flex flex-col gap-1">{lensTypes.map(t => (<button key={t.id} onClick={() => handleTypeChange(t.id)} className={`px-3 py-2 rounded-lg text-left text-xs font-bold border transition-colors ${formData.type === t.id ? 'text-white border-transparent' : `border-transparent opacity-70 hover:opacity-100 ${isDarkTheme ? 'hover:bg-slate-700' : 'hover:bg-slate-100 text-slate-500'}`}`} style={formData.type === t.id ? {backgroundColor: userSettings.customColor} : {}}>{t.label}</button>))}</div></div>
                {availableDesigns.length > 0 && (<div><label className="text-[10px] font-bold opacity-50 mb-2 block">DESIGN</label><div className="flex flex-wrap gap-2"><button onClick={() => handleDesignChange('')} className={`px-2 py-1 rounded border text-[10px] font-bold ${formData.design === '' ? 'text-white border-transparent' : `border-transparent opacity-70`}`} style={formData.design === '' ? {backgroundColor: userSettings.customColor} : {}}>TOUS</button>{availableDesigns.map(d => (<button key={d} onClick={() => handleDesignChange(d)} className={`px-2 py-1 rounded border text-[10px] font-bold ${formData.design === d ? 'text-white border-transparent' : `border-transparent opacity-70 ${isDarkTheme ? 'text-gray-300' : 'text-slate-600'}`}`} style={formData.design === d ? {backgroundColor: userSettings.customColor} : {}}>{d}</button>))}</div></div>)}
                <div><label className="text-[10px] font-bold opacity-50 mb-2 block">INDICE</label><div className="flex gap-1">{indices.map(i => (<button key={i} onClick={() => setFormData({...formData, materialIndex: i})} className={`flex-1 py-2 rounded border text-[10px] font-bold ${formData.materialIndex === i ? 'text-white border-transparent shadow-sm' : `border-transparent opacity-60 hover:opacity-100`}`} style={formData.materialIndex === i ? {backgroundColor: userSettings.customColor} : {}}>{i}</button>))}</div></div>
                <div><label className="text-[10px] font-bold opacity-50 mb-2 block">TRAITEMENTS</label><button onClick={() => handleCoatingChange('')} className={`w-full py-2 mb-2 text-[10px] font-bold rounded border ${formData.coating === '' ? 'text-white border-transparent' : 'border-transparent opacity-60'}`} style={formData.coating === '' ? {backgroundColor: userSettings.customColor} : {}}>TOUS</button><label className={`flex items-center gap-2 p-2 rounded border cursor-pointer mb-2 ${formData.photochromic ? 'bg-yellow-50 border-yellow-300' : 'border-transparent opacity-80'}`}><input type="checkbox" checked={formData.photochromic} onChange={handleChange} name="photochromic" className="accent-yellow-500"/><span className={`text-[10px] font-bold ${formData.photochromic ? 'text-yellow-700' : 'opacity-80'}`}>PHOTOCHROMIQUE</span></label><div className="flex flex-col gap-1">{availableCoatings.length > 0 ? availableCoatings.map(c => (<button key={c} onClick={() => handleCoatingChange(c)} className={`p-2 rounded border text-left text-[10px] font-bold ${formData.coating === c ? 'bg-blue-50 border-blue-200 text-blue-800' : 'border-transparent opacity-70 hover:opacity-100'}`}>{c}</button>)) : <div className="text-[10px] opacity-50 italic text-center">Aucun traitement spécifique</div>}</div></div>
            </div>
        </aside>

        {/* RESULTATS ... (Identique) */}
        <section className="flex-1 p-6 overflow-y-auto pb-40">
            <div className="max-w-7xl mx-auto">
                {comparisonLens && (
                    <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="flex justify-between mb-4"><h3 className="font-bold text-blue-800 text-sm">PRODUIT DE RÉFÉRENCE</h3><button onClick={() => setComparisonLens(null)}><XCircle className="w-5 h-5 text-blue-400"/></button></div>
                        <div className="w-full max-w-sm"><LensCard lens={comparisonLens} index={0} currentTheme={currentTheme} showMargins={showMargins} isReference={true} /></div>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredLenses.map((lens, index) => (<LensCard key={lens.id} lens={lens} index={index} currentTheme={currentTheme} showMargins={showMargins} onCompare={handleCompare} onSelect={setSelectedLens} isSelected={selectedLens && selectedLens.id === lens.id} />))}
                </div>
                {filteredLenses.length === 0 && !loading && <div className="text-center py-20 opacity-50 text-sm font-bold">AUCUN VERRE TROUVÉ</div>}
            </div>
        </section>
      </div>

      {/* FOOTER DEVIS ... (Identique) */}
      {selectedLens && (
          <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50 p-4 animate-in slide-in-from-bottom-10 text-slate-800">
              <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4"><div className="bg-blue-100 p-3 rounded-xl text-blue-600"><Glasses className="w-6 h-6"/></div><div><div className="text-[10px] text-slate-400 font-bold mb-0.5">VERRE SÉLECTIONNÉ</div><div className="font-bold text-slate-800 text-sm leading-tight">{selectedLens.name}</div><div className="text-[10px] text-slate-500">{selectedLens.design} - {selectedLens.index_mat} - {selectedLens.coating}</div></div></div>
                  <div className="flex items-center gap-8 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100"><div className="text-center"><div className="text-[9px] font-bold text-slate-400">UNITAIRE</div><div className="font-bold text-lg text-slate-700">{parseFloat(selectedLens.sellingPrice).toFixed(2)} €</div></div><div className="text-slate-300 text-xl">x 2</div><div className="text-center"><div className="text-[9px] font-bold text-blue-600">TOTAL PAIRE</div><div className="font-bold text-2xl text-blue-700">{totalPair.toFixed(2)} €</div></div></div>
                  <div className="flex items-center gap-4"><div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-xl border border-orange-100"><Coins className="w-4 h-4 text-orange-500"/><div className="flex flex-col"><span className="text-[8px] font-bold text-orange-400">2ÈME PAIRE</span><input type="number" value={secondPairPrice} onChange={(e) => setSecondPairPrice(safeNum(e.target.value))} className="w-16 bg-transparent font-bold text-orange-700 outline-none text-sm" placeholder="0" min="0"/></div></div><div className="flex flex-col items-end"><div className="text-[10px] font-bold text-slate-400">RESTE À CHARGE CLIENT</div><div className={`text-3xl font-black ${remainder > 0 ? 'text-slate-800' : 'text-green-600'}`}>{remainder.toFixed(2)} €</div></div><button onClick={saveOffer} className="ml-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-green-200 transition-all"><CheckCircle className="w-5 h-5"/> VALIDER L'OFFRE</button></div>
              </div>
          </div>
      )}

      {/* MODALE SETTINGS AVEC SECURITÉ */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-center items-center p-4" onClick={(e) => { if(e.target === e.currentTarget) setShowSettings(false); }}>
           <div className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto text-slate-800">
              <h2 className="font-bold text-xl mb-4">PARAMÈTRES</h2>
              {/* IMPORT EXCEL */}
              <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200"><label className="block text-xs font-bold text-slate-600 mb-2">IMPORTER UN CATALOGUE (EXCEL)</label><div className="flex gap-2"><input type="file" accept=".xlsx" onChange={(e) => setUploadFile(e.target.files[0])} className="flex-1 text-xs"/><button onClick={triggerFileUpload} disabled={syncLoading || !uploadFile} className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-2">{syncLoading ? <RefreshCw className="w-3 h-3 animate-spin"/> : <FileUp className="w-3 h-3"/>} {uploadProgress > 0 && uploadProgress < 100 ? `${uploadProgress}%` : "ENVOYER"}</button></div><p className="text-[10px] text-slate-400 mt-2">Format .xlsx avec un onglet par Marque.</p></div>
              {/* CHECK BDD */}
              <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center"><div><label className="block text-xs font-bold text-slate-600">ÉTAT BASE DE DONNÉES</label><p className="text-[10px] text-slate-400 mt-1">Vérifier le contenu importé</p></div><button onClick={checkDatabase} disabled={syncLoading} className="bg-gray-800 text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-2">{syncLoading ? <Activity className="w-3 h-3 animate-spin"/> : <Server className="w-3 h-3"/>} VÉRIFIER</button></div>
              {/* URL API */}
              <div className="mb-6"><label className="block text-xs font-bold text-slate-500 mb-2">URL DE L'API (BACKEND)</label><div className="flex gap-2"><input type="text" value={serverUrl} onChange={(e) => handleUrlChange(e.target.value)} className="flex-1 p-2 border rounded"/><button onClick={testConnection} disabled={syncLoading} className="bg-gray-800 text-white px-4 rounded text-xs font-bold">{syncLoading ? <Activity className="w-4 h-4 animate-spin"/> : "TEST"}</button></div><p className="text-[10px] text-slate-400 mt-1">Si le test échoue, vérifiez que le serveur Render est actif.</p></div>
              <div className="mb-6"><label className="block text-xs font-bold text-slate-500 mb-2">URL GOOGLE SHEETS (LEGACY)</label><div className="flex gap-2"><input type="text" value={sheetsUrl} onChange={(e) => setSheetsUrl(e.target.value)} className="flex-1 p-2 border rounded"/><button onClick={triggerSync} disabled={syncLoading} className="bg-blue-600 text-white px-4 rounded text-xs font-bold">SYNCHRO</button></div>{syncStatus && <p className="text-xs mt-2 text-green-600">{syncStatus.msg}</p>}</div>
              
              <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100"><h4 className="text-xs font-bold text-slate-400 mb-4">IDENTITÉ</h4><div className="grid grid-cols-1 gap-4"><div><label className="block text-xs font-bold text-slate-600 mb-1">NOM</label><input type="text" value={userSettings.shopName} onChange={(e) => handleSettingChange('branding', 'shopName', e.target.value)} className="w-full p-2 border rounded"/></div><div><label className="block text-xs font-bold text-slate-600 mb-1">LOGO</label><input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'shop')} className="w-full text-xs"/></div></div></div>
               <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100"><h4 className="text-xs font-bold text-slate-400 mb-4">APPARENCE</h4><div className="grid grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-slate-600 mb-2">FOND</label><div className="grid grid-cols-2 gap-2"><button onClick={() => handleSettingChange('branding', 'bgColor', 'bg-slate-50')} className="p-3 bg-slate-50 border rounded text-xs font-bold text-slate-600">Gris Clair</button><button onClick={() => handleSettingChange('branding', 'bgColor', 'bg-gray-900')} className="p-3 bg-gray-900 border rounded text-xs font-bold text-white">Noir / Gris</button></div></div><div><label className="block text-xs font-bold text-slate-600 mb-2">BULLES</label><input type="color" value={userSettings.customColor} onChange={(e) => { handleSettingChange('branding', 'customColor', e.target.value); handleSettingChange('branding', 'themeColor', 'custom'); }} className="w-full h-10 cursor-pointer rounded"/></div></div></div>
               
               {/* PRIX (Avec ?? pour éviter le crash) */}
               <div className="mb-6"><h4 className="text-sm font-bold text-slate-600 mb-4 border-b pb-2">PRIX MARCHÉ LIBRE</h4>
                 <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between"><span className="text-xs font-bold">UNIFOCAL STOCK</span><div className="flex gap-2"><input type="number" step="0.1" value={safePricing.uniStock?.x ?? 2.5} onChange={(e) => handlePriceRuleChange('uniStock', 'x', e.target.value)} className="w-12 p-1 border rounded text-center text-xs"/><input type="number" step="1" value={safePricing.uniStock?.b ?? 20} onChange={(e) => handlePriceRuleChange('uniStock', 'b', e.target.value)} className="w-12 p-1 border rounded text-center text-xs"/></div></div>
                    <div className="flex items-center justify-between"><span className="text-xs font-bold">UNIFOCAL FAB</span><div className="flex gap-2"><input type="number" step="0.1" value={safePricing.uniFab?.x ?? 3.0} onChange={(e) => handlePriceRuleChange('uniFab', 'x', e.target.value)} className="w-12 p-1 border rounded text-center text-xs"/><input type="number" step="1" value={safePricing.uniFab?.b ?? 30} onChange={(e) => handlePriceRuleChange('uniFab', 'b', e.target.value)} className="w-12 p-1 border rounded text-center text-xs"/></div></div>
                    <div className="flex items-center justify-between"><span className="text-xs font-bold">PROGRESSIF</span><div className="flex gap-2"><input type="number" step="0.1" value={safePricing.prog?.x ?? 3.2} onChange={(e) => handlePriceRuleChange('prog', 'x', e.target.value)} className="w-12 p-1 border rounded text-center text-xs"/><input type="number" step="1" value={safePricing.prog?.b ?? 50} onChange={(e) => handlePriceRuleChange('prog', 'b', e.target.value)} className="w-12 p-1 border rounded text-center text-xs"/></div></div>
                    <div className="flex items-center justify-between"><span className="text-xs font-bold">DÉGRESSIF</span><div className="flex gap-2"><input type="number" step="0.1" value={safePricing.degressif?.x ?? 3.0} onChange={(e) => handlePriceRuleChange('degressif', 'x', e.target.value)} className="w-12 p-1 border rounded text-center text-xs"/><input type="number" step="1" value={safePricing.degressif?.b ?? 40} onChange={(e) => handlePriceRuleChange('degressif', 'b', e.target.value)} className="w-12 p-1 border rounded text-center text-xs"/></div></div>
                    <div className="flex items-center justify-between"><span className="text-xs font-bold">INTÉRIEUR</span><div className="flex gap-2"><input type="number" step="0.1" value={safePricing.interieur?.x ?? 3.0} onChange={(e) => handlePriceRuleChange('interieur', 'x', e.target.value)} className="w-12 p-1 border rounded text-center text-xs"/><input type="number" step="1" value={safePricing.interieur?.b ?? 40} onChange={(e) => handlePriceRuleChange('interieur', 'b', e.target.value)} className="w-12 p-1 border rounded text-center text-xs"/></div></div>
                    <div className="flex items-center justify-between"><span className="text-xs font-bold">MULTIFOCAL</span><div className="flex gap-2"><input type="number" step="0.1" value={safePricing.multifocal?.x ?? 3.0} onChange={(e) => handlePriceRuleChange('multifocal', 'x', e.target.value)} className="w-12 p-1 border rounded text-center text-xs"/><input type="number" step="1" value={safePricing.multifocal?.b ?? 40} onChange={(e) => handlePriceRuleChange('multifocal', 'b', e.target.value)} className="w-12 p-1 border rounded text-center text-xs"/></div></div>
                 </div>
               </div>
              <button onClick={() => setShowSettings(false)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600">FERMER</button>
           </div>
        </div>
      )}
      
      {/* MODALE HISTORIQUE (Identique) */}
      {showHistory && (<div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-center items-center p-4" onClick={(e) => { if(e.target === e.currentTarget) setShowHistory(false); }}><div className="bg-white w-full max-w-4xl rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto text-slate-800"><div className="flex justify-between items-center mb-8"><h2 className="font-bold text-2xl flex items-center gap-3"><FolderOpen className="w-8 h-8 text-blue-600"/> DOSSIERS CLIENTS</h2><button onClick={() => setShowHistory(false)}><X className="w-6 h-6 text-slate-400"/></button></div><div className="grid grid-cols-1 gap-4">{savedOffers.length === 0 ? <div className="text-center text-slate-400 py-10 font-bold">AUCUN DOSSIER ENREGISTRÉ</div> : savedOffers.map(offer => (<div key={offer.id} className="p-4 border rounded-xl flex justify-between items-center hover:bg-slate-50 transition-colors"><div className="flex items-center gap-4"><div className="bg-blue-100 p-3 rounded-full text-blue-600"><User className="w-5 h-5"/></div><div><div className="font-bold text-lg">{offer.client.name} {offer.client.firstname}</div><div className="text-xs text-slate-500 font-mono flex items-center gap-2"><Calendar className="w-3 h-3"/> NÉ(E) LE {offer.client.dob} • DOSSIER DU {offer.date}</div></div></div><div className="text-right"><div className="font-bold text-slate-800">{offer.lens.name}</div><div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded inline-block mt-1">RESTE À CHARGE : {parseFloat(offer.finance.remainder).toFixed(2)} €</div></div><div className="text-xs text-green-600 font-bold flex items-center gap-1"><Lock className="w-3 h-3"/> CHIFFRÉ</div></div>))}</div></div></div>)}
    </div>
  );
}

export default App;