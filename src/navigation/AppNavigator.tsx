import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";

import AdminApprovalScreen from "../screens/AdminApprovalScreen";
import CreateMatchScreen from "../screens/CreateMatchScreen";
import CreateAnnouncementScreen from "../screens/CreateAnnouncementScreen";
import EditMatchScreen from "../screens/EditMatchScreen";
import EditAnnouncementScreen from "../screens/EditAnnouncementScreen";
import MatchDetailsScreen from "../screens/MatchDetailsScreen";
import AvailabilityScreen from "../screens/AvailabilityScreen";
import SquadSelectionScreen from "../screens/SquadSelectionScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import TeamDetailsScreen from "../screens/TeamDetailsScreen";
import CreateTeamScreen from "../screens/CreateTeamScreen";
import EditTeamScreen from "../screens/EditTeamScreen";
import SplashScreen from "../screens/SplashScreen";

import MainTabNavigator from "./MainTabNavigator";
import EventsScreen from "../screens/EventsScreen";
import CreateEventScreen from "../screens/CreateEventScreen";
import EventDetailsScreen from "../screens/EventDetailsScreen";
import LeaguesScreen from "../screens/LeaguesScreen";
import CreateLeagueScreen from "../screens/CreateLeagueScreen";
import LeagueDetailsScreen from "../screens/LeagueDetailsScreen";
import EditLeagueScreen from "../screens/EditLeagueScreen";
import EditEventScreen from "../screens/EditEventScreen";
import MyFeesScreen from "../screens/MyFeesScreen";
import CreateFeeScreen from "../screens/CreateFeeScreen";
import FeeListScreen from "../screens/FeeListScreen";
import FeeDetailsScreen from "../screens/FeeDetailsScreen";
import EditFeeScreen from "../screens/EditFeeScreen";
import TeamsScreen from "../screens/TeamsScreen";
import MembersScreen from "../screens/MembersScreen";
import EditProfileScreen from "../screens/EditProfileScreen";



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
          <Stack.Screen name="Events" component={EventsScreen} />
          <Stack.Screen name="Leagues" component={LeaguesScreen} />
<Stack.Screen name="CreateLeague" component={CreateLeagueScreen} />
<Stack.Screen name="LeagueDetails" component={LeagueDetailsScreen} />
<Stack.Screen name="CreateEvent" component={CreateEventScreen} />
<Stack.Screen name="EventDetails" component={EventDetailsScreen} />
<Stack.Screen name="EditLeague" component={EditLeagueScreen} />
<Stack.Screen name="MyFees" component={MyFeesScreen} />
<Stack.Screen name="CreateFee" component={CreateFeeScreen} />
<Stack.Screen name="FeeList" component={FeeListScreen} />
<Stack.Screen name="FeeDetails" component={FeeDetailsScreen} /> 
<Stack.Screen name="EditFee" component={EditFeeScreen} />
<Stack.Screen name="EditEvent" component={EditEventScreen} />
<Stack.Screen
  name="Teams"
  component={TeamsScreen}
  options={{
    headerShown: true, // ✅ must be true
  }}
/>
<Stack.Screen name="Members" component={MembersScreen} />
<Stack.Screen name="EditProfile" component={EditProfileScreen} />

          <Stack.Screen
            name="Splash"
            component={SplashScreen}
            options={{ headerShown: false }}
          />
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