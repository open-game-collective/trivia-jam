import { AnimatePresence, motion } from "framer-motion";
import { Bell, Crown, Trophy, Users, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { GameContext } from "~/game.context";
import type { Answer, GamePublicContext, Question } from "~/game.types";

const SOUND_EFFECTS = {
  // Classic game show buzzer sound
  BUZZ: "https://www.soundjay.com/misc/sounds/fail-buzzer-01.mp3",
  // Short positive ding for correct answers
  CORRECT: "https://cdn.freesound.org/previews/270/270404_5123851-lq.mp3",
  // Quick error sound for incorrect/skip
  INCORRECT:
    "https://www.myinstants.com/media/sounds/wrong-answer-sound-effect.mp3",
  // Use same sound for skip
  SKIP: "https://cdn.freesound.org/previews/362/362205_6629901-lq.mp3",
  // New attention-grabbing sound for question introduction
  QUESTION: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
  // Updated game over sound to a different fanfare
  GAME_OVER: "https://cdn.freesound.org/previews/171/171671_2437358-lq.mp3"
} as const;

// Update the useSoundEffects hook to preload sounds
const useSoundEffects = () => {
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize and preload audio elements
  useEffect(() => {
    let mounted = true;
    let loadedCount = 0;
    const totalSounds = Object.keys(SOUND_EFFECTS).length;

    // Create and preload all audio elements
    Object.entries(SOUND_EFFECTS).forEach(([key, url]) => {
      const audio = new Audio();

      audio.addEventListener("canplaythrough", () => {
        if (mounted) {
          loadedCount++;
          if (loadedCount === totalSounds) {
            setIsLoaded(true);
          }
        }
      });

      audio.src = url;
      audio.preload = "auto";
      audio.volume = 0.5;
      audioElementsRef.current[key] = audio;
    });

    // Cleanup
    return () => {
      mounted = false;
      Object.values(audioElementsRef.current).forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
    };
  }, []);

  const playSound = (soundKey: keyof typeof SOUND_EFFECTS) => {
    if (!isLoaded) return;

    const audio = audioElementsRef.current[soundKey];
    if (audio) {
      // Create a new audio element for each play to allow overlapping sounds
      const newAudio = new Audio(audio.src);
      newAudio.volume = 0.5;
      newAudio.play().catch((err) => {
        console.warn(`Failed to play ${soundKey} sound:`, err);
      });
    }
  };

  return playSound;
};

const QuestionProgress = ({ 
  current, 
  total 
}: { 
  current: number; 
  total: number;
}) => {
  const progress = (current / total) * 100;
  
  return (
    <div className="fixed top-0 left-0 right-80 p-4 z-50">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-gray-800/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="text-sm font-medium text-white/70 tabular-nums">
            {current} / {total}
          </div>
        </div>
      </div>
    </div>
  );
};

// Add the Scoreboard component
const Scoreboard = ({
  players,
}: {
  players: Array<{ id: string; name: string; score: number }>;
}) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-gray-800/30 backdrop-blur-sm border-l border-gray-700/50 p-4 overflow-y-auto">
      <h2 className="text-xl font-bold text-indigo-300 mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5" /> Scoreboard
      </h2>
      <div className="space-y-2">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`p-3 rounded-lg ${
              index === 0 ? "bg-yellow-500/10 border border-yellow-500/30" : "bg-gray-800/30 border border-gray-700/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-indigo-400">#{index + 1}</span>
                <span className="font-medium">{player.name}</span>
              </div>
              <span className="font-bold text-indigo-400">{player.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SpectatorView = ({ host }: { host: string }) => {
  const gameState = GameContext.useSelector((state) => state);
  const { gameStatus, currentQuestion, players, questionResults, questions, settings, questionNumber } = gameState.public;
  const playSound = useSoundEffects();
  const prevQuestionRef = useRef<typeof currentQuestion>(null);

  // Update sound effect logic
  useEffect(() => {
    const isQuestionEnding = prevQuestionRef.current && !currentQuestion;
    const isQuestionStarting = !prevQuestionRef.current && currentQuestion;
    
    if (isQuestionEnding && prevQuestionRef.current) {
      // Check if any player got the exact answer
      const question = gameState.public.questions[prevQuestionRef.current.questionId];
      const hasCorrectAnswer = prevQuestionRef.current.answers.some(
        answer => answer.value === question.correctAnswer
      );
      
      // Play correct sound if someone got it right, incorrect sound if not
      playSound(hasCorrectAnswer ? "CORRECT" : "INCORRECT");
    } else if (isQuestionStarting) {
      // Play start sound when new question appears
      playSound("QUESTION");
    }
    
    prevQuestionRef.current = currentQuestion;
  }, [currentQuestion, playSound, gameState.public.questions]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Add persistent scoreboard */}
      {gameStatus !== "lobby" && <Scoreboard players={players} />}
      
      {/* Adjust main content area to account for scoreboard */}
      <div className={`${gameStatus !== "lobby" ? "mr-80" : ""}`}>
        <AnimatePresence mode="wait">
          {gameStatus === "lobby" && (
            <LobbyDisplay players={players} host={host} />
          )}

          {gameStatus === "active" && (
            <>
              <QuestionProgress 
                current={questionNumber} 
                total={Object.keys(questions).length} 
              />
              
              {currentQuestion && (
                <GameplayDisplay
                  currentQuestion={currentQuestion}
                  players={players}
                  questions={questions}
                />
              )}

              {!currentQuestion && questionResults.length > 0 && (
                <QuestionResultsDisplay
                  players={players}
                  questionResults={questionResults}
                  questions={questions}
                />
              )}

              {!currentQuestion && questionResults.length === 0 && (
                <WaitingForQuestionDisplay players={players} />
              )}
            </>
          )}

          {gameStatus === "finished" && <GameFinishedDisplay players={players} />}
        </AnimatePresence>
      </div>
    </div>
  );
};

const LobbyDisplay = ({
  players,
  host,
}: {
  players: Array<{ id: string; name: string; score: number }>;
  host: string;
}) => {
  const maxPlayers = 10;
  const {
    players: currentPlayers,
    hostId,
    id,
  } = GameContext.useSelector((state) => ({
    players: state.public.players,
    hostId: state.public.hostId,
    id: state.public.id,
  }));

  // Construct the game URL using the host prop
  const gameUrl = `https://${host}/games/${id}`;

  // Create array of length maxPlayers filled with players or undefined
  const slots = Array(maxPlayers)
    .fill(undefined)
    .map((_, i) => currentPlayers[i]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative z-10 w-full max-w-4xl bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50"
      >
        <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Waiting for Game to Start
        </h1>

        {/* QR Code Section */}
        <div
          className="mb-8 flex flex-col items-center"
          data-testid="qr-code-section"
        >
          <div className="bg-white p-4 rounded-xl mb-4">
            <QRCodeSVG value={gameUrl} size={200} data-testid="game-qr-code" />
          </div>
          <p
            className="text-center text-indigo-300/70"
            data-testid="qr-code-label"
          >
            Scan to join the game
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-bold mb-4 text-indigo-300 flex items-center gap-2">
            <Users className="w-6 h-6" /> Players ({currentPlayers.length}/
            {maxPlayers})
          </h2>
          <AnimatePresence mode="popLayout">
            {slots.map((player, index) => (
              <motion.div
                key={player?.id || `empty-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex justify-between items-center p-4 rounded-xl border ${
                  player
                    ? "bg-gray-800/30 border-gray-700/30"
                    : "bg-gray-800/10 border-gray-700/20"
                }`}
              >
                {player ? (
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{player.name}</span>
                    {player.id === hostId && (
                      <span className="px-2 py-1 text-xs font-bold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                        Host
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-white/30 font-medium">Empty Slot</span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

const CelebrationDisplay = ({
  winner,
  players,
  previousRank,
}: {
  winner: { playerId: string; playerName: string };
  players: Array<{ id: string; name: string; score: number }>;
  previousRank?: number;
}) => {
  // Create a copy before sorting
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const currentRank =
    sortedPlayers.findIndex((p) => p.id === winner.playerId) + 1;
  const player = players.find((p) => p.id === winner.playerId);
  const rankImproved = previousRank && currentRank < previousRank;

  const getPlaceEmoji = (place: number) => {
    switch (place) {
      case 1:
        return "👑";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return "🌟";
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="bg-gradient-to-r from-indigo-500 to-purple-500 p-1 rounded-2xl mb-8"
        data-testid="celebration-container"
      >
        <div className="bg-gray-900 rounded-xl p-8">
          <h2
            className="text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-4"
            data-testid="correct-message"
          >
            Correct! 🎉
          </h2>
          <div
            className="text-3xl text-center text-white/90"
            data-testid="winner-name"
          >
            <span className="font-bold text-indigo-400">
              {winner.playerName}
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
        data-testid="rank-display"
      >
        <div className="text-6xl mb-4">{getPlaceEmoji(currentRank)}</div>
        <div className="text-3xl">
          {rankImproved ? (
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5 }}
              className="text-green-400"
            >
              Moved up to <span className="font-bold">#{currentRank}</span>!
            </motion.div>
          ) : (
            <span>
              In{" "}
              <span className="font-bold text-yellow-400">#{currentRank}</span>{" "}
              Place
            </span>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-4xl font-bold text-center"
        data-testid="score-display"
      >
        Score: <span className="text-indigo-400">{player?.score || 0}</span>
      </motion.div>
    </div>
  );
};

const GameplayDisplay = ({
  currentQuestion,
  players,
  questions,
}: {
  currentQuestion: { questionId: string; startTime: number; answers: Answer[] } | null;
  players: Array<{ id: string; name: string; score: number }>;
  questions: Record<string, Question>;
}) => {
  const gameState = GameContext.useSelector((state) => state.public);
  const [remainingTime, setRemainingTime] = useState(gameState.settings.answerTimeWindow);
  
  // Add useEffect to update the timer
  useEffect(() => {
    if (!currentQuestion) return;

    const updateTimer = () => {
      const elapsed = (Date.now() - currentQuestion.startTime) / 1000;
      const remaining = Math.max(0, Math.ceil(gameState.settings.answerTimeWindow - elapsed));
      setRemainingTime(remaining);
    };

    // Update immediately
    updateTimer();

    // Set up interval to update every 100ms
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [currentQuestion, gameState.settings.answerTimeWindow]);

  // Get question text from questions collection
  const questionText = currentQuestion 
    ? gameState.questions[currentQuestion.questionId]?.text 
    : null;

  // Create a map of all players with their answers (or null if not answered)
  const playerAnswers = players.reduce<Record<string, Answer | null>>((acc, player) => {
    acc[player.id] = currentQuestion?.answers.find(a => a.playerId === player.id) || null;
    return acc;
  }, {});

  // Sort players by answer time (unanswered at the bottom)
  const sortedPlayers = [...players].sort((a, b) => {
    const aAnswer = playerAnswers[a.id];
    const bAnswer = playerAnswers[b.id];
    if (!aAnswer && !bAnswer) return 0;
    if (!aAnswer) return 1;
    if (!bAnswer) return -1;
    return aAnswer.timestamp - bAnswer.timestamp;
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-16 p-8 relative">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-4xl">
        {currentQuestion && questionText && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {/* Timer Display */}
            <motion.div
              className="text-7xl font-bold text-indigo-400 mb-8"
              data-testid="question-timer"
              animate={{
                scale: remainingTime <= 5 ? [1, 1.1, 1] : 1,
                color: remainingTime <= 5 ? ["#818CF8", "#EF4444", "#818CF8"] : "#818CF8",
              }}
              transition={{
                duration: 1,
                repeat: remainingTime <= 5 ? Infinity : 0,
              }}
            >
              {remainingTime}s
            </motion.div>

            {/* Question */}
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                {currentQuestion && questions[currentQuestion.questionId] ? 
                  questions[currentQuestion.questionId].text : 
                  'Loading question...'}
              </h1>
              {currentQuestion && questions[currentQuestion.questionId]?.questionType === "multiple-choice" && 
               questions[currentQuestion.questionId]?.options ? (
                <div className="mt-8 space-y-4 max-w-2xl mx-auto">
                  {(() => {
                    const question = questions[currentQuestion.questionId];
                    if (!question?.options) return null;
                    return question.options.map((option: string, index: number) => (
                      <div 
                        key={option}
                        className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/30"
                      >
                        <div className="flex items-start gap-4">
                          <span className="text-indigo-400 font-bold">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="text-xl">
                            {option}
                          </span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              ) : null}
            </div>

            {/* Answers Section */}
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
              <h2 className="text-2xl font-bold text-indigo-300 mb-6 flex items-center justify-center gap-3">
                <Users className="w-6 h-6" />
                Answers Submitted: {currentQuestion.answers.length} / {players.length}
              </h2>

              <div className="space-y-3">
                {sortedPlayers.map((player) => {
                  const answer = playerAnswers[player.id];
                  const hasAnswered = !!answer;

                  return (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      data-testid={`player-answer-${player.id}`}
                      className={`rounded-xl p-4 flex justify-between items-center border ${
                        hasAnswered 
                          ? "bg-gray-900/50 border-gray-700/50" 
                          : "bg-gray-900/20 border-gray-700/20"
                      }`}
                    >
                      <span className={`text-xl font-medium ${hasAnswered ? "text-white/90" : "text-white/50"}`}>
                        {player.name}
                      </span>
                      {hasAnswered ? (
                        <span className="text-xl font-bold text-indigo-400">
                          {((answer.timestamp - currentQuestion.startTime) / 1000).toFixed(1)}s
                        </span>
                      ) : (
                        <span className="text-lg text-indigo-400/50">
                          Waiting...
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Add custom scrollbar styles to your CSS
const customScrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const GameFinishedDisplay = ({
  players,
}: {
  players: Array<{ id: string; name: string; score: number }>;
}) => {
  // Create a copy before sorting
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0]; // Get the player with highest score

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 text-center"
        data-testid="game-over-title"
      >
        <h1 className="text-6xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Game Over!
        </h1>

        {/* Winner announcement section */}
        <div className="text-center" data-testid="winner-announcement">
          <div className="text-8xl mb-6">👑</div>
          <h2 className="text-4xl font-bold text-indigo-300 mb-4">
            {winner.name} Wins!
          </h2>
          <p className="text-2xl text-indigo-300/70">
            with {winner.score} points
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const QuestionResultsDisplay = ({
  players,
  questionResults,
  questions,
}: {
  players: Array<{ id: string; name: string; score: number }>;
  questionResults: GamePublicContext['questionResults'];
  questions: GamePublicContext['questions'];
}) => {
  const latestResult = questionResults[questionResults.length - 1];
  const question = latestResult ? questions[latestResult.questionId] : null;

  if (!latestResult || !question) return null;

  // Sort scores by position (ascending) since position already accounts for points and time
  const sortedScores = [...latestResult.scores].sort((a, b) => a.position - b.position);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-16 p-8 relative">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {/* Question & Answer */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-6">
              {question.text}
            </h1>
            {question.questionType === "multiple-choice" && question.options ? (
              <div className="space-y-4 mb-6">
                {question.options.map((option, index) => (
                  <div 
                    key={option}
                    className={`p-4 rounded-xl ${
                      option === question.correctAnswer 
                        ? 'bg-green-500/10 border border-green-500/30' 
                        : 'bg-gray-800/30 border border-gray-700/30'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-indigo-400 font-bold">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-xl">
                        {option}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="text-4xl font-bold text-green-400" data-testid="correct-answer">
              {question.correctAnswer}
            </div>
          </div>

          {/* Results */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <h2 className="text-2xl font-bold text-indigo-300 mb-6">Results</h2>
            
            {latestResult.answers.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <div className="text-4xl mb-4">😴</div>
                <div className="text-xl text-white/70">
                  No one answered this question
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {sortedScores.map((score) => {
                  const answer = latestResult.answers.find(a => a.playerId === score.playerId);
                  if (!answer) return null;

                  const isExact = answer.value === question.correctAnswer;
                  const isClose = question.questionType === "numeric" && 
                    typeof answer.value === "number" && 
                    typeof question.correctAnswer === "number" ? 
                    Math.abs(answer.value - question.correctAnswer) / question.correctAnswer < 0.1 : 
                    false; // Within 10%

                  return (
                    <motion.div
                      key={answer.playerId}
                      data-testid={`player-result-${answer.playerId}`}
                      className={`${
                        score && score.points > 0 ? 'bg-green-500/10 border border-green-500/30' : 
                        isClose ? 'bg-yellow-500/10 border border-yellow-500/30' :
                        'bg-gray-900/50'
                      } rounded-2xl p-6 flex items-center gap-6`}
                    >
                      <div className="text-2xl font-bold text-indigo-400 w-12 text-center">
                        {score && score.points > 0 ? `#${score.position}` : "―"}
                      </div>
                      <div className="flex-1">
                        <div className="text-xl font-medium">{answer.playerName}</div>
                        <div className="text-sm text-gray-400">
                          {answer.value} • {score.timeTaken.toFixed(1)}s
                        </div>
                      </div>
                      {score.points > 0 && (
                        <div className="text-2xl font-bold text-indigo-400">
                          {score.points} <span className="text-indigo-400/70">pts</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const WaitingForQuestionDisplay = ({
  players,
}: {
  players: Array<{ id: string; name: string; score: number }>;
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {/* Waiting Message */}
          <div>
            <h1 
              className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-6"
              data-testid="waiting-for-question"
            >
              Waiting for Question...
            </h1>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-4xl text-indigo-400/60"
            >
              ⏳
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
