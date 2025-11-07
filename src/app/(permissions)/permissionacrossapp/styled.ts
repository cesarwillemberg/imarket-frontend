import { Theme } from "@/src/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.xxl,
      justifyContent: "center",
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      paddingVertical: theme.spacing.xxl,
      paddingHorizontal: theme.spacing.xl,
      alignItems: "center",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    },
    illustrationWrapper: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.xl,
    },
    textBlock: {
      width: "100%",
      alignItems: "center",
    },
    title: {
      fontSize: theme.fontSizes.xl,
      textTransform: "uppercase",
      textAlign: "center",
      marginBottom: theme.spacing.sm,
    },
    description: {
      fontSize: theme.fontSizes.md,
      color: theme.colors.text,
      opacity: 0.7,
      textAlign: "center",
    },
    permissionButton: {
      marginTop: theme.spacing.xxl,
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xxl,
      borderRadius: theme.radius.full,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    buttonText: {
      color: theme.colors.onPrimary,
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.md,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginRight: theme.spacing.sm,
    },
    helperText: {
      marginTop: theme.spacing.lg,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.text,
      opacity: 0.6,
      textAlign: "center",
    },
    skipButton: {
      marginTop: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
    },
    skipButtonText: {
      color: theme.colors.primary,
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.sm,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
  });

export default createStyles;
