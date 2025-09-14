import SplashScreenLoading from "@/components/splashscreenloading";
import { useSession } from "@/providers/SessionContext/Index";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function Index() {
  const router = useRouter();
  const { user, session, isFirstAccess, isLoading } = useSession();

  useEffect(() => {
    // ⚠️ Garante que só roda depois do carregamento inicial
    if (isLoading || isFirstAccess === null) return;

    const timer = setTimeout(() => {
      if (session && user) {
        router.replace("/(tabs)/home");
      } else if (isFirstAccess) {
        router.replace("/onboarding");
      } else {

        router.replace("/signin");
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [isFirstAccess, isLoading, session, user]);

  return <SplashScreenLoading />;
}
