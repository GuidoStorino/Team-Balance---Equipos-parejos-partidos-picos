import { useState } from 'react';
import './CreateMatch.css';

function CreateMatch({ setView, players, folders, createTeams }) {
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [goalkeepers, setGoalkeepers] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [error, setError] = useState('');

  const getFilteredPlayers = () => {
    if (selectedFolder === 'all') {
      return players;
    }
    const folder = folders.find(f => f.name === selectedFolder);
    return players.filter(p => folder.players.includes(p.name));
  };

  const handlePlayerToggle = (playerName) => {
    if (selectedPlayers.includes(playerName)) {
      setSelectedPlayers(selectedPlayers.filter(p => p !== playerName));
      setGoalkeepers(goalkeepers.filter(g => g !== playerName));
    } else {
      setSelectedPlayers([...selectedPlayers, playerName]);
    }
  };

  const handleGoalkeeperToggle = (playerName) => {
    if (!selectedPlayers.includes(playerName)) return;

    if (goalkeepers.includes(playerName)) {
      setGoalkeepers(goalkeepers.filter(g => g !== playerName));
    } else {
      if (goalkeepers.length >= 2) {
        setError('Solo puede haber 2 arqueros como máximo');
        setTimeout(() => setError(''), 3000);
        return;
      }
      setGoalkeepers([...goalkeepers, playerName]);
    }
  };

  const handleCreateTeams = () => {
    setError('');

    if (selectedPlayers.length === 0) {
      setError('Debes seleccionar al menos un jugador');
      return;
    }

    if (selectedPlayers.length % 2 !== 0) {
      setError('La cantidad de jugadores debe ser par');
      return;
    }

    // Get player objects with their stats
    const selectedPlayerObjects = players.filter(p => selectedPlayers.includes(p.name));
    
    // Balance teams
    const teams = balanceTeams(selectedPlayerObjects, goalkeepers);
    
    createTeams(teams);
    setView('teams');
  };

  const balanceTeams = (playersToBalance, gks) => {
    const team1 = [];
    const team2 = [];

    // Separate goalkeepers and field players
    const goalkeepers = playersToBalance.filter(p => gks.includes(p.name));
    const fieldPlayers = playersToBalance.filter(p => !gks.includes(p.name));

    // Assign goalkeepers (one per team if available)
    if (goalkeepers.length > 0) {
      team1.push(goalkeepers[0]);
      if (goalkeepers.length > 1) {
        team2.push(goalkeepers[1]);
      }
    }

    // Calculate total rating for each player
    const playersWithRatings = fieldPlayers.map(p => ({
      ...p,
      total: p.velocidad + p.defensa + p.pase + p.gambeta + p.pegada
    })).sort((a, b) => b.total - a.total);

    // Balance teams using snake draft
    playersWithRatings.forEach((player, index) => {
      if (index % 2 === 0) {
        team1.push(player);
      } else {
        team2.push(player);
      }
    });

    return { team1, team2 };
  };

  const getPlayerTotal = (playerName) => {
    const player = players.find(p => p.name === playerName);
    if (!player) return 0;
    return player.velocidad + player.defensa + player.pase + player.gambeta + player.pegada;
  };

  if (players.length === 0) {
    return (
      <div className="create-match">
        <div className="container">
          <div className="header-section">
            <button className="btn-back" onClick={() => setView('home')}>
              ← Volver
            </button>
            <h2>Armar Partido</h2>
          </div>
          <div className="empty-state-large">
            <div className="empty-icon">⚽</div>
            <h3>No hay jugadores creados</h3>
            <p>Primero debes crear jugadores antes de armar un partido</p>
            <button className="btn-primary" onClick={() => setView('create-player')}>
              Crear Jugadores
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-match">
      <div className="container">
        <div className="header-section">
          <button className="btn-back" onClick={() => setView('home')}>
            ← Volver
          </button>
          <h2>Armar Partido</h2>
        </div>

        <div className="match-info-panel">
          <div className="info-item">
            <span className="info-label">Jugadores seleccionados:</span>
            <span className="info-value">{selectedPlayers.length}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Arqueros:</span>
            <span className="info-value">{goalkeepers.length}/2</span>
          </div>
          <div className={`info-item ${selectedPlayers.length % 2 === 0 ? 'valid' : 'invalid'}`}>
            <span className="info-label">Estado:</span>
            <span className="info-value">
              {selectedPlayers.length === 0 ? 'Sin jugadores' :
               selectedPlayers.length % 2 !== 0 ? 'Cantidad impar' : 
               '✓ Listo para jugar'}
            </span>
          </div>
        </div>

        {error && <div className="error-message-large">{error}</div>}

        <div className="folder-selector">
          <label>Filtrar por carpeta:</label>
          <div className="folder-buttons">
            <button
              className={`folder-btn ${selectedFolder === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedFolder('all')}
            >
              Todos ({players.length})
            </button>
            {folders.map(folder => (
              <button
                key={folder.name}
                className={`folder-btn ${selectedFolder === folder.name ? 'active' : ''}`}
                onClick={() => setSelectedFolder(folder.name)}
              >
                📁 {folder.name} ({folder.players.length})
              </button>
            ))}
          </div>
        </div>

        <div className="players-selection">
          <h3>Seleccionar Jugadores</h3>
          <div className="players-selection-grid">
            {getFilteredPlayers().map(player => {
              const isSelected = selectedPlayers.includes(player.name);
              const isGoalkeeper = goalkeepers.includes(player.name);
              
              return (
                <div 
                  key={player.name} 
                  className={`player-selection-card ${isSelected ? 'selected' : ''} ${isGoalkeeper ? 'goalkeeper' : ''}`}
                >
                  <div className="player-select-header">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handlePlayerToggle(player.name)}
                      />
                      <span className="checkmark"></span>
                    </label>
                    <h4>{player.name}</h4>
                    <div className="player-rating">{getPlayerTotal(player.name)}</div>
                  </div>

                  <div className="player-mini-stats">
                    <div className="mini-stat">
                      <span className="stat-icon">⚡</span>
                      <div className="stat-bar">
                        <div className="stat-fill" style={{ width: `${player.velocidad * 10}%` }}></div>
                      </div>
                    </div>
                    <div className="mini-stat">
                      <span className="stat-icon">🛡️</span>
                      <div className="stat-bar">
                        <div className="stat-fill" style={{ width: `${player.defensa * 10}%` }}></div>
                      </div>
                    </div>
                    <div className="mini-stat">
                      <span className="stat-icon">🎯</span>
                      <div className="stat-bar">
                        <div className="stat-fill" style={{ width: `${player.pase * 10}%` }}></div>
                      </div>
                    </div>
                    <div className="mini-stat">
                      <span className="stat-icon">🎪</span>
                      <div className="stat-bar">
                        <div className="stat-fill" style={{ width: `${player.gambeta * 10}%` }}></div>
                      </div>
                    </div>
                    <div className="mini-stat">
                      <span className="stat-icon">💥</span>
                      <div className="stat-bar">
                        <div className="stat-fill" style={{ width: `${player.pegada * 10}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="goalkeeper-toggle">
                      <label className="toggle-label">
                        <span>Arquero</span>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={isGoalkeeper}
                            onChange={() => handleGoalkeeperToggle(player.name)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="action-buttons">
          <button 
            className="btn-primary btn-large"
            onClick={handleCreateTeams}
            disabled={selectedPlayers.length === 0 || selectedPlayers.length % 2 !== 0}
          >
            ⚽ Armar Equipos
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateMatch;
