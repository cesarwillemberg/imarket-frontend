import { Theme } from "@/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    form_wrapper: {
      width: 350,
      padding: theme.spacing.gl,
      borderWidth: theme.size.xs,
      borderRadius: theme.radius.xl,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background_forms,
    },
    register_container: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      color: theme.colors.text,
      marginTop: theme.spacing.md,
    },
    register_prompt_text: {
      fontFamily: "Inter",
      color: theme.colors.text,
      fontSize: theme.fontSizes.md,
      marginRight: theme.spacing.xs,
    },
    register_link: {
      fontFamily: "Inter",
      fontWeight: "bold",
      fontSize: theme.fontSizes.md,
      color: theme.colors.primary,
    },
    divider_text: {
      fontFamily: "Inter",
      fontSize: theme.fontSizes.gl,
      margin: theme.spacing.gl,
      color: theme.colors.text,
    },
    social_login_wrapper: {
      width: 300,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      alignContent: "center",
    },
  });

export default createStyles;
