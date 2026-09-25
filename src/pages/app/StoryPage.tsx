import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RefreshCw, AlertCircle, Edit3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { responsesService } from '@/services/responses.service';
import { Button } from '@/components/ui/Button';
import { InlineLoader } from '@/components/ui/LoadingScreen';
import { Card, CardBody } from '@/components/ui/Card';
import { getFriendlyError, logError } from '@/utils/errors';
import type { Response } from '@/types';

export default function StoryPage() {
  const { user } = useAuth();
  const [responses, setResponses] = useState<Response[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await responsesService.getUserResponses(user.id);
      setResponses(data);
    } catch (err) {
      logError('StoryPage', err);
      setError(getFriendlyError(err));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const getAnswerDisplay = (r: Response) => {
    if (r.answer_choice) return r.answer_choice;
    if (r.answer_text) return r.answer_text;
    if (r.answer_scale !== null && r.answer_scale !== undefined) return `${r.answer_scale} / 10`;
    return 'No answer provided';
  };

  return (
    <div className="px-4 md:px-8 py-8 md:py-10 pb-24 md:pb-10 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <div className="space-y-2">
          <h1 className="font-cormorant text-3xl font-light text-stone-800 italic">Our Story</h1>
          <p className="text-stone-500 font-light text-sm">
            Your heartfelt answers — kept here, just for the two of you.
          </p>
        </div>

        {isLoading && <InlineLoader />}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <p className="text-sm text-red-600 flex-1">{error}</p>
            <Button size="sm" variant="ghost" onClick={load} leftIcon={<RefreshCw size={14} />}>
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !error && responses.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <div className="text-4xl">📝</div>
            <p className="font-cormorant text-2xl text-stone-600 italic">Your answers await</p>
            <p className="text-stone-400 text-sm font-light">
              You haven't answered the questionnaire yet. Take your time.
            </p>
            <Link to="/questionnaire">
              <Button leftIcon={<Edit3 size={16} />} className="mt-2">
                Answer the questions
              </Button>
            </Link>
          </div>
        )}

        {!isLoading && responses.length > 0 && (
          <div className="space-y-4">
            {responses.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
              >
                <Card>
                  <CardBody className="space-y-3 py-5">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-rose-500">{i + 1}</span>
                      </div>
                      <div className="space-y-2 flex-1">
                        <p className="font-cormorant text-lg text-stone-700 font-light leading-relaxed">
                          {r.question?.text}
                        </p>
                        {r.question?.subtitle && (
                          <p className="text-xs text-stone-400">{r.question.subtitle}</p>
                        )}
                        <div className="mt-3 pt-3 border-t border-rose-50">
                          <p className={`font-light leading-relaxed ${
                            r.answer_scale !== null && r.answer_scale !== undefined
                              ? 'text-2xl font-cormorant text-rose-500'
                              : 'text-stone-600 text-sm'
                          }`}>
                            {getAnswerDisplay(r)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            ))}

            <div className="pt-4 text-center">
              <Link to="/questionnaire">
                <Button variant="outline" leftIcon={<Edit3 size={14} />} size="sm">
                  Update my answers
                </Button>
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
