// Versão simplificada do ScreenContainer sem warnings
import { useTheme } from "@/src/themes/ThemeContext";
import Constants from 'expo-constants';
import * as NavigationBar from 'expo-navigation-bar';
import { FC, ReactNode, useEffect, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, StatusBar, ViewStyle } from "react-native";
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
  const isEdgeToEdge = Constants.expoConfig?.android?.edgeToEdgeEnabled;  
  const isAndroid = Platform.OS === "android";     
  const [flexToggle, setFlexToggle] = useState(true);

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener("keyboardDidShow", () => {
      setFlexToggle(false);
    });

    const keyboardHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setFlexToggle(true);
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  useEffect(() => {
      const configureNavBar = async () => {
        try {
          const themeSeted = currentTheme === "light" ? "dark" : "light";

          if (isAndroid) {
            await NavigationBar.setButtonStyleAsync(themeSeted);
            if (!isEdgeToEdge) {
              await NavigationBar.setBackgroundColorAsync(theme.colors.surface);
            }
          }
        } catch (error) {
          console.debug("NavigationBar configuration skipped:", error);
        }
      };

      configureNavBar();
    }, [currentTheme, isEdgeToEdge]);

  return (
      <SafeAreaView 
        style={styles.safe_area_view_wrapper} 
        edges={safeAreaEdges || ['top', "bottom"]}
      >
        <StatusBar
          barStyle={currentTheme === "light" ? "dark-content" : "light-content"}
          {...(isAndroid && !isEdgeToEdge ? { backgroundColor: "transparent", translucent: true } : {})}
          hidden={statusBarHidden}
        />
        <KeyboardAvoidingView
          style={[
            styles.container,
            flexToggle ? { flexGrow: 1 } : { flex: 1 },
            style
          ]}
          behavior={Platform.OS === "ios" ? "padding" : 'height'}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          {children}
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
};
