import { Theme } from "@/src/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>  
    StyleSheet.create({
    container: {
        width: "100%",
        marginVertical: 6
    },
    link_wrapper: {
        width: "100%"
    },
    button_wrapper: { 
        flexDirection: "row", 
        width: "100%", 
        justifyContent: "space-between",
        alignItems: "center"
    },
    icon_title_wrapper: { 
        flexDirection: "row", 
        alignItems: "center"
    },
    title: {
        fontFamily: "Inter",
        color: theme.colors.text, 
        fontSize: 18, 
        marginLeft: 10
    }

})

export default createStyles;