export type Role = 'user' | 'admin';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  role: Role;
  avatar_url: string | null;
  bio: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  text: string;
  subtitle: string | null;
  type: 'text' | 'choice' | 'scale';
  options: string[] | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Response {
  id: string;
  user_id: string;
  question_id: string;
  answer_text: string | null;
  answer_choice: string | null;
  answer_scale: number | null;
  created_at: string;
  updated_at: string;
  question?: Question;
}

export interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  members?: ConversationMember[];
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  profile?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender?: Profile;
  // optimistic UI support
  is_pending?: boolean;
  is_failed?: boolean;
  temp_id?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'message' | 'admin' | 'system';
  is_read: boolean;
  related_id: string | null;
  created_at: string;
}

export interface AdminStats {
  totalUsers: number;
  newUsersToday: number;
  totalResponses: number;
  activeConversations: number;
  unreadMessages: number;
}

export interface AuthUser {
  id: string;
  email: string;
}

export type AppError = {
  message: string;
  code?: string;
  details?: string;
};
