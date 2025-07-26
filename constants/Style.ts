import { fontPixel, spacingPixel } from "@/utils/PixelHelper";
import { StyleSheet } from "react-native";
import {
  AlignContent,
  AlignItems,
  FlexDirection,
  FlexWrap,
  FontWeight,
  JustifyContent,
  PositionOptions,
  SpacingOptions,
  TextAlign,
  TextDecoration,
} from "./StyleTypes";

export function flexBox(
  flex: number = 1,
  direction: FlexDirection = "row",
  justify: JustifyContent = "flex-start",
  align: AlignItems = "stretch",
  wrap?: FlexWrap,
  alignContent?: AlignContent
) {
  const style: any = {
    flex,
    flexDirection: direction,
    justifyContent: justify,
    alignItems: align,
  };
  if (wrap) style.flexWrap = wrap;
  if (alignContent) style.alignContent = alignContent;
  return style;
}

export function textStyle(
  size: number = 14,
  color: string = "#000",
  weight: FontWeight = "normal",
  align: TextAlign = "left",
  decoration: TextDecoration = "none",
  italic: boolean = false
) {
  const style: any = {
    fontSize: fontPixel(size),
    color,
    fontWeight: weight,
    textAlign: align,
    textDecorationLine: decoration,
  };
  if (italic) style.fontStyle = "italic";
  return style;
}

export function spacing(options: SpacingOptions) {
  const style: any = {};
  if (options.mt !== undefined) style.marginTop = spacingPixel(options.mt);
  if (options.mb !== undefined) style.marginBottom = spacingPixel(options.mb);
  if (options.ml !== undefined) style.marginLeft = spacingPixel(options.ml);
  if (options.mr !== undefined) style.marginRight = spacingPixel(options.mr);
  if (options.pt !== undefined) style.paddingTop = spacingPixel(options.pt);
  if (options.pb !== undefined) style.paddingBottom = spacingPixel(options.pb);
  if (options.pl !== undefined) style.paddingLeft = spacingPixel(options.pl);
  if (options.pr !== undefined) style.paddingRight = spacingPixel(options.pr);
  if (options.p !== undefined) style.padding = spacingPixel(options.p);
  if (options.gap !== undefined) style.gap = spacingPixel(options.gap);
  return style;
}

export function position(options: PositionOptions = {}) {
  const style: any = {};
  if (options.type) style.position = options.type;
  if (options.top !== undefined) style.top = options.top;
  if (options.right !== undefined) style.right = options.right;
  if (options.bottom !== undefined) style.bottom = options.bottom;
  if (options.left !== undefined) style.left = options.left;
  if (options.zIndex !== undefined) style.zIndex = options.zIndex;
  return style;
}

