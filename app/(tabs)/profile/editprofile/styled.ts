import { Theme } from "@/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        paddingVertical: 20
    },
    input_group: {
        marginBottom: theme.spacing.md,
    },
    label: {
        fontFamily: "Inter",
        fontSize: theme.fontSizes.md,
        color: theme.colors.text,
    },
});

export default createStyles;