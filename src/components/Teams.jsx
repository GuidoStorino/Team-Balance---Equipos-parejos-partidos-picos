import { useState, useEffect, useRef } from 'react';
import './Teams.css';
import { saveMediaFile, deleteMediaFile } from '../mediaDB';

const FUNNY_NAMES_ES = [
  'Los Vainillas','Heladeros del Conurbano','Menos Patada que una Pila',
  'Menos Centro que Don Bosco','Los Descosidos','Pelota Dividida FC',
  'Los Troncos United','Sporting de Tobillo','Inter de Patio','Real Descenso',
  'Atlético Cancha de Tierra','Los Sin Técnica','Deportivo Puntapié',
  'Racing de Esquina','Manchester sin City','FC Barreneta',
  'Juventus de Barrio','Los Mismos de Siempre','Gambeta al Banco',
  'Los Palo y a la Bolsa','Deportivo Tobillo Roto','Los Que Nunca Entrenan',
];
const FUNNY_NAMES_EN = [
  'The Rusty Boots','Offside United','The Sunday Warriors','No Touch FC',
  'Accidental Goals','The Sliding Tackles','Half-Time Legends','Ankle Busters',
  'The Backyard Ballers','One Touch Wonders','The Lazy Strikers','Mud United',
];
const FUNNY_NAMES_IT = [
  'I Piedi Storti','Niente Tecnica FC','Gli Inciampatori','Calci nel Nulla',
  'Il Tempo Scaduto','I Fuorigioco','Sporting Panchina','Real Ginocchia',
];
const FUNNY_NAMES_PT = [
  'Os Caneleiros','Pelé da Várzea FC','Chuteira Grossa','Os Sem Técnica',
  'Esportivo Tornozelo','Futebol de Boteco','Real Gambá','Os Zagueiros',
];

function getFunnyNames(lang) {
  if (lang === 'en') return FUNNY_NAMES_EN;
  if (lang === 'it') return FUNNY_NAMES_IT;
  if (lang === 'pt') return FUNNY_NAMES_PT;
  return FUNNY_NAMES_ES;
}

