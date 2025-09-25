import { Theme } from "@/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safe_area_view_wrapper: { 
      flexGrow: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      // paddingHorizontal: theme.spacing.lg,
      // paddingVertical: theme.spacing.xl,
      backgroundColor: theme.colors.background,
      width: "100%",
      height: "100%"
    },
  });

export default createStyles;
