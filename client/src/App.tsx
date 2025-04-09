import { useState, useEffect } from "react";
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

  useEffect(() => {
    // Initialize client ID and socket connection
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
        });
        
        setSocket(newSocket);
      } catch (err) {
        console.error("Error initializing connection:", err);
        setError("Failed to initialize connection. Please try refreshing the page.");
      }
    };
    
    initializeConnection();
    
    // Clean up on unmount
    return () => {
      closeSocket();
    };
  }, []);

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
        ) : (
          <div className={styles.loading}>
            <p>Connecting to the game server...</p>
          </div>
        )}
      </main>

      <footer className={styles.appFooter}>
        <p>TypeSwift &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;
