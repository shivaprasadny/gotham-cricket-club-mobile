import { createNavigationContainerRef } from "@react-navigation/native";

// Global navigation reference
// This lets us navigate from notification listener outside screens
export const navigationRef = createNavigationContainerRef<any>();

// Safe navigate helper
export const navigate = (name: string, params?: any) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
};