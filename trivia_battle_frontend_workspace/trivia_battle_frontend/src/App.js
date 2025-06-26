import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Color scheme as specified.
const COLORS = {
  primary: "#1976d2",
  secondary: "#424242",
  accent: "#ffb300",
  bg: "#fff",
  text: "#222",
  cardBg: "#f9f9f9",
  border: "#e0e0e0",
  correct: "#c8e6c9",
  wrong: "#ffcdd2",
};

// --- Mock Trivia Data ---
const MOCK_QUESTIONS = [
  {
    question: "What is the capital of France?",
    answers: ["Rome", "Paris", "Berlin", "Madrid"],
    correct: 1,
  },
  {
    question: "Who wrote 'To Kill a Mockingbird'?",
    answers: [
      "Harper Lee",
      "J.K. Rowling",
      "George Orwell",
      "Jane Austen",
    ],
    correct: 0,
  },
  {
    question: "What's the smallest prime number?",
    answers: ["1", "2", "3", "0"],
    correct: 1,
  },
  {
    question: "Which planet is known as the Red Planet?",
    answers: ["Venus", "Saturn", "Mars", "Jupiter"],
    correct: 2,
  },
  {
    question: "What chemical element has the symbol 'O'?",
    answers: ["Osmium", "Oxygen", "Gold", "Iron"],
    correct: 1,
  },
  // Can add more for demo.
];

// --- Player Avatars (Initials + Color) ---
const PLAYER_INFO = [
  {
    name: "Player 1",
    color: COLORS.primary,
    avatar: "👨‍🦱",
  },
  {
    name: "Player 2",
    color: COLORS.accent,
    avatar: "👩‍🦰",
  },
];

// --- Helper Component: Scoreboard ---
function Scoreboard({ scores }) {
  return (
    <div className="scoreboard">
      {PLAYER_INFO.map((player, ix) => (
        <div
          key={ix}
          className="scoreboard-player"
          style={{ borderColor: player.color }}
        >
          <span className="player-avatar" aria-label={player.name}>
            {player.avatar}
          </span>
          <span className="player-name">{player.name}</span>
          <span
            className="player-score"
            style={{
              background: player.color + "22",
              color: player.color,
            }}
          >
            {scores[ix]}
          </span>
        </div>
      ))}
    </div>
  );
}

// --- Helper Component: Timer Bar ---
function TimerBar({ timeLeft, totalTime }) {
  const pct = (timeLeft / totalTime) * 100;
  return (
    <div className="timer-bar-outer" aria-label="Timer">
      <div
        className="timer-bar-inner"
        style={{
          width: pct + "%",
          background: pct < 30 ? COLORS.accent : COLORS.primary,
          transition: "width 0.2s linear",
        }}
      ></div>
      <span className="timer-bar-label">{timeLeft}s</span>
    </div>
  );
}

