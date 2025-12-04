import * as Device from "expo-device";
import { Platform } from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

export const widthPixel = (pixel: number) => {
  return scale(pixel ?? 0);
};

export const heightPixel = (pixel: number) => {
  return verticalScale(pixel ?? 0);
};

export const spacingPixel = (pixel: number) => {
  return moderateScale(pixel ?? 0);
};

export const fontPixel = (pixel: number) => {
  return moderateScale(pixel ?? 0);
};

export const needsBottomSafeArea = () => {
  if (Platform.OS !== "android") return false;

  const manufacturer = Device.manufacturer?.toLowerCase() || "";
  const modelName = Device.modelName?.toLowerCase() || "";

  const isXiaomi =
    manufacturer.includes("xiaomi") ||
    modelName.includes("redmi") ||
    modelName.includes("poco") ||
    modelName.includes("mi ");

  const isOtherProblematicBrand =
    manufacturer.includes("oppo") ||
    manufacturer.includes("vivo") ||
    manufacturer.includes("realme") ||
    manufacturer.includes("oneplus");

  return isXiaomi || isOtherProblematicBrand;
};
