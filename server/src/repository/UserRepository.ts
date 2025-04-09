import { AppDataSource } from "../data-source";
import { User } from "../entity/User";

export const UserRepository = AppDataSource.getRepository(User).extend({
  
  /**
   * Find a user by client ID or create a new one if not found
   */
  async findOrCreateByClientId(clientId: string, name: string, emoji: string): Promise<User> {
    let user = await this.findOneBy({ clientId });
    
    if (!user) {
      // Create new user
      user = new User();
      user.clientId = clientId;
      user.name = name;
      user.emoji = emoji;
      await this.save(user);
    }
    
    return user;
  },
  
  /**
   * Update a user's profile information
   */
  async updateProfile(clientId: string, name: string, emoji: string): Promise<User | null> {
    const user = await this.findOneBy({ clientId });
    
    if (!user) {
      return null;
    }
    
    // Update properties
    user.name = name;
    user.emoji = emoji;
    await this.save(user);
    
    return user;
  },
  
  /**
   * Update a user's game statistics
   */
  async updateStats(clientId: string, wpm: number, completedWord: boolean): Promise<void> {
    const user = await this.findOneBy({ clientId });
    
    if (!user) {
      return;
    }
    
    // Update stats
    if (completedWord) {
      user.wordsCompleted += 1;
    }
    
    if (wpm > user.bestWpm) {
      user.bestWpm = wpm;
    }
    
    user.gamesPlayed += 1;
    await this.save(user);
  }
});
