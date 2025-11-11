import createStyles from "@/src/assets/styles/tabStyles";
import { Icon } from "@/src/components/common/Icon";
import { useSession } from "@/src/providers/SessionContext/Index";
import { useTheme } from "@/src/themes/ThemeContext";
import { Tabs } from "expo-router";
import { useCallback } from "react";

export default function TabLayout() {
  const { theme } = useTheme();
  const { user, getOrCreateActiveCart } = useSession();
  const styles = createStyles(theme);
  const handleCartTabPress = useCallback(() => {
    if (!user?.id) {
      return;
    }

    getOrCreateActiveCart(user.id).catch((error) => {
      console.error("TabLayout: failed to ensure active cart", error);
    });
  }, [getOrCreateActiveCart, user?.id]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveBackgroundColor: "transparent",
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Início",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Icon type="feather" size={28} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: "Lojas",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Icon
              type="MaterialCommunityIcons"
              size={28}
              name="storefront-outline"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Carrinho",
          headerShown: false,
          tabBarLabel(props) {
            return "";
          },
          listeners: {
            tabPress: () => {
              handleCartTabPress();
            },
          },
          tabBarIcon: ({ color }) => (
            <Icon
              type="MaterialCommunityIcons"
              size={28}
              name="cart-outline"
              color={"#ffffff"}
            />
          ),
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarItemStyle: styles.tabBarItem,
          tabBarIconStyle: styles.tabBarIcon,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Produtos",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Icon type="feather" size={28} name="tag" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Icon type="feather" size={28} name="user" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
