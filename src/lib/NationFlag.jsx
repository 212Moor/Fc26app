import React from 'react';

// Le dictionnaire ultime : ID EA Sports -> Code Pays ISO FlagCDN
const NATION_MAP = {
  // EUROPE (UEFA)
  1: 'al', // Albanie
  2: 'ad', // Andorre
  3: 'am', // Arménie
  4: 'at', // Autriche
  5: 'az', // Azerbaïdjan
  6: 'by', // Biélorussie
  7: 'be', // Belgique
  8: 'ba', // Bosnie-Herzégovine
  9: 'bg', // Bulgarie
  10: 'hr', // Croatie
  11: 'cy', // Chypre
  12: 'cz', // République Tchèque
  13: 'dk', // Danemark
  14: 'gb-eng', // Angleterre (Code spécial FlagCDN)
  15: 'ee', // Estonie
  16: 'fo', // Îles Féroé
  17: 'fi', // Finlande
  18: 'fr', // France
  19: 'mk', // Macédoine du Nord
  20: 'ge', // Géorgie
  21: 'de', // Allemagne
  22: 'gr', // Grèce
  23: 'hu', // Hongrie
  24: 'is', // Islande
  25: 'ie', // Irlande
  26: 'il', // Israël
  27: 'it', // Italie
  28: 'lv', // Lettonie
  29: 'li', // Liechtenstein
  30: 'lt', // Lituanie
  31: 'lu', // Luxembourg
  32: 'mt', // Malte
  33: 'md', // Moldavie
  34: 'nl', // Pays-Bas
  35: 'gb-nir', // Irlande du Nord (Code spécial FlagCDN)
  36: 'no', // Norvège
  37: 'pl', // Pologne
  38: 'pt', // Portugal
  39: 'ro', // Roumanie
  40: 'ru', // Russie
  41: 'sm', // Saint-Marin
  42: 'gb-sct', // Écosse (Code spécial FlagCDN)
  43: 'sk', // Slovaquie
  44: 'si', // Slovénie
  45: 'es', // Espagne
  46: 'se', // Suède
  47: 'ch', // Suisse
  48: 'tr', // Turquie
  49: 'ua', // Ukraine
  50: 'gb-wls', // Pays de Galles (Code spécial FlagCDN)
  51: 'rs', // Serbie

  // AMÉRIQUE DU SUD (CONMEBOL)
  52: 'ar', // Argentine
  53: 'bo', // Bolivie
  54: 'br', // Brésil
  55: 'cl', // Chili
  56: 'co', // Colombie
  57: 'ec', // Équateur
  58: 'py', // Paraguay
  59: 'pe', // Pérou
  60: 'uy', // Uruguay
  61: 've', // Venezuela

  // AMÉRIQUE DU NORD ET CENTRALE (CONCACAF)
  70: 'ca', // Canada
  72: 'cr', // Costa Rica
  73: 'cu', // Cuba
  76: 'sv', // El Salvador
  81: 'hn', // Honduras
  82: 'jm', // Jamaïque
  83: 'mx', // Mexique
  87: 'pa', // Panama
  95: 'us', // États-Unis

  // AFRIQUE (CAF)
  97: 'dz', // Algérie
  98: 'ao', // Angola
  101: 'bf', // Burkina Faso
  103: 'cm', // Cameroun
  104: 'cv', // Cap-Vert
  108: 'ci', // Côte d'Ivoire
  110: 'cd', // RD Congo
  111: 'eg', // Égypte
  114: 'ga', // Gabon
  115: 'gm', // Gambie
  117: 'gh', // Ghana
  118: 'gn', // Guinée
  125: 'ml', // Mali
  129: 'ma', // Maroc
  132: 'ng', // Nigeria
  136: 'sn', // Sénégal
  141: 'za', // Afrique du Sud
  144: 'tg', // Togo
  145: 'tn', // Tunisie

  // ASIE & OCÉANIE (AFC / OFC)
  149: 'au', // Australie
  155: 'cn', // Chine
  159: 'in', // Inde
  161: 'ir', // Iran
  163: 'jp', // Japon
  166: 'kr', // Corée du Sud
  183: 'sa', // Arabie Saoudite
  214: 'nz', // Nouvelle-Zélande
};

export default function NationFlag({ nationalityId }) {
  const countryCode = NATION_MAP[nationalityId];
  
  if (!countryCode) {
    // Si jamais un jeune joueur est généré avec un pays très rare non listé (ex: Guam), 
    // l'API FlagCDN affichera par défaut le drapeau de l'ONU ("un" pour United Nations).
    return (
      <img 
        src="https://flagcdn.com/24x18/un.png" 
        alt="Drapeau Inconnu" 
        title={`ID EA Inconnu: ${nationalityId}`}
        style={{ borderRadius: '2px', marginRight: '8px', verticalAlign: 'middle', border: '1px solid #e0e0e0' }}
      />
    );
  }

  return (
    <img 
      src={`https://flagcdn.com/24x18/${countryCode}.png`} 
      alt="Drapeau" 
      title={`Pays ISO: ${countryCode.toUpperCase()} (ID EA: ${nationalityId})`}
      style={{ borderRadius: '2px', marginRight: '8px', verticalAlign: 'middle', border: '1px solid #ccc' }}
    />
  );
}