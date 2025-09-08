import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/lib/stores/useAuth";
import { useCredits } from "@/lib/stores/useCredits";

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
  
  // Shop State
  const [showShopDialog, setShowShopDialog] = useState(false);
  const [selectedShopField, setSelectedShopField] = useState<GridField | null>(null);
  
  // Freigeschaltete Bauteile
  const [unlockedParts, setUnlockedParts] = useState<string[]>(['grass', 'stone_path', 'wooden_path']);
  
  // Credits Hook
  const { credits, setCredits } = useCredits();

  // Alle verfügbaren Bauteile (Shop-System)
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

  // Drag & Drop State
  const [draggedPart, setDraggedPart] = useState<BuildingPart | null>(null);
  const [draggedFromField, setDraggedFromField] = useState<GridField | null>(null);

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
      
      // Reset drag state wenn von Feld gedraggt
      if (draggedFromField) {
        setDraggedFromField(null);
        setDraggedPart(null);
      }
    }
  };

  // Drag Over Handler
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  // Grid-Feld Mouse Down Handler (für Drag von Feldern)
  const handleFieldMouseDown = (event: React.MouseEvent, field: GridField) => {
    if (event.button === 0 && field.buildingPart) { // Linke Maustaste + Bauteil vorhanden
      setDraggedFromField(field);
      setDraggedPart(field.buildingPart);
      event.preventDefault();
    }
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
      // Leeres Feld - Shop öffnen
      if (!draggedPart) {
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

  // Intelligente Bienen spawnen (nur auf gesetzten Bauteilen)
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
    
    const newBee: Bee = {
      id: `bee-${Date.now()}`,
      x: startField.x,
      y: startField.y,
      targetX: targetField.x,
      targetY: targetField.y,
      startTime: Date.now(),
      flightDistance: distance
    };
    
    setBees(prev => [...prev, newBee]);
    
    // Biene nach 3 Sekunden entfernen und Herzen spawnen
    setTimeout(() => {
      setBees(prev => prev.filter(bee => bee.id !== newBee.id));
      
      // Herzen basierend auf Flugstrecke UND Bauteil-Wert
      const targetPart = targetField.buildingPart!;
      const partValue = targetPart.cost || 1;
      const distanceBonus = Math.floor(distance / 3);
      const heartAmount = Math.min(5, Math.max(1, partValue + distanceBonus));
      
      // Explosionsartige Herzen (mehrere kleine Herzen)
      const explosionHearts = [];
      for (let i = 0; i < heartAmount; i++) {
        explosionHearts.push({
          id: `heart-${Date.now()}-${i}`,
          x: targetField.x,
          y: targetField.y,
          amount: 1,
          delay: i * 100 // Gestaffeltes Erscheinen
        });
      }
      
      // Herzen mit Verzögerung hinzufügen
      explosionHearts.forEach((heart, index) => {
        setTimeout(() => {
          setHearts(prev => [...prev, heart]);
          
          // Herz nach 3 Sekunden automatisch entfernen
          setTimeout(() => {
            setHearts(prev => prev.filter(h => h.id !== heart.id));
          }, 3000);
        }, heart.delay);
      });
      
      console.log(`🐝 Biene geflogen: ${distance.toFixed(1)} Felder, Bauteil-Wert: ${partValue}, ${heartAmount} Herzen!`);
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
    // Credits vergeben
    setCredits(credits + amount);
    console.log(`💖 ${amount} Herzen gesammelt! +${amount} Credits`);
  };

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
          console.log(`🔓 Bauteil ${partId} für ${cost} Credits freigeschaltet!`);
        }
      } catch (error) {
        console.error('Fehler beim Freischalten:', error);
      }
    }
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
            <p className="text-sm text-slate-600">
              🖱️ Drag & Drop zwischen Feldern • 🛒 Leeres Feld = Shop • 🔄 Rechtsklick = Drehen • 🗑️ Linksklick = Löschen
            </p>
          </CardHeader>
          <CardContent>
            <div className="relative mx-auto w-fit border-2 border-amber-300 bg-green-100 overflow-hidden">
              <div 
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${gridWidth}, 48px)`, // Größer: 48px statt 40px
                  gridTemplateRows: `repeat(${gridHeight}, 48px)`,
                  gap: '0px'
                }}
              >
                {grid.map((field, index) => (
                  <div
                    key={index}
                    className="w-12 h-12 cursor-pointer hover:ring-2 hover:ring-amber-400 transition-all relative select-none"
                    onClick={() => handleFieldClick(field)}
                    onMouseDown={(e) => handleFieldMouseDown(e, field)}
                    onContextMenu={(e) => handleFieldRightClick(e, field)}
                    onDrop={(e) => handleDrop(e, field)}
                    onDragOver={handleDragOver}
                    style={{
                      backgroundColor: field.buildingPart ? 'transparent' : '#86efac',
                      backgroundImage: field.buildingPart ? `url(${field.buildingPart.image})` : 'url(/Landschaft/gras.png)',
                      backgroundSize: field.buildingPart ? '120%' : 'cover', // Bauteile größer darstellen
                      backgroundPosition: 'center',
                      transform: field.buildingPart ? `rotate(${field.buildingPart.rotation}deg)` : undefined
                    }}
                  >
                    {/* Bienen anzeigen */}
                    {bees.filter(bee => Math.floor(bee.x) === field.x && Math.floor(bee.y) === field.y).map(bee => (
                      <div
                        key={bee.id}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none animate-bounce text-lg"
                      >
                        🐝
                      </div>
                    ))}
                    
                    {/* Herzen anzeigen - Explosionseffekt */}
                    {hearts.filter(heart => heart.x === field.x && heart.y === field.y).map(heart => (
                      <div
                        key={heart.id}
                        className="absolute inset-0 flex items-center justify-center cursor-pointer animate-ping"
                        onClick={(e) => {
                          e.stopPropagation();
                          collectHeart(heart.id, heart.amount);
                        }}
                      >
                        <div className="bg-gradient-to-r from-pink-200 to-red-200 rounded-full px-2 py-1 text-sm font-bold border-2 border-pink-400 shadow-lg">
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

        {/* Shop Dialog */}
        <Dialog open={showShopDialog} onOpenChange={setShowShopDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>🛒 Bauteil-Shop</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Schalte neue Bauteile mit deinen Credits frei:
              </p>
              
              <div className="text-sm text-amber-700 bg-amber-50 p-2 rounded">
                💰 Verfügbare Credits: <strong>{credits}</strong>
              </div>
              
              <div className="grid gap-3">
                {allParts.filter(part => !unlockedParts.includes(part.id)).map((part) => (
                  <div
                    key={part.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 border rounded"
                        style={{
                          backgroundImage: `url(${part.image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                      <div>
                        <div className="font-medium">{part.name}</div>
                        <div className="text-xs text-slate-500">{part.type}</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => unlockPart(part.id, part.cost)}
                      disabled={credits < part.cost}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      {part.cost} 💰
                    </Button>
                  </div>
                ))}
                
                {allParts.filter(part => !unlockedParts.includes(part.id)).length === 0 && (
                  <div className="text-center text-slate-500 py-4">
                    🎉 Alle Bauteile bereits freigeschaltet!
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowShopDialog(false)}>
                  Schließen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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