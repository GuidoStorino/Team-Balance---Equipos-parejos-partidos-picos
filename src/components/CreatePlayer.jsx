import { useState } from 'react';
import './CreatePlayer.css';

function CreatePlayer({
  setView, players, addPlayer, updatePlayer, deletePlayer,
  folders, addFolder, deleteFolder, addPlayerToFolder, removePlayerFromFolder,
  ownerPlayer, t
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
  const [showOwnerDeleteAlert, setShowOwnerDeleteAlert] = useState(false);

  const skillList = [
    { key: 'velocidad', label: t.skills.velocidad, value: velocidad, setter: setVelocidad },
    { key: 'defensa',   label: t.skills.defensa,   value: defensa,   setter: setDefensa   },
    { key: 'pase',      label: t.skills.pase,       value: pase,      setter: setPase      },
    { key: 'gambeta',   label: t.skills.gambeta,    value: gambeta,   setter: setGambeta   },
    { key: 'pegada',    label: t.skills.pegada,     value: pegada,    setter: setPegada    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError(t.errorEmptyName); return; }
    if (editingPlayer) {
      if (editingPlayer.name !== name && players.some(p => p.name === name)) {
        setError(t.errorDuplicateName); return;
      }
      updatePlayer({ ...editingPlayer, name, velocidad, defensa, pase, gambeta, pegada });
      setEditingPlayer(null);
    } else {
      if (players.some(p => p.name === name)) { setError(t.errorDuplicateName); return; }
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

  const handleDeletePlayer = (player) => {
    if (player.isOwner) { setShowOwnerDeleteAlert(true); return; }
    deletePlayer(player.name);
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
    if (folder.players.includes(playerName)) removePlayerFromFolder(folderName, playerName);
    else addPlayerToFolder(folderName, playerName);
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

  const skillKeys = [
    { icon: '⚡', key: 'velocidad' }, { icon: '🛡️', key: 'defensa' },
    { icon: '🎯', key: 'pase' }, { icon: '🎪', key: 'gambeta' }, { icon: '💥', key: 'pegada' },
  ];

  return (
    <div className="create-player">
      <div className="container">

        {showOwnerDeleteAlert && (
          <div className="owner-alert-overlay" onClick={() => setShowOwnerDeleteAlert(false)}>
            <div className="owner-alert-box" onClick={e => e.stopPropagation()}>
              <div className="owner-alert-icon">🤦</div>
              <h3>{t.ownerDeleteTitle}</h3>
              <p>{t.ownerDeleteText}</p>
              <button className="btn-primary" onClick={() => setShowOwnerDeleteAlert(false)}>
                {t.ownerDeleteClose}
              </button>
            </div>
          </div>
        )}

        <div className="header-section">
          <button className="btn-back" onClick={() => setView('home')}>{t.back}</button>
          <h2>{t.managePlayersTitle}</h2>
        </div>

        {/* Form */}
        <div className="player-form-container">
          <form onSubmit={handleSubmit} className="player-form">
            <h3>{editingPlayer ? t.editPlayer : t.createNewPlayer}</h3>
            {error && <div className="error-message">{error}</div>}
            <div className="form-group">
              <label>{t.playerName}</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder={t.playerNamePlaceholder}
                disabled={editingPlayer?.isOwner} />
            </div>
            <div className="skills-grid">
              {skillList.map(skill => (
                <div key={skill.key} className="skill-item">
                  <div className="skill-header">
                    <label>{skill.label}</label>
                    <span className="skill-value">{skill.value}</span>
                  </div>
                  <input type="range" min="1" max="10" value={skill.value}
                    onChange={(e) => skill.setter(Number(e.target.value))} />
                </div>
              ))}
            </div>
            <div className="total-rating">
              <span>{t.total}:</span>
              <span className="total-value">{getTotal()}/50</span>
            </div>
            <div className="form-actions">
              {editingPlayer && (
                <button type="button" className="btn-secondary" onClick={handleCancelEdit}>{t.cancel}</button>
              )}
              <button type="submit" className="btn-primary">
                {editingPlayer ? t.updateBtn : t.createBtn}
              </button>
            </div>
          </form>
        </div>

        {/* Folders */}
        <div className="folders-section">
          <div className="folders-header">
            <h3>{t.folders}</h3>
            <button className="btn-primary btn-small" onClick={() => setShowFolderInput(!showFolderInput)}>
              {t.newFolder}
            </button>
          </div>
          {showFolderInput && (
            <div className="folder-input-container">
              <input type="text" value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder={t.folderNamePlaceholder}
                onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()} />
              <button className="btn-primary btn-small" onClick={handleAddFolder}>{t.save}</button>
            </div>
          )}
          <div className="folder-filters">
            <button className={`folder-filter ${selectedFolder === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedFolder('all')}>
              {t.allPlayers} ({players.length})
            </button>
            {folders.map(folder => (
              <div key={folder.name} className="folder-filter-item">
                <button className={`folder-filter ${selectedFolder === folder.name ? 'active' : ''}`}
                  onClick={() => setSelectedFolder(folder.name)}>
                  📁 {folder.name} ({folder.players.length})
                </button>
                <button className="btn-delete-folder" onClick={() => deleteFolder(folder.name)}>×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Players list */}
        <div className="players-list-section">
          <h3>{t.createdPlayers} ({getFilteredPlayers().length})</h3>
          {getFilteredPlayers().length === 0 ? (
            <div className="empty-state">
              <p>{selectedFolder !== 'all' ? t.noPlayersFolder : t.noPlayers}</p>
            </div>
          ) : (
            <div className="players-grid">
              {getFilteredPlayers().map(player => {
                const isExpanded = expandedPlayers[player.name];
                return (
                  <div key={player.name} className={`player-card ${isExpanded ? 'expanded' : ''} ${player.isOwner ? 'owner-card' : ''}`}>
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
                    {isExpanded && (
                      <div className="player-card-details">
                        <div className="player-skills-compact">
                          {skillKeys.map(s => (
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
                                <input type="checkbox"
                                  checked={folder.players.includes(player.name)}
                                  onChange={() => handlePlayerFolderToggle(player.name, folder.name)} />
                                <span>{folder.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        <div className="player-actions">
                          <button className="btn-edit" onClick={() => handleEdit(player)}>{t.editBtn}</button>
                          <button className="btn-delete" onClick={() => handleDeletePlayer(player)}>{t.deleteBtn}</button>
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
