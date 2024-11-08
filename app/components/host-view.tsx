import { GameContext } from "~/game.context";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Bell, Crown, Users, Eye, EyeOff, Check, X, ChevronRight, Loader2, Trophy, Copy } from "lucide-react";
import { SessionContext } from "~/session.context";

export const HostView = () => {
  const gameState = GameContext.useSelector((state) => state);
  const sessionState = SessionContext.useSelector((state) => state.public);
  const { gameStatus, currentQuestion, buzzerQueue, players, hostId } = gameState.public;
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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <AnimatePresence mode="wait">
        {gameStatus === "lobby" && (
          <LobbyControls 
            players={players}
            onStartGame={() => send({ type: "START_GAME" })}
          />
        )}

        {gameStatus === "active" && (
          <QuestionControls 
            currentQuestion={currentQuestion}
            buzzerQueue={buzzerQueue}
            players={players}
            send={send}
          />
        )}

        {gameStatus === "finished" && (
          <GameFinishedDisplay 
            players={players}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const LobbyControls = ({ 
  players,
  onStartGame 
}: { 
  players: Array<{ id: string; name: string; score: number }>;
  onStartGame: () => void;
}) => {
  const gameState = GameContext.useSelector((state) => state.public);
  const hasEnoughPlayers = players.length > 1;
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const copyGameCode = async () => {
    if (gameState.id) {
      await navigator.clipboard.writeText(gameState.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        {/* Game Code Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-indigo-300 text-center mb-4">Game Code</h2>
          <motion.button
            onClick={copyGameCode}
            className="w-full relative group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-indigo-500/20 rounded-xl blur-xl group-hover:bg-indigo-500/30 transition-all" />
            <div className="relative bg-gray-800/50 backdrop-blur-sm border border-indigo-500/30 rounded-xl p-6 flex items-center justify-center gap-4">
              <span className="text-4xl font-mono font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                {gameState.id}
              </span>
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="text-green-400"
                  >
                    <Check className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="text-indigo-400 group-hover:text-indigo-300 transition-colors"
                  >
                    <Copy className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.button>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-2 text-indigo-300/60 text-sm"
          >
            Click to copy
          </motion.div>
        </div>

        <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Game Lobby
        </h1>

        <div className="space-y-3 mb-8">
          <h2 className="text-xl font-bold mb-4 text-indigo-300 flex items-center gap-2">
            <Users className="w-6 h-6" /> Players ({players.length})
          </h2>
          <AnimatePresence mode="popLayout">
            {players.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex justify-between items-center p-4 rounded-xl border bg-gray-800/30 border-gray-700/30"
              >
                <span className="font-medium">{player.name}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="space-y-3">
          <motion.button
            onClick={handleStartGame}
            disabled={!hasEnoughPlayers || isStarting}
            className={`w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2
              ${hasEnoughPlayers && !isStarting
                ? 'hover:from-indigo-500 hover:to-purple-500 opacity-100' 
                : 'opacity-50 cursor-not-allowed'
              }`}
            whileHover={hasEnoughPlayers && !isStarting ? { scale: 1.02 } : {}}
            whileTap={hasEnoughPlayers && !isStarting ? { scale: 0.98 } : {}}
          >
            {isStarting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Starting Game...
              </>
            ) : (
              'Start Game'
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
  send
}: { 
  currentQuestion: { text: string; isVisible: boolean } | null;
  buzzerQueue: string[];
  players: Array<{ id: string; name: string; score: number }>;
  send: (event: any) => void;
}) => {
  const [questionText, setQuestionText] = useState("");

  const handleSubmitQuestion = () => {
    if (questionText.trim()) {
      send({ type: "SUBMIT_QUESTION", question: questionText.trim() });
      setQuestionText("");
    }
  };

  const handleShowQuestion = () => {
    send({ type: "SHOW_QUESTION" });
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
            <h2 className="text-xl font-bold mb-2 text-indigo-300">Current Question</h2>
            <p className="text-lg sm:text-xl text-white/90 mb-4">{currentQuestion.text}</p>
            {!currentQuestion.isVisible && (
              <motion.button
                onClick={handleShowQuestion}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-xl shadow-lg hover:from-yellow-500 hover:to-orange-500 transition-all flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Eye className="w-5 h-5" />
                Show Question
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Question Input */}
        {!currentQuestion && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-700/50"
          >
            <h2 className="text-xl font-bold mb-2 text-indigo-300">Enter Question</h2>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Type your question here..."
              className="w-full bg-gray-900/50 rounded-xl p-3 sm:p-4 text-white placeholder-white/50 border border-gray-700/50 mb-3 sm:mb-4 text-sm sm:text-base"
              rows={3}
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
              const player = players.find(p => p.id === playerId);
              if (index === 0) {
                return (
                  <div key={playerId} className="space-y-3">
                    <div className="text-lg sm:text-xl text-white/90">
                      <span className="font-bold text-indigo-400">{player?.name}</span> is answering...
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <motion.button
                        onClick={() => handleValidateAnswer(playerId, true)}
                        className="bg-green-500/20 border border-green-500/30 hover:bg-green-500/30 text-white font-bold py-2 sm:py-3 px-3 sm:px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Check className="w-5 h-5" />
                        <span className="hidden sm:inline">Correct</span>
                      </motion.button>
                      <motion.button
                        onClick={() => handleValidateAnswer(playerId, false)}
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-700/50"
        >
          <h2 className="text-xl font-bold mb-3 text-indigo-300 flex items-center gap-2">
            <Crown className="w-5 h-5" /> Players
          </h2>
          <div className="space-y-2">
            {players
              .sort((a, b) => b.score - a.score)
              .map((player) => (
                <div
                  key={player.id}
                  className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-gray-900/30 border border-gray-700/30"
                >
                  <span className="font-medium">{player.name}</span>
                  <span className="text-indigo-400 font-bold">{player.score}</span>
                </div>
              ))}
          </div>
        </motion.div>

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
  players 
}: { 
  players: Array<{ id: string; name: string; score: number }> 
}) => (
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
        {players
          .sort((a, b) => b.score - a.score)
          .map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex justify-between items-center p-4 rounded-xl border ${
                index === 0
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-gray-800/30 border-gray-700/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-indigo-400">#{index + 1}</span>
                <span className="font-medium">{player.name}</span>
              </div>
              <span className="text-xl font-bold text-indigo-400">{player.score}</span>
            </motion.div>
          ))}
      </div>
    </motion.div>
  </div>
);
