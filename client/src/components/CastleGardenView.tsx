import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/lib/stores/useAuth";
import { useCredits } from "@/lib/stores/useCredits";
import { toast } from "sonner";
import { Heart, Coins } from "lucide-react";

type BuildingPart = {
  id: string;
  name: string;
  type: string;
  cost: number;
  image: string;
  rotation: number;
};

type GridField = {
  x: number;
  y: number;
  buildingPart: BuildingPart | null;
};

// Bienen-Typ mit Animation
type Bee = {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  duration: number; // Flugdauer in ms
};

// Konfetti-Herz-Typ
type ConfettiHeart = {
  id: string;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  scale: number;
  opacity: number;
  velocity: { x: number; y: number };
  startTime: number;
};

// Herzen-Anzahl-Text-Typ
type HeartCountText = {
  id: string;
  x: number;
  y: number;
  amount: number;
  startTime: number;
  opacity: number;
};

export const CastleGardenView: React.FC = () => {
  const { user } = useAuth();
  const { credits, setCredits } = useCredits();

  // Grid-Dimensionen
  const gridWidth = 25;
  const gridHeight = 15;

  // Shop State
  const [showShopDialog, setShowShopDialog] = useState(false);
  const [selectedShopField, setSelectedShopField] = useState<GridField | null>(null);
  const [unlockedParts, setUnlockedParts] = useState<string[]>(['grass', 'stone_path']);

  // Grid State
  const [grid, setGrid] = useState<GridField[]>(() => {
    const newGrid: GridField[] = [];
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        newGrid.push({
          x,
          y,
          buildingPart: null
        });
      }
    }
    return newGrid;
  });

  // Bienen State
  const [bees, setBees] = useState<Bee[]>([]);
  const [confettiHearts, setConfettiHearts] = useState<ConfettiHeart[]>([]);
  const [heartCountTexts, setHeartCountTexts] = useState<HeartCountText[]>([]);
  const animationFrameRef = useRef<number>();

  // Drag & Drop State mit Feld-zu-Feld Support
  const [draggedPart, setDraggedPart] = useState<BuildingPart | null>(null);
  const [draggedFromField, setDraggedFromField] = useState<GridField | null>(null);

  // Verfügbare Bauteile
  const allParts: BuildingPart[] = [
    {
      id: 'grass',
      name: 'Rasen',
      type: 'grass',
      cost: 0,
      image: '/Landschaft/gras.png',
      rotation: 0
    },
    {
      id: 'stone_path',
      name: 'Steinweg',
      type: 'path',
      cost: 5,
      image: '/textures/asphalt.png',
      rotation: 0
    },
    {
      id: 'wooden_path',
      name: 'Holzweg',
      type: 'path',
      cost: 3,
      image: '/textures/wood.jpg',
      rotation: 0
    },
    {
      id: 'hedge',
      name: 'Hecke',
      type: 'hedge',
      cost: 8,
      image: '/Landschaft/baum.png',
      rotation: 0
    },
    {
      id: 'tree',
      name: 'Baum',
      type: 'tree',
      cost: 12,
      image: '/Landschaft/baum.png',
      rotation: 0
    },
    {
      id: 'statue',
      name: 'Statue',
      type: 'statue',
      cost: 25,
      image: '/textures/asphalt.png',
      rotation: 0
    }
  ];
  
  // Nur freigeschaltete Bauteile anzeigen
  const availableParts = allParts.filter(part => unlockedParts.includes(part.id));

  // Drag Start Handler für Bauteile
  const handleDragStart = (event: React.DragEvent, part: BuildingPart) => {
    setDraggedPart(part);
    setDraggedFromField(null); // Reset field drag
    event.dataTransfer.setData('text/plain', part.id);
    event.dataTransfer.effectAllowed = 'copy';
  };

  // Drag Start Handler für Felder (Drag zwischen Feldern)
  const handleFieldDragStart = (event: React.DragEvent, field: GridField) => {
    if (field.buildingPart) {
      setDraggedPart(field.buildingPart);
      setDraggedFromField(field);
      event.dataTransfer.setData('text/plain', field.buildingPart.id);
      event.dataTransfer.effectAllowed = 'move';
    }
  };

  // Drop Handler für Grid-Felder
  const handleDrop = (event: React.DragEvent, field: GridField) => {
    event.preventDefault();
    
    if (draggedPart) {
      const fieldIndex = field.y * gridWidth + field.x;
      const newGrid = [...grid];
      
      // Wenn von einem Feld gedraggt wurde, das ursprüngliche Feld leeren
      if (draggedFromField) {
        const fromIndex = draggedFromField.y * gridWidth + draggedFromField.x;
        newGrid[fromIndex] = {
          ...draggedFromField,
          buildingPart: null
        };
      }
      
      // Bauteil am Zielfeld platzieren
      newGrid[fieldIndex] = {
        ...field,
        buildingPart: { ...draggedPart }
      };
      setGrid(newGrid);
      
      // Reset drag state
      if (draggedFromField) {
        setDraggedFromField(null);
        setDraggedPart(null);
      }
    }
  };

  // Drag Over Handler
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = draggedFromField ? 'move' : 'copy';
  };

  // Grid-Feld Klick Handler
  const handleFieldClick = (field: GridField) => {
    if (field.buildingPart) {
      // Belegtes Feld - Bauteil löschen (nur wenn nicht gedraggt wurde)
      if (!draggedFromField) {
        const fieldIndex = field.y * gridWidth + field.x;
        const newGrid = [...grid];
        newGrid[fieldIndex] = {
          ...field,
          buildingPart: null
        };
        setGrid(newGrid);
      }
    } else {
      // Leeres Feld - Shop öffnen oder Bauteil platzieren
      if (draggedPart && !draggedFromField) {
        // Bauteil aus Palette platzieren
        const fieldIndex = field.y * gridWidth + field.x;
        const newGrid = [...grid];
        newGrid[fieldIndex] = {
          ...field,
          buildingPart: { ...draggedPart }
        };
        setGrid(newGrid);
      } else if (!draggedPart) {
        // Shop öffnen
        setSelectedShopField(field);
        setShowShopDialog(true);
      }
    }
    
    // Reset drag state
    setDraggedFromField(null);
  };

  // Bauteil rotieren (Rechtsklick)
  const handleFieldRightClick = (event: React.MouseEvent, field: GridField) => {
    event.preventDefault();
    
    if (field.buildingPart) {
      const fieldIndex = field.y * gridWidth + field.x;
      const newGrid = [...grid];
      newGrid[fieldIndex] = {
        ...field,
        buildingPart: {
          ...field.buildingPart,
          rotation: (field.buildingPart.rotation + 90) % 360
        }
      };
      setGrid(newGrid);
    }
  };

  // Intelligente Bienen spawnen mit Animation
  const spawnRandomBee = () => {
    // Finde alle Felder mit Bauteilen (außer Rasen)
    const fieldsWithParts = grid.filter(field => field.buildingPart && field.buildingPart.type !== 'grass');
    
    if (fieldsWithParts.length < 2) {
      console.log('🐝 Nicht genug Bauteile für Bienen-Flug (mindestens 2 benötigt)');
      return;
    }
    
    // Zufälliges Start- und Zielfeld aus gesetzten Bauteilen
    const startField = fieldsWithParts[Math.floor(Math.random() * fieldsWithParts.length)];
    const possibleTargets = fieldsWithParts.filter(f => f !== startField);
    const targetField = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
    
    const distance = Math.sqrt(
      Math.pow(targetField.x - startField.x, 2) + Math.pow(targetField.y - startField.y, 2)
    );
    
    const flightDuration = Math.max(4000, distance * 1000); // Noch langsamerer Flug für flüssige Animation
    
    const newBee: Bee = {
      id: `bee-${Date.now()}`,
      startX: startField.x * 56 + 28, // Pixelkoordinaten mit Feldmitte
      startY: startField.y * 56 + 28,
      targetX: targetField.x * 56 + 28,
      targetY: targetField.y * 56 + 28,
      currentX: startField.x * 56 + 28,
      currentY: startField.y * 56 + 28,
      startTime: Date.now(),
      duration: flightDuration
    };
    
    setBees(prev => [...prev, newBee]);
    
    // Biene nach Flugdauer entfernen und Konfetti-Herzen spawnen
    setTimeout(() => {
      setBees(prev => prev.filter(bee => bee.id !== newBee.id));
      
      // Herzen basierend auf Flugstrecke UND Bauteil-Wert
      const targetPart = targetField.buildingPart!;
      const partValue = targetPart.cost || 1;
      const distanceBonus = Math.floor(distance / 3);
      const heartAmount = Math.min(5, Math.max(1, partValue + distanceBonus));
      
      // Ein großes Herz spawnen + Anzahl-Text
      spawnSingleHeart(targetField.x, targetField.y, heartAmount);
      
      // Herzen ins Inventar hinzufügen
      setCredits(credits + heartAmount);
      toast.success(`💖 ${heartAmount} Herzen gesammelt! (+${heartAmount} Credits)`);
      
      console.log(`🐝 Biene geflogen: ${distance.toFixed(1)} Felder, Bauteil-Wert: ${partValue}, ${heartAmount} Herzen!`);
    }, flightDuration);
  };

  // Einzelnes großes Herz + Anzahl-Text spawnen
  const spawnSingleHeart = (centerX: number, centerY: number, amount: number) => {
    // Ein großes Herz
    const newHeart: ConfettiHeart = {
      id: `heart-${Date.now()}`,
      x: centerX,
      y: centerY,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      scale: 2.5, // Größeres Herz
      opacity: 1,
      velocity: {
        x: 0,
        y: -1 // Viel langsamere Aufwärtsbewegung
      },
      startTime: Date.now()
    };
    
    // Anzahl-Text
    const newText: HeartCountText = {
      id: `text-${Date.now()}`,
      x: centerX,
      y: centerY,
      amount,
      startTime: Date.now(),
      opacity: 1
    };
    
    setConfettiHearts(prev => [...prev, newHeart]);
    setHeartCountTexts(prev => [...prev, newText]);
    
    // Herz nach 8 Sekunden entfernen (doppelt so lang)
    setTimeout(() => {
      setConfettiHearts(prev => prev.filter(heart => heart.id !== newHeart.id));
    }, 8000);
    
    // Text nach 4 Sekunden entfernen (doppelt so lang)
    setTimeout(() => {
      setHeartCountTexts(prev => prev.filter(text => text.id !== newText.id));
    }, 4000);
  };

  // Animation Loop für Bienen
  useEffect(() => {
    const animate = () => {
      setBees(prevBees => 
        prevBees.map(bee => {
          const elapsed = Date.now() - bee.startTime;
          const progress = Math.min(elapsed / bee.duration, 1);
          
          // Sanfte Bewegung mit easing
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          
          const newX = bee.startX + (bee.targetX - bee.startX) * easeProgress;
          const newY = bee.startY + (bee.targetY - bee.startY) * easeProgress;
          
          return {
            ...bee,
            currentX: newX,
            currentY: newY
          };
        })
      );
      
      // Einzelnes Herz animieren (viel langsamer)
      setConfettiHearts(prevHearts =>
        prevHearts.map(heart => {
          const elapsed = Date.now() - heart.startTime;
          const progress = elapsed / 8000; // 8 Sekunden Animation (doppelt so lang)
          
          // Viel langsamere Aufwärtsbewegung
          const newOffsetY = heart.offsetY + heart.velocity.y * 0.3; // 70% langsamer
          
          return {
            ...heart,
            offsetY: newOffsetY,
            opacity: Math.max(0, 1 - progress * 0.6), // Viel langsameres Ausblenden
            scale: heart.scale * (1 - progress * 0.1) // Minimales Schrumpfen
          };
        })
      );
      
      // Anzahl-Text animieren (langsamer)
      setHeartCountTexts(prevTexts =>
        prevTexts.map(text => {
          const elapsed = Date.now() - text.startTime;
          const progress = elapsed / 4000; // 4 Sekunden Animation (doppelt so lang)
          
          return {
            ...text,
            opacity: Math.max(0, 1 - progress * 0.7) // Langsameres Ausblenden
          };
        })
      );
      
      // Solange Animationen laufen, weiter animieren
      if (bees.length > 0 || confettiHearts.length > 0 || heartCountTexts.length > 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    
    // Animation starten wenn Objekte da sind
    if ((bees.length > 0 || confettiHearts.length > 0 || heartCountTexts.length > 0) && !animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [bees, confettiHearts, heartCountTexts]);  // Abhängig von allen Animationen

  // Bienen-Spawn Timer (alle 10 Sekunden)
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% Chance alle 10 Sekunden
        spawnRandomBee();
      }
    }, 10000);
    
    return () => clearInterval(spawnInterval);
  }, [grid, credits]); // Abhängig vom Grid und Credits

  // Bauteil freischalten
  const unlockPart = async (partId: string, cost: number) => {
    if (credits >= cost && !unlockedParts.includes(partId)) {
      try {
        // Credits abziehen
        const response = await fetch(`/api/user/${user?.id}/credits`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: -cost })
        });

        if (response.ok) {
          setCredits(credits - cost);
          setUnlockedParts(prev => [...prev, partId]);
          setShowShopDialog(false);
          toast.success(`🔓 ${allParts.find(p => p.id === partId)?.name} freigeschaltet!`);
          console.log(`🔓 Bauteil ${partId} für ${cost} Credits freigeschaltet!`);
        }
      } catch (error) {
        console.error('Fehler beim Freischalten:', error);
      }
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardContent className="pt-6">
            <p className="text-center text-slate-400">Bitte melde dich an, um den Schlossgarten zu betreten</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-900 overflow-auto">
      {/* Header im App-Stil */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <h1 className="text-2xl font-bold text-white mb-2">🏰 Schlossgarten</h1>
        <p className="text-slate-300">Gestalte deinen eigenen königlichen Garten!</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Bauteile-Palette über dem Grid */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-white">🧱 Freigeschaltete Bauteile</CardTitle>
            <p className="text-sm text-slate-400">
              <span className="text-green-400 font-medium">{availableParts.length}/{allParts.length}</span> freigeschaltet • Ziehe ins Grid unten
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {availableParts.map((part) => (
                <div
                  key={part.id}
                  className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg cursor-grab active:cursor-grabbing transition-all ${
                    draggedPart?.id === part.id 
                      ? 'border-green-400 bg-green-900/30 scale-105' 
                      : 'border-slate-600 hover:border-green-500 hover:shadow-lg'
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, part)}
                  onClick={() => setDraggedPart(part)}
                  style={{
                    backgroundImage: `url(${part.image})`,
                    backgroundSize: '120%',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="w-full h-full bg-gradient-to-t from-black/70 to-transparent rounded-lg flex flex-col justify-between p-1">
                    <div className="text-xs text-white font-bold bg-black/60 rounded px-1">
                      {part.cost > 0 ? `${part.cost}💰` : '🆓'}
                    </div>
                    <div className="text-xs text-white font-bold text-center bg-black/60 rounded px-1">
                      {part.name}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Mehr Bauteile freischalten */}
              {allParts.length > availableParts.length && (
                <div
                  className="flex-shrink-0 w-20 h-20 border-2 border-dashed border-green-400 rounded-lg cursor-pointer hover:border-green-300 hover:bg-green-900/20 transition-all flex flex-col items-center justify-center gap-1"
                  onClick={() => setShowShopDialog(true)}
                >
                  <div className="text-lg">🛒</div>
                  <div className="text-xs text-green-400 font-bold text-center">
                    Mehr
                  </div>
                </div>
              )}
            </div>
            
            {draggedPart && (
              <div className="mt-3 p-2 bg-green-900/30 rounded border border-green-700">
                <p className="text-sm text-green-300 font-medium">
                  🎯 <strong>{draggedPart.name}</strong> ausgewählt - Ziehe ins Grid oder klicke ein Feld
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Garten-Grid */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-white">🏰 Dein Schlossgarten (25x15)</CardTitle>
            <p className="text-sm text-slate-400">
              🖱️ Drag & Drop zwischen Feldern • 🛒 Leeres Feld = Shop • 🔄 Rechtsklick = Drehen • 🗑️ Linksklick = Löschen
            </p>
          </CardHeader>
          <CardContent>
            <div className="relative mx-auto w-fit border-2 border-slate-600 bg-slate-700 overflow-visible rounded-lg">
              <div 
                className="grid relative"
                style={{
                  gridTemplateColumns: `repeat(${gridWidth}, 56px)`, // Große Felder
                  gridTemplateRows: `repeat(${gridHeight}, 56px)`,
                  gap: '0px'
                }}
              >
                {grid.map((field, index) => (
                  <div
                    key={index}
                    className="w-14 h-14 cursor-pointer hover:ring-2 hover:ring-green-400 transition-all relative select-none"
                    onClick={() => handleFieldClick(field)}
                    onContextMenu={(e) => handleFieldRightClick(e, field)}
                    onDrop={(e) => handleDrop(e, field)}
                    onDragOver={handleDragOver}
                    onDragStart={(e) => handleFieldDragStart(e, field)}
                    draggable={!!field.buildingPart}
                    style={{
                      backgroundColor: field.buildingPart ? 'transparent' : '#475569',
                      backgroundImage: field.buildingPart ? `url(${field.buildingPart.image})` : 'url(/Landschaft/gras.png)',
                      backgroundSize: field.buildingPart ? '130%' : 'cover', // Bauteile größer
                      backgroundPosition: 'center',
                      transform: field.buildingPart ? `rotate(${field.buildingPart.rotation}deg)` : undefined
                    }}
                  >
                  </div>
                ))}
              </div>
              
              {/* Animationen über dem gesamten Grid */}
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 100 }}>
                {/* Bienen - absolut über dem gesamten Grid */}
                {bees.map(bee => (
                  <div
                    key={bee.id}
                    className="absolute pointer-events-none text-xl"
                    style={{
                      left: `${bee.currentX}px`,
                      top: `${bee.currentY}px`,
                      transform: 'translate(-50%, -50%)',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                      fontSize: '24px'
                    }}
                  >
                    🐝
                  </div>
                ))}
                
                {/* Herzen - absolut über dem gesamten Grid */}
                {confettiHearts.map(heart => (
                  <div
                    key={heart.id}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${heart.x * 56 + 28 + heart.offsetX}px`,
                      top: `${heart.y * 56 + 28 + heart.offsetY}px`,
                      transform: `scale(${heart.scale})`,
                      opacity: heart.opacity,
                      fontSize: '40px',
                      textShadow: '2px 2px 6px rgba(0,0,0,0.5)',
                      filter: `drop-shadow(0 0 12px rgba(255, 20, 147, ${heart.opacity * 0.8}))`
                    }}
                  >
                    💖
                  </div>
                ))}
                
                {/* Herzen-Anzahl-Text - absolut über dem gesamten Grid */}
                {heartCountTexts.map(text => (
                  <div
                    key={text.id}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${text.x * 56 + 28}px`,
                      top: `${text.y * 56 + 10}px`,
                      opacity: text.opacity,
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#fff',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      textAlign: 'center',
                      animation: 'pulse 0.5s ease-in-out',
                      transform: 'translate(-50%, 0)'
                    }}
                  >
                    +{text.amount}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bienen-System Status */}
        <Card className="bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border-amber-700">
          <CardHeader>
            <CardTitle className="text-lg text-amber-300">🐝 Intelligentes Bienen-Ökosystem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h3 className="font-medium text-amber-300 mb-1">📊 Live Stats:</h3>
                <ul className="space-y-1 text-amber-100">
                  <li>• Aktive Bienen: <strong>{bees.length}</strong></li>
                  <li>• Konfetti-Herzen: <strong>{confettiHearts.length}</strong></li>
                  <li>• Bauteile gesetzt: <strong>{grid.filter(f => f.buildingPart && f.buildingPart.type !== 'grass').length}</strong></li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-amber-300 mb-1">🎯 Bienen-Logik:</h3>
                <ul className="space-y-1 text-amber-100">
                  <li>• Spawnen nur auf Bauteilen</li>
                  <li>• Fliegen langsam sichtbar</li>
                  <li>• 30% Chance alle 10s</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-amber-300 mb-1">💖 Herzen-System:</h3>
                <ul className="space-y-1 text-amber-100">
                  <li>• Konfetti-Explosion</li>
                  <li>• Direkt ins Inventar</li>
                  <li>• 1-5 Herzen pro Flug</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 flex gap-2">
              <Button 
                size="sm" 
                onClick={spawnRandomBee}
                className="bg-amber-600 hover:bg-amber-700"
                disabled={grid.filter(f => f.buildingPart && f.buildingPart.type !== 'grass').length < 2}
              >
                🐝 Test-Biene
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="border-amber-600 text-amber-300 hover:bg-amber-900/20"
                onClick={() => {
                  setBees([]);
                  setConfettiHearts([]);
                }}
              >
                🧹 Reset
              </Button>
            </div>
            
            {grid.filter(f => f.buildingPart && f.buildingPart.type !== 'grass').length < 2 && (
              <div className="mt-3 p-2 bg-amber-900/30 rounded text-amber-200 text-xs text-center">
                💡 Platziere mindestens 2 Bauteile für Bienen-Aktivität
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Shop Dialog */}
      <Dialog open={showShopDialog} onOpenChange={setShowShopDialog}>
        <DialogContent className="max-w-md bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">🛒 Bauteil-Shop</DialogTitle>
            <DialogDescription className="text-slate-400">
              Schalte neue Bauteile mit deinen Credits frei
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {allParts.filter(part => !unlockedParts.includes(part.id)).map(part => (
              <div key={part.id} className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                <div 
                  className="w-12 h-12 rounded border border-slate-600"
                  style={{
                    backgroundImage: `url(${part.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{part.name}</h3>
                  <p className="text-xs text-slate-400">Typ: {part.type}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => unlockPart(part.id, part.cost)}
                  disabled={credits < part.cost}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600"
                >
                  {part.cost} 💰
                </Button>
              </div>
            ))}
            {allParts.filter(part => !unlockedParts.includes(part.id)).length === 0 && (
              <p className="text-center text-slate-400 py-4">
                🎉 Alle Bauteile bereits freigeschaltet!
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};