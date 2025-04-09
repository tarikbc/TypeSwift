import styles from './PlayerProgress.module.css';
import { Socket } from "socket.io-client";

interface Player {
  id: string;
  name: string;
  avatar: number;
  emoji?: string;
  progress: number;
  wpm: number;
}

interface PlayerProgressProps {
  players: Player[];
  currentPlayerId?: string;
  socket?: Socket;
}

function PlayerProgress({ players, currentPlayerId, socket }: PlayerProgressProps) {
  if (!players || players.length === 0) {
    return <div className={styles.noPlayers}>Waiting for players to join...</div>;
  }

  const handlePlayerClick = (playerId: string) => {
    if (socket && playerId !== currentPlayerId) {
      socket.emit("triggerFireworks", { targetPlayerId: playerId });
    }
  };

  return (
    <div className={styles.playerProgress}>
      <h3>Player Progress</h3>
      <div className={styles.progressList}>
        {players.map((player) => (
          <button
            key={player.id}
            className={`${styles.playerRow} ${
              player.id === currentPlayerId ? styles.currentPlayer : ""
            }`}
            onClick={() => handlePlayerClick(player.id)}
            disabled={player.id === currentPlayerId}
            title={player.id === currentPlayerId ? "This is you" : `Click to send fireworks to ${player.name}`}
          >
            <div className={styles.playerInfo}>
              <span className={styles.playerEmoji}>{player.emoji || "👤"}</span>
              <span className={styles.playerName}>{player.name}</span>
            </div>

            <div className={styles.progressBarContainer}>
              <div
                className={styles.progressBar}
                style={{ width: `${player.progress}%` }}
              />
              <span className={styles.progressText}>{player.progress}%</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default PlayerProgress;
