import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { isRegisteredForRemoteNotificationsAsync } from "expo-notifications";
import { getTrackingPermissionsAsync } from "expo-tracking-transparency";

export const LOCATION_PERMISSION_ROUTE = "/(permissions)/permissionlocation";
export const NOTIFICATION_PERMISSION_ROUTE =
  "/(permissions)/permissionnotifications";
export const TRACKING_PERMISSION_ROUTE =
  "/(permissions)/permissionacrossapp";
export const HOME_ROUTE = "/(auth)/home";

type PermissionType = "location" | "notification" | "tracking";

const PERMISSION_DISMISSAL_KEYS: Record<PermissionType, string> = {
  location: "@permissions/locationDismissed",
  notification: "@permissions/notificationDismissed",
  tracking: "@permissions/trackingDismissed",
};

async function hasDismissedPermission(
  permission: PermissionType
): Promise<boolean> {
  const value = await AsyncStorage.getItem(
    PERMISSION_DISMISSAL_KEYS[permission]
  );
  return value === "1";
}

async function clearDismissedPermission(permission: PermissionType) {
  await AsyncStorage.removeItem(PERMISSION_DISMISSAL_KEYS[permission]);
}

export async function skipPermissionRequest(permission: PermissionType) {
  await AsyncStorage.setItem(PERMISSION_DISMISSAL_KEYS[permission], "1");
}

export async function getPendingPermissionRoute(): Promise<string | null> {
  const locationPermission = await Location.getForegroundPermissionsAsync();
  if (locationPermission.status === "granted") {
    await clearDismissedPermission("location");
  } else if (!(await hasDismissedPermission("location"))) {
    return LOCATION_PERMISSION_ROUTE;
  }

  const notificationPermission = await Notifications.getPermissionsAsync();
  const notificationDismissed = await hasDismissedPermission("notification");
  if (notificationPermission.status === Notifications.PermissionStatus.GRANTED) {
    await clearDismissedPermission("notification");
  } else if (!notificationDismissed) {
    return NOTIFICATION_PERMISSION_ROUTE;
  }
  if (typeof isRegisteredForRemoteNotificationsAsync === "function") {
    const isRegisteredForNotifications =
      await isRegisteredForRemoteNotificationsAsync();
    if (!isRegisteredForNotifications && !notificationDismissed) {
      return NOTIFICATION_PERMISSION_ROUTE;
    }
  }

  const trackingPermission = await getTrackingPermissionsAsync();
  if (trackingPermission.status === "granted") {
    await clearDismissedPermission("tracking");
  } else if (!(await hasDismissedPermission("tracking"))) {
    return TRACKING_PERMISSION_ROUTE;
  }

  return null;
}
