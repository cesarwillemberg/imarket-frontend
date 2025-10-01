// Versão simplificada do ScreenContainer sem warnings
import { useTheme } from "@/src/themes/ThemeContext";
import Constants from 'expo-constants';
import * as NavigationBar from 'expo-navigation-bar';
import { FC, ReactNode, useEffect } from "react";
import { Platform, StatusBar, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import createStyles from "./styles";

type safeAreasType = ('top' | 'bottom' | 'left' | 'right')[];

interface Props {
  children: ReactNode;
  style?: ViewStyle;
  statusBarHidden?: boolean;
  safeAreaEdges?: safeAreasType;
}

export const ScreenContainer: FC<Props> = ({ 
  children, 
  style, 
  statusBarHidden, 
  safeAreaEdges 
}) => {
  const { currentTheme, theme } = useTheme();
  const styles = createStyles(theme);

  useEffect(() => {
    const configureNavBar = async () => {
      try {
        const isEdgeToEdge = Constants.expoConfig?.android?.edgeToEdgeEnabled;       
        const themeSeted = currentTheme === "light" ? "dark" : "light";

        if (Platform.OS === "android") {
          await NavigationBar.setButtonStyleAsync(themeSeted);
          if (isEdgeToEdge) {
            await NavigationBar.setBackgroundColorAsync("##ffffff00");
          } else {
            await NavigationBar.setBackgroundColorAsync(theme.colors.surface);
          }
        }
      } catch (error) {
        console.debug("NavigationBar configuration skipped:", error);
      }
    };

    configureNavBar();

    const timeout = setTimeout(() => configureNavBar(), 300);

    return () => clearTimeout(timeout);

  }, [currentTheme, theme.colors.surface]);

  return (
      <SafeAreaView 
        style={styles.safe_area_view_wrapper} 
        edges={safeAreaEdges || ['top', "bottom"]}
      >
        <StatusBar
          barStyle={currentTheme === "light" ? "dark-content" : "light-content"}
          // backgroundColor={theme.colors.surface}
          backgroundColor="transparent"
          translucent={true}
          hidden={statusBarHidden}
        />
        <View style={[styles.container, style]}>
          {children}
        </View>
      </SafeAreaView>
  );
};
