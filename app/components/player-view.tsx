import { GameContext } from "~/game.context";
import { motion, AnimatePresence } from "framer-motion";
import { SessionContext } from "~/session.context";
import { Trophy, Medal, Award, Star, Bell, Crown, Loader2 } from "lucide-react";
import { useState } from "react";

export const PlayerView = () => {
  const gameState = GameContext.useSelector((state) => state);
  const { gameStatus, currentQuestion, buzzerQueue, players, winner, gameCode } = gameState.public;
  const userId = SessionContext.useSelector((state) => state.public.userId);
  const send = GameContext.useSend();

  const isPlayerInQueue = buzzerQueue.includes(userId);
  const isFirstInQueue = buzzerQueue[0] === userId;
  const playerScore = players.find(p => p.id === userId)?.score || 0;
  const player = players.find(p => p.id === userId);

  // Show loading spinner if game code isn't available yet
  if (!gameCode) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative">
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
          className="relative z-10 bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 text-center"
        >
          <h1 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Generating Game Code...
          </h1>
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-400" />
        </motion.div>
      </div>
    );
  }

  if (!player) {
    return (
      <NameInputDisplay 
        onSubmit={(name) => send({ type: "JOIN_GAME", playerName: name })} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <AnimatePresence mode="wait">
        {gameStatus === "lobby" && (
          <LobbyDisplay 
            playerName={players.find(p => p.id === userId)?.name || ""}
          />
        )}

        {gameStatus === "active" && (
          <GameplayDisplay 
            currentQuestion={currentQuestion}
            isPlayerInQueue={isPlayerInQueue}
            isFirstInQueue={isFirstInQueue}
            playerScore={playerScore}
            onBuzzIn={() => send({ type: "BUZZ_IN" })}
            lastAnswerResult={gameState.public.lastAnswerResult}
            userId={userId}
          />
        )}

        {gameStatus === "finished" && (
          <GameFinishedDisplay 
            players={players}
            winner={winner!}
            userId={userId}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const LobbyDisplay = ({ playerName }: { playerName: string }) => (
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
      className="relative z-10 bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 text-center"
    >
      <h1 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
        Welcome, {playerName}!
      </h1>
      <p className="text-xl text-white/70 mb-8">
        Waiting for host to start the game...
      </p>
      <Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-400" />
    </motion.div>
  </div>
);

const GameplayDisplay = ({ 
  currentQuestion,
  isPlayerInQueue,
  isFirstInQueue,
  playerScore,
  onBuzzIn,
  lastAnswerResult,
  userId
}: { 
  currentQuestion: { text: string } | null;
  isPlayerInQueue: boolean;
  isFirstInQueue: boolean;
  playerScore: number;
  onBuzzIn: () => void;
  lastAnswerResult?: { playerId: string; playerName: string; correct: boolean } | null;
  userId: string;
}) => {
  // Check if this player has already answered incorrectly
  const hasAnsweredIncorrectly = lastAnswerResult?.playerId === userId && !lastAnswerResult.correct;

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
        {/* Score Display */}
        <motion.div
          data-testid="score-display"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50"
        >
          <div className="text-xl text-indigo-300">Your Score</div>
          <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            {playerScore}
          </div>
        </motion.div>

        {/* Answer Result Feedback */}
        <AnimatePresence>
          {lastAnswerResult && (
            <motion.div
              data-testid="answer-feedback"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`text-center p-6 rounded-2xl backdrop-blur-sm border ${
                lastAnswerResult.correct 
                  ? 'bg-green-500/20 border-green-500/30' 
                  : 'bg-red-500/20 border-red-500/30'
              }`}
            >
              {lastAnswerResult.playerId === userId ? (
                <span className="text-2xl font-bold" data-testid="player-feedback">
                  {lastAnswerResult.correct ? "You got it correct! 🎉" : "Sorry, that's incorrect"}
                </span>
              ) : (
                <span className="text-2xl" data-testid="other-player-feedback">
                  <span className="font-bold">{lastAnswerResult.playerName}</span> 
                  {lastAnswerResult.correct ? " got it correct! 🎉" : " got it wrong"}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question & Buzzer Area */}
        <motion.div
          data-testid="question-area"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 flex flex-col items-center"
        >
          {currentQuestion ? (
            <>
              <h2 
                data-testid="current-question"
                className="text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-12"
              >
                {currentQuestion.text}
              </h2>
              {isPlayerInQueue ? (
                <div className="text-2xl text-center">
                  {isFirstInQueue ? (
                    <span data-testid="answering-status" className="text-yellow-400 font-bold">
                      Your turn to answer!
                    </span>
                  ) : (
                    <span data-testid="queue-status" className="text-indigo-300">
                      Waiting for your turn...
                    </span>
                  )}
                </div>
              ) : !hasAnsweredIncorrectly ? (
                <motion.button
                  data-testid="buzz-button"
                  onClick={onBuzzIn}
                  className="group relative"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 bg-red-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className="relative px-12 py-6 bg-gradient-to-br from-red-500 to-pink-500 rounded-full text-2xl font-bold shadow-lg flex items-center gap-3">
                    <Bell className="w-8 h-8" />
                    BUZZ!
                  </div>
                </motion.button>
              ) : null}
            </>
          ) : (
            <div 
              data-testid="waiting-message"
              className="text-2xl text-center text-indigo-300/60"
            >
              Waiting for question...
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

const GameFinishedDisplay = ({ 
  players,
  winner,
  userId
}: { 
  players: Array<{ id: string; name: string; score: number }>;
  winner: string;
  userId: string;
}) => {
  // Create a new array before sorting
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const isWinner = winner === userId;

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
          {isWinner ? "🎉 You Won! 🎉" : "Game Over!"}
        </h1>

        <div className="text-2xl text-center mb-8">
          You placed <span className="font-bold text-yellow-400">{sortedPlayers.findIndex(p => p.id === userId) + 1}{getOrdinalSuffix(sortedPlayers.findIndex(p => p.id === userId) + 1)}</span>
        </div>

        <div className="space-y-3 mb-8">
          <h2 className="text-xl font-bold mb-4 text-indigo-300 flex items-center gap-2">
            <Crown className="w-6 h-6" /> Final Scores
          </h2>
          {sortedPlayers.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex justify-between items-center p-4 rounded-xl border ${
                player.id === userId
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
        </div>
      </motion.div>
    </div>
  );
};

const NameInputDisplay = ({ onSubmit }: { onSubmit: (name: string) => void }) => {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (name.length > 20) {
      setError("Name must be 20 characters or less");
      return;
    }
    if (!/^[a-zA-Z0-9\s]+$/.test(name)) {
      setError("Name can only contain letters, numbers and spaces");
      return;
    }

    setIsSubmitting(true);
    onSubmit(name.trim());
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative">
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
        data-testid="name-input-form"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50"
      >
        <h1 className="text-3xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Join Game
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium text-indigo-300 mb-2">
              Your Name
            </label>
            <input
              data-testid="name-input"
              id="playerName"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your name"
              maxLength={20}
              disabled={isSubmitting}
            />
            {error && (
              <motion.p
                data-testid="name-input-error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-red-400"
              >
                {error}
              </motion.p>
            )}
          </div>
          <motion.button
            data-testid="join-button"
            type="submit"
            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition duration-300 flex items-center justify-center ${
              isSubmitting ? "opacity-75 cursor-not-allowed" : ""
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Joining...
              </>
            ) : (
              "Join Game"
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
