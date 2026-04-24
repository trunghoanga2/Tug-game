import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

export default function Lobby({ onJoin }: any) {
  const [playerName, setPlayerName] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const handleRoomCreated = (roomId: string) => {
      onJoin(roomId, socket, playerName.trim(), "A");
    };

    const handleJoinSuccess = (role: string) => {
      // Chỉ xử lý khi đang join (role B)
      if (isJoining && role === "B") {
        onJoin(roomInput.trim(), socket, playerName.trim(), "B");
        setShowJoinModal(false);
        setIsJoining(false);
      }
    };

    const handleNotFound = () => {
      setError("Phòng không tồn tại!");
      setIsJoining(false);
    };

    const handleFull = () => {
      setError("Phòng đã đầy!");
      setIsJoining(false);
    };

    socket.on("roomCreated", handleRoomCreated);
    socket.on("role", handleJoinSuccess);
    socket.on("notFound", handleNotFound);
    socket.on("full", handleFull);

    return () => {
      socket.off("roomCreated", handleRoomCreated);
      socket.off("role", handleJoinSuccess);
      socket.off("notFound", handleNotFound);
      socket.off("full", handleFull);
    };
  }, [playerName, roomInput, onJoin, isJoining]);

  const createRoom = () => {
    if (!playerName.trim()) {
      alert("Vui lòng nhập tên!");
      return;
    }
    socket.emit("createRoom", playerName.trim());
    setShowCreateModal(false);
  };

  const joinRoom = () => {
    if (!playerName.trim()) {
      setError("Vui lòng nhập tên!");
      return;
    }
    if (!roomInput.trim()) {
      setError("Vui lòng nhập mã phòng!");
      return;
    }
    setError(null);
    setIsJoining(true);
    socket.emit("joinRoom", roomInput.trim(), playerName.trim());
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowJoinModal(false);
    setPlayerName("");
    setError(null);
    setIsJoining(false);
    setRoomInput("");
  };

  const modalOverlay: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const modalBox: React.CSSProperties = {
    background: "white",
    padding: 30,
    borderRadius: 10,
    width: 320,
    textAlign: "center",
    boxSizing: "border-box",
  };

  const inputStyle: React.CSSProperties = {
    padding: "10px 15px",
    fontSize: 16,
    width: "100%",
    marginBottom: 15,
    boxSizing: "border-box",
    border: "1px solid #ccc",
    borderRadius: 5,
  };

  return (
    <div style={{ textAlign: "center", marginTop: 100 }}>
      <h2>🎮 Tug Game</h2>

      <div style={{ marginTop: 30 }}>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{ padding: "15px 40px", fontSize: 18, marginRight: 20 }}
        >
          Tạo phòng
        </button>
        <button
          onClick={() => setShowJoinModal(true)}
          style={{ padding: "15px 40px", fontSize: 18 }}
        >
          Join
        </button>
      </div>

      {/* Modal Tạo phòng */}
      {showCreateModal && (
        <div style={modalOverlay} onClick={closeModals}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: 20 }}>Tạo phòng mới</h3>
            <input
              placeholder="Nhập tên của bạn"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              style={inputStyle}
            />
            <div style={{ marginTop: 10 }}>
              <button onClick={closeModals} style={{ padding: "10px 20px", marginRight: 10, cursor: "pointer" }}>
                Hủy
              </button>
              <button onClick={createRoom} style={{ padding: "10px 20px", background: "#4CAF50", color: "white", border: "none", borderRadius: 5, cursor: "pointer" }}>
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Join */}
      {showJoinModal && (
        <div style={modalOverlay} onClick={closeModals}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: 20 }}>Tham gia phòng</h3>
            
            {error && (
              <div style={{ color: "red", marginBottom: 15, fontWeight: "bold" }}>
                ⚠️ {error}
              </div>
            )}
            
            <input
              placeholder="Nhập tên của bạn"
              value={playerName}
              onChange={(e) => { setPlayerName(e.target.value); setError(null); }}
              style={inputStyle}
            />
            <input
              placeholder="Nhập mã phòng"
              value={roomInput}
              onChange={(e) => { setRoomInput(e.target.value); setError(null); }}
              style={inputStyle}
            />
            <div style={{ marginTop: 10 }}>
              <button onClick={closeModals} style={{ padding: "10px 20px", marginRight: 10, cursor: "pointer" }}>
                Hủy
              </button>
              <button 
                onClick={joinRoom} 
                disabled={isJoining}
                style={{ padding: "10px 20px", background: isJoining ? "#ccc" : "#2196F3", color: "white", border: "none", borderRadius: 5, cursor: isJoining ? "not-allowed" : "pointer" }}
              >
                {isJoining ? "Đang tham gia..." : "Join"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}