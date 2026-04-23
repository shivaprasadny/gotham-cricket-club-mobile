import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { deleteFeeById, getAllFees } from "../services/feeService";

type Props = {
  navigation: any;
};

type FeeItem = {
  id: number;
  title: string;
  feeType: string;
  amount: number;
  dueDate: string;
  description?: string;
  matchId?: number | null;
  eventId?: number | null;
  teamId?: number | null;
  season?: string | null;
  assignmentType: string;
  createdBy?: string;
  createdAt?: string;
  active: boolean;
};

type SortType = "DUE_DATE" | "AMOUNT" | "CREATED";

type FeeTypeFilter =
  | "ALL"
  | "MATCH_FEE"
  | "EVENT_FEE"
  | "NET_PRACTICE_FEE"
  | "ANNUAL_MEMBERSHIP_FEE"
  | "OTHER";

const PAGE_SIZE = 12;

const FeeListScreen = ({ navigation }: Props) => {
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Visible rows count for premium "load more on scroll" behavior
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Filter + sort state
  const [feeTypeFilter, setFeeTypeFilter] = useState<FeeTypeFilter>("ALL");
  const [sortType, setSortType] = useState<SortType>("DUE_DATE");

  const { user } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "CAPTAIN";

  // Load all fee definitions
  const loadFees = async () => {
    try {
      const data = await getAllFees();
      setFees(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.log("FEE LIST LOAD ERROR:", error?.response?.data || error);
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to load fees"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      void loadFees();
    }, [])
  );

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    setVisibleCount(PAGE_SIZE);
    await loadFees();
  };

  // Safe date formatter
  const formatDate = (date?: string) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleString();
    } catch {
      return date;
    }
  };

  // Human readable fee type
  const formatFeeType = (feeType?: string) => {
    switch (feeType) {
      case "MATCH_FEE":
        return "Match Fee";
      case "EVENT_FEE":
        return "Event Fee";
      case "NET_PRACTICE_FEE":
        return "Net Practice Fee";
      case "ANNUAL_MEMBERSHIP_FEE":
        return "Annual Membership Fee";
      case "OTHER":
        return "Other";
      default:
        return feeType || "N/A";
    }
  };

  // Human readable assignment type
  const formatAssignmentType = (assignmentType?: string) => {
    switch (assignmentType) {
      case "ALL_MEMBERS":
        return "All Members";
      case "SELECTED_USERS":
        return "Selected Users";
      case "SQUAD_PLAYERS":
        return "Squad Players";
      case "TEAM_MEMBERS":
        return "Team Members";
      case "GOING_USERS":
        return "Going Users";
      default:
        return assignmentType || "N/A";
    }
  };

  // Cycle sort in a simple premium way
  const changeSort = (value: SortType) => {
    setSortType(value);
    setVisibleCount(PAGE_SIZE);
  };

  // Filter + sort the fee list
  const processedFees = useMemo(() => {
    let result = [...fees];

    // Filter by fee type
    if (feeTypeFilter !== "ALL") {
      result = result.filter((item) => item.feeType === feeTypeFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortType === "DUE_DATE") {
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        return aDate - bDate; // nearest due first
      }

      if (sortType === "AMOUNT") {
        return b.amount - a.amount; // highest amount first
      }

      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bCreated - aCreated; // newest first
    });

    return result;
  }, [fees, feeTypeFilter, sortType]);

  // Only show a limited number first
  const visibleFees = useMemo(() => {
    return processedFees.slice(0, visibleCount);
  }, [processedFees, visibleCount]);

  // Load more rows when user scrolls near bottom
  const loadMore = () => {
    if (visibleCount < processedFees.length) {
      setVisibleCount((prev) => prev + PAGE_SIZE);
    }
  };

  // Delete a fee definition
  const handleDelete = (feeId: number) => {
    Alert.alert("Delete Fee", "Are you sure you want to delete this fee?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await deleteFeeById(feeId);

            Alert.alert(
              "Success",
              typeof response === "string"
                ? response
                : "Fee deleted successfully"
            );

            await loadFees();
          } catch (error: any) {
            Alert.alert(
              "Error",
              error?.response?.data?.message || "Failed to delete fee"
            );
          }
        },
      },
    ]);
  };

  // Render one fee definition card
  const renderItem = ({ item }: { item: FeeItem }) => (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate("FeeDetails", { feeId: item.id })}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle}>{item.title}</Text>

            <Text style={styles.cardSubText}>
              {formatFeeType(item.feeType)} • {formatAssignmentType(item.assignmentType)}
            </Text>
          </View>

          <Text style={styles.amountText}>${item.amount?.toFixed(2)}</Text>
        </View>

        <Text style={styles.cardText}>Due: {formatDate(item.dueDate)}</Text>

        {item.description ? (
          <Text style={styles.cardText}>Description: {item.description}</Text>
        ) : null}

        {item.season ? (
          <Text style={styles.cardText}>Season: {item.season}</Text>
        ) : null}

        {item.createdBy ? (
          <Text style={styles.cardText}>Created By: {item.createdBy}</Text>
        ) : null}

        <View style={styles.footerRow}>
          <Text style={styles.viewText}>Tap to view assigned users</Text>
        </View>
      </TouchableOpacity>

      {canManage && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => navigation.navigate("EditFee", { feeId: item.id })}
          >
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDelete(item.id)}
          >
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Loading UI
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#da9306" />
        <Text style={styles.loadingText}>Loading fees...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={visibleFees}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListHeaderComponent={
        <View>
          {/* Main create action */}
          {canManage && (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => navigation.navigate("CreateFee")}
              >
                <Text style={styles.createBtnText}>Create Fee</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Fee Type filter */}
          <Text style={styles.sectionLabel}>Fee Type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {[
              { label: "All", value: "ALL" },
              { label: "Match", value: "MATCH_FEE" },
              { label: "Event", value: "EVENT_FEE" },
              { label: "Net", value: "NET_PRACTICE_FEE" },
              { label: "Annual", value: "ANNUAL_MEMBERSHIP_FEE" },
              { label: "Other", value: "OTHER" },
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.chipBtn,
                  feeTypeFilter === item.value && styles.chipBtnSelected,
                ]}
                onPress={() => {
                  setFeeTypeFilter(item.value as FeeTypeFilter);
                  setVisibleCount(PAGE_SIZE);
                }}
              >
                <Text
                  style={[
                    styles.chipBtnText,
                    feeTypeFilter === item.value && styles.chipBtnTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sort options */}
          <Text style={styles.sectionLabel}>Sort By</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {[
              { label: "Due Date", value: "DUE_DATE" },
              { label: "Amount", value: "AMOUNT" },
              { label: "Created", value: "CREATED" },
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.chipBtn,
                  sortType === item.value && styles.chipBtnSelected,
                ]}
                onPress={() => changeSort(item.value as SortType)}
              >
                <Text
                  style={[
                    styles.chipBtnText,
                    sortType === item.value && styles.chipBtnTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Small info row */}
          <Text style={styles.resultText}>
            Showing {visibleFees.length} of {processedFees.length} fees
          </Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>No fees created yet.</Text>
      }
      ListFooterComponent={
        visibleCount < processedFees.length ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color="#da9306" />
            <Text style={styles.footerLoaderText}>Loading more fees...</Text>
          </View>
        ) : processedFees.length > PAGE_SIZE ? (
          <Text style={styles.endText}>All fees loaded</Text>
        ) : null
      }
    />
  );
};

