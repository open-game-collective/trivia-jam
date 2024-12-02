import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export const ShareGameLink = ({ host, gameId }: { host: string; gameId: string }) => {
  const [copied, setCopied] = useState(false);
  const gameUrl = `https://${host}/games/${gameId}`;

  const copyGameLink = async () => {
    await navigator.clipboard.writeText(gameUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareGameLink = async () => {
    try {
      await navigator.share({
        title: 'Join my Trivia Jam game!',
        text: 'Click to join my Trivia Jam game!',
        url: gameUrl
      });
    } catch (err) {
      // Fallback to copy if share fails
      copyGameLink();
    }
  };

  return (
    <div className="space-y-3">
      <motion.button
        onClick={copyGameLink}
        className="w-full relative group"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        data-testid="game-link-button"
      >
        <div className="absolute inset-0 bg-indigo-500/20 rounded-xl blur-xl group-hover:bg-indigo-500/30 transition-all" />
        <div className="relative bg-gray-800/50 backdrop-blur-sm border border-indigo-500/30 rounded-xl p-4 sm:p-6 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className="text-sm sm:text-lg font-medium tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 truncate block">
              {gameUrl}
            </span>
          </div>
          <div className="flex-shrink-0">
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-green-400"
                  data-testid="copy-success-icon"
                >
                  <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-indigo-400 group-hover:text-indigo-300 transition-colors"
                  data-testid="copy-icon"
                >
                  <Copy className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.button>

      <motion.button
        onClick={shareGameLink}
        className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-xl p-4 sm:p-6 flex items-center justify-center gap-2 transition-colors"
      >
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92zM18 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 7.02c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
        </svg>
        Share Game
      </motion.button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center mt-2 text-indigo-300/60 text-sm"
      >
        Click to copy or share game link
      </motion.div>
    </div>
  );
}; 