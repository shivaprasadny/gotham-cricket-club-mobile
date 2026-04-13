import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";

type Props = {
  navigation: any;
};

const HomeScreen = ({ navigation }: Props) => {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome {user?.fullName}</Text>
      <Text style={styles.subtitle}>Role: {user?.role}</Text>

      <View style={styles.buttonGap}>
        <Button title="My Profile" onPress={() => navigation.navigate("Profile")} />
      </View>

      <View style={styles.buttonGap}>
        <Button
          title="Announcements"
          onPress={() => navigation.navigate("Announcements")}
        />
      </View>

      <View style={styles.buttonGap}>
        <Button title="Matches" onPress={() => navigation.navigate("Matches")} />
      </View>

      <View style={styles.buttonGap}>
        <Button
          title="Notifications"
          onPress={() => navigation.navigate("Notifications")}
        />
      </View>

      {(user?.role === "ADMIN" || user?.role === "CAPTAIN") && (
        <View style={styles.buttonGap}>
          <Button
            title="Create Announcement"
            onPress={() => navigation.navigate("CreateAnnouncement")}
          />
        </View>
      )}

      {(user?.role === "ADMIN" || user?.role === "CAPTAIN") && (
        <View style={styles.buttonGap}>
          <Button
            title="Create Match"
            onPress={() => navigation.navigate("CreateMatch")}
          />
        </View>
      )}

      {(user?.role === "ADMIN" || user?.role === "CAPTAIN") && (
        <View style={styles.buttonGap}>
          <Button
            title="View Members"
            onPress={() => navigation.navigate("Members")}
          />
        </View>
      )}

      {user?.role === "ADMIN" && (
        <View style={styles.buttonGap}>
          <Button
            title="Approve Members"
            onPress={() => navigation.navigate("AdminApproval")}
          />
        </View>
      )}

      <View style={styles.buttonGap}>
        <Button title="Logout" onPress={logout} />
      </View>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: "center",
  },
  buttonGap: {
    marginBottom: 12,
  },
});