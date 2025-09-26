// Constantes para fontes do projeto
export const FONT_FAMILIES = {
  INTER_REGULAR: 'Inter',
  INTER_ITALIC: 'Inter-Italic', 
  SPACE_MONO: 'SpaceMono',
} as const;

// Pesos de fonte disponíveis
export const FONT_WEIGHTS = {
  NORMAL: '400',
  MEDIUM: '500',
  SEMIBOLD: '600', 
  BOLD: '700',
} as const;

// Utilitário para facilitar uso das fontes
export const getFontFamily = (family: keyof typeof FONT_FAMILIES = 'INTER_REGULAR') => {
  return FONT_FAMILIES[family];
};
