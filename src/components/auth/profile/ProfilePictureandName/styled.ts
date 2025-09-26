import { Theme } from "@/src/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>  
    StyleSheet.create({
        wrapper: {
            alignItems: "center", 
            // justifyContent: "center", 
            // flexDirection: "row", 
            // marginVertical: 30
        },
        img: {
            width: 120, 
            height: 120, 
            borderRadius: 999, 
            borderWidth: 2,
            resizeMode: "cover",
            borderColor: theme.colors.primary
        },
        title: {
            marginLeft: 10, 
            fontSize: theme.fontSizes.lg
        }
    })

export default createStyles;