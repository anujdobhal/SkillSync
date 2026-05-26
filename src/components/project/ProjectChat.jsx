import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";

const ProjectChat = ({ projectId, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [profiles, setProfiles] = useState({});
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!projectId) return;
    loadMessages();

    const channel = supabase
      .channel(`project-chat-${projectId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "project_messages", filter: `project_id=eq.${projectId}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
          loadProfileFor(payload.new.user_id);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("project_messages")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
      const userIds = [...new Set(data.map(m => m.user_id))];
      if (userIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds);
        const map = {};
        (profs || []).forEach(p => { map[p.user_id] = p; });
        setProfiles(map);
      }
    }
  };

  const loadProfileFor = async (userId) => {
    if (profiles[userId]) return;
    const { data } = await supabase.from("profiles").select("user_id, name").eq("user_id", userId).single();
    if (data) setProfiles(prev => ({ ...prev, [data.user_id]: data }));
  };

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content || sending) return;
    setSending(true);
    setNewMessage("");

    const { error } = await supabase
      .from("project_messages")
      .insert({ project_id: projectId, user_id: currentUserId, content });

    if (error) console.error("Send error:", error);
    setSending(false);
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDateLabel = (ts) => {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Group messages by date
  let lastDate = "";

  return (
    <div className="flex flex-col h-[500px] rounded-lg overflow-hidden" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p style={{ color: "var(--text-muted)" }} className="text-sm">No messages yet. Say hello to your team! 👋</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.user_id === currentUserId;
          const profile = profiles[msg.user_id];
          const name = isMe ? "You" : (profile?.name || "Team Member");
          const dateLabel = formatDateLabel(msg.created_at);
          let showDateLabel = false;
          if (dateLabel !== lastDate) { showDateLabel = true; lastDate = dateLabel; }

          return (
            <div key={msg.id}>
              {showDateLabel && (
                <div className="text-center my-3">
                  <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                    {dateLabel}
                  </span>
                </div>
              )}
              <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                <Avatar className="h-7 w-7 flex-shrink-0">
                  <AvatarFallback style={{ fontSize: "0.65rem", backgroundColor: isMe ? "var(--primary)" : "var(--bg-elevated)", color: isMe ? "#fff" : "var(--text-primary)" }}>
                    {name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[70%] rounded-xl px-3 py-2 ${isMe ? "" : ""}`}
                  style={{ backgroundColor: isMe ? "var(--primary)" : "var(--bg-elevated)", color: isMe ? "#fff" : "var(--text-primary)" }}>
                  {!isMe && <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--accent)", opacity: 0.8 }}>{name}</p>}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className="text-[10px] mt-1 text-right" style={{ opacity: 0.6 }}>{formatTime(msg.created_at)}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 flex items-center gap-2" style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--bg-primary)" }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Type a message..."
          className="flex-1 bg-transparent text-sm outline-none px-3 py-2 rounded-lg"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          disabled={sending}
        />
        <Button onClick={handleSend} disabled={!newMessage.trim() || sending} size="sm" className="h-9 w-9 p-0" style={{ backgroundColor: "var(--primary)" }}>
          <Send className="h-4 w-4 text-white" />
        </Button>
      </div>
    </div>
  );
};

export default ProjectChat;
