/**
 * Plays the alert notification sound.
 * Attempts to load `/alert.mp3` or `/assets/alert.mp3`, and falls back to a Web Audio API synthesizer chime.
 */
export function playNotificationSound() {
  try {
    const audio = new Audio("/alert.mp3");
    audio.volume = 0.6;
    audio.play().catch(() => {
      // If root alert.mp3 fails, try assets folder
      const altAudio = new Audio("/assets/alert.mp3");
      altAudio.volume = 0.6;
      altAudio.play().catch(() => {
        // Fallback to beautiful synthesized B3 financial terminal sound
        synthesizeChime();
      });
    });
  } catch (err) {
    console.warn("Notification audio play failed:", err);
    synthesizeChime();
  }
}

function synthesizeChime() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Tone 1: High crisp chime (F#5)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(739.99, audioCtx.currentTime); 
    gain1.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.6);
    
    // Tone 2: Harmonious depth chime (A#5) shortly after
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(932.33, audioCtx.currentTime + 0.12); 
    gain2.gain.setValueAtTime(0.12, audioCtx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
    
    osc2.start(audioCtx.currentTime + 0.12);
    osc2.stop(audioCtx.currentTime + 0.8);
  } catch (e) {
    console.warn("Web Audio chime synthesis not supported or blocked by user gesture interaction.");
  }
}
