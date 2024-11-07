import { motion, AnimatePresence } from 'framer-motion'
import { GameContext } from '../game.context'
import { SessionContext } from '../session.context'
import { Trophy, Medal, Award, Star, RotateCcw, Crown } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'

export function PlayerResults() {
  const gameState = GameContext.useSelector((state) => state.public);
  const sessionState = SessionContext.useSelector((state) => state.public);
  const sendGameEvent = GameContext.useSend();

  const currentPlayer = gameState.players.find(p => p.id === sessionState.userId);
  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
  const position = sortedPlayers.findIndex(p => p.id === sessionState.userId) + 1;
  const isWinner = position === 1;

  useEffect(() => {
    // Trigger confetti for winners
    if (isWinner) {
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 }
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 }
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isWinner]);

  const getPositionSuffix = (pos: number) => {
    if (pos === 1) return 'st';
    if (pos === 2) return 'nd';
    if (pos === 3) return 'rd';
    return 'th';
  };

  const PositionIcon = () => {
    switch (position) {
      case 1: return <Trophy className="w-12 h-12 text-yellow-400" />;
      case 2: return <Medal className="w-12 h-12 text-gray-400" />;
      case 3: return <Award className="w-12 h-12 text-yellow-600" />;
      default: return <Star className="w-12 h-12 text-blue-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 relative">
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

      <div className="relative z-10 w-full max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800/30 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-700/50"
        >
          <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Game Results
          </h1>

          {currentPlayer && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-8"
              >
                <p className="text-xl text-indigo-300 mb-2">Great job, {currentPlayer.name}!</p>
                <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                  {currentPlayer.score} points
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col items-center mb-8"
              >
                <PositionIcon />
                <p className="text-2xl font-semibold mt-4 text-indigo-300">
                  You placed {position}<sup>{getPositionSuffix(position)}</sup>
                </p>
                <p className="text-gray-400">
                  out of {gameState.players.length} players
                </p>
              </motion.div>

              {/* Leaderboard */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 text-indigo-300 flex items-center gap-2">
                  <Crown className="w-6 h-6" /> Final Leaderboard
                </h2>
                <div className="space-y-3">
                  <AnimatePresence>
                    {sortedPlayers.map((player, index) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex justify-between items-center p-4 rounded-xl border ${
                          player.id === sessionState.userId
                            ? 'bg-indigo-500/20 border-indigo-500/30'
                            : index === 0
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
                  </AnimatePresence>
                </div>
              </div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                onClick={() => sendGameEvent({ type: "START_GAME" })}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RotateCcw className="w-5 h-5" />
                Play Again
              </motion.button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}