function Teams({ setView, teams, clearCurrentTeams, saveMatch, savePendingMatch, settings, t }) {
  const [team1Name, setTeam1Name] = useState('');
  const [team2Name, setTeam2Name] = useState('');
  const [showMatchResult, setShowMatchResult] = useState(false);
  const [team1Goals, setTeam1Goals] = useState(0);
  const [team2Goals, setTeam2Goals] = useState(0);
  const [scorers, setScorers] = useState([]);
  const [assists, setAssists] = useState([]);
  const [highlights, setHighlights] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [newScorerTeam, setNewScorerTeam] = useState('1');
  const [newScorerPlayer, setNewScorerPlayer] = useState('');
  const [newAssistTeam, setNewAssistTeam] = useState('1');
  const [newAssistPlayer, setNewAssistPlayer] = useState('');
  const [showPendingConfirm, setShowPendingConfirm] = useState(false);
  const fileInputRef = useRef(null);

  const team1Color = settings?.team1Color || '#ffd700';
  const team2Color = settings?.team2Color || '#ff6b35';
  const useFunnyNames = settings?.funnyNames !== false;
  const lang = settings?.lang || 'es';

  useEffect(() => {
    if (teams?.team1Name) {
      setTeam1Name(teams.team1Name);
      setTeam2Name(teams.team2Name);
    } else if (useFunnyNames) {
      const pool = getFunnyNames(lang);
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      setTeam1Name(shuffled[0]);
      setTeam2Name(shuffled[1] || shuffled[0] + ' 2');
    } else {
      setTeam1Name(t.team1);
      setTeam2Name(t.team2);
    }
  }, []);

  useEffect(() => {
    return () => { mediaFiles.forEach(m => { if (m.previewUrl) URL.revokeObjectURL(m.previewUrl); }); };
  }, [mediaFiles]);

  if (!teams) { setView('home'); return null; }

  const handleBack = () => setShowPendingConfirm(true);
  const handleSavePending = () => { savePendingMatch({ team1: teams.team1, team2: teams.team2, team1Name, team2Name }); setView('home'); };
  const handleDiscardAndBack = () => { clearCurrentTeams(); setView('create-match'); };
  const handlePlayedMatch = () => setShowMatchResult(true);

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

  const handleRemoveMedia = async (id) => {
    const item = mediaFiles.find(m => m.id === id);
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    try { await deleteMediaFile(id); } catch (err) { console.error(err); }
    setMediaFiles(prev => prev.filter(m => m.id !== id));
  };

  const handleSaveMatch = () => {
    const matchData = {
      id: Date.now(),
      pendingId: teams.pendingId || null,
      date: new Date().toISOString(),
      team1: { name: team1Name, players: teams.team1.map(p => p.name), goals: team1Goals },
      team2: { name: team2Name, players: teams.team2.map(p => p.name), goals: team2Goals },
      scorers, assists, highlights,
      media: mediaFiles.map(m => ({ id: m.id, name: m.name, type: m.type })),
    };
    saveMatch(matchData);
    setView('history');
  };

  const handleCancelMatch = () => { clearCurrentTeams(); setView('home'); };
  const handleAddScorer = () => { if (!newScorerPlayer) return; setScorers([...scorers, { team: newScorerTeam, player: newScorerPlayer }]); setNewScorerPlayer(''); };
  const handleRemoveScorer = (i) => setScorers(scorers.filter((_, idx) => idx !== i));
  const handleAddAssist = () => { if (!newAssistPlayer) return; setAssists([...assists, { team: newAssistTeam, player: newAssistPlayer }]); setNewAssistPlayer(''); };
  const handleRemoveAssist = (i) => setAssists(assists.filter((_, idx) => idx !== i));

  const distributeTeam = (teamPlayers) => {
    const size = teamPlayers.length;
    if (size <= 3) return [teamPlayers];
    if (size <= 5) { const m = Math.floor(size / 2); return [teamPlayers.slice(0, m), teamPlayers.slice(m)]; }
    const third = Math.floor(size / 3);
    return [teamPlayers.slice(0, third), teamPlayers.slice(third, third * 2), teamPlayers.slice(third * 2)];
  };

  const t1Rows = distributeTeam(teams.team1);
  const t2Rows = distributeTeam(teams.team2);

  if (showPendingConfirm) {
    return (
      <div className="teams-view">
        <div className="container">
          <div className="pending-confirm-box">
            <div className="pending-confirm-icon">⏳</div>
            <h3>{t.pendingConfirmTitle}</h3>
            <p>{t.pendingConfirmText}</p>
            <div className="pending-confirm-actions">
              <button className="btn-secondary" onClick={handleDiscardAndBack}>{t.discardBtn}</button>
              <button className="btn-pending" onClick={handleSavePending}>{t.savePendingBtn}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showMatchResult) {
    return (
      <div className="teams-view">
        <div className="container">
          <div className="header-section"><h2>{t.matchResultTitle}</h2></div>
          <div className="match-result-form">
            <div className="result-header">
              <h3>{t.howDidItGo} <span className="team-highlight">{team1Name}</span> {t.and} <span className="team-highlight">{team2Name}</span>?</h3>
            </div>
            <div className="score-input">
              <div className="team-score">
                <label>{team1Name}</label>
                <input type="number" min="0" value={team1Goals} onChange={(e) => setTeam1Goals(Number(e.target.value))} />
              </div>
              <div className="score-separator">-</div>
              <div className="team-score">
                <label>{team2Name}</label>
                <input type="number" min="0" value={team2Goals} onChange={(e) => setTeam2Goals(Number(e.target.value))} />
              </div>
            </div>

            {/* Scorers */}
            <div className="scorers-section">
              <h4>{t.scorers}</h4>
              <div className="add-scorer">
                <select value={newScorerTeam} onChange={(e) => setNewScorerTeam(e.target.value)}>
                  <option value="1">{team1Name}</option>
                  <option value="2">{team2Name}</option>
                </select>
                <select value={newScorerPlayer} onChange={(e) => setNewScorerPlayer(e.target.value)}>
                  <option value="">{t.selectPlayer}</option>
                  {(newScorerTeam === '1' ? teams.team1 : teams.team2).map(p => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
                <button className="btn-primary btn-small" onClick={handleAddScorer}>{t.addGoal}</button>
              </div>
              {scorers.length > 0 && (
                <div className="scorers-list">
                  {scorers.map((s, i) => (
                    <div key={i} className="scorer-item">
                      <span>⚽ {s.player} ({s.team === '1' ? team1Name : team2Name})</span>
                      <button className="btn-remove" onClick={() => handleRemoveScorer(i)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assists */}
            <div className="scorers-section">
              <h4>{t.assists}</h4>
              <div className="add-scorer">
                <select value={newAssistTeam} onChange={(e) => setNewAssistTeam(e.target.value)}>
                  <option value="1">{team1Name}</option>
                  <option value="2">{team2Name}</option>
                </select>
                <select value={newAssistPlayer} onChange={(e) => setNewAssistPlayer(e.target.value)}>
                  <option value="">{t.selectPlayer}</option>
                  {(newAssistTeam === '1' ? teams.team1 : teams.team2).map(p => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
                <button className="btn-primary btn-small" onClick={handleAddAssist}>{t.addAssist}</button>
              </div>
              {assists.length > 0 && (
                <div className="scorers-list">
                  {assists.map((a, i) => (
                    <div key={i} className="scorer-item assist-item">
                      <span>🎯 {a.player} ({a.team === '1' ? team1Name : team2Name})</span>
                      <button className="btn-remove" onClick={() => handleRemoveAssist(i)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Highlights + media */}
            <div className="highlights-section">
              <h4>{t.highlights}</h4>
              <textarea value={highlights} onChange={(e) => setHighlights(e.target.value)}
                placeholder={t.highlightsPlaceholder} rows="3" />
              <div className="media-upload">
                <button className="btn-media-upload" onClick={() => fileInputRef.current?.click()}>
                  {t.addMedia}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
              </div>
              {mediaFiles.length > 0 && (
                <div className="media-preview">
                  {mediaFiles.map(m => (
                    <div key={m.id} className="media-item">
                      {m.type === 'image' ? <img src={m.previewUrl} alt={m.name} />
                        : <div className="video-thumb">🎬<span>{m.name}</span></div>}
                      <button className="btn-remove-media" onClick={() => handleRemoveMedia(m.id)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="result-actions">
              <button className="btn-secondary" onClick={handleCancelMatch}>{t.cancelMatch}</button>
              <button className="btn-primary" onClick={handleSaveMatch}>{t.saveMatch}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="teams-view">
      <div className="container">
        <div className="header-section">
          <button className="btn-back" onClick={handleBack}>{t.back}</button>
          <h2>{t.teamsFormed}</h2>
        </div>
        <div className="team-names-section">
          <div className="team-name-input team-1-name">
            <label>{t.team1}</label>
            <input type="text" value={team1Name} onChange={(e) => setTeam1Name(e.target.value)}
              style={{ borderBottomColor: team1Color }} />
          </div>
          <div className="vs-separator">VS</div>
          <div className="team-name-input team-2-name">
            <label>{t.team2}</label>
            <input type="text" value={team2Name} onChange={(e) => setTeam2Name(e.target.value)}
              style={{ borderBottomColor: team2Color }} />
          </div>
        </div>

        <div className="field-container">
          <div className="field">
            <div className="team-side team-side-1">
              <div className="team-label" style={{ color: team1Color }}>{team1Name}</div>
              {t1Rows.map((row, ri) => (
                <div key={ri} className="player-row">
                  {row.map(player => (
                    <div key={player.name} className={`player-marker ${player.isOwner ? 'player-owner' : ''}`}>
                      <div className="player-icon" style={{ borderColor: team1Color }}>
                        {player.isOwner ? '👑' : '⚽'}
                      </div>
                      <span className="player-name-tag">{player.name}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="center-line"><div className="center-circle"></div></div>
            <div className="team-side team-side-2">
              {[...t2Rows].reverse().map((row, ri) => (
                <div key={ri} className="player-row">
                  {row.map(player => (
                    <div key={player.name} className={`player-marker player-t2 ${player.isOwner ? 'player-owner' : ''}`}>
                      <div className="player-icon" style={{ borderColor: team2Color }}>
                        {player.isOwner ? '👑' : '⚽'}
                      </div>
                      <span className="player-name-tag">{player.name}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div className="team-label" style={{ color: team2Color }}>{team2Name}</div>
            </div>
          </div>
        </div>

        <div className="actions-section">
          <button className="btn-danger" onClick={handleCancelMatch}>{t.cancelMatch}</button>
          <button className="btn-primary" onClick={handlePlayedMatch}>{t.matchPlayed}</button>
        </div>
      </div>
    </div>
  );
}

export default Teams;
