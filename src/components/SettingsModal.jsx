import React, { useState } from 'react';
import X from 'lucide-react/dist/esm/icons/x';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import Key from 'lucide-react/dist/esm/icons/key';
import Database from 'lucide-react/dist/esm/icons/database';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Save from 'lucide-react/dist/esm/icons/save';

export default function SettingsModal({ isOpen, onClose, settings, onSaveSettings, onSyncNow }) {
  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState(settings.selectedModel || 'gemini-2.5-flash');
  const [syncEnabled, setSyncEnabled] = useState(settings.syncEnabled || false);

  const isInsecureConnection = typeof window !== 'undefined' &&
    window.location.protocol !== 'https:' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';

  if (!isOpen) return null;

  const handleEscKey = (e) => {
    if (e.key === 'Escape') onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings({
      apiKey,
      selectedModel,
      syncEnabled: false
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onKeyDown={handleEscKey} role="dialog" aria-modal="true" aria-label="Settings">
      <div className="modal-content glass-card animate-fade-in">
        <div className="modal-header">
          <h2 className="modal-title">
            <Database className="title-icon" /> Settings
          </h2>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* API Key Section */}
          <div className="settings-section">
            <h3>
              <Key size={16} /> Gemini API Integration (BYOK)
            </h3>
            <p className="settings-help-text">
              ProjektDeutsch AI runs entirely client-side. Your API key is stored locally in your browser and sent directly to Google Gemini.
            </p>
            <div className="form-group">
              <label htmlFor="api-key-input">Gemini API Key</label>
              <div className="input-with-icon">
                <input
                  id="api-key-input"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="settings-input"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="input-icon-btn"
                  title={showKey ? 'Hide Key' : 'Show Key'}
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <small className="form-tip">
                Don't have an API key? You can get one for free from the{' '}
                <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer">
                  Google AI Studio
                </a>.
              </small>
              {isInsecureConnection && apiKey && (
                <div className="settings-alert warning" style={{ marginTop: '12px' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    <strong>Security Warning:</strong> You are on an insecure HTTP connection. Storing your API key in browser memory over HTTP is vulnerable to exposure. We strongly recommend using <strong>HTTPS</strong>.
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="model-select">Gemini Model</label>
              <select
                id="model-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="settings-select"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast, Recommended)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Extremely Smart)</option>
              </select>
            </div>
          </div>

          {/* Sync Section */}
          <div className="settings-section">
            <h3>
              <Database size={16} /> Cloud Storage & Synchronization <span className="coming-soon-badge">Coming Soon</span>
            </h3>
            <p className="settings-help-text">
              Store your learning statistics and practice history in your own Google Drive.
            </p>
            <div className="sync-control">
              <label className="switch-label">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={(e) => setSyncEnabled(e.target.checked)}
                  className="sync-checkbox"
                  disabled
                />
                <span className="switch-text">Google Drive Sync <span style={{ opacity: 0.7, fontSize: '0.9em' }}>(Coming Soon)</span></span>
              </label>

              {syncEnabled && (
                <button
                  type="button"
                  onClick={onSyncNow}
                  className="navbar-btn sync-btn-now"
                  disabled
                >
                  <RefreshCw size={14} className="spin-on-sync" />
                  Sync Now (Coming Soon)
                </button>
              )}
            </div>
            {!apiKey && (
              <div className="settings-alert warning">
                <AlertCircle size={16} />
                <span>AI practice generation will be disabled until a valid Gemini API key is provided.</span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Save size={16} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
