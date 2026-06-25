import React, { useEffect, useMemo, useState } from "react";
import { logger } from "../utils/logger";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import {
  ApprovalRole,
  getAllMembers as getAdminMembers,
  updateMemberRole,
  deactivateMember,
  activateMember,
} from "../services/adminService";
import { getAllMembers } from "../services/memberService";


type Member = {
  id?: number;
  userId?: number;
  fullName?: string;
  email?: string;
  role?: string;
  status?: string;
  nickname?: string;
  phone?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  playerType?: string;
  jerseyNumber?: number;
};

const ROLE_OPTIONS: ApprovalRole[] = ["PLAYER", "CAPTAIN", "ADMIN"];
type SortType = "NAME" | "ROLE";

type Props = {
  navigation: any;
};

const MembersScreen = ({ navigation }: Props) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortType>("NAME");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const loadMembers = async () => {
  try {
    const data =
      user?.role === "ADMIN" ? await getAdminMembers() : await getAllMembers();
    setMembers(Array.isArray(data) ? data : []);
  } catch (error: any) {
    logger.log("LOAD MEMBERS FULL ERROR:", error);
    logger.log("LOAD MEMBERS STATUS:", error?.response?.status);
    logger.log("LOAD MEMBERS DATA:", error?.response?.data);

    Alert.alert(
      "Error",
      error?.response?.data?.message || "Failed to load members"
    );
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  useEffect(() => {
    void loadMembers();
  }, []);



  const onRefresh = async () => {
    setRefreshing(true);
    await loadMembers();
  };

  const filteredMembers = useMemo(() => {
    const result = members.filter((member) =>
        (member.fullName || "")
        .toLowerCase()
        .includes(search.trim().toLowerCase())
      );

    return [...result].sort((a, b) => {
      if (sortBy === "ROLE") {
        const roleOrder: Record<string, number> = {
          ADMIN: 0,
          CAPTAIN: 1,
          PLAYER: 2,
        };
        const roleDifference =
          (roleOrder[a.role || ""] ?? 3) - (roleOrder[b.role || ""] ?? 3);

        if (roleDifference !== 0) {
          return roleDifference;
        }
      }

      return (
        (a.fullName || "").localeCompare(b.fullName || "")
      );
    });
  }, [members, search, sortBy]);

  const handleRoleChange = async (
    memberId: number,
    role: ApprovalRole
  ) => {
    setSelectedMember(null);

    try {
      const response = await updateMemberRole(memberId, role);
      Alert.alert(
        "Success",
        typeof response === "string" ? response : `Role updated to ${role}`
      );
      await loadMembers();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to update role"
      );
    }
  };



  const handleDeactivateMember = (memberId: number, fullName: string) => {
  setSelectedMember(null);

  Alert.alert(
    "Deactivate Member",
    `Are you sure you want to deactivate ${fullName}?`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Deactivate",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await deactivateMember(memberId);
            Alert.alert(
              "Success",
              typeof response === "string"
                ? response
                : "Member deactivated successfully"
            );
            loadMembers();
          } catch (error: any) {
            Alert.alert(
              "Error",
              error?.response?.data?.message || "Failed to deactivate member"
            );
          }
        },
      },
    ]
  );
};

