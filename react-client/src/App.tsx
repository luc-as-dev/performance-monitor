import React, { useEffect, useState } from "react";
import socket from "./utilities/socketConnection";

type Props = {};

export default function App({}: Props) {
  const [performanceData, setPerformanceData] = useState({});

  useEffect(() => {
    socket.on("performance-data", (data) => {
      console.log(data);
    });
  }, []);

  return <div>App</div>;
}
