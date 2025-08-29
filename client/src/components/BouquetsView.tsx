import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/stores/useAuth";
import { Flower2, Star, Heart, Gift } from "lucide-react";

export const BouquetsView: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardContent className="pt-6">
            <p className="text-center text-slate-400">Bitte melde dich an, um Bouquets zu erstellen</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Bouquets Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
          <Flower2 className="h-8 w-8 mr-3 text-rose-400" />
          Bouquets
        </h1>
        <p className="text-slate-400">Erstelle wunderschöne Blumensträuße aus deinen Blumen</p>
      </div>

      {/* Bouquet Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simple Bouquets */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Flower2 className="h-5 w-5 mr-2 text-green-400" />
              Einfache Bouquets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-slate-400">Noch keine einfachen Bouquets erstellt</p>
              <p className="text-slate-500 text-sm mt-2">Sammle 3 gleiche Blumen für ein einfaches Bouquet</p>
            </div>
          </CardContent>
        </Card>

        {/* Premium Bouquets */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-400" />
              Premium Bouquets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-slate-400">Noch keine Premium Bouquets erstellt</p>
              <p className="text-slate-500 text-sm mt-2">Kombiniere verschiedene seltene Blumen</p>
            </div>
          </CardContent>
        </Card>

        {/* Special Bouquets */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Heart className="h-5 w-5 mr-2 text-red-400" />
              Spezial Bouquets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-slate-400">Noch keine Spezial Bouquets erstellt</p>
              <p className="text-slate-500 text-sm mt-2">Entdecke geheime Kombinationen</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Creation Area */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Gift className="h-5 w-5 mr-2 text-purple-400" />
            Bouquet Werkstatt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">Bouquet Erstellung wird bald verfügbar sein!</p>
            <p className="text-slate-500 text-sm">Züchte zuerst einige Blumen in deinem Garten</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};