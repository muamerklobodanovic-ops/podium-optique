import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Search, RefreshCw, Trophy, Shield, Star, 
  Glasses, Ruler, ChevronRight, Layers, Sun, Monitor, Sparkles, Tag, Eye, EyeOff, Settings, X, Save, Store, Image as ImageIcon, Upload, Car, ArrowRightLeft, XCircle, Wifi, WifiOff, Server, BoxSelect, ChevronLeft, ChevronDown, ChevronUp, Sliders
} from 'lucide-react';

// --- VERSION APPLICATION ---
const APP_VERSION = "1.07"; // Fix Modale Settings + Sidebar Mobile

// --- OUTILS COULEURS ---
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : "0 0 0";
};

// --- COMPOSANT LOGOS (IMAGES PNG) ---
const BrandLogo = ({ brand, className = "h-full w-auto" }) => {
  const safeBrand = brand || 'unknown';
  const logoUrl = `/logos/${safeBrand.toLowerCase()}.png`;

  return (
    <img 
      src={logoUrl} 
      alt={safeBrand} 
      className={`${className} object-contain`}
      onError={(e) => {
        e.target.style.display = 'none';
        const span = document.createElement('span');
        span.innerText = safeBrand;
        span.className = "text-xs font-bold text-slate-400 flex items-center justify-center h-full w-full";
        if(e.target.parentNode) e.target.parentNode.appendChild(span);
      }}
    />
  );
};

// --- DONNÉES DE SECOURS ---
const MOCK_LENSES = [
  { id: 1, name: "MODE HORS LIGNE", brand: "CODIR", index_mat: "1.60", design: "AUDACE", purchasePrice: 80, sellingPrice: 240, margin: 160 },
  { id: 2, name: "EXEMPLE", brand: "CODIR", index_mat: "1.67", design: "INFINI", purchasePrice: 110, sellingPrice: 310, margin: 200 },
];

