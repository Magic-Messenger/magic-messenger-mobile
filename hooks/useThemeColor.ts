/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from "@/constants";

export function useThemeColor(): keyof typeof Colors {
  return Colors;
}
