import { Theme } from "@/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        paddingVertical: 5,
        paddingHorizontal: theme.spacing.md,
    },
    label_infos: { 
        color: theme.colors.text, 
        fontFamily: "Inter" 
    },
    wrapper_informations: {
        borderColor: theme.colors.border,
        borderTopWidth: 2,
        borderBottomWidth: 2,
        backgroundColor: theme.colors.background_forms
    },
    info_wrapper: {
        padding: 10
    },
    label: {
        color: theme.colors.text,
        fontSize: 15,
    },
    text: {
        color: theme.colors.text,
        fontSize: 22,
    },
    wrapper_buttons: {  
        marginVertical: 30, 
    },
    wrapper_buttons_address_payments: {
        flexDirection: "row", 
        alignItems: "center",
        justifyContent: "space-between",
        alignContent: "center", 
        width: "100%"
    },
    wrapper_button_edit_profile:{ 
        marginVertical: 30
    },
});

export default createStyles;