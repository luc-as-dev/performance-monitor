import { config } from "dotenv";
import express from "express";
import cluster, { Worker } from "cluster";
import { cpus } from "os";
import { createAdapter } from "@socket.io/redis-adapter";
import { fingerprint32 } from "farmhash";
import { createServer as createNetServer, Socket as netSocket } from "net";
import { Server, Socket as ioSocket } from "socket.io";
import { createClient } from "redis";

config();

import socketMain from "./socketMain";

const PORT = +process.env.PORT || 3000;
const REDIS_PORT = +process.env.REDIS_PORT || 6373;
const MAX_WORKERS = +process.env.MAX_WORKERS || undefined;

const num_processes =
  MAX_WORKERS && MAX_WORKERS < cpus().length ? MAX_WORKERS : cpus().length;

if (cluster.isPrimary) {
  const workers: Worker[] = [];

  const spawn = function (i: number) {
    workers[i] = cluster.fork();

    workers[i].on("exit", function () {
      console.log("Respawning worker", i);
      spawn(i);
    });
  };

  for (let i = 0; i < num_processes; i++) {
    spawn(i);
  }

  const worker_index = function (ip: string, len: number) {
    return fingerprint32(ip) % len;
  };

  const server = createNetServer(
    { pauseOnConnect: true },
    (connection: netSocket) => {
      const worker =
        workers[worker_index(connection.remoteAddress, num_processes)];
      worker.send("sticky-session:connection", connection);
    }
  );

  server.listen(PORT);
  console.log(`|-   Master listening on port ${PORT}`);
} else {
  const app = express();

  const server = app.listen(0, "localhost");
  const io = new Server(server, { cors: { origin: "*" } });
  console.log(`|--  Worker [${cluster.worker.id}] listening...`);

  const pubClient = createClient({ url: `redis://localhost:${REDIS_PORT}` });
  const subClient = pubClient.duplicate();

  io.adapter(createAdapter(pubClient, subClient));

  io.on("connection", function (socket: ioSocket) {
    socketMain(io, socket);
    console.log(`to worker [${cluster.worker.id}]`);
  });

  process.on("message", function (message, connection: netSocket) {
    if (message !== "sticky-session:connection") {
      return;
    }

    server.emit("connection", connection);
    connection.resume();
  });
}