export default FeeListScreen;

const styles = StyleSheet.create({
  list: {
    padding: 16,
    paddingBottom: 30,
    backgroundColor: "#f8f5fb",
    flexGrow: 1,
  },
  center: {
    flex: 1,
    backgroundColor: "#f8f5fb",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#2b0540",
    fontWeight: "700",
  },

  headerActions: {
    marginBottom: 18,
  },
  createBtn: {
    backgroundColor: "#da9306",
    paddingVertical: 14,
    borderRadius: 12,
  },
  createBtnText: {
    color: "#2b0540",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },

  sectionLabel: {
    color: "#2b0540",
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 8,
    marginTop: 2,
  },

  chipRow: {
    paddingBottom: 14,
    gap: 8,
  },
  chipBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d9d2e1",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  chipBtnSelected: {
    backgroundColor: "#2b0540",
    borderColor: "#2b0540",
  },
  chipBtnText: {
    color: "#2b0540",
    fontWeight: "600",
  },
  chipBtnTextSelected: {
    color: "#fff",
  },

  resultText: {
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 12,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  cardSubText: {
    color: "#6b7280",
    marginTop: 3,
    fontWeight: "600",
    fontSize: 13,
  },
  amountText: {
    color: "#da9306",
    fontWeight: "800",
    fontSize: 20,
  },
  cardText: {
    color: "#374151",
    marginBottom: 4,
    fontWeight: "500",
    lineHeight: 18,
  },
  footerRow: {
    marginTop: 10,
  },
  viewText: {
    color: "#2b0540",
    fontWeight: "700",
  },

  emptyText: {
    textAlign: "center",
    marginTop: 30,
    color: "#6b7280",
    fontWeight: "600",
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
  },
  editBtn: {
    backgroundColor: "#111",
  },
  deleteBtn: {
    backgroundColor: "#c0392b",
  },
  actionText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },

  footerLoader: {
    alignItems: "center",
    paddingVertical: 12,
  },
  footerLoaderText: {
    marginTop: 6,
    color: "#6b7280",
    fontWeight: "600",
  },
  endText: {
    textAlign: "center",
    color: "#9ca3af",
    fontWeight: "600",
    paddingVertical: 12,
  },
});