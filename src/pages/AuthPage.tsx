import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getFriendlyError } from '@/utils/errors';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, resetPassword, updatePassword, isInitialized, user, role } = useAuth();

  const [mode, setMode] = useState<AuthMode>(() => {
    const m = searchParams.get('mode');
    if (m === 'register') return 'register';
    if (m === 'forgot') return 'forgot';
    return 'login';
  });

  const [form, setForm] = useState({ email: '', password: '', name: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Check if this is a password reset callback
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setMode('reset');
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isInitialized && user) {
      if (role === 'admin') navigate('/admin', { replace: true });
      else navigate('/app', { replace: true });
    }
  }, [isInitialized, user, role, navigate]);

  const validate = () => {
    const newErrors: Partial<typeof form> = {};
    if (!form.email && mode !== 'reset') newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && mode !== 'reset') newErrors.email = 'Enter a valid email';
    
    if (mode === 'login' || mode === 'register' || mode === 'reset') {
      if (!form.password) newErrors.password = 'Password is required';
      else if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    }
    if (mode === 'register') {
      if (!form.name.trim()) newErrors.name = 'Your name is required';
      if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }
    if (mode === 'reset') {
      if (!form.password) newErrors.password = 'New password is required';
      if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      if (mode === 'login') {
        await signIn(form.email, form.password);
        // Redirect handled by useEffect above
      } else if (mode === 'register') {
        await signUp(form.email, form.password, form.name.trim());
        setSuccessMessage("You're registered! If email confirmation is required, check your inbox. Otherwise, sign in below.");
        setMode('login');
      } else if (mode === 'forgot') {
        await resetPassword(form.email);
        setSuccessMessage("We've sent a password reset link to your email.");
      } else if (mode === 'reset') {
        await updatePassword(form.password);
        toast.success('Password updated! Please sign in.');
        setMode('login');
      }
    } catch (err) {
      toast.error(getFriendlyError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors(er => ({ ...er, [field]: undefined }));
  };

  const titles: Record<AuthMode, string> = {
    login: 'Welcome back',
    register: 'Create your account',
    forgot: 'Reset your password',
    reset: 'Set a new password',
  };

  const subtitles: Record<AuthMode, string> = {
    login: 'Sign in to continue to your private space',
    register: 'Join to see a message waiting just for you',
    forgot: 'Enter your email and we will send you a reset link',
    reset: 'Choose a new password for your account',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50/30 to-stone-50 flex items-center justify-center px-4 py-12">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-rose-100/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-pink-100/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8 space-y-2">
          <Link to="/" className="inline-block">
            <div className="text-3xl">✦</div>
          </Link>
          <h1 className="font-cormorant text-2xl font-light text-stone-800 italic">{titles[mode]}</h1>
          <p className="text-sm text-stone-500 font-light">{subtitles[mode]}</p>
        </div>

        {/* Success message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl"
            >
              <p className="text-sm text-emerald-700 font-light">{successMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rose-100 shadow-xl shadow-rose-100/30 p-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === 'register' && (
              <Input
                label="Your name"
                type="text"
                placeholder="How shall I call you?"
                value={form.name}
                onChange={update('name')}
                error={errors.name}
                leftIcon={<User size={16} />}
                autoComplete="name"
                autoFocus
              />
            )}

            {mode !== 'reset' && (
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={update('email')}
                error={errors.email}
                leftIcon={<Mail size={16} />}
                autoComplete="email"
                autoFocus={mode !== 'register'}
              />
            )}

            {(mode === 'login' || mode === 'register' || mode === 'reset') && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-stone-700">
                  {mode === 'reset' ? 'New password' : 'Password'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={update('password')}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className={`w-full rounded-xl border px-4 py-3 pl-10 pr-10 text-sm text-stone-800 placeholder-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 ${
                      errors.password ? 'border-red-300 bg-red-50' : 'border-stone-200 hover:border-rose-200 bg-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>
            )}

            {(mode === 'register' || mode === 'reset') && (
              <Input
                label="Confirm password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                error={errors.confirmPassword}
                leftIcon={<Lock size={16} />}
                autoComplete="new-password"
              />
            )}

            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setSuccessMessage(''); }}
                  className="text-xs text-stone-400 hover:text-rose-500 transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            <Button type="submit" isLoading={isLoading} className="w-full mt-2">
              {mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Update password'}
            </Button>
          </form>
        </div>

        {/* Mode switcher */}
        <div className="text-center mt-6 space-y-2">
          {mode === 'login' && (
            <p className="text-sm text-stone-500 font-light">
              No account yet?{' '}
              <button
                onClick={() => { setMode('register'); setSuccessMessage(''); }}
                className="text-rose-500 hover:text-rose-600 font-medium transition-colors"
              >
                Create one
              </button>
            </p>
          )}
          {mode === 'register' && (
            <p className="text-sm text-stone-500 font-light">
              Already have an account?{' '}
              <button
                onClick={() => { setMode('login'); setSuccessMessage(''); }}
                className="text-rose-500 hover:text-rose-600 font-medium transition-colors"
              >
                Sign in
              </button>
            </p>
          )}
          {(mode === 'forgot' || mode === 'reset') && (
            <button
              onClick={() => { setMode('login'); setSuccessMessage(''); }}
              className="text-sm text-stone-400 hover:text-rose-500 transition-colors"
            >
              Back to sign in
            </button>
          )}
          <Link to="/" className="block text-xs text-stone-400 hover:text-rose-400 transition-colors mt-2">
            ← Back to the beginning
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
