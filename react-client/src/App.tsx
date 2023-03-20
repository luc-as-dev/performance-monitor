import React, { useEffect, useState } from "react";
import IMachine from "./@types/Machine";
import socket from "./utilities/socketConnection";

type Props = {};

type MachinesType = { [macAddress: string]: IMachine };

export default function App({}: Props) {
  const [machines, setMachines] = useState<MachinesType>({});

  useEffect(() => {
    function setClientMachines(machines: IMachine[]) {
      setMachines(
        machines.reduce(
          (acc, machine) => ({ ...acc, [machine.macAddress]: machine }),
          {}
        )
      );
    }

    function machineConnected(machine: IMachine) {
      setMachines((prev) => ({
        ...prev,
        [machine.macAddress]: {
          ...prev[machine.macAddress],
          deviceName: machine.deviceName,
          lastOnline: machine.lastOnline,
          performanceData: machine.performanceData,
        },
      }));
    }

    function updatePerformanceData(machine: IMachine) {
      setMachines((prev) => ({
        ...prev,
        [machine.macAddress]: {
          ...prev[machine.macAddress],
          performanceData: machine.performanceData,
        },
      }));
    }
    function machineDisconnected(machine: IMachine) {
      setMachines((prev) => ({
        ...prev,
        [machine.macAddress]: {
          ...prev[machine.macAddress],
          lastOnline: machine.lastOnline,
          performanceData: machine.performanceData,
        },
      }));
    }

    socket.on("client-list", setClientMachines);
    socket.on("machine-connect", machineConnected);
    socket.on("performance-data", updatePerformanceData);
    socket.on("machine-disconnect", machineDisconnected);
    return () => {
      socket.off("performance-data", updatePerformanceData);
    };
  }, []);

  return (
    <div className="max-w-xl mx-auto px-5 py-10 flex flex-col gap-5">
      {Object.keys(machines).map((macAddress) => {
        const machine = machines[macAddress];
        return (
          <div key={macAddress} className="bg-gray-100 p-5 shadow-md">
            <div className="">
              <div className="border-gray-300 border-b flex justify-between">
                <h2 className="font-semibold text-lg">{machine.deviceName}</h2>
                <h3 className="">
                  {machine.lastOnline ? (
                    <span className="text-red-500 font-semibold"> Offline</span>
                  ) : (
                    <span className="text-green-500 font-semibold">Online</span>
                  )}
                </h3>
              </div>
              <h3>OS: {machine.performanceData.osType}</h3>
              <div className="flex justify-between">
                <h3 className="w-14">CPU</h3>
                <div className="flex gap-1">
                  <h4 className="">{machine.performanceData.cpuModel}</h4>
                  <h4 className="">{machine.performanceData.numCores} Cores</h4>
                  <h4 className="">{machine.performanceData.cpuSpeed}GHz</h4>
                </div>
                <h3 className="w-14 text-right">
                  {machine.performanceData.cpuLoad &&
                    machine.performanceData.cpuLoad.toString() + "%"}
                </h3>
              </div>
              <div className="flex justify-between">
                <h3 className="w-14">MEM</h3>
                <h3 className="">
                  {Math.round(machine.performanceData.totalMem / 1073741824)}GB
                </h3>
                <h3 className="w-14 text-right">
                  {machine.performanceData.memUsage &&
                    Math.round(
                      machine.performanceData.memUsage! * 100
                    ).toString() + "%"}
                </h3>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
