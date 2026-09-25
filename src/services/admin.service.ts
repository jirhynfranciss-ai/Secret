import { supabase } from '@/lib/supabase';
import type { Profile, AdminStats } from '@/types';

export const adminService = {
  async getStats(): Promise<AdminStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      { count: totalUsers },
      { count: newUsersToday },
      { count: totalResponses },
      { count: activeConversations },
      { count: unreadMessages },
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user').gte('created_at', today.toISOString()),
      supabase.from('responses').select('id', { count: 'exact', head: true }),
      supabase.from('conversations').select('id', { count: 'exact', head: true }),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
    ]);

    return {
      totalUsers: totalUsers || 0,
      newUsersToday: newUsersToday || 0,
      totalResponses: totalResponses || 0,
      activeConversations: activeConversations || 0,
      unreadMessages: unreadMessages || 0,
    };
  },

  async getAllUsers(search?: string): Promise<Profile[]> {
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'user')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Profile[];
  },

  async getUserById(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Profile;
  },

  async setUserActiveStatus(userId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) throw error;
  },

  async getRecentActivity(): Promise<Array<{ type: string; description: string; created_at: string }>> {
    const [messages, registrations] = await Promise.all([
      supabase
        .from('messages')
        .select('id, content, created_at, sender:profiles!messages_sender_id_fkey(display_name)')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('profiles')
        .select('id, display_name, created_at')
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const activity: Array<{ type: string; description: string; created_at: string }> = [];

    (messages.data || []).forEach((m: any) => {
      activity.push({
        type: 'message',
        description: `${m.sender?.display_name || 'Someone'} sent a message`,
        created_at: m.created_at,
      });
    });

    (registrations.data || []).forEach((p: any) => {
      activity.push({
        type: 'registration',
        description: `${p.display_name} joined`,
        created_at: p.created_at,
      });
    });

    return activity.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);
  },
};
