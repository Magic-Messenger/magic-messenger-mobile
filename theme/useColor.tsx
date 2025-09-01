import { useMemo } from "react";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants";

interface ColorDto {
  colors: typeof Colors;
  mode: "dark" | "light";
}

export const useColor = (): ColorDto => {
  const colorScheme = useColorScheme();

  return useMemo(() => {
    // NOT NEED NOW
    // if (colorScheme === "dark") {
    //   return { colors: Colors, mode: "dark" };
    // }

    return { colors: Colors, mode: "light" };
  }, [colorScheme]);
};
