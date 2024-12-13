import { AnimatePresence, motion } from "framer-motion";
import { Check, Crown, Loader2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { GameContext } from "~/game.context";
import { Answer, GamePublicContext } from "~/game.types";
import { SessionContext } from "~/session.context";

export const PlayerView = () => {
  const gameState = GameContext.useSelector((state) => state);
  const sessionState = SessionContext.useSelector((state) => state.public);
  const { gameStatus, currentQuestion, players, questions, settings, questionResults } = gameState.public;
  const [answerInput, setAnswerInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const send = GameContext.useSend();
  const [timeLeft, setTimeLeft] = useState(0);

  const player = players.find((p) => p.id === sessionState.userId);
  const hasAnswered = currentQuestion?.answers.some(
    (a) => a.playerId === sessionState.userId
  );

  useEffect(() => {
    if (!currentQuestion) return;

    const calculateTimeLeft = () => {
      return Math.max(
        0,
        Math.ceil(
          (currentQuestion.startTime +
            settings.answerTimeWindow * 1000 -
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
    }, 100); // Update every 100ms for smooth countdown

    return () => clearInterval(timer);
  }, [currentQuestion, settings.answerTimeWindow]);

  const handleSubmitAnswer = () => {
    if (!currentQuestion || hasAnswered || !answerInput) return;

    setIsSubmitting(true);
    const numericAnswer = parseFloat(answerInput);
    
    if (!isNaN(numericAnswer)) {
      send({
        type: "SUBMIT_ANSWER",
        value: numericAnswer,
      });
    }
    
    setAnswerInput("");
    setIsSubmitting(false);
  };

  if (!player) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <NameEntryForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <AnimatePresence mode="wait">
        {gameStatus === "lobby" && <LobbyDisplay player={player} />}

        {gameStatus === "active" && !currentQuestion && questionResults.length > 0 && (
          <QuestionResultsDisplay
            player={player}
            questions={questions}
            questionResults={questionResults}
          />
        )}

        {gameStatus === "active" && !currentQuestion && questionResults.length === 0 && (
          <WaitingDisplay player={player} />
        )}

        {gameStatus === "active" && currentQuestion && (
          <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
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
            <div className="relative z-10 w-full max-w-xl">
              {/* Timer */}
              <motion.div
                className="text-7xl font-bold text-center text-indigo-400 mb-8"
                data-testid="question-timer"
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

              {/* Question */}
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                  {questions[currentQuestion.questionId].text}
                </h1>
              </div>

              {/* Answer Input */}
              {!hasAnswered ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="answer" className="block text-lg font-medium text-indigo-300 mb-2">
                      Your Answer
                    </label>
                    <input
                      id="answer"
                      type="number"
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      className="w-full bg-gray-800/50 rounded-xl p-4 text-white text-xl"
                      placeholder="Enter your answer..."
                      step="any"
                    />
                  </div>
                  <motion.button
                    onClick={handleSubmitAnswer}
                    disabled={isSubmitting || !answerInput}
                    className={`w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2
                      ${!isSubmitting && answerInput ? "hover:from-indigo-500 hover:to-purple-500" : "opacity-50 cursor-not-allowed"}`}
                    whileHover={!isSubmitting && answerInput ? { scale: 1.02 } : {}}
                    whileTap={!isSubmitting && answerInput ? { scale: 0.98 } : {}}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Answer"
                    )}
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                  data-testid="answer-submitted"
                >
                  <div className="text-2xl font-bold text-indigo-400 mb-2">
                    Answer Submitted!
                  </div>
                  <div className="text-4xl font-bold text-white mb-4">
            {currentQuestion.answers.find(a => a.playerId === sessionState.userId)?.value}
          </div>
          <div className="text-xl text-white/60">
            {((currentQuestion.answers.find(a => a.playerId === sessionState.userId)?.timestamp || 0) - currentQuestion.startTime) / 1000}s
          </div>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {gameStatus === "finished" && <GameFinishedDisplay player={player} />}
      </AnimatePresence>
    </div>
  );
};

type Player = {
  id: string;
  name: string;
  score: number;
};

const LobbyDisplay = ({ player }: { player: Player }) => (
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
        Welcome, {player.name}!
      </h1>
      <p className="text-xl text-white/70 mb-8">
        Waiting for host to start the game...
      </p>
      <Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-400" />
    </motion.div>
  </div>
);

const WaitingDisplay = ({ player }: { player: Player }) => (
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
        Waiting for next question...
      </h1>
      <p className="text-xl text-white/70 mb-8">
        Get ready, {player.name}!
      </p>
      <Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-400" />
    </motion.div>
  </div>
);

const GameFinishedDisplay = ({ player }: { player: Player }) => (
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
          <Crown className="w-6 h-6" /> Final Scores
        </h2>
        <div className="flex justify-between items-center p-4 rounded-xl border bg-indigo-500/20 border-indigo-500/30">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-indigo-400">#{1}</span>
            <span className="font-medium">{player.name}</span>
          </div>
          <span className="text-xl font-bold text-indigo-400">{player.score}</span>
        </div>
      </div>
    </motion.div>
  </div>
);

const NameEntryForm = () => {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const send = GameContext.useSend();

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
    send({ 
      type: "JOIN_GAME",
      playerName: name.trim(),
    });
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

const QuestionResultsDisplay = ({
  player,
  questions,
  questionResults,
}: {
  player: Player;
  questions: GamePublicContext['questions'];
  questionResults: GamePublicContext['questionResults'];
}) => {
  const latestResult = questionResults[questionResults.length - 1];
  const question = latestResult ? questions[latestResult.questionId] : null;
  
  if (!latestResult || !question) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
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
      <div className="relative z-10 w-full max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {/* Question & Answer */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-6">
              {question.text}
            </h1>
            <div className="text-4xl font-bold text-green-400" data-testid="correct-answer">
              {question.correctAnswer}
            </div>
          </div>

          {/* Results List */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <h2 className="text-2xl font-bold text-indigo-300 mb-6">Results</h2>
            <div className="space-y-4">
              {latestResult.scores.map((score) => {
                const answer = latestResult.answers.find(a => a.playerId === score.playerId);
                if (!answer) return null;

                const isCurrentPlayer = score.playerId === player.id;
                const isExact = answer.value === question.correctAnswer;

                return (
                  <motion.div
                    key={score.playerId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    data-testid={`player-result-${score.playerId}`}
                    className={`bg-gray-900/50 rounded-xl p-4 flex justify-between items-center border ${
                      isCurrentPlayer ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-indigo-400">
                        #{score.position}
                      </div>
                      <div>
                        <div className="text-xl font-medium text-white/90">
                          {score.playerName}
                        </div>
                        <div className="text-sm text-white/60 flex items-center gap-2">
                          <span className={`font-medium ${isExact ? 'text-green-400' : 'text-white/90'}`}>
                            {answer.value}
                          </span>
                          • {score.timeTaken.toFixed(1)}s
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-indigo-400">
                      {score.points} points
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
