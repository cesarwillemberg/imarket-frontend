import { useTheme } from "@/themes/ThemeContext";
import { Stack } from "expo-router";
import { FC, ReactNode } from "react";
import { StatusBar, View, ViewStyle } from "react-native";
import createStyles from "./Styles";

interface Props {
  children: ReactNode;
  style?: ViewStyle;
}

export const ScreenContainer: FC<Props> = ({ children, style }) => {
  const { currentTheme, theme, switchTheme } = useTheme();
  const styles = createStyles(theme);
  return (
    <>
      <StatusBar
        barStyle={currentTheme === "light" ? "dark-content" : "light-content"}
      />
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
        }}
      />
      <View style={[styles.container, style]}>{children}</View>
    </>
  );
};
