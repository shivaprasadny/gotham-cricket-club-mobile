// Chat room screen:
// - Shows messages
// - Sends messages
// - Subscribes to WebSocket updates
// - Shows Members button for GROUP / MATCH / EVENT
// - Room admins can add/remove members
// - Room admins can make/remove other admins
// - Direct chats do not show member management

import React, { useCallback, useEffect, useRef, useState } from "react";
import { logger } from "../utils/logger";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import {
  addChatRoomMember,
  deleteChatMessage,
  getChatMembers,
  getChatMessages,
  getChatRooms,
  getChatRoomMembers,
  makeChatRoomAdmin,
  markChatRoomRead,
  removeChatRoomAdmin,
  removeChatRoomMember,
  sendChatMessage,
  leaveChatRoom,
  renameChatRoom,
  enterChatRoomPresence,
  leaveChatRoomPresence,
} from "./chatApi";
import { chatStompClient } from "./stompClient";
import {
  ChatConnectionStatus,
  ChatMember,
  ChatMessage,
  ChatRoom,
} from "./types";
import { useNavigation } from "@react-navigation/native";

const ChatRoomScreen = ({ route }: any) => {
  const typedRoute = route as { params: { room: ChatRoom } };
  const { room } = typedRoute.params;
  const [roomName, setRoomName] = useState(room.name);

  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // =========================
  // MESSAGE STATE
  // =========================
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const navigation = useNavigation<any>();


  // =========================
  // MESSAGE SEARCH STATE
  // =========================
  const [searchActive, setSearchActive] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");

  // =========================
  // MEMBER MANAGEMENT STATE
  // =========================
  const [showMembers, setShowMembers] = useState(false);
  const [roomMembers, setRoomMembers] = useState<ChatMember[]>([]);
  const [allMembers, setAllMembers] = useState<ChatMember[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
const [renameValue, setRenameValue] = useState(roomName);

  // Android keyboard height fix
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // We keep this hidden. No need to show connection status to users.
  const [status, setStatus] = useState<ChatConnectionStatus>(
    chatStompClient.getStatus()
  );

  const subscribedRef = useRef(false);
  const lastSentDraftRef = useRef("");

  const isAnonymousRoom = room.type === "ANONYMOUS";

  const canOpenMembers =
    room.type === "GROUP" ||
    room.type === "MATCH" ||
    room.type === "EVENT" ||
    (isAnonymousRoom && user?.role === "ADMIN");

  const currentUserMembership = roomMembers.find(
    (member) => member.userId === user?.id
  );

  const currentUserIsRoomAdmin = Boolean(currentUserMembership?.roomAdmin);

  // =========================
  // KEYBOARD LISTENER
  // =========================
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const showSub = Keyboard.addListener("keyboardDidShow", (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });

    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // =========================
  // LOAD MESSAGES
  // =========================
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
          logger.log(
            "MARK CHAT READ ERROR:",
            (readError as { response?: { status?: number; data?: unknown } })?.response?.status,
            (readError as { response?: { status?: number; data?: unknown } })?.response?.data
          );
        });
      }
    },
    [room.id]
  );



