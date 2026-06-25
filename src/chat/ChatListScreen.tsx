import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { logger } from "../utils/logger";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  createDirectChat,
  createGroupChat,
  deleteChatForMe,
  getChatMembers,
  getChatRooms,
  setChatFavorite,
  setChatMuted,
} from "./chatApi";
import { chatStompClient } from "./stompClient";
import { ChatConnectionStatus } from "./types";
import { ChatMember, ChatRoom } from "./types";
import { useAuth } from "../context/AuthContext";

const roomIcon = (type: ChatRoom["type"]): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case "MATCH":
      return "trophy-outline";
    case "EVENT":
      return "calendar-outline";
    case "DIRECT":
      return "person-outline";
    default:
      return "people-outline";
  }
};

const formatTime = (value?: string) => {
  if (!value) return "";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const ChatListScreen = ({ navigation }: { navigation: any }) => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [creatingFor, setCreatingFor] = useState<number | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [showGroupModal, setShowGroupModal] = useState(false);
const [groupName, setGroupName] = useState("");
const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
const [creatingGroup, setCreatingGroup] = useState(false);
const [status, setStatus] = useState<ChatConnectionStatus>(
  chatStompClient.getStatus()
);
const [chatSearch, setChatSearch] = useState("");
const [activeFilter, setActiveFilter] = useState<
  "ALL" | "UNREAD" | "FAVORITES" | "DIRECT" | "GROUP" | "MATCH" | "EVENT" | "ANONYMOUS"
>("ALL");

const roomListSubscribedRef = useRef(false);

  const loadRooms = useCallback(async () => {
    try {
      setError(null);
      setRooms(await getChatRooms());
    } catch (loadError: any) {
      setError(loadError?.response?.data?.message || "Could not load chats");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRooms();
    }, [loadRooms])
  );

  useEffect(() => chatStompClient.addStatusListener(setStatus), []);

 
  
  useEffect(() => {
  if (status !== "CONNECTED" || roomListSubscribedRef.current) {
    return;
  }

  let subscription: ReturnType<typeof chatStompClient.subscribeToRoomList> | null =
    null;

  try {
    roomListSubscribedRef.current = true;

    subscription = chatStompClient.subscribeToRoomList(() => {
      void loadRooms();
    });
  } catch (error) {
    roomListSubscribedRef.current = false;
    logger.log("CHAT LIST SUBSCRIPTION ERROR:", error);
  }

  return () => {
    roomListSubscribedRef.current = false;
    subscription?.unsubscribe();
  };
}, [status, loadRooms]);

  const openGroupPicker = async () => {
  setShowGroupModal(true);
  setLoadingMembers(true);
  setMemberError(null);
  setMemberSearch("");
  setGroupName("");
  setSelectedMemberIds([]);

  try {
    const result = await getChatMembers();
    setMembers(result.filter((member) => member.userId !== user?.id));
  } catch (loadError: any) {
    setMemberError(
      loadError?.response?.data?.message || "Could not load members"
    );
  } finally {
    setLoadingMembers(false);
  }
};

  const openDirectChatPicker = async () => {
    setShowMembers(true);
    setLoadingMembers(true);
    setMemberError(null);
    setMemberSearch("");
    try {
      const result = await getChatMembers();
      setMembers(result.filter((member) => member.userId !== user?.id));
    } catch (loadError: any) {
      setMemberError(
        loadError?.response?.data?.message || "Could not load members"
      );
    } finally {
      setLoadingMembers(false);
    }
  };


  const startDirectChat = async (member: ChatMember) => {
    setCreatingFor(member.userId);
    try {
      const room = await createDirectChat(member.userId);
      setShowMembers(false);
      void loadRooms();
      navigation.navigate("ChatRoom", { room });
    } catch (createError: any) {
      setError(createError?.response?.data?.message || "Could not create direct chat");
    } finally {
      setCreatingFor(null);
    }
  };

  const toggleSelectedMember = (memberId: number) => {
  setSelectedMemberIds((current) =>
    current.includes(memberId)
      ? current.filter((id) => id !== memberId)
      : [...current, memberId]
  );
};

const handleCreateGroup = async () => {
  const cleanName = groupName.trim();

  if (!cleanName) {
    Alert.alert("Group name required", "Please enter a group name.");
    return;
  }

  if (selectedMemberIds.length === 0) {
    Alert.alert("Select members", "Please select at least one player.");
    return;
  }

  setCreatingGroup(true);

  try {
    const room = await createGroupChat(cleanName, selectedMemberIds);
    setShowGroupModal(false);
    setGroupName("");
    setSelectedMemberIds([]);
    setMemberSearch("");
    void loadRooms();
    navigation.navigate("ChatRoom", { room });
  } catch (createError: any) {
    Alert.alert(
      "Could not create group",
      createError?.response?.data?.message || "Please try again."
    );
  } finally {
    setCreatingGroup(false);
  }
};

  const confirmDeleteChat = (room: ChatRoom) => {
    Alert.alert(
      "Delete chat",
      "This removes the conversation only for you. It will appear again when a new message arrives.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteChatForMe(room.id);
              setRooms((current) => current.filter((item) => item.id !== room.id));
            } catch (deleteError: any) {
              Alert.alert(
                "Could not delete chat",
                deleteError?.response?.data?.message || "Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const toggleMute = async (room: ChatRoom) => {
    const nextMuted = !room.muted;
    setRooms((current) =>
      current.map((item) =>
        item.id === room.id ? { ...item, muted: nextMuted } : item
      )
    );
    try {
      await setChatMuted(room.id, nextMuted);
    } catch (muteError: any) {
      setRooms((current) =>
        current.map((item) =>
          item.id === room.id ? { ...item, muted: room.muted } : item
        )
      );
      Alert.alert(
        "Could not update notifications",
        muteError?.response?.data?.message || "Please try again."
      );
    }
  };

  const toggleFavorite = async (room: ChatRoom) => {
    const nextFav = !room.favorite;
    setRooms((current) =>
      current.map((item) =>
        item.id === room.id ? { ...item, favorite: nextFav } : item
      )
    );
    try {
      await setChatFavorite(room.id, nextFav);
    } catch (favError: any) {
      setRooms((current) =>
        current.map((item) =>
          item.id === room.id ? { ...item, favorite: room.favorite } : item
        )
      );
      Alert.alert(
        "Could not update favorite",
        favError?.response?.data?.message || "Please try again."
      );
    }
  };

  // useMemo MUST be before any conditional returns (Rules of Hooks).
  const displayRooms = useMemo(() => {
    // Sort: fav+unread (3) > fav+read (2) > unread (1) > read (0); newest first within group
    const sorted = [...rooms].sort((a, b) => {
      const ap = (a.favorite ? 2 : 0) + (a.unreadCount > 0 ? 1 : 0);
      const bp = (b.favorite ? 2 : 0) + (b.unreadCount > 0 ? 1 : 0);
      if (ap !== bp) return bp - ap;
      const at = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bt = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bt - at;
    });

    // Type filter
    let filtered = sorted;
    switch (activeFilter) {
      case "UNREAD":    filtered = sorted.filter((r) => r.unreadCount > 0); break;
      case "FAVORITES": filtered = sorted.filter((r) => r.favorite); break;
      case "DIRECT":    filtered = sorted.filter((r) => r.type === "DIRECT"); break;
      case "GROUP":     filtered = sorted.filter((r) => r.type === "GROUP"); break;
      case "ANONYMOUS": filtered = sorted.filter((r) => r.type === "ANONYMOUS"); break;
      case "MATCH":     filtered = sorted.filter((r) => r.type === "MATCH"); break;
      case "EVENT":     filtered = sorted.filter((r) => r.type === "EVENT"); break;
    }

    // Text search
    const q = chatSearch.trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter((r) => {
      const name = r.name.toLowerCase();
      const preview = r.lastMessage
        ? `${r.lastMessage.senderName} ${r.lastMessage.content}`.toLowerCase()
        : "";
      return name.includes(q) || preview.includes(q);
    });
  }, [rooms, activeFilter, chatSearch]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4B1D6B" />
      </View>
    );
  }

  const filteredMembers = members.filter((member) => {
    const search = memberSearch.trim().toLowerCase();
    if (!search) return true;
    const fullName = member.fullName.toLowerCase();
    const nickname = member.nickname?.toLowerCase() ?? "";
    return fullName.includes(search) || nickname.includes(search);
  });

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
    <View style={styles.topActions}>
  <TouchableOpacity
    style={[styles.newChat, styles.actionButton]}
    onPress={() => void openDirectChatPicker()}
  >
    <Ionicons name="create-outline" size={18} color="#fff" />
    <Text style={styles.newChatText}>Direct</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.newChat, styles.actionButton]}
    onPress={() => void openGroupPicker()}
  >
    <Ionicons name="people-outline" size={18} color="#fff" />
    <Text style={styles.newChatText}>Make Group</Text>
  </TouchableOpacity>
