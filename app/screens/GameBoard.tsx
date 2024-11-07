// import { QuestionBoard } from "~/components/board/game/QuestionBoard";
import { LobbyBoard } from "~/components/board/lobby/LobbyBoard";
import { GameContext } from "~/contexts/game.context";
// import { ResultsBoard } from "~/components/board/results/ResultsBoard";

export function GameBoard({ gameId }: { gameId: string }) {
  const state = GameContext.useSelector((state) => state);

  const isLobby = GameContext.useMatches("lobby");
  const isActive = GameContext.useMatches("active");
  const isFinished = GameContext.useMatches("finished");

  if (isLobby) {
    return (
      <LobbyBoard
        gameCode={state.public.id}
        players={state.public.players}
        status="waiting"
      />
    );
  }

  if (isActive) {
    return (
      <></>
      // <QuestionBoard
      //   question={state.context.public.currentQuestion}
      //   buzzerQueue={state.context.public.buzzerQueue}
      //   players={state.context.public.players}
      // />
    );
  }

  if (isFinished) {
    return (
      <></>
      // <ResultsBoard
      //   players={state.context.public.players}
      //   winner={state.context.public.winner}
      // />
    );
  }

  return null;
}
