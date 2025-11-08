import { Theme } from "@/src/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.xxl + theme.spacing.md,
    },
    header: {
      width: "100%",
      alignItems: "flex-start",
      marginBottom: theme.spacing.xl,
    },
    body: {
      // flex: 1,
      alignItems: "center",
      justifyContent: "flex-start",
      marginVertical: theme.spacing.xl,
      paddingHorizontal: theme.spacing.md,
    },
    title: {
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
    },
    description: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.md,
      color: theme.colors.text,
      textAlign: "justify",
      lineHeight: theme.fontSizes.md * 1.5,
      marginHorizontal: theme.spacing.md,
    },
    email: {
      fontFamily: theme.fonts.regular,
      fontWeight: "bold",
      color: theme.colors.text,
    },
    button: {
      width: "100%",
      borderRadius: theme.radius.xxl,
      // marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
  });

export default createStyles;