// --- Component: Trivia Game ---
function TriviaGame() {
  // Game phase: 'idle', 'question', 'feedback', 'gameover'
  const [phase, setPhase] = useState("idle");

  // State
  const [qIndex, setQIndex] = useState(0);
  const [scores, setScores] = useState([0, 0]);
  const [selections, setSelections] = useState([null, null]); // array of selected answer indices per player
  const [timestamps, setTimestamps] = useState([null, null]); // when each answered
  const [timer, setTimer] = useState(10); // seconds left
  const [timeoutFired, setTimeoutFired] = useState(false);

  const intervalRef = useRef();

  // Reset all state when (re)starting:
  function startGame() {
    setPhase("question");
    setQIndex(0);
    setScores([0, 0]);
    setSelections([null, null]);
    setTimestamps([null, null]);
    setTimer(10);
    setTimeoutFired(false);
  }

  // Begin timer at each question
  useEffect(() => {
    if (phase === "question") {
      setTimer(10);
      setTimeoutFired(false);
      setSelections([null, null]);
      setTimestamps([null, null]);
      intervalRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setTimeoutFired(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    // Cleanup timer on unmount/transition
    return () => clearInterval(intervalRef.current);
  }, [phase, qIndex]);

  // Handle timeout to show feedback if both not answered
  useEffect(() => {
    if (phase === "question" && timer === 0) {
      setTimeoutFired(true);
      setPhase("feedback");
    }
  }, [timer, phase]);

  // Move forward if both players submitted
  useEffect(() => {
    if (
      phase === "question" &&
      selections[0] !== null &&
      selections[1] !== null
    ) {
      clearInterval(intervalRef.current);
      setPhase("feedback");
    }
  }, [selections, phase]);

  // Calculate who gets point during feedback
  const getWinners = () => {
    const correct = MOCK_QUESTIONS[qIndex].correct;
    // Both correct? Fastest wins point
    if (
      selections[0] === correct &&
      selections[1] === correct &&
      timestamps[0] !== null &&
      timestamps[1] !== null
    ) {
      if (timestamps[0] < timestamps[1]) return [1, 0]; // P1 fastest
      if (timestamps[1] < timestamps[0]) return [0, 1]; // P2 fastest
      return [1, 1]; // Tie (both at same instant)
    }
    // Only P1 correct?
    if (selections[0] === correct && selections[1] !== correct) return [1, 0];
    // Only P2 correct?
    if (selections[1] === correct && selections[0] !== correct) return [0, 1];
    // Neither correct / time up
    return [0, 0];
  };

  // On feedback phase entry, update scores
  useEffect(() => {
    if (phase === "feedback") {
      const roundWinners = getWinners();
      setScores((prev) => [
        prev[0] + roundWinners[0],
        prev[1] + roundWinners[1],
      ]);
    }
    // eslint-disable-next-line
  }, [phase]);

  // Advance to next round logic
  function nextQuestion() {
    if (qIndex + 1 >= MOCK_QUESTIONS.length) {
      setPhase("gameover");
    } else {
      setQIndex(qIndex + 1);
      setPhase("question");
      setSelections([null, null]);
      setTimestamps([null, null]);
      setTimer(10);
      setTimeoutFired(false);
    }
  }

  // Handle player answer
  function handleAnswer(playerIdx, ansIdx) {
    if (
      phase !== "question" ||
      selections[playerIdx] !== null ||
      timer <= 0
    )
      return;

    // Save selection and answer time in ms since epoch (use Date.now())
    setSelections((sel) => {
      const next = [...sel];
      next[playerIdx] = ansIdx;
      return next;
    });
    setTimestamps((times) => {
      const tNext = [...times];
      tNext[playerIdx] = Date.now();
      return tNext;
    });
  }

  // Render
  const question = MOCK_QUESTIONS[qIndex];

  // Highlight answers in feedback
  function getBtnClass(playerIdx, ansIdx) {
    const selected = selections[playerIdx] === ansIdx;
    if (phase === "question") return selected ? "answer-btn selected" : "answer-btn";
    // Feedback: show green if selected and correct, red if selected and wrong, highlight correct elsewhere.
    if (selected && ansIdx === question.correct)
      return "answer-btn correct";
    if (selected && ansIdx !== question.correct)
      return "answer-btn wrong";
    if (!selected && ansIdx === question.correct)
      return "answer-btn reveal-correct";
    return "answer-btn";
  }

  // --- UI Layout ---
  return (
    <div className="trivia-root">
      <div className="game-card">
        <Scoreboard scores={scores} />
        {phase === "idle" && (
          <div className="idle-box">
            <h2>🎮 Trivia Battle Game</h2>
            <p>
              Two players compete to answer multiple choice questions.<br />
              The fastest correct answer wins the point!<br />
              <em>Use keyboard or click to play.<br/>
              Player 1: <strong>Q/W/E/R</strong> | Player 2: <strong>U/I/O/P</strong>
              </em>
            </p>
            <button
              className="action-btn primary"
              style={{ background: COLORS.primary }}
              onClick={startGame}
            >
              Start Game
            </button>
          </div>
        )}

        {(phase === "question" || phase === "feedback" || phase === "gameover") && (
          <div>
            {/* Timer */}
            {phase !== "gameover" && (
              <div style={{ margin: "18px 0" }}>
                <TimerBar timeLeft={timer} totalTime={10} />
              </div>
            )}
            {/* Question */}
            {phase !== "gameover" && (
              <div className="question-box">
                <div className="question-text">
                  {question.question}
                </div>
                <div className="answers-row">
                  {/* Player's answer choices shown side by side (top P1, P2 on mobile stack) */}
                  {PLAYER_INFO.map((player, pidx) => (
                    <div
                      key={pidx}
                      className="player-answer-col"
                      style={{
                        borderColor: player.color,
                        background: "#fff",
                      }}
                    >
                      <div className="player-answer-label" style={{ color: player.color }}>
                        {player.avatar} {player.name}
                      </div>
                      <div className="answers-list">
                        {question.answers.map((opt, aidx) => (
                          <button
                            key={aidx}
                            className={getBtnClass(pidx, aidx)}
                            disabled={
                              (phase !== "question") ||
                              selections[pidx] !== null ||
                              timer <= 0
                            }
                            style={{
                              borderColor:
                                phase !== "question" && question.correct === aidx
                                  ? COLORS.accent
                                  : player.color,
                            }}
                            onClick={() => handleAnswer(pidx, aidx)}
                          >
                            {String.fromCharCode(65 + aidx)}. {opt}
                          </button>
                        ))}
                      </div>
                      {phase === "feedback" && selections[pidx] !== null && (
                        <div className="answer-status">
                          {selections[pidx] === question.correct ? (
                            <span className="correct-indicator">✔️ Correct!</span>
                          ) : (
                            <span className="wrong-indicator">
                              ❌ {selections[pidx] === null ? "No answer" : "Wrong"}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback summary */}
            {phase === "feedback" && (
              <div className="feedback-info">
                <RoundFeedback
                  question={question}
                  selections={selections}
                  timestamps={timestamps}
                  winners={getWinners()}
                />
              </div>
            )}

            {/* Game over screen */}
            {phase === "gameover" && (
              <div className="idle-box" style={{ marginTop: "32px" }}>
                <h2>🏆 Game Over</h2>
                <p>
                  Final Scores:<br />
                  <span style={{ color: PLAYER_INFO[0].color }}>
                    {PLAYER_INFO[0].name}: {scores[0]}
                  </span>
                  {"  |  "}
                  <span style={{ color: PLAYER_INFO[1].color }}>
                    {PLAYER_INFO[1].name}: {scores[1]}
                  </span>
                </p>
                <h3>
                  {scores[0] > scores[1] && (
                    <span style={{ color: PLAYER_INFO[0].color }}>
                      {PLAYER_INFO[0].avatar} {PLAYER_INFO[0].name} Wins!
                    </span>
                  )}
                  {scores[1] > scores[0] && (
                    <span style={{ color: PLAYER_INFO[1].color }}>
                      {PLAYER_INFO[1].avatar} {PLAYER_INFO[1].name} Wins!
                    </span>
                  )}
                  {scores[0] === scores[1] && (
                    <span>🤝 It's a tie!</span>
                  )}
                </h3>
                <button
                  className="action-btn"
                  style={{ background: COLORS.secondary }}
                  onClick={startGame}
                >
                  Restart
                </button>
              </div>
            )}

            {/* Navigation button */}
            {phase === "feedback" && (
              <button
                className="action-btn"
                style={{ background: COLORS.accent, marginTop: 18 }}
                onClick={nextQuestion}
              >
                {qIndex + 1 >= MOCK_QUESTIONS.length ? "Finish Game" : "Next Question"}
              </button>
            )}
          </div>
        )}
      </div>
      {/* Keyboard controls info */}
      <div className="footer-help">
        <span className="kbd-hint" style={{ color: COLORS.primary }}>
          Player 1: Q/W/E/R
        </span>{" "}
        <span className="kbd-hint-divider">|</span>{" "}
        <span className="kbd-hint" style={{ color: COLORS.accent }}>
          Player 2: U/I/O/P
        </span>{" "}
        <span className="kbd-hint-divider">|</span>
        <span className="kbd-hint" style={{ color: COLORS.secondary }}>
          Space: Next
        </span>
      </div>
    </div>
  );
}

// --- Component: Per-Round Feedback/Text ---
function RoundFeedback({ question, selections, timestamps, winners }) {
  // winners = [p1, p2] array: who got the point
  const correct = question.correct;
  if (winners[0] === 1 && winners[1] === 0) {
    return (
      <span>
        <strong style={{ color: PLAYER_INFO[0].color }}>{PLAYER_INFO[0].name}</strong>{" "}
        was fastest with the correct answer! 🏅
      </span>
    );
  } else if (winners[1] === 1 && winners[0] === 0) {
    return (
      <span>
        <strong style={{ color: PLAYER_INFO[1].color }}>{PLAYER_INFO[1].name}</strong>{" "}
        was fastest with the correct answer! 🏅
      </span>
    );
  } else if (winners[0] === 1 && winners[1] === 1) {
    return (
      <span>
        <strong>Both players answered correctly at the same time! 🚀</strong>
      </span>
    );
  } else {
    // Neither answered correctly
    return (
      <span>
        <strong>No one got it right. The correct answer was: </strong>
        <span style={{ color: COLORS.accent }}>
          {String.fromCharCode(65 + correct)}. {question.answers[correct]}
        </span>
      </span>
    );
  }
}

// --- Keyboard shortcuts for fast play ---
function useGlobalKeyboard({ onAnswer, onNext }) {
  useEffect(() => {
    function handleKey(e) {
      /**
       * Player 1: Q/W/E/R = 0/1/2/3
       * Player 2: U/I/O/P = 0/1/2/3
       * Next:     Spacebar
       */
      const key = e.key.toLowerCase();
      if (key === "q") onAnswer?.(0, 0);
      else if (key === "w") onAnswer?.(0, 1);
      else if (key === "e") onAnswer?.(0, 2);
      else if (key === "r") onAnswer?.(0, 3);
      else if (key === "u") onAnswer?.(1, 0);
      else if (key === "i") onAnswer?.(1, 1);
      else if (key === "o") onAnswer?.(1, 2);
      else if (key === "p") onAnswer?.(1, 3);
      else if (key === " ") onNext?.();
    }
    window.addEventListener("keydown", handleKey, { passive: false });
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line
  }, []);
  return null;
}

// --- Main App wrapper + Theme Toggle ---
function App() {
  const [theme, setTheme] = useState("light");

  // UI theme config: inject main color CSS variables according to palette
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--bg-primary", COLORS.bg);
    root.style.setProperty("--bg-secondary", COLORS.cardBg);
    root.style.setProperty("--primary", COLORS.primary);
    root.style.setProperty("--secondary", COLORS.secondary);
    root.style.setProperty("--accent", COLORS.accent);
    root.style.setProperty("--text-primary", COLORS.text);
    root.style.setProperty("--border-color", COLORS.border);
    root.style.setProperty("--button-bg", COLORS.primary);
    root.style.setProperty("--button-text", "#fff");
    root.setAttribute("data-theme", theme);
  }, [theme]);

  // Handle keyboard globally for the game logic to hook into:
  // We set up a ref with the current answering/next-question callbacks.
  const answerRef = useRef();
  const nextRef = useRef();
  useGlobalKeyboard({
    onAnswer: (p, idx) => answerRef.current?.(p, idx),
    onNext: () => nextRef.current?.(),
  });

  // Hoist game logic state/handlers so we can pass to useGlobalKeyboard
  // We need to bridge props to the underlying TriviaGame instance
  const [gameState, setGameState] = useState({});

  // Handles: store refs to answer/next handlers made by TriviaGame
  function onRegister({ answerHandler, nextHandler }) {
    answerRef.current = answerHandler;
    nextRef.current = nextHandler;
    setGameState({ answerHandler, nextHandler });
  }

  // Render
  return (
    <div className="App">
      <header className="App-header" style={{ background: "var(--bg-primary)" }}>
        <button
          className="theme-toggle"
          onClick={() =>
            setTheme((t) => (t === "light" ? "dark" : "light"))
          }
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
        {/* Trivia Game */}
        <TriviaGameBridge onRegister={onRegister} />
      </header>
    </div>
  );
}

// --- TriviaGame wrapper to expose answer/next props for keyboard ---
function TriviaGameBridge({ onRegister }) {
  // The handlers passed out for useGlobalKeyboard
  const [handlers, setHandlers] = useState({});
  // Setup real game:
  const [tgProps, setTgProps] = useState({});

  // We'll "capture" assignment to handleAnswer/nextQuestion methods from TriviaGame
  const handlerRef = useRef({});
  const setHandler = (h) => {
    handlerRef.current = h;
    setHandlers(h);
    onRegister && onRegister(h);
  };

  return (
    <TriviaGameWithHandlers
      setHandler={setHandler}
    />
  );
}


// --- The actual game logic, plus hook for handler assignment ---
function TriviaGameWithHandlers({ setHandler }) {
  // game state synced as in TriviaGame
  const [phase, setPhase] = useState("idle");
  const [qIndex, setQIndex] = useState(0);
  const [scores, setScores] = useState([0, 0]);
  const [selections, setSelections] = useState([null, null]);
  const [timestamps, setTimestamps] = useState([null, null]);
  const [timer, setTimer] = useState(10);

  const intervalRef = useRef();
  const [timeoutFired, setTimeoutFired] = useState(false);

  function startGame() {
    setPhase("question");
    setQIndex(0);
    setScores([0, 0]);
    setSelections([null, null]);
    setTimestamps([null, null]);
    setTimer(10);
    setTimeoutFired(false);
  }
  useEffect(() => {
    if (phase === "question") {
      setTimer(10);
      setTimeoutFired(false);
      setSelections([null, null]);
      setTimestamps([null, null]);
      intervalRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setTimeoutFired(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [phase, qIndex]);
  useEffect(() => {
    if (phase === "question" && timer === 0) {
      setTimeoutFired(true);
      setPhase("feedback");
    }
  }, [timer, phase]);
  useEffect(() => {
    if (
      phase === "question" &&
      selections[0] !== null &&
      selections[1] !== null
    ) {
      clearInterval(intervalRef.current);
      setPhase("feedback");
    }
  }, [selections, phase]);
  const question = MOCK_QUESTIONS[qIndex];

  function getWinners() {
    const correct = question.correct;
    if (
      selections[0] === correct &&
      selections[1] === correct &&
      timestamps[0] !== null &&
      timestamps[1] !== null
    ) {
      if (timestamps[0] < timestamps[1]) return [1, 0];
      if (timestamps[1] < timestamps[0]) return [0, 1];
      return [1, 1];
    }
    if (selections[0] === correct && selections[1] !== correct) return [1, 0];
    if (selections[1] === correct && selections[0] !== correct) return [0, 1];
    return [0, 0];
  }

  useEffect(() => {
    if (phase === "feedback") {
      const roundWinners = getWinners();
      setScores((prev) => [
        prev[0] + roundWinners[0],
        prev[1] + roundWinners[1],
      ]);
    }
    // eslint-disable-next-line
  }, [phase]);

  function nextQuestion() {
    if (phase !== "feedback") return;
    if (qIndex + 1 >= MOCK_QUESTIONS.length) {
      setPhase("gameover");
    } else {
      setQIndex(qIndex + 1);
      setPhase("question");
      setSelections([null, null]);
      setTimestamps([null, null]);
      setTimer(10);
      setTimeoutFired(false);
    }
  }

  function handleAnswer(playerIdx, ansIdx) {
    if (
      phase !== "question" ||
      selections[playerIdx] !== null ||
      timer <= 0
    )
      return;
    setSelections((sel) => {
      const next = [...sel];
      next[playerIdx] = ansIdx;
      return next;
    });
    setTimestamps((times) => {
      const tNext = [...times];
      tNext[playerIdx] = Date.now();
      return tNext;
    });
  }
  // Expose handlers for keyboard
  useEffect(() => {
    setHandler({
      answerHandler: handleAnswer,
      nextHandler: nextQuestion,
    });
    // eslint-disable-next-line
  }, [handleAnswer, nextQuestion, phase]);

  // The UI below replicates TriviaGame above w/ state mapped to this wrapper's
  return (
    <div className="trivia-root">
      <div className="game-card">
        <Scoreboard scores={scores} />
        {phase === "idle" && (
          <div className="idle-box">
            <h2>🎮 Trivia Battle Game</h2>
            <p>
              Two players compete to answer multiple choice questions.<br />
              The fastest correct answer wins the point!<br />
              <em>Use keyboard or click to play. <br/>
              Player 1: <strong>Q/W/E/R</strong> | Player 2: <strong>U/I/O/P</strong>
              </em>
            </p>
            <button
              className="action-btn primary"
              style={{ background: COLORS.primary }}
              onClick={startGame}
            >
              Start Game
            </button>
          </div>
        )}
        {(phase === "question" || phase === "feedback" || phase === "gameover") && (
          <div>
            {phase !== "gameover" && (
              <div style={{ margin: "18px 0" }}>
                <TimerBar timeLeft={timer} totalTime={10} />
              </div>
            )}
            {phase !== "gameover" && (
              <div className="question-box">
                <div className="question-text">
                  {question.question}
                </div>
                <div className="answers-row">
                  {PLAYER_INFO.map((player, pidx) => (
                    <div
                      key={pidx}
                      className="player-answer-col"
                      style={{
                        borderColor: player.color,
                        background: "#fff",
                      }}
                    >
                      <div className="player-answer-label" style={{ color: player.color }}>
                        {player.avatar} {player.name}
                      </div>
                      <div className="answers-list">
                        {question.answers.map((opt, aidx) => {
                          const selected = selections[pidx] === aidx;
                          let btnClass = "answer-btn";
                          if (phase === "question") btnClass = selected ? "answer-btn selected" : "answer-btn";
                          else if (selected && aidx === question.correct) btnClass = "answer-btn correct";
                          else if (selected && aidx !== question.correct) btnClass = "answer-btn wrong";
                          else if (!selected && aidx === question.correct) btnClass = "answer-btn reveal-correct";
                          return (
                            <button
                              key={aidx}
                              className={btnClass}
                              disabled={
                                (phase !== "question") ||
                                selections[pidx] !== null ||
                                timer <= 0
                              }
                              style={{
                                borderColor:
                                  phase !== "question" && question.correct === aidx
                                    ? COLORS.accent
                                    : player.color,
                              }}
                              onClick={() => handleAnswer(pidx, aidx)}
                            >
                              {String.fromCharCode(65 + aidx)}. {opt}
                            </button>
                          );
                        })}
                      </div>
                      {phase === "feedback" && selections[pidx] !== null && (
                        <div className="answer-status">
                          {selections[pidx] === question.correct ? (
                            <span className="correct-indicator">✔️ Correct!</span>
                          ) : (
                            <span className="wrong-indicator">
                              ❌ {selections[pidx] === null ? "No answer" : "Wrong"}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {phase === "feedback" && (
              <div className="feedback-info">
                <RoundFeedback
                  question={question}
                  selections={selections}
                  timestamps={timestamps}
                  winners={getWinners()}
                />
              </div>
            )}
            {phase === "gameover" && (
              <div className="idle-box" style={{ marginTop: "32px" }}>
                <h2>🏆 Game Over</h2>
                <p>
                  Final Scores:<br />
                  <span style={{ color: PLAYER_INFO[0].color }}>
                    {PLAYER_INFO[0].name}: {scores[0]}
                  </span>
                  {"  |  "}
                  <span style={{ color: PLAYER_INFO[1].color }}>
                    {PLAYER_INFO[1].name}: {scores[1]}
                  </span>
                </p>
                <h3>
                  {scores[0] > scores[1] && (
                    <span style={{ color: PLAYER_INFO[0].color }}>
                      {PLAYER_INFO[0].avatar} {PLAYER_INFO[0].name} Wins!
                    </span>
                  )}
                  {scores[1] > scores[0] && (
                    <span style={{ color: PLAYER_INFO[1].color }}>
                      {PLAYER_INFO[1].avatar} {PLAYER_INFO[1].name} Wins!
                    </span>
                  )}
                  {scores[0] === scores[1] && (
                    <span>🤝 It's a tie!</span>
                  )}
                </h3>
                <button
                  className="action-btn"
                  style={{ background: COLORS.secondary }}
                  onClick={startGame}
                >
                  Restart
                </button>
              </div>
            )}
            {phase === "feedback" && (
              <button
                className="action-btn"
                style={{ background: COLORS.accent, marginTop: 18 }}
                onClick={nextQuestion}
              >
                {qIndex + 1 >= MOCK_QUESTIONS.length ? "Finish Game" : "Next Question"}
              </button>
            )}
          </div>
        )}
      </div>
      {/* Keyboard controls info */}
      <div className="footer-help">
        <span className="kbd-hint" style={{ color: COLORS.primary }}>
          Player 1: Q/W/E/R
        </span>{" "}
        <span className="kbd-hint-divider">|</span>{" "}
        <span className="kbd-hint" style={{ color: COLORS.accent }}>
          Player 2: U/I/O/P
        </span>{" "}
        <span className="kbd-hint-divider">|</span>
        <span className="kbd-hint" style={{ color: COLORS.secondary }}>
          Space: Next
        </span>
      </div>
    </div>
  );
}

export default App;
