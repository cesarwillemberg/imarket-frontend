
import { SessionProvider } from "@/src/providers/SessionContext/Index";
import { ThemeProvider } from "@/src/themes/ThemeContext";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
          <Stack.Screen name="signin/index" options={{ headerShown: false }} />
          <Stack.Screen name="signup/index" options={{ headerShown: false }} />
          <Stack.Screen name="confirmemailscreen/index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
      </SessionProvider>



    </ThemeProvider>
  );
}
