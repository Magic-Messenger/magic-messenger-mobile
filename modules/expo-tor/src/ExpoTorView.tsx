import { requireNativeView } from "expo";
import * as React from "react";

import { ExpoTorViewProps } from "./ExpoTor.types";

const NativeView: React.ComponentType<ExpoTorViewProps> =
  requireNativeView("ExpoTor");

export default function ExpoTorView(props: ExpoTorViewProps) {
  return <NativeView {...props} />;
}