</View>
      <TextInput
        style={[styles.searchInput, { marginTop: 8 }]}
        placeholder="Search chats..."
        placeholderTextColor="#9a8da0"
        value={chatSearch}
        onChangeText={setChatSearch}
        clearButtonMode="while-editing"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {(["ALL", "UNREAD", "FAVORITES", "DIRECT", "GROUP", "MATCH", "EVENT", "ANONYMOUS"] as const).map(
          (f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, activeFilter === f && styles.chipActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.chipText, activeFilter === f && styles.chipTextActive]}>
                {f === "ALL" ? "All"
                  : f === "UNREAD" ? "Unread"
                  : f === "FAVORITES" ? "★ Fav"
                  : f === "ANONYMOUS" ? "🕵️ Anon"
                  : f.charAt(0) + f.slice(1).toLowerCase() + "s"}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      <FlatList
        data={displayRooms}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadRooms();
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={44} color="#9875ad" />
            <Text style={styles.emptyTitle}>No chats yet</Text>
            <Text style={styles.emptyText}>
              Match chats appear after squad selection. Event chats appear after
              you respond Going.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.room}>
            <TouchableOpacity
              style={styles.roomOpen}
              onPress={() => navigation.navigate("ChatRoom", { room: item })}
            >
            <View style={styles.icon}>
              <Ionicons name={roomIcon(item.type)} size={23} color="#4B1D6B" />
            </View>
            <View style={styles.roomBody}>
              <View style={styles.row}>
                <Text numberOfLines={1} style={styles.roomName}>
  {item.name}
