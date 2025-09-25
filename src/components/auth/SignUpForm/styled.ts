import { Theme } from "@/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    input_group: {
      marginBottom: theme.spacing.md,
    },
    label: {
      fontFamily: "Inter",
      fontSize: theme.fontSizes.md,
      color: theme.colors.text,
    },
    options_row: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: theme.spacing.clear,
    },
    container_checkbox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    checkbox: {
      marginRight: theme.spacing.xs,
    },
    terms_of_use: {
      color: theme.colors.primary,
      fontFamily: "Inter",
      fontSize: theme.fontSizes.xs,
      margin: theme.spacing.clear,
      padding: theme.spacing.clear,
    },
    submit_button_wrapper: {
      marginVertical: theme.spacing.xl,
    },
    login_button: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.gl,
      borderRadius: theme.radius.lg,
    },
  });

export default createStyles;
