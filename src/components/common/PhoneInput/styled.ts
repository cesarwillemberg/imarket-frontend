import { Theme } from "@/src/themes/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    inputContainer: {
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#000', // Borda preta como nos outros inputs
        borderRadius: 0, // Bordas retas como os outros
        height: 43, // Altura padrão dos inputs
    },
    flagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 0,
        borderRightWidth: 1,
        backgroundColor: theme.colors.surface,
        borderRightColor: '#000',
        color: theme.colors.text
    },
    flag: {
        fontSize: 16,
        marginRight: 4,
    },
    callingCode: {
        fontSize: 16,
        color: theme.colors.text,
        fontWeight: '400',
    },
    divider: {
        width: 1,
        height: 20,
        backgroundColor: theme.colors.onPrimary,
    },
    caret: {
        fontSize: 16,
        color: theme.colors.text,
        marginLeft: 4,
    },
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
  });

export default createStyles;
