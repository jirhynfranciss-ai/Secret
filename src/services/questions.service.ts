import { supabase } from '@/lib/supabase';
import type { Question } from '@/types';

export const questionsService = {
  async getActiveQuestions(): Promise<Question[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return (data || []) as Question[];
  },

  async getAllQuestions(): Promise<Question[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw error;
    return (data || []) as Question[];
  },

  async createQuestion(question: Omit<Question, 'id' | 'created_at' | 'updated_at'>): Promise<Question> {
    const { data, error } = await supabase
      .from('questions')
      .insert(question)
      .select()
      .single();

    if (error) throw error;
    return data as Question;
  },

  async updateQuestion(id: string, updates: Partial<Omit<Question, 'id' | 'created_at'>>): Promise<Question> {
    const { data, error } = await supabase
      .from('questions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Question;
  },

  async deleteQuestion(id: string): Promise<void> {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async reorderQuestions(updates: { id: string; order_index: number }[]): Promise<void> {
    const promises = updates.map(({ id, order_index }) =>
      supabase.from('questions').update({ order_index, updated_at: new Date().toISOString() }).eq('id', id)
    );
    await Promise.all(promises);
  },
};
