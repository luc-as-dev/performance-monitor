import { Server, Socket } from "socket.io";

export default function socketMain(io: Server, socket: Socket) {
  console.log(`Socket connected: ${socket.id}`);
}
