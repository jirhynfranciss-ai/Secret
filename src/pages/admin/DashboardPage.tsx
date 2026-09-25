import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, MessageSquare, BookOpen, Activity, RefreshCw, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { adminService } from '@/services/admin.service';
import { InlineLoader } from '@/components/ui/LoadingScreen';
import { getFriendlyError, logError } from '@/utils/errors';
import type { AdminStats } from '@/types';

const container = { animate: { transition: { staggerChildren: 0.06 } } };
const card = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}

function StatCard({ icon: Icon, label, value, color, bgColor }: StatCardProps) {
  return (
    <motion.div variants={card} className="bg-white rounded-xl border border-stone-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-9 h-9 rounded-lg ${bgColor} flex items-center justify-center`}>
          <Icon size={16} className={color} />
        </div>
      </div>
      <p className="text-2xl font-semibold text-stone-800">{value.toLocaleString()}</p>
      <p className="text-sm text-stone-500 mt-1">{label}</p>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activity, setActivity] = useState<Array<{ type: string; description: string; created_at: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [s, a] = await Promise.all([
        adminService.getStats(),
        adminService.getRecentActivity(),
      ]);
      setStats(s);
      setActivity(a);
    } catch (err) {
      logError('AdminDashboard', err);
      setError(getFriendlyError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const statCards = stats ? [
    { icon: Users, label: 'Total Users', value: stats.totalUsers, color: 'text-blue-500', bgColor: 'bg-blue-50' },
    { icon: Users, label: 'New Today', value: stats.newUsersToday, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
    { icon: BookOpen, label: 'Total Responses', value: stats.totalResponses, color: 'text-rose-500', bgColor: 'bg-rose-50' },
    { icon: MessageSquare, label: 'Conversations', value: stats.activeConversations, color: 'text-purple-500', bgColor: 'bg-purple-50' },
    { icon: Bell, label: 'Unread Messages', value: stats.unreadMessages, color: 'text-amber-500', bgColor: 'bg-amber-50' },
  ] : [];

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">Dashboard</h1>
          <p className="text-sm text-stone-400">Overview of your application</p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {isLoading && <InlineLoader />}

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl mb-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {stats && (
        <motion.div variants={container} initial="initial" animate="animate" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {statCards.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          {/* Recent activity */}
          <div className="bg-white rounded-xl border border-stone-100 shadow-sm">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
              <Activity size={16} className="text-stone-400" />
              <h2 className="text-sm font-semibold text-stone-700">Recent Activity</h2>
            </div>
            {activity.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-stone-400">No recent activity</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-50">
                {activity.map((a, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${a.type === 'message' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                      <p className="text-sm text-stone-600">{a.description}</p>
                    </div>
                    <p className="text-xs text-stone-400">
                      {format(new Date(a.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
