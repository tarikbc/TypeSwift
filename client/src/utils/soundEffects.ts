// Sound effects utility for the typing game

// Create audio context when needed (to comply with browser autoplay policies)
let audioContext: AudioContext | null = null;

// Initialize audio context on first user interaction
const initAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

/**
 * Play a success sound when a word is completed
 */
export const playSuccessSound = (): void => {
  try {
    const context = initAudioContext();
    
    // Create oscillator for a pleasant chord
    const oscillator1 = context.createOscillator();
    const oscillator2 = context.createOscillator();
    const oscillator3 = context.createOscillator();
    
    // Create gain node to control volume
    const gainNode = context.createGain();
    gainNode.gain.value = 0.1; // Lower volume
    
    // Connect oscillators to gain node
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    oscillator3.connect(gainNode);
    
    // Connect gain node to output
    gainNode.connect(context.destination);
    
    // Set frequencies for a pleasant chord
    oscillator1.frequency.value = 523.25; // C5
    oscillator2.frequency.value = 659.25; // E5
    oscillator3.frequency.value = 783.99; // G5
    
    // Set oscillator types
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';
    oscillator3.type = 'sine';
    
    // Start oscillators
    const now = context.currentTime;
    oscillator1.start(now);
    oscillator2.start(now + 0.05);
    oscillator3.start(now + 0.1);
    
    // Apply envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.8);
    
    // Stop oscillators after 1 second
    oscillator1.stop(now + 1);
    oscillator2.stop(now + 1);
    oscillator3.stop(now + 1);
  } catch (error) {
    console.error('Error playing success sound:', error);
  }
};

/**
 * Play an error sound when a wrong key is pressed
 */
export const playErrorSound = (): void => {
  try {
    const context = initAudioContext();
    
    // Create oscillator
    const oscillator = context.createOscillator();
    
    // Create gain node
    const gainNode = context.createGain();
    gainNode.gain.value = 0.05; // Very low volume for subtle feedback
    
    // Connect oscillator to gain node
    oscillator.connect(gainNode);
    
    // Connect gain node to output
    gainNode.connect(context.destination);
    
    // Set frequency for error sound
    oscillator.frequency.value = 220; // A3 - low frequency for error
    
    // Set oscillator type
    oscillator.type = 'sine';
    
    // Start oscillator
    const now = context.currentTime;
    oscillator.start(now);
    
    // Apply envelope for a short beep
    gainNode.gain.setValueAtTime(0.05, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
    
    // Stop oscillator after 0.1 seconds
    oscillator.stop(now + 0.1);
  } catch (error) {
    console.error('Error playing error sound:', error);
  }
};
