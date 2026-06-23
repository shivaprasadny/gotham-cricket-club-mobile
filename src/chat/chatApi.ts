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
  content: string
): Promise<ChatMessage> => {
  const response = await api.post<ChatMessage>(
    `/chat/rooms/${roomId}/messages`,
    { content }
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

export const createDirectChat = async (userId: number): Promise<ChatRoom> => {
  const response = await api.post<ChatRoom>("/chat/rooms/direct", { userId });
  return response.data;
};

export const getChatMembers = async (): Promise<ChatMember[]> => {
  const response = await api.get<ChatMember[]>("/members");
  return response.data;
};
