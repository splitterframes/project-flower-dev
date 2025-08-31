import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, X, Eye, Bug } from "lucide-react";
import { useAuth } from "@/lib/stores/useAuth";

interface UserListData {
  id: number;
  username: string;
  isOnline: boolean;
  exhibitionButterflies: number;
  lastSeen: string;
  totalLikes: number;
}

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVisitExhibition: (userId: number, username: string) => void;
}

export const UserListModal: React.FC<UserListModalProps> = ({
  isOpen,
  onClose,
  onVisitExhibition
}) => {
  const [users, setUsers] = useState<UserListData[]>([]);
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/users/list', {
        headers: {
          'X-User-Id': currentUser.id.toString()
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOnlineStatus = (user: UserListData) => {
    return user.isOnline ? 'Online' : `Zuletzt: ${user.lastSeen}`;
  };

  const getOnlineColor = (user: UserListData) => {
    return user.isOnline ? 'text-green-400' : 'text-slate-400';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-500/30 text-white max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <DialogHeader className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-t-lg -mx-6 -my-2"></div>
          <DialogTitle className="flex items-center text-white relative z-10">
            <div className="relative">
              <Users className="h-8 w-8 mr-3 text-cyan-400 animate-pulse" />
              <div className="absolute inset-0 h-8 w-8 mr-3 text-cyan-400 animate-ping opacity-30"></div>
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
              🌐 Alle Mariposa-Spieler
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Box */}
          <div className="bg-gradient-to-r from-cyan-800/30 to-blue-800/30 rounded-xl p-6 border-2 border-cyan-500/30 shadow-xl relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-xl"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="relative">
                  <Eye className="h-6 w-6 mr-3 text-cyan-400 animate-pulse" />
                  <div className="absolute inset-0 h-6 w-6 mr-3 text-cyan-400 animate-ping opacity-20"></div>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">Spieler-Übersicht 👥</span>
              </div>
              <ul className="text-slate-300 space-y-2 text-lg">
                <li className="flex items-center">🟢 Grün = Spieler ist gerade online</li>
                <li className="flex items-center">🔴 Grau = Spieler war zuletzt online</li>
                <li className="flex items-center">🦋 Zeigt die Anzahl Schmetterlinge in der Ausstellung</li>
              </ul>
            </div>
          </div>

          {/* User List */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent flex items-center">
              👥 Spieler-Liste ({users.length} Spieler)
            </h3>
            
            {loading ? (
              <div className="text-center py-12 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-lg"></div>
                <div className="relative z-10">
                  <div className="relative mb-6">
                    <Users className="h-16 w-16 text-cyan-400 mx-auto animate-spin" />
                    <div className="absolute inset-0 h-16 w-16 mx-auto text-cyan-400 animate-ping opacity-20"></div>
                  </div>
                  <p className="text-slate-300 text-xl">👥 Lade Spieler-Daten...</p>
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-lg"></div>
                <div className="relative z-10">
                  <div className="relative mb-6">
                    <Users className="h-16 w-16 text-cyan-400 mx-auto animate-bounce" />
                    <div className="absolute inset-0 h-16 w-16 mx-auto text-cyan-400 animate-ping opacity-20"></div>
                  </div>
                  <p className="text-slate-300 text-xl mb-3">👥 Keine Spieler gefunden</p>
                  <p className="text-slate-400 text-lg">Die Daten konnten nicht geladen werden</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <Card 
                    key={user.id} 
                    className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-600 hover:border-cyan-400/50 transition-all duration-300 hover:scale-105 shadow-lg cursor-pointer"
                    onClick={() => {
                      onVisitExhibition(user.id, user.username);
                      onClose();
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <Users className="h-5 w-5 mr-2 text-cyan-400" />
                            <h4 className="font-bold text-white text-lg">{user.username}</h4>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-2 ${user.isOnline ? 'bg-green-400' : 'bg-slate-400'}`}></div>
                              <span className={`text-sm ${getOnlineColor(user)}`}>
                                {getOnlineStatus(user)}
                              </span>
                            </div>
                            
                            <div className="flex items-center">
                              <Bug className="h-4 w-4 mr-2 text-blue-400" />
                              <span className="text-sm text-slate-300">
                                {user.exhibitionButterflies} 🦋 in Ausstellung
                              </span>
                            </div>
                            
                            <div className="flex items-center">
                              <span className="text-sm text-pink-400">
                                ❤️ {user.totalLikes || 0} Likes
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <Badge className={`text-xs ${user.isOnline ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
                            {user.isOnline ? '🟢 Online' : '🔴 Offline'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-lg px-6 py-3 font-bold transition-all duration-300 hover:scale-110 shadow-lg"
            >
              ✅ Schließen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};