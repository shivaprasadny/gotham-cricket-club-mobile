import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PollOptionResponse, PollResponse } from "../../types/poll";
import { closePoll, deletePoll, votePoll } from "../../services/pollService";

type Props = {
  poll: PollResponse;
  /** Called after any mutation so the parent can refresh */
  onUpdated: (updated: PollResponse) => void;
  onDeleted?: (pollId: number) => void;
  /** Compact mode for Home screen; fuller mode for PollsScreen */
  compact?: boolean;
};

/** Formats a deadline or closed-at date in a short human-readable way */
const formatDeadline = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

/** Progress bar for a single option */
const OptionBar = ({
  option,
  selected,
  showResults,
}: {
  option: PollOptionResponse;
  selected: boolean;
  showResults: boolean;
}) => (
  <View style={barStyles.wrap}>
    <View style={barStyles.labelRow}>
      <Text style={[barStyles.label, selected && barStyles.labelSelected]}>
        {selected ? "✓ " : ""}{option.optionText}
      </Text>
      {showResults && (
        <Text style={barStyles.pct}>{option.percentage.toFixed(0)}%</Text>
      )}
    </View>
    {showResults && (
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${Math.min(option.percentage, 100)}%` as any }]} />
      </View>
    )}
    {showResults && (
      <Text style={barStyles.votes}>
        {option.voteCount} {option.voteCount === 1 ? "vote" : "votes"}
      </Text>
    )}
  </View>
);

const PollCard = ({ poll, onUpdated, onDeleted, compact = false }: Props) => {
  const [selectedIds, setSelectedIds] = useState<number[]>(poll.myVotedOptionIds);
  const [submitting, setSubmitting] = useState(false);

  const isEffectivelyClosed =
    poll.status === "CLOSED" ||
    (poll.deadlineAt != null && new Date(poll.deadlineAt) <= new Date());

  const showResults = poll.hasVoted || isEffectivelyClosed;

  const toggleOption = (optionId: number) => {
    if (!poll.canVote) return;
    if (poll.pollType === "SINGLE_CHOICE") {
      setSelectedIds([optionId]);
    } else {
      setSelectedIds((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      );
    }
  };

  const handleVote = async () => {
    if (selectedIds.length === 0) {
      Alert.alert("Select an option", "Please select at least one option before voting.");
      return;
    }
    try {
      setSubmitting(true);
      const updated = await votePoll(poll.pollId, { optionIds: selectedIds });
      onUpdated(updated);
    } catch (err: any) {
      Alert.alert("Vote failed", err?.response?.data?.message || "Could not submit vote");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    Alert.alert("Close Poll", "This will stop all voting. Continue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Close Poll",
        style: "destructive",
        onPress: async () => {
          try {
            const updated = await closePoll(poll.pollId);
            onUpdated(updated);
          } catch (err: any) {
            Alert.alert("Error", err?.response?.data?.message || "Could not close poll");
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert("Delete Poll", "This will permanently remove the poll. Continue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePoll(poll.pollId);
            onDeleted?.(poll.pollId);
          } catch (err: any) {
            Alert.alert("Error", err?.response?.data?.message || "Could not delete poll");
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.card, isEffectivelyClosed && styles.cardClosed]}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.badge, isEffectivelyClosed ? styles.badgeClosed : styles.badgeActive]}>
            <Text style={styles.badgeText}>{isEffectivelyClosed ? "Closed" : "Active"}</Text>
          </View>
          <Text style={styles.typeLabel}>
            {poll.pollType === "MULTIPLE_CHOICE" ? "Multiple choice" : "Single choice"}
          </Text>
        </View>
        {/* Admin actions */}
        <View style={styles.actions}>
          {poll.canClose && !isEffectivelyClosed && (
            <TouchableOpacity onPress={handleClose} style={styles.actionBtn}>
              <Ionicons name="lock-closed-outline" size={18} color="#9b8ca1" />
            </TouchableOpacity>
          )}
          {poll.canDelete && (
            <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Question */}
      <Text style={styles.question}>{poll.question}</Text>

      {/* Deadline */}
      {poll.deadlineAt && !isEffectivelyClosed && (
        <View style={styles.deadlineRow}>
          <Ionicons name="time-outline" size={13} color="#da9306" />
          <Text style={styles.deadline}> Closes {formatDeadline(poll.deadlineAt)}</Text>
        </View>
      )}

      {/* Options */}
      <View style={styles.options}>
        {poll.options.map((opt) => {
          const isSelected = selectedIds.includes(opt.optionId);
          return (
            <TouchableOpacity
              key={opt.optionId}
              activeOpacity={poll.canVote ? 0.7 : 1}
              onPress={() => toggleOption(opt.optionId)}
            >
              <OptionBar option={opt} selected={isSelected} showResults={showResults} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Vote count */}
      {showResults && (
        <Text style={styles.totalVoters}>
          {poll.totalVoters} {poll.totalVoters === 1 ? "voter" : "voters"} total
        </Text>
      )}

      {/* Vote / Change vote button */}
      {poll.canVote && !compact && (
        <TouchableOpacity
          style={[styles.voteBtn, submitting && styles.voteBtnDisabled]}
          onPress={handleVote}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.voteBtnText}>
              {poll.hasVoted ? "Change Vote" : "Submit Vote"}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* Compact quick-vote row (Home screen) */}
      {poll.canVote && compact && (
        <View style={styles.compactRow}>
          {poll.options.map((opt) => (
            <TouchableOpacity
              key={opt.optionId}
              style={[
                styles.compactOpt,
                selectedIds.includes(opt.optionId) && styles.compactOptSelected,
              ]}
              onPress={() => toggleOption(opt.optionId)}
            >
              <Text
                style={[
                  styles.compactOptText,
                  selectedIds.includes(opt.optionId) && styles.compactOptTextSelected,
                ]}
                numberOfLines={1}
              >
                {opt.optionText}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.compactVoteBtn, submitting && styles.voteBtnDisabled]}
            onPress={handleVote}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default PollCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#da9306",
  },
  cardClosed: { borderLeftColor: "#c4b7cc", opacity: 0.85 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeActive: { backgroundColor: "#f4b40020" },
  badgeClosed: { backgroundColor: "#ede9f0" },
  badgeText: { fontSize: 10, fontWeight: "800", color: "#2b0540" },
  typeLabel: { fontSize: 10, color: "#9b8ca1", fontWeight: "700" },
  actions: { flexDirection: "row", gap: 4 },
  actionBtn: { padding: 4 },
  question: { fontSize: 15, fontWeight: "800", color: "#2b0540", marginBottom: 6 },
  deadlineRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  deadline: { fontSize: 11, color: "#da9306", fontWeight: "700" },
  options: { gap: 8, marginBottom: 10 },
  totalVoters: { fontSize: 11, color: "#9b8ca1", textAlign: "right", marginBottom: 8 },
  voteBtn: {
    backgroundColor: "#2b0540",
    borderRadius: 13,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  voteBtnDisabled: { opacity: 0.6 },
  voteBtnText: { color: "#fff", fontWeight: "900", fontSize: 14 },
  compactRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 6 },
  compactOpt: {
    flex: 1,
    minWidth: 70,
    borderWidth: 1,
    borderColor: "#ded4e2",
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  compactOptSelected: { backgroundColor: "#2b0540", borderColor: "#2b0540" },
  compactOptText: { fontSize: 11, color: "#604f67", fontWeight: "700" },
  compactOptTextSelected: { color: "#fff" },
  compactVoteBtn: {
    backgroundColor: "#da9306",
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});

const barStyles = StyleSheet.create({
  wrap: { marginBottom: 2 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { fontSize: 13, color: "#3d2d44", fontWeight: "600", flex: 1 },
  labelSelected: { color: "#2b0540", fontWeight: "800" },
  pct: { fontSize: 12, color: "#6d28d9", fontWeight: "800", marginLeft: 6 },
  track: {
    height: 6,
    backgroundColor: "#ede9f1",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 2,
  },
  fill: { height: "100%", backgroundColor: "#6d28d9", borderRadius: 3 },
  votes: { fontSize: 10, color: "#9b8ca1" },
});
