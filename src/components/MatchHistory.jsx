import { useState } from 'react';
import './MatchHistory.css';

function MatchHistory({ setView, matches, deleteMatch, ownerPlayer, pendingMatches, deletePendingMatch, resumePendingMatch }) {
  const [expandedMatch, setExpandedMatch] = useState(null);
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'pending'

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  // Find which team the owner played in
  const getOwnerTeam = (match) => {
    if (!ownerPlayer) return null;
    const name = ownerPlayer.name;
    if (match.team1.players.includes(name)) return 1;
    if (match.team2.players.includes(name)) return 2;
    return null;
  };

  const getOwnerResult = (match) => {
    const teamNum = getOwnerTeam(match);
    if (teamNum === null) return null;
    const g1 = match.team1.goals;
    const g2 = match.team2.goals;
    if (g1 === g2) return 'EMPATADO';
    if (teamNum === 1) return g1 > g2 ? 'GANADO' : 'PERDIDO';
    return g2 > g1 ? 'GANADO' : 'PERDIDO';
  };

  // Stats based on owner
  const ownerMatches = ownerPlayer
    ? matches.filter(m => getOwnerTeam(m) !== null)
    : matches;

  const ownerGoals = ownerPlayer
    ? matches.reduce((sum, m) => {
        return sum + m.scorers.filter(s => s.player === ownerPlayer.name).length;
      }, 0)
    : matches.reduce((sum, m) => sum + m.team1.goals + m.team2.goals, 0);

  const wins = ownerPlayer
    ? ownerMatches.filter(m => getOwnerResult(m) === 'GANADO').length
    : 0;
  const draws = ownerPlayer
    ? ownerMatches.filter(m => getOwnerResult(m) === 'EMPATADO').length
    : 0;
  const losses = ownerPlayer
    ? ownerMatches.filter(m => getOwnerResult(m) === 'PERDIDO').length
    : 0;

  const sortedMatches = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date));
  const sortedPending = [...pendingMatches].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="match-history">
      <div className="container">
        <div className="header-section">
          <button className="btn-back" onClick={() => setView('home')}>← Volver</button>
          <h2>Historial</h2>
        </div>

        {/* Tabs */}
        <div className="history-tabs">
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📋 Partidos Jugados ({matches.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            ⏳ Pendientes
            {pendingMatches.length > 0 && <span className="tab-badge">{pendingMatches.length}</span>}
          </button>
        </div>

        {/* PLAYED MATCHES TAB */}
        {activeTab === 'history' && (
          <>
            {matches.length === 0 ? (
              <div className="empty-history">
                <div className="empty-icon">📋</div>
                <h3>No hay partidos jugados</h3>
                <p>Los partidos que guardes aparecerán aquí</p>
                <button className="btn-primary" onClick={() => setView('create-match')}>Armar un Partido</button>
              </div>
            ) : (
              <>
                <div className="matches-stats">
                  <div className="stat-card">
                    <div className="stat-value">{ownerMatches.length}</div>
                    <div className="stat-label">{ownerPlayer ? 'Tus partidos' : 'Partidos'}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{ownerGoals}</div>
                    <div className="stat-label">{ownerPlayer ? 'Tus goles' : 'Goles totales'}</div>
                  </div>
                  {ownerPlayer ? (
                    <>
                      <div className="stat-card stat-win">
                        <div className="stat-value">{wins}</div>
                        <div className="stat-label">Victorias</div>
                      </div>
                      <div className="stat-card stat-draw">
                        <div className="stat-value">{draws}</div>
                        <div className="stat-label">Empates</div>
                      </div>
                      <div className="stat-card stat-loss">
                        <div className="stat-value">{losses}</div>
                        <div className="stat-label">Derrotas</div>
                      </div>
                    </>
                  ) : (
                    <div className="stat-card">
                      <div className="stat-value">{matches.filter(m => m.team1.goals === m.team2.goals).length}</div>
                      <div className="stat-label">Empates</div>
                    </div>
                  )}
                </div>

                <div className="matches-list">
                  {sortedMatches.map(match => {
                    const isExpanded = expandedMatch === match.id;
                    const ownerResult = getOwnerResult(match);
                    const ownerTeamNum = getOwnerTeam(match);
                    const resultClass = ownerResult === 'GANADO' ? 'result-win'
                      : ownerResult === 'PERDIDO' ? 'result-loss'
                      : ownerResult === 'EMPATADO' ? 'result-draw' : 'result-neutral';

                    return (
                      <div key={match.id} className={`match-card ${isExpanded ? 'expanded' : ''}`}>
                        {/* HEADER BLOCK - all main info here */}
                        <div
                          className={`match-card-header ${resultClass}`}
                          onClick={() => setExpandedMatch(isExpanded ? null : match.id)}
                        >
                          <div className="match-header-top">
                            {/* Score line */}
                            <div className="match-score-line">
                              <span className={`mh-team ${ownerTeamNum === 1 ? 'owner-team' : ''}`}>{match.team1.name}</span>
                              <span className="mh-goals">{match.team1.goals}</span>
                              <span className="mh-date-time">
                                {formatDate(match.date)}<br/>
                                <small>{formatTime(match.date)}</small>
                              </span>
                              <span className="mh-goals">{match.team2.goals}</span>
                              <span className={`mh-team mh-team-right ${ownerTeamNum === 2 ? 'owner-team' : ''}`}>{match.team2.name}</span>
                            </div>
                          </div>
                          <div className="match-header-bottom">
                            {ownerResult && (
                              <span className={`result-badge ${resultClass}`}>{ownerResult}</span>
                            )}
                            <span className="expand-caret">{isExpanded ? '▲' : '▼'}</span>
                          </div>
                        </div>

                        {/* EXPANDABLE DETAILS */}
                        {isExpanded && (
                          <div className="match-details">
                            <div className="teams-details">
                              <div className="team-detail">
                                <h4>{match.team1.name}</h4>
                                <div className="players-list">
                                  {match.team1.players.map(player => (
                                    <div key={player} className={`player-item ${ownerPlayer && player === ownerPlayer.name ? 'owner-player-item' : ''}`}>
                                      {ownerPlayer && player === ownerPlayer.name && '👑 '}{player}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="team-detail">
                                <h4>{match.team2.name}</h4>
                                <div className="players-list">
                                  {match.team2.players.map(player => (
                                    <div key={player} className={`player-item ${ownerPlayer && player === ownerPlayer.name ? 'owner-player-item' : ''}`}>
                                      {ownerPlayer && player === ownerPlayer.name && '👑 '}{player}
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
                                      <span className="scorer-team">({scorer.team === '1' ? match.team1.name : match.team2.name})</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {(match.highlights || (match.media && match.media.length > 0)) && (
                              <div className="highlights-details">
                                <h4>📝 Highlights</h4>
                                {match.highlights && <p>{match.highlights}</p>}
                                {match.media && match.media.length > 0 && (
                                  <div className="media-gallery">
                                    {match.media.map(m => (
                                      <div key={m.id} className="gallery-item">
                                        {m.type === 'image' ? (
                                          <img src={m.url} alt={m.name} />
                                        ) : (
                                          <div className="video-item">🎬 {m.name}</div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="match-actions">
                              <button
                                className="btn-danger btn-small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('¿Eliminar este partido?')) deleteMatch(match.id);
                                }}
                              >
                                🗑️ Eliminar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* PENDING MATCHES TAB */}
        {activeTab === 'pending' && (
          <>
            {sortedPending.length === 0 ? (
              <div className="empty-history">
                <div className="empty-icon">⏳</div>
                <h3>No hay partidos pendientes</h3>
                <p>Los partidos guardados como pendientes aparecerán aquí</p>
              </div>
            ) : (
              <div className="pending-list">
                {sortedPending.map(pending => (
                  <div key={pending.id} className="pending-card">
                    <div className="pending-card-info">
                      <div className="pending-names">
                        <span className="pending-team-name">{pending.team1Name}</span>
                        <span className="pending-vs">vs</span>
                        <span className="pending-team-name">{pending.team2Name}</span>
                      </div>
                      <div className="pending-date">{formatDate(pending.date)} {formatTime(pending.date)}</div>
                      <div className="pending-players">
                        {pending.team1.map(p => p.name).join(', ')} | {pending.team2.map(p => p.name).join(', ')}
                      </div>
                    </div>
                    <div className="pending-card-actions">
                      <button className="btn-resume" onClick={() => resumePendingMatch(pending)}>
                        ▶ Registrar
                      </button>
                      <button
                        className="btn-danger btn-small"
                        onClick={() => { if (window.confirm('¿Eliminar este partido pendiente?')) deletePendingMatch(pending.id); }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default MatchHistory;
