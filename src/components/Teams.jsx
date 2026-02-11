import { useState, useEffect } from 'react';
import './Teams.css';

const funnyTeamNames = [
  'Los Vainillas',
  'Heladeros del Conurbano',
  'Menos Patada que una Pila',
  'Menos Centro que Don Bosco',
  'Los Descosidos',
  'Pelota Dividida FC',
  'Los Troncos United',
  'Sporting de Tobillo',
  'Inter de Patio',
  'Real Descenso',
  'Atlético Cancha de Tierra',
  'Los Sin Técnica',
  'Deportivo Puntapié',
  'Racing de Esquina',
  'Manchester sin City',
  'FC Barreneta',
  'Juventus de Barrio',
  'Los Mismos de Siempre',
  'Gambeta al Banco',
  'Los Palo y a la Bolsa'
];

function Teams({ setView, teams, clearCurrentTeams, saveMatch }) {
  const [team1Name, setTeam1Name] = useState('');
  const [team2Name, setTeam2Name] = useState('');
  const [showMatchResult, setShowMatchResult] = useState(false);
  const [team1Goals, setTeam1Goals] = useState(0);
  const [team2Goals, setTeam2Goals] = useState(0);
  const [scorers, setScorers] = useState([]);
  const [highlights, setHighlights] = useState('');
  const [newScorerTeam, setNewScorerTeam] = useState('1');
  const [newScorerPlayer, setNewScorerPlayer] = useState('');

  useEffect(() => {
    // Generate random team names
    const shuffled = [...funnyTeamNames].sort(() => 0.5 - Math.random());
    setTeam1Name(shuffled[0]);
    setTeam2Name(shuffled[1]);
  }, []);

  if (!teams) {
    setView('home');
    return null;
  }

  const handlePlayedMatch = () => {
    setShowMatchResult(true);
  };

  const handleSaveMatch = () => {
    const matchData = {
      id: Date.now(),
      date: new Date().toISOString(),
      team1: {
        name: team1Name,
        players: teams.team1.map(p => p.name),
        goals: team1Goals
      },
      team2: {
        name: team2Name,
        players: teams.team2.map(p => p.name),
        goals: team2Goals
      },
      scorers: scorers,
      highlights: highlights
    };

    saveMatch(matchData);
    clearCurrentTeams();
    setView('history');
  };

  const handleCancelMatch = () => {
    clearCurrentTeams();
    setView('home');
  };

  const handleAddScorer = () => {
    if (!newScorerPlayer) return;

    setScorers([...scorers, {
      team: newScorerTeam,
      player: newScorerPlayer
    }]);
    setNewScorerPlayer('');
  };

  const handleRemoveScorer = (index) => {
    setScorers(scorers.filter((_, i) => i !== index));
  };

  const getFormation = (teamSize) => {
    // Simple formations based on team size
    if (teamSize <= 3) return { def: 1, mid: 0, fwd: teamSize - 1 };
    if (teamSize === 4) return { def: 1, mid: 1, fwd: 2 };
    if (teamSize === 5) return { def: 2, mid: 1, fwd: 2 };
    if (teamSize === 6) return { def: 2, mid: 2, fwd: 2 };
    if (teamSize === 7) return { def: 2, mid: 3, fwd: 2 };
    return { def: 3, mid: 3, fwd: teamSize - 6 };
  };

  const distributePlayersInFormation = (players) => {
    const gk = players.find(p => teams.team1.includes(p) || teams.team2.includes(p));
    const fieldPlayers = players.filter(p => p !== gk);
    const formation = getFormation(fieldPlayers.length);
    
    return {
      goalkeeper: gk,
      defenders: fieldPlayers.slice(0, formation.def),
      midfielders: fieldPlayers.slice(formation.def, formation.def + formation.mid),
      forwards: fieldPlayers.slice(formation.def + formation.mid)
    };
  };

  const team1Distribution = distributePlayersInFormation(teams.team1);
  const team2Distribution = distributePlayersInFormation(teams.team2);

  if (showMatchResult) {
    return (
      <div className="teams-view">
        <div className="container">
          <div className="header-section">
            <h2>Resultado del Partido</h2>
          </div>

          <div className="match-result-form">
            <div className="result-header">
              <h3>¿Cómo salió el partido entre {team1Name} y {team2Name}?</h3>
            </div>

            <div className="score-input">
              <div className="team-score">
                <label>{team1Name}</label>
                <input
                  type="number"
                  min="0"
                  value={team1Goals}
                  onChange={(e) => setTeam1Goals(Number(e.target.value))}
                />
              </div>
              <div className="score-separator">-</div>
              <div className="team-score">
                <label>{team2Name}</label>
                <input
                  type="number"
                  min="0"
                  value={team2Goals}
                  onChange={(e) => setTeam2Goals(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="scorers-section">
              <h4>Goleadores</h4>
              <div className="add-scorer">
                <select
                  value={newScorerTeam}
                  onChange={(e) => setNewScorerTeam(e.target.value)}
                >
                  <option value="1">{team1Name}</option>
                  <option value="2">{team2Name}</option>
                </select>
                <select
                  value={newScorerPlayer}
                  onChange={(e) => setNewScorerPlayer(e.target.value)}
                >
                  <option value="">Seleccionar jugador</option>
                  {(newScorerTeam === '1' ? teams.team1 : teams.team2).map(player => (
                    <option key={player.name} value={player.name}>{player.name}</option>
                  ))}
                </select>
                <button className="btn-primary btn-small" onClick={handleAddScorer}>
                  + Gol
                </button>
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
              <h4>Highlights / Notas</h4>
              <textarea
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                placeholder="Escribe cualquier momento destacado del partido..."
                rows="4"
              />
            </div>

            <div className="result-actions">
              <button className="btn-secondary" onClick={handleCancelMatch}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleSaveMatch}>
                Guardar Partido
              </button>
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
          <button className="btn-back" onClick={() => setView('create-match')}>
            ← Volver
          </button>
          <h2>Equipos Formados</h2>
        </div>

        <div className="team-names-section">
          <div className="team-name-input">
            <label>Equipo 1</label>
            <input
              type="text"
              value={team1Name}
              onChange={(e) => setTeam1Name(e.target.value)}
            />
          </div>
          <div className="vs-separator">VS</div>
          <div className="team-name-input">
            <label>Equipo 2</label>
            <input
              type="text"
              value={team2Name}
              onChange={(e) => setTeam2Name(e.target.value)}
            />
          </div>
        </div>

        <div className="field-container">
          <div className="field">
            {/* Team 1 Side */}
            <div className="team-side team-1">
              <div className="team-header">
                <h3>{team1Name}</h3>
              </div>
              
              {team1Distribution.goalkeeper && (
                <div className="position-line goalkeeper-line">
                  <div className="player-dot goalkeeper">
                    <span className="player-name">{team1Distribution.goalkeeper.name}</span>
                  </div>
                </div>
              )}
              
              {team1Distribution.defenders.length > 0 && (
                <div className="position-line">
                  {team1Distribution.defenders.map(player => (
                    <div key={player.name} className="player-dot">
                      <span className="player-name">{player.name}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {team1Distribution.midfielders.length > 0 && (
                <div className="position-line">
                  {team1Distribution.midfielders.map(player => (
                    <div key={player.name} className="player-dot">
                      <span className="player-name">{player.name}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {team1Distribution.forwards.length > 0 && (
                <div className="position-line">
                  {team1Distribution.forwards.map(player => (
                    <div key={player.name} className="player-dot">
                      <span className="player-name">{player.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="midfield-line"></div>

            {/* Team 2 Side */}
            <div className="team-side team-2">
              {team2Distribution.forwards.length > 0 && (
                <div className="position-line">
                  {team2Distribution.forwards.map(player => (
                    <div key={player.name} className="player-dot">
                      <span className="player-name">{player.name}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {team2Distribution.midfielders.length > 0 && (
                <div className="position-line">
                  {team2Distribution.midfielders.map(player => (
                    <div key={player.name} className="player-dot">
                      <span className="player-name">{player.name}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {team2Distribution.defenders.length > 0 && (
                <div className="position-line">
                  {team2Distribution.defenders.map(player => (
                    <div key={player.name} className="player-dot">
                      <span className="player-name">{player.name}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {team2Distribution.goalkeeper && (
                <div className="position-line goalkeeper-line">
                  <div className="player-dot goalkeeper">
                    <span className="player-name">{team2Distribution.goalkeeper.name}</span>
                  </div>
                </div>
              )}
              
              <div className="team-header">
                <h3>{team2Name}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="actions-section">
          <button className="btn-danger" onClick={handleCancelMatch}>
            Cancelar Partido
          </button>
          <button className="btn-primary" onClick={handlePlayedMatch}>
            Partido Jugado
          </button>
        </div>
      </div>
    </div>
  );
}

export default Teams;
