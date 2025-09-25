import { Theme } from "@/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) => StyleSheet.create({
    icon: {
        width: 150,
        height: 150,
    }
})

export default createStyles;