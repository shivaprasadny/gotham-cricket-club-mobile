import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Image, View, Text } from "react-native";
import HomeScreen from "../screens/HomeScreen";
import MatchesScreen from "../screens/MatchesScreen";
import AnnouncementsScreen from "../screens/AnnouncementsScreen";
import MembersScreen from "../screens/MembersScreen";
import ProfileScreen from "../screens/ProfileScreen";
import TeamsScreen from "../screens/TeamsScreen";

const Tab = createBottomTabNavigator();

const HeaderLogo = () => (
  <View style={{ flexDirection: "row", alignItems: "center" }}>
    <Image
      source={require("../../assets/logo.png")}
      style={{ width: 34, height: 34, resizeMode: "contain", marginRight: 10 }}
    />
    <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
      Gotham Cricket Club
    </Text>
  </View>
);

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#4B1D6B",
        },
        headerTintColor: "#fff",
        headerTitle: () => <HeaderLogo />,
        tabBarStyle: {
          backgroundColor: "#4B1D6B",
          borderTopColor: "#5f2d84",
        },
        tabBarActiveTintColor: "#F4B400",
        tabBarInactiveTintColor: "#ddd",
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Announcements" component={AnnouncementsScreen} />
      <Tab.Screen name="Members" component={MembersScreen} />
      <Tab.Screen name="Teams" component={TeamsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;