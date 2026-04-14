import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";

import MainTabNavigator from "./MainTabNavigator";

import AdminApprovalScreen from "../screens/AdminApprovalScreen";
import CreateMatchScreen from "../screens/CreateMatchScreen";
import CreateAnnouncementScreen from "../screens/CreateAnnouncementScreen";
import EditMatchScreen from "../screens/EditMatchScreen";
import EditAnnouncementScreen from "../screens/EditAnnouncementScreen";
import MatchDetailsScreen from "../screens/MatchDetailsScreen";
import AvailabilityScreen from "../screens/AvailabilityScreen";
import SquadSelectionScreen from "../screens/SquadSelectionScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import TeamsScreen from "../screens/TeamsScreen";
import TeamDetailsScreen from "../screens/TeamDetailsScreen";
import CreateTeamScreen from "../screens/CreateTeamScreen";
import EditTeamScreen from "../screens/EditTeamScreen";



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
          <Stack.Screen
            name="MainTabs"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="AdminApproval" component={AdminApprovalScreen} />
          <Stack.Screen name="CreateMatch" component={CreateMatchScreen} />
          <Stack.Screen
            name="CreateAnnouncement"
            component={CreateAnnouncementScreen}
          />
          <Stack.Screen name="EditMatch" component={EditMatchScreen} />
          <Stack.Screen
            name="EditAnnouncement"
            component={EditAnnouncementScreen}
          />
          <Stack.Screen name="TeamDetails" component={TeamDetailsScreen} />
          <Stack.Screen name="MatchDetails" component={MatchDetailsScreen} />
          <Stack.Screen name="Availability" component={AvailabilityScreen} />
          <Stack.Screen name="CreateTeam" component={CreateTeamScreen} />
<Stack.Screen name="EditTeam" component={EditTeamScreen} />
<Stack.Screen name="SquadSelection" component={SquadSelectionScreen} />
         
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;