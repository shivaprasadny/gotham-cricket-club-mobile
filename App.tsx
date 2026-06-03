import React from "react";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { navigate } from "./src/navigation/navigationRef";

export default function App() {

useEffect(() => {
  // Reusable function to handle notification tap navigation
  const handleNotificationTap = (data: any) => {
    const targetScreen = data?.targetScreen as string | undefined;
    const targetId = data?.targetId as number | undefined;

    // Announcement notification
    if (targetScreen === "AnnouncementDetails") {
      navigate("MainTabs", {
        screen: "Announcements",
      });
      return;
    }

    // Match notification
    if (targetScreen === "MatchDetails" && targetId) {
      navigate("MatchDetails", {
        matchId: targetId,
      });
      return;
    }

    // Fee notification
    if (targetScreen === "MyFees") {
      navigate("MyFees", {
        feeAssignmentId: targetId,
      });
      return;
    }

    // Availability reminder
    if (targetScreen === "Matches") {
      navigate("MainTabs", {
        screen: "Matches",
      });
      return;
    }

    // Default fallback
    navigate("MainTabs", {
      screen: "Home",
    });
  };

  // Handles notification tap when app is already background/open
  const subscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      handleNotificationTap(data);
    });

  // Handles notification tap when app was fully closed
  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) {
      const data = response.notification.request.content.data;

      // Small delay so NavigationContainer is ready
      setTimeout(() => {
        handleNotificationTap(data);
      }, 800);
    }
  });

  return () => subscription.remove();
}, []);

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}