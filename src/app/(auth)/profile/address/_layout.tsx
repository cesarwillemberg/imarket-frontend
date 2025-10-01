import { Stack } from "expo-router";

export default function AddressLayout() {
  return (
    <Stack
        screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="selectaddress/index" options={{ headerShown: false }} />
    </Stack>
  );
}
