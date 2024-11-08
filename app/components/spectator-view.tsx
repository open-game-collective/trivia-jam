import { GameContext } from "~/game.context";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Crown, Bell, Eye, Trophy, Clock } from "lucide-react";

export const SpectatorView = () => {
  const gameState = GameContext.useSelector((state) => state);
  const { gameStatus, currentQuestion, buzzerQueue, players } = gameState.public;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <AnimatePresence mode="wait">
        {gameStatus === "lobby" && (
          <LobbyDisplay 
            players={players}
          />
        )}

        {gameStatus === "active" && (
          <GameplayDisplay 
            currentQuestion={currentQuestion}
            buzzerQueue={buzzerQueue}
            players={players}
            lastAnswerResult={gameState.public.lastAnswerResult}
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

const LobbyDisplay = ({ 
  players 
}: { 
  players: Array<{ id: string; name: string; score: number }>;
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
        Waiting for Game to Start
      </h1>

      <div className="space-y-3">
        <h2 className="text-xl font-bold mb-4 text-indigo-300 flex items-center gap-2">
          <Users className="w-6 h-6" /> Players Joined
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
    </motion.div>
  </div>
);

const GameplayDisplay = ({ 
  currentQuestion,
  buzzerQueue,
  players,
  lastAnswerResult,
}: { 
  currentQuestion: { text: string; isVisible: boolean } | null;
  buzzerQueue: string[];
  players: Array<{ id: string; name: string; score: number }>;
  lastAnswerResult?: { playerId: string; playerName: string; correct: boolean } | null;
}) => (
  <div className="min-h-screen flex p-4 relative">
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

    {/* Scoreboard Sidebar */}
    <div className="relative z-10 w-80 bg-gray-800/30 backdrop-blur-sm p-8 border-r border-gray-700/50">
      <div className="sticky top-8">
        <h2 className="text-2xl font-bold mb-6 text-indigo-300 flex items-center">
          <Crown className="mr-3" size={24} />
          Leaderboard
        </h2>
        <div className="space-y-3">
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
      </div>
    </div>

    {/* Main Content */}
    <div className="flex-1 relative z-10 pl-8">
      {/* Answer Result Feedback */}
      <AnimatePresence>
        {lastAnswerResult && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`text-center p-6 rounded-2xl mb-8 backdrop-blur-sm border ${
              lastAnswerResult.correct 
                ? 'bg-green-500/20 border-green-500/30' 
                : 'bg-red-500/20 border-red-500/30'
            }`}
          >
            <span className="text-2xl">
              <span className="font-bold">{lastAnswerResult.playerName}</span> 
              {lastAnswerResult.correct ? " got it correct! 🎉" : " got it wrong"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Display */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 mb-8"
      >
        {currentQuestion?.isVisible ? (
          <h2 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            {currentQuestion.text}
          </h2>
        ) : (
          <div className="text-2xl text-center text-indigo-300/60">
            Waiting for question...
          </div>
        )}
      </motion.div>

      {/* Buzzer Queue */}
      <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
        <h3 className="text-xl font-bold mb-4 text-indigo-300 flex items-center gap-2">
          <Bell className="w-5 h-5" /> Buzzer Queue
        </h3>
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {buzzerQueue.map((playerId, index) => {
              const player = players.find(p => p.id === playerId);
              return (
                <motion.div
                  key={playerId}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.3 }}
                  className={`bg-gray-800/30 backdrop-blur-sm p-4 rounded-xl border ${
                    index === 0 
                      ? 'border-indigo-500/30 bg-indigo-500/10' 
                      : 'border-gray-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-indigo-400">
                        #{index + 1}
                      </span>
                      <span className="text-xl">{player?.name || playerId}</span>
                    </div>
                    {index === 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-3 py-1 bg-indigo-500/20 rounded-full text-sm font-bold border border-indigo-500/30"
                      >
                        Answering
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  </div>
);

const GameFinishedDisplay = ({ 
  players 
}: { 
  players: Array<{ id: string; name: string; score: number }> 
}) => {
  const winner = players.reduce((a, b) => a.score > b.score ? a : b);
  
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

        <div className="text-2xl text-center mb-8">
          <span className="font-bold text-yellow-400">{winner.name}</span> wins!
        </div>

        <div className="space-y-3">
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
};
