import { Theme } from "@/src/themes/ThemeContext";
import { StyleSheet } from "react-native";

export const createCommonStyles = (theme: Theme) =>
  StyleSheet.create({
    // Container centralizado padrão usado em várias telas
    centeredContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    // Container flex padrão
    flexContainer: {
      flex: 1,
    },
    // Container com padding padrão
    paddedContainer: {
      flex: 1,
      padding: theme.spacing.md,
    },
  });
