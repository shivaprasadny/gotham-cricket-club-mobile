import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";

type Props = {
  navigation: any;
};

const HomeScreen = ({ navigation }: Props) => {
  const { user, logout } = useAuth();

  const isAdmin = user?.role === "ADMIN";
  const isCaptain = user?.role === "CAPTAIN";
  const isPlayer = user?.role === "PLAYER";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome {user?.fullName}</Text>
      <Text style={styles.subtitle}>Role: {user?.role}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.buttonGap}>
          <Button
            title="Matches"
            onPress={() => navigation.navigate("Matches")}
          />
        </View>

        <View style={styles.buttonGap}>
          <Button
            title="Announcements"
            onPress={() => navigation.navigate("Announcements")}
          />
        </View>

        <View style={styles.buttonGap}>
          <Button
            title="Profile"
            onPress={() => navigation.navigate("Profile")}
          />
        </View>

        {(isAdmin || isCaptain) && (
          <View style={styles.buttonGap}>
            <Button
              title="Members"
              onPress={() => navigation.navigate("Members")}
            />
          </View>
        )}

        {(isAdmin || isCaptain) && (
          <View style={styles.buttonGap}>
            <Button
              title="Teams"
              onPress={() => navigation.navigate("Teams")}
            />
          </View>
        )}

        {(isAdmin || isCaptain) && (
          <View style={styles.buttonGap}>
            <Button
              title="Create Match"
              onPress={() => navigation.navigate("CreateMatch")}
            />
          </View>
        )}

        {(isAdmin || isCaptain) && (
          <View style={styles.buttonGap}>
            <Button
              title="Create Announcement"
              onPress={() => navigation.navigate("CreateAnnouncement")}
            />
          </View>
        )}

        {isAdmin && (
          <View style={styles.buttonGap}>
            <Button
              title="Approve Members"
              onPress={() => navigation.navigate("AdminApproval")}
            />
          </View>
        )}

        <View style={styles.buttonGap}>
          <Button
            title="Notifications"
            onPress={() => navigation.navigate("Notifications")}
          />
        </View>

        <View style={styles.buttonGap}>
          <Button title="Logout" onPress={logout} />
        </View>
      </View>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 24,
  },
  section: {
    backgroundColor: "#f7f7f7",
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  buttonGap: {
    marginBottom: 12,
  },
});