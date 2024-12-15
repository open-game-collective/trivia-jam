import { useStore } from "@nanostores/react";
import { atom } from "nanostores";
import { Drawer } from "vaul";

type HelpModalProps = {
  $showHelp: ReturnType<typeof atom<boolean>>;
};

export function HelpModal({ $showHelp }: HelpModalProps) {
  const showHelp = useStore($showHelp);

  return (
    <Drawer.Root open={showHelp} onOpenChange={(open) => $showHelp.set(open)}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Drawer.Content className="bg-gradient-to-br from-indigo-900/90 to-purple-900/90 flex flex-col fixed bottom-0 left-0 right-0 max-h-[96vh] rounded-t-[10px] border-t border-white/20 z-50">
          <div className="p-4 pb-6 flex-1 overflow-y-auto">
            {/* Drawer handle */}
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/20 mb-8" />

            <div className="max-w-xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-white bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                How to Play
              </h2>

              <div className="space-y-6 text-white/90">
                <div className="bg-white/10 rounded-xl p-4">
                  <h3 className="text-xl font-semibold mb-3 text-indigo-300">Game Basics</h3>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Answer numerical trivia questions as quickly as possible</li>
                    <li>All answers must be numbers (years, quantities, measurements, etc.)</li>
                    <li>You have 30 seconds to submit your answer for each question</li>
                    <li>Points are awarded based on accuracy and speed</li>
                  </ul>
                </div>

                <div className="bg-white/10 rounded-xl p-4">
                  <h3 className="text-xl font-semibold mb-3 text-indigo-300">Scoring</h3>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Top 30% of players can earn points each round</li>
                    <li>Exact answers are prioritized over close answers</li>
                    <li>First place: 3 points</li>
                    <li>Second place: 2 points</li>
                    <li>Third place: 1 point</li>
                  </ul>
                </div>

                <div className="bg-white/10 rounded-xl p-4">
                  <h3 className="text-xl font-semibold mb-3 text-indigo-300">Quick Tips</h3>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Balance speed with accuracy - both matter!</li>
                    <li>Watch the timer - answers lock when time runs out</li>
                    <li>Keep an eye on the leaderboard between questions</li>
                  </ul>
                </div>
              </div>

              <button
                onClick={() => $showHelp.set(false)}
                className="mt-8 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl transition duration-300 shadow-lg"
              >
                Let's Play!
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
} 