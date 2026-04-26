import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";


import { createFee, createSplitFee } from "../services/feeService";
import { getTeamMembers, getTeams } from "../services/teamService";
import { getMatches } from "../services/matchService";
import { getSquadByMatch } from "../services/squadService";

import { getAllMembers } from "../services/memberService";
import {
  DateTimePickerAndroid
} from "@react-native-community/datetimepicker";

type Props = {
  navigation: any;
};

type FeeType =
  | "MATCH_FEE"
  | "EVENT_FEE"
  | "NET_PRACTICE_FEE"
  | "ANNUAL_MEMBERSHIP_FEE"
  | "OTHER";

type SourceType =
  | "ALL_CLUB"
  | "TEAM_MEMBERS"
  | "MATCH_SQUAD"
  | "CUSTOM_SELECTION";

type BillingMode =
  | "FIXED_PER_PERSON"
  | "EQUAL_SPLIT"
  | "CUSTOM_SPLIT";

type ClubMember = {
  id?: number;
  userId?: number;
  fullName?: string;
  email?: string;
  role?: string;
  status?: string;
};

type Team = {
  id: number;
  teamName?: string;
  name?: string;
};

type MatchItem = {
  id: number;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
  externalOpponentName?: string | null;
  matchDate?: string;
};

type SquadItem = {
  squadId?: number;
  userId: number;
  fullName: string;
  nickname?: string | null;
  playerType?: string | null;
  jerseyNumber?: number | null;
  isPlayingXi?: boolean;
  roleInMatch?: string;
};

type SelectedSplit = {
  userId: number;
  fullName: string;
  amount: string;
};

