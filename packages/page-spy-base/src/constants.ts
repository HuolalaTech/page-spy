export const ROOM_SESSION_KEY = 'page-spy-room';

/** Defaults for Atom's FIFO object-reference store. */
export const ATOM_CONFIG = {
  MAX_STORE_SIZE: 5000,
} as const;

/** Timings used by SocketStoreBase's heartbeat and reconnect strategy. */
export const SOCKET_CONFIG = {
  // Send a ping after this period without receiving a message or pong.
  HEARTBEAT_INTERVAL_MS: 5000,
  // Delay before the first reconnect attempt.
  INITIAL_RETRY_INTERVAL_MS: 2000,
  // Exponential-backoff factor applied after each reconnect attempt.
  RETRY_INTERVAL_MULTIPLIER: 1.5,
  // Maximum exponent applied to the initial reconnect delay.
  MAX_RETRY_ATTEMPTS: 4,
} as const;
