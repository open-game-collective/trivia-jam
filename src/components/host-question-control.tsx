import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Check, X, ChevronRight, Users } from 'lucide-react'
import { GameContext } from '../game.context'

export function HostQuestionControl() {
  const [question, setQuestion] = useState('')
  const [isQuestionVisible, setIsQuestionVisible] = useState(false)
  const gameState = GameContext.useSelector((state) => state.public);
  const sendGameEvent = GameContext.useSend();

  const toggleQuestionVisibility = () => {
    setIsQuestionVisible(!isQuestionVisible)
    sendGameEvent({ type: "SHOW_QUESTION" });
  }

  const markAnswer = (isCorrect: boolean) => {
    if (gameState.buzzerQueue.length > 0) {
      const playerId = gameState.buzzerQueue[0];
      sendGameEvent({
        type: "VALIDATE_ANSWER",
        playerId,
        correct: isCorrect,
      });
    }
  };

  const handleNextQuestion = () => {
    if (question.trim()) {
      sendGameEvent({ 
        type: "SUBMIT_QUESTION", 
        question: question.trim() 
      });
      setQuestion('');
    }
  };

  // Get player names for the buzzer queue
  const buzzerQueueWithNames = gameState.buzzerQueue.map(playerId => {
    const player = gameState.players.find(p => p.id === playerId);
    return player?.name || playerId;
  });

  return (
    <div className="p-4 mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">Host Question Control</h1>

      {/* Question Input */}
      <div className="mb-4">
        <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
          Question
        </label>
        <textarea
          id="question"
          rows={3}
          className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter the question here..."
          aria-label="Question"
        />
      </div>

      {/* Show/Hide Question Toggle */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium text-gray-700">Question Visibility</span>
        <button
          onClick={toggleQuestionVisibility}
          className={`flex items-center px-4 py-2 rounded-full ${
            isQuestionVisible ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
          }`}
        >
          {isQuestionVisible ? (
            <>
              <Eye size={20} className="mr-2" /> Visible
            </>
          ) : (
            <>
              <EyeOff size={20} className="mr-2" /> Hidden
            </>
          )}
        </button>
      </div>

      {/* Buzzer Queue */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2 flex items-center">
          <Users size={20} className="mr-2" /> Buzzer Queue
        </h2>
        <ul className="bg-white rounded-lg shadow-md overflow-hidden">
          <AnimatePresence>
            {buzzerQueueWithNames.map((playerName, index) => (
              <motion.li
                key={gameState.buzzerQueue[index]}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`px-4 py-2 border-b last:border-b-0 ${
                  index === 0 ? 'bg-blue-100' : ''
                }`}
              >
                {index + 1}. {playerName}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>

      {/* Answer Buttons */}
      {gameState.buzzerQueue.length > 0 && (
        <div className="flex justify-between mb-4">
          <button
            onClick={() => markAnswer(true)}
            className="flex-1 mr-2 bg-green-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-green-600 transition duration-300 flex items-center justify-center"
            aria-label="Mark Answer Correct"
          >
            <Check size={20} className="mr-2" /> Correct
          </button>
          <button
            onClick={() => markAnswer(false)}
            className="flex-1 ml-2 bg-red-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-red-600 transition duration-300 flex items-center justify-center"
            aria-label="Mark Answer Incorrect"
          >
            <X size={20} className="mr-2" /> Incorrect
          </button>
        </div>
      )}

      {/* Next Question Button */}
      <button
        onClick={handleNextQuestion}
        className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-600 transition duration-300 flex items-center justify-center"
      >
        <ChevronRight size={24} className="mr-2" /> Next Question
      </button>
    </div>
  )
}