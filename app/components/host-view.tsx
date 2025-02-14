import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronRight,
  Copy,
  Loader2,
  Settings,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import * as Drawer from "vaul";
import { GameContext } from "~/game.context";
import type { GamePublicContext } from "~/game.machine";
import type { Answer, Question, QuestionResult } from "~/game.types";
import { SessionContext } from "~/session.context";
import { QuestionProgress } from "./question-progress";

type GameSettings = {
  maxPlayers: number;
  answerTimeWindow: number;
};

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: GameSettings;
  onSave: (settings: GameSettings) => void;
};

type Score = GamePublicContext["questionResults"][number]["scores"][number];

// Move formatQuestionsToText outside components
const formatQuestionsToText = (questions: Record<string, Question>): string => {
  return Object.values(questions)
    .map((q) => {
      if (q.questionType === "numeric") {
        return `${q.text}\n${q.correctAnswer}\n`;
      } else {
        const options =
          q.options
            ?.map((opt, i) => `${String.fromCharCode(97 + i)}) ${opt}`)
            .join(" ") || "";
        const correctIndex =
          q.options?.findIndex((opt) => opt === q.correctAnswer) || 0;
        return `${q.text}\n${options}\nCorrect answer: ${String.fromCharCode(
          65 + correctIndex
        )}\n`;
      }
    })
    .join("\n");
};

