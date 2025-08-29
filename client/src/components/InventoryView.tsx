import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/stores/useAuth";
import { Package, Flower, Bug, Gem } from "lucide-react";

export const InventoryView: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardContent className="pt-6">
            <p className="text-center text-slate-400">Bitte melde dich an, um dein Inventar zu sehen</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Inventory Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
          <Package className="h-8 w-8 mr-3 text-blue-400" />
          Inventar
        </h1>
        <p className="text-slate-400">Verwalte deine Blumen, Schmetterlinge und Materialien</p>
      </div>

      {/* Inventory Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flowers */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Flower className="h-5 w-5 mr-2 text-pink-400" />
              Blumen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-slate-400">Noch keine Blumen gesammelt</p>
              <p className="text-slate-500 text-sm mt-2">Züchte Blumen in deinem Garten</p>
            </div>
          </CardContent>
        </Card>

        {/* Butterflies */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Bug className="h-5 w-5 mr-2 text-yellow-400" />
              Schmetterlinge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-slate-400">Noch keine Schmetterlinge gefangen</p>
              <p className="text-slate-500 text-sm mt-2">Schmetterlinge werden von deinen Blumen angezogen</p>
            </div>
          </CardContent>
        </Card>

        {/* Materials */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Gem className="h-5 w-5 mr-2 text-purple-400" />
              Materialien
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-slate-400">Noch keine Materialien gesammelt</p>
              <p className="text-slate-500 text-sm mt-2">Sammle seltene Materialien beim Spielen</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};