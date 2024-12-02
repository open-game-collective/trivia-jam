import { getAssociatedTokenAddress } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Crown, Loader2, Copy } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { JAM_TOKEN_MINT } from "~/config";
import { GameContext } from "~/game.context";
import { SessionContext } from "~/session.context";
import { ShareGameLink } from "./share-game-link";
import { PlayerList } from "./player-list";
import { PublicKey } from "@solana/web3.js";

export const PlayerView = () => {
  const gameState = GameContext.useSelector((state) => state);
  const {
    gameStatus,
    currentQuestion,
    buzzerQueue,
    players,
    winner,
    gameCode,
  } = gameState.public;
  const userId = SessionContext.useSelector((state) => state.public.userId);
  const send = GameContext.useSend();

  const isPlayerInQueue = buzzerQueue.includes(userId);
  const isFirstInQueue = buzzerQueue[0] === userId;
  const playerScore = players.find((p) => p.id === userId)?.score || 0;
  const player = players.find((p) => p.id === userId);

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
            playerName={players.find((p) => p.id === userId)?.name || ""}
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

const LobbyDisplay = ({ playerName }: { playerName: string }) => {
  const gameState = GameContext.useSelector((state) => state.public);
  const userId = SessionContext.useSelector((state) => state.public.userId);
  const hasPaid = gameState.paidPlayers.includes(userId);

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
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative z-10 bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 max-w-2xl w-full space-y-8"
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Welcome, {playerName}!
          </h1>
          <p className="text-xl text-white/70">
            Entry Fee: {gameState.entryFee} JAM
          </p>
          {gameState.prizePool > 0 && (
            <p className="text-lg text-indigo-300 mt-2">
              Current Prize Pool: {gameState.prizePool} JAM
            </p>
          )}
        </div>

        {!hasPaid ? (
          <div className="space-y-6">
            <WalletSection />
            {hasPaid && (
              <div className="bg-green-500/20 text-green-300 p-4 rounded-xl text-center">
                Entry fee paid! Waiting for game to start...
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 text-center">
            <div className="bg-green-500/20 text-green-300 p-4 rounded-xl">
              Entry fee paid! Waiting for game to start...
            </div>
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <span className="text-indigo-300">
                Waiting for other players...{" "}
                {gameState.paidPlayers.length}/{gameState.settings.maxPlayers}
              </span>
            </div>
          </div>
        )}

        {/* Share Game Link */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-indigo-300 text-center mb-4">
            Share Game Link
          </h2>
          <ShareGameLink host={window.location.host} gameId={gameState.id} />
        </div>

        {/* Player List */}
        <PlayerList />
      </motion.div>
    </div>
  );
};

const GameplayDisplay = ({
  currentQuestion,
  isPlayerInQueue,
  isFirstInQueue,
  playerScore,
  onBuzzIn,
  lastAnswerResult,
  userId,
}: {
  currentQuestion: { text: string } | null;
  isPlayerInQueue: boolean;
  isFirstInQueue: boolean;
  playerScore: number;
  onBuzzIn: () => void;
  lastAnswerResult?: {
    playerId: string;
    playerName: string;
    correct: boolean;
  } | null;
  userId: string;
}) => {
  // Check if this player has already answered incorrectly
  const hasAnsweredIncorrectly =
    lastAnswerResult?.playerId === userId && !lastAnswerResult.correct;

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
                  ? "bg-green-500/20 border-green-500/30"
                  : "bg-red-500/20 border-red-500/30"
              }`}
            >
              {lastAnswerResult.playerId === userId ? (
                <span
                  className="text-2xl font-bold"
                  data-testid="player-feedback"
                >
                  {lastAnswerResult.correct
                    ? "You got it correct! 🎉"
                    : "Sorry, that's incorrect"}
                </span>
              ) : (
                <span className="text-2xl" data-testid="other-player-feedback">
                  <span className="font-bold">
                    {lastAnswerResult.playerName}
                  </span>
                  {lastAnswerResult.correct
                    ? " got it correct! 🎉"
                    : " got it wrong"}
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
                    <span
                      data-testid="answering-status"
                      className="text-yellow-400 font-bold"
                    >
                      Your turn to answer!
                    </span>
                  ) : (
                    <span
                      data-testid="queue-status"
                      className="text-indigo-300"
                    >
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
  userId,
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
          You placed{" "}
          <span className="font-bold text-yellow-400">
            {sortedPlayers.findIndex((p) => p.id === userId) + 1}
            {getOrdinalSuffix(
              sortedPlayers.findIndex((p) => p.id === userId) + 1
            )}
          </span>
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
                  ? "bg-indigo-500/20 border-indigo-500/30"
                  : index === 0
                  ? "bg-yellow-500/10 border-yellow-500/30"
                  : "bg-gray-800/30 border-gray-700/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-indigo-400">
                  #{index + 1}
                </span>
                <span className="font-medium">{player.name}</span>
              </div>
              <span className="text-xl font-bold text-indigo-400">
                {player.score}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const NameInputDisplay = ({
  onSubmit,
}: {
  onSubmit: (name: string) => void;
}) => {
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
            <label
              htmlFor="playerName"
              className="block text-sm font-medium text-indigo-300 mb-2"
            >
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

// Add new wallet section component
const WalletSection = () => {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const sessionState = SessionContext.useSelector(state => state.public);
  const send = SessionContext.useSend();
  const [solBalance, setSolBalance] = useState(0);
  const [jamBalance, setJamBalance] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const MINIMUM_SOL = 0.01;
  const ENTRY_FEE = 100;

  // Store wallet public key when connected
  useEffect(() => {
    if (connected && publicKey) {
      send({ 
        type: "CONNECT_WALLET", 
        publicKey: publicKey.toString() 
      });
    }
  }, [connected, publicKey, send]);

  // Use stored public key if available
  const effectivePublicKey = useMemo(() => {
    if (publicKey) return publicKey;
    if (sessionState.walletPublicKey) {
      return new PublicKey(sessionState.walletPublicKey);
    }
    return null;
  }, [publicKey, sessionState.walletPublicKey]);

  // Use effectivePublicKey in balance fetching
  const fetchBalances = async () => {
    if (!effectivePublicKey) return;
    
    setIsRefreshing(true);
    try {
      const solBalance = await connection.getBalance(effectivePublicKey);
      setSolBalance(solBalance / LAMPORTS_PER_SOL);

      const tokenAccount = await getAssociatedTokenAddress(
        JAM_TOKEN_MINT,
        effectivePublicKey
      );

      try {
        const tokenBalance = await connection.getTokenAccountBalance(tokenAccount);
        setJamBalance(Number(tokenBalance.value.uiAmount || 0));
      } catch (err) {
        console.log("Token account doesn't exist yet:", err);
        setJamBalance(0);
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching balances:", err);
      setError("Failed to fetch wallet balances");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [effectivePublicKey, connection]);

  const getActionButton = () => {
    if (solBalance < MINIMUM_SOL) {
      return (
        <div className="space-y-2">
          <button 
            onClick={() => window.open("https://faucet.solana.com", "_blank")}
            className="w-full bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <svg 
              className="w-5 h-5" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Get Devnet SOL
          </button>
          <button
            onClick={fetchBalances}
            disabled={isRefreshing}
            className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 px-4 py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isRefreshing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <svg 
                  className="w-5 h-5" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Balance
              </>
            )}
          </button>
        </div>
      );
    }
    if (jamBalance < ENTRY_FEE) {
      return (
        <button 
          onClick={() => window.open("https://jup.ag/swap/SOL-JAM", "_blank")}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <svg 
            className="w-5 h-5" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Get JAM Tokens
        </button>
      );
    }
    // ... rest of the button logic
  };

  const copyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!connected) {
    return (
      <motion.div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
        <h2 className="text-xl text-indigo-300 mb-4">Connect Wallet to Play</h2>
        <WalletMultiButton className="!bg-indigo-600 hover:!bg-indigo-700" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Wallet Address Section */}
      <div className="bg-gray-800/50 p-4 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">Your Wallet</div>
          <motion.button
            onClick={copyAddress}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {copied ? (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-green-400"
              >
                Copied!
              </motion.span>
            ) : (
              <div className="flex items-center gap-1">
                <Copy className="w-4 h-4" />
                <span className="text-sm">Copy</span>
              </div>
            )}
          </motion.button>
        </div>
        <div className="mt-1 font-mono text-sm break-all">
          {publicKey?.toString()}
        </div>
      </div>

      {/* Balances Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800/50 p-4 rounded-xl">
          <div className="text-sm text-gray-400">SOL Balance</div>
          <div className="text-xl font-bold">{solBalance.toFixed(4)} SOL</div>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-xl">
          <div className="text-sm text-gray-400">JAM Balance</div>
          <div className="text-xl font-bold">{jamBalance} JAM</div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 text-red-300 p-4 rounded-xl text-center">
          {error}
        </div>
      )}

      {getActionButton()}
    </motion.div>
  );
};
