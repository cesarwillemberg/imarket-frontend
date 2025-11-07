import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { getTrackingPermissionsAsync } from "expo-tracking-transparency";

export const LOCATION_PERMISSION_ROUTE = "/(permissions)/permissionlocation";
export const NOTIFICATION_PERMISSION_ROUTE =
  "/(permissions)/permissionnotifications";
export const TRACKING_PERMISSION_ROUTE =
  "/(permissions)/permissionacrossapp";
export const HOME_ROUTE = "/(auth)/home";

export async function getPendingPermissionRoute(): Promise<string | null> {
  const locationPermission = await Location.getForegroundPermissionsAsync();
  if (locationPermission.status !== "granted") {
    return LOCATION_PERMISSION_ROUTE;
  }

  const notificationPermission = await Notifications.getPermissionsAsync();
  if (
    notificationPermission.status !== Notifications.PermissionStatus.GRANTED
  ) {
    return NOTIFICATION_PERMISSION_ROUTE;
  }

  const trackingPermission = await getTrackingPermissionsAsync();
  if (trackingPermission.status !== "granted") {
    return TRACKING_PERMISSION_ROUTE;
  }

  return null;
}
