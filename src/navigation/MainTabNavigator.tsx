import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
import MatchesScreen from "../screens/MatchesScreen";
import AnnouncementsScreen from "../screens/AnnouncementsScreen";
import MembersScreen from "../screens/MembersScreen";
import ProfileScreen from "../screens/ProfileScreen";
import TeamsScreen from "../screens/TeamsScreen";
import { useAuth } from "../context/AuthContext";

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const { user } = useAuth();

  return (
    <Tab.Navigator screenOptions={{ headerShown: true }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Announcements" component={AnnouncementsScreen} />

      {(user?.role === "ADMIN" || user?.role === "CAPTAIN") && (
        <Tab.Screen name="Members" component={MembersScreen} />
      )}

      {(user?.role === "ADMIN" || user?.role === "CAPTAIN") && (
        <Tab.Screen name="Teams" component={TeamsScreen} />
      )}
    

      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;