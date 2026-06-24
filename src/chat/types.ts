export type ChatRoomType = "CLUB" | "MATCH" | "EVENT" | "DIRECT" | "GROUP";

export type ChatMessage = {
  id: number;
  roomId: number;
  senderId: number;
  senderName: string;
  content: string;
  createdAt: string;
};

export type ChatRoom = {
  id: number;
  type: ChatRoomType;
  referenceId: number | null;
  name: string;
  unreadCount: number;
  lastMessage: ChatMessage | null;
  muted: boolean;
};

export type ChatMessagePage = {
  content: ChatMessage[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

export type ChatConnectionStatus =
  | "DISCONNECTED"
  | "CONNECTING"
  | "CONNECTED"
  | "ERROR";

export type ChatSocketError = {
  code: string;
  message: string;
  timestamp: string;
};

export type ChatMember = {
  userId: number;
  fullName: string;
  nickname?: string | null;
  roomAdmin?: boolean;
};