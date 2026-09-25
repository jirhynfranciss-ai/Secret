import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, RefreshCw, AlertCircle, ChevronRight, UserCheck, UserX } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import { responsesService } from '@/services/responses.service';
import { InlineLoader } from '@/components/ui/LoadingScreen';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { getFriendlyError, logError } from '@/utils/errors';
import type { Profile, Response } from '@/types';

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userResponses, setUserResponses] = useState<Response[]>([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);

  const load = useCallback(async (q?: string) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await adminService.getAllUsers(q);
      setUsers(data);
    } catch (err) {
      logError('UsersPage', err);
      setError(getFriendlyError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => load(search || undefined), 350);
    return () => clearTimeout(t);
  }, [search, load]);

  const openUser = async (user: Profile) => {
    setSelectedUser(user);
    setIsLoadingResponses(true);
    try {
      const r = await responsesService.getResponsesByUser(user.user_id);
      setUserResponses(r);
    } catch (err) {
      logError('UsersPage responses', err);
    } finally {
      setIsLoadingResponses(false);
    }
  };

  const toggleStatus = async (user: Profile) => {
    try {
      await adminService.setUserActiveStatus(user.user_id, !user.is_active);
      setUsers(prev => prev.map(u => u.user_id === user.user_id ? { ...u, is_active: !u.is_active } : u));
      if (selectedUser?.user_id === user.user_id) {
        setSelectedUser(u => u ? { ...u, is_active: !u.is_active } : u);
      }
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'}.`);
    } catch (err) {
      toast.error(getFriendlyError(err));
      logError('UsersPage toggleStatus', err);
    }
  };

  const getAnswerDisplay = (r: Response) => {
    if (r.answer_choice) return r.answer_choice;
    if (r.answer_text) return r.answer_text;
    if (r.answer_scale !== null && r.answer_scale !== undefined) return `${r.answer_scale} / 10`;
    return '—';
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">Users</h1>
          <p className="text-sm text-stone-400">{users.length} registered users</p>
        </div>
        <button onClick={() => load(search || undefined)} className="p-2 rounded-lg hover:bg-stone-100 text-stone-400">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
        />
      </div>

      {isLoading && <InlineLoader />}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl mb-4">
          <AlertCircle size={16} className="text-red-400" />
          <p className="text-sm text-red-600">{error}</p>
          <Button size="sm" variant="ghost" onClick={() => load()}>Retry</Button>
        </div>
      )}

      {!isLoading && users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-stone-400 text-sm">{search ? 'No users found for that search.' : 'No users yet.'}</p>
        </div>
      )}

      <div className="space-y-2">
        {users.map((user, i) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-white rounded-xl border border-stone-100 p-4 flex items-center gap-4 hover:border-stone-200 transition-colors cursor-pointer"
            onClick={() => openUser(user)}
          >
            <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
              <span className="text-sm font-medium text-rose-500">
                {user.display_name?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-stone-700">{user.display_name}</p>
                {!user.is_active && <Badge variant="stone">Inactive</Badge>}
              </div>
              <p className="text-xs text-stone-400">{user.email}</p>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs text-stone-400">
                {format(new Date(user.created_at), 'MMM d, yyyy')}
              </p>
            </div>
            <ChevronRight size={16} className="text-stone-300 shrink-0" />
          </motion.div>
        ))}
      </div>

      {/* User detail modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.display_name || 'User Details'}
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-stone-400 text-xs mb-1">Email</p>
                <p className="text-stone-700">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-stone-400 text-xs mb-1">Joined</p>
                <p className="text-stone-700">{format(new Date(selectedUser.created_at), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-stone-400 text-xs mb-1">Status</p>
                <Badge variant={selectedUser.is_active ? 'green' : 'stone'}>
                  {selectedUser.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            {selectedUser.bio && (
              <div>
                <p className="text-stone-400 text-xs mb-1">Bio</p>
                <p className="text-stone-600 text-sm">{selectedUser.bio}</p>
              </div>
            )}

            {/* Responses */}
            <div>
              <p className="text-stone-700 font-medium text-sm mb-3">Questionnaire Responses</p>
              {isLoadingResponses ? (
                <InlineLoader />
              ) : userResponses.length === 0 ? (
                <p className="text-stone-400 text-sm italic">No responses submitted yet.</p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {userResponses.map((r) => (
                    <div key={r.id} className="bg-stone-50 rounded-lg p-3">
                      <p className="text-xs text-stone-500 font-medium mb-1">{r.question?.text}</p>
                      <p className="text-sm text-stone-700">{getAnswerDisplay(r)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-stone-100">
              <Button
                size="sm"
                variant={selectedUser.is_active ? 'danger' : 'secondary'}
                onClick={() => toggleStatus(selectedUser)}
                leftIcon={selectedUser.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
              >
                {selectedUser.is_active ? 'Deactivate user' : 'Activate user'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