const CreateFeeScreen = ({ navigation }: Props) => {
  const [title, setTitle] = useState("");
  const [feeType, setFeeType] = useState<FeeType>("MATCH_FEE");
  const [sourceType, setSourceType] = useState<SourceType>("ALL_CLUB");
  const [billingMode, setBillingMode] =
    useState<BillingMode>("FIXED_PER_PERSON");

  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [tempDueDate, setTempDueDate] = useState<Date>(new Date());
  const [description, setDescription] = useState("");

  const [amount, setAmount] = useState("");
  const [equalTotalAmount, setEqualTotalAmount] = useState("");

  const [members, setMembers] = useState<ClubMember[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);

  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

  const [searchText, setSearchText] = useState("");
  const [selectedSplits, setSelectedSplits] = useState<SelectedSplit[]>([]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [loadingSourceMembers, setLoadingSourceMembers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSelectedCount, setShowSelectedCount] = useState(10);
const [selectedMemberSearch, setSelectedMemberSearch] = useState("");

  const scrollRef = useRef<ScrollView>(null);

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
    const [matchSearchText, setMatchSearchText] = useState(""); // search text inside match modal

  // Load members, teams, matches on open
  useEffect(() => {
    void loadInitialData();
  }, []);

  // Reset selected source data when source type changes
 useEffect(() => {
  setSelectedTeamId(null);
  setSelectedMatchId(null);
  setSelectedSplits([]);
  setShowSelectedCount(10);
  setSelectedMemberSearch("");
}, [sourceType]);

  // Auto-fill equal split amounts
  useEffect(() => {
    if (billingMode !== "EQUAL_SPLIT") return;

    const total = Number(equalTotalAmount);

    if (!total || total <= 0 || selectedSplits.length === 0) {
      setSelectedSplits((prev) =>
        prev.map((item) => ({ ...item, amount: "" }))
      );
      return;
    }

    const splitAmount = (total / selectedSplits.length).toFixed(2);

    setSelectedSplits((prev) =>
      prev.map((item) => ({
        ...item,
        amount: splitAmount,
      }))
    );
  }, [equalTotalAmount, selectedSplits.length, billingMode]);

  // Load all initial data
  const loadInitialData = async () => {
    try {
      setLoadingInitialData(true);

      const [memberData, teamData, matchData] = await Promise.all([
        getAllMembers(),
        getTeams(),
        getMatches(),
      ]);

      console.log("MEMBERS DATA:", memberData);
      console.log("TEAMS DATA:", teamData);
      console.log("MATCHES DATA:", matchData);

      setMembers(Array.isArray(memberData) ? memberData : []);
      setTeams(Array.isArray(teamData) ? teamData : []);
      setMatches(Array.isArray(matchData) ? matchData : []);
    } catch (error: any) {
      console.log("CREATE FEE INITIAL LOAD ERROR:", error?.response?.data || error);
      console.log("CREATE FEE INITIAL LOAD STATUS:", error?.response?.status);

      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to load create fee data"
      );
    } finally {
      setLoadingInitialData(false);
    }
  };

  // Build match label
  const getMatchLabel = (match: MatchItem) => {
    const opponent =
      match.awayTeamName || match.externalOpponentName || "Opponent";

    return `${match.homeTeamName || "Team"} vs ${opponent}`;
  };

  // Current team label
  const selectedTeamLabel =
    teams.find((team) => team.id === selectedTeamId)?.teamName ||
    teams.find((team) => team.id === selectedTeamId)?.name ||
    "Select Team";

  // Current match label
  const selectedMatchLabel =
    matches.find((match) => match.id === selectedMatchId)
      ? getMatchLabel(matches.find((match) => match.id === selectedMatchId)!)
      : "Select Match";

  // Filter and sort matches for match modal
  const filteredMatchOptions = useMemo(() => {
    const now = new Date();
    const text = matchSearchText.trim().toLowerCase();

    return matches
      // hide cancelled matches
      .filter((match: any) => match.status !== "CANCELLED")
      // filter by search text
      .filter((match) => {
        if (!text) return true;

        const label = getMatchLabel(match).toLowerCase();
        const venue = ((match as any).venue || "").toLowerCase();
        const dateText = match.matchDate
          ? new Date(match.matchDate).toLocaleString().toLowerCase()
          : "";

        return (
          label.includes(text) ||
          venue.includes(text) ||
          dateText.includes(text)
        );
      })
      // upcoming first, then recent past
      .sort((a, b) => {
        const aDate = a.matchDate ? new Date(a.matchDate).getTime() : 0;
        const bDate = b.matchDate ? new Date(b.matchDate).getTime() : 0;

        const aUpcoming = aDate >= now.getTime();
        const bUpcoming = bDate >= now.getTime();

        // upcoming matches first
        if (aUpcoming && !bUpcoming) return -1;
        if (!aUpcoming && bUpcoming) return 1;

        // upcoming sorted nearest first
        if (aUpcoming && bUpcoming) return aDate - bDate;

        // past sorted most recent first
        return bDate - aDate;
      });
  }, [matches, matchSearchText]);

  // Open due date picker
 const openDatePicker = () => {
  // =========================
  // ANDROID SAFE PICKER
  // =========================
  if (Platform.OS === "android") {
    const baseDate = dueDate || new Date();

    // STEP 1: PICK DATE
    DateTimePickerAndroid.open({
      value: baseDate,
      mode: "date",
      is24Hour: false,
      onChange: (event, selectedDate) => {
        // If user cancels → do nothing
        if (event.type !== "set" || !selectedDate) return;

        // STEP 2: PICK TIME
        DateTimePickerAndroid.open({
          value: selectedDate,
          mode: "time",
          is24Hour: false,
          onChange: (timeEvent, selectedTime) => {
            if (timeEvent.type !== "set" || !selectedTime) return;

            // Combine date + time
            const finalDate = new Date(selectedDate);
            finalDate.setHours(selectedTime.getHours());
            finalDate.setMinutes(selectedTime.getMinutes());
            finalDate.setSeconds(0);
            finalDate.setMilliseconds(0);

            // ✅ FINAL VALUE SET HERE
            setDueDate(finalDate);
          },
        });
      },
    });
  } 
  // =========================
  // iOS (NO CHANGE)
  // =========================
  else {
    setTempDueDate(dueDate || new Date());
    setShowDatePicker(true);
  }
};
  // Scroll search section upward
  const handleSearchFocus = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 900, animated: true });
    }, 250);
  };

  // Save date
  const handleDoneDate = () => {
    setDueDate(tempDueDate);
    setShowDatePicker(false);
  };

  // Cancel date
  const handleCancelDate = () => {
    setShowDatePicker(false);
  };

  // Format date text
  const formatDate = (date: Date | null) => {
    if (!date) return "Select due date & time";
    return date.toLocaleString();
  };

  // Build one selected member row
  const buildSelectedSplit = (
    userId: number,
    fullName: string
  ): SelectedSplit => ({
    userId,
    fullName,
    amount: "",
  });

  // Merge users without duplicates
  const mergeUniqueMembers = (
    base: SelectedSplit[],
    extra: SelectedSplit[]
  ) => {
    const map = new Map<number, SelectedSplit>();

    [...base, ...extra].forEach((item) => {
      if (!map.has(item.userId)) {
        map.set(item.userId, item);
      }
    });

    return Array.from(map.values());
  };

  // Load members from source
  const handleLoadSourceMembers = async () => {
    try {
      setLoadingSourceMembers(true);

      if (sourceType === "ALL_CLUB") {
        const allClubSelected = members
          .map((member) => {
            const userId = member.userId ?? member.id ?? 0;
            if (!userId) return null;

            return buildSelectedSplit(
              userId,
              member.fullName || member.email || "Unknown Member"
            );
          })
          .filter(Boolean) as SelectedSplit[];

        setSelectedSplits(allClubSelected);
        return;
      }

      if (sourceType === "TEAM_MEMBERS") {
        if (!selectedTeamId) {
          Alert.alert("Error", "Please select a team first");
          return;
        }

        const teamMembers = await getTeamMembers(selectedTeamId);

        const selected = (Array.isArray(teamMembers) ? teamMembers : [])
          .map((member: any) => {
            const userId = member.userId ?? member.id ?? 0;
            if (!userId) return null;

            return buildSelectedSplit(
              userId,
              member.fullName || member.email || "Unknown Member"
            );
          })
          .filter(Boolean) as SelectedSplit[];

        setSelectedSplits(selected);
        return;
      }

      if (sourceType === "MATCH_SQUAD") {
        if (!selectedMatchId) {
          Alert.alert("Error", "Please select a match first");
          return;
        }

        const squadMembers = await getSquadByMatch(selectedMatchId);

        const selected = (Array.isArray(squadMembers) ? squadMembers : [])
          .map((member: SquadItem) => {
            if (!member.userId) return null;

            return buildSelectedSplit(
              member.userId,
              member.fullName || "Unknown Member"
            );
          })
          .filter(Boolean) as SelectedSplit[];

        setSelectedSplits(selected);
        return;
      }

      if (sourceType === "CUSTOM_SELECTION") {
        setSelectedSplits([]);
      }
    } catch (error: any) {
      console.log("LOAD SOURCE MEMBERS ERROR:", error?.response?.data || error);

      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to load source members"
      );
    } finally {
      setLoadingSourceMembers(false);
    }
  };

  // Add extra member
  const handleSelectMember = (member: ClubMember) => {
    const userId = member.userId ?? member.id ?? 0;
    if (!userId) return;

    const alreadySelected = selectedSplits.some((item) => item.userId === userId);
    if (alreadySelected) return;

    const newMember = buildSelectedSplit(
      userId,
      member.fullName || member.email || "Unknown Member"
    );

    setSelectedSplits((prev) => mergeUniqueMembers(prev, [newMember]));
  };

  // Remove selected member
  const handleRemoveSelected = (userId: number) => {
    setSelectedSplits((prev) => prev.filter((item) => item.userId !== userId));
  };

  // Update custom amount
  const handleAmountChange = (userId: number, amountValue: string) => {
    setSelectedSplits((prev) =>
      prev.map((item) =>
        item.userId === userId ? { ...item, amount: amountValue } : item
      )
    );
  };

  const filteredSelectedSplits = useMemo(() => {
  const text = selectedMemberSearch.trim().toLowerCase();

  if (!text) return selectedSplits;

  return selectedSplits.filter((item) =>
    item.fullName.toLowerCase().includes(text)
  );
}, [selectedSplits, selectedMemberSearch]);


