import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, RefreshCw, GripVertical, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { questionsService } from '@/services/questions.service';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { InlineLoader } from '@/components/ui/LoadingScreen';
import { getFriendlyError, logError } from '@/utils/errors';
import type { Question } from '@/types';

type QuestionForm = {
  text: string;
  subtitle: string;
  type: Question['type'];
  options: string;
  is_active: boolean;
  order_index: number;
};

const emptyForm: QuestionForm = {
  text: '',
  subtitle: '',
  type: 'text',
  options: '',
  is_active: true,
  order_index: 0,
};

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [form, setForm] = useState<QuestionForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<QuestionForm>>({});

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await questionsService.getAllQuestions();
      setQuestions(data);
    } catch (err) {
      logError('QuestionsPage', err);
      setError(getFriendlyError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditingQuestion(null);
    setForm({ ...emptyForm, order_index: questions.length + 1 });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (q: Question) => {
    setEditingQuestion(q);
    setForm({
      text: q.text,
      subtitle: q.subtitle || '',
      type: q.type,
      options: q.options ? q.options.join('\n') : '',
      is_active: q.is_active,
      order_index: q.order_index,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = () => {
    const errors: Partial<QuestionForm> = {};
    if (!form.text.trim()) errors.text = 'Question text is required';
    if ((form.type === 'choice') && !form.options.trim()) {
      errors.options = 'Options are required for choice questions';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      const data = {
        text: form.text.trim(),
        subtitle: form.subtitle.trim() || null,
        type: form.type,
        options: form.type === 'choice'
          ? form.options.split('\n').map(o => o.trim()).filter(Boolean)
          : null,
        is_active: form.is_active,
        order_index: form.order_index,
      };

      if (editingQuestion) {
        const updated = await questionsService.updateQuestion(editingQuestion.id, data);
        setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? updated : q));
        toast.success('Question updated.');
      } else {
        const created = await questionsService.createQuestion(data);
        setQuestions(prev => [...prev, created]);
        toast.success('Question created.');
      }
      setModalOpen(false);
    } catch (err) {
      logError('QuestionsPage save', err);
      toast.error(getFriendlyError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (q: Question) => {
    if (!window.confirm(`Delete "${q.text}"? This will also delete all responses to this question.`)) return;
    try {
      await questionsService.deleteQuestion(q.id);
      setQuestions(prev => prev.filter(x => x.id !== q.id));
      toast.success('Question deleted.');
    } catch (err) {
      toast.error(getFriendlyError(err));
      logError('QuestionsPage delete', err);
    }
  };

  const toggleActive = async (q: Question) => {
    try {
      const updated = await questionsService.updateQuestion(q.id, { is_active: !q.is_active });
      setQuestions(prev => prev.map(x => x.id === q.id ? updated : x));
      toast.success(`Question ${q.is_active ? 'deactivated' : 'activated'}.`);
    } catch (err) {
      toast.error(getFriendlyError(err));
    }
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">Questions</h1>
          <p className="text-sm text-stone-400">{questions.length} questions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-lg hover:bg-stone-100 text-stone-400">
            <RefreshCw size={16} />
          </button>
          <Button size="sm" onClick={openCreate} leftIcon={<Plus size={14} />}>
            Add question
          </Button>
        </div>
      </div>

      {isLoading && <InlineLoader />}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl mb-4">
          <AlertCircle size={14} className="text-red-400" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!isLoading && questions.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <p className="text-stone-400">No questions yet. Create your first question.</p>
          <Button onClick={openCreate} leftIcon={<Plus size={14} />} size="sm">Create question</Button>
        </div>
      )}

      <AnimatePresence>
        <div className="space-y-2">
          {questions.map((q, i) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`bg-white rounded-xl border p-4 transition-all ${q.is_active ? 'border-stone-100' : 'border-dashed border-stone-200 opacity-60'}`}
            >
              <div className="flex items-start gap-3">
                <GripVertical size={16} className="text-stone-300 mt-1 shrink-0 cursor-grab" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs text-stone-400">#{q.order_index}</span>
                    <Badge variant={q.is_active ? 'green' : 'stone'}>{q.is_active ? 'Active' : 'Inactive'}</Badge>
                    <Badge variant="stone">{q.type}</Badge>
                  </div>
                  <p className="text-sm font-medium text-stone-700">{q.text}</p>
                  {q.subtitle && <p className="text-xs text-stone-400 mt-0.5">{q.subtitle}</p>}
                  {q.options && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {q.options.map((o) => (
                        <span key={o} className="text-xs bg-stone-50 border border-stone-100 px-2 py-0.5 rounded-full text-stone-500">{o}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleActive(q)}
                    className="p-1.5 rounded-lg hover:bg-stone-50 text-stone-400 hover:text-stone-600"
                    title={q.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {q.is_active ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} />}
                  </button>
                  <button
                    onClick={() => openEdit(q)}
                    className="p-1.5 rounded-lg hover:bg-stone-50 text-stone-400 hover:text-blue-500"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(q)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingQuestion ? 'Edit Question' : 'New Question'}
        size="md"
      >
        <div className="space-y-4">
          <Textarea
            label="Question text"
            value={form.text}
            onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
            error={formErrors.text}
            rows={3}
            placeholder="Ask something meaningful..."
          />
          <Input
            label="Subtitle (optional)"
            value={form.subtitle}
            onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
            placeholder="A gentle hint or context"
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-stone-700">Question type</label>
            <div className="flex gap-2">
              {(['text', 'choice', 'scale'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                    form.type === t ? 'bg-rose-50 border-rose-300 text-rose-600' : 'bg-white border-stone-200 text-stone-500'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {form.type === 'choice' && (
            <Textarea
              label="Options (one per line)"
              value={form.options}
              onChange={e => setForm(f => ({ ...f, options: e.target.value }))}
              error={formErrors.options}
              rows={4}
              placeholder="Option one&#10;Option two&#10;Option three"
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Order"
              type="number"
              value={form.order_index}
              onChange={e => setForm(f => ({ ...f, order_index: parseInt(e.target.value) || 0 }))}
              min={0}
            />
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="accent-rose-400"
                />
                <span className="text-sm text-stone-600">Active</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} isLoading={isSaving} className="flex-1">
              {editingQuestion ? 'Save changes' : 'Create question'}
            </Button>
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
