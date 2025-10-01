import { Theme } from "@/src/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safe_area_view_wrapper: { 
      flex: 1,
      backgroundColor: theme.colors.background,
      // backgroundColor: "red",
    },
    container: {
      flex: 1,
      // paddingHorizontal: theme.spacing.lg,
      // paddingVertical: theme.spacing.xl,
      backgroundColor: theme.colors.background,
    },
  });

export default createStyles;
