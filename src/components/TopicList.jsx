import React, { useState } from 'react';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import Play from 'lucide-react/dist/esm/icons/play';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import Star from 'lucide-react/dist/esm/icons/star';
import TrendingDown from 'lucide-react/dist/esm/icons/trending-down';
import { VOCABULARY_CLUSTERS } from '../utils/gemini';

export default function TopicList({ currentLevel, topics, onStartPractice, onBackToDashboard }) {
  const activeTopics = topics[currentLevel] || [];
  const [expandedTopic, setExpandedTopic] = useState(null);

  const toggleExpandTopic = (topicId) => {
    if (expandedTopic === topicId) {
      setExpandedTopic(null);
    } else {
      setExpandedTopic(topicId);
    }
  };

  return (
    <div className="topic-list-container glass-card">
      <div className="topic-list-header">
        <div className="header-info">
          <h2>
            <BookOpen className="title-icon" /> Level {currentLevel} Grammar & Vocabulary Topics
          </h2>
          <p>Expand a topic to view subskills and historical practice statistics.</p>
        </div>
        <button onClick={onBackToDashboard} className="btn-secondary">
          Back to Dashboard
        </button>
      </div>

      <div className="topics-vertical-list">
        {activeTopics.length === 0 ? (
          <div className="empty-state">
            <p>No topics loaded for Level {currentLevel}.</p>
          </div>
        ) : (
          activeTopics.map((topic) => {
            const isExpanded = expandedTopic === topic.id;
            const topicScore = Math.round((topic.accuracy * topic.confidence) / 100);
            const isDecaying = topic.attempts > 0 && (topic.confidence < 75 || (topic.lastPracticed && (new Date() - new Date(topic.lastPracticed)) / (1000 * 60 * 60 * 24) > 5));
            
            return (
              <div 
                key={topic.id} 
                className={`topic-list-item-card ${isExpanded ? 'expanded' : ''}`}
              >
                <div 
                  className="topic-item-summary" 
                  onClick={() => toggleExpandTopic(topic.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpandTopic(topic.id); } }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-label={`${topic.name} - ${topicScore}% mastery. Click to ${isExpanded ? 'collapse' : 'expand'} details.`}
                >
                  <div className="topic-name-section">
                    <span className="star-icon">
                      <Star 
                        size={16} 
                        fill={topicScore > 80 ? 'var(--accent)' : 'none'} 
                        stroke={topicScore > 80 ? 'var(--accent)' : 'currentColor'} 
                      />
                    </span>
                    <h4>
                      {topic.name}
                      {isDecaying && (
                        <span className="decaying-badge" title="Confidence has decayed. Practice this topic to refresh!">
                          <TrendingDown size={11} style={{ marginRight: '3px' }} /> Decaying
                        </span>
                      )}
                    </h4>
                  </div>

                  <div className="topic-item-meta">
                    <div className="mastery-score-pill" style={{
                      backgroundColor: topicScore > 75 ? 'rgba(34, 197, 94, 0.15)' : topicScore > 45 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: topicScore > 75 ? '#22c55e' : topicScore > 45 ? '#f59e0b' : '#ef4444'
                    }}>
                      Mastery: {topicScore}%
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartPractice(topic.id);
                      }} 
                      className="btn-primary btn-small start-practice-pill"
                    >
                      <Play size={12} fill="currentColor" /> Practice
                    </button>

                    <span className="chevron-toggle">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="topic-item-details animate-slide-down">
                    <div className="details-grid">
                      {/* Detailed Stats Column */}
                      <div className="details-stats-col">
                        <h5>Historical Analytics</h5>
                        <div className="stats-mini-grid">
                          <div className="stat-mini-box">
                            <span className="stat-label">Accuracy</span>
                            <span className="stat-val">{topic.accuracy}%</span>
                          </div>
                          <div className="stat-mini-box">
                            <span className="stat-label">Confidence</span>
                            <span className="stat-val">{Math.round(topic.confidence)}%</span>
                          </div>
                          <div className="stat-mini-box">
                            <span className="stat-label">Total Attempts</span>
                            <span className="stat-val">{topic.attempts}</span>
                          </div>
                          <div className="stat-mini-box">
                            <span className="stat-label">Last Practice</span>
                            <span className="stat-val">{topic.lastPracticed || 'Never'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Subskills breakdown Column */}
                      <div className="details-subskills-col">
                        <h5>Subskills Breakdown</h5>
                        <div className="subskills-list">
                          {Object.entries(topic.subskills || {}).map(([subskill, score]) => (
                            <div key={subskill} className="subskill-row">
                              <span className="subskill-name">{subskill.charAt(0).toUpperCase() + subskill.slice(1)}</span>
                              <div className="subskill-bar-wrapper">
                                <div className="subskill-bar-bg">
                                  <div 
                                    className="subskill-bar-fill" 
                                    style={{ 
                                      width: `${score}%`,
                                      backgroundColor: score > 75 ? '#22c55e' : score > 45 ? '#f59e0b' : '#ef4444'
                                    }}
                                  ></div>
                                </div>
                                <span className="subskill-value">{score}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Thematic Vocabulary Column */}
                      <div className="details-vocab-col">
                        <h5>Thematic Vocabulary</h5>
                        <p className="vocab-desc">Key units textbook vocabulary:</p>
                        <div className="vocab-chips-container">
                          {(() => {
                            const rawVocabList = VOCABULARY_CLUSTERS[currentLevel]?.[topic.id] || [];
                            if (rawVocabList.length === 0) {
                              return <span className="vocab-empty">No vocabulary cluster defined for this topic.</span>;
                            }
                            return rawVocabList.map((item, idx) => {
                              const [german, english] = item.split(' (');
                              const cleanedEnglish = english ? english.replace(')', '') : '';
                              return (
                                <div key={idx} className="vocab-chip-item">
                                  <span className="vocab-german">{german}</span>
                                  {cleanedEnglish && <span className="vocab-english">{cleanedEnglish}</span>}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
