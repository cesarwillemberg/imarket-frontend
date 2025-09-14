import { Theme } from "@/theme/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    button: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.radius.md,
    },
    text: {
      fontWeight: "bold",
      color: theme.colors.onPrimary,
      fontSize: theme.fontSizes.md,
    },
  });

export default createStyles;