const visibleSelectedSplits = useMemo(() => {
  return filteredSelectedSplits.slice(0, showSelectedCount);
}, [filteredSelectedSplits, showSelectedCount]);

  // Search extra members
  const filteredMembers = useMemo(() => {
    const text = searchText.trim().toLowerCase();

    if (!text) return [];

    return members
      .filter((member) => {
        const name = (member.fullName || "").toLowerCase();
        const email = (member.email || "").toLowerCase();

        return name.includes(text) || email.includes(text);
      })
      .filter((member) => {
        const userId = member.userId ?? member.id ?? 0;
        return !selectedSplits.some((item) => item.userId === userId);
      });
  }, [members, searchText, selectedSplits]);

  // Total amount preview
  const totalAmount = useMemo(() => {
    return selectedSplits.reduce((sum, item) => {
      const value = Number(item.amount || 0);
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
  }, [selectedSplits]);

  // Create fee
  const handleCreateFee = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter fee title");
      return;
    }

    if (!dueDate) {
      Alert.alert("Error", "Please select due date");
      return;
    }

    try {
      setSubmitting(true);

      if (billingMode === "FIXED_PER_PERSON") {
        if (sourceType === "ALL_CLUB") {
          if (!amount.trim() || Number(amount) <= 0) {
            Alert.alert("Error", "Please enter valid amount");
            setSubmitting(false);
            return;
          }
const fixedSplits = selectedSplits.map((item) => ({
  userId: item.userId,
  amount: Number(amount),
}));

const response = await createSplitFee({
  title: title.trim(),
  feeType,
  dueDate: dueDate.toISOString(),
  description: description.trim(),
  splits: fixedSplits,
});



Alert.alert(
  "Success",
  typeof response === "string"
    ? response
    : "Fee created successfully"
);

navigation.goBack();
return;
        }

        if (selectedSplits.length === 0) {
          Alert.alert("Error", "Please load or select members first");
          setSubmitting(false);
          return;
        }

        if (!amount.trim() || Number(amount) <= 0) {
          Alert.alert("Error", "Please enter valid amount");
          setSubmitting(false);
          return;
        }

        const fixedSplits = selectedSplits.map((item) => ({
          userId: item.userId,
          amount: Number(amount),
        }));

        const response = await createSplitFee({
          title: title.trim(),
          feeType,
          dueDate: dueDate.toISOString(),
          description: description.trim(),
          splits: fixedSplits,
        });

        Alert.alert(
          "Success",
          typeof response === "string"
            ? response
            : "Fee created successfully"
        );

        navigation.goBack();
        return;
      }

      if (selectedSplits.length === 0) {
        Alert.alert("Error", "Please load or select at least one member");
        setSubmitting(false);
        return;
      }

      const validSplits = selectedSplits
        .map((item) => ({
          userId: item.userId,
          amount: Number(item.amount),
        }))
        .filter((item) => item.amount > 0);

      if (validSplits.length === 0) {
        Alert.alert("Error", "Please enter valid split amount");
        setSubmitting(false);
        return;
      }

      const response = await createSplitFee({
        title: title.trim(),
        feeType,
        dueDate: dueDate.toISOString(),
        description: description.trim(),
        splits: validSplits,
      });

    

      Alert.alert(
        "Success",
        typeof response === "string"
          ? response
          : "Split fee created successfully"
      );

      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to create fee"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitialData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading create fee data...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Create Fee</Text>

          <Text style={styles.label}>Fee Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter fee title"
            placeholderTextColor="#7a7a7a"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Due Date</Text>
          <TouchableOpacity style={styles.input} onPress={openDatePicker}>
            <Text style={styles.inputText}>{formatDate(dueDate)}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <View style={styles.inlinePickerCard}>
              <DateTimePicker
                value={tempDueDate}
                mode="datetime"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setTempDueDate(selectedDate);
                  }

                  if (Platform.OS !== "ios" && selectedDate) {
                    setDueDate(selectedDate);
                    setShowDatePicker(false);
                  }
                }}
              />

              {Platform.OS === "ios" && (
                <View style={styles.dateActionRow}>
                  <TouchableOpacity
                    style={styles.dateCancelBtn}
                    onPress={handleCancelDate}
                  >
                    <Text style={styles.dateCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dateDoneBtn}
                    onPress={handleDoneDate}
                  >
                    <Text style={styles.dateDoneBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            placeholder="Optional description"
            placeholderTextColor="#7a7a7a"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Text style={styles.label}>Fee Type</Text>
          <View style={styles.row}>
            {[
              { label: "Match", value: "MATCH_FEE" },
              { label: "Event", value: "EVENT_FEE" },
              { label: "Net", value: "NET_PRACTICE_FEE" },
              { label: "Annual", value: "ANNUAL_MEMBERSHIP_FEE" },
              { label: "Other", value: "OTHER" },
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.typeBtn,
                  feeType === item.value && styles.typeBtnSelected,
                ]}
                onPress={() => setFeeType(item.value as FeeType)}
              >
                <Text
                  style={[
                    styles.typeText,
                    feeType === item.value && styles.typeTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Source Type</Text>
          <View style={styles.row}>
            {[
              { label: "All Club", value: "ALL_CLUB" },
              { label: "Team Members", value: "TEAM_MEMBERS" },
              { label: "Match Squad", value: "MATCH_SQUAD" },
              { label: "Custom", value: "CUSTOM_SELECTION" },
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.typeBtn,
                  sourceType === item.value && styles.typeBtnSelected,
                ]}
                onPress={() => setSourceType(item.value as SourceType)}
              >
                <Text
                  style={[
                    styles.typeText,
                    sourceType === item.value && styles.typeTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {sourceType === "TEAM_MEMBERS" && (
            <>
              <Text style={styles.label}>Select Team</Text>
              <TouchableOpacity
                style={styles.selectorBtn}
                onPress={() => setShowTeamModal(true)}
              >
                <Text style={styles.selectorBtnText}>{selectedTeamLabel}</Text>
              </TouchableOpacity>
            </>
          )}

          {sourceType === "MATCH_SQUAD" && (
  <>
    <Text style={styles.label}>Select Match</Text>
    <TouchableOpacity
      style={styles.selectorBtn}
      onPress={() => {
        setMatchSearchText("");
        setShowMatchModal(true);
      }}
    >
      <Text style={styles.selectorBtnText}>{selectedMatchLabel}</Text>
    </TouchableOpacity>
  </>
)}

          <TouchableOpacity
            style={styles.loadSourceBtn}
            onPress={handleLoadSourceMembers}
            disabled={loadingSourceMembers}
          >
            <Text style={styles.loadSourceBtnText}>
              {loadingSourceMembers ? "Loading..." : "Load Source Members"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Billing Mode</Text>
          <View style={styles.row}>
            {[
              { label: "Fixed Per Person", value: "FIXED_PER_PERSON" },
              { label: "Equal Split", value: "EQUAL_SPLIT" },
              { label: "Custom Split", value: "CUSTOM_SPLIT" },
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.typeBtn,
                  billingMode === item.value && styles.typeBtnSelected,
                ]}
                onPress={() => setBillingMode(item.value as BillingMode)}
              >
                <Text
                  style={[
                    styles.typeText,
                    billingMode === item.value && styles.typeTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {billingMode === "FIXED_PER_PERSON" && (
            <>
              <Text style={styles.label}>Amount Per Person</Text>
              <View style={styles.amountRow}>
                <View style={styles.dollarBox}>
                  <Text style={styles.dollarText}>$</Text>
                </View>

                <TextInput
                  style={styles.amountInput}
                  placeholder="Enter amount"
                  placeholderTextColor="#7a7a7a"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
            </>
          )}

          {billingMode === "EQUAL_SPLIT" && (
            <>
              <Text style={styles.label}>Total Amount</Text>
              <View style={styles.amountRow}>
                <View style={styles.dollarBox}>
                  <Text style={styles.dollarText}>$</Text>
                </View>

                <TextInput
                  style={styles.amountInput}
                  placeholder="Enter total amount"
                  placeholderTextColor="#7a7a7a"
                  keyboardType="numeric"
                  value={equalTotalAmount}
                  onChangeText={setEqualTotalAmount}
                />
              </View>
            </>
          )}

          <Text style={styles.label}>Add Extra Members by Search</Text>
          <TextInput
            style={styles.input}
            placeholder="Type player name or email"
            placeholderTextColor="#7a7a7a"
            value={searchText}
            onChangeText={setSearchText}
            onFocus={handleSearchFocus}
            returnKeyType="search"
          />

          <Text style={styles.sectionTitle}>Search Results</Text>
          {filteredMembers.length === 0 ? (
            <Text style={styles.infoText}>
              {searchText.trim()
                ? "No players found."
                : "Start typing to search players."}
            </Text>
          ) : (
            filteredMembers.map((member) => {
              const userId = member.userId ?? member.id ?? 0;

              return (
                <TouchableOpacity
                  key={userId}
                  style={styles.memberCard}
                  onPress={() => handleSelectMember(member)}
                >
                  <Text style={styles.memberName}>
                    {member.fullName || member.email || "Unknown Member"}
                  </Text>

                  <Text style={styles.memberSubText}>
                    {member.email || "Tap to add"}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}

          {/* ===== SEARCH INSIDE SELECTED MEMBERS ===== */}
<TextInput
  style={styles.input}
  placeholder="Search selected members"
  placeholderTextColor="#7a7a7a"
  value={selectedMemberSearch}
  onChangeText={(text) => {
    setSelectedMemberSearch(text);
    setShowSelectedCount(10); // reset pagination on search
  }}
/>

<Text style={styles.sectionTitle}>
  Selected Members ({filteredSelectedSplits.length})
</Text>

{/* ===== EMPTY STATE ===== */}
{filteredSelectedSplits.length === 0 ? (
  <Text style={styles.infoText}>No members found.</Text>
) : (
  <>
    {/* ===== PAGINATED LIST ===== */}
    {visibleSelectedSplits.map((item) => (
      <View key={item.userId} style={styles.selectedCard}>
        <View style={styles.selectedTopRow}>
          <Text style={styles.memberName}>{item.fullName}</Text>

          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => handleRemoveSelected(item.userId)}
          >
            <Text style={styles.removeBtnText}>Remove</Text>
          </TouchableOpacity>
        </View>

        {/* ===== BILLING MODES ===== */}
        {billingMode === "CUSTOM_SPLIT" ? (
          <View style={styles.amountRow}>
            <View style={styles.dollarBox}>
              <Text style={styles.dollarText}>$</Text>
            </View>

            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              placeholderTextColor="#7a7a7a"
              keyboardType="numeric"
              value={item.amount}
              onChangeText={(text) =>
                handleAmountChange(item.userId, text)
              }
            />
          </View>
        ) : billingMode === "EQUAL_SPLIT" ? (
          <Text style={styles.equalAmountPreviewText}>
            ${item.amount || "0.00"}
          </Text>
        ) : (
          <Text style={styles.equalAmountPreviewText}>
            {amount ? `$${amount}` : "Not set"}
          </Text>
        )}
      </View>
    ))}

    {/* ===== SEE MORE BUTTON ===== */}
    {filteredSelectedSplits.length > showSelectedCount && (
      <TouchableOpacity
        style={styles.loadSourceBtn}
        onPress={() =>
          setShowSelectedCount((prev) => prev + 10)
        }
      >
        <Text style={styles.loadSourceBtnText}>See More</Text>
      </TouchableOpacity>
    )}
  </>
)}

          {(billingMode === "EQUAL_SPLIT" || billingMode === "CUSTOM_SPLIT") && (
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.createBtn}
            onPress={handleCreateFee}
            disabled={submitting}
          >
            <Text style={styles.createBtnText}>
              {submitting ? "Creating..." : "Create Fee"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>

      <Modal
        visible={showTeamModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTeamModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Team</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {teams.length === 0 ? (
                <Text style={styles.infoText}>No teams found.</Text>
              ) : (
                teams.map((team) => (
                  <TouchableOpacity
                    key={team.id}
                    style={[
                      styles.modalOptionBtn,
                      selectedTeamId === team.id && styles.modalOptionBtnSelected,
                    ]}
                    onPress={() => {
                      setSelectedTeamId(team.id);
                      setShowTeamModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        selectedTeamId === team.id &&
                          styles.modalOptionTextSelected,
                      ]}
                    >
                      {team.teamName || team.name || "Unnamed Team"}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowTeamModal(false)}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showMatchModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMatchModal(false)}
      >
        <View style={styles.modalOverlay}>
                   <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Match</Text>

            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search by team, opponent, venue, or date"
              placeholderTextColor="#7a7a7a"
              value={matchSearchText}
              onChangeText={setMatchSearchText}
            />

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {filteredMatchOptions.length === 0 ? (
                <Text style={styles.infoText}>No matches found.</Text>
              ) : (
                filteredMatchOptions.map((match) => (
                  <TouchableOpacity
                    key={match.id}
                    style={[
                      styles.modalOptionBtn,
                      selectedMatchId === match.id &&
                        styles.modalOptionBtnSelected,
                    ]}
                    onPress={() => {
                      setSelectedMatchId(match.id);
                      setShowMatchModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        selectedMatchId === match.id &&
                          styles.modalOptionTextSelected,
                      ]}
                    >
                      {getMatchLabel(match)}
                    </Text>

                    {match.matchDate ? (
                      <Text style={styles.modalSubText}>
                        {new Date(match.matchDate).toLocaleString()}
                      </Text>
                    ) : null}

                    {(match as any).venue ? (
                      <Text style={styles.modalSubText}>
                        {(match as any).venue}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowMatchModal(false)}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default CreateFeeScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8f5fb",
  },
  container: {
    padding: 20,
    paddingBottom: 140,
    backgroundColor: "#f8f5fb",
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f8f5fb",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    color: "#2b0540",
    fontWeight: "700",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2b0540",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 2,
    color: "#2b0540",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2b0540",
    marginTop: 10,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d9d2e1",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  inputText: {
    color: "#111827",
    fontWeight: "500",
  },
  inlinePickerCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d9d2e1",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  dateActionRow: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  dateCancelBtn: {
    flex: 1,
    backgroundColor: "#e5e7eb",
    paddingVertical: 10,
    borderRadius: 8,
  },
  dateCancelBtnText: {
    textAlign: "center",
    fontWeight: "700",
    color: "#111827",
  },
  dateDoneBtn: {
    flex: 1,
    backgroundColor: "#2b0540",
    paddingVertical: 10,
    borderRadius: 8,
  },
  dateDoneBtnText: {
    textAlign: "center",
    fontWeight: "700",
    color: "#fff",
  },
  noteInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  typeBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  typeBtnSelected: {
    backgroundColor: "#2b0540",
    borderColor: "#2b0540",
  },
  typeText: {
    color: "#2b0540",
    fontWeight: "600",
  },
  typeTextSelected: {
    color: "#fff",
  },
  loadSourceBtn: {
    backgroundColor: "#2b0540",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  loadSourceBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  infoText: {
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 10,
  },
  memberCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  memberName: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 15,
  },
  memberSubText: {
    color: "#6b7280",
    marginTop: 4,
    fontWeight: "600",
  },
  selectedCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  selectedTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  removeBtn: {
    backgroundColor: "#c0392b",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  removeBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: 12,
  },
  dollarBox: {
    width: 48,
    backgroundColor: "#2b0540",
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  dollarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  amountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d9d2e1",
    borderLeftWidth: 0,
    padding: 12,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: "#fff",
    color: "#111827",
  },
  equalAmountPreview: {
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 10,
  },
  equalAmountPreviewText: {
    color: "#111827",
    fontWeight: "700",
  },
  totalCard: {
    backgroundColor: "#fff7e6",
    borderWidth: 1,
    borderColor: "#f5c56b",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  totalLabel: {
    color: "#8a5b00",
    fontWeight: "700",
    marginBottom: 4,
  },
  totalAmount: {
    color: "#2b0540",
    fontWeight: "800",
    fontSize: 24,
  },
  createBtn: {
    backgroundColor: "#da9306",
    padding: 14,
    borderRadius: 10,
    marginTop: 6,
  },
  createBtnText: {
    textAlign: "center",
    color: "#2b0540",
    fontWeight: "700",
    fontSize: 16,
  },
  selectorBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d9d2e1",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  selectorBtnText: {
    color: "#111827",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#f8f5fb",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    maxHeight: "75%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2b0540",
    marginBottom: 14,
    textAlign: "center",
  },
  modalOptionBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  modalOptionBtnSelected: {
    borderColor: "#2b0540",
    backgroundColor: "#ede9fe",
  },
  modalOptionText: {
    color: "#111827",
    fontWeight: "700",
  },
  modalOptionTextSelected: {
    color: "#2b0540",
  },
  modalSubText: {
    color: "#6b7280",
    marginTop: 4,
    fontWeight: "500",
    fontSize: 12,
  },
  modalCloseBtn: {
    backgroundColor: "#2b0540",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  modalCloseBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
    modalSearchInput: {
    borderWidth: 1,
    borderColor: "#d9d2e1",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    color: "#111827",
  },
});