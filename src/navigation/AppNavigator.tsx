import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import AnnouncementsScreen from "../screens/AnnouncementsScreen";
import MatchesScreen from "../screens/MatchesScreen";
import AvailabilityScreen from "../screens/AvailabilityScreen";
import AdminApprovalScreen from "../screens/AdminApprovalScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import MembersScreen from "../screens/MembersScreen";
import MatchDetailsScreen from "../screens/MatchDetailsScreen";
import CreateMatchScreen from "../screens/CreateMatchScreen";
import CreateAnnouncementScreen from "../screens/CreateAnnouncementScreen";
import EditMatchScreen from "../screens/EditMatchScreen";
import EditAnnouncementScreen from "../screens/EditAnnouncementScreen";
import SquadSelectionScreen from "../screens/SquadSelectionScreen";
import NotificationsScreen from "../screens/NotificationsScreen";


const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { token, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      {!token ? (
        <Stack.Navigator>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Announcements" component={AnnouncementsScreen} />
          <Stack.Screen name="Matches" component={MatchesScreen} />
          <Stack.Screen name="MatchDetails" component={MatchDetailsScreen} />
          <Stack.Screen name="Availability" component={AvailabilityScreen} />
          <Stack.Screen name="CreateMatch" component={CreateMatchScreen} />
          <Stack.Screen name="AdminApproval" component={AdminApprovalScreen} />
          <Stack.Screen name="SquadSelection" component={SquadSelectionScreen} />
<Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="CreateAnnouncement" component={CreateAnnouncementScreen} />
<Stack.Screen name="EditMatch" component={EditMatchScreen} />
<Stack.Screen name="EditAnnouncement" component={EditAnnouncementScreen} />
<Stack.Screen name="Members" component={MembersScreen} />

        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;