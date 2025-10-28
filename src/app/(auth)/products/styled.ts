import { Theme } from "@/src/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    searchSection: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    searchBar: {
      flex: 1,
    },
    filterSection: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    filterButton: {
      width: 38,
      height: 38,
      borderRadius: theme.radius.full,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: theme.size.xs,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surface,
    },
    listContent: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
    },
    listSeparator: {
      height: theme.spacing.md,
    },
    card: {
      flexDirection: "row",
      alignItems: "flex-start",
      borderWidth: theme.size.xs,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.md,
      gap: theme.spacing.md,
    },
    cardImageWrapper: {
      width: 88,
      height: 88,
      borderRadius: theme.radius.lg,
      overflow: "hidden",
      borderWidth: theme.size.xs,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    cardImage: {
      width: "100%",
      height: "100%",
    },
    cardImageFallback: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    cardContent: {
      flex: 1,
      gap: theme.spacing.sx,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: theme.spacing.sm,
    },
    cardTitle: {
      flex: 1,
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.md,
      color: theme.colors.text,
      fontWeight: "600",
    },
    cardStore: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.sx,
      color: theme.colors.disabled,
    },
    cardOriginalPrice: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.sx,
      color: theme.colors.disabled,
      textDecorationLine: "line-through",
    },
    cardPrice: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.md,
      color: theme.colors.primary,
      fontWeight: "700",
    },
    cardUnit: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.sx,
      color: theme.colors.text,
    },
    cardUnavailable: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.disabled,
    },
    cardCode: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.sx,
      color: theme.colors.disabled,
    },
    feedbackWrapper: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    feedbackText: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.text,
      textAlign: "center",
    },
    retryButton: {
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.full,
      borderWidth: theme.size.xs,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surface,
    },
    retryButtonText: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.primary,
    },
  });

export default createStyles;
