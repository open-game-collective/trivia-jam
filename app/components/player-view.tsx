import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

import { LAMPORTS_PER_SOL, SystemProgram, Transaction } from "@solana/web3.js";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Crown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { TJAM_TOKEN_AUTHORITY, TJAM_TOKEN_MINT } from "~/config";
import { GameContext } from "~/game.context";
import { SessionContext } from "~/session.context";
import { PlayerList } from "./player-list";
import { ShareGameLink } from "./share-game-link";
import { TokenBalance } from "./token-balance";
import { WalletInfo } from "./wallet-info";

const MINIMUM_SOL_FOR_ACCOUNT = 0.001;
const SOL_TO_TJAM_RATE = 1000; // 1 SOL = 1000 TJAM
const MIN_SOL_DEPOSIT = 0.05; // Minimum 0.05 SOL deposit
const SUGGESTED_SOL_PERCENTAGE = 0.15; // 15% of SOL balance

// Add this interface at the top with other interfaces
interface TokenAccountState {
  exists: boolean;
  balance: number;
  isInitialized: boolean;
}

// Add these prize calculation functions at the top of the file
const calculatePrizes = (entryFee: number, playerCount: number) => {
  // We know the total pool is always 1000 TJAM (100 TJAM * 10 players)
  return {
    first: 560, // 56% of 1000
    second: 270, // 27% of 1000
    third: 110, // 11% of 1000
    hostFee: 36, // 3.6% of 1000
    platformFee: 24, // 2.4% of 1000
  };
};

// Add this helper function to get the next quarter hour
const getNextGameTime = (date: Date) => {
  // Create new date and clear seconds/milliseconds
  const baseTime = new Date(date);
  baseTime.setSeconds(0, 0);
  
  // Get minutes and round up to next 10
  const minutes = baseTime.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 10) * 10;
  
  // Create result time
  const result = new Date(baseTime);
  result.setMinutes(roundedMinutes);
  
  // If we're less than 10 minutes away, add 10 minutes
  const timeUntilNext = result.getTime() - baseTime.getTime();
  if (timeUntilNext < 10 * 60 * 1000) {
    result.setMinutes(roundedMinutes + 10);
  }
  
  return result;
};

// Update the formatScheduledTime function
const formatScheduledTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date
    .toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase()
    .replace(/\s/g, ""); // Remove spaces between time and AM/PM
};

