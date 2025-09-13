import { create } from "zustand";

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  isMuted: boolean;
  spinningSound: HTMLAudioElement | null; // Für kontinuierlichen Spin-Sound
  spinStopTimer: NodeJS.Timeout | null; // Timer für verzögerten Stop
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  
  // Control functions
  toggleMute: () => void;
  playHit: () => void;
  playSuccess: () => void;
  playSlotSpin: () => void;
  playSlotStop: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  backgroundMusic: null,
  hitSound: null,
  successSound: null,
  spinningSound: null,
  spinStopTimer: null,
  isMuted: true, // Start muted by default
  
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  setHitSound: (sound) => set({ hitSound: sound }),
  setSuccessSound: (sound) => set({ successSound: sound }),
  
  toggleMute: () => {
    const { isMuted } = get();
    const newMutedState = !isMuted;
    
    // Just update the muted state
    set({ isMuted: newMutedState });
    
    // Log the change
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
  },
  
  playHit: () => {
    const { hitSound, isMuted } = get();
    if (hitSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Hit sound skipped (muted)");
        return;
      }
      
      // Clone the sound to allow overlapping playback
      const soundClone = hitSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.3;
      soundClone.play().catch(error => {
        console.log("Hit sound play prevented:", error);
      });
    }
  },
  
  playSuccess: () => {
    const { successSound, isMuted } = get();
    if (successSound && !isMuted) {
      successSound.volume = 0.7; // Lautstärke einstellen
      successSound.currentTime = 0;
      successSound.play().catch(error => {
        console.log("Success sound play prevented:", error);
      });
    }
  },
  
  playSlotSpin: () => {
    const { backgroundMusic, isMuted, spinStopTimer } = get();
    
    // Lösche vorherigen Timer falls vorhanden
    if (spinStopTimer) {
      clearTimeout(spinStopTimer);
      set({ spinStopTimer: null });
    }
    
    if (backgroundMusic && !isMuted) {
      // Erstelle einen kontinuierlichen Spin-Sound aus der Hintergrundmusik
      const spinSound = backgroundMusic.cloneNode() as HTMLAudioElement;
      spinSound.volume = 0.15; // Leiser für Hintergrund-Effekt
      spinSound.playbackRate = 2.0; // Doppelte Geschwindigkeit für Maschinen-Effekt
      spinSound.loop = true; // Kontinuierlich wiederholen
      spinSound.play().catch(error => {
        console.log("Slot spin sound play prevented:", error);
      });
      
      // Speichere Referenz zum Stoppen
      set({ spinningSound: spinSound });
    }
  },
  
  playSlotStop: () => {
    const { hitSound, spinningSound, isMuted, spinStopTimer } = get();
    
    // Spiele den Stop-Sound sofort
    if (hitSound && !isMuted) {
      // Doppelter "Stopp" Sound für hörbareren Effekt
      const soundClone1 = hitSound.cloneNode() as HTMLAudioElement;
      soundClone1.volume = 0.6; // Lauter
      soundClone1.playbackRate = 0.8; // Langsamer, tiefer
      soundClone1.play().catch(error => {
        console.log("Slot stop sound play prevented:", error);
      });
      
      // Zweiter Sound nach kurzer Verzögerung
      setTimeout(() => {
        const soundClone2 = hitSound.cloneNode() as HTMLAudioElement;
        soundClone2.volume = 0.4;
        soundClone2.playbackRate = 1.2; // Höher für "Klick" Effekt
        soundClone2.play().catch(error => {
          console.log("Slot stop sound 2 play prevented:", error);
        });
      }, 100);
    }
    
    // Stoppe den kontinuierlichen Spin-Sound erst nach 2 Sekunden, aber nur einmal
    if (spinningSound && !spinStopTimer) {
      const timer = setTimeout(() => {
        const { spinningSound: currentSpinningSound } = get();
        if (currentSpinningSound) {
          currentSpinningSound.pause();
          currentSpinningSound.currentTime = 0;
          set({ spinningSound: null, spinStopTimer: null });
        }
      }, 2000); // 2 Sekunden Verzögerung
      
      set({ spinStopTimer: timer });
    }
  }
}));
