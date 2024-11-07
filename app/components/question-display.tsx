import { motion, AnimatePresence } from 'framer-motion'
import { GameContext } from '../game.context'
import { SessionContext } from '../session.context'
import { Crown, Clock, Users, Bell } from 'lucide-react'

export function QuestionDisplay() {
  const gameState = GameContext.useSelector((state) => state.public);
  const sessionState = SessionContext.useSelector((state) => state.public);
  const sendGameEvent = GameContext.useSend();

  const isHost = sessionState.userId === gameState.hostId;
  const currentPlayer = gameState.players.find(p => p.id === sessionState.userId);

  // Sort players by score for the scoreboard
  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);

  const handleBuzz = () => {
    sendGameEvent({ type: "BUZZ_IN" });
  };

  const canBuzz = gameState.currentQuestion?.isVisible && 
                 !gameState.buzzerQueue.includes(sessionState.userId);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
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

      {/* Sidebar for scores */}
      <div className="relative w-80 bg-gray-800/30 backdrop-blur-sm p-8 border-r border-gray-700/50">
        <div className="sticky top-8">
          <h2 className="text-2xl font-bold mb-6 text-indigo-300 flex items-center">
            <Crown className="mr-3" size={24} />
            Leaderboard
          </h2>
          <div className="space-y-3">
            {sortedPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex justify-between items-center p-4 rounded-xl border ${
                  index === 0 
                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' 
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

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center p-12 relative">
        {/* Question display */}
        <AnimatePresence mode="wait">
          {gameState.currentQuestion ? (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-4xl mb-12"
            >
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
                {gameState.currentQuestion.isVisible ? (
                  <h1 className="text-4xl md:text-6xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                    {gameState.currentQuestion.text}
                  </h1>
                ) : (
                  <div className="text-2xl text-gray-500 text-center">
                    Question hidden by host...
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-2xl text-gray-500"
            >
              Waiting for next question...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buzz button for players */}
        {!isHost && canBuzz && (
          <motion.button
            onClick={handleBuzz}
            className="group relative mb-12"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="absolute inset-0 bg-red-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative px-12 py-6 bg-gradient-to-br from-red-500 to-pink-500 rounded-full text-2xl font-bold shadow-lg flex items-center gap-3">
              <Bell className="w-8 h-8" />
              BUZZ!
            </div>
          </motion.button>
        )}

        {/* Buzzer Queue */}
        <div className="w-full max-w-2xl">
          <h3 className="text-xl font-bold mb-4 text-indigo-300 flex items-center gap-2">
            <Users size={24} />
            Buzzer Queue
          </h3>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {gameState.buzzerQueue.map((playerId, index) => {
                const player = gameState.players.find(p => p.id === playerId);
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
                          First!
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
  )
}