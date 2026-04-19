import React from 'react';

export default function Calendar({ calendarData }) {
  if (!calendarData || calendarData.length === 0) {
    return <p style={{ padding: '20px' }}>Aucune donnée de calendrier trouvée.</p>;
  }

  // On récupère la configuration de la saison (la première ligne de la table)
  const season = calendarData[0];

  // Petite fonction pour transformer "701" en "1er Juillet"
  const formatMonthDay = (num) => {
    if (!num) return "Inconnu";
    const str = String(num).padStart(3, '0'); // Ajoute un 0 au début si besoin (ex: 131 -> 0131 pour janvier)
    let monthNum, dayNum;
    
    if (str.length === 4) {
        monthNum = parseInt(str.substring(0, 2), 10);
        dayNum = parseInt(str.substring(2, 4), 10);
    } else {
        monthNum = parseInt(str.substring(0, 1), 10);
        dayNum = parseInt(str.substring(1, 3), 10);
    }

    const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const monthName = months[monthNum - 1] || "Mois inconnu";
    return `${dayNum === 1 ? '1er' : dayNum} ${monthName}`;
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="card-title">📅 Agenda de la Saison</div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
        
        {/* Mercato d'Été */}
        <div style={{ background: '#1c2128', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #58a6ff' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#e6edf3' }}>☀️ Mercato d'Été</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8b949e', fontSize: '13px' }}>
            <span>Ouverture : <strong style={{ color: '#3fb950' }}>{formatMonthDay(season.transferwindowstart1)}</strong></span>
            <span>Fermeture : <strong style={{ color: '#f85149' }}>{formatMonthDay(season.transferwindowend1)}</strong></span>
          </div>
        </div>

        {/* Mercato d'Hiver */}
        <div style={{ background: '#1c2128', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #58a6ff' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#e6edf3' }}>❄️ Mercato d'Hiver</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8b949e', fontSize: '13px' }}>
            <span>Ouverture : <strong style={{ color: '#3fb950' }}>{formatMonthDay(season.transferwindowstart2)}</strong></span>
            <span>Fermeture : <strong style={{ color: '#f85149' }}>{formatMonthDay(season.transferwindowend2)}</strong></span>
          </div>
        </div>

        {/* Objectifs et Configuration */}
        <div style={{ background: '#1c2128', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #d29922' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#e6edf3' }}>📋 Dates Administratives</h4>
          <ul style={{ listStyleType: 'none', padding: 0, margin: 0, color: '#8b949e', fontSize: '13px', lineHeight: '1.8' }}>
            <li>Évaluation des objectifs du CA : <strong>Annuelle</strong></li>
            <li>Identifiant date actuelle : <strong>{season.currdate}</strong></li>
          </ul>
        </div>

      </div>
    </div>
  );
}