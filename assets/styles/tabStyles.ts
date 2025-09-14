import { Theme } from "@/theme/ThemeContext";
import { StyleSheet } from "react-native";

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    tabBar: {
      height: 90,
      borderColor: "#FB0202",
      borderTopWidth: 3,
    },
    tabBarItem: {
      borderRadius: 50,
      backgroundColor: "#FB0202",
      width: 60,
      height: 80,
      marginVertical: -25,
      justifyContent: "center",
      alignItems: "center",
    },
    tabBarIcon: {
      marginTop: 10,
    },
    tabBarLabel: {
      color: "#FFFFFF",
    },
  });

export default createStyles;
