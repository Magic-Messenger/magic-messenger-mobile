// Enhanced IconSymbol component with dynamic name types based on icon library type
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolViewProps, SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

// Icon library types
type IconLibrary =
  | "material"
  | "ant"
  | "feather"
  | "fontawesome"
  | "fontawesome5"
  | "ionicons"
  | "entypo"
  | "material-community"
  | "sf-symbols"; // SF Symbols for iOS

// Icon name types for each library
export type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];
export type AntIconName = ComponentProps<typeof AntDesign>["name"];
export type FeatherIconName = ComponentProps<typeof Feather>["name"];
export type FontAwesomeIconName = ComponentProps<typeof FontAwesome>["name"];
export type FontAwesome5IconName = ComponentProps<typeof FontAwesome5>["name"];
export type IoniconsIconName = ComponentProps<typeof Ionicons>["name"];
export type EntypoIconName = ComponentProps<typeof Entypo>["name"];
export type MaterialCommunityIconName = ComponentProps<
  typeof MaterialCommunityIcons
>["name"];
export type SFSymbolName = SymbolViewProps["name"];

// Conditional type that returns the correct icon name type based on library type
export type IconNameForLibrary<T extends IconLibrary> = T extends "material"
  ? MaterialIconName
  : T extends "ant"
    ? AntIconName
    : T extends "feather"
      ? FeatherIconName
      : T extends "fontawesome"
        ? FontAwesomeIconName
        : T extends "fontawesome5"
          ? FontAwesome5IconName
          : T extends "ionicons"
            ? IoniconsIconName
            : T extends "entypo"
              ? EntypoIconName
              : T extends "material-community"
                ? MaterialCommunityIconName
                : T extends "sf-symbols"
                  ? SFSymbolName
                  : never;

// SF Symbols mapping for fallback when using sf-symbols type
const SF_SYMBOLS_MAPPING = {
  "house.fill": "home" as MaterialIconName,
  "paperplane.fill": "send" as MaterialIconName,
  "chevron.left.forwardslash.chevron.right": "code" as MaterialIconName,
  "chevron.right": "chevron-right" as MaterialIconName,
  // Add more SF Symbols mappings as needed
} as const;

type SFSymbolMappingName = keyof typeof SF_SYMBOLS_MAPPING;

// Icon component renderer
const IconRenderer = ({
  type,
  name,
  size,
  color,
  style,
}: {
  type: IconLibrary;
  name: string;
  size: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) => {
  const commonProps = { size, color, style };

  switch (type) {
    case "material":
      return <MaterialIcons {...commonProps} name={name as MaterialIconName} />;
    case "ant":
      return <AntDesign {...commonProps} name={name as AntIconName} />;
    case "feather":
      return <Feather {...commonProps} name={name as FeatherIconName} />;
    case "fontawesome":
      return (
        <FontAwesome {...commonProps} name={name as FontAwesomeIconName} />
      );
    case "fontawesome5":
      return (
        <FontAwesome5 {...commonProps} name={name as FontAwesome5IconName} />
      );
    case "ionicons":
      return <Ionicons {...commonProps} name={name as IoniconsIconName} />;
    case "entypo":
      return <Entypo {...commonProps} name={name as EntypoIconName} />;
    case "material-community":
      return (
        <MaterialCommunityIcons
          {...commonProps}
          name={name as MaterialCommunityIconName}
        />
      );
    case "sf-symbols":
      // For SF Symbols, we need to map to Material Icons on Android/Web
      const mappedName = SF_SYMBOLS_MAPPING[name as SFSymbolMappingName];
      if (mappedName) {
        return <MaterialIcons {...commonProps} name={mappedName} />;
      }
      console.warn(`IconSymbol: No mapping found for SF Symbol "${name}"`);
      return <MaterialIcons {...commonProps} name="help-outline" />;
    default:
      return <MaterialIcons {...commonProps} name={name as MaterialIconName} />;
  }
};

// Component with function overloads for different type scenarios
export function Icon<T extends IconLibrary = "material">(props: {
  type?: T;
  name: IconNameForLibrary<T>;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}): JSX.Element;

// Implementation
export function Icon<T extends IconLibrary = "material">({
  name,
  type = "material" as T,
  size = 24,
  color,
  style,
}: {
  type?: T;
  name: IconNameForLibrary<T>;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <IconRenderer
      type={type}
      name={name as string}
      size={size}
      color={color}
      style={style}
    />
  );
}

// Export types for external use
export type { IconLibrary, IconNameForLibrary };
