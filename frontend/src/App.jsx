import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Search, RefreshCw, Trophy, Shield, Star, 
  Glasses, Ruler, ChevronRight, Layers, Sun, Monitor, Sparkles, Tag, Eye, EyeOff, Settings, X, Save, Store, Image as ImageIcon, Upload, Car
} from 'lucide-react';

// --- COMPOSANT LOGOS (SVG VECTORISÉS CORRIGÉS) ---
const BrandLogo = ({ brand, className = "h-full w-auto" }) => {
  // Style pour que le SVG s'adapte parfaitement au conteneur
  const style = {
    width: '100%',
    height: '100%',
    display: 'block',
  };

  switch (brand) {
    case 'ZEISS':
      return (
        <svg viewBox="0 0 900 450" className={className} style={style} xmlns="http://www.w3.org/2000/svg">
           <path d="M0 0 C297 0 594 0 900 0 C900 148.5 900 297 900 450 C603 450 306 450 0 450 C0 301.5 0 153 0 0 Z" fill="#F8F8F8"/>
           <path d="M226.5 137.8 L276.3 137.8 L276.3 163.4 L226.5 163.4 L226.5 248.6 L276.3 248.6 L276.3 274.2 L185.1 274.2 L185.1 137.8 L226.5 137.8 Z M448.5 137.8 L448.5 163.4 L398.9 163.4 L398.9 193.4 L439.7 193.4 L439.7 219 L398.9 219 L398.9 248.6 L448.5 248.6 L448.5 274.2 L357.5 274.2 L357.5 137.8 L448.5 137.8 Z M522.5 137.8 L522.5 274.2 L481.1 274.2 L481.1 137.8 L522.5 137.8 Z" fill="#131313"/>
           <path d="M646.3 167.4 C626.3 163.4 606.3 179.8 606.3 179.8 C606.3 189 612.3 194.6 623.1 198.2 L633.9 201.8 C650.7 207.4 659.5 217.4 659.5 233.4 C659.5 257.4 641.1 276.6 614.3 276.6 C603.9 276.6 593.9 273.8 584.7 269 L592.3 245.4 C600.3 249.4 608.7 251.4 615.5 251.4 C627.5 251.4 635.1 245.4 635.1 235.4 C635.1 225.4 628.7 219.4 618.3 215.8 L607.1 211.8 C591.1 206.2 581.9 195.4 581.9 179.4 C581.9 154.6 601.1 135.4 627.1 135.4 C636.7 135.4 645.5 137.4 653.9 141.8 L646.3 167.4 Z" fill="#131313"/>
           <path d="M733.9 167.4 C713.9 163.4 693.9 169.8 693.9 179.8 C693.9 189 699.9 194.6 710.7 198.2 L721.5 201.8 C738.3 207.4 747.1 217.4 747.1 233.4 C747.1 257.4 728.7 276.6 701.9 276.6 C691.5 276.6 681.5 273.8 672.3 269 L679.9 245.4 C687.9 249.4 696.3 251.4 703.1 251.4 C715.1 251.4 722.7 245.4 722.7 235.4 C722.7 225.4 716.3 219.4 705.9 215.8 L694.7 211.8 C678.7 206.2 669.5 195.4 669.5 179.4 C669.5 154.6 688.7 135.4 714.7 135.4 C724.3 135.4 733.1 137.4 741.5 141.8 L733.9 167.4 Z" fill="#131313"/>
           <path d="M0 0 C25.3 0 50.6 0 75.9 0 C75.9 13.1 75.9 26.2 75.9 39.3 C50.6 39.3 25.3 39.3 0 39.3 C0 26.2 0 13.1 0 0 Z" fill="#0072C6" transform="translate(100,300)"/>
        </svg>
      );
    case 'HOYA':
      return (
        <svg viewBox="0 0 800 204" className={className} style={style} xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0 C264 0 528 0 800 0 C800 67.32 800 134.64 800 204 C536 204 272 204 0 204 C0 136.68 0 69.36 0 0 Z" fill="#F9FAFA"/>
          <path d="M230.2 40.8 L276.5 40.8 L276.5 96.3 L329.2 96.3 L329.2 40.8 L375.5 40.8 L375.5 163.2 L329.2 163.2 L329.2 132.6 L276.5 132.6 L276.5 163.2 L230.2 163.2 L230.2 40.8 Z M458.5 165.2 C423.5 165.2 394.5 137.2 394.5 102.2 C394.5 67.2 423.5 39.2 458.5 39.2 C493.5 39.2 522.5 67.2 522.5 102.2 C522.5 137.2 493.5 165.2 458.5 165.2 Z M458.5 75.5 C443.5 75.5 431.5 87.5 431.5 102.2 C431.5 116.9 443.5 128.9 458.5 128.9 C473.5 128.9 485.5 116.9 485.5 102.2 C485.5 87.5 473.5 75.5 458.5 75.5 Z M558.5 40.8 L608.2 40.8 L627.5 88.5 L646.8 40.8 L696.5 40.8 L653.5 128.5 L653.5 163.2 L601.5 163.2 L601.5 128.5 L558.5 40.8 Z M720.5 163.2 L762.5 40.8 L800.5 163.2 L755.5 163.2 L748.5 138.5 L727.5 138.5 L720.5 163.2 Z M738.5 102.5 L730.5 126.5 L745.5 126.5 L738.5 102.5 Z" fill="#005596"/>
        </svg>
      );
    case 'SEIKO':
      return (
        <svg viewBox="0 0 371 247" className={className} style={style} xmlns="http://www.w3.org/2000/svg">
           <path d="M0 0 C122.43 0 244.86 0 371 0 C371 81.51 371 163.02 371 247 C248.57 247 126.14 247 0 247 C0 165.49 0 83.98 0 0 Z" fill="#FCFCFC"/>
           <path d="M45 100 C45 100 55 85 75 85 C90 85 95 95 95 110 C95 130 80 140 65 140 C50 140 45 130 45 120 L25 120 C25 145 50 160 75 160 C100 160 120 140 120 110 C120 80 95 65 70 65 C50 65 40 75 35 80 L45 100 Z M130 160 L210 160 L210 140 L150 140 L150 120 L200 120 L200 100 L150 100 L150 85 L210 85 L210 65 L130 65 L130 160 Z M220 160 L240 160 L240 65 L220 65 L220 160 Z M250 160 L270 160 L270 120 L300 160 L325 160 L290 115 L320 65 L295 65 L270 105 L270 65 L250 65 L250 160 Z M330 112 C330 140 350 160 370 160 C390 160 410 140 410 112 C410 84 390 64 370 64 C350 64 330 84 330 112 Z M350 112 C350 95 360 84 370 84 C380 84 390 95 390 112 C390 129 380 140 370 140 C360 140 350 129 350 112 Z" fill="#000000" transform="scale(0.8) translate(20, 30)"/>
        </svg>
      );
    
    // --- LOGO CODIR CORRIGÉ ---
    case 'CODIR':
      return (
        <svg viewBox="0 0 425 123" className={className} style={style} xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0 C4.95 0 9.9 0 15 0 C15.06805913 10.59732931 15.12297858 21.19451097 15.15543652 31.79201031 C15.17102286 36.71404395 15.19213107 41.63591895 15.22631836 46.55786133 C15.25916462 51.31708627 15.27690574 56.07615963 15.28463173 60.83548927 C15.29013025 62.64176631 15.30086609 64.44803603 15.31719017 66.25424767 C15.45884785 82.59361199 14.39139549 97.17509638 2.75 109.75 C-8.76609569 120.5051202 -22.37021709 123.4481919 -37.640625 123.2109375 C-56.18135706 122.56080793 -68.49093954 112.54509479 -81 100 C-80.20176505 96.12589973 -78.81801278 94.49334551 -75.9375 91.75 C-74.83728516 90.69039062 -74.83728516 90.69039062 -73.71484375 89.609375 C-73.14894531 89.07828125 -72.58304687 88.5471875 -72 88 C-68.71864587 89.41974704 -66.72913022 91.13578366 -64.3125 93.75 C-55.34784841 102.8803568 -46.37470032 107.03509047 -33.5625 107.4375 C-24.03815076 107.22606137 -15.05883212 104.67310359 -8 98 C-2.27847187 90.57747702 -0.49521761 82.88747532 -1.17578125 73.6015625 C-2.55388212 65.66704233 -6.72460482 59.30249566 -13.25 54.625 C-23.26190906 48.63454108 -32.58124486 47.99499201 -43.88671875 50.6875 C-55.60666864 54.43253392 -64.40872444 62.93909197 -72.84472656 71.56347656 C-74.25586113 73.00599146 -75.67758753 74.43735657 -77.1015625 75.8671875 C-81.62953853 80.44589715 -86.00911187 85.09073551 -90.20751953 89.97167969 C-93.91960136 94.17216672 -97.87228834 98.13997926 -101.8125 102.125 C-103.07030273 103.42630859 -103.07030273 103.42630859 -104.35351562 104.75390625 C-111.24622371 111.71548844 -118.45529357 117.12796348 -127.8125 120.3125 C-129.12154297 120.77076172 -129.12154297 120.77076172 -130.45703125 121.23828125 C-144.64300565 125.48753625 -160.57529468 123.5399543 -173.5546875 116.5703125 C-184.30579472 109.66624684 -191.88404924 100.42130711 -195 88 C-195.40722511 84.88112309 -195.4785362 81.83016176 -195.4375 78.6875 C-195.42920166 77.86008301 -195.42090332 77.03266602 -195.41235352 76.18017578 C-195.04246611 62.67731102 -189.904701 53.44966386 -180.25 44.25 C-168.73235406 34.61096039 -153.29155863 32.27497721 -138.71484375 33.2109375 C-124.81504166 35.15214833 -112.81490207 41.36918955 -104.1875 52.5625 C-100.05885808 58.81416395 -98.06464111 65.86414361 -96 73 C-95.61255615 72.58226318 -95.2251123 72.16452637 -94.82592773 71.73413086 C-93.03116619 69.80063347 -91.2343442 67.869062 -89.4375 65.9375 C-88.82841797 65.28072266 -88.21933594 64.62394531 -87.59179688 63.94726562 C-72.11372547 47.32267041 -56.95381704 34.45662268 -33.421875 33.046875 C-20.61434305 32.87142936 -10.5438133 36.97079113 0 44 C0 29.48 0 14.96 0 0 Z M-172 58 C-177.45601968 64.42018116 -180.52826725 71.25063717 -180.24609375 79.83203125 C-179.35979118 87.63993485 -176.67322372 94.46920031 -171 100 C-161.02197344 107.40942567 -151.24999304 108.96808456 -139 108 C-130.29616702 106.38401221 -123.76295651 102.75193845 -118 96 C-112.71773764 87.76847449 -111.86556818 79.28030968 -113.35546875 69.71875 C-115.63561917 62.2508748 -122.15722096 55.19332273 -128.9375 51.5 C-143.39625084 45.38172619 -160.36323185 47.09973617 -172 58 Z" fill="#7A868C" transform="translate(291,0)"/>
          <path d="M0 0 C7.21875 -0.04125 14.4375 -0.0825 21.875 -0.125 C24.13327637 -0.14320801 26.39155273 -0.16141602 28.71826172 -0.18017578 C30.53873457 -0.18602532 32.35921008 -0.19111978 34.1796875 -0.1953125 C35.10015869 -0.20554443 36.02062988 -0.21577637 36.96899414 -0.22631836 C46.06870881 -0.22872888 54.43625823 0.66088816 62 6 C67.61565242 11.87090935 70.96708784 17.85912103 71.01953125 26.05078125 C70.45848467 34.8899114 69.2831508 41.19435645 62.6875 47.375 C59.47949025 50.15579295 56.04766685 50.89110641 52 52 C54.38328523 56.07579073 56.7677551 60.15088512 59.15332031 64.2253418 C59.96451811 65.61121909 60.77539317 66.99728534 61.5859375 68.38354492 C62.7517532 70.37728978 63.91873185 72.37034987 65.0859375 74.36328125 C65.62823502 75.29156487 65.62823502 75.29156487 66.18148804 76.23860168 C67.72728698 78.87569413 69.30370092 81.45555138 71 84 C71 84.99 71 85.98 71 87 C65.2512287 88.50331065 59.55682507 89.65035885 54 87 C48.36776093 81.0244276 44.97268663 73.2384512 41.45117188 65.90234375 C40.13325725 63.26651449 38.70468235 60.81837824 37.109375 58.34375 C35 55 35 55 35 53 C28.4 53 21.8 53 15 53 C15 64.22 15 75.44 15 87 C10.05 87 5.1 87 0 87 C0 58.29 0 29.58 0 0 Z M15 15 C15 22.59 15 30.18 15 38 C19.44801928 38.06910041 23.89415558 38.12876017 28.34228516 38.16479492 C29.85341727 38.17982543 31.36450618 38.20025564 32.87548828 38.22631836 C35.05512187 38.26295689 37.23417575 38.27978338 39.4140625 38.29296875 C40.7232666 38.3086792 42.0324707 38.32438965 43.38134766 38.34057617 C48.25019259 37.88233581 51.62757415 36.50524126 54.9375 32.875 C56.47464836 28.71565737 56.26559389 25.23398683 55 21 C52.28449783 17.47718637 50.3429381 15.72583794 46 15 C43.61056705 14.91779474 41.21895153 14.89254528 38.828125 14.90234375 C37.8044986 14.90446617 37.8044986 14.90446617 36.76019287 14.90663147 C34.59008316 14.91220916 32.4200783 14.92475746 30.25 14.9375 C28.77474108 14.94251789 27.29948053 14.94708029 25.82421875 14.95117188 C22.21607337 14.96131852 18.60815345 14.98089801 15 15 Z" fill="#7A868C" transform="translate(353,35)"/>
          <path d="M0 0 C2.22320645 1.42683399 4.29312976 2.92519105 6.35546875 4.57421875 C7.28552734 5.31478516 7.28552734 5.31478516 8.234375 6.0703125 C9.62932629 7.21281321 10.99633542 8.38933328 12.35546875 9.57421875 C10.96501885 12.67863906 9.33975277 14.93986305 6.98046875 17.38671875 C6.39523438 18.01191406 5.81 18.63710938 5.20703125 19.28125 C3.35546875 20.57421875 3.35546875 20.57421875 1.390625 20.453125 C-0.93779203 19.44757062 -2.78565326 18.19765947 -4.83203125 16.69921875 C-14.28783697 10.33414565 -23.48483111 9.59181191 -34.64453125 10.57421875 C-42.81884498 12.32373934 -49.42391334 15.80200106 -54.14453125 22.796875 C-58.54797307 30.69054485 -59.61184234 38.38320594 -57.64453125 47.19921875 C-54.97182517 55.52618303 -50.57561252 60.88000965 -42.89453125 65.07421875 C-33.89545519 69.11370426 -25.03246395 69.64253858 -15.64453125 66.57421875 C-8.52896083 63.6763081 -2.67696707 60.27804084 2.734375 54.796875 C3.26933594 54.39339844 3.80429688 53.98992187 4.35546875 53.57421875 C7.72060267 54.69593006 8.72840048 55.77130513 11.04296875 58.38671875 C11.97689453 59.41732422 11.97689453 59.41732422 12.9296875 60.46875 C14.35546875 62.57421875 14.35546875 62.57421875 14.35546875 66.57421875 C12.45030857 68.43697473 10.67308261 69.94848523 8.54296875 71.51171875 C7.6619751 72.17204102 7.6619751 72.17204102 6.76318359 72.84570312 C-7.2262017 83.03489662 -21.75958579 84.88110307 -38.64453125 83.57421875 C-42.71999412 82.7807658 -46.00836004 81.54919499 -49.64453125 79.57421875 C-50.49917969 79.15011719 -51.35382812 78.72601563 -52.234375 78.2890625 C-62.62512197 72.67962166 -68.61755719 64.5490193 -72.64453125 53.57421875 C-75.78117543 42.69597925 -75.0333405 28.62027012 -70.3203125 18.37109375 C-63.09442557 6.3111053 -52.15711448 -1.15361027 -38.77026367 -4.95849609 C-26.32156799 -7.69500735 -11.17263416 -6.02365062 0 0 Z" fill="#7A868C" transform="translate(73.64453125,39.42578125)"/>
          <path d="M0 0 C4.95 0 9.9 0 15 0 C15 28.71 15 57.42 15 87 C10.05 87 5.1 87 0 87 C0 58.29 0 29.58 0 0 Z" fill="#7A868C" transform="translate(321,35)"/>
          <path d="M0 0 C4.95 0 9.9 0 15 0 C15 6.6 15 13.2 15 20 C10.05 20 5.1 20 0 20 C0 13.4 0 6.8 0 0 Z" fill="#159CD8" transform="translate(321,0)"/>
        </svg>
      );

    // --- LOGO ORUS CORRIGÉ ---
    case 'ORUS':
      return (
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 63 34" className={className}>
           <path d="M0 0 C0 0.99 0 1.98 0 3 C-0.66 3.33 -1.32 3.66 -2 4 C-2.65 6.02 -2.65 6.02 -3 8 C-0.52 8.49 -0.52 8.49 2 9 C1.85 10.43 1.71 11.87 1.56 13.31 C1.48 14.11 1.40 14.91 1.31 15.73 C1 18 1 18 0 21 C0.72 21.04 1.44 21.09 2.19 21.14 C7.41 21.55 12.09 22.01 17 24 C17 24.66 17 25.32 17 26 C16.02 25.85 15.05 25.71 14.04 25.56 C-5.79 22.87 -26.21 22.83 -46 26 C-46 25.34 -46 24.68 -46 24 C-41.19 21.59 -36.26 21.38 -31 21 C-30.76 20.28 -30.53 19.57 -30.28 18.84 C-27.04 11.67 -20.00 4.63 -13.16 0.72 C-8.87 -0.71 -4.45 -0.36 0 0 Z M-20 17 C-20.33 17.99 -20.66 18.98 -21 20 C-20.34 20 -19.68 20 -19 20 C-19.33 19.01 -19.66 18.02 -20 17 Z" fill="#0F2C88" transform="translate(46,0)"/>
           <path d="M13 0 C15 1 15 1 16 3 C17 6 17 9 17 12 C16 15 15 18 14 21 C13 22 13 22 12 23 C11 23 10 23 9 23 C8 23 7 23 6 23 C-1 22 -8 22 -15 22 C-15 16 -15 10 -15 4 C-10 4 -5 4 0 4 C3 4 6 4 9 4 C10 3 10 3 11 2 C11 1 11 1 11 0 Z" fill="#0F2C88" transform="translate(10,0)"/>
           <text x="20" y="24" fontFamily="Arial" fontWeight="bold" fontSize="24" fill="#0F2C88">RUS</text>
        </svg>
      );
      
    default:
      return <span className="text-xs font-bold text-slate-400">{brand}</span>;
  }
};

