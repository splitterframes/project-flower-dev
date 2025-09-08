import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, X, Eye, Bug, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/stores/useAuth";
import { Top100Modal } from "@/components/Top100Modal";

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

type SortOption = 'username' | 'butterflies' | 'likes' | 'online';

export const UserListModal: React.FC<UserListModalProps> = ({
  isOpen,
  onClose,
  onVisitExhibition
}) => {
  const [users, setUsers] = useState<UserListData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('butterflies');
  const [isTop100Open, setIsTop100Open] = useState(false);
  const { user: currentUser } = useAuth();
  
  const itemsPerPage = 12;

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

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => 
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort users
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'username':
          return a.username.localeCompare(b.username);
        case 'butterflies':
          return b.exhibitionButterflies - a.exhibitionButterflies;
        case 'likes':
          return (b.totalLikes || 0) - (a.totalLikes || 0);
        case 'online':
          if (a.isOnline && !b.isOnline) return -1;
          if (!a.isOnline && b.isOnline) return 1;
          return b.exhibitionButterflies - a.exhibitionButterflies;
        default:
          return 0;
      }
    });

    return filtered;
  }, [users, searchQuery, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredAndSortedUsers.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'username': return '📝 Name A-Z';
      case 'butterflies': return '🦋 Schmetterlinge';
      case 'likes': return '❤️ Likes';
      case 'online': return '🟢 Online Status';
      default: return '';
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-500/30 text-white w-[95vw] max-w-sm md:max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
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
          {/* TOP 100 SPIELER Button */}
          <div className="flex justify-center">
            <button 
              onClick={() => setIsTop100Open(true)}
              className="relative group"
            >
              {/* Main button with golden gradient */}
              <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-400 text-black font-bold text-2xl px-12 py-6 rounded-xl border-4 border-yellow-300 shadow-2xl transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-yellow-500/50">
                {/* Animated glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-400 rounded-xl blur-lg opacity-75 animate-pulse"></div>
                {/* Button text with relative positioning */}
                <div className="relative z-10 flex items-center">
                  <span className="mr-2">🏆</span>
                  TOP 100 SPIELER
                  <span className="ml-2">🏆</span>
                </div>
              </div>
              {/* Additional outer glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-xl blur-xl opacity-30 animate-ping"></div>
            </button>
          </div>

          {/* Search and Controls */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="🔍 Spieler suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-400"
                />
              </div>
              
              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="butterflies" className="text-white hover:bg-slate-700">🦋 Schmetterlinge</SelectItem>
                  <SelectItem value="likes" className="text-white hover:bg-slate-700">❤️ Likes</SelectItem>
                  <SelectItem value="online" className="text-white hover:bg-slate-700">🟢 Online Status</SelectItem>
                  <SelectItem value="username" className="text-white hover:bg-slate-700">📝 Name A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent flex items-center">
                👥 Spieler-Liste ({filteredAndSortedUsers.length} gefunden)
              </h3>
              
              {totalPages > 1 && (
                <div className="text-sm text-slate-400">
                  Seite {currentPage} von {totalPages}
                </div>
              )}
            </div>
            
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
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Zurück
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={currentPage === pageNum 
                          ? "bg-cyan-600 hover:bg-cyan-700 text-white"
                          : "bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                        }
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  Weiter
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
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
      
      {/* TOP 100 Modal */}
      <Top100Modal
        isOpen={isTop100Open}
        onClose={() => setIsTop100Open(false)}
      />
    </>
  );
};