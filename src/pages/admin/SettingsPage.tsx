import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { getFriendlyError, logError } from '@/utils/errors';

export default function SettingsPage() {
  const { profile, user, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [pwForm, setPwForm] = useState({ next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [isPwSaving, setIsPwSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!displayName.trim()) { setError('Display name is required'); return; }
    setIsSaving(true);
    setError('');
    try {
      await authService.updateProfile(user.id, { display_name: displayName.trim(), bio: bio.trim() || null });
      await refreshProfile();
      toast.success('Settings saved.');
    } catch (err) {
      logError('SettingsPage', err);
      setError(getFriendlyError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async () => {
    setPwError('');
    if (!pwForm.next) { setPwError('New password is required'); return; }
    if (pwForm.next.length < 6) { setPwError('Password must be at least 6 characters'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match'); return; }
    setIsPwSaving(true);
    try {
      await authService.updatePassword(pwForm.next);
      toast.success('Password updated.');
      setPwForm({ next: '', confirm: '' });
    } catch (err) {
      logError('SettingsPage password', err);
      setPwError(getFriendlyError(err));
    } finally {
      setIsPwSaving(false);
    }
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">Settings</h1>
          <p className="text-sm text-stone-400">Manage your admin profile and preferences</p>
        </div>

        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-sm font-semibold text-stone-700">Profile</h2>
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle size={14} className="text-red-400" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}
            <Input label="Display name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
            <Textarea label="Bio (optional)" value={bio} onChange={e => setBio(e.target.value)} rows={3} />
            <Button onClick={handleSaveProfile} isLoading={isSaving} leftIcon={<Save size={14} />} size="sm">
              Save profile
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-sm font-semibold text-stone-700">Security</h2>
            {pwError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle size={14} className="text-red-400" />
                <p className="text-xs text-red-600">{pwError}</p>
              </div>
            )}
            <Input label="New password" type="password" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} placeholder="••••••••" />
            <Input label="Confirm password" type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} placeholder="••••••••" />
            <Button onClick={handleSavePassword} isLoading={isPwSaving} variant="secondary" size="sm">
              Update password
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-2">
            <h2 className="text-sm font-semibold text-stone-700">Account Information</h2>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-400">Email</span>
                <span className="text-stone-700">{profile?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Role</span>
                <span className="text-stone-700 capitalize">{profile?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">User ID</span>
                <span className="text-stone-400 font-mono text-xs">{user?.id?.slice(0, 12)}...</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}
