import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import {
  ApprovalRole,
  getAllMembers,
  updateMemberRole,
} from "../services/adminService";
import { addNotification } from "../services/notificationService";

type Member = {
  id?: number;
  userId?: number;
  fullName?: string;
  email?: string;
  role?: string;
  status?: string;
};

const ROLE_OPTIONS: ApprovalRole[] = ["PLAYER", "CAPTAIN", "ADMIN"];

const MembersScreen = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMembers = async () => {
    try {
      const data = await getAllMembers();
      setMembers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.log("MEMBERS ERROR:", error?.response?.data || error?.message);
      setMembers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMembers();
  };

  const handleRoleChange = async (
    memberId: number,
    role: ApprovalRole,
    memberName: string
  ) => {
    try {
      const response = await updateMemberRole(memberId, role);

      await addNotification({
        title: "Role Updated",
        message: `${memberName}'s role was changed to ${role}.`,
      });

      Alert.alert(
        "Success",
        typeof response === "string" ? response : `Role updated to ${role}`
      );
      loadMembers();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to update role"
      );
    }
  };

  const renderItem = ({ item }: { item: Member }) => {
    const memberId = item.userId ?? item.id ?? 0;
    const memberName = item.fullName || "Unknown User";

    return (
      <View style={styles.card}>
        <Text style={styles.name}>{memberName}</Text>
        <Text>{item.email || "No Email"}</Text>
        <Text>Role: {item.role || "N/A"}</Text>
        <Text>Status: {item.status || "N/A"}</Text>

        {user?.role === "ADMIN" && (
          <>
            <Text style={styles.roleLabel}>Change Role:</Text>
            <View style={styles.roleRow}>
              {ROLE_OPTIONS.map((role) => (
                <TouchableOpacity
                  key={role}
                  style={styles.roleButton}
                  onPress={() => handleRoleChange(memberId, role, memberName)}
                >
                  <Text style={styles.roleButtonText}>{role}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
      data={members}
      keyExtractor={(item, index) => String(item.userId ?? item.id ?? index)}
      renderItem={renderItem}
      contentContainerStyle={
        members.length === 0 ? styles.center : styles.container
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
  card: {
    backgroundColor: "#f7f7f7",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
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
});