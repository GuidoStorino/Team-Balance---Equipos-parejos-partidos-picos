import './Home.css';

function Home({ setView, pendingMatches, ownerPlayer }) {
  return (
    <div className="home">
      <div className="home-container">
        <div className="home-header">
          <div className="logo-container">
            <div className="soccer-ball">⚽</div>
            <h1>Team Balance</h1>
          </div>
          {ownerPlayer && (
            <p className="welcome-tag">Hola, <strong>{ownerPlayer.name}</strong> 👋</p>
          )}
          <p className="tagline">Equipos Parejos, Partidos Épicos</p>
        </div>

        <div className="home-actions">
          <button
            className="home-btn btn-create-player"
            onClick={() => setView('create-player')}
          >
            <span className="btn-icon">👤</span>
            <span className="btn-text">Crear Jugador</span>
          </button>

          <button
            className="home-btn btn-create-match"
            onClick={() => setView('create-match')}
          >
            <span className="btn-icon">⚡</span>
            <span className="btn-text">Armar Partido</span>
          </button>

          <button
            className="home-btn btn-history"
            onClick={() => setView('history')}
          >
            <span className="btn-icon">📋</span>
            <span className="btn-text">
              Historial
              {pendingMatches && pendingMatches.length > 0 && (
                <span className="pending-badge">{pendingMatches.length} pendiente{pendingMatches.length > 1 ? 's' : ''}</span>
              )}
            </span>
          </button>
        </div>

        <div className="home-footer">
          <div className="footer-decoration">
            <div className="grass-line"></div>
            <div className="grass-line"></div>
            <div className="grass-line"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
