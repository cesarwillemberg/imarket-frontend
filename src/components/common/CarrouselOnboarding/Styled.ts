import { Theme } from "@/theme/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.background,
    },
    slide: {
      justifyContent: "center",
      alignItems: "center",
      padding: theme.spacing.gl,
    },
    title: {
      fontWeight: "bold",
      textAlign: "center",
      fontSize: theme.fontSizes.xl,
      color: theme.colors.text,
      marginVertical: theme.spacing.ms,
    },
    description: {
      textAlign: "center",
      fontSize: theme.fontSizes.md,
      color: theme.colors.text,
      marginBottom: theme.spacing.gl,
    },
    dotsContainer: {
      flexDirection: "row",
      marginTop: -100,
    },
    dot: {
      width: theme.size.lg,
      height: theme.size.lg,
      borderRadius: theme.radius.sm,
      backgroundColor: theme.colors.secondary,
      marginHorizontal: theme.spacing.xs,
    },
    activeDot: {
      backgroundColor: theme.colors.primary,
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "80%",
      marginBottom: theme.spacing.gl,
    },
    skipButton: {
      display: "flex",
      justifyContent: "center",
      alignContent: "center",
      alignItems: "center",
      padding: theme.spacing.md,
    },
    skipText: {
      color: theme.colors.text,
      fontSize: theme.fontSizes.md,
    },
    nextButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.gl,
      borderRadius: theme.radius.md,
    },
    nextText: {
      color: theme.colors.onPrimary,
      fontSize: theme.fontSizes.md,
    },
    getStartedButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.gl,
      borderRadius: theme.radius.lg,
    },
    getStartedText: {
      fontWeight: "bold",
      color: theme.colors.onPrimary,
      fontSize: theme.fontSizes.md,
    },
  });

export default createStyles;
