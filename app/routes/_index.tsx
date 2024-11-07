import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json, Link, useLoaderData, useNavigate } from "@remix-run/react";
import { useCallback } from "react";
import { SessionContext } from "~/session.context";

export const meta: MetaFunction = () => {
  return [
    { title: "Trivia Jam" },
    {
      name: "description",
      content: "Trivia Jam is a trivia game for parties.",
    },
  ];
};

export const loader = async (args: LoaderFunctionArgs) => {
  const gameId = crypto.randomUUID();
  return json({ gameId });
};

export default function Homepage() {
  const { gameId } = useLoaderData<typeof loader>();
  const sendSession = SessionContext.useSend();
  const navigate = useNavigate();
  const gameIds = SessionContext.useSelector((state) => state.private.gameIds);

  const handleNewList = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      sendSession({ type: "START_GAME", gameId });
      navigate(`/games/${gameId}`);
    },
    [sendSession, gameId, navigate]
  );

  return (
    <div>
      <h1>Your Games</h1>
      {gameIds.length > 0 ? (
        <ul>
          {gameIds.map((id) => (
            <li key={id}>
              <Link to={`/games/${id}`}>Game {id.slice(0, 8)}</Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>You don't have any ongoing games.</p>
      )}
      <Link to={`/games/${gameId}`} onClick={handleNewList}>
        <button className="btn btn-primary">New Game</button>
      </Link>
    </div>
  );
}
