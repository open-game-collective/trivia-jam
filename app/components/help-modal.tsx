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
                <div className="bg-white/10 rounded-xl p-6">
                  <h3 className="text-2xl font-semibold mb-4 text-indigo-300">Question Types</h3>
                  <ul className="space-y-4 text-lg">
                    <li className="flex items-start gap-3">
                      <span className="text-2xl">🔢</span>
                      <span>Numeric questions: Type your answer</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-2xl">📝</span>
                      <span>Multiple choice: Select from options</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-2xl">⏱️</span>
                      <span>25 seconds to answer each question</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white/10 rounded-xl p-6">
                  <h3 className="text-2xl font-semibold mb-4 text-indigo-300">Scoring</h3>
                  <ul className="space-y-4 text-lg">
                    <li className="flex items-start gap-3">
                      <span className="text-2xl">🎯</span>
                      <span>Numeric: Being closer to the answer earns more points</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-2xl">✅</span>
                      <span>Multiple choice: Correct answers earn points</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-2xl">⚡️</span>
                      <span>Faster answers win ties</span>
                    </li>
                  </ul>
                </div>
              </div>

              <button
                onClick={() => $showHelp.set(false)}
                className="mt-8 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-4 rounded-xl transition duration-300 shadow-lg text-xl"
              >
                Got it!
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
} 