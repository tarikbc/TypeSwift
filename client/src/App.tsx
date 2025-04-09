import { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import styles from "./App.module.css";
import GameContainer from "./components/GameContainer";
import { getSocket, closeSocket, getClientId } from "./utils/api";

// Define interfaces for our data structures
interface Player {
  id: string;
  name: string;
  avatar: number;
  emoji?: string;
  progress: number;
  wpm: number;
  bestWpm?: number;
  latestWpm?: number;
  position?: number;
}

interface GameState {
  currentWord: string;
  player: Player;
  players: Player[];
}

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [idleDisconnected, setIdleDisconnected] = useState<boolean>(false);
  const heartbeatIntervalRef = useRef<number | null>(null);

  // Function to establish socket connection
  const initializeConnection = async () => {
    try {
      // First, ensure we have a client ID (this will set the cookie if needed)
      const clientId = await getClientId();
      console.log("Initialized client ID:", clientId);
      
      // Then initialize socket connection
      const newSocket = getSocket();
      
      newSocket.on("connect", () => {
        console.log("Connected to server with client ID:", clientId);
        setConnected(true);
        setError(null);
        setIdleDisconnected(false);
        
        // Start sending heartbeats to prevent idle timeout
        if (heartbeatIntervalRef.current) {
          window.clearInterval(heartbeatIntervalRef.current);
        }
        
        heartbeatIntervalRef.current = window.setInterval(() => {
          if (newSocket.connected) {
            newSocket.emit('heartbeat');
          }
        }, 30000); // Send heartbeat every 30 seconds
      });
      
      // Store game state in App component
      newSocket.on("gameState", (data: GameState) => {
        console.log("App received gameState event:", JSON.stringify(data, null, 2));
        setGameState(data);
      });
      
      newSocket.on("connect_error", (err) => {
        console.error("Connection error:", err);
        setError("Failed to connect to the server. Please try again later.");
      });
      
      newSocket.on("disconnect", () => {
        console.log("Disconnected from server");
        setConnected(false);
        
        // Clear heartbeat interval
        if (heartbeatIntervalRef.current) {
          window.clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
      });
      
      // Handle idle timeout
      newSocket.on("idleTimeout", () => {
        console.log("Disconnected due to inactivity");
        setIdleDisconnected(true);
        setConnected(false);
        
        // Clear heartbeat interval
        if (heartbeatIntervalRef.current) {
          window.clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
      });
      
      setSocket(newSocket);
    } catch (err) {
      console.error("Error initializing connection:", err);
      setError("Failed to initialize connection. Please try refreshing the page.");
    }
  };

  useEffect(() => {
    // Initialize client ID and socket connection
    initializeConnection();
    
    // Clean up on unmount
    return () => {
      if (heartbeatIntervalRef.current) {
        window.clearInterval(heartbeatIntervalRef.current);
      }
      closeSocket();
    };
  }, []);
  
  // Function to handle reconnection
  const handleReconnect = () => {
    // Close any existing socket
    closeSocket();
    // Initialize a new connection
    initializeConnection();
  };

  return (
    <div className={styles.app}>
      <header className={styles.appHeader}>
        <h1>TypeSwift</h1>
        <p>Real-time multiplayer typing competition</p>
      </header>

      <main className={styles.main}>
        {error ? (
          <div className={styles.errorMessage}>{error}</div>
        ) : connected && socket ? (
          <GameContainer socket={socket} initialGameState={gameState} />
        ) : idleDisconnected ? (
          <div className={styles.disconnectedMessage}>
            <h2>You were disconnected due to inactivity</h2>
            <p>You've been inactive for more than one minute.</p>
            <button 
              className={styles.reconnectButton}
              onClick={handleReconnect}
            >
              Reconnect
            </button>
          </div>
        ) : (
          <div className={styles.loading}>
            <p>Connecting to the game server...</p>
          </div>
        )}
      </main>

      <footer className={styles.appFooter}>
        <p>TypeSwift &copy; {new Date().getFullYear()}</p>
        <a href="https://github.com/tarikbc/TypeSwift">GitHub</a>
      </footer>
    </div>
  );
}

export default App;
