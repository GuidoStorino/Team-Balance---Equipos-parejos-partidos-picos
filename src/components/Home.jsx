import './Home.css';

function Home({ setView, pendingMatches, ownerPlayer, t }) {
  const count = pendingMatches?.length || 0;
  return (
    <div className="home">
      <div className="home-container">
        <div className="home-header">
          <div className="logo-container">
            <div className="soccer-ball">⚽</div>
            <h1>Team Balance</h1>
          </div>
          {ownerPlayer && (
            <p className="welcome-tag">{t.hello} <strong>{ownerPlayer.name}</strong> 👋</p>
          )}
          <p className="tagline">{t.tagline}</p>
        </div>

        <div className="home-actions">
          <button className="home-btn btn-create-player" onClick={() => setView('create-player')}>
            <span className="btn-icon">👤</span>
            <span className="btn-text">{t.createPlayer}</span>
          </button>
          <button className="home-btn btn-manage-teams" onClick={() => setView('manage-teams')}>
            <span className="btn-icon">🏆</span>
            <span className="btn-text">{t.manageTeams}</span>
          </button>
          <button className="home-btn btn-create-match" onClick={() => setView('create-match')}>
            <span className="btn-icon">⚡</span>
            <span className="btn-text">{t.buildMatch}</span>
          </button>
          <button className="home-btn btn-history" onClick={() => setView('history')}>
            <span className="btn-icon">📋</span>
            <span className="btn-text">
              {t.history}
              {count > 0 && (
                <span className="pending-badge">
                  {count} {count === 1 ? t.pending : t.pendingPlural}
                </span>
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
