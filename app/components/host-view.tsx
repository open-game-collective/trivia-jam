import { GameContext } from "~/game.context";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Bell, Crown, Users, Eye, EyeOff, Check, X, ChevronRight, Loader2, Trophy } from "lucide-react";

export const HostView = () => {
  const gameState = GameContext.useSelector((state) => state);
  const { gameStatus, currentQuestion, buzzerQueue, players } = gameState.public;
  const send = GameContext.useSend();

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
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative z-10 w-full max-w-4xl bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50"
    >
      <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
        Game Lobby
      </h1>

      <div className="space-y-3 mb-8">
        <h2 className="text-xl font-bold mb-4 text-indigo-300 flex items-center gap-2">
          <Users className="w-6 h-6" /> Players
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

      <motion.button
        onClick={onStartGame}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Start Game
      </motion.button>
    </motion.div>
  </div>
);

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

      <div className="relative z-10 w-full max-w-4xl space-y-6">
        {/* Question Input */}
        {!currentQuestion && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50"
          >
            <h2 className="text-xl font-bold mb-4 text-indigo-300">Enter Question</h2>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Type your question here..."
              className="w-full bg-gray-900/50 rounded-xl p-4 text-white placeholder-white/50 border border-gray-700/50 mb-4"
              rows={3}
            />
            <motion.button
              onClick={handleSubmitQuestion}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ChevronRight className="w-5 h-5" />
              Submit Question
            </motion.button>
          </motion.div>
        )}

        {/* Question Display Controls */}
        {currentQuestion && !currentQuestion.isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50"
          >
            <h2 className="text-xl font-bold mb-4 text-indigo-300">Current Question</h2>
            <p className="text-white/70 mb-4">{currentQuestion.text}</p>
            <motion.button
              onClick={handleShowQuestion}
              className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:from-yellow-500 hover:to-orange-500 transition-all flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Eye className="w-5 h-5" />
              Show Question
            </motion.button>
          </motion.div>
        )}

        {/* Buzzer Queue & Answer Validation */}
        {buzzerQueue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50"
          >
            <h2 className="text-xl font-bold mb-4 text-indigo-300 flex items-center gap-2">
              <Bell className="w-5 h-5" /> Current Answer
            </h2>
            {buzzerQueue.map((playerId, index) => {
              const player = players.find(p => p.id === playerId);
              if (index === 0) {
                return (
                  <div key={playerId} className="space-y-4">
                    <div className="text-xl text-white/90">
                      <span className="font-bold text-indigo-400">{player?.name}</span> is answering...
                    </div>
                    <div className="flex gap-3">
                      <motion.button
                        onClick={() => handleValidateAnswer(playerId, true)}
                        className="flex-1 bg-green-500/20 border border-green-500/30 hover:bg-green-500/30 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Check className="w-5 h-5" />
                        Correct
                      </motion.button>
                      <motion.button
                        onClick={() => handleValidateAnswer(playerId, false)}
                        className="flex-1 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <X className="w-5 h-5" />
                        Incorrect
                      </motion.button>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </motion.div>
        )}

        {/* End Game Button */}
        <motion.button
          onClick={() => send({ type: "END_GAME" })}
          className="w-full bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
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
