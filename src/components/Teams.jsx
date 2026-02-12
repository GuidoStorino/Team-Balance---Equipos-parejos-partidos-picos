import { useState, useEffect, useRef } from 'react';
import './Teams.css';

const funnyTeamNames = [
  'Los Vainillas', 'Heladeros del Conurbano', 'Menos Patada que una Pila',
  'Menos Centro que Don Bosco', 'Los Descosidos', 'Pelota Dividida FC',
  'Los Troncos United', 'Sporting de Tobillo', 'Inter de Patio', 'Real Descenso',
  'Atlético Cancha de Tierra', 'Los Sin Técnica', 'Deportivo Puntapié',
  'Racing de Esquina', 'Manchester sin City', 'FC Barreneta',
  'Juventus de Barrio', 'Los Mismos de Siempre', 'Gambeta al Banco',
  'Los Palo y a la Bolsa', 'Deportivo Tobillo Roto', 'Los Que Nunca Entrenan',
  'Cañito en los Pies FC', 'Los Caminantes', 'Sin Técnica pero con Corazón'
];

function Teams({ setView, teams, clearCurrentTeams, saveMatch, savePendingMatch }) {
  const [team1Name, setTeam1Name] = useState('');
  const [team2Name, setTeam2Name] = useState('');
  const [showMatchResult, setShowMatchResult] = useState(false);
  const [team1Goals, setTeam1Goals] = useState(0);
  const [team2Goals, setTeam2Goals] = useState(0);
  const [scorers, setScorers] = useState([]);
  const [highlights, setHighlights] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [newScorerTeam, setNewScorerTeam] = useState('1');
  const [newScorerPlayer, setNewScorerPlayer] = useState('');
  const [showPendingConfirm, setShowPendingConfirm] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (teams && teams.team1Name) {
      setTeam1Name(teams.team1Name);
      setTeam2Name(teams.team2Name);
    } else {
      const shuffled = [...funnyTeamNames].sort(() => 0.5 - Math.random());
      setTeam1Name(shuffled[0]);
      setTeam2Name(shuffled[1]);
    }
  }, []);

  if (!teams) { setView('home'); return null; }

  const handleBack = () => setShowPendingConfirm(true);

  const handleSavePending = () => {
    savePendingMatch({ team1: teams.team1, team2: teams.team2, team1Name, team2Name });
    setView('home');
  };

  const handleDiscardAndBack = () => {
    clearCurrentTeams();
    setView('create-match');
  };

  const handlePlayedMatch = () => setShowMatchResult(true);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newMedia = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'video',
      url: URL.createObjectURL(file),
      file,
    }));
    setMediaFiles([...mediaFiles, ...newMedia]);
  };

  const handleRemoveMedia = (id) => {
    setMediaFiles(mediaFiles.filter(m => m.id !== id));
  };

  const handleSaveMatch = () => {
    const matchData = {
      id: Date.now(),
      pendingId: teams.pendingId || null,
      date: new Date().toISOString(),
      team1: { name: team1Name, players: teams.team1.map(p => p.name), goals: team1Goals },
      team2: { name: team2Name, players: teams.team2.map(p => p.name), goals: team2Goals },
      scorers,
      highlights,
      media: mediaFiles.map(m => ({ id: m.id, name: m.name, type: m.type, url: m.url })),
    };
    saveMatch(matchData);
    setView('history');
  };

  const handleCancelMatch = () => { clearCurrentTeams(); setView('home'); };

  const handleAddScorer = () => {
    if (!newScorerPlayer) return;
    setScorers([...scorers, { team: newScorerTeam, player: newScorerPlayer }]);
    setNewScorerPlayer('');
  };

  const handleRemoveScorer = (index) => setScorers(scorers.filter((_, i) => i !== index));

  // Distribute players across field rows
  const distributeTeam = (teamPlayers) => {
    const gk = teamPlayers.find(p => {
      const allGk = [
        ...(teams.team1 || []).filter((_, i) => i === 0 && teams.team1.length > 0),
      ];
      return false; // We rely on first player being GK if they were marked
    });
    // Simple even distribution for display
    const size = teamPlayers.length;
    if (size <= 3) return { rows: [teamPlayers] };
    if (size <= 5) {
      const mid = Math.floor(size / 2);
      return { rows: [teamPlayers.slice(0, mid), teamPlayers.slice(mid)] };
    }
    const third = Math.floor(size / 3);
    return {
      rows: [
        teamPlayers.slice(0, third),
        teamPlayers.slice(third, third * 2),
        teamPlayers.slice(third * 2)
      ]
    };
  };

  const t1Dist = distributeTeam(teams.team1);
  const t2Dist = distributeTeam(teams.team2);

  // Pending match confirmation dialog
  if (showPendingConfirm) {
    return (
      <div className="teams-view">
        <div className="container">
          <div className="pending-confirm-box">
            <div className="pending-confirm-icon">⏳</div>
            <h3>¿Qué hacemos con este partido?</h3>
            <p>Los equipos ya están armados. Podés guardarlo como partido pendiente para registrarlo más tarde.</p>
            <div className="pending-confirm-actions">
              <button className="btn-secondary" onClick={handleDiscardAndBack}>🗑️ Descartar</button>
              <button className="btn-pending" onClick={handleSavePending}>⏳ Guardar como pendiente</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Match result form
  if (showMatchResult) {
    return (
      <div className="teams-view">
        <div className="container">
          <div className="header-section">
            <h2>Resultado del Partido</h2>
          </div>
          <div className="match-result-form">
            <div className="result-header">
              <h3>¿Cómo salió entre <span className="team-highlight">{team1Name}</span> y <span className="team-highlight">{team2Name}</span>?</h3>
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

            <div className="scorers-section">
              <h4>⚽ Goleadores</h4>
              <div className="add-scorer">
                <select value={newScorerTeam} onChange={(e) => setNewScorerTeam(e.target.value)}>
                  <option value="1">{team1Name}</option>
                  <option value="2">{team2Name}</option>
                </select>
                <select value={newScorerPlayer} onChange={(e) => setNewScorerPlayer(e.target.value)}>
                  <option value="">Seleccionar jugador</option>
                  {(newScorerTeam === '1' ? teams.team1 : teams.team2).map(player => (
                    <option key={player.name} value={player.name}>{player.name}</option>
                  ))}
                </select>
                <button className="btn-primary btn-small" onClick={handleAddScorer}>+ Gol</button>
              </div>
              {scorers.length > 0 && (
                <div className="scorers-list">
                  {scorers.map((scorer, index) => (
                    <div key={index} className="scorer-item">
                      <span>⚽ {scorer.player} ({scorer.team === '1' ? team1Name : team2Name})</span>
                      <button className="btn-remove" onClick={() => handleRemoveScorer(index)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="highlights-section">
              <h4>📝 Highlights</h4>
              <textarea
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                placeholder="Escribí cualquier momento destacado del partido..."
                rows="3"
              />
              <div className="media-upload">
                <button className="btn-media-upload" onClick={() => fileInputRef.current?.click()}>
                  📷 Agregar fotos / videos
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>
              {mediaFiles.length > 0 && (
                <div className="media-preview">
                  {mediaFiles.map(m => (
                    <div key={m.id} className="media-item">
                      {m.type === 'image' ? (
                        <img src={m.url} alt={m.name} />
                      ) : (
                        <div className="video-thumb">🎬 {m.name}</div>
                      )}
                      <button className="btn-remove-media" onClick={() => handleRemoveMedia(m.id)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="result-actions">
              <button className="btn-secondary" onClick={handleCancelMatch}>Cancelar</button>
              <button className="btn-primary" onClick={handleSaveMatch}>Guardar Partido</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main teams view
  return (
    <div className="teams-view">
      <div className="container">
        <div className="header-section">
          <button className="btn-back" onClick={handleBack}>← Volver</button>
          <h2>Equipos Formados</h2>
        </div>

        <div className="team-names-section">
          <div className="team-name-input team-1-name">
            <label>Equipo 1</label>
            <input type="text" value={team1Name} onChange={(e) => setTeam1Name(e.target.value)} />
          </div>
          <div className="vs-separator">VS</div>
          <div className="team-name-input team-2-name">
            <label>Equipo 2</label>
            <input type="text" value={team2Name} onChange={(e) => setTeam2Name(e.target.value)} />
          </div>
        </div>

        <div className="field-container">
          <div className="field">
            {/* Team 1 */}
            <div className="team-side team-side-1">
              <div className="team-label team-1-label">{team1Name}</div>
              {t1Dist.rows.map((row, ri) => (
                <div key={ri} className="player-row">
                  {row.map(player => (
                    <div key={player.name} className={`player-marker ${player.isOwner ? 'player-owner' : ''}`}>
                      <div className="player-icon">{player.isOwner ? '👑' : '⚽'}</div>
                      <span className="player-name-tag">{player.name}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="center-line">
              <div className="center-circle"></div>
            </div>

            {/* Team 2 */}
            <div className="team-side team-side-2">
              {[...t2Dist.rows].reverse().map((row, ri) => (
                <div key={ri} className="player-row">
                  {row.map(player => (
                    <div key={player.name} className={`player-marker player-t2 ${player.isOwner ? 'player-owner' : ''}`}>
                      <div className="player-icon">{player.isOwner ? '👑' : '⚽'}</div>
                      <span className="player-name-tag">{player.name}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div className="team-label team-2-label">{team2Name}</div>
            </div>
          </div>
        </div>

        <div className="actions-section">
          <button className="btn-danger" onClick={handleCancelMatch}>Cancelar</button>
          <button className="btn-primary" onClick={handlePlayedMatch}>Partido Jugado</button>
        </div>
      </div>
    </div>
  );
}

export default Teams;
