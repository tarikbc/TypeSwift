import { useEffect, useRef } from 'react';
import { Fireworks } from 'fireworks-js';
import styles from './FireworksOverlay.module.css';

interface FireworksOverlayProps {
  isActive: boolean;
  duration?: number;
  onComplete?: () => void;
  players?: Array<{id: string; name: string; emoji?: string}>;
  fireworksSource?: string | null;
}

const FireworksOverlay: React.FC<FireworksOverlayProps> = ({ 
  isActive, 
  duration = 3000, 
  onComplete,
  players = [],
  fireworksSource,
}) => {
  // Find the player who triggered the fireworks
  const sourcePlayer = players.find(p => p.id === fireworksSource);
  const containerRef = useRef<HTMLDivElement>(null);
  const fireworksInstanceRef = useRef<Fireworks | null>(null);

  useEffect(() => {
    if (isActive && containerRef.current) {
      // Initialize fireworks
      const container = containerRef.current;
      const fireworks = new Fireworks(container, {
        autoresize: true,
        opacity: 0.8,
        acceleration: 1.05,
        friction: 0.97,
        gravity: 1.5,
        particles: 150,
        traceLength: 3,
        traceSpeed: 10,
        explosion: 8,
        intensity: 30,
        flickering: 50,
        lineStyle: 'round',
        hue: {
          min: 0,
          max: 360
        },
        delay: {
          min: 15,
          max: 30
        },
        rocketsPoint: {
          min: 50,
          max: 50
        },
        lineWidth: {
          explosion: {
            min: 1,
            max: 3
          },
          trace: {
            min: 1,
            max: 2
          }
        },
        brightness: {
          min: 50,
          max: 80
        },
        decay: {
          min: 0.015,
          max: 0.03
        },
        mouse: {
          click: false,
          move: false,
          max: 1
        }
      });

      // Start the fireworks
      fireworks.start();
      fireworksInstanceRef.current = fireworks;

      // Set a timeout to stop the fireworks after the specified duration
      const timer = setTimeout(() => {
        fireworks.stop();
        if (onComplete) {
          onComplete();
        }
      }, duration);

      return () => {
        clearTimeout(timer);
        fireworks.stop();
        fireworksInstanceRef.current = null;
      };
    }
  }, [isActive, duration, onComplete]);

  if (!isActive) return null;

  return (
    <div className={styles.overlay}>
      <div ref={containerRef} className={styles.fireworksContainer}></div>
      <div className={styles.message}>
        <h2>BOOM! 💥</h2>
        {sourcePlayer ? (
          <p>{sourcePlayer.emoji || '😈'} {sourcePlayer.name} is sending fireworks your way!</p>
        ) : (
          <p>Someone is sending fireworks your way!</p>
        )}
      </div>
    </div>
  );
};

export default FireworksOverlay;
