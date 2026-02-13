import { useState, useEffect, useCallback } from 'react';
import './MatchHistory.css';
import { getMediaFile, deleteMediaFiles } from '../mediaDB';

// Loads blob URLs for all media items in a match.
// Returns a map: { [mediaId]: blobUrl }
async function loadMatchMedia(mediaItems) {
  const result = {};
  for (const item of mediaItems) {
    try {
      const entry = await getMediaFile(item.id);
      if (entry && entry.blob) {
        result[item.id] = URL.createObjectURL(entry.blob);
      }
    } catch (err) {
      console.error('Could not load media', item.id, err);
    }
  }
  return result;
}

function MatchHistory({ setView, matches, deleteMatch, ownerPlayer, pendingMatches, deletePendingMatch, resumePendingMatch }) {
  const [expandedMatch, setExpandedMatch] = useState(null);
  const [activeTab, setActiveTab] = useState('history');
  // blobUrls: { [matchId]: { [mediaId]: blobUrl } }
  const [blobUrls, setBlobUrls] = useState({});
  // Lightbox state
  const [lightbox, setLightbox] = useState(null); // { matchId, mediaId, type }

  // When a match is expanded, load its media from IndexedDB
  useEffect(() => {
    if (!expandedMatch) return;
    const match = matches.find(m => m.id === expandedMatch);
    if (!match || !match.media || match.media.length === 0) return;
    // Don't reload if already loaded
    if (blobUrls[expandedMatch]) return;

    loadMatchMedia(match.media).then(urls => {
      setBlobUrls(prev => ({ ...prev, [expandedMatch]: urls }));
    });
  }, [expandedMatch]);

  // Revoke all blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(blobUrls).forEach(urlMap => {
        Object.values(urlMap).forEach(url => URL.revokeObjectURL(url));
      });
    };
  }, []);

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm('¿Eliminar este partido?')) return;
    const match = matches.find(m => m.id === matchId);
    // Clean up IndexedDB entries
    if (match?.media?.length) {
      await deleteMediaFiles(match.media.map(m => m.id));
    }
    // Revoke any loaded blob URLs for this match
    if (blobUrls[matchId]) {
      Object.values(blobUrls[matchId]).forEach(url => URL.revokeObjectURL(url));
      setBlobUrls(prev => { const n = { ...prev }; delete n[matchId]; return n; });
    }
    deleteMatch(matchId);
  };

  const toggleExpand = (matchId) => {
    setExpandedMatch(prev => prev === matchId ? null : matchId);
  };

  const openLightbox = (matchId, mediaId, type) => {
    setLightbox({ matchId, mediaId, type });
  };

  const closeLightbox = () => setLightbox(null);

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

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

  const ownerMatches = ownerPlayer ? matches.filter(m => getOwnerTeam(m) !== null) : matches;

  const ownerGoals = ownerPlayer
    ? matches.reduce((sum, m) => sum + (m.scorers || []).filter(s => s.player === ownerPlayer.name).length, 0)
    : matches.reduce((sum, m) => sum + m.team1.goals + m.team2.goals, 0);

  const ownerAssists = ownerPlayer
    ? matches.reduce((sum, m) => sum + (m.assists || []).filter(a => a.player === ownerPlayer.name).length, 0)
    : 0;

  const wins = ownerPlayer ? ownerMatches.filter(m => getOwnerResult(m) === 'GANADO').length : 0;
  const draws = ownerPlayer ? ownerMatches.filter(m => getOwnerResult(m) === 'EMPATADO').length : 0;
  const losses = ownerPlayer ? ownerMatches.filter(m => getOwnerResult(m) === 'PERDIDO').length : 0;

  const consecutiveWins = (() => {
    if (!ownerPlayer) return 0;
    const sorted = [...ownerMatches].sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    for (const m of sorted) {
      if (getOwnerResult(m) === 'GANADO') streak++;
      else break;
    }
    return streak;
  })();

  const sortedMatches = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date));
  const sortedPending = [...pendingMatches].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Lightbox modal
  const LightboxModal = () => {
    if (!lightbox) return null;
    const url = blobUrls[lightbox.matchId]?.[lightbox.mediaId];
    if (!url) return null;
    return (
      <div className="lightbox-overlay" onClick={closeLightbox}>
        <div className="lightbox-content" onClick={e => e.stopPropagation()}>
          <button className="lightbox-close" onClick={closeLightbox}>✕</button>
          {lightbox.type === 'image' ? (
            <img src={url} alt="Highlight" className="lightbox-img" />
          ) : (
            <video
              src={url}
              controls
              autoPlay
              className="lightbox-video"
              onClick={e => e.stopPropagation()}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="match-history">
      <LightboxModal />

      <div className="container">
        <div className="header-section">
          <button className="btn-back" onClick={() => setView('home')}>← Volver</button>
          <h2>Historial</h2>
        </div>

        {/* Tabs */}
        <div className="history-tabs">
          <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            📋 Partidos Jugados ({matches.length})
          </button>
          <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
            ⏳ Pendientes
            {pendingMatches.length > 0 && <span className="tab-badge">{pendingMatches.length}</span>}
          </button>
        </div>

        {/* PLAYED MATCHES */}
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
                  <div className="stats-row stats-row-top">
                    <div className="stat-card">
                      <div className="stat-value">{ownerMatches.length}</div>
                      <div className="stat-label">{ownerPlayer ? 'Tus partidos' : 'Partidos'}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{ownerGoals}</div>
                      <div className="stat-label">{ownerPlayer ? 'Tus goles' : 'Goles totales'}</div>
                    </div>
                    {ownerPlayer && (
                      <>
                        <div className="stat-card">
                          <div className="stat-value">{ownerAssists}</div>
                          <div className="stat-label">Tus asistencias</div>
                        </div>
                        <div className={`stat-card ${consecutiveWins >= 3 ? 'stat-streak' : ''}`}>
                          <div className="stat-value">{consecutiveWins}{consecutiveWins >= 3 ? '🔥' : ''}</div>
                          <div className="stat-label">Victorias consecutivas</div>
                        </div>
                      </>
                    )}
                  </div>
                  {ownerPlayer && (
                    <div className="stats-row stats-row-bottom">
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
                    const matchBlobUrls = blobUrls[match.id] || {};

                    return (
                      <div key={match.id} className={`match-card ${isExpanded ? 'expanded' : ''}`}>
                        <div className={`match-card-header ${resultClass}`} onClick={() => toggleExpand(match.id)}>
                          <div className="match-header-top">
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
                            {ownerResult && <span className={`result-badge ${resultClass}`}>{ownerResult}</span>}
                            <span className="expand-caret">{isExpanded ? '▲' : '▼'}</span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="match-details">
                            {/* Teams */}
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

                            {/* Scorers */}
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

                            {/* Assists */}
                            {match.assists && match.assists.length > 0 && (
                              <div className="scorers-details">
                                <h4>🎯 Asistencias</h4>
                                <div className="scorers-grid">
                                  {match.assists.map((assist, index) => (
                                    <div key={index} className="scorer-detail scorer-detail-assist">
                                      <span className="scorer-name">{assist.player}</span>
                                      <span className="scorer-team">({assist.team === '1' ? match.team1.name : match.team2.name})</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Highlights + Media */}
                            {(match.highlights || (match.media && match.media.length > 0)) && (
                              <div className="highlights-details">
                                <h4>📝 Highlights</h4>
                                {match.highlights && <p>{match.highlights}</p>}
                                {match.media && match.media.length > 0 && (
                                  <div className="media-gallery">
                                    {match.media.map(m => {
                                      const url = matchBlobUrls[m.id];
                                      return (
                                        <div
                                          key={m.id}
                                          className={`gallery-item ${url ? 'gallery-item-ready' : 'gallery-item-loading'}`}
                                          onClick={() => url && openLightbox(match.id, m.id, m.type)}
                                          title={url ? (m.type === 'image' ? 'Ver foto' : 'Reproducir video') : 'Cargando...'}
                                        >
                                          {!url && <div className="gallery-loading">⏳</div>}
                                          {url && m.type === 'image' && (
                                            <>
                                              <img src={url} alt={m.name} />
                                              <div className="gallery-overlay">🔍</div>
                                            </>
                                          )}
                                          {url && m.type === 'video' && (
                                            <>
                                              <div className="video-thumb-gallery">
                                                <span className="video-play-icon">▶</span>
                                                <span className="video-name">{m.name}</span>
                                              </div>
                                              <div className="gallery-overlay">▶</div>
                                            </>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="match-actions">
                              <button
                                className="btn-danger btn-small"
                                onClick={(e) => { e.stopPropagation(); handleDeleteMatch(match.id); }}
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

        {/* PENDING MATCHES */}
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
                      <button className="btn-resume" onClick={() => resumePendingMatch(pending)}>▶ Registrar</button>
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
