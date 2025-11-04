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
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.md,
      color: theme.colors.text,
      fontWeight: "600",
      marginBottom: theme.spacing.sm,
    },
    optionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      borderWidth: theme.size.xs,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      marginBottom: theme.spacing.md,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    optionCardSelected: {
      borderColor: theme.colors.primary,
      shadowOpacity: 0.12,
    },
    optionCardDisabled: {
      opacity: theme.opacity.disabled,
    },
    optionHeader: {
      flexDirection: "row",
      alignItems: "center",
    },
    optionTitle: {
      flex: 1,
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.md,
      color: theme.colors.text,
      fontWeight: "600",
    },
    badge: {
      backgroundColor: "#E6F8EC",
      borderRadius: theme.radius.full,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.sx,
      marginRight: theme.spacing.sx,
    },
    badgeText: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.xs,
      color: theme.colors.success,
      fontWeight: "700",
    },
    optionIconWrapper: {
      marginLeft: theme.spacing.sx,
    },
    optionDescription: {
      marginTop: theme.spacing.sm,
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.text,
    },
    optionSubtitle: {
      marginTop: theme.spacing.sx,
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.xs,
      color: theme.colors.disabled,
    },
    optionComplement: {
      marginTop: theme.spacing.sx,
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.xs,
      color: theme.colors.text,
    },
    changeAddressButton: {
      alignSelf: "flex-start",
      marginTop: theme.spacing.sm,
      paddingVertical: theme.spacing.sx,
    },
    changeAddressButtonText: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.xs,
      color: theme.colors.primary,
      fontWeight: "600",
      textDecorationLine: "underline",
    },
    storeName: {
      marginTop: theme.spacing.sx,
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.text,
      fontWeight: "600",
    },
    emptyMessage: {
      marginTop: theme.spacing.sm,
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.xs,
      color: theme.colors.disabled,
    },
    loadingWrapper: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.spacing.lg,
    },
    errorText: {
      marginTop: theme.spacing.sm,
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.xs,
      color: theme.colors.danger,
      textAlign: "center",
    },
  });

export default createStyles;
