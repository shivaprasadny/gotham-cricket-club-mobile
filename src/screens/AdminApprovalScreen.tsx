import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  approveMember,
  getPendingMembers,
  rejectMember,
  ApprovalRole,
} from "../services/adminService";


type PendingUser = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  status: string;
};

const ROLE_OPTIONS: ApprovalRole[] = ["PLAYER", "CAPTAIN", "ADMIN"];

const AdminApprovalScreen = () => {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<Record<number, ApprovalRole>>(
    {}
  );

  const loadUsers = async () => {
    try {
      const data = await getPendingMembers();
      setUsers(data || []);

      const defaultRoles: Record<number, ApprovalRole> = {};
      (data || []).forEach((user: PendingUser) => {
        defaultRoles[user.id] = "PLAYER";
      });
      setSelectedRoles(defaultRoles);
    } catch (error: any) {
      console.log("PENDING USERS ERROR:", error?.response?.data || error?.message);
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to load pending users"
      );
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
  };

  const handleRoleSelect = (userId: number, role: ApprovalRole) => {
    setSelectedRoles((prev) => ({
      ...prev,
      [userId]: role,
    }));
  };

  const handleApprove = async (userId: number) => {
  try {
    const selectedRole = selectedRoles[userId] || "PLAYER";

    const approvedUser = users.find((user) => user.id === userId);

    const response = await approveMember(userId, selectedRole);

  

    Alert.alert(
      "Success",
      typeof response === "string"
        ? response
        : `User approved as ${selectedRole}`
    );

    loadUsers();
  } catch (error: any) {
    console.log("APPROVE ERROR:", error?.response?.data || error?.message);
    Alert.alert(
      "Error",
      error?.response?.data?.message || "Failed to approve user"
    );
  }
};

  const handleReject = async (userId: number) => {
    try {
      const response = await rejectMember(userId);

      Alert.alert(
        "Success",
        typeof response === "string" ? response : "User rejected"
      );

      loadUsers();
    } catch (error: any) {
      console.log("REJECT ERROR:", error?.response?.data || error?.message);
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to reject user"
      );
    }
  };

  const renderRoleOptions = (userId: number) => {
    return (
      <View style={styles.roleRow}>
        {ROLE_OPTIONS.map((role) => {
          const isSelected = selectedRoles[userId] === role;

          return (
            <TouchableOpacity
              key={role}
              style={[
                styles.roleButton,
                isSelected && styles.roleButtonSelected,
              ]}
              onPress={() => handleRoleSelect(userId, role)}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  isSelected && styles.roleButtonTextSelected,
                ]}
              >
                {role}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderItem = ({ item }: { item: PendingUser }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.fullName}</Text>
      <Text style={styles.email}>{item.email}</Text>
      <Text style={styles.status}>Status: {item.status}</Text>

      <Text style={styles.roleLabel}>Approve as:</Text>
      {renderRoleOptions(item.id)}

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApprove(item.id)}
        >
          <Text style={styles.actionButtonText}>Approve</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReject(item.id)}
        >
          <Text style={styles.actionButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={users.length === 0 ? styles.emptyContainer : styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={<Text style={styles.emptyText}>No pending users</Text>}
    />
  );
};

export default AdminApprovalScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  card: {
    backgroundColor: "#f7f7f7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#444",
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    marginBottom: 12,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 8,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  roleButtonSelected: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  roleButtonText: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
  },
  roleButtonTextSelected: {
    color: "#fff",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: "#111",
  },
  rejectButton: {
    backgroundColor: "#c0392b",
  },
  actionButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
});