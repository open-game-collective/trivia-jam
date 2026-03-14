import { SessionContext } from "~/session.context";
import { GameContext } from "../game.context";

export function PlayerView({ gameId }: { gameId: string }) {
  const userId = SessionContext.useSelector((state) => state.public.userId);
  const hostId = GameContext.useSelector((state) => state.public.hostId);
  const isLobby = GameContext.useMatches("lobby");
  const isHost = hostId === userId;

  if (isHost) {
    return <>host</>;
    // return <HostControls game={game} />;
  }

  //   const player = state.context.public.players.find(
  //     (p) => p.id === session.state.context.public.userId
  //   );

  //   if (!player) {
  //     return <JoinGame game={game} />;
  //   }

  if (isLobby) {
    return <div className="p-4">Waiting for host to start the game...</div>;
  }

  // <PlayerGame
  //   canBuzz={state.context.public.currentQuestion?.isVisible}
  //   onBuzz={() => game.send({ type: "BUZZ_IN" })}
  //   score={player.score}
  //   question={state.context.public.currentQuestion?.text ?? null}
  // />
  // <PlayerResults
  //   score={player.score}
  //   isWinner={state.context.public.winner === player.id}
  // />
}
