
import { Theme } from "@/src/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container_checkbox: {
      flexDirection: "row",
      alignItems: "center",
    },
    checkbox: {
      marginRight: theme.spacing.xs,
    },
    stay_conected: {
      fontFamily: "Inter",
      fontSize: theme.fontSizes.xs,
      color: theme.colors.text,
    },
  });

export default createStyles;
