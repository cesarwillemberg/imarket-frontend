import { Theme } from "@/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    input_group: {
      marginBottom: theme.spacing.ms,
    },
    label: {
      fontFamily: "Inter",
      color: theme.colors.text,
      fontSize: theme.fontSizes.sm,
    },
    options_row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: theme.spacing.clear,
      color: theme.colors.text,
    },
    forgot_password_text: {
      fontFamily: "Inter",
      color: theme.colors.primary,
      fontSize: theme.fontSizes.xs,
    },
    submit_button_wrapper: {
      marginTop: theme.spacing.xxl,
    },
    login_button: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.gl,
      borderRadius: theme.radius.lg,
    },

  });

export default createStyles;
