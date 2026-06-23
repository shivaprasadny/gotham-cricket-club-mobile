import React, { useCallback, useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { navigationRef } from "./src/navigation/navigationRef";
import {
  NotificationNavigationData,
  openNotificationDestination,
} from "./src/services/notificationNavigationService";
import { chatStompClient } from "./src/chat/stompClient";

const AppContent = () => {
  const { token, loading } = useAuth();
  const authStateRef = useRef({ token, loading });
  const pendingNotificationRef =
    useRef<NotificationNavigationData | null>(null);
  const handledNotificationIdsRef = useRef(new Set<string>());

  authStateRef.current = { token, loading };

  const tryOpenNotification = useCallback(
    async (data: NotificationNavigationData) => {
      const authState = authStateRef.current;

      if (authState.loading || !authState.token || !navigationRef.isReady()) {
        pendingNotificationRef.current = data;
        return;
      }

      pendingNotificationRef.current = null;
      await openNotificationDestination(navigationRef, data);
    },
    []
  );

  const openPendingNotification = useCallback(() => {
    const pendingNotification = pendingNotificationRef.current;

    if (pendingNotification) {
      void tryOpenNotification(pendingNotification);
    }
  }, [tryOpenNotification]);

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const notificationId = response.notification.request.identifier;

      if (handledNotificationIdsRef.current.has(notificationId)) {
        return;
      }

      handledNotificationIdsRef.current.add(notificationId);

      const data = response.notification.request.content
        .data as NotificationNavigationData;
      void tryOpenNotification(data);
    },
    [tryOpenNotification]
  );

  useEffect(() => {
    const subscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        handleNotificationResponse(response);
      });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationResponse(response);
        void Notifications.clearLastNotificationResponseAsync();
      }
    });

    return () => subscription.remove();
  }, [handleNotificationResponse]);

  useEffect(() => {
    openPendingNotification();
  }, [token, loading, openPendingNotification]);

  useEffect(() => {
    if (token) {
      void chatStompClient.connect(token);
    } else {
      void chatStompClient.disconnect();
    }

    return () => {
      if (!token) {
        void chatStompClient.disconnect();
      }
    };
  }, [token]);

  return <AppNavigator onNavigationReady={openPendingNotification} />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