const handleActivateMember = (memberId: number, fullName: string) => {
  setSelectedMember(null);

  Alert.alert(
    "Activate Member",
    `Activate ${fullName}?`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Activate",
        onPress: async () => {
          try {
            const response = await activateMember(memberId);
            Alert.alert(
              "Success",
              typeof response === "string"
                ? response
                : "Member activated successfully"
            );
            loadMembers();
          } catch (error: any) {
            Alert.alert(
              "Error",
              error?.response?.data?.message || "Failed to activate member"
            );
          }
        },
      },
    ]
  );
};

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "👑";
      case "CAPTAIN":
        return "🧢";
      case "PLAYER":
        return "🏏";
      default:
        return "👤";
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "Admin";
      case "CAPTAIN":
        return "Captain";
      case "PLAYER":
        return "Player";
      default:
        return "Member";
    }
  };

  const getRoleStyle = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return {
          card: styles.adminCard,
          icon: styles.adminRoleIcon,
        };
      case "CAPTAIN":
        return {
          card: styles.captainCard,
          icon: styles.captainRoleIcon,
        };
      default:
        return {
          card: styles.playerCard,
          icon: styles.playerRoleIcon,
        };
    }
  };

  const renderItem = ({ item }: { item: Member }) => {
    const memberId = item.userId ?? item.id ?? 0;
    const roleStyle = getRoleStyle(item.role);

    return (
      <TouchableOpacity
        style={[styles.card, roleStyle.card]}
        activeOpacity={0.7}
        delayLongPress={350}
        onPress={() => {
          if (memberId) {
            navigation.navigate("MemberProfile", { userId: memberId });
          }
        }}
        onLongPress={() => {
          if (user?.role === "ADMIN" && memberId) {
            setSelectedMember(item);
          }
        }}
      >
        <Text style={styles.name}>{item.fullName || "No Name"}</Text>
        <View
          style={[styles.roleIcon, roleStyle.icon]}
          accessibilityLabel={`${item.role || "Member"} role`}
        >
          <Text style={styles.roleIconText}>
            {getRoleIcon(item.role)}
          </Text>
          <Text style={styles.roleLabel}>{getRoleLabel(item.role)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const selectedMemberId =
    selectedMember?.userId ?? selectedMember?.id ?? 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading members...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1 }}>
      <FlatList
        data={filteredMembers}
        keyExtractor={(item, index) => String(item.userId ?? item.id ?? index)}
        renderItem={renderItem}
        style={styles.screen}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.hero}>
              <View>
                <Text style={styles.heroEyebrow}>GOTHAM CRICKET CLUB</Text>
                <Text style={styles.heroTitle}>Club Members</Text>
                <Text style={styles.heroSubtitle}>
                  {filteredMembers.length}{" "}
                  {filteredMembers.length === 1 ? "member" : "members"}
                </Text>
              </View>

              <View style={styles.heroIcon}>
                <Ionicons name="people" size={28} color="#2b0540" />
              </View>
            </View>

            <View style={styles.searchWrap}>
              <Ionicons name="search" size={20} color="#7c6f82" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search player name"
                placeholderTextColor="#918799"
                value={search}
                onChangeText={setSearch}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={20} color="#918799" />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.sortSection}>
              <View style={styles.sortHeading}>
                <Ionicons name="swap-vertical" size={17} color="#2b0540" />
                <Text style={styles.sortLabel}>Sort members</Text>
              </View>

              <View style={styles.sortControl}>
                {(["NAME", "ROLE"] as SortType[]).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.sortButton,
                      sortBy === option && styles.sortButtonSelected,
                    ]}
                    onPress={() => setSortBy(option)}
                  >
                    <Ionicons
                      name={option === "NAME" ? "text" : "ribbon-outline"}
                      size={15}
                      color={sortBy === option ? "#fff" : "#5b4268"}
                    />
                    <Text
                      style={[
                        styles.sortButtonText,
                        sortBy === option && styles.sortButtonTextSelected,
                      ]}
                    >
                      {option === "NAME" ? "Name" : "Role"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text style={styles.longPressHint}>
              {user?.role === "ADMIN"
                ? "Tap to view profile • Press and hold to manage"
                : "Tap a member to view their profile"}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={42} color="#b7aabc" />
            <Text style={styles.emptyTitle}>No members found</Text>
            <Text style={styles.emptyText}>
              Try a different player name.
            </Text>
          </View>
        }
      />

      <Modal
        visible={selectedMember !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMember(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedMember(null)}
        >
          <Pressable style={styles.actionSheet}>
            <Text style={styles.actionTitle}>
              {selectedMember?.fullName || "Manage member"}
            </Text>
            <Text style={styles.actionSubtitle}>Change role</Text>

            <View style={styles.actionRoleRow}>
              {ROLE_OPTIONS.map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.actionRoleButton,
                    selectedMember?.role === role &&
                      styles.actionRoleButtonSelected,
                  ]}
                  onPress={() =>
                    selectedMemberId &&
                    void handleRoleChange(selectedMemberId, role)
                  }
                >
                  <Text
                    style={[
                      styles.actionRoleText,
                      selectedMember?.role === role &&
                        styles.actionRoleTextSelected,
                    ]}
                  >
                    {role}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedMember?.status === "INACTIVE" ? (
              <TouchableOpacity
                style={styles.activateAction}
                onPress={() =>
                  selectedMemberId &&
                  handleActivateMember(
                    selectedMemberId,
                    selectedMember?.fullName || "this member"
                  )
                }
              >
                <Text style={styles.activateActionText}>Activate member</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.deactivateAction}
                onPress={() =>
                  selectedMemberId &&
                  handleDeactivateMember(
                    selectedMemberId,
                    selectedMember?.fullName || "this member"
                  )
                }
              >
                <Text style={styles.deactivateActionText}>
                  Deactivate member
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.cancelAction}
              onPress={() => setSelectedMember(null)}
            >
              <Text style={styles.cancelActionText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default MembersScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f5f0f7",
  },
  container: {
    padding: 16,
    paddingBottom: 30,
    flexGrow: 1,
  },
  header: {
    marginBottom: 8,
  },
  hero: {
    backgroundColor: "#2b0540",
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#2b0540",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 7,
  },
  heroEyebrow: {
    color: "#da9306",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 27,
    fontWeight: "900",
    marginTop: 4,
  },
  heroSubtitle: {
    color: "#ddd6e8",
    fontSize: 14,
    marginTop: 4,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f4b400",
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e8dfea",
  },
  searchInput: {
    flex: 1,
    color: "#1f1524",
    fontSize: 15,
    paddingVertical: 14,
  },
  sortSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e8dfea",
  },
  sortHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 9,
  },
  sortLabel: {
    color: "#2b0540",
    fontSize: 13,
    fontWeight: "800",
  },
  sortControl: {
    flexDirection: "row",
    backgroundColor: "#f4eef6",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  sortButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
  },
  sortButtonSelected: {
    backgroundColor: "#2b0540",
  },
  sortButtonText: {
    color: "#5b4268",
    fontSize: 13,
    fontWeight: "700",
  },
  sortButtonTextSelected: {
    color: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderLeftWidth: 5,
    shadowColor: "#2b0540",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 7,
    elevation: 2,
  },
  adminCard: {
    borderLeftColor: "#da9306",
  },
  captainCard: {
    borderLeftColor: "#6d28d9",
  },
  playerCard: {
    borderLeftColor: "#16a34a",
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 12,
  },
  roleIcon: {
    minWidth: 92,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 12,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  adminRoleIcon: {
    backgroundColor: "#fef3c7",
  },
  captainRoleIcon: {
    backgroundColor: "#ede9fe",
  },
  playerRoleIcon: {
    backgroundColor: "#dcfce7",
  },
  roleIconText: {
    fontSize: 17,
  },
  roleLabel: {
    color: "#2b2430",
    fontSize: 12,
    fontWeight: "800",
  },
  longPressHint: {
    color: "#75677c",
    fontSize: 12,
    textAlign: "center",
    marginTop: 11,
    marginBottom: 10,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 55,
  },
  emptyTitle: {
    color: "#2b0540",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 10,
  },
  emptyText: {
    color: "#7c6f82",
    fontSize: 13,
    marginTop: 4,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  actionSheet: {
    backgroundColor: "#fff",
    padding: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  actionTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "800",
  },
  actionSubtitle: {
    color: "#6b7280",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  actionRoleRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionRoleButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
  },
  actionRoleButtonSelected: {
    backgroundColor: "#2b0540",
    borderColor: "#2b0540",
  },
  actionRoleText: {
    color: "#374151",
    fontSize: 12,
    fontWeight: "700",
  },
  actionRoleTextSelected: {
    color: "#fff",
  },
  deactivateAction: {
    alignItems: "center",
    backgroundColor: "#fee2e2",
    paddingVertical: 13,
    borderRadius: 10,
    marginTop: 16,
  },
  deactivateActionText: {
    color: "#b91c1c",
    fontWeight: "800",
  },
  activateAction: {
    alignItems: "center",
    backgroundColor: "#dcfce7",
    paddingVertical: 13,
    borderRadius: 10,
    marginTop: 16,
  },
  activateActionText: {
    color: "#15803d",
    fontWeight: "800",
  },
  cancelAction: {
    alignItems: "center",
    paddingVertical: 13,
    marginTop: 6,
  },
  cancelActionText: {
    color: "#4b5563",
    fontWeight: "700",
  },
});
