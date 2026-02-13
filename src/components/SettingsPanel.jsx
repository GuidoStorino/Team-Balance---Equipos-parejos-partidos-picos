import { useState } from 'react';
import './SettingsPanel.css';
import { deleteMediaFiles } from '../mediaDB';

const LANGUAGES = [
  { code: 'es', label: 'Español', flag: '🇦🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
];

const TEAM_COLOR_OPTIONS = [
  { value: '#ffd700', label: '🟡' },
  { value: '#ff6b35', label: '🟠' },
  { value: '#e63946', label: '🔴' },
  { value: '#4caf50', label: '🟢' },
  { value: '#2196f3', label: '🔵' },
  { value: '#9c27b0', label: '🟣' },
  { value: '#ffffff', label: '⚪' },
  { value: '#1a1a1a', label: '⚫' },
];

const BALANCE_MODES = (t) => [
  { value: 'total', label: t.balanceModeTotal },
  { value: 'defense', label: t.balanceModeDefense },
  { value: 'attack', label: t.balanceModeAttack },
];

function SettingsPanel({ isOpen, onClose, settings, onSettingsChange, ownerPlayer, players, matches, onRenameOwner, onResetApp, t }) {
  const [newName, setNewName] = useState('');
  const [nameMsg, setNameMsg] = useState('');
  const [nameMsgType, setNameMsgType] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeSection, setActiveSection] = useState('general');

  if (!isOpen) return null;

  if (!isOpen) return null;

  const handleLangChange = (code) => {
    onSettingsChange({ ...settings, lang: code });
  };

  const handleTeam1Color = (color) => onSettingsChange({ ...settings, team1Color: color });
  const handleTeam2Color = (color) => onSettingsChange({ ...settings, team2Color: color });
  const handleFunnyNames = () => onSettingsChange({ ...settings, funnyNames: !settings.funnyNames });
  const handleBalanceMode = (mode) => onSettingsChange({ ...settings, balanceMode: mode });

  const handleRename = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (players.some(p => p.name === trimmed && !p.isOwner)) {
      setNameMsg(t.usernameError);
      setNameMsgType('error');
      return;
    }
    onRenameOwner(trimmed);
    setNewName('');
    setNameMsg(t.usernameSuccess);
    setNameMsgType('success');
    setTimeout(() => setNameMsg(''), 3000);
  };

  const handleExport = () => {
    const data = { players, matches, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-balance-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = async () => {
    // Clean up all media from IndexedDB
    const allMediaIds = matches.flatMap(m => (m.media || []).map(med => med.id));
    if (allMediaIds.length > 0) {
      try { await deleteMediaFiles(allMediaIds); } catch (e) { /* continue anyway */ }
    }
    onResetApp();
    setShowResetConfirm(false);
    onClose();
  };

  const matchLabel = { es: 'Partido', en: 'Match', it: 'Partita', pt: 'Partida' }[settings.lang] || 'Partido';
  const dataLabel  = { es: 'Datos',   en: 'Data',  it: 'Dati',    pt: 'Dados'  }[settings.lang] || 'Datos';

  const sections = [
    { id: 'general', icon: '🌐', label: t.language },
    { id: 'profile', icon: '👤', label: ownerPlayer?.name || 'Perfil' },
    { id: 'match',   icon: '⚽', label: matchLabel },
    { id: 'data',    icon: '💾', label: dataLabel  },
  ];

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h3>{t.settings} ⚙️</h3>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        {/* Section tabs */}
        <div className="settings-tabs">
          {sections.map(s => (
            <button
              key={s.id}
              className={`settings-tab ${activeSection === s.id ? 'active' : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-body">

          {/* GENERAL — Language */}
          {activeSection === 'general' && (
            <div className="settings-section">
              <div className="settings-row-label">{t.language}</div>
              <div className="lang-options">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    className={`lang-btn ${settings.lang === lang.code ? 'active' : ''}`}
                    onClick={() => handleLangChange(lang.code)}
                  >
                    <span className="lang-flag">{lang.flag}</span>
                    <span className="lang-label">{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PROFILE — Rename */}
          {activeSection === 'profile' && (
            <div className="settings-section">
              <div className="settings-row-label">{t.username}</div>
              {ownerPlayer && (
                <div className="current-name-display">
                  👑 {ownerPlayer.name}
                </div>
              )}
              <div className="rename-row">
                <input
                  type="text"
                  value={newName}
                  onChange={e => { setNewName(e.target.value); setNameMsg(''); }}
                  placeholder={t.usernamePlaceholder}
                  onKeyDown={e => e.key === 'Enter' && handleRename()}
                />
                <button className="btn-settings-action" onClick={handleRename}>
                  {t.usernameChange}
                </button>
              </div>
              {nameMsg && (
                <div className={`name-msg ${nameMsgType}`}>{nameMsg}</div>
              )}
            </div>
          )}

          {/* MATCH — Team colors, funny names, balance mode */}
          {activeSection === 'match' && (
            <div className="settings-section">
              {/* Funny names toggle */}
              <div className="settings-row">
                <div className="settings-row-left">
                  <div className="settings-row-label">{t.funnyNames}</div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={settings.funnyNames} onChange={handleFunnyNames} />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* Balance mode */}
              <div className="settings-row-label" style={{marginTop: '20px'}}>{t.balanceMode}</div>
              <div className="balance-mode-options">
                {BALANCE_MODES(t).map(mode => (
                  <button
                    key={mode.value}
                    className={`balance-btn ${settings.balanceMode === mode.value ? 'active' : ''}`}
                    onClick={() => handleBalanceMode(mode.value)}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Team colors */}
              <div className="settings-row-label" style={{marginTop: '20px'}}>{t.teamColors}</div>
              <div className="color-picker-group">
                <div className="color-picker-label">{t.team1Color}</div>
                <div className="color-options">
                  {TEAM_COLOR_OPTIONS.map(c => (
                    <button
                      key={c.value}
                      className={`color-btn ${settings.team1Color === c.value ? 'active' : ''}`}
                      onClick={() => handleTeam1Color(c.value)}
                      style={{ '--swatch': c.value }}
                      title={c.value}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <div className="color-picker-label" style={{marginTop: '10px'}}>{t.team2Color}</div>
                <div className="color-options">
                  {TEAM_COLOR_OPTIONS.map(c => (
                    <button
                      key={c.value}
                      className={`color-btn ${settings.team2Color === c.value ? 'active' : ''}`}
                      onClick={() => handleTeam2Color(c.value)}
                      style={{ '--swatch': c.value }}
                      title={c.value}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DATA — Export + Reset */}
          {activeSection === 'data' && (
            <div className="settings-section">
              <div className="settings-row-label">{t.exportData}</div>
              <button className="btn-settings-action btn-export" onClick={handleExport}>
                {t.exportBtn}
              </button>

              <div className="settings-divider" />

              <div className="settings-row-label danger-label">{t.resetApp}</div>

              {!showResetConfirm ? (
                <button className="btn-settings-reset" onClick={() => setShowResetConfirm(true)}>
                  {t.resetBtn}
                </button>
              ) : (
                <div className="reset-confirm-box">
                  <p className="reset-confirm-title">⚠️ {t.resetConfirmTitle}</p>
                  <p className="reset-confirm-text">{t.resetConfirmText}</p>
                  <div className="reset-confirm-actions">
                    <button className="btn-settings-cancel" onClick={() => setShowResetConfirm(false)}>
                      {t.resetCancelBtn}
                    </button>
                    <button className="btn-settings-confirm-reset" onClick={handleReset}>
                      {t.resetConfirmBtn}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
