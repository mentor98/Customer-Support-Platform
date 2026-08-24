import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  User,
  Headphones,
  CheckCircle2,
  Bot,
  Zap,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { ChatSession, ChatMessage } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface LiveChatWidgetProps {
  isFullScreenConsole?: boolean;
}

export const LiveChatWidget: React.FC<LiveChatWidgetProps> = ({ isFullScreenConsole = false }) => {
  const { currentUser, isCustomer, isAgent } = useAuth();

  const [isOpen, setIsOpen] = useState(isFullScreenConsole);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadChatData = async () => {
    try {
      if (isFullScreenConsole || isAgent) {
        const allChats = await api.getAllChats();
        setSessions(allChats);
        if (!activeSession && allChats.length > 0) {
          setActiveSession(allChats[0]);
        } else if (activeSession) {
          const fresh = allChats.find(c => c.id === activeSession.id);
          if (fresh) setActiveSession(fresh);
        }
      } else {
        const session = await api.getChatSession();
        setActiveSession(session);
      }
    } catch (err) {
      console.error('Error loading chat session:', err);
    }
  };

  useEffect(() => {
    loadChatData();
    const interval = setInterval(loadChatData, 4000);
    return () => clearInterval(interval);
  }, [isFullScreenConsole, activeSession?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeSession) return;

    const msg = inputMessage;
    setInputMessage('');
    setIsSending(true);

    try {
      const updated = await api.sendChatMessage(activeSession.id, msg);
      setActiveSession(updated);

      // Simulate agent response if customer is chatting
      if (isCustomer) {
        setIsTyping(true);
        setTimeout(async () => {
          setIsTyping(false);
          await loadChatData();
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to send chat message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendQuickMacro = (text: string) => {
    setInputMessage(text);
  };

  // If used as full-screen agent console
  if (isFullScreenConsole) {
    return (
      <div className="flex-1 flex h-full bg-white dark:bg-neutral-900 overflow-hidden">
        {/* Left Sessions List */}
        <div className="w-80 border-r border-neutral-200 dark:border-neutral-800 flex flex-col bg-neutral-50/50 dark:bg-neutral-950/40">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              Live Chat Queue ({sessions.length})
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800">
            {sessions.map(s => {
              const isSelected = activeSession?.id === s.id;
              const lastMsg = s.messages[s.messages.length - 1];
              return (
                <div
                  key={s.id}
                  onClick={() => setActiveSession(s)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-l-4 border-indigo-600'
                      : 'hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      {s.customerName}
                    </span>
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      {s.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 truncate">
                    {lastMsg ? lastMsg.content : 'No messages'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Active Chat Workspace */}
        {activeSession ? (
          <div className="flex-1 flex flex-col h-full bg-white dark:bg-neutral-900">
            {/* Header */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center font-bold text-xs text-indigo-700 dark:text-indigo-300">
                  {activeSession.customerName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {activeSession.customerName}
                  </h4>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    ● Active Live Session
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeSession.messages.map(msg => {
                const isMe = msg.senderId === currentUser?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] text-neutral-400">
                      <span className="font-semibold">{msg.senderName}</span>
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div
                      className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-br-xs'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-bl-xs'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Macro Pills */}
            <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-850/50 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Quick Replies:</span>
              <button
                type="button"
                onClick={() => handleSendQuickMacro('Hello! How can I assist you with your OmniDesk account today?')}
                className="px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] text-neutral-700 dark:text-neutral-300 hover:border-indigo-500 whitespace-nowrap cursor-pointer"
              >
                👋 Welcome
              </button>
              <button
                type="button"
                onClick={() => handleSendQuickMacro('I have reviewed your logs and applied a patch to your instance.')}
                className="px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] text-neutral-700 dark:text-neutral-300 hover:border-indigo-500 whitespace-nowrap cursor-pointer"
              >
                🛠️ Fix Applied
              </button>
              <button
                type="button"
                onClick={() => handleSendQuickMacro('Is there anything else I can help verify for you today?')}
                className="px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] text-neutral-700 dark:text-neutral-300 hover:border-indigo-500 whitespace-nowrap cursor-pointer"
              >
                ✨ Anything Else
              </button>
            </div>

            {/* Composer */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                placeholder="Type a real-time message to customer..."
                className="flex-1 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isSending || !inputMessage.trim()}
                className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-neutral-400 text-xs">
            Select a live chat session from the queue to respond.
          </div>
        )}
      </div>
    );
  }

  // Floating widget for customer
  return (
    <div className="fixed bottom-6 right-6 z-40">
      {!isOpen && (
        <button
          id="btn-open-chat-widget"
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl flex items-center justify-center transition-all hover:scale-105 cursor-pointer ring-4 ring-indigo-200 dark:ring-indigo-900/50"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="w-96 h-[520px] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold">OmniDesk Live Support</h4>
                <span className="text-[10px] text-indigo-100 flex items-center gap-1">
                  ● Support Agent Online
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/50 dark:bg-neutral-950/40">
            {activeSession?.messages.map(msg => {
              const isMe = msg.senderId === currentUser?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[9px] text-neutral-400 mb-0.5">{msg.senderName}</span>
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-xs'
                        : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-bl-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-1.5 p-2 bg-white dark:bg-neutral-800 rounded-xl max-w-[120px] text-xs text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce delay-100">●</span>
                <span className="animate-bounce delay-200">●</span>
                <span className="text-[10px] ml-1">typing</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Composer */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder="Ask support a question..."
              className="flex-1 p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isSending || !inputMessage.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
