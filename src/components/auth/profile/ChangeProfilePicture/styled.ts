import { Theme } from "@/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        flexGrow: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: theme.colors.background_forms,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 20,
        width: '100%',
        alignItems: 'center',
    },
    optionButton: {
        paddingVertical: 12,
        borderRadius: 10,
        marginVertical: 8,
        width: '100%',
        alignItems: 'center',
    },
})

export default createStyles;