export const HostView = ({
  host,
  initialDocumentContent = "",
}: {
  host: string;
  initialDocumentContent?: string;
}) => {
  const gameState = GameContext.useSelector((state) => state.public);
  const sessionState = SessionContext.useSelector((state) => state.public);
  const {
    gameStatus,
    currentQuestion,
    players,
    hostId,
    id,
    questions,
    questionResults,
  } = gameState;
  const send = GameContext.useSend();

  const lastQuestionResult = questionResults[questionResults.length - 1];

  const [documentContent, setDocumentContent] = useState(
    initialDocumentContent
  );
  const [isParsingDocument, setIsParsingDocument] = useState(false);
  const [isEditingQuestions, setIsEditingQuestions] = useState(false);
  const client = GameContext.useClient();

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
      {gameStatus === "active" && (
        <QuestionProgress
          current={gameState.questionNumber}
          total={Object.keys(gameState.questions).length}
        />
      )}
      <AnimatePresence mode="wait">
        {gameStatus === "lobby" && (
          <LobbyControls
            players={players}
            onStartGame={() => send({ type: "START_GAME" })}
            host={host}
          />
        )}

        {gameStatus === "active" && (
          <>
            <div className="min-h-screen flex flex-col items-center pt-16 p-4 relative">
              {/* Background gradient */}
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
                {/* Previous question results */}
                {!currentQuestion && lastQuestionResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                  >
                    <div className="text-center mb-8">
                      <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-6">
                        {questions[lastQuestionResult.questionId].text}
                      </h1>
                      <div className="text-4xl font-bold text-green-400">
                        {questions[lastQuestionResult.questionId].correctAnswer}
                      </div>
                    </div>

                    <div className="bg-gray-800/30 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/50">
                      <h2 className="text-3xl font-bold text-indigo-300 mb-6">
                        Results
                      </h2>
                      {lastQuestionResult.answers.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-8"
                        >
                          <div className="text-4xl mb-4">😴</div>
                          <div className="text-xl text-white/70">
                            No one answered this question
                          </div>
                        </motion.div>
                      ) : (
                        <div className="space-y-4">
                          {sortedAnswers(lastQuestionResult, questions).map(
                            (answer, index) => {
                              const score = lastQuestionResult.scores.find(
                                (s: { playerId: string }) =>
                                  s.playerId === answer.playerId
                              );
                              const question =
                                questions[lastQuestionResult.questionId];
                              const answerValue =
                                typeof answer.value === "number"
                                  ? answer.value
                                  : 0;
                              const correctAnswerValue =
                                typeof question.correctAnswer === "number"
                                  ? question.correctAnswer
                                  : 0;
                              const isExact =
                                question.questionType === "numeric" &&
                                answerValue === correctAnswerValue;
                              const isClose =
                                question.questionType === "numeric" &&
                                Math.abs(answerValue - correctAnswerValue) /
                                  correctAnswerValue <
                                  0.1; // Within 10%

                              return (
                                <div
                                  key={answer.playerId}
                                  data-testid={`player-result-${answer.playerId}`}
                                  className={`${
                                    score && score.points > 0
                                      ? "bg-green-500/10 border border-green-500/30"
                                      : isClose
                                      ? "bg-yellow-500/10 border border-yellow-500/30"
                                      : "bg-gray-900/50"
                                  } rounded-2xl p-6 flex items-center gap-6`}
                                >
                                  <div className="text-2xl font-bold text-indigo-400 w-12 text-center">
                                    {score && score.points > 0
                                      ? `#${score.position}`
                                      : "―"}
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-xl font-medium">
                                      {answer.playerName}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                      {answer.value} •{" "}
                                      {score?.timeTaken.toFixed(1)}s
                                    </div>
                                  </div>
                                  {score && score.points > 0 && (
                                    <div className="text-2xl font-bold text-indigo-400">
                                      {score.points}{" "}
                                      <span className="text-indigo-400/70">
                                        pts
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Question input form */}
                <QuestionControls
                  currentQuestion={currentQuestion}
                  players={players}
                />
              </div>
            </div>
          </>
        )}

        {gameStatus === "finished" && <GameFinishedDisplay players={players} />}
      </AnimatePresence>
    </div>
  );
};

const PlayerSlot = ({
  player,
  onRemove,
  isHost,
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
            initial={{ scale: 1.2, color: "#34D399" }}
            animate={{ scale: 1, color: "#818CF8" }}
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
  maxPlayers = 20,
  hostId,
  onRemovePlayer,
}: {
  players: Array<{ id: string; name: string; score: number }>;
  maxPlayers?: number;
  hostId: string;
  onRemovePlayer?: (playerId: string) => void;
}) => {
  // Create array with minimum 5 slots or enough slots for all players up to maxPlayers
  const numSlots = Math.max(5, Math.min(maxPlayers, players.length + 1));
  const slots = Array(numSlots)
    .fill(undefined)
    .map((_, i) => players[i]);

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

const SettingsModal = ({
  isOpen,
  onClose,
  currentSettings,
  onSave,
}: SettingsModalProps) => {
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
                {/* Answer Time Window Setting */}
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-indigo-300">
                      Time Limit
                    </h3>
                    <div className="flex items-center gap-2">
                      <input
                        id="answerTime"
                        type="number"
                        min="5"
                        max="120"
                        value={settings.answerTimeWindow}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            answerTimeWindow: parseInt(e.target.value) || 5,
                          }))
                        }
                        className="w-16 bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-white text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        aria-label="Answer Time Window"
                      />
                      <span className="text-white/60 text-sm">sec</span>
                    </div>
                  </div>
                  <p className="text-sm text-white/60">
                    Time to answer each question
                  </p>
                </div>

                {/* Max Players Setting */}
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-indigo-300">
                      Player Limit
                    </h3>
                    <select
                      id="maxPlayers"
                      value={settings.maxPlayers}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          maxPlayers: parseInt(e.target.value),
                        }))
                      }
                      className="w-32 bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      aria-label="Max Players"
                    >
                      {playerLimits.map((limit) => (
                        <option key={limit} value={limit}>
                          {limit.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-sm text-white/60">
                    Maximum number of players allowed
                  </p>
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
  const isParsingDocument = GameContext.useMatches({
    lobby: "parsingDocument",
  });
  const hasEnoughPlayers = players.length > 0;
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isEditingQuestions, setIsEditingQuestions] = useState(false);
  const [documentContent, setDocumentContent] = useState("");

  const gameUrl = `https://${host}/games/${gameState.id}`;

  const copyGameLink = async () => {
    await navigator.clipboard.writeText(gameUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareGameLink = async () => {
    try {
      await navigator.share({
        title: "Join my Trivia Jam game!",
        text: "Click to join my Trivia Jam game!",
        url: gameUrl,
      });
    } catch (err) {
      // Fallback to copy if share fails
      copyGameLink();
    }
  };
  const client = GameContext.useClient();

  const handleStartGame = () => {
    setIsStarting(true);
    onStartGame();
  };

  const handleParseDocument = async () => {
    if (!documentContent.trim()) return;

    send({
      type: "PARSE_QUESTIONS",
      documentContent: documentContent.trim(),
    });

    // Wait for questions to be added to the state
    try {
      await client.waitFor(
        (state) => Object.keys(state.public.questions).length > 0,
        10000 // 10 second timeout
      );
      setIsEditingQuestions(false);
    } catch (error) {
      console.error("Failed to parse questions:", error);
    }
  };

  const handleSaveSettings = (newSettings: {
    maxPlayers: number;
    answerTimeWindow: number;
  }) => {
    send({
      type: "UPDATE_SETTINGS",
      settings: newSettings,
    });
  };

  const hasQuestions = Object.keys(gameState.questions).length > 0;
  const canStartGame = hasEnoughPlayers && hasQuestions;

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

        <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Game Setup
        </h1>

        {/* Question Import Section */}
        {(!hasQuestions || isEditingQuestions) && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-indigo-300 mb-2">
              Import Questions
            </h2>
            <p className="text-indigo-300/70 text-sm mb-4">
              Add your trivia questions below. You can use numeric questions (with exact answers) or multiple choice questions. Each question should be followed by its answer.
            </p>
            <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-700/50">
              {isParsingDocument ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2
                    className="w-8 h-8 animate-spin text-indigo-400 mb-4"
                    data-testid="parsing-spinner"
                    role="status"
                  />
                  <p className="text-lg text-white/70">
                    Processing questions...
                  </p>
                  <p className="text-sm text-white/50 mt-2">
                    This may take a few moments
                  </p>
                </div>
              ) : (
                <>
                  <textarea
                    value={documentContent}
                    onChange={(e) => setDocumentContent(e.target.value)}
                    placeholder={`Paste your questions below using this format:

Question?
Answer

For multiple choice questions:
Question?
a) Option 1 b) Option 2 c) Option 3 d) Option 4
Correct answer: B

Example:
How many bones in human body?
206

What major canal opened in 1914?
a) Suez Canal b) Panama Canal c) Erie Canal d) English Channel
Correct answer: B`}
                    className="w-full bg-gray-800/50 rounded-xl p-4 text-white placeholder-white/50 border border-gray-700/50 mb-4 text-sm font-mono"
                    rows={8}
                  />
                  <button
                    onClick={handleParseDocument}
                    disabled={!documentContent.trim()}
                    className={`w-full bg-indigo-500/20 border border-indigo-500/30 hover:bg-indigo-500/30 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
                      !documentContent.trim()
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    Submit
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {hasQuestions && !isEditingQuestions && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-indigo-300">
                {Object.keys(gameState.questions).length} Questions
              </h3>
              <button
                onClick={() => {
                  const formattedText = Object.values(gameState.questions)
                    .map((q) => {
                      if (q.questionType === "numeric") {
                        return `${q.text}\n${q.correctAnswer}\n`;
                      } else {
                        const options =
                          q.options
                            ?.map(
                              (opt, i) =>
                                `${String.fromCharCode(97 + i)}) ${opt}`
                            )
                            .join(" ") || "";
                        const correctIndex =
                          q.options?.findIndex(
                            (opt) => opt === q.correctAnswer
                          ) || 0;
                        return `${
                          q.text
                        }\n${options}\nCorrect answer: ${String.fromCharCode(
                          65 + correctIndex
                        )}\n`;
                      }
                    })
                    .join("\n");
                  setDocumentContent(formattedText);
                  setIsEditingQuestions(true);
                }}
                className="text-indigo-400 hover:text-indigo-300 text-sm"
              >
                Edit Questions
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.entries(gameState.questions).map(
                ([id, question], index) => (
                  <div
                    key={id}
                    data-testid={`parsed-question-${index + 1}`}
                    className="bg-gray-800/50 rounded-lg p-3 text-sm"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-indigo-400 font-medium">
                          Q{index + 1}:
                        </span>{" "}
                        {question.text}
                        {question.questionType === "multiple-choice" &&
                          question.options && (
                            <div className="mt-1 ml-4 text-gray-400">
                              {question.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className={
                                    option === question.correctAnswer
                                      ? "text-green-400"
                                      : "text-gray-400"
                                  }
                                >
                                  {String.fromCharCode(97 + optIndex)}) {option}
                                  {option === question.correctAnswer && " ✓"}
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                      <div className="text-green-400 font-medium whitespace-nowrap">
                        {question.questionType === "numeric" && (
                          <>Answer: {question.correctAnswer}</>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

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

        {/* Player List */}
        <div className="mb-8">
          <PlayerList
            players={players}
            hostId={gameState.hostId}
            onRemovePlayer={(playerId) =>
              send({ type: "REMOVE_PLAYER", playerId })
            }
          />
        </div>

        {/* Start Game Button */}
        <div className="space-y-3">
          <motion.button
            onClick={handleStartGame}
            disabled={!canStartGame || isStarting}
            className={`w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2
              ${
                canStartGame && !isStarting
                  ? "hover:from-indigo-500 hover:to-purple-500 opacity-100"
                  : "opacity-50 cursor-not-allowed"
              }`}
            whileHover={canStartGame && !isStarting ? { scale: 1.02 } : {}}
            whileTap={canStartGame && !isStarting ? { scale: 0.98 } : {}}
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
}: {
  currentQuestion: {
    questionId: string;
    startTime: number;
    answers: Answer[];
  } | null;
  players: Array<{ id: string; name: string; score: number }>;
}) => {
  const send = GameContext.useSend();
  const gameState = GameContext.useSelector((state) => state.public);
  const lastQuestionResult = gameState.questionResults[gameState.questionResults.length - 1];
  const isLastQuestion = gameState.questionNumber >= Object.keys(gameState.questions).length;

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

  // Get the current question text from questions collection
  const currentQuestionText = currentQuestion
    ? gameState.questions[currentQuestion.questionId]?.text
    : null;

  // Get next unanswered question
  const nextQuestion = Object.values(gameState.questions)[gameState.questionNumber - 1];

  return (
    <div className="min-h-screen flex flex-col items-center pt-16 p-4 relative">
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
                  color:
                    timeLeft <= 5
                      ? ["#818CF8", "#EF4444", "#818CF8"]
                      : "#818CF8",
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
                  {
                    gameState.questions[currentQuestion.questionId]
                      ?.correctAnswer
                  }
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
                    const question =
                      gameState.questions[currentQuestion.questionId];
                    const answerValue =
                      typeof answer.value === "number" ? answer.value : 0;
                    const correctAnswerValue =
                      typeof question.correctAnswer === "number"
                        ? question.correctAnswer
                        : 0;
                    const isExact =
                      question.questionType === "numeric" &&
                      answerValue === correctAnswerValue;
                    const isClose =
                      question.questionType === "numeric" &&
                      Math.abs(answerValue - correctAnswerValue) /
                        correctAnswerValue <
                        0.1;

                    return (
                      <div
                        key={answer.playerId}
                        className={`bg-gray-900/30 rounded-lg p-3 flex justify-between items-center border ${
                          isExact
                            ? "border-green-500/50 bg-green-500/10"
                            : isClose
                            ? "border-indigo-500/50 bg-indigo-500/10"
                            : "border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-white/90">
                            {answer.playerName}
                          </span>
                          {(isExact || isClose) && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                isExact
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-indigo-500/20 text-indigo-400"
                              }`}
                            >
                              {isExact ? "Exact" : "Closest"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`font-medium ${
                              isExact
                                ? "text-green-400"
                                : isClose
                                ? "text-indigo-400"
                                : "text-white/90"
                            }`}
                          >
                            {answer.value}
                          </span>
                          <span className="text-white/60">
                            {(
                              (answer.timestamp - currentQuestion.startTime) /
                              1000
                            ).toFixed(1)}
                            s
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

        {/* Question Results or Next Question Button */}
        {!currentQuestion && (
          <>
            {lastQuestionResult ? (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-700/50"
              >
                {isLastQuestion ? (
                  <>
                    <h2 className="text-xl font-bold text-indigo-300 mb-4">
                      Game Complete
                    </h2>
                    <p className="text-lg text-white/70 mb-6">
                      All questions have been answered. You can now end the
                      game.
                    </p>
                    <motion.button
                      onClick={() => send({ type: "END_GAME" })}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 hover:from-indigo-500 hover:to-purple-500"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      data-testid="end-game-button"
                    >
                      End Game
                    </motion.button>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-indigo-300 mb-4">
                      Next Question Preview
                    </h2>
                    <div className="bg-gray-900/30 rounded-xl p-4 mb-6">
                      {nextQuestion ? (
                        <>
                          <div className="text-lg text-white/90 mb-2">
                            {nextQuestion.text}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white/60">
                              Answer:
                            </span>
                            <span className="text-lg font-medium text-green-400">
                              {nextQuestion.correctAnswer}
                            </span>
                          </div>
                          {nextQuestion.questionType === "multiple-choice" &&
                            nextQuestion.options && (
                              <div className="mt-2">
                                <div className="text-sm text-white/60 mb-1">
                                  Options:
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  {nextQuestion.options.map(
                                    (option: string, index: number) => (
                                      <div
                                        key={index}
                                        className={`text-sm p-2 rounded ${
                                          option === nextQuestion.correctAnswer
                                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                            : "bg-gray-800/50 text-white/70"
                                        }`}
                                      >
                                        {option}
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </>
                      ) : (
                        <div className="text-lg text-white/70 text-center py-4">
                          No more questions available
                        </div>
                      )}
                    </div>
                    <motion.button
                      onClick={() => {
                        if (!nextQuestion) return;
                        send({
                          type: "NEXT_QUESTION",
                          text: nextQuestion.text,
                          correctAnswer: nextQuestion.correctAnswer,
                          questionType: nextQuestion.questionType,
                          options: nextQuestion.options
                        });
                      }}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 hover:from-indigo-500 hover:to-purple-500"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Start Next Question
                    </motion.button>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-700/50"
              >
                <h2 className="text-xl font-bold text-indigo-300 mb-4">
                  Start First Question
                </h2>
                <div className="bg-gray-900/30 rounded-xl p-4 mb-6">
                  {nextQuestion ? (
                    <>
                      <div className="text-lg text-white/90 mb-2">
                        {nextQuestion.text}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/60">
                          Answer:
                        </span>
                        <span className="text-lg font-medium text-green-400">
                          {nextQuestion.correctAnswer}
                        </span>
                      </div>
                      {nextQuestion.questionType === "multiple-choice" &&
                        nextQuestion.options && (
                          <div className="mt-2">
                            <div className="text-sm text-white/60 mb-1">
                              Options:
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {nextQuestion.options.map(
                                (option: string, index: number) => (
                                  <div
                                    key={index}
                                    className={`text-sm p-2 rounded ${
                                      option === nextQuestion.correctAnswer
                                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                        : "bg-gray-800/50 text-white/70"
                                    }`}
                                  >
                                    {option}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </>
                  ) : (
                    <div className="text-lg text-white/70 text-center py-4">
                      No questions available
                    </div>
                  )}
                </div>
                <motion.button
                  onClick={() => {
                    if (!nextQuestion) return;
                    send({
                      type: "NEXT_QUESTION",
                      text: nextQuestion.text,
                      correctAnswer: nextQuestion.correctAnswer,
                      questionType: nextQuestion.questionType,
                      options: nextQuestion.options
                    });
                  }}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 hover:from-indigo-500 hover:to-purple-500"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Start First Question
                </motion.button>
              </motion.div>
            )}
          </>
        )}

        {/* Player List */}
        <PlayerList
          players={players}
          hostId={gameState.hostId}
          onRemovePlayer={(playerId) =>
            send({ type: "REMOVE_PLAYER", playerId })
          }
        />

        {/* End Game Button - Only show if not in game complete state */}
        {!isLastQuestion && (
          <motion.button
            onClick={() => send({ type: "END_GAME" })}
            className="w-full bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-xl transition-all flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            End Game
          </motion.button>
        )}
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
          {sortedPlayers.map((player, index) => (
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

const sortedAnswers = (
  result: {
    answers: Answer[];
    scores: Score[];
    questionId: string;
  },
  questions: Record<string, Question>
) => {
  const question = questions[result.questionId];
  const correctAnswer = question.correctAnswer;

  // First sort scores
  const sortedScores = [...result.scores].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    // If points are equal (including 0), sort by how close to correct answer
    const answerA = result.answers.find(
      (ans) => ans.playerId === a.playerId
    )?.value;
    const answerB = result.answers.find(
      (ans) => ans.playerId === b.playerId
    )?.value;
    if (
      answerA !== undefined &&
      answerB !== undefined &&
      question.questionType === "numeric"
    ) {
      const diffA = Math.abs(Number(answerA) - Number(correctAnswer));
      const diffB = Math.abs(Number(answerB) - Number(correctAnswer));
      if (diffA !== diffB) {
        return diffA - diffB; // Closer answer ranks higher
      }
    }
    // If equally close, sort by time
    return a.timeTaken - b.timeTaken;
  });

  // Then map to answers in the same order
  return sortedScores.map(
    (score) => result.answers.find((a) => a.playerId === score.playerId)!
  );
};

export function QuestionResults({
  question,
  results,
  totalQuestions,
  currentQuestionNumber,
  onNextQuestion,
  onEndGame,
}: {
  question: Question;
  results: QuestionResult;
  totalQuestions: number;
  currentQuestionNumber: number;
  onNextQuestion: () => void;
  onEndGame: () => void;
}) {
  const isLastQuestion = currentQuestionNumber === totalQuestions;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">{question.text}</h2>
        <div className="text-xl text-green-400">
          Correct Answer: {question.correctAnswer}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-2xl font-semibold text-white">Results</h3>
        {results.scores.map((score, index) => (
          <div
            key={score.playerId}
            data-testid={`player-result-${score.playerId}`}
            className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div className="text-xl font-semibold text-purple-400">
                #{index + 1}
              </div>
              <div>
                <div className="font-medium text-white">{score.playerName}</div>
                <div className="text-sm text-gray-400">
                  {
                    results.answers.find((a) => a.playerId === score.playerId)
                      ?.value
                  }
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                {score.timeTaken.toFixed(1)}s
              </div>
              <div className="text-lg font-semibold text-purple-400">
                {score.points}{" "}
                <span className="text-sm text-gray-400">pts</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={isLastQuestion ? onEndGame : onNextQuestion}
          className="px-6 py-3 text-lg font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          {isLastQuestion ? "End Game" : "Next Question"}
        </button>
      </div>
    </div>
  );
}
