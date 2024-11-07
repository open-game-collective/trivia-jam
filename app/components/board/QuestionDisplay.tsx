export function QuestionBoard({
  question,
  buzzerQueue,
  players
}: {
  question: { text: string; isVisible: boolean } | null;
  buzzerQueue: string[];
  players: Array<{ id: string; name: string; score: number }>;
}) {
  if (!question) {
    return <div>Waiting for question...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      {question.isVisible ? (
        <div className="text-4xl mb-8">{question.text}</div>
      ) : (
        <div>Question hidden</div>
      )}
      
      <div className="grid grid-cols-2">
        <div>
          <h3>Buzzer Queue</h3>
          {buzzerQueue.map((playerId) => {
            const player = players.find(p => p.id === playerId);
            return (
              <div key={playerId}>
                {player?.name}
              </div>
            );
          })}
        </div>
        
        <div>
          <h3>Scores</h3>
          {players.map((player) => (
            <div key={player.id}>
              {player.name}: {player.score}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 