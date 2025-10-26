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
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    searchSection: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: theme.spacing.lg,
    },
    searchBar: {
      flex: 1,
    },
    filterButton: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.full,
      borderWidth: theme.size.xs,
      borderColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surface,
      marginLeft: theme.spacing.md,
    },
    loadingWrapper: {
      paddingVertical: theme.spacing.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    productsList: {
      flex: 1,
    },
    listContent: {
      paddingBottom: theme.spacing.xl,
    },
    productCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: theme.size.xs,
      borderColor: theme.colors.primary,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    productImageWrapper: {
      width: 78,
      height: 78,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.secondary,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    productImage: {
      width: "100%",
      height: "100%",
    },
    productFallbackImage: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    productInfo: {
      flex: 1,
    },
    productName: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.md,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    productOriginalPrice: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.disabled,
      textDecorationLine: "line-through",
    },
    productPrice: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.gl,
      color: theme.colors.primary,
      fontWeight: "700",
      marginTop: theme.spacing.xs,
    },
    productPriceUnavailable: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.disabled,
      marginTop: theme.spacing.xs,
    },
    productUnit: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.text,
    },
    productCode: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.xs,
      color: theme.colors.disabled,
      marginTop: theme.spacing.xs,
    },
    productLink: {
      alignSelf: "flex-start",
      paddingHorizontal: theme.spacing.xs,
      marginLeft: theme.spacing.md,
      marginTop: theme.spacing.sm,
    },
    productLinkText: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.primary,
      textDecorationLine: "underline",
    },
    emptyState: {
      paddingVertical: theme.spacing.xl,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyStateText: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.md,
      color: theme.colors.text,
      textAlign: "center",
      marginBottom: theme.spacing.md,
    },
    retryButton: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
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
