import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Loader2, Users, AlertCircle } from 'lucide-react'
import { GameContext } from '../game.context'
import { SessionContext } from '../session.context'

export function PlayerJoin() {
  const [gameCode, setGameCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const gameState = GameContext.useSelector((state) => state.public);
  const sendGameEvent = GameContext.useSend();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (gameCode && playerName) {
      setIsJoining(true)
      setError(null)
      
      try {
        await sendGameEvent({
          type: "JOIN_GAME",
          playerName: playerName.trim(),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to join game');
      } finally {
        setIsJoining(false)
      }
    }
  }

  const hasJoined = gameState.players.some(p => p.name === playerName);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {!hasJoined ? (
            <motion.div
              key="join-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20"
            >
              <h1 className="text-4xl font-bold text-white mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
                Join Game
              </h1>

              <form onSubmit={handleJoin} className="space-y-6">
                <div>
                  <label htmlFor="gameCode" className="block text-sm font-medium text-white/80 mb-2">
                    Game Code
                  </label>
                  <input
                    type="text"
                    id="gameCode"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                    value={gameCode}
                    onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                    placeholder="Enter game code"
                    maxLength={8}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="playerName" className="block text-sm font-medium text-white/80 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="playerName"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-center text-white"
                  >
                    <AlertCircle className="shrink-0 text-red-300 mr-2" size={20} />
                    <span className="text-sm">{error}</span>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isJoining ? (
                    <Loader2 className="animate-spin mr-2" size={20} />
                  ) : (
                    <ArrowRight className="mr-2" size={20} />
                  )}
                  {isJoining ? 'Joining...' : 'Join Game'}
                </button>

                <div className="mt-6 text-sm text-white/70 space-y-4">
                  <div className="flex items-center">
                    <Users className="shrink-0 mr-2" size={16} />
                    <span>
                      {gameState.players.length}/{gameState.settings.maxPlayers} Players
                    </span>
                  </div>
                  <div className="text-xs space-y-2 bg-white/10 rounded-lg p-4">
                    <h3 className="font-medium text-white">How to join:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-white/70">
                      <li>Enter the game code from the host</li>
                      <li>Choose your player name</li>
                      <li>Click "Join Game"</li>
                    </ol>
                  </div>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="joined"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center"
              >
                <Users className="text-white" size={32} />
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-4">You're In!</h2>
              <p className="text-white/70 mb-6">Waiting for the host to start the game...</p>
              <div className="flex justify-center">
                <Loader2 className="animate-spin text-white/40" size={32} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}