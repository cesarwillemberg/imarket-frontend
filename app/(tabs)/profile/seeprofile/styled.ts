import { Theme } from "@/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
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
        marginVertical: 1
    },
    text: {
        color: theme.colors.text,
        fontSize: 22,
        marginVertical: 2,
    },
    wrapper_buttons: {  
        marginVertical: 40, 
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