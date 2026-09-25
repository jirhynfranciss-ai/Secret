import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { notificationsService } from '@/services/notifications.service';
import { Button } from '@/components/ui/Button';
import { InlineLoader } from '@/components/ui/LoadingScreen';
import { Badge } from '@/components/ui/Badge';
import { getFriendlyError, logError } from '@/utils/errors';
import type { Notification } from '@/types';

const typeConfig = {
  message: { label: 'Message', variant: 'rose' as const },
  admin: { label: 'Note', variant: 'blue' as const },
  system: { label: 'System', variant: 'stone' as const },
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await notificationsService.getUserNotifications(user.id);
      setNotifications(data);
    } catch (err) {
      logError('NotificationsPage', err);
      setError(getFriendlyError(err));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = notificationsService.subscribeToNotifications(user.id, (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });
    return () => { channel.unsubscribe(); };
  }, [user]);

  const markRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    if (!user) return;
    setMarkingAll(true);
    try {
      await notificationsService.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      logError('NotificationsPage markAll', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="px-4 md:px-8 py-8 md:py-10 pb-24 md:pb-10 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="font-cormorant text-3xl font-light text-stone-800 italic">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-stone-400 font-light">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={markAllRead}
              isLoading={markingAll}
              leftIcon={<Check size={14} />}
            >
              Mark all read
            </Button>
          )}
        </div>

        {isLoading && <InlineLoader />}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
            <AlertCircle size={16} className="text-red-400" />
            <p className="text-sm text-red-600 flex-1">{error}</p>
            <Button size="sm" variant="ghost" onClick={load} leftIcon={<RefreshCw size={14} />}>
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !error && notifications.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <BellOff size={32} className="mx-auto text-stone-300" />
            <p className="font-cormorant text-xl text-stone-500 italic">Nothing new yet</p>
            <p className="text-stone-400 text-sm font-light">
              Your notifications will appear here.
            </p>
          </div>
        )}

        <AnimatePresence>
          <div className="space-y-3">
            {notifications.map((n, i) => {
              const config = typeConfig[n.type] || typeConfig.system;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => !n.is_read && markRead(n.id)}
                  className={`rounded-2xl border p-5 cursor-pointer transition-all duration-200 ${
                    n.is_read
                      ? 'bg-white/60 border-rose-50 opacity-70'
                      : 'bg-white border-rose-100 shadow-sm shadow-rose-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      n.is_read ? 'bg-stone-100' : 'bg-rose-100'
                    }`}>
                      <Bell size={14} className={n.is_read ? 'text-stone-400' : 'text-rose-500'} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-medium ${n.is_read ? 'text-stone-500' : 'text-stone-800'}`}>
                          {n.title}
                        </p>
                        <Badge variant={config.variant}>{config.label}</Badge>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                        )}
                      </div>
                      <p className="text-sm text-stone-500 font-light leading-relaxed">{n.body}</p>
                      <p className="text-xs text-stone-400">
                        {format(new Date(n.created_at), 'MMM d, yyyy · h:mm a')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
