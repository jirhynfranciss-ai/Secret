import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function AdminProfilePage() {
  const { profile, user } = useAuth();

  return (
    <div className="px-4 md:px-8 py-6 max-w-xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">Admin Profile</h1>
          <p className="text-sm text-stone-400">Your administrator account</p>
        </div>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-200 to-pink-200 flex items-center justify-center">
              <span className="text-2xl font-semibold text-rose-600">
                {profile?.display_name?.[0]?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-stone-800">{profile?.display_name}</p>
              <p className="text-sm text-stone-400">{profile?.email}</p>
              <Badge variant="rose">Administrator</Badge>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <h2 className="text-sm font-semibold text-stone-700">Account Details</h2>
            <div className="space-y-2 text-sm">
              {[
                ['Email', profile?.email],
                ['Role', profile?.role],
                ['Member since', profile?.created_at ? format(new Date(profile.created_at), 'MMMM d, yyyy') : '—'],
                ['User ID', user?.id?.slice(0, 20) + '...'],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between items-center py-1.5 border-b border-stone-50 last:border-0">
                  <span className="text-stone-400">{label}</span>
                  <span className="text-stone-700 font-mono text-xs">{value}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}
