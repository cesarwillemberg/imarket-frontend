import { Theme } from "@/src/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingBottom: theme.spacing.xl,
    },
    scrollContainerCentered: {
      justifyContent: "center",
      alignItems: "center",
    },
    listWrapper: {
      flex: 1,
      paddingTop: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      marginTop: theme.spacing.xl,
      gap: theme.spacing.lg,
    },
    emptyStateTitle: {
      fontSize: theme.fontSizes.gl,
    },
    addressCard: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      gap: theme.spacing.md,
    },
    addressCardActive: {
      borderColor: theme.colors.primary,
    },
    addressInfoRow: {
      flexDirection: "row",
      flex: 1,
      gap: theme.spacing.md,
    },
    addressIconWrapper: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.background_forms,
      borderRadius: theme.radius.full,
      borderColor: theme.colors.primary,
      borderWidth: 2,
      width: 80,
      height: 80,
      overflow: "hidden",
    },
    addressDetails: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    addressTitle: {
      marginBottom: 0,
      padding: 0,
      textTransform: "capitalize",
    },
    addressLine: {
      color: theme.colors.text,
    },
    addressMeta: {
      color: theme.colors.text,
      fontSize: theme.fontSizes.sm,
    },
    hidden: {
      display: "none",
    },
    addressActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    actionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      gap: theme.spacing.sm,
    },
    actionButtonDisabled: {
      opacity: theme.opacity.disabled,
    },
    deleteButton: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}1A`,
    },
    deleteButtonText: {
      color: theme.colors.primary,
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.md,
    },
    deleteButtonTextDisabled: {
      color: theme.colors.disabled,
    },
    editButton: {
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background_forms,
    },
    editButtonText: {
      color: theme.colors.text,
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.md,
    },
    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.full,
      gap: theme.spacing.sm,
    },
    primaryButtonDisabled: {
      backgroundColor: theme.colors.border,
    },
    primaryButtonText: {
      color: theme.colors.onPrimary,
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.md,
    },
    primaryButtonTextDisabled: {
      color: theme.colors.disabled,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "flex-end",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
      gap: theme.spacing.lg,
    },
    modalTitle: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.lg,
      color: theme.colors.text,
      textAlign: "center",
    },
    modalActionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: theme.spacing.md,
    },
    confirmOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.35)",
      paddingHorizontal: theme.spacing.lg,
    },
    confirmBackdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    confirmContainer: {
      width: "100%",
      maxWidth: 320,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      paddingVertical: theme.spacing.xl,
      paddingHorizontal: theme.spacing.lg,
      alignItems: "center",
      gap: theme.spacing.lg,
      elevation: 6,
      shadowColor: theme.colors.shadow,
    },
    confirmTitle: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.lg,
      color: theme.colors.text,
      textAlign: "center",
    },
    confirmActions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.md,
    },
    confirmPrimaryButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    confirmPrimaryText: {
      color: theme.colors.onPrimary,
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.md,
    },
    confirmSecondaryButton: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.full,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background_forms,
    },
    confirmSecondaryText: {
      color: theme.colors.text,
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.md,
    },
    confirmButtonDisabled: {
      opacity: theme.opacity.disabled,
    },
  });

export default createStyles;
