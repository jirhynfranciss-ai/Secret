import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, RefreshCw, AlertCircle, ChevronUp } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { messagesService } from '@/services/messages.service';
import { getFriendlyError, logError } from '@/utils/errors';
import { InlineLoader } from '@/components/ui/LoadingScreen';
import type { Conversation, Message } from '@/types';

function formatMessageTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`;
  return format(d, 'MMM d, h:mm a');
}

export default function MessagesPage() {
  const { user, profile } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingConv, setIsLoadingConv] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [convError, setConvError] = useState('');
  const [sendError, setSendError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [seenMessageIds] = useState(() => new Set<string>());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const channelRef = useRef<ReturnType<typeof messagesService.subscribeToMessages> | null>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const loadConversation = useCallback(async () => {
    if (!user) return;
    setIsLoadingConv(true);
    setConvError('');
    try {
      const conv = await messagesService.getUserConversation(user.id);
      setConversation(conv);
      if (conv) {
        setIsLoadingMessages(true);
        const msgs = await messagesService.getMessages(conv.id, 0);
        msgs.forEach(m => seenMessageIds.add(m.id));
        setMessages(msgs);
        setHasMore(msgs.length >= 30);
        // Mark as read
        await messagesService.markMessagesAsRead(conv.id, user.id).catch(() => {});
      }
    } catch (err) {
      logError('MessagesPage', err);
      setConvError(getFriendlyError(err));
    } finally {
      setIsLoadingConv(false);
      setIsLoadingMessages(false);
    }
  }, [user, seenMessageIds]);

  useEffect(() => { loadConversation(); }, [loadConversation]);

  // Scroll to bottom when messages load
  useEffect(() => {
    if (messages.length > 0 && page === 0) {
      setTimeout(() => scrollToBottom(false), 100);
    }
  }, [messages.length, page, scrollToBottom]);

  // Realtime subscription
  useEffect(() => {
    if (!conversation?.id) return;

    const channel = messagesService.subscribeToMessages(conversation.id, (msg) => {
      if (seenMessageIds.has(msg.id)) return;
      seenMessageIds.add(msg.id);
      setMessages(prev => {
        // Remove any temp message with same content from same sender
        const filtered = prev.filter(m => !(m.is_pending && m.sender_id === msg.sender_id && m.content === msg.content));
        return [...filtered, msg];
      });
      setTimeout(() => scrollToBottom(true), 100);
      // Mark read if from other user
      if (msg.sender_id !== user?.id) {
        messagesService.markMessagesAsRead(conversation.id, user!.id).catch(() => {});
      }
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [conversation?.id, user?.id, seenMessageIds, scrollToBottom]);

  const loadMore = async () => {
    if (!conversation || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const older = await messagesService.getMessages(conversation.id, nextPage);
      if (older.length < 30) setHasMore(false);
      older.forEach(m => seenMessageIds.add(m.id));
      setMessages(prev => [...older, ...prev]);
      setPage(nextPage);
    } catch (err) {
      logError('MessagesPage loadMore', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || !user || isSending) return;
    const content = newMessage.trim();
    setNewMessage('');
    setSendError('');

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      temp_id: tempId,
      conversation_id: conversation.id,
      sender_id: user.id,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: profile ?? undefined,
      is_pending: true,
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom(true), 50);

    setIsSending(true);
    try {
      const sent = await messagesService.sendMessage(conversation.id, user.id, content);
      seenMessageIds.add(sent.id);
      setMessages(prev => prev.map(m => m.temp_id === tempId ? { ...sent } : m));
    } catch (err) {
      logError('MessagesPage send', err);
      setSendError(getFriendlyError(err));
      setMessages(prev => prev.map(m => m.temp_id === tempId ? { ...m, is_pending: false, is_failed: true } : m));
      setNewMessage(content); // restore
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const retryMessage = async (msg: Message) => {
    setMessages(prev => prev.filter(m => m.temp_id !== msg.temp_id));
    setNewMessage(msg.content);
    textareaRef.current?.focus();
  };

  if (isLoadingConv) {
    return (
      <div className="h-screen flex items-center justify-center">
        <InlineLoader />
      </div>
    );
  }

  if (convError) {
    return (
      <div className="h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle size={32} className="mx-auto text-rose-400" />
          <p className="text-stone-600">{convError}</p>
          <button
            onClick={loadConversation}
            className="flex items-center gap-2 text-sm text-rose-500 mx-auto"
          >
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="h-screen flex items-center justify-center px-4 pb-20 md:pb-0">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl">💌</div>
          <h2 className="font-cormorant text-2xl text-stone-700 italic">Your private space is almost ready</h2>
          <p className="text-stone-400 text-sm font-light leading-relaxed">
            Your conversation will appear here once your secret admirer opens your chat. 
            Come back soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen md:h-[calc(100vh)] flex flex-col pb-16 md:pb-0">
      {/* Header */}
      <div className="px-4 md:px-8 py-4 border-b border-rose-100 bg-white/60 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3 max-w-2xl">
          <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center">
            <span className="text-rose-500 text-lg">✦</span>
          </div>
          <div>
            <p className="text-sm font-medium text-stone-800">{conversation.title || 'Our Private Space'}</p>
            <p className="text-xs text-stone-400 font-light">End-to-end — just for us</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-3">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Load more */}
          {hasMore && (
            <div className="text-center py-2">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="text-xs text-stone-400 hover:text-rose-500 flex items-center gap-1.5 mx-auto"
              >
                <ChevronUp size={12} />
                {isLoadingMore ? 'Loading...' : 'Load older messages'}
              </button>
            </div>
          )}

          {isLoadingMessages && <InlineLoader />}

          {!isLoadingMessages && messages.length === 0 && (
            <div className="text-center py-8 space-y-2">
              <p className="text-stone-400 text-sm font-light italic font-cormorant text-lg">
                This is the beginning of something beautiful.
              </p>
              <p className="text-stone-300 text-xs">Say hello 👋</p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[78%] space-y-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm font-light leading-relaxed break-words ${
                        isOwn
                          ? `bg-rose-400 text-white ${msg.is_failed ? 'opacity-50' : msg.is_pending ? 'opacity-70' : ''}`
                          : 'bg-white border border-rose-100 text-stone-700 shadow-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-stone-400">
                        {formatMessageTime(msg.created_at)}
                      </span>
                      {msg.is_pending && <span className="text-[10px] text-stone-400">Sending...</span>}
                      {msg.is_failed && (
                        <button
                          onClick={() => retryMessage(msg)}
                          className="text-[10px] text-red-400 underline"
                        >
                          Failed — tap to retry
                        </button>
                      )}
                      {isOwn && !msg.is_pending && !msg.is_failed && msg.is_read && (
                        <span className="text-[10px] text-rose-300">Read</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Send error */}
      {sendError && (
        <div className="px-4 md:px-8 py-2 bg-red-50 border-t border-red-100">
          <p className="text-xs text-red-600 max-w-2xl mx-auto">{sendError}</p>
        </div>
      )}

      {/* Input */}
      <div className="px-4 md:px-8 py-4 border-t border-rose-100 bg-white/60 backdrop-blur-sm shrink-0">
        <div className="max-w-2xl mx-auto flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write something beautiful..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 max-h-32 overflow-y-auto"
            style={{ minHeight: '44px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 128) + 'px';
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending}
            className="w-11 h-11 rounded-xl bg-rose-400 hover:bg-rose-500 disabled:opacity-40 flex items-center justify-center text-white transition-all duration-200 shrink-0"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-stone-400 text-center mt-2 font-light">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
