import { Theme } from "@/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    title: {
      fontFamily: "Inter",
      fontWeight: "bold",
      color: theme.colors.text,
      fontSize: theme.fontSizes.xl,
      marginBottom: theme.spacing.md,
    },
  });

export default createStyles;
