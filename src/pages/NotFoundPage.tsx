import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50/30 to-stone-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 max-w-sm"
      >
        <div className="text-6xl">🌹</div>
        <div className="space-y-2">
          <h1 className="font-cormorant text-3xl font-light text-stone-800 italic">
            Lost in the garden
          </h1>
          <p className="text-stone-500 font-light text-sm">
            This page doesn't exist, but our story does.
          </p>
        </div>
        <Link to="/">
          <Button variant="secondary">Return home</Button>
        </Link>
      </motion.div>
    </div>
  );
}
