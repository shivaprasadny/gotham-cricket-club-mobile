import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Image, Platform, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const tabIcon =
  (active: IoniconsName, inactive: IoniconsName) =>
  ({ color, size, focused }: { color: string; size: number; focused: boolean }) =>
    <Ionicons name={focused ? active : inactive} size={size} color={color} />;

const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const androidBottom = insets.bottom + 8;
  const tabHeight = Platform.OS === "android" ? 56 + androidBottom : 84;

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#4B1D6B",
        },
        headerTintColor: "#fff",
        headerTitle: () => <HeaderLogo />,
        tabBarStyle: {
          backgroundColor: "#2b0540",
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          height: tabHeight,
          paddingBottom: Platform.OS === "android" ? androidBottom : 28,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#F4B400",
        tabBarInactiveTintColor: "#9d7bb5",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: tabIcon("home", "home-outline") }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{ tabBarIcon: tabIcon("trophy", "trophy-outline") }}
      />
      <Tab.Screen
        name="Announcements"
        component={AnnouncementsScreen}
        options={{
          tabBarLabel: "News",
          tabBarIcon: tabIcon("megaphone", "megaphone-outline"),
        }}
      />
      {/* <Tab.Screen name="Members" component={MembersScreen} />
      <Tab.Screen name="Teams" component={TeamsScreen} /> */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: tabIcon("person-circle", "person-circle-outline") }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;