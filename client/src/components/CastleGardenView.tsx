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
  const [selectedPartForShop, setSelectedPartForShop] = useState<BuildingPart | null>(null);

  // Grid-Feld Klick Handler
  const handleFieldClick = (field: GridField) => {
    const fieldIndex = field.y * gridWidth + field.x;
    
    if (field.buildingPart === null) {
      // Leeres Feld - Shop öffnen oder Bauteil platzieren
      if (draggedPart) {
        // Bauteil platzieren
        const newGrid = [...grid];
        newGrid[fieldIndex] = {
          ...field,
          buildingPart: { ...draggedPart }
        };
        setGrid(newGrid);
        setDraggedPart(null);
      } else {
        // Shop öffnen
        setSelectedPartForShop(field.buildingPart);
      }
    } else {
      // Belegtes Feld - Bauteil löschen
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
            <CardTitle className="text-lg text-slate-800">Dein Schlossgarten</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="grid gap-1 mx-auto w-fit border-2 border-amber-300 p-2 bg-green-100"
              style={{
                gridTemplateColumns: `repeat(${gridWidth}, 1fr)`,
                gridTemplateRows: `repeat(${gridHeight}, 1fr)`
              }}
            >
              {grid.map((field, index) => (
                <div
                  key={index}
                  className="w-6 h-6 border border-green-300 cursor-pointer hover:border-amber-400 transition-colors relative"
                  onClick={() => handleFieldClick(field)}
                  onContextMenu={(e) => handleFieldRightClick(e, field)}
                  style={{
                    backgroundColor: field.buildingPart ? 'transparent' : '#86efac',
                    backgroundImage: field.buildingPart ? `url(${field.buildingPart.image})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transform: field.buildingPart ? `rotate(${field.buildingPart.rotation}deg)` : undefined
                  }}
                >
                  {/* Rasen-Pattern für leere Felder */}
                  {!field.buildingPart && (
                    <div className="w-full h-full bg-green-300 opacity-50" />
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-sm text-slate-600">
              <p>• Linksklick auf leeres Feld: Bauteil-Shop öffnen</p>
              <p>• Linksklick auf belegtes Feld: Bauteil entfernen</p>
              <p>• Rechtsklick auf Bauteil: Um 90° drehen</p>
            </div>
          </CardContent>
        </Card>

        {/* Bauteile-Palette */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-slate-800">Verfügbare Bauteile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {availableParts.map((part) => (
                <div
                  key={part.id}
                  className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg cursor-pointer transition-all ${
                    draggedPart?.id === part.id 
                      ? 'border-amber-400 bg-amber-100' 
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  onClick={() => setDraggedPart(part)}
                  style={{
                    backgroundImage: `url(${part.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="w-full h-full bg-black bg-opacity-20 rounded-lg flex items-end p-1">
                    <span className="text-xs text-white font-bold">
                      {part.cost > 0 ? `${part.cost}💰` : 'Frei'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {draggedPart && (
              <div className="mt-2 p-2 bg-amber-100 rounded border border-amber-300">
                <p className="text-sm text-amber-800">
                  <strong>{draggedPart.name}</strong> ausgewählt - Klicke auf ein leeres Feld zum Platzieren
                </p>
              </div>
            )}
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
                <h4 className="font-semibold mb-2">🐝 Bienen-System:</h4>
                <ul className="space-y-1">
                  <li>• Zufällige Bienen-Spawns</li>
                  <li>• Flugstrecken-Berechnung</li>
                  <li>• Herzen sammeln (1-5 Stück)</li>
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