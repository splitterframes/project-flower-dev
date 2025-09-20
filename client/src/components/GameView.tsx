import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/stores/useAuth";
import { useGame } from "@/lib/stores/useGame";
import { useAudio } from "@/lib/stores/useAudio";
import { Gamepad2, Volume2, VolumeX, Pause, Play } from "lucide-react";

// Define control keys for the game
const controls = [
  { name: "forward", keys: ["KeyW", "ArrowUp"] },
  { name: "backward", keys: ["KeyS", "ArrowDown"] },
  { name: "leftward", keys: ["KeyA", "ArrowLeft"] },
  { name: "rightward", keys: ["KeyD", "ArrowRight"] },
  { name: "action", keys: ["Space"] },
];

// Simple game scene component
const GameScene: React.FC = () => {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      
      {/* Simple ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      
      {/* Sample game object */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
    </>
  );
};

export const GameView: React.FC = () => {
  const { user } = useAuth();
  const { phase, start, restart } = useGame();
  const { toggleMute, isMuted } = useAudio();
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Reset game state when component mounts
    restart();
  }, [restart]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardContent className="pt-6">
            <p className="text-center text-slate-400">Please log in to play games</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStartGame = () => {
    start();
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Game Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Gamepad2 className="h-6 w-6 text-orange-400" />
            <h2 className="text-xl font-bold text-white">Game Arena</h2>
            <span className="text-sm text-slate-400">Phase: {phase}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMute}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            
            {phase === "playing" && (
              <Button
                variant="outline"
                size="sm"
                onClick={togglePause}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Game Content */}
      <div className="flex-1 relative">
        {phase === "ready" && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Card className="bg-slate-800 border-slate-700 text-white">
              <CardHeader>
                <CardTitle className="text-center">Ready to Play?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-slate-400">
                  Use WASD or arrow keys to move, Space for action
                </p>
                <Button 
                  onClick={handleStartGame}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  Start Game
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {phase === "ended" && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Card className="bg-slate-800 border-slate-700 text-white">
              <CardHeader>
                <CardTitle className="text-center">Game Over</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-slate-400">
                  Good game! Ready for another round?
                </p>
                <Button 
                  onClick={restart}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  Play Again
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 3D Game Canvas */}
        <KeyboardControls map={controls}>
          <Canvas
            shadows
            camera={{
              position: [0, 5, 10],
              fov: 45,
              near: 0.1,
              far: 1000
            }}
            gl={{
              antialias: true,
              powerPreference: "default"
            }}
            style={{ 
              opacity: isPaused ? 0.5 : 1,
              transition: 'opacity 0.3s ease'
            }}
          >
            <color attach="background" args={["#1e293b"]} />
            <GameScene />
          </Canvas>
        </KeyboardControls>
      </div>

      {/* Game Instructions */}
      <div className="bg-slate-800 border-t border-slate-700 p-2">
        <div className="flex justify-center space-x-6 text-sm text-slate-400">
          <span>WASD/Arrows: Move</span>
          <span>Space: Action</span>
          <span>ESC: Pause</span>
        </div>
      </div>
    </div>
  );
};
