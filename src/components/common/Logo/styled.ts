import { Theme } from "@/src/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    logo_wrapper: {
      alignItems: "center",
      justifyContent: "center",
    },
  });

export default createStyles;
