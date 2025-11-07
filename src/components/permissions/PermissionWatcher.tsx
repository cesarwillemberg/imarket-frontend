import { useEffect, useCallback, useRef } from "react";
import { AppState } from "react-native";
import { useRouter, usePathname } from "expo-router";

import { useSession } from "@/src/providers/SessionContext/Index";
import { getPendingPermissionRoute } from "@/src/utils/permissions";

/**
 * Listens for app foreground events and ensures location, notification
 * and tracking permissions stay granted for authenticated users.
 */
export default function PermissionWatcher() {
  const { session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isCheckingRef = useRef(false);

  const ensureRequiredPermissions = useCallback(async () => {
    if (!session || isCheckingRef.current) {
      return;
    }

    isCheckingRef.current = true;
    try {
      const pendingRoute = await getPendingPermissionRoute();

      if (pendingRoute && pendingRoute !== pathname) {
        router.replace(pendingRoute);
      }
    } catch (error) {
      console.error("PermissionWatcher: failed to ensure permissions", error);
    } finally {
      isCheckingRef.current = false;
    }
  }, [pathname, router, session]);

  useEffect(() => {
    ensureRequiredPermissions();
  }, [ensureRequiredPermissions]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        ensureRequiredPermissions();
      }
    });

    return () => subscription.remove();
  }, [ensureRequiredPermissions]);

  return null;
}
