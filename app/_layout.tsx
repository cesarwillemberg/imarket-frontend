
import { SessionProvider } from "@/providers/SessionContext/Index";
import { ThemeProvider } from "@/themes/ThemeContext";
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
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </SessionProvider>



    </ThemeProvider>
  );
}
