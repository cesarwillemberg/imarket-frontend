import SplashScreenLoading from "@/src/components/no-auth/splashscreenloading";
import { useSession } from "@/src/providers/SessionContext/Index";
import {
  getPendingPermissionRoute,
  HOME_ROUTE,
} from "@/src/utils/permissions";
import { useRouter } from "expo-router";
import { useCallback, useEffect } from "react";

export default function Index() {
  const router = useRouter();
  const { user, session, isFirstAccess, isLoading } = useSession();

  const handleAuthenticatedNavigation = useCallback(async () => {
    try {
      const pendingRoute = await getPendingPermissionRoute();
      router.replace(pendingRoute ?? HOME_ROUTE);
    } catch (error) {
      console.error("Index: failed to check permissions", error);
      router.replace(HOME_ROUTE);
    }
  }, [router]);

  useEffect(() => {
    // ⚠️ Garante que só roda depois do carregamento inicial
    if (isLoading || isFirstAccess === null) return;

    const timer = setTimeout(() => {
      if (session && user) {
        handleAuthenticatedNavigation();
      } else if (isFirstAccess) {
        router.replace("/onboarding");
      } else {

        router.replace("/signin");
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [handleAuthenticatedNavigation, isFirstAccess, isLoading, session, user]);

  return <SplashScreenLoading />;
}
