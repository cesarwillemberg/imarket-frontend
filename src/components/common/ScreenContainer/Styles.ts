import { Theme } from "@/src/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safe_area_view_wrapper: { 
      flexGrow: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      // flex: 1,
      backgroundColor: theme.colors.background,
    },
  });

export default createStyles;
