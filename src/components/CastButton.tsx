import React from 'react';
import { CastContext } from '~/bridge/client';
import { CastState } from '~/bridge/types';
import { Cast, Loader2 } from 'lucide-react';

export function CastButton() {
  const store = CastContext.useStore();
  const castState = CastContext.useSelector((state) => state.castState);
  const devicesAvailable = CastContext.useSelector((state) => state.devicesAvailable);
  const sessionState = CastContext.useSelector((state) => state.sessionState);

  const handleClick = () => {
    if (sessionState === 'CONNECTED') {
      store.dispatch({ type: 'SESSION_ENDED' });
    } else if (devicesAvailable) {
      store.dispatch({ type: 'SHOW_CAST_PICKER' });
    }
  };

  // Determine button appearance and action based on state
  let IconComponent = Cast;
  let buttonClass = "inline-flex items-center gap-2 p-2 rounded-lg transition-all duration-200";
  let title = "Cast not available";
  let isDisabled = true;
  let statusText = null;

  if (sessionState === 'CONNECTED') {
    buttonClass = "inline-flex items-center gap-2 p-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-all duration-200";
    title = "Connected to Cast - Click to disconnect";
    statusText = "Connected";
    isDisabled = false;
  } else if (castState === CastState.CONNECTING) {
    IconComponent = Loader2;
    buttonClass = "inline-flex items-center gap-2 p-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 animate-pulse transition-all duration-200";
    title = "Connecting to Cast device...";
    statusText = "Connecting";
    isDisabled = true;
  } else if (devicesAvailable) {
    buttonClass = "inline-flex items-center gap-2 p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/30 transition-all duration-200";
    title = "Cast to device";
    statusText = "Available";
    isDisabled = false;
  } else {
    buttonClass = "inline-flex items-center gap-2 p-2 rounded-lg bg-gray-900/30 border border-gray-700/30 text-gray-600 cursor-not-allowed transition-all duration-200";
    title = "No Cast devices found";
    isDisabled = true;
  }

  // Don't render if bridge isn't supported
  if (castState === CastState.NO_DEVICES_AVAILABLE) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={buttonClass}
      title={title}
      aria-label={title}
    >
      <IconComponent className={`w-5 h-5 ${IconComponent === Loader2 ? 'animate-spin' : ''}`} />
      {statusText && <span className="text-sm font-medium">{statusText}</span>}
    </button>
  );
}

// Note: Added Loader2 assumption, might need import if not already available
// import { Loader2 } from 'lucide-react'; 