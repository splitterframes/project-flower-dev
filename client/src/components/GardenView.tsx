import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/stores/useAuth";
import { useCredits } from "@/lib/stores/useCredits";
import { 
  Flower,
  Lock,
  Coins,
  Shovel
} from "lucide-react";

interface GardenField {
  id: number;
  isUnlocked: boolean;
  hasPlant: boolean;
  plantType?: string;
}

export const GardenView: React.FC = () => {
  const { user } = useAuth();
  const { credits, updateCredits } = useCredits();

  // Initialize garden with first 4 fields unlocked
  const [gardenFields, setGardenFields] = useState<GardenField[]>(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      isUnlocked: i < 4,
      hasPlant: false,
      plantType: undefined
    }));
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardContent className="pt-6">
            <p className="text-center text-slate-400">Bitte melde dich an, um den Garten zu betreten</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculateUnlockCost = (fieldId: number) => {
    // First unlocked field costs 1000, then multiply by 1.2 for each subsequent field
    const unlockedCount = gardenFields.filter(f => f.isUnlocked).length;
    return Math.round(1000 * Math.pow(1.2, unlockedCount));
  };

  const unlockField = async (fieldId: number) => {
    const cost = calculateUnlockCost(fieldId);
    
    if (credits < cost) {
      alert(`Du brauchst ${cost} Cr um dieses Feld freizuschalten!`);
      return;
    }

    // Update credits
    await updateCredits(user.id, -cost);
    
    // Unlock the field
    setGardenFields(prev => 
      prev.map(field => 
        field.id === fieldId 
          ? { ...field, isUnlocked: true }
          : field
      )
    );
  };

  const plantFlower = (fieldId: number) => {
    setGardenFields(prev => 
      prev.map(field => 
        field.id === fieldId 
          ? { ...field, hasPlant: true, plantType: "flower" }
          : field
      )
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Garden Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
          <Flower className="h-8 w-8 mr-3 text-pink-400" />
          Mariposa Garten
        </h1>
        <p className="text-slate-400">Züchte wunderschöne Blumen für deine Schmetterlinge</p>
      </div>

      {/* Garden Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Freigeschaltete Felder
            </CardTitle>
            <Shovel className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {gardenFields.filter(f => f.isUnlocked).length}/50
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Gepflanzte Blumen
            </CardTitle>
            <Flower className="h-4 w-4 text-pink-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-400">
              {gardenFields.filter(f => f.hasPlant).length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Credits
            </CardTitle>
            <Coins className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{credits} Cr</div>
          </CardContent>
        </Card>
      </div>

      {/* Garden Grid */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Flower className="h-5 w-5 mr-2 text-pink-400" />
            Garten Felder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-2">
            {gardenFields.map((field) => {
              const isNextToUnlock = !field.isUnlocked && 
                gardenFields.filter(f => f.isUnlocked).length === field.id - 1;
              
              return (
                <div
                  key={field.id}
                  className={`
                    aspect-square border-2 rounded-lg relative flex items-center justify-center cursor-pointer transition-all
                    ${field.isUnlocked 
                      ? 'border-green-500 bg-green-900/20 hover:bg-green-900/40' 
                      : isNextToUnlock 
                        ? 'border-orange-500 bg-slate-700 hover:bg-slate-600' 
                        : 'border-slate-600 bg-slate-800 opacity-50'
                    }
                  `}
                  style={{
                    backgroundImage: field.isUnlocked ? 'url("/Landschaft/gras.png")' : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                  onClick={() => {
                    if (!field.isUnlocked && isNextToUnlock) {
                      unlockField(field.id);
                    } else if (field.isUnlocked && !field.hasPlant) {
                      plantFlower(field.id);
                    }
                  }}
                >
                  {!field.isUnlocked && (
                    <>
                      <Lock className="h-4 w-4 text-slate-400" />
                      {isNextToUnlock && (
                        <div className="absolute -bottom-6 text-xs text-orange-400">
                          {calculateUnlockCost(field.id)} Cr
                        </div>
                      )}
                    </>
                  )}
                  
                  {field.isUnlocked && field.hasPlant && (
                    <Flower className="h-6 w-6 text-pink-400" />
                  )}
                  
                  {field.isUnlocked && !field.hasPlant && (
                    <div className="text-xs text-green-400">+</div>
                  )}
                  
                  <div className="absolute top-1 left-1 text-xs text-slate-500">
                    {field.id}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="text-center text-slate-400">
            <p className="mb-2">🌱 Klicke auf ein freies Feld um eine Blume zu pflanzen</p>
            <p className="mb-2">🔓 Klicke auf ein gesperrtes Feld um es freizuschalten</p>
            <p>💰 Jedes weitere Feld kostet 20% mehr als das vorherige</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};