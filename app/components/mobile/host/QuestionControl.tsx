export function QuestionControl({
  onSubmitQuestion,
  onShowQuestion,
  onValidateAnswer,
  buzzerQueue,
}: {
  onSubmitQuestion: (question: string) => void;
  onShowQuestion: () => void;
  onValidateAnswer: (playerId: string, correct: boolean) => void;
  buzzerQueue: string[];
}) {
  return (
    <div className="p-4">
      <textarea 
        className="w-full p-2 rounded"
        placeholder="Enter your question..."
        // TODO: Implement question submission
      />
      <div className="mt-4 flex gap-2">
        <button 
          className="bg-primary px-4 py-2 rounded"
          // TODO: Implement show question
        >
          Show Question
        </button>
      </div>
      {/* TODO: Add buzzer queue display and validation controls */}
    </div>
  );
} 