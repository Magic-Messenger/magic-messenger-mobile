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
