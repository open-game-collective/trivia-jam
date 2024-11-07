import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Plus, HelpCircle, Dice1 } from 'lucide-react'

export function Homepage() {
  const [gameCode, setGameCode] = useState('')
  const [showHelp, setShowHelp] = useState(false)

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault()
    if (gameCode) {
      console.log(`Joining game with code: ${gameCode}`)
      // Here you would typically navigate to the game lobby or player view
    }
  }

  const handleStartNewGame = () => {
    console.log('Starting a new game')
    // Here you would typically navigate to the host setup screen
  }

  const HelpModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={() => setShowHelp(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full mx-4 border border-white/20"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-white">How to Play</h2>
        <div className="space-y-4 text-white/80">
          <div>
            <h3 className="font-semibold mb-2">Joining a Game</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Get a game code from the host</li>
              <li>Enter the code and join the game</li>
              <li>Wait for the host to start</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Hosting a Game</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click &quot;Create New Game&quot;</li>
              <li>Share the game code with players</li>
              <li>Start when everyone has joined</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">During the Game</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Be first to buzz in with the correct answer</li>
              <li>Score points for correct answers</li>
              <li>The player with the most points wins!</li>
            </ul>
          </div>
        </div>
        <button
          onClick={() => setShowHelp(false)}
          className="mt-6 w-full bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-xl transition duration-300"
        >
          Got it!
        </button>
      </motion.div>
    </motion.div>
  )

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

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="flex items-center justify-center mb-8">
          <Dice1 className="w-12 h-12 text-indigo-400 mr-4" />
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Trivia Jam
          </h1>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-indigo-300 mb-4">Join a Game</h2>
          <form onSubmit={handleJoinGame}>
            <div className="mb-4">
              <label htmlFor="gameCode" className="block text-sm font-medium text-white/80 mb-1">
                Game Code
              </label>
              <input
                type="text"
                id="gameCode"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                placeholder="Enter game code"
                maxLength={6}
              />
            </div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition duration-300 flex items-center justify-center"
            >
              <ArrowRight className="mr-2" size={20} />
              Join Game
            </motion.button>
          </form>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-indigo-300 mb-4">Start a New Game</h2>
          <motion.button
            onClick={handleStartNewGame}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition duration-300 flex items-center justify-center"
          >
            <Plus className="mr-2" size={20} />
            Create New Game
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 text-center"
        >
          <motion.button
            onClick={() => setShowHelp(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-white/80 hover:text-white transition duration-300 flex items-center justify-center mx-auto"
          >
            <HelpCircle className="mr-2" size={20} />
            How to Play
          </motion.button>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showHelp && <HelpModal />}
      </AnimatePresence>
    </div>
  )
}