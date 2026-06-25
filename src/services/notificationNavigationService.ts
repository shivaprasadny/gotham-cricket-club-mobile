import { getEventById } from "./eventService";
import { logger } from "../utils/logger";
import { getChatRooms } from "../chat/chatApi";

export type NotificationNavigationData = {
  type?: string | null;
  targetScreen?: string | null;
  targetId?: number | string | null;
};

type Navigator = {
  navigate: (screen: string, params?: object) => void;
};

const normalize = (value?: string | null) =>
  (value || "").trim().toUpperCase();

const parseTargetId = (targetId?: number | string | null) => {
  if (typeof targetId === "number") {
    return Number.isFinite(targetId) ? targetId : undefined;
  }

  if (typeof targetId === "string" && targetId.trim()) {
    const parsed = Number(targetId);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const openMainTab = (navigation: Navigator, screen: string) => {
  navigation.navigate("MainTabs", { screen });
};

export const openNotificationDestination = async (
  navigation: Navigator,
  data: NotificationNavigationData
) => {
  const targetScreen = normalize(data.targetScreen);
  const type = normalize(data.type);
  const targetId = parseTargetId(data.targetId);

  if (targetScreen === "CHATROOM" || type === "CHAT") {
    if (targetId) {
      try {
        const room = (await getChatRooms()).find((item) => item.id === targetId);
        if (room) {
          navigation.navigate("ChatRoom", { room });
          return;
        }
      } catch (error) {
        logger.log("OPEN CHAT NOTIFICATION ERROR:", error);
      }
    }
    navigation.navigate("ChatList");
    return;
  }

  if (targetScreen === "EVENTS" || type === "EVENT" || type === "EVENT_NOTIFICATION") {
    if (targetId) {
      try {
        const event = await getEventById(targetId);
        navigation.navigate("EventDetails", { event });
        return;
      } catch (error) {
        logger.log("OPEN EVENT NOTIFICATION ERROR:", error);
      }
    }

    navigation.navigate("Events");
    return;
  }

  switch (targetScreen) {
    case "ANNOUNCEMENTDETAILS":
    case "ANNOUNCEMENTS":
      openMainTab(navigation, "Announcements");
      return;

    case "MATCHDETAILS":
      if (targetId) {
        navigation.navigate("MatchDetails", { matchId: targetId });
      } else {
        openMainTab(navigation, "Matches");
      }
      return;

    case "MATCHES":
      openMainTab(navigation, "Matches");
      return;

    case "MYFEES":
      navigation.navigate("MyFees", { feeAssignmentId: targetId });
      return;

    case "MEMBERS":
      navigation.navigate("Members");
      return;

    case "TEAMS":
      navigation.navigate("Teams");
      return;

    case "LEAGUES":
      navigation.navigate("Leagues");
      return;

    case "ADMINAPPROVAL":
      navigation.navigate("AdminApproval");
      return;

    case "SCORECARD":
      if (targetId) {
        navigation.navigate("Scorecard", { matchId: targetId });
      } else {
        openMainTab(navigation, "Matches");
      }
      return;

    case "NOTIFICATIONS":
      navigation.navigate("Notifications");
      return;

    case "PROFILE":
      openMainTab(navigation, "Profile");
      return;

    case "HOME":
      openMainTab(navigation, "Home");
      return;
  }

  switch (type) {
    case "MATCH":
      if (targetId) {
        navigation.navigate("MatchDetails", { matchId: targetId });
      } else {
        openMainTab(navigation, "Matches");
      }
      return;

    case "ANNOUNCEMENT":
      openMainTab(navigation, "Announcements");
      return;

    case "FEE":
      navigation.navigate("MyFees", { feeAssignmentId: targetId });
      return;

    case "TEAM":
      navigation.navigate("Teams");
      return;

    case "LEAGUE":
      navigation.navigate("Leagues");
      return;

    case "MEMBER":
      navigation.navigate("AdminApproval");
      return;

    case "AVAILABILITY":
      openMainTab(navigation, "Matches");
      return;

    case "SCORECARD":
      if (targetId) {
        navigation.navigate("Scorecard", { matchId: targetId });
      } else {
        openMainTab(navigation, "Matches");
      }
      return;

    default:
      openMainTab(navigation, "Home");
  }
};
