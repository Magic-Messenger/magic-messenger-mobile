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
    fontSize: size,
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
  if (options.mt !== undefined) style.marginTop = options.mt;
  if (options.mb !== undefined) style.marginBottom = options.mb;
  if (options.ml !== undefined) style.marginLeft = options.ml;
  if (options.mr !== undefined) style.marginRight = options.mr;
  if (options.pt !== undefined) style.paddingTop = options.pt;
  if (options.pb !== undefined) style.paddingBottom = options.pb;
  if (options.pl !== undefined) style.paddingLeft = options.pl;
  if (options.pr !== undefined) style.paddingRight = options.pr;
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

  mb1: { ...spacing({ mb: 4 }) },
  mb2: { ...spacing({ mb: 8 }) },
  mb3: { ...spacing({ mb: 12 }) },
  mb4: { ...spacing({ mb: 16 }) },
  mb5: { ...spacing({ mb: 20 }) },

  ml1: { ...spacing({ ml: 4 }) },
  ml2: { ...spacing({ ml: 8 }) },
  ml3: { ...spacing({ ml: 12 }) },
  ml4: { ...spacing({ ml: 16 }) },
  ml5: { ...spacing({ ml: 20 }) },

  mr1: { ...spacing({ mr: 4 }) },
  mr2: { ...spacing({ mr: 8 }) },
  mr3: { ...spacing({ mr: 12 }) },
  mr4: { ...spacing({ mr: 16 }) },
  mr5: { ...spacing({ mr: 20 }) },

  pt1: { ...spacing({ pt: 4 }) },
  pt2: { ...spacing({ pt: 8 }) },
  pt3: { ...spacing({ pt: 12 }) },
  pt4: { ...spacing({ pt: 16 }) },
  pt5: { ...spacing({ pt: 20 }) },

  pb1: { ...spacing({ pb: 4 }) },
  pb2: { ...spacing({ pb: 8 }) },
  pb3: { ...spacing({ pb: 12 }) },
  pb4: { ...spacing({ pb: 16 }) },
  pb5: { ...spacing({ pb: 20 }) },

  pl1: { ...spacing({ pl: 4 }) },
  pl2: { ...spacing({ pl: 8 }) },
  pl3: { ...spacing({ pl: 12 }) },
  pl4: { ...spacing({ pl: 16 }) },
  pl5: { ...spacing({ pl: 20 }) },

  pr1: { ...spacing({ pr: 4 }) },
  pr2: { ...spacing({ pr: 8 }) },
  pr3: { ...spacing({ pr: 12 }) },
  pr4: { ...spacing({ pr: 16 }) },
  pr5: { ...spacing({ pr: 20 }) },
});
