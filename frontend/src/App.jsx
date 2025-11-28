import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Search, RefreshCw, Trophy, Shield, Star, 
  Glasses, Ruler, ChevronRight, Layers, Sun, Monitor, Sparkles, Tag, Eye, EyeOff, Settings, X, Save, Store, Image as ImageIcon, Upload, Car, ArrowRightLeft, XCircle, Wifi, WifiOff, Server, BoxSelect, ChevronLeft, Sliders, DownloadCloud, Calculator
} from 'lucide-react';

// --- VERSION APPLICATION ---
const APP_VERSION = "1.16"; // 5 Géométries + Filtre Marque Strict + Toutes Marques

// --- OUTILS COULEURS ---
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : "0 0 0";
};

// --- COMPOSANT LOGOS ---
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
        span.innerText = safeBrand === '' ? 'TOUTES' : safeBrand;
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
    { border: `border-slate-200 shadow-lg ${currentTheme.shadow}`, badge: `${currentTheme.light} ${currentTheme.textDark} ${currentTheme.border}`, icon: <Shield className={`w-5 h-5 ${currentTheme.text}`} />, label: "OFFRE OPTIMISÉE" },
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
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [sheetsUrl, setSheetsUrl] = useState(localStorage.getItem("optique_sheets_url") || "");

  const [userSettings, setUserSettings] = useState({
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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { }
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
    custom: { name: 'PERSO', primary: 'bg-[var(--theme-primary)]', hover: 'hover:opacity-90', text: 'text-[var(--theme-primary)]', textDark: 'text-black', light: 'bg-[var(--theme-light)]', border: 'border-[var(--theme-border)]', ring: 'ring-[var(--theme-ring)]', shadow: 'shadow-md' }
  };

  const currentTheme = themes[userSettings.themeColor] || themes.blue;
  
  // --- LISTE MARQUES AVEC OPTION TOUTES ---
  const brands = [ 
    { id: '', label: 'TOUTES' },
    { id: 'HOYA', label: 'HOYA' }, 
    { id: 'ZEISS', label: 'ZEISS' }, 
    { id: 'SEIKO', label: 'SEIKO' }, 
    { id: 'CODIR', label: 'CODIR' }, 
    { id: 'ORUS', label: 'ORUS' } 
  ];
  
  // --- LISTE GÉOMÉTRIES MISE À JOUR ---
  const lensTypes = [ 
    { id: 'UNIFOCAL', label: 'UNIFOCAL' }, 
    { id: 'PROGRESSIF', label: 'PROGRESSIF' }, 
    { id: 'DEGRESSIF', label: 'DÉGRESSIF' }, 
    { id: 'MULTIFOCAL', label: 'MULTIFOCAL' },
    { id: "PROGRESSIF D'INTÉRIEUR", label: "PROG. INTÉRIEUR" }
  ];
  
  const indices = ['1.50', '1.58', '1.60', '1.67', '1.74'];
  const codirCoatings = [ { id: 'MISTRAL', label: 'MISTRAL', type: 'CLASSIC', icon: <Sparkles className="w-3 h-3"/> }, { id: 'E_PROTECT', label: 'E-PROTECT', type: 'BLUE', icon: <Monitor className="w-3 h-3"/> }, { id: 'QUATTRO_UV', label: 'QUATTRO UV', type: 'CLASSIC', icon: <Shield className="w-3 h-3"/> }, { id: 'B_PROTECT', label: 'B-PROTECT', type: 'BLUE', icon: <Monitor className="w-3 h-3"/> }, { id: 'QUATTRO_UV_CLEAN', label: 'QUATTRO UV CLEAN', type: 'CLEAN', icon: <Shield className="w-3 h-3"/> }, { id: 'B_PROTECT_CLEAN', label: 'B-PROTECT CLEAN', type: 'CLEAN', icon: <Monitor className="w-3 h-3"/> }, ];
  const brandCoatings = { CODIR: codirCoatings, ORUS: codirCoatings, SEIKO: [ { id: 'SRC_ONE', label: 'SRC-ONE', type: 'CLASSIC', icon: <Sparkles className="w-3 h-3"/> }, { id: 'SRC_ULTRA', label: 'SRC-ULTRA', type: 'CLEAN', icon: <Shield className="w-3 h-3"/> }, { id: 'SRC_SCREEN', label: 'SRC-SCREEN', type: 'BLUE', icon: <Monitor className="w-3 h-3"/> }, { id: 'SRC_ROAD', label: 'SRC-ROAD', type: 'DRIVE', icon: <Car className="w-3 h-3"/> }, { id: 'SRC_SUN', label: 'SRC-SUN', type: 'SUN', icon: <Sun className="w-3 h-3"/> }, ], HOYA: [ { id: 'HA', label: 'HA', type: 'CLASSIC', icon: <Sparkles className="w-3 h-3"/> }, { id: 'HVLL', label: 'HVLL', type: 'CLASSIC', icon: <Shield className="w-3 h-3"/> }, { id: 'HVLL_UV', label: 'HVLL UV', type: 'CLASSIC', icon: <Shield className="w-3 h-3"/> }, { id: 'HVLL_BC', label: 'HVLL BC', type: 'BLUE', icon: <Monitor className="w-3 h-3"/> }, { id: 'HVLL_BCUV', label: 'HVLL BCUV', type: 'BLUE', icon: <Monitor className="w-3 h-3"/> }, ], ZEISS: [ { id: 'DV_SILVER', label: 'DV SILVER', type: 'CLASSIC', icon: <Sparkles className="w-3 h-3"/> }, { id: 'DV_PLATINUM', label: 'DV PLATINUM', type: 'CLASSIC', icon: <Shield className="w-3 h-3"/> }, { id: 'DV_BP', label: 'DV BLUEPROTECT', type: 'BLUE', icon: <Monitor className="w-3 h-3"/> }, { id: 'DV_DRIVE', label: 'DV DRIVESAFE', type: 'DRIVE', icon: <Car className="w-3 h-3"/> }, ] };
  const currentCoatings = brandCoatings[formData.brand] || brandCoatings.CODIR;

  // --- 1. RECHARGEMENT DONNÉES (CRITÈRES MAJEURS) ---
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
    // On recharge la data SI la marque change (pour avoir le bon catalogue) ou le type
    // (Les autres critères comme indice/traitement sont filtrés localement pour rapidité)
    formData.brand, 
    formData.network, 
    formData.type
  ]); 

  // --- 2. FILTRAGE LOCAL STRICT (CRITÈRES MINEURS) ---
  useEffect(() => {
    if (lenses.length > 0) {
       let workingList = lenses.map(l => ({...l}));

       // --- FILTRE MARQUE STRICT ---
       if (formData.brand && formData.brand !== '') {
           workingList = workingList.filter(l => l.brand.toUpperCase() === formData.brand.toUpperCase());
       }

       // --- PRIX ---
       if (formData.network === 'HORS_RESEAU') {
          workingList = workingList.map(lens => {
             let rule = userSettings.pricing.prog; 
             if (lens.type === 'UNIFOCAL') {
                 const isStock = lens.name.toUpperCase().includes(' ST') || lens.name.toUpperCase().includes('_ST');
                 rule = isStock ? userSettings.pricing.uniStock : userSettings.pricing.uniFab;
             } 
             else if (lens.type === 'DEGRESSIF') { rule = userSettings.pricing.degressif; } 
             else if (lens.type.includes('INTERIEUR')) { rule = userSettings.pricing.interieur; }
             else if (lens.type === 'MULTIFOCAL') { rule = userSettings.pricing.multifocal; }

             const newSelling = (lens.purchasePrice * rule.x) + rule.b;
             const newMargin = newSelling - lens.purchasePrice;
             return { ...lens, sellingPrice: Math.round(newSelling), margin: Math.round(newMargin) };
          });
          workingList.sort((a, b) => b.margin - a.margin);
       } else if (formData.network === 'KALIXIA') {
         workingList = workingList.filter(l => l.sellingPrice > 0);
       }

       // --- PHOTOCHROMIQUE ---
       const isPhotoC = (item) => {
          const text = (item.name + " " + item.coating).toUpperCase();
          return text.includes("TRANSITIONS") || text.includes("GEN S") || text.includes("SOLACTIVE") || text.includes("TGNS") || text.includes("SABR") || text.includes("SAGR");
       };
       if (formData.photochromic) {
         workingList = workingList.filter(l => isPhotoC(l));
       } else {
         workingList = workingList.filter(l => !isPhotoC(l));
       }

       // --- TRAITEMENT STRICT ---
       if (formData.coating) {
          const selectedCoatingObj = currentCoatings.find(c => c.id === formData.coating);
          if (selectedCoatingObj) {
             const targetLabel = selectedCoatingObj.label.toUpperCase().trim();
             workingList = workingList.filter(l => {
                const lensCoating = (l.coating || "").toUpperCase().trim();
                return lensCoating === targetLabel; // Egalité stricte
             });
          }
       }

       // --- INDICE STRICT ---
       workingList = workingList.filter(l => {
           const lIdx = l.index_mat.replace(',', '.');
           const fIdx = formData.materialIndex.replace(',', '.');
           return parseFloat(lIdx) === parseFloat(fIdx);
       });

       // --- DESIGNS DISPONIBLES ---
       // On calcule les designs APRES avoir filtré la marque et le type, mais AVANT indice/traitement pour garder de la visibilité ?
       // NON : Le user veut que "quand un design est selectionné, ne montrer que ces design".
       // Donc la liste des designs dispo doit être celle des verres restants.
       const designs = [...new Set(workingList.map(l => l.design).filter(Boolean))].sort();
       setAvailableDesigns(designs);

       // --- FILTRE DESIGN FINAL ---
       if (formData.design) {
         setFilteredLenses(workingList.filter(l => l.design === formData.design));
       } else {
         setFilteredLenses(workingList);
       }
    } else {
       setAvailableDesigns([]);
       setFilteredLenses([]);
    }
  }, [
    lenses, // Quand le serveur répond
    formData.design, 
    formData.brand, // Ajouté pour filtre strict local
    formData.network, 
    formData.photochromic, 
    formData.coating, 
    formData.materialIndex, 
    userSettings.pricing
  ]);

  const fetchData = (ignoreFilters = false) => {
    setLoading(true);
    setError(null); 
    if (!isLocal && API_URL.includes("VOTRE-URL")) { setLenses(MOCK_LENSES); setLoading(false); return; }

    // On demande au serveur : Type et Marque (Si 'TOUTES', on envoie vide ou la marque sélectionnée)
    // Le serveur renvoie TOUT pour ce type (et marque si spécifiée), le frontend filtrera le reste.
    const params = {
        type: formData.type, 
        network: formData.network, 
        brand: formData.brand === '' ? undefined : formData.brand, // Si vide, on envoie rien pour avoir tout
        pocketLimit: 0 
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;
    if (name === 'addition') { const val = parseFloat(value); if (val > 4.00) newValue = 4.00; if (val < 0) newValue = 0.00; }
    if (name === 'network') {
      const defaultBrand = (newValue === 'HORS_RESEAU') ? 'ORUS' : 'CODIR';
      setFormData(prev => ({ ...prev, [name]: newValue, brand: defaultBrand, myopiaControl: false }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleLogoUpload = (e, target = 'shop') => {
    const file = e.target.files[0];
    if (file) { const reader = new FileReader(); reader.onloadend = () => { if (target === 'shop') { setUserSettings(prev => ({ ...prev, shopLogo: reader.result })); } }; reader.readAsDataURL(file); }
  };

  const handleSettingChange = (section, field, value) => {
    if (section === 'branding') { setUserSettings(prev => ({ ...prev, [field]: value })); } 
    else { setUserSettings(prev => ({ ...prev, [section]: { ...prev[section], [field]: parseFloat(value) || 0 } })); }
  };
  
  const handlePriceRuleChange = (category, field, value) => {
      setUserSettings(prev => ({ ...prev, pricing: { ...prev.pricing, [category]: { ...prev.pricing[category], [field]: parseFloat(value) || 0 } } }));
  };

  const handleUrlChange = (value) => { setServerUrl(value); localStorage.setItem("optique_server_url", value); };
  const handleSheetsUrlChange = (value) => { setSheetsUrl(value); localStorage.setItem("optique_sheets_url", value); };
  
  const handleTypeChange = (newType) => {
    setFormData(prev => ({ ...prev, type: newType, design: '' })); // Reset design on type change
  };
  const handleDesignChange = (newDesign) => { setFormData(prev => ({ ...prev, design: newDesign })); };
  const handleCoatingChange = (newCoating) => { setFormData(prev => ({ ...prev, coating: newCoating, cleanOption: false })); };
  const handleCompare = (lens) => { setComparisonLens(lens); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const clearComparison = () => { setComparisonLens(null); };
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const triggerSync = () => { /* ... (code synchro inchangé) ... */ if (!sheetsUrl) return alert("URL?"); setSyncLoading(true); axios.post(SYNC_URL, { url: sheetsUrl }).then(res => { setSyncStatus({ type: 'success', msg: 'OK' }); fetchData(); }).finally(() => setSyncLoading(false)); };

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
          <button onClick={toggleSidebar} className="lg:hidden p-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors"><Sliders className="w-8 h-8" /></button>
          <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isOnline ? <Wifi className="w-4 h-4"/> : <WifiOff className="w-4 h-4"/>}
            {isOnline ? "EN LIGNE" : "HORS LIGNE"}
          </div>
          <button onClick={() => setShowMargins(!showMargins)} className="p-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors"><EyeOff className="w-8 h-8" /></button>
          <button onClick={() => setShowSettings(true)} className="p-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors"><Settings className="w-8 h-8" /></button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative z-0">
        <aside className={`bg-white border-r border-slate-200 flex flex-col overflow-y-auto z-20 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-full lg:w-[420px] translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-0 opacity-0 pointer-events-none'} absolute lg:relative h-full`}>
          {/* ... CONTENU SIDEBAR (Réseau, Marque, Correction) ... */}
          <div className="p-6 space-y-8">
             <div className="space-y-3">
              <label className="text-sm font-bold text-slate-500 tracking-wider flex items-center gap-2"><Shield className="w-5 h-5" /> RÉSEAU DE SOIN</label>
              <div className="relative">
                <select name="network" value={formData.network} onChange={handleChange} className={`w-full p-4 pl-5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-lg focus:ring-2 outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors focus:${currentTheme.border} focus:ring-${userSettings.themeColor}-500`} style={{ '--tw-ring-color': `var(--${userSettings.themeColor}-500)` }}>
                  <option value="HORS_RESEAU">TARIF LIBRE (HORS RÉSEAU)</option>
                  <option value="KALIXIA">KALIXIA</option>
                  {/* ... Autres réseaux ... */}
                </select>
                <ChevronRight className="w-5 h-5 text-slate-400 absolute right-5 top-5 rotate-90 pointer-events-none"/>
              </div>
            </div>
            <hr className="border-slate-100" />

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-500 tracking-wider flex items-center gap-2"><Tag className="w-5 h-5" /> MARQUE VERRIER</label>
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2 rounded-2xl">
                {brands.map(b => {
                  if (b.id === 'ORUS' && formData.network !== 'HORS_RESEAU') return null;
                  return (
                    <button key={b.id} onClick={() => setFormData({...formData, brand: b.id})} className={`py-3 px-2 rounded-xl transition-all duration-200 flex flex-col items-center gap-2 h-20 ${formData.brand === b.id ? `bg-white ${currentTheme.text} shadow-md ring-2 ring-black/5 scale-[1.02]` : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}>
                      <div className="h-10 w-full flex items-center justify-center mb-1 p-1">
                        {b.id === '' ? <span className="font-bold text-lg">TOUTES</span> : <BrandLogo brand={b.id} className="max-h-full max-w-full object-contain" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            <hr className="border-slate-100" />

            {/* ... CORRECTION (Inchangé) ... */}
            <div className="space-y-4">
               <label className="text-sm font-bold text-slate-500 tracking-wider flex items-center gap-2"><Glasses className="w-5 h-5" /> CORRECTION</label>
               <div className="grid grid-cols-2 gap-4">
                  <input type="number" step="0.25" name="sphere" value={formData.sphere} onChange={handleChange} className="w-full p-3 border rounded-xl font-bold text-xl" placeholder="SPH"/>
                  <input type="number" step="0.25" name="cylinder" value={formData.cylinder} onChange={handleChange} className="w-full p-3 border rounded-xl font-bold text-xl" placeholder="CYL"/>
               </div>
               <div className={`transition-opacity ${isAdditionDisabled ? 'opacity-50' : 'opacity-100'}`}>
                  <input type="number" step="0.25" name="addition" value={formData.addition} onChange={handleChange} disabled={isAdditionDisabled} className="w-full p-3 border rounded-xl font-bold text-xl mt-2" placeholder="ADD"/>
               </div>
            </div>
            <hr className="border-slate-100" />

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-500 tracking-wider flex items-center gap-2"><Ruler className="w-5 h-5" /> GÉOMÉTRIE</label>
              <div className="flex flex-col gap-2 bg-slate-50 p-2 rounded-2xl">
                {lensTypes.map(type => (
                  <button key={type.id} onClick={() => handleTypeChange(type.id)} className={`w-full py-3 px-4 text-xs font-bold rounded-lg transition-all text-left border ${formData.type === type.id ? `bg-white ${currentTheme.text} shadow-sm border-slate-200` : 'border-transparent text-slate-500 hover:bg-slate-100'}`}>{type.label}</button>
                ))}
              </div>
              
              {/* CHOIX DESIGN DYNAMIQUE */}
              {availableDesigns.length > 0 && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-300">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block ml-1 flex items-center gap-2"><BoxSelect className="w-3 h-3"/> DESIGN / GAMME</label>
                   <div className="flex flex-wrap gap-2">
                     <button onClick={() => handleDesignChange('')} className={`flex-1 py-2 px-2 text-[10px] font-bold rounded-lg transition-all border ${formData.design === '' ? `bg-white ${currentTheme.text} border-slate-200 shadow-sm` : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}`}>TOUS</button>
                     {availableDesigns.map(design => (
                       <button key={design} onClick={() => handleDesignChange(design)} className={`flex-1 py-2 px-2 text-[10px] font-bold rounded-lg transition-all border ${formData.design === design ? `bg-white ${currentTheme.text} border-slate-200 shadow-sm` : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}`}>{design}</button>
                     ))}
                   </div>
                </div>
              )}
            </div>

            {/* ... INDICES & TRAITEMENTS (Inchangés) ... */}
            <div className="space-y-3">
               <label className="text-sm font-bold text-slate-500 tracking-wider flex items-center gap-2"><Layers className="w-5 h-5" /> INDICE</label>
               <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1.5">
                 {indices.map(idx => (
                   <button key={idx} onClick={() => setFormData({...formData, materialIndex: idx})} className={`flex-1 py-3 text-xs font-bold rounded-lg ${formData.materialIndex === idx ? 'bg-white shadow-sm' : 'text-slate-500'}`}>{idx}</button>
                 ))}
               </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-500 tracking-wider flex items-center gap-2"><Sparkles className="w-5 h-5" /> TRAITEMENTS</label>
              <button onClick={() => handleCoatingChange('')} className={`w-full py-2 mb-2 text-xs font-bold rounded-lg border ${formData.coating === '' ? 'bg-white border-slate-200 shadow-sm' : 'border-transparent'}`}>TOUS LES TRAITEMENTS</button>
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer mb-2 ${formData.photochromic ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50 border-transparent'}`}>
                  <input type="checkbox" checked={formData.photochromic} onChange={handleChange} name="photochromic" className="peer h-5 w-5"/>
                  <span className="text-sm font-bold text-slate-500">PHOTOCHROMIQUE</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {currentCoatings.map(c => (
                  <button key={c.id} onClick={() => handleCoatingChange(c.id)} className={`p-4 rounded-xl border-2 text-left ${formData.coating === c.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100'}`}>
                     <div className="font-bold text-sm">{c.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="h-24"></div>
          </div>
        </aside>

        {/* ... SECTION RÉSULTATS (Inchangée) ... */}
        <section className="flex-1 p-8 overflow-y-auto bg-slate-50">
           <div className="max-w-7xl mx-auto">
              {/* Comparaison & Filtres... */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
                {filteredLenses.map((lens, index) => (
                  <LensCard key={lens.id} lens={lens} index={index} currentTheme={currentTheme} showMargins={showMargins} onCompare={handleCompare} />
                ))}
              </div>
           </div>
        </section>

        {/* ... MODALE SETTINGS (Inchangée) ... */}
        {showSettings && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-center items-center p-4" onClick={(e) => { if(e.target === e.currentTarget) setShowSettings(false); }}>
             {/* Contenu Settings... */}
             <div className="bg-white p-8 rounded-3xl w-full max-w-2xl">
                <h2 className="font-bold text-xl mb-4">PARAMÈTRES</h2>
                {/* Formulaires de prix... */}
                <div className="flex justify-end"><button onClick={() => setShowSettings(false)} className="px-6 py-2 bg-blue-600 text-white rounded-lg">FERMER</button></div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;