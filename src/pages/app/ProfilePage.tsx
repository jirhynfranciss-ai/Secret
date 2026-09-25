import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { getFriendlyError, logError } from '@/utils/errors';

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [isPwSaving, setIsPwSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      setNameError('Display name is required');
      return;
    }
    if (!user) return;
    setIsSaving(true);
    setError('');
    setNameError('');
    try {
      await authService.updateProfile(user.id, {
        display_name: displayName.trim(),
        bio: bio.trim() || null,
      });
      await refreshProfile();
      toast.success('Profile updated.');
    } catch (err) {
      logError('ProfilePage', err);
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
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      logError('ProfilePage password', err);
      setPwError(getFriendlyError(err));
    } finally {
      setIsPwSaving(false);
    }
  };

  return (
    <div className="px-4 md:px-8 py-8 md:py-10 pb-24 md:pb-10 max-w-xl">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="space-y-1">
          <h1 className="font-cormorant text-3xl font-light text-stone-800 italic">Your Profile</h1>
          <p className="text-stone-500 font-light text-sm">Manage your account details</p>
        </div>

        {/* Avatar & info */}
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-200 to-pink-200 flex items-center justify-center shrink-0">
              <span className="text-2xl font-medium text-rose-600">
                {profile?.display_name?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-stone-800">{profile?.display_name}</p>
              <p className="text-sm text-stone-400 font-light">{profile?.email}</p>
              {profile?.created_at && (
                <p className="text-xs text-stone-300">
                  Joined {format(new Date(profile.created_at), 'MMMM d, yyyy')}
                </p>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Edit profile */}
        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-sm font-medium text-stone-700">Edit Profile</h2>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <Input
              label="Display name"
              value={displayName}
              onChange={e => { setDisplayName(e.target.value); setNameError(''); }}
              error={nameError}
              placeholder="Your name"
            />

            <Textarea
              label="Bio (optional)"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="A little something about yourself..."
              rows={3}
            />

            <Button onClick={handleSaveProfile} isLoading={isSaving} leftIcon={<Save size={14} />}>
              Save changes
            </Button>
          </CardBody>
        </Card>

        {/* Password */}
        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-sm font-medium text-stone-700">Change Password</h2>

            {pwError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <p className="text-xs text-red-600">{pwError}</p>
              </div>
            )}

            <Input
              label="New password"
              type="password"
              value={pwForm.next}
              onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
              placeholder="••••••••"
              autoComplete="new-password"
            />

            <Input
              label="Confirm new password"
              type="password"
              value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              placeholder="••••••••"
              autoComplete="new-password"
            />

            <Button onClick={handleSavePassword} isLoading={isPwSaving} variant="secondary">
              Update password
            </Button>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}
