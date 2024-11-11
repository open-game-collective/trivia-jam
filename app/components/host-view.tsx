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
import { useState, useEffect } from "react";
import { GameContext } from "~/game.context";
import { SessionContext } from "~/session.context";

export const HostView = ({ host }: { host: string }) => {
  const gameState = GameContext.useSelector((state) => state);
  const sessionState = SessionContext.useSelector((state) => state.public);
  const {
    gameStatus,
    currentQuestion,
    buzzerQueue,
    players,
    hostId,
    id,
  } = gameState.public;
  const send = GameContext.useSend();

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

const PlayerSlot = ({ 
  player,
  onRemove,
  isHost 
}: { 
  player?: { id: string; name: string; score: number };
  onRemove?: (playerId: string) => void;
  isHost?: boolean;
}) => (
  <div className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-gray-900/30 border border-gray-700/30">
    {player ? (
      <>
        <div className="flex items-center gap-2">
          <span className="font-medium">{player.name}</span>
          {isHost && (
            <span className="px-2 py-1 text-xs font-bold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
              Host
            </span>
          )}
          {onRemove && !isHost && (
            <motion.button
              onClick={() => onRemove(player.id)}
              className="p-1 text-red-400 hover:text-red-300 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              data-testid={`remove-player-${player.id}`}
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </div>
        <div className="flex items-center">
          <span className="text-indigo-400 font-bold">{player.score}</span>
        </div>
      </>
    ) : (
      <span className="text-white/30 font-medium">Empty Slot</span>
    )}
  </div>
);

const PlayerList = ({ 
  players, 
  maxPlayers = 10,
  hostId,
  onRemovePlayer,
}: { 
  players: Array<{ id: string; name: string; score: number }>;
  maxPlayers?: number;
  hostId: string;
  onRemovePlayer?: (playerId: string) => void;
}) => {
  // Create array of length maxPlayers filled with players or undefined
  const slots = Array(maxPlayers).fill(undefined).map((_, i) => players[i]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-700/50"
    >
      <h2 className="text-xl font-bold mb-3 text-indigo-300 flex items-center gap-2">
        <Users className="w-5 h-5" /> Players ({players.length}/{maxPlayers})
      </h2>
      <div className="space-y-2">
        {slots.map((player, index) => (
          <PlayerSlot 
            key={player?.id || `empty-${index}`} 
            player={player}
            isHost={player?.id === hostId}
            onRemove={onRemovePlayer}
          />
        ))}
      </div>
    </motion.div>
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
          <div className="space-y-3">
            <motion.button
              onClick={copyGameLink}
              className="w-full relative group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              data-testid="game-link-button"
            >
              <div className="absolute inset-0 bg-indigo-500/20 rounded-xl blur-xl group-hover:bg-indigo-500/30 transition-all" />
              <div className="relative bg-gray-800/50 backdrop-blur-sm border border-indigo-500/30 rounded-xl p-4 sm:p-6 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-sm sm:text-lg font-medium tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 truncate block">
                    {gameUrl}
                  </span>
                </div>
                <div className="flex-shrink-0">
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="text-green-400"
                        data-testid="copy-success-icon"
                      >
                        <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="text-indigo-400 group-hover:text-indigo-300 transition-colors"
                        data-testid="copy-icon"
                      >
                        <Copy className="w-5 h-5 sm:w-6 sm:h-6" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.button>

            {/* Share button - always shown */}
            <motion.button
              onClick={shareGameLink}
              className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-xl p-4 sm:p-6 flex items-center justify-center gap-2 transition-colors"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92zM18 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 7.02c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
              </svg>
              Share Game
            </motion.button>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-2 text-indigo-300/60 text-sm"
          >
            Click to copy or share game link
          </motion.div>
        </div>

        <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Game Lobby
        </h1>

        <PlayerList 
          players={players} 
          hostId={gameState.hostId}
          onRemovePlayer={(playerId) => send({ type: "REMOVE_PLAYER", playerId })}
        />

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

  // Create a copy before sorting
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

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
  };

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
          players={sortedPlayers} 
          hostId={gameState.hostId}
          onRemovePlayer={(playerId) => send({ type: "REMOVE_PLAYER", playerId })}
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