// Update the CountdownTimer component to show minutes:seconds
const CountdownTimer = ({ targetTime }: { targetTime: number }) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const difference = targetTime - now;

      if (difference <= 0) {
        return "Starting soon...";
      }

      const minutes = Math.floor(difference / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [targetTime]);

  return (
    <div className="text-[40px] font-mono font-bold text-indigo-300/90 tracking-wider">
      {timeLeft}
    </div>
  );
};

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
  const player = gameState.players.find((p) => p.id === userId);
  const send = GameContext.useSend();
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [tokenAccount, setTokenAccount] = useState<{
    exists: boolean;
    balance: number;
    isInitialized: boolean;
  }>({
    exists: false,
    balance: 0,
    isInitialized: false,
  });

  // Add effect to fetch token balance
  useEffect(() => {
    const fetchTokenAccount = async () => {
      if (!publicKey || !connection) {
        setTokenAccount({ exists: false, balance: 0, isInitialized: true });
        return;
      }

      try {
        const tokenAccountAddress = await getAssociatedTokenAddress(
          TJAM_TOKEN_MINT,
          publicKey
        );

        const accountInfo = await connection.getAccountInfo(tokenAccountAddress);
        
        if (accountInfo) {
          const tokenBalance = await connection.getTokenAccountBalance(tokenAccountAddress);
          setTokenAccount({
            exists: true,
            balance: Number(tokenBalance.value.uiAmount || 0),
            isInitialized: true,
          });
        } else {
          setTokenAccount({
            exists: false,
            balance: 0,
            isInitialized: true,
          });
        }
      } catch (err) {
        console.error("Error fetching token account:", err);
        setTokenAccount({
          exists: false,
          balance: 0,
          isInitialized: true,
        });
      }
    };

    if (publicKey) {
      fetchTokenAccount();
    }
  }, [publicKey, connection]);

  // Calculate current prizes and potential max prizes
  const currentPrizes = calculatePrizes(
    gameState.entryFee,
    gameState.paidPlayers.length
  );
  const maxPrizes = calculatePrizes(
    gameState.entryFee,
    gameState.settings.maxPlayers
  );

  const handleEnterGame = async () => {
    if (!publicKey || !connection || !sendTransaction) return;

    try {
      // Get player's token account
      const playerTokenAccount = await getAssociatedTokenAddress(
        TJAM_TOKEN_MINT,
        publicKey
      );

      // Create transaction to transfer entry fee
      const transaction = new Transaction();
      // Add transfer instruction here
      // ... (we'll need to implement the token transfer)

      // Send transaction
      const signature = await sendTransaction(transaction, connection);

      // Wait for confirmation
      await connection.confirmTransaction(signature);

      // Submit the entry fee to the game
      send({
        type: "SUBMIT_ENTRY_FEE",
        transactionSignature: signature,
      });
    } catch (err) {
      console.error("Error submitting entry fee:", err);
    }
  };

  // Function to render the action button based on state
  const renderActionButton = () => {
    if (!publicKey) {
      return (
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50">
          <div className="flex flex-col items-center space-y-4">
            <WalletMultiButton className="w-full py-4 px-8 rounded-xl text-xl font-medium bg-[#6D28D9] hover:bg-[#5B21B6] text-white disabled:opacity-50" />
            <div className="text-gray-400 text-sm">
              Connect your wallet to play
            </div>
          </div>
        </div>
      );
    }

    if (!tokenAccount.exists) {
      return (
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50 space-y-4">
          <TokenBalance />
          <div className="text-center text-amber-400/80 text-sm">
            Create a TJAM token account to play
          </div>
        </div>
      );
    }

    if (tokenAccount.balance < 100) {
      return (
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50 space-y-4">
          <motion.button
            disabled
            className="w-full py-4 px-8 rounded-xl text-xl font-bold bg-gray-700/50 text-gray-400 cursor-not-allowed"
          >
            Enter Game (100 TJAM)
          </motion.button>
          <div className="text-center text-amber-400/80 text-sm">
            Insufficient TJAM balance. You need 100 TJAM to enter.
            <br />
            Current balance: {tokenAccount.balance} TJAM
          </div>
          <TokenBalance />
        </div>
      );
    }

    return (
      <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50">
        <motion.button
          onClick={handleEnterGame}
          className="w-full py-4 px-8 rounded-xl text-xl font-bold transition-all duration-200
            bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Enter Game (100 TJAM)
        </motion.button>
      </div>
    );
  };

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
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            {player ? `Welcome, ${playerName}!` : "Game Lobby"}
          </h1>

          {/* Add this new section */}
          <div className="mt-4 text-center">
            <div className="text-lg text-gray-400">Game starts at</div>
            <div className="text-2xl font-bold text-indigo-400">
              {formatScheduledTime(gameState.scheduledStartTime)}
            </div>
            <div className="text-sm text-gray-500">
              {new Date(gameState.scheduledStartTime).toLocaleDateString(
                undefined,
                {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                }
              )}
            </div>
            <div className="mt-2">
              <CountdownTimer targetTime={gameState.scheduledStartTime} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between text-gray-400 text-xl">
              <span>Entry Tokens:</span>
              <span className="text-white font-bold">100 TJAM</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400 text-xl">
                  <span>🥇</span>
                  <span>First Place:</span>
                </div>
                <span className="text-xl font-bold text-yellow-400">
                  560 TJAM
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400 text-xl">
                  <span>🥈</span>
                  <span>Second Place:</span>
                </div>
                <div className="text-xl font-bold text-gray-300">270 TJAM</div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400 text-xl">
                  <span>🥉</span>
                  <span>Third Place:</span>
                </div>
                <span className="text-xl font-bold text-amber-600">
                  110 TJAM
                </span>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-700/30">
                <div className="flex items-center justify-between text-gray-400 text-lg">
                  <div className="flex items-center gap-2">
                    <span>👑</span>
                    <span>Host Earnings:</span>
                  </div>
                  <span className="font-bold">36 TJAM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!hasPaid ? (
          <div className="space-y-6">
            {publicKey ? <WalletSection /> : null}
            {renderActionButton()}
          </div>
        ) : (
          <div className="space-y-6 text-center">
            <div className="bg-green-500/20 text-green-300 p-4 rounded-xl">
              Entry fee paid! Waiting for game to start...
            </div>
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <span className="text-indigo-300">
                Waiting for other players... {gameState.paidPlayers.length}/
                {gameState.settings.maxPlayers}
              </span>
            </div>
          </div>
        )}

        {/* Player List */}
        <PlayerList />

        {/* Share Game Link or Enter Game Button */}
        <div className="mb-8">
          <ShareGameLink host={window.location.host} gameId={gameState.id} />
        </div>

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