const refreshRoomName = async () => {
  try {
    const rooms = await getChatRooms();
    const updated = rooms.find((item) => item.id === room.id);

    if (updated?.name) {
      setRoomName(updated.name);

      navigation.setOptions({
        title: updated.name,
      });
    }
  } catch (error) {
    logger.log("ROOM NAME REFRESH ERROR:", error);
  }
};

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
        logger.log(
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

  // =========================
  // WEBSOCKET
  // =========================
  useEffect(() => chatStompClient.addStatusListener(setStatus), []);

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
void refreshRoomName();
      });
    } catch (subscriptionError) {
      subscribedRef.current = false;
      logger.log("CHAT SUBSCRIPTION ERROR:", subscriptionError);
    }

    return () => {
      subscribedRef.current = false;
      roomSubscription?.unsubscribe();
      errorSubscription?.unsubscribe();
    };
  }, [room.id, status, user?.id]);

 

 useEffect(() => {
  let active = true;

  const enter = async () => {
    try {
      await enterChatRoomPresence(room.id);
    } catch (error) {
      logger.log("ENTER ROOM PRESENCE ERROR:", error);
    }
  };

  void enter();

  return () => {
    active = false;

    leaveChatRoomPresence(room.id).catch((error) => {
      logger.log("LEAVE ROOM PRESENCE ERROR:", error);
    });
  };
}, [room.id]);

  // =========================
  // MEMBER MANAGEMENT
  // =========================
  const loadMembers = async () => {
    setLoadingMembers(true);

    try {
      const [currentRoomMembers, approvedMembers] = await Promise.all([
        getChatRoomMembers(room.id),
        getChatMembers(),
      ]);

     setRoomMembers(
  [...currentRoomMembers].sort((a, b) => {
    if (a.roomAdmin && !b.roomAdmin) return -1;
    if (!a.roomAdmin && b.roomAdmin) return 1;
    return a.fullName.localeCompare(b.fullName);
  })
);
      setAllMembers(approvedMembers);
    } catch (loadError: any) {
      Alert.alert(
        "Members",
        loadError?.response?.data?.message || "Could not load members."
      );
    } finally {
      setLoadingMembers(false);
    }
  };

  const openMembersModal = async () => {
    setShowMembers(true);
    setMemberSearch("");
    await loadMembers();
  };

  const handleAddMember = async (member: ChatMember) => {
    try {
      const added = await addChatRoomMember(room.id, member.userId);

      setRoomMembers((current) =>
        current.some((item) => item.userId === added.userId)
          ? current
          : [...current, added]
      );
    } catch (addError: any) {
      Alert.alert(
        "Could not add member",
        addError?.response?.data?.message || "Please try again."
      );
    }
  };

  const confirmRemoveMember = (member: ChatMember) => {
    Alert.alert("Remove member", `Remove ${member.fullName} from this chat?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeChatRoomMember(room.id, member.userId);

            setRoomMembers((current) =>
              current.filter((item) => item.userId !== member.userId)
            );
          } catch (removeError: any) {
            Alert.alert(
              "Could not remove member",
              removeError?.response?.data?.message || "Please try again."
            );
          }
        },
      },
    ]);
  };

  const handleMakeAdmin = async (member: ChatMember) => {
    try {
      const updated = await makeChatRoomAdmin(room.id, member.userId);

      setRoomMembers((current) =>
        current.map((item) =>
          item.userId === updated.userId
            ? { ...item, roomAdmin: true }
            : item
        )
      );
    } catch (error: any) {
      Alert.alert(
        "Could not make admin",
        error?.response?.data?.message || "Please try again."
      );
    }
  };

  const handleRemoveAdmin = async (member: ChatMember) => {
    try {
      const updated = await removeChatRoomAdmin(room.id, member.userId);

      setRoomMembers((current) =>
        current.map((item) =>
          item.userId === updated.userId
            ? { ...item, roomAdmin: false }
            : item
        )
      );
    } catch (error: any) {
      Alert.alert(
        "Could not remove admin",
        error?.response?.data?.message || "Please try again."
      );
    }
  };

  const openMemberActions = (member: ChatMember) => {
    if (!currentUserIsRoomAdmin) {
      return;
    }

    Alert.alert(member.fullName, "Choose an action", [
      member.roomAdmin
        ? {
            text: "Remove Admin",
            onPress: () => void handleRemoveAdmin(member),
          }
        : {
            text: "Make Admin",
            onPress: () => void handleMakeAdmin(member),
          },
      {
        text: "Remove Member",
        style: "destructive",
        onPress: () => confirmRemoveMember(member),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const availableMembers = allMembers.filter(
    (member) =>
      member.userId !== user?.id &&
      !roomMembers.some((roomMember) => roomMember.userId === member.userId)
  );

  const filteredAvailableMembers = availableMembers.filter((member) => {
    const search = memberSearch.trim().toLowerCase();

    if (!search) return true;

    const fullName = member.fullName.toLowerCase();
    const nickname = member.nickname?.toLowerCase() ?? "";

    return fullName.includes(search) || nickname.includes(search);
  });

  // =========================
  // SEND MESSAGE
  // =========================
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


const handleRenameGroup = () => {
  setRenameValue(roomName);
  setShowMembers(false);

  setTimeout(() => {
    setShowRenameModal(true);
  }, 250);
};


const submitRenameGroup = async () => {
  const trimmed = renameValue.trim();

  if (!trimmed) {
    Alert.alert("Group name required");
    return;
  }

  try {
    const updatedRoom = await renameChatRoom(room.id, trimmed);

    setRoomName(updatedRoom.name);
    setShowRenameModal(false);

    navigation.setOptions({
      title: updatedRoom.name,
    });

    await refreshLatest();

    Alert.alert("Success", "Group name updated.");
  } catch (error: any) {
    Alert.alert(
      "Could not rename group",
      error?.response?.data?.message || "Please try again."
    );
  }
};


const handleLeaveGroup = () => {
  Alert.alert(
    "Leave Group",
    "Are you sure you want to leave this group?",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            await leaveChatRoom(room.id);
setShowMembers(false);
navigation.goBack();
          } catch (error: any) {
            Alert.alert(
              "Could not leave group",
              error?.response?.data?.message || "Please try again."
            );
          }
        },
      },
    ]
  );
};





  // =========================
  // RENDER MEMBER ROW
  // =========================
  const renderCurrentMember = ({ item }: { item: ChatMember }) => {
    const isMe = item.userId === user?.id;

    return (
      <View style={styles.memberRow}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberInitial}>
            {item.fullName.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName}>{item.fullName}</Text>

            {isMe ? <Text style={styles.youText}>You</Text> : null}

            {item.roomAdmin ? (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>ADMIN</Text>
              </View>
            ) : null}
          </View>

          {item.nickname ? (
            <Text style={styles.memberNickname}>{item.nickname}</Text>
          ) : null}
        </View>

        {currentUserIsRoomAdmin && !isMe ? (
          <TouchableOpacity onPress={() => openMemberActions(item)}>
            <Ionicons
              name="ellipsis-vertical"
              size={22}
              color="#4B1D6B"
            />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };


  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.topBar}>
          {canOpenMembers ? (
            <TouchableOpacity
              style={styles.topBarBtn}
              onPress={() => void openMembersModal()}
            >
              <Ionicons name="information-circle-outline" size={18} color="#4B1D6B" />
              <Text style={styles.topBarBtnText}>Info</Text>
            </TouchableOpacity>
          ) : <View style={{ flex: 1 }} />}

          <TouchableOpacity
            style={styles.topBarBtn}
            onPress={() => {
              setSearchActive((v) => !v);
              setMessageSearch("");
            }}
          >
            <Ionicons
              name={searchActive ? "close-outline" : "search-outline"}
              size={18}
              color="#4B1D6B"
            />
            <Text style={styles.topBarBtnText}>
              {searchActive ? "Close" : "Search"}
            </Text>
          </TouchableOpacity>
        </View>

        {searchActive ? (
          <TextInput
            style={styles.messageSearchInput}
            placeholder="Search messages…"
            placeholderTextColor="#9a8da0"
            value={messageSearch}
            onChangeText={setMessageSearch}
            autoFocus
            clearButtonMode="while-editing"
          />
        ) : null}

        {isAnonymousRoom ? (
          <View style={styles.anonBanner}>
            <Text style={styles.anonBannerText}>
              Messages here are anonymous. Be respectful.
            </Text>
          </View>
        ) : null}

        <View style={styles.chatBody}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color="#4B1D6B" />
            </View>
          ) : messages.length === 0 && !searchActive ? (
            <View style={styles.emptyOuter}>
              <Text style={styles.empty}>Start the conversation.</Text>
            </View>
          ) : (
            <FlatList
              inverted={!searchActive}
              data={
                searchActive && messageSearch.trim()
                  ? messages.filter((m) => {
                      const q = messageSearch.trim().toLowerCase();
                      return (
                        m.content.toLowerCase().includes(q) ||
                        m.senderName.toLowerCase().includes(q)
                      );
                    })
                  : messages
              }
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.messages}
              keyboardShouldPersistTaps="handled"
              onEndReached={() => void loadOlder()}
              onEndReachedThreshold={0.3}
              ListFooterComponent={
                loadingMore ? <ActivityIndicator color="#4B1D6B" /> : null
              }
            ListEmptyComponent={
  <View style={styles.emptyOuter}>
    <Text style={styles.empty}>No messages found.</Text>
  </View>
}
              renderItem={({ item }) => {
                if (item.type === "SYSTEM") {
  return (
    <View style={styles.systemMessageWrap}>
      <Text style={styles.systemMessageText}>{item.content}</Text>
    </View>
  );
}
                const mine = item.senderId === user?.id;

                return (
                  <TouchableOpacity
                    activeOpacity={mine ? 0.7 : 1}
                    onLongPress={() => {
  if (!mine) return;
  Alert.alert(
    "Delete message",
    "Remove this message?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            // ✅ Call backend to permanently delete
            await deleteChatMessage(room.id, item.id);
            // Remove from local state after backend confirms
            setMessages((cur) =>
              cur.filter((m) => m.id !== item.id)
            );
          } catch (deleteError: any) {
            Alert.alert(
              "Could not delete",
              deleteError?.response?.data?.message || "Please try again."
            );
          }
        },
      },
    ]
  );
}}
                    style={[
                      styles.messageRow,
                      mine ? styles.messageRowMine : styles.messageRowOther,
                    ]}
                  >
                    <View
                      style={[styles.bubble, mine ? styles.mine : styles.other]}
                    >
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
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>

        <View
          style={[
            styles.composer,
            {
              marginBottom:
                Platform.OS === "android"
                  ? keyboardHeight
                  : Math.max(insets.bottom, 8),
            },
          ]}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message"
            multiline
            maxLength={2000}
            style={styles.input}
            textAlignVertical="center"
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

        <Modal
          visible={showMembers}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowMembers(false)}
        >
          <SafeAreaView style={styles.memberModal}>

        
            <View style={styles.memberHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberTitle} numberOfLines={2}>{roomName}</Text>
                <View style={styles.memberHeaderRow}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{room.type}</Text>
                  </View>
                  <Text style={styles.memberSubtitle}>
                    {roomMembers.length} members • {roomMembers.filter(m => m.roomAdmin).length} admins
                  </Text>
                </View>
                <Text style={styles.memberSubtitle}>
                  Admins:{" "}
                  {roomMembers.filter((m) => m.roomAdmin).map((m) => m.fullName).join(", ") || "None"}
                </Text>
              </View>

              <TouchableOpacity onPress={() => setShowMembers(false)}>
                <Ionicons name="close" size={26} color="#4B1D6B" />
              </TouchableOpacity>
            </View>

            {loadingMembers ? (
              <ActivityIndicator style={{ marginTop: 30 }} color="#4B1D6B" />
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={styles.sectionTitle}>Current Members</Text>
                {(room.type === "GROUP" || room.type === "MATCH" || room.type === "EVENT") && !isAnonymousRoom ? (
  <View style={styles.groupActions}>
    {room.type === "GROUP" && currentUserIsRoomAdmin ? (
      <TouchableOpacity
        style={styles.groupActionButton}
        onPress={handleRenameGroup}
      >
        <Ionicons name="create-outline" size={18} color="#4B1D6B" />
        <Text style={styles.groupActionText}>Rename Group</Text>
      </TouchableOpacity>
    ) : null}

    <TouchableOpacity
      style={styles.groupActionButton}
      onPress={handleLeaveGroup}
    >
      <Ionicons name="exit-outline" size={18} color="#a33b3b" />
      <Text style={[styles.groupActionText, { color: "#a33b3b" }]}>
        Leave
      </Text>
    </TouchableOpacity>
  </View>
) : null}

                {roomMembers.map((member) => (
                  <View key={member.userId}>
                    {renderCurrentMember({ item: member })}
                  </View>
                ))}

                {currentUserIsRoomAdmin ? (
                  <>
                    <Text style={styles.sectionTitle}>Add Members</Text>

                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search players to add..."
                      placeholderTextColor="#9a8da0"
                      value={memberSearch}
                      onChangeText={setMemberSearch}
                    />

                    {filteredAvailableMembers.length === 0 ? (
                      <Text style={styles.noMembersText}>
                        No players available to add.
                      </Text>
                    ) : (
                      filteredAvailableMembers.map((member) => (
                        <TouchableOpacity
                          key={member.userId}
                          style={styles.memberRow}
                          onPress={() => void handleAddMember(member)}
                        >
                          <View style={styles.memberAvatar}>
                            <Text style={styles.memberInitial}>
                              {member.fullName.charAt(0).toUpperCase()}
                            </Text>
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={styles.memberName}>
                              {member.fullName}
                            </Text>

                            {member.nickname ? (
                              <Text style={styles.memberNickname}>
                                {member.nickname}
                              </Text>
                            ) : null}
                          </View>

                          <Ionicons
                            name="add-circle-outline"
                            size={24}
                            color="#4B1D6B"
                          />
                        </TouchableOpacity>
                      ))
                    )}
                  </>
                ) : (
                  <Text style={styles.noMembersText}>
                    Only room admins can add or remove members.
                  </Text>
                )}
              </ScrollView>
            )}
          </SafeAreaView>
        </Modal>

        <Modal
  visible={showRenameModal}
  transparent
  animationType="fade"
  onRequestClose={() => setShowRenameModal(false)}
>
  <View style={styles.renameOverlay}>
    <View style={styles.renameBox}>
      <Text style={styles.renameTitle}>Rename Group</Text>

      <TextInput
        style={styles.renameInput}
        value={renameValue}
        onChangeText={setRenameValue}
        placeholder="Group name"
      />

      <View style={styles.renameActions}>
        <TouchableOpacity onPress={() => setShowRenameModal(false)}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => void submitRenameGroup()}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatRoomScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f4f9",
  },

  container: {
    flex: 1,
    backgroundColor: "#f7f4f9",
  },

  chatBody: {
    flex: 1,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  membersButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e4dbe8",
  },

  membersButtonText: {
    color: "#4B1D6B",
    fontWeight: "800",
  },

  messages: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },

  messageRow: {
    flexDirection: "row",
    marginVertical: 4,
  },

  messageRowMine: {
    justifyContent: "flex-end",
  },

  messageRowOther: {
    justifyContent: "flex-start",
  },

  bubble: {
    maxWidth: "82%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  mine: {
    backgroundColor: "#4B1D6B",
    borderBottomRightRadius: 4,
  },

  other: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
  },

  sender: {
    color: "#7c3c9e",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 3,
  },

  content: {
    color: "#26152e",
    fontSize: 15,
    lineHeight: 20,
  },

  mineText: {
    color: "#fff",
  },

  timestamp: {
    color: "#85778b",
    fontSize: 10,
    marginTop: 4,
    textAlign: "right",
  },

  mineTime: {
    color: "#d8c7e1",
  },

  empty: {
    textAlign: "center",
    color: "#817287",
    marginTop: 36,
  },

  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
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
    paddingVertical: Platform.OS === "android" ? 8 : 10,
    color: "#24112e",
    backgroundColor: "#fff",
  },

  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#da9306",
  },

  sendDisabled: {
    opacity: 0.45,
  },

  memberModal: {
    flex: 1,
    backgroundColor: "#f7f4f9",
  },

  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
  },

  memberTitle: {
    color: "#2d1737",
    fontSize: 20,
    fontWeight: "800",
  },

  memberSubtitle: {
    color: "#7c6b83",
    marginTop: 2,
    fontSize: 12,
  },

  sectionTitle: {
    marginHorizontal: 18,
    marginTop: 16,
    marginBottom: 8,
    color: "#4B1D6B",
    fontWeight: "800",
  },

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

  memberRow: {
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eadff0",
    alignItems: "center",
    justifyContent: "center",
  },

  memberInitial: {
    color: "#4B1D6B",
    fontSize: 16,
    fontWeight: "800",
  },

  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },

  memberName: {
    color: "#2d1737",
    fontSize: 15,
    fontWeight: "700",
  },

  memberNickname: {
    color: "#7c6b83",
    fontSize: 12,
    marginTop: 2,
  },

  adminBadge: {
    backgroundColor: "#da9306",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  adminBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },

  youText: {
    color: "#7c6b83",
    fontSize: 11,
    fontWeight: "700",
  },

  noMembersText: {
    color: "#7c6b83",
    textAlign: "center",
    margin: 18,
  },
  emptyWrap: {
  transform: [{ scaleY: -1 }],
},
  emptyOuter: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 28,
  },
groupActions: {
  flexDirection: "row",
  gap: 10,
  paddingHorizontal: 18,
  marginBottom: 12,
},

groupActionButton: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  backgroundColor: "#fff",
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderRadius: 10,
},

groupActionText: {
  color: "#4B1D6B",
  fontWeight: "700",
},
renameOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.35)",
  justifyContent: "center",
  padding: 24,
},
renameBox: {
  backgroundColor: "#fff",
  borderRadius: 16,
  padding: 18,
},
renameTitle: {
  color: "#2d1737",
  fontSize: 18,
  fontWeight: "800",
  marginBottom: 12,
},
renameInput: {
  borderWidth: 1,
  borderColor: "#ddd2e4",
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: 10,
  color: "#2d1737",
},
renameActions: {
  flexDirection: "row",
  justifyContent: "flex-end",
  gap: 22,
  marginTop: 18,
},
cancelText: {
  color: "#7c6b83",
  fontWeight: "700",
},
saveText: {
  color: "#4B1D6B",
  fontWeight: "800",
},

systemMessageWrap: {
  alignItems: "center",
  marginVertical: 8,
  paddingHorizontal: 24,
},

systemMessageText: {
  color: "#7c6b83",
  fontSize: 12,
  fontWeight: "700",
  textAlign: "center",
  backgroundColor: "#eee6f1",
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 14,
  overflow: "hidden",
},
memberHeaderRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  marginTop: 4,
  marginBottom: 2,
},
typeBadge: {
  backgroundColor: "#eadff0",
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 8,
},
typeBadgeText: {
  color: "#4B1D6B",
  fontSize: 11,
  fontWeight: "700",
},
topBar: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#fff",
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: "#e4dbe8",
},
topBarBtn: {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  paddingVertical: 9,
},
topBarBtnText: {
  color: "#4B1D6B",
  fontWeight: "800",
  fontSize: 13,
},
messageSearchInput: {
  marginHorizontal: 12,
  marginVertical: 8,
  borderWidth: 1,
  borderColor: "#d8cedd",
  borderRadius: 10,
  paddingHorizontal: 14,
  paddingVertical: 9,
  fontSize: 15,
  color: "#24112e",
  backgroundColor: "#fff",
},
anonBanner: {
  backgroundColor: "#eadff0",
  paddingHorizontal: 16,
  paddingVertical: 7,
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: "#d5c9e0",
},
anonBannerText: {
  color: "#4B1D6B",
  fontSize: 12,
  fontWeight: "600",
  textAlign: "center",
},
});