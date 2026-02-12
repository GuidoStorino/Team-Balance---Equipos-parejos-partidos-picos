import { useState } from 'react';
import './CreatePlayer.css';

function CreatePlayer({
  setView, players, addPlayer, updatePlayer, deletePlayer,
  folders, addFolder, deleteFolder, addPlayerToFolder, removePlayerFromFolder, ownerPlayer
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
  const [expandedPlayers, setExpandedPlayers] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('El nombre no puede estar vacío'); return; }

    if (editingPlayer) {
      if (editingPlayer.name !== name && players.some(p => p.name === name)) {
        setError('Ya existe un jugador con ese nombre'); return;
      }
      updatePlayer({ ...editingPlayer, name, velocidad, defensa, pase, gambeta, pegada });
      setEditingPlayer(null);
    } else {
      if (players.some(p => p.name === name)) { setError('Ya existe un jugador con ese nombre'); return; }
      addPlayer({ name, velocidad, defensa, pase, gambeta, pegada });
    }
    resetForm();
  };

  const resetForm = () => {
    setName(''); setVelocidad(5); setDefensa(5); setPase(5); setGambeta(5); setPegada(5); setError('');
  };

  const handleEdit = (player) => {
    setEditingPlayer(player);
    setName(player.name); setVelocidad(player.velocidad); setDefensa(player.defensa);
    setPase(player.pase); setGambeta(player.gambeta); setPegada(player.pegada);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => { setEditingPlayer(null); resetForm(); };

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
    if (selectedFolder === 'all') return players;
    const folder = folders.find(f => f.name === selectedFolder);
    if (!folder) return players;
    return players.filter(p => folder.players.includes(p.name));
  };

  const toggleExpand = (playerName) => {
    setExpandedPlayers(prev => ({ ...prev, [playerName]: !prev[playerName] }));
  };

  const getTotal = (p) => {
    if (p) return p.velocidad + p.defensa + p.pase + p.gambeta + p.pegada;
    return velocidad + defensa + pase + gambeta + pegada;
  };

  const skillList = [
    { key: 'velocidad', label: '⚡ Velocidad', value: velocidad, setter: setVelocidad },
    { key: 'defensa', label: '🛡️ Defensa', value: defensa, setter: setDefensa },
    { key: 'pase', label: '🎯 Pase', value: pase, setter: setPase },
    { key: 'gambeta', label: '🎪 Gambeta', value: gambeta, setter: setGambeta },
    { key: 'pegada', label: '💥 Pegada', value: pegada, setter: setPegada },
  ];

  return (
    <div className="create-player">
      <div className="container">
        <div className="header-section">
          <button className="btn-back" onClick={() => setView('home')}>← Volver</button>
          <h2>Gestión de Jugadores</h2>
        </div>

        {/* FORM */}
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
                disabled={editingPlayer !== null && editingPlayer.isOwner}
              />
            </div>

            <div className="skills-grid">
              {skillList.map(skill => (
                <div key={skill.key} className="skill-item">
                  <div className="skill-header">
                    <label>{skill.label}</label>
                    <span className="skill-value">{skill.value}</span>
                  </div>
                  <input
                    type="range" min="1" max="10"
                    value={skill.value}
                    onChange={(e) => skill.setter(Number(e.target.value))}
                  />
                </div>
              ))}
            </div>

            <div className="total-rating">
              <span>Total:</span>
              <span className="total-value">{getTotal()}/50</span>
            </div>

            <div className="form-actions">
              {editingPlayer && (
                <button type="button" className="btn-secondary" onClick={handleCancelEdit}>Cancelar</button>
              )}
              <button type="submit" className="btn-primary">
                {editingPlayer ? 'Actualizar' : 'Crear'} Jugador
              </button>
            </div>
          </form>
        </div>

        {/* FOLDERS */}
        <div className="folders-section">
          <div className="folders-header">
            <h3>Carpetas</h3>
            <button className="btn-primary btn-small" onClick={() => setShowFolderInput(!showFolderInput)}>
              + Nueva Carpeta
            </button>
          </div>
          {showFolderInput && (
            <div className="folder-input-container">
              <input
                type="text" value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nombre de la carpeta"
                onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
              />
              <button className="btn-primary btn-small" onClick={handleAddFolder}>Crear</button>
            </div>
          )}
          <div className="folder-filters">
            <button className={`folder-filter ${selectedFolder === 'all' ? 'active' : ''}`} onClick={() => setSelectedFolder('all')}>
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
                <button className="btn-delete-folder" onClick={() => deleteFolder(folder.name)} title="Eliminar carpeta">×</button>
              </div>
            ))}
          </div>
        </div>

        {/* PLAYERS LIST */}
        <div className="players-list-section">
          <h3>Jugadores Creados ({getFilteredPlayers().length})</h3>
          {getFilteredPlayers().length === 0 ? (
            <div className="empty-state"><p>No hay jugadores {selectedFolder !== 'all' ? 'en esta carpeta' : 'creados'}</p></div>
          ) : (
            <div className="players-grid">
              {getFilteredPlayers().map(player => {
                const isExpanded = expandedPlayers[player.name];
                return (
                  <div key={player.name} className={`player-card ${isExpanded ? 'expanded' : ''} ${player.isOwner ? 'owner-card' : ''}`}>
                    {/* ALWAYS VISIBLE: name + total + expand toggle */}
                    <div className="player-card-summary" onClick={() => toggleExpand(player.name)}>
                      <div className="player-card-name-row">
                        {player.isOwner && <span className="owner-badge">👑</span>}
                        <h4>{player.name}</h4>
                      </div>
                      <div className="player-card-right">
                        <div className="player-total">{getTotal(player)}</div>
                        <span className="expand-arrow">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {/* EXPANDABLE CONTENT */}
                    {isExpanded && (
                      <div className="player-card-details">
                        <div className="player-skills-compact">
                          {[
                            { icon: '⚡', key: 'velocidad' },
                            { icon: '🛡️', key: 'defensa' },
                            { icon: '🎯', key: 'pase' },
                            { icon: '🎪', key: 'gambeta' },
                            { icon: '💥', key: 'pegada' },
                          ].map(s => (
                            <div key={s.key} className="skill-bar">
                              <span>{s.icon}</span>
                              <div className="bar">
                                <div className="bar-fill" style={{ width: `${player[s.key] * 10}%` }}></div>
                              </div>
                              <span>{player[s.key]}</span>
                            </div>
                          ))}
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
                          <button className="btn-edit" onClick={() => handleEdit(player)}>✏️ Editar</button>
                          {!player.isOwner && (
                            <button className="btn-delete" onClick={() => deletePlayer(player.name)}>🗑️ Eliminar</button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreatePlayer;
