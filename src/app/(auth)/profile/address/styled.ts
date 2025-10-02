import { Theme } from "@/src/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        /* justifyContent: "center",
        alignItems: "center", */
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.success
    },
});

export default createStyles;