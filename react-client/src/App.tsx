import React, { useEffect, useState } from "react";
import IMachine from "./@types/Machine";
import IPerformanceData from "./@types/PerformanceData";
import socket from "./utilities/socketConnection";

type Props = {};

export default function App({}: Props) {
  const [PData, setPData] = useState<{ [key: string]: IPerformanceData }>({});

  useEffect(() => {
    function performanceData(machine: IMachine) {
      setPData((prev) => ({
        ...prev,
        [machine.macAddress]: machine.performanceData,
      }));
    }

    socket.on("performance-data", performanceData);
    return () => {
      socket.off("performance-data", performanceData);
    };
  }, []);

  return (
    <div className="max-w-xl mx-auto px-5 py-10 flex flex-col gap-5">
      {Object.keys(PData).map((macAddress) => {
        const performanceData = PData[macAddress];
        return (
          <div key={macAddress} className="bg-gray-100 p-5 shadow-md">
            <div className="">
              <h2>{macAddress}</h2>
              <h3>OS: {performanceData.osType}</h3>
              <div className="flex justify-between">
                <h3 className="">CPU</h3>
                <div className="flex gap-1">
                  <h4 className="">{performanceData.cpuModel}</h4>
                  <h4 className="">{performanceData.numCores} Cores</h4>
                  <h4 className="">{performanceData.cpuSpeed}GHz</h4>
                </div>
                <h3 className="w-14 text-right">{performanceData.cpuLoad}%</h3>
              </div>
              <div className="flex justify-between">
                <h3 className="">MEM</h3>
                <h3 className="">
                  {Math.round(performanceData.totalMem / 1073741824)}GB
                </h3>
                <h3 className="w-14 text-right">
                  {Math.round(performanceData.memUsage! * 100)}%
                </h3>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
