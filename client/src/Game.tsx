import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Game({ socket, roomId, playerName, initialRole }: any) {
  const [role, setRole] = useState<string | null>(initialRole);
  const [position, setPosition] = useState(50);
  const [winner, setWinner] = useState<string | null>(null);
  const [playerNames, setPlayerNames] = useState<{ A: string | null; B: string | null }>({ A: null, B: null });
  const [readyState, setReadyState] = useState<{ A: boolean; B: boolean }>({ A: false, B: false });
  const [bothJoined, setBothJoined] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [rematchRequest, setRematchRequest] = useState<{ A: boolean; B: boolean }>({ A: false, B: false });
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    socket.on("role", setRole);

    socket.on("state", (data: any) => {
      setPosition(data.position);
      setWinner(data.winner);
      if (data.playerNames) {
        setPlayerNames(data.playerNames);
        if (data.playerNames.A && data.playerNames.B) {
          setBothJoined(true);
        }
      }
      console.log(data);
      
      if (data.readyState) {
        setReadyState(data.readyState);
      }
      if (data.gameStarted) {
        setGameStarted(true);
      }
      if (data.rematchRequest) {
        setRematchRequest(data.rematchRequest);
      }
    });

    socket.on("playerJoined", () => {
      setBothJoined(true);
    });

    socket.on("countdown", (count: number) => {
      setCountdown(count);
    });

    socket.on("gameStart", () => {
      setCountdown(null);
      setGameStarted(true);
    });

    socket.on("gameReset", () => {
      setWinner(null);
      setPosition(50);
      setGameStarted(false);
      setReadyState({ A: false, B: false });
      setRematchRequest({ A: false, B: false });
      setCountdown(null);
    });

    // Request current state when component mounts
    socket.emit("requestState", roomId);

    return () => {
      socket.off("role");
      socket.off("state");
      socket.off("playerJoined");
      socket.off("countdown");
      socket.off("gameStart");
      socket.off("gameReset");
    };
  }, [socket, roomId]);

  const handleReady = () => {
    socket.emit("playerReady");
  };

  const handleRematch = () => {
    socket.emit("requestRematch");
  };

  const handlePull = () => {
    setIsPulling(true);
    socket.emit("pull");
    setTimeout(() => setIsPulling(false), 100);
  };

  const myReady = role === "A" ? readyState.A : readyState.B;
  const opponentReady = role === "A" ? readyState.B : readyState.A;
  const myRematch = role === "A" ? rematchRequest.A : rematchRequest.B;
  const opponentRematch = role === "A" ? rematchRequest.B : rematchRequest.A;
  console.log(myReady, opponentReady);
  

  return (
    <div style={{ textAlign: "center", marginTop: 40 }}>
    <h1>Trò chơi vương quyền</h1>
    <h3>Room: {roomId}</h3>
    <p>Bạn: <strong>{playerName}</strong></p>

      {/* GAME AREA */}
      <div
        style={{
          position: "relative",
          width: 700,
          height: 150,
          margin: "50px auto",
        }}
      >
        {/* Vạch trái */}
        <div
          style={{
            position: "absolute",
            left: 80,
            top: 0,
            bottom: 0,
            width: 4,
            background: "black",
          }}
        />

        {/* Vạch phải */}
        <div
          style={{
            position: "absolute",
            right: 80,
            top: 0,
            bottom: 0,
            width: 4,
            background: "black",
          }}
        />

        {/* Dây */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            height: 8,
            background: "#8B4513",
            transform: "translateY(-50%)",
          }}
        />

        {/* Điểm kéo */}
        <motion.div
          animate={{ 
            left: `${position}%`,
            scale: isPulling ? 1.3 : 1,
          }}
          transition={{ 
            left: { type: "spring", stiffness: 300, damping: 20 },
            scale: { duration: 0.1 }
          }}
          style={{
            position: "absolute",
            top: "50%",
            width: 25,
            height: 25,
            background: "red",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Player A */}
        <motion.div
          animate={{ 
            x: isPulling && role === "A" ? [-3, 3, -3, 0] : 0,
            scale: winner === "A" ? [1, 1.2, 1] : 1,
          }}
          transition={{ duration: 0.2 }}
          style={{
            position: "absolute",
            left: -25,
            top: "50%",
            transform: "translateY(-50%)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 40 }}>🧍</div>
          <div style={{ fontSize: 12, fontWeight: "bold" }}>{playerNames.A || "..."}</div>
        </motion.div>

        {/* Player B */}
        <motion.div
          animate={{ 
            x: isPulling && role === "B" ? [3, -3, 3, 0] : 0,
            scale: winner === "B" ? [1, 1.2, 1] : 1,
          }}
          transition={{ duration: 0.2 }}
          style={{
            position: "absolute",
            right: -25,
            top: "50%",
            transform: "translateY(-50%)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 40 }}>🧍</div>
          <div style={{ fontSize: 12, fontWeight: "bold" }}>{playerNames.B || "Chờ..."}</div>
        </motion.div>
      </div>

      {/* Countdown */}
      <AnimatePresence mode="wait">
        {countdown !== null && (
          <motion.div
            key={countdown}
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ fontSize: 80, fontWeight: "bold", color: "#ff5722", marginBottom: 20 }}
          >
            {countdown}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ready / Game buttons */}
      {!bothJoined ? (
        <p style={{ fontSize: 18 }}>Chờ đối thủ tham gia...</p>
      ) : !gameStarted ? (
        <div>
          <p style={{ marginBottom: 10 }}>
            Bạn: {myReady ? "✅ Sẵn sàng" : "⏳ Chưa sẵn sàng"} | 
            Đối thủ: {opponentReady ? "✅ Sẵn sàng" : "⏳ Chưa sẵn sàng"}
          </p>
          {!myReady && countdown === null && (
            <motion.button
              onClick={handleReady}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              style={{ fontSize: 20, padding: "10px 30px", background: "#4CAF50", color: "white", border: "none", borderRadius: 5, cursor: "pointer" }}
            >
              Sẵn sàng
            </motion.button>
          )}
          {myReady && !opponentReady && countdown === null && (
            <p>Chờ đối thủ sẵn sàng...</p>
          )}
        </div>
      ) : (
        <motion.button
          onClick={handlePull}
          disabled={!role || winner !== null}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          style={{ fontSize: 20, padding: "10px 30px", cursor: "pointer" }}
        >
          KÉO!!!
        </motion.button>
      )}

      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            style={{ marginTop: 20 }}
          >
            <motion.h2
              animate={winner === role ? {
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, 0],
              } : {}}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              {winner === role 
                ? "🎉 WINNER WINNER CHICKEN DINNER! 🎉" 
                : `😢 Thua rồi, người thắng là ${playerNames[winner as "A" | "B"]}! 😢`}
            </motion.h2>
            
            {/* Confetti effect for winner */}
            {winner === role && (
              <div style={{ position: "relative", height: 50 }}>
                {[...Array(10)].map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ y: 0, x: 0, opacity: 1 }}
                    animate={{ 
                      y: [0, -100, 50],
                      x: (i - 5) * 30,
                      opacity: [1, 1, 0],
                      rotate: [0, 360]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                    style={{ position: "absolute", left: "50%", fontSize: 24 }}
                  >
                    {["🎊", "✨", "🌟", "🎉", "💫"][i % 5]}
                  </motion.span>
                ))}
              </div>
            )}
          
            <div style={{ marginTop: 20 }}>
              {!myRematch ? (
                <motion.button
                  onClick={handleRematch}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ fontSize: 18, padding: "10px 25px", background: "#FF9800", color: "white", border: "none", borderRadius: 5, cursor: "pointer" }}
                >
                  🔁 Chơi lại
                </motion.button>
              ) : (
                <p>✅ Bạn đã yêu cầu chơi lại</p>
              )}
              {myRematch && !opponentRematch && (
                <p>⏳ Chờ đối thủ đồng ý...</p>
              )}
              {opponentRematch && !myRematch && (
                <motion.p
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                >
                  👋 Đối thủ muốn chơi lại!
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}