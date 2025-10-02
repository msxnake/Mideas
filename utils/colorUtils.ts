import { MSX1ColorValue } from '../types';
import { DEFAULT_SCREEN2_BG_COLOR } from '../constants';

export const getVariedColorsForChar = (charCode: number): { fg: MSX1ColorValue, bg: MSX1ColorValue } => {
  const colors = [
    '#FFFFFF', // White
    '#FF7978', // Light Red
    '#21B03B', // Dark Green
    '#5455ED', // Dark Blue
    '#D4C154', // Dark Yellow
    '#C95BBA', // Magenta
    '#42EBF5', // Cyan
    '#E6CE80', // Light Yellow
  ];

  const fgIndex = charCode % colors.length;
  return {
    fg: colors[fgIndex],
    bg: DEFAULT_SCREEN2_BG_COLOR // Siempre negro para el fondo
  };
};