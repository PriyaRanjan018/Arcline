"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, Loader2, MessageSquare, Reply, Trash2, CornerUpLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import Avatar from "@/components/shared/Avatar";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface MessageDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: {
    id: string;
    name: string;
    username: string;
    avatar_url?: string | null;
  };
}

export default function MessageDrawer({ isOpen, onClose, recipient }: MessageDrawerProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; message: Message } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load or create conversation when drawer opens
  const loadConversation = useCallback(async () => {
    if (!user || !recipient.id || !isOpen) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ other_user_id: recipient.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load conversation");
        return;
      }
      setConversationId(data.conversation_id);
      setMessages(data.messages || []);
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user, recipient.id, isOpen]);

  useEffect(() => {
    if (isOpen) loadConversation();
    else {
      setMessages([]);
      setConversationId(null);
      setError(null);
    }
  }, [isOpen, loadConversation]);

  // Supabase Realtime subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId || isSending) return;
    let content = input.trim();
    if (replyTo) {
      const shortText = replyTo.content.length > 40 ? replyTo.content.substring(0, 40) + '...' : replyTo.content;
      content = `> Replying to: "${shortText}"\n\n${content}`;
    }
    
    setInput("");
    setReplyTo(null);
    setIsSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: conversationId, content }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to send");
        setInput(content); // restore input
      }
    } catch {
      setError("Failed to send. Check your connection.");
      setInput(content);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const recipientInitials = recipient.name
    ? recipient.name.substring(0, 2).toUpperCase()
    : "??";

  const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    const menuWidth = 192; // tailwind w-48 is 192px
    const menuHeight = 90; // approx height of the menu
    
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) {
      x = x - menuWidth;
    }
    
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }

    setContextMenu({ x, y, message: msg });
  };

  const handleDelete = async (msgId: string) => {
    setContextMenu(null);
    try {
      const res = await fetch(`/api/messages/${msgId}`, { method: "DELETE" });
      if (res.ok) {
        setToast("The message is deleted from both side");
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[420px] flex flex-col bg-[#0a0a0a] border-l border-[#222222]"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1c1c1c] bg-[#0d0d0d]">
              <Avatar
                initials={recipientInitials}
                src={recipient.avatar_url ?? undefined}
                bgColor="bg-surface2"
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#F2EDE4] truncate">{recipient.name}</div>
                <div className="text-[10px] font-mono text-[#555555]">@{recipient.username}</div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-[#555555] hover:text-[#F2EDE4] hover:bg-[#1c1c1c] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: "thin", scrollbarColor: "#222 transparent" }}>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-[#444444]">
                  <Loader2 size={24} className="animate-spin" />
                  <span className="font-mono text-xs">Loading messages…</span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <MessageSquare size={32} className="text-[#333]" />
                  <p className="font-mono text-xs text-[#E8572A] text-center px-4">{error}</p>
                  <button
                    onClick={loadConversation}
                    className="text-xs font-mono text-[#555] hover:text-[#E8572A] transition-colors underline"
                  >
                    Retry
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-[#333333]">
                  <MessageSquare size={32} />
                  <p className="font-mono text-xs text-center text-[#444444]">
                    No messages yet.<br />Start the conversation.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      onContextMenu={(e) => handleContextMenu(e, msg)}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                          isMine
                            ? "bg-[#E8572A] text-white"
                            : "bg-[#1a1a1a] border border-[#222222] text-[#C8C3BB]"
                        }`}
                      >
                        {msg.content.startsWith("> Replying to:") ? (
                          <>
                            <div className={`text-xs pl-2 border-l-2 mb-2 italic opacity-80 ${isMine ? 'border-white/50' : 'border-[#444]'}`}>
                              {msg.content.split('\n\n')[0]}
                            </div>
                            <p>{msg.content.substring(msg.content.indexOf('\n\n') + 2)}</p>
                          </>
                        ) : (
                          <p>{msg.content}</p>
                        )}
                        <p className={`text-[10px] font-mono mt-1 ${isMine ? "text-white/60" : "text-[#444]"}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-[#1c1c1c] p-4 bg-[#0d0d0d] flex flex-col relative">
              {replyTo && (
                <div className="flex items-center justify-between bg-[#111] border border-[#222] text-[#F2EDE4] text-xs font-mono px-3 py-2 mb-2">
                  <div className="flex items-center gap-2 truncate">
                    <CornerUpLeft size={12} className="text-[#E8572A]" />
                    <span className="truncate opacity-70">
                      Replying to: {replyTo.content.length > 40 ? replyTo.content.substring(0, 40) + '...' : replyTo.content}
                    </span>
                  </div>
                  <button onClick={() => setReplyTo(null)} className="hover:text-[#E8572A] p-1">
                    <X size={12} />
                  </button>
                </div>
              )}
              {!user ? (
                <p className="text-center font-mono text-xs text-[#444]">Sign in to send messages</p>
              ) : (
                <div className="flex gap-2 items-end">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${recipient.name}…`}
                    rows={1}
                    className="flex-1 bg-[#111111] border border-[#222222] text-[#F2EDE4] text-sm font-body placeholder-[#333333] px-3 py-2.5 resize-none focus:outline-none focus:border-[#E8572A] transition-colors"
                    style={{ scrollbarWidth: "none" }}
                    onInput={(e) => {
                      const t = e.currentTarget;
                      t.style.height = "auto";
                      t.style.height = Math.min(t.scrollHeight, 120) + "px";
                    }}
                    disabled={isLoading || !!error}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isSending || isLoading || !!error}
                    className="h-[42px] w-[42px] flex items-center justify-center bg-[#E8572A] text-white disabled:opacity-30 hover:bg-[#D44A1F] transition-colors flex-shrink-0"
                  >
                    {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              )}
              <p className="font-mono text-[10px] text-[#333333] mt-2">Press Enter to send · Shift+Enter for newline</p>
            </div>
          </motion.div>

          {/* Context Menu */}
          {contextMenu && (
            <div
              className="fixed z-[60] w-48 bg-[#111] border border-[#222] shadow-xl py-1 flex flex-col font-body text-sm"
              style={{ top: contextMenu.y, left: contextMenu.x }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="flex items-center gap-2 px-4 py-2 hover:bg-[#1a1a1a] text-[#F2EDE4] w-full text-left transition-colors"
                onClick={() => {
                  setReplyTo(contextMenu.message);
                  setContextMenu(null);
                }}
              >
                <Reply size={14} />
                Reply
              </button>
              {contextMenu.message.sender_id === user?.id && (
                <button
                  className="flex items-center gap-2 px-4 py-2 hover:bg-[#E8572A]/10 text-[#E8572A] w-full text-left transition-colors"
                  onClick={() => handleDelete(contextMenu.message.id)}
                >
                  <Trash2 size={14} />
                  Delete message
                </button>
              )}
            </div>
          )}

          {/* Toast Notification */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-[#111] border border-[#222] text-[#F2EDE4] text-xs font-mono px-4 py-3 shadow-2xl flex items-center gap-2"
              >
                <MessageSquare size={14} className="text-[#E8572A]" />
                {toast}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
