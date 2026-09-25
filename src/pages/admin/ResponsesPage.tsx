import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { adminService } from '@/services/admin.service';
import { responsesService } from '@/services/responses.service';
import { InlineLoader } from '@/components/ui/LoadingScreen';
import { getFriendlyError, logError } from '@/utils/errors';
import type { Profile, Response } from '@/types';

export default function ResponsesPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [userResponses, setUserResponses] = useState<Record<string, Response[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingUser, setLoadingUser] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (err) {
      logError('ResponsesPage', err);
      setError(getFriendlyError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleUser = async (userId: string) => {
    if (expanded === userId) {
      setExpanded(null);
      return;
    }
    setExpanded(userId);
    if (userResponses[userId]) return;

    setLoadingUser(userId);
    try {
      const r = await responsesService.getResponsesByUser(userId);
      setUserResponses(prev => ({ ...prev, [userId]: r }));
    } catch (err) {
      logError('ResponsesPage load user', err);
    } finally {
      setLoadingUser(null);
    }
  };

  const getAnswerDisplay = (r: Response) => {
    if (r.answer_choice) return r.answer_choice;
    if (r.answer_text) return r.answer_text;
    if (r.answer_scale !== null && r.answer_scale !== undefined) return `${r.answer_scale} / 10`;
    return '—';
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">Responses</h1>
          <p className="text-sm text-stone-400">All questionnaire responses by user</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg hover:bg-stone-100 text-stone-400">
          <RefreshCw size={16} />
        </button>
      </div>

      {isLoading && <InlineLoader />}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
          <AlertCircle size={14} className="text-red-400" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!isLoading && users.length === 0 && (
        <p className="text-center text-stone-400 py-12">No users yet.</p>
      )}

      <div className="space-y-2">
        {users.map((user, i) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-white rounded-xl border border-stone-100 overflow-hidden"
          >
            <button
              onClick={() => toggleUser(user.user_id)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                  <span className="text-xs font-medium text-rose-500">
                    {user.display_name?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-stone-700">{user.display_name}</p>
                  <p className="text-xs text-stone-400">
                    Joined {format(new Date(user.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {userResponses[user.user_id] && (
                  <span className="text-xs text-stone-400">
                    {userResponses[user.user_id].length} answers
                  </span>
                )}
                {expanded === user.user_id ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
              </div>
            </button>

            {expanded === user.user_id && (
              <div className="border-t border-stone-100 px-5 py-4 bg-stone-50/50">
                {loadingUser === user.user_id ? (
                  <InlineLoader />
                ) : !userResponses[user.user_id] || userResponses[user.user_id].length === 0 ? (
                  <p className="text-sm text-stone-400 italic text-center py-4">No responses submitted.</p>
                ) : (
                  <div className="space-y-3">
                    {userResponses[user.user_id].map((r) => (
                      <div key={r.id} className="bg-white rounded-lg border border-stone-100 p-3">
                        <p className="text-xs text-stone-500 font-medium mb-1.5">{r.question?.text}</p>
                        <p className="text-sm text-stone-700 font-light">{getAnswerDisplay(r)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
