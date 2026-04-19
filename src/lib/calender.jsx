import React from 'react';

export default function Calendar({ calendarData, myTeamId, teamsById }) {
  if (!calendarData || calendarData.length === 0) {
    return <p>Aucun match trouvé dans le calendrier.</p>;
  }

  // On filtre pour ne garder que les matchs de NOTRE équipe
  const myMatches = calendarData.filter(
    match => match.hometeamid === myTeamId || match.awayteamid === myTeamId
  );

  // Formater la date EA (YYYYMMDD vers JJ/MM/AAAA)
  const formatDate = (eaDate) => {
    if (!eaDate) return "Date inconnue";
    const str = String(eaDate);
    if (str.length !== 8) return str;
    return `${str.slice(6, 8)}/${str.slice(4, 6)}/${str.slice(0, 4)}`;
  };

  return (
    <div className="calendar-container" style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
      <h2>📅 Calendrier de la Saison</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {myMatches.map((match, index) => {
          const isHome = match.hometeamid === myTeamId;
          const opponentId = isHome ? match.awayteamid : match.hometeamid;
          const opponentName = teamsById[opponentId]?.teamname || `Équipe #${opponentId}`;

          return (
            <li key={index} style={{ padding: '10px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 'bold', color: '#555' }}>
                {formatDate(match.date || match.fixturedate)}
              </span>
              <span>
                {isHome ? '🏠 Domicile' : '✈️ Extérieur'} vs <strong>{opponentName}</strong>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}