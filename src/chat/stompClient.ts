import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import { logger } from "../utils/logger";
import {
  ChatConnectionStatus,
  ChatMessage,
  ChatSocketError,
} from "./types";

type StatusListener = (status: ChatConnectionStatus) => void;

const buildWebSocketUrl = () => {
  const explicitUrl = process.env.EXPO_PUBLIC_WS_URL;
  if (explicitUrl) {
    return explicitUrl;
  }

  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("Missing EXPO_PUBLIC_API_URL");
  }

  const url = new URL(apiUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws-chat";
  url.search = "";
  url.hash = "";
  return url.toString();
};

class ChatStompClient {
  private client: Client | null = null;
  private token: string | null = null;
  private status: ChatConnectionStatus = "DISCONNECTED";
  private listeners = new Set<StatusListener>();
  private generation = 0;

  async connect(token: string) {
    if (this.client?.active && this.token === token) {
      return;
    }

    const generation = ++this.generation;
    const previous = this.client;
    this.client = null;
    if (previous?.active) {
      await previous.deactivate();
    }
    if (generation !== this.generation) {
      return;
    }

    this.token = token;
    this.setStatus("CONNECTING");

    const client = new Client({
      webSocketFactory: () => new WebSocket(buildWebSocketUrl()),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectionTimeout: 10000,
      onConnect: () => {
        if (this.client === client) this.setStatus("CONNECTED");
      },
      onDisconnect: () => {
        if (this.client === client) this.setStatus("DISCONNECTED");
      },
      onWebSocketClose: () => {
        if (this.client !== client) return;
        if (client.active) {
          this.setStatus("CONNECTING");
        } else {
          this.setStatus("DISCONNECTED");
        }
      },
      onStompError: (frame) => {
        if (this.client !== client) return;
        logger.log("CHAT STOMP ERROR:", frame.headers.message, frame.body);
        this.setStatus("ERROR");
      },
      onWebSocketError: (event) => {
        if (this.client !== client) return;
        logger.log("CHAT WEBSOCKET ERROR:", event);
        this.setStatus("ERROR");
      },
      // STOMP debug logs every frame and heartbeat. Keep it silent during
      // normal development; enable a targeted logger only while debugging.
      debug: () => {},
    });

    this.client = client;
    client.activate();
  }

  async disconnect() {
    ++this.generation;
    const current = this.client;
    this.client = null;
    this.token = null;
    if (current?.active) {
      await current.deactivate();
    }
    this.setStatus("DISCONNECTED");
  }

  subscribeToRoom(
    roomId: number,
    onMessage: (message: ChatMessage) => void
  ): StompSubscription {
    if (!this.client?.connected) {
      throw new Error("Chat is not connected");
    }
    return this.client.subscribe(
      `/topic/chat/room/${roomId}`,
      (frame: IMessage) => onMessage(JSON.parse(frame.body) as ChatMessage)
    );
  }

    subscribeToRoomList(
    onMessage: (message: ChatMessage) => void
  ): StompSubscription {
    if (!this.client?.connected) {
      throw new Error("Chat is not connected");
    }

    return this.client.subscribe(
      "/topic/chat/rooms",
      (frame: IMessage) => onMessage(JSON.parse(frame.body) as ChatMessage)
    );
  }

  subscribeToErrors(
    onError: (error: ChatSocketError) => void
  ): StompSubscription {
    if (!this.client?.connected) {
      throw new Error("Chat is not connected");
    }
    return this.client.subscribe(
      "/user/queue/errors",
      (frame: IMessage) => onError(JSON.parse(frame.body) as ChatSocketError)
    );
  }

  sendMessage(roomId: number, content: string) {
    if (!this.client?.connected) {
      throw new Error("Chat is not connected");
    }
    this.client.publish({
      destination: "/app/chat.send",
      body: JSON.stringify({ roomId, content }),
    });
  }

  addStatusListener(listener: StatusListener) {
    this.listeners.add(listener);
    listener(this.status);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getStatus() {
    return this.status;
  }

  private setStatus(status: ChatConnectionStatus) {
    this.status = status;
    this.listeners.forEach((listener) => listener(status));
  }
}

export const chatStompClient = new ChatStompClient();
