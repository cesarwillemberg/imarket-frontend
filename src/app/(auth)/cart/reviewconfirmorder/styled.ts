import { Theme } from "@/src/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
    },
    sectionIntroTitle: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.lg,
      fontWeight: "600",
      color: theme.colors.text,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    summaryCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: theme.size.xs,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: theme.spacing.sm,
    },
    summaryLabel: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.text,
    },
    summaryValue: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.text,
      fontWeight: "600",
    },
    summaryValueFree: {
      color: theme.colors.success,
    },
    summaryDivider: {
      height: theme.size.xs,
      backgroundColor: theme.colors.border,
      marginVertical: theme.spacing.sm,
    },
    summaryHighlightLabel: {
      fontSize: theme.fontSizes.md,
      fontWeight: "700",
    },
    summaryHighlightValue: {
      fontSize: theme.fontSizes.md,
      fontWeight: "700",
      color: theme.colors.text,
    },
    summarySubValue: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.xs,
      color: theme.colors.disabled,
      marginTop: theme.spacing.sx,
    },
    sectionWrapper: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.disabled,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: theme.spacing.sm,
    },
    infoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: theme.size.xs,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    infoIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.secondary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: theme.spacing.sm,
    },
    infoContent: {
      flex: 1,
    },
    infoPrimaryText: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.md,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: theme.spacing.sx,
    },
    infoSecondaryText: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.xs,
      color: theme.colors.disabled,
      marginBottom: theme.spacing.sx,
    },
    infoSecondaryTextLast: {
      marginBottom: 0,
    },
    infoActionButton: {
      marginTop: theme.spacing.md,
      borderTopWidth: theme.size.xs,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.sm,
      flexDirection: "row",
      alignItems: "center",
    },
    infoActionText: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.primary,
      fontWeight: "600",
    },
    infoActionTextDisabled: {
      color: theme.colors.disabled,
    },
    infoActionChevron: {
      marginLeft: theme.spacing.sx,
    },
    footer: {
      borderTopWidth: theme.size.xs,
      borderTopColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
      backgroundColor: theme.colors.surface,
    },
    totalRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.md,
    },
    totalLabel: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.gl,
      color: theme.colors.text,
      fontWeight: "600",
    },
    totalValue: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.gl,
      color: theme.colors.text,
      fontWeight: "700",
    },
    confirmButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radius.full,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: theme.spacing.md,
    },
    confirmButtonDisabled: {
      opacity: theme.opacity.disabled,
    },
    confirmButtonText: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.md,
      color: theme.colors.onPrimary,
      fontWeight: "700",
    },
  });

export default createStyles;