// --- COMPOSANT CARTE VERRE ---
const LensCard = ({ lens, index, currentTheme, showMargins, onCompare, isReference = false }) => {
  const podiumStyles = [
    { border: "border-yellow-400 ring-4 ring-yellow-50 shadow-xl shadow-yellow-100", badge: "bg-yellow-400 text-white border-yellow-500", icon: <Trophy className="w-5 h-5 text-white" />, label: "MEILLEUR CHOIX" },
    { border: `border-slate-200 shadow-lg ${currentTheme.shadow}`, badge: `${currentTheme.light} ${currentTheme.textDark} ${currentTheme.border}`, icon: <Shield className={`w-5 h-5 ${currentTheme.text}`} />, label: "RESTE À CHARGE OPTIMISÉ" },
    { border: "border-slate-200 shadow-lg", badge: "bg-slate-100 text-slate-600 border-slate-200", icon: <Star className="w-5 h-5 text-orange-400" />, label: "PREMIUM" }
  ];

  const style = isReference 
    ? { border: "border-blue-500 ring-4 ring-blue-50 shadow-xl", badge: "bg-blue-600 text-white", icon: <ArrowRightLeft className="w-5 h-5"/>, label: "RÉFÉRENCE" }
    : (podiumStyles[index] || podiumStyles[1]);

  return (
    <div className={`group bg-white rounded-3xl border-2 transition-all duration-300 overflow-hidden relative flex flex-col ${style.border} ${isReference ? 'scale-100' : 'hover:-translate-y-2'}`}>
        <div className="absolute top-5 right-5 z-10">
          <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm ${style.badge}`}>
            {style.icon} {style.label}
          </span>
        </div>

        <div className="p-8 pt-14 border-b border-slate-50 relative">
          <h3 className="font-bold text-2xl text-slate-800 mb-2 leading-tight">{lens.name}</h3>
          <div className="flex flex-wrap gap-2 mt-3">
             <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">{lens.brand}</span>
             <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">{lens.design || "STANDARD"}</span>
             <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">INDICE {lens.index_mat}</span>
          </div>
        </div>
        
        <div className="p-8 bg-slate-50/50 group-hover:bg-white transition-colors space-y-6 flex-1">
          {showMargins ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-xl border border-slate-100 text-center shadow-sm"><span className="block text-[10px] text-slate-400 font-bold mb-1">ACHAT HT</span><span className="block text-slate-400 line-through font-bold text-lg">{lens.purchasePrice} €</span></div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 text-center shadow-sm"><span className="block text-[10px] text-slate-400 font-bold mb-1">VENTE TTC</span><span className="block text-slate-800 font-bold text-2xl">{lens.sellingPrice} €</span></div>
              </div>
              <div className="pt-2">
                <div className="flex justify-between items-end mb-2"><span className="text-xs font-bold text-green-700 tracking-wide">MARGE NETTE</span><span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-lg">{lens.sellingPrice > 0 ? ((lens.margin / lens.sellingPrice) * 100).toFixed(0) : 0}%</span></div>
                <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center justify-between"><div className="text-4xl font-bold text-green-700 tracking-tight">+{lens.margin} €</div><Trophy className="w-8 h-8 text-green-200" /></div>
              </div>
            </>
          ) : (
            <div className="pt-2 flex flex-col h-full">
                <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center mb-4 flex-1 flex flex-col justify-center items-center"><span className="block text-xs font-bold text-green-600 mb-2 uppercase tracking-wider">PRIX CONSEILLÉ</span><span className="text-5xl font-bold text-green-600 tracking-tighter">{lens.sellingPrice} €</span></div>
                <div className="text-left pl-1"><span className="text-[10px] font-mono text-slate-300 tracking-widest">REF-{Math.floor(lens.margin * 4.2 + 1000)}</span></div>
            </div>
          )}
        </div>
        {!isReference && (
          <div className="p-4 bg-white border-t border-slate-100">
            <button onClick={() => onCompare(lens)} className="w-full py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"><ArrowRightLeft className="w-4 h-4" /> COMPARER</button>
          </div>
        )}
    </div>
  );
};

function App() {
  // --- ETATS ---
  const [lenses, setLenses] = useState([]); 
  const [filteredLenses, setFilteredLenses] = useState([]); 
  const [availableDesigns, setAvailableDesigns] = useState([]); 

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(true); 
  
  const [showSettings, setShowSettings] = useState(false);
  const [showMargins, setShowMargins] = useState(false);
  const [comparisonLens, setComparisonLens] = useState(null);
  
  // Nouvel état pour gérer l'affichage du panneau latéral
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Etat pour la synchro Google Sheets
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [sheetsUrl, setSheetsUrl] = useState(localStorage.getItem("optique_sheets_url") || "");

  const [userSettings, setUserSettings] = useState({
    shopName: "MON OPTICIEN",
    shopLogo: "", 
    themeColor: "blue", 
    customColor: "#2563eb",
    brandLogos: { HOYA: "", ZEISS: "", SEIKO: "", CODIR: "", ORUS: "" },
    UNIFOCAL: { maxPocket: 40 },
    PROGRESSIF: { maxPocket: 100 },
    DEGRESSIF: { maxPocket: 70 },
    INTERIEUR: { maxPocket: 70 }
  });

  const [formData, setFormData] = useState({
    network: 'HORS_RESEAU',
    brand: 'ORUS',         
    type: 'PROGRESSIF',
    design: '', 
    sphere: 0.00,    
    cylinder: 0.00,
    addition: 0.00,  
    materialIndex: '1.60',
    coating: 'MISTRAL', 
    cleanOption: false, 
    myopiaControl: false,
    uvOption: true,
    photochromic: false 
  });

  const [serverUrl, setServerUrl] = useState(localStorage.getItem("optique_server_url") || "https://api-podium-optique.onrender.com/lenses");
  const isLocal = window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1");
  const API_URL = isLocal ? "http://127.0.0.1:8000/lenses" : serverUrl;
  const SYNC_URL = isLocal ? "http://127.0.0.1:8000/sync" : serverUrl.replace('/lenses', '/sync');

  // --- GESTION DES COULEURS DYNAMIQUES ---
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

  // Gestion responsive : masquer le panneau sur mobile au chargement
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        // Sur mobile/tablette, on peut vouloir masquer par défaut ou laisser l'utilisateur choisir
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const themes = {
    blue: { name: 'OCÉAN', primary: 'bg-blue-700', hover: 'hover:bg-blue-800', text: 'text-blue-700', textDark: 'text-blue-900', light: 'bg-blue-50', border: 'border-blue-200', ring: 'ring-blue-300', shadow: 'shadow-blue-200' },
    emerald: { name: 'ÉMERAUDE', primary: 'bg-emerald-700', hover: 'hover:bg-emerald-800', text: 'text-emerald-700', textDark: 'text-emerald-900', light: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-300', shadow: 'shadow-emerald-200' },
    violet: { name: 'AMÉTHYSTE', primary: 'bg-violet-700', hover: 'hover:bg-violet-800', text: 'text-violet-700', textDark: 'text-violet-900', light: 'bg-violet-50', border: 'border-violet-200', ring: 'ring-violet-300', shadow: 'shadow-violet-200' },
    amber: { name: 'AMBRE', primary: 'bg-amber-700', hover: 'hover:bg-amber-800', text: 'text-amber-700', textDark: 'text-amber-900', light: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-300', shadow: 'shadow-amber-200' },
    rose: { name: 'RUBIS', primary: 'bg-rose-700', hover: 'hover:bg-rose-800', text: 'text-rose-700', textDark: 'text-rose-900', light: 'bg-rose-50', border: 'border-rose-200', ring: 'ring-rose-300', shadow: 'shadow-rose-200' },
    custom: { 
        name: 'PERSO', 
        primary: 'bg-[var(--theme-primary)]', 
        hover: 'hover:opacity-90', 
        text: 'text-[var(--theme-primary)]', 
        textDark: 'text-black', 
        light: 'bg-[var(--theme-light)]', 
        border: 'border-[var(--theme-border)]', 
        ring: 'ring-[var(--theme-ring)]', 
        shadow: 'shadow-md' 
    }
  };

  const currentTheme = themes[userSettings.themeColor] || themes.blue;

  const brands = [ { id: 'HOYA', label: 'HOYA' }, { id: 'ZEISS', label: 'ZEISS' }, { id: 'SEIKO', label: 'SEIKO' }, { id: 'CODIR', label: 'CODIR' }, { id: 'ORUS', label: 'ORUS' } ];
  const lensTypes = [ { id: 'UNIFOCAL', label: 'UNIFOCAL' }, { id: 'PROGRESSIF', label: 'PROGRESSIF' }, { id: 'DEGRESSIF', label: 'DÉGRESSIF' }, { id: 'INTERIEUR', label: 'INTER. / BUREAU' } ];
  const indices = ['1.50', '1.58', '1.60', '1.67', '1.74'];
  
  const codirCoatings = [
    { id: 'MISTRAL', label: 'MISTRAL', type: 'CLASSIC', icon: <Sparkles className="w-3 h-3"/> },
    { id: 'E_PROTECT', label: 'E-PROTECT', type: 'BLUE', icon: <Monitor className="w-3 h-3"/> },
    { id: 'QUATTRO_UV', label: 'QUATTRO UV', type: 'CLASSIC', icon: <Shield className="w-3 h-3"/> },
    { id: 'B_PROTECT', label: 'B-PROTECT', type: 'BLUE', icon: <Monitor className="w-3 h-3"/> },
    { id: 'QUATTRO_UV_CLEAN', label: 'QUATTRO UV CLEAN', type: 'CLEAN', icon: <Shield className="w-3 h-3"/> },
    { id: 'B_PROTECT_CLEAN', label: 'B-PROTECT CLEAN', type: 'CLEAN', icon: <Monitor className="w-3 h-3"/> },
  ];
  const brandCoatings = { CODIR: codirCoatings, ORUS: codirCoatings, SEIKO: [ { id: 'SRC_ONE', label: 'SRC-ONE', type: 'CLASSIC', icon: <Sparkles className="w-3 h-3"/> }, { id: 'SRC_ULTRA', label: 'SRC-ULTRA', type: 'CLEAN', icon: <Shield className="w-3 h-3"/> }, { id: 'SRC_SCREEN', label: 'SRC-SCREEN', type: 'BLUE', icon: <Monitor className="w-3 h-3"/> }, { id: 'SRC_ROAD', label: 'SRC-ROAD', type: 'DRIVE', icon: <Car className="w-3 h-3"/> }, { id: 'SRC_SUN', label: 'SRC-SUN', type: 'SUN', icon: <Sun className="w-3 h-3"/> }, ], HOYA: [ { id: 'HA', label: 'HA', type: 'CLASSIC', icon: <Sparkles className="w-3 h-3"/> }, { id: 'HVLL', label: 'HVLL', type: 'CLASSIC', icon: <Shield className="w-3 h-3"/> }, { id: 'HVLL_UV', label: 'HVLL UV', type: 'CLASSIC', icon: <Shield className="w-3 h-3"/> }, { id: 'HVLL_BC', label: 'HVLL BC', type: 'BLUE', icon: <Monitor className="w-3 h-3"/> }, { id: 'HVLL_BCUV', label: 'HVLL BCUV', type: 'BLUE', icon: <Monitor className="w-3 h-3"/> }, ], ZEISS: [ { id: 'DV_SILVER', label: 'DV SILVER', type: 'CLASSIC', icon: <Sparkles className="w-3 h-3"/> }, { id: 'DV_PLATINUM', label: 'DV PLATINUM', type: 'CLASSIC', icon: <Shield className="w-3 h-3"/> }, { id: 'DV_BP', label: 'DV BLUEPROTECT', type: 'BLUE', icon: <Monitor className="w-3 h-3"/> }, { id: 'DV_DRIVE', label: 'DV DRIVESAFE', type: 'DRIVE', icon: <Car className="w-3 h-3"/> }, ] };
  const currentCoatings = brandCoatings[formData.brand] || brandCoatings.CODIR;

  useEffect(() => { fetchData(); }, []);

  // 1. RECHARGEMENT DES DONNÉES QUAND LES CRITÈRES CHANGENT
  useEffect(() => {
    if (['CODIR', 'SEIKO', 'HOYA', 'ORUS'].includes(formData.brand)) {
      if (formData.materialIndex !== '1.50') {
        if (!formData.uvOption) { setFormData(prev => ({ ...prev, uvOption: true })); }
      }
    }
    const coatingExists = formData.coating === '' || currentCoatings.find(c => c.id === formData.coating);
    if (!coatingExists) { setFormData(prev => ({ ...prev, coating: currentCoatings[0].id })); }

    fetchData(); 
  }, [
    formData.materialIndex, formData.brand, formData.network, formData.type, 
    formData.coating, formData.sphere, formData.cylinder, formData.addition, 
    formData.myopiaControl, formData.uvOption
  ]); 

  // 2. FILTRAGE LOCAL
  useEffect(() => {
    if (lenses.length > 0) {
       let validLenses = lenses;
       
       // Filtre Prix Kalixia
       if (formData.network === 'KALIXIA') {
         validLenses = lenses.filter(l => l.sellingPrice > 0);
       }

       // Filtre Photochromique
       const isPhotoC = (item) => {
          const text = (item.name + " " + item.coating).toUpperCase();
          return text.includes("TRANSITIONS") || 
                 text.includes("GEN S") || 
                 text.includes("SOLACTIVE") ||
                 text.includes("TGNS") || 
                 text.includes("SABR") || 
                 text.includes("SAGR");
       };

       if (formData.photochromic) {
         validLenses = validLenses.filter(l => isPhotoC(l));
       } else {
         validLenses = validLenses.filter(l => !isPhotoC(l));
       }

       const designs = [...new Set(validLenses.map(l => l.design).filter(Boolean))].sort();
       setAvailableDesigns(designs);

       if (formData.design) {
         setFilteredLenses(validLenses.filter(l => l.design === formData.design));
       } else {
         setFilteredLenses(validLenses);
       }
    } else {
       setAvailableDesigns([]);
       setFilteredLenses([]);
    }
  }, [lenses, formData.design, formData.network, formData.photochromic]); 


  const fetchData = (ignoreFilters = false) => {
    setLoading(true);
    setError(null); 
    
    if (!isLocal && API_URL.includes("VOTRE-URL")) {
      setLenses(MOCK_LENSES); setLoading(false); return;
    }

    const params = ignoreFilters ? {} : {
        type: formData.type, network: formData.network, brand: formData.brand, sphere: formData.sphere,
        index: formData.materialIndex, coating: formData.coating, clean: formData.cleanOption,
        myopia: formData.myopiaControl, uvOption: formData.uvOption, pocketLimit: userSettings[formData.type]?.maxPocket || 0
    };

    axios.get(API_URL, { params })
      .then(response => {
        setIsOnline(true);
        setLenses(response.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur connexion:", err);
        setIsOnline(false); setLenses(MOCK_LENSES); setLoading(false);
      });
  };

  const triggerSync = () => {
      if (!sheetsUrl) return alert("Veuillez entrer une URL Google Sheets");
      setSyncLoading(true);
      setSyncStatus(null);
      axios.post(SYNC_URL, { url: sheetsUrl })
          .then(res => {
              setSyncStatus({ type: 'success', msg: `Succès ! ${res.data.count} verres importés.` });
              fetchData(); 
          })
          .catch(err => {
              setSyncStatus({ type: 'error', msg: "Erreur : Vérifiez que le lien est bien public (CSV)." });
          })
          .finally(() => setSyncLoading(false));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;
    if (name === 'addition') { const val = parseFloat(value); if (val > 4.00) newValue = 4.00; if (val < 0) newValue = 0.00; }
    if (name === 'network') {
      const defaultBrand = (newValue === 'HORS_RESEAU') ? 'ORUS' : 'CODIR';
      setFormData(prev => ({ ...prev, [name]: newValue, brand: defaultBrand, myopiaControl: false }));
      return;
    }
    if (name === 'myopiaControl') {
      if (newValue === true) {
        setFormData(prev => ({ ...prev, [name]: newValue, materialIndex: '1.58' }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleLogoUpload = (e, target = 'shop') => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'shop') { setUserSettings(prev => ({ ...prev, shopLogo: reader.result })); } 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSettingChange = (section, field, value) => {
    if (section === 'branding') { setUserSettings(prev => ({ ...prev, [field]: value })); } 
    else { setUserSettings(prev => ({ ...prev, [section]: { ...prev[section], [field]: parseFloat(value) || 0 } })); }
  };
  const handleUrlChange = (value) => {
    setServerUrl(value);
    localStorage.setItem("optique_server_url", value); 
  };
  const handleSheetsUrlChange = (value) => {
    setSheetsUrl(value);
    localStorage.setItem("optique_sheets_url", value);
  };
  const handleTypeChange = (newType) => {
    const shouldDisableAdd = newType === 'UNIFOCAL' || newType === 'DEGRESSIF';
    setFormData(prev => ({ ...prev, type: newType, design: '', addition: shouldDisableAdd ? 0.00 : prev.addition, myopiaControl: newType === 'UNIFOCAL' ? prev.myopiaControl : false }));
  };
  const handleDesignChange = (newDesign) => { setFormData(prev => ({ ...prev, design: newDesign })); };
  const handleCoatingChange = (newCoating) => { setFormData(prev => ({ ...prev, coating: newCoating, cleanOption: false })); };
  const handleCompare = (lens) => { setComparisonLens(lens); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const clearComparison = () => { setComparisonLens(null); };
  
  // Fonction pour basculer le volet latéral
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const isAdditionDisabled = formData.type === 'UNIFOCAL' || formData.type === 'DEGRESSIF';
  const isMyopiaEligible = formData.type === 'UNIFOCAL' && (formData.brand === 'HOYA' || formData.brand === 'SEIKO');
  const isUvOptionVisible = ['CODIR', 'HOYA', 'SEIKO', 'ORUS'].includes(formData.brand);
  const uvOptionLabel = (formData.brand === 'CODIR' || formData.brand === 'ORUS') ? 'OPTION SUV (UV 400)' : 'OPTION IP+ (UV)';
  const isUvOptionMandatory = formData.materialIndex !== '1.50';

  return (
    <div className="min-h-screen flex flex-col text-slate-800 bg-slate-50 relative font-['Arial'] uppercase">
      <header className="bg-white border-b border-slate-200 px-6 py-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-6">
          <div className={`${currentTheme.primary} p-3 rounded-xl shadow-lg ${currentTheme.shadow} transition-colors duration-300`}>
            <LayoutDashboard className="w-8 h-8 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-slate-400 tracking-widest mb-1">PODIUM OPTIQUE</h1>
            <div className="flex items-center gap-4">
              {userSettings.shopLogo && ( <img src={userSettings.shopLogo} alt="Logo" className="h-16 w-auto object-contain max-w-[250px]" /> )}
              {!userSettings.shopLogo && <Store className="w-12 h-12 text-slate-300"/>}
              <p className={`text-4xl font-bold ${currentTheme.text} leading-none tracking-tight`}>{userSettings.shopName || "MON OPTICIEN"}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Bouton de toggle sidebar pour mobile */}
          <button onClick={toggleSidebar} className="lg:hidden p-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors" title="Afficher/Masquer Filtres">
             <Sliders className="w-8 h-8" />
          </button>

          <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isOnline ? <Wifi className="w-4 h-4"/> : <WifiOff className="w-4 h-4"/>}
            {isOnline ? "EN LIGNE" : "HORS LIGNE"}
          </div>
          <button onClick={() => setShowMargins(!showMargins)} className="p-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors" title={showMargins ? "MASQUER LES MARGES" : "AFFICHER LES MARGES"}>
            {showMargins ? <EyeOff className="w-8 h-8" /> : <Eye className="w-8 h-8" />}
          </button>
          <button onClick={() => setShowSettings(true)} className="p-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors group" title="PARAMÈTRES">
            <Settings className={`w-8 h-8 group-hover:${currentTheme.text} transition-colors`} />
          </button>
        </div>
      </header>

      {/* Container principal responsive */}
      <main className="flex-1 flex overflow-hidden relative z-0">
        
        {/* Colonne Gauche : Filtres (Rétractable sur mobile) */}
        <aside 
          className={`
            bg-white border-r border-slate-200 flex flex-col overflow-y-auto z-20 transition-all duration-300 ease-in-out
            ${isSidebarOpen ? 'w-full lg:w-[420px] translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-0 opacity-0 pointer-events-none'}
            absolute lg:relative h-full
          `}
        >
          {/* Bouton pour fermer le volet sur mobile */}
          <div className="lg:hidden p-4 border-b border-slate-100 flex justify-between items-center">
             <span className="font-bold text-slate-500">FILTRES</span>
             <button onClick={() => setIsSidebarOpen(false)}><ChevronLeft className="w-6 h-6 text-slate-400"/></button>
          </div>

          <div className="p-6 space-y-8">
             
             {/* Flèche de rétractation pour Desktop */}
             <button 
               onClick={() => setIsSidebarOpen(false)} 
               className="hidden lg:flex absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-full"
               title="Masquer le panneau"
             >
               <ChevronLeft className="w-5 h-5"/>
             </button>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-500 tracking-wider flex items-center gap-2"><Shield className="w-5 h-5" /> RÉSEAU DE SOIN</label>
              <div className="relative">
                <select name="network" value={formData.network} onChange={handleChange} className={`w-full p-4 pl-5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-lg focus:ring-2 outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors focus:${currentTheme.border} focus:ring-${userSettings.themeColor}-500`} style={{ '--tw-ring-color': `var(--${userSettings.themeColor}-500)` }}>
                  <option value="HORS_RESEAU">TARIF LIBRE (HORS RÉSEAU)</option>
                  <option value="KALIXIA">KALIXIA</option>
                  <option value="SANTECLAIR">SANTÉCLAIR</option>
                  <option value="CARTEBLANCHE">CARTE BLANCHE</option>
                  <option value="ITELIS">ITELIS</option>
                  <option value="SEVEANE">SÉVÉANE</option>
                </select>
                <ChevronRight className="w-5 h-5 text-slate-400 absolute right-5 top-5 rotate-90 pointer-events-none"/>
              </div>
            </div>
            <hr className="border-slate-100" />
            
            {/* ... (Le reste du formulaire reste identique) ... */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-500 tracking-wider flex items-center gap-2"><Tag className="w-5 h-5" /> MARQUE VERRIER</label>
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2 rounded-2xl">
                {brands.map(b => {
                  if (b.id === 'ORUS' && formData.network !== 'HORS_RESEAU') return null;
                  return (
                    <button key={b.id} onClick={() => setFormData({...formData, brand: b.id})} className={`py-3 px-2 rounded-xl transition-all duration-200 flex flex-col items-center gap-2 h-20 ${formData.brand === b.id ? `bg-white ${currentTheme.text} shadow-md ring-2 ring-black/5 scale-[1.02]` : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}>
                      <div className="h-10 w-full flex items-center justify-center mb-1 p-1">
                        <BrandLogo brand={b.id} className="max-h-full max-w-full object-contain" />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            <hr className="border-slate-100" />
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-500 tracking-wider flex items-center gap-2"><Glasses className="w-5 h-5" /> CORRECTION (OD)</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-bold ml-1">SPHÈRE</label>
                  <div className="relative group">
                    <input type="number" step="0.25" name="sphere" value={formData.sphere} onChange={handleChange} className={`w-full p-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xl text-slate-800 focus:ring-2 outline-none group-hover:border-slate-300 transition-colors focus:${currentTheme.border} focus:ring-${userSettings.themeColor}-500`}/>
                    <span className="absolute right-3 top-4 text-xs text-slate-400 font-bold pointer-events-none">D</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-bold ml-1">CYLINDRE</label>
                  <div className="relative group">
                    <input type="number" step="0.25" name="cylinder" value={formData.cylinder} onChange={handleChange} className={`w-full p-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xl text-slate-800 focus:ring-2 outline-none group-hover:border-slate-300 transition-colors focus:${currentTheme.border} focus:ring-${userSettings.themeColor}-500`}/>
                    <span className="absolute right-3 top-4 text-xs text-slate-400 font-bold pointer-events-none">D</span>
                  </div>
                </div>
              </div>
              <div className={`transition-opacity duration-300 ${isAdditionDisabled ? 'opacity-50' : 'opacity-100'}`}>
                  <label className="text-xs text-slate-400 mb-1.5 block font-bold ml-1">ADDITION {isAdditionDisabled && "(N/A)"}</label>
                  <div className="relative group">
                    <input type="number" step="0.25" min="0.00" max="4.00" name="addition" value={formData.addition} onChange={handleChange} disabled={isAdditionDisabled} className={`w-full p-3 pr-8 border rounded-xl font-bold text-xl text-slate-800 outline-none transition-colors ${isAdditionDisabled ? 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-400' : `bg-slate-50 border-slate-200 focus:ring-2 focus:${currentTheme.border} group-hover:border-slate-300`}`}/>
                    <span className={`absolute right-3 top-4 text-xs font-bold pointer-events-none ${isAdditionDisabled ? 'text-slate-300' : 'text-slate-400'}`}>D</span>
                  </div>
              </div>
            </div>
            <hr className="border-slate-100" />
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-500 tracking-wider flex items-center gap-2"><Ruler className="w-5 h-5" /> GÉOMÉTRIE</label>
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2 rounded-2xl">
                {lensTypes.map(type => (
                  <button key={type.id} onClick={() => handleTypeChange(type.id)} className={`py-3 px-2 text-xs font-bold rounded-lg transition-all duration-200 border ${formData.type === type.id ? `bg-white ${currentTheme.text} shadow-sm border-slate-200 scale-[1.02] ring-1 ring-black/5` : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>{type.label}</button>
                ))}
              </div>

              {/* CHOIX DU DESIGN */}
              {availableDesigns.length > 0 && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-300">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block ml-1 flex items-center gap-2"><BoxSelect className="w-3 h-3"/> DESIGN / GAMME</label>
                   <div className="flex flex-wrap gap-2">
                     <button
                       onClick={() => handleDesignChange('')}
                       className={`flex-1 py-2 px-2 text-[10px] font-bold rounded-lg transition-all border ${formData.design === '' ? `bg-white ${currentTheme.text} border-slate-200 shadow-sm` : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}`}
                     >
                       TOUS
                     </button>
                     {availableDesigns.map(design => (
                       <button
                         key={design}
                         onClick={() => handleDesignChange(design)}
                         className={`flex-1 py-2 px-2 text-[10px] font-bold rounded-lg transition-all border ${formData.design === design ? `bg-white ${currentTheme.text} border-slate-200 shadow-sm` : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}`}
                       >
                         {design}
                       </button>
                     ))}
                   </div>
                </div>
              )}

              <div className={`transition-all duration-300 overflow-hidden ${isMyopiaEligible ? 'max-h-24 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                <label className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer border-2 transition-colors ${formData.myopiaControl ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}>
                  <div className="relative flex items-center">
                    <input type="checkbox" name="myopiaControl" checked={formData.myopiaControl} onChange={handleChange} className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-purple-300 bg-white transition-all checked:border-purple-600 checked:bg-purple-600"/>
                    <Eye className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white opacity-0 peer-checked:opacity-100" />
                  </div>
                  <div><span className="text-sm font-bold text-purple-900 block leading-tight">FREINATION MYOPIE</span><span className="text-[10px] text-purple-600 font-bold mt-0.5 block">TYPE MIYOSMART (INDICE 1.58 OBLIGATOIRE)</span></div>
                </label>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-500 tracking-wider flex items-center gap-2"><Layers className="w-5 h-5" /> INDICE</label>
              <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1.5">
                {indices.map(idx => {
                  const isDisabled = formData.myopiaControl && idx !== '1.58';
                  return (
                    <button key={idx} disabled={isDisabled} onClick={() => setFormData({...formData, materialIndex: idx})} className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all duration-200 ${formData.materialIndex === idx ? `bg-white ${currentTheme.text} shadow-sm ring-1 ring-black/5` : isDisabled ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-200/50'}`}>{idx}</button>
                  )
                })}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-500 tracking-wider flex items-center gap-2"><Sparkles className="w-5 h-5" /> TRAITEMENTS</label>
              
              {/* LISTE TRAITEMENTS */}
              <div className="mb-2">
                 <button onClick={() => handleCoatingChange('')} className={`w-full py-2 px-3 text-xs font-bold rounded-lg transition-all border ${formData.coating === '' ? `bg-white ${currentTheme.text} border-slate-200 shadow-sm` : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}`}>TOUS LES TRAITEMENTS</button>
              </div>

              {/* BOUTON PHOTOCHROMIQUE */}
              <div className="mb-2">
                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${formData.photochromic ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}>
                    <div className="relative flex items-center">
                      <input type="checkbox" name="photochromic" checked={formData.photochromic} onChange={handleChange} className="peer h-5 w-5 rounded-md border bg-white transition-all checked:border-yellow-500 checked:bg-yellow-500"/>
                      <Sun className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
                    </div>
                    <span className={`text-sm font-bold ${formData.photochromic ? 'text-yellow-700' : 'text-slate-500'}`}>PHOTOCHROMIQUE</span>
                  </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {currentCoatings.map(c => (
                  <button key={c.id} onClick={() => handleCoatingChange(c.id)} className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden ${formData.coating === c.id ? `${currentTheme.light} ${currentTheme.border} ${currentTheme.textDark} ring-1 ${currentTheme.ring.replace('focus:', '')}` : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}>
                    <div className="text-[10px] font-bold mb-1 opacity-60 flex items-center gap-1.5">{c.icon} {c.type === 'BLUE' ? 'LUMIÈRE BLEUE' : c.type === 'SUN' ? 'SOLEIL' : c.type === 'DRIVE' ? 'CONDUITE' : c.type === 'CLEAN' ? 'NETTOYAGE' : 'ANTIREFLET'}</div>
                    <div className="font-bold text-sm">{c.label}</div>
                  </button>
                ))}
              </div>
              <div className={`transition-all duration-300 overflow-hidden ${isUvOptionVisible ? 'max-h-24 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isUvOptionMandatory ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-80' : 'bg-orange-50 border-orange-200 hover:bg-orange-100'}`}>
                  <div className="relative flex items-center">
                    <input type="checkbox" name="uvOption" checked={formData.uvOption} onChange={handleChange} disabled={isUvOptionMandatory} className={`peer h-5 w-5 rounded-md border bg-white transition-all ${isUvOptionMandatory ? 'border-slate-400 bg-slate-400 checked:bg-slate-500' : 'border-orange-300 checked:border-orange-600 checked:bg-orange-600 cursor-pointer'}`}/>
                    {(formData.uvOption || isUvOptionMandatory) && <Sparkles className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white" />}
                  </div>
                  <div><span className={`text-sm font-bold select-none ${isUvOptionMandatory ? 'text-slate-600' : 'text-orange-900'}`}>{uvOptionLabel}</span>{isUvOptionMandatory && <span className="ml-2 text-[10px] text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded font-bold">OBLIGATOIRE</span>}</div>
                </label>
              </div>
            </div>
            <div className="pt-4 pb-8">
            </div>
          </div>
        </aside>

        {/* BOUTON FLOTTANT POUR REOUVRIR LE VOLET (Visible seulement si volet fermé) */}
        {!isSidebarOpen && (
          <button 
             onClick={() => setIsSidebarOpen(true)}
             className="absolute bottom-6 left-6 z-30 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all animate-in fade-in zoom-in lg:hidden"
          >
            <Sliders className="w-6 h-6"/>
          </button>
        )}
        
        {/* BOUTON REOUVRIR DESKTOP */}
        {!isSidebarOpen && (
          <div className="hidden lg:flex w-12 bg-white border-r border-slate-200 flex-col items-center py-6 z-20">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                 <ChevronRight className="w-6 h-6"/>
              </button>
              <div className="mt-8 writing-vertical-lr text-xs font-bold text-slate-300 tracking-widest rotate-180">
                  FILTRES
              </div>
          </div>
        )}

        <section className="flex-1 p-8 overflow-y-auto bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {/* ... (Comparaison et Résultats inchangés) ... */}
            {comparisonLens && (
              <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
                 <div className="flex justify-between items-end mb-4 pb-2 border-b border-blue-100">
                   <h3 className="text-xl font-black text-blue-800 flex items-center gap-2 tracking-wide"><ArrowRightLeft className="w-6 h-6"/> PRODUIT DE RÉFÉRENCE (FIGÉ)</h3>
                   <button onClick={clearComparison} className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors"><XCircle className="w-4 h-4"/> ARRÊTER LA COMPARAISON</button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    <div className="relative">
                      <div className="absolute -top-3 -left-3 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md z-20">RÉFÉRENCE A</div>
                      <LensCard lens={comparisonLens} index={0} currentTheme={currentTheme} showMargins={showMargins} onCompare={() => {}} isReference={true} />
                    </div>
                    <div className="hidden md:flex items-center justify-center text-slate-300 font-bold text-4xl opacity-20">VS</div>
                 </div>
              </div>
            )}

            <div className="mb-8 flex flex-wrap gap-3 text-sm items-center font-bold text-slate-500">
               <span>{comparisonLens ? "COMPARER AVEC :" : "FILTRES :"}</span>
               <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs flex items-center gap-2"><Shield className="w-4 h-4"/>{formData.network === 'HORS_RESEAU' ? 'HORS RÉSEAU' : formData.network}</span>
               <span className={`bg-white px-3 py-1.5 rounded-lg border border-slate-200 ${currentTheme.text} shadow-sm text-xs flex items-center gap-2`}><Tag className="w-4 h-4"/>{brands.find(b => b.id === formData.brand)?.label}</span>
               <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs">{lensTypes.find(t => t.id === formData.type)?.label} {formData.materialIndex}</span>
               {formData.design && (<span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs flex items-center gap-2"><BoxSelect className="w-4 h-4"/> {formData.design}</span>)}
               {formData.myopiaControl && (<span className="bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-200 text-purple-800 shadow-sm text-xs flex items-center gap-2"><Eye className="w-4 h-4"/> FREINATION MYOPIE</span>)}
               {(formData.uvOption) && isUvOptionVisible && (<span className="bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200 text-orange-800 shadow-sm text-xs">{uvOptionLabel}</span>)}
               <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs">SPH {formData.sphere > 0 ? '+' : ''}{formData.sphere}</span>
               <span className={`bg-white px-3 py-1.5 rounded-lg border border-slate-200 ${currentTheme.text} shadow-sm text-xs`}>{formData.coating === '' ? 'TOUS TRAITEMENTS' : currentCoatings.find(c => c.id === formData.coating)?.label}</span>
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-6 rounded-2xl mb-8 border border-red-200 flex items-center gap-4 font-bold"><div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"/>{error}</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
              {filteredLenses.length === 0 && !loading && !error && (
                <div className="col-span-3 py-32 text-center opacity-60">
                  <div className="bg-white inline-flex p-6 rounded-full mb-6 shadow-sm border border-slate-100"><Glasses className="w-16 h-16 text-slate-300" /></div>
                  <h3 className="text-2xl font-bold text-slate-600 mb-2">AUCUN VERRE TROUVÉ</h3>
                  <p className="text-sm text-slate-400 font-bold">MODIFIEZ VOS CRITÈRES POUR VOIR LES RÉSULTATS.</p>
                </div>
              )}
              {filteredLenses.map((lens, index) => (
                <LensCard key={lens.id} lens={lens} index={index} currentTheme={currentTheme} showMargins={showMargins} onCompare={handleCompare} isReference={false} />
              ))}
            </div>
          </div>
        </section>

        {showSettings && (
          // FIX MODALE : FIXED + Z-INDEX MAX + CLIC OUTSIDE
          <div 
             className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-center items-center p-4"
             onClick={(e) => { if(e.target === e.currentTarget) setShowSettings(false); }}
          >
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col border-2 border-slate-100">
              <div className="px-8 py-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-4 text-slate-800">
                  <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm"><Settings className="w-6 h-6 text-slate-600" /></div>
                  <div><h3 className="font-bold text-xl leading-tight">CONFIGURATION</h3><p className="text-xs text-slate-500 font-bold">PERSONNALISATION & LIMITES</p><p className="text-[10px] text-slate-400 mt-1">VERSION {APP_VERSION}</p></div>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-3 hover:bg-slate-200 rounded-full transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
              </div>
              <div className="p-8 overflow-y-auto">
                {/* ... Contenu Settings ... */}
                <div className="space-y-10">
                  <div className="space-y-5">
                    <h4 className="font-bold text-sm text-slate-400 border-b-2 border-slate-100 pb-2 mb-4">GESTION CATALOGUE</h4>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <label className="block text-xs font-bold text-slate-600 mb-2">LIEN GOOGLE SHEETS (PUBLIÉ WEB CSV)</label>
                        <div className="flex gap-2">
                           <input 
                            type="text" 
                            value={sheetsUrl} 
                            onChange={(e) => handleSheetsUrlChange(e.target.value)} 
                            placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv" 
                            className="flex-1 p-3 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 text-xs focus:ring-2 outline-none"
                          />
                          <button 
                             onClick={triggerSync}
                             disabled={syncLoading || !sheetsUrl}
                             className="bg-blue-600 text-white px-4 rounded-lg font-bold text-xs hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                          >
                             {syncLoading ? <RefreshCw className="w-4 h-4 animate-spin"/> : <DownloadCloud className="w-4 h-4"/>}
                             SYNCHRO
                          </button>
                        </div>
                        {syncStatus && (
                           <div className={`mt-3 text-xs font-bold p-2 rounded ${syncStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                             {syncStatus.msg}
                           </div>
                        )}
                        <p className="text-[10px] text-slate-400 mt-2">
                          1. Dans Google Sheets : Fichier {'>'} Partager {'>'} Publier sur le web<br/>
                          2. Choisissez "Feuille 1" et format "CSV"<br/>
                          3. Copiez le lien et collez-le ici.
                        </p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <h4 className="font-bold text-sm text-slate-400 border-b-2 border-slate-100 pb-2 mb-4">CONNEXION SERVEUR</h4>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2">URL DE L'API (BACKEND)</label>
                        <div className="relative">
                          <input type="text" value={serverUrl} onChange={(e) => handleUrlChange(e.target.value)} placeholder="https://api-podium-..." className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 outline-none"/>
                          <Server className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        <label className="text-xs font-bold text-slate-600">COULEUR PERSONNALISÉE :</label>
                        <div className="relative">
                            <input type="color" value={userSettings.customColor} onChange={(e) => {
                                handleSettingChange('branding', 'customColor', e.target.value);
                                handleSettingChange('branding', 'themeColor', 'custom');
                            }} className="h-8 w-8 rounded cursor-pointer border-0 p-0" />
                            <div className="pointer-events-none absolute inset-0 rounded ring-1 ring-inset ring-black/10" />
                        </div>
                        <span className="text-xs text-slate-400">(Cliquez pour utiliser la pipette)</span>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <h4 className="font-bold text-sm text-slate-400 border-b-2 border-slate-100 pb-2 mb-4">IDENTITÉ DU POINT DE VENTE</h4>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2">NOM DU MAGASIN</label>
                        <div className="relative">
                          <input type="text" value={userSettings.shopName} onChange={(e) => handleSettingChange('branding', 'shopName', e.target.value)} placeholder="EX: MON OPTICIEN" className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 outline-none"/>
                          <Store className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <h4 className="font-bold text-sm text-slate-400 border-b-2 border-slate-100 pb-2 mb-4">THÈME & COULEURS</h4>
                    <div className="grid grid-cols-5 gap-3">
                      {Object.keys(themes).map(colorKey => (
                        <button key={colorKey} onClick={() => handleSettingChange('branding', 'themeColor', colorKey)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${userSettings.themeColor === colorKey ? `border-${colorKey}-500 bg-${colorKey}-50` : 'border-transparent hover:bg-slate-50'}`}>
                          <div className={`w-10 h-10 rounded-full ${themes[colorKey].primary} shadow-sm ring-4 ring-white`}></div>
                          <span className="text-[10px] font-bold text-slate-500">{themes[colorKey].name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-5">
                    <h4 className="font-bold text-sm text-slate-400 border-b-2 border-slate-100 pb-2 mb-4">PLAFONDS RESTE À CHARGE</h4>
                    <div className="grid grid-cols-2 gap-6">
                      {lensTypes.map(type => (
                        <div key={type.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                           <label className="block text-xs font-bold text-slate-600 mb-2">{type.label}</label>
                           <div className="relative">
                              <input type="number" value={userSettings[type.id]?.maxPocket || ''} onChange={(e) => handleSettingChange(type.id, 'maxPocket', e.target.value)} className="w-full p-3 pr-10 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 outline-none text-right text-lg"/>
                              <span className="absolute right-4 top-3.5 text-sm text-slate-400 font-bold">€</span>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-4">
                <button onClick={() => setShowSettings(false)} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors text-sm">FERMER</button>
                <button onClick={() => { setShowSettings(false); fetchData(); }} className={`px-8 py-3 ${currentTheme.primary} ${currentTheme.hover} text-white font-bold rounded-xl shadow-lg ${currentTheme.shadow} transition-transform active:scale-95 flex items-center gap-2 text-sm`}><Save className="w-5 h-5" />SAUVEGARDER</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;