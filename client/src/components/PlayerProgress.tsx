import styles from './PlayerProgress.module.css';

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
}

function PlayerProgress({ players, currentPlayerId }: PlayerProgressProps) {
  if (!players || players.length === 0) {
    return <div className={styles.noPlayers}>Waiting for players to join...</div>;
  }

  return (
    <div className={styles.playerProgress}>
      <h3>Player Progress</h3>
      <div className={styles.progressList}>
        {players.map((player) => (
          <div
            key={player.id}
            className={`${styles.playerRow} ${
              player.id === currentPlayerId ? styles.currentPlayer : ""
            }`}
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
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlayerProgress;
