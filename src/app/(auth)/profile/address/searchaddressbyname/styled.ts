import { Theme } from "@/src/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        flexGrow: 1,
    },
    contentWrapper: {
        flexGrow: 1,
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
    },
    mainContent: {
        flexGrow: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.primary,
        borderWidth: theme.size.xs,
        borderRadius: theme.radius.full,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },
    searchIconWrapper: {
        marginRight: theme.spacing.sm,
    },
    searchInput: {
        flex: 1,
        color: theme.colors.text,
        fontSize: theme.fontSizes.md,
    },
    searchSpinner: {
        marginLeft: theme.spacing.sm,
    },
    resultsContainer: {
        marginTop: theme.spacing.lg,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        borderBottomWidth: theme.size.xs,
        borderBottomColor: theme.colors.border,
    },
    resultItemLast: {
        borderBottomWidth: 0,
    },
    resultIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.full,
        borderWidth: theme.size.xs,
        borderColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
        backgroundColor: theme.colors.surface,
    },
    resultTextContainer: {
        flex: 1,
    },
    resultTitle: {
        fontSize: theme.fontSizes.md,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    resultSubtitle: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.disabled,
    },
    emptyState: {
        marginTop: theme.spacing.xl,
        alignItems: 'center',
        paddingHorizontal: theme.spacing.sm,
    },
    emptyStateText: {
        textAlign: 'center',
        color: theme.colors.disabled,
        fontSize: theme.fontSizes.sm,
    },
    errorText: {
        marginTop: theme.spacing.lg,
        color: theme.colors.danger,
        textAlign: 'center',
        fontSize: theme.fontSizes.sm,
    },
    footer: {
        alignItems: 'center',
        marginTop: theme.spacing.xl,
    },
    footerText: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text,
    },
    footerLink: {
        marginTop: theme.spacing.xs,
        fontSize: theme.fontSizes.sm,
        color: theme.colors.primary,
        fontWeight: '600',
    },
});

export default createStyles;
