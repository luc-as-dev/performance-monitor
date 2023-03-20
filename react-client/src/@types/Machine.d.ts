import IPerformanceData from "./PerformanceData";

export default interface IMachine {
  deviceName?: string;
  lastOnline?: number | null;
  macAddress: string;
  performanceData: IPerformanceData;
}
