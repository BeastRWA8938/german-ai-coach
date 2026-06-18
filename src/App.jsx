import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TopicList from './components/TopicList';
import PracticeSession from './components/PracticeSession';
import SettingsModal from './components/SettingsModal';
import './App.css';

const INITIAL_TOPICS = {
  A1: [
    { id: 'family', name: 'Family Vocabulary', accuracy: 85, confidence: 90, attempts: 20, lastPracticed: '2026-06-15', masteryScore: 76, subskills: { vocabulary: 85, relationships: 85 } },
    { id: 'numbers', name: 'Numbers & Counting', accuracy: 90, confidence: 80, attempts: 15, lastPracticed: '2026-06-12', masteryScore: 72, subskills: { digits: 95, spelling: 85 } },
    { id: 'personal_pronouns', name: 'Personal Pronouns', accuracy: 75, confidence: 70, attempts: 25, lastPracticed: '2026-06-10', masteryScore: 52, subskills: { nominative: 85, accusative: 65 } },
    { id: 'akkusativ', name: 'Akkusativ Case', accuracy: 78, confidence: 60, attempts: 30, lastPracticed: '2026-06-14', masteryScore: 47, subskills: { articles: 80, pronouns: 76 } },
    { id: 'dativ', name: 'Dativ Case', accuracy: 65, confidence: 45, attempts: 18, lastPracticed: '2026-06-16', masteryScore: 29, subskills: { articles: 70, pronouns: 60 } },
  ],
  A2: [
    { id: 'trennbare_verben', name: 'Trennbare Verben', accuracy: 70, confidence: 65, attempts: 20, lastPracticed: '2026-06-17', masteryScore: 45, subskills: { prefixes: 75, sentence_order: 65 } },
    { id: 'perfekt', name: 'Perfekt Tense', accuracy: 55, confidence: 40, attempts: 15, lastPracticed: '2026-06-11', masteryScore: 22, subskills: { auxiliary: 60, participle: 50 } },
    { id: 'wechselpraepositionen', name: 'Wechselpräpositionen', accuracy: 48, confidence: 30, attempts: 12, lastPracticed: '2026-06-18', masteryScore: 14, subskills: { dativ_wo: 50, akkusativ_wohin: 46 } },
    { id: 'adjektivdeklination', name: 'Adjektivdeklination', accuracy: 40, confidence: 25, attempts: 10, lastPracticed: '2026-06-05', masteryScore: 10, subskills: { weak_inflection: 45, strong_inflection: 35 } },
  ],
  B1: [
    { id: 'passiv', name: 'Passiv Tense', accuracy: 0, confidence: 0, attempts: 0, lastPracticed: null, masteryScore: 0, subskills: { werden: 0, von_durch: 0 } },
    { id: 'konjunktiv_2', name: 'Konjunktiv II', accuracy: 0, confidence: 0, attempts: 0, lastPracticed: null, masteryScore: 0, subskills: { wunschsaetze: 0, hoeflichkeit: 0 } },
    { id: 'nebensaetze', name: 'Subordinating Clauses', accuracy: 0, confidence: 0, attempts: 0, lastPracticed: null, masteryScore: 0, subskills: { weil_dass: 0, obwohl_trotzdem: 0 } },
  ],
  B2: [
    { id: 'nominalstil', name: 'Nominalstil', accuracy: 0, confidence: 0, attempts: 0, lastPracticed: null, masteryScore: 0, subskills: { preposition_noun: 0, verb_noun_conversion: 0 } },
    { id: 'passiversatz', name: 'Passiv Ersatz', accuracy: 0, confidence: 0, attempts: 0, lastPracticed: null, masteryScore: 0, subskills: { sein_zu: 0, sich_lassen: 0 } },
  ],
};

function App() {
  const [currentLevel, setCurrentLevel] = useState('A1');
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'topicList' | 'practice'
  const [activeTopicId, setActiveTopicId] = useState(null);
  const [isSmartPractice, setIsSmartPractice] = useState(false);
  const [syncStatus, setSyncStatus] = useState('local'); // 'local' | 'syncing' | 'synced'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('projektdeutsch_settings');
    return saved ? JSON.parse(saved) : { apiKey: '', selectedModel: 'gemini-2.5-flash', syncEnabled: false };
  });

  const [topics, setTopics] = useState(() => {
    const saved = localStorage.getItem('projektdeutsch_topics');
    return saved ? JSON.parse(saved) : INITIAL_TOPICS;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('projektdeutsch_topics', JSON.stringify(topics));
  }, [topics]);

  useEffect(() => {
    localStorage.setItem('projektdeutsch_settings', JSON.stringify(settings));
    if (settings.syncEnabled) {
      setSyncStatus('synced');
    } else {
      setSyncStatus('local');
    }
  }, [settings]);

  // Confidence decay trigger on load (simulated)
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastDecayDate = localStorage.getItem('projektdeutsch_last_decay');
    
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
      localStorage.setItem('projektdeutsch_last_decay', todayStr);
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
    const correctCount = sessionAnswers.filter(ans => ans.isCorrect).length;
    const sessionAccuracy = (correctCount / sessionAnswers.length) * 100;
    const todayStr = new Date().toISOString().split('T')[0];

    setTopics(prevTopics => {
      const updated = { ...prevTopics };
      
      if (isSmartPracticeFlag) {
        // Smart practice impacts multiple topics practiced
        // For simplicity, we boost overall level confidence slightly
        Object.keys(updated).forEach(lvl => {
          updated[lvl] = updated[lvl].map(topic => {
            // Find if this topic was in the session
            const topicAnswers = sessionAnswers.filter(ans => ans.question.id.startsWith(topic.id.slice(0, 3)));
            if (topicAnswers.length === 0) return topic;

            const tCorrect = topicAnswers.filter(a => a.isCorrect).length;
            const tAcc = (tCorrect / topicAnswers.length) * 100;

            const newAttempts = topic.attempts + topicAnswers.length;
            const newAccuracy = Math.round(((topic.accuracy * topic.attempts) + (tAcc * topicAnswers.length)) / newAttempts);
            const newConfidence = 100; // Refreshed on practice
            const newMastery = Math.round((newAccuracy * newConfidence) / 100);

            return {
              ...topic,
              accuracy: newAccuracy,
              confidence: newConfidence,
              attempts: newAttempts,
              lastPracticed: todayStr,
              masteryScore: newMastery
            };
          });
        });
      } else {
        // Single topic practice update
        updated[currentLevel] = updated[currentLevel].map(topic => {
          if (topic.id !== topicId) return topic;

          const newAttempts = topic.attempts + sessionAnswers.length;
          const newAccuracy = Math.round(((topic.accuracy * topic.attempts) + (sessionAccuracy * sessionAnswers.length)) / newAttempts);
          const newConfidence = 100; // Replaced confidence back to 100% on direct practice
          const newMastery = Math.round((newAccuracy * newConfidence) / 100);

          // Update subskills mock percentages based on correctness
          const subskillsCopy = { ...topic.subskills };
          Object.keys(subskillsCopy).forEach(sub => {
            // Give a small random/positive boost based on accuracy
            const delta = sessionAccuracy > 70 ? 5 : sessionAccuracy < 40 ? -5 : 0;
            subskillsCopy[sub] = Math.max(10, Math.min(100, subskillsCopy[sub] + delta));
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
      }

      return updated;
    });

    setCurrentView('dashboard');
  };

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
  };

  const handleSyncNow = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('synced');
    }, 1500);
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
