// Utilitário para gerenciar navegação de forma compatível com edge-to-edge
import Constants from 'expo-constants';
import * as NavigationBar from "expo-navigation-bar";

interface NavigationBarConfig {
  currentTheme: 'light' | 'dark';
  surfaceColor?: string;
}

export const configureNavigationBar = async ({ currentTheme, surfaceColor }: NavigationBarConfig) => {
  try {
    // Verificar se edge-to-edge está habilitado no app.json
    const isEdgeToEdgeEnabled = Constants.expoConfig?.android?.edgeToEdgeEnabled;
    
    if (isEdgeToEdgeEnabled) {
      // Com edge-to-edge, só podemos definir o estilo dos botões
      await NavigationBar.setButtonStyleAsync(currentTheme === "light" ? "dark" : "light");
    } else {
      // Sem edge-to-edge, podemos usar todas as APIs normalmente
      await NavigationBar.setButtonStyleAsync(currentTheme === "light" ? "dark" : "light");
      if (surfaceColor) {
        await NavigationBar.setBackgroundColorAsync(surfaceColor);
      }
    }
    
  } catch (error) {
    // Use console.warn para não poluir os logs com erros esperados
    console.warn("Configuração da navigation bar ignorada:", error instanceof Error ? error.message : String(error));
  }
};

export const getNavigationBarHeight = async (): Promise<number> => {
  try {
    const behavior = await NavigationBar.getBehaviorAsync();
    return behavior === 'overlay-swipe' ? 0 : 48;
  } catch {
    return 48; // Altura padrão em caso de erro
  }
};
