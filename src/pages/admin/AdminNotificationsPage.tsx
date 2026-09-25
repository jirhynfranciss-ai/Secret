import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bell, Send, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import { notificationsService } from '@/services/notifications.service';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { InlineLoader } from '@/components/ui/LoadingScreen';
import { Modal } from '@/components/ui/Modal';
import { getFriendlyError, logError } from '@/utils/errors';
import type { Profile, Notification } from '@/types';

export default function AdminNotificationsPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [recentNotifs, setRecentNotifs] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ userId: '', title: '', body: '' });
  const [formErrors, setFormErrors] = useState<typeof form>({ userId: '', title: '', body: '' });
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const u = await adminService.getAllUsers();
      setUsers(u);
      // Load recent notifications for first user as example
    } catch (err) {
      logError('AdminNotifs', err);
      setError(getFriendlyError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openSend = (userId?: string) => {
    setForm({ userId: userId || '', title: '', body: '' });
    setFormErrors({ userId: '', title: '', body: '' });
    setModalOpen(true);
  };

  const validate = () => {
    const errs = { userId: '', title: '', body: '' };
    if (!form.userId) errs.userId = 'Select a recipient';
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.body.trim()) errs.body = 'Message body is required';
    setFormErrors(errs);
    return !Object.values(errs).some(Boolean);
  };

  const handleSend = async () => {
    if (!validate()) return;
    setIsSending(true);
    try {
      const notif = await notificationsService.createNotification(
        form.userId,
        form.title.trim(),
        form.body.trim(),
        'admin'
      );
      setRecentNotifs(prev => [notif, ...prev]);
      toast.success('Notification sent.');
      setModalOpen(false);
    } catch (err) {
      logError('AdminNotifs send', err);
      toast.error(getFriendlyError(err));
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsService.deleteNotification(id);
      setRecentNotifs(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted.');
    } catch (err) {
      toast.error(getFriendlyError(err));
    }
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">Notifications</h1>
          <p className="text-sm text-stone-400">Send notifications to users</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-lg hover:bg-stone-100 text-stone-400">
            <RefreshCw size={16} />
          </button>
          <Button size="sm" onClick={() => openSend()} leftIcon={<Send size={14} />}>
            Send notification
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl mb-4">
          <AlertCircle size={14} className="text-red-400" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {isLoading && <InlineLoader />}

      {/* Users list with quick send */}
      {!isLoading && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-stone-600">Send to a user</h2>
          <div className="space-y-2">
            {users.length === 0 && (
              <p className="text-stone-400 text-sm text-center py-6">No users to notify.</p>
            )}
            {users.map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-xl border border-stone-100 p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-rose-500">
                      {user.display_name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-700">{user.display_name}</p>
                    <p className="text-xs text-stone-400">{user.email}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => openSend(user.user_id)} leftIcon={<Bell size={12} />}>
                  Notify
                </Button>
              </motion.div>
            ))}
          </div>

          {/* Recent sent */}
          {recentNotifs.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-medium text-stone-600 mb-3">Sent this session</h2>
              <div className="space-y-2">
                {recentNotifs.map(n => (
                  <div key={n.id} className="bg-white rounded-xl border border-stone-100 p-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-700">{n.title}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{n.body}</p>
                      <p className="text-xs text-stone-300 mt-1">{format(new Date(n.created_at), 'h:mm a')}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Send Notification">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-stone-700">Recipient</label>
            <select
              value={form.userId}
              onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
              className={`w-full rounded-xl border px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-300 ${formErrors.userId ? 'border-red-300' : 'border-stone-200'}`}
            >
              <option value="">Select a user...</option>
              {users.map(u => (
                <option key={u.id} value={u.user_id}>{u.display_name} ({u.email})</option>
              ))}
            </select>
            {formErrors.userId && <p className="text-xs text-red-500">{formErrors.userId}</p>}
          </div>

          <Input
            label="Title"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            error={formErrors.title}
            placeholder="Notification title"
          />

          <Textarea
            label="Message"
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            error={formErrors.body}
            rows={3}
            placeholder="Your message..."
          />

          <div className="flex gap-2">
            <Button onClick={handleSend} isLoading={isSending} leftIcon={<Send size={14} />} className="flex-1">
              Send
            </Button>
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