// --- DATA MOCKÉE (POUR TESTS SANS BACKEND) ---
const MOCK_LENSES = [
  { id: 1, name: "PROG HD 1.60 QUATTRO", brand: "CODIR", index_mat: "1.60", purchasePrice: 80, sellingPrice: 240, margin: 160 },
  { id: 2, name: "PROG MAX 1.67 CLEAN", brand: "CODIR", index_mat: "1.67", purchasePrice: 110, sellingPrice: 310, margin: 200 },
  { id: 3, name: "ECO 1.50 MISTRAL", brand: "CODIR", index_mat: "1.50", purchasePrice: 25, sellingPrice: 90, margin: 65 },
  { id: 4, name: "PREMIUM 1.74 ORUS", brand: "ORUS", index_mat: "1.74", purchasePrice: 150, sellingPrice: 420, margin: 270 },
  { id: 5, name: "HOYALUX ID 1.60", brand: "HOYA", index_mat: "1.60", purchasePrice: 95, sellingPrice: 280, margin: 185 },
  { id: 6, name: "SEIKO PRIME 1.67", brand: "SEIKO", index_mat: "1.67", purchasePrice: 130, sellingPrice: 350, margin: 220 },
  { id: 7, name: "MIYOSMART 1.58", brand: "HOYA", index_mat: "1.58", purchasePrice: 100, sellingPrice: 250, margin: 150 },
];

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
  const API_URL = "http://127.0.0.1:8000/lenses";

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

    // Essai de connexion au backend
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
        if (response.data.length > 0) {
          setLenses(response.data);
        } else {
          // Si pas de résultats, on garde la liste vide ou on pourrait montrer des suggestions
          setLenses([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur connexion:", err);
        // 🚨 FALLBACK : Si l'API est inaccessible (Network Error), on affiche des données de test
        // Cela permet de voir le design même si le serveur est éteint
        setLenses(MOCK_LENSES);
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
  const isMyopiaEligible = formData.type === 'UNIFOCAL' && (formData.brand === 'HOYA' || formData.brand === 'SEIKO');
  const isUvOptionVisible = ['CODIR', 'HOYA', 'SEIKO', 'ORUS'].includes(formData.brand);
  
  const uvOptionLabel = (formData.brand === 'CODIR' || formData.brand === 'ORUS') 
    ? 'OPTION SUV (UV 400)' 
    : 'OPTION IP+ (UV)';
    
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
        
        {/* === COLONNE GAUCHE === */}
        <aside className="w-[420px] bg-white border-r border-slate-200 flex flex-col overflow-y-auto z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="p-6 space-y-8">
            
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

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-500 tracking-wider flex items-center gap-2">
                <Tag className="w-5 h-5" /> MARQUE VERRIER
              </label>
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2 rounded-2xl">
                {brands.map(b => {
                  if (b.id === 'ORUS' && formData.network !== 'HORS_RESEAU') return null;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setFormData({...formData, brand: b.id})}
                      className={`py-3 px-2 rounded-xl transition-all duration-200 flex flex-col items-center gap-2 h-16 ${
                        formData.brand === b.id 
                        ? `bg-white ${currentTheme.text} shadow-md ring-2 ring-black/5 scale-[1.02]` 
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
                      }`}
                    >
                      <div className="h-8 w-full flex items-center justify-center mb-1">
                        <BrandLogo brand={b.id} className="h-full w-auto object-contain opacity-90" />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-500 tracking-wider flex items-center gap-2">
                <Glasses className="w-5 h-5" /> CORRECTION (OD)
              </label>
              <div className="grid grid-cols-2 gap-4">
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
            
            {/* Résumé des filtres */}
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
                          <div className="pt-2 flex flex-col h-full">
                             <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center mb-4 flex-1 flex flex-col justify-center items-center">
                               <span className="block text-xs font-bold text-green-600 mb-2 uppercase tracking-wider">PRIX CONSEILLÉ</span>
                               <span className="text-5xl font-bold text-green-600 tracking-tighter">
                                 {lens.sellingPrice} €
                               </span>
                             </div>
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

        {/* === MODALE SETTINGS === */}
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
                  {/* --- Identité --- */}
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

                  {/* --- Thème --- */}
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

                  {/* --- Limites Reste à Charge --- */}
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