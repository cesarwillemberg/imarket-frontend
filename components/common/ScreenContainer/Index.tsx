import { useTheme } from "@/themes/ThemeContext";
import * as NavigationBar from "expo-navigation-bar";
import { Stack } from "expo-router";
import { FC, ReactNode, useEffect } from "react";
import { StatusBar, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import createStyles from "./Styles";

type safeAreasType = ('top' | 'bottom' | 'left' | 'right')[];
interface Props {
  children: ReactNode;
  style?: ViewStyle;
  statusBarHidden?: boolean;
  safeAreaEdges?: safeAreasType
}


export const ScreenContainer: FC<Props> = ({ children, style, statusBarHidden, safeAreaEdges }) => {
  const { currentTheme, theme, switchTheme } = useTheme();
  const styles = createStyles(theme);

  useEffect(() => {
    const setNavigationBar = async () => {
      try {
        await NavigationBar.setBackgroundColorAsync(theme.colors.surface, true);
        await NavigationBar.setButtonStyleAsync(currentTheme === "light" ? "dark" : "light");
      } catch (error) {
        console.error("Erro ao configurar a barra de navegação:", error);
      }
    };
    setNavigationBar();
  }, [currentTheme, theme]);
  
  return (
    <>
      <SafeAreaView 
        style={styles.safe_area_view_wrapper} 
        edges={safeAreaEdges || ['top', 'bottom']}
      >
        <StatusBar
            barStyle={currentTheme === 'light' ? 'dark-content' : 'light-content'}
            backgroundColor={theme.colors.background}
            hidden={false}
        />
        <Stack.Screen
          options={{
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.text,
          }}
        />
        <View style={[styles.container, style]}>{children}</View>
      </SafeAreaView>
    </>
  );
};
