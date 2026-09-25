import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, BookHeart, Bell, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { responsesService } from '@/services/responses.service';
import { notificationsService } from '@/services/notifications.service';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const container = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const item = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function HomePage() {
  const { profile, user } = useAuth();
  const [hasAnswers, setHasAnswers] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good morning');
    else if (h < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  useEffect(() => {
    if (!user) return;
    responsesService.hasSubmittedResponses(user.id).then(setHasAnswers).catch(() => {});
    notificationsService.getUnreadCount(user.id).then(setUnreadCount).catch(() => {});
  }, [user]);

  const quickLinks = [
    {
      to: '/app/story',
      icon: BookHeart,
      label: 'Our Story',
      description: 'Your answers to their questions',
      badge: hasAnswers ? 'Answered' : 'Pending',
      badgeVariant: hasAnswers ? 'green' as const : 'amber' as const,
    },
    {
      to: '/app/messages',
      icon: MessageCircle,
      label: 'Messages',
      description: 'Your private conversation',
      badge: null,
      badgeVariant: 'rose' as const,
    },
    {
      to: '/app/notifications',
      icon: Bell,
      label: 'Notifications',
      description: 'Updates and messages',
      badge: unreadCount > 0 ? `${unreadCount} new` : null,
      badgeVariant: 'rose' as const,
    },
  ];

  return (
    <div className="px-4 md:px-8 py-8 md:py-10 pb-24 md:pb-10 max-w-2xl">
      <motion.div variants={container} initial="initial" animate="animate" className="space-y-6">
        {/* Greeting */}
        <motion.div variants={item} className="space-y-2">
          <p className="text-sm text-stone-400 font-light">{greeting} ✦</p>
          <h1 className="font-cormorant text-3xl md:text-4xl font-light text-stone-800">
            Welcome, <span className="italic text-rose-500">{profile?.display_name}</span> 💕
          </h1>
          <p className="text-stone-500 font-light text-sm leading-relaxed">
            A little corner of the internet just for us.
          </p>
        </motion.div>

        {/* Romantic quote */}
        <motion.div
          variants={item}
          className="bg-gradient-to-br from-rose-50 to-pink-50/50 rounded-2xl border border-rose-100 p-6"
        >
          <p className="font-cormorant text-lg italic text-stone-700 leading-relaxed">
            "The most beautiful things in the world cannot be seen or touched — they must be felt with the heart."
          </p>
          <p className="mt-3 text-xs text-stone-400 font-light">— Antoine de Saint-Exupéry</p>
        </motion.div>

        {/* Quick links */}
        <motion.div variants={item} className="space-y-3">
          <h2 className="text-sm font-medium text-stone-500 tracking-wide uppercase">Your space</h2>
          {quickLinks.map(({ to, icon: Icon, label, description, badge, badgeVariant }) => (
            <Link key={to} to={to}>
              <Card className="hover:shadow-md hover:border-rose-200 transition-all duration-200">
                <CardBody className="flex items-center gap-4 py-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-rose-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-stone-700">{label}</p>
                      {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
                    </div>
                    <p className="text-xs text-stone-400 font-light">{description}</p>
                  </div>
                  <ChevronRight size={16} className="text-stone-300 shrink-0" />
                </CardBody>
              </Card>
            </Link>
          ))}
        </motion.div>

        {/* Special note */}
        {!hasAnswers && (
          <motion.div
            variants={item}
            className="bg-amber-50 border border-amber-100 rounded-2xl p-5 space-y-3"
          >
            <p className="text-sm font-medium text-amber-800">✨ Complete your questionnaire</p>
            <p className="text-xs text-amber-700 font-light leading-relaxed">
              Your secret admirer is waiting for your answers. Head to Our Story to complete the questionnaire.
            </p>
            <Link
              to="/app/story"
              className="inline-flex items-center gap-1 text-xs text-amber-700 font-medium underline"
            >
              Go to Our Story <ChevronRight size={12} />
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
