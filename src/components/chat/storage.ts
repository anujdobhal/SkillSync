import { ChatMessage, ConversationId, getConversationId } from "./types";

const STORAGE_KEY = "skillSync.chat.messages";

type StorageShape = Record<ConversationId, ChatMessage[]>;

function readAll(): StorageShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StorageShape) : {};
  } catch {
    return {};
  }
}

function writeAll(data: StorageShape) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadConversation(userA: string, userB: string): ChatMessage[] {
  const convId = getConversationId(userA, userB);
  const all = readAll();
  return (all[convId] || []).sort((a, b) => a.timestamp - b.timestamp);
}

export function appendMessage(message: ChatMessage) {
  const convId = getConversationId(message.senderId, message.receiverId);
  const all = readAll();
  const list = all[convId] || [];
  all[convId] = [...list, message];
  writeAll(all);
  broadcastChange({ type: "message", conversationId: convId, message });
}

export function markAllRead(conversationId: ConversationId, currentUserId: string) {
  // For demo, we don't persist read status per-message; rely on client state.
  broadcastChange({ type: "read", conversationId, userId: currentUserId });
}

type BroadcastEvent =
  | { type: "message"; conversationId: ConversationId; message: ChatMessage }
  | { type: "read"; conversationId: ConversationId; userId: string }
  | { type: "typing"; conversationId: ConversationId; userId: string; isTyping: boolean }
  | { type: "message_deleted"; conversationId: ConversationId; messageId: string };

const channel = typeof window !== "undefined" ? new BroadcastChannel("skillSyncChat") : null;

function broadcastChange(event: BroadcastEvent) {
  channel?.postMessage(event);
  window.dispatchEvent(new CustomEvent("skillSyncChat", { detail: event }));
}

export function onBroadcast(handler: (event: BroadcastEvent) => void) {
  const bcHandler = (e: MessageEvent) => handler(e.data as BroadcastEvent);
  const domHandler = (e: Event) => handler((e as CustomEvent).detail as BroadcastEvent);
  channel?.addEventListener("message", bcHandler);
  window.addEventListener("skillSyncChat", domHandler as EventListener);
  return () => {
    channel?.removeEventListener("message", bcHandler);
    window.removeEventListener("skillSyncChat", domHandler as EventListener);
  };
}

export function emitTyping(conversationId: ConversationId, userId: string, isTyping: boolean) {
  const event: BroadcastEvent = { type: "typing", conversationId, userId, isTyping };
  broadcastChange(event);
}

export function deleteMessage(messageId: string, userA: string, userB: string) {
  const convId = getConversationId(userA, userB);
  const all = readAll();
  const list = all[convId] || [];
  all[convId] = list.filter(m => m.id !== messageId);
  writeAll(all);
  broadcastChange({ type: "message_deleted", conversationId: convId, messageId });
}


