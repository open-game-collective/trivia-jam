import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/react";
import { Homepage } from "~/components/homepage";

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

export default function Index() {
  return <Homepage />;
}
