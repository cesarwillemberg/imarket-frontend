import { Theme } from "@/src/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        position: "absolute",
        right: theme.spacing.xl,
        bottom: theme.spacing.xl + theme.spacing.md,
        alignItems: "center",
    },
    buttonOption: {
        padding: 15,
        borderRadius: 50,
        width: 160,
        bottom: -20,
        left: 18,
        flexDirection: "row",
        alignItems: "center",
    },
    optionText: {
        marginLeft: 8,
        color: "white",
    },
    fab: {
        width: 70,
        height: 70,
        borderRadius: 100,
        bottom: -20,
        left: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.primary
    },
    animatedWrapper: {
        position: "absolute",
        right: 0,
    },
})

export default createStyles;
