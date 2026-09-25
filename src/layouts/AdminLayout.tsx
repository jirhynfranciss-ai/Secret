import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, MessageSquare, Settings,
  LogOut, Menu, X, HelpCircle, Bell, BookOpen, User,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { getFriendlyError } from '@/utils/errors';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/users', icon: Users, label: 'Users', end: false },
  { to: '/admin/responses', icon: BookOpen, label: 'Responses', end: false },
  { to: '/admin/conversations', icon: MessageSquare, label: 'Conversations', end: false },
  { to: '/admin/questions', icon: HelpCircle, label: 'Questions', end: false },
  { to: '/admin/notifications', icon: Bell, label: 'Notifications', end: false },
  { to: '/admin/settings', icon: Settings, label: 'Settings', end: false },
  { to: '/admin/profile', icon: User, label: 'Profile', end: false },
];

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(getFriendlyError(err));
    }
  };

  const NavContent = () => (
    <>
      <div className="px-6 py-5 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
            <span className="text-rose-500 text-sm">✦</span>
          </div>
          <div>
            <p className="font-semibold text-stone-800 text-sm">Admin Portal</p>
            <p className="text-xs text-stone-400">Secret Admirer</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
            <span className="text-xs font-medium text-rose-500">
              {profile?.display_name?.[0]?.toUpperCase() || 'A'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-stone-700 truncate">{profile?.display_name}</p>
            <p className="text-[10px] text-stone-400 truncate">Administrator</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-rose-50 text-rose-600 font-medium'
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-stone-100">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all w-full"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 fixed inset-y-0 left-0 flex-col bg-white border-r border-stone-100 z-20">
        <NavContent />
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-stone-100 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-stone-700">Admin Portal</span>
        </div>
        <button onClick={() => setMobileOpen(o => !o)} className="p-2">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/20 z-20"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25 }}
              className="md:hidden fixed inset-y-0 left-0 w-56 bg-white z-30 flex flex-col border-r border-stone-100"
            >
              <NavContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="md:ml-56 flex-1 pt-14 md:pt-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
