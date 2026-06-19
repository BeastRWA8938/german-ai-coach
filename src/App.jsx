import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TopicList from './components/TopicList';
import PracticeSession from './components/PracticeSession';
import SettingsModal from './components/SettingsModal';
import './App.css';

const INITIAL_TOPICS = {
  A1: [
    { id: 'family', name: 'Family Vocabulary', accuracy: 0, confidence: 0, attempts: 0, lastPracticed: null, masteryScore: 0, subskills: { vocabulary: 0, relationships: 0 } },
    { id: 'numbers', name: 'Numbers & Counting', accuracy: 0, confidence: 0, attempts: 0, lastPracticed: null, masteryScore: 0, subskills: { digits: 0, spelling: 0 } },
    { id: 'personal_pronouns', name: 'Personal Pronouns', accuracy: 0, confidence: 0, attempts: 0, lastPracticed: null, masteryScore: 0, subskills: { nominative: 0, accusative: 0 } },
    { id: 'akkusativ', name: 'Akkusativ Case', accuracy: 0, confidence: 0, attempts: 0, lastPracticed: null, masteryScore: 0, subskills: { articles: 0, pronouns: 0 } },
    { id: 'dativ', name: 'Dativ Case', accuracy: 0, confidence: 0, attempts: 0, lastPracticed: null, masteryScore: 0, subskills: { articles: 0, pronouns: 0 } },
    { id: 'trennbare_verben', name: 'Trennbare Verben', accuracy: 0, confidence: 0, attempts: 0, lastPracticed: null, masteryScore: 0, subskills: { prefixes: 0, sentence_order: 0 } },
    { id: 'perfekt', name: 'Perfekt Tense', accuracy: 0, confidence: 0, attempts: 0, lastPracticed: null, masteryScore: 0, subskills: { auxiliary: 0, participle: 0 } },
    { id: 'modalverben', name: 'Modalverben', accuracy: 0, confidence: 0, attempts: 0, lastPracticed: null, masteryScore: 0, subskills: { conjugation: 0, syntax: 0 } },
  ],
  A2: [
    { id: 'wechselpraepositionen', name: 'Wechselpräpositionen', accuracy: 0, confidence: 0, attempts: 0, lastPracticed: null, masteryScore: 0, subskills: { dativ_wo: 0, akkusativ_wohin: 0 } },
    { id: 'adjektivdeklination', name: 'Adjektivdeklination', accuracy: 0, confidence: 0, attempts: 0, lastPracticed: null, masteryScore: 0, subskills: { weak_inflection: 0, strong_inflection: 0 } },
    { id: 'nebensaetze_a2', name: 'Subordinating Clauses (weil/dass)', accuracy: 0, confidence: 0, attempts: 0, lastPracticed: null, masteryScore: 0, subskills: { weil_dass: 0 } },
    { id: 'relativsaetze', name: 'Relativsätze', accuracy: 0, confidence: 0, attempts: 0, lastPracticed: null, masteryScore: 0, subskills: { nominative: 0, accusative: 0 } },
  ],
  B1: [
    { id: 'passiv', name: 'Passiv Tense', accuracy: 0, confidence: 0, attempts: 0, lastPracticed: null, masteryScore: 0, subskills: { werden: 0, von_durch: 0 } },
    { id: 'konjunktiv_2', name: 'Konjunktiv II', accuracy: 0, confidence: 0, attempts: 0, lastPracticed: null, masteryScore: 0, subskills: { wunschsaetze: 0, hoeflichkeit: 0 } },
    { id: 'nebensaetze', name: 'Subordinating Clauses (obwohl/trotzdem)', accuracy: 0, confidence: 0, attempts: 0, lastPracticed: null, masteryScore: 0, subskills: { obwohl_trotzdem: 0 } },
    { id: 'relativsaetze_b1', name: 'Relativsätze (mit Präpositionen)', accuracy: 0, confidence: 0, attempts: 0, lastPracticed: null, masteryScore: 0, subskills: { prepositional: 0, was_wo: 0 } },
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
    const saved = localStorage.getItem('projektdeutsch_topics_v2');
    return saved ? JSON.parse(saved) : INITIAL_TOPICS;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('projektdeutsch_topics_v2', JSON.stringify(topics));
  }, [topics]);

  useEffect(() => {
    localStorage.setItem('projektdeutsch_settings', JSON.stringify(settings));
    if (settings.syncEnabled) {
      setSyncStatus('coming_soon');
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
    const todayStr = new Date().toISOString().split('T')[0];

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
