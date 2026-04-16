import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import MainTabNavigator from "./MainTabNavigator";

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: "#4B1D6B",
        },
        drawerActiveTintColor: "#F4B400",
        drawerInactiveTintColor: "#fff",
      }}
    >
      <Drawer.Screen
        name="Home"
        component={MainTabNavigator}
        options={{ title: "Gotham Club" }}
      />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;