import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { questionsService } from '@/services/questions.service';
import { responsesService } from '@/services/responses.service';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { InlineLoader } from '@/components/ui/LoadingScreen';
import { getFriendlyError, logError } from '@/utils/errors';
import type { Question } from '@/types';

type AnswerMap = Record<string, { text?: string; choice?: string; scale?: number }>;

const STORAGE_KEY = 'admirer_questionnaire_answers';

export default function QuestionnairePage() {
  const navigate = useNavigate();
  const { user, isInitialized } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  // Load saved answers from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setAnswers(JSON.parse(saved));
      } catch { /* ignore */ }
    }
  }, []);

  // Persist answers
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    }
  }, [answers]);

  const loadQuestions = useCallback(async () => {
    setIsLoadingQuestions(true);
    setFetchError('');
    try {
      const qs = await questionsService.getActiveQuestions();
      setQuestions(qs);
    } catch (err) {
      logError('QuestionnairePage', err);
      setFetchError(getFriendlyError(err));
    } finally {
      setIsLoadingQuestions(false);
    }
  }, []);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  // If user is already authenticated, check if they've already submitted
  useEffect(() => {
    if (!isInitialized || !user) return;
    responsesService.hasSubmittedResponses(user.id).then(has => {
      if (has) navigate('/app', { replace: true });
    }).catch(() => {});
  }, [isInitialized, user, navigate]);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  const hasAnswer = (q: Question, a?: { text?: string; choice?: string; scale?: number }) => {
    if (!a) return false;
    if (q.type === 'text') return !!a.text?.trim();
    if (q.type === 'choice') return !!a.choice;
    if (q.type === 'scale') return a.scale !== undefined && a.scale !== null;
    return false;
  };

  const setAnswer = (value: { text?: string; choice?: string; scale?: number }) => {
    if (!currentQuestion) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const goNext = () => {
    if (!currentQuestion) return;
    if (currentIndex < questions.length - 1) {
      setDirection(1);
      setCurrentIndex(i => i + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(i => i - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      // Save answers and redirect to register
      navigate('/login?mode=register');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    const answersArray = questions.map(q => ({
      question_id: q.id,
      answer_text: answers[q.id]?.text ?? null,
      answer_choice: answers[q.id]?.choice ?? null,
      answer_scale: answers[q.id]?.scale ?? null,
    }));

    try {
      await responsesService.submitResponses(user.id, answersArray);
      localStorage.removeItem(STORAGE_KEY);
      setIsComplete(true);
      toast.success('Your answers have been saved.');
      setTimeout(() => navigate('/app'), 2500);
    } catch (err) {
      logError('QuestionnairePage submit', err);
      setSubmitError(getFriendlyError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalNext = () => {
    if (!user) {
      navigate('/login?mode=register');
    } else {
      handleSubmit();
    }
  };

  if (isLoadingQuestions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50/30 to-stone-50 flex items-center justify-center">
        <InlineLoader />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50/30 to-stone-50 flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="mx-auto text-rose-400" size={32} />
          <p className="text-stone-600 font-light">{fetchError}</p>
          <Button onClick={loadQuestions} leftIcon={<RefreshCw size={16} />} variant="secondary">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50/30 to-stone-50 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="font-cormorant text-2xl text-stone-600 italic">The questions are being prepared...</p>
          <p className="text-stone-400 text-sm font-light">Please check back soon.</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50/30 to-stone-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-sm"
        >
          <div className="text-6xl">🌹</div>
          <h2 className="font-cormorant text-3xl font-light text-stone-800 italic">Thank you</h2>
          <p className="text-stone-500 font-light">Your answers have been received. Taking you to your private space...</p>
        </motion.div>
      </div>
    );
  }

  const isLastQuestion = currentIndex === questions.length - 1;
  const answered = hasAnswer(currentQuestion, currentAnswer);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50/30 to-stone-50 flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-rose-100 z-10">
        <motion.div
          className="h-full bg-rose-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Header */}
        <div className="w-full max-w-xl mb-8">
          <div className="flex items-center justify-between text-sm text-stone-400 font-light">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
        </div>

        {/* Question card */}
        <div className="w-full max-w-xl relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rose-100 shadow-lg shadow-rose-100/30 p-8"
            >
              {/* Question number decoration */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                  <span className="text-xs font-medium text-rose-500">{currentIndex + 1}</span>
                </div>
                {isLastQuestion && (
                  <span className="text-xs text-rose-400 font-light tracking-wide">The final question</span>
                )}
              </div>

              <h2 className="font-cormorant text-2xl font-light text-stone-800 leading-relaxed mb-2">
                {currentQuestion.text}
              </h2>
              {currentQuestion.subtitle && (
                <p className="text-sm text-stone-400 font-light mb-6">{currentQuestion.subtitle}</p>
              )}

              <div className="mt-6">
                {currentQuestion.type === 'text' && (
                  <Textarea
                    placeholder="Write your thoughts here..."
                    value={currentAnswer?.text || ''}
                    onChange={e => setAnswer({ text: e.target.value })}
                    rows={4}
                    className="text-base"
                  />
                )}

                {currentQuestion.type === 'choice' && currentQuestion.options && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option) => (
                      <motion.button
                        key={option}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setAnswer({ choice: option })}
                        className={`w-full text-left px-5 py-3.5 rounded-xl border text-sm font-light transition-all duration-200 ${
                          currentAnswer?.choice === option
                            ? 'border-rose-300 bg-rose-50 text-rose-700 shadow-sm shadow-rose-100'
                            : 'border-stone-200 bg-white text-stone-600 hover:border-rose-200 hover:bg-rose-50/30'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                            currentAnswer?.choice === option ? 'border-rose-400' : 'border-stone-300'
                          }`}>
                            {currentAnswer?.choice === option && (
                              <span className="w-2 h-2 rounded-full bg-rose-400 block" />
                            )}
                          </span>
                          {option}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'scale' && (
                  <div className="space-y-4">
                    <div className="flex gap-2 flex-wrap justify-center">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <motion.button
                          key={n}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setAnswer({ scale: n })}
                          className={`w-10 h-10 rounded-full text-sm font-medium transition-all duration-200 ${
                            currentAnswer?.scale === n
                              ? 'bg-rose-400 text-white shadow-md shadow-rose-200'
                              : 'bg-rose-50 text-rose-400 hover:bg-rose-100'
                          }`}
                        >
                          {n}
                        </motion.button>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-stone-400 font-light px-1">
                      <span>Not at all</span>
                      <span>Absolutely</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Error */}
        {submitError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 w-full max-w-xl p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
          >
            <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-red-700">{submitError}</p>
              <button
                onClick={handleSubmit}
                className="text-xs text-red-500 underline mt-1"
              >
                Try again
              </button>
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="mt-8 w-full max-w-xl flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={goPrev}
            disabled={currentIndex === 0}
            leftIcon={<ChevronLeft size={16} />}
          >
            Previous
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={handleFinalNext}
              isLoading={isSubmitting}
              disabled={!answered}
              rightIcon={<span>→</span>}
              size="lg"
              className="font-light"
            >
              {user ? 'Submit my answers' : 'Continue to register'}
            </Button>
          ) : (
            <Button
              onClick={goNext}
              disabled={!answered}
              rightIcon={<ChevronRight size={16} />}
            >
              Next
            </Button>
          )}
        </div>

        {/* Skip hint */}
        {!answered && (
          <p className="mt-3 text-xs text-stone-400 font-light">Answer this question to continue</p>
        )}
      </div>
    </div>
  );
}
