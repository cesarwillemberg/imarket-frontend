import { Theme } from "@/src/themes/ThemeContext";
import { StyleSheet } from "react-native";

export const createCommonStyles = (theme: Theme) =>
  StyleSheet.create({
    centeredContainer: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    growContainer: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    flexContainer: {
      flex: 1,
    },
    paddedContainer: {
      padding: theme.spacing.lg,
    },
  });
