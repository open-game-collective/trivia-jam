// Using string literals for cast states as web doesn't have react-native-google-cast types
interface CastKitState {
  // Connection & Device Discovery
  castState: CastState;
  devicesAvailable: boolean;

  // Session Management
  sessionState?: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
}

export enum CastState {
  /** No cast devices are available. */
  NO_DEVICES_AVAILABLE = "noDevicesAvailable",
  /** Cast devices are available, but a cast session is not established. */
  NOT_CONNECTED = "notConnected",
  /** Cast session is being established. */
  CONNECTING = "connecting",
  /** Cast session is established. */
  CONNECTED = "connected"
}

// Events can be dispatched from Native -> Web OR Web -> Native
type CastKitEvents =
  | { type: "CAST_STATE_CHANGED"; payload: CastState }
  | { type: "DEVICES_DISCOVERED"; payload: boolean }
  | { type: "SESSION_STARTED" }
  | { type: "SESSION_ENDED" }
  | { type: "SESSION_RESUMED" }
  | { type: 'SHOW_CAST_PICKER' };

// Define AppStores type
export type AppStores = {
  castKit: {
    state: CastKitState;
    events: CastKitEvents;
  };
}; 