import styles from './WordDisplay.module.css';

interface Player {
  id: string;
  name: string;
  avatar: number;
  emoji?: string;
  progress: number;
  wpm: number;
  position?: number;
}

interface WordDisplayProps {
  word: string;
  userInput: string;
  countdown: number | null;
  players?: Player[];
  currentPlayerId?: string;
}

function WordDisplay({ word, userInput, countdown, players = [], currentPlayerId }: WordDisplayProps) {
  // Show countdown if active
  if (countdown !== null) {
    return (
      <div className={styles.wordDisplay}>
        <div className={styles.countdown}>{countdown}</div>
      </div>
    );
  }

  // Show waiting message if no word
  if (!word) {
    console.log('No word provided to WordDisplay');
    return <div className={styles.wordDisplay}>Waiting for a word...</div>;
  }

  // Split the text into words to prevent breaking words in the middle
  const words = word.split(" ");
  let charIndex = 0;
  
  const wordElements = words.map((word, wordIdx) => {
    // Create an array to hold the character elements for this word
    const wordCharacters = [];
    
    // Process each character in the word
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const index = charIndex;
      let characterClass = styles.character;
      
      if (index < userInput.length) {
        characterClass = `${characterClass} ${userInput[index] === char ? styles.correct : styles.incorrect}`;
      }
      
      // Find players at this position
      const playersAtPosition = players
        .filter(p => p.id !== currentPlayerId && p.position === index)
        .sort((a, b) => a.name.localeCompare(b.name));
      
      wordCharacters.push(
        <span key={`char-${index}`} className={characterClass}>
          {char}
          {playersAtPosition.length > 0 && (
            <div className={styles.playerMarkers}>
              {playersAtPosition.map(player => (
                <div 
                  key={player.id} 
                  className={styles.playerPositionMarker}
                  title={player.name}
                >
                  {player.emoji || "👤"}
                </div>
              ))}
            </div>
          )}
        </span>
      );
      
      charIndex++;
    }
    
    // Add a space after each word (except the last one)
    if (wordIdx < words.length - 1) {
      const spaceIndex = charIndex;
      let spaceClass = `${styles.character}`;
      
      if (spaceIndex < userInput.length) {
        spaceClass = `${spaceClass} ${userInput[spaceIndex] === " " ? styles.correct : styles.incorrect}`;
      }
      
      // Find players at the space position
      const playersAtPosition = players
        .filter(p => p.id !== currentPlayerId && p.position === spaceIndex)
        .sort((a, b) => a.name.localeCompare(b.name));
      
      wordCharacters.push(
        <span key={`space-${spaceIndex}`} className={spaceClass}>
          {" "}
          {playersAtPosition.length > 0 && (
            <div className={styles.playerMarkers}>
              {playersAtPosition.map(player => (
                <div 
                  key={player.id} 
                  className={styles.playerPositionMarker}
                  title={player.name}
                >
                  {player.emoji || "👤"}
                </div>
              ))}
            </div>
          )}
        </span>
      );
      
      charIndex++;
    }
    
    // Return the word as a group of characters wrapped in a div
    return (
      <div key={`word-${wordIdx}`} className={styles.wordGroup}>
        {wordCharacters}
      </div>
    );
  });

  return (
    <div className={styles.wordDisplay}>
      <div className={styles.word}>{wordElements}</div>
    </div>
  );
}

export default WordDisplay;