</Text>
                <Text style={styles.time}>
                  {formatTime(item.lastMessage?.createdAt)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text numberOfLines={1} style={styles.preview}>
                  {item.lastMessage
                    ? `${item.lastMessage.senderName}: ${item.lastMessage.content}`
                    : item.type}
                </Text>
                {item.unreadCount > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {item.unreadCount > 99 ? "99+" : item.unreadCount}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel={`${item.favorite ? "Unfavorite" : "Favorite"} ${item.name}`}
              style={styles.roomAction}
              onPress={() => void toggleFavorite(item)}
            >
              <Ionicons
                name={item.favorite ? "star" : "star-outline"}
                size={20}
                color={item.favorite ? "#da9306" : "#7b6b82"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel={`${item.muted ? "Unmute" : "Mute"} ${item.name}`}
              style={styles.roomAction}
              onPress={() => void toggleMute(item)}
            >
              <Ionicons
                name={item.muted ? "notifications-off-outline" : "notifications-outline"}
                size={20}
                color={item.muted ? "#7b6b82" : "#4B1D6B"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel={`Delete ${item.name} chat`}
              style={styles.roomAction}
              onPress={() => confirmDeleteChat(item)}
            >
              <Ionicons name="trash-outline" size={20} color="#a33b3b" />
            </TouchableOpacity>
          </View>
        )}
      />
      <Modal
        visible={showMembers}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMembers(false)}
      >
        <View style={styles.memberModal}>
          <View style={styles.memberHeader}>
            <Text style={styles.memberTitle}>Message a member</Text>
            <TouchableOpacity onPress={() => setShowMembers(false)}>
              <Ionicons name="close" size={26} color="#4B1D6B" />
            </TouchableOpacity>
          </View>

          <TextInput
  style={styles.searchInput}
  placeholder="Search player..."
  placeholderTextColor="#9a8da0"
  value={memberSearch}
  onChangeText={setMemberSearch}
/>
          <FlatList
           data={filteredMembers}
            keyExtractor={(item) => String(item.userId)}
            ListEmptyComponent={
              loadingMembers ? (
                <ActivityIndicator style={{ marginTop: 30 }} color="#4B1D6B" />
              ) : (
                <View style={styles.memberEmpty}>
                  <Text style={styles.memberEmptyText}>
                    {memberError || "No other approved members found."}
                  </Text>
                  {memberError ? (
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => void openDirectChatPicker()}
                    >
                      <Text style={styles.retryText}>Try again</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                disabled={creatingFor !== null}
                style={styles.member}
                onPress={() => void startDirectChat(item)}
              >
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>
                    {item.fullName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{item.fullName}</Text>
                  {item.nickname ? (
                    <Text style={styles.memberNickname}>{item.nickname}</Text>
                  ) : null}
                </View>
                {creatingFor === item.userId ? (
                  <ActivityIndicator color="#4B1D6B" />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#8b7a92" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>


      <Modal
  visible={showGroupModal}
  animationType="slide"
  presentationStyle="pageSheet"
  onRequestClose={() => setShowGroupModal(false)}
>
  <View style={styles.memberModal}>
    <View style={styles.memberHeader}>
      <Text style={styles.memberTitle}>Make Group</Text>
      <TouchableOpacity onPress={() => setShowGroupModal(false)}>
        <Ionicons name="close" size={26} color="#4B1D6B" />
      </TouchableOpacity>
    </View>

    <TextInput
      style={styles.searchInput}
      placeholder="Group name"
      placeholderTextColor="#9a8da0"
      value={groupName}
      onChangeText={setGroupName}
    />

    <TextInput
      style={styles.searchInput}
      placeholder="Search players..."
      placeholderTextColor="#9a8da0"
      value={memberSearch}
      onChangeText={setMemberSearch}
    />

    <Text style={styles.selectedText}>
      Selected: {selectedMemberIds.length}
    </Text>

    <FlatList
      data={filteredMembers}
      keyExtractor={(item) => String(item.userId)}
      ListEmptyComponent={
        loadingMembers ? (
          <ActivityIndicator style={{ marginTop: 30 }} color="#4B1D6B" />
        ) : (
          <View style={styles.memberEmpty}>
            <Text style={styles.memberEmptyText}>
              {memberError || "No approved members found."}
            </Text>
          </View>
        )
      }
      renderItem={({ item }) => {
        const selected = selectedMemberIds.includes(item.userId);

        return (
          <TouchableOpacity
            style={styles.member}
            onPress={() => toggleSelectedMember(item.userId)}
          >
            <View style={styles.memberAvatar}>
              <Text style={styles.memberInitial}>
                {item.fullName.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>{item.fullName}</Text>
              {item.nickname ? (
                <Text style={styles.memberNickname}>{item.nickname}</Text>
              ) : null}
            </View>

            <Ionicons
              name={selected ? "checkmark-circle" : "ellipse-outline"}
              size={24}
              color={selected ? "#4B1D6B" : "#8b7a92"}
            />
          </TouchableOpacity>
        );
      }}
    />

    <TouchableOpacity
      style={[
        styles.createGroupButton,
        creatingGroup ? styles.disabledButton : null,
      ]}
      disabled={creatingGroup}
      onPress={() => void handleCreateGroup()}
    >
      {creatingGroup ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.createGroupText}>Create Group</Text>
      )}
    </TouchableOpacity>
  </View>
</Modal>
    </SafeAreaView>
  );
};

export default ChatListScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f4f9" },
  newChat: {
    margin: 12,
    marginBottom: 4,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    backgroundColor: "#4B1D6B",
  },
  newChatText: { color: "#fff", fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: {
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  room: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e7dfea",
  },
  roomOpen: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingVertical: 14,
  },
  roomAction: {
    alignSelf: "stretch",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0e7f5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  roomBody: { flex: 1, gap: 6 },
  row: { flexDirection: "row", alignItems: "center" },
  roomName: { flex: 1, color: "#24112e", fontSize: 16, fontWeight: "700" },
  time: { color: "#7b6b82", fontSize: 11, marginLeft: 8 },
  preview: { flex: 1, color: "#75677b", fontSize: 13 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#da9306",
    marginLeft: 8,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  empty: { alignItems: "center", padding: 48, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#3d2449" },
  emptyText: { textAlign: "center", color: "#75677b", lineHeight: 20 },
  memberModal: { flex: 1, backgroundColor: "#f7f4f9", paddingTop: 18 },
  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  memberTitle: { color: "#2d1737", fontSize: 20, fontWeight: "800" },
  member: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 13,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e4dbe8",
  },
  memberAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#eadff0",
    alignItems: "center",
    justifyContent: "center",
  },
  memberInitial: { color: "#4B1D6B", fontSize: 17, fontWeight: "800" },
  memberName: { color: "#2d1737", fontSize: 15, fontWeight: "700" },
  memberNickname: { color: "#7c6b83", fontSize: 12, marginTop: 2 },
  memberEmpty: { alignItems: "center", padding: 30, gap: 14 },
  memberEmptyText: { color: "#75677b", textAlign: "center" },
  retryButton: {
    backgroundColor: "#4B1D6B",
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: { color: "#fff", fontWeight: "700" },
  searchInput: {
  marginHorizontal: 18,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: "#ddd2e4",
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: 10,
  fontSize: 15,
  color: "#2d1737",
  backgroundColor: "#fff",
},
topActions: {
  flexDirection: "row",
  gap: 10,
  margin: 12,
  marginBottom: 4,
},
actionButton: {
  flex: 1,
  margin: 0,
},
selectedText: {
  marginHorizontal: 18,
  marginBottom: 8,
  color: "#4B1D6B",
  fontWeight: "700",
},
createGroupButton: {
  margin: 18,
  borderRadius: 10,
  paddingVertical: 14,
  alignItems: "center",
  backgroundColor: "#4B1D6B",
},
createGroupText: {
  color: "#fff",
  fontWeight: "800",
  fontSize: 15,
},
disabledButton: {
  opacity: 0.6,
},
filterRow: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 6,
  paddingHorizontal: 12,
  paddingBottom: 8,
},
chip: {
  borderWidth: 1,
  borderColor: "#c4b3d0",
  borderRadius: 20,
  paddingHorizontal: 12,
  paddingVertical: 6,
  backgroundColor: "#fff",
},
chipActive: {
  backgroundColor: "#4B1D6B",
  borderColor: "#4B1D6B",
},
chipText: {
  color: "#4B1D6B",
  fontSize: 12,
  fontWeight: "700",
},
chipTextActive: {
  color: "#fff",
},
});
