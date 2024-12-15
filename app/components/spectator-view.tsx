import { AnimatePresence, motion } from "framer-motion";
import { Bell, Crown, Trophy, Users, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { GameContext } from "~/game.context";
import type { Answer, GamePublicContext } from "~/game.types";

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

export const SpectatorView = ({ host }: { host: string }) => {
  const gameState = GameContext.useSelector((state) => state);
  const { gameStatus, currentQuestion, players, questionResults, questions } = gameState.public;
  const playSound = useSoundEffects();
  const prevQuestionRef = useRef<typeof currentQuestion>(null);

  // Update sound effect logic
  useEffect(() => {
    const isSkip = prevQuestionRef.current && !currentQuestion;
    const isNewQuestion = !prevQuestionRef.current && currentQuestion;
    
    if (isSkip) {
      playSound("SKIP");
    } else if (isNewQuestion) {
      playSound("QUESTION");
    }
    
    prevQuestionRef.current = currentQuestion;
  }, [currentQuestion, playSound]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <AnimatePresence mode="wait">
        {gameStatus === "lobby" && (
          <LobbyDisplay players={players} host={host} />
        )}

        {gameStatus === "active" && currentQuestion && (
          <GameplayDisplay
            currentQuestion={currentQuestion}
            players={players}
          />
        )}

        {gameStatus === "active" && !currentQuestion && questionResults.length > 0 && (
          <QuestionResultsDisplay
            players={players}
            questionResults={questionResults}
            questions={questions}
          />
        )}

        {gameStatus === "active" && !currentQuestion && questionResults.length === 0 && (
          <WaitingForQuestionDisplay players={players} />
        )}

        {gameStatus === "finished" && <GameFinishedDisplay players={players} />}
      </AnimatePresence>
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
}: {
  currentQuestion: { questionId: string; startTime: number; answers: Answer[] } | null;
  players: Array<{ id: string; name: string; score: number }>;
}) => {
  const gameState = GameContext.useSelector((state) => state.public);
  
  // Get question text from questions collection
  const questionText = currentQuestion 
    ? gameState.questions[currentQuestion.questionId]?.text 
    : null;

  // Calculate remaining time
  const remainingTime = currentQuestion 
    ? Math.max(0, Math.ceil(
        (currentQuestion.startTime + (gameState.settings.answerTimeWindow * 1000) - Date.now()) / 1000
      ))
    : 0;

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

            {/* Question Display */}
            <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-12">
              {questionText}
            </h1>

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
        className="relative z-10 w-full max-w-4xl bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50"
        data-testid="game-over-title"
      >
        <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Game Over!
        </h1>

        {/* Add winner announcement section */}
        <div className="text-center mb-8" data-testid="winner-announcement">
          <div className="text-6xl mb-4">👑</div>
          <h2 className="text-2xl font-bold text-indigo-300">
            {winner.name} Wins!
          </h2>
          <p className="text-xl text-indigo-300/70">
            with {winner.score} points
          </p>
        </div>

        <div className="space-y-3 mb-8">
          <h2
            className="text-xl font-bold mb-4 text-indigo-300 flex items-center gap-2"
            data-testid="final-scores-heading"
          >
            <Trophy className="w-6 h-6" /> Final Scores
          </h2>
          {sortedPlayers.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex justify-between items-center p-4 rounded-xl border ${
                index === 0
                  ? "bg-yellow-500/10 border-yellow-500/30"
                  : "bg-gray-800/30 border-gray-700/30"
              }`}
              data-testid={`player-score-${player.id}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-indigo-400">
                  #{index + 1}
                </span>
                <span className="font-medium">{player.name}</span>
              </div>
              <span className="text-xl font-bold text-indigo-400">
                {player.score}
              </span>
            </motion.div>
          ))}
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
            <div className="text-4xl font-bold text-green-400" data-testid="correct-answer">
              {question.correctAnswer}
            </div>
          </div>

          {/* Results */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <h2 className="text-2xl font-bold text-indigo-300 mb-6">Results</h2>
            <div className="space-y-4">
              {latestResult.scores.map((score: { 
                playerId: string;
                playerName: string;
                points: number;
                position: number;
                timeTaken: number;
              }) => (
                <motion.div
                  key={score.playerId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  data-testid={`player-result-${score.playerId}`}
                  className="bg-gray-900/50 rounded-xl p-4 flex justify-between items-center border border-gray-700/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-indigo-400">
                      #{score.position}
                    </div>
                    <div>
                      <div className="text-xl font-medium text-white/90">
                        {score.playerName}
                      </div>
                      <div className="text-sm text-white/60">
                        {score.timeTaken.toFixed(1)}s
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-indigo-400">
                    {score.points} points
                  </div>
                </motion.div>
              ))}
            </div>
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
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

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
      <div className="relative z-10 w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {/* Waiting Message */}
          <div className="mb-12">
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

          {/* Current Standings */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <h2 className="text-2xl font-bold text-indigo-300 mb-6">Current Standings</h2>
            <div className="space-y-3">
              {sortedPlayers.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-gray-900/50 rounded-xl p-4 flex justify-between items-center border border-gray-700/50 ${
                    index === 0 ? "bg-yellow-500/10 border-yellow-500/30" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-indigo-400">
                      #{index + 1}
                    </span>
                    <span className="text-xl font-medium text-white/90">
                      {player.name}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-indigo-400">
                    {player.score}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
