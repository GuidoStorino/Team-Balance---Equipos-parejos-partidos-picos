import { useState, useEffect } from 'react';
import './App.css';
import Home from './components/Home';
import CreatePlayer from './components/CreatePlayer';
import ManageTeams from './components/ManageTeams';
import CreateMatch from './components/CreateMatch';
import Teams from './components/Teams';
import MatchHistory from './components/MatchHistory';
import OnboardingModal from './components/OnboardingModal';
import SettingsPanel from './components/SettingsPanel';
import './components/SettingsPanel.css';
import { useT } from './translations';

const DEFAULT_SETTINGS = {
  lang: 'es',
  funnyNames: true,
  balanceMode: 'total', // 'total' | 'defense' | 'attack'
  team1Color: '#ffd700',
  team2Color: '#ff6b35',
};

function App() {
  const [view, setView] = useState('home');
  const [players, setPlayers] = useState([]);
  const [folders, setFolders] = useState([]);
  const [savedTeams, setSavedTeams] = useState([]);
  const [currentTeams, setCurrentTeams] = useState(null);
  const [matches, setMatches] = useState([]);
  const [pendingMatches, setPendingMatches] = useState([]);
  const [ownerPlayer, setOwnerPlayer] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const t = useT(settings.lang);

  useEffect(() => {
    const savedPlayers = localStorage.getItem('teamBalancePlayers');
    const savedFolders = localStorage.getItem('teamBalanceFolders');
    const savedTeamsData = localStorage.getItem('teamBalanceSavedTeams');
    const savedMatches = localStorage.getItem('teamBalanceMatches');
    const savedPending = localStorage.getItem('teamBalancePending');
    const savedOwner = localStorage.getItem('teamBalanceOwner');
    const savedSettings = localStorage.getItem('teamBalanceSettings');
    const onboardingDone = localStorage.getItem('teamBalanceOnboarding');

    if (savedPlayers) setPlayers(JSON.parse(savedPlayers));
    if (savedFolders) setFolders(JSON.parse(savedFolders));
    if (savedTeamsData) setSavedTeams(JSON.parse(savedTeamsData));
    if (savedMatches) setMatches(JSON.parse(savedMatches));
    if (savedPending) setPendingMatches(JSON.parse(savedPending));
    if (savedOwner) setOwnerPlayer(JSON.parse(savedOwner));
    if (savedSettings) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
    if (!onboardingDone) setShowOnboarding(true);
  }, []);

  useEffect(() => { localStorage.setItem('teamBalancePlayers', JSON.stringify(players)); }, [players]);
  useEffect(() => { localStorage.setItem('teamBalanceFolders', JSON.stringify(folders)); }, [folders]);
  useEffect(() => { localStorage.setItem('teamBalanceSavedTeams', JSON.stringify(savedTeams)); }, [savedTeams]);
  useEffect(() => { localStorage.setItem('teamBalanceMatches', JSON.stringify(matches)); }, [matches]);
  useEffect(() => { localStorage.setItem('teamBalancePending', JSON.stringify(pendingMatches)); }, [pendingMatches]);
  useEffect(() => { if (ownerPlayer) localStorage.setItem('teamBalanceOwner', JSON.stringify(ownerPlayer)); }, [ownerPlayer]);
  useEffect(() => { localStorage.setItem('teamBalanceSettings', JSON.stringify(settings)); }, [settings]);

  const handleOnboardingComplete = (playerData) => {
    const ownerData = { ...playerData, isOwner: true };
    setOwnerPlayer(ownerData);
    setPlayers(prev => [...prev, ownerData]);
    localStorage.setItem('teamBalanceOnboarding', 'done');
    setShowOnboarding(false);
  };

  const handleRenameOwner = (newName) => {
    if (!ownerPlayer) return;
    const oldName = ownerPlayer.name;
    const updated = { ...ownerPlayer, name: newName };
    setOwnerPlayer(updated);
    localStorage.setItem('teamBalanceOwner', JSON.stringify(updated));
    setPlayers(prev => prev.map(p => p.isOwner ? { ...p, name: newName } : p));
    // Update folders that reference old name
    setFolders(prev => prev.map(folder => ({
      ...folder,
      players: folder.players.map(n => n === oldName ? newName : n)
    })));
  };

  const handleSettingsChange = (newSettings) => setSettings(newSettings);

  const handleResetApp = () => {
    localStorage.clear();
    setPlayers([]);
    setFolders([]);
    setMatches([]);
    setPendingMatches([]);
    setOwnerPlayer(null);
    setCurrentTeams(null);
    setSettings(DEFAULT_SETTINGS);
    setView('home');
    setShowOnboarding(true);
  };

  const addPlayer = (player) => setPlayers([...players, player]);

  const updatePlayer = (updatedPlayer) => {
    setPlayers(players.map(p => p.name === updatedPlayer.name ? updatedPlayer : p));
    if (ownerPlayer && updatedPlayer.name === ownerPlayer.name) {
      setOwnerPlayer({ ...updatedPlayer, isOwner: true });
      localStorage.setItem('teamBalanceOwner', JSON.stringify({ ...updatedPlayer, isOwner: true }));
    }
  };

  const deletePlayer = (playerName) => {
    setPlayers(players.filter(p => p.name !== playerName));
    setFolders(folders.map(folder => ({
      ...folder,
      players: folder.players.filter(name => name !== playerName)
    })));
  };

  const addFolder = (folderName) => {
    if (!folders.find(f => f.name === folderName)) {
      setFolders([...folders, { name: folderName, players: [] }]);
    }
  };

  const deleteFolder = (folderName) => setFolders(folders.filter(f => f.name !== folderName));

  const addPlayerToFolder = (folderName, playerName) => {
    setFolders(folders.map(folder => {
      if (folder.name === folderName && !folder.players.includes(playerName)) {
        return { ...folder, players: [...folder.players, playerName] };
      }
      return folder;
    }));
  };

  const removePlayerFromFolder = (folderName, playerName) => {
    setFolders(folders.map(folder => {
      if (folder.name === folderName) {
        return { ...folder, players: folder.players.filter(p => p !== playerName) };
      }
      return folder;
    }));
  };

  // Saved Teams CRUD
  const addSavedTeam = (team) => setSavedTeams([...savedTeams, team]);
  const updateSavedTeam = (updatedTeam) => setSavedTeams(savedTeams.map(t => t.id === updatedTeam.id ? updatedTeam : t));
  const deleteSavedTeam = (teamId) => setSavedTeams(savedTeams.filter(t => t.id !== teamId));

  const createTeams = (teamsData) => setCurrentTeams(teamsData);

  const saveMatch = (matchData) => {
    setMatches([...matches, matchData]);
    if (matchData.pendingId) {
      setPendingMatches(pendingMatches.filter(p => p.id !== matchData.pendingId));
    }
  };

  const savePendingMatch = (teamsData) => {
    const pendingMatch = {
      id: Date.now(),
      date: new Date().toISOString(),
      team1Name: teamsData.team1Name,
      team2Name: teamsData.team2Name,
      team1: teamsData.team1,
      team2: teamsData.team2,
    };
    setPendingMatches([...pendingMatches, pendingMatch]);
    setCurrentTeams(null);
  };

  const deletePendingMatch = (id) => setPendingMatches(pendingMatches.filter(p => p.id !== id));

  const resumePendingMatch = (pending) => {
    setCurrentTeams({
      team1: pending.team1,
      team2: pending.team2,
      team1Name: pending.team1Name,
      team2Name: pending.team2Name,
      pendingId: pending.id,
    });
    setView('teams');
  };

  const deleteMatch = (matchId) => setMatches(matches.filter(m => m.id !== matchId));
  const clearCurrentTeams = () => setCurrentTeams(null);

  const sharedProps = { t, settings };

  const renderView = () => {
    switch (view) {
      case 'home':
        return <Home setView={setView} pendingMatches={pendingMatches} ownerPlayer={ownerPlayer} t={t} />;
      case 'create-player':
        return (
          <CreatePlayer
            setView={setView}
            players={players}
            addPlayer={addPlayer}
            updatePlayer={updatePlayer}
            deletePlayer={deletePlayer}
            folders={folders}
            addFolder={addFolder}
            deleteFolder={deleteFolder}
            addPlayerToFolder={addPlayerToFolder}
            removePlayerFromFolder={removePlayerFromFolder}
            ownerPlayer={ownerPlayer}
            t={t}
          />
        );
      case 'manage-teams':
        return (
          <ManageTeams
            setView={setView}
            savedTeams={savedTeams}
            addSavedTeam={addSavedTeam}
            updateSavedTeam={updateSavedTeam}
            deleteSavedTeam={deleteSavedTeam}
            players={players}
            t={t}
          />
        );
      case 'create-match':
        return (
          <CreateMatch
            setView={setView}
            players={players}
            folders={folders}
            savedTeams={savedTeams}
            createTeams={createTeams}
            settings={settings}
            t={t}
          />
        );
      case 'teams':
        return (
          <Teams
            setView={setView}
            teams={currentTeams}
            clearCurrentTeams={clearCurrentTeams}
            saveMatch={saveMatch}
            savePendingMatch={savePendingMatch}
            settings={settings}
            t={t}
          />
        );
      case 'history':
        return (
          <MatchHistory
            setView={setView}
            matches={matches}
            deleteMatch={deleteMatch}
            saveMatch={saveMatch}
            ownerPlayer={ownerPlayer}
            pendingMatches={pendingMatches}
            deletePendingMatch={deletePendingMatch}
            resumePendingMatch={resumePendingMatch}
            t={t}
          />
        );
      default:
        return <Home setView={setView} pendingMatches={pendingMatches} ownerPlayer={ownerPlayer} t={t} />;
    }
  };

  return (
    <div className="app">
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} t={t} />}
      {renderView()}

      {/* Settings FAB */}
      {!showOnboarding && (
        <>
          <button
            className={`settings-fab ${settingsOpen ? 'open' : ''}`}
            onClick={() => setSettingsOpen(!settingsOpen)}
            title={t.settings}
          >
            ⚙️
          </button>
          <SettingsPanel
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            settings={settings}
            onSettingsChange={handleSettingsChange}
            ownerPlayer={ownerPlayer}
            players={players}
            matches={matches}
            onRenameOwner={handleRenameOwner}
            onResetApp={handleResetApp}
            t={t}
          />
        </>
      )}
    </div>
  );
}

export default App;
