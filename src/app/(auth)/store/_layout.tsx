import { Stack } from "expo-router";

export default function StoreLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]/index" options={{ headerShown: false }} />
      <Stack.Screen name="products_store" options={{ headerShown: false }} />
    </Stack>
  );
}
