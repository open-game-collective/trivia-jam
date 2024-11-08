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
            previousAnswers={gameState.public.previousAnswers}
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

const CelebrationDisplay = ({
  winner,
  players,
  previousRank,
}: {
  winner: { playerId: string; playerName: string };
  players: Array<{ id: string; name: string; score: number }>;
  previousRank?: number;
}) => {
  const sortedPlayers = players.sort((a, b) => b.score - a.score);
  const currentRank = sortedPlayers.findIndex(p => p.id === winner.playerId) + 1;
  const player = players.find(p => p.id === winner.playerId);
  const rankImproved = previousRank && currentRank < previousRank;

  const getPlaceEmoji = (place: number) => {
    switch (place) {
      case 1: return "👑";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return "🌟";
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="bg-gradient-to-r from-indigo-500 to-purple-500 p-1 rounded-2xl mb-8"
      >
        <div className="bg-gray-900 rounded-xl p-8">
          <h2 className="text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-4">
            Correct! 🎉
          </h2>
          <div className="text-3xl text-center text-white/90">
            <span className="font-bold text-indigo-400">{winner.playerName}</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="text-6xl mb-4">
          {getPlaceEmoji(currentRank)}
        </div>
        <div className="text-3xl">
          {rankImproved ? (
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5 }}
              className="text-green-400"
            >
              Moved up to <span className="font-bold">#{currentRank}</span>!
            </motion.div>
          ) : (
            <span>
              In <span className="font-bold text-yellow-400">#{currentRank}</span> Place
            </span>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-4xl font-bold text-center"
      >
        Score: <span className="text-indigo-400">{player?.score || 0}</span>
      </motion.div>
    </div>
  );
};

const GameplayDisplay = ({ 
  currentQuestion,
  buzzerQueue,
  players,
  lastAnswerResult,
  previousAnswers,
}: { 
  currentQuestion: { text: string; isVisible: boolean } | null;
  buzzerQueue: string[];
  players: Array<{ id: string; name: string; score: number }>;
  lastAnswerResult?: { playerId: string; playerName: string; correct: boolean } | null;
  previousAnswers?: Array<{ playerId: string; playerName: string; correct: boolean }>;
}) => {
  // If someone just got it right, show the celebration screen
  if (lastAnswerResult?.correct) {
    const previousRank = players
      .map(p => ({ ...p, score: p.id === lastAnswerResult.playerId ? p.score - 1 : p.score }))
      .sort((a, b) => b.score - a.score)
      .findIndex(p => p.id === lastAnswerResult.playerId) + 1;

    return (
      <div className="min-h-screen flex">
        {/* Left Side - Leaderboard */}
        <div className="w-[400px] bg-gray-800/30 backdrop-blur-sm p-8 border-r border-gray-700/50">
          <div className="sticky top-8">
            <div className="flex items-center gap-2 mb-6">
              <Crown className="w-7 h-7 text-indigo-400" />
              <h2 className="text-3xl font-bold text-indigo-400">
                Leaderboard
              </h2>
            </div>
            <div className="space-y-2">
              {players
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <motion.div
                    key={player.id}
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      player.id === lastAnswerResult.playerId
                        ? 'bg-green-500/20 border-green-500/30' 
                        : index === 0 
                        ? 'bg-yellow-500/10 border-yellow-500/30' 
                        : 'bg-gray-800/30 border-gray-700/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-indigo-400">#{index + 1}</span>
                      <span className="text-lg">{player.name}</span>
                    </div>
                    <span className="text-2xl font-bold text-indigo-400">{player.score}</span>
                  </motion.div>
                ))}
            </div>
          </div>
        </div>

        {/* Right Side - Celebration */}
        <CelebrationDisplay 
          winner={{ playerId: lastAnswerResult.playerId, playerName: lastAnswerResult.playerName }}
          players={players}
          previousRank={previousRank}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Leaderboard */}
      <div className="w-[400px] bg-gray-800/30 backdrop-blur-sm p-8 border-r border-gray-700/50">
        <div className="sticky top-8">
          <div className="flex items-center gap-2 mb-6">
            <Crown className="w-7 h-7 text-indigo-400" />
            <h2 className="text-3xl font-bold text-indigo-400">
              Leaderboard
            </h2>
          </div>
          <div className="space-y-2">
            {players
              .sort((a, b) => b.score - a.score)
              .map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    index === 0 
                      ? 'bg-yellow-500/10 border-yellow-500/30' 
                      : 'bg-gray-800/30 border-gray-700/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-indigo-400">#{index + 1}</span>
                    <span className="text-lg">{player.name}</span>
                  </div>
                  <span className="text-2xl font-bold text-indigo-400">{player.score}</span>
                </motion.div>
              ))}
          </div>
        </div>
      </div>

      {/* Right Side - Question & Buzzer Queue */}
      <div className="flex-1 flex flex-col p-8">
        {/* Question Display */}
        <div className="flex-1 flex flex-col items-center justify-center mb-8">
          {currentQuestion?.isVisible ? (
            <h1 className="text-6xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              {currentQuestion.text}
            </h1>
          ) : (
            <div className="text-3xl text-center text-indigo-300/60">
              Waiting for question...
            </div>
          )}
        </div>

        {/* Buzzer Queue */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-6 h-6 text-indigo-400" />
            <h3 className="text-2xl font-bold text-indigo-400">
              Buzzer Queue
            </h3>
          </div>
          
          {buzzerQueue.length > 0 ? (
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
                      className={`flex items-center justify-between p-4 rounded-xl border ${
                        index === 0 
                          ? 'border-indigo-500/30 bg-indigo-500/10' 
                          : 'border-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-indigo-400">
                          #{index + 1}
                        </span>
                        <span className="text-xl">{player?.name}</span>
                      </div>
                      {index === 0 && (
                        <span className="px-3 py-1 bg-indigo-500/20 rounded-full text-sm font-bold border border-indigo-500/30">
                          Answering
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Previous Wrong Answers */}
              {previousAnswers && previousAnswers.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="text-lg font-semibold text-indigo-300 sticky top-0 bg-gray-900/80 backdrop-blur-sm py-2">
                    Previous Attempts
                  </h4>
                  {previousAnswers.map((answer) => (
                    <motion.div
                      key={answer.playerId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-between p-4 rounded-xl border bg-red-500/10 border-red-500/30"
                    >
                      <span className="text-lg">{answer.playerName}</span>
                      <span className="px-3 py-1 bg-red-500/20 rounded-full text-sm font-bold border border-red-500/30">
                        Wrong
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-indigo-300/60">
              <Bell className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-xl">Waiting for players to buzz in...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Add custom scrollbar styles to your CSS
const customScrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

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
