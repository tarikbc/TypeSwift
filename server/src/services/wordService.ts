import { phraseList } from '../data/phraseList';

class WordService {
  /**
   * Returns a random phrase from the phrase list
   * @returns {string} A random phrase
   */
  async getRandomWord(): Promise<string> {
    const randomIndex = Math.floor(Math.random() * phraseList.length);
    return phraseList[randomIndex];
  }

  /**
   * Calculate Words Per Minute based on word length and time taken
   * @param {string} word - The completed word
   * @param {number} timeInSeconds - Time taken to type the word in seconds
   * @returns {number} Words per minute score
   */
  calculateWPM(word: string, timeInSeconds: number): number {
    // Standard calculation: (Characters / 5) / Time in minutes
    // 5 characters is considered one word in standard typing tests
    const characters = word.length;
    const timeInMinutes = timeInSeconds / 60;

    return Math.round((characters / 5) / timeInMinutes);
  }
}

export default new WordService();
