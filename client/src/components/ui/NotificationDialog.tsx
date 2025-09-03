import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

interface NotificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}

export const NotificationDialog: React.FC<NotificationDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info'
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-400" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-red-400" />;
      case 'warning':
        return <AlertCircle className="h-6 w-6 text-yellow-400" />;
      case 'info':
      default:
        return <Info className="h-6 w-6 text-blue-400" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return 'border-green-500/30 bg-gradient-to-br from-green-800/20 to-green-900/20';
      case 'error':
        return 'border-red-500/30 bg-gradient-to-br from-red-800/20 to-red-900/20';
      case 'warning':
        return 'border-yellow-500/30 bg-gradient-to-br from-yellow-800/20 to-yellow-900/20';
      case 'info':
      default:
        return 'border-blue-500/30 bg-gradient-to-br from-blue-800/20 to-blue-900/20';
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'success':
        return 'Erfolgreich!';
      case 'error':
        return 'Fehler';
      case 'warning':
        return 'Warnung';
      case 'info':
      default:
        return 'Information';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`
        ${getColorClasses()} 
        border-2 
        text-white 
        max-w-md 
        mx-auto 
        shadow-2xl
        backdrop-blur-sm
      `}>
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center space-x-3">
            {getIcon()}
            <DialogTitle className="text-xl font-bold text-center text-white">
              {title || getDefaultTitle()}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="text-center py-4">
          <p className="text-gray-200 text-base leading-relaxed">
            {message}
          </p>
        </div>
        
        <div className="flex justify-center pt-4">
          <Button
            onClick={onClose}
            className={`
              px-8 py-2 
              font-semibold 
              transition-all 
              duration-200 
              hover:scale-105 
              ${type === 'success' 
                ? 'bg-green-600 hover:bg-green-500' 
                : type === 'error' 
                  ? 'bg-red-600 hover:bg-red-500' 
                  : type === 'warning'
                    ? 'bg-yellow-600 hover:bg-yellow-500'
                    : 'bg-blue-600 hover:bg-blue-500'
              }
            `}
          >
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};