import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Search, RefreshCw, Trophy, Shield, Star, 
  Glasses, Ruler, ChevronRight, Layers, Sun, Monitor, Sparkles, Tag, Eye, EyeOff, Settings, X, Save, Store, Image as ImageIcon, Upload, Car, ArrowRightLeft, XCircle, Wifi, WifiOff, Server, BoxSelect, ChevronLeft, Sliders, DownloadCloud, Calculator, Info, User, Calendar, Wallet, Coins
} from 'lucide-react';

// --- VERSION APPLICATION ---
const APP_VERSION = "3.05"; // Persistance Identité & Paramètres

// --- CONFIGURATION STATIQUE ---
const DEFAULT_PRICING_CONFIG = { x: 2.5, b: 20 };

// --- DONNÉES DE SECOURS (RÉTABLIES) ---
const MOCK_LENSES = [
  { 
    id: 1, 
    name: "MODE HORS LIGNE", 
    brand: "CODIR", 
    commercial_code: "MOCK-01",
    type: "PROGRESSIF", 
    index_mat: "1.60", 
    design: "AUDACE", 
    coating: "MISTRAL", 
    purchase_price: 80, 
    sellingPrice: 240, 
    margin: 160, 
    commercial_flow: "STOCK"
  },
];

// --- OUTILS COULEURS ---
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : "0 0 0";
};

// --- OUTILS TEXTE ---
const cleanText = (text) => {
  if (text === null || text === undefined) return "";
  return String(text).toUpperCase().trim();
};

// --- COMPOSANT LOGO MARQUE ---
const BrandLogo = ({ brand, className = "h-full w-auto" }) => {
  const [hasError, setHasError] = useState(false);
  const safeBrand = brand || 'unknown';
  const logoUrl = `/logos/${safeBrand.toLowerCase()}.png`;

  if (hasError || !brand) {
    return (
      <span className="text-xs font-bold text-slate-400 flex items-center justify-center h-full w-full px-1 text-center border border-dashed border-slate-200 rounded bg-slate-50">
        {safeBrand === '' ? 'TOUTES' : safeBrand}
      </span>
    );
  }

  return (
    <img 
      src={logoUrl} 
      alt={safeBrand} 
      className={`${className} object-contain`}
      onError={() => setHasError(true)}
    />
  );
};

// --- COMPOSANT LOGO RÉSEAU ---
const NetworkLogo = ({ network, isSelected, onClick }) => {
  const [hasError, setHasError] = useState(false);
  if (!network) return null;
  
  const fileName = network.toLowerCase().replace(' ', ''); 
  const logoUrl = `/logos/${fileName}.png`;

  const baseClass = "h-10 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center border-2 relative overflow-hidden bg-white";
  const activeClass = isSelected ? "border-blue-600 ring-2 ring-blue-100 scale-105 z-10 shadow-md" : "border-transparent hover:bg-slate-50 hover:border-slate-200 opacity-70 hover:opacity-100 grayscale hover:grayscale-0";

  return (
    <button onClick={onClick} className={`${baseClass} ${activeClass}`} title={network}>
        {hasError || network === 'HORS_RESEAU' ? (
            <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-700' : 'text-slate-500'}`}>
                {network === 'HORS_RESEAU' ? 'TARIF LIBRE' : network}
            </span>
        ) : (
            <img 
                src={logoUrl} 
                alt={network} 
                className="h-full w-auto object-contain max-w-[80px]"
                onError={() => setHasError(true)}
            />
        )}
        {isSelected && <div className="absolute inset-0 border-2 border-blue-600 rounded-lg pointer-events-none"></div>}
    </button>
  );
};

