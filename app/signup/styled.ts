import { Theme } from "@/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    logo_wrapper: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginTop: -50,
    },
    form_wrapper: {
      width: 350,
      padding: theme.spacing.gl,
      borderWidth: theme.size.xs,
      borderRadius: theme.radius.xl,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background_forms,
    },
  });

export default createStyles;
