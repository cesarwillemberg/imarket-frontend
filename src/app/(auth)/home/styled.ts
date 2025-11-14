import { Theme } from "@/src/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: theme.spacing.lg,
    },
    searchBar: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    notificationButton: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.full,
      borderWidth: theme.size.xs,
      borderColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      backgroundColor: theme.colors.surface,
    },
    notificationBadge: {
      position: "absolute",
      top: -4,
      right: -2,
      minWidth: 18,
      height: 18,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.spacing.sx,
    },
    notificationText: {
      color: theme.colors.onPrimary,
      fontSize: theme.fontSizes.xs,
      fontWeight: "600",
    },
    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.danger,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      marginBottom: theme.spacing.lg,
    },
    errorText: {
      flex: 1,
      marginLeft: theme.spacing.sm,
      color: theme.colors.onPrimary,
      fontSize: theme.fontSizes.sm,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: theme.fontSizes.gl,
      fontWeight: "600",
      color: theme.colors.primary,
    },
    promotionCard: {
      flexDirection: "row",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.primary,
      borderWidth: 1,
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.md,
      marginTop: theme.spacing.md,
    },
    promotionImageWrapper: {
      width: 90,
      height: 90,
      borderRadius: theme.radius.lg,
      overflow: "hidden",
      marginRight: theme.spacing.md,
    },
    promotionImage: {
      width: "100%",
      height: "100%",
    },
    imageFallback: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.sm,
    },
    promotionInfo: {
      flex: 1,
      justifyContent: "space-between",
    },
    promotionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: theme.spacing.xs,
    },
    promotionName: {
      flex: 1,
      fontSize: theme.fontSizes.md,
      fontWeight: "600",
      color: theme.colors.text,
      marginRight: theme.spacing.sm,
    },
    productSeller: {
      fontSize: theme.fontSizes.sm,
      color: theme.colors.text,
      marginBottom: theme.spacing.sx,
    },
    originalPrice: {
      color: theme.colors.disabled,
      fontSize: theme.fontSizes.sm,
      textDecorationLine: "line-through",
    },
    currentPrice: {
      color: theme.colors.primary,
      fontSize: theme.fontSizes.gl,
      fontWeight: "600",
      marginTop: theme.spacing.sx,
    },
    unitLabel: {
      fontSize: theme.fontSizes.sm,
      color: theme.colors.text,
    },
    unavailablePrice: {
      fontSize: theme.fontSizes.sm,
      color: theme.colors.disabled,
      marginTop: theme.spacing.sx,
    },
    productCode: {
      marginTop: theme.spacing.sx,
      fontSize: theme.fontSizes.xs,
      color: theme.colors.text,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginBottom: theme.spacing.xl,
    },
    storeCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.primary,
      borderWidth: 1,
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.md,
      marginTop: theme.spacing.md,
    },
    storeLogoWrapper: {
      width: 54,
      height: 54,
      borderRadius: theme.radius.full,
      overflow: "hidden",
      marginRight: theme.spacing.md,
    },
    storeLogo: {
      width: "100%",
      height: "100%",
    },
    logoFallback: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.secondary,
    },
    logoFallbackText: {
      fontSize: theme.fontSizes.lg,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    storeContent: {
      flex: 1,
    },
    storeName: {
      fontSize: theme.fontSizes.gl,
      fontWeight: "600",
      color: theme.colors.text,
    },
    storeMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: theme.spacing.xs,
    },
    storeRating: {
      marginLeft: theme.spacing.sx,
      fontWeight: "600",
      color: theme.colors.text,
    },
    storeDot: {
      marginHorizontal: theme.spacing.sx,
      color: theme.colors.disabled,
    },
    storeCategory: {
      fontSize: theme.fontSizes.sm,
      color: theme.colors.text,
    },
    storeDistance: {
      fontSize: theme.fontSizes.sm,
      color: theme.colors.text,
    },
    storeCity: {
      marginTop: theme.spacing.xs,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.disabled,
    },
    storeBadge: {
      marginTop: theme.spacing.sm,
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.sx,
      borderRadius: theme.radius.lg,
    },
    storeBadgeText: {
      fontSize: theme.fontSizes.xs,
      color: theme.colors.primary,
    },
    suggestionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginTop: theme.spacing.md,
    },
    suggestionCard: {
      width: "30%",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    suggestionImageWrapper: {
      height: 80,
      alignItems: "center",
      justifyContent: "center",
    },
    suggestionImage: {
      width: "100%",
      height: "100%",
    },
    suggestionName: {
      marginTop: theme.spacing.sm,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.text,
    },
    suggestionPrice: {
      marginTop: theme.spacing.sx,
      fontSize: theme.fontSizes.sm,
      fontWeight: "600",
      color: theme.colors.primary,
    },
    emptyText: {
      marginTop: theme.spacing.md,
      color: theme.colors.disabled,
      fontSize: theme.fontSizes.sm,
    },
    loadingText: {
      marginTop: theme.spacing.sm,
      color: theme.colors.text,
      fontSize: theme.fontSizes.sm,
    },
  });

export default createStyles;

