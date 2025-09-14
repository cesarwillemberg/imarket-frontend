
import { Theme } from "@/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    tabBar: {
      height: 90,
      borderTopWidth: 3,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.background
    },
    tabBarItem: {
      borderRadius: 50,
      backgroundColor: "#FB0202",
      width: 60,
      height: 80,
      marginVertical: -25,
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
