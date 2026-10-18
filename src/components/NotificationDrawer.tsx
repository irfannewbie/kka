import React from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  Clock,
  Trash2,
  Volume2,
  VolumeX,
  Award,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSelectTaskNotification?: (taskId?: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  soundEnabled,
  onToggleSound,
  onSelectTaskNotification,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#F2EFEB]/80 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div
        id="notification-drawer"
        className="w-full max-w-sm bg-white h-full border-l-2 border-[#1a1a1a] shadow-[-8px_0px_0px_#1a1a1a] flex flex-col font-mono-code text-xs animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b-2 border-[#1a1a1a] flex items-center justify-between bg-[#F2EFEB]">
          <div className="flex items-center space-x-2">
            <Bell className="h-4 w-4 text-[#2e59e6]" />
            <h3 className="font-bold text-sm text-[#1a1a1a] uppercase">
              NOTIFIKASI ({unreadCount})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="font-bold text-xs hover:text-[#2e59e6] cursor-pointer"
          >
            [ ✕ ]
          </button>
        </div>

        {/* Action Controls */}
        <div className="px-4 py-2 border-b border-[#1a1a1a] bg-slate-50 flex items-center justify-between text-[10px]">
          <button
            onClick={onMarkAllAsRead}
            disabled={unreadCount === 0}
            className="font-bold text-[#1a1a1a] hover:text-[#2e59e6] disabled:opacity-40"
          >
            ✓ TANDAI DIBACA
          </button>
          <button
            onClick={onClearAll}
            disabled={notifications.length === 0}
            className="font-bold text-rose-600 hover:underline disabled:opacity-40"
          >
            HAPUS SEMUA
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#1a1a1a]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Bell className="h-6 w-6 text-slate-400 mx-auto mb-2 opacity-50" />
              <p className="font-bold text-[#1a1a1a]">Tidak ada notifikasi</p>
              <p className="text-[10px] mt-0.5">Semua aktivitas sistem telah tercatat.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (onSelectTaskNotification) onSelectTaskNotification(notif.taskId);
                  onClose();
                }}
                className={`p-3.5 transition-colors cursor-pointer ${
                  notif.read ? 'bg-white hover:bg-[#F2EFEB]' : 'bg-blue-50/50 hover:bg-blue-100/50'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <h4 className="font-bold text-xs text-[#1a1a1a]">{notif.title}</h4>
                  <span className="text-[9px] text-slate-500">{notif.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-700 mt-1">{notif.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
