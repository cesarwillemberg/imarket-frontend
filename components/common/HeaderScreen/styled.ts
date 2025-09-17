import { Theme } from "@/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
    },
    wrapper_back_button: { 
        width: 50, 
        alignItems: "flex-start" 
    },
    wrapper_title: { 
        flex: 1, 
        alignItems: "center" 
    },
    title: {
        fontSize: 26,
        fontFamily: "Inter",
        color: theme.colors.text,
    },
    wrapper: { width: 50 }
  });

export default createStyles;
