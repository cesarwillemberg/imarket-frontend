
import { Stack } from "expo-router";

export default function PermissionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="permissionlocation/index" options={{ headerShown: false }} />
      <Stack.Screen name="permissionnotification/index" options={{ headerShown: false }} />
      <Stack.Screen name="permissionacrossapp/index" options={{ headerShown: false }} />
    </Stack>
  );
}
