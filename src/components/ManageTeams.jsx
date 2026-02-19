import { useState } from 'react';
import './ManageTeams.css';

const TEAM_COLORS = [
  '#ffd700', '#ff6b35', '#e63946', '#4caf50',
  '#2196f3', '#9c27b0', '#ff5722', '#00bcd4',
];

function ManageTeams({ setView, savedTeams, addSavedTeam, updateSavedTeam, deleteSavedTeam, players, t }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(TEAM_COLORS[0]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [editingTeam, setEditingTeam] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError(t.errorTeamNameEmpty); return; }
    if (selectedPlayers.length === 0) { setError(t.errorNoPlayers); return; }

    if (editingTeam) {
      updateSavedTeam({ ...editingTeam, name: name.trim(), color, playerNames: selectedPlayers });
      setEditingTeam(null);
    } else {
      addSavedTeam({ id: Date.now(), name: name.trim(), color, playerNames: selectedPlayers });
    }
    resetForm();
  };

  const resetForm = () => {
    setName(''); setColor(TEAM_COLORS[0]); setSelectedPlayers([]); setError('');
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    setName(team.name);
    setColor(team.color);
    setSelectedPlayers([...team.playerNames]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTeam(null);
    resetForm();
  };

  const togglePlayer = (playerName) => {
    if (selectedPlayers.includes(playerName)) {
      setSelectedPlayers(selectedPlayers.filter(p => p !== playerName));
    } else {
      setSelectedPlayers([...selectedPlayers, playerName]);
    }
  };

  return (
    <div className="manage-teams">
      <div className="container">
        <div className="header-section">
          <button className="btn-back" onClick={() => setView('home')}>{t.back}</button>
          <h2>{t.manageTeams}</h2>
        </div>

        {/* Form */}
        <div className="team-form-container">
          <form onSubmit={handleSubmit} className="team-form">
            <h3>{editingTeam ? t.editTeam : t.createNewTeam}</h3>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>{t.teamName}</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder={t.teamNamePlaceholder} />
            </div>

            <div className="form-group">
              <label>{t.teamColor}</label>
              <div className="color-selector">
                {TEAM_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`color-option ${color === c ? 'selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>{t.teamPlayers} ({selectedPlayers.length})</label>
              <div className="players-checklist">
                {players.map(player => (
                  <label key={player.name} className="player-check-item">
                    <input
                      type="checkbox"
                      checked={selectedPlayers.includes(player.name)}
                      onChange={() => togglePlayer(player.name)}
                    />
                    <span>{player.isOwner && '👑 '}{player.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-actions">
              {editingTeam && (
                <button type="button" className="btn-secondary" onClick={handleCancelEdit}>{t.cancel}</button>
              )}
              <button type="submit" className="btn-primary">
                {editingTeam ? t.updateTeam : t.createTeam}
              </button>
            </div>
          </form>
        </div>

        {/* Teams list */}
        <div className="teams-list-section">
          <h3>{t.savedTeams} ({savedTeams.length})</h3>
          {savedTeams.length === 0 ? (
            <div className="empty-state">
              <p>{t.noTeamsYet}</p>
            </div>
          ) : (
            <div className="teams-grid">
              {savedTeams.map(team => (
                <div key={team.id} className="team-card" style={{ borderLeftColor: team.color }}>
                  <div className="team-card-header">
                    <div className="team-color-badge" style={{ background: team.color }} />
                    <h4>{team.name}</h4>
                  </div>
                  <div className="team-card-players">
                    <span className="players-count">👥 {team.playerNames.length} {t.playersCount}</span>
                    <div className="players-preview">
                      {team.playerNames.slice(0, 3).join(', ')}
                      {team.playerNames.length > 3 && ` +${team.playerNames.length - 3}`}
                    </div>
                  </div>
                  <div className="team-card-actions">
                    <button className="btn-edit" onClick={() => handleEdit(team)}>✏️ {t.editBtn}</button>
                    <button className="btn-delete" onClick={() => deleteSavedTeam(team.id)}>🗑️ {t.deleteBtn}</button>
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

export default ManageTeams;