export const commonStyle = StyleSheet.create({
  flex: {
    flex: 1,
  },
  flexRow: {
    flexDirection: "row",
  },
  flexColumn: {
    flexDirection: "column",
  },
  justifyContentCenter: {
    justifyContent: "center",
  },
  alignItemsCenter: {
    alignItems: "center",
  },
  alignItemsEnd: {
    alignItems: "flex-end",
  },
  justifyContentBetween: {
    justifyContent: "space-between",
  },
  justifyContentEnd: {
    justifyContent: "flex-end",
  },
  fullWidth: {
    width: "100%",
  },
  fullHeight: {
    height: "100%",
  },

  mt1: { ...spacing({ mt: 4 }) },
  mt2: { ...spacing({ mt: 8 }) },
  mt3: { ...spacing({ mt: 12 }) },
  mt4: { ...spacing({ mt: 16 }) },
  mt5: { ...spacing({ mt: 20 }) },
  mt6: { ...spacing({ mt: 24 }) },
  mt7: { ...spacing({ mt: 28 }) },
  mt8: { ...spacing({ mt: 32 }) },
  mt9: { ...spacing({ mt: 36 }) },
  mt10: { ...spacing({ mt: 40 }) },

  mb1: { ...spacing({ mb: 4 }) },
  mb2: { ...spacing({ mb: 8 }) },
  mb3: { ...spacing({ mb: 12 }) },
  mb4: { ...spacing({ mb: 16 }) },
  mb5: { ...spacing({ mb: 20 }) },
  mb6: { ...spacing({ mb: 24 }) },
  mb7: { ...spacing({ mb: 28 }) },
  mb8: { ...spacing({ mb: 32 }) },
  mb9: { ...spacing({ mb: 36 }) },
  mb10: { ...spacing({ mb: 40 }) },

  ml1: { ...spacing({ ml: 4 }) },
  ml2: { ...spacing({ ml: 8 }) },
  ml3: { ...spacing({ ml: 12 }) },
  ml4: { ...spacing({ ml: 16 }) },
  ml5: { ...spacing({ ml: 20 }) },
  ml6: { ...spacing({ ml: 24 }) },
  ml7: { ...spacing({ ml: 28 }) },
  ml8: { ...spacing({ ml: 32 }) },
  ml9: { ...spacing({ ml: 36 }) },
  ml10: { ...spacing({ ml: 40 }) },

  mr1: { ...spacing({ mr: 4 }) },
  mr2: { ...spacing({ mr: 8 }) },
  mr3: { ...spacing({ mr: 12 }) },
  mr4: { ...spacing({ mr: 16 }) },
  mr5: { ...spacing({ mr: 20 }) },
  mr6: { ...spacing({ mr: 24 }) },
  mr7: { ...spacing({ mr: 28 }) },
  mr8: { ...spacing({ mr: 32 }) },
  mr9: { ...spacing({ mr: 36 }) },
  mr10: { ...spacing({ mr: 40 }) },

  pt1: { ...spacing({ pt: 4 }) },
  pt2: { ...spacing({ pt: 8 }) },
  pt3: { ...spacing({ pt: 12 }) },
  pt4: { ...spacing({ pt: 16 }) },
  pt5: { ...spacing({ pt: 20 }) },
  pt6: { ...spacing({ pt: 24 }) },
  pt7: { ...spacing({ pt: 28 }) },
  pt8: { ...spacing({ pt: 32 }) },
  pt9: { ...spacing({ pt: 36 }) },
  pt10: { ...spacing({ pt: 40 }) },

  pb1: { ...spacing({ pb: 4 }) },
  pb2: { ...spacing({ pb: 8 }) },
  pb3: { ...spacing({ pb: 12 }) },
  pb4: { ...spacing({ pb: 16 }) },
  pb5: { ...spacing({ pb: 20 }) },
  pb6: { ...spacing({ pb: 24 }) },
  pb7: { ...spacing({ pb: 28 }) },
  pb8: { ...spacing({ pb: 32 }) },
  pb9: { ...spacing({ pb: 36 }) },
  pb10: { ...spacing({ pb: 40 }) },

  pl1: { ...spacing({ pl: 4 }) },
  pl2: { ...spacing({ pl: 8 }) },
  pl3: { ...spacing({ pl: 12 }) },
  pl4: { ...spacing({ pl: 16 }) },
  pl5: { ...spacing({ pl: 20 }) },
  pl6: { ...spacing({ pl: 24 }) },
  pl7: { ...spacing({ pl: 28 }) },
  pl8: { ...spacing({ pl: 32 }) },
  pl9: { ...spacing({ pl: 36 }) },
  pl10: { ...spacing({ pl: 40 }) },

  pr1: { ...spacing({ pr: 4 }) },
  pr2: { ...spacing({ pr: 8 }) },
  pr3: { ...spacing({ pr: 12 }) },
  pr4: { ...spacing({ pr: 16 }) },
  pr5: { ...spacing({ pr: 20 }) },
  pr6: { ...spacing({ pr: 24 }) },
  pr7: { ...spacing({ pr: 28 }) },
  pr8: { ...spacing({ pr: 32 }) },
  pr9: { ...spacing({ pr: 36 }) },
  pr10: { ...spacing({ pr: 40 }) },

  gap1: { ...spacing({ gap: 4 }) },
  gap2: { ...spacing({ gap: 8 }) },
  gap3: { ...spacing({ gap: 12 }) },
  gap4: { ...spacing({ gap: 16 }) },
  gap5: { ...spacing({ gap: 20 }) },
  gap6: { ...spacing({ gap: 24 }) },
  gap7: { ...spacing({ gap: 28 }) },
  gap8: { ...spacing({ gap: 32 }) },
  gap9: { ...spacing({ gap: 36 }) },
  gap10: { ...spacing({ gap: 40 }) },
});
