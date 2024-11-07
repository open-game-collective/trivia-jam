export function PlayerList({ 
  players 
}: { 
  players: Array<{ id: string; name: string }> 
}) {
  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl mb-4">Players</h2>
      <div className="grid grid-cols-2 gap-4">
        {players.map(player => (
          <div 
            key={player.id}
            className="bg-gray-800 p-3 rounded-lg"
          >
            {player.name}
          </div>
        ))}
      </div>
    </div>
  );
} 