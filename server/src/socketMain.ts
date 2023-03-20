import { Server, Socket } from "socket.io";
import IMachine from "./@types/Machine";
import IPerformanceData from "./@types/PerformanceData";
import connectDB from "./db/db";
import Machine from "./db/model/Machine";

const MONGO_URI = process.env.MONGO_URI;
const CLIENT_KEY = process.env.CLIENT_KEY || "NOTsafe";
const UI_CLIENT_KEY = process.env.UI_CLIENT_KEY || "NOTsafeUI";

let useDB = false;

if (MONGO_URI) {
  if (connectDB(MONGO_URI).then((data) => data)) {
    useDB = true;
  } else {
    console.log("Could not connect to database");
  }
} else {
  console.log(
    "Missing MONGO_URI in .env. The server will only feed realtime data"
  );
}

export default function socketMain(io: Server, socket: Socket) {
  let macAddress: string;
  console.log(`Socket[${socket.id}] Connected`);

  socket.on("client-auth", async (key: string) => {
    if (key === CLIENT_KEY) {
      console.log(`Socket[${socket.id}] Joined clients`);
      socket.join("machine");
      socket.on("disconnect", async () => {
        const machine = await Machine.findOne({ macAddress });
        machine.lastOnline = Date.now();
        if (useDB) fixMachineSave(machine);
        io.to("ui-clients").emit("machine-disconnect", machine);
      });
    } else if (key === UI_CLIENT_KEY) {
      console.log(`Socket[${socket.id}] Joined ui-clients`);
      socket.join("ui-clients");
      if (useDB) {
        const machines = await Machine.find<IMachine[]>({});
        socket.emit("client-list", machines);
      }
    } else socket.disconnect();
  });

  socket.on("init-machine", async (machine: IMachine) => {
    macAddress = machine.macAddress;
    io.to("ui-clients").emit("machine-connect", machine);
    if (useDB) fixMachineSave(machine);
  });

  socket.on("performance-data", (data: IPerformanceData) => {
    io.to("ui-clients").emit("performance-data", {
      macAddress,
      performanceData: data,
    });
  });
}

async function fixMachineSave(latestMachine: IMachine): Promise<void> {
  const machine = await Machine.findOne<IMachine>({
    macAddress: latestMachine.macAddress,
  });
  if (!machine) {
    const newMachine = new Machine(latestMachine);
    await newMachine.save();
  } else {
    await Machine.updateOne(
      { macAddress: latestMachine.macAddress },
      latestMachine
    );
  }
}
