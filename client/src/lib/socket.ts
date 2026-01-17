import { io, Socket } from "socket.io-client";

// Server URL: local dev 預設 3001。部署時可改成環境變數。
const SERVER_URL = import.meta.env.VITE_GAME_SERVER_URL || "http://localhost:3001";

export const socket: Socket = io(SERVER_URL, {
  transports: ["websocket"],
  autoConnect: true,
});
