import mongoose, { Schema } from "mongoose";
import IMachine from "../../@types/Machine";

const machineSchema = new Schema<IMachine>({
  macAddress: String,
  performanceData: {
    totalMem: Number,
    osType: String,
    cpuModel: String,
    numCores: Number,
    cpuSpeed: Number,
  },
});

const Machine = mongoose.model<IMachine>("Machine", machineSchema);
export default Machine;
