import { useState } from 'react';
import './CreateMatch.css';

function CreateMatch({ setView, players, folders, savedTeams, createTeams, settings, t }) {
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [goalkeepers, setGoalkeepers] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [selectedTeams, setSelectedTeams] = useState([]); // IDs of selected teams
  const [error, setError] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickRating, setQuickRating] = useState(5);
  const [tempPlayers, setTempPlayers] = useState([]);

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
    const names = folder.players;
    const allSel = names.length > 0 && names.every(n => selectedPlayers.includes(n));
    if (allSel) {
      setSelectedPlayers(selectedPlayers.filter(n => !names.includes(n)));
      setGoalkeepers(goalkeepers.filter(g => !names.includes(g)));
    } else {
      const toAdd = names.filter(n => !selectedPlayers.includes(n));
      setSelectedPlayers([...selectedPlayers, ...toAdd]);
    }
  };

  const handleTeamToggle = (teamId) => {
    if (selectedTeams.includes(teamId)) {
      // Deselect team
      const team = savedTeams.find(t => t.id === teamId);
      if (team) {
        setSelectedPlayers(selectedPlayers.filter(n => !team.playerNames.includes(n)));
        setGoalkeepers(goalkeepers.filter(g => !team.playerNames.includes(g)));
      }
      setSelectedTeams(selectedTeams.filter(id => id !== teamId));
    } else {
      // Select team (max 2)
      if (selectedTeams.length >= 2) {
        setError(t.maxTeamsError);
        setTimeout(() => setError(''), 3000);
        return;
      }
      const team = savedTeams.find(t => t.id === teamId);
      if (team) {
        const toAdd = team.playerNames.filter(n => !selectedPlayers.includes(n));
        setSelectedPlayers([...selectedPlayers, ...toAdd]);
      }
      setSelectedTeams([...selectedTeams, teamId]);
    }
  };

  const handleGoalkeeperToggle = (playerName) => {
    if (!selectedPlayers.includes(playerName)) return;
    if (goalkeepers.includes(playerName)) {
      setGoalkeepers(goalkeepers.filter(g => g !== playerName));
    } else {
      if (goalkeepers.length >= 2) {
        setError(t.lang === 'es' ? 'Solo puede haber 2 arqueros como máximo'
          : t.lang === 'en' ? 'Maximum 2 goalkeepers allowed'
          : t.lang === 'it' ? 'Massimo 2 portieri consentiti'
          : 'Máximo 2 goleiros permitidos');
        setTimeout(() => setError(''), 3000);
        return;
      }
      setGoalkeepers([...goalkeepers, playerName]);
    }
  };

  const handleAddQuickPlayer = () => {
    if (!quickName.trim()) return;
    if (allAvailablePlayers.some(p => p.name === quickName.trim())) {
      setError(t.errorDuplicateName);
      setTimeout(() => setError(''), 3000);
      return;
    }
    const avg = quickRating;
    const tempPlayer = { name: quickName.trim(), velocidad: avg, defensa: avg, pase: avg, gambeta: avg, pegada: avg, isTemp: true };
    setTempPlayers([...tempPlayers, tempPlayer]);
    setSelectedPlayers([...selectedPlayers, tempPlayer.name]);
    setQuickName(''); setQuickRating(5); setShowQuickAdd(false);
  };

  const handleCreateTeams = () => {
    setError('');
    if (selectedPlayers.length === 0) { setError(t.noPlayers2); return; }
    if (selectedPlayers.length % 2 !== 0) { setError(t.oddCount); return; }
    const selectedPlayerObjects = allAvailablePlayers.filter(p => selectedPlayers.includes(p.name));
    const teams = balanceTeams(selectedPlayerObjects, goalkeepers);
    createTeams(teams);
    setView('teams');
  };

  const getSkillWeight = (player) => {
    const mode = settings?.balanceMode || 'total';
    if (mode === 'defense') {
      return player.defensa * 3 + player.velocidad + player.pase + player.gambeta + player.pegada;
    }
    if (mode === 'attack') {
      return player.pegada * 3 + player.gambeta * 2 + player.velocidad + player.pase + player.defensa;
    }
    return player.velocidad + player.defensa + player.pase + player.gambeta + player.pegada;
  };

  const balanceTeams = (playersToBalance, gks) => {
    // Separate players by team assignment
    const team1Selected = selectedTeams.length >= 1 ? savedTeams.find(t => t.id === selectedTeams[0]) : null;
    const team2Selected = selectedTeams.length >= 2 ? savedTeams.find(t => t.id === selectedTeams[1]) : null;

    const team1Base = team1Selected
      ? playersToBalance.filter(p => team1Selected.playerNames.includes(p.name))
      : [];
    const team2Base = team2Selected
      ? playersToBalance.filter(p => team2Selected.playerNames.includes(p.name))
      : [];

    const assignedNames = [...team1Base, ...team2Base].map(p => p.name);
    const unassigned = playersToBalance.filter(p => !assignedNames.includes(p.name));

    // Sort unassigned by skill weight
    const withRatings = unassigned.map(p => ({ ...p, total: getSkillWeight(p) })).sort((a, b) => b.total - a.total);

    // Distribute unassigned evenly
    const team1 = [...team1Base];
    const team2 = [...team2Base];

    // Balance GKs first
    const gkPlayers = withRatings.filter(p => gks.includes(p.name));
    const nonGKs = withRatings.filter(p => !gks.includes(p.name));

    if (gkPlayers.length >= 2) {
      team1.push(gkPlayers[0]);
      team2.push(gkPlayers[1]);
      gkPlayers.splice(0, 2);
    } else if (gkPlayers.length === 1) {
      if (team1.length <= team2.length) team1.push(gkPlayers[0]);
      else team2.push(gkPlayers[0]);
      gkPlayers.splice(0, 1);
    }

    // Distribute remaining (GKs + field players) by snake draft
    const remaining = [...gkPlayers, ...nonGKs];
    remaining.forEach((player, i) => {
      if (team1.length <= team2.length) team1.push(player);
      else team2.push(player);
    });

    return {
      team1,
      team2,
      goalkeepers: gks,
      team1Name: team1Selected?.name,
      team1Color: team1Selected?.color,
      team2Name: team2Selected?.name,
      team2Color: team2Selected?.color,
    };
  };

  const getPlayerTotal = (player) => player.velocidad + player.defensa + player.pase + player.gambeta + player.pegada;

  const statusText = selectedPlayers.length === 0 ? t.noPlayers2
    : selectedPlayers.length % 2 !== 0 ? t.oddCount : t.ready;

  if (players.length === 0 && tempPlayers.length === 0) {
    return (
      <div className="create-match">
        <div className="container">
          <div className="header-section">
            <button className="btn-back" onClick={() => setView('home')}>{t.back}</button>
            <h2>{t.buildMatchTitle}</h2>
          </div>
          <div className="empty-state-large">
            <div className="empty-icon">⚽</div>
            <h3>{t.noPlayersYet}</h3>
            <p>{t.noPlayersYetText}</p>
            <button className="btn-primary" onClick={() => setView('create-player')}>{t.createPlayersBtn}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-match">
      <div className="container">
        <div className="header-section">
          <button className="btn-back" onClick={() => setView('home')}>{t.back}</button>
          <h2
            className={`title-as-btn ${selectedPlayers.length > 0 && selectedPlayers.length % 2 === 0 ? 'title-ready' : 'title-disabled'}`}
            onClick={handleCreateTeams}
          >
            {t.buildMatchTitle} ⚽
          </h2>
        </div>

        <div className="match-info-panel">
          <div className="info-item">
            <span className="info-label">{t.selected}</span>
            <span className="info-value">{selectedPlayers.length}</span>
          </div>
          <div className="info-item">
            <span className="info-label">{t.goalkeepers}</span>
            <span className="info-value">{goalkeepers.length}/2</span>
          </div>
          <div className={`info-item ${selectedPlayers.length > 0 && selectedPlayers.length % 2 === 0 ? 'valid' : 'invalid'}`}>
            <span className="info-label">{t.status}</span>
            <span className="info-value">{statusText}</span>
          </div>
        </div>

        {error && <div className="error-message-large">{error}</div>}

        {/* Folder filters */}
        <div className="folder-selector">
          <label>{t.filterFolder}</label>
          <div className="folder-buttons">
            <button className={`folder-btn ${selectedFolder === 'all' ? 'active' : ''}`} onClick={() => setSelectedFolder('all')}>
              {t.allPlayers} ({allAvailablePlayers.length})
            </button>
            {folders.map(folder => {
              const isActive = selectedFolder === folder.name;
              const allSel = folder.players.length > 0 && folder.players.every(n => selectedPlayers.includes(n));
              return (
                <div key={folder.name} className="folder-btn-group">
                  <button className={`folder-btn ${isActive ? 'active' : ''}`} onClick={() => setSelectedFolder(folder.name)}>
                    📁 {folder.name} ({folder.players.length})
                  </button>
                  {isActive && folder.players.length > 0 && (
                    <button className={`folder-select-all-btn ${allSel ? 'all-selected' : ''}`}
                      onClick={() => handleSelectFolder(folder.name)}>
                      {allSel ? t.deselectAll : t.selectAll}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Teams selector */}
        {savedTeams.length > 0 && (
          <div className="teams-selector">
            <label>{t.savedTeamsLabel}</label>
            <div className="teams-buttons">
              {savedTeams.map(team => {
                const isSelected = selectedTeams.includes(team.id);
                return (
                  <button
                    key={team.id}
                    className={`team-btn ${isSelected ? 'active' : ''}`}
                    style={{ borderLeftColor: team.color }}
                    onClick={() => handleTeamToggle(team.id)}
                  >
                    <span className="team-color-dot" style={{ background: team.color }} />
                    {team.name} ({team.playerNames.length})
                  </button>
                );
              })}
            </div>
            {selectedTeams.length > 0 && (
              <div className="teams-hint">
                {selectedTeams.length === 1 && <span>{t.oneTeamHint}</span>}
                {selectedTeams.length === 2 && <span>{t.twoTeamsHint}</span>}
              </div>
            )}
          </div>
        )}

        {/* Quick add */}
        <div className="quick-add-section">
          <button className="btn-quick-add" onClick={() => setShowQuickAdd(!showQuickAdd)}>
            {t.quickPlayer}
          </button>
          {showQuickAdd && (
            <div className="quick-add-form">
              <input type="text" value={quickName} onChange={(e) => setQuickName(e.target.value)}
                placeholder={t.quickPlayerName}
                onKeyDown={(e) => e.key === 'Enter' && handleAddQuickPlayer()} />
              <div className="quick-rating">
                <label>{t.quickPlayerLevel}: <strong>{quickRating}</strong>/10</label>
                <input type="range" min="1" max="10" value={quickRating}
                  onChange={(e) => setQuickRating(Number(e.target.value))} />
              </div>
              <p className="quick-note">{t.quickPlayerNote}</p>
              <div className="quick-actions">
                <button className="btn-secondary btn-small" onClick={() => setShowQuickAdd(false)}>{t.cancel}</button>
                <button className="btn-primary btn-small" onClick={handleAddQuickPlayer}>{t.save}</button>
              </div>
            </div>
          )}
        </div>

        {/* Players grid */}
        <div className="players-selection">
          <h3>{t.buildMatchTitle}</h3>
          <div className="players-selection-grid">
            {getFilteredPlayers().map(player => {
              const isSelected = selectedPlayers.includes(player.name);
              const isGoalkeeper = goalkeepers.includes(player.name);
              return (
                <div key={player.name}
                  className={`player-selection-card ${isSelected ? 'selected' : ''} ${isGoalkeeper ? 'goalkeeper' : ''} ${player.isTemp ? 'temp-player' : ''}`}>
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
                        <div className="stat-bar"><div className="stat-fill" style={{ width: `${player[key] * 10}%` }}></div></div>
                      </div>
                    ))}
                  </div>
                  {isSelected && (
                    <div className="goalkeeper-toggle">
                      <label className="toggle-label">
                        <span>{t.goalkeeper}</span>
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
          <button className="btn-primary btn-large" onClick={handleCreateTeams}
            disabled={selectedPlayers.length === 0 || selectedPlayers.length % 2 !== 0}>
            {t.buildTeams}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateMatch;
