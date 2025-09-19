import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="viewprofile/index" options={{ headerShown: false }} />
      <Stack.Screen name="chats/index" options={{ headerShown: false }} />
      <Stack.Screen name="notifications/index" options={{ headerShown: false }} />
      <Stack.Screen name="payments/index" options={{ headerShown: false }} />
      <Stack.Screen name="address/index" options={{ headerShown: false }} />
    </Stack>
  );
}
