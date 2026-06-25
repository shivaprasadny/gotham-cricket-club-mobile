import api from "../api/axiosConfig";
import { ChatMember, ChatMessage, ChatMessagePage, ChatRoom } from "./types";

export const getChatRooms = async (): Promise<ChatRoom[]> => {
  const response = await api.get<ChatRoom[]>("/chat/rooms");
  return response.data;
};

export const getChatMessages = async (
  roomId: number,
  page = 0,
  size = 50
): Promise<ChatMessagePage> => {
  const response = await api.get<ChatMessagePage | ChatMessage[]>(
    `/chat/rooms/${roomId}/messages`,
    { params: { page, size } }
  );

  // Keep the app compatible while a backend instance is being restarted:
  // the original endpoint returned a plain array; the current endpoint returns
  // a paginated object.
  if (Array.isArray(response.data)) {
    return {
      content: response.data,
      page,
      size,
      totalElements: response.data.length,
      totalPages: response.data.length < size ? page + 1 : page + 2,
      last: response.data.length < size,
    };
  }

  return response.data;
};

export const markChatRoomRead = async (
  roomId: number,
  messageId?: number
): Promise<void> => {
  await api.post(`/chat/rooms/${roomId}/read`, {
    messageId: messageId ?? null,
  });
};

export const sendChatMessage = async (
  roomId: number,
  content: string,
  replyToMessageId?: number | null
): Promise<ChatMessage> => {
  const response = await api.post<ChatMessage>(
    `/chat/rooms/${roomId}/messages`,
    { content, replyToMessageId: replyToMessageId ?? null }
  );
  return response.data;
};

export const deleteChatForMe = async (roomId: number): Promise<void> => {
  await api.delete(`/chat/rooms/${roomId}`);
};

export const setChatMuted = async (
  roomId: number,
  muted: boolean
): Promise<void> => {
  await api.put(`/chat/rooms/${roomId}/mute`, { muted });
};

export const setChatFavorite = async (
  roomId: number,
  favorite: boolean
): Promise<void> => {
  await api.put(`/chat/rooms/${roomId}/favorite`, { favorite });
};

export const createDirectChat = async (userId: number): Promise<ChatRoom> => {
  const response = await api.post<ChatRoom>("/chat/rooms/direct", { userId });
  return response.data;
};

export const getChatMembers = async (): Promise<ChatMember[]> => {
  const response = await api.get<ChatMember[]>("/members");
  return response.data;
};
export const createGroupChat = async (
  name: string,
  memberIds: number[]
): Promise<ChatRoom> => {
  const response = await api.post<ChatRoom>("/chat/rooms/groups", {
    name,
    memberIds,
  });

  return response.data;
};

export const getChatRoomMembers = async (
  roomId: number
): Promise<ChatMember[]> => {
  const response = await api.get<ChatMember[]>(
    `/chat/rooms/${roomId}/members`
  );

  return response.data;
};
export const addChatRoomMember = async (
  roomId: number,
  userId: number
): Promise<ChatMember> => {
  const response = await api.post<ChatMember>(
    `/chat/rooms/${roomId}/members`,
    {
      userId,
    }
  );

  return response.data;
};

export const removeChatRoomMember = async (
  roomId: number,
  userId: number
): Promise<void> => {
  await api.delete(`/chat/rooms/${roomId}/members/${userId}`);
};
export const makeChatRoomAdmin = async (
  roomId: number,
  userId: number
): Promise<ChatMember> => {
  const response = await api.put<ChatMember>(
    `/chat/rooms/${roomId}/members/${userId}/admin`
  );

  return response.data;
};

export const removeChatRoomAdmin = async (
  roomId: number,
  userId: number
): Promise<ChatMember> => {
  const response = await api.delete<ChatMember>(
    `/chat/rooms/${roomId}/members/${userId}/admin`
  );

  return response.data;
};
export const renameChatRoom = async (
  roomId: number,
  name: string
): Promise<ChatRoom> => {
  const response = await api.put<ChatRoom>(`/chat/rooms/${roomId}/name`, {
    name,
  });

  return response.data;
};

export const leaveChatRoom = async (roomId: number): Promise<void> => {
  await api.post(`/chat/rooms/${roomId}/leave`);
};
export const enterChatRoomPresence = async (
  roomId: number
): Promise<void> => {
  await api.post(`/chat/rooms/${roomId}/presence/enter`);
};

export const leaveChatRoomPresence = async (
  roomId: number
): Promise<void> => {
  await api.post(`/chat/rooms/${roomId}/presence/leave`);
};

export const deleteChatMessage = async (
  roomId: number,
  messageId: number
): Promise<void> => {
  await api.delete(`/chat/rooms/${roomId}/messages/${messageId}`);
};

export const toggleReaction = async (
  roomId: number,
  messageId: number,
  emoji: string
): Promise<ChatMessage> => {
  const response = await api.post<ChatMessage>(
    `/chat/rooms/${roomId}/messages/${messageId}/reactions`,
    { emoji }
  );
  return response.data;
};

export const setRoomFrozen = async (
  roomId: number,
  frozen: boolean
): Promise<void> => {
  await api.put(`/chat/rooms/${roomId}/frozen`, { frozen });
};

export const reportMessage = async (
  roomId: number,
  messageId: number,
  reason?: string
): Promise<void> => {
  await api.post(`/chat/rooms/${roomId}/messages/${messageId}/report`, { reason });
};