import { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import WordDisplay from "./WordDisplay";
import PlayerProgress from "./PlayerProgress";
import Leaderboard from "./Leaderboard";
import UserSettings from "./UserSettings";
import { playSuccessSound, playErrorSound } from "../utils/soundEffects";
import styles from './GameContainer.module.css';

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

interface GameContainerProps {
  socket: Socket;
  initialGameState: GameState | null;
}

interface TypingProgressData {
  progress: number;
  wpm?: number;
}

interface PlayerProgressData {
  playerId: string;
  progress: number;
  position?: number;
}

interface PlayerUpdatedData {
  playerId: string;
  name: string;
  emoji: string;
}

interface PlayerWpmData {
  playerId: string;
  wpm: number;
}

interface NewWordData {
  word: string;
  players: Player[];
  revealTime: number;
}

function GameContainer({ socket, initialGameState }: GameContainerProps) {
  const [currentWord, setCurrentWord] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // Initialize from props if available
  useEffect(() => {
    if (initialGameState && initialGameState.currentWord) {
      console.log('Initializing from props:', initialGameState);
      setCurrentWord(initialGameState.currentWord);
      setPlayers(initialGameState.players || []);
      setCurrentPlayer(initialGameState.player || null);
    }
  }, [initialGameState]);
  const [inputValue, setInputValue] = useState<string>("");
  const [typingStartTime, setTypingStartTime] = useState<number | null>(null);
  const [gameActive, setGameActive] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [wordRevealed, setWordRevealed] = useState<boolean>(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input field when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle initial game state
  useEffect(() => {
    if (!socket) return;
    
    console.log('Setting up socket event listeners');
    
    function handleGameState(data: GameState) {
      console.log('Received game state:', JSON.stringify(data, null, 2));
      if (data && data.currentWord) {
        console.log('Setting current word to:', data.currentWord);
        setCurrentWord(data.currentWord);
        setPlayers(data.players || []);
        setCurrentPlayer(data.player || null);
        setWordRevealed(true);
      } else {
        console.error('Invalid game state received:', data);
      }
    }

    function handlePlayerJoined(player: Player) {
      setPlayers((prevPlayers) => [...prevPlayers, player]);
    }

    function handlePlayerLeft(playerId: string) {
      setPlayers((prevPlayers) =>
        prevPlayers.filter((player) => player.id !== playerId)
      );
    }

    function handlePlayerProgress(data: PlayerProgressData) {
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player.id === data.playerId
            ? { 
                ...player, 
                progress: data.progress,
                position: data.position !== undefined ? data.position : player.position
              }
            : player
        )
      );
    }
    
    function handlePlayerUpdated(data: PlayerUpdatedData) {
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player.id === data.playerId
            ? { ...player, name: data.name, emoji: data.emoji }
            : player
        )
      );
      
      // Update current player if it's the same player
      if (currentPlayer && currentPlayer.id === data.playerId) {
        setCurrentPlayer(prev => 
          prev ? { ...prev, name: data.name, emoji: data.emoji } : prev
        );
      }
    }

    function handlePlayerWpm(data: PlayerWpmData) {
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player.id === data.playerId ? { ...player, wpm: data.wpm } : player
        )
      );
    }

    function handleNewWord(data: NewWordData) {
      // Set the word but don't reveal it yet
      setCurrentWord(data.word);
      setPlayers(data.players);
      setInputValue("");
      setTypingStartTime(null);
      setGameActive(false);
      setWordRevealed(false);

      // Calculate the countdown based on the reveal time from server
      const now = Date.now();
      const timeUntilReveal = data.revealTime - now;

      // Start countdown from 3
      setCountdown(3);

      // Set up countdown timer
      const countdownInterval = setInterval(() => {
        setCountdown((currentCount) => {
          if (currentCount !== null && currentCount <= 1) {
            clearInterval(countdownInterval);
            setWordRevealed(true);
            setGameActive(true);
            // Focus the input field when the word is revealed
            if (inputRef.current) {
              inputRef.current.focus();
            }
            return null;
          }
          return currentCount !== null ? currentCount - 1 : null;
        });
      }, 500); // Faster countdown (500ms instead of 1000ms)

      // Ensure word is revealed at exact time specified by server
      setTimeout(() => {
        clearInterval(countdownInterval);
        setCountdown(null);
        setWordRevealed(true);
        setGameActive(true);
        // Focus the input field when the word is revealed
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, timeUntilReveal);
    }

    socket.on("gameState", handleGameState);
    socket.on("playerJoined", handlePlayerJoined);
    socket.on("playerLeft", handlePlayerLeft);
    socket.on("playerProgress", handlePlayerProgress);
    socket.on("playerWpm", handlePlayerWpm);
    socket.on("newWord", handleNewWord);
    socket.on("playerUpdated", handlePlayerUpdated);

    return () => {
      socket.off("gameState", handleGameState);
      socket.off("playerJoined", handlePlayerJoined);
      socket.off("playerLeft", handlePlayerLeft);
      socket.off("playerProgress", handlePlayerProgress);
      socket.off("playerWpm", handlePlayerWpm);
      socket.off("newWord", handleNewWord);
      socket.off("playerUpdated", handlePlayerUpdated);
    };
  }, [socket]);

  // Handle user typing input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only process input if the game is active
    if (gameActive) {
      // Check for typing errors to play error sound
      if (value.length > 0 && inputValue.length < value.length) {
        const lastCharIndex = value.length - 1;
        if (lastCharIndex < currentWord.length && value[lastCharIndex] !== currentWord[lastCharIndex]) {
          playErrorSound();
        }
      }
      
      setInputValue(value);

      // Start timer on first keypress
      if (!typingStartTime && value.length > 0) {
        setTypingStartTime(Date.now());
      }

        // Calculate progress percentage
        if (currentWord) {
          let progress = 0;

          // Calculate how much of the word is correctly typed
          for (let i = 0; i < value.length && i < currentWord.length; i++) {
            if (value[i] === currentWord[i]) {
              progress++;
            } else {
              break; // Stop counting on first wrong character
            }
          }

          // Convert to percentage
          const progressPercent = Math.floor((progress / currentWord.length) * 100);

          // Send progress and current position to server
          socket.emit("typingProgress", { 
            progress: progressPercent,
            position: progress // Current character position (0-based index)
          });

        // When word is complete
        if (value === currentWord) {
          // Play success sound
          playSuccessSound();
          
          const endTime = Date.now();
          const timeInSeconds = typingStartTime ? (endTime - typingStartTime) / 1000 : 0;

          // Calculate WPM: (Characters / 5) / Time in minutes
          const wpm = Math.round(currentWord.length / 5 / (timeInSeconds / 60));

          // Send completion with WPM
          socket.emit("typingProgress", { progress: 100, wpm });

          // Mark game as inactive but don't disable the input field
          setGameActive(false);
        }
      }
    } else {
      // If game is not active, prevent changing the input value
      e.preventDefault();
    }
  };

  return (
    <div className={styles.gameContainer}>
      <div className={styles.headerActions}>
        {currentPlayer && (
          <button 
            className={styles.settingsButton}
            onClick={() => setShowSettings(true)}
          >
            {currentPlayer.emoji || '⚙️'} {currentPlayer.name}
          </button>
        )}
      </div>
      
      <div className={styles.gameSection}>
        <div className={styles.componentContainer}>
          <WordDisplay
            word={wordRevealed ? currentWord : ""}
            userInput={inputValue}
            countdown={countdown}
            players={players}
            currentPlayerId={currentPlayer?.id}
          />
        </div>

        <div className={styles.componentContainer}>
          <div className={styles.inputContainer}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Type the word here..."
              className={styles.typingInput}
              autoFocus
            />
          </div>
        </div>

        <div className={styles.componentContainer}>
          <PlayerProgress players={players} currentPlayerId={currentPlayer?.id} />
        </div>
      </div>

      <div className={styles.leaderboardSection}>
        <div className={styles.componentContainer}>
          <Leaderboard players={players} currentPlayerId={currentPlayer?.id} />
        </div>
      </div>
      
      {showSettings && currentPlayer && (
        <UserSettings
          socket={socket}
          playerName={currentPlayer.name}
          playerEmoji={currentPlayer.emoji || '😀'}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default GameContainer;
