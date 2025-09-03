import React, { useEffect } from "react";
import { Layout } from "./components/Layout";
import { Toaster } from "./components/ui/sonner";
import { NotificationDialog } from "./components/ui/NotificationDialog";
import { useAudio } from "./lib/stores/useAudio";
import { useNotification } from "./hooks/useNotification";
import "@fontsource/inter";

function App() {
  const { setBackgroundMusic, setHitSound, setSuccessSound } = useAudio();
  const { isOpen, message, type, title, closeNotification } = useNotification();

  // Initialize audio assets
  useEffect(() => {
    // Load background music
    const bgMusic = new Audio("/sounds/background.mp3");
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
    setBackgroundMusic(bgMusic);

    // Load sound effects
    const hitSfx = new Audio("/sounds/hit.mp3");
    hitSfx.volume = 0.5;
    setHitSound(hitSfx);

    const successSfx = new Audio("/sounds/success.mp3");
    successSfx.volume = 0.6;
    setSuccessSound(successSfx);
  }, [setBackgroundMusic, setHitSound, setSuccessSound]);

  return (
    <>
      <Layout />
      <Toaster />
      <NotificationDialog
        isOpen={isOpen}
        onClose={closeNotification}
        message={message}
        type={type}
        title={title}
      />
    </>
  );
}

export default App;
