import { useState, useEffect, useRef } from 'react';
import './MatchHistory.css';
import { getMediaFile, deleteMediaFiles, saveMediaFile } from '../mediaDB';

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

// ── Add Past Match form ─────────────────────────────────────────
function AddPastMatch({ onSave, onCancel, t, players }) {
  const today = new Date().toISOString().slice(0, 10);
  const [team1Name, setTeam1Name] = useState('');
  const [team2Name, setTeam2Name] = useState('');
  const [team1Goals, setTeam1Goals] = useState(0);
  const [team2Goals, setTeam2Goals] = useState(0);
  const [team1Players, setTeam1Players] = useState([]);
  const [team2Players, setTeam2Players] = useState([]);
  const [matchDate, setMatchDate] = useState(today);
  const [highlights, setHighlights] = useState('');
  const [scorers, setScorers] = useState('');   // free-text goleadores
  const [mediaFiles, setMediaFiles] = useState([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Player autocomplete states
  const [team1Input, setTeam1Input] = useState('');
  const [team2Input, setTeam2Input] = useState('');
  const [team1Suggestions, setTeam1Suggestions] = useState([]);
  const [team2Suggestions, setTeam2Suggestions] = useState([]);

  const handleTeam1InputChange = (value) => {
    setTeam1Input(value);
    if (value.length >= 2) {
      const filtered = players
        .filter(p => p.name.toLowerCase().includes(value.toLowerCase()))
        .filter(p => !team1Players.includes(p.name))
        .slice(0, 5);
      setTeam1Suggestions(filtered);
    } else {
      setTeam1Suggestions([]);
    }
  };

  const handleTeam2InputChange = (value) => {
    setTeam2Input(value);
    if (value.length >= 2) {
      const filtered = players
        .filter(p => p.name.toLowerCase().includes(value.toLowerCase()))
        .filter(p => !team2Players.includes(p.name))
        .slice(0, 5);
      setTeam2Suggestions(filtered);
    } else {
      setTeam2Suggestions([]);
    }
  };

  const addPlayerToTeam1 = (playerName) => {
    setTeam1Players([...team1Players, playerName]);
    setTeam1Input('');
    setTeam1Suggestions([]);
  };

  const addPlayerToTeam2 = (playerName) => {
    setTeam2Players([...team2Players, playerName]);
    setTeam2Input('');
    setTeam2Suggestions([]);
  };

  const removePlayerFromTeam1 = (playerName) => {
    setTeam1Players(team1Players.filter(p => p !== playerName));
  };

  const removePlayerFromTeam2 = (playerName) => {
    setTeam2Players(team2Players.filter(p => p !== playerName));
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    const newMedia = [];
    for (const file of files) {
      const id = `media_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      const previewUrl = URL.createObjectURL(file);
      try { await saveMediaFile(id, file, file.name, type); } catch (err) { console.error(err); }
      newMedia.push({ id, name: file.name, type, previewUrl });
    }
    setMediaFiles(prev => [...prev, ...newMedia]);
    e.target.value = '';
  };

  const handleRemoveMedia = (id) => {
    const item = mediaFiles.find(m => m.id === id);
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    setMediaFiles(prev => prev.filter(m => m.id !== id));
  };

  const handleSave = () => {
    if (!team1Name.trim() || !team2Name.trim()) {
      setError('Ingresá los nombres de ambos equipos'); return;
    }
    const matchData = {
      id: Date.now(),
      date: new Date(matchDate + 'T12:00:00').toISOString(),
      team1: { name: team1Name.trim(), players: team1Players, goals: Number(team1Goals) },
      team2: { name: team2Name.trim(), players: team2Players, goals: Number(team2Goals) },
      scorers: scorers.trim()
        ? scorers.split(',').map(s => ({ team: '?', player: s.trim() })).filter(s => s.player)
        : [],
      highlights,
      media: mediaFiles.map(m => ({ id: m.id, name: m.name, type: m.type })),
      manualEntry: true,
    };
    onSave(matchData);
  };

  return (
    <div className="add-past-form">
      <h3>➕ {t.addPastMatch}</h3>
      {error && <div className="error-message-large">{error}</div>}

      <div className="past-form-date">
        <label>{t.matchDate}</label>
        <input type="date" value={matchDate} max={today}
          onChange={e => setMatchDate(e.target.value)} />
      </div>

      <div className="past-form-teams">
        <div className="past-team-block">
          <label>{t.team1}</label>
          <input type="text" value={team1Name} onChange={e => setTeam1Name(e.target.value)}
            placeholder="Ej: Los Cracks" />
          <div className="past-goals-row">
            <label>{t.goals}</label>
            <div className="goals-counter">
              <button onClick={() => setTeam1Goals(Math.max(0, team1Goals - 1))}>−</button>
              <span>{team1Goals}</span>
              <button onClick={() => setTeam1Goals(team1Goals + 1)}>+</button>
            </div>
          </div>

          {/* Player autocomplete */}
          <div className="player-autocomplete-section">
            <label>{t.addPlayers || 'Jugadores'}</label>
            <div className="autocomplete-wrapper">
              <input
                type="text"
                value={team1Input}
                onChange={(e) => handleTeam1InputChange(e.target.value)}
                placeholder={t.typePlayerName || 'Escribe el nombre...'}
                className="autocomplete-input"
              />
              {team1Suggestions.length > 0 && (
                <div className="autocomplete-dropdown">
                  {team1Suggestions.map(player => (
                    <div
                      key={player.name}
                      className="autocomplete-item"
                      onClick={() => addPlayerToTeam1(player.name)}
                    >
                      {player.isOwner && '👑 '}{player.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {team1Players.length > 0 && (
              <div className="selected-players-list">
                {team1Players.map(name => (
                  <div key={name} className="selected-player-chip">
                    <span>{name}</span>
                    <button onClick={() => removePlayerFromTeam1(name)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="past-vs">VS</div>

        <div className="past-team-block">
          <label>{t.team2}</label>
          <input type="text" value={team2Name} onChange={e => setTeam2Name(e.target.value)}
            placeholder="Ej: Los Troncos" />
          <div className="past-goals-row">
            <label>{t.goals}</label>
            <div className="goals-counter">
              <button onClick={() => setTeam2Goals(Math.max(0, team2Goals - 1))}>−</button>
              <span>{team2Goals}</span>
              <button onClick={() => setTeam2Goals(team2Goals + 1)}>+</button>
            </div>
          </div>

          {/* Player autocomplete */}
          <div className="player-autocomplete-section">
            <label>{t.addPlayers || 'Jugadores'}</label>
            <div className="autocomplete-wrapper">
              <input
                type="text"
                value={team2Input}
                onChange={(e) => handleTeam2InputChange(e.target.value)}
                placeholder={t.typePlayerName || 'Escribe el nombre...'}
                className="autocomplete-input"
              />
              {team2Suggestions.length > 0 && (
                <div className="autocomplete-dropdown">
                  {team2Suggestions.map(player => (
                    <div
                      key={player.name}
                      className="autocomplete-item"
                      onClick={() => addPlayerToTeam2(player.name)}
                    >
                      {player.isOwner && '👑 '}{player.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {team2Players.length > 0 && (
              <div className="selected-players-list">
                {team2Players.map(name => (
                  <div key={name} className="selected-player-chip">
                    <span>{name}</span>
                    <button onClick={() => removePlayerFromTeam2(name)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="past-form-field">
        <label>⚽ {t.goalsLabel} <span className="field-hint">(separados por coma)</span></label>
        <input type="text" value={scorers} onChange={e => setScorers(e.target.value)}
          placeholder="Ej: Messi, Suárez, Rodrigo..." />
      </div>

      <div className="past-form-field">
        <label>📝 {t.highlights}</label>
        <textarea value={highlights} onChange={e => setHighlights(e.target.value)}
          placeholder={t.highlightsPlaceholder} rows="3" />
      </div>

      <div className="past-form-field">
        <label>📷 {t.addMedia}</label>
        <button className="btn-media-upload" onClick={() => fileInputRef.current?.click()}>
          {t.addMedia}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple
          onChange={handleFileSelect} style={{ display: 'none' }} />
        {mediaFiles.length > 0 && (
          <div className="media-preview">
            {mediaFiles.map(m => (
              <div key={m.id} className="media-item">
                {m.type === 'image'
                  ? <img src={m.previewUrl} alt={m.name} />
                  : <div className="video-thumb">🎬<span>{m.name}</span></div>}
                <button className="btn-remove-media" onClick={() => handleRemoveMedia(m.id)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="past-form-actions">
        <button className="btn-secondary" onClick={onCancel}>{t.cancel}</button>
        <button className="btn-primary" onClick={handleSave}>{t.saveMatch}</button>
      </div>
    </div>
  );
}

// ── Main MatchHistory ───────────────────────────────────────────
function MatchHistory({ setView, matches, deleteMatch, saveMatch, ownerPlayer, players, pendingMatches, deletePendingMatch, resumePendingMatch, t }) {
  const [expandedMatch, setExpandedMatch] = useState(null);
  const [activeTab, setActiveTab] = useState('history');
  const [blobUrls, setBlobUrls] = useState({});
  const [lightbox, setLightbox] = useState(null);
  const [showStreakPopup, setShowStreakPopup] = useState(false);
  const [streakShownFor, setStreakShownFor] = useState(null);
  const [filterPlayer, setFilterPlayer] = useState('all');
  const [filterResult, setFilterResult] = useState('all'); // 'all' | 'won' | 'drew' | 'lost'
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Load media blobs when a match is expanded
  useEffect(() => {
    if (!expandedMatch) return;
    const match = matches.find(m => m.id === expandedMatch);
    if (!match?.media?.length || blobUrls[expandedMatch]) return;
    loadMatchMedia(match.media).then(urls => setBlobUrls(prev => ({ ...prev, [expandedMatch]: urls })));
  }, [expandedMatch]);

  useEffect(() => {
    return () => {
      Object.values(blobUrls).forEach(urlMap =>
        Object.values(urlMap).forEach(url => URL.revokeObjectURL(url)));
    };
  }, []);

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

  const getOwnerResultLabel = (r) => {
    if (r === 'won') return t.won;
    if (r === 'lost') return t.lost;
    if (r === 'drew') return t.drew;
    return null;
  };

  const ownerMatches = ownerPlayer ? matches.filter(m => getOwnerTeam(m) !== null) : matches;
  const ownerGoals = ownerPlayer
    ? matches.reduce((s, m) => s + (m.scorers || []).filter(sc => sc.player === ownerPlayer.name).length, 0)
    : matches.reduce((s, m) => s + m.team1.goals + m.team2.goals, 0);
  const wins  = ownerPlayer ? ownerMatches.filter(m => getOwnerResult(m) === 'won').length  : 0;
  const draws = ownerPlayer ? ownerMatches.filter(m => getOwnerResult(m) === 'drew').length : 0;
  const losses= ownerPlayer ? ownerMatches.filter(m => getOwnerResult(m) === 'lost').length : 0;

  const consecutiveWins = (() => {
    if (!ownerPlayer) return 0;
    const sorted = [...ownerMatches].sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    for (const m of sorted) { if (getOwnerResult(m) === 'won') streak++; else break; }
    return streak;
  })();

  // Show 7-win popup exactly once when streak hits 7
  useEffect(() => {
    if (consecutiveWins >= 7 && streakShownFor !== 7) {
      setShowStreakPopup(true);
      setStreakShownFor(7);
    }
  }, [consecutiveWins]);

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm(t.confirmDeleteMatch)) return;
    const match = matches.find(m => m.id === matchId);
    if (match?.media?.length) {
      try { await deleteMediaFiles(match.media.map(m => m.id)); } catch (e) {}
    }
    if (blobUrls[matchId]) {
      Object.values(blobUrls[matchId]).forEach(url => URL.revokeObjectURL(url));
      setBlobUrls(prev => { const n = { ...prev }; delete n[matchId]; return n; });
    }
    deleteMatch(matchId);
  };

  const handleSavePastMatch = (matchData) => {
    saveMatch(matchData);
    setActiveTab('history');
  };

  const sortedMatches = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date));
  const sortedPending = [...pendingMatches].sort((a, b) => new Date(b.date) - new Date(a.date));

  // ── Rivalry detection ──
  const detectRivalries = () => {
    const rivalryMap = {};
    
    matches.forEach(match => {
      if (match.manualEntry) return; // Skip manual entries
      
      const team1IsSaved = match.team1?.isSaved || false;
      const team2IsSaved = match.team2?.isSaved || false;
      
      let rivalryKey;
      
      // CASO 3: Al menos uno es equipo guardado → detecta por nombre
      if (team1IsSaved || team2IsSaved) {
        const name1 = match.team1.name;
        const name2 = match.team2.name;
        rivalryKey = [name1, name2].sort().join(' VS ');
      } 
      // CASO 2: Ninguno es equipo guardado → detecta por jugadores
      else {
        const team1Key = [...match.team1.players].sort().join(',');
        const team2Key = [...match.team2.players].sort().join(',');
        rivalryKey = [team1Key, team2Key].sort().join(' VS ');
      }
      
      if (!rivalryMap[rivalryKey]) {
        rivalryMap[rivalryKey] = {
          team1Players: match.team1.players,
          team2Players: match.team2.players,
          team1Name: match.team1.name,
          team2Name: match.team2.name,
          matches: [],
          team1Wins: 0,
          team2Wins: 0,
          draws: 0,
          isSavedTeamRivalry: team1IsSaved || team2IsSaved,
        };
      }
      
      rivalryMap[rivalryKey].matches.push(match);
      if (match.team1.goals > match.team2.goals) rivalryMap[rivalryKey].team1Wins++;
      else if (match.team2.goals > match.team1.goals) rivalryMap[rivalryKey].team2Wins++;
      else rivalryMap[rivalryKey].draws++;
    });
    
    // Filter only rivalries with 2+ matches
    return Object.values(rivalryMap).filter(r => r.matches.length >= 2);
  };

  const rivalries = detectRivalries();

  // ── Filter matches ──
  const getFilteredMatches = () => {
    let filtered = sortedMatches;
    
    // Filter by player
    if (filterPlayer !== 'all') {
      filtered = filtered.filter(m => 
        m.team1.players.includes(filterPlayer) || m.team2.players.includes(filterPlayer)
      );
    }
    
    // Filter by result
    if (filterResult !== 'all' && ownerPlayer) {
      filtered = filtered.filter(m => {
        const result = getOwnerResult(m);
        return result === filterResult;
      });
    }
    
    // Filter by date range
    if (filterDateFrom) {
      filtered = filtered.filter(m => new Date(m.date) >= new Date(filterDateFrom));
    }
    if (filterDateTo) {
      filtered = filtered.filter(m => new Date(m.date) <= new Date(filterDateTo + 'T23:59:59'));
    }
    
    return filtered;
  };

  const filteredMatches = getFilteredMatches();

  // ── Lightbox ──
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

      {/* 7-win streak popup */}
      {showStreakPopup && (
        <div className="streak-overlay" onClick={() => setShowStreakPopup(false)}>
          <div className="streak-popup" onClick={e => e.stopPropagation()}>
            <div className="streak-trophies">🏆🏆🏆</div>
            <h3>¡Llegaste a las 7 victorias consecutivas!</h3>
            <p>Casi como ganar un mundial, ¿no?</p>
            <button className="btn-primary streak-btn" onClick={() => setShowStreakPopup(false)}>
              ¡Obvio! 🙌
            </button>
          </div>
        </div>
      )}

      <div className="container">
        <div className="header-section">
          <button className="btn-back" onClick={() => setView('home')}>{t.back}</button>
          <h2>{t.historyTitle}</h2>
        </div>

        {/* Tabs */}
        <div className="history-tabs">
          <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            📋 {t.playedMatches} ({matches.length})
          </button>
          <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
            ⏳ {t.pendingMatches}
            {pendingMatches.length > 0 && <span className="tab-badge">{pendingMatches.length}</span>}
          </button>
          <button className={`tab-btn ${activeTab === 'rivalries' ? 'active' : ''}`} onClick={() => setActiveTab('rivalries')}>
            🔥 {t.rivalries || 'Rivalidades'} ({rivalries.length})
          </button>
          <button className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}>
            ➕ {t.addPastMatch}
          </button>
        </div>

        {/* ── PLAYED MATCHES ── */}
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
                {/* Stats */}
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
                    <div className={`stat-card ${consecutiveWins >= 3 ? 'stat-streak' : ''}`}>
                      <div className="stat-value">{consecutiveWins}{consecutiveWins >= 3 ? ' 🔥' : ''}</div>
                      <div className="stat-label">{t.consecutiveWins}</div>
                    </div>
                  </div>
                  {ownerPlayer && (
                    <div className="stats-row stats-row-bottom">
                      <div className="stat-card stat-win"><div className="stat-value">{wins}</div><div className="stat-label">{t.victories}</div></div>
                      <div className="stat-card stat-draw"><div className="stat-value">{draws}</div><div className="stat-label">{t.draws}</div></div>
                      <div className="stat-card stat-loss"><div className="stat-value">{losses}</div><div className="stat-label">{t.defeats}</div></div>
                    </div>
                  )}
                </div>

                {/* Filters */}
                <div className="filters-panel">
                  <div className="filter-group">
                    <label>{t.filterByPlayer || 'Filtrar por jugador'}:</label>
                    <select value={filterPlayer} onChange={e => setFilterPlayer(e.target.value)}>
                      <option value="all">{t.allPlayers || 'Todos'}</option>
                      {[...new Set(matches.flatMap(m => [...m.team1.players, ...m.team2.players]))].sort().map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {ownerPlayer && (
                    <div className="filter-group">
                      <label>{t.filterByResult || 'Resultado'}:</label>
                      <select value={filterResult} onChange={e => setFilterResult(e.target.value)}>
                        <option value="all">{t.allResults || 'Todos'}</option>
                        <option value="won">{t.won}</option>
                        <option value="drew">{t.drew}</option>
                        <option value="lost">{t.lost}</option>
                      </select>
                    </div>
                  )}
                  
                  <div className="filter-group">
                    <label>{t.filterByDate || 'Desde'}:</label>
                    <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
                  </div>
                  
                  <div className="filter-group">
                    <label>{t.filterByDateTo || 'Hasta'}:</label>
                    <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
                  </div>
                  
                  {(filterPlayer !== 'all' || filterResult !== 'all' || filterDateFrom || filterDateTo) && (
                    <button className="btn-clear-filters" onClick={() => {
                      setFilterPlayer('all'); setFilterResult('all'); setFilterDateFrom(''); setFilterDateTo('');
                    }}>
                      ✕ {t.clearFilters || 'Limpiar'}
                    </button>
                  )}
                </div>

                {/* Match cards */}
                <div className="matches-list">
                  {filteredMatches.map(match => {
                    const isExpanded = expandedMatch === match.id;
                    const result = getOwnerResult(match);
                    const resultLabel = getOwnerResultLabel(result);
                    const resultClass = result === 'won' ? 'result-win' : result === 'lost' ? 'result-loss' : result === 'drew' ? 'result-draw' : 'result-neutral';
                    const ownerTeamNum = getOwnerTeam(match);
                    const matchBlobUrls = blobUrls[match.id] || {};

                    return (
                      <div key={match.id} className={`match-card ${isExpanded ? 'expanded' : ''}`}>
                        <div className={`match-card-header ${resultClass}`}
                          onClick={() => setExpandedMatch(isExpanded ? null : match.id)}>
                          <div className="match-header-top">
                            <div className="match-score-line">
                              <span className={`mh-team ${ownerTeamNum === 1 ? 'owner-team' : ''}`}>{match.team1.name}</span>
                              <span className="mh-goals">{match.team1.goals}</span>
                              <span className="mh-date-time">
                                {formatDate(match.date)}<br/><small>{formatTime(match.date)}</small>
                              </span>
                              <span className="mh-goals">{match.team2.goals}</span>
                              <span className={`mh-team mh-team-right ${ownerTeamNum === 2 ? 'owner-team' : ''}`}>{match.team2.name}</span>
                            </div>
                          </div>
                          <div className="match-header-bottom">
                            {resultLabel && <span className={`result-badge ${resultClass}`}>{resultLabel}</span>}
                            {match.manualEntry && <span className="manual-badge">✏️</span>}
                            <span className="expand-caret">{isExpanded ? '▲' : '▼'}</span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="match-details">
                            {/* Team rosters (only if players were recorded) */}
                            {(match.team1.players.length > 0 || match.team2.players.length > 0) && (
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
                            )}

                            {/* Scorers */}
                            {match.scorers?.length > 0 && (
                              <div className="scorers-details">
                                <h4>⚽ {t.goalsLabel}</h4>
                                <div className="scorers-grid">
                                  {match.scorers.map((s, i) => (
                                    <div key={i} className="scorer-detail">
                                      <span className="scorer-name">{s.player}</span>
                                      {s.team !== '?' && (
                                        <span className="scorer-team">({s.team === '1' ? match.team1.name : match.team2.name})</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Highlights + Media */}
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
                                onClick={e => { e.stopPropagation(); handleDeleteMatch(match.id); }}>
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

        {/* ── PENDING ── */}
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

        {/* ── RIVALRIES ── */}
        {activeTab === 'rivalries' && (
          <>
            {rivalries.length === 0 ? (
              <div className="empty-history">
                <div className="empty-icon">🔥</div>
                <h3>{t.noRivalries || 'No hay rivalidades detectadas'}</h3>
                <p>{t.noRivalriesText || 'Las rivalidades se detectan cuando los mismos jugadores se enfrentan 2+ veces'}</p>
              </div>
            ) : (
              <div className="rivalries-list">
                {rivalries.map((rivalry, idx) => (
                  <div key={idx} className="rivalry-card">
                    <div className="rivalry-header">
                      <div className="rivalry-team">
                        <div className="rivalry-team-name">
                          {rivalry.team1Name}
                          {rivalry.isSavedTeamRivalry && <span className="saved-team-badge">🏆</span>}
                        </div>
                        <div className="rivalry-players-mini">
                          {rivalry.team1Players.slice(0, 3).join(', ')}
                          {rivalry.team1Players.length > 3 && ` +${rivalry.team1Players.length - 3}`}
                        </div>
                      </div>
                      <div className="rivalry-vs">VS</div>
                      <div className="rivalry-team">
                        <div className="rivalry-team-name">
                          {rivalry.team2Name}
                          {rivalry.isSavedTeamRivalry && <span className="saved-team-badge">🏆</span>}
                        </div>
                        <div className="rivalry-players-mini">
                          {rivalry.team2Players.slice(0, 3).join(', ')}
                          {rivalry.team2Players.length > 3 && ` +${rivalry.team2Players.length - 3}`}
                        </div>
                      </div>
                    </div>
                    
                    <div className="rivalry-stats">
                      <div className="rivalry-record">
                        <span className="record-label">{t.headToHead || 'Historial'}:</span>
                        <div className="record-numbers">
                          <span className="record-win">{rivalry.team1Wins}V</span>
                          <span className="record-draw">{rivalry.draws}E</span>
                          <span className="record-loss">{rivalry.team2Wins}V</span>
                        </div>
                      </div>
                      <div className="rivalry-matches-count">
                        {rivalry.matches.length} {t.playedMatches || 'partidos'}
                      </div>
                    </div>
                    
                    <div className="rivalry-recent">
                      <div className="rivalry-recent-label">{t.recentMatches || 'Últimos partidos'}:</div>
                      <div className="rivalry-recent-results">
                        {rivalry.matches.slice(-5).reverse().map((match, mi) => {
                          const winner = match.team1.goals > match.team2.goals ? 1 
                            : match.team2.goals > match.team1.goals ? 2 : 0;
                          return (
                            <span key={mi} className={`result-dot ${winner === 1 ? 'win-t1' : winner === 2 ? 'win-t2' : 'draw'}`}
                              title={`${match.team1.goals}-${match.team2.goals}`}>
                              {match.team1.goals}-{match.team2.goals}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── ADD PAST MATCH ── */}
        {activeTab === 'add' && (
          <AddPastMatch
            onSave={handleSavePastMatch}
            onCancel={() => setActiveTab('history')}
            players={players}
            t={t}
          />
        )}
      </div>
    </div>
  );
}

export default MatchHistory;
