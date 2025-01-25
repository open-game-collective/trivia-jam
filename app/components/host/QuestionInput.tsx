import { useState } from "react";
import { GameContext } from "~/game.context";
import type { QuestionResult } from "~/game.types";

export function QuestionInput() {
  const [questionText, setQuestionText] = useState("");
  const [answerValue, setAnswerValue] = useState<number | "">("");
  
  const questionResults = GameContext.useSelector(state => state.public.questionResults);
  const questions = GameContext.useSelector(state => state.public.questions);
  const lastQuestionResult = questionResults[questionResults.length - 1];
  const currentQuestion = GameContext.useSelector(state => state.public.currentQuestion);
  const send = GameContext.useSend();

  // Don't show previous results if we're actively collecting answers
  if (currentQuestion) {
    return null;
  }

  const handleSubmit = () => {
    if (questionText && answerValue !== "") {
      send({
        type: "SUBMIT_QUESTION",
        text: questionText,
        correctAnswer: Number(answerValue),
        requireExactAnswer: false
      });
      setQuestionText("");
      setAnswerValue("");
    }
  };

  return (
    <div className="p-4">
      {lastQuestionResult && (
        <div className="mb-8">
          <div className="bg-gray-800/50 rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">
              {questions[lastQuestionResult.questionId].text}
            </h2>
            
            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="text-sm text-gray-400 mb-1">Correct Answer</div>
                <div className="text-2xl text-green-400">
                  {questions[lastQuestionResult.questionId].correctAnswer}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Answer Type</div>
                <div className="text-lg text-blue-400">
                  {questions[lastQuestionResult.questionId].requireExactAnswer ? 'Exact Answer' : 'Closest Answer'}
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-400 mb-2">
                Answers Submitted: {lastQuestionResult.answers.length}
              </div>
              <div className="space-y-2">
                {lastQuestionResult.answers
                  .sort((a, b) => a.timestamp - b.timestamp)
                  .map(answer => {
                    const score = lastQuestionResult.scores.find(s => s.playerId === answer.playerId);
                    const isExact = answer.value === questions[lastQuestionResult.questionId].correctAnswer;
                    
                    return (
                      <div 
                        key={answer.playerId}
                        className={`flex justify-between items-center p-4 rounded-xl ${
                          isExact ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-900/50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="font-medium">{answer.playerName}</div>
                          <div className="text-gray-400">{answer.value}</div>
                        </div>
                        <div className="text-gray-400">{score?.timeTaken.toFixed(1)}s</div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          <h3 className="text-xl mb-4">Next Question</h3>
          <textarea 
            className="w-full p-2 rounded bg-gray-800"
            placeholder="Enter your question..."
            value={questionText}
            onChange={e => setQuestionText(e.target.value)}
          />
          <div className="mt-4">
            <input
              type="number"
              className="w-full p-2 rounded bg-gray-800"
              placeholder="Correct answer"
              value={answerValue}
              onChange={e => setAnswerValue(Number(e.target.value))}
            />
          </div>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 rounded"
            onClick={handleSubmit}
          >
            Submit Question
          </button>
        </div>
      )}
    </div>
  );
} 