// WalletSection: Handles wallet connection, token balances, and token minting
const WalletSection = () => {
  const { connected, publicKey, disconnect, sendTransaction } = useWallet();
  const { connection } = useConnection();

  // Add token account state
  const [tokenAccount, setTokenAccount] = useState<TokenAccountState>({
    exists: false,
    balance: 0,
    isInitialized: false,
  });

  // Add state variables
  const [displayAddress, setDisplayAddress] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [solBalance, setSolBalance] = useState(0);

  // Add these new state variables
  const [jamBalance, setJamBalance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(0.1);
  const [isDepositing, setIsDepositing] = useState(false);

  // Add these constants
  const MIN_SOL_DEPOSIT = 0.05;
  const SOL_TO_TJAM_RATE = 1000;
  const SUGGESTED_SOL_PERCENTAGE = 0.15;

  // Add these helper functions
  const getDepositHelperText = () => {
    if (solBalance === 0) return "No SOL available";
    const maxDeposit = Math.floor(solBalance * 100) / 100; // Round down to 2 decimals
    return `Available: ${maxDeposit} SOL`;
  };

  const handleDepositChange = (value: number) => {
    // Ensure deposit amount doesn't exceed available balance
    const maxDeposit = Math.floor(solBalance * 100) / 100;
    const newAmount = Math.min(value, maxDeposit);
    setDepositAmount(newAmount);
  };

  // Update fetchBalances to also check token account
  const fetchBalances = async () => {
    if (!publicKey || !connection) return;

    try {
      // Get SOL balance
      const balance = await connection.getBalance(publicKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);

      // Get token account
      const tokenAccountAddress = await getAssociatedTokenAddress(
        TJAM_TOKEN_MINT,
        publicKey
      );

      const accountInfo = await connection.getAccountInfo(tokenAccountAddress);

      if (accountInfo) {
        const tokenBalance = await connection.getTokenAccountBalance(
          tokenAccountAddress
        );
        setTokenAccount({
          exists: true,
          balance: Number(tokenBalance.value.uiAmount || 0),
          isInitialized: true,
        });
      } else {
        setTokenAccount({
          exists: false,
          balance: 0,
          isInitialized: true,
        });
      }
    } catch (err) {
      console.error("Error fetching balances:", err);
    }
  };

  const handleAddTokens = async () => {
    if (!publicKey || !connection) return;
    setIsRefreshing(true);
    setError(null);
    try {
      // Implementation from your existing handleAddTokens function
      // This should create the token account if it doesn't exist
      await createTokenAccount();
      await fetchBalances();
      setSuccess("Successfully added TJAM token account!");
    } catch (err) {
      console.error("Error adding tokens:", err);
      setError(err instanceof Error ? err.message : "Failed to add tokens");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeposit = async () => {
    if (!publicKey || !connection || !sendTransaction) return;
    setIsDepositing(true);
    setError(null);
    try {
      // Implementation from your existing handleDeposit function
      // This should handle the SOL to TJAM conversion
      await depositSolForTokens();
      await fetchBalances();
      setSuccess(`Successfully deposited ${depositAmount} SOL for TJAM!`);
    } catch (err) {
      console.error("Error depositing:", err);
      setError(err instanceof Error ? err.message : "Failed to deposit");
    } finally {
      setIsDepositing(false);
    }
  };

  // Update useEffect to reset token account state
  useEffect(() => {
    if (publicKey) {
      const address = publicKey.toString();
      setDisplayAddress(address.slice(0, 4) + "..." + address.slice(-4));
      fetchBalances();
    } else {
      setDisplayAddress("");
      setSolBalance(0);
      setTokenAccount({ exists: false, balance: 0, isInitialized: false });
    }
  }, [publicKey, connection]);

  // Function to copy wallet address
  const copyAddress = async () => {
    if (!publicKey) return;
    try {
      await navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  // Update createTokenAccount with more logging
  const createTokenAccount = async () => {
    if (!publicKey || !connection) {
      console.log("createTokenAccount: Missing publicKey or connection", {
        hasPublicKey: !!publicKey,
        hasConnection: !!connection,
      });
      return;
    }

    try {
      console.log("Creating token account for:", {
        mint: TJAM_TOKEN_MINT.toString(),
        owner: publicKey.toString(),
      });

      // Get the token account address
      const tokenAccount = await getAssociatedTokenAddress(
        TJAM_TOKEN_MINT,
        publicKey
      );
      console.log("Associated token address:", tokenAccount.toString());

      // Check if account already exists
      const accountInfo = await connection.getAccountInfo(tokenAccount);
      console.log("Existing account info:", {
        exists: !!accountInfo,
        owner: accountInfo?.owner?.toString(),
        size: accountInfo?.data.length,
      });

      if (accountInfo) {
        console.log("Token account already exists, skipping creation");
        setSuccess("Token account already exists!");
        return;
      }

      // Create the transaction
      const transaction = new Transaction();

      // Add create account instruction
      const createInstruction = createAssociatedTokenAccountInstruction(
        publicKey, // payer
        tokenAccount, // new account address
        publicKey, // owner
        TJAM_TOKEN_MINT // token mint
      );
      transaction.add(createInstruction);

      console.log("Created instruction:", {
        payer: publicKey.toString(),
        newAccount: tokenAccount.toString(),
        owner: publicKey.toString(),
        mint: TJAM_TOKEN_MINT.toString(),
      });

      // Get latest blockhash
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      console.log("Sending transaction with blockhash:", blockhash);

      // Send and confirm transaction
      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: true,
        maxRetries: 3,
      });

      console.log("Transaction sent:", signature);

      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      console.log("Transaction confirmed:", {
        signature,
        confirmation,
        err: confirmation.value.err,
      });

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
        );
      }

      // Verify account was created
      const newAccountInfo = await connection.getAccountInfo(tokenAccount);
      console.log("New account verification:", {
        exists: !!newAccountInfo,
        owner: newAccountInfo?.owner?.toString(),
        size: newAccountInfo?.data.length,
      });

      setSuccess("Token account created successfully!");
    } catch (err) {
      console.error("Error in createTokenAccount:", err);
      throw err;
    }
  };

  const depositSolForTokens = async () => {
    if (!publicKey || !connection || !sendTransaction) return;

    try {
      console.log("Starting deposit process:", {
        amount: depositAmount,
        expectedTjam: depositAmount * SOL_TO_TJAM_RATE,
      });

      // Get the token account address
      const tokenAccount = await getAssociatedTokenAddress(
        TJAM_TOKEN_MINT,
        publicKey
      );
      console.log("User token account:", tokenAccount.toString());

      // Get the treasury account
      const treasuryAccount = TJAM_TOKEN_AUTHORITY;
      console.log("Treasury account:", treasuryAccount.toString());

      // Create transaction
      const transaction = new Transaction();

      // Only transfer SOL to treasury - the backend will handle minting TJAM
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: treasuryAccount,
          lamports: depositAmount * LAMPORTS_PER_SOL,
        })
      );

      console.log("Transaction built with instructions:", {
        solTransfer: `${depositAmount} SOL to ${treasuryAccount.toString()}`,
      });

      // Get latest blockhash
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      console.log("Sending transaction...");

      // Send and confirm transaction
      const signature = await sendTransaction(transaction, connection);
      console.log("Transaction sent:", signature);

      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      console.log("Transaction confirmed:", {
        signature,
        err: confirmation.value.err,
      });

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
        );
      }

      // Wait a bit longer for chain state to update
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Fetch all balances to update both SOL and TJAM
      await fetchBalances();

      setSuccess(
        `Successfully deposited ${depositAmount} SOL. TJAM tokens will be minted shortly.`
      );
    } catch (err) {
      console.error("Error depositing SOL for TJAM:", err);
      throw err;
    }
  };

  // Add this useEffect for automatic balance refreshing
  useEffect(() => {
    if (!publicKey || !connection) return;

    // Initial fetch
    fetchBalances();

    // Set up automatic refresh every 10 seconds
    const interval = setInterval(() => {
      console.log("Auto-refreshing balances...");
      fetchBalances();
    }, 10000);

    // Cleanup
    return () => clearInterval(interval);
  }, [publicKey, connection]);

  // Update the wallet address section JSX
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {connected && (
        <WalletInfo
          address={displayAddress}
          fullAddress={publicKey?.toString()}
          balance={solBalance}
          onCopy={copyAddress}
          onDisconnect={disconnect}
          copied={copied}
        />
      )}
    </motion.div>
  );
};
