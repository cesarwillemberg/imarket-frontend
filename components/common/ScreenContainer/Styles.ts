import { Theme } from "@/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.xl,
      backgroundColor: theme.colors.background,
    },
  });

export default createStyles;
