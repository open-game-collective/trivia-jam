import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Check,
  ChevronRight,
  Copy,
  Crown,
  Eye,
  Loader2,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { GameContext } from "~/game.context";
import { SessionContext } from "~/session.context";
import { ShareGameLink } from "./share-game-link";
import { PlayerList } from "./player-list";

const HostNameInput = ({ onSubmit }: { onSubmit: (name: string) => void }) => {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (name.length > 20) {
      setError("Name must be 20 characters or less");
      return;
    }
    if (!/^[a-zA-Z0-9\s]+$/.test(name)) {
      setError("Name can only contain letters, numbers and spaces");
      return;
    }

    setIsSubmitting(true);
    onSubmit(name.trim());
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative">
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
        data-testid="host-name-input-form"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50"
      >
        <h1 className="text-3xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Host New Game
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="hostName"
              className="block text-sm font-medium text-indigo-300 mb-2"
            >
              Your Name
            </label>
            <input
              data-testid="host-name-input"
              id="hostName"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your name"
              maxLength={20}
              disabled={isSubmitting}
            />
            {error && (
              <motion.p
                data-testid="host-name-input-error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-red-400"
              >
                {error}
              </motion.p>
            )}
          </div>
          <motion.button
            data-testid="create-game-button"
            type="submit"
            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition duration-300 flex items-center justify-center ${
              isSubmitting ? "opacity-75 cursor-not-allowed" : ""
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Creating Game...
              </>
            ) : (
              "Create Game"
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export const HostView = ({ host }: { host: string }) => {
  const gameState = GameContext.useSelector((state) => state);
  const sessionState = SessionContext.useSelector((state) => state.public);
  const send = GameContext.useSend();

  // Show name input if host hasn't set their name yet
  if (!gameState.public.hostName) {
    return (
      <HostNameInput 
        onSubmit={(name) => send({ type: "SET_HOST_NAME", name })}
      />
    );
  }

  const {
    gameStatus,
    currentQuestion,
    buzzerQueue,
    players,
    hostId,
    id,
  } = gameState.public;

  if (sessionState.userId !== hostId) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 backdrop-blur-sm rounded-2xl p-8 border border-red-500/30 text-center max-w-md"
        >
          <h1 className="text-2xl font-bold text-red-400 mb-4">
            Host Controls Not Available
          </h1>
          <p className="text-white/70">
            Only the host can access these controls.
          </p>
        </motion.div>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative">
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
          className="relative z-10 bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 text-center"
        >
          <h1 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Creating Game...
          </h1>
          <Loader2
            className="w-12 h-12 animate-spin mx-auto text-indigo-400"
            role="status"
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <AnimatePresence mode="wait">
        {gameStatus === "lobby" && (
          <LobbyControls
            players={players}
            onStartGame={() => send({ type: "START_GAME" })}
            host={host}
          />
        )}

        {gameStatus === "active" && (
          <QuestionControls
            currentQuestion={currentQuestion}
            buzzerQueue={buzzerQueue}
            players={players}
          />
        )}

        {gameStatus === "finished" && <GameFinishedDisplay players={players} />}
      </AnimatePresence>
    </div>
  );
};

const LobbyControls = ({
  players,
  onStartGame,
  host,
}: {
  players: Array<{ id: string; name: string; score: number }>;
  onStartGame: () => void;
  host: string;
}) => {
  const gameState = GameContext.useSelector((state) => state.public);
  const send = GameContext.useSend();
  const hasEnoughPlayers = players.length > 0;
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Construct the game URL using the host and game ID
  const gameUrl = `https://${host}/games/${gameState.id}`;

  const copyGameLink = async () => {
    await navigator.clipboard.writeText(gameUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareGameLink = async () => {
    try {
      await navigator.share({
        title: 'Join my Trivia Jam game!',
        text: 'Click to join my Trivia Jam game!',
        url: gameUrl
      });
    } catch (err) {
      // Fallback to copy if share fails
      copyGameLink();
    }
  };

  const handleStartGame = () => {
    setIsStarting(true);
    onStartGame();
  };
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
        {/* Game Link Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-indigo-300 text-center mb-4">
            Share Game Link
          </h2>
          <ShareGameLink host={host} gameId={gameState.id} />
        </div>

        <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Game Lobby
        </h1>

        <div className="mb-8">
          <PlayerList 
            onRemovePlayer={(playerId) => send({ type: "REMOVE_PLAYER", playerId })}
          />
        </div>

        <div className="space-y-3">
          <motion.button
            onClick={handleStartGame}
            disabled={!hasEnoughPlayers || isStarting}
            className={`w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2
              ${
                hasEnoughPlayers && !isStarting
                  ? "hover:from-indigo-500 hover:to-purple-500 opacity-100"
                  : "opacity-50 cursor-not-allowed"
              }`}
            whileHover={hasEnoughPlayers && !isStarting ? { scale: 1.02 } : {}}
            whileTap={hasEnoughPlayers && !isStarting ? { scale: 0.98 } : {}}
          >
            {isStarting ? (
              <>
                <Loader2
                  className="w-5 h-5 animate-spin"
                  data-testid="loading-spinner"
                />
                Starting Game...
              </>
            ) : (
              "Start Game"
            )}
          </motion.button>

          {!hasEnoughPlayers && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-indigo-300/70 text-sm"
            >
              Waiting for at least one player to join...
            </motion.p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const QuestionControls = ({
  currentQuestion,
  buzzerQueue,
  players,
}: {
  currentQuestion: { text: string } | null;
  buzzerQueue: string[];
  players: Array<{ id: string; name: string; score: number }>;
}) => {
  const [questionText, setQuestionText] = useState("");
  const send = GameContext.useSend();
  const gameState = GameContext.useSelector((state) => state.public);

  // Use local state for optimistic updates
  const [localScoreUpdates, setLocalScoreUpdates] = useState<Record<string, number>>({});

  // Memoize the players with local score updates
  const sortedPlayers = useMemo(() => {
    return [...players]
      .map(player => ({
        ...player,
        score: player.score + (localScoreUpdates[player.id] || 0)
      }))
      .sort((a, b) => b.score - a.score);
  }, [players, localScoreUpdates]);

  const handleSubmitQuestion = () => {
    if (questionText.trim()) {
      send({ type: "SUBMIT_QUESTION", question: questionText.trim() });
      setQuestionText("");
    }
  };

  const handleSkipQuestion = () => {
    send({ type: "SKIP_QUESTION" });
  };

  const handleValidateAnswer = (playerId: string, correct: boolean) => {
    send({ type: "VALIDATE_ANSWER", playerId, correct });
    
    // Update local scores optimistically
    if (correct) {
      setLocalScoreUpdates(prev => ({
        ...prev,
        [playerId]: (prev[playerId] || 0) + 1
      }));
    }
  };

  // Reset local updates when players prop changes
  useEffect(() => {
    setLocalScoreUpdates({});
  }, [players]);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 relative">
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
      <div className="relative z-10 w-full max-w-xl mx-auto space-y-4">
        {/* Current Question Display */}
        {currentQuestion && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-700/50"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-indigo-300">
                Current Question
              </h2>
              <motion.button
                onClick={handleSkipQuestion}
                className="bg-yellow-500/20 border border-yellow-500/30 hover:bg-yellow-500/30 text-white text-sm font-bold py-1 px-3 rounded-lg transition-all flex items-center gap-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ChevronRight className="w-4 h-4" />
                Skip
              </motion.button>
            </div>
            <p className="text-lg sm:text-xl text-white/90 mb-4">
              {currentQuestion.text}
            </p>
          </motion.div>
        )}

        {/* Question Input */}
        {!currentQuestion && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-700/50"
          >
            <label
              htmlFor="question-input"
              className="text-xl font-bold mb-2 text-indigo-300 block"
            >
              Enter Question
            </label>
            <textarea
              id="question-input"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Type your question here..."
              className="w-full bg-gray-900/50 rounded-xl p-3 sm:p-4 text-white placeholder-white/50 border border-gray-700/50 mb-3 sm:mb-4 text-lg"
              rows={5}
              aria-label="Enter question"
            />
            <motion.button
              onClick={handleSubmitQuestion}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-xl shadow-lg hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ChevronRight className="w-5 h-5" />
              Submit Question
            </motion.button>
          </motion.div>
        )}

        {/* Buzzer Queue & Answer Validation */}
        {buzzerQueue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-700/50"
          >
            <h2 className="text-xl font-bold mb-3 text-indigo-300 flex items-center gap-2">
              <Bell className="w-5 h-5" /> Current Answer
            </h2>
            {buzzerQueue.map((playerId, index) => {
              const player = players.find((p) => p.id === playerId);
              if (index === 0 && player) {
                return (
                  <div key={playerId} className="space-y-3">
                    <div 
                      className="text-lg sm:text-xl text-white/90"
                      data-testid="current-answerer-validation"
                    >
                      <span className="font-bold text-indigo-400">
                        {player.name}
                      </span>{" "}
                      is answering...
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <motion.button
                        onClick={() => handleValidateAnswer(playerId, true)}
                        data-testid="correct-button"
                        className="bg-green-500/20 border border-green-500/30 hover:bg-green-500/30 text-white font-bold py-2 sm:py-3 px-3 sm:px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Check className="w-5 h-5" />
                        <span className="hidden sm:inline">Correct</span>
                      </motion.button>
                      <motion.button
                        onClick={() => handleValidateAnswer(playerId, false)}
                        data-testid="incorrect-button"
                        className="bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-white font-bold py-2 sm:py-3 px-3 sm:px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <X className="w-5 h-5" />
                        <span className="hidden sm:inline">Incorrect</span>
                      </motion.button>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </motion.div>
        )}

        {/* Player List */}
        <PlayerList 
          onRemovePlayer={(playerId) => send({ type: "REMOVE_PLAYER", playerId })}
          showScores={true}
        />

        {/* End Game Button */}
        <motion.button
          onClick={() => send({ type: "END_GAME" })}
          className="w-full bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-xl transition-all flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          End Game
        </motion.button>
      </div>
    </div>
  );
};

const GameFinishedDisplay = ({
  players,
}: {
  players: Array<{ id: string; name: string; score: number }>;
}) => {
  // Create a copy before sorting
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

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
      >
        <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Game Over!
        </h1>

        <div className="space-y-3 mb-8">
          <h2 className="text-xl font-bold mb-4 text-indigo-300 flex items-center gap-2">
            <Trophy className="w-6 h-6" /> Final Scores
          </h2>
          {sortedPlayers
            .map((player, index) => (
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

