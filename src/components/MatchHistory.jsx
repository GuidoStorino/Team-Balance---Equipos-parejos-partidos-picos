import { useState } from 'react';
import './MatchHistory.css';

function MatchHistory({ setView, matches, deleteMatch }) {
  const [expandedMatch, setExpandedMatch] = useState(null);

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleMatchDetails = (matchId) => {
    setExpandedMatch(expandedMatch === matchId ? null : matchId);
  };

  const getMatchResult = (match) => {
    if (match.team1.goals > match.team2.goals) {
      return { winner: match.team1.name, result: 'Ganó' };
    } else if (match.team2.goals > match.team1.goals) {
      return { winner: match.team2.name, result: 'Ganó' };
    } else {
      return { winner: null, result: 'Empate' };
    }
  };

  const sortedMatches = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="match-history">
      <div className="container">
        <div className="header-section">
          <button className="btn-back" onClick={() => setView('home')}>
            ← Volver
          </button>
          <h2>Historial de Partidos</h2>
        </div>

        {matches.length === 0 ? (
          <div className="empty-history">
            <div className="empty-icon">📋</div>
            <h3>No hay partidos jugados</h3>
            <p>Los partidos que guardes aparecerán aquí</p>
            <button className="btn-primary" onClick={() => setView('create-match')}>
              Armar un Partido
            </button>
          </div>
        ) : (
          <div className="matches-stats">
            <div className="stat-card">
              <div className="stat-value">{matches.length}</div>
              <div className="stat-label">Partidos Jugados</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {matches.reduce((sum, m) => sum + m.team1.goals + m.team2.goals, 0)}
              </div>
              <div className="stat-label">Goles Totales</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {matches.filter(m => m.team1.goals === m.team2.goals).length}
              </div>
              <div className="stat-label">Empates</div>
            </div>
          </div>
        )}

        {sortedMatches.length > 0 && (
          <div className="matches-list">
            {sortedMatches.map(match => {
              const matchInfo = getMatchResult(match);
              const isExpanded = expandedMatch === match.id;

              return (
                <div key={match.id} className={`match-card ${isExpanded ? 'expanded' : ''}`}>
                  <div className="match-card-header" onClick={() => toggleMatchDetails(match.id)}>
                    <div className="match-date">
                      <div className="date-day">{formatDate(match.date)}</div>
                      <div className="date-time">{formatTime(match.date)}</div>
                    </div>

                    <div className="match-teams">
                      <div className={`team-result ${matchInfo.winner === match.team1.name ? 'winner' : ''}`}>
                        <span className="team-name">{match.team1.name}</span>
                        <span className="team-goals">{match.team1.goals}</span>
                      </div>
                      <div className="result-separator">-</div>
                      <div className={`team-result ${matchInfo.winner === match.team2.name ? 'winner' : ''}`}>
                        <span className="team-goals">{match.team2.goals}</span>
                        <span className="team-name">{match.team2.name}</span>
                      </div>
                    </div>

                    <div className="match-result-badge">
                      {matchInfo.result}
                    </div>

                    <button className="expand-btn">
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="match-details">
                      <div className="teams-details">
                        <div className="team-detail">
                          <h4>{match.team1.name}</h4>
                          <div className="players-list">
                            {match.team1.players.map(player => (
                              <div key={player} className="player-item">
                                {player}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="team-detail">
                          <h4>{match.team2.name}</h4>
                          <div className="players-list">
                            {match.team2.players.map(player => (
                              <div key={player} className="player-item">
                                {player}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {match.scorers && match.scorers.length > 0 && (
                        <div className="scorers-details">
                          <h4>⚽ Goleadores</h4>
                          <div className="scorers-grid">
                            {match.scorers.map((scorer, index) => (
                              <div key={index} className="scorer-detail">
                                <span className="scorer-name">{scorer.player}</span>
                                <span className="scorer-team">
                                  ({scorer.team === '1' ? match.team1.name : match.team2.name})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {match.highlights && (
                        <div className="highlights-details">
                          <h4>📝 Highlights</h4>
                          <p>{match.highlights}</p>
                        </div>
                      )}

                      <div className="match-actions">
                        <button 
                          className="btn-danger btn-small"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('¿Estás seguro de eliminar este partido?')) {
                              deleteMatch(match.id);
                            }
                          }}
                        >
                          🗑️ Eliminar Partido
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MatchHistory;
