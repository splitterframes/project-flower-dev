import React, { useEffect, useState } from 'react';

interface HarvestAnimationProps {
  fieldIndex: number;
  onComplete: () => void;
}

export const HarvestAnimation: React.FC<HarvestAnimationProps> = ({ fieldIndex, onComplete }) => {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Auto-complete animation after 1.5 seconds
    const timer = setTimeout(() => {
      setIsAnimating(false);
      onComplete();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isAnimating) return null;

  // Generate random particle positions
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    delay: Math.random() * 0.3,
    direction: Math.random() * 360,
    distance: 40 + Math.random() * 20,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Success message */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div 
          className="bg-green-500 text-white px-3 py-1 rounded-lg font-bold text-sm shadow-lg animate-bounce"
          style={{ animationDuration: '0.6s' }}
        >
          +1 Blume!
        </div>
      </div>

      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 bg-orange-400 rounded-full opacity-80"
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) rotate(${particle.direction}deg) translateY(-${particle.distance}px) scale(0.3)`,
            transition: `all 1s ease-out ${particle.delay}s`,
            animation: `ping 1s ease-out ${particle.delay}s 1`,
            opacity: 0,
          }}
        />
      ))}

      {/* Sparkle effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-yellow-400 rounded-full animate-ping opacity-40" />
      </div>
    </div>
  );
};