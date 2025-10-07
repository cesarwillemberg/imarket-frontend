import { Theme } from "@/src/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.background
    },
    scrollContainer: {
        flex: 1,
        // paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.background
    },
});

export default createStyles;