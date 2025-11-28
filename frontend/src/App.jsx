import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Search, RefreshCw, Trophy, Shield, Star, 
  Glasses, Ruler, ChevronRight, Layers, Sun, Monitor, Sparkles, Tag, Eye, EyeOff, Settings, X, Save, Store, Image as ImageIcon, Upload, Car, ArrowRightLeft, XCircle, Wifi, WifiOff, Server, BoxSelect, ChevronLeft, Sliders, DownloadCloud, Calculator
} from 'lucide-react';

// --- VERSION APPLICATION ---
const APP_VERSION = "1.27"; // Filtre Marque Strict & Indépendant

// --- OUTILS COULEURS ---
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : "0 0 0";
};

// --- COMPOSANT LOGOS ---
const BrandLogo = ({ brand, className = "h-full w-auto" }) => {
  const [hasError, setHasError] = useState(false);
  const safeBrand = brand || 'unknown';
  const logoUrl = `/logos/${safeBrand.toLowerCase()}.png`;

  // Si l'image n'existe pas ou pas de marque, on affiche le texte
  if (hasError || !brand) {
    return (
      <span className="text-xs font-bold text-slate-400 flex items-center justify-center h-full w-full px-1 text-center border border-dashed border-slate-200 rounded">
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

  const displayMargin = (lens.sellingPrice > 0) 
    ? ((lens.margin / lens.sellingPrice) * 100).toFixed(0) 
    : 0;

  return (
    <div className={`group bg-white rounded-3xl border-2 transition-all duration-300 overflow-hidden relative flex flex-col ${style.border} ${isReference ? 'scale-100' : 'hover:-translate-y-2'}`}>
        <div className="absolute top-5 right-5 z-10">
          <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm ${style.badge}`}>
            {style.icon} {style.label}
          </span>
        </div>

        <div className="p-8 pt-14 border-b border-slate-50 relative">
          <h3 className="font-bold text-2xl text-slate-800 mb-2 leading-tight">{lens.name || "Verre Inconnu"}</h3>
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
                <div className="flex justify-between items-end mb-2"><span className="text-xs font-bold text-green-700 tracking-wide">MARGE NETTE</span><span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-lg">{displayMargin}%</span></div>
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

  const defaultPricingConfig = { x: 2.5, b: 20 };
  
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
    brand: '', // DÉFAUT = TOUTES (Vide)
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

  const themes = {
    blue: { name: 'OCÉAN', primary: 'bg-blue-700', hover: 'hover:bg-blue-800', text: 'text-blue-700', textDark: 'text-blue-900', light: 'bg-blue-50', border: 'border-blue-200', ring: 'ring-blue-300', shadow: 'shadow-blue-200' },
    emerald: { name: 'ÉMERAUDE', primary: 'bg-emerald-700', hover: 'hover:bg-emerald-800', text: 'text-emerald-700', textDark: 'text-emerald-900', light: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-300', shadow: 'shadow-emerald-200' },
    violet: { name: 'AMÉTHYSTE', primary: 'bg-violet-700', hover: 'hover:bg-violet-800', text: 'text-violet-700', textDark: 'text-violet-900', light: 'bg-violet-50', border: 'border-violet-200', ring: 'ring-violet-300', shadow: 'shadow-violet-200' },
    amber: { name: 'AMBRE', primary: 'bg-amber-700', hover: 'hover:bg-amber-800', text: 'text-amber-700', textDark: 'text-amber-900', light: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-300', shadow: 'shadow-amber-200' },
    rose: { name: 'RUBIS', primary: 'bg-rose-700', hover: 'hover:bg-rose-800', text: 'text-rose-700', textDark: 'text-rose-900', light: 'bg-rose-50', border: 'border-rose-200', ring: 'ring-rose-300', shadow: 'shadow-rose-200' },
    custom: { name: 'PERSO', primary: 'bg-[var(--theme-primary)]', hover: 'hover:opacity-90', text: 'text-[var(--theme-primary)]', textDark: 'text-black', light: 'bg-[var(--theme-light)]', border: 'border-[var(--theme-border)]', ring: 'ring-[var(--theme-ring)]', shadow: 'shadow-md' }
  };

  const currentTheme = themes[userSettings.themeColor] || themes.blue;

  // Liste des marques (Peut être complétée par le scan auto plus tard)
  const brands = [ 
    { id: '', label: 'TOUTES' },
    { id: 'HOYA', label: 'HOYA' }, 
    { id: 'ZEISS', label: 'ZEISS' }, 
    { id: 'SEIKO', label: 'SEIKO' }, 
    { id: 'CODIR', label: 'CODIR' }, 
    { id: 'ORUS', label: 'ORUS' } 
  ];

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

  // 1. RECHARGEMENT (APPEL SERVEUR)
  useEffect(() => {
    // Règles métiers indices
    if (['CODIR', 'SEIKO', 'HOYA', 'ORUS'].includes(formData.brand)) {
      if (formData.materialIndex !== '1.50') {
        if (!formData.uvOption) { setFormData(prev => ({ ...prev, uvOption: true })); }
      }
    }
    const coatingExists = formData.coating === '' || currentCoatings.find(c => c.id === formData.coating);
    if (!coatingExists) { setFormData(prev => ({ ...prev, coating: currentCoatings[0].id })); }

    fetchData(); 
  }, [formData.brand, formData.network, formData.type]); 

  // 2. FILTRAGE LOCAL (LE COEUR DU SYSTÈME)
  useEffect(() => {
    if (lenses && lenses.length > 0) {
       let workingList = lenses.map(l => ({...l}));

       // FILTRE MARQUE STRICT
       if (formData.brand && formData.brand !== '') {
           workingList = workingList.filter(l => 
             l.brand && l.brand.toUpperCase().trim() === formData.brand.toUpperCase().trim()
           );
       }

       // PRIX & FORMULE
       if (formData.network === 'HORS_RESEAU') {
          const pRules = userSettings.pricing || {};
          workingList = workingList.map(lens => {
             let rule = pRules.prog || defaultPricingConfig; 
             const lensType = (lens.type || "").toUpperCase();
             const lensName = (lens.name || "").toUpperCase();

             if (lensType === 'UNIFOCAL') {
                 const isStock = lensName.includes(' ST') || lensName.includes('_ST') || lensName.includes('STOCK');
                 rule = isStock ? (pRules.uniStock || defaultPricingConfig) : (pRules.uniFab || defaultPricingConfig);
             } 
             else if (lensType === 'DEGRESSIF') { rule = pRules.degressif || defaultPricingConfig; } 
             else if (lensType.includes('INTERIEUR')) { rule = pRules.interieur || defaultPricingConfig; }
             else if (lensType === 'MULTIFOCAL') { rule = pRules.multifocal || defaultPricingConfig; }

             const newSelling = (lens.purchasePrice * rule.x) + rule.b;
             const newMargin = newSelling - lens.purchasePrice;
             return { ...lens, sellingPrice: Math.round(newSelling), margin: Math.round(newMargin) };
          });
          workingList.sort((a, b) => b.margin - a.margin);
       } else if (formData.network === 'KALIXIA') {
         workingList = workingList.filter(l => l.sellingPrice > 0);
       }

       // FILTRES TECHNIQUES STRICTS
       workingList = workingList.filter(l => {
           // Indice
           if(!l.index_mat) return false;
           const lIdx = l.index_mat.replace(',', '.');
           const fIdx = formData.materialIndex.replace(',', '.');
           if(parseFloat(lIdx) !== parseFloat(fIdx)) return false;

           // Traitement Strict
           if (formData.coating && formData.coating !== '') {
              const selectedCoatingObj = currentCoatings.find(c => c.id === formData.coating);
              if (selectedCoatingObj) {
                 const targetLabel = selectedCoatingObj.label.toUpperCase().trim();
                 const lensCoating = (l.coating || "").toUpperCase().trim();
                 if (lensCoating !== targetLabel) return false;
              }
           }

           // Photochromique
           const isPhotoC = ((l.name || "") + " " + (l.coating || "")).toUpperCase().match(/TRANS|GEN S|SOLA|TGNS|SABR|SAGR/);
           if (formData.photochromic && !isPhotoC) return false;
           if (!formData.photochromic && isPhotoC) return false;

           // Myopie
           if (formData.myopiaControl && !(l.name || "").toUpperCase().includes("MIYO")) return false;

           return true;
       });

       // MISE À JOUR DES DESIGNS DISPONIBLES
       const designs = [...new Set(workingList.map(l => l.design).filter(Boolean))].sort();
       setAvailableDesigns(designs);

       // FILTRE FINAL DESIGN
       if (formData.design && formData.design !== '') {
         setFilteredLenses(workingList.filter(l => 
           l.design && l.design.toUpperCase().trim() === formData.design.toUpperCase().trim()
         ));
       } else {
         setFilteredLenses(workingList);
       }
    } else {
       setAvailableDesigns([]);
       setFilteredLenses([]);
    }
  }, [
    lenses, 
    formData.design, 
    formData.brand, 
    formData.network, 
    formData.photochromic, 
    formData.coating, 
    formData.materialIndex, 
    formData.myopiaControl,
    formData.type,
    userSettings.pricing
  ]);

  const fetchData = (ignoreFilters = false) => {
    setLoading(true);
    setError(null); 
    if (!isLocal && API_URL.includes("VOTRE-URL")) { setLenses(MOCK_LENSES); setLoading(false); return; }

    const params = {
        type: formData.type, 
        network: formData.network, 
        // Si TOUTES marques, on n'envoie rien pour tout recevoir
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

  // --- HANDLERS ---
  const triggerSync = () => {
      if (!sheetsUrl) return alert("URL manquante");
      setSyncLoading(true);
      setSyncStatus(null);
      axios.post(SYNC_URL, { url: sheetsUrl }).then(res => { setSyncStatus({ type: 'success', msg: `OK: ${res.data.count} verres` }); fetchData(); }).catch(err => { setSyncStatus({ type: 'error', msg: "Erreur" }); }).finally(() => setSyncLoading(false));
  };
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;
    if (name === 'addition') { const val = parseFloat(value); if (val > 4.00) newValue = 4.00; if (val < 0) newValue = 0.00; }
    // Suppression de l'effet de bord sur la marque quand on change de réseau
    if (name === 'myopiaControl') { if (newValue === true) { setFormData(prev => ({ ...prev, [name]: newValue, materialIndex: '1.58' })); return; } }
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
  const handleTypeChange = (newType) => { setFormData(prev => ({ ...prev, type: newType, design: '' })); };
  const handleDesignChange = (newDesign) => { setFormData(prev => ({ ...prev, design: newDesign })); };
  const handleCoatingChange = (newCoating) => { setFormData(prev => ({ ...prev, coating: newCoating, cleanOption: false })); };
  const handleCompare = (lens) => { setComparisonLens(lens); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const clearComparison = () => { setComparisonLens(null); };
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const isAdditionDisabled = formData.type === 'UNIFOCAL' || formData.type === 'DEGRESSIF';
  const isMyopiaEligible = formData.type === 'UNIFOCAL' && (formData.brand === 'HOYA' || formData.brand === 'SEIKO');
  const isUvOptionVisible = ['CODIR', 'HOYA', 'SEIKO', 'ORUS'].includes(formData.brand);
  const uvOptionLabel = (formData.brand === 'CODIR' || formData.brand === 'ORUS') ? 'OPTION SUV (UV 400)' : 'OPTION IP+ (UV)';
  const isUvOptionMandatory = formData.materialIndex !== '1.50';

  // Fallback prix
  const safePricing = userSettings.pricing || { uniStock: { x: 2.5, b: 20 }, uniFab: { x: 3.0, b: 30 }, prog: { x: 3.2, b: 50 }, degressif: { x: 3.0, b: 40 }, interieur: { x: 3.0, b: 40 }, multifocal: { x: 3.0, b: 40 } };

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
          <button onClick={toggleSidebar} className="lg:hidden p-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors">
             <Sliders className="w-8 h-8" />
          </button>
          <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isOnline ? <Wifi className="w-4 h-4"/> : <WifiOff className="w-4 h-4"/>}
            {isOnline ? "EN LIGNE" : "HORS LIGNE"}
          </div>
          <button onClick={() => setShowMargins(!showMargins)} className="p-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors">
            {showMargins ? <EyeOff className="w-8 h-8" /> : <Eye className="w-8 h-8" />}
          </button>
          <button onClick={() => setShowSettings(true)} className="p-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors group">
            <Settings className={`w-8 h-8 group-hover:${currentTheme.text} transition-colors`} />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative z-0">
        <aside className={`bg-white border-r border-slate-200 flex flex-col overflow-y-auto z-20 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-full lg:w-[420px] translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-0 opacity-0 pointer-events-none'} absolute lg:relative h-full`}>
          <div className="lg:hidden p-4 border-b border-slate-100 flex justify-between items-center">
             <span className="font-bold text-slate-500">FILTRES</span>
             <button onClick={() => setIsSidebarOpen(false)}><ChevronLeft className="w-6 h-6 text-slate-400"/></button>
          </div>
          <div className="p-6 space-y-8">
             <button onClick={() => setIsSidebarOpen(false)} className="hidden lg:flex absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-full"><ChevronLeft className="w-5 h-5"/></button>
            
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
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-500 tracking-wider flex items-center gap-2"><Tag className="w-5 h-5" /> MARQUE VERRIER</label>
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2 rounded-2xl">
                {brands.map(b => {
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
            
            {/* ... CORRECTION, GEOMETRIE, INDICE, TRAITEMENTS ... */}
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
              <div className="mb-2">
                 <button onClick={() => handleCoatingChange('')} className={`w-full py-2 px-3 text-xs font-bold rounded-lg transition-all border ${formData.coating === '' ? `bg-white ${currentTheme.text} border-slate-200 shadow-sm` : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}`}>TOUS LES TRAITEMENTS</button>
              </div>
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
                  <button key={c.id} onClick={() => handleCoatingChange(c.id)} className={`p-4 rounded-xl border-2 text-left ${formData.coating === c.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100'}`}>
                     <div className="font-bold text-sm">{c.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-4 pb-8"></div>
          </div>
        </aside>

        {!isSidebarOpen && (
          <div className="hidden lg:flex w-12 bg-white border-r border-slate-200 flex-col items-center py-6 z-20">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronRight className="w-6 h-6"/></button>
              <div className="mt-8 writing-vertical-lr text-xs font-bold text-slate-300 tracking-widest rotate-180">FILTRES</div>
          </div>
        )}

        <section className="flex-1 p-8 overflow-y-auto bg-slate-50">
          <div className="max-w-7xl mx-auto">
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
               {/* Tags Résumé... */}
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

        {/* MODALE SETTINGS */}
        {showSettings && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-center items-center p-4" onClick={(e) => { if(e.target === e.currentTarget) setShowSettings(false); }}>
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col border-2 border-slate-100">
              {/* Header, Content & Footer ... */}
              <div className="px-8 py-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-4 text-slate-800">
                  <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm"><Settings className="w-6 h-6 text-slate-600" /></div>
                  <div><h3 className="font-bold text-xl leading-tight">CONFIGURATION</h3><p className="text-xs text-slate-500 font-bold">PERSONNALISATION & LIMITES</p><p className="text-[10px] text-slate-400 mt-1">VERSION {APP_VERSION}</p></div>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-3 hover:bg-slate-200 rounded-full transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
              </div>
              <div className="p-8 overflow-y-auto">
                {/* Contenu Settings: Gestion Catalogue, Connexion, Formule Prix, Identité, Thème ... */}
                 <div className="space-y-10">
                    {/* (Sections identiques aux versions précédentes) */}
                    <div className="space-y-5">
                        <h4 className="font-bold text-sm text-slate-400 border-b-2 border-slate-100 pb-2 mb-4">GESTION CATALOGUE</h4>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <label className="block text-xs font-bold text-slate-600 mb-2">LIEN GOOGLE SHEETS (PUBLIÉ WEB CSV)</label>
                            <div className="flex gap-2">
                                <input type="text" value={sheetsUrl} onChange={(e) => handleSheetsUrlChange(e.target.value)} className="flex-1 p-3 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 text-xs focus:ring-2 outline-none"/>
                                <button onClick={triggerSync} disabled={syncLoading || !sheetsUrl} className="bg-blue-600 text-white px-4 rounded-lg font-bold text-xs hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">{syncLoading ? <RefreshCw className="w-4 h-4 animate-spin"/> : <DownloadCloud className="w-4 h-4"/>} SYNCHRO</button>
                            </div>
                            {syncStatus && (<div className={`mt-3 text-xs font-bold p-2 rounded ${syncStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{syncStatus.msg}</div>)}
                        </div>
                    </div>
                    {/* ... autres settings ... */}
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