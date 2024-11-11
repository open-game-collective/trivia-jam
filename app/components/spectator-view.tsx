import { AnimatePresence, motion } from "framer-motion";
import { Bell, Crown, Trophy, Users, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { GameContext } from "~/game.context";

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
  QUESTION: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3"
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
  const { gameStatus, currentQuestion, buzzerQueue, players } =
    gameState.public;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <AnimatePresence mode="wait">
        {gameStatus === "lobby" && (
          <LobbyDisplay players={players} host={host} />
        )}

        {gameStatus === "active" && (
          <GameplayDisplay
            currentQuestion={currentQuestion}
            buzzerQueue={buzzerQueue}
            players={players}
            lastAnswerResult={gameState.public.lastAnswerResult}
            previousAnswers={gameState.public.previousAnswers}
          />
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
  buzzerQueue,
  players,
  lastAnswerResult,
  previousAnswers = [],
}: {
  currentQuestion: { text: string } | null;
  buzzerQueue: string[];
  players: Array<{ id: string; name: string; score: number }>;
  lastAnswerResult?: {
    playerId: string;
    playerName: string;
    correct: boolean;
  } | null;
  previousAnswers?: Array<{
    playerId: string;
    playerName: string;
    correct: boolean;
  }>;
}) => {
  // Move all hooks to the top
  const playSound = useSoundEffects();
  const prevBuzzerQueueRef = useRef<string[]>([]);
  const prevLastAnswerResultRef = useRef(lastAnswerResult);
  const prevQuestionRef = useRef(currentQuestion);

  // Create a copy before sorting
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // Play sound when new player buzzes in
  useEffect(() => {
    if (buzzerQueue.length > prevBuzzerQueueRef.current.length) {
      playSound("BUZZ");
    }
    prevBuzzerQueueRef.current = buzzerQueue;
  }, [buzzerQueue, playSound]);

  // Play sound for answer results
  useEffect(() => {
    if (
      lastAnswerResult &&
      lastAnswerResult !== prevLastAnswerResultRef.current
    ) {
      playSound(lastAnswerResult.correct ? "CORRECT" : "INCORRECT");
    }
    prevLastAnswerResultRef.current = lastAnswerResult;
  }, [lastAnswerResult, playSound]);

  // Play sound for skipped questions
  useEffect(() => {
    if (!prevQuestionRef.current && currentQuestion) {
      // New question appeared
      playSound("QUESTION");
    } else if (prevQuestionRef.current && !currentQuestion && !lastAnswerResult) {
      // Question was skipped
      playSound("SKIP");
    }
    prevQuestionRef.current = currentQuestion;
  }, [currentQuestion, lastAnswerResult, playSound]);

  // Calculate previous rank if needed
  const previousRank = lastAnswerResult?.correct
    ? [...players]
        .map((p) => ({
          ...p,
          score: p.id === lastAnswerResult.playerId ? p.score - 1 : p.score,
        }))
        .sort((a, b) => b.score - a.score)
        .findIndex((p) => p.id === lastAnswerResult.playerId) + 1
    : undefined;

  if (lastAnswerResult?.correct) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Leaderboard */}
        <div className="w-[400px] bg-gray-800/30 backdrop-blur-sm p-8 border-r border-gray-700/50">
          <div className="sticky top-8">
            <div className="flex items-center gap-2 mb-6">
              <Crown className="w-7 h-7 text-indigo-400" />
              <h2 className="text-3xl font-bold text-indigo-400">
                Leaderboard
              </h2>
            </div>
            <div className="space-y-2">
              {sortedPlayers.map((player, index) => (
                <motion.div
                  key={player.id}
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    player.id === lastAnswerResult.playerId
                      ? "bg-green-500/20 border-green-500/30"
                      : index === 0
                      ? "bg-yellow-500/10 border-yellow-500/30"
                      : "bg-gray-800/30 border-gray-700/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-indigo-400">
                      #{index + 1}
                    </span>
                    <span className="text-lg">{player.name}</span>
                  </div>
                  <span className="text-2xl font-bold text-indigo-400">
                    {player.score}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Celebration */}
        <CelebrationDisplay
          winner={{
            playerId: lastAnswerResult.playerId,
            playerName: lastAnswerResult.playerName,
          }}
          players={players}
          previousRank={previousRank}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Leaderboard */}
      <div className="w-[400px] bg-gray-800/30 backdrop-blur-sm p-8 border-r border-gray-700/50">
        <div className="sticky top-8">
          <div className="flex items-center gap-2 mb-6">
            <Crown className="w-7 h-7 text-indigo-400" />
            <h2 className="text-3xl font-bold text-indigo-400">Leaderboard</h2>
          </div>
          <div className="space-y-2">
            {sortedPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  index === 0
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : "bg-gray-800/30 border-gray-700/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-indigo-400">
                    #{index + 1}
                  </span>
                  <span className="text-lg">{player.name}</span>
                </div>
                <span className="text-2xl font-bold text-indigo-400">
                  {player.score}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Question & Buzzer Queue */}
      <div className="flex-1 flex flex-col p-8">
        {/* Question Display */}
        <div className="flex-1 flex flex-col items-center justify-center mb-8">
          {currentQuestion ? (
            <>
              <h1
                className="text-6xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400"
                data-testid="current-question"
              >
                {currentQuestion.text}
              </h1>

              {/* Current Answerer Display */}
              {buzzerQueue.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl text-center"
                  data-testid="current-answerer"
                >
                  <span className="font-bold text-indigo-400">
                    {players.find((p) => p.id === buzzerQueue[0])?.name}
                  </span>{" "}
                  <span className="text-white/80">is answering...</span>
                </motion.div>
              )}
            </>
          ) : (
            <div
              className="text-3xl text-center text-indigo-300/60"
              data-testid="waiting-message"
            >
              Waiting for question...
            </div>
          )}
        </div>

        {/* Previous Incorrect Answers */}
        {previousAnswers.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <X className="w-6 h-6 text-red-400" />
              <h3 className="text-2xl font-bold text-red-400">
                Previous Incorrect Answers
              </h3>
            </div>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {previousAnswers.map((answer, index) => (
                  <motion.div
                    key={`${answer.playerId}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"
                  >
                    <span
                      className="font-medium text-red-300"
                      data-testid={`incorrect-answer-${answer.playerId}`}
                    >
                      {answer.playerName}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Buzzer Queue */}
        <div
          className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50"
          data-testid="buzzer-queue-section"
        >
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-6 h-6 text-indigo-400" />
            <h3 className="text-2xl font-bold text-indigo-400">Up Next</h3>
          </div>

          {buzzerQueue.length > 1 ? (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {buzzerQueue.slice(1).map((playerId, index) => {
                  const player = players.find((p) => p.id === playerId);
                  return (
                    <motion.div
                      key={playerId}
                      data-testid={`queue-player-${playerId}`}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-700/50"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-indigo-400">
                          #{index + 2}
                        </span>
                        <span className="text-xl">{player?.name}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-8 text-indigo-300/60"
              data-testid="empty-queue-message"
            >
              <Bell className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-xl">No one else in queue</p>
            </div>
          )}
        </div>
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
