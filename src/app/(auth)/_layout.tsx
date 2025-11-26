import createStyles from "@/src/assets/styles/tabStyles";
import { Icon } from "@/src/components/common/Icon";
import { useSession } from "@/src/providers/SessionContext/Index";
import { useTheme } from "@/src/themes/ThemeContext";
import { Tabs, useRouter } from "expo-router";
import { useCallback, useRef } from "react";

export default function TabLayout() {
  const { theme } = useTheme();
  const { user, getOrCreateActiveCart } = useSession();
  const styles = createStyles(theme);
  const router = useRouter();
  const storeTabLastPressRef = useRef(0);
  const profileTabLastPressRef = useRef(0);
  const homeTabLastPressRef = useRef(0);
  const productsTabLastPressRef = useRef(0);
  const handleCartTabPress = useCallback(() => {
    if (!user?.id) {
      return;
    }

    getOrCreateActiveCart(user.id).catch((error) => {
      console.error("TabLayout: failed to ensure active cart", error);
    });
  }, [getOrCreateActiveCart, user?.id]);

  const handleStoreTabDoublePress = useCallback(() => {
    const now = Date.now();
    if (now - storeTabLastPressRef.current < 400) {
      router.replace("/(auth)/store");
    }
    storeTabLastPressRef.current = now;
  }, [router]);

  const handleProfileTabDoublePress = useCallback(() => {
    const now = Date.now();
    if (now - profileTabLastPressRef.current < 400) {
      router.replace("/(auth)/profile");
    }
    profileTabLastPressRef.current = now;
  }, [router]);

  const handleHomeTabDoublePress = useCallback(() => {
    const now = Date.now();
    if (now - homeTabLastPressRef.current < 400) {
      router.replace("/(auth)/home");
    }
    homeTabLastPressRef.current = now;
  }, [router]);

  const handleProductsTabDoublePress = useCallback(() => {
    const now = Date.now();
    if (now - productsTabLastPressRef.current < 400) {
      router.replace("/(auth)/products");
    }
    productsTabLastPressRef.current = now;
  }, [router]);

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
        listeners={{
          tabPress: () => {
            handleHomeTabDoublePress();
          },
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
        listeners={{
          tabPress: () => {
            handleStoreTabDoublePress();
          },
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
        listeners={{
          tabPress: () => {
            handleProductsTabDoublePress();
          },
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
        listeners={{
          tabPress: () => {
            handleProfileTabDoublePress();
          },
        }}
      />
    </Tabs>
  );
}
