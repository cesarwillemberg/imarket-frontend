
import { Theme } from "@/src/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    tabBar: {
      borderTopWidth: theme.size.xs,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.background
    },
    tabBarItem: {
      bottom: theme.spacing.xl,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primary,
      width: theme.size.md,
      height: theme.size.xxl *  2.4,
    },
    tabBarIcon: {
      marginTop: 15,
    },
    tabBarLabel: {
      color: "#FFFFFF",
    },
  });

export default createStyles;
