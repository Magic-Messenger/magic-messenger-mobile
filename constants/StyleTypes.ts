/* flex */
export type FlexDirection = "row" | "row-reverse" | "column" | "column-reverse";
export type FlexWrap = "nowrap" | "wrap" | "wrap-reverse";
export type JustifyContent =
  | "flex-start"
  | "flex-end"
  | "center"
  | "space-between"
  | "space-around"
  | "space-evenly";
export type AlignItems =
  | "flex-start"
  | "flex-end"
  | "center"
  | "stretch"
  | "baseline";
export type AlignContent =
  | "flex-start"
  | "flex-end"
  | "center"
  | "stretch"
  | "space-between"
  | "space-around";

export interface FlexBoxOptions {
  flex?: number;
  direction?: FlexDirection;
  wrap?: FlexWrap;
  justify?: JustifyContent;
  align?: AlignItems;
  alignContent?: AlignContent;
}

/* font */
export type FontWeight =
  | "normal"
  | "bold"
  | "100"
  | "200"
  | "300"
  | "400"
  | "500"
  | "600"
  | "700"
  | "800"
  | "900";
export type TextAlign = "auto" | "left" | "right" | "center" | "justify";
export type TextDecoration =
  | "none"
  | "underline"
  | "line-through"
  | "underline line-through";

export interface TextStyleOptions {
  size?: number;
  color?: string;
  weight?: FontWeight;
  align?: TextAlign;
  decoration?: TextDecoration;
  italic?: boolean;
}

/* Spacing */
export type SpacingKey =
  | "mt"
  | "mb"
  | "ml"
  | "mr"
  | "pt"
  | "pb"
  | "pl"
  | "pr"
  | "gap";
export type SpacingOptions = Partial<Record<SpacingKey, number>>;

/* position */
export type PositionType = "absolute" | "relative";
export type PositionOptions = {
  type?: PositionType;
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  zIndex?: number;
};
