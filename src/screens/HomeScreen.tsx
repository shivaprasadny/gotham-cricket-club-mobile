import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { getMatches } from "../services/matchService";
import { getAnnouncements } from "../services/announcementService";

type Props = {
  navigation: any;
};

type Match = {
  id: number;
  opponentName: string;
  venue: string;
  matchDate: string;
  matchType: string;
  status?: "UPCOMING" | "COMPLETED" | "CANCELLED";
  teamId?: number | null;
  teamName?: string | null;
  myAvailability?: "AVAILABLE" | "NOT_AVAILABLE" | "MAYBE" | "INJURED";
};

type Announcement = {
  id: number;
  title: string;
  message: string;
};

const QUOTES = [
  "Play for the badge. Fight for each other.",
  "Discipline, unity, and consistency win matches.",
  "Great teams trust the process.",
  "Every match is a chance to improve.",
];

const HomeScreen = ({ navigation }: Props) => {
  const { user, logout } = useAuth();

  const [menuVisible, setMenuVisible] = useState(false);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const isAdmin = user?.role === "ADMIN";
  const isCaptain = user?.role === "CAPTAIN";
  const canManage = isAdmin || isCaptain;

  useEffect(() => {
    void loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const [matchesData, announcementData] = await Promise.all([
        getMatches(),
        getAnnouncements(),
      ]);

      const upcoming = Array.isArray(matchesData)
        ? matchesData
            .filter((m) => (m.status || "UPCOMING") === "UPCOMING")
            .slice(0, 3)
        : [];

      const latestAnnouncements = Array.isArray(announcementData)
        ? announcementData.slice(0, 3)
        : [];

      setUpcomingMatches(upcoming);
      setAnnouncements(latestAnnouncements);
    } catch (error) {
      console.log("HOME LOAD ERROR:", error);
    }
  };

  const quote = useMemo(() => {
    const index = (user?.id || 0) % QUOTES.length;
    return QUOTES[index];
  }, [user?.id]);

  const closeMenuAndNavigate = (screen: string, params?: any) => {
    setMenuVisible(false);
    navigation.navigate(screen, params);
  };

  const handleLogout = async () => {
    setMenuVisible(false);
    await logout();
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.name}>{user?.fullName}</Text>
            <Text style={styles.roleText}>{user?.role}</Text>
          </View>

          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setMenuVisible(true)}
          >
            <Ionicons name="menu" size={26} color="#F4B400" />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Gotham Cricket Club</Text>
          <Text style={styles.heroSub}>One club. One standard.</Text>
          <Text style={styles.heroQuote}>{quote}</Text>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate("Matches")}
          >
            <Ionicons name="calendar-outline" size={22} color="#F4B400" />
            <Text style={styles.quickText}>Matches</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate("Announcements")}
          >
            <Ionicons name="notifications-outline" size={22} color="#F4B400" />
            <Text style={styles.quickText}>Announcements</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate("Profile")}
          >
            <Ionicons name="person-outline" size={22} color="#F4B400" />
            <Text style={styles.quickText}>Profile</Text>
          </TouchableOpacity>

          {canManage ? (
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate("Teams")}
            >
              <Ionicons name="shield-outline" size={22} color="#F4B400" />
              <Text style={styles.quickText}>Teams</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate("Matches")}
            >
              <Ionicons name="checkmark-done-outline" size={22} color="#F4B400" />
              <Text style={styles.quickText}>Availability</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>Upcoming Matches</Text>
        {upcomingMatches.length === 0 ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>No upcoming matches right now.</Text>
          </View>
        ) : (
          upcomingMatches.map((match) => (
            <TouchableOpacity
              key={match.id}
              style={styles.infoCard}
              onPress={() =>
                navigation.navigate("MatchDetails", {
                  matchId: match.id,
                  opponentName: match.opponentName,
                  venue: match.venue,
                  matchDate: match.matchDate,
                  matchType: match.matchType,
                  status: match.status,
                  teamId: match.teamId,
                  teamName: match.teamName,
                })
              }
            >
              <Text style={styles.cardTitle}>{match.opponentName}</Text>
              <Text style={styles.cardText}>Venue: {match.venue}</Text>
              <Text style={styles.cardText}>
                Date: {new Date(match.matchDate).toLocaleString()}
              </Text>
              <Text style={styles.cardText}>
                Team: {match.teamName || "No team assigned"}
              </Text>
              <Text style={styles.cardHighlight}>
                {match.myAvailability
                  ? `Availability: ${match.myAvailability}`
                  : "Please mark your availability"}
              </Text>
            </TouchableOpacity>
          ))
        )}

        <Text style={styles.sectionTitle}>Latest Announcements</Text>
        {announcements.length === 0 ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>No announcements right now.</Text>
          </View>
        ) : (
          announcements.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.infoCard}
              onPress={() => navigation.navigate("Announcements")}
            >
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardText} numberOfLines={3}>
                {item.message}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal
        visible={menuVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <Pressable style={styles.menuPanel} onPress={() => {}}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuName}>{user?.fullName}</Text>
              <Text style={styles.menuRole}>{user?.role}</Text>
            </View>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => closeMenuAndNavigate("Home")}
            >
              <Ionicons name="home-outline" size={20} color="#F4B400" />
              <Text style={styles.menuItemText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => closeMenuAndNavigate("Matches")}
            >
              <Ionicons name="calendar-outline" size={20} color="#F4B400" />
              <Text style={styles.menuItemText}>Matches</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => closeMenuAndNavigate("Announcements")}
            >
              <Ionicons name="notifications-outline" size={20} color="#F4B400" />
              <Text style={styles.menuItemText}>Announcements</Text>
            </TouchableOpacity>

            {canManage && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => closeMenuAndNavigate("Teams")}
              >
                <Ionicons name="shield-outline" size={20} color="#F4B400" />
                <Text style={styles.menuItemText}>Teams</Text>
              </TouchableOpacity>
            )}

            {canManage && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => closeMenuAndNavigate("Members")}
              >
                <Ionicons name="people-outline" size={20} color="#F4B400" />
                <Text style={styles.menuItemText}>Members</Text>
              </TouchableOpacity>
            )}

            {isAdmin && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => closeMenuAndNavigate("AdminApproval")}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#F4B400" />
                <Text style={styles.menuItemText}>Approve Members</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => closeMenuAndNavigate("Profile")}
            >
              <Ionicons name="person-outline" size={20} color="#F4B400" />
              <Text style={styles.menuItemText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.logoutMenuItem]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.logoutMenuText}>Logout</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#4B1D6B",
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  heading: {
    color: "#ddd",
    fontSize: 15,
  },
  name: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 2,
  },
  roleText: {
    color: "#F4B400",
    marginTop: 4,
    fontWeight: "600",
  },
  menuBtn: {
    backgroundColor: "#5A257A",
    padding: 10,
    borderRadius: 14,
  },
  heroCard: {
    backgroundColor: "#5A257A",
    padding: 18,
    borderRadius: 18,
    marginBottom: 18,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  heroSub: {
    color: "#F4B400",
    fontSize: 15,
    marginBottom: 8,
    fontWeight: "600",
  },
  heroQuote: {
    color: "#ddd",
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 6,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  quickCard: {
    width: "48%",
    backgroundColor: "#5A257A",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  quickText: {
    color: "#fff",
    marginTop: 10,
    fontWeight: "700",
  },
  infoCard: {
    backgroundColor: "#5A257A",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  infoText: {
    color: "#ddd",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },
  cardText: {
    color: "#ddd",
    marginBottom: 4,
  },
  cardHighlight: {
    color: "#F4B400",
    marginTop: 6,
    fontWeight: "700",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 80,
    paddingRight: 16,
  },
  menuPanel: {
    width: 270,
    backgroundColor: "#4B1D6B",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#6b3a91",
  },
  menuHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#6b3a91",
    paddingBottom: 12,
    marginBottom: 12,
  },
  menuName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  menuRole: {
    color: "#F4B400",
    marginTop: 4,
    fontWeight: "600",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  menuItemText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  logoutMenuItem: {
    backgroundColor: "#8b1e3f",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  logoutMenuText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});