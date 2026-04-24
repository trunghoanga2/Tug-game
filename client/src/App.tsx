import { useState } from "react";
import Lobby from "./Lobby";
import Game from "./Game";

export default function App() {
  const [socket, setSocket] = useState<any>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [role, setRole] = useState<string | null>(null);

  if (!roomId) {
    return (
      <Lobby
        onJoin={(room: string, sock: any, name: string, playerRole: string) => {
          setRoomId(room);
          setSocket(sock);
          setPlayerName(name);
          setRole(playerRole);
        }}
      />
    );
  }

  return <Game socket={socket} roomId={roomId} playerName={playerName} initialRole={role} />;
}