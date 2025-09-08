import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/stores/useAuth";

// Bauteil-Typen für den Schlossgarten
type BuildingPart = {
  id: string;
  name: string;
  type: 'grass' | 'path' | 'hedge' | 'tree' | 'statue' | 'fountain';
  cost: number;
  image: string;
  rotation: number; // 0, 90, 180, 270 Grad
};

// Grid-Feld-Typ
type GridField = {
  x: number;
  y: number;
  buildingPart: BuildingPart | null;
};

// Bienen-Typ
type Bee = {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  startTime: number;
  flightDistance: number;
};

export const CastleGardenView: React.FC = () => {
  const { user } = useAuth();
  
  // 25x15 Grid (375 Felder total)
  const gridWidth = 25;
  const gridHeight = 15;
  
  // Initialisiere das Grid mit leeren Rasenfeldern
  const [grid, setGrid] = useState<GridField[]>(() => {
    const initialGrid: GridField[] = [];
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        initialGrid.push({
          x,
          y,
          buildingPart: null // Anfangs alles leer (Rasen)
        });
      }
    }
    return initialGrid;
  });

  // Bienen State
  const [bees, setBees] = useState<Bee[]>([]);
  const [hearts, setHearts] = useState<Array<{id: string; x: number; y: number; amount: number}>>([]);

  // Verfügbare Bauteile (werden später über Credits freigeschaltet)
  const availableParts: BuildingPart[] = [
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
    }
  ];

  // Drag & Drop State
  const [draggedPart, setDraggedPart] = useState<BuildingPart | null>(null);

  // Drag Start Handler für Bauteile
  const handleDragStart = (event: React.DragEvent, part: BuildingPart) => {
    setDraggedPart(part);
    event.dataTransfer.setData('text/plain', part.id);
    event.dataTransfer.effectAllowed = 'copy';
  };

  // Drop Handler für Grid-Felder
  const handleDrop = (event: React.DragEvent, field: GridField) => {
    event.preventDefault();
    
    if (draggedPart) {
      const fieldIndex = field.y * gridWidth + field.x;
      const newGrid = [...grid];
      newGrid[fieldIndex] = {
        ...field,
        buildingPart: { ...draggedPart }
      };
      setGrid(newGrid);
      // Bauteil bleibt ausgewählt für mehrfache Verwendung
    }
  };

  // Drag Over Handler
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  // Grid-Feld Klick Handler (für Löschen)
  const handleFieldClick = (field: GridField) => {
    if (field.buildingPart) {
      // Belegtes Feld - Bauteil löschen
      const fieldIndex = field.y * gridWidth + field.x;
      const newGrid = [...grid];
      newGrid[fieldIndex] = {
        ...field,
        buildingPart: null
      };
      setGrid(newGrid);
    }
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

  // Zufällige Bienen spawnen
  const spawnRandomBee = () => {
    const startX = Math.floor(Math.random() * gridWidth);
    const startY = Math.floor(Math.random() * gridHeight);
    const targetX = Math.floor(Math.random() * gridWidth);
    const targetY = Math.floor(Math.random() * gridHeight);
    
    const distance = Math.sqrt(Math.pow(targetX - startX, 2) + Math.pow(targetY - startY, 2));
    
    const newBee: Bee = {
      id: `bee-${Date.now()}`,
      x: startX,
      y: startY,
      targetX,
      targetY,
      startTime: Date.now(),
      flightDistance: distance
    };
    
    setBees(prev => [...prev, newBee]);
    
    // Biene nach 3 Sekunden entfernen und Herzen spawnen
    setTimeout(() => {
      setBees(prev => prev.filter(bee => bee.id !== newBee.id));
      
      // Herzen basierend auf Flugstrecke (1-5 Stück)
      const heartAmount = Math.min(5, Math.max(1, Math.floor(distance / 3) + 1));
      
      const newHeart = {
        id: `heart-${Date.now()}`,
        x: targetX,
        y: targetY,
        amount: heartAmount
      };
      
      setHearts(prev => [...prev, newHeart]);
      
      // Herz nach 5 Sekunden automatisch entfernen
      setTimeout(() => {
        setHearts(prev => prev.filter(heart => heart.id !== newHeart.id));
      }, 5000);
    }, 3000);
  };

  // Bienen-Spawn Timer (alle 10-20 Sekunden)
  React.useEffect(() => {
    const spawnInterval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% Chance alle 10 Sekunden
        spawnRandomBee();
      }
    }, 10000);
    
    return () => clearInterval(spawnInterval);
  }, []);

  // Herz sammeln
  const collectHeart = (heartId: string, amount: number) => {
    setHearts(prev => prev.filter(heart => heart.id !== heartId));
    // Hier könnte Credits/DNA/etc. vergeben werden
    console.log(`💖 ${amount} Herzen gesammelt!`);
  };

  if (!user) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6">
            <p>Bitte melde dich an, um den Schlossgarten zu besuchen.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full bg-green-50 overflow-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-100 to-yellow-100 p-4 border-b border-amber-200">
        <h1 className="text-2xl font-bold text-amber-800 mb-2">🏰 Schlossgarten</h1>
        <p className="text-amber-700">Gestalte deinen eigenen königlichen Garten!</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Garten-Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-slate-800">🏰 Dein Schlossgarten (25x15)</CardTitle>
            <p className="text-sm text-slate-600">Ziehe Bauteile aus der Palette ins Grid • Linksklick = Löschen • Rechtsklick = Drehen</p>
          </CardHeader>
          <CardContent>
            <div className="relative mx-auto w-fit border-2 border-amber-300 bg-green-100 overflow-hidden">
              <div 
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${gridWidth}, 40px)`,
                  gridTemplateRows: `repeat(${gridHeight}, 40px)`,
                  gap: '0px' // Kein Gap zwischen den Feldern
                }}
              >
                {grid.map((field, index) => (
                  <div
                    key={index}
                    className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-amber-400 transition-all relative"
                    onClick={() => handleFieldClick(field)}
                    onContextMenu={(e) => handleFieldRightClick(e, field)}
                    onDrop={(e) => handleDrop(e, field)}
                    onDragOver={handleDragOver}
                    style={{
                      backgroundColor: field.buildingPart ? 'transparent' : '#86efac',
                      backgroundImage: field.buildingPart ? `url(${field.buildingPart.image})` : 'url(/Landschaft/gras.png)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      transform: field.buildingPart ? `rotate(${field.buildingPart.rotation}deg)` : undefined
                    }}
                  >
                    {/* Bienen anzeigen */}
                    {bees.filter(bee => Math.floor(bee.x) === field.x && Math.floor(bee.y) === field.y).map(bee => (
                      <div
                        key={bee.id}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none animate-bounce"
                      >
                        🐝
                      </div>
                    ))}
                    
                    {/* Herzen anzeigen */}
                    {hearts.filter(heart => heart.x === field.x && heart.y === field.y).map(heart => (
                      <div
                        key={heart.id}
                        className="absolute inset-0 flex items-center justify-center cursor-pointer animate-pulse"
                        onClick={(e) => {
                          e.stopPropagation();
                          collectHeart(heart.id, heart.amount);
                        }}
                      >
                        <div className="bg-pink-100 rounded-full px-1 text-xs font-bold">
                          💖{heart.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bauteile-Palette */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-slate-800">🧱 Bauteile-Palette</CardTitle>
            <p className="text-sm text-slate-600">Klicke und ziehe Bauteile ins Grid - Mehrfachverwendung möglich!</p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {availableParts.map((part) => (
                <div
                  key={part.id}
                  className={`flex-shrink-0 w-24 h-24 border-2 rounded-lg cursor-grab active:cursor-grabbing transition-all ${
                    draggedPart?.id === part.id 
                      ? 'border-amber-400 bg-amber-100 ring-2 ring-amber-300' 
                      : 'border-slate-300 hover:border-amber-300 hover:shadow-md'
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, part)}
                  onClick={() => setDraggedPart(part)}
                  style={{
                    backgroundImage: `url(${part.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="w-full h-full bg-gradient-to-t from-black/60 to-transparent rounded-lg flex flex-col justify-between p-2">
                    <div className="text-xs text-white font-bold bg-black/50 rounded px-1">
                      {part.cost > 0 ? `${part.cost}💰` : 'Frei'}
                    </div>
                    <div className="text-xs text-white font-bold text-center bg-black/50 rounded px-1">
                      {part.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {draggedPart && (
              <div className="mt-3 p-3 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg border border-amber-300">
                <p className="text-sm text-amber-800 font-medium">
                  🎯 <strong>{draggedPart.name}</strong> ausgewählt - Ziehe es ins Grid oder klicke auf ein Feld!
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  💡 Du kannst dasselbe Bauteil mehrmals verwenden, ohne es neu auszuwählen
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bienen-Status */}
        <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-lg text-amber-800">🐝 Bienen-System (AKTIV!)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2 text-amber-700">📊 Aktuelle Stats:</h4>
                <ul className="space-y-1 text-amber-600">
                  <li>• Aktive Bienen: {bees.length}</li>
                  <li>• Verfügbare Herzen: {hearts.length}</li>
                  <li>• Spawn-Chance: 30% alle 10s</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-amber-700">💖 Herzen-System:</h4>
                <ul className="space-y-1 text-amber-600">
                  <li>• 1-5 Herzen je Flugstrecke</li>
                  <li>• Verschwinden nach 5 Sekunden</li>
                  <li>• Klicken zum Sammeln</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 flex gap-2">
              <Button 
                size="sm" 
                onClick={spawnRandomBee}
                className="bg-amber-600 hover:bg-amber-700"
              >
                🐝 Test-Biene spawnen
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setBees([]);
                  setHearts([]);
                }}
              >
                🧹 Alles leeren
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Kommende Features */}
        <Card className="border-dashed border-slate-300">
          <CardHeader>
            <CardTitle className="text-lg text-slate-600">🚧 Bald verfügbar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
              <div>
                <h4 className="font-semibold mb-2">💰 Shop-System:</h4>
                <ul className="space-y-1">
                  <li>• Credits für Bauteile ausgeben</li>
                  <li>• Bauteile freischalten</li>
                  <li>• Preis-Anzeige im Shop</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🛒 Erweiterte Bauteile:</h4>
                <ul className="space-y-1">
                  <li>• Hecken & Formschnitt</li>
                  <li>• Statuen & Skulpturen</li>
                  <li>• Springbrunnen</li>
                  <li>• Blumenbeete</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};