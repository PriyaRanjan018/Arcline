"use client";

import { useEffect, useState } from "react";
import PageTransition from "@/components/shared/PageTransition";
import Avatar from "@/components/shared/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Loader2 } from "lucide-react";
import MessageDrawer from "@/components/shared/MessageDrawer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MessagesPage() {
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Drawer state
  const [isMsgOpen, setIsMsgOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);

  useEffect(() => {
    async function loadConvos() {
      if (!user) return;
      try {
        const res = await fetch("/api/messages/all");
        if (res.ok) {
          const json = await res.json();
          setConversations(json.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadConvos();
  }, [user]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openConversation = (otherUser: any) => {
    setSelectedRecipient(otherUser);
    setIsMsgOpen(true);
  };

  return (
    <PageTransition className="p-4 md:p-8 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-display font-bold">Messages</h1>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="border border-dashed border-border2 p-16 flex justify-center text-text3">
            <Loader2 className="animate-spin w-5 h-5" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <MessageSquare className="w-10 h-10 text-border2" />
            <p className="text-text3 font-mono text-sm">No conversations yet.</p>
          </div>
        ) : (
          conversations.map((convo) => {
            const isUnread = convo.latest_message && !convo.latest_message.is_read && convo.latest_message.sender_id !== user?.id;
            
            return (
              <button
                key={convo.id}
                onClick={() => openConversation(convo.other_user)}
                className={`w-full flex items-center gap-4 p-4 border transition-colors text-left ${
                  isUnread 
                    ? "border-[#2a1a10] bg-[#110b06] hover:bg-[#160d07]" 
                    : "border-border bg-surface hover:bg-surface2"
                }`}
              >
                <Avatar
                  initials={convo.other_user?.name?.substring(0, 2).toUpperCase() || "??"}
                  src={convo.other_user?.avatar_url}
                  bgColor="bg-surface2"
                  size="md"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`font-medium ${isUnread ? "text-text1" : "text-text2"}`}>
                      {convo.other_user?.name || "Builder"}
                    </p>
                    {convo.latest_message && (
                      <span className="text-[10px] font-mono text-text3 ml-2 flex-shrink-0">
                        {new Date(convo.latest_message.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <p className={`text-sm truncate font-body ${isUnread ? "text-text1 font-medium" : "text-text3"}`}>
                      {convo.latest_message?.sender_id === user?.id && <span className="text-text3 mr-1">You:</span>}
                      {convo.latest_message?.content || "No messages yet."}
                    </p>
                    {isUnread && (
                      <div className="w-2 h-2 rounded-[50%] bg-accent flex-shrink-0" />
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {selectedRecipient && (
        <MessageDrawer
          isOpen={isMsgOpen}
          onClose={() => {
            setIsMsgOpen(false);
            // Wait for drawer to close before clearing recipient to avoid flicker
            setTimeout(() => setSelectedRecipient(null), 300);
          }}
          recipient={{
            id: selectedRecipient.id,
            name: selectedRecipient.name,
            username: selectedRecipient.username,
            avatar_url: selectedRecipient.avatar_url,
          }}
        />
      )}
    </PageTransition>
  );
}
