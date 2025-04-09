import styles from './Leaderboard.module.css';

interface Player {
  id: string;
  name: string;
  avatar: number;
  emoji?: string;
  progress: number;
  wpm: number;
  bestWpm?: number;
  latestWpm?: number;
}

interface LeaderboardProps {
  players: Player[];
  currentPlayerId?: string;
}

function Leaderboard({ players, currentPlayerId }: LeaderboardProps) {
  // Sort players by WPM in descending order
  const sortedPlayers = [...players].sort((a, b) => b.wpm - a.wpm);

  return (
    <div className={styles.leaderboard}>
      <h3>Leaderboard</h3>

      {sortedPlayers.length === 0 ? (
        <div className={styles.emptyLeaderboard}>No players yet</div>
      ) : (
        <div className={styles.leaderboardList}>
          {sortedPlayers.map((player, index) => (
            <div
              key={player.id}
              className={`${styles.leaderboardItem} ${
                player.id === currentPlayerId ? styles.currentPlayer : ""
              }`}
            >
              <div className={styles.rank}>{index + 1}</div>
              <div className={styles.playerInfo}>
                <span className={styles.playerEmoji}>{player.emoji || "👤"}</span>
                <span className={styles.playerName}>{player.name}</span>
              </div>
              <div className={styles.scoreInfo}>
                <div className={styles.wpm}>
                  {player.wpm > 0 ? `${player.wpm} WPM` : "-"}
                </div>
                <div className={styles.statsRow}>
                  <span className={styles.statLabel}>Best:</span>
                  <span className={styles.statValue}>{player.bestWpm || 0} WPM</span>
                </div>
                <div className={styles.statsRow}>
                  <span className={styles.statLabel}>Latest:</span>
                  <span className={styles.statValue}>{player.latestWpm || 0} WPM</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
