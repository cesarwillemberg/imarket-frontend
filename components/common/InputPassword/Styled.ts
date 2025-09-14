
import { Theme } from "@/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: theme.size.xs,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.surface,
    },
    input: {
      flex: 1,
      borderWidth: theme.size.clear,
      borderRadius: theme.radius.clear,
      paddingVertical: theme.spacing.clear,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
    },
    icon: {
      marginLeft: theme.spacing.sm,
    },
    errorText: {
        color: theme.colors.danger,
        fontSize: 12,
        marginTop: 4,
    },
    errorInput: {
        color: theme.colors.danger,
        fontSize: 12,
        marginTop: 4,
    },
    successInput: {
        color: theme.colors.danger,
        fontSize: 12,
        marginTop: 4,
    },
    successText: {
      color: theme.colors.success,
      fontSize: 12,
      marginTop: 4,
    }
  });

export default createStyles;
