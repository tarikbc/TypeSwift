import styles from './WaitingIndicator.module.css';

interface WaitingIndicatorProps {
  isWaiting: boolean;
}

function WaitingIndicator({ isWaiting }: WaitingIndicatorProps) {
  if (!isWaiting) return null;
  
  return (
    <div className={styles.waitingIndicator}>
      <div className={styles.pulsingDot}></div>
      <span className={styles.waitingText}>Waiting for others to finish</span>
    </div>
  );
}

export default WaitingIndicator;
