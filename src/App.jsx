import { useState, useEffect } from 'react';
import './App.css';
import Home from './components/Home';
import CreatePlayer from './components/CreatePlayer';
import CreateMatch from './components/CreateMatch';
import Teams from './components/Teams';
import MatchHistory from './components/MatchHistory';
import OnboardingModal from './components/OnboardingModal';

function App() {
  const [view, setView] = useState('home');
  const [players, setPlayers] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentTeams, setCurrentTeams] = useState(null);
  const [matches, setMatches] = useState([]);
  const [pendingMatches, setPendingMatches] = useState([]);
  const [ownerPlayer, setOwnerPlayer] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const savedPlayers = localStorage.getItem('teamBalancePlayers');
    const savedFolders = localStorage.getItem('teamBalanceFolders');
    const savedMatches = localStorage.getItem('teamBalanceMatches');
    const savedPending = localStorage.getItem('teamBalancePending');
    const savedOwner = localStorage.getItem('teamBalanceOwner');
    const onboardingDone = localStorage.getItem('teamBalanceOnboarding');

    if (savedPlayers) setPlayers(JSON.parse(savedPlayers));
    if (savedFolders) setFolders(JSON.parse(savedFolders));
    if (savedMatches) setMatches(JSON.parse(savedMatches));
    if (savedPending) setPendingMatches(JSON.parse(savedPending));
    if (savedOwner) setOwnerPlayer(JSON.parse(savedOwner));
    if (!onboardingDone) setShowOnboarding(true);
  }, []);

  useEffect(() => { localStorage.setItem('teamBalancePlayers', JSON.stringify(players)); }, [players]);
  useEffect(() => { localStorage.setItem('teamBalanceFolders', JSON.stringify(folders)); }, [folders]);
  useEffect(() => { localStorage.setItem('teamBalanceMatches', JSON.stringify(matches)); }, [matches]);
  useEffect(() => { localStorage.setItem('teamBalancePending', JSON.stringify(pendingMatches)); }, [pendingMatches]);
  useEffect(() => { if (ownerPlayer) localStorage.setItem('teamBalanceOwner', JSON.stringify(ownerPlayer)); }, [ownerPlayer]);

  const handleOnboardingComplete = (playerData) => {
    const ownerData = { ...playerData, isOwner: true };
    setOwnerPlayer(ownerData);
    setPlayers(prev => [...prev, ownerData]);
    localStorage.setItem('teamBalanceOnboarding', 'done');
    setShowOnboarding(false);
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

  const renderView = () => {
    switch (view) {
      case 'home':
        return <Home setView={setView} pendingMatches={pendingMatches} ownerPlayer={ownerPlayer} />;
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
          />
        );
      case 'create-match':
        return (
          <CreateMatch
            setView={setView}
            players={players}
            folders={folders}
            createTeams={createTeams}
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
          />
        );
      case 'history':
        return (
          <MatchHistory
            setView={setView}
            matches={matches}
            deleteMatch={deleteMatch}
            ownerPlayer={ownerPlayer}
            pendingMatches={pendingMatches}
            deletePendingMatch={deletePendingMatch}
            resumePendingMatch={resumePendingMatch}
          />
        );
      default:
        return <Home setView={setView} pendingMatches={pendingMatches} ownerPlayer={ownerPlayer} />;
    }
  };

  return (
    <div className="app">
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}
      {renderView()}
    </div>
  );
}

export default App;
