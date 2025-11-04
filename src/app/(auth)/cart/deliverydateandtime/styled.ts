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
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
    },
    sectionHeader: {
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.lg,
      color: theme.colors.text,
      fontWeight: "600",
      marginBottom: theme.spacing.sx,
    },
    addressRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    addressIconWrapper: {
      marginRight: theme.spacing.sx,
    },
    addressText: {
      flex: 1,
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.xs,
      color: theme.colors.disabled,
    },
    card: {
      borderWidth: theme.size.xs,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    cardLabel: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.text,
      fontWeight: "600",
      marginBottom: theme.spacing.sx,
    },
    inputTouchable: {
      marginBottom: theme.spacing.md,
    },
    input: {
      borderColor: theme.colors.primary,
      borderWidth: theme.size.xs,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
      textAlign: "center",
    },
    timeRow: {
      flexDirection: "row",
    },
    timeColumn: {
      flex: 1,
      marginRight: theme.spacing.md,
    },
    timeColumnLast: {
      marginRight: 0,
    },
    footer: {
      borderTopWidth: theme.size.xs,
      borderTopColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
      backgroundColor: theme.colors.background,
    },
    shippingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.md,
    },
    shippingLabel: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.text,
    },
    shippingValue: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.success,
      fontWeight: "700",
    },
    continueButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radius.full,
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
    pickerOverlay: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.spacing.md,
    },
    pickerCard: {
      width: "100%",
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    pickerCloseButton: {
      marginTop: theme.spacing.sm,
      alignSelf: "flex-end",
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.sx,
    },
    pickerCloseText: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.primary,
      fontWeight: "600",
    },
  });

export default createStyles;
