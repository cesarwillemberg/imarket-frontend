import { Theme } from "@/src/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) => StyleSheet.create({
    requiredIndicator: {
        color: theme.colors.danger || 'red',
        fontSize: 16,
    },
    inputLabel: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        fontFamily: 'Inter',
    },
})

export default createStyles;