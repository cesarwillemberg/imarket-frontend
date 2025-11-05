import { Theme } from "@/src/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    body: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
      gap: theme.spacing.lg,
    },
    pageSubtitle: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.md,
      color: theme.colors.text,
      fontWeight: "600",
    },
    section: {
      gap: theme.spacing.sm,
    },
    sectionTitle: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.disabled,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    optionCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xxl,
      borderWidth: theme.size.xs,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
      gap: theme.spacing.sm,
    },
    optionCardSelected: {
      borderColor: theme.colors.primary,
      shadowOpacity: 0.12,
      elevation: 3,
    },
    optionContent: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: theme.spacing.sm,
    },
    optionIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    optionDetails: {
      flex: 1,
    },
    optionLabel: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.md,
      color: theme.colors.text,
      fontWeight: "600",
    },
    optionDescription: {
      marginTop: theme.spacing.sx,
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.xs,
      color: theme.colors.disabled,
    },
    optionTrailing: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: theme.radius.full,
      borderWidth: theme.size.xs,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primary,
    },
    footer: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.lg,
      backgroundColor: theme.colors.background,
      borderTopWidth: theme.size.xs,
      borderTopColor: theme.colors.border,
    },
    continueButton: {
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      alignItems: "center",
      justifyContent: "center",
    },
    continueButtonDisabled: {
      opacity: theme.opacity.disabled,
    },
    continueButtonText: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.md,
      color: theme.colors.onPrimary,
      fontWeight: "700",
    },
  });

export default createStyles;
