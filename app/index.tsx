import SplashScreenLoading from "@/components/splashscreenloading";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

export default function Index() {
    const router = useRouter();

    const [isFirstAccess, SetIsFirstAccess] = useState(false);

    useEffect(() => {
        setTimeout(() => {
        if (isFirstAccess) {
            // router.push("/onboarding");
        } else {
            router.push("/signin");
        }
        }, 2500)
    })
    
  return <SplashScreenLoading  />
}
