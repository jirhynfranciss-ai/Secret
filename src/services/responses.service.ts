import { supabase } from '@/lib/supabase';
import type { Response } from '@/types';

export const responsesService = {
  async getUserResponses(userId: string): Promise<Response[]> {
    const { data, error } = await supabase
      .from('responses')
      .select('*, question:questions(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as Response[];
  },

  async hasSubmittedResponses(userId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('responses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return (count || 0) > 0;
  },

  async submitResponses(
    userId: string,
    answers: Array<{
      question_id: string;
      answer_text?: string | null;
      answer_choice?: string | null;
      answer_scale?: number | null;
    }>
  ): Promise<Response[]> {
    // Delete existing responses first to prevent duplicates
    await supabase.from('responses').delete().eq('user_id', userId);

    const rows = answers.map((a) => ({
      user_id: userId,
      question_id: a.question_id,
      answer_text: a.answer_text ?? null,
      answer_choice: a.answer_choice ?? null,
      answer_scale: a.answer_scale ?? null,
    }));

    const { data, error } = await supabase
      .from('responses')
      .insert(rows)
      .select('*, question:questions(*)');

    if (error) throw error;
    return (data || []) as Response[];
  },

  async getAllResponses(): Promise<Response[]> {
    const { data, error } = await supabase
      .from('responses')
      .select('*, question:questions(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Response[];
  },

  async getResponsesByUser(userId: string): Promise<Response[]> {
    const { data, error } = await supabase
      .from('responses')
      .select('*, question:questions(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as Response[];
  },
};
