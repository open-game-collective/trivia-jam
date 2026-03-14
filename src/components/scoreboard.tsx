import { motion, AnimatePresence } from 'framer-motion'
import { GameContext } from '../game.context'
import { SessionContext } from '../session.context'
import { Trophy, Medal, Award, Star, Crown } from 'lucide-react'

export function Scoreboard() {
  const gameState = GameContext.useSelector((state) => state.public);
  const sessionState = SessionContext.useSelector((state) => state.public);

  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
  const maxScore = Math.max(...sortedPlayers.map(p => p.score));
  const currentPlayer = gameState.players.find(p => p.id === sessionState.userId);
  const currentPlayerRank = sortedPlayers.findIndex(p => p.id === sessionState.userId) + 1;

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 0: return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 1: return <Medal className="w-6 h-6 text-gray-400" />;
      case 2: return <Award className="w-6 h-6 text-yellow-600" />;
      default: return <Star className="w-6 h-6 text-blue-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 relative">
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

      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Leaderboard
        </h1>

        {/* Current Player Stats */}
        {currentPlayer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50"
          >
            <div className="text-center">
              <p className="text-xl text-indigo-300 mb-2">Your Position</p>
              <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                #{currentPlayerRank} of {sortedPlayers.length}
              </div>
              <div className="mt-4 text-2xl font-bold text-indigo-300">
                {currentPlayer.score} points
              </div>
            </div>
          </motion.div>
        )}

        {/* Player Rankings */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {sortedPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`relative overflow-hidden ${
                  player.id === sessionState.userId
                    ? 'bg-indigo-500/20 border-indigo-500/30'
                    : index === 0
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-gray-800/30 border-gray-700/50'
                } backdrop-blur-sm rounded-2xl p-6 border`}
              >
                {/* Score Bar */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20"
                  initial={{ width: 0 }}
                  animate={{ width: `${(player.score / maxScore) * 100}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                />

                {/* Content */}
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-indigo-400">
                        #{index + 1}
                      </span>
                      {getPositionIcon(index)}
                    </div>
                    <span className="text-xl font-medium">
                      {player.name}
                      {player.id === sessionState.userId && (
                        <span className="ml-2 text-indigo-400/60 text-sm">(You)</span>
                      )}
                    </span>
                  </div>
                  <motion.div
                    key={player.score}
                    initial={{ scale: 1.2, color: '#FCD34D' }}
                    animate={{ scale: 1, color: '#FFFFFF' }}
                    className="text-2xl font-bold"
                  >
                    {player.score}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}