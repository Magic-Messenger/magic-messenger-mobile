import * as React from "react";

import { ExpoTorViewProps } from "./ExpoTor.types";

export default function ExpoTorView(props: ExpoTorViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
