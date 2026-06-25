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
  Linking,
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
  createDirectChat,
  deleteChatMessage,
  getChatMembers,
  getChatMessages,
  getChatRooms,
  getChatRoomMembers,
  makeChatRoomAdmin,
  markChatRoomRead,
  removeChatRoomAdmin,
  removeChatRoomMember,
  reportMessage,
  sendChatMessage,
  leaveChatRoom,
  renameChatRoom,
  enterChatRoomPresence,
  leaveChatRoomPresence,
  toggleReaction,
  setRoomFrozen,
} from "./chatApi";
import { chatStompClient } from "./stompClient";
import {
  ChatConnectionStatus,
  ChatMember,
  ChatMessage,
  ChatRoom,
} from "./types";
import { useNavigation } from "@react-navigation/native";
import { getMemberById } from "../services/memberService";
import { MemberProfile } from "./types";

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

  // Frozen state — initialised from room prop, updated live via WebSocket
  const [isFrozen, setIsFrozen] = useState(room.frozen ?? false);
  // Which message's emoji picker is open (null = none)
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<number | null>(null);
  // WhatsApp-style reaction viewer
  const [reactionViewerMsg, setReactionViewerMsg] = useState<ChatMessage | null>(null);
  const [reactionViewerTab, setReactionViewerTab] = useState("all");

  // Reply state
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Message action bottom sheet (group chat tap / anonymous long press)
  const [msgActionItem, setMsgActionItem] = useState<ChatMessage | null>(null);

  useEffect(() => {
    if (room.type !== "DIRECT") return;
    getChatRoomMembers(room.id)
      .then((members) => {
        const partner = members.find((m) => m.userId !== user?.id);
        if (partner) return getMemberById(partner.userId);
      })
      .then((p) => {
        if (!p) return;
        const partner = p as MemberProfile;

        const partnerPhone = `${partner.countryCode ?? ""}${partner.phone ?? ""}`.trim();
        const partnerWhatsApp = partner.showWhatsApp !== false;

        const goToProfile = () =>
          navigation.navigate("MemberProfile", { userId: partner.userId });

        const handleWA = async () => {
          const digits = partnerPhone.replace(/\D/g, "");
          try {
            await Linking.openURL(`https://wa.me/${digits}`);
          } catch {
            Alert.alert("Cannot open WhatsApp", "Make sure WhatsApp is installed and try again.");
          }
        };

        navigation.setOptions({
          // Tappable avatar + name replaces the plain text title
          headerTitle: () => (
            <TouchableOpacity
              onPress={goToProfile}
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <View style={{
                width: 34, height: 34, borderRadius: 17,
                backgroundColor: "#da9306",
                alignItems: "center", justifyContent: "center",
              }}>
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>
                  {(partner.fullName ?? roomName).charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={{ color: "#2b0540", fontWeight: "700", fontSize: 15 }} numberOfLines={1}>
                  {partner.fullName ?? roomName}
                </Text>
                {partner.nickname ? (
                  <Text style={{ color: "#7a5c9a", fontSize: 11 }}>"{partner.nickname}"</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ),
          // Call / SMS / WhatsApp icons in the header right
          headerRight: partnerPhone ? () => (
            <View style={{ flexDirection: "row", gap: 2, marginRight: 4 }}>
              <TouchableOpacity
                style={{ padding: 6 }}
                onPress={() => void Linking.openURL(`tel:${partnerPhone}`)}
              >
                <Ionicons name="call-outline" size={22} color="#4B1D6B" />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ padding: 6 }}
                onPress={() => void Linking.openURL(`sms:${partnerPhone}`)}
              >
                <Ionicons name="chatbubble-outline" size={22} color="#4B1D6B" />
              </TouchableOpacity>
              {partnerWhatsApp ? (
                <TouchableOpacity style={{ padding: 6 }} onPress={() => void handleWA()}>
                  <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : undefined,
        });
      })
      .catch(() => {});
  }, [room.id, user?.id]);

  const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "👏"];

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
        // Freeze/unfreeze sentinel — update UI state, don't add to message list
        if (message.content === "__ROOM_FROZEN__") { setIsFrozen(true); return; }
        if (message.content === "__ROOM_UNFROZEN__") { setIsFrozen(false); return; }

        setMessages((current) => {
          const exists = current.some((item) => item.id === message.id);
          if (exists) {
            // Reaction update — replace in place to refresh reaction bubbles
            return current.map((item) => item.id === message.id ? message : item);
          }
          return [message, ...current];
        });

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

  // Polling fallback — catches messages and reaction updates the WebSocket missed
  useEffect(() => {
    const interval = setInterval(() => void refreshLatest().catch(() => {}), 3000);
    return () => clearInterval(interval);
  }, [refreshLatest]);

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
    const replyId = replyingTo?.id ?? null;
    setReplyingTo(null);

    try {
      const saved = await sendChatMessage(room.id, content, replyId);

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

          {/* Freeze / unfreeze button — ADMIN only, anonymous rooms only */}
          {isAnonymousRoom && user?.role === "ADMIN" ? (
            <TouchableOpacity
              style={styles.topBarBtn}
              onPress={() => {
                const next = !isFrozen;
                Alert.alert(
                  next ? "Freeze Chat" : "Unfreeze Chat",
                  next
                    ? "Members won't be able to send messages while the chat is frozen."
                    : "Members will be able to send messages again.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: next ? "Freeze" : "Unfreeze",
                      style: next ? "destructive" : "default",
                      onPress: async () => {
                        try {
                          await setRoomFrozen(room.id, next);
                          setIsFrozen(next);
                        } catch (e: any) {
                          Alert.alert("Error", e?.response?.data?.message || "Please try again.");
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Ionicons
                name={isFrozen ? "lock-open-outline" : "lock-closed-outline"}
                size={18}
                color={isFrozen ? "#4caf50" : "#e53935"}
              />
              <Text style={[styles.topBarBtnText, { color: isFrozen ? "#4caf50" : "#e53935" }]}>
                {isFrozen ? "Unfreeze" : "Freeze"}
              </Text>
            </TouchableOpacity>
          ) : null}

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

        {isFrozen ? (
          <View style={styles.frozenBanner}>
            <Ionicons name="lock-closed" size={14} color="#fff" />
            <Text style={styles.frozenBannerText}>
              {user?.role === "ADMIN"
                ? "Chat is frozen — only you can send messages."
                : "Chat is frozen by admin. No new messages allowed."}
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
                const mine = !isAnonymousRoom && item.senderId === user?.id;
                const isGroupOrMatch = room.type === "GROUP" || room.type === "MATCH" || room.type === "EVENT";

                return (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onLongPress={() => {
                      setReactionPickerMsgId(null);
                      setMsgActionItem(item);
                    }}
                    onPress={() => {
                      if (reactionPickerMsgId !== null) {
                        setReactionPickerMsgId(null);
                        return;
                      }
                      // Group/match/event: tap other's message → action sheet
                      if (isGroupOrMatch && !isAnonymousRoom && !mine) {
                        setMsgActionItem(item);
                      }
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

                      {/* Reply quote */}
                      {item.replyToMessageId ? (
                        <View style={[styles.replyQuote, mine && styles.replyQuoteMine]}>
                          <Text style={styles.replyQuoteSender} numberOfLines={1}>
                            {item.replySenderName ?? "Unknown"}
                          </Text>
                          <Text style={styles.replyQuoteText} numberOfLines={2}>
                            {item.replyPreview ?? ""}
                          </Text>
                        </View>
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

                    {/* Emoji picker — appears below bubble on long press */}
                    {reactionPickerMsgId === item.id ? (
                      <View style={[styles.emojiPicker, mine ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" }]}>
                        {EMOJIS.map((emoji) => (
                          <TouchableOpacity
                            key={emoji}
                            style={styles.emojiBtn}
                            onPress={async () => {
                              setReactionPickerMsgId(null);
                              try {
                                const updated = await toggleReaction(room.id, item.id, emoji);
                                // Immediately update bubble without waiting for WebSocket round-trip
                                setMessages((cur) =>
                                  cur.map((m) => m.id === updated.id ? updated : m)
                                );
                              } catch (e: any) {
                                Alert.alert("Reaction", e?.response?.data?.message || "Could not save reaction.");
                              }
                            }}
                          >
                            <Text style={styles.emojiBtnText}>{emoji}</Text>
                          </TouchableOpacity>
                        ))}
                        {/* Delete option for own messages */}
                        {mine ? (
                          <TouchableOpacity
                            style={styles.emojiBtn}
                            onPress={() => {
                              setReactionPickerMsgId(null);
                              Alert.alert("Delete message", "Remove this message?", [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Delete",
                                  style: "destructive",
                                  onPress: async () => {
                                    try {
                                      await deleteChatMessage(room.id, item.id);
                                      setMessages((cur) => cur.filter((m) => m.id !== item.id));
                                    } catch (deleteError: any) {
                                      Alert.alert("Could not delete", deleteError?.response?.data?.message || "Please try again.");
                                    }
                                  },
                                },
                              ]);
                            }}
                          >
                            <Text style={styles.emojiBtnText}>🗑️</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    ) : null}

                    {/* Reaction bubbles */}
                    {item.reactions && item.reactions.length > 0 ? (
                      <View style={styles.reactionRow}>
                        {item.reactions.map((r) => {
                          const iMine = r.reactorNames === null
                            ? false
                            : r.reactorNames.includes(user?.fullName ?? "");
                          return (
                            <TouchableOpacity
                              key={r.emoji}
                              style={[styles.reactionBubble, iMine && styles.reactionBubbleMine]}
                              onPress={async () => {
                                try {
                                  const updated = await toggleReaction(room.id, item.id, r.emoji);
                                  setMessages((cur) =>
                                    cur.map((m) => m.id === updated.id ? updated : m)
                                  );
                                } catch (e: any) {
                                  Alert.alert("Reaction", e?.response?.data?.message || "Could not save reaction.");
                                }
                              }}
                              onLongPress={() => {
                                setReactionViewerTab("all");
                                setReactionViewerMsg(item);
                              }}
                            >
                              <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                              <Text style={styles.reactionCount}>{r.count}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>

        {/* Reply preview bar — shown when user is replying to a message */}
        {replyingTo ? (
          <View style={styles.replyBar}>
            <View style={styles.replyBarContent}>
              <Text style={styles.replyBarSender} numberOfLines={1}>
                Replying to {replyingTo.replySenderName ?? replyingTo.senderName}
              </Text>
              <Text style={styles.replyBarText} numberOfLines={1}>
                {replyingTo.content}
              </Text>
            </View>
            <TouchableOpacity style={styles.replyBarClose} onPress={() => setReplyingTo(null)}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        ) : null}

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
            placeholder={isFrozen && user?.role !== "ADMIN" ? "Chat is frozen…" : "Message"}
            multiline
            maxLength={2000}
            style={[styles.input, isFrozen && user?.role !== "ADMIN" && { color: "#aaa" }]}
            textAlignVertical="center"
            editable={!(isFrozen && user?.role !== "ADMIN")}
          />

          <TouchableOpacity
            accessibilityLabel="Send message"
            disabled={!draft.trim() || sending || (isFrozen && user?.role !== "ADMIN")}
            onPress={() => void send()}
            style={[
              styles.send,
              (!draft.trim() || sending || (isFrozen && user?.role !== "ADMIN")) && styles.sendDisabled,
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
        {/* Reaction viewer — WhatsApp-style bottom sheet */}
        <Modal
          visible={reactionViewerMsg !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setReactionViewerMsg(null)}
        >
          <View style={styles.rxOverlay}>
            <View style={styles.rxSheet}>
              {/* Header */}
              <View style={styles.rxHeader}>
                <Text style={styles.rxHeaderTitle}>Reactions</Text>
                <TouchableOpacity onPress={() => setReactionViewerMsg(null)}>
                  <Ionicons name="close" size={22} color="#333" />
                </TouchableOpacity>
              </View>

              {/* Emoji tabs */}
              <View style={styles.rxTabs}>
                <TouchableOpacity
                  style={[styles.rxTab, reactionViewerTab === "all" && styles.rxTabActive]}
                  onPress={() => setReactionViewerTab("all")}
                >
                  <Text style={[styles.rxTabText, reactionViewerTab === "all" && styles.rxTabTextActive]}>
                    {"All "}
                    {(reactionViewerMsg?.reactions ?? []).reduce((s, r) => s + r.count, 0)}
                  </Text>
                </TouchableOpacity>
                {(reactionViewerMsg?.reactions ?? []).map((r) => (
                  <TouchableOpacity
                    key={r.emoji}
                    style={[styles.rxTab, reactionViewerTab === r.emoji && styles.rxTabActive]}
                    onPress={() => setReactionViewerTab(r.emoji)}
                  >
                    <Text style={[styles.rxTabText, reactionViewerTab === r.emoji && styles.rxTabTextActive]}>
                      {r.emoji} {r.count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Reactor list */}
              {(() => {
                const allReactions = reactionViewerMsg?.reactions ?? [];
                const selected = reactionViewerTab === "all"
                  ? allReactions
                  : allReactions.filter((r) => r.emoji === reactionViewerTab);
                const isAnonymous = selected.some((r) => r.reactorNames === null);

                if (isAnonymous) {
                  return (
                    <View style={styles.rxAnon}>
                      <Ionicons name="lock-closed" size={30} color="#ccc" />
                      <Text style={styles.rxAnonText}>Reactions are private in anonymous chat</Text>
                      {selected.map((r) => (
                        <Text key={r.emoji} style={styles.rxAnonCount}>
                          {r.emoji}{"  "}{r.count}
                        </Text>
                      ))}
                    </View>
                  );
                }

                type RxRow = { emoji: string; name: string };
                const rows: RxRow[] = [];
                selected.forEach((r) =>
                  (r.reactorNames ?? []).forEach((name) =>
                    rows.push({ emoji: r.emoji, name })
                  )
                );

                return (
                  <FlatList
                    data={rows}
                    keyExtractor={(_, i) => String(i)}
                    contentContainerStyle={styles.rxList}
                    renderItem={({ item: row }) => (
                      <View style={styles.rxRow}>
                        <View style={styles.rxAvatar}>
                          <Text style={styles.rxAvatarText}>
                            {row.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.rxName}>{row.name}</Text>
                        {reactionViewerTab === "all" && (
                          <Text style={styles.rxRowEmoji}>{row.emoji}</Text>
                        )}
                      </View>
                    )}
                  />
                );
              })()}
            </View>
          </View>
        </Modal>

      </KeyboardAvoidingView>

      {/* Message action bottom sheet */}
      {msgActionItem !== null ? (
        <Modal visible transparent animationType="slide" onRequestClose={() => setMsgActionItem(null)}>
          <TouchableOpacity
            style={styles.actionSheetOverlay}
            activeOpacity={1}
            onPress={() => setMsgActionItem(null)}
          />
          <View style={styles.actionSheet}>
            <View style={styles.actionSheetHandle} />

            {/* Reply — available in all room types */}
            <TouchableOpacity
              style={styles.actionSheetItem}
              onPress={() => {
                setReplyingTo(msgActionItem);
                setMsgActionItem(null);
              }}
            >
              <Ionicons name="return-down-back-outline" size={22} color="#4B1D6B" />
              <Text style={styles.actionSheetItemText}>Reply</Text>
            </TouchableOpacity>

            {/* Emoji reactions — shown via picker shortcut */}
            <TouchableOpacity
              style={styles.actionSheetItem}
              onPress={() => {
                setReactionPickerMsgId(msgActionItem.id);
                setMsgActionItem(null);
              }}
            >
              <Ionicons name="happy-outline" size={22} color="#4B1D6B" />
              <Text style={styles.actionSheetItemText}>React</Text>
            </TouchableOpacity>

            {/* Message Privately — group/match/event non-anonymous only, other member */}
            {!isAnonymousRoom &&
              (room.type === "GROUP" || room.type === "MATCH" || room.type === "EVENT") &&
              msgActionItem.senderId !== user?.id ? (
              <TouchableOpacity
                style={styles.actionSheetItem}
                onPress={async () => {
                  setMsgActionItem(null);
                  try {
                    const directRoom = await createDirectChat(msgActionItem.senderId!);
                    navigation.navigate("ChatRoom", { room: directRoom });
                  } catch (e: any) {
                    Alert.alert("Could not open chat", e?.response?.data?.message || "Please try again.");
                  }
                }}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={22} color="#4B1D6B" />
                <Text style={styles.actionSheetItemText}>Message Privately</Text>
              </TouchableOpacity>
            ) : null}

            {/* View Profile — non-anonymous only, other member */}
            {!isAnonymousRoom && msgActionItem.senderId !== user?.id ? (
              <TouchableOpacity
                style={styles.actionSheetItem}
                onPress={() => {
                  setMsgActionItem(null);
                  navigation.navigate("MemberProfile", { userId: msgActionItem.senderId });
                }}
              >
                <Ionicons name="person-outline" size={22} color="#4B1D6B" />
                <Text style={styles.actionSheetItemText}>View Profile</Text>
              </TouchableOpacity>
            ) : null}

            {/* Report — anonymous rooms only */}
            {isAnonymousRoom ? (
              <TouchableOpacity
                style={styles.actionSheetItem}
                onPress={() => {
                  const id = msgActionItem.id;
                  setMsgActionItem(null);
                  Alert.alert("Report Message", "Report this message for admin review?", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Report",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await reportMessage(room.id, id);
                          Alert.alert("Reported", "This message has been reported for admin review.");
                        } catch (e: any) {
                          Alert.alert("Could not report", e?.response?.data?.message || "Please try again.");
                        }
                      },
                    },
                  ]);
                }}
              >
                <Ionicons name="flag-outline" size={22} color="#e53935" />
                <Text style={[styles.actionSheetItemText, styles.actionSheetItemDanger]}>Report</Text>
              </TouchableOpacity>
            ) : null}

            {/* Delete — own messages only */}
            {msgActionItem.senderId === user?.id && !isAnonymousRoom ? (
              <TouchableOpacity
                style={styles.actionSheetItem}
                onPress={() => {
                  const id = msgActionItem.id;
                  setMsgActionItem(null);
                  Alert.alert("Delete message", "Remove this message?", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await deleteChatMessage(room.id, id);
                          setMessages((cur) => cur.filter((m) => m.id !== id));
                        } catch (deleteError: any) {
                          Alert.alert("Could not delete", deleteError?.response?.data?.message || "Please try again.");
                        }
                      },
                    },
                  ]);
                }}
              >
                <Ionicons name="trash-outline" size={22} color="#e53935" />
                <Text style={[styles.actionSheetItemText, styles.actionSheetItemDanger]}>Delete</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </Modal>
      ) : null}
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

frozenBanner: {
  backgroundColor: "#b71c1c",
  paddingHorizontal: 16,
  paddingVertical: 7,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
},

frozenBannerText: {
  color: "#fff",
  fontSize: 12,
  fontWeight: "700",
  textAlign: "center",
  flexShrink: 1,
},

reactionRow: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 4,
  marginTop: 4,
  marginHorizontal: 4,
},

reactionBubble: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#f0ebf8",
  borderRadius: 12,
  paddingHorizontal: 8,
  paddingVertical: 3,
  gap: 3,
  borderWidth: 1,
  borderColor: "#d5c9e0",
},

reactionBubbleMine: {
  backgroundColor: "#e8d5f5",
  borderColor: "#9b59b6",
},

reactionEmoji: {
  fontSize: 14,
},

reactionCount: {
  fontSize: 12,
  color: "#4B1D6B",
  fontWeight: "600",
},

emojiPicker: {
  flexDirection: "row",
  backgroundColor: "#fff",
  borderRadius: 24,
  paddingHorizontal: 8,
  paddingVertical: 6,
  gap: 4,
  elevation: 6,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 6,
  borderWidth: 1,
  borderColor: "#e8e0f0",
  marginTop: 4,
  alignSelf: "flex-start",
},

emojiBtn: {
  padding: 4,
},

emojiBtnText: {
  fontSize: 22,
},

// Reaction viewer modal
rxOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.45)",
  justifyContent: "flex-end",
},
rxSheet: {
  backgroundColor: "#fff",
  borderTopLeftRadius: 18,
  borderTopRightRadius: 18,
  maxHeight: "60%",
  paddingBottom: 24,
},
rxHeader: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 18,
  paddingVertical: 14,
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: "#e0e0e0",
},
rxHeaderTitle: {
  fontSize: 16,
  fontWeight: "700",
  color: "#222",
},
rxTabs: {
  flexDirection: "row",
  paddingHorizontal: 14,
  paddingVertical: 8,
  gap: 8,
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: "#e0e0e0",
},
rxTab: {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 20,
  backgroundColor: "#f3f3f3",
},
rxTabActive: {
  backgroundColor: "#4B1D6B",
},
rxTabText: {
  fontSize: 14,
  color: "#555",
  fontWeight: "600",
},
rxTabTextActive: {
  color: "#fff",
},
rxList: {
  paddingHorizontal: 18,
  paddingTop: 6,
},
rxRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 10,
  gap: 12,
},
rxAvatar: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: "#4B1D6B",
  alignItems: "center",
  justifyContent: "center",
},
rxAvatarText: {
  color: "#fff",
  fontWeight: "700",
  fontSize: 16,
},
rxName: {
  flex: 1,
  fontSize: 15,
  color: "#222",
},
rxRowEmoji: {
  fontSize: 20,
},
rxAnon: {
  alignItems: "center",
  paddingVertical: 32,
  gap: 10,
},
rxAnonText: {
  color: "#999",
  fontSize: 14,
  textAlign: "center",
  paddingHorizontal: 24,
},
rxAnonCount: {
  fontSize: 18,
  color: "#555",
},
// Reply quote shown inside a message bubble
replyQuote: {
  backgroundColor: "rgba(0,0,0,0.12)",
  borderLeftWidth: 3,
  borderLeftColor: "#da9306",
  borderRadius: 6,
  paddingHorizontal: 8,
  paddingVertical: 4,
  marginBottom: 6,
},
replyQuoteMine: {
  backgroundColor: "rgba(255,255,255,0.18)",
},
replyQuoteSender: {
  color: "#da9306",
  fontSize: 11,
  fontWeight: "700",
  marginBottom: 1,
},
replyQuoteText: {
  color: "#e0d6f0",
  fontSize: 12,
},
// Reply preview bar above the composer
replyBar: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#f3f0f8",
  borderTopWidth: 1,
  borderTopColor: "#ddd",
  paddingHorizontal: 12,
  paddingVertical: 8,
  gap: 8,
},
replyBarContent: {
  flex: 1,
},
replyBarSender: {
  color: "#4B1D6B",
  fontWeight: "700",
  fontSize: 12,
},
replyBarText: {
  color: "#555",
  fontSize: 12,
},
replyBarClose: {
  padding: 4,
},
// Message action bottom sheet
actionSheet: {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: "#fff",
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  paddingBottom: 30,
  paddingTop: 12,
  elevation: 20,
  shadowColor: "#000",
  shadowOpacity: 0.2,
  shadowRadius: 12,
},
actionSheetOverlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.4)",
},
actionSheetHandle: {
  width: 36,
  height: 4,
  backgroundColor: "#ddd",
  borderRadius: 2,
  alignSelf: "center",
  marginBottom: 16,
},
actionSheetItem: {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 20,
  paddingVertical: 14,
  gap: 14,
},
actionSheetItemText: {
  fontSize: 16,
  color: "#111",
},
actionSheetItemDanger: {
  color: "#e53935",
},
// Direct chat header strip
directHeader: {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 12,
  paddingVertical: 8,
  backgroundColor: "#f3f0f8",
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: "#d1c4e9",
  gap: 8,
},
directHeaderLeft: {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
},
directHeaderAvatar: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: "#da9306",
  alignItems: "center",
  justifyContent: "center",
},
directHeaderAvatarText: {
  color: "#fff",
  fontWeight: "800",
  fontSize: 16,
},
directHeaderName: {
  color: "#2b0540",
  fontWeight: "700",
  fontSize: 15,
},
directHeaderNickname: {
  color: "#7a5c9a",
  fontSize: 12,
},
directHeaderIcons: {
  flexDirection: "row",
  alignItems: "center",
  gap: 2,
},
directHeaderIconBtn: {
  padding: 8,
},
});