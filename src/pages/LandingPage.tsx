import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'envelope' | 'message' | 'questions'>('envelope');
  const [lineIndex, setLineIndex] = useState(0);

  const messageLines = [
    "There is someone who has been watching you from afar for longer than you know.",
    "Someone who notices the way you laugh, the way you think, the way you move through the world.",
    "Someone who has wanted to say something — but was never quite sure of the words.",
    "Today, they found the courage.",
    "This letter is for you.",
  ];

  useEffect(() => {
    if (phase === 'message' && lineIndex < messageLines.length - 1) {
      const timer = setTimeout(() => setLineIndex(i => i + 1), 1800);
      return () => clearTimeout(timer);
    }
  }, [phase, lineIndex, messageLines.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50/40 to-stone-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/6 w-64 h-64 bg-rose-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-pink-100/20 rounded-full blur-3xl" />
      </div>

      <AnimatePresence mode="wait">
        {phase === 'envelope' && (
          <motion.div
            key="envelope"
            {...fadeUp}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8 max-w-md mx-auto"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="text-8xl"
              role="img"
              aria-label="envelope"
            >
              ✉️
            </motion.div>
            <div className="space-y-3">
              <h1 className="font-cormorant text-4xl font-light text-stone-800 italic">
                A letter has arrived for you
              </h1>
              <p className="text-stone-500 text-sm font-light leading-relaxed">
                Someone has been keeping a secret. Something they have wanted to say for a very long time.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => setPhase('message')}
              className="font-light tracking-wide"
            >
              Open the letter
            </Button>
          </motion.div>
        )}

        {phase === 'message' && (
          <motion.div
            key="message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl mx-auto w-full"
          >
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-rose-100 shadow-xl shadow-rose-100/40 p-8 md:p-12 space-y-8">
              {/* Letter header */}
              <div className="text-center space-y-2">
                <div className="text-2xl">✦</div>
                <p className="text-xs text-stone-400 tracking-widest uppercase font-light">A private note</p>
              </div>

              {/* Message lines */}
              <div className="space-y-5 min-h-[200px]">
                {messageLines.slice(0, lineIndex + 1).map((line, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className={`font-cormorant leading-relaxed ${
                      i === 3
                        ? 'text-rose-500 font-medium text-xl italic'
                        : i === 4
                        ? 'text-stone-800 text-2xl font-light italic'
                        : 'text-stone-600 text-lg font-light'
                    }`}
                  >
                    {line}
                  </motion.p>
                ))}
              </div>

              {/* CTA when all lines shown */}
              <AnimatePresence>
                {lineIndex >= messageLines.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="pt-4 border-t border-rose-100 space-y-4 text-center"
                  >
                    <p className="text-stone-500 text-sm font-light">
                      They have a few questions they would love for you to answer — 
                      so they can truly know your heart before asking the most important question.
                    </p>
                    <Button
                      size="lg"
                      onClick={() => setPhase('questions')}
                      className="font-light tracking-wide"
                    >
                      I'm ready to read on →
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {phase === 'questions' && (
          <motion.div
            key="questions"
            {...fadeUp}
            transition={{ duration: 0.6 }}
            className="max-w-xl mx-auto w-full text-center space-y-8"
          >
            <div className="space-y-4">
              <div className="text-4xl">🌹</div>
              <h2 className="font-cormorant text-3xl font-light text-stone-800 italic">
                They have a few questions for you
              </h2>
              <p className="text-stone-500 font-light leading-relaxed">
                Take your time with each one. Your answers will be kept just between the two of you. 
                When you are done, you will be asked the question that started all of this.
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-rose-100 p-6 shadow-sm space-y-3 text-left">
              {[
                'A few thoughtful questions',
                'Your answers are private and secure',
                'No pressure — answer at your own pace',
                'The most important question comes last',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-rose-400" />
                  </div>
                  <p className="text-sm text-stone-600 font-light">{item}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <Button
                size="lg"
                onClick={() => navigate('/questionnaire')}
                className="w-full font-light tracking-wide"
              >
                Begin the questionnaire
              </Button>
              <button
                onClick={() => navigate('/login')}
                className="text-sm text-stone-400 hover:text-rose-500 transition-colors"
              >
                Already have an account? Sign in
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
