import io from "socket.io-client";

const SERVER_URL =
  import.meta.env.VITE_SOME_SERVER_URL || "http://localhost:3000";
const UI_CLIENT_KEY = import.meta.env.VITE_SOME_UI_KEY || "NOTsafeUI";

const socket = io(SERVER_URL);

socket.on("connect", () => {
  console.log("Connected");
  socket.emit("client-auth", UI_CLIENT_KEY);
});

export default socket;
