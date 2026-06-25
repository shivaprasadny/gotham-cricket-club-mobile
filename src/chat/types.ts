export type ChatRoomType = "CLUB" | "MATCH" | "EVENT" | "DIRECT" | "GROUP" | "ANONYMOUS";

export type ChatMessageType = "CHAT" | "SYSTEM";

export type ReactionSummary = {
  emoji: string;
  count: number;
  reactorNames: string[] | null; // null for anonymous rooms
};

export type ChatMessage = {
  id: number;
  roomId: number;
  senderId: number | null; // null for anonymous rooms
  senderName: string;
  content: string;
  type: ChatMessageType;
  createdAt: string;
  reactions?: ReactionSummary[];
  // Reply fields — undefined/null when this is a top-level message
  replyToMessageId?: number | null;
  replyPreview?: string | null;
  replySenderName?: string | null;
};

export type ChatRoom = {
  id: number;
  type: ChatRoomType;
  referenceId: number | null;
  name: string;
  unreadCount: number;
  lastMessage: ChatMessage | null;
  muted: boolean;
  favorite: boolean;
  frozen?: boolean;
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

// Member profile returned by GET /api/members/{userId}
export type MemberProfile = {
  userId: number;
  fullName?: string;
  email?: string;       // null when showEmail is false
  role?: string;
  nickname?: string;
  countryCode?: string; // null when showPhone is false
  phone?: string;       // null when showPhone is false
  showWhatsApp?: boolean;
  battingStyle?: string;
  bowlingStyle?: string;
  playerType?: string;
  jerseyNumber?: number;
};
