import { Server, Socket } from "socket.io";

const CLIENT_KEY = process.env.CLIENT_KEY || "NOTsafe";
const UI_CLIENT_KEY = process.env.UI_CLIENT_KEY || "NOTsafeUI";

export default function socketMain(io: Server, socket: Socket) {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("client-auth", (key: string) => {
    if (key === CLIENT_KEY) socket.join("clients");
    else if (key === UI_CLIENT_KEY) socket.join("ui-clients");
    else socket.disconnect();
  });

  socket.on("performance-data", (data) => {
    console.log(data);
  });
}
