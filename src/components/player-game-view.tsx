import { motion, AnimatePresence } from 'framer-motion'
import { GameContext } from '../game.context'
import { SessionContext } from '../session.context'
import { Bell, Crown, AlertCircle, Clock } from 'lucide-react'

export function PlayerGameView() {
  const gameState = GameContext.useSelector((state) => state.public);
  const sessionState = SessionContext.useSelector((state) => state.public);
  const sendGameEvent = GameContext.useSend();

  const currentPlayer = gameState.players.find(p => p.id === sessionState.userId);
  const canBuzz = gameState.currentQuestion?.isVisible && 
                 !gameState.buzzerQueue.includes(sessionState.userId);
  const hasBuzzed = gameState.buzzerQueue.includes(sessionState.userId);
  const buzzPosition = hasBuzzed ? gameState.buzzerQueue.indexOf(sessionState.userId) + 1 : null;

  const handleBuzz = () => {
    if (canBuzz) {
      sendGameEvent({ type: "BUZZ_IN" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-between p-8 relative">
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

      {/* Score Display */}
      <div className="relative w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50"
        >
          <h2 className="text-xl font-semibold text-indigo-300 mb-2 flex items-center gap-2">
            <Crown className="w-6 h-6" />
            Your Score
          </h2>
          <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            {currentPlayer?.score || 0}
          </div>
        </motion.div>
      </div>

      {/* Question Display */}
      <div className="relative w-full max-w-2xl my-8">
        <AnimatePresence mode="wait">
          {gameState.currentQuestion ? (
            <motion.div
              key="question"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50"
            >
              {gameState.currentQuestion.isVisible ? (
                <h1 className="text-3xl md:text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                  {gameState.currentQuestion.text}
                </h1>
              ) : (
                <div className="text-2xl text-gray-500 text-center flex items-center justify-center gap-3">
                  <Clock className="animate-pulse" />
                  Question coming soon...
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-2xl text-center text-gray-500 flex items-center justify-center gap-3"
            >
              <Clock className="animate-pulse" />
              Waiting for next question...
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Buzz Button and Status */}
      <div className="relative w-full max-w-md">
        <AnimatePresence mode="wait">
          {canBuzz ? (
            <motion.button
              key="buzz-button"
              onClick={handleBuzz}
              className="w-full group relative"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="absolute inset-0 bg-red-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative bg-gradient-to-br from-red-500 to-pink-500 text-white font-bold py-8 px-8 rounded-2xl shadow-lg flex items-center justify-center gap-3 text-3xl">
                <Bell className="w-8 h-8" />
                BUZZ!
              </div>
            </motion.button>
          ) : (
            <motion.div
              key="buzz-status"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 text-center"
            >
              {hasBuzzed ? (
                <>
                  <div className="text-xl text-indigo-300 mb-2">
                    You buzzed in {buzzPosition}
                    {buzzPosition === 1 ? 'st' : buzzPosition === 2 ? 'nd' : buzzPosition === 3 ? 'rd' : 'th'}!
                  </div>
                  <div className="text-gray-400">
                    {buzzPosition === 1 ? 'Get ready to answer!' : 'Wait for your turn...'}
                  </div>
                </>
              ) : (
                <div className="text-gray-400 flex items-center justify-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Wait for the question to be revealed...
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}