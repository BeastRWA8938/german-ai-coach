import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TopicList from './components/TopicList';
import PracticeSession from './components/PracticeSession';
import SettingsModal from './components/SettingsModal';
import {
  loadSettings,
  loadTopics,
  writeJsonStorage,
  readStringStorage,
  writeStringStorage,
  SETTINGS_STORAGE_KEY,
  TOPICS_STORAGE_KEY,
  LAST_DECAY_STORAGE_KEY,
} from './utils/storage.js';
import './App.css';

function App() {
  const [currentLevel, setCurrentLevel] = useState('A1');
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'topicList' | 'practice'
  const [activeTopicId, setActiveTopicId] = useState(null);
  const [isSmartPractice, setIsSmartPractice] = useState(false);
  const [syncStatus, setSyncStatus] = useState('local'); // 'local' | 'coming_soon'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStorageHealthy, setIsStorageHealthy] = useState(true);
  
  const [settings, setSettings] = useState(loadSettings);

  const [topics, setTopics] = useState(loadTopics);

  const getLocalDateString = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Save changes to localStorage
  useEffect(() => {
    const success = writeJsonStorage(TOPICS_STORAGE_KEY, topics);
    if (!success) setIsStorageHealthy(false);
  }, [topics]);

  useEffect(() => {
    const success = writeJsonStorage(SETTINGS_STORAGE_KEY, settings);
    if (!success) setIsStorageHealthy(false);
    if (settings.syncEnabled) {
      setSyncStatus('coming_soon');
    } else {
      setSyncStatus('local');
    }
  }, [settings]);

  // Confidence decay trigger on load (simulated)
  useEffect(() => {
    const todayStr = getLocalDateString();
    const lastDecayDate = readStringStorage(LAST_DECAY_STORAGE_KEY);
    
    if (lastDecayDate !== todayStr) {
      // Apply decay
      setTopics(prevTopics => {
        const updated = { ...prevTopics };
        Object.keys(updated).forEach(lvl => {
          updated[lvl] = updated[lvl].map(topic => {
            if (!topic.lastPracticed) return topic;
            
            // Calculate days elapsed
            const lastPracticed = new Date(topic.lastPracticed);
            const now = new Date();
            const daysDiff = Math.max(0, (now - lastPracticed) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 0) return topic;

            // Decay confidence: C = C0 * e^(-0.01 * days)
            const decayRate = 0.01;
            const decayedConfidence = topic.confidence * Math.exp(-decayRate * daysDiff);
            const finalConfidence = Math.max(10, Math.min(100, decayedConfidence));
            const masteryScore = Math.round((topic.accuracy * finalConfidence) / 100);

            return {
              ...topic,
              confidence: finalConfidence,
              masteryScore
            };
          });
        });
        return updated;
      });
      const success = writeStringStorage(LAST_DECAY_STORAGE_KEY, todayStr);
      if (!success) setIsStorageHealthy(false);
    }
  }, []);

  // Calculate overall level progress (average of mastery score of topics)
  const getLevelProgress = (level) => {
    const levelTopics = topics[level] || [];
    if (levelTopics.length === 0) return 0;
    
    const sum = levelTopics.reduce((acc, t) => acc + (t.masteryScore || 0), 0);
    return sum / levelTopics.length;
  };

  const handleLevelChange = (level) => {
    setCurrentLevel(level);
    setCurrentView('dashboard');
  };

  const handleStartPractice = (topicId) => {
    setActiveTopicId(topicId);
    setIsSmartPractice(false);
    setCurrentView('practice');
  };

  const handleStartSmartPractice = () => {
    setIsSmartPractice(true);
    setActiveTopicId(null);
    setCurrentView('practice');
  };

  const handleFinishSession = (sessionAnswers, topicId, isSmartPracticeFlag) => {
    const todayStr = getLocalDateString();

    setTopics(prevTopics => {
      const updated = { ...prevTopics };
      
      // Update historical metrics for each level and topic that was practiced
      Object.keys(updated).forEach(lvl => {
        updated[lvl] = updated[lvl].map(topic => {
          const isTargeted = isSmartPracticeFlag 
            ? sessionAnswers.some(ans => ans.question.topicId === topic.id)
            : topic.id === topicId && lvl === currentLevel;

          if (!isTargeted) return topic;

          // Filter session answers belonging to this specific topic
          const topicAnswers = sessionAnswers.filter(ans => ans.question.topicId === topic.id);
          if (topicAnswers.length === 0) return topic;

          const tCorrectCount = topicAnswers.filter(ans => ans.isCorrect).length;
          const tAccuracy = (tCorrectCount / topicAnswers.length) * 100;

          // Update accuracy & attempts
          const newAttempts = topic.attempts + topicAnswers.length;
          const newAccuracy = Math.round(((topic.accuracy * topic.attempts) + (tAccuracy * topicAnswers.length)) / newAttempts);
          const newConfidence = 100; // Practice refreshes confidence to 100%
          const newMastery = Math.round((newAccuracy * newConfidence) / 100);

          // Update subskills based on actual answers for each subskill
          const subskillsCopy = { ...topic.subskills };
          Object.keys(subskillsCopy).forEach(sub => {
            const subAnswers = topicAnswers.filter(ans => ans.question.subskill === sub);
            if (subAnswers.length > 0) {
              const subCorrect = subAnswers.filter(ans => ans.isCorrect).length;
              const subAccuracy = (subCorrect / subAnswers.length) * 100;
              
              const currentScore = subskillsCopy[sub] || 0;
              if (topic.attempts === 0) {
                subskillsCopy[sub] = Math.round(subAccuracy);
              } else {
                // Blend historical accuracy with current practice session accuracy
                const historicalWeight = topic.attempts;
                const newWeight = subAnswers.length;
                subskillsCopy[sub] = Math.round(
                  ((currentScore * historicalWeight) + (subAccuracy * newWeight)) / (historicalWeight + newWeight)
                );
              }
            }
          });

          return {
            ...topic,
            accuracy: newAccuracy,
            confidence: newConfidence,
            attempts: newAttempts,
            lastPracticed: todayStr,
            masteryScore: newMastery,
            subskills: subskillsCopy
          };
        });
      });
      return updated;
    });

    setCurrentView('dashboard');
  };

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
  };

  const handleSyncNow = () => {
    // Google Drive sync is not yet implemented
    // This is a placeholder for future integration
    alert("Cloud Sync is coming soon!");
  };

  const getActiveTopicName = () => {
    const lvlTopics = topics[currentLevel] || [];
    const topic = lvlTopics.find(t => t.id === activeTopicId);
    return topic ? topic.name : '';
  };

  return (
    <div className="app-container">
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <Navbar 
        currentLevel={currentLevel} 
        onLevelChange={handleLevelChange} 
        syncStatus={syncStatus}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="app-main-content">
        {!isStorageHealthy && (
          <div className="settings-alert warning" style={{ marginBottom: '24px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span><strong>Storage Warning:</strong> Browser local storage is disabled, full, or running in private mode. Your learning progress and settings cannot be saved locally.</span>
          </div>
        )}
        {currentView === 'dashboard' && (
          <Dashboard 
            currentLevel={currentLevel}
            levelProgress={getLevelProgress(currentLevel)}
            topics={topics}
            onStartPractice={handleStartPractice}
            onStartSmartPractice={handleStartSmartPractice}
            onNavigateToTopicList={() => setCurrentView('topicList')}
          />
        )}

        {currentView === 'topicList' && (
          <TopicList 
            currentLevel={currentLevel}
            topics={topics}
            onStartPractice={handleStartPractice}
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'practice' && (
          <PracticeSession 
            topicId={activeTopicId}
            topicName={getActiveTopicName()}
            isSmartPractice={isSmartPractice}
            apiKey={settings.apiKey}
            selectedModel={settings.selectedModel}
            topics={topics}
            currentLevel={currentLevel}
            onFinishSession={handleFinishSession}
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        )}
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onSyncNow={handleSyncNow}
      />
      
      <footer className="app-footer-brand">
        <p>ProjektDeutsch AI © 2026. Aligned with CEFR guidelines. Developed with ❤️ for German Learners.</p>
      </footer>
    </div>
  );
}

export default App;
