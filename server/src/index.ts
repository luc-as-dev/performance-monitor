import { config } from "dotenv";
import express from "express";
import { Server, Socket as ioSocket } from "socket.io";

config();

import socketMain from "./socketMain";

const PORT = +process.env.PORT || 3000;

const app = express();

const server = app.listen(PORT, () => {
  console.log(`Server Listening on port ${PORT}`);
});

const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", function (socket: ioSocket) {
  socketMain(io, socket);
});
