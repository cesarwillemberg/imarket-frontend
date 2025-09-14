import { Theme } from "@/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    subtitle: {
      fontFamily: "Inter",
      fontWeight: "regular",
      padding: theme.spacing.ms,
      color: theme.colors.text,
      fontSize: theme.fontSizes.md,
    },
  });

export default createStyles;
