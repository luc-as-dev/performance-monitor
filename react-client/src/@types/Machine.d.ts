import IPerformanceData from "./PerformanceData";

export default interface IMachine {
  macAddress: string;
  performanceData: IPerformanceData;
}
