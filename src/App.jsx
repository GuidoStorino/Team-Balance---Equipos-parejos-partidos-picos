import { useState, useEffect } from 'react';
import './App.css';
import Home from './components/Home';
import CreatePlayer from './components/CreatePlayer';
import CreateMatch from './components/CreateMatch';
import Teams from './components/Teams';
import MatchHistory from './components/MatchHistory';

function App() {
  const [view, setView] = useState('home');
  const [players, setPlayers] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentTeams, setCurrentTeams] = useState(null);
  const [matches, setMatches] = useState([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedPlayers = localStorage.getItem('teamBalancePlayers');
    const savedFolders = localStorage.getItem('teamBalanceFolders');
    const savedMatches = localStorage.getItem('teamBalanceMatches');
    
    if (savedPlayers) setPlayers(JSON.parse(savedPlayers));
    if (savedFolders) setFolders(JSON.parse(savedFolders));
    if (savedMatches) setMatches(JSON.parse(savedMatches));
  }, []);

  // Save players to localStorage
  useEffect(() => {
    localStorage.setItem('teamBalancePlayers', JSON.stringify(players));
  }, [players]);

  // Save folders to localStorage
  useEffect(() => {
    localStorage.setItem('teamBalanceFolders', JSON.stringify(folders));
  }, [folders]);

  // Save matches to localStorage
  useEffect(() => {
    localStorage.setItem('teamBalanceMatches', JSON.stringify(matches));
  }, [matches]);

  const addPlayer = (player) => {
    setPlayers([...players, player]);
  };

  const updatePlayer = (updatedPlayer) => {
    setPlayers(players.map(p => p.name === updatedPlayer.name ? updatedPlayer : p));
  };

  const deletePlayer = (playerName) => {
    setPlayers(players.filter(p => p.name !== playerName));
    // Also remove from folders
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

  const deleteFolder = (folderName) => {
    setFolders(folders.filter(f => f.name !== folderName));
  };

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

  const createTeams = (selectedPlayers) => {
    setCurrentTeams(selectedPlayers);
  };

  const saveMatch = (matchData) => {
    setMatches([...matches, matchData]);
  };

  const deleteMatch = (matchId) => {
    setMatches(matches.filter(m => m.id !== matchId));
  };

  const clearCurrentTeams = () => {
    setCurrentTeams(null);
  };

  const renderView = () => {
    switch(view) {
      case 'home':
        return <Home setView={setView} />;
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
          />
        );
      case 'history':
        return (
          <MatchHistory 
            setView={setView}
            matches={matches}
            deleteMatch={deleteMatch}
          />
        );
      default:
        return <Home setView={setView} />;
    }
  };

  return (
    <div className="app">
      {renderView()}
    </div>
  );
}

export default App;
