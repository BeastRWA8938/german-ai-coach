import React, { useState } from 'react';
import Play from 'lucide-react/dist/esm/icons/play';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Home from 'lucide-react/dist/esm/icons/home';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Award from 'lucide-react/dist/esm/icons/award';
import Lightbulb from 'lucide-react/dist/esm/icons/lightbulb';
import { MOCK_QUESTIONS, DEFAULT_QUESTIONS } from '../data/mockQuestions';
import { generateAiQuestions, generateAiSmartQuestions } from '../utils/gemini';

export default function PracticeSession({ 
  topicId, 
  topicName, 
  isSmartPractice,
  apiKey,
  selectedModel,
  topics,
  currentLevel,
  onFinishSession,
  onBackToDashboard
}) {
  const [sessionState, setSessionState] = useState('setup'); // 'setup' | 'loading' | 'practice' | 'summary'
  const [numQuestions, setNumQuestions] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [sessionAnswers, setSessionAnswers] = useState([]); // Array of { question, userAnswer, isCorrect }
  const [errorMsg, setErrorMsg] = useState(null);

  // Load questions
  const startSession = async () => {
    setSessionState('loading');
    setErrorMsg(null);
    
    try {
      let selectedQuestions = [];
      
      if (isSmartPractice) {
        // Blended smart practice logic based on 60% Weak, 20% Review, 20% New ratio
        const levelTopics = topics[currentLevel] || [];
        
        // 1. Categorize active level topics
        const weakTopics = levelTopics.filter(t => {
          const score = Math.round((t.accuracy * t.confidence) / 100);
          return t.attempts > 0 && score < 60;
        });
        
        const reviewTopics = levelTopics.filter(t => {
          if (t.attempts === 0) return false;
          const score = Math.round((t.accuracy * t.confidence) / 100);
          if (score < 60) return false; // weak topics already handled
          const lastPracticed = t.lastPracticed ? new Date(t.lastPracticed) : null;
          const daysSince = lastPracticed ? (new Date() - lastPracticed) / (1000 * 60 * 60 * 24) : 0;
          return t.confidence < 70 || daysSince > 7;
        });
        
        const newTopics = levelTopics.filter(t => t.attempts === 0);
        
        // 2. Set target question counts
        let weakTarget = Math.round(numQuestions * 0.60);
        let reviewTarget = Math.round(numQuestions * 0.20);
        let newTarget = numQuestions - (weakTarget + reviewTarget);
        
        // Redistribute counts if categories are empty
        if (weakTopics.length === 0) {
          const half = Math.floor(weakTarget / 2);
          reviewTarget += half;
          newTarget += (weakTarget - half);
          weakTarget = 0;
        }
        if (reviewTopics.length === 0) {
          if (weakTopics.length > 0) {
            weakTarget += reviewTarget;
          } else {
            newTarget += reviewTarget;
          }
          reviewTarget = 0;
        }
        if (newTopics.length === 0) {
          if (weakTopics.length > 0) {
            const extra = Math.round(newTarget * 0.75);
            weakTarget += extra;
            reviewTarget += (newTarget - extra);
          } else if (reviewTopics.length > 0) {
            reviewTarget += newTarget;
          }
          newTarget = 0;
        }
        
        // Make sure exact totals are preserved
        const totalAllocated = weakTarget + reviewTarget + newTarget;
        if (totalAllocated !== numQuestions) {
          if (weakTopics.length > 0) weakTarget += (numQuestions - totalAllocated);
          else if (reviewTopics.length > 0) reviewTarget += (numQuestions - totalAllocated);
          else if (newTopics.length > 0) newTarget += (numQuestions - totalAllocated);
        }
        
        // Assemble chosen target allocations
        let targets = [];
        const distributeCount = (tList, targetCount) => {
          if (targetCount <= 0 || tList.length === 0) return;
          let countPerTopic = Math.ceil(targetCount / tList.length);
          let remaining = targetCount;
          tList.forEach((t, idx) => {
            const allocated = idx === tList.length - 1 ? remaining : Math.min(countPerTopic, remaining);
            if (allocated > 0) {
              targets.push({ id: t.id, name: t.name, count: allocated });
              remaining -= allocated;
            }
          });
        };
        
        distributeCount(weakTopics, weakTarget);
        distributeCount(reviewTopics, reviewTarget);
        distributeCount(newTopics, newTarget);
        
        // Absolute fallback: if no targets assigned, distribute evenly across all level topics
        if (targets.length === 0) {
          distributeCount(levelTopics, numQuestions);
        }
        
        // 3. Fetch questions
        if (apiKey) {
          // Gemini Smart Practice
          selectedQuestions = await generateAiSmartQuestions(
            currentLevel,
            targets,
            apiKey,
            selectedModel || 'gemini-2.5-flash'
          );
        } else {
          // Offline mock practice
          await new Promise((resolve) => setTimeout(resolve, 1000));
          targets.forEach(t => {
            const qList = MOCK_QUESTIONS[t.id] || [];
            if (qList.length > 0) {
              const shuffled = [...qList].sort(() => 0.5 - Math.random());
              selectedQuestions.push(...shuffled.slice(0, t.count).map(q => ({ ...q, topicId: t.id })));
            }
          });
          
          // Fallback if database doesn't have enough questions
          while (selectedQuestions.length < numQuestions) {
            const fallbackTopic = levelTopics[Math.floor(Math.random() * levelTopics.length)];
            const fallbackQuestions = MOCK_QUESTIONS[fallbackTopic.id] || DEFAULT_QUESTIONS;
            const chosen = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
            selectedQuestions.push({
              ...chosen,
              id: `fallback_${selectedQuestions.length}_${Date.now()}`,
              topicId: fallbackTopic.id
            });
          }
          selectedQuestions = selectedQuestions.sort(() => 0.5 - Math.random()).slice(0, numQuestions);
        }
      } else {
        // Single topic practice
        if (apiKey) {
          const generated = await generateAiQuestions(
            currentLevel,
            topicId,
            topicName,
            numQuestions,
            apiKey,
            selectedModel || 'gemini-2.5-flash'
          );
          selectedQuestions = generated.map(q => ({ ...q, topicId: topicId }));
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const topicQuestions = MOCK_QUESTIONS[topicId] || DEFAULT_QUESTIONS;
          selectedQuestions = [...topicQuestions]
            .map(q => ({ ...q, topicId: topicId }))
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.min(numQuestions, topicQuestions.length));
          
          while (selectedQuestions.length < numQuestions) {
            const pool = topicQuestions.length > 0 ? topicQuestions : DEFAULT_QUESTIONS;
            const chosen = pool[Math.floor(Math.random() * pool.length)];
            selectedQuestions.push({
              ...chosen,
              id: `pad_${selectedQuestions.length}_${Date.now()}`,
              topicId: topicId
            });
          }
        }
      }

      setQuestions(selectedQuestions);
      setCurrentIndex(0);
      setUserInput('');
      setIsAnswerSubmitted(false);
      setSessionAnswers([]);
      setSessionState('practice');
    } catch (err) {
      console.error("Session initialization failed:", err);
      setErrorMsg(err.message || "Failed to load questions. Please check your network or API settings.");
      setSessionState('setup');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (!isAnswerSubmitted) {
        submitAnswer();
      } else {
        nextQuestion();
      }
    }
  };

  const submitAnswer = () => {
    if (!userInput.trim()) return;

    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    
    // Normalize answer (lowercase, trim whitespace)
    const normalizedInput = userInput.trim().toLowerCase();
    const acceptedAnswers = (currentQ.accepted_answers || []).map(ans => ans?.trim()?.toLowerCase() || '');
    
    const correct = acceptedAnswers.includes(normalizedInput);
    
    setIsCorrect(correct);
    setIsAnswerSubmitted(true);
    
    setSessionAnswers([
      ...sessionAnswers,
      {
        question: currentQ,
        userAnswer: userInput.trim(),
        isCorrect: correct
      }
    ]);
  };

  const nextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      setUserInput('');
      setIsAnswerSubmitted(false);
    } else {
      setSessionState('summary');
    }
  };

  // Split sentence to embed input field inline
  const renderSentenceWithInput = (sentence) => {
    if (!sentence || !sentence.includes('___')) {
      return (
        <div className="sentence-display-fallback">
          <p className="german-sentence">{sentence || ''}</p>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={isAnswerSubmitted}
            onKeyDown={handleKeyPress}
            placeholder="Type your answer here"
            className="practice-input-standalone"
            autoFocus
          />
        </div>
      );
    }

    const parts = sentence.split('___');
    
    // Calculate width based on placeholder/answer length to look tidy
    const answerLen = questions[currentIndex]?.primary_answer?.length || 5;
    const inputWidth = Math.max(80, answerLen * 14 + 20);

    return (
      <div className="german-sentence-inline">
        {parts[0]}
        <span className="inline-input-wrapper">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={isAnswerSubmitted}
            onKeyDown={handleKeyPress}
            style={{ width: `${inputWidth}px` }}
            className={`practice-input-inline ${isAnswerSubmitted ? (isCorrect ? 'correct' : 'incorrect') : ''}`}
            placeholder="___"
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck="false"
          />
        </span>
        {parts[1]}
      </div>
    );
  };

  // Render Setup Screen
  if (sessionState === 'setup') {
    return (
      <div className="practice-container setup glass-card animate-fade-in">
        <div className="practice-header">
          <h2>
            <BookOpen className="title-icon" />{' '}
            {isSmartPractice ? 'Smart Practice Session' : `Practice: ${topicName}`}
          </h2>
          <p>Configure your practice session. AI model will generate tailored sentences based on this topic.</p>
        </div>

        <div className="setup-body">
          <div className="form-group">
            <label>Choose Number of Questions:</label>
            <div className="button-group-selector">
              {[5, 10, 15].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setNumQuestions(num)}
                  className={`selector-btn ${numQuestions === num ? 'active' : ''}`}
                >
                  {num} Questions
                </button>
              ))}
            </div>
          </div>

          <div className="setup-info-box">
            <h4><Lightbulb size={16} className="title-icon" /> Learning Coach Tip</h4>
            <p>
              Focus on typing the correct articles, conjugations, or prepositions. 
              The evaluation is case-insensitive, but spelling counts!
            </p>
          </div>

          {errorMsg && (
            <div className="settings-alert warning">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <div className="setup-footer">
          <button onClick={onBackToDashboard} className="btn-secondary">
            Cancel
          </button>
          <button onClick={startSession} className="btn-primary glow-btn">
            <Play size={16} fill="currentColor" /> Start Practice
          </button>
        </div>
      </div>
    );
  }

  // Render Loading Screen
  if (sessionState === 'loading') {
    return (
      <div className="practice-container loading glass-card animate-fade-in">
        <div className="loader-animation-container">
          <div className="coach-bubble-loader">
            <Sparkles size={32} className="spin-on-sync" />
            <h3>Preparing Practice Session...</h3>
            <p>
              {apiKey 
                ? "Connecting to Gemini to generate contextually natural, CEFR-aligned exercises..."
                : "Retrieving exercises from local vocabulary database..."}
            </p>
          </div>
          <div className="loading-bar-wrapper">
            <div className="loading-bar-fill animate-loading"></div>
          </div>
        </div>
      </div>
    );
  }

  // Render Question Playing Screen
  if (sessionState === 'practice') {
    const currentQ = questions[currentIndex];
    if (!currentQ) return null;
    const progressPercent = questions.length ? ((currentIndex) / questions.length) * 100 : 0;

    return (
      <div className="practice-container playing glass-card animate-fade-in">
        {/* Progress header */}
        <div className="practice-progress-header">
          <span className="progress-text">Question {currentIndex + 1} of {questions.length}</span>
          <div className="practice-progress-bar-bg">
            <div className="practice-progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        {/* Question sentence */}
        <div className="practice-question-body">
          <span className="difficulty-tag uppercase">{currentQ.difficulty || 'medium'}</span>
          <div className="sentence-container">
            {renderSentenceWithInput(currentQ.sentence)}
          </div>
        </div>

        {/* Feedback area */}
        {isAnswerSubmitted ? (
          <div className={`explanation-panel animate-slide-up ${isCorrect ? 'correct-style' : 'incorrect-style'}`}>
            <div className="explanation-status">
              {isCorrect ? (
                <>
                  <CheckCircle size={20} className="status-icon-correct" />
                  <h4>Richtig! (Correct)</h4>
                </>
              ) : (
                <>
                  <XCircle size={20} className="status-icon-incorrect" />
                  <h4>Falsch (Incorrect)</h4>
                </>
              )}
            </div>

            <div className="explanation-details">
              <div className="explanation-row">
                <span className="expl-label">Your Answer:</span>
                <span className={`expl-val ${isCorrect ? 'text-correct' : 'text-incorrect line-through'}`}>{userInput}</span>
              </div>
              {!isCorrect && (
                <div className="explanation-row">
                  <span className="expl-label">Correct Answer:</span>
                  <span className="expl-val text-correct bold">{currentQ.primary_answer || ''}</span>
                </div>
              )}
              {currentQ.accepted_answers && currentQ.accepted_answers.length > 1 && (
                <div className="explanation-row">
                  <span className="expl-label">Alternative Answers:</span>
                  <span className="expl-val italic">{currentQ.accepted_answers.join(', ')}</span>
                </div>
              )}
              
              <div className="explanation-divider"></div>
              
              <div className="explanation-rules">
                <h5>Grammar Rule & Explanation:</h5>
                <p>{currentQ.explanation || ''}</p>
                <small className="expl-rule-point">Grammar Target: {currentQ.grammar_point || ''}</small>
              </div>
            </div>
            
            <button onClick={nextQuestion} className="btn-primary next-btn">
              {currentIndex + 1 === questions.length ? 'Show Results' : 'Next Question'}{' '}
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="practice-action-panel">
            <button 
              onClick={submitAnswer} 
              disabled={!userInput.trim()}
              className="btn-primary btn-large submit-btn"
            >
              Check Answer
            </button>
          </div>
        )}
      </div>
    );
  }

  // Render Summary Screen
  if (sessionState === 'summary') {
    const totalCorrect = sessionAnswers ? sessionAnswers.filter(ans => ans?.isCorrect).length : 0;
    const questionsCount = questions?.length || 0;
    const finalScore = questionsCount ? Math.round((totalCorrect / questionsCount) * 100) : 0;

    return (
      <div className="practice-container summary glass-card animate-fade-in">
        <div className="summary-header">
          <Award size={48} className="summary-icon glow-svg" />
          <h2>Session Completed!</h2>
          <p>You did a great job today. Consistent practice builds permanent memory.</p>
        </div>

        <div className="summary-body">
          <div className="score-summary-grid">
            <div className="score-box">
              <span className="score-num">{totalCorrect} / {questionsCount}</span>
              <span className="score-label">Correct Answers</span>
            </div>
            <div className="score-box">
              <span className="score-num">{finalScore}%</span>
              <span className="score-label">Accuracy Score</span>
            </div>
            <div className="score-box">
              <span className="score-num">
                {isSmartPractice ? 'Smart Practice' : '+5%'}
              </span>
              <span className="score-label">Mastery Impact</span>
            </div>
          </div>

          <div className="session-answers-review">
            <h3>Review Session Answers</h3>
            <div className="answers-review-list">
              {(sessionAnswers || []).map((item, idx) => (
                <div key={idx} className={`answer-review-row ${item?.isCorrect ? 'correct' : 'incorrect'}`}>
                  <div className="review-status-indicator">
                    {item?.isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  </div>
                  <div className="review-text-content">
                    <p className="review-sentence">
                      {idx + 1}. {item?.question?.sentence ? item.question.sentence.replace('___', `[ ${item.question.primary_answer || ''} ]`) : ''}
                    </p>
                    <p className="review-user-ans">
                      Your answer: <strong>{item?.userAnswer || ''}</strong>
                      {!item?.isCorrect && item?.question?.primary_answer && (
                        <> | Expected: <strong className="text-correct">{item.question.primary_answer}</strong></>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="summary-footer">
          <button 
            onClick={() => onFinishSession(sessionAnswers, topicId, isSmartPractice)} 
            className="btn-primary btn-large glow-btn"
          >
            <Home size={16} /> Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
}
