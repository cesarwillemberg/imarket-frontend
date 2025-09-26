import { Theme } from "@/src/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    input: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: theme.size.xs,
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      fontSize: theme.fontSizes.md,
      color: theme.colors.text,
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 4,
    },
  });

export default createStyles;
