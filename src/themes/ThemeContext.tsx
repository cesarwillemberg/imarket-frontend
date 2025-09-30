import * as SystemUI from "expo-system-ui";
import { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import darkTheme from "./dark-theme";
import lightTheme from "./light-theme";

export type Theme = typeof lightTheme;

interface ThemeContextProps {
  currentTheme: "light" | "dark";
  theme: Theme;
  switchTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemTheme = useColorScheme();
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(
    systemTheme === "light" ? "light" : "dark"
  );

  useEffect(() => {
    if (systemTheme) {
      setCurrentTheme(systemTheme);
    }
  }, [systemTheme]);

  const themes: Record<"light" | "dark", Theme> = {
    light: lightTheme,
    dark: darkTheme,
  };

  const theme = themes[currentTheme];

  const switchTheme = () => {
    setCurrentTheme((current) => (current === "light" ? "dark" : "light"));
  };

  // Keep the Android system background aligned with our theme, important for edge-to-edge
  useEffect(() => {
    // This sets the window background used behind system bars/gestures
    SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => {});
  }, [theme.colors.background]);

  return (
    <ThemeContext.Provider value={{ currentTheme, theme, switchTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
