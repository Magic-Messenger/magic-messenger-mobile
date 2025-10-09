import { NativeModule, requireNativeModule } from "expo";

import { ExpoTorModuleEvents } from "./ExpoTor.types";

declare class ExpoTorModule extends NativeModule<ExpoTorModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoTorModule>("ExpoTor");
