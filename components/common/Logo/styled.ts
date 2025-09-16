
import { Theme } from "@/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    logo_wrapper: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginTop: -50,
    },
  });

export default createStyles;
