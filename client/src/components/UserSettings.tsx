import { useState } from "react";
import { Socket } from "socket.io-client";
import styles from "./UserSettings.module.css";

// Common emoji categories that could be used for avatars
const AVAILABLE_EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
  "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
  "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
  "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗",
  "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯"
];

interface UserSettingsProps {
  socket: Socket;
  playerName: string;
  playerEmoji: string;
  onClose: () => void;
}

function UserSettings({ socket, playerName, playerEmoji, onClose }: UserSettingsProps) {
  const [name, setName] = useState(playerName);
  const [emoji, setEmoji] = useState(playerEmoji);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (name.trim()) {
      // Send updated profile info to server
      socket.emit("updateProfile", { name: name.trim(), emoji });
      onClose();
    }
  };

  return (
    <div className={styles.userSettingsModal}>
      <div className={styles.userSettingsContent}>
        <h2>Update Your Profile</h2>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="player-name">Your Name</label>
            <input
              id="player-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={15}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Your Emoji</label>
            <div className={styles.emojiSelector}>
              <button 
                type="button" 
                className={styles.currentEmoji}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                {emoji}
              </button>
              
              {showEmojiPicker && (
                <div className={styles.emojiGrid}>
                  {AVAILABLE_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      className={`${styles.emojiOption} ${emoji === e ? styles.selected : ""}`}
                      onClick={() => {
                        setEmoji(e);
                        setShowEmojiPicker(false);
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.saveButton}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserSettings;
