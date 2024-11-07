import { GameCode } from "./GameCode";
import { PlayerList } from "./PlayerList";

export function LobbyBoard({ 
  gameCode, 
  players,
  status
}: { 
  gameCode: string;
  players: Array<{ id: string; name: string }>;
  status: "waiting" | "starting";
}) {
  return (
    <div className="container mx-auto p-8 text-center">
      <h1 className="text-4xl mb-8">Trivia Jam</h1>
      <GameCode code={gameCode} />
      <PlayerList players={players} />
      <div className="mt-8 text-xl">
        {status === "waiting" 
          ? "Waiting for host to start the game..." 
          : "Game starting..."}
      </div>
    </div>
  );
} 