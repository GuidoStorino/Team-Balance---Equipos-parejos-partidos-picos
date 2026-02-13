import { useState, useEffect } from 'react';
import './MatchHistory.css';
import { getMediaFile, deleteMediaFiles } from '../mediaDB';

async function loadMatchMedia(mediaItems) {
  const result = {};
  for (const item of mediaItems) {
    try {
      const entry = await getMediaFile(item.id);
      if (entry?.blob) result[item.id] = URL.createObjectURL(entry.blob);
    } catch (err) { console.error('Could not load media', item.id, err); }
  }
  return result;
}

function MatchHistory({ setView, matches, deleteMatch, ownerPlayer, pendingMatches, deletePendingMatch, resumePendingMatch, t }) {
  const [expandedMatch, setExpandedMatch] = useState(null);
  const [activeTab, setActiveTab] = useState('history');
  const [blobUrls, setBlobUrls] = useState({});
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (!expandedMatch) return;
    const match = matches.find(m => m.id === expandedMatch);
    if (!match?.media?.length || blobUrls[expandedMatch]) return;
    loadMatchMedia(match.media).then(urls => setBlobUrls(prev => ({ ...prev, [expandedMatch]: urls })));
  }, [expandedMatch]);

  useEffect(() => {
    return () => {
      Object.values(blobUrls).forEach(urlMap => Object.values(urlMap).forEach(url => URL.revokeObjectURL(url)));
    };
  }, []);

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm(t.confirmDeleteMatch)) return;
    const match = matches.find(m => m.id === matchId);
    if (match?.media?.length) { try { await deleteMediaFiles(match.media.map(m => m.id)); } catch (e) {} }
    if (blobUrls[matchId]) {
      Object.values(blobUrls[matchId]).forEach(url => URL.revokeObjectURL(url));
      setBlobUrls(prev => { const n = { ...prev }; delete n[matchId]; return n; });
    }
    deleteMatch(matchId);
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formatTime = (iso) => new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  const getOwnerTeam = (match) => {
    if (!ownerPlayer) return null;
    if (match.team1.players.includes(ownerPlayer.name)) return 1;
    if (match.team2.players.includes(ownerPlayer.name)) return 2;
    return null;
  };

  const getOwnerResult = (match) => {
    const tn = getOwnerTeam(match);
    if (tn === null) return null;
    const g1 = match.team1.goals, g2 = match.team2.goals;
    if (g1 === g2) return 'drew';
    if (tn === 1) return g1 > g2 ? 'won' : 'lost';
    return g2 > g1 ? 'won' : 'lost';
  };

  const getOwnerResultLabel = (match) => {
    const r = getOwnerResult(match);
    if (r === 'won') return t.won;
    if (r === 'lost') return t.lost;
    if (r === 'drew') return t.drew;
    return null;
  };

  const ownerMatches = ownerPlayer ? matches.filter(m => getOwnerTeam(m) !== null) : matches;
  const ownerGoals = ownerPlayer
    ? matches.reduce((s, m) => s + (m.scorers || []).filter(sc => sc.player === ownerPlayer.name).length, 0)
    : matches.reduce((s, m) => s + m.team1.goals + m.team2.goals, 0);
  const ownerAssists = ownerPlayer
    ? matches.reduce((s, m) => s + (m.assists || []).filter(a => a.player === ownerPlayer.name).length, 0)
    : 0;
  const wins = ownerPlayer ? ownerMatches.filter(m => getOwnerResult(m) === 'won').length : 0;
  const draws = ownerPlayer ? ownerMatches.filter(m => getOwnerResult(m) === 'drew').length : 0;
  const losses = ownerPlayer ? ownerMatches.filter(m => getOwnerResult(m) === 'lost').length : 0;
  const consecutiveWins = (() => {
    if (!ownerPlayer) return 0;
    const sorted = [...ownerMatches].sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    for (const m of sorted) { if (getOwnerResult(m) === 'won') streak++; else break; }
    return streak;
  })();

  const sortedMatches = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date));
  const sortedPending = [...pendingMatches].sort((a, b) => new Date(b.date) - new Date(a.date));

  const LightboxModal = () => {
    if (!lightbox) return null;
    const url = blobUrls[lightbox.matchId]?.[lightbox.mediaId];
    if (!url) return null;
    return (
      <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
        <div className="lightbox-content" onClick={e => e.stopPropagation()}>
          <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
          {lightbox.type === 'image'
            ? <img src={url} alt="Highlight" className="lightbox-img" />
            : <video src={url} controls autoPlay className="lightbox-video" />}
        </div>
      </div>
    );
  };

  return (
    <div className="match-history">
      <LightboxModal />
      <div className="container">
        <div className="header-section">
          <button className="btn-back" onClick={() => setView('home')}>{t.back}</button>
          <h2>{t.historyTitle}</h2>
        </div>

        <div className="history-tabs">
          <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            📋 {t.playedMatches} ({matches.length})
          </button>
          <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
            ⏳ {t.pendingMatches}
            {pendingMatches.length > 0 && <span className="tab-badge">{pendingMatches.length}</span>}
          </button>
        </div>

        {activeTab === 'history' && (
          <>
            {matches.length === 0 ? (
              <div className="empty-history">
                <div className="empty-icon">📋</div>
                <h3>{t.noMatchesYet}</h3>
                <p>{t.noMatchesText}</p>
                <button className="btn-primary" onClick={() => setView('create-match')}>{t.buildMatchBtn}</button>
              </div>
            ) : (
              <>
                <div className="matches-stats">
                  <div className="stats-row stats-row-top">
                    <div className="stat-card">
                      <div className="stat-value">{ownerMatches.length}</div>
                      <div className="stat-label">{t.yourMatches}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{ownerGoals}</div>
                      <div className="stat-label">{t.yourGoals}</div>
                    </div>
                    {ownerPlayer && (
                      <>
                        <div className="stat-card">
                          <div className="stat-value">{ownerAssists}</div>
                          <div className="stat-label">{t.yourAssists}</div>
                        </div>
                        <div className={`stat-card ${consecutiveWins >= 3 ? 'stat-streak' : ''}`}>
                          <div className="stat-value">{consecutiveWins}{consecutiveWins >= 3 ? '🔥' : ''}</div>
                          <div className="stat-label">{t.consecutiveWins}</div>
                        </div>
                      </>
                    )}
                  </div>
                  {ownerPlayer && (
                    <div className="stats-row stats-row-bottom">
                      <div className="stat-card stat-win"><div className="stat-value">{wins}</div><div className="stat-label">{t.victories}</div></div>
                      <div className="stat-card stat-draw"><div className="stat-value">{draws}</div><div className="stat-label">{t.draws}</div></div>
                      <div className="stat-card stat-loss"><div className="stat-value">{losses}</div><div className="stat-label">{t.defeats}</div></div>
                    </div>
                  )}
                </div>

                <div className="matches-list">
                  {sortedMatches.map(match => {
                    const isExpanded = expandedMatch === match.id;
                    const result = getOwnerResult(match);
                    const resultLabel = getOwnerResultLabel(match);
                    const resultClass = result === 'won' ? 'result-win' : result === 'lost' ? 'result-loss' : result === 'drew' ? 'result-draw' : 'result-neutral';
                    const ownerTeamNum = getOwnerTeam(match);
                    const matchBlobUrls = blobUrls[match.id] || {};

                    return (
                      <div key={match.id} className={`match-card ${isExpanded ? 'expanded' : ''}`}>
                        <div className={`match-card-header ${resultClass}`} onClick={() => setExpandedMatch(isExpanded ? null : match.id)}>
                          <div className="match-header-top">
                            <div className="match-score-line">
                              <span className={`mh-team ${ownerTeamNum === 1 ? 'owner-team' : ''}`}>{match.team1.name}</span>
                              <span className="mh-goals">{match.team1.goals}</span>
                              <span className="mh-date-time">{formatDate(match.date)}<br/><small>{formatTime(match.date)}</small></span>
                              <span className="mh-goals">{match.team2.goals}</span>
                              <span className={`mh-team mh-team-right ${ownerTeamNum === 2 ? 'owner-team' : ''}`}>{match.team2.name}</span>
                            </div>
                          </div>
                          <div className="match-header-bottom">
                            {resultLabel && <span className={`result-badge ${resultClass}`}>{resultLabel}</span>}
                            <span className="expand-caret">{isExpanded ? '▲' : '▼'}</span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="match-details">
                            <div className="teams-details">
                              {[match.team1, match.team2].map((team, ti) => (
                                <div key={ti} className="team-detail">
                                  <h4>{team.name}</h4>
                                  <div className="players-list">
                                    {team.players.map(player => (
                                      <div key={player} className={`player-item ${ownerPlayer?.name === player ? 'owner-player-item' : ''}`}>
                                        {ownerPlayer?.name === player && '👑 '}{player}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {match.scorers?.length > 0 && (
                              <div className="scorers-details">
                                <h4>⚽ {t.goalsLabel}</h4>
                                <div className="scorers-grid">
                                  {match.scorers.map((s, i) => (
                                    <div key={i} className="scorer-detail">
                                      <span className="scorer-name">{s.player}</span>
                                      <span className="scorer-team">({s.team === '1' ? match.team1.name : match.team2.name})</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {match.assists?.length > 0 && (
                              <div className="scorers-details">
                                <h4>🎯 {t.assistsLabel}</h4>
                                <div className="scorers-grid">
                                  {match.assists.map((a, i) => (
                                    <div key={i} className="scorer-detail scorer-detail-assist">
                                      <span className="scorer-name">{a.player}</span>
                                      <span className="scorer-team">({a.team === '1' ? match.team1.name : match.team2.name})</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {(match.highlights || match.media?.length > 0) && (
                              <div className="highlights-details">
                                <h4>{t.highlights}</h4>
                                {match.highlights && <p>{match.highlights}</p>}
                                {match.media?.length > 0 && (
                                  <div className="media-gallery">
                                    {match.media.map(m => {
                                      const url = matchBlobUrls[m.id];
                                      return (
                                        <div key={m.id}
                                          className={`gallery-item ${url ? 'gallery-item-ready' : 'gallery-item-loading'}`}
                                          onClick={() => url && setLightbox({ matchId: match.id, mediaId: m.id, type: m.type })}
                                          title={url ? (m.type === 'image' ? t.viewPhoto : t.playVideo) : t.loading}>
                                          {!url && <div className="gallery-loading">⏳</div>}
                                          {url && m.type === 'image' && (<><img src={url} alt={m.name} /><div className="gallery-overlay">🔍</div></>)}
                                          {url && m.type === 'video' && (
                                            <><div className="video-thumb-gallery"><span className="video-play-icon">▶</span><span className="video-name">{m.name}</span></div><div className="gallery-overlay">▶</div></>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="match-actions">
                              <button className="btn-danger btn-small"
                                onClick={(e) => { e.stopPropagation(); handleDeleteMatch(match.id); }}>
                                {t.deleteMatch}
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

        {activeTab === 'pending' && (
          <>
            {sortedPending.length === 0 ? (
              <div className="empty-history">
                <div className="empty-icon">⏳</div>
                <h3>{t.noPendingMatches}</h3>
                <p>{t.noPendingText}</p>
              </div>
            ) : (
              <div className="pending-list">
                {sortedPending.map(pending => (
                  <div key={pending.id} className="pending-card">
                    <div className="pending-card-info">
                      <div className="pending-names">
                        <span className="pending-team-name">{pending.team1Name}</span>
                        <span className="pending-vs">{t.vs}</span>
                        <span className="pending-team-name">{pending.team2Name}</span>
                      </div>
                      <div className="pending-date">{formatDate(pending.date)} {formatTime(pending.date)}</div>
                      <div className="pending-players">{pending.team1.map(p => p.name).join(', ')} | {pending.team2.map(p => p.name).join(', ')}</div>
                    </div>
                    <div className="pending-card-actions">
                      <button className="btn-resume" onClick={() => resumePendingMatch(pending)}>{t.registerBtn}</button>
                      <button className="btn-danger btn-small"
                        onClick={() => { if (window.confirm(t.confirmDeletePending)) deletePendingMatch(pending.id); }}>
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
