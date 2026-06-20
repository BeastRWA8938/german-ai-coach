import React from 'react';

export default function Navbar({ currentLevel, onLevelChange, syncStatus, onOpenSettings }) {
  return (
    <header className="app-navbar">
      <div className="navbar-brand">
        <div className="brand-logo-svg">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="brand-icon"><path d="m12 3-1.912 5.886H3.82l4.982 3.62L6.89 18.39 12 14.77l5.11 3.62-1.912-5.884 4.982-3.62h-6.268Z"/></svg>
        </div>
        <div className="brand-text">
          <h1>ProjektDeutsch AI</h1>
          <p className="brand-subtitle">Your Smart German Learning Coach</p>
        </div>
      </div>

      <div className="navbar-actions">
        <div className="level-selector-wrapper">
          <label htmlFor="level-select">CEFR Level:</label>
          <select 
            id="level-select"
            value={currentLevel} 
            onChange={(e) => onLevelChange(e.target.value)}
            className="level-select"
          >
            <option value="A1">A1: Beginner</option>
            <option value="A2">A2: Elementary</option>
            <option value="B1">B1: Intermediate</option>
            <option value="B2">B2: Upper Intermediate</option>
          </select>
        </div>

        <button 
          onClick={onOpenSettings} 
          className="navbar-btn settings-btn"
          aria-label="Open Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          Settings
        </button>

        <div className={`sync-badge ${syncStatus === 'coming_soon' ? 'coming-soon' : 'local'}`}>
          <span className="sync-dot"></span>
          {syncStatus === 'coming_soon' ? 'G-Drive (Coming Soon)' : 'Local Only'}
        </div>
      </div>
    </header>
  );
}
