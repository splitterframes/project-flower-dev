import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Bell, X, Trophy, Gift, Star, Award } from 'lucide-react';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

interface UserNotification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  rewardType?: string;
  rewardItemId?: number;
  rewardItemName?: string;
  rewardItemRarity?: string;
  rewardAmount?: number;
  challengeId?: number;
  challengeRank?: number;
  createdAt: string;
  readAt?: string;
}

interface LoginNotificationsProps {
  userId: number;
  isOpen: boolean;
  onClose: () => void;
}

const getNotificationIcon = (type: string, rewardType?: string) => {
  if (type === 'challenge_reward') {
    if (rewardType === 'vip_butterfly') return <Star className="w-6 h-6 text-yellow-500" />;
    if (rewardType === 'butterfly') return <Trophy className="w-6 h-6 text-purple-500" />;
    if (rewardType === 'credits') return <Gift className="w-6 h-6 text-green-500" />;
  }
  return <Bell className="w-6 h-6 text-blue-500" />;
};

const getRarityColor = (rarity?: string) => {
  switch (rarity?.toLowerCase()) {
    case 'common': return 'bg-yellow-500';
    case 'uncommon': return 'bg-green-500';
    case 'rare': return 'bg-blue-500';
    case 'super-rare': return 'bg-cyan-500';
    case 'epic': return 'bg-purple-500';
    case 'legendary': return 'bg-orange-500';
    case 'mythical': return 'bg-red-500';
    case 'vip': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
    default: return 'bg-gray-500';
  }
};

export function LoginNotifications({ userId, isOpen, onClose }: LoginNotificationsProps) {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      loadNotifications();
    }
  }, [isOpen, userId]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/${userId}/notifications`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/user/${userId}/notifications/${notificationId}/read`, {
        method: 'POST'
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`/api/user/${userId}/notifications/read-all`, {
        method: 'POST'
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleClose = () => {
    // Auto-mark all as read when closing
    if (notifications.some(n => !n.isRead)) {
      markAllAsRead();
    }
    onClose();
  };

  if (notifications.length === 0 && !isLoading) {
    return null; // Don't show modal if no notifications
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-800">
            <Bell className="w-5 h-5" />
            Neue Nachrichten
            {notifications.length > 0 && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                {notifications.length}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <ScrollArea className="max-h-96 pr-4">
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 bg-white rounded-lg border-l-4 border-purple-400 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type, notification.rewardType)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {notification.title}
                        </h4>
                        {notification.rewardItemRarity && (
                          <Badge 
                            className={`text-xs text-white ${getRarityColor(notification.rewardItemRarity)}`}
                          >
                            {notification.rewardItemRarity}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      
                      {notification.challengeRank && (
                        <div className="flex items-center gap-1 text-xs text-purple-600">
                          <Award className="w-3 h-3" />
                          Platz {notification.challengeRank} in der Weekly Challenge
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-400 mt-2">
                        {new Date(notification.createdAt).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs text-purple-600 hover:text-purple-800"
                      >
                        Als gelesen markieren
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-between items-center pt-4 border-t">
          {notifications.some(n => !n.isRead) && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              Alle als gelesen markieren
            </Button>
          )}
          
          <Button 
            onClick={handleClose}
            className="bg-purple-600 hover:bg-purple-700 text-white ml-auto"
          >
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}