import { motion, AnimatePresence } from 'framer-motion'
import { GameContext } from '../game.context'
import { SessionContext } from '../session.context'
import { Users, Copy, Crown } from 'lucide-react'

export function LobbyView() {
  const gameState = GameContext.useSelector((state) => state.public);
  const sessionState = SessionContext.useSelector((state) => state.public);
  const sendGameEvent = GameContext.useSend();

  const isHost = sessionState.userId === gameState.hostId;
  const emptySlots = Array(gameState.settings.maxPlayers - gameState.players.length).fill(null);

  const copyGameCode = () => {
    navigator.clipboard.writeText(gameState.id);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
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

      <div className="relative z-10 w-full max-w-2xl mx-auto">
        <h1 className="text-5xl font-bold mb-12 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Trivia Game Lobby
        </h1>

        {/* Game Code Section */}
        <div className="mb-12">
          <div className="text-center mb-2 text-indigo-300 text-sm font-medium">GAME CODE</div>
          <div className="relative">
            <motion.div
              className="text-6xl font-bold text-center p-6 bg-indigo-600/30 backdrop-blur-sm rounded-2xl shadow-lg border border-indigo-500/20 cursor-pointer hover:bg-indigo-600/40 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={copyGameCode}
            >
              {gameState.id}
              <motion.div
                className="absolute top-2 right-2 text-indigo-300/60 hover:text-indigo-300"
                whileHover={{ scale: 1.1 }}
              >
                <Copy size={20} />
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Players Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-gray-700/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Users className="text-indigo-400 mr-3" size={24} />
              <h2 className="text-2xl font-semibold text-indigo-300">
                Players ({gameState.players.length}/{gameState.settings.maxPlayers})
              </h2>
            </div>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {/* Host */}
              <motion.div
                key="host"
                className="flex items-center bg-indigo-600/20 rounded-xl p-4 border border-indigo-500/20"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Crown className="text-yellow-400 mr-3" size={20} />
                <span className="font-medium">{gameState.hostName}</span>
                <span className="ml-2 text-indigo-400/60 text-sm">(Host)</span>
              </motion.div>

              {/* Players */}
              {gameState.players.map((player, index) => (
                <motion.div
                  key={player.id}
                  className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/20"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {player.name}
                </motion.div>
              ))}

              {/* Empty Slots */}
              {emptySlots.map((_, index) => (
                <motion.div
                  key={`empty-${index}`}
                  className="border-2 border-dashed border-gray-700/30 rounded-xl p-4 text-gray-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: (gameState.players.length + index) * 0.1 }}
                >
                  Waiting for player...
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Section */}
        <div className="text-center">
          {isHost && gameState.gameStatus === "lobby" && (
            <motion.button
              onClick={() => sendGameEvent({ type: "START_GAME" })}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:from-indigo-500 hover:to-purple-500 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Start Game"
            >
              Start Game
            </motion.button>
          )}

          {!isHost && gameState.gameStatus === "lobby" && (
            <motion.div
              className="text-xl text-indigo-300"
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              Waiting for host to start the game...
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}