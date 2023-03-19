import { config } from "dotenv";
import express from "express";
import cluster, { Worker } from "cluster";
import { cpus } from "os";
import { createAdapter } from "@socket.io/redis-adapter";
import { fingerprint32 } from "farmhash";
import { createServer as createNetServer, Socket as netSocket } from "net";
import { Server, Socket as ioSocket } from "socket.io";
import { createClient } from "redis";
import socketMain from "./socketMain";

config();

const PORT = +process.env.PORT || 8181;
const REDIS_PORT = +process.env.REDIS_PORT || 6373;
const num_processes = cpus().length;

if (cluster.isPrimary) {
  let workers: Worker[] = [];

  let spawn = function (i: number) {
    workers[i] = cluster.fork();

    workers[i].on("exit", function (code, signal) {
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
      let worker =
        workers[worker_index(connection.remoteAddress, num_processes)];
      worker.send("sticky-session:connection", connection);
    }
  );

  server.listen(PORT);
  console.log(`Master listening on port ${PORT}`);
} else {
  const app = express();

  const server = app.listen(0, "localhost");
  const io = new Server(server);
  console.log("Worker listening...");

  const pubClient = createClient({ url: `redis://localhost:${REDIS_PORT}` });
  const subClient = pubClient.duplicate();

  io.adapter(createAdapter(pubClient, subClient));

  io.on("connection", function (socket: ioSocket) {
    socketMain(io, socket);
    console.log(`connected to worker: ${cluster.worker.id}`);
  });

  process.on("message", function (message, connection: netSocket) {
    if (message !== "sticky-session:connection") {
      return;
    }

    server.emit("connection", connection);
    connection.resume();
  });
}
