import { catchError } from "@jonmumm/utils/catchError";
import { useStore } from "@nanostores/react";

import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import {
  json,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from "@remix-run/react";
import { AnimatePresence, motion } from "framer-motion";
import { Dice1, HelpCircle, Plus } from "lucide-react";
import { atom } from "nanostores";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { SessionContext } from "~/session.context";
import { getDeviceType } from "~/utils/deviceType";

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

  return (
    <HomePageContent
      newGameId={gameId}
      $showHelp={$showHelp}
    />
  );
}

type HomePageContentProps = {
  newGameId: string;
  $showHelp: ReturnType<typeof atom<boolean>>;
};

function HomePageContent({
  newGameId,
  $showHelp,
}: HomePageContentProps) {
  const { deviceType, host } = useLoaderData<LoaderData>();
  const isMobile = deviceType === "mobile";
  const showHelp = useStore($showHelp);

  const HelpModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={() => $showHelp.set(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full mx-4 border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-white">How to Play</h2>
        <div className="space-y-4 text-white/80">
          <div>
            <h3 className="font-semibold mb-2">Joining a Game</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Get a game code from the host</li>
              <li>Enter the code and join the game</li>
              <li>Wait for the host to start</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Hosting a Game</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click &quot;Create New Game&quot;</li>
              <li>Share the game code with players</li>
              <li>Start when everyone has joined</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">During the Game</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Be first to buzz in with the correct answer</li>
              <li>Score points for correct answers</li>
              <li>The player with the most points wins!</li>
            </ul>
          </div>
        </div>
        <button
          onClick={() => $showHelp.set(false)}
          className="mt-6 w-full bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-xl transition duration-300"
        >
          Got it!
        </button>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
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

        {isMobile ? (
          // Mobile view - show only create game option
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
        ) : (
          // Desktop view - show TV mode message
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 text-center">
            <h2 className="text-2xl font-semibold text-indigo-300 mb-4">
              TV/Display Mode
            </h2>
            <p className="text-white/80 mb-4">
              This device will act as the game display. To play or host a game,
              please use a mobile device.
            </p>

            <div className="flex flex-col items-center justify-center space-y-6 p-4">
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG
                  value={`https://${host}`}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
              <p className="text-white/80 text-sm">
                Scan this QR code to open Trivia Jam on your phone
              </p>
              <div className="flex items-center justify-center space-x-2 text-white/60 text-sm">
                <span>or visit</span>
                <a
                  href={`https://${host}`}
                  className="text-indigo-400 hover:text-indigo-300 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  triviajam.tv
                </a>
              </div>
            </div>
          </div>
        )}

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

      <AnimatePresence>{showHelp && <HelpModal />}</AnimatePresence>
    </div>
  );
}
