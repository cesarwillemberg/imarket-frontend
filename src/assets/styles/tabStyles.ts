
import { Theme } from "@/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    tabBar: {
      borderTopWidth: 3,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.background
    },
    tabBarItem: {
      bottom: 30,
      borderRadius: 50,
      backgroundColor: theme.colors.primary,
      width: 80,
      height: 80,
      justifyContent: "center",
      alignItems: "center",
    },
    tabBarIcon: {
      marginTop: 10,
    },
    tabBarLabel: {
      color: "#FFFFFF",
    },
  });

export default createStyles;
