import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, AlertCircle, MessageCircle, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { messagesService } from '@/services/messages.service';
import { InlineLoader } from '@/components/ui/LoadingScreen';
import { Modal } from '@/components/ui/Modal';
import { getFriendlyError, logError } from '@/utils/errors';
import type { Conversation, Message } from '@/types';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [convMessages, setConvMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await messagesService.getAllConversations();
      setConversations(data);
    } catch (err) {
      logError('ConversationsPage', err);
      setError(getFriendlyError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openConversation = async (conv: Conversation) => {
    setSelectedConv(conv);
    setIsLoadingMessages(true);
    try {
      const msgs = await messagesService.getMessages(conv.id, 0);
      setConvMessages(msgs);
    } catch (err) {
      logError('ConversationsPage messages', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const getMemberNames = (conv: Conversation) => {
    return conv.members?.map(m => m.profile?.display_name || 'Unknown').join(', ') || '—';
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">Conversations</h1>
          <p className="text-sm text-stone-400">{conversations.length} conversations</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg hover:bg-stone-100 text-stone-400">
          <RefreshCw size={16} />
        </button>
      </div>

      {isLoading && <InlineLoader />}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
          <AlertCircle size={14} className="text-red-400" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!isLoading && conversations.length === 0 && (
        <div className="text-center py-12 space-y-2">
          <MessageCircle size={28} className="mx-auto text-stone-300" />
          <p className="text-stone-400 text-sm">No conversations yet.</p>
        </div>
      )}

      <div className="space-y-2">
        {conversations.map((conv, i) => (
          <motion.div
            key={conv.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-white rounded-xl border border-stone-100 p-4 flex items-center gap-4 hover:border-stone-200 cursor-pointer transition-colors"
            onClick={() => openConversation(conv)}
          >
            <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
              <MessageCircle size={16} className="text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-700">{conv.title || 'Private Conversation'}</p>
              <p className="text-xs text-stone-400 truncate">{getMemberNames(conv)}</p>
            </div>
            <div className="text-right shrink-0">
              {conv.last_message_at && (
                <p className="text-xs text-stone-400">
                  {format(new Date(conv.last_message_at), 'MMM d, h:mm a')}
                </p>
              )}
            </div>
            <ChevronRight size={16} className="text-stone-300" />
          </motion.div>
        ))}
      </div>

      <Modal
        isOpen={!!selectedConv}
        onClose={() => setSelectedConv(null)}
        title={selectedConv?.title || 'Conversation'}
        size="lg"
      >
        {selectedConv && (
          <div className="space-y-4">
            <div className="text-sm text-stone-500">
              Members: {getMemberNames(selectedConv)}
            </div>
            {isLoadingMessages ? (
              <InlineLoader />
            ) : convMessages.length === 0 ? (
              <p className="text-stone-400 text-sm text-center py-6 italic">No messages yet.</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {convMessages.map((msg) => (
                  <div key={msg.id} className="bg-stone-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-stone-600">{msg.sender?.display_name || 'Unknown'}</p>
                      <p className="text-xs text-stone-400">{format(new Date(msg.created_at), 'MMM d, h:mm a')}</p>
                    </div>
                    <p className="text-sm text-stone-700">{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
