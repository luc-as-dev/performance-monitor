export default interface IPerformanceData {
  cpuLoad?: number;
  freeMem?: number;
  totalMem: number;
  usedMem?: number;
  memUsage?: number;
  osType: string;
  cpuModel: string;
  numCores: number;
  cpuSpeed: number;
}
