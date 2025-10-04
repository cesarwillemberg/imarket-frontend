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
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    formContainer: {
        flex: 1,
        marginTop: 30,
    },
    formInputs:{
        marginTop: 20
    },
    mapContainer: {
        borderColor: theme.colors.primary,
        borderWidth: 2,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 16,
    },
    input_group: {
        marginBottom: 16,
    },
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    inputHalf: {
        flex: 1,
    },
    checkbox_container: {
        marginTop: 10,
    },
    addressTypeSection: {
        marginVertical: 5,
    },
    addressTypeTitle: {
        color: theme.colors.text,
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    btn_group: {
        marginVertical: 30,
        paddingHorizontal: 0,
    },
    disabledInput: {
        opacity: 0.5,
        backgroundColor: theme.colors.disabled || '#f5f5f5',
    },
});

export default createStyles;