import React from 'react';
import TrendingDown from 'lucide-react/dist/esm/icons/trending-down';
import Award from 'lucide-react/dist/esm/icons/award';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Play from 'lucide-react/dist/esm/icons/play';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Gauge from 'lucide-react/dist/esm/icons/gauge';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';

export default function Dashboard({ 
  currentLevel, 
  levelProgress, 
  topics, 
  onStartPractice, 
  onStartSmartPractice,
  onNavigateToTopicList
}) {
  
  // Calculate analytics
  const activeTopics = topics[currentLevel] || [];
  
  // Find top weak topics (lowest mastery score)
  const weakTopics = [...activeTopics]
    .filter(t => t.masteryScore < 60)
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 3);

  // Find topics needing review (confidence decay)
  const reviewQueue = [...activeTopics]
    .filter(t => t.confidence < 70 || (t.lastPracticed && (new Date() - new Date(t.lastPracticed)) / (1000 * 60 * 60 * 24) > 7))
    .sort((a, b) => a.confidence - b.confidence);

  // Determine recommendation: lowest confidence topic or weakest topic
  const recommendation = activeTopics.length > 0 
    ? [...activeTopics].sort((a, b) => (a.accuracy * a.confidence) - (b.accuracy * b.confidence))[0]
    : null;

  return (
    <div className="dashboard-container">
      {/* Hero Header Dashboard */}
      <section className="dashboard-hero glass-card">
        <div className="hero-welcome">
          <h2><BookOpen size={28} className="title-icon" /> Guten Tag!</h2>
          <p>Ready to level up your German? Continuous topic-focused practice is the key to retention.</p>
          <div className="hero-cta-wrapper">
            <button 
              onClick={onStartSmartPractice} 
              className="btn-primary btn-large glow-btn"
              disabled={activeTopics.length === 0}
            >
              <Play size={18} fill="currentColor" /> Start Smart Practice
            </button>
            <button 
              onClick={onNavigateToTopicList} 
              className="btn-secondary btn-large"
            >
              <BookOpen size={18} /> Browse All Topics
            </button>
          </div>
          <small className="cta-explanation">
            <strong>Smart Practice:</strong> 60% Weak topics, 20% Review topics, 20% New topics automatically.
          </small>
        </div>

        {/* Circular Progress Ring */}
        <div className="hero-progress">
          <div className="progress-ring-container">
            <svg className="progress-ring" width="140" height="140">
              <circle
                className="progress-ring-bg"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="12"
                fill="transparent"
                r="56"
                cx="70"
                cy="70"
              />
              <circle
                className="progress-ring-bar"
                stroke="var(--accent)"
                strokeWidth="12"
                strokeDasharray={2 * Math.PI * 56}
                strokeDashoffset={2 * Math.PI * 56 * (1 - (levelProgress / 100))}
                strokeLinecap="round"
                fill="transparent"
                r="56"
                cx="70"
                cy="70"
              />
            </svg>
            <div className="progress-ring-text">
              <span className="percent">{Math.round(levelProgress)}%</span>
              <span className="label">Level {currentLevel}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid Dashboard */}
      <div className="dashboard-grid">
        
        {/* Left Column: Topics list */}
        <section className="dashboard-main glass-card">
          <div className="section-header">
            <h3>Grammar & Vocabulary Progress</h3>
            <button onClick={onNavigateToTopicList} className="text-btn">
              See All <ChevronRight size={14} />
            </button>
          </div>
          
          <div className="topics-list-dashboard">
            {activeTopics.length === 0 ? (
              <div className="empty-state">
                <p>No topics loaded for Level {currentLevel}. Add custom topics or refresh your sync.</p>
              </div>
            ) : (
              activeTopics.map((topic) => {
                const topicScore = Math.round((topic.accuracy * topic.confidence) / 100);
                const isDecaying = topic.attempts > 0 && (topic.confidence < 75 || (topic.lastPracticed && (new Date() - new Date(topic.lastPracticed)) / (1000 * 60 * 60 * 24) > 5));
                return (
                  <div key={topic.id} className="topic-card-row">
                    <div className="topic-row-info">
                      <h4>
                        {topic.name}
                        {isDecaying && (
                          <span className="decaying-badge" title="Confidence has decayed. Practice this topic to refresh!">
                            <TrendingDown size={11} style={{ marginRight: '3px' }} /> Decaying
                          </span>
                        )}
                      </h4>
                      <div className="topic-row-stats">
                        <span>Accuracy: <strong>{topic.accuracy}%</strong></span>
                        <span className="separator">•</span>
                        <span>Confidence: <strong>{Math.round(topic.confidence)}%</strong></span>
                        <span className="separator">•</span>
                        <span>Attempts: <strong>{topic.attempts}</strong></span>
                      </div>
                    </div>

                    <div className="topic-row-progress-wrapper">
                      <div className="mastery-indicator">
                        <span className="mastery-label">Mastery Score</span>
                        <div className="progress-bar-bg">
                          <div 
                            className="progress-bar-fill" 
                            style={{ 
                              width: `${topicScore}%`,
                              backgroundColor: topicScore > 75 ? '#22c55e' : topicScore > 45 ? '#f59e0b' : '#ef4444'
                            }}
                          ></div>
                        </div>
                        <span className="mastery-value">{topicScore}%</span>
                      </div>
                      
                      <button 
                        onClick={() => onStartPractice(topic.id)} 
                        className="btn-icon-start"
                        title={`Practice ${topic.name}`}
                      >
                        <Play size={14} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right Column: Recommendations, Weak areas, Review queue */}
        <div className="dashboard-sidebar">
          
          {/* Recommendation Card */}
          {recommendation && (
            <div className="sidebar-widget recommendation-card glow-card">
              <div className="widget-header">
                <Award className="widget-icon primary" size={18} />
                <h4>Recommended Practice</h4>
              </div>
              <div className="widget-body">
                <h5>{recommendation.name}</h5>
                <p className="recommendation-reason">
                  Reason: {recommendation.confidence < 60 ? 'Confidence is low due to decay' : 'Highest room for improvement'}
                </p>
                <button 
                  onClick={() => onStartPractice(recommendation.id)}
                  className="btn-primary btn-full-width"
                >
                  Practice Now
                </button>
              </div>
            </div>
          )}

          {/* Weak Topics */}
          <div className="sidebar-widget glass-card">
            <div className="widget-header">
              <AlertTriangle className="widget-icon danger" size={18} />
              <h4>Weak Areas</h4>
            </div>
            <div className="widget-body">
              {weakTopics.length === 0 ? (
                <div className="all-clear">
                  <CheckCircle2 size={16} color="#22c55e" />
                  <span>Excellent! No topics under 60% mastery.</span>
                </div>
              ) : (
                <ul className="widget-list">
                  {weakTopics.map(t => {
                    const score = Math.round((t.accuracy * t.confidence) / 100);
                    return (
                      <li key={t.id} onClick={() => onStartPractice(t.id)} className="interactive-li">
                        <div className="list-item-content">
                          <span className="item-title">{t.name}</span>
                          <span className="item-badge danger">{score}% mastery</span>
                        </div>
                        <ChevronRight size={14} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Review Queue */}
          <div className="sidebar-widget glass-card">
            <div className="widget-header">
              <Calendar className="widget-icon warning" size={18} />
              <h4>Review Queue</h4>
            </div>
            <div className="widget-body">
              {reviewQueue.length === 0 ? (
                <div className="all-clear">
                  <CheckCircle2 size={16} color="#22c55e" />
                  <span>All topics up-to-date! No review needed.</span>
                </div>
              ) : (
                <ul className="widget-list">
                  {reviewQueue.slice(0, 3).map(t => (
                    <li key={t.id} onClick={() => onStartPractice(t.id)} className="interactive-li">
                      <div className="list-item-content">
                        <span className="item-title">{t.name}</span>
                        <span className="item-badge warning">
                          {t.lastPracticed ? `Last: ${t.lastPracticed}` : 'Never'}
                        </span>
                      </div>
                      <ChevronRight size={14} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
