import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Check,
  ChevronRight,
  Copy,
  Crown,
  Eye,
  Loader2,
  Trophy,
  Users,
  X,
  Settings,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { GameContext } from "~/game.context";
import { SessionContext } from "~/session.context";
import type { Answer } from "~/game.types";
import * as Drawer from "vaul";

type GameSettings = {
  maxPlayers: number;
  questionCount: number;
  answerTimeWindow: number;
};

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: GameSettings;
  onSave: (settings: GameSettings) => void;
};

export const HostView = ({ 
  host,
  initialExactAnswer = true,
}: { 
  host: string;
  initialExactAnswer?: boolean;
}) => {
  const gameState = GameContext.useSelector((state) => state);
  const sessionState = SessionContext.useSelector((state) => state.public);
  const {
    gameStatus,
    currentQuestion,
    players,
    hostId,
    id,
  } = gameState.public;
  const send = GameContext.useSend();

  const [tokenRewardsEnabled, setTokenRewardsEnabled] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(1);

  if (sessionState.userId !== hostId) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 backdrop-blur-sm rounded-2xl p-8 border border-red-500/30 text-center max-w-md"
        >
          <h1 className="text-2xl font-bold text-red-400 mb-4">
            Host Controls Not Available
          </h1>
          <p className="text-white/70">
            Only the host can access these controls.
          </p>
        </motion.div>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative">
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
            Creating Game...
          </h1>
          <Loader2
            className="w-12 h-12 animate-spin mx-auto text-indigo-400"
            role="status"
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <AnimatePresence mode="wait">
        {gameStatus === "lobby" && (
          <LobbyControls
            players={players}
            onStartGame={() => send({ type: "START_GAME" })}
            host={host}
          />
        )}

        {gameStatus === "active" && (
          <QuestionControls
            currentQuestion={currentQuestion}
            players={players}
            initialExactAnswer={initialExactAnswer}
          />
        )}

        {gameStatus === "finished" && <GameFinishedDisplay players={players} />}
      </AnimatePresence>

      <div className="token-rewards-config">
        <h3>Token Rewards</h3>
        <label>
          <input
            type="checkbox"
            checked={tokenRewardsEnabled}
            onChange={(e) => setTokenRewardsEnabled(e.target.checked)}
          />
          Enable Token Rewards
        </label>
        
        {tokenRewardsEnabled && (
          <div>
            <label>
              Reward Amount:
              <input
                type="number"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(Number(e.target.value))}
                min="0"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

const PlayerSlot = ({ 
  player,
  onRemove,
  isHost 
}: { 
  player?: { id: string; name: string; score: number };
  onRemove?: (playerId: string) => void;
  isHost?: boolean;
}) => (
  <div className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-gray-900/30 border border-gray-700/30">
    {player ? (
      <>
        <div className="flex items-center gap-2">
          <span className="font-medium">{player.name}</span>
          {isHost && (
            <span className="px-2 py-1 text-xs font-bold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
              Host
            </span>
          )}
          {onRemove && !isHost && (
            <motion.button
              onClick={() => onRemove(player.id)}
              className="p-1 text-red-400 hover:text-red-300 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              data-testid={`remove-player-${player.id}`}
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </div>
        <div className="flex items-center">
          <motion.span 
            key={`score-${player.score}`}
            initial={{ scale: 1.2, color: '#34D399' }}
            animate={{ scale: 1, color: '#818CF8' }}
            className="text-indigo-400 font-bold"
          >
            {player.score}
          </motion.span>
        </div>
      </>
    ) : (
      <span className="text-white/30 font-medium">Empty Slot</span>
    )}
  </div>
);

const PlayerList = ({ 
  players, 
  maxPlayers = 10,
  hostId,
  onRemovePlayer,
}: { 
  players: Array<{ id: string; name: string; score: number }>;
  maxPlayers?: number;
  hostId: string;
  onRemovePlayer?: (playerId: string) => void;
}) => {
  // Create array of length maxPlayers filled with players or undefined
  const slots = Array(maxPlayers).fill(undefined).map((_, i) => players[i]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-700/50"
    >
      <h2 className="text-xl font-bold mb-3 text-indigo-300 flex items-center gap-2">
        <Users className="w-5 h-5" /> Players ({players.length}/{maxPlayers})
      </h2>
      <div className="space-y-2">
        {slots.map((player, index) => (
          <PlayerSlot 
            key={player?.id || `empty-${index}`} 
            player={player}
            isHost={player?.id === hostId}
            onRemove={onRemovePlayer}
          />
        ))}
      </div>
    </motion.div>
  );
};

const SettingsModal = ({ isOpen, onClose, currentSettings, onSave }: SettingsModalProps) => {
  const [settings, setSettings] = useState<GameSettings>(currentSettings);
  const playerLimits = [10, 100, 1000, 10000, 100000, 1000000];

  if (!isOpen) return null;

  return (
    <Drawer.Root open={isOpen} onOpenChange={onClose}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
        <Drawer.Content className="bg-gradient-to-br from-indigo-900/90 to-purple-900/90 flex flex-col fixed bottom-0 left-0 right-0 max-h-[85vh] rounded-t-[10px] border-t border-white/20 z-[100]">
          <div className="p-4 pb-6 flex-1 overflow-y-auto">
            {/* Drawer handle */}
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/20 mb-4" />

            <div className="max-w-xl mx-auto px-2">
              <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                Game Settings
              </h2>

              <div className="space-y-4">
                {/* Question Count Setting */}
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-indigo-300">Questions</h3>
                    <input
                      id="questionCount"
                      type="number"
                      min="1"
                      max="50"
                      value={settings.questionCount}
                      onChange={(e) => setSettings((s) => ({ ...s, questionCount: parseInt(e.target.value) || 1 }))}
                      className="w-20 bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-white text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      aria-label="Number of Questions"
                    />
                  </div>
                  <p className="text-sm text-white/60">Number of questions in the game</p>
                </div>

                {/* Answer Time Window Setting */}
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-indigo-300">Time Limit</h3>
                    <div className="flex items-center gap-2">
                      <input
                        id="answerTime"
                        type="number"
                        min="5"
                        max="120"
                        value={settings.answerTimeWindow}
                        onChange={(e) => setSettings((s) => ({ ...s, answerTimeWindow: parseInt(e.target.value) || 5 }))}
                        className="w-16 bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-white text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        aria-label="Answer Time Window"
                      />
                      <span className="text-white/60 text-sm">sec</span>
                    </div>
                  </div>
                  <p className="text-sm text-white/60">Time to answer each question</p>
                </div>

                {/* Max Players Setting */}
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-indigo-300">Player Limit</h3>
                    <select
                      id="maxPlayers"
                      value={settings.maxPlayers}
                      onChange={(e) => setSettings((s) => ({ ...s, maxPlayers: parseInt(e.target.value) }))}
                      className="w-32 bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      aria-label="Max Players"
                    >
                      {playerLimits.map(limit => (
                        <option key={limit} value={limit}>
                          {limit.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-sm text-white/60">Maximum number of players allowed</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => {
                    onSave(settings);
                    onClose();
                  }}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-white/5 hover:bg-white/10 text-white/80 font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

const LobbyControls = ({
  players,
  onStartGame,
  host,
}: {
  players: Array<{ id: string; name: string; score: number }>;
  onStartGame: () => void;
  host: string;
}) => {
  const gameState = GameContext.useSelector((state) => state.public);
  const send = GameContext.useSend();
  const hasEnoughPlayers = players.length > 0;
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Construct the game URL using the host and game ID
  const gameUrl = `https://${host}/games/${gameState.id}`;

  const copyGameLink = async () => {
    await navigator.clipboard.writeText(gameUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareGameLink = async () => {
    try {
      await navigator.share({
        title: 'Join my Trivia Jam game!',
        text: 'Click to join my Trivia Jam game!',
        url: gameUrl
      });
    } catch (err) {
      // Fallback to copy if share fails
      copyGameLink();
    }
  };

  const handleStartGame = () => {
    setIsStarting(true);
    onStartGame();
  };

  // Add settings handler
  const handleSaveSettings = (newSettings: {
    maxPlayers: number;
    questionCount: number;
    answerTimeWindow: number;
  }) => {
    send({ 
      type: "UPDATE_SETTINGS", 
      settings: newSettings
    });
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
        className="relative z-10 w-full max-w-4xl bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50"
      >
        {/* Add Settings Button */}
        <div className="absolute top-4 right-4">
          <motion.button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg bg-gray-900/30 border border-gray-700/30 text-indigo-300 hover:text-indigo-200 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Game Link Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-indigo-300 text-center mb-4">
            Share Game Link
          </h2>
          <div className="space-y-3">
            <motion.button
              onClick={copyGameLink}
              className="w-full relative group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-label={gameUrl}
              data-testid="game-link-button"
            >
              <div className="absolute inset-0 bg-indigo-500/20 rounded-xl blur-xl group-hover:bg-indigo-500/30 transition-all" />
              <div className="relative bg-gray-800/50 backdrop-blur-sm border border-indigo-500/30 rounded-xl p-4 sm:p-6 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-sm sm:text-lg font-medium tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 truncate block">
                    {gameUrl}
                  </span>
                </div>
                <div className="flex-shrink-0">
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="text-green-400"
                        data-testid="copy-success-icon"
                      >
                        <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="text-indigo-400 group-hover:text-indigo-300 transition-colors"
                        data-testid="copy-icon"
                      >
                        <Copy className="w-5 h-5 sm:w-6 sm:h-6" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.button>

            {/* Share button - always shown */}
            <motion.button
              onClick={shareGameLink}
              className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-xl p-4 sm:p-6 flex items-center justify-center gap-2 transition-colors"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92zM18 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 7.02c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
              </svg>
              Share Game
            </motion.button>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-2 text-indigo-300/60 text-sm"
          >
            Click to copy or share game link
          </motion.div>
        </div>

        <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Game Lobby
        </h1>

        {/* Start Game Button */}
        <div className="space-y-3">
          <motion.button
            onClick={handleStartGame}
            disabled={!hasEnoughPlayers || isStarting}
            className={`w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2
              ${
                hasEnoughPlayers && !isStarting
                  ? "hover:from-indigo-500 hover:to-purple-500 opacity-100"
                  : "opacity-50 cursor-not-allowed"
              }`}
            whileHover={hasEnoughPlayers && !isStarting ? { scale: 1.02 } : {}}
            whileTap={hasEnoughPlayers && !isStarting ? { scale: 0.98 } : {}}
          >
            {isStarting ? (
              <>
                <Loader2
                  className="w-5 h-5 animate-spin"
                  data-testid="loading-spinner"
                />
                Starting Game...
              </>
            ) : (
              "Start Game"
            )}
          </motion.button>

          {!hasEnoughPlayers && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-indigo-300/70 text-sm"
            >
              Waiting for at least one player to join...
            </motion.p>
          )}
        </div>


        <div className="mb-8">
          <PlayerList 
            players={players} 
            hostId={gameState.hostId}
            onRemovePlayer={(playerId) => send({ type: "REMOVE_PLAYER", playerId })}
          />
        </div>

        <AnimatePresence>
          {showSettings && (
            <SettingsModal
              isOpen={showSettings}
              onClose={() => setShowSettings(false)}
              currentSettings={gameState.settings}
              onSave={handleSaveSettings}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const QuestionControls = ({
  currentQuestion,
  players,
  initialExactAnswer,
}: {
  currentQuestion: { questionId: string; startTime: number; answers: Answer[] } | null;
  players: Array<{ id: string; name: string; score: number }>;
  initialExactAnswer: boolean;
}) => {
  const [questionText, setQuestionText] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState<string>("");
  const [requireExactAnswer, setRequireExactAnswer] = useState(initialExactAnswer);
  const send = GameContext.useSend();
  const gameState = GameContext.useSelector((state) => state.public);

  // Add timer state
  const [timeLeft, setTimeLeft] = useState(0);

  // Add timer effect
  useEffect(() => {
    if (!currentQuestion) return;

    const calculateTimeLeft = () => {
      return Math.max(
        0,
        Math.ceil(
          (currentQuestion.startTime +
            gameState.settings.answerTimeWindow * 1000 -
            Date.now()) /
            1000
        )
      );
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft <= 0) {
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [currentQuestion, gameState.settings.answerTimeWindow]);

  const handleSubmitQuestion = () => {
    const numericAnswer = parseFloat(correctAnswer);
    if (questionText.trim() && !isNaN(numericAnswer)) {
      send({ 
        type: "SUBMIT_QUESTION", 
        text: questionText.trim(),
        correctAnswer: numericAnswer,
        requireExactAnswer,
      });
      setQuestionText("");
      setCorrectAnswer("");
      setRequireExactAnswer(false);
    }
  };

  // Get the current question text from questions collection
  const currentQuestionText = currentQuestion 
    ? gameState.questions[currentQuestion.questionId]?.text 
    : null;

  return (
    <div className="min-h-screen flex flex-col items-center p-4 relative">
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

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-xl mx-auto space-y-4">
        {/* Current Question Display */}
        {currentQuestion && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-700/50"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-indigo-300">
                Current Question
              </h2>
              <motion.div
                className="text-3xl font-bold text-indigo-400"
                animate={{
                  scale: timeLeft <= 5 ? [1, 1.1, 1] : 1,
                  color: timeLeft <= 5 ? ["#818CF8", "#EF4444", "#818CF8"] : "#818CF8",
                }}
                transition={{
                  duration: 1,
                  repeat: timeLeft <= 5 ? Infinity : 0,
                }}
              >
                {timeLeft}s
              </motion.div>
            </div>

            {/* Question Text */}
            <p className="text-lg sm:text-xl text-white/90 mb-4">
              {currentQuestionText}
            </p>

            {/* Answer Info */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-900/30 rounded-lg border border-gray-700/50">
              <div>
                <div className="text-sm text-white/60 mb-1">Correct Answer</div>
                <div className="text-xl font-bold text-green-400">
                  {gameState.questions[currentQuestion.questionId]?.correctAnswer}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-white/60 mb-1">Answer Type</div>
                <div className="text-lg font-medium text-indigo-400">
                  {gameState.questions[currentQuestion.questionId]?.requireExactAnswer 
                    ? "Exact Match Only" 
                    : "Closest Answer"}
                </div>
              </div>
            </div>
            
            {/* Answer submissions display */}
            {currentQuestion.answers.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-bold text-indigo-300 mb-2">
                  Answers Submitted: {currentQuestion.answers.length}
                </h3>
                <div className="space-y-2">
                  {currentQuestion.answers.map((answer) => {
                    const question = gameState.questions[currentQuestion.questionId];
                    const isExactMatch = answer.value === question.correctAnswer;
                    const isClosest = !question.requireExactAnswer && 
                      currentQuestion.answers.every(a => 
                        Math.abs(answer.value - question.correctAnswer) <= 
                        Math.abs(a.value - question.correctAnswer)
                      );

                    return (
                      <div
                        key={answer.playerId}
                        className={`bg-gray-900/30 rounded-lg p-3 flex justify-between items-center border ${
                          isExactMatch 
                            ? 'border-green-500/50 bg-green-500/10' 
                            : isClosest 
                              ? 'border-indigo-500/50 bg-indigo-500/10'
                              : 'border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-white/90">{answer.playerName}</span>
                          {(isExactMatch || isClosest) && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              isExactMatch 
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-indigo-500/20 text-indigo-400'
                            }`}>
                              {isExactMatch ? 'Exact' : 'Closest'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`font-medium ${
                            isExactMatch 
                              ? 'text-green-400' 
                              : isClosest 
                                ? 'text-indigo-400'
                                : 'text-white/90'
                          }`}>
                            {answer.value}
                          </span>
                          <span className="text-white/60">
                            {((answer.timestamp - currentQuestion.startTime) / 1000).toFixed(1)}s
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Question Input */}
        {!currentQuestion && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-700/50"
          >
            <label
              htmlFor="question-input"
              className="text-xl font-bold mb-2 text-indigo-300 block"
            >
              Enter Question
            </label>
            <textarea
              id="question-input"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Type your question here..."
              className="w-full bg-gray-900/50 rounded-xl p-3 sm:p-4 text-white placeholder-white/50 border border-gray-700/50 mb-3 sm:mb-4 text-lg"
              rows={5}
              aria-label="Enter question"
            />
            
            {/* New Numerical Answer Input */}
            <label
              htmlFor="correct-answer"
              className="text-xl font-bold mb-2 text-indigo-300 block"
            >
              Correct Answer
            </label>
            <input
              id="correct-answer"
              type="number"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              placeholder="Enter the numerical answer"
              className="w-full bg-gray-900/50 rounded-xl p-3 sm:p-4 text-white placeholder-white/50 border border-gray-700/50 mb-3 sm:mb-4 text-lg"
              aria-label="Correct answer"
              step="any"
            />

            {/* Answer type toggle */}
            <div className="p-4 bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50 mb-4">
              <h3 className="font-medium text-white mb-3">Answer Type</h3>
              <div className="space-y-3">
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="radio"
                      checked={requireExactAnswer}
                      onChange={() => setRequireExactAnswer(true)}
                      className="peer sr-only"
                    />
                    <div className="w-4 h-4 border-2 rounded-full border-gray-500 group-hover:border-indigo-400 peer-checked:border-indigo-500">
                      <div className={`w-2 h-2 rounded-full bg-indigo-500 m-0.5 transition-opacity ${
                        requireExactAnswer ? 'opacity-100' : 'opacity-0'
                      }`} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white">Exact Answer</div>
                    <p className="text-sm text-white/60">
                      Only exact matches will earn points
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="radio"
                      checked={!requireExactAnswer}
                      onChange={() => setRequireExactAnswer(false)}
                      className="peer sr-only"
                    />
                    <div className="w-4 h-4 border-2 rounded-full border-gray-500 group-hover:border-indigo-400 peer-checked:border-indigo-500">
                      <div className={`w-2 h-2 rounded-full bg-indigo-500 m-0.5 transition-opacity ${
                        !requireExactAnswer ? 'opacity-100' : 'opacity-0'
                      }`} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white">Closest Answer</div>
                    <p className="text-sm text-white/60">
                      Points awarded to answers nearest the correct value
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <motion.button
              onClick={handleSubmitQuestion}
              disabled={!questionText.trim() || !correctAnswer.trim()}
              className={`w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2
                ${questionText.trim() && correctAnswer.trim() 
                  ? "hover:from-indigo-500 hover:to-purple-500 opacity-100"
                  : "opacity-50 cursor-not-allowed"
                }`}
              whileHover={questionText.trim() && correctAnswer.trim() ? { scale: 1.02 } : {}}
              whileTap={questionText.trim() && correctAnswer.trim() ? { scale: 0.98 } : {}}
            >
              <ChevronRight className="w-5 h-5" />
              Submit Question
            </motion.button>
          </motion.div>
        )}

        {/* Player List */}
        <PlayerList 
          players={players} 
          hostId={gameState.hostId}
          onRemovePlayer={(playerId) => send({ type: "REMOVE_PLAYER", playerId })}
        />

        {/* End Game Button */}
        <motion.button
          onClick={() => send({ type: "END_GAME" })}
          className="w-full bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-xl transition-all flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          End Game
        </motion.button>
      </div>
    </div>
  );
};

const GameFinishedDisplay = ({
  players,
}: {
  players: Array<{ id: string; name: string; score: number }>;
}) => {
  // Create a copy before sorting
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

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

        <div className="space-y-3 mb-8">
          <h2 className="text-xl font-bold mb-4 text-indigo-300 flex items-center gap-2">
            <Trophy className="w-6 h-6" /> Final Scores
          </h2>
          {sortedPlayers
            .map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex justify-between items-center p-4 rounded-xl border ${
                  index === 0
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

