import { Theme } from "@/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    social_button_base: {
      borderRadius: theme.radius.full,
      alignItems: "center",
      justifyContent: "center",
    },
  });

export const getSocialButtonStyle = (pressed: boolean, theme: Theme) => [
  {
    transform: [{ scale: pressed ? 0.9 : 1 }],
    backgroundColor: pressed ? theme.colors.background : "transparent",
  },
];

export default createStyles;
