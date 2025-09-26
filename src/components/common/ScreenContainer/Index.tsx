// Versão simplificada do ScreenContainer sem warnings
import { useTheme } from "@/src/themes/ThemeContext";
import Constants from 'expo-constants';
import * as NavigationBar from "expo-navigation-bar";
import { FC, ReactNode, useEffect } from "react";
import { StatusBar, View, ViewStyle } from "react-native";
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
        // Verificar se edge-to-edge está habilitado
        const isEdgeToEdge = Constants.expoConfig?.android?.edgeToEdgeEnabled;
        
        if (isEdgeToEdge) {
          // Com edge-to-edge: apenas configurar estilo dos botões
          await NavigationBar.setButtonStyleAsync(
            currentTheme === "light" ? "dark" : "light"
          );
        } else {
          // Sem edge-to-edge: configuração completa
          await NavigationBar.setButtonStyleAsync(
            currentTheme === "light" ? "dark" : "light"
          );
          await NavigationBar.setBackgroundColorAsync(theme.colors.surface);
        }
      } catch (error) {
        // Silenciosamente ignorar erros de configuração
        console.debug("NavigationBar configuration skipped:", error);
      }
    };

    configureNavBar();
  }, [currentTheme, theme.colors.surface]);

  return (
    <>
      <SafeAreaView 
        style={styles.safe_area_view_wrapper} 
        edges={safeAreaEdges || ['top']}
      >
        <StatusBar
          barStyle={currentTheme === "light" ? "dark-content" : "light-content"}
          backgroundColor={theme.colors.surface}
          hidden={statusBarHidden}
        />
        <View style={[styles.container, style]}>
          {children}
        </View>
      </SafeAreaView>
    </>
  );
};
