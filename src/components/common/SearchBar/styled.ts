import { Theme } from "@/src/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.full,
      borderWidth: theme.size.xs,
      borderColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    iconWrapper: {
      marginRight: theme.spacing.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    input: {
      flex: 1,
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.md,
      color: theme.colors.text,
      paddingVertical: 0,
    },
  });

export default createStyles;
