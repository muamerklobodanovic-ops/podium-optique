import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Search, RefreshCw, Trophy, Shield, Star, 
  Glasses, Ruler, ChevronRight, Layers, Sun, Monitor, Sparkles, Tag, Eye, EyeOff, Settings, X, Save, Store, Image as ImageIcon, Upload, Car
} from 'lucide-react';

function App() {
  // --- ETATS ---
  const [lenses, setLenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [showSettings, setShowSettings] = useState(false);
  const [showMargins, setShowMargins] = useState(false); // Par défaut masqué pour le client

  // Configuration (Menu Secondaire + Branding)
  const [userSettings, setUserSettings] = useState({
    shopName: "MON OPTICIEN",
    shopLogo: "", 
    themeColor: "blue",
    brandLogos: {
      HOYA: "",
      ZEISS: "",
      SEIKO: "",
      CODIR: "",
      ORUS: "" 
    },
    UNIFOCAL: { maxPocket: 40 },
    PROGRESSIF: { maxPocket: 100 },
    DEGRESSIF: { maxPocket: 70 },
    INTERIEUR: { maxPocket: 70 }
  });

  // Etat du formulaire
  // Note: Coating par défaut 'MISTRAL' (commun à CODIR/ORUS qui sont par défaut)
  const [formData, setFormData] = useState({
    network: 'HORS_RESEAU',
    brand: 'ORUS',         // Par défaut ORUS car HORS_RESEAU
    type: 'PROGRESSIF',
    sphere: -2.00,
    cylinder: 0.00,
    addition: 2.00,
    materialIndex: '1.60',
    coating: 'MISTRAL', 
    cleanOption: false, // Obsolète (intégré aux traitements), gardé pour compatibilité backend
    myopiaControl: false,
    uvOption: true 
  });

  // --- CONFIGURATION URL API ---
  // En local, on utilise http://127.0.0.1:8000/lenses
  // Si vous voulez tester depuis un autre appareil sur le même wifi, remplacez 127.0.0.1 par l'IP de votre PC (ex: 192.168.1.15)
  const PROD_URL = "https://api-podium.onrender.com/lenses";

  // --- THEMES VISUELS ---
  const themes = {
    blue: { 
      name: 'OCÉAN',
      primary: 'bg-blue-700', hover: 'hover:bg-blue-800', 
      text: 'text-blue-700', textDark: 'text-blue-900', 
      light: 'bg-blue-50', border: 'border-blue-200', ring: 'ring-blue-300', 
      shadow: 'shadow-blue-200'
    },
    emerald: { 
      name: 'ÉMERAUDE',
      primary: 'bg-emerald-700', hover: 'hover:bg-emerald-800', 
      text: 'text-emerald-700', textDark: 'text-emerald-900', 
      light: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-300', 
      shadow: 'shadow-emerald-200'
    },
    violet: { 
      name: 'AMÉTHYSTE',
      primary: 'bg-violet-700', hover: 'hover:bg-violet-800', 
      text: 'text-violet-700', textDark: 'text-violet-900', 
      light: 'bg-violet-50', border: 'border-violet-200', ring: 'ring-violet-300', 
      shadow: 'shadow-violet-200'
    },
    amber: { 
      name: 'AMBRE',
      primary: 'bg-amber-700', hover: 'hover:bg-amber-800', 
      text: 'text-amber-700', textDark: 'text-amber-900', 
      light: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-300', 
      shadow: 'shadow-amber-200'
    },
    rose: { 
      name: 'RUBIS',
      primary: 'bg-rose-700', hover: 'hover:bg-rose-800', 
      text: 'text-rose-700', textDark: 'text-rose-900', 
      light: 'bg-rose-50', border: 'border-rose-200', ring: 'ring-rose-300', 
      shadow: 'shadow-rose-200'
    },
  };

  const currentTheme = themes[userSettings.themeColor] || themes.blue;

  // --- DONNÉES DE CONFIGURATION ---
  const brands = [
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
    { id: 'INTERIEUR', label: 'INTER. / BUREAU' }
  ];

  const indices = ['1.50', '1.58', '1.60', '1.67', '1.74'];

  // CONFIGURATION DES TRAITEMENTS PAR MARQUE
  const codirCoatings = [
    { id: 'MISTRAL', label: 'MISTRAL', type: 'CLASSIC', icon: <Sparkles className="w-3 h-3"/> },
    { id: 'QUATTRO_UV', label: 'QUATTRO UV', type: 'CLASSIC', icon: <Shield className="w-3 h-3"/> },
    { id: 'QUATTRO_UV_CLEAN', label: 'QUATTRO UV CLEAN', type: 'CLEAN', icon: <Shield className="w-3 h-3"/> },
    { id: 'E_PROTECT', label: 'E-PROTECT', type: 'BLUE', icon: <Monitor className="w-3 h-3"/> },
    { id: 'B_PROTECT', label: 'B-PROTECT', type: 'BLUE', icon: <Monitor className="w-3 h-3"/> },
    { id: 'B_PROTECT_CLEAN', label: 'B-PROTECT CLEAN', type: 'CLEAN', icon: <Monitor className="w-3 h-3"/> },
  ];

  const brandCoatings = {
    CODIR: codirCoatings,
    ORUS: codirCoatings, // ORUS = CODIR
    SEIKO: [
      { id: 'SRC_ONE', label: 'SRC-ONE', type: 'CLASSIC', icon: <Sparkles className="w-3 h-3"/> },
      { id: 'SRC_ULTRA', label: 'SRC-ULTRA', type: 'CLEAN', icon: <Shield className="w-3 h-3"/> },
      { id: 'SRC_SCREEN', label: 'SRC-SCREEN', type: 'BLUE', icon: <Monitor className="w-3 h-3"/> },
      { id: 'SRC_ROAD', label: 'SRC-ROAD', type: 'DRIVE', icon: <Car className="w-3 h-3"/> },
      { id: 'SRC_SUN', label: 'SRC-SUN', type: 'SUN', icon: <Sun className="w-3 h-3"/> },
    ],
    HOYA: [
      { id: 'HA', label: 'HA', type: 'CLASSIC', icon: <Sparkles className="w-3 h-3"/> },
      { id: 'HVLL', label: 'HVLL', type: 'CLASSIC', icon: <Shield className="w-3 h-3"/> },
      { id: 'HVLL_UV', label: 'HVLL UV', type: 'CLASSIC', icon: <Shield className="w-3 h-3"/> },
      { id: 'HVLL_BC', label: 'HVLL BC', type: 'BLUE', icon: <Monitor className="w-3 h-3"/> },
      { id: 'HVLL_BCUV', label: 'HVLL BCUV', type: 'BLUE', icon: <Monitor className="w-3 h-3"/> },
    ],
    ZEISS: [
      { id: 'DV_SILVER', label: 'DV SILVER', type: 'CLASSIC', icon: <Sparkles className="w-3 h-3"/> },
      { id: 'DV_PLATINUM', label: 'DV PLATINUM', type: 'CLASSIC', icon: <Shield className="w-3 h-3"/> },
      { id: 'DV_BP', label: 'DV BLUEPROTECT', type: 'BLUE', icon: <Monitor className="w-3 h-3"/> },
      { id: 'DV_DRIVE', label: 'DV DRIVESAFE', type: 'DRIVE', icon: <Car className="w-3 h-3"/> },
    ]
  };

  const currentCoatings = brandCoatings[formData.brand] || brandCoatings.CODIR;

  useEffect(() => {
    fetchData();
  }, []);

  // --- LOGIQUE MÉTIER AUTOMATIQUE ---
  useEffect(() => {
    // 1. Règle SUV (CODIR/ORUS) ou IP+ (HOYA/SEIKO)
    // Obligatoire si indice != 1.50
    if (['CODIR', 'SEIKO', 'HOYA', 'ORUS'].includes(formData.brand)) {
      if (formData.materialIndex !== '1.50') {
        // Force l'option à TRUE
        if (!formData.uvOption) {
          setFormData(prev => ({ ...prev, uvOption: true }));
        }
      }
    }

    // 2. Réinitialisation du traitement si on change de marque
    const coatingExists = currentCoatings.find(c => c.id === formData.coating);
    if (!coatingExists) {
      setFormData(prev => ({ ...prev, coating: currentCoatings[0].id }));
    }

  }, [formData.materialIndex, formData.brand, formData.network]); 

  const fetchData = () => {
    setLoading(true);
    setError(null); 

    axios.get(API_URL, {
      params: {
        type: formData.type,       
        network: formData.network, 
        brand: formData.brand,     
        sphere: formData.sphere,
        index: formData.materialIndex,
        coating: formData.coating,
        clean: formData.cleanOption,
        myopia: formData.myopiaControl,
        uvOption: formData.uvOption, 
        pocketLimit: userSettings[formData.type]?.maxPocket || 0
      }
    })
      .then(response => {
        setLenses(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur connexion:", err);
        setError("ERREUR DE CONNEXION AU SERVEUR PYTHON.");
        setLoading(false);
      });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;

    if (name === 'addition') {
      const val = parseFloat(value);
      if (val > 4.00) newValue = 4.00;
      if (val < 0) newValue = 0.00;
    }

    // --- LOGIQUE RÉSEAU / MARQUE ---
    if (name === 'network') {
      // Si HORS_RESEAU -> ORUS, sinon -> CODIR
      const defaultBrand = (newValue === 'HORS_RESEAU') ? 'ORUS' : 'CODIR';
      
      setFormData(prev => ({ 
        ...prev, 
        [name]: newValue, 
        brand: defaultBrand,
        myopiaControl: false // Reset Myopia car pas dispo chez CODIR/ORUS
      }));
      return;
    }

    // --- LOGIQUE MYOPIE ---
    if (name === 'myopiaControl') {
      if (newValue === true) {
        // MiYOSMART force l'indice 1.58
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
        if (target === 'shop') {
          setUserSettings(prev => ({ ...prev, shopLogo: reader.result }));
        } else {
          setUserSettings(prev => ({
            ...prev,
            brandLogos: { ...prev.brandLogos, [target]: reader.result }
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSettingChange = (section, field, value) => {
    if (section === 'branding') {
      setUserSettings(prev => ({ ...prev, [field]: value }));
    } else {
      setUserSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: parseFloat(value) || 0
        }
      }));
    }
  };

  const handleTypeChange = (newType) => {
    const shouldDisableAdd = newType === 'UNIFOCAL' || newType === 'DEGRESSIF';
    setFormData(prev => ({
      ...prev,
      type: newType,
      addition: shouldDisableAdd ? 0.00 : prev.addition,
      // Myopia dispo seulement en Unifocal
      myopiaControl: newType === 'UNIFOCAL' ? prev.myopiaControl : false 
    }));
  };

  const handleCoatingChange = (newCoating) => {
    setFormData(prev => ({
      ...prev,
      coating: newCoating,
      cleanOption: false 
    }));
  };

  // --- HELPERS D'AFFICHAGE ---
  const isAdditionDisabled = formData.type === 'UNIFOCAL' || formData.type === 'DEGRESSIF';
  
  // Freination Myopie : Unifocal + (Hoya ou Seiko) uniquement
  const isMyopiaEligible = formData.type === 'UNIFOCAL' && (formData.brand === 'HOYA' || formData.brand === 'SEIKO');

  // Option SUV / IP+ : CODIR, HOYA, SEIKO, ORUS
  const isUvOptionVisible = ['CODIR', 'HOYA', 'SEIKO', 'ORUS'].includes(formData.brand);
  
  // Label dynamique selon la marque
  const uvOptionLabel = (formData.brand === 'CODIR' || formData.brand === 'ORUS') 
    ? 'OPTION SUV (UV 400)' 
    : 'OPTION IP+ (UV)';
    
  // Obligatoire si pas 1.50
  const isUvOptionMandatory = formData.materialIndex !== '1.50';

  return (
    <div className="min-h-screen flex flex-col text-slate-800 bg-slate-50 relative font-['Arial'] uppercase">
      
      {/* --- HEADER --- */}
      <header className="bg-white border-b border-slate-200 px-6 py-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-6">
          <div className={`${currentTheme.primary} p-3 rounded-xl shadow-lg ${currentTheme.shadow} transition-colors duration-300`}>
            <LayoutDashboard className="w-8 h-8 text-white" />
          </div>
          
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-slate-400 tracking-widest mb-1">PODIUM OPTIQUE</h1>
            <div className="flex items-center gap-4">
              {userSettings.shopLogo && (
                <img src={userSettings.shopLogo} alt="Logo" className="h-16 w-auto object-contain max-w-[250px]" />
              )}
              {!userSettings.shopLogo && <Store className="w-12 h-12 text-slate-300"/>}
              
              <p className={`text-4xl font-bold ${currentTheme.text} leading-none tracking-tight`}>
                {userSettings.shopName || "MON OPTICIEN"}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* BOUTON OEIL (Marges) */}
          <button 
            onClick={() => setShowMargins(!showMargins)}
            className="p-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors"
            title={showMargins ? "MASQUER LES MARGES" : "AFFICHER LES MARGES"}
          >
            {showMargins ? <EyeOff className="w-8 h-8" /> : <Eye className="w-8 h-8" />}
          </button>

          {/* BOUTON SETTINGS */}
          <button 
            onClick={() => setShowSettings(true)}
            className="p-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors group"
            title="PARAMÈTRES"
          >
            <Settings className={`w-8 h-8 group-hover:${currentTheme.text} transition-colors`} />
          </button>
        </div>
      </header>

      {/* --- CORPS PRINCIPAL --- */}
      <main className="flex-1 flex overflow-hidden relative z-0">
        
        {/* === COLONNE GAUCHE : FORMULAIRE === */}
        <aside className="w-[420px] bg-white border-r border-slate-200 flex flex-col overflow-y-auto z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="p-6 space-y-8">
            
            {/* 1. Réseau */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-500 tracking-wider flex items-center gap-2">
                <Shield className="w-5 h-5" /> RÉSEAU DE SOIN
              </label>
              <div className="relative">
                <select 
                  name="network" 
                  value={formData.network}
                  onChange={handleChange}
                  className={`w-full p-4 pl-5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-lg focus:ring-2 outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors focus:${currentTheme.border} focus:ring-${userSettings.themeColor}-500`}
                  style={{ '--tw-ring-color': `var(--${userSettings.themeColor}-500)` }} 
                >
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

            {/* 2. Marque Verrier (Avec Logos) */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-500 tracking-wider flex items-center gap-2">
                <Tag className="w-5 h-5" /> MARQUE VERRIER
              </label>
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2 rounded-2xl">
                {brands.map(b => {
                  // ORUS n'est visible que si HORS_RESEAU
                  if (b.id === 'ORUS' && formData.network !== 'HORS_RESEAU') return null;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setFormData({...formData, brand: b.id})}
                      className={`py-3 px-2 rounded-xl transition-all duration-200 flex flex-col items-center gap-2 ${
                        formData.brand === b.id 
                        ? `bg-white ${currentTheme.text} shadow-md ring-2 ring-black/5 scale-[1.02]` 
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
                      }`}
                    >
                      {/* Logo Verrier si dispo */}
                      {userSettings.brandLogos[b.id] ? (
                        <img src={userSettings.brandLogos[b.id]} alt={b.label} className="h-6 w-auto object-contain opacity-90 mix-blend-multiply" />
                      ) : (
                        <div className="h-6 w-full flex items-center justify-center bg-slate-100 rounded text-[10px] text-slate-300">LOGO</div>
                      )}
                      <span className="text-sm font-bold tracking-wider">{b.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* 3. Correction */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-500 tracking-wider flex items-center gap-2">
                <Glasses className="w-5 h-5" /> CORRECTION (OD)
              </label>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Sphère */}
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-bold ml-1">SPHÈRE</label>
                  <div className="relative group">
                    <input 
                      type="number" step="0.25" name="sphere"
                      value={formData.sphere} onChange={handleChange}
                      className={`w-full p-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xl text-slate-800 focus:ring-2 outline-none group-hover:border-slate-300 transition-colors focus:${currentTheme.border} focus:ring-${userSettings.themeColor}-500`}
                    />
                    <span className="absolute right-3 top-4 text-xs text-slate-400 font-bold pointer-events-none">D</span>
                  </div>
                </div>

                {/* Cylindre */}
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-bold ml-1">CYLINDRE</label>
                  <div className="relative group">
                    <input 
                      type="number" step="0.25" name="cylinder"
                      value={formData.cylinder} onChange={handleChange}
                      className={`w-full p-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xl text-slate-800 focus:ring-2 outline-none group-hover:border-slate-300 transition-colors focus:${currentTheme.border} focus:ring-${userSettings.themeColor}-500`}
                    />
                    <span className="absolute right-3 top-4 text-xs text-slate-400 font-bold pointer-events-none">D</span>
                  </div>
                </div>
              </div>
              
              {/* Addition */}
              <div className={`transition-opacity duration-300 ${isAdditionDisabled ? 'opacity-50' : 'opacity-100'}`}>
                  <label className="text-xs text-slate-400 mb-1.5 block font-bold ml-1">
                    ADDITION {isAdditionDisabled && "(N/A)"}
                  </label>
                  <div className="relative group">
                    <input 
                      type="number" step="0.25" min="0.00" max="4.00" name="addition"
                      value={formData.addition} onChange={handleChange}
                      disabled={isAdditionDisabled}
                      className={`w-full p-3 pr-8 border rounded-xl font-bold text-xl text-slate-800 outline-none transition-colors
                        ${isAdditionDisabled 
                          ? 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-400' 
                          : `bg-slate-50 border-slate-200 focus:ring-2 focus:${currentTheme.border} group-hover:border-slate-300`
                        }`}
                    />
                    <span className={`absolute right-3 top-4 text-xs font-bold pointer-events-none ${isAdditionDisabled ? 'text-slate-300' : 'text-slate-400'}`}>D</span>
                  </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* 4. Géométrie */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-500 tracking-wider flex items-center gap-2">
                <Ruler className="w-5 h-5" /> GÉOMÉTRIE
              </label>
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2 rounded-2xl">
                {lensTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => handleTypeChange(type.id)}
                    className={`py-3 px-2 text-xs font-bold rounded-lg transition-all duration-200 border ${
                      formData.type === type.id 
                      ? `bg-white ${currentTheme.text} shadow-sm border-slate-200 scale-[1.02] ring-1 ring-black/5` 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Option Freination Myopie (Hoya/Seiko + Unifocal uniquement) */}
              <div className={`transition-all duration-300 overflow-hidden ${isMyopiaEligible ? 'max-h-24 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                <label className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer border-2 transition-colors ${formData.myopiaControl ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}>
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      name="myopiaControl"
                      checked={formData.myopiaControl}
                      onChange={handleChange}
                      className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-purple-300 bg-white transition-all checked:border-purple-600 checked:bg-purple-600"
                    />
                    <Eye className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white opacity-0 peer-checked:opacity-100" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-purple-900 block leading-tight">FREINATION MYOPIE</span>
                    <span className="text-[10px] text-purple-600 font-bold mt-0.5 block">TYPE MIYOSMART (INDICE 1.58 OBLIGATOIRE)</span>
                  </div>
                </label>
              </div>
            </div>

            {/* 5. Indice / Matière */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-500 tracking-wider flex items-center gap-2">
                <Layers className="w-5 h-5" /> INDICE
              </label>
              <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1.5">
                {indices.map(idx => {
                  const isDisabled = formData.myopiaControl && idx !== '1.58';
                  return (
                    <button
                      key={idx}
                      disabled={isDisabled}
                      onClick={() => setFormData({...formData, materialIndex: idx})}
                      className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all duration-200 ${
                        formData.materialIndex === idx 
                        ? `bg-white ${currentTheme.text} shadow-sm ring-1 ring-black/5` 
                        : isDisabled ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-200/50'
                      }`}
                    >
                      {idx}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 6. Traitements */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-500 tracking-wider flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> TRAITEMENTS
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                {currentCoatings.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleCoatingChange(c.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden ${
                      formData.coating === c.id
                      ? `${currentTheme.light} ${currentTheme.border} ${currentTheme.textDark} ring-1 ${currentTheme.ring.replace('focus:', '')}`
                      : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-[10px] font-bold mb-1 opacity-60 flex items-center gap-1.5">
                      {c.icon} {c.type === 'BLUE' ? 'LUMIÈRE BLEUE' : c.type === 'SUN' ? 'SOLEIL' : c.type === 'DRIVE' ? 'CONDUITE' : c.type === 'CLEAN' ? 'NETTOYAGE' : 'ANTIREFLET'}
                    </div>
                    <div className="font-bold text-sm">{c.label}</div>
                  </button>
                ))}
              </div>

              {/* Option SUV / IP+ (Conditionnelle) */}
              <div className={`transition-all duration-300 overflow-hidden ${isUvOptionVisible ? 'max-h-24 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  isUvOptionMandatory 
                  ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-80' 
                  : 'bg-orange-50 border-orange-200 hover:bg-orange-100'
                }`}>
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      name="uvOption"
                      checked={formData.uvOption}
                      onChange={handleChange}
                      disabled={isUvOptionMandatory}
                      className={`peer h-5 w-5 rounded-md border bg-white transition-all ${isUvOptionMandatory ? 'border-slate-400 bg-slate-400 checked:bg-slate-500' : 'border-orange-300 checked:border-orange-600 checked:bg-orange-600 cursor-pointer'}`}
                    />
                    {(formData.uvOption || isUvOptionMandatory) && <Sparkles className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white" />}
                  </div>
                  <div>
                    <span className={`text-sm font-bold select-none ${isUvOptionMandatory ? 'text-slate-600' : 'text-orange-900'}`}>{uvOptionLabel}</span>
                    {isUvOptionMandatory && <span className="ml-2 text-[10px] text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded font-bold">OBLIGATOIRE</span>}
                  </div>
                </label>
              </div>
            </div>

            {/* BOUTON CALCULER */}
            <div className="pt-4 pb-8">
              <button 
                onClick={fetchData}
                disabled={loading}
                className={`w-full py-5 ${currentTheme.primary} ${currentTheme.hover} disabled:bg-slate-300 text-white font-bold text-lg rounded-2xl shadow-xl ${currentTheme.shadow} transition-all active:scale-95 flex justify-center items-center gap-3`}
              >
                {loading ? <RefreshCw className="animate-spin w-6 h-6"/> : <Search className="w-6 h-6" />}
                {loading ? "CALCUL EN COURS..." : "CALCULER LE PODIUM"}
              </button>
            </div>

          </div>
        </aside>

        {/* === COLONNE DROITE : RÉSULTATS === */}
        <section className="flex-1 p-8 overflow-y-auto bg-slate-50">
          <div className="max-w-7xl mx-auto">
            
            {/* Résumé des filtres actifs */}
            <div className="mb-8 flex flex-wrap gap-3 text-sm items-center font-bold text-slate-500">
               <span>FILTRES :</span>
               
               <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs flex items-center gap-2">
                 <Shield className="w-4 h-4"/>
                 {formData.network === 'HORS_RESEAU' ? 'HORS RÉSEAU' : formData.network}
               </span>

               <span className={`bg-white px-3 py-1.5 rounded-lg border border-slate-200 ${currentTheme.text} shadow-sm text-xs flex items-center gap-2`}>
                 <Tag className="w-4 h-4"/>
                 {brands.find(b => b.id === formData.brand)?.label}
               </span>
               
               <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs">
                 {lensTypes.find(t => t.id === formData.type)?.label} {formData.materialIndex}
               </span>
               
               {formData.myopiaControl && (
                 <span className="bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-200 text-purple-800 shadow-sm text-xs flex items-center gap-2">
                   <Eye className="w-4 h-4"/> FREINATION MYOPIE
                 </span>
               )}

               {(formData.uvOption) && isUvOptionVisible && (
                 <span className="bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200 text-orange-800 shadow-sm text-xs">
                   {uvOptionLabel}
                 </span>
               )}

               <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs">
                 SPH {formData.sphere > 0 ? '+' : ''}{formData.sphere}
               </span>
               
               <span className={`bg-white px-3 py-1.5 rounded-lg border border-slate-200 ${currentTheme.text} shadow-sm text-xs`}>
                 {currentCoatings.find(c => c.id === formData.coating)?.label}
                 {formData.cleanOption && " + CLEAN"}
               </span>
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-6 rounded-2xl mb-8 border border-red-200 flex items-center gap-4 font-bold">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"/>
                {error}
              </div>
            )}

            {/* Grille des résultats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
              
              {lenses.length === 0 && !loading && !error && (
                <div className="col-span-3 py-32 text-center opacity-60">
                  <div className="bg-white inline-flex p-6 rounded-full mb-6 shadow-sm border border-slate-100">
                    <Glasses className="w-16 h-16 text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-600 mb-2">AUCUN VERRE TROUVÉ</h3>
                  <p className="text-sm text-slate-400 font-bold">MODIFIEZ VOS CRITÈRES POUR VOIR LES RÉSULTATS.</p>
                </div>
              )}

              {lenses.map((lens, index) => {
                const podiumStyles = [
                  { 
                    border: "border-yellow-400 ring-4 ring-yellow-50 shadow-xl shadow-yellow-100", 
                    badge: "bg-yellow-400 text-white border-yellow-500",
                    icon: <Trophy className="w-5 h-5 text-white" />,
                    label: "MEILLEUR CHOIX"
                  },
                  { 
                    border: `border-slate-200 shadow-lg ${currentTheme.shadow}`, 
                    badge: `${currentTheme.light} ${currentTheme.textDark} ${currentTheme.border}`,
                    icon: <Shield className={`w-5 h-5 ${currentTheme.text}`} />,
                    label: "RESTE À CHARGE OPTIMISÉ"
                  },
                  { 
                    border: "border-slate-200 shadow-lg", 
                    badge: "bg-slate-100 text-slate-600 border-slate-200",
                    icon: <Star className="w-5 h-5 text-orange-400" />,
                    label: "PREMIUM"
                  }
                ];

                const style = podiumStyles[index] || podiumStyles[1];

                return (
                  <div key={lens.id} className={`group bg-white rounded-3xl hover:-translate-y-2 border-2 transition-all duration-300 overflow-hidden relative ${style.border}`}>
                     
                     <div className="absolute top-5 right-5 z-10">
                        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm ${style.badge}`}>
                          {style.icon} {style.label}
                        </span>
                     </div>

                     <div className="p-8 pt-14 border-b border-slate-50 relative">
                        <h3 className="font-bold text-2xl text-slate-800 mb-2 leading-tight">{lens.name}</h3>
                        <p className="text-sm text-slate-500 font-bold flex items-center gap-3">
                          {lens.brand} 
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"/> 
                          INDICE {lens.index_mat || formData.materialIndex}
                        </p>
                     </div>
                     
                     <div className="p-8 bg-slate-50/50 group-hover:bg-white transition-colors space-y-6">
                        {/* AFFICHAGE CONDITIONNEL DES PRIX / MARGES */}
                        {showMargins ? (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white p-3 rounded-xl border border-slate-100 text-center shadow-sm">
                                <span className="block text-[10px] text-slate-400 font-bold mb-1">ACHAT HT</span>
                                <span className="block text-slate-400 line-through font-bold text-lg">{lens.purchasePrice} €</span>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-slate-100 text-center shadow-sm">
                                <span className="block text-[10px] text-slate-400 font-bold mb-1">VENTE TTC</span>
                                <span className="block text-slate-800 font-bold text-2xl">{lens.sellingPrice} €</span>
                              </div>
                            </div>
                            <div className="pt-2">
                              <div className="flex justify-between items-end mb-2">
                                 <span className="text-xs font-bold text-green-700 tracking-wide">MARGE NETTE</span>
                                 <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-lg">
                                   {((lens.margin / lens.sellingPrice) * 100).toFixed(0)}%
                                 </span>
                              </div>
                              <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center justify-between">
                                 <div className="text-4xl font-bold text-green-700 tracking-tight">+{lens.margin} €</div>
                                 <Trophy className="w-8 h-8 text-green-200" />
                              </div>
                            </div>
                          </>
                        ) : (
                          // MODE CLIENT (Masqué)
                          <div className="pt-2 flex flex-col h-full">
                             {/* Prix en gros, vert sur fond vert */}
                             <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center mb-4 flex-1 flex flex-col justify-center items-center">
                               <span className="block text-xs font-bold text-green-600 mb-2 uppercase tracking-wider">PRIX CONSEILLÉ</span>
                               <span className="text-5xl font-bold text-green-600 tracking-tighter">
                                 {lens.sellingPrice} €
                               </span>
                             </div>
                             
                             {/* Référence en tout petit en bas à gauche */}
                             <div className="text-left pl-1">
                               <span className="text-[10px] font-mono text-slate-300 tracking-widest">
                                 REF-{Math.floor(lens.margin * 4.2 + 1000)}
                               </span>
                             </div>
                          </div>
                        )}
                     </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* === MODALE DE RÉGLAGES (SETTINGS) === */}
        {showSettings && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col border-2 border-slate-100">
              
              {/* En-tête Modale */}
              <div className="px-8 py-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-4 text-slate-800">
                  <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    <Settings className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl leading-tight">CONFIGURATION</h3>
                    <p className="text-xs text-slate-500 font-bold">PERSONNALISATION & LIMITES</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-3 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>

              {/* Corps Modale */}
              <div className="p-8 overflow-y-auto">
                <div className="space-y-10">
                  
                  {/* --- SECTION 1 : Identité --- */}
                  <div className="space-y-5">
                    <h4 className="font-bold text-sm text-slate-400 border-b-2 border-slate-100 pb-2 mb-4">
                       IDENTITÉ DU POINT DE VENTE
                    </h4>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2">NOM DU MAGASIN</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={userSettings.shopName}
                            onChange={(e) => handleSettingChange('branding', 'shopName', e.target.value)}
                            placeholder="EX: MON OPTICIEN"
                            className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 outline-none"
                          />
                          <Store className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2">LOGO DU MAGASIN</label>
                        <div className="flex items-center gap-4">
                          {userSettings.shopLogo && (
                            <div className="h-16 w-16 relative bg-white rounded-xl border border-slate-200 p-2 flex-shrink-0 shadow-sm">
                               <img src={userSettings.shopLogo} alt="Logo" className="h-full w-full object-contain" />
                               <button 
                                 onClick={() => setUserSettings(prev => ({...prev, shopLogo: ""}))}
                                 className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm transition-colors"
                               >
                                 <X className="w-3 h-3" />
                               </button>
                            </div>
                          )}
                          
                          <div className="relative flex-1">
                            <div className="relative">
                               <input 
                                 type="file" 
                                 accept="image/*"
                                 onChange={(e) => handleLogoUpload(e, 'shop')}
                                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                               />
                               <div className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-200 border-dashed rounded-xl text-slate-500 text-xs font-bold flex items-center hover:bg-slate-100 transition-colors uppercase">
                                 {userSettings.shopLogo ? "CHANGER LE FICHIER..." : "CLIQUEZ POUR CHOISIR UN FICHIER..."}
                               </div>
                               <Upload className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- SECTION 2 : LOGOS VERRIERS --- */}
                  <div className="space-y-5">
                    <h4 className="font-bold text-sm text-slate-400 border-b-2 border-slate-100 pb-2 mb-4">
                       LOGOS VERRIERS (POUR AFFICHAGE)
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {brands.map(b => (
                        <div key={b.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                           <div className="h-10 w-10 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center flex-shrink-0">
                             {userSettings.brandLogos[b.id] ? (
                               <img src={userSettings.brandLogos[b.id]} alt={b.label} className="h-full w-full object-contain" />
                             ) : (
                               <Tag className="w-4 h-4 text-slate-300"/>
                             )}
                           </div>
                           <div className="flex-1 relative overflow-hidden">
                             <label className="block text-[10px] font-bold text-slate-500 mb-1">{b.label}</label>
                             <input 
                               type="file"
                               accept="image/*"
                               onChange={(e) => handleLogoUpload(e, b.id)}
                               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                             />
                             <div className="text-[9px] font-bold text-blue-600 uppercase cursor-pointer hover:underline">
                               {userSettings.brandLogos[b.id] ? "MODIFIER" : "AJOUTER LOGO"}
                             </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* --- SECTION 3 : Thème --- */}
                  <div className="space-y-5">
                    <h4 className="font-bold text-sm text-slate-400 border-b-2 border-slate-100 pb-2 mb-4">
                       THÈME & COULEURS
                    </h4>
                    
                    <div className="grid grid-cols-5 gap-3">
                      {Object.keys(themes).map(colorKey => (
                        <button
                          key={colorKey}
                          onClick={() => handleSettingChange('branding', 'themeColor', colorKey)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                            userSettings.themeColor === colorKey 
                            ? `border-${colorKey}-500 bg-${colorKey}-50` 
                            : 'border-transparent hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full ${themes[colorKey].primary} shadow-sm ring-4 ring-white`}></div>
                          <span className="text-[10px] font-bold text-slate-500">{themes[colorKey].name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* --- SECTION 4 : Limites Reste à Charge --- */}
                  <div className="space-y-5">
                    <div className="flex justify-between items-end border-b-2 border-slate-100 pb-2 mb-4">
                      <h4 className="font-bold text-sm text-slate-400">
                        PLAFONDS RESTE À CHARGE
                      </h4>
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-1 rounded">
                        REMBOURSEMENT GÉRÉ PAR BDD
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      {lensTypes.map(type => (
                        <div key={type.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                           <label className="block text-xs font-bold text-slate-600 mb-2">
                              {type.label}
                           </label>
                           <div className="relative">
                              <input 
                                type="number" 
                                value={userSettings[type.id]?.maxPocket || ''}
                                onChange={(e) => handleSettingChange(type.id, 'maxPocket', e.target.value)}
                                className="w-full p-3 pr-10 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 outline-none text-right text-lg"
                              />
                              <span className="absolute right-4 top-3.5 text-sm text-slate-400 font-bold">€</span>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* Pied Modale */}
              <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-4">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors text-sm"
                >
                  FERMER
                </button>
                <button 
                  onClick={() => {
                    setShowSettings(false);
                    fetchData(); // Relance le calcul
                  }}
                  className={`px-8 py-3 ${currentTheme.primary} ${currentTheme.hover} text-white font-bold rounded-xl shadow-lg ${currentTheme.shadow} transition-transform active:scale-95 flex items-center gap-2 text-sm`}
                >
                  <Save className="w-5 h-5" />
                  SAUVEGARDER
                </button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;