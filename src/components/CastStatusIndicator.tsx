import React from 'react';
import { CastContext } from '~/bridge/client'; // Assuming ~ maps to app/
import { CastState } from '~/bridge/types';
import { Cast, Loader2 } from 'lucide-react';

export function CastStatusIndicator() {
  // Use selectors to get specific state slices
  const castState = CastContext.useSelector((state) => state.castState);
  const devicesAvailable = CastContext.useSelector((state) => state.devicesAvailable);
  const sessionState = CastContext.useSelector((state) => state.sessionState);

  const getStatusDetails = () => {
    if (sessionState === 'CONNECTED') {
      return {
        text: 'Connected to Cast Device',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20',
        textColor: 'text-green-400',
        icon: <Cast className="w-4 h-4" />
      };
    }

    if (sessionState === 'CONNECTING' || castState === CastState.CONNECTING) {
      return {
        text: 'Connecting to Cast...',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/20',
        textColor: 'text-yellow-400',
        icon: <Loader2 className="w-4 h-4 animate-spin" />
      };
    }

    if (devicesAvailable || castState === CastState.NOT_CONNECTED) {
      return {
        text: 'Cast Available',
        bgColor: 'bg-indigo-500/10',
        borderColor: 'border-indigo-500/20',
        textColor: 'text-indigo-400',
        icon: <Cast className="w-4 h-4" />
      };
    }

    return null;
  };

  const status = getStatusDetails();

  if (!status) return null;

  return (
    <div 
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full
        ${status.bgColor} ${status.borderColor} border
        ${status.textColor} font-medium text-sm
        shadow-sm
        transition-all duration-200 ease-in-out
      `}
    >
      {status.icon}
      <span>{status.text}</span>
    </div>
  );
}

// Optional: Add some basic styles if needed, or use Tailwind classes
/*
.cast-indicator {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
}
.connecting {
  background-color: #f0f0f0;
}
.connected {
  background-color: #e0f0ff;
}
.available {
  background-color: #e0ffe0;
}
*/ 