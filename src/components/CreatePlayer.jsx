import { useState } from 'react';
import './CreatePlayer.css';

function CreatePlayer({ 
  setView, 
  players, 
  addPlayer, 
  updatePlayer, 
  deletePlayer,
  folders,
  addFolder,
  deleteFolder,
  addPlayerToFolder,
  removePlayerFromFolder
}) {
  const [name, setName] = useState('');
  const [velocidad, setVelocidad] = useState(5);
  const [defensa, setDefensa] = useState(5);
  const [pase, setPase] = useState(5);
  const [gambeta, setGambeta] = useState(5);
  const [pegada, setPegada] = useState(5);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('El nombre no puede estar vacío');
      return;
    }

    if (editingPlayer) {
      if (editingPlayer.name !== name && players.some(p => p.name === name)) {
        setError('Ya existe un jugador con ese nombre');
        return;
      }
      updatePlayer({ name, velocidad, defensa, pase, gambeta, pegada });
      setEditingPlayer(null);
    } else {
      if (players.some(p => p.name === name)) {
        setError('Ya existe un jugador con ese nombre');
        return;
      }
      addPlayer({ name, velocidad, defensa, pase, gambeta, pegada });
    }

    resetForm();
  };

  const resetForm = () => {
    setName('');
    setVelocidad(5);
    setDefensa(5);
    setPase(5);
    setGambeta(5);
    setPegada(5);
    setError('');
  };

  const handleEdit = (player) => {
    setEditingPlayer(player);
    setName(player.name);
    setVelocidad(player.velocidad);
    setDefensa(player.defensa);
    setPase(player.pase);
    setGambeta(player.gambeta);
    setPegada(player.pegada);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingPlayer(null);
    resetForm();
  };

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName('');
      setShowFolderInput(false);
    }
  };

  const handlePlayerFolderToggle = (playerName, folderName) => {
    const folder = folders.find(f => f.name === folderName);
    if (folder.players.includes(playerName)) {
      removePlayerFromFolder(folderName, playerName);
    } else {
      addPlayerToFolder(folderName, playerName);
    }
  };

  const getFilteredPlayers = () => {
    if (selectedFolder === 'all') {
      return players;
    }
    const folder = folders.find(f => f.name === selectedFolder);
    return players.filter(p => folder.players.includes(p.name));
  };

  const getTotal = () => velocidad + defensa + pase + gambeta + pegada;

  return (
    <div className="create-player">
      <div className="container">
        <div className="header-section">
          <button className="btn-back" onClick={() => setView('home')}>
            ← Volver
          </button>
          <h2>Gestión de Jugadores</h2>
        </div>

        <div className="player-form-container">
          <form onSubmit={handleSubmit} className="player-form">
            <h3>{editingPlayer ? 'Editar Jugador' : 'Crear Nuevo Jugador'}</h3>
            
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>Nombre del Jugador</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Lionel Messi"
                disabled={editingPlayer !== null}
              />
            </div>

            <div className="skills-grid">
              <div className="skill-item">
                <div className="skill-header">
                  <label>⚡ Velocidad</label>
                  <span className="skill-value">{velocidad}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={velocidad}
                  onChange={(e) => setVelocidad(Number(e.target.value))}
                />
              </div>

              <div className="skill-item">
                <div className="skill-header">
                  <label>🛡️ Defensa</label>
                  <span className="skill-value">{defensa}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={defensa}
                  onChange={(e) => setDefensa(Number(e.target.value))}
                />
              </div>

              <div className="skill-item">
                <div className="skill-header">
                  <label>🎯 Pase</label>
                  <span className="skill-value">{pase}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={pase}
                  onChange={(e) => setPase(Number(e.target.value))}
                />
              </div>

              <div className="skill-item">
                <div className="skill-header">
                  <label>🎪 Gambeta</label>
                  <span className="skill-value">{gambeta}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={gambeta}
                  onChange={(e) => setGambeta(Number(e.target.value))}
                />
              </div>

              <div className="skill-item">
                <div className="skill-header">
                  <label>💥 Pegada</label>
                  <span className="skill-value">{pegada}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={pegada}
                  onChange={(e) => setPegada(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="total-rating">
              <span>Total:</span>
              <span className="total-value">{getTotal()}/50</span>
            </div>

            <div className="form-actions">
              {editingPlayer && (
                <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
                  Cancelar
                </button>
              )}
              <button type="submit" className="btn-primary">
                {editingPlayer ? 'Actualizar' : 'Crear'} Jugador
              </button>
            </div>
          </form>
        </div>

        <div className="folders-section">
          <div className="folders-header">
            <h3>Carpetas</h3>
            <button 
              className="btn-primary btn-small"
              onClick={() => setShowFolderInput(!showFolderInput)}
            >
              + Nueva Carpeta
            </button>
          </div>

          {showFolderInput && (
            <div className="folder-input-container">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nombre de la carpeta"
                onKeyPress={(e) => e.key === 'Enter' && handleAddFolder()}
              />
              <button className="btn-primary btn-small" onClick={handleAddFolder}>
                Crear
              </button>
            </div>
          )}

          <div className="folder-filters">
            <button
              className={`folder-filter ${selectedFolder === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedFolder('all')}
            >
              Todos ({players.length})
            </button>
            {folders.map(folder => (
              <div key={folder.name} className="folder-filter-item">
                <button
                  className={`folder-filter ${selectedFolder === folder.name ? 'active' : ''}`}
                  onClick={() => setSelectedFolder(folder.name)}
                >
                  📁 {folder.name} ({folder.players.length})
                </button>
                <button
                  className="btn-delete-folder"
                  onClick={() => deleteFolder(folder.name)}
                  title="Eliminar carpeta"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="players-list-section">
          <h3>Jugadores Creados ({getFilteredPlayers().length})</h3>
          
          {getFilteredPlayers().length === 0 ? (
            <div className="empty-state">
              <p>No hay jugadores {selectedFolder !== 'all' ? 'en esta carpeta' : 'creados'}</p>
            </div>
          ) : (
            <div className="players-grid">
              {getFilteredPlayers().map(player => (
                <div key={player.name} className="player-card">
                  <div className="player-card-header">
                    <h4>{player.name}</h4>
                    <div className="player-total">
                      {player.velocidad + player.defensa + player.pase + player.gambeta + player.pegada}
                    </div>
                  </div>
                  
                  <div className="player-skills-compact">
                    <div className="skill-bar">
                      <span>⚡</span>
                      <div className="bar">
                        <div className="bar-fill" style={{ width: `${player.velocidad * 10}%` }}></div>
                      </div>
                      <span>{player.velocidad}</span>
                    </div>
                    <div className="skill-bar">
                      <span>🛡️</span>
                      <div className="bar">
                        <div className="bar-fill" style={{ width: `${player.defensa * 10}%` }}></div>
                      </div>
                      <span>{player.defensa}</span>
                    </div>
                    <div className="skill-bar">
                      <span>🎯</span>
                      <div className="bar">
                        <div className="bar-fill" style={{ width: `${player.pase * 10}%` }}></div>
                      </div>
                      <span>{player.pase}</span>
                    </div>
                    <div className="skill-bar">
                      <span>🎪</span>
                      <div className="bar">
                        <div className="bar-fill" style={{ width: `${player.gambeta * 10}%` }}></div>
                      </div>
                      <span>{player.gambeta}</span>
                    </div>
                    <div className="skill-bar">
                      <span>💥</span>
                      <div className="bar">
                        <div className="bar-fill" style={{ width: `${player.pegada * 10}%` }}></div>
                      </div>
                      <span>{player.pegada}</span>
                    </div>
                  </div>

                  {folders.length > 0 && (
                    <div className="player-folders">
                      {folders.map(folder => (
                        <label key={folder.name} className="folder-checkbox">
                          <input
                            type="checkbox"
                            checked={folder.players.includes(player.name)}
                            onChange={() => handlePlayerFolderToggle(player.name, folder.name)}
                          />
                          <span>{folder.name}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  <div className="player-actions">
                    <button 
                      className="btn-edit"
                      onClick={() => handleEdit(player)}
                    >
                      ✏️ Editar
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => deletePlayer(player.name)}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreatePlayer;
