export type ChatMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
  status?: "sent" | "delivered" | "read";
};

export type ConversationId = string; // `${minUserId}__${maxUserId}`

export type ConversationSummary = {
  conversationId: ConversationId;
  otherUserId: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
};

export function getConversationId(a: string, b: string): ConversationId {
  return [a, b].sort().join("__");
}


