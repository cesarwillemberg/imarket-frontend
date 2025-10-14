import { Theme } from "@/src/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    form_wrapper: {
      padding: theme.spacing.gl,
      borderWidth: theme.size.xs,
      borderRadius: theme.radius.xl,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background_forms,
    },
  });

export default createStyles;
