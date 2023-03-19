import * as os from "os";

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
  const osType: string = os.type() == "Darwin" ? "Mac" : os.type();
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

/*
setInterval(async () => {
  console.log(await getPerformanceData());
}, 250);
*/