// --- COMPOSANT CARTE VERRE ---
const LensCard = ({ lens, index, currentTheme, showMargins, onSelect, isSelected }) => {
  if (!lens) return null;

  const podiumStyles = [
    { border: "border-yellow-400 ring-4 ring-yellow-50 shadow-xl shadow-yellow-100", badge: "bg-yellow-400 text-white border-yellow-500", icon: <Trophy className="w-5 h-5 text-white" />, label: "MEILLEUR CHOIX" },
    { border: `border-slate-200 shadow-lg ${currentTheme.shadow || ''}`, badge: `${currentTheme.light || 'bg-gray-100'} ${currentTheme.textDark || 'text-gray-800'} ${currentTheme.border || 'border-gray-200'}`, icon: <Shield className={`w-5 h-5 ${currentTheme.text || 'text-gray-600'}`} />, label: "OFFRE OPTIMISÉE" },
    { border: "border-slate-200 shadow-lg", badge: "bg-slate-100 text-slate-600 border-slate-200", icon: <Star className="w-5 h-5 text-orange-400" />, label: "PREMIUM" }
  ];

  const activeStyle = isSelected 
    ? { border: "border-blue-600 ring-4 ring-blue-100 shadow-2xl scale-[1.02]", badge: "bg-blue-600 text-white", icon: <ArrowRightLeft className="w-5 h-5"/>, label: "SÉLECTIONNÉ" }
    : (podiumStyles[index !== undefined && index < 3 ? index : 1]);

  const sPrice = parseFloat(lens.sellingPrice || 0);
  const pPrice = parseFloat(lens.purchase_price || 0);
  const mVal = parseFloat(lens.margin || 0);
  
  const displayMargin = (sPrice > 0) 
    ? ((mVal / sPrice) * 100).toFixed(0) 
    : "0";

  return (
    <div 
      onClick={() => onSelect && onSelect(lens)}
      className={`group bg-white rounded-3xl border-2 p-6 flex flex-col relative cursor-pointer transition-all duration-300 ${activeStyle.border} ${!isSelected ? 'hover:-translate-y-2' : ''}`}
    >
        <div className="absolute top-5 right-5 z-10">
          <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm ${activeStyle.badge}`}>
             {isSelected ? "CHOISI" : activeStyle.label}
          </span>
        </div>

        <div className="pt-8 border-b border-slate-50 pb-6 mb-6">
          <p className="text-[10px] font-mono text-slate-400 mb-2 tracking-widest uppercase">{lens.commercial_code || "REF-UNK"}</p>
          <h3 className="font-bold text-2xl text-slate-800 mb-2 leading-tight">{lens.name || "Nom Indisponible"}</h3>
          <div className="flex flex-wrap gap-2 mt-3">
             <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">{lens.brand || "?"}</span>
             <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">{lens.design || "STANDARD"}</span>
             <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">INDICE {lens.index_mat || "?"}</span>
          </div>
        </div>
        
        <div className="flex-1">
          {showMargins ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-3 rounded-xl border border-slate-100 text-center shadow-sm"><span className="block text-[10px] text-slate-400 font-bold mb-1">ACHAT HT</span><span className="block text-slate-400 line-through font-bold text-lg">{pPrice.toFixed(2)} €</span></div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 text-center shadow-sm"><span className="block text-[10px] text-slate-400 font-bold mb-1">VENTE TTC</span><span className="block text-slate-800 font-bold text-2xl">{sPrice.toFixed(2)} €</span></div>
              </div>
              <div className="pt-2">
                <div className="flex justify-between items-end mb-2"><span className="text-xs font-bold text-green-700 tracking-wide">MARGE NETTE</span><span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-lg">{displayMargin}%</span></div>
                <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center justify-between"><div className="text-4xl font-bold text-green-700 tracking-tight">+{mVal.toFixed(2)} €</div><Trophy className="w-8 h-8 text-green-200" /></div>
              </div>
            </>
          ) : (
            <div className="flex flex-col h-full justify-center">
                <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center mb-4 flex-1 flex flex-col justify-center items-center"><span className="block text-xs font-bold text-green-600 mb-2 uppercase tracking-wider">PRIX CONSEILLÉ (UNITAIRE)</span><span className="text-5xl font-bold text-green-600 tracking-tighter">{sPrice.toFixed(2)} €</span></div>
                <div className="flex justify-between items-center px-2">
                   <span className="text-[10px] font-mono text-slate-300 tracking-widest">REF-{lens.commercial_code || "---"}</span>
                   {lens.commercial_flow && (
                     <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${cleanText(lens.commercial_flow).includes('STOCK') ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                       {lens.commercial_flow}
                     </span>
                   )}
                </div>
            </div>
          )}
        </div>
    </div>
  );
};

function App() {
  // --- ETATS ---
  const [lenses, setLenses] = useState([]); 
  const [filteredLenses, setFilteredLenses] = useState([]); 
  const [availableDesigns, setAvailableDesigns] = useState([]); 
  const [availableCoatings, setAvailableCoatings] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(true); 
  
  const [showSettings, setShowSettings] = useState(false);
  const [showMargins, setShowMargins] = useState(false);
  const [selectedLens, setSelectedLens] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [comparisonLens, setComparisonLens] = useState(null); 

  // Synchro
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [sheetsUrl, setSheetsUrl] = useState(localStorage.getItem("optique_sheets_url") || "");

  const [stats, setStats] = useState({ total: 0, filtered: 0 });

  // --- NOUVEAUX ÉTATS CLIENT & DEVIS ---
  const [client, setClient] = useState({ name: '', firstname: '', dob: '', reimbursement: 0 });
  const [secondPairPrice, setSecondPairPrice] = useState(0);
  
  // Initialisation avec localStorage pour persistance des réglages
  const [userSettings, setUserSettings] = useState(() => {
    const saved = localStorage.getItem("optique_user_settings");
    return saved ? JSON.parse(saved) : {
        shopName: "MON OPTICIEN",
        shopLogo: "", 
        themeColor: "blue", 
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
  });

  // Sauvegarde automatique des réglages
  useEffect(() => {
    localStorage.setItem("optique_user_settings", JSON.stringify(userSettings));
  }, [userSettings]);

  const [formData, setFormData] = useState({
    network: 'HORS_RESEAU',
    brand: '', 
    type: 'PROGRESSIF',
    design: '', 
    sphere: 0.00,    
    cylinder: 0.00,
    addition: 0.00,  
    materialIndex: '1.60',
    coating: '', 
    cleanOption: false, 
    myopiaControl: false,
    uvOption: true,
    photochromic: false 
  });

  const [serverUrl, setServerUrl] = useState(localStorage.getItem("optique_server_url") || "https://api-podium-optique.onrender.com/lenses");
  const isLocal = window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1");
  const API_URL = isLocal ? "http://127.0.0.1:8000/lenses" : serverUrl;
  const SYNC_URL = isLocal ? "http://127.0.0.1:8000/sync" : serverUrl.replace('/lenses', '/sync');

  // --- COULEURS ---
  useEffect(() => {
    const root = document.documentElement;
    if (userSettings.themeColor === 'custom') {
      const rgb = hexToRgb(userSettings.customColor);
      root.style.setProperty('--theme-primary', userSettings.customColor);
      root.style.setProperty('--theme-light', `rgb(${rgb} / 0.1)`);
      root.style.setProperty('--theme-border', `rgb(${rgb} / 0.2)`);
      root.style.setProperty('--theme-ring', `rgb(${rgb} / 0.5)`);
    } else {
      root.style.removeProperty('--theme-primary');
      root.style.removeProperty('--theme-light');
      root.style.removeProperty('--theme-border');
      root.style.removeProperty('--theme-ring');
    }
  }, [userSettings.themeColor, userSettings.customColor]);

  const themes = {
    blue: { name: 'OCÉAN', primary: 'bg-blue-700', hover: 'hover:bg-blue-800', text: 'text-blue-700', textDark: 'text-blue-900', light: 'bg-blue-50', border: 'border-blue-200', ring: 'ring-blue-300', shadow: 'shadow-blue-200' },
    emerald: { name: 'ÉMERAUDE', primary: 'bg-emerald-700', hover: 'hover:bg-emerald-800', text: 'text-emerald-700', textDark: 'text-emerald-900', light: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-300', shadow: 'shadow-emerald-200' },
    violet: { name: 'AMÉTHYSTE', primary: 'bg-violet-700', hover: 'hover:bg-violet-800', text: 'text-violet-700', textDark: 'text-violet-900', light: 'bg-violet-50', border: 'border-violet-200', ring: 'ring-violet-300', shadow: 'shadow-violet-200' },
    amber: { name: 'AMBRE', primary: 'bg-amber-700', hover: 'hover:bg-amber-800', text: 'text-amber-700', textDark: 'text-amber-900', light: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-300', shadow: 'shadow-amber-200' },
    rose: { name: 'RUBIS', primary: 'bg-rose-700', hover: 'hover:bg-rose-800', text: 'text-rose-700', textDark: 'text-rose-900', light: 'bg-rose-50', border: 'border-rose-200', ring: 'ring-rose-300', shadow: 'shadow-rose-200' },
    custom: { name: 'PERSO', primary: 'bg-[var(--theme-primary)]', hover: 'hover:opacity-90', text: 'text-[var(--theme-primary)]', textDark: 'text-black', light: 'bg-[var(--theme-light)]', border: 'border-[var(--theme-border)]', ring: 'ring-[var(--theme-ring)]', shadow: 'shadow-md' }
  };

  const currentTheme = themes[userSettings.themeColor] || themes.blue;
  const brands = [ 
    { id: '', label: 'TOUTES' },
    { id: 'HOYA', label: 'HOYA' }, 
    { id: 'ZEISS', label: 'ZEISS' }, 
    { id: 'SEIKO', label: 'SEIKO' }, 
    { id: 'CODIR', label: 'CODIR' }, 
    { id: 'ORUS', label: 'ORUS' } 
  ];
  
  const networks = ['HORS_RESEAU', 'KALIXIA', 'SANTECLAIR', 'CARTEBLANCHE', 'ITELIS', 'SEVEANE'];

  const lensTypes = [ 
    { id: 'UNIFOCAL', label: 'UNIFOCAL' }, 
    { id: 'PROGRESSIF', label: 'PROGRESSIF' }, 
    { id: 'DEGRESSIF', label: 'DÉGRESSIF' }, 
    { id: 'MULTIFOCAL', label: 'MULTIFOCAL' },
    { id: "PROGRESSIF D'INTÉRIEUR", label: "PROG. INTÉRIEUR" }
  ];
  const indices = ['1.50', '1.58', '1.60', '1.67', '1.74'];
  const codirCoatings = [ { id: 'MISTRAL', label: 'MISTRAL', type: 'CLASSIC', icon: <Sparkles className="w-3 h-3"/> }, { id: 'E_PROTECT', label: 'E-PROTECT', type: 'BLUE', icon: <Monitor className="w-3 h-3"/> }, { id: 'QUATTRO_UV', label: 'QUATTRO UV', type: 'CLASSIC', icon: <Shield className="w-3 h-3"/> }, { id: 'B_PROTECT', label: 'B-PROTECT', type: 'BLUE', icon: <Monitor className="w-3 h-3"/> }, { id: 'QUATTRO_UV_CLEAN', label: 'QUATTRO UV CLEAN', type: 'CLEAN', icon: <Shield className="w-3 h-3"/> }, { id: 'B_PROTECT_CLEAN', label: 'B-PROTECT CLEAN', type: 'CLEAN', icon: <Monitor className="w-3 h-3"/> }, ];
  const currentCoatings = codirCoatings; 

  // 1. RECHARGEMENT
  useEffect(() => {
    setFormData(prev => ({ ...prev, coating: '' }));
    fetchData(); 
  }, [formData.brand, formData.network, formData.type]); 

  // 2. FILTRAGE LOCAL
  useEffect(() => {
    const safeLenses = lenses || [];
    if (safeLenses.length > 0) {
       let workingList = safeLenses.map(l => ({...l}));

       if (formData.brand && formData.brand !== '') {
           workingList = workingList.filter(l => cleanText(l.brand) === cleanText(formData.brand));
       }

       if (formData.type) {
         const targetType = cleanText(formData.type);
         if (targetType.includes("INTERIEUR")) {
            workingList = workingList.filter(l => cleanText(l.type).includes("INTERIEUR"));
         } else {
            workingList = workingList.filter(l => cleanText(l.type).includes(targetType));
         }
       }

       if (formData.network === 'HORS_RESEAU') {
          const pRules = userSettings.pricing || {};
          workingList = workingList.map(lens => {
             let rule = pRules.prog || DEFAULT_PRICING_CONFIG; 
             const lensType = cleanText(lens.type);
             const lensName = cleanText(lens.name);
             const flow = cleanText(lens.commercial_flow);

             if (lensType.includes('UNIFOCAL')) {
                 const isStock = flow.includes('STOCK') || lensName.includes(' ST') || lensName.includes('_ST');
                 rule = isStock ? (pRules.uniStock || DEFAULT_PRICING_CONFIG) : (pRules.uniFab || DEFAULT_PRICING_CONFIG);
             } 
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
           const priceMap = {
                'KALIXIA': 'sell_kalixia', 'ITELIS': 'sell_itelis', 
                'CARTEBLANCHE': 'sell_carteblanche', 'SEVEANE': 'sell_seveane', 
                'SANTECLAIR': 'sell_santeclair'
           };
           const key = priceMap[formData.network];
           workingList = workingList.map(l => {
               const sPrice = l[key] ? parseFloat(l[key]) : 0;
               return { ...l, sellingPrice: sPrice, margin: sPrice - (parseFloat(l.purchase_price)||0) };
           });
           workingList = workingList.filter(l => l.sellingPrice > 0);
       }

       workingList = workingList.filter(l => {
           if(!l.index_mat) return false;
           const lIdx = String(l.index_mat).replace(',', '.');
           const fIdx = String(formData.materialIndex).replace(',', '.');
           return Math.abs(parseFloat(lIdx) - parseFloat(fIdx)) < 0.01;
       });

       const isPhotoC = (item) => {
          const text = cleanText(item.name + " " + item.material + " " + item.coating);
          return text.includes("TRANS") || text.includes("GEN S") || text.includes("SOLACTIVE") || text.includes("TGNS") || text.includes("SABR") || text.includes("SAGR") || text.includes("SUN");
       };
       if (formData.photochromic) {
         workingList = workingList.filter(l => isPhotoC(l));
       } else {
         workingList = workingList.filter(l => !isPhotoC(l));
       }

       const coatings = [...new Set(workingList.map(l => l.coating).filter(Boolean))].sort();
       setAvailableCoatings(coatings);

       if (formData.coating && formData.coating !== '') {
          workingList = workingList.filter(l => cleanText(l.coating) === cleanText(formData.coating));
       }

       if (formData.myopiaControl) {
          workingList = workingList.filter(l => cleanText(l.name).includes("MIYO"));
       }

       const designs = [...new Set(workingList.map(l => l.design).filter(Boolean))].sort();
       setAvailableDesigns(designs);

       if (formData.design && formData.design !== '') {
         setFilteredLenses(workingList.filter(l => cleanText(l.design) === cleanText(formData.design)));
       } else {
         setFilteredLenses(workingList);
       }

       setStats({ total: lenses.length, filtered: workingList.length });
    } else {
       setAvailableDesigns([]);
       setAvailableCoatings([]);
       setFilteredLenses([]);
       setStats({ total: 0, filtered: 0 });
    }
  }, [lenses, formData, userSettings.pricing]);

  const fetchData = (ignoreFilters = false) => {
    setLoading(true);
    setError(null); 
    if (!isLocal && API_URL.includes("VOTRE-URL")) { setLenses(MOCK_LENSES); setLoading(false); return; }

    const params = {
        type: formData.type, 
        brand: formData.brand === '' ? undefined : formData.brand, 
        pocketLimit: 0 
    };

    axios.get(API_URL, { params })
      .then(response => {
        setIsOnline(true);
        setLenses(Array.isArray(response.data) ? response.data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur connexion:", err);
        setIsOnline(false); setLenses(MOCK_LENSES); setLoading(false);
      });
  };

  // Handlers
  const triggerSync = () => {
      if (!sheetsUrl) return alert("Veuillez entrer une URL Google Sheets");
      setSyncLoading(true);
      axios.post(SYNC_URL, { url: sheetsUrl }).then(res => { fetchData(); }).finally(() => setSyncLoading(false));
  };
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  const handleClientChange = (e) => {
    const { name, value } = e.target;
    setClient(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLogoUpload = (e, target = 'shop') => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { if (target === 'shop') { setUserSettings(prev => ({ ...prev, shopLogo: reader.result })); } }; reader.readAsDataURL(file); } };
  const handleSettingChange = (section, field, value) => { if (section === 'branding') { setUserSettings(prev => ({ ...prev, [field]: value })); } else { setUserSettings(prev => ({ ...prev, [section]: { ...prev[section], [field]: parseFloat(value) || 0 } })); } };
  const handlePriceRuleChange = (category, field, value) => { setUserSettings(prev => ({ ...prev, pricing: { ...prev.pricing, [category]: { ...prev.pricing[category], [field]: parseFloat(value) || 0 } } })); };
  const handleUrlChange = (value) => { setServerUrl(value); localStorage.setItem("optique_server_url", value); };
  const handleSheetsUrlChange = (value) => { setSheetsUrl(value); localStorage.setItem("optique_sheets_url", value); };
  const handleTypeChange = (newType) => { setFormData(prev => ({ ...prev, type: newType, design: '', coating: '' })); };
  const handleDesignChange = (newDesign) => { setFormData(prev => ({ ...prev, design: newDesign })); };
  const handleCoatingChange = (newCoating) => { setFormData(prev => ({ ...prev, coating: newCoating })); };
  const handleCompare = (lens) => { setComparisonLens(lens); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const clearComparison = () => { setComparisonLens(null); };
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const isAdditionDisabled = formData.type === 'UNIFOCAL' || formData.type === 'DEGRESSIF';
  const isMyopiaEligible = formData.type === 'UNIFOCAL' && (formData.brand === 'HOYA' || formData.brand === 'SEIKO');
  const isUvOptionVisible = ['CODIR', 'HOYA', 'SEIKO', 'ORUS'].includes(formData.brand);
  const uvOptionLabel = (formData.brand === 'CODIR' || formData.brand === 'ORUS') ? 'OPTION SUV (UV 400)' : 'OPTION IP+ (UV)';
  const isUvOptionMandatory = formData.materialIndex !== '1.50';

  const safePricing = userSettings.pricing || { uniStock: { x: 2.5, b: 20 }, uniFab: { x: 3.0, b: 30 }, prog: { x: 3.2, b: 50 }, degressif: { x: 3.0, b: 40 }, interieur: { x: 3.0, b: 40 }, multifocal: { x: 3.0, b: 40 } };

  // CALCUL PRIX FINAL
  const lensPrice = selectedLens ? parseFloat(selectedLens.sellingPrice) : 0;
  const totalPair = lensPrice * 2;
  const totalSecondPair = parseFloat(secondPairPrice || 0);
  const totalRefund = parseFloat(client.reimbursement || 0);
  const remainder = (totalPair + totalSecondPair) - totalRefund;

  return (
    <div className="min-h-screen flex flex-col text-slate-800 bg-slate-50 relative font-['Arial'] uppercase">
      {/* HEADER CLIENT & RESEAU */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm z-40">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4 flex-1 w-full lg:w-auto">
                <div className={`${currentTheme.primary} p-3 rounded-xl shadow-lg text-white hidden md:block`}><LayoutDashboard className="w-6 h-6"/></div>
                
                {/* FORMULAIRE CLIENT */}
                <div className="flex flex-wrap gap-2 items-center w-full">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                        <User className="w-4 h-4 text-slate-400"/>
                        <input type="text" name="name" placeholder="NOM" value={client.name} onChange={handleClientChange} className="bg-transparent w-24 font-bold text-sm outline-none"/>
                        <input type="text" name="firstname" placeholder="PRÉNOM" value={client.firstname} onChange={handleClientChange} className="bg-transparent w-24 font-bold text-sm outline-none border-l border-slate-200 pl-2"/>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                        <Calendar className="w-4 h-4 text-slate-400"/>
                        <input type="text" name="dob" placeholder="DD/MM/AAAA" value={client.dob} onChange={handleClientChange} className="bg-transparent w-24 font-bold text-sm outline-none"/>
                    </div>
                    
                    {/* LISTE RESEAUX EN HAUT (LOGOS) */}
                    <div className="flex items-center gap-2 ml-4 overflow-x-auto pb-1">
                         {networks.map(net => (
                            <NetworkLogo 
                               key={net} 
                               network={net} 
                               isSelected={formData.network === net} 
                               onClick={() => setFormData(prev => ({...prev, network: net}))}
                            />
                         ))}
                    </div>

                    {/* FORFAIT REMBOURSEMENT */}
                    <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-100 ml-auto">
                        <Wallet className="w-4 h-4 text-green-600"/>
                        <input type="number" name="reimbursement" placeholder="0" value={client.reimbursement} onChange={handleClientChange} className="bg-transparent w-16 font-bold text-sm text-green-700 text-right outline-none"/>
                        <span className="text-xs font-bold text-green-700">€</span>
                    </div>
                </div>
            </div>

            {/* ACTIONS DROITE */}
            <div className="flex items-center gap-2">
                <button onClick={() => setShowMargins(!showMargins)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><EyeOff className="w-5 h-5"/></button>
                <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><Settings className="w-5 h-5"/></button>
            </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-0">
        {/* SIDEBAR FILTRES */}
        <aside className={`bg-white border-r border-slate-200 flex flex-col overflow-y-auto z-20 transition-all duration-300 w-80 ${isSidebarOpen ? '' : 'hidden'}`}>
            <div className="p-6 space-y-6 pb-32">
                {/* MARQUE */}
                <div>
                    <label className="text-[10px] font-bold text-slate-400 mb-2 block">MARQUE</label>
                    <div className="grid grid-cols-2 gap-2">
                        {brands.map(b => (
                            <button key={b.id} onClick={() => setFormData({...formData, brand: b.id})} className={`p-2 border rounded-lg text-[10px] font-bold ${formData.brand === b.id ? 'bg-slate-800 text-white' : 'hover:bg-slate-50'}`}>
                                {b.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CORRECTION */}
                <div>
                    <label className="text-[10px] font-bold text-slate-400 mb-2 block">CORRECTION</label>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                        <div className="relative"><input type="number" step="0.25" name="sphere" value={formData.sphere} onChange={handleChange} className="w-full p-2 pl-3 border rounded-lg font-bold text-sm" placeholder="SPH"/><span className="absolute right-2 top-2 text-[10px] text-slate-400">D</span></div>
                        <div className="relative"><input type="number" step="0.25" name="cylinder" value={formData.cylinder} onChange={handleChange} className="w-full p-2 pl-3 border rounded-lg font-bold text-sm" placeholder="CYL"/><span className="absolute right-2 top-2 text-[10px] text-slate-400">D</span></div>
                    </div>
                    <div className={`relative transition-opacity ${isAdditionDisabled ? 'opacity-50' : ''}`}>
                        <input type="number" step="0.25" name="addition" value={formData.addition} onChange={handleChange} disabled={isAdditionDisabled} className="w-full p-2 pl-3 border rounded-lg font-bold text-sm" placeholder="ADD"/><span className="absolute right-2 top-2 text-[10px] text-slate-400">D</span>
                    </div>
                </div>

                {/* GEOMETRIE */}
                <div>
                    <label className="text-[10px] font-bold text-slate-400 mb-2 block">GÉOMÉTRIE</label>
                    <div className="flex flex-col gap-1">
                        {lensTypes.map(t => (
                            <button key={t.id} onClick={() => handleTypeChange(t.id)} className={`px-3 py-2 rounded-lg text-left text-xs font-bold border ${formData.type === t.id ? 'bg-slate-800 text-white border-slate-800' : 'border-transparent hover:bg-slate-50 text-slate-500'}`}>{t.label}</button>
                        ))}
                    </div>
                </div>

                {/* DESIGN */}
                {availableDesigns.length > 0 && (
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 mb-2 block">DESIGN</label>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => handleDesignChange('')} className={`px-2 py-1 rounded border text-[10px] font-bold ${formData.design === '' ? 'bg-slate-800 text-white' : ''}`}>TOUS</button>
                            {availableDesigns.map(d => (
                                <button key={d} onClick={() => handleDesignChange(d)} className={`px-2 py-1 rounded border text-[10px] font-bold ${formData.design === d ? 'bg-slate-800 text-white' : 'text-slate-600'}`}>{d}</button>
                            ))}
                        </div>
                    </div>
                )}

                {/* INDICE */}
                <div>
                    <label className="text-[10px] font-bold text-slate-400 mb-2 block">INDICE</label>
                    <div className="flex gap-1">
                        {indices.map(i => (
                            <button key={i} onClick={() => setFormData({...formData, materialIndex: i})} className={`flex-1 py-2 rounded border text-[10px] font-bold ${formData.materialIndex === i ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>{i}</button>
                        ))}
                    </div>
                </div>

                {/* TRAITEMENTS */}
                <div>
                    <label className="text-[10px] font-bold text-slate-400 mb-2 block">TRAITEMENTS</label>
                    <button onClick={() => handleCoatingChange('')} className={`w-full py-2 mb-2 text-[10px] font-bold rounded border ${formData.coating === '' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>TOUS</button>
                    
                    <label className={`flex items-center gap-2 p-2 rounded border cursor-pointer mb-2 ${formData.photochromic ? 'bg-yellow-50 border-yellow-300' : 'border-transparent hover:bg-slate-50'}`}>
                        <input type="checkbox" checked={formData.photochromic} onChange={handleChange} name="photochromic" className="accent-yellow-500"/>
                        <span className={`text-[10px] font-bold ${formData.photochromic ? 'text-yellow-700' : 'text-slate-500'}`}>PHOTOCHROMIQUE</span>
                    </label>

                    <div className="flex flex-col gap-1">
                        {availableCoatings.length > 0 ? availableCoatings.map(c => (
                            <button key={c} onClick={() => handleCoatingChange(c)} className={`p-2 rounded border text-left text-[10px] font-bold ${formData.coating === c ? 'bg-blue-50 border-blue-200 text-blue-800' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>{c}</button>
                        )) : <div className="text-[10px] text-slate-300 italic text-center">Aucun traitement spécifique</div>}
                    </div>
                </div>
            </div>
        </aside>

        {/* RESULTATS */}
        <section className="flex-1 p-6 overflow-y-auto bg-slate-50 pb-40">
            <div className="max-w-7xl mx-auto">
                {/* COMPARAISON */}
                {comparisonLens && (
                    <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="flex justify-between mb-4"><h3 className="font-bold text-blue-800 text-sm">PRODUIT DE RÉFÉRENCE</h3><button onClick={() => setComparisonLens(null)}><XCircle className="w-5 h-5 text-blue-400"/></button></div>
                        <div className="w-full max-w-sm">
                            <LensCard lens={comparisonLens} index={0} currentTheme={currentTheme} showMargins={showMargins} isReference={true} />
                        </div>
                    </div>
                )}

                {/* GRILLE RESULTATS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredLenses.map((lens, index) => (
                        <LensCard 
                           key={lens.id} 
                           lens={lens} 
                           index={index} 
                           currentTheme={currentTheme} 
                           showMargins={showMargins} 
                           onCompare={handleCompare} 
                           onSelect={setSelectedLens}
                           isSelected={selectedLens && selectedLens.id === lens.id}
                        />
                    ))}
                </div>
                {filteredLenses.length === 0 && !loading && <div className="text-center py-20 text-slate-400 text-sm font-bold">AUCUN VERRE TROUVÉ</div>}
            </div>
        </section>
      </div>

      {/* FOOTER DEVIS (FIXE EN BAS) */}
      {selectedLens && (
          <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-2xl z-50 p-4 animate-in slide-in-from-bottom-10">
              <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
                  
                  {/* INFO VERRE */}
                  <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><Glasses className="w-6 h-6"/></div>
                      <div>
                          <div className="text-[10px] text-slate-400 font-bold mb-0.5">VERRE SÉLECTIONNÉ</div>
                          <div className="font-bold text-slate-800 text-sm leading-tight">{selectedLens.name}</div>
                          <div className="text-[10px] text-slate-500">{selectedLens.design} - {selectedLens.index_mat} - {selectedLens.coating}</div>
                      </div>
                  </div>

                  {/* CALCUL PRIX PAIRE */}
                  <div className="flex items-center gap-8 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                      <div className="text-center">
                          <div className="text-[9px] font-bold text-slate-400">UNITAIRE</div>
                          <div className="font-bold text-lg text-slate-700">{parseFloat(selectedLens.sellingPrice).toFixed(2)} €</div>
                      </div>
                      <div className="text-slate-300 text-xl">x 2</div>
                      <div className="text-center">
                          <div className="text-[9px] font-bold text-blue-600">TOTAL PAIRE</div>
                          <div className="font-bold text-2xl text-blue-700">{totalPair.toFixed(2)} €</div>
                      </div>
                  </div>

                  {/* 2EME PAIRE & RESTE A CHARGE */}
                  <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-xl border border-orange-100">
                          <Coins className="w-4 h-4 text-orange-500"/>
                          <div className="flex flex-col">
                             <span className="text-[8px] font-bold text-orange-400">2ÈME PAIRE</span>
                             <input type="number" value={secondPairPrice} onChange={(e) => setSecondPairPrice(parseFloat(e.target.value))} className="w-16 bg-transparent font-bold text-orange-700 outline-none text-sm" placeholder="0"/>
                          </div>
                      </div>

                      <div className="flex flex-col items-end">
                          <div className="text-[10px] font-bold text-slate-400">RESTE À CHARGE CLIENT</div>
                          <div className={`text-3xl font-black ${remainder > 0 ? 'text-slate-800' : 'text-green-600'}`}>
                              {remainder.toFixed(2)} €
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MODALE SETTINGS */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-center items-center p-4" onClick={(e) => { if(e.target === e.currentTarget) setShowSettings(false); }}>
           <div className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="font-bold text-xl mb-4">PARAMÈTRES</h2>
              {/* Gestion Catalogue */}
              <div className="mb-6">
                 <label className="block text-xs font-bold text-slate-500 mb-2">URL GOOGLE SHEETS</label>
                 <div className="flex gap-2">
                    <input type="text" value={sheetsUrl} onChange={(e) => handleSheetsUrlChange(e.target.value)} className="flex-1 p-2 border rounded"/>
                    <button onClick={triggerSync} disabled={syncLoading} className="bg-blue-600 text-white px-4 rounded text-xs font-bold">SYNCHRO</button>
                 </div>
                 {syncStatus && <p className="text-xs mt-2 text-green-600">{syncStatus.msg}</p>}
              </div>
              {/* Formule Prix */}
              <div className="mb-6">
                  <h4 className="text-sm font-bold text-slate-600 mb-4 border-b pb-2">PRIX MARCHÉ LIBRE</h4>
                  <div className="grid grid-cols-1 gap-4">
                      {/* Exemple Unifocal Stock */}
                      <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">UNIFOCAL STOCK</span>
                          <div className="flex gap-2">
                              <input type="number" step="0.1" value={userSettings.pricing.uniStock.x} onChange={(e) => handlePriceRuleChange('uniStock', 'x', e.target.value)} className="w-16 p-1 border rounded text-center text-xs"/>
                              <input type="number" step="1" value={userSettings.pricing.uniStock.b} onChange={(e) => handlePriceRuleChange('uniStock', 'b', e.target.value)} className="w-16 p-1 border rounded text-center text-xs"/>
                          </div>
                      </div>
                      {/* ... Répéter pour les autres ... */}
                  </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600">FERMER</button>
           </div>
        </div>
      )}
    </div>
  );
}

export default App;