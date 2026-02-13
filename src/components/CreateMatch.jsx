import { useState } from 'react';
import './CreateMatch.css';

function CreateMatch({ setView, players, folders, createTeams }) {
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [goalkeepers, setGoalkeepers] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [error, setError] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickRating, setQuickRating] = useState(5);
  const [tempPlayers, setTempPlayers] = useState([]); // quick/temp players

  const allAvailablePlayers = [...players, ...tempPlayers];

  const getFilteredPlayers = () => {
    if (selectedFolder === 'all') return allAvailablePlayers;
    const folder = folders.find(f => f.name === selectedFolder);
    if (!folder) return allAvailablePlayers;
    return allAvailablePlayers.filter(p => folder.players.includes(p.name) || p.isTemp);
  };

  const handlePlayerToggle = (playerName) => {
    if (selectedPlayers.includes(playerName)) {
      setSelectedPlayers(selectedPlayers.filter(p => p !== playerName));
      setGoalkeepers(goalkeepers.filter(g => g !== playerName));
    } else {
      setSelectedPlayers([...selectedPlayers, playerName]);
    }
  };

  const handleSelectFolder = (folderName) => {
    const folder = folders.find(f => f.name === folderName);
    if (!folder) return;
    const folderPlayerNames = folder.players;
    const allSelected = folderPlayerNames.every(n => selectedPlayers.includes(n));
    if (allSelected) {
      // Deselect all from folder
      setSelectedPlayers(selectedPlayers.filter(n => !folderPlayerNames.includes(n)));
      setGoalkeepers(goalkeepers.filter(g => !folderPlayerNames.includes(g)));
    } else {
      // Select all from folder
      const toAdd = folderPlayerNames.filter(n => !selectedPlayers.includes(n));
      setSelectedPlayers([...selectedPlayers, ...toAdd]);
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

  const handleAddQuickPlayer = () => {
    if (!quickName.trim()) return;
    if (allAvailablePlayers.some(p => p.name === quickName.trim())) {
      setError('Ya existe un jugador con ese nombre');
      setTimeout(() => setError(''), 3000);
      return;
    }
    const avg = quickRating;
    const tempPlayer = {
      name: quickName.trim(),
      velocidad: avg, defensa: avg, pase: avg, gambeta: avg, pegada: avg,
      isTemp: true,
    };
    setTempPlayers([...tempPlayers, tempPlayer]);
    setSelectedPlayers([...selectedPlayers, tempPlayer.name]);
    setQuickName('');
    setQuickRating(5);
    setShowQuickAdd(false);
  };

  const handleCreateTeams = () => {
    setError('');
    if (selectedPlayers.length === 0) { setError('Debes seleccionar al menos un jugador'); return; }
    if (selectedPlayers.length % 2 !== 0) { setError('La cantidad de jugadores debe ser par'); return; }

    const selectedPlayerObjects = allAvailablePlayers.filter(p => selectedPlayers.includes(p.name));
    const teams = balanceTeams(selectedPlayerObjects, goalkeepers);
    createTeams(teams);
    setView('teams');
  };

  const balanceTeams = (playersToBalance, gks) => {
    const team1 = [];
    const team2 = [];

    const gkPlayers = playersToBalance.filter(p => gks.includes(p.name));
    const fieldPlayers = playersToBalance.filter(p => !gks.includes(p.name));

    const withRatings = fieldPlayers.map(p => ({
      ...p,
      total: p.velocidad + p.defensa + p.pase + p.gambeta + p.pegada
    })).sort((a, b) => b.total - a.total);

    if (gkPlayers.length >= 2) {
      // Two GKs: one per team, then snake-draft field players
      team1.push(gkPlayers[0]);
      team2.push(gkPlayers[1]);
      withRatings.forEach((player, index) => {
        if (index % 2 === 0) team1.push(player);
        else team2.push(player);
      });
    } else if (gkPlayers.length === 1) {
      // One GK: treat them like any field player but keep GK role.
      // Insert the GK back into the sorted pool by their total rating,
      // then snake-draft everyone. Team that gets the GK at position 0 uses them as keeper.
      const gkWithTotal = { ...gkPlayers[0], total: gkPlayers[0].velocidad + gkPlayers[0].defensa + gkPlayers[0].pase + gkPlayers[0].gambeta + gkPlayers[0].pegada };
      const allSorted = [...withRatings, gkWithTotal].sort((a, b) => b.total - a.total);
      allSorted.forEach((player, index) => {
        if (index % 2 === 0) team1.push(player);
        else team2.push(player);
      });
    } else {
      // No GKs: plain snake-draft
      withRatings.forEach((player, index) => {
        if (index % 2 === 0) team1.push(player);
        else team2.push(player);
      });
    }

    return { team1, team2 };
  };

  const getPlayerTotal = (player) => player.velocidad + player.defensa + player.pase + player.gambeta + player.pegada;

  if (players.length === 0 && tempPlayers.length === 0) {
    return (
      <div className="create-match">
        <div className="container">
          <div className="header-section">
            <button className="btn-back" onClick={() => setView('home')}>← Volver</button>
            <h2>Armar Partido</h2>
          </div>
          <div className="empty-state-large">
            <div className="empty-icon">⚽</div>
            <h3>No hay jugadores creados</h3>
            <p>Primero debes crear jugadores antes de armar un partido</p>
            <button className="btn-primary" onClick={() => setView('create-player')}>Crear Jugadores</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-match">
      <div className="container">
        <div className="header-section">
          <button className="btn-back" onClick={() => setView('home')}>← Volver</button>
          <h2
            className={`title-as-btn ${selectedPlayers.length > 0 && selectedPlayers.length % 2 === 0 ? 'title-ready' : 'title-disabled'}`}
            onClick={handleCreateTeams}
            title="Armar Equipos"
          >
            Armar Partido ⚽
          </h2>
        </div>

        <div className="match-info-panel">
          <div className="info-item">
            <span className="info-label">Seleccionados</span>
            <span className="info-value">{selectedPlayers.length}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Arqueros</span>
            <span className="info-value">{goalkeepers.length}/2</span>
          </div>
          <div className={`info-item ${selectedPlayers.length > 0 && selectedPlayers.length % 2 === 0 ? 'valid' : 'invalid'}`}>
            <span className="info-label">Estado</span>
            <span className="info-value">
              {selectedPlayers.length === 0 ? 'Sin jugadores' :
               selectedPlayers.length % 2 !== 0 ? 'Cantidad impar' : '✓ Listo'}
            </span>
          </div>
        </div>

        {error && <div className="error-message-large">{error}</div>}

        {/* Folder filters + select all */}
        <div className="folder-selector">
          <label>Filtrar por carpeta:</label>
          <div className="folder-buttons">
            <button
              className={`folder-btn ${selectedFolder === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedFolder('all')}
            >
              Todos ({allAvailablePlayers.length})
            </button>
            {folders.map(folder => {
              const isActive = selectedFolder === folder.name;
              const folderPlayerNames = folder.players;
              const allSelected = folderPlayerNames.length > 0 && folderPlayerNames.every(n => selectedPlayers.includes(n));
              return (
                <div key={folder.name} className="folder-btn-group">
                  <button
                    className={`folder-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedFolder(folder.name)}
                  >
                    📁 {folder.name} ({folder.players.length})
                  </button>
                  {/* Only show select-all when this folder is the active filter */}
                  {isActive && folder.players.length > 0 && (
                    <button
                      className={`folder-select-all-btn ${allSelected ? 'all-selected' : ''}`}
                      onClick={() => handleSelectFolder(folder.name)}
                    >
                      {allSelected ? '✓ Deseleccionar todos' : '+ Seleccionar todos'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick add player */}
        <div className="quick-add-section">
          <button className="btn-quick-add" onClick={() => setShowQuickAdd(!showQuickAdd)}>
            ⚡ Jugador Rápido
          </button>
          {showQuickAdd && (
            <div className="quick-add-form">
              <input
                type="text"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                placeholder="Nombre del jugador"
                onKeyDown={(e) => e.key === 'Enter' && handleAddQuickPlayer()}
              />
              <div className="quick-rating">
                <label>Nivel: <strong>{quickRating}</strong>/10</label>
                <input
                  type="range" min="1" max="10"
                  value={quickRating}
                  onChange={(e) => setQuickRating(Number(e.target.value))}
                />
              </div>
              <p className="quick-note">Este jugador solo será usado para este partido y no se guardará.</p>
              <div className="quick-actions">
                <button className="btn-secondary btn-small" onClick={() => setShowQuickAdd(false)}>Cancelar</button>
                <button className="btn-primary btn-small" onClick={handleAddQuickPlayer}>Agregar</button>
              </div>
            </div>
          )}
        </div>

        {/* Players selection */}
        <div className="players-selection">
          <h3>Seleccionar Jugadores</h3>
          <div className="players-selection-grid">
            {getFilteredPlayers().map(player => {
              const isSelected = selectedPlayers.includes(player.name);
              const isGoalkeeper = goalkeepers.includes(player.name);
              return (
                <div
                  key={player.name}
                  className={`player-selection-card ${isSelected ? 'selected' : ''} ${isGoalkeeper ? 'goalkeeper' : ''} ${player.isTemp ? 'temp-player' : ''}`}
                >
                  <div className="player-select-header">
                    <label className="checkbox-container">
                      <input type="checkbox" checked={isSelected} onChange={() => handlePlayerToggle(player.name)} />
                      <span className="checkmark"></span>
                    </label>
                    <h4>
                      {player.isOwner && <span className="owner-dot">👑 </span>}
                      {player.name}
                      {player.isTemp && <span className="temp-label"> (temp)</span>}
                    </h4>
                    <div className="player-rating">{getPlayerTotal(player)}</div>
                  </div>

                  <div className="player-mini-stats">
                    {['velocidad','defensa','pase','gambeta','pegada'].map((key, i) => (
                      <div key={key} className="mini-stat">
                        <span className="stat-icon">{['⚡','🛡️','🎯','🎪','💥'][i]}</span>
                        <div className="stat-bar">
                          <div className="stat-fill" style={{ width: `${player[key] * 10}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {isSelected && (
                    <div className="goalkeeper-toggle">
                      <label className="toggle-label">
                        <span>🧤 Arquero</span>
                        <label className="toggle-switch">
                          <input type="checkbox" checked={isGoalkeeper} onChange={() => handleGoalkeeperToggle(player.name)} />
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
