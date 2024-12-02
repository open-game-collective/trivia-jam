import { motion, AnimatePresence } from "framer-motion";
import { Users, Crown, X } from "lucide-react";
import { GameContext } from "~/game.context";
import { forwardRef } from "react";

interface PlayerSlotProps {
  playerId?: string;
  onRemove?: (playerId: string) => void;
  showScores?: boolean;
}

const PlayerSlot = forwardRef<HTMLDivElement, PlayerSlotProps>(
  ({ playerId, onRemove, showScores }, ref) => {
    const gameState = GameContext.useSelector(state => state.public);
    const player = playerId ? gameState.players.find(p => p.id === playerId) : undefined;
    const isHost = player?.id === gameState.hostId;
    const hasPaid = player && (isHost || gameState.paidPlayers.includes(player.id));

    if (!player) {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center p-3 rounded-xl bg-gray-800/10 border border-gray-700/20"
        >
          <span className="text-white/30 font-medium">Empty Slot</span>
        </motion.div>
      );
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex items-center justify-between p-4 rounded-xl ${
          hasPaid
            ? "bg-green-500/10 border border-green-500/20"
            : "bg-gray-800/30 border border-gray-700/30"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            {isHost ? (
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <Crown className="w-6 h-6 text-indigo-400" />
              </div>
            ) : (
              <div className={`w-12 h-12 rounded-full ${
                hasPaid 
                  ? "bg-green-500/20 border border-green-500/30"
                  : "bg-gray-700/30 border border-gray-700/50"
              } flex items-center justify-center`}>
                <div className="relative">
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    className="w-6 h-6 text-gray-400"
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="8" r="5" />
                    <path d="M3 21v-2a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v2" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-lg font-medium">
              {isHost ? "Host" : player.name}
            </span>
            <span className={`text-sm ${
              isHost 
                ? "text-indigo-400"
                : hasPaid 
                  ? "text-green-400"
                  : "text-gray-400"
            }`}>
              {isHost 
                ? "Game Master" 
                : hasPaid 
                  ? "Ready to Play"
                  : "Needs Entry Tokens"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {showScores && (
            <motion.div
              key={`score-${player.score}`}
              initial={{ scale: 1.2, color: '#34D399' }}
              animate={{ scale: 1, color: '#818CF8' }}
              className="bg-indigo-500/20 px-4 py-2 rounded-full border border-indigo-500/30"
            >
              <span className="text-lg font-bold text-indigo-400">{player.score}</span>
            </motion.div>
          )}
          {onRemove && !isHost && (
            <motion.button
              onClick={() => onRemove(player.id)}
              className="p-2.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              data-testid={`remove-player-${player.id}`}
            >
              <X className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }
);

PlayerSlot.displayName = "PlayerSlot";

interface PlayerListProps {
  onRemovePlayer?: (playerId: string) => void;
  showScores?: boolean;
}

export const PlayerList = ({
  onRemovePlayer,
  showScores = false,
}: PlayerListProps) => {
  const { players, settings } = GameContext.useSelector(state => ({
    players: state.public.players,
    settings: state.public.settings,
  }));

  const slots = Array(settings.maxPlayers)
    .fill(undefined)
    .map((_, i) => players[i]?.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-700/50"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-indigo-300 flex items-center gap-2">
          <Users className="w-5 h-5" /> Players
        </h2>
        <span className="text-indigo-300/70 font-medium">
          {players.length}/{settings.maxPlayers}
        </span>
      </div>
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {slots.map((playerId, index) => (
            <PlayerSlot
              key={playerId || `empty-${index}`}
              playerId={playerId}
              onRemove={onRemovePlayer}
              showScores={showScores}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}; 