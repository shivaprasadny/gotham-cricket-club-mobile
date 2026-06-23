import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import {
  getChatMessages,
  markChatRoomRead,
  sendChatMessage,
} from "./chatApi";
import { chatStompClient } from "./stompClient";
import {
  ChatConnectionStatus,
  ChatMessage,
  ChatRoom,
} from "./types";

const ChatRoomScreen = ({ route }: any) => {
  const typedRoute = route as { params: { room: ChatRoom } };
  const { room } = typedRoute.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<ChatConnectionStatus>(
    chatStompClient.getStatus()
  );
  const subscribedRef = useRef(false);
  const lastSentDraftRef = useRef("");

  const loadPage = useCallback(
    async (nextPage: number) => {
      const result = await getChatMessages(room.id, nextPage);
      setMessages((current) => {
        const combined =
          nextPage === 0 ? result.content : [...current, ...result.content];
        return combined.filter(
          (message, index, all) =>
            all.findIndex((candidate) => candidate.id === message.id) === index
        );
      });
      setPage(result.page);
      setHasMore(!result.last);
      const newest = nextPage === 0 ? result.content[0] : undefined;
      if (nextPage === 0) {
        void markChatRoomRead(room.id, newest?.id).catch((readError) => {
          console.log(
            "MARK CHAT READ ERROR:",
            (readError as any)?.response?.status,
            (readError as any)?.response?.data
          );
        });
      }
    },
    [room.id]
  );

  const refreshLatest = useCallback(async () => {
    const result = await getChatMessages(room.id, 0);
    setMessages((current) => {
      const combined = [...result.content, ...current];
      return combined.filter(
        (message, index, all) =>
          all.findIndex((candidate) => candidate.id === message.id) === index
      );
    });
    const newest = result.content[0];
    if (newest) {
      void markChatRoomRead(room.id, newest.id);
    }
  }, [room.id]);

  useEffect(() => {
    void loadPage(0)
      .catch((loadError: any) => {
        console.log(
          "LOAD CHAT HISTORY ERROR:",
          loadError?.response?.status,
          loadError?.response?.data || loadError
        );
        Alert.alert(
          "Chat",
          loadError?.response?.data?.message ||
            loadError?.message ||
            "Could not load message history"
        );
      })
      .finally(() => setLoading(false));
  }, [loadPage]);

  useEffect(
    () => chatStompClient.addStatusListener(setStatus),
    []
  );

  useEffect(() => {
    if (status !== "CONNECTED" || subscribedRef.current) {
      return;
    }
    let errorSubscription: ReturnType<
      typeof chatStompClient.subscribeToErrors
    > | null = null;
    let roomSubscription: ReturnType<
      typeof chatStompClient.subscribeToRoom
    > | null = null;

    try {
      subscribedRef.current = true;
      errorSubscription = chatStompClient.subscribeToErrors((error) => {
        const rejectedContent = lastSentDraftRef.current;
        if (rejectedContent) {
          setDraft((current) => current || rejectedContent);
          lastSentDraftRef.current = "";
        }
        Alert.alert("Message not sent", error.message);
      });
      roomSubscription = chatStompClient.subscribeToRoom(room.id, (message) => {
        setMessages((current) =>
          current.some((item) => item.id === message.id)
            ? current
            : [message, ...current]
        );
        if (message.senderId === user?.id) {
          lastSentDraftRef.current = "";
        }
        void markChatRoomRead(room.id, message.id);
      });
    } catch (subscriptionError) {
      subscribedRef.current = false;
      console.log("CHAT SUBSCRIPTION ERROR:", subscriptionError);
    }

    return () => {
      subscribedRef.current = false;
      roomSubscription?.unsubscribe();
      errorSubscription?.unsubscribe();
    };
  }, [room.id, status, user?.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      void refreshLatest().catch((refreshError) => {
        console.log("CHAT REFRESH ERROR:", refreshError);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshLatest]);

  const send = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setDraft("");
    try {
      const saved = await sendChatMessage(room.id, content);
      setMessages((current) =>
        current.some((message) => message.id === saved.id)
          ? current
          : [saved, ...current]
      );
      void markChatRoomRead(room.id, saved.id);
    } catch (sendError: any) {
      setDraft((current) => current || content);
      Alert.alert(
        "Message not sent",
        sendError?.response?.data?.message ||
          sendError?.message ||
          "Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  const loadOlder = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      await loadPage(page + 1);
    } finally {
      setLoadingMore(false);
    }
  };

  const statusColor =
    status === "CONNECTED"
      ? "#16a34a"
      : status === "ERROR"
        ? "#dc2626"
        : "#d97706";

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 12}
      >
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={styles.statusText}>{status.toLowerCase()}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#4B1D6B" />
        </View>
      ) : (
        <FlatList
          inverted
          data={messages}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.messages}
          onEndReached={() => void loadOlder()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color="#4B1D6B" /> : null
          }
          ListEmptyComponent={
            <Text style={styles.empty}>Start the conversation.</Text>
          }
          renderItem={({ item }) => {
            const mine = item.senderId === user?.id;
            return (
              <View
                style={[
                  styles.messageRow,
                  mine ? styles.messageRowMine : styles.messageRowOther,
                ]}
              >
                <View style={[styles.bubble, mine ? styles.mine : styles.other]}>
                  {!mine ? (
                    <Text style={styles.sender}>{item.senderName}</Text>
                  ) : null}
                  <Text style={[styles.content, mine && styles.mineText]}>
                    {item.content}
                  </Text>
                  <Text style={[styles.timestamp, mine && styles.mineTime]}>
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Message"
          multiline
          maxLength={2000}
          style={styles.input}
        />
        <TouchableOpacity
          accessibilityLabel="Send message"
          disabled={!draft.trim() || sending}
          onPress={() => void send()}
          style={[
            styles.send,
            (!draft.trim() || sending) && styles.sendDisabled,
          ]}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatRoomScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f4f9" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e4dbe8",
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: "#6f6076", fontSize: 12, textTransform: "capitalize" },
  messages: { paddingHorizontal: 12, paddingVertical: 16 },
  messageRow: { flexDirection: "row", marginVertical: 4 },
  messageRowMine: { justifyContent: "flex-end" },
  messageRowOther: { justifyContent: "flex-start" },
  bubble: { maxWidth: "82%", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  mine: { backgroundColor: "#4B1D6B", borderBottomRightRadius: 4 },
  other: { backgroundColor: "#fff", borderBottomLeftRadius: 4 },
  sender: { color: "#7c3c9e", fontSize: 12, fontWeight: "700", marginBottom: 3 },
  content: { color: "#26152e", fontSize: 15, lineHeight: 20 },
  mineText: { color: "#fff" },
  timestamp: { color: "#85778b", fontSize: 10, marginTop: 4, textAlign: "right" },
  mineTime: { color: "#d8c7e1" },
  empty: { textAlign: "center", color: "#817287", marginTop: 36 },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd3e2",
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 42,
    borderWidth: 1,
    borderColor: "#d8cedd",
    borderRadius: 21,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: "#24112e",
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#da9306",
  },
  sendDisabled: { opacity: 0.45 },
});
