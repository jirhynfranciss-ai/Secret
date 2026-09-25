import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, BookHeart, MessageCircle, Bell, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { getFriendlyError } from '@/utils/errors';

const navItems = [
  { to: '/app', icon: Home, label: 'Home', end: true },
  { to: '/app/story', icon: BookHeart, label: 'Our Story', end: false },
  { to: '/app/messages', icon: MessageCircle, label: 'Messages', end: false },
  { to: '/app/notifications', icon: Bell, label: 'Notifications', end: false },
  { to: '/app/profile', icon: User, label: 'Profile', end: false },
];

export default function AppLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(getFriendlyError(err));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/60 via-pink-50/20 to-stone-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col bg-white/80 backdrop-blur-sm border-r border-rose-100 z-20">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-rose-50">
          <div className="flex items-center gap-3">
            <div className="text-xl">✦</div>
            <div>
              <p className="font-cormorant text-lg font-light text-stone-800 italic">Just for Us</p>
              <p className="text-xs text-stone-400">Private space</p>
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className="px-6 py-4 border-b border-rose-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center">
              <span className="text-sm font-medium text-rose-500">
                {profile?.display_name?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-stone-800 truncate">{profile?.display_name}</p>
              <p className="text-xs text-stone-400 truncate">{profile?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-light transition-all duration-200 ${
                  isActive
                    ? 'bg-rose-50 text-rose-600 font-medium'
                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-rose-50">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-light text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 w-full"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white/80 backdrop-blur-sm border-b border-rose-100 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">✦</span>
          <span className="font-cormorant text-lg font-light italic text-stone-800">Just for Us</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(o => !o)}
          className="p-2 rounded-lg text-stone-500"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.25 }}
            className="md:hidden fixed inset-y-0 right-0 w-72 bg-white z-30 shadow-xl border-l border-rose-100 flex flex-col"
          >
            <div className="px-6 py-5 border-b border-rose-50 flex justify-between items-center">
              <span className="font-cormorant text-lg italic text-stone-800">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-stone-50">
                <X size={18} className="text-stone-400" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                      isActive ? 'bg-rose-50 text-rose-600 font-medium' : 'text-stone-500 hover:bg-stone-50'
                    }`
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="px-3 py-4 border-t border-rose-50">
              <button
                onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-stone-400 hover:text-red-500 hover:bg-red-50 w-full"
              >
                <LogOut size={18} />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="md:ml-64 pt-14 md:pt-0 min-h-screen">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-sm border-t border-rose-100">
        <div className="flex">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2.5 gap-0.5 text-xs font-light transition-colors ${
                  isActive ? 'text-rose-500' : 'text-stone-400'
                }`
              }
            >
              <Icon size={20} />
              <span className="text-[10px]">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
