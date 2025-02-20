import { useStore } from '@nanostores/react';
import { AnimatePresence, motion } from "framer-motion";
import { HelpCircle, Play, Settings, X } from "lucide-react";
import { useState } from "react";
import { GameContext } from "../game.context";
import { SessionContext } from "../session.context";
import { $showHelp, closeHelp, openHelp } from './host-control.stores';

export function HostControl() {
  const gameState = GameContext.useSelector((state) => state.public);
  const sessionState = SessionContext.useSelector((state) => state.public);
  const sendGameEvent = GameContext.useSend();

  // Check if the current session user is the host
  const isHost = sessionState.userId === gameState.hostId;

  if (!isHost) {
    return <></>; // Render nothing if the user is not the host
  }

  // const removePlayer = (playerToRemove: string) => {
  //   sendGameEvent({ type: "SHOW_QUESTION" });
  // };

  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const showHelp = useStore($showHelp);

  const SettingsModal = () => {
    const [maxPlayers, setMaxPlayers] = useState(
      gameState.settings?.maxPlayers || 30
    );
    const [questionCount, setQuestionCount] = useState(
      gameState.settings?.questionCount || 10
    );

    const handleSave = () => {
      sendGameEvent({
        type: "UPDATE_SETTINGS",
        settings: {
          maxPlayers,
          questionCount,
        },
      });
      setShowSettingsModal(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div
          role="dialog"
          aria-labelledby="settings-title"
          className="bg-white p-6 rounded-lg max-w-md w-full"
        >
          <h2 id="settings-title" className="text-xl font-bold mb-4">
            Game Settings
          </h2>

          <div className="mb-4">
            <label
              htmlFor="maxPlayers"
              className="block text-sm font-medium mb-1"
            >
              Max Players (2-20)
            </label>
            <input
              id="maxPlayers"
              type="number"
              min="2"
              max="20"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="w-full p-2 border rounded"
              aria-label="Max Players"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="questionCount"
              className="block text-sm font-medium mb-1"
            >
              Number of Questions (1-50)
            </label>
            <input
              id="questionCount"
              type="number"
              min="1"
              max="50"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full p-2 border rounded"
              aria-label="Number of Questions"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    );
  };

  const HelpModal = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Host Controls Help</h2>

          <div className="space-y-4">
            <section>
              <h3 className="font-semibold text-lg mb-2">Game Settings</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Max Players:</strong> Set the maximum number of
                  players (2-20) that can join your game.
                </li>
                <li>
                  <strong>Question Count:</strong> Set how many questions will
                  be in the game (1-50).
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">Player Management</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Players can join using your game code displayed at the top.
                </li>
                <li>
                  Remove players by clicking the X button next to their name.
                </li>
                <li>Empty slots show how many more players can join.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">Game Controls</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Use the Start Game button to begin once players have joined.
                </li>
                <li>
                  During the game, you'll control question visibility and
                  validate answers.
                </li>
                <li>
                  The game ends automatically after the set number of questions.
                </li>
              </ul>
            </section>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={closeHelp}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Close Help
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Create array of empty slots up to maxPlayers
  const emptySlots = Array(
    gameState.settings.maxPlayers - gameState.players.length
  ).fill(null);

  return (
    <div className="p-4 mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">
        Host Control Panel
      </h1>

      {/* Game Code Display */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Game Code</h2>
        <div className="text-3xl font-bold text-center p-2 bg-blue-100 rounded">
          {gameState.id}
        </div>
      </div>

      {/* Player List */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">
          Players ({gameState.players.length}/{gameState.settings.maxPlayers})
        </h2>
        <ul className="space-y-2">
          <AnimatePresence>
            {gameState.players.map((player) => (
              <motion.li
                key={player.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex justify-between items-center bg-gray-50 p-2 rounded"
              >
                <span>{player.name}</span>
                <button
                  // onClick={() => removePlayer(player.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={20} />
                </button>
              </motion.li>
            ))}
            {/* Empty slots */}
            {emptySlots.map((_, index) => (
              <motion.li
                key={`empty-${index}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex justify-between items-center bg-gray-50 p-2 rounded border-2 border-dashed border-gray-200"
              >
                <span className="text-gray-400">Empty Slot</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>

      {/* Start Game Button */}
      <button
        onClick={() => sendGameEvent({ type: "START_GAME" })}
        className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-green-600 transition duration-300 mb-6 flex items-center justify-center"
      >
        <Play size={24} className="mr-2" />
        Start Game
      </button>

      {/* Settings and Help Buttons */}
      <div className="flex gap-4 mb-6 w-full">
        <button
          onClick={() => setShowSettingsModal(true)}
          className="flex-1 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-600 transition duration-300 flex items-center justify-center"
        >
          <Settings size={20} className="mr-2" />
          Settings
        </button>
        <button
          onClick={openHelp}
          className="flex-1 bg-purple-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-purple-600 transition duration-300 flex items-center justify-center"
        >
          <HelpCircle size={20} className="mr-2" />
          Help
        </button>
      </div>

      {/* Add settings modal */}
      {showSettingsModal && <SettingsModal />}
      {showHelp && <HelpModal />}
    </div>
  );
}
