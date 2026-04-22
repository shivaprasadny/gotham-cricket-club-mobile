import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import {
  ApprovalRole,

  updateMemberRole,
} from "../services/adminService";
import { deactivateMember,activateMember } from "../services/adminService";
import { getAllMembers } from "../services/memberService";

type Member = {
  id?: number;
  userId?: number;
  fullName?: string;
  email?: string;
  role?: string;
  status?: string;
};

type RoleFilter = "ALL" | "PLAYER" | "CAPTAIN" | "ADMIN";
type SortType = "NAME" | "ROLE";

const ROLE_OPTIONS: ApprovalRole[] = ["PLAYER", "CAPTAIN", "ADMIN"];

const MembersScreen = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortType>("NAME");

  const loadMembers = async () => {
  try {
    const data = await getAllMembers();
    console.log("MEMBERS DATA:", data);
    setMembers(Array.isArray(data) ? data : []);
  } catch (error: any) {
    console.log("LOAD MEMBERS FULL ERROR:", error);
    console.log("LOAD MEMBERS STATUS:", error?.response?.status);
    console.log("LOAD MEMBERS DATA:", error?.response?.data);

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
    let result = members.filter((member) => {
      const matchesSearch = (member.fullName || "")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesRole =
        roleFilter === "ALL" ? true : member.role === roleFilter;

      return matchesSearch && matchesRole;
    });

    if (sortBy === "NAME") {
      result = [...result].sort((a, b) =>
        (a.fullName || "").localeCompare(b.fullName || "")
      );
    } else {
      result = [...result].sort((a, b) =>
        (a.role || "").localeCompare(b.role || "")
      );
    }

    return result;
  }, [members, search, roleFilter, sortBy]);

  const handleRoleChange = async (
    memberId: number,
    role: ApprovalRole
  ) => {
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

  const getRoleChipStyle = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return styles.adminChip;
      case "CAPTAIN":
        return styles.captainChip;
      case "PLAYER":
        return styles.playerChip;
      default:
        return styles.defaultChip;
    }
  };

  const renderItem = ({ item }: { item: Member }) => {
    const memberId = item.userId ?? item.id ?? 0;

    return (
      <View style={styles.card}>
        <View style={styles.rowTop}>
  <View style={{ flex: 1 }}>
    <Text
      style={[
        styles.name,
        { color: item.status === "INACTIVE" ? "#9ca3af" : "#111" },
      ]}
    >
      {item.fullName || "No Name"}
    </Text>

    {item.status === "INACTIVE" && (
      <Text style={styles.inactiveText}>INACTIVE 🚫</Text>
    )}
  </View>

  <Text style={[styles.roleChip, getRoleChipStyle(item.role)]}>
    {item.role === "ADMIN"
      ? "ADMIN 👑"
      : item.role === "CAPTAIN"
      ? "CAPTAIN 🧢"
      : "PLAYER 🏏"}
  </Text>
</View>

        <Text>{item.email || "No Email"}</Text>
        <Text>Status: {item.status || "N/A"}</Text>

       {user?.role === "ADMIN" && (
  <>
    <Text style={styles.roleLabel}>Change Role:</Text>

    <View style={styles.roleRow}>
      {ROLE_OPTIONS.map((role) => (
        <TouchableOpacity
          key={role}
          style={styles.roleButton}
          onPress={() => handleRoleChange(memberId, role)}
        >
          <Text style={styles.roleButtonText}>{role}</Text>
        </TouchableOpacity>
      ))}
    </View>

    {/* Deactivate button */}
    {item.status === "APPROVED" && (
      <TouchableOpacity
        style={styles.deactivateBtn}
        onPress={() =>
          handleDeactivateMember(memberId, item.fullName || "this member")
        }
      >
        <Text style={styles.deactivateBtnText}>Deactivate</Text>
      </TouchableOpacity>
    )}

    {/* Activate button */}
    {item.status === "INACTIVE" && (
      <TouchableOpacity
        style={styles.activateBtn}
        onPress={() =>
          handleActivateMember(memberId, item.fullName || "this member")
        }
      >
        <Text style={styles.activateBtnText}>Activate</Text>
      </TouchableOpacity>
    )}
  </>
)}
      </View>
      
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading members...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredMembers}
      keyExtractor={(item, index) => String(item.userId ?? item.id ?? index)}
      renderItem={renderItem}
      contentContainerStyle={
        filteredMembers.length === 0 ? styles.center : styles.container
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by player name"
            value={search}
            onChangeText={setSearch}
          />

          <Text style={styles.headerTitle}>Filter by Role</Text>
          <View style={styles.filterRow}>
            {(["ALL", "PLAYER", "CAPTAIN", "ADMIN"] as RoleFilter[]).map(
              (item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.filterBtn,
                    roleFilter === item && styles.filterBtnSelected,
                  ]}
                  onPress={() => setRoleFilter(item)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      roleFilter === item && styles.filterTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          <Text style={styles.headerTitle}>Sort By</Text>
          <View style={styles.filterRow}>
            {(["NAME", "ROLE"] as SortType[]).map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.filterBtn,
                  sortBy === item && styles.filterBtnSelected,
                ]}
                onPress={() => setSortBy(item)}
              >
                <Text
                  style={[
                    styles.filterText,
                    sortBy === item && styles.filterTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      }
      ListEmptyComponent={<Text>No members found</Text>}
    />
  );
};

export default MembersScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 4,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
  },
  filterBtnSelected: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
  },
  filterTextSelected: {
    color: "#fff",
  },
  card: {
    backgroundColor: "#f7f7f7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
    color: "#fff",
  },
  roleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "700",
  },
  adminChip: {
    backgroundColor: "#111",
    color: "#fff",
  },
  captainChip: {
    backgroundColor: "#1d4ed8",
    color: "#fff",
  },
  playerChip: {
    backgroundColor: "#16a34a",
    color: "#fff",
  },
  defaultChip: {
    backgroundColor: "#ccc",
    color: "#111",
  },
  roleLabel: {
    marginTop: 12,
    marginBottom: 8,
    fontWeight: "600",
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#111",
  },
  roleButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  deactivateBtn: {
  marginTop: 12,
  backgroundColor: "#c0392b",
  paddingVertical: 10,
  borderRadius: 8,
},
deactivateBtnText: {
  color: "#fff",
  textAlign: "center",
  fontWeight: "700",
},
activateBtn: {
  marginTop: 10,
  backgroundColor: "#27ae60",
  paddingVertical: 10,
  borderRadius: 8,
},
activateBtnText: {
  color: "#fff",
  textAlign: "center",
  fontWeight: "700",
},
inactiveText: {
  color: "#030914",
  fontSize: 12,
  marginTop: 4,
  fontWeight: "600",
},
  
});