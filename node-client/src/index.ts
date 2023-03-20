import { config } from "dotenv";
import * as os from "os";
import { io } from "socket.io-client";

config();

const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";
const CLIENT_KEY = process.env.CLIENT_KEY || "NOTsafe";
const INTERVAL_MS = +process.env.INTERVAL_MS || 1000;
const DEVICE_NAME = process.env.DEVICE_NAME || "Computer";

const socket = io(SERVER_URL);

socket.on("connect", async () => {
  console.log("Connected to socket server");
  const macAddress = getMacAddress();

  socket.emit("client-auth", CLIENT_KEY);

  socket.emit("init-machine", {
    lastOnline: null,
    deviceName: DEVICE_NAME,
    macAddress,
    performanceData: await getPerformanceData(),
  });

  const performanceDataInterval = setInterval(async () => {
    socket.emit("performance-data", await getPerformanceData());
  }, INTERVAL_MS);

  socket.on("disconnect", () => {
    console.log("Disconnected from socket server");
    clearInterval(performanceDataInterval);
  });
});

function getMacAddress(): string {
  const netI = os.networkInterfaces();

  for (let key in netI) {
    if (!netI[key][0].internal) {
      return netI[key][0].mac;
    }
  }
}

type TimesKeyType = "user" | "nice" | "sys" | "idle" | "irq";
function getCpuAverage(): { idle: number; total: number } {
  const cpus = os.cpus();
  let idleMs = 0;
  let totalMs: number = 0;

  cpus.forEach((core) => {
    Object.keys(core.times).forEach((key: TimesKeyType) => {
      totalMs += core.times[key];
    });
    idleMs += core.times.idle;
  });

  return {
    idle: idleMs / cpus.length,
    total: totalMs / cpus.length,
  };
}

async function getCpuLoad(): Promise<number> {
  return new Promise((resolve, reject) => {
    const start = getCpuAverage();
    setTimeout(() => {
      const end = getCpuAverage();
      const idleDiff = end.idle - start.idle;
      const totalDiff = end.total - start.total;
      const cpuLoad = 100 - Math.floor((idleDiff / totalDiff) * 100);
      resolve(cpuLoad);
    }, 100);
  });
}

async function getPerformanceData() {
  const cpus = os.cpus();

  const freeMem: number = os.freemem();
  const totalMem: number = os.totalmem();
  const usedMem: number = totalMem - freeMem;
  const memUsage: number = Math.floor((usedMem / totalMem) * 100) / 100;
  const osType: string =
    os.type() == "Darwin"
      ? "Mac"
      : os.type() == "Windows_NT"
      ? "Windows"
      : os.type();
  const upTime: number = os.uptime();
  const numCores: number = cpus.length;
  const cpuSpeed: number = cpus[0].speed;
  const cpuLoad: number = await getCpuLoad();

  return {
    freeMem,
    totalMem,
    usedMem,
    memUsage,
    osType,
    upTime,
    numCores,
    cpuSpeed,
    cpuLoad,
  };
}
