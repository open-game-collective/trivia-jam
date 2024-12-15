import { useStore } from "@nanostores/react";

import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json, useLoaderData } from "@remix-run/react";
import { AnimatePresence, motion } from "framer-motion";
import { Dice1, HelpCircle, Plus } from "lucide-react";
import { atom } from "nanostores";
import { useState } from "react";
import { getDeviceType } from "~/utils/deviceType";
import { Drawer } from "vaul";

export const meta: MetaFunction = () => {
  return [
    { title: "Trivia Jam" },
    {
      name: "description",
      content: "Trivia Jam is a trivia game for parties.",
    },
  ];
};

// const fetchTodoActor = createActorFetch<TodoMachine>({
//   actorType: "todo",
//   host: context.env.ACTOR_KIT_HOST,
// });

export async function loader({ params, context, request }: LoaderFunctionArgs) {
  const host = context.env.ACTOR_KIT_HOST;
  const gameId = crypto.randomUUID();
  const deviceType = getDeviceType(request.headers.get("user-agent"));
  return json({ gameId, deviceType, host });
}

export type LoaderData = {
  gameId: string;
  deviceType: string;
  host: string;
};

export default function Index() {
  const { gameId } = useLoaderData<LoaderData>();
  const [$showHelp] = useState(() => atom<boolean>(false));

  return <HomePageContent newGameId={gameId} $showHelp={$showHelp} />;
}

type HomePageContentProps = {
  newGameId: string;
  $showHelp: ReturnType<typeof atom<boolean>>;
};

function HomePageContent({ newGameId, $showHelp }: HomePageContentProps) {
  const { deviceType, host } = useLoaderData<LoaderData>();
  const isMobile = deviceType === "mobile";
  const showHelp = useStore($showHelp);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animation - lower z-index */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute inset-0 opacity-20">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>
      </div>

      {/* Main Content - middle z-index */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="flex items-center justify-center mb-8">
          <Dice1 className="w-12 h-12 text-indigo-400 mr-4" />
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Trivia Jam
          </h1>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-indigo-300 mb-4">
            Start a New Game
          </h2>
          <a href={`/games/${newGameId}`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition duration-300 flex items-center justify-center"
            >
              <Plus className="mr-2" size={20} />
              Create New Game
            </motion.button>
          </a>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 text-center"
        >
          <motion.button
            onClick={() => $showHelp.set(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-white/80 hover:text-white transition duration-300 flex items-center justify-center mx-auto"
          >
            <HelpCircle className="mr-2" size={20} />
            How to Play
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Help Modal - highest z-index */}
      <Drawer.Root open={showHelp} onOpenChange={(open) => $showHelp.set(open)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
          <Drawer.Content className="bg-gradient-to-br from-indigo-900/90 to-purple-900/90 flex flex-col fixed bottom-0 left-0 right-0 max-h-[85vh] rounded-t-[10px] border-t border-white/20 z-[100]">
            <div className="p-4 pb-6 flex-1 overflow-y-auto">
              {/* Drawer handle */}
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/20 mb-4" />

              <div className="max-w-xl mx-auto px-2">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                  How to Play
                </h2>

                <div className="space-y-4 text-white/90">
                  <div className="bg-white/10 rounded-xl p-4">
                    <h3 className="text-lg md:text-xl font-semibold mb-2 text-indigo-300">Game Basics</h3>
                    <ul className="space-y-2 list-disc list-inside text-sm md:text-base">
                      <li>Answer numerical trivia questions as quickly as possible</li>
                      <li>All answers must be numbers (years, quantities, measurements, etc.)</li>
                      <li>You have 30 seconds to submit your answer for each question</li>
                      <li>Points are awarded based on accuracy and speed</li>
                    </ul>
                  </div>

                  <div className="bg-white/10 rounded-xl p-4">
                    <h3 className="text-lg md:text-xl font-semibold mb-2 text-indigo-300">Scoring</h3>
                    <ul className="space-y-2 list-disc list-inside text-sm md:text-base">
                      <li>Top 30% of players can earn points each round</li>
                      <li>Exact answers are prioritized over close answers</li>
                      <li>First place: 3 points</li>
                      <li>Second place: 2 points</li>
                      <li>Third place: 1 point</li>
                    </ul>
                  </div>

                  <div className="bg-white/10 rounded-xl p-4">
                    <h3 className="text-lg md:text-xl font-semibold mb-2 text-indigo-300">Quick Tips</h3>
                    <ul className="space-y-2 list-disc list-inside text-sm md:text-base">
                      <li>Balance speed with accuracy - both matter!</li>
                      <li>Watch the timer - answers lock when time runs out</li>
                      <li>Keep an eye on the leaderboard between questions</li>
                    </ul>
                  </div>
                </div>

                <button
                  onClick={() => $showHelp.set(false)}
                  className="mt-6 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl transition duration-300 shadow-lg"
                >
                  Let's Play!
                </button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
