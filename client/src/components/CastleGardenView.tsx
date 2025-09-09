import React, { useState, useEffect, useRef, useMemo } from "react";
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

export const CastleGardenView: React.FC = () => {
  const { user } = useAuth();
  const { credits, setCredits, updateCredits } = useCredits();
  
  // Update hearts in database
  const updateHearts = async (userId: number, amount: number) => {
    try {
      const response = await fetch(`/api/user/${userId}/hearts`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update hearts");
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to update hearts:', error);
      throw error;
    }
  };

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
  const animationFrameRef = useRef<number>();

  // Drag & Drop State mit Feld-zu-Feld Support
  const [draggedPart, setDraggedPart] = useState<BuildingPart | null>(null);
  const [draggedFromField, setDraggedFromField] = useState<GridField | null>(null);
  
  // Herzen State aus Datenbank (echte Werte wie in Rankings)
  const [databaseHearts, setDatabaseHearts] = useState(0);
  
  // Herzen aus Datenbank laden
  const fetchHearts = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`/api/user/${user.id}/hearts`);
      if (response.ok) {
        const data = await response.json();
        setDatabaseHearts(data.hearts || 0);
      }
    } catch (error) {
      console.error('Failed to fetch hearts:', error);
    }
  };
  
  // Herzen beim Component laden und periodisch aktualisieren
  useEffect(() => {
    fetchHearts();
    const interval = setInterval(fetchHearts, 5000); // Alle 5 Sekunden
    return () => clearInterval(interval);
  }, [user?.id]);

  // Balloon-Toggle State
  const [balloonsEnabled, setBalloonsEnabled] = useState(() => {
    const saved = localStorage.getItem('castle-balloons-enabled');
    return saved === null ? true : saved === 'true';
  });

  // Balloon-Toggle bei Änderung in localStorage speichern und globales Flag setzen
  useEffect(() => {
    localStorage.setItem('castle-balloons-enabled', balloonsEnabled.toString());
    // Globales Flag für Layout setzen (nur wenn im Schlossgarten)
    (window as any).balloonsDisabledInCastle = !balloonsEnabled;
  }, [balloonsEnabled]);

  // Dynamisches Laden der Bauteile aus Castle-Ordner
  const loadBuildingPartsFromCastle = (): BuildingPart[] => {
    // Bekannte Dateien aus Castle-Ordner (Name_Preis.jpg Format)
    const castleFiles = [
      'A_2300.jpg',
      'A_3500.jpg', 
      'A_4200.jpg',
      'A_5000.jpg',
      'Baum1_1550.jpg',
      'Bienenhaus_500.jpg',
      'Blumenfeld2_1000.jpg',
      'Blumenfeld_900.jpg',
      'Brücke_2300.jpg',
      'Haus_2960.jpg',
      'Irrgaten_750.jpg',
      'Statue_1850.jpg',
      'Steingarten_1250.jpg',
      'Steinweg_200.jpg'
    ];

    // Basis-Bauteile (immer verfügbar)
    const baseParts: BuildingPart[] = [
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
        name: 'Steinweg Basis',
        type: 'path',
        cost: 0,
        image: '/textures/asphalt.png',
        rotation: 0
      }
    ];

    // Castle-Bauteile aus Dateinamen parsen
    const castleParts: BuildingPart[] = castleFiles.map(filename => {
      const nameWithoutExt = filename.replace('.jpg', '');
      const parts = nameWithoutExt.split('_');
      const name = parts[0];
      const price = parseInt(parts[1], 10);
      
      return {
        id: filename.replace('.jpg', '').toLowerCase(),
        name: name,
        type: 'castle',
        cost: price,
        image: `/Castle/${filename}`,
        rotation: 0
      };
    });

    // Nach Preis sortieren (aufsteigend)
    castleParts.sort((a, b) => a.cost - b.cost);

    // Basis + Castle-Bauteile kombinieren
    return [...baseParts, ...castleParts];
  };

  // Verfügbare Bauteile
  const allParts: BuildingPart[] = loadBuildingPartsFromCastle();
  
  
  // Nur freigeschaltete Bauteile anzeigen
  const availableParts = allParts.filter(part => unlockedParts.includes(part.id));
  
  // Gesamtinvestition berechnen (ohne Standard-Teile)
  const totalInvestment = useMemo(() => {
    return availableParts
      .filter(part => part.cost > 0) // Nur kostenpflichtige Teile
      .reduce((sum, part) => sum + part.cost, 0);
  }, [availableParts]);
  
  // Herzen pro Stunde berechnen
  const heartsPerHour = useMemo(() => {
    const totalSpentCredits = unlockedParts.reduce((sum, partId) => {
      const part = allParts.find(p => p.id === partId);
      return sum + (part?.cost || 0);
    }, 0);
    
    const creditBonus = Math.floor(totalSpentCredits / 5000);
    const spawnInterval = Math.max(3000, 10000 - (creditBonus * 1000)); // Minimum 3 Sekunden
    const spawnChance = Math.min(0.9, 0.3 + (creditBonus * 0.1)); // Maximum 90%
    
    // Berechnung: Spawns pro Sekunde × 3600 Sekunden × durchschnittliche Herzen pro Biene
    const spawnsPerSecond = spawnChance / (spawnInterval / 1000);
    const averageHeartsPerBee = 2.5; // Basierend auf Logs: meist 1-5 Herzen
    const heartsPerHour = spawnsPerSecond * 3600 * averageHeartsPerBee;
    
    return Math.round(heartsPerHour);
  }, [unlockedParts, allParts]);

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

  // Drop Handler für Grid-Felder mit Persistierung
  const handleDrop = async (event: React.DragEvent, field: GridField) => {
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
        
        // Ursprüngliches Feld in DB löschen
        if (user?.id) {
          try {
            await fetch(`/api/user/${user.id}/castle-remove-part`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                gridX: draggedFromField.x,
                gridY: draggedFromField.y
              })
            });
          } catch (error) {
            console.error('Failed to remove part from database:', error);
          }
        }
      }
      
      // Bauteil am Zielfeld platzieren
      newGrid[fieldIndex] = {
        ...field,
        buildingPart: { ...draggedPart }
      };
      setGrid(newGrid);
      
      // Neues Feld in DB speichern
      if (user?.id) {
        try {
          await fetch(`/api/user/${user.id}/castle-place-part`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gridX: field.x,
              gridY: field.y,
              partName: draggedPart.id
            })
          });
          console.log(`🏰 Placed ${draggedPart.name} at (${field.x}, ${field.y})`);
        } catch (error) {
          console.error('Failed to place part in database:', error);
        }
      }
      
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

  // Grid-Feld Klick Handler mit Persistierung
  const handleFieldClick = async (field: GridField) => {
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
        
        // Bauteil aus DB löschen
        if (user?.id) {
          try {
            await fetch(`/api/user/${user.id}/castle-remove-part`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                gridX: field.x,
                gridY: field.y
              })
            });
            console.log(`🏰 Removed ${field.buildingPart.name} from (${field.x}, ${field.y})`);
          } catch (error) {
            console.error('Failed to remove part from database:', error);
          }
        }
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
        
        // Bauteil in DB speichern
        if (user?.id) {
          try {
            await fetch(`/api/user/${user.id}/castle-place-part`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                gridX: field.x,
                gridY: field.y,
                partName: draggedPart.id
              })
            });
            console.log(`🏰 Placed ${draggedPart.name} at (${field.x}, ${field.y})`);
          } catch (error) {
            console.error('Failed to place part in database:', error);
          }
        }
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
    setTimeout(async () => {
      setBees(prev => prev.filter(bee => bee.id !== newBee.id));
      
      // Herzen basierend auf Flugstrecke UND Bauteil-Wert
      const targetPart = targetField.buildingPart!;
      // Neue Herzen-Berechnung basierend auf Wahrscheinlichkeit
      const partCost = targetPart.cost || 300; // Fallback auf billigstes
      const minCost = 300;
      const maxCost = 25000;
      const maxDistance = Math.sqrt(24*24 + 14*14); // Maximale Diagonale des Grids
      
      // Normalisierung: 0 = billigst/kurz, 1 = teuerst/lang
      const costFactor = Math.min(1, Math.max(0, (partCost - minCost) / (maxCost - minCost)));
      const distanceFactor = Math.min(1, distance / maxDistance);
      
      // Kombinierte Chance: 5% bis 100% für >3 Herzen
      const combinedFactor = (costFactor + distanceFactor) / 2;
      const chanceFor4Plus = 0.05 + (combinedFactor * 0.95); // 5% bis 100%
      
      // Herzen-Anzahl bestimmen
      let heartAmount;
      if (Math.random() < chanceFor4Plus) {
        // >3 Herzen: 4 oder 5
        heartAmount = Math.random() < 0.6 ? 4 : 5;
      } else {
        // ≤3 Herzen: 1, 2 oder 3
        const roll = Math.random();
        if (roll < 0.5) heartAmount = 1;
        else if (roll < 0.8) heartAmount = 2;
        else heartAmount = 3;
      }
      
      // Ein großes Herz spawnen + Anzahl-Text
      spawnSingleHeart(targetField.x, targetField.y, heartAmount);
      
      // Herzen in Datenbank updaten und lokale Anzeige aktualisieren
      
      // Nur Herzen für Ranglisten tracken (keine Credits vergeben)
      if (user?.id) {
        try {
          await updateHearts(user.id, heartAmount);
          // Lokale Anzeige sofort aktualisieren
          setDatabaseHearts(prev => prev + heartAmount);
          console.log(`💖 ${heartAmount} Herzen gesammelt! (Keine Credits vergeben)`);
        } catch (error) {
          console.error('Failed to save hearts to database:', error);
        }
      }
      
      toast.success(`💖 ${heartAmount} Herzen gesammelt!`);
      
      console.log(`🐝 Biene geflogen: ${distance.toFixed(1)} Felder, Bauteil-Kosten: ${partCost}💰, Chance: ${(chanceFor4Plus*100).toFixed(1)}%, ${heartAmount} Herzen!`);
    }, flightDuration);
  };

  // Neue einfache Herz-Animation
  const spawnSingleHeart = (centerX: number, centerY: number, amount: number) => {
    // Einfaches Herz mit kurzer Animation
    const newHeart: ConfettiHeart = {
      id: `heart-${Date.now()}`,
      x: centerX,
      y: centerY,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      scale: 1,
      opacity: 1,
      velocity: { x: 0, y: 0 },
      startTime: Date.now()
    };
    
    setConfettiHearts(prev => [...prev, newHeart]);
    
    // Herz nach 2 Sekunden entfernen
    setTimeout(() => {
      setConfettiHearts(prev => prev.filter(heart => heart.id !== newHeart.id));
    }, 2000);
  };

  // Einfache Animation nur für Bienen
  useEffect(() => {
    const interval = setInterval(() => {
      setBees(prevBees => 
        prevBees.map(bee => {
          const elapsed = Date.now() - bee.startTime;
          const progress = Math.min(elapsed / bee.duration, 1);
          
          const newX = bee.startX + (bee.targetX - bee.startX) * progress;
          const newY = bee.startY + (bee.targetY - bee.startY) * progress;
          
          return {
            ...bee,
            currentX: newX,
            currentY: newY
          };
        })
      );
    }, 50); // 20 FPS
    
    return () => clearInterval(interval);
  }, []);

  // Dynamischer Bienen-Spawn Timer basierend auf ausgegebenen Credits
  useEffect(() => {
    // Berechne Summe der ausgegebenen Credits für freigeschaltete Bauteile
    const totalSpentCredits = unlockedParts.reduce((sum, partId) => {
      const part = allParts.find(p => p.id === partId);
      return sum + (part?.cost || 0);
    }, 0);
    
    // Dynamische Spawn-Parameter basierend auf ausgegebenen Credits
    // Base: 10 Sekunden, 30% Chance
    // Pro 5000 Credits: -1 Sekunde Intervall, +10% Chance (neu gewichtet)
    const creditBonus = Math.floor(totalSpentCredits / 5000);
    const spawnInterval = Math.max(3000, 10000 - (creditBonus * 1000)); // Minimum 3 Sekunden
    const spawnChance = Math.min(0.9, 0.3 + (creditBonus * 0.1)); // Maximum 90%
    
    console.log(`🐝 Spawn-Parameter: ${totalSpentCredits} Credits ausgegeben → Intervall: ${spawnInterval/1000}s, Chance: ${(spawnChance*100).toFixed(0)}%`);
    
    const interval = setInterval(() => {
      if (Math.random() < spawnChance) {
        spawnRandomBee();
      }
    }, spawnInterval);
    
    return () => clearInterval(interval);
  }, [grid, credits, unlockedParts]); // Abhängig von Grid, Credits und freigeschalteten Bauteilen

  // ==================== PERSISTIERUNG LOGIC ====================
  
  // Daten beim Mount laden
  useEffect(() => {
    if (user?.id) {
      loadCastleData();
    }
  }, [user?.id]);

  // Daten von der API laden
  const loadCastleData = async () => {
    if (!user?.id) return;

    try {
      // Freigeschaltete Bauteile laden
      const unlockedResponse = await fetch(`/api/user/${user.id}/castle-unlocked-parts`);
      if (unlockedResponse.ok) {
        const { unlockedParts: loadedParts } = await unlockedResponse.json();
        const partNames = loadedParts.map((part: any) => part.partName);
        setUnlockedParts(['grass', 'stone_path', ...partNames]); // Basis-Teile + persistierte
        console.log(`🏰 Loaded ${partNames.length} unlocked castle parts:`, partNames);
      }

      // Grid-Status laden
      const gridResponse = await fetch(`/api/user/${user.id}/castle-grid-state`);
      if (gridResponse.ok) {
        const { gridState: loadedGrid } = await gridResponse.json();
        
        // Grid mit geladenen Daten rekonstruieren
        const reconstructedGrid: GridField[] = [];
        for (let y = 0; y < gridHeight; y++) {
          for (let x = 0; x < gridWidth; x++) {
            const savedField = loadedGrid.find((field: any) => field.gridX === x && field.gridY === y);
            const buildingPart = savedField ? allParts.find(part => part.id === savedField.partName) || null : null;
            
            reconstructedGrid.push({
              x,
              y,
              buildingPart
            });
          }
        }
        setGrid(reconstructedGrid);
        console.log(`🏰 Loaded ${loadedGrid.length} grid placements`);
      }
    } catch (error) {
      console.error('Failed to load castle data:', error);
      toast.error('Fehler beim Laden des Schlossgartens');
    }
  };

  // Grid-Änderungen in Datenbank speichern
  const saveGridState = async (newGrid: GridField[]) => {
    if (!user?.id) return;

    try {
      // Alle bestehenden Einträge löschen und neue speichern
      const fieldsWithParts = newGrid.filter(field => field.buildingPart);
      
      for (const field of fieldsWithParts) {
        await fetch(`/api/user/${user.id}/castle-place-part`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gridX: field.x,
            gridY: field.y,
            partName: field.buildingPart!.id
          })
        });
      }
      
      console.log(`🏰 Saved grid state with ${fieldsWithParts.length} placed parts`);
    } catch (error) {
      console.error('Failed to save grid state:', error);
    }
  };

  // Bauteil freischalten mit Persistierung
  const unlockPart = async (partId: string, cost: number) => {
    if (credits >= cost && !unlockedParts.includes(partId)) {
      try {
        // Bauteil in Datenbank freischalten
        const unlockResponse = await fetch(`/api/user/${user?.id}/castle-unlock-part`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partName: partId, price: cost })
        });

        if (unlockResponse.ok) {
          setCredits(credits - cost);
          setUnlockedParts(prev => [...prev, partId]);
          setShowShopDialog(false);
          toast.success(`🔓 ${allParts.find(p => p.id === partId)?.name} freigeschaltet!`);
          console.log(`🏰 Bauteil ${partId} für ${cost} Credits persistent freigeschaltet!`);
        } else {
          const error = await unlockResponse.json();
          toast.error(error.message || 'Fehler beim Freischalten');
        }
      } catch (error) {
        console.error('Fehler beim Freischalten:', error);
        toast.error('Fehler beim Freischalten des Bauteils');
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
      {/* Header im App-Stil mit Herzen-Zähler */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">🏰 Schlossgarten</h1>
            <p className="text-slate-300">Gestalte deinen eigenen königlichen Garten!</p>
          </div>
          <div className="flex items-center gap-6">
            {/* Balloon-Toggle */}
            <button
              onClick={() => setBalloonsEnabled(!balloonsEnabled)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium transition-colors ${
                balloonsEnabled 
                  ? 'bg-green-600 hover:bg-green-500 text-white' 
                  : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
              }`}
              title="Luftballons beim Bauen ein-/ausschalten"
            >
              <span className="text-lg">🎈</span>
              <span className="hidden sm:inline">{balloonsEnabled ? 'An' : 'Aus'}</span>
            </button>
            
            {/* Investitionssumme */}
            <div className="flex items-center gap-2 text-lg">
              <span className="text-2xl">🏰</span>
              <span className="text-yellow-400 font-bold">{totalInvestment.toLocaleString()}</span>
              <span className="text-slate-400 text-sm">investiert</span>
            </div>
            
            
            {/* Herzen-Anzeige mit echten Datenbankwerten */}
            <div className="flex items-center gap-2 text-lg">
              <span className="text-2xl">💖</span>
              <span className="text-white font-bold">{databaseHearts.toLocaleString()}</span>
              <span className="text-slate-400 text-sm">Herzen</span>
            </div>
          </div>
        </div>
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
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-slate-700 scrollbar-thumb-green-600 hover:scrollbar-thumb-green-500">
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
                  onClick={() => setDraggedPart(draggedPart?.id === part.id ? null : part)}
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
                    className="absolute pointer-events-none text-4xl animate-pulse"
                    style={{
                      left: `${heart.x * 56 + 28}px`,
                      top: `${heart.y * 56 + 28}px`,
                      zIndex: 100
                    }}
                  >
                    💖
                  </div>
                ))}
                
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
      
      {/* Shop Dialog */}
      <Dialog open={showShopDialog} onOpenChange={setShowShopDialog}>
        <DialogContent className="max-w-2xl bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">🛒 Bauteil-Shop</DialogTitle>
            <DialogDescription className="text-slate-400">
              Schalte neue Bauteile mit deinen Credits frei
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3 pr-2">
              {allParts.filter(part => !unlockedParts.includes(part.id)).map(part => (
                <div key={part.id} className="flex flex-col gap-2 p-3 bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-10 h-10 rounded border border-slate-600 flex-shrink-0"
                      style={{
                        backgroundImage: `url(${part.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm truncate">{part.name}</h3>
                      <p className="text-xs text-slate-400 truncate">Typ: {part.type}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => unlockPart(part.id, part.cost)}
                    disabled={credits < part.cost}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-sm py-1 w-full"
                  >
                    {part.cost} 💰
                  </Button>
                </div>
              ))}
            </div>
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