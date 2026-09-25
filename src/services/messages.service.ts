import { supabase } from '@/lib/supabase';
import type { Conversation, Message, ConversationMember } from '@/types';

const PAGE_SIZE = 30;

export const messagesService = {
  async getUserConversation(userId: string): Promise<Conversation | null> {
    const { data: membership, error: memberError } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (memberError) throw memberError;
    if (!membership) return null;

    const { data, error } = await supabase
      .from('conversations')
      .select('*, members:conversation_members(*, profile:profiles(*))')
      .eq('id', membership.conversation_id)
      .single();

    if (error) throw error;
    return data as Conversation;
  },

  async getOrCreateConversation(userId: string, adminId: string): Promise<Conversation> {
    // Check if conversation already exists
    const existing = await this.getUserConversation(userId);
    if (existing) return existing;

    // Create new conversation
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .insert({ title: 'Our Private Space' })
      .select()
      .single();

    if (convError) throw convError;

    // Add members
    const { error: membersError } = await supabase
      .from('conversation_members')
      .insert([
        { conversation_id: conv.id, user_id: userId },
        { conversation_id: conv.id, user_id: adminId },
      ]);

    if (membersError) throw membersError;

    return conv as Conversation;
  },

  async getMessages(conversationId: string, page = 0): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(*)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) throw error;
    return ((data || []) as Message[]).reverse();
  },

  async sendMessage(conversationId: string, senderId: string, content: string): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content.trim(),
      })
      .select('*, sender:profiles!messages_sender_id_fkey(*)')
      .single();

    if (error) throw error;
    return data as Message;
  },

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  },

  async getConversationMembers(conversationId: string): Promise<ConversationMember[]> {
    const { data, error } = await supabase
      .from('conversation_members')
      .select('*, profile:profiles(*)')
      .eq('conversation_id', conversationId);

    if (error) throw error;
    return (data || []) as ConversationMember[];
  },

  async getAllConversations(): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*, members:conversation_members(*, profile:profiles(*))')
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) throw error;
    return (data || []) as Conversation[];
  },

  subscribeToMessages(
    conversationId: string,
    onMessage: (message: Message) => void
  ) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch full message with sender profile
          const { data } = await supabase
            .from('messages')
            .select('*, sender:profiles!messages_sender_id_fkey(*)')
            .eq('id', payload.new.id)
            .single();
          if (data) onMessage(data as Message);
        }
      )
      .subscribe();
  },
};
