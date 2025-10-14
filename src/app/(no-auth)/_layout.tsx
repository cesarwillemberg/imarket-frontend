
import { Stack } from "expo-router";

export default function NoAuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
      <Stack.Screen name="signin/index" options={{ headerShown: false }} />
      <Stack.Screen name="signup/index" options={{ headerShown: false }} />
      <Stack.Screen name="forgotpassword/index" options={{ headerShown: false }} />
      <Stack.Screen name="confirmemailscreen/index" options={{ headerShown: false }} />
    </Stack>
  );